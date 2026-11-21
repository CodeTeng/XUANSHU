import { motion } from 'framer-motion'
import type { TarotCard, Suit } from '../lib/tarot/deck'
import { SUIT_META } from '../lib/tarot/deck'

/* ---------------------------- 大阿卡纳符号 ---------------------------- */

function MajorGlyph({ glyph, color }: { glyph: string; color: string }) {
  const s = { stroke: color, strokeWidth: 1.25, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const p = (d: string, extra: any = {}) => <path d={d} {...s} {...extra} />
  switch (glyph) {
    case 'fool':
      return (
        <g {...s}>
          <circle cx="50" cy="34" r="8" />
          <path d="M50 42v22M38 52l12 6 12-6M30 78c8-10 32-12 44-2" />
          <path d="M72 24l3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z" fill={color} fillOpacity="0.5" />
        </g>
      )
    case 'magician':
      return (
        <g {...s}>
          <path d="M50 14v26M50 40c-8 0-8 10 0 10s8-10 0-10-8 10 0 10" />
          <path d="M28 54c8-8 16-8 22 0s14 8 22 0" />
          <path d="M30 74h40M36 80h28" />
          <circle cx="26" cy="32" r="3" fill={color} fillOpacity="0.6" />
          <circle cx="74" cy="32" r="3" fill={color} fillOpacity="0.6" />
        </g>
      )
    case 'priestess':
      return (
        <g {...s}>
          <path d="M30 26v56M70 26v56" />
          <path d="M36 26h-12M36 26c0-6 4-8 4-8M64 26h12M64 26c0-6-4-8-4-8" />
          <path d="M50 34a10 10 0 100 20 12 12 0 010-20" fill={color} fillOpacity="0.18" />
          <path d="M40 66h20M42 72h16" />
        </g>
      )
    case 'empress':
      return (
        <g {...s}>
          <path d="M34 40l6-14 10 10 10-10 6 14" />
          <circle cx="50" cy="56" r="12" />
          <path d="M50 44v24M38 56h24" />
          <path d="M32 78h36M38 72c4 6 20 6 24 0" />
        </g>
      )
    case 'emperor':
      return (
        <g {...s}>
          <rect x="32" y="32" width="36" height="36" />
          <path d="M32 44h36M32 56h36M44 32v36M56 32v36" opacity="0.5" />
          <path d="M40 24h20M50 16v8" />
          <path d="M30 78h40" />
        </g>
      )
    case 'hierophant':
      return (
        <g {...s}>
          <path d="M50 18v48M38 30h24M40 42h20M42 54h16" />
          <path d="M26 74c0-6 10-8 24-8s24 2 24 8" />
          <circle cx="50" cy="14" r="4" fill={color} fillOpacity="0.5" />
        </g>
      )
    case 'lovers':
      return (
        <g {...s}>
          <circle cx="38" cy="46" r="14" />
          <circle cx="62" cy="46" r="14" />
          <path d="M50 32v28" opacity="0.4" />
          <path d="M40 74h20" />
          <path d="M50 20l3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill={color} fillOpacity="0.35" />
        </g>
      )
    case 'chariot':
      return (
        <g {...s}>
          <path d="M34 34h32v26H34z" />
          <circle cx="34" cy="70" r="7" />
          <circle cx="66" cy="70" r="7" />
          <path d="M50 20v14M42 24h16" />
          <path d="M30 54h40" opacity="0.4" />
        </g>
      )
    case 'strength':
      return (
        <g {...s}>
          <path d="M50 40c-4-8-14-8-14 0s14 14 14 14 14-6 14-14-10-8-14 0" />
          <path d="M26 70c8-10 40-10 48 0" />
          <circle cx="50" cy="56" r="20" opacity="0.28" />
        </g>
      )
    case 'hermit':
      return (
        <g {...s}>
          <path d="M50 20l8 14H42z" />
          <path d="M42 20h16M50 34v10" />
          <path d="M50 44v30" />
          <path d="M40 62h20v16H40z" />
          <path d="M50 66v8" opacity="0.6" />
          <circle cx="50" cy="30" r="3" fill={color} fillOpacity="0.7" />
        </g>
      )
    case 'wheel':
      return (
        <g {...s}>
          <circle cx="50" cy="50" r="26" />
          <circle cx="50" cy="50" r="10" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1="50" y1="50" x2={50 + 26 * Math.cos((i * Math.PI) / 4)} y2={50 + 26 * Math.sin((i * Math.PI) / 4)} opacity="0.55" />
          ))}
        </g>
      )
    case 'justice':
      return (
        <g {...s}>
          <path d="M50 22v50M30 32h40" />
          <path d="M30 32l-8 16h16zM70 32l-8 16h16z" />
          <path d="M36 76h28M50 72v4" />
        </g>
      )
    case 'hanged':
      return (
        <g {...s}>
          <path d="M28 24h44M50 24v18" />
          <path d="M50 42l14 22H36z" />
          <path d="M44 56h12" opacity="0.5" />
          <circle cx="50" cy="38" r="4" />
        </g>
      )
    case 'death':
      return (
        <g {...s}>
          <path d="M28 76L72 28" />
          <path d="M62 22c8 6 8 18 0 24" />
          <path d="M30 60l8 8" opacity="0.5" />
          <circle cx="50" cy="50" r="22" opacity="0.22" />
        </g>
      )
    case 'temperance':
      return (
        <g {...s}>
          <path d="M50 22l14 24H36z" />
          <path d="M50 78L36 54h28z" />
          <circle cx="50" cy="50" r="4" fill={color} fillOpacity="0.6" />
        </g>
      )
    case 'devil':
      return (
        <g {...s}>
          <path d="M50 78L28 44h44z" />
          <path d="M50 20l7 16H43z" fill={color} fillOpacity="0.3" />
          <circle cx="50" cy="50" r="5" />
          <path d="M24 26l8 8M76 26l-8 8" opacity="0.6" />
        </g>
      )
    case 'tower':
      return (
        <g {...s}>
          <path d="M38 78V40h24v38z" />
          <path d="M34 40l16-14 16 14" />
          <path d="M62 18l-10 18 8-2-6 14" />
          <path d="M44 54h12M44 64h12" opacity="0.5" />
        </g>
      )
    case 'star':
      return (
        <g {...s}>
          <path d="M50 18l5 16 16 5-16 5-5 16-5-16-16-5 16-5z" fill={color} fillOpacity="0.2" />
          <path d="M26 74c6-4 12-4 18 0M56 74c6-4 12-4 18 0" opacity="0.6" />
          <circle cx="50" cy="60" r="2" fill={color} />
        </g>
      )
    case 'moon':
      return (
        <g {...s}>
          <path d="M62 26a18 18 0 100 36 22 22 0 010-36z" fill={color} fillOpacity="0.16" />
          <path d="M32 70l4 8M50 70l4 8M68 70l4 8" opacity="0.7" />
          <circle cx="34" cy="56" r="2" fill={color} fillOpacity="0.6" />
          <circle cx="70" cy="52" r="2" fill={color} fillOpacity="0.6" />
        </g>
      )
    case 'sun':
      return (
        <g {...s}>
          <circle cx="50" cy="50" r="14" fill={color} fillOpacity="0.16" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI) / 6
            return <line key={i} x1={50 + 18 * Math.cos(a)} y1={50 + 18 * Math.sin(a)} x2={50 + 26 * Math.cos(a)} y2={50 + 26 * Math.sin(a)} />
          })}
        </g>
      )
    case 'judgement':
      return (
        <g {...s}>
          <path d="M26 44c10-10 38-10 48 0" />
          <path d="M74 44c0 10-6 16-6 16" />
          <path d="M32 62h36M38 70h24" opacity="0.6" />
          <path d="M50 18v10M44 24h12" />
        </g>
      )
    case 'world':
      return (
        <g {...s}>
          <ellipse cx="50" cy="50" rx="22" ry="30" />
          <ellipse cx="50" cy="50" rx="30" ry="22" opacity="0.35" />
          <circle cx="50" cy="50" r="6" fill={color} fillOpacity="0.4" />
        </g>
      )
    default:
      return <circle cx="50" cy="50" r="20" {...s} />
  }
}

/* ---------------------------- 花色符号 ---------------------------- */

function SuitGlyph({ suit, color }: { suit: Suit; color: string }) {
  const s = { stroke: color, strokeWidth: 1.3, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (suit) {
    case 'wands':
      return (
        <g {...s}>
          <path d="M50 16v68" />
          <path d="M50 26c-6 4-6 12 0 16 6-4 6-12 0-16z" fill={color} fillOpacity="0.35" />
          <path d="M42 74h16" />
        </g>
      )
    case 'cups':
      return (
        <g {...s}>
          <path d="M32 26h36c0 18-8 30-18 30S32 44 32 26z" fill={color} fillOpacity="0.14" />
          <path d="M50 56v16M38 78h24M34 26h32" />
        </g>
      )
    case 'swords':
      return (
        <g {...s}>
          <path d="M50 14l6 46H44z" />
          <path d="M34 60h32M50 60v16M42 82h16" />
        </g>
      )
    case 'pentacles': {
      // 五角星：外接圆 22，内圆 8.6，从正上方起每 36° 交替
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 22 : 8.6
        const a = (-Math.PI / 2) + (i * Math.PI) / 5
        pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(48 + r * Math.sin(a)).toFixed(2)}`)
      }
      return (
        <g {...s}>
          <circle cx="50" cy="48" r="23" />
          <polygon points={pts.join(' ')} fill={color} fillOpacity="0.18" />
        </g>
      )
    }
  }
}

/** 小阿卡纳点数布局：1-10 的点位 */
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[50, 32], [50, 68]],
  3: [[50, 28], [50, 50], [50, 72]],
  4: [[34, 32], [66, 32], [34, 68], [66, 68]],
  5: [[34, 30], [66, 30], [50, 50], [34, 70], [66, 70]],
  6: [[34, 28], [66, 28], [34, 50], [66, 50], [34, 72], [66, 72]],
  7: [[34, 26], [66, 26], [50, 38], [34, 52], [66, 52], [34, 74], [66, 74]],
  8: [[34, 24], [66, 24], [50, 36], [34, 48], [66, 48], [50, 60], [34, 76], [66, 76]],
  9: [[34, 24], [66, 24], [34, 44], [66, 44], [50, 50], [34, 56], [66, 56], [34, 76], [66, 76]],
  10: [[34, 22], [66, 22], [50, 32], [34, 42], [66, 42], [34, 58], [66, 58], [50, 68], [34, 78], [66, 78]],
}

function MinorArt({ card, color }: { card: TarotCard; color: string }) {
  const rank = card.rank || 1
  // 宫廷牌：徽章
  if (rank >= 11) {
    const letter = rank === 11 ? 'P' : rank === 12 ? 'N' : rank === 13 ? 'Q' : 'K'
    const label = rank === 11 ? '侍从' : rank === 12 ? '骑士' : rank === 13 ? '皇后' : '国王'
    return (
      <g>
        <SuitGlyph suit={card.suit!} color={color} />
        <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeOpacity="0.3" />
        <text x="50" y="80" textAnchor="middle" fill={color} fillOpacity="0.5" fontSize="6.5" letterSpacing="2" fontFamily="var(--font-serif)">
          {label}
        </text>
        <text x="50" y="20" textAnchor="middle" fill={color} fillOpacity="0.65" fontSize="8" fontFamily="var(--font-mono)">
          {letter}
        </text>
      </g>
    )
  }
  if (rank === 1) return <SuitGlyph suit={card.suit!} color={color} />
  const pips = PIPS[rank] || PIPS[1]
  const scale = rank <= 3 ? 0.26 : 0.2
  return (
    <g>
      {pips.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${scale}) translate(-50 -50)`}>
          <SuitGlyph suit={card.suit!} color={color} />
        </g>
      ))}
    </g>
  )
}

/* ---------------------------- 牌面 ---------------------------- */

export function CardFront({
  card,
  reversed,
  width = 160,
  glow = false,
}: {
  card: TarotCard
  reversed: boolean
  width?: number
  glow?: boolean
}) {
  const height = width * 1.68
  const isMajor = card.arcana === 'major'
  const color = isMajor ? '#e9cf9a' : SUIT_META[card.suit!].color
  const accent = isMajor ? '#d8b06a' : SUIT_META[card.suit!].color

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background: 'linear-gradient(165deg, #14111c 0%, #0c0a12 45%, #100d18 100%)',
        border: `1px solid ${accent}55`,
        boxShadow: glow ? `0 0 40px -8px ${accent}66, inset 0 0 40px -20px ${accent}` : `inset 0 0 30px -18px ${accent}`,
      }}
    >
      {/* 内框 */}
      <div className="absolute inset-[5px] border" style={{ borderColor: `${accent}33` }} />
      <div className="absolute inset-[9px] border" style={{ borderColor: `${accent}14` }} />

      {/* 角花 */}
      {[
        ['left-2 top-2', ''],
        ['right-2 top-2', 'rotate-90'],
        ['right-2 bottom-2', 'rotate-180'],
        ['left-2 bottom-2', '-rotate-90'],
      ].map(([pos, rot], i) => (
        <svg key={i} className={`absolute ${pos} ${rot}`} width="12" height="12" viewBox="0 0 12 12" style={{ color: accent, opacity: 0.5 }}>
          <path d="M1 6V1h5" stroke="currentColor" strokeWidth="0.9" fill="none" />
          <circle cx="3.2" cy="3.2" r="0.8" fill="currentColor" />
        </svg>
      ))}

      {/* 中央柔光 */}
      <div
        className="pointer-events-none absolute left-1/2 top-[46%] h-[52%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${accent}1f, transparent 68%)` }}
      />

      <div className="relative flex h-full flex-col items-center justify-between px-3 py-4" style={{ transform: reversed ? 'rotate(180deg)' : undefined }}>
        {/* 顶部编号 */}
        <div className="flex w-full items-center justify-between">
          <span className="mono text-[0.5rem] tracking-[0.18em]" style={{ color: `${accent}cc` }}>
            {isMajor ? card.no : `${SUIT_META[card.suit!].en.slice(0, 1)}·${card.no}`}
          </span>
          <span className="text-[0.44rem] tracking-[0.14em]" style={{ color: `${accent}88` }}>
            {card.element}
          </span>
        </div>

        {/* 图形 */}
        <svg viewBox="0 0 100 100" className="h-[56%] w-[84%]" style={{ filter: `drop-shadow(0 0 12px ${accent}77)` }}>
          {isMajor ? <MajorGlyph glyph={card.glyph} color={color} /> : <MinorArt card={card} color={color} />}
        </svg>

        {/* 牌名 */}
        <div className="flex w-full flex-col items-center gap-[3px]">
          <div className="h-[1px] w-10" style={{ background: `${accent}66` }} />
          <div className="serif text-center leading-tight tracking-[0.1em]" style={{ color: '#f6eeda', fontSize: width * 0.105 }}>
            {card.name}
          </div>
          <div className="mono text-center tracking-[0.1em]" style={{ color: `${accent}cc`, fontSize: width * 0.048 }}>
            {card.en.toUpperCase()}
          </div>
        </div>
      </div>

      {/* 光泽 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: `linear-gradient(120deg, transparent 30%, ${accent}12 50%, transparent 70%)` }}
      />
    </div>
  )
}

export function CardBack({ width = 160 }: { width?: number }) {
  const height = width * 1.68
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background: 'linear-gradient(160deg, #1d1730 0%, #0c0917 45%, #191228 100%)',
        border: '1px solid rgba(216,176,106,0.34)',
        boxShadow: 'inset 0 0 60px -24px rgba(108,92,231,0.7)',
      }}
    >
      <div className="absolute inset-[4px] border border-[rgba(216,176,106,0.2)]" />
      <div className="absolute inset-[8px] border border-[rgba(216,176,106,0.08)]" />

      <svg viewBox="0 0 100 168" className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="cardgrid" width="7" height="7" patternUnits="userSpaceOnUse">
            <path d="M7 0H0v7" fill="none" stroke="rgba(216,176,106,0.06)" strokeWidth="0.3" />
          </pattern>
          <radialGradient id="backcore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d8b06a" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#d8b06a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="168" fill="url(#cardgrid)" />
        <circle cx="50" cy="84" r="38" fill="url(#backcore)" />

        {/* 放射线 */}
        <g stroke="rgba(216,176,106,0.16)" strokeWidth="0.35">
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i * Math.PI) / 12
            return (
              <line
                key={i}
                x1={50 + 30 * Math.cos(a)}
                y1={84 + 30 * Math.sin(a)}
                x2={50 + 44 * Math.cos(a)}
                y2={84 + 44 * Math.sin(a)}
              />
            )
          })}
        </g>

        {/* 同心圆 */}
        <g fill="none" stroke="rgba(216,176,106,0.4)">
          <circle cx="50" cy="84" r="30" strokeWidth="0.55" />
          <circle cx="50" cy="84" r="24" strokeWidth="0.35" strokeDasharray="1 2.6" />
          <circle cx="50" cy="84" r="15" strokeWidth="0.4" />
        </g>

        {/* 八芒星 */}
        <g stroke="rgba(216,176,106,0.55)" fill="none" strokeWidth="0.45">
          {Array.from({ length: 8 }).map((_, i) => {
            const a1 = (i * Math.PI) / 4 - Math.PI / 2
            const a2 = ((i + 3) * Math.PI) / 4 - Math.PI / 2
            return (
              <line key={i}
                x1={50 + 24 * Math.cos(a1)} y1={84 + 24 * Math.sin(a1)}
                x2={50 + 24 * Math.cos(a2)} y2={84 + 24 * Math.sin(a2)} />
            )
          })}
        </g>

        <circle cx="50" cy="84" r="4.5" fill="none" stroke="rgba(216,176,106,0.7)" strokeWidth="0.5" />
        <circle cx="50" cy="84" r="1.6" fill="rgba(216,176,106,0.9)" />

        {/* 上下小花 */}
        {[40, 128].map((y, k) => (
          <g key={k} transform={`translate(50 ${y})`} stroke="rgba(216,176,106,0.4)" fill="none" strokeWidth="0.4">
            <path d="M0 -5L0 5M-5 0L5 0M-3.5 -3.5L3.5 3.5M-3.5 3.5L3.5 -3.5" />
          </g>
        ))}
        <path d="M20 84h6M74 84h6" stroke="rgba(216,176,106,0.3)" strokeWidth="0.4" />
      </svg>

      {/* 边角菱形 */}
      {['left-[10px] top-[10px]', 'right-[10px] top-[10px]', 'left-[10px] bottom-[10px]', 'right-[10px] bottom-[10px]'].map((p, i) => (
        <span key={i} className={`absolute ${p} h-1 w-1 rotate-45 bg-[rgba(216,176,106,0.55)]`} />
      ))}
    </div>
  )
}

export function FlippableCard({
  card,
  reversed,
  faceUp,
  width = 160,
  onClick,
  label,
  glow = false,
}: {
  card: TarotCard
  reversed: boolean
  faceUp: boolean
  width?: number
  onClick?: () => void
  label?: string
  glow?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      {label && <div className="text-[0.62rem] tracking-[0.16em] text-[#8b8899]">{label}</div>}
      <motion.button
        onClick={onClick}
        whileHover={faceUp ? { y: -4 } : { y: -8, rotateZ: 0.6 }}
        className="relative cursor-pointer"
        style={{ width, height: width * 1.68, perspective: 1400 }}
        aria-label={faceUp ? `${card.name}${reversed ? '逆位' : '正位'}` : '点击翻牌'}
      >
        <div className={`card-3d relative h-full w-full ${faceUp ? 'flipped' : ''}`}>
          <div className="card-face absolute inset-0">
            <CardBack width={width} />
          </div>
          <div className="card-face card-back absolute inset-0">
            <CardFront card={card} reversed={reversed} width={width} glow={glow} />
          </div>
        </div>
      </motion.button>
      {faceUp && label && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[0.6rem] tracking-wide"
          style={{ color: reversed ? '#b8766a' : '#8ec9a8' }}
        >
          {reversed ? '逆位' : '正位'}
        </motion.div>
      )}
    </div>
  )
}
