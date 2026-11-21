import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { lookupTerm, LEVEL_NOTE } from '../data/glossary'

/** 术语：点线底纹 + 悬停/聚焦浮出白话与出处 */
export function Term({ k, children, className = '' }: { k: string; children?: ReactNode; className?: string }) {
  const entry = lookupTerm(k)
  if (!entry) return <span className={className}>{children ?? k}</span>
  return (
    <span className={`group/term relative inline-flex cursor-help ${className}`} tabIndex={0}>
      <span className="border-b border-dotted border-[#8a6f3c]/60">{children ?? k}</span>
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-[200px] max-w-[calc(100vw-28px)] -translate-x-1/2 border border-[rgba(216,176,106,0.28)] bg-[#0b0b13] px-3 py-2 text-left opacity-0 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.9)] transition-opacity duration-200 group-hover/term:opacity-100 group-focus/term:opacity-100"
        role="tooltip"
      >
        <span className="block text-[0.66rem] leading-[1.7] text-[#cfcbdb]">{entry.plain}</span>
        <span className="mt-1.5 flex items-center gap-1 border-t border-white/8 pt-1.5 text-[0.56rem] text-[#6f6c7d]">
          <span>{entry.level}</span>
          <span>{entry.source}</span>
        </span>
      </span>
    </span>
  )
}

export function SourceTag({ level, text }: { level: keyof typeof LEVEL_NOTE; text?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 border border-[rgba(216,176,106,0.2)] bg-[rgba(216,176,106,0.04)] px-1.5 py-0.5 text-[0.56rem] text-[#8a7a5a]"
      title={LEVEL_NOTE[level]}
    >
      <span>{level}</span>
      <span>{text ?? LEVEL_NOTE[level]}</span>
    </span>
  )
}

export function SectionTitle({
  index,
  title,
  desc,
  right,
}: {
  index?: string
  title: string
  desc?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-baseline gap-3">
          {index && <span className="mono text-[10px] tracking-[0.3em] text-[#8a6f3c]">{index}</span>}
          <h2 className="text-[1.05rem] text-[#f2dcae]">{title}</h2>
        </div>
        {desc && <p className="mt-1.5 text-[0.78rem] leading-relaxed text-[#8f8c9d]">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.66rem] leading-snug text-[#6f6c7d]">{hint}</span>}
    </label>
  )
}

export function SegTabs<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; sub?: string }[]
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`relative border px-3 transition-all duration-300 ${
              size === 'sm' ? 'py-1.5 text-[0.72rem]' : 'py-2 text-[0.78rem]'
            } ${on ? 'border-[rgba(216,176,106,0.55)] text-[#f2dcae]' : 'border-white/10 text-[#8f8c9d] hover:border-white/20 hover:text-[#cfcbdb]'}`}
            style={on ? { background: 'rgba(216,176,106,0.1)', boxShadow: '0 0 18px -6px rgba(216,176,106,0.4)' } : undefined}
          >
            {o.label}
            {o.sub && <span className="ml-1.5 text-[0.62rem] opacity-55">{o.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Badge({
  children,
  color = '#d8b06a',
  dim = false,
}: {
  children: ReactNode
  color?: string
  dim?: boolean
}) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[0.62rem] leading-none tracking-wide"
      style={{
        color: dim ? color : color,
        background: `${color}14`,
        border: `1px solid ${color}33`,
        opacity: dim ? 0.7 : 1,
      }}
    >
      {children}
    </span>
  )
}

export function Stat({
  label,
  value,
  unit,
  color = '#f2dcae',
  hint,
}: {
  label: string
  value: ReactNode
  unit?: string
  color?: string
  hint?: string
}) {
  return (
    <div className="panel-flat px-3 py-2.5">
      <div className="text-[0.6rem] tracking-[0.18em] text-[#77748a]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="mono text-[1.15rem] leading-none" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-[0.62rem] text-[#77748a]">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-[0.6rem] leading-tight text-[#605d70]">{hint}</div>}
    </div>
  )
}

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 border border-dashed border-white/8 px-6 py-10 text-center">
      <div className="text-[0.8rem] leading-relaxed text-[#6f6c7d]">{children}</div>
    </div>
  )
}

export function Spinner({ color = '#d8b06a' }: { color?: string }) {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" style={{ color }} />
  )
}
