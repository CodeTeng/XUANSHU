import { MOUNTAINS, oppositeMountain, mountainCenterDeg, mountainYinYang } from '../lib/astro/fengshui'

/**
 * 二十四山罗盘选择器。
 * 0° 在正上方（北），顺时针增加；与传统罗盘读数一致。
 */
export default function Compass({
  sit,
  onPick,
  size = 300,
}: {
  sit: string
  onPick: (m: string) => void
  size?: number
}) {
  const C = 150
  const R = 138
  const facing = oppositeMountain(sit)

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 300 300" width={size} height={size}>
        <defs>
          <radialGradient id="compass-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d8b06a" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#d8b06a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={R + 8} fill="url(#compass-core)" />
        <circle cx={C} cy={C} r={R + 6} fill="none" stroke="rgba(216,176,106,0.3)" strokeWidth="0.7" />
        <circle cx={C} cy={C} r={R - 34} fill="none" stroke="rgba(216,176,106,0.16)" strokeWidth="0.5" />
        <circle cx={C} cy={C} r={R - 62} fill="none" stroke="rgba(216,176,106,0.1)" strokeWidth="0.4" strokeDasharray="1 5" />

        {/* 刻度 */}
        {Array.from({ length: 72 }).map((_, i) => (
          <line
            key={i}
            x1={C}
            y1={C - R - 6}
            x2={C}
            y2={C - R + (i % 3 === 0 ? 2 : 5)}
            stroke="rgba(216,176,106,0.35)"
            strokeWidth={i % 3 === 0 ? 0.8 : 0.4}
            transform={`rotate(${i * 5} ${C} ${C})`}
          />
        ))}

        {/* 二十四山 */}
        {MOUNTAINS.map((m) => {
          const deg = mountainCenterDeg(m)
          const on = m === sit
          const isFacing = m === facing
          const yang = mountainYinYang(m) === '+'
          return (
            <g key={m} transform={`rotate(${deg} ${C} ${C})`} onClick={() => onPick(m)} style={{ cursor: 'pointer' }}>
              {/* 热区 */}
              <rect x={C - 7} y={C - R - 4} width={14} height={42} fill="transparent" />
              <text
                x={C}
                y={C - R + 20}
                textAnchor="middle"
                fontSize={on ? 13.5 : 11}
                fill={on ? '#f8e6be' : isFacing ? 'rgba(226,130,120,0.95)' : 'rgba(208,198,180,0.78)'}
                style={{ fontFamily: 'var(--font-serif)', transition: 'all .3s' }}
              >
                {m}
              </text>
              {on && (
                <>
                  <circle cx={C} cy={C - R + 26} r="1.6" fill="#f2dcae" />
                  <line x1={C} y1={C - R + 6} x2={C} y2={C - R + 30} stroke="rgba(242,220,174,0.5)" strokeWidth="0.8" />
                </>
              )}
              {yang && <circle cx={C + 5.5} cy={C - R + 12} r="1" fill="rgba(216,176,106,0.5)" />}
            </g>
          )
        })}

        {/* 坐向指针 */}
        <g>
          <line x1={C} y1={C} x2={C} y2={C - R + 36} stroke="rgba(216,176,106,0.55)" strokeWidth="1" strokeDasharray="2 3" />
          <polygon points={`${C},${C - R + 30} ${C - 3.5},${C - R + 40} ${C + 3.5},${C - R + 40}`} fill="#d8b06a" />
        </g>

        {/* 中心 */}
        <circle cx={C} cy={C} r="32" fill="#08080d" stroke="rgba(216,176,106,0.34)" strokeWidth="0.7" />
        <text x={C} y={C - 4} textAnchor="middle" fontSize="17" fill="#f2dcae" style={{ fontFamily: 'var(--font-serif)' }}>{sit}</text>
        <text x={C} y={C + 11} textAnchor="middle" fontSize="7" fill="#8a6f3c" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>坐</text>
        <text x={C} y={C + 21} textAnchor="middle" fontSize="6" fill="#6f6c7d" style={{ fontFamily: 'var(--font-mono)' }}>
          {facing}向
        </text>
      </svg>
    </div>
  )
}
