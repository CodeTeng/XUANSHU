/**
 * LLM 接入层。
 *
 * 设计前提：用户自带端点（OpenAI 兼容），Key 只存在浏览器 localStorage，
 * 请求经本地 /api/llm 转发以绕开 CORS，服务端不落盘、不写日志。
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LlmConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

/** 一套可保存的模型配置。存在本人的浏览器里，可多套并存、随时切换。 */
export interface LlmProfile extends LlmConfig {
  id: string
  name: string
  savedAt: number
}

/** 本机用量账本：只记这台设备发出的请求，不上报 */
export interface UsageStat {
  calls: number
  promptChars: number
  completionChars: number
  lastAt: number
}

export const PRESETS: { id: string; name: string; baseUrl: string; models: string[]; note: string }[] = [
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'], note: '性价比高，中文典籍理解好' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'], note: '需海外网络环境' },
  { id: 'moonshot', name: 'Moonshot', baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'kimi-latest'], note: '长文本，中文稳' },
  { id: 'zhipu', name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4-plus', 'glm-4-flash'], note: '国内直连' },
  { id: 'siliconflow', name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'], note: '聚合多模型' },
  { id: 'ollama', name: 'Ollama（本地）', baseUrl: 'http://127.0.0.1:11434/v1', models: ['qwen2.5:14b', 'llama3.1:8b'], note: '无需 Key，本机推理' },
]

interface LlmStore extends LlmConfig {
  profiles: LlmProfile[]
  usage: UsageStat
  /** 是否已看过首次引导 */
  onboarded: boolean
  set: (patch: Partial<LlmConfig>) => void
  reset: () => void
  saveProfile: (name: string) => string
  applyProfile: (id: string) => void
  deleteProfile: (id: string) => void
  recordUsage: (promptChars: number, completionChars: number) => void
  setOnboarded: (v: boolean) => void
  clearAll: () => void
}

const DEFAULT: LlmConfig = {
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.8,
  maxTokens: 2400,
}

const EMPTY_USAGE: UsageStat = { calls: 0, promptChars: 0, completionChars: 0, lastAt: 0 }

export const useLlm = create<LlmStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT,
      profiles: [],
      usage: EMPTY_USAGE,
      onboarded: false,
      set: (patch) => set(patch),
      reset: () => set(DEFAULT),
      saveProfile: (name) => {
        const s = get()
        const id = `p${Date.now().toString(36)}`
        const profile: LlmProfile = {
          id,
          name: name.trim() || s.model || '未命名配置',
          baseUrl: s.baseUrl,
          apiKey: s.apiKey,
          model: s.model,
          temperature: s.temperature,
          maxTokens: s.maxTokens,
          savedAt: Date.now(),
        }
        // 同名则覆盖，避免越存越多
        const rest = s.profiles.filter((p) => p.name !== profile.name)
        set({ profiles: [...rest, profile] })
        return id
      },
      applyProfile: (id) => {
        const p = get().profiles.find((x) => x.id === id)
        if (!p) return
        set({
          baseUrl: p.baseUrl,
          apiKey: p.apiKey,
          model: p.model,
          temperature: p.temperature,
          maxTokens: p.maxTokens,
        })
      },
      deleteProfile: (id) => set({ profiles: get().profiles.filter((p) => p.id !== id) }),
      recordUsage: (promptChars, completionChars) =>
        set({
          usage: {
            calls: get().usage.calls + 1,
            promptChars: get().usage.promptChars + promptChars,
            completionChars: get().usage.completionChars + completionChars,
            lastAt: Date.now(),
          },
        }),
      setOnboarded: (v) => set({ onboarded: v }),
      clearAll: () =>
        set({ ...DEFAULT, profiles: [], usage: EMPTY_USAGE }),
    }),
    { name: 'xuanshu.llm.v1', version: 2 },
  ),
)

export function isConfigured(c: LlmConfig) {
  return Boolean(c.baseUrl && c.model && (c.apiKey || /localhost|127\.0\.0\.1/.test(c.baseUrl)))
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class LlmError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

/** 直接打端点（当没有本地代理时用；需要端点允许 CORS） */
async function directStream(
  cfg: LlmConfig,
  messages: ChatMessage[],
  onDelta: (t: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const r = await fetch(`${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
    body: JSON.stringify({
      model: cfg.model, messages, stream: true,
      temperature: cfg.temperature, max_tokens: cfg.maxTokens,
    }),
    signal,
  })
  if (!r.ok) throw new LlmError(await r.text(), r.status)
  return consumeSse(r, onDelta)
}

async function consumeSse(r: Response, onDelta: (t: string) => void): Promise<string> {
  const reader = r.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let full = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const raw of lines) {
      const line = raw.trim()
      if (!line || !line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return full
      try {
        const j = JSON.parse(payload)
        const delta = j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.message?.content ?? ''
        const reasoning = j.choices?.[0]?.delta?.reasoning_content ?? ''
        if (reasoning) onDelta('') // 思维链不展示，避免正文错乱
        if (delta) {
          full += delta
          onDelta(delta)
        }
      } catch {
        /* 单行解析失败不影响后续 */
      }
    }
  }
  return full
}

/** 主入口：优先走本地代理，失败则回退直连。同时把用量记进本机账本 */
export async function streamChat(
  cfg: LlmConfig,
  messages: ChatMessage[],
  onDelta: (t: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const promptChars = messages.reduce((n, m) => n + m.content.length, 0)
  let produced = 0
  const track = (t: string) => {
    produced += t.length
    onDelta(t)
  }

  try {
    let out: string
    let proxyOk = false
    try {
      const h = await fetch('/api/health', { signal: AbortSignal.timeout(2500) })
      proxyOk = h.ok && (await h.json()).proxy === true
    } catch {
      proxyOk = false
    }

    if (!proxyOk) {
      out = await directStream(cfg, messages, track, signal)
    } else {
      out = await viaProxy(cfg, messages, track, signal)
    }
    useLlm.getState().recordUsage(promptChars, produced || out.length)
    return out
  } catch (e) {
    // 中途停止时上游已经计费的 token 也算数，不装作没发生
    if (produced > 0) useLlm.getState().recordUsage(promptChars, produced)
    throw e
  }
}

async function viaProxy(
  cfg: LlmConfig,
  messages: ChatMessage[],
  onDelta: (t: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const r = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model,
      messages, temperature: cfg.temperature, maxTokens: cfg.maxTokens, stream: true,
    }),
    signal,
  })
  if (!r.ok) {
    let msg = `请求失败 ${r.status}`
    try {
      const j = await r.json()
      msg = j.error || msg
    } catch {
      msg = (await r.text()) || msg
    }
    throw new LlmError(msg, r.status)
  }
  const ctype = r.headers.get('content-type') || ''
  if (!ctype.includes('event-stream')) {
    const text = await r.text()
    try {
      const j = JSON.parse(text)
      const content = j.choices?.[0]?.message?.content || ''
      onDelta(content)
      return content
    } catch {
      throw new LlmError('端点返回了无法解析的内容')
    }
  }
  return consumeSse(r, onDelta)
}

export async function testConnection(cfg: LlmConfig): Promise<{ ok: boolean; message: string; models?: string[] }> {
  try {
    const r = await fetch('/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey }),
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      return { ok: false, message: j.error || `HTTP ${r.status}` }
    }
    const j = await r.json()
    const models: string[] = j.models || []
    return {
      ok: true,
      message: models.length ? `连接成功，可用模型 ${models.length} 个` : '连接成功',
      models,
    }
  } catch (e: any) {
    return { ok: false, message: e?.message || '连接失败（若在纯静态环境下，可能是端点未开启 CORS）' }
  }
}
