/**
 * 抽牌与牌间关系。
 *
 * 对应 tarot-skill/scripts/draw.py 的纪律：必须由脚本抽牌、必须展示 seed 与
 * time_factor、必须可复现。算法换成 mulberry32，行为等价。
 */
import { DECK, SPREADS, type Spread, type TarotCard, SUIT_META, type Suit } from './deck'

export interface DrawnCard {
  card: TarotCard
  reversed: boolean
  position: { label: string; hint: string }
}

export interface TarotResult {
  spread: Spread
  seed: number
  timeFactor: string
  question: string
  drawn: DrawnCard[]
  relations: string[]
  suits: Record<Suit, number>
  dominantSuit: Suit | null
  missingSuit: Suit | null
  majorRatio: number
  energyWord: string
}

const TIME_FACTORS: [number, number, string][] = [
  [5, 8, 'dawn'],
  [8, 11, 'morning'],
  [11, 13, 'noon'],
  [13, 17, 'afternoon'],
  [17, 19, 'dusk'],
  [19, 23, 'night'],
]

export function timeFactorOf(d = new Date()): string {
  const h = d.getHours()
  for (const [a, b, name] of TIME_FACTORS) if (h >= a && h < b) return name
  return 'midnight'
}

const TF_LABEL: Record<string, string> = {
  dawn: '破晓', morning: '晨', noon: '正午', afternoon: '午后', dusk: '黄昏', night: '夜', midnight: '子夜',
}

export function labelOfTimeFactor(tf: string) {
  return TF_LABEL[tf] || tf
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const TF_CODE: Record<string, number> = { dawn: 3, morning: 5, noon: 7, afternoon: 11, dusk: 13, night: 17, midnight: 19 }

export function draw(opts: {
  spreadKey: string
  question: string
  seed?: number
  timeFactor?: string
  now?: Date
}): TarotResult {
  const spread = SPREADS.find((s) => s.key === opts.spreadKey) || SPREADS[1]
  const now = opts.now || new Date()
  const tf = opts.timeFactor || timeFactorOf(now)
  const dayCode = Math.floor(now.getTime() / 86400000)
  const seed =
    opts.seed ??
    (hashString(opts.question.trim() || '今日指引') + (TF_CODE[tf] || 1) * 7919 + dayCode * 104729) % 2147483647

  const rand = mulberry32(seed)
  const pool = [...DECK]
  const drawn: DrawnCard[] = []
  for (let i = 0; i < spread.count; i++) {
    const idx = Math.floor(rand() * pool.length)
    const card = pool.splice(idx, 1)[0]
    // 逆位概率 35%，与多数中文塔罗口径接近
    const reversed = rand() < 0.35
    drawn.push({ card, reversed, position: spread.positions[i] })
  }

  const suits: Record<Suit, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0 }
  let major = 0
  for (const d of drawn) {
    if (d.card.arcana === 'major') major++
    else if (d.card.suit) suits[d.card.suit]++
  }
  const suitEntries = Object.entries(suits) as [Suit, number][]
  const dominant = suitEntries.find(([, n]) => n >= 3)?.[0] ?? null
  const missing = suitEntries.length && drawn.length >= 3 ? suitEntries.find(([, n]) => n === 0 && n !== undefined)?.[0] ?? null : null
  const majorRatio = drawn.length ? major / drawn.length : 0

  const relations: string[] = []
  for (let i = 1; i < drawn.length; i++) {
    const a = drawn[i - 1].card
    const b = drawn[i].card
    let kind = '递进'
    if (a.suit && b.suit && a.suit === b.suit) kind = '同色对话'
    else if (a.element !== b.element) kind = '转折'
    else if (a.arcana === 'major' && b.arcana === 'major') kind = '因果'
    const aRev = drawn[i - 1].reversed ? '逆' : '正'
    const bRev = drawn[i].reversed ? '逆' : '正'
    relations.push(`${a.name}(${aRev}) → ${b.name}(${bRev})：${kind}，${relationText(kind, a, b)}`)
  }
  if (dominant) relations.push(`主导元素为${SUIT_META[dominant].name}（${SUIT_META[dominant].theme}），整盘能量偏向这一侧`)
  if (missing) relations.push(`缺席${SUIT_META[missing].name}（${SUIT_META[missing].theme}）：这块可能被整体忽略了`)
  if (majorRatio > 0.5) relations.push('大阿卡纳过半，属于重大转折议题，不是日常小事')
  else if (majorRatio >= 0.3) relations.push('大阿卡纳占比三到五成，命运与选择并存')
  else relations.push('大阿卡纳占比低，主动权主要在你手上')

  return {
    spread, seed, timeFactor: tf, question: opts.question, drawn,
    relations, suits, dominantSuit: dominant, missingSuit: missing, majorRatio,
    energyWord: energyWord(drawn),
  }
}

function relationText(kind: string, a: TarotCard, b: TarotCard): string {
  switch (kind) {
    case '同色对话':
      return `同一元素在强化「${b.up[0]}」这条线，说明它不是偶然`
    case '转折':
      return `从${a.element}转到${b.element}，中途有一次性质的切换`
    case '因果':
      return `两个大阿卡纳相接，前一张的状态在推向下一张`
    default:
      return `${a.up[0]}之后自然接到${b.up[0]}，是同一条路上的两段`
  }
}

const WORDS = ['静水深流', '破而后立', '守正待时', '由内而外', '取舍之间', '渐入佳境', '拨云见月', '收束成形']
function energyWord(drawn: DrawnCard[]): string {
  const s = drawn.reduce((acc, d) => acc + d.card.name.length + (d.reversed ? 3 : 0), 0)
  return WORDS[s % WORDS.length]
}

/** 给模型的牌面事实 */
export function tarotToText(r: TarotResult): string {
  const L: string[] = []
  L.push(`牌阵：${r.spread.name}（${r.spread.en}）｜问题：${r.question || '未填写，按当下整体能量读'}`)
  L.push(`seed：${r.seed}｜time_factor：${r.timeFactor}（${labelOfTimeFactor(r.timeFactor)}）`)
  L.push('')
  r.drawn.forEach((d, i) => {
    L.push(`${i + 1}. [${d.position.label}] ${d.card.name} · ${d.reversed ? '逆位' : '正位'}（${d.card.en}｜${d.card.element}）`)
    L.push(`   关键词：${(d.reversed ? d.card.rev : d.card.up).join('、')}`)
    L.push(`   牌面：${d.reversed ? d.card.revText : d.card.upText}`)
    L.push(`   位置含义：${d.position.hint}`)
  })
  L.push('')
  L.push('牌间关系：')
  r.relations.forEach((x) => L.push(`  · ${x}`))
  L.push('')
  L.push(`花色分布：${(Object.entries(r.suits) as [Suit, number][]).map(([s, n]) => `${SUIT_META[s].name}${n}`).join(' ')}`)
  L.push(`大阿卡纳占比：${Math.round(r.majorRatio * 100)}%`)
  return L.join('\n')
}
