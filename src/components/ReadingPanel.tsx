import { useCallback, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { streamChat, useLlm, isConfigured, LlmError } from '../lib/llm'

export type ReadingStatus = 'idle' | 'streaming' | 'done' | 'error' | 'stopped'

export function useReading() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<ReadingStatus>('idle')
  const [error, setError] = useState('')
  const ctrl = useRef<AbortController | null>(null)

  const run = useCallback(async (system: string, user: string) => {
    const cfg = useLlm.getState()
    if (!isConfigured(cfg)) {
      setStatus('error')
      setError('尚未配置模型。请点右上角「接入模型」填入端点与 Key。')
      return
    }
    ctrl.current?.abort()
    const ac = new AbortController()
    ctrl.current = ac
    setText('')
    setError('')
    setStatus('streaming')
    try {
      const full = await streamChat(
        cfg,
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        (delta) => setText((t) => t + delta),
        ac.signal,
      )
      if (full) setText(full)
      setStatus('done')
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setStatus('stopped')
      } else {
        setStatus('error')
        setError(e instanceof LlmError ? e.message : e?.message || '请求失败')
      }
    }
  }, [])

  const stop = useCallback(() => {
    ctrl.current?.abort()
    setStatus('stopped')
  }, [])

  const reset = useCallback(() => {
    ctrl.current?.abort()
    setText('')
    setError('')
    setStatus('idle')
  }, [])

  return { text, status, error, run, stop, reset }
}

export default function ReadingPanel({
  reading,
  onRetry,
  openSettings,
  title = '解读',
  minHeight = 300,
}: {
  reading: ReturnType<typeof useReading>
  onRetry?: () => void
  openSettings: () => void
  title?: string
  minHeight?: number
}) {
  const { text, status, error } = reading
  const configured = isConfigured(useLlm())

  return (
    <div className="panel corner-frame relative p-5" style={{ minHeight }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-1 w-1 rotate-45 bg-[#d8b06a]" />
          <span className="serif text-[0.82rem] tracking-[0.2em] text-[#c9b28a]">{title}</span>
          {status === 'streaming' && (
            <span className="mono text-[0.6rem] tracking-widest text-[#6f6c7d]">
              <span className="inline-block animate-pulse">●</span> 生成中
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === 'streaming' && (
            <button onClick={reading.stop} className="btn btn-ghost !px-2.5 !py-1 !text-[0.66rem]">
              停止
            </button>
          )}
          {(status === 'done' || status === 'stopped' || status === 'error') && onRetry && (
            <button onClick={onRetry} className="btn btn-ghost !px-2.5 !py-1 !text-[0.66rem]">
              重新解读
            </button>
          )}
        </div>
      </div>

      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <div className="text-[0.8rem] text-[#6f6c7d]">盘面已就绪，点击左侧「开始推演」生成解读</div>
        </div>
      )}

      {status === 'error' && (
        <div className="py-8">
          <div className="mb-3 whitespace-pre-wrap border border-[rgba(184,71,58,0.35)] bg-[rgba(184,71,58,0.07)] px-4 py-3 text-[0.78rem] leading-relaxed text-[#e0b4ae]">
            {error}
          </div>
          {!configured && (
            <button onClick={openSettings} className="btn">
              接入模型
            </button>
          )}
        </div>
      )}

      {(status === 'streaming' || status === 'done' || status === 'stopped') && (
        <div className={`prose-mystic ${status === 'streaming' ? 'caret' : ''}`}>
          <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
          {status === 'streaming' && !text && (
            <div className="flex items-center gap-2 text-[0.78rem] text-[#6f6c7d]">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-[#d8b06a] border-t-transparent" />
              正在接通模型…
            </div>
          )}
        </div>
      )}

      {status === 'stopped' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-[0.66rem] text-[#6f6c7d]">
          已停止生成。
        </motion.div>
      )}
    </div>
  )
}
