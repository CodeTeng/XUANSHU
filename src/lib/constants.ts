/** 全局干支 / 五行 / 宫位常量。纯数据，无依赖。 */

export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export const SHENGXIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const

export type WuXing = '木' | '火' | '土' | '金' | '水'
export const WUXING: WuXing[] = ['木', '火', '土', '金', '水']

export const GAN_WUXING: Record<string, WuXing> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}

export const ZHI_WUXING: Record<string, WuXing> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
}

/** 地支藏干：本气、中气、余气 */
export const ZHI_HIDDEN: Record<string, string[]> = {
  子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
  辰: ['戊', '乙', '癸'], 巳: ['丙', '戊', '庚'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'],
}

export const WUXING_SHENG: Record<WuXing, WuXing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
export const WUXING_KE: Record<WuXing, WuXing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

/** 十神：以日干为「我」，判断另一干与我的关系 */
export function shiShen(dayGan: string, other: string): string {
  const me = GAN_WUXING[dayGan]
  const it = GAN_WUXING[other]
  const samePolarity = GAN.indexOf(dayGan as never) % 2 === GAN.indexOf(other as never) % 2
  if (me === it) return samePolarity ? '比肩' : '劫财'
  if (WUXING_SHENG[me] === it) return samePolarity ? '食神' : '伤官'
  if (WUXING_KE[me] === it) return samePolarity ? '偏财' : '正财'
  if (WUXING_KE[it] === me) return samePolarity ? '七杀' : '正官'
  return samePolarity ? '偏印' : '正印'
}

/** 五行 → 色值。整套视觉以此为准 */
export const WUXING_COLOR: Record<WuXing, string> = {
  木: '#4ea87a',
  火: '#d8553f',
  土: '#c9a227',
  金: '#c8cbd4',
  水: '#4a7fc1',
}

export const WUXING_GLYPH: Record<WuXing, string> = { 木: '木', 火: '火', 土: '土', 金: '金', 水: '水' }

export const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export const SHICHEN_RANGE = [
  '23:00–00:59', '01:00–02:59', '03:00–04:59', '05:00–06:59',
  '07:00–08:59', '09:00–10:59', '11:00–12:59', '13:00–14:59',
  '15:00–16:59', '17:00–18:59', '19:00–20:59', '21:00–22:59',
]

/** 小时 → 时辰序号（23 点起为次日子时，此处只做时辰归属） */
export function hourToShichen(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2)
}

export const NAYIN: Record<string, string> = {} // 由 lunar-javascript 提供，占位避免误用

/** 当年。年份下拉的默认值与上限 */
export const CURRENT_YEAR = new Date().getFullYear()

/** 出生年份候选：当年往前推 100 年，倒序（当年在最前） */
export const BIRTH_YEARS: number[] = Array.from({ length: 101 }, (_, i) => CURRENT_YEAR - i)

/** 分钟候选：0–59 全量 */
export const MINUTE_OPTIONS: number[] = Array.from({ length: 60 }, (_, i) => i)

/** 某年某月（公历）的天数 */
export function daysInSolarMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}
