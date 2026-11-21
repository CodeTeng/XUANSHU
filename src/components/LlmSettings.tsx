import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PRESETS, testConnection, useLlm } from '../lib/llm'

export default function LlmSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cfg = useLlm()
  const set = useLlm((s) => s.set)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string; models?: string[] } | null>(null)

  const doTest = async () => {
    setTesting(true)
    setResult(null)
    const r = await testConnection(cfg)
    setResult(r)
    setTesting(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-[440px] overflow-y-auto border-l border-[rgba(216,176,106,0.2)] bg-[#0a0a11]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#0a0a11]/95 px-6 py-4 backdrop-blur">
              <div>
                <div className="serif text-[0.95rem] tracking-[0.16em] text-[#f2dcae]">接入模型</div>
                <div className="mt-0.5 text-[0.64rem] text-[#6f6c7d]">OpenAI 兼容端点 · 密钥仅存本机</div>
              </div>
              <button onClick={onClose} className="text-[#8f8c9d] transition hover:text-[#f2dcae]" aria-label="关闭">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M4 4l10 10M14 4L4 14" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div>
                <div className="label">快速预设</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p) => {
                    const on = cfg.baseUrl === p.baseUrl
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          set({ baseUrl: p.baseUrl, model: p.models[0] })
                          setResult(null)
                        }}
                        className={`border px-2.5 py-2 text-left transition ${
                          on ? 'border-[rgba(216,176,106,0.5)] bg-[rgba(216,176,106,0.08)]' : 'border-white/8 hover:border-white/20'
                        }`}
                      >
                        <div className="text-[0.74rem] text-[#ddd9e6]">{p.name}</div>
                        <div className="mt-0.5 text-[0.58rem] leading-tight text-[#6f6c7d]">{p.note}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="label">接口地址 Base URL</label>
                <input
                  className="field mono !text-[0.76rem]"
                  value={cfg.baseUrl}
                  onChange={(e) => set({ baseUrl: e.target.value })}
                  placeholder="https://api.deepseek.com/v1"
                  spellCheck={false}
                />
                <div className="mt-1 text-[0.62rem] leading-snug text-[#605d70]">
                  需以 <span className="mono text-[#8a6f3d]">/v1</span> 结尾（Ollama 为 <span className="mono text-[#8a6f3d]">/v1</span>）。本站会在其后拼接 <span className="mono text-[#8a6f3d]">/chat/completions</span>。
                </div>
              </div>

              <div>
                <label className="label">API Key</label>
                <div className="relative">
                  <input
                    className="field mono !pr-16 !text-[0.76rem]"
                    type={showKey ? 'text' : 'password'}
                    value={cfg.apiKey}
                    onChange={(e) => set({ apiKey: e.target.value })}
                    placeholder="sk-..."
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.62rem] tracking-wide text-[#8f8c9d] hover:text-[#f2dcae]"
                  >
                    {showKey ? '隐藏' : '显示'}
                  </button>
                </div>
                <div className="mt-1 text-[0.62rem] leading-snug text-[#605d70]">
                  只写入本浏览器的 localStorage。请求经本地服务转发，服务端不落盘、不打日志。
                </div>
              </div>

              <div>
                <label className="label">模型</label>
                <input
                  className="field mono !text-[0.76rem]"
                  value={cfg.model}
                  onChange={(e) => set({ model: e.target.value })}
                  placeholder="deepseek-chat"
                  spellCheck={false}
                />
                {result?.models && result.models.length > 0 && (
                  <div className="mt-2 max-h-[120px] overflow-y-auto border border-white/8">
                    {result.models.slice(0, 60).map((m) => (
                      <button
                        key={m}
                        onClick={() => set({ model: m })}
                        className="block w-full px-2.5 py-1.5 text-left text-[0.7rem] text-[#a9a6b8] transition hover:bg-white/5 hover:text-[#f2dcae]"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="label !mb-0">温度（创造性）</span>
                  <span className="mono text-[0.72rem] text-[#d8b06a]">{cfg.temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.1}
                  value={cfg.temperature}
                  onChange={(e) => set({ temperature: Number(e.target.value) })}
                  className="w-full accent-[#d8b06a]"
                />
                <div className="mt-1 flex justify-between text-[0.6rem] text-[#605d70]">
                  <span>严谨</span>
                  <span>发散</span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="label !mb-0">回复上限 tokens</span>
                  <span className="mono text-[0.72rem] text-[#d8b06a]">{cfg.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min={800}
                  max={8000}
                  step={200}
                  value={cfg.maxTokens}
                  onChange={(e) => set({ maxTokens: Number(e.target.value) })}
                  className="w-full accent-[#d8b06a]"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={doTest} disabled={testing || !cfg.baseUrl} className="btn flex-1">
                  {testing ? '测试中…' : '测试连接'}
                </button>
                <button onClick={onClose} className="btn btn-ghost">
                  完成
                </button>
              </div>

              {result && (
                <div
                  className={`border px-3 py-2.5 text-[0.72rem] leading-relaxed ${
                    result.ok
                      ? 'border-[rgba(78,168,122,0.35)] bg-[rgba(78,168,122,0.07)] text-[#9dd6b6]'
                      : 'border-[rgba(184,71,58,0.35)] bg-[rgba(184,71,58,0.07)] text-[#e0b4ae]'
                  }`}
                >
                  {result.message}
                </div>
              )}

              <div className="hairline" />
              <div className="space-y-1.5 text-[0.64rem] leading-relaxed text-[#605d70]">
                <p>· 若在纯静态托管环境（无本地 Node 服务），请求会直接由浏览器发往端点，需要该端点允许跨域。</p>
                <p>· 排盘由站点内的确定性算法完成，模型只负责把盘面翻译成人话，所以换模型不会改变盘面结果。</p>
                <p>· 本站不保存任何测算记录。刷新即清空。</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
