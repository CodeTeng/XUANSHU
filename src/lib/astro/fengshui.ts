/**
 * 堪舆：玄空飞星、八宅明镜、流年紫白、择日。
 *
 * 移植自 fengshui.skill 的 scripts/kanyu/（飞星与八宅为纯标准库实现，
 * 可逐行对应）。历法部分改用 lunar-javascript，口径与 lunar-python 同源。
 */
import { Solar, Lunar } from 'lunar-javascript'
import { GAN, ZHI } from '../constants'

export const MOUNTAINS = '壬子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥'.split('')
const PALACES = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾']
const PALACE_NUM: Record<string, number> = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 中: 5, 乾: 6, 兑: 7, 艮: 8, 离: 9 }
const NUM_PALACE: Record<number, string> = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兑', 8: '艮', 9: '离' }
export const PALACE_DIR: Record<string, string> = {
  坎: '正北', 艮: '东北', 震: '正东', 巽: '东南', 离: '正南', 坤: '西南', 兑: '正西', 乾: '西北', 中: '中',
}
export const STAR_NAMES: Record<number, string> = {
  1: '一白贪狼', 2: '二黑巨门', 3: '三碧禄存', 4: '四绿文曲', 5: '五黄廉贞',
  6: '六白武曲', 7: '七赤破军', 8: '八白左辅', 9: '九紫右弼',
}
export const STAR_SHORT: Record<number, string> = { 1: '一白', 2: '二黑', 3: '三碧', 4: '四绿', 5: '五黄', 6: '六白', 7: '七赤', 8: '八白', 9: '九紫' }
export const STAR_ELEM: Record<number, string> = { 1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火' }

const LUOSHU_PATH = ['中', '乾', '兑', '艮', '离', '坎', '坤', '震', '巽']
export const GRID = [['巽', '离', '坤'], ['震', '中', '兑'], ['艮', '坎', '乾']]

export function mountainIndex(m: string): number {
  const i = MOUNTAINS.indexOf(m)
  if (i < 0) throw new Error(`未知山名: ${m}`)
  return i
}
export function mountainPalace(m: string): string {
  return PALACES[Math.floor(mountainIndex(m) / 3)]
}
export function mountainYuanLong(m: string): number {
  return mountainIndex(m) % 3
}
/** 玄空二十四山阴阳：四正宫地元阳、天元阴、人元阴；四隅宫反之 */
export function mountainYinYang(m: string): '+' | '-' {
  const pal = mountainPalace(m)
  const yl = mountainYuanLong(m)
  if (PALACE_NUM[pal] % 2 === 1) return yl === 0 ? '+' : '-'
  return yl === 0 ? '-' : '+'
}
export function palaceMountain(palace: string, yuanlong: number): string {
  return MOUNTAINS[PALACES.indexOf(palace) * 3 + yuanlong]
}
export function oppositeMountain(m: string): string {
  return MOUNTAINS[(mountainIndex(m) + 12) % 24]
}
export function mountainCenterDeg(m: string): number {
  return (345 + 15 * mountainIndex(m)) % 360
}
export function degToMountain(deg: number): { mountain: string; offset: number } {
  const d = ((deg % 360) + 360) % 360
  const i = Math.floor(((d - 337.5 + 360) % 360) / 15)
  const m = MOUNTAINS[i]
  const off = ((d - mountainCenterDeg(m) + 540) % 360) - 180
  return { mountain: m, offset: off }
}

/** 洛书飞泊：中宫起 center，顺/逆飞 */
export function fly(center: number, forward = true): Record<string, number> {
  const out: Record<string, number> = {}
  LUOSHU_PATH.forEach((pal, k) => {
    out[pal] = (((center - 1 + (forward ? k : -k)) % 9) + 9) % 9 + 1
  })
  return out
}
export function palaceOfStar(chart: Record<string, number>, n: number): string {
  return Object.keys(chart).find((p) => chart[p] === n) || '中'
}

/** 三元九运：1864 年起一运，每运 20 年 */
export function yunOfYear(year: number): number {
  return Math.floor((year - 1864) / 20) % 9 + 1
}
export function yunRange(yun: number): [number, number] {
  const start = 1864 + (yun - 1) * 20
  return [start, start + 19]
}
export function ganzhiOfYear(year: number): string {
  return GAN[(year - 4) % 10] + ZHI[(year - 4) % 12]
}

/* ------------------------------ 玄空飞星 ------------------------------ */

const TIGUA_STAR: Record<string, number> = {}
for (const [ms, n] of [['子癸甲申', 1], ['坤壬乙卯未', 2], ['戌乾亥辰巽巳', 6], ['艮丙辛酉丑', 7], ['寅午庚丁', 9]] as [string, number][]) {
  for (const m of ms) TIGUA_STAR[m] = n
}

export interface StarEntry {
  n: number
  by: string
  forward: boolean
  center: number
  replaced: boolean
}

export interface FeixingChart {
  yun: number
  yunRange: [number, number]
  sit: string
  facing: string
  sitPalace: string
  facePalace: string
  tigua: boolean
  yunPan: Record<string, number>
  shanPan: Record<string, number>
  xiangPan: Record<string, number>
  shanEntry: StarEntry
  xiangEntry: StarEntry
  patterns: string[]
  mainPattern: string | null
  sitDeg: number | null
  warnings: string[]
}

export function starDirection(n: number, refMountain: string): { forward: boolean; by: string } {
  const m = n === 5 ? refMountain : palaceMountain(NUM_PALACE[n], mountainYuanLong(refMountain))
  return { forward: mountainYinYang(m) === '+', by: m }
}

export function starStatus(n: number, yun: number): string {
  if (n === yun) return '当令旺星'
  const d = (((n - yun) % 9) + 9) % 9
  if (d === 1) return '生气'
  if (d === 2) return '次生气'
  if (d === 8) return '退气'
  if (n === 5) return '五黄煞'
  if (d === 7) return '衰气'
  return '死气'
}

function makeEntry(yunPan: Record<string, number>, palace: string, ref: string, tigua: boolean): StarEntry {
  const n = yunPan[palace]
  const { forward, by } = starDirection(n, ref)
  const center = tigua && n !== 5 ? TIGUA_STAR[by] : n
  return { n, by, forward, center, replaced: center !== n }
}

function isConsecutive(t: number[]) {
  for (let a = 1; a <= 9; a++) {
    const s = new Set(t.map((x) => ((a + x - 1) % 9) + 1))
    if (s.size === 3 && t.every((x) => s.has(x))) return true
  }
  return false
}

/** 排飞星盘。sit 为坐山（二十四山之一），facing 自动取对宫 */
export function feixingChart(yun: number, sit: string, tigua = false, sitDeg?: number): FeixingChart {
  const facing = oppositeMountain(sit)
  const sitPalace = mountainPalace(sit)
  const facePalace = mountainPalace(facing)
  const yunPan = fly(yun, true)
  const shanEntry = makeEntry(yunPan, sitPalace, sit, tigua)
  const xiangEntry = makeEntry(yunPan, facePalace, facing, tigua)
  const shanPan = fly(shanEntry.center, shanEntry.forward)
  const xiangPan = fly(xiangEntry.center, xiangEntry.forward)

  const patterns: string[] = []
  const sSit = shanPan[sitPalace]
  const sFace = shanPan[facePalace]
  const xSit = xiangPan[sitPalace]
  const xFace = xiangPan[facePalace]
  if (sSit === yun && xFace === yun) patterns.push('旺山旺向（当令山星到坐、向星到向）')
  else if (sFace === yun && xSit === yun) patterns.push('上山下水（当令山星到向、向星到坐）')
  else if (sFace === yun && xFace === yun) patterns.push('双星到向（当令山向二星同到向首）')
  else if (sSit === yun && xSit === yun) patterns.push('双星到坐（当令山向二星同到坐山）')

  for (const [name, e] of [['山星', shanEntry], ['向星', xiangEntry]] as [string, StarEntry][]) {
    if (e.center === 5) {
      patterns.push(e.forward ? `${name}伏吟（五入中顺飞，与洛书元旦盘相同）` : `${name}反吟（五入中逆飞，与洛书元旦盘相反）`)
    }
  }
  if (LUOSHU_PATH.every((p) => shanPan[p] + yunPan[p] === 10)) patterns.push('山星与运星合十')
  if (LUOSHU_PATH.every((p) => xiangPan[p] + yunPan[p] === 10)) patterns.push('向星与运星合十')
  const groups = [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
  if (LUOSHU_PATH.every((p) => groups.some((g) => g.includes(yunPan[p]) && g.includes(shanPan[p]) && g.includes(xiangPan[p])))) {
    patterns.push('父母三般卦（每宫运山向三星成 147/258/369）')
  }
  if (LUOSHU_PATH.every((p) => isConsecutive([yunPan[p], shanPan[p], xiangPan[p]]))) patterns.push('连珠三般卦（每宫运山向三星相连）')

  const mainPattern = patterns.find((p) => p.includes('当令'))?.split('（')[0] ?? null
  const warnings: string[] = []
  if (sitDeg != null) {
    const { offset } = degToMountain(sitDeg)
    const a = Math.abs(offset)
    if (a >= 6) {
      const nb = MOUNTAINS[(mountainIndex(sit) + (offset > 0 ? 1 : -1) + 24) % 24]
      warnings.push(
        mountainPalace(nb) === mountainPalace(sit)
          ? `接近${sit}/${nb}交界（小空亡，同宫异元龙），立向不清，宜复测`
          : `接近${sit}/${nb}交界（大空亡，出卦），立向不清，宜复测`,
      )
    }
    if (a > 3) warnings.push('兼向超过 3°，多数玄空派主张用替卦，各派界限不一，宜两盘并参')
  }

  return {
    yun, yunRange: yunRange(yun), sit, facing, sitPalace, facePalace, tigua,
    yunPan, shanPan, xiangPan, shanEntry, xiangEntry, patterns, mainPattern, sitDeg: sitDeg ?? null, warnings,
  }
}

/* ------------------------------ 八宅 ------------------------------ */

export const BAZHAI_ORDER = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑']
const YOUNIAN_SONG: Record<string, string> = {
  乾: '六天五祸绝延生', 坎: '五天生延绝祸六', 艮: '六绝祸生延天五',
  震: '延生祸绝五天六', 巽: '天五六祸生绝延', 离: '六五绝延祸生天',
  坤: '天延绝生祸五六', 兑: '生祸延绝六五天',
}
const YOUNIAN_NAMES: Record<string, string> = { 生: '生气', 延: '延年', 天: '天医', 祸: '祸害', 六: '六煞', 五: '五鬼', 绝: '绝命' }
export const YOUNIAN_NOTE: Record<string, string> = {
  生气: '上吉 · 贪狼木', 延年: '上吉 · 武曲金', 天医: '中吉 · 巨门土', 伏位: '小吉 · 辅弼木',
  祸害: '小凶 · 禄存土', 六煞: '次凶 · 文曲水', 五鬼: '大凶 · 廉贞火', 绝命: '大凶 · 破军金',
}
const EAST_FOUR = new Set(['坎', '离', '震', '巽'])

/** 游年：返回 { 生气: '巽', ... } */
export function younian(gua: string): Record<string, string> {
  const i = BAZHAI_ORDER.indexOf(gua)
  const others = Array.from({ length: 7 }, (_, k) => BAZHAI_ORDER[(i + k + 1) % 8])
  const table: Record<string, string> = { 伏位: gua }
  others.forEach((t, k) => (table[YOUNIAN_NAMES[YOUNIAN_SONG[gua][k]]] = t))
  return table
}

export function eastWest(gua: string) {
  return EAST_FOUR.has(gua) ? '东四命' : '西四命'
}

export interface MingGua {
  year: number
  gender: '男' | '女'
  raw: number
  number: number
  gua: string
  group: string
  note: string
}

/** 命卦：年份须已按立春调整；男五寄坤，女五寄艮 */
export function mingGua(year: number, gender: '男' | '女'): MingGua {
  const raw = gender === '男' ? ((11 - (year % 9)) % 9 || 9) : (((year % 9) + 4) % 9 || 9)
  let number = raw
  let note = ''
  if (raw === 5) {
    number = gender === '男' ? 2 : 8
    note = gender === '男' ? '男命五寄坤' : '女命五寄艮'
  }
  const gua = NUM_PALACE[number]
  return { year, gender, raw, number, gua, group: eastWest(gua), note }
}

/* ------------------------------ 流年紫白 ------------------------------ */

export function annualCenter(year: number): number {
  return (((10 - (year % 9)) % 9) + 9) % 9 + 1
}

const SANSHA: Record<string, [string, string]> = {
  申: ['南', '巳午未'], 子: ['南', '巳午未'], 辰: ['南', '巳午未'],
  寅: ['北', '亥子丑'], 午: ['北', '亥子丑'], 戌: ['北', '亥子丑'],
  亥: ['西', '申酉戌'], 卯: ['西', '申酉戌'], 未: ['西', '申酉戌'],
  巳: ['东', '寅卯辰'], 酉: ['东', '寅卯辰'], 丑: ['东', '寅卯辰'],
}
const ZHI_DIR: Record<string, string> = {
  子: '正北', 丑: '东北', 寅: '东北', 卯: '正东', 辰: '东南', 巳: '东南',
  午: '正南', 未: '西南', 申: '西南', 酉: '正西', 戌: '西北', 亥: '西北',
}

export interface YearSha {
  year: number
  ganZhi: string
  center: number
  taiSui: string
  suiPo: string
  sanSha: string
  wuHuang: string
  erHei: string
}

export function yearSha(year: number): YearSha {
  const zhi = ZHI[(year - 4) % 12]
  const po = ZHI[(ZHI.indexOf(zhi) + 6) % 12]
  const c = annualCenter(year)
  const ann = fly(c, true)
  return {
    year,
    ganZhi: ganzhiOfYear(year),
    center: c,
    taiSui: `${ZHI_DIR[zhi]}（${zhi}山）`,
    suiPo: `${ZHI_DIR[po]}（${po}山）`,
    sanSha: `${SANSHA[zhi][0]}（${SANSHA[zhi][1]}）`,
    wuHuang: PALACE_DIR[palaceOfStar(ann, 5)],
    erHei: PALACE_DIR[palaceOfStar(ann, 2)],
  }
}

/* ------------------------------ 择日 ------------------------------ */

export interface ZeriDay {
  date: string
  ganZhi: string
  zhiXing: string
  score: number
  yi: string[]
  ji: string[]
  reasons: string[]
  excluded: boolean
}

const GOOD_ZHIXING = new Set(['成', '开', '定', '满', '除', '建'])
const EVENT_YI: Record<string, string[]> = {
  入宅: ['入宅', '移徙', '安床'],
  开业: ['开市', '交易', '立券', '纳财'],
  动土: ['动土', '修造', '起基'],
  嫁娶: ['嫁娶', '纳采', '订盟'],
}

/** 简化择日：以黄历宜忌 + 建除 + 冲当事人为主，不做神煞全量推演 */
export function zeri(opts: {
  event: string
  start: string
  end: string
  birthYear?: number
}): ZeriDay[] {
  const [sy, sm, sd] = opts.start.split('-').map(Number)
  const [ey, em, ed] = opts.end.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  const out: ZeriDay[] = []
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out
  const days = Math.min(62, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
  const yiKeys = EVENT_YI[opts.event] || [opts.event]

  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    const lunar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate()).getLunar()
    const yi: string[] = lunar.getDayYi() || []
    const ji: string[] = lunar.getDayJi() || []
    const zhiXing: string = lunar.getZhiXing()
    const gz: string = lunar.getDayInGanZhi()
    const reasons: string[] = []
    let score = 50
    let excluded = false

    if (zhiXing && GOOD_ZHIXING.has(zhiXing)) { score += 15; reasons.push(`建除「${zhiXing}」为可用之日`) }
    else if (zhiXing) { score -= 10; reasons.push(`建除「${zhiXing}」偏忌`) }

    const hitYi = yiKeys.filter((k) => yi.some((x) => x.includes(k)))
    if (hitYi.length) { score += 20; reasons.push(`黄历宜：${hitYi.join('、')}`) }
    const hitJi = yiKeys.filter((k) => ji.some((x) => x.includes(k)))
    if (hitJi.length) { excluded = true; reasons.push(`黄历忌：${hitJi.join('、')}`) }

    // 冲当事人年支
    if (opts.birthYear) {
      const bz = ZHI[(opts.birthYear - 4) % 12]
      if (gz[1] === ZHI[(ZHI.indexOf(bz) + 6) % 12]) {
        excluded = true
        reasons.push(`日支冲当事人年支（${bz}）`)
      }
    }
    // 月破
    const monthZhi = lunar.getMonthZhi()
    if (gz[1] === ZHI[(ZHI.indexOf(monthZhi) + 6) % 12]) {
      excluded = true
      reasons.push('月破日')
    }

    out.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      ganZhi: gz,
      zhiXing,
      score: Math.max(0, Math.min(100, score)),
      yi: yi.slice(0, 6),
      ji: ji.slice(0, 6),
      reasons,
      excluded,
    })
  }
  return out.sort((a, b) => Number(a.excluded) - Number(b.excluded) || b.score - a.score)
}

/** 某年是否在立春之后：用于命卦分年 */
export function yearAfterLiChun(year: number, month: number, day: number): number {
  try {
    const l = Solar.fromYmd(year, month, day).getLunar()
    // getYearInGanZhi 按立春分年，与公历年不一致即说明尚未过立春
    const gzYear = String(l.getYearInGanZhi())
    return gzYear === ganzhiOfYear(year) ? year : year - 1
  } catch {
    return year
  }
}
