/**
 * 牌桌魔法阵。纯装饰，缓慢反向旋转，给牌阵一个「仪式」的底。
 */
export default function MagicCircle({ size = 460, color = '#d8b06a' }: { size?: number; color?: string }) {
  const C = 200
  const deg = (i: number, n: number) => (i * 2 * Math.PI) / n - Math.PI / 2

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg viewBox="0 0 400 400" width={size} height={size}>
        <g className="spin-slow" style={{ transformOrigin: '200px 200px' }}>
          <circle cx={C} cy={C} r="186" fill="none" stroke={color} strokeOpacity="0.55" strokeWidth="0.6" />
          <circle cx={C} cy={C} r="178" fill="none" stroke={color} strokeOpacity="0.28" strokeWidth="0.4" />
          {Array.from({ length: 60 }).map((_, i) => (
            <line
              key={i}
              x1={C}
              y1={C - 186}
              x2={C}
              y2={C - 178}
              stroke={color}
              strokeOpacity={i % 5 === 0 ? 0.7 : 0.3}
              strokeWidth="0.5"
              transform={`rotate(${i * 6} ${C} ${C})`}
            />
          ))}
          {/* 外圈小符 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = deg(i, 12)
            const x = C + 166 * Math.cos(a)
            const y = C + 166 * Math.sin(a)
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${(i * 360) / 12})`} stroke={color} strokeOpacity="0.6" fill="none" strokeWidth="0.5">
                <circle r="6" />
                <path d="M0 -4L0 4M-4 0L4 0" />
              </g>
            )
          })}
        </g>

        <g className="spin-rev" style={{ transformOrigin: '200px 200px' }}>
          <circle cx={C} cy={C} r="150" fill="none" stroke={color} strokeOpacity="0.4" strokeWidth="0.5" strokeDasharray="2 6" />
          {/* 七角星 */}
          <g stroke={color} strokeOpacity="0.55" strokeWidth="0.8" fill="none">
            {Array.from({ length: 7 }).map((_, i) => {
              const a1 = deg(i, 7)
              const a2 = deg((i + 3) % 7, 7)
              return (
                <line key={i} x1={C + 148 * Math.cos(a1)} y1={C + 148 * Math.sin(a1)} x2={C + 148 * Math.cos(a2)} y2={C + 148 * Math.sin(a2)} />
              )
            })}
          </g>
          <circle cx={C} cy={C} r="148" fill="none" stroke={color} strokeOpacity="0.34" strokeWidth="0.5" />
        </g>

        <circle cx={C} cy={C} r="96" fill="none" stroke={color} strokeOpacity="0.28" strokeWidth="0.4" strokeDasharray="1 5" />
        <circle cx={C} cy={C} r="60" fill="none" stroke={color} strokeOpacity="0.22" strokeWidth="0.4" />
      </svg>
    </div>
  )
}
