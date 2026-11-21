import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PRESETS, testConnection, useLlm } from '../lib/llm'

function fmt(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default function LlmSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cfg = useLlm()
  const set = useLlm((s) => s.set)
  const profiles = useLlm((s) => s.profiles)
  const usage = useLlm((s) => s.usage)
  const saveProfile = useLlm((s) => s.saveProfile)
  const applyProfile = useLlm((s) => s.applyProfile)
  const deleteProfile = useLlm((s) => s.deleteProfile)
  const clearAll = useLlm((s) => s.clearAll)

  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string; models?: string[] } | null>(null)
  const [profileName, setProfileName] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const doTest = async () => {
    setTesting(true)
    setResult(null)
    const r = await testConnection(cfg)
    setResult(r)
    setTesting(false)
  }

  const doSave = () => {
    saveProfile(profileName)
    setProfileName('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const isActive = (p: { baseUrl: string; model: string }) => p.baseUrl === cfg.baseUrl && p.model === cfg.model

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
            className="fixed right-0 top-0 z-50 h-full w-full max-w-[460px] overflow-y-auto border-l border-[rgba(216,176,106,0.2)] bg-[#0a0a11]"
          >
            <div className="sticky top-0 z-10 border-b border-white/8 bg-[#0a0a11]/95 px-6 py-4 backdrop-blur">
              <div className="flex items-start justify-between">
                <div>
                  <div className="serif text-[0.95rem] tracking-[0.16em] text-[#f2dcae]">我的模型</div>
                  <div className="mt-0.5 text-[0.64rem] text-[#6f6c7d]">本机私有 · 不经过本站服务器保存</div>
                </div>
                <button onClick={onClose} className="mt-0.5 text-[#8f8c9d] transition hover:text-[#f2dcae]" aria-label="关闭">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M4 4l10 10M14 4L4 14" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 border border-[rgba(78,168,122,0.22)] bg-[rgba(78,168,122,0.05)] px-2.5 py-1.5 text-[0.62rem] leading-relaxed text-[#8ec9a8]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ea87a]" />
                <span>这套配置只属于这个浏览器。别人打开同一网址，用的是他们自己的 Key。</span>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              {/* 配置档案 */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="label !mb-0">我的配置档案</span>
                  <span className="mono text-[0.58rem] text-[#5c5969]">{profiles.length} / ∞</span>
                </div>
                {profiles.length === 0 ? (
                  <div className="border border-dashed border-white/10 px-3 py-3 text-[0.66rem] leading-relaxed text-[#605d70]">
                    还没有存过档案。把下面填好的配置存起来，就能在不同模型之间一键切换——比如日常用便宜的，重要问题用贵的。
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {profiles.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 border px-2.5 py-2 transition ${
                          isActive(p) ? 'border-[rgba(216,176,106,0.45)] bg-[rgba(216,176,106,0.07)]' : 'border-white/8 hover:border-white/16'
                        }`}
                      >
                        <button onClick={() => applyProfile(p.id)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[0.74rem] text-[#ddd9e6]">{p.name}</span>
                            {isActive(p) && <span className="shrink-0 text-[0.52rem] text-[#d8b06a]">生效中</span>}
                          </div>
                          <div className="mono mt-0.5 truncate text-[0.56rem] text-[#6f6c7d]">
                            {p.model} · {p.baseUrl.replace(/^https?:\/\//, '').split('/')[0]}
                          </div>
                        </button>
                        <button
                          onClick={() => deleteProfile(p.id)}
                          className="shrink-0 px-1 text-[0.62rem] text-[#5c5969] transition hover:text-[#c08a82]"
                          aria-label={`删除 ${p.name}`}
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  <input
                    className="field min-w-0 flex-1 !py-1.5 !text-[0.72rem]"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={`存为「${cfg.model || '当前配置'}」`}
                    onKeyDown={(e) => e.key === 'Enter' && doSave()}
                  />
                  <button
                    onClick={doSave}
                    className={`btn shrink-0 !px-3 !py-1.5 !text-[0.68rem] ${saved ? '!border-[#4ea87a] !text-[#8ec9a8]' : ''}`}
                  >
                    存为档案
                  </button>
                </div>
              </div>

              <div className="hairline" />

              {/* 快速预设 */}
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
                  需以 <span className="mono text-[#8a6f3d]">/v1</span> 结尾。本站会在其后拼接 <span className="mono text-[#8a6f3d]">/chat/completions</span>。
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

              {/* 本机用量 */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="label !mb-0">本机用量</span>
                  <span className="text-[0.56rem] text-[#5c5969]">只计这台设备 · 不上报</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['调用', String(usage.calls), '次'],
                    ['输入', fmt(usage.promptChars), '字'],
                    ['输出', fmt(usage.completionChars), '字'],
                  ].map(([k, v, u]) => (
                    <div key={k} className="panel-flat px-2.5 py-2">
                      <div className="text-[0.56rem] tracking-wider text-[#77748a]">{k}</div>
                      <div className="mt-1 flex items-baseline gap-0.5">
                        <span className="mono text-[0.95rem] text-[#e8e3f0]">{v}</span>
                        <span className="text-[0.54rem] text-[#605d70]">{u}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 text-[0.6rem] text-[#5c5969]">
                  {usage.calls === 0
                    ? '还没有调用过模型。排盘本身不消耗 token，只有点「开始推演」才会计费。'
                    : `最近一次：${new Date(usage.lastAt).toLocaleString('zh-CN', { hour12: false })}`}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/6 pt-3">
                <button
                  onClick={() => {
                    if (!confirmClear) {
                      setConfirmClear(true)
                      window.setTimeout(() => setConfirmClear(false), 3000)
                      return
                    }
                    clearAll()
                    setConfirmClear(false)
                    setResult(null)
                  }}
                  className={`text-[0.66rem] transition ${confirmClear ? 'text-[#c0392b]' : 'text-[#5c5969] hover:text-[#c08a82]'}`}
                >
                  {confirmClear ? '再点一次确认清除' : '清除本机配置与用量'}
                </button>
                <span className="text-[0.58rem] text-[#4d4a5a]">localStorage · xuanshu.llm.v1</span>
              </div>

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
