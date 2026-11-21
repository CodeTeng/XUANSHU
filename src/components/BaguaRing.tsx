import { motion } from 'framer-motion'

/** 后天八卦：方位角以正上方为 0°，顺时针 */
const TRIGRAMS: { name: string; symbol: string; deg: number; lines: [number, number, number] }[] = [
  { name: '坎', symbol: '☵', deg: 0, lines: [0, 1, 0] },
  { name: '艮', symbol: '☶', deg: 45, lines: [0, 0, 1] },
  { name: '震', symbol: '☳', deg: 90, lines: [1, 0, 0] },
  { name: '巽', symbol: '☴', deg: 135, lines: [0, 1, 1] },
  { name: '离', symbol: '☲', deg: 180, lines: [1, 0, 1] },
  { name: '坤', symbol: '☷', deg: 225, lines: [0, 0, 0] },
  { name: '兑', symbol: '☱', deg: 270, lines: [1, 1, 0] },
  { name: '乾', symbol: '☰', deg: 315, lines: [1, 1, 1] },
]

export interface BaguaRingProps {
  size?: number
  /** 主色 */
  color?: string
  /** 整体旋转（度/秒） */
  spin?: number
  /** 高亮的卦名 */
  active?: string | null
  /** 刻度圈旋转（慢） */
  ticks?: boolean
  className?: string
  children?: React.ReactNode
  opacity?: number
}

export default function BaguaRing({
  size = 520,
  color = '#d8b06a',
  spin = 90,
  active = null,
  ticks = true,
  className = '',
  children,
  opacity = 1,
}: BaguaRingProps) {
  const C = 200
  const R_OUT = 196
  const R_TRI_TOP = 126
  const R_TRI_STEP = 11.5
  const lineLen = 40

  return (
    <div className={`relative ${className}`} style={{ width: '100%', maxWidth: size, aspectRatio: '1 / 1', opacity }}>
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="bg-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="45%" stopColor={color} stopOpacity="0.05" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <filter id="bg-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={C} cy={C} r={180} fill="url(#bg-core)" />

        {/* 外圈双线 */}
        <motion.g
          animate={spin ? { rotate: 360 } : undefined}
          transition={{ duration: spin, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '50%', originY: '50%' }}
        >
          <circle cx={C} cy={C} r={R_OUT} fill="none" stroke={color} strokeOpacity="0.34" strokeWidth="0.8" />
          <circle cx={C} cy={C} r={R_OUT - 5} fill="none" stroke={color} strokeOpacity="0.14" strokeWidth="0.5" />
          {ticks &&
            Array.from({ length: 72 }).map((_, i) => {
              const major = i % 9 === 0
              return (
                <line
                  key={i}
                  x1={C}
                  y1={C - R_OUT + 5}
                  x2={C}
                  y2={C - R_OUT + (major ? 16 : 9)}
                  stroke={color}
                  strokeOpacity={major ? 0.5 : 0.2}
                  strokeWidth={major ? 1 : 0.5}
                  transform={`rotate(${i * 5} ${C} ${C})`}
                />
              )
            })}
        </motion.g>

        {/* 八卦爻线 */}
        <g filter="url(#bg-glow)">
          {TRIGRAMS.map((t) => {
            const on = active === t.name
            const isActive = active != null
            const op = isActive ? (on ? 1 : 0.16) : 0.62
            return (
              <g key={t.name} transform={`rotate(${t.deg} ${C} ${C})`} style={{ transition: 'opacity .6s' }} opacity={op}>
                {t.lines.map((solid, i) => {
                  const y = C - (R_TRI_TOP + i * R_TRI_STEP)
                  return solid ? (
                    <line
                      key={i}
                      x1={C - lineLen / 2}
                      y1={y}
                      x2={C + lineLen / 2}
                      y2={y}
                      stroke={color}
                      strokeWidth={on ? 2.2 : 1.5}
                      strokeLinecap="square"
                    />
                  ) : (
                    <g key={i}>
                      <line x1={C - lineLen / 2} y1={y} x2={C - lineLen / 6} y2={y} stroke={color} strokeWidth={on ? 2.2 : 1.5} strokeLinecap="square" />
                      <line x1={C + lineLen / 6} y1={y} x2={C + lineLen / 2} y2={y} stroke={color} strokeWidth={on ? 2.2 : 1.5} strokeLinecap="square" />
                    </g>
                  )
                })}
                {/* 卦名 */}
                <text
                  x={C}
                  y={C - (R_TRI_TOP + 3 * R_TRI_STEP + 26)}
                  textAnchor="middle"
                  fill={color}
                  fillOpacity={on ? 1 : 0.62}
                  fontSize="11"
                  style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.16em' }}
                >
                  {t.name}
                </text>
              </g>
            )
          })}
        </g>

        {/* 内圈虚线圈 */}
        <circle
          cx={C}
          cy={C}
          r={78}
          fill="none"
          stroke={color}
          strokeOpacity="0.22"
          strokeWidth="0.6"
          strokeDasharray="1.5 7"
          className="spin-rev"
          style={{ transformOrigin: '200px 200px' }}
        />
        <circle cx={C} cy={C} r={62} fill="none" stroke={color} strokeOpacity="0.1" strokeWidth="0.5" />
      </svg>

      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  )
}
