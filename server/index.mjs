/**
 * 玄枢 · 本地服务
 *
 * 作用只有两个：
 *   1. 托管构建产物 dist/
 *   2. 代理 OpenAI 兼容接口（浏览器直连第三方端点普遍会被 CORS 拦掉，
 *      而且把 key 暴露在跨域请求里也不体面）
 *
 * 密钥不落盘、不打日志，仅在单次请求的内存中透传。
 */
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.PORT || 8787)

const app = express()
app.use(express.json({ limit: '2mb' }))

const trimSlash = (s) => String(s || '').replace(/\/+$/, '')

/** 健康检查：前端用它判断当前是否跑在带代理的 Node 服务里 */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, proxy: true, node: process.version })
})

/** 拉取模型列表 */
app.post('/api/models', async (req, res) => {
  const { baseUrl, apiKey } = req.body || {}
  if (!baseUrl) return res.status(400).json({ error: '缺少 baseUrl' })
  try {
    const r = await fetch(`${trimSlash(baseUrl)}/models`, {
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(20000),
    })
    const text = await r.text()
    if (!r.ok) return res.status(r.status).json({ error: text.slice(0, 600) })
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return res.status(502).json({ error: '端点返回的不是 JSON' })
    }
    const models = (data.data || data.models || [])
      .map((m) => (typeof m === 'string' ? m : m.id || m.name))
      .filter(Boolean)
    res.json({ models })
  } catch (e) {
    res.status(502).json({ error: describe(e) })
  }
})

/**
 * 对话代理。
 * 流式时把上游 SSE 原样转发，前端自己解析 data: 行；
 * 上游若忽略 stream 直接返回 JSON，也照样透传。
 */
app.post('/api/llm', async (req, res) => {
  const { baseUrl, apiKey, model, messages, temperature, maxTokens, stream = true } = req.body || {}
  if (!baseUrl || !model) return res.status(400).json({ error: '缺少 baseUrl 或 model' })
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages 不能为空' })

  const payload = {
    model,
    messages,
    stream: !!stream,
    ...(typeof temperature === 'number' ? { temperature } : {}),
    ...(typeof maxTokens === 'number' ? { max_tokens: maxTokens } : {}),
  }

  try {
    const upstream = await fetch(`${trimSlash(baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return res.status(upstream.status).json({ error: httpHint(upstream.status, text) })
    }

    const ctype = upstream.headers.get('content-type') || ''
    if (!stream || !ctype.includes('event-stream')) {
      const text = await upstream.text()
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.send(text)
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    // 客户端断开就停止向上游取数，别让 token 白烧
    let closed = false
    req.on('close', () => {
      closed = true
      reader.cancel().catch(() => {})
    })
    while (!closed) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
    }
    res.end()
  } catch (e) {
    if (!res.headersSent) res.status(502).json({ error: describe(e) })
    else res.end()
  }
})

function describe(e) {
  const msg = e?.message || String(e)
  if (/timeout|aborted/i.test(msg)) return '请求超时：端点无响应，请检查 baseUrl 是否可达'
  if (/ENOTFOUND|getaddrinfo|EAI_AGAIN/i.test(msg)) return `域名解析失败：${msg}`
  if (/ECONNREFUSED/i.test(msg)) return '连接被拒绝：地址或端口不对'
  if (/certificate|TLS|SSL/i.test(msg)) return `TLS 握手失败：${msg}`
  return msg
}

function httpHint(status, body) {
  const snippet = String(body || '').slice(0, 500)
  if (status === 401) return `401 鉴权失败：API Key 无效或已过期\n${snippet}`
  if (status === 403) return `403 拒绝访问：Key 没有该模型权限，或地区受限\n${snippet}`
  if (status === 404) return `404 路径不存在：baseUrl 通常应以 /v1 结尾\n${snippet}`
  if (status === 429) return `429 触发限流：稍后重试或换 Key\n${snippet}`
  return `上游 ${status}：${snippet}`
}

// 静态资源 + SPA 兜底
app.use(express.static(path.join(ROOT, 'dist'), { index: false, maxAge: '1h' }))
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not found' })
  res.sendFile(path.join(ROOT, 'dist', 'index.html'), (err) => {
    if (err) res.status(500).send('请先运行 npm run build 生成 dist/')
  })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  玄枢 已启动  →  http://127.0.0.1:${PORT}\n`)
})
