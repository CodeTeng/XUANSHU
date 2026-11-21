/**
 * 四柱八字。
 *
 * 原则：这里只产出「事实」——四柱、藏干、十神、五行个数、大运流年、神煞。
 * 旺衰、用神、格局高低属于判断，交给模型，不由代码假装算出来。
 * 排盘全部走 lunar-javascript，与 bazi-skill 的 pai_pan.py 同源同解。
 */
import { Solar, Lunar } from 'lunar-javascript'
import {
  GAN, ZHI, ZHI_HIDDEN, GAN_WUXING, ZHI_WUXING, shiShen,
  type WuXing, WUXING,
} from '../constants'

export interface BaziInput {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: '男' | '女'
  calendar: 'solar' | 'lunar'
  /** 农历闰月 */
  leap?: boolean
  /** 时辰不详：只做六字 */
  unknownHour?: boolean
  place?: string
}

export interface Pillar {
  key: 'year' | 'month' | 'day' | 'time'
  label: string
  gan: string
  zhi: string
  ganWuXing: WuXing
  zhiWuXing: WuXing
  /** 天干十神 */
  ganShen: string
  /** 地支藏干及各自十神 */
  hidden: { gan: string; wuxing: WuXing; shen: string }[]
  naYin: string
  diShi: string
  xunKong: string
}

export interface DaYun {
  index: number
  ganZhi: string
  startYear: number
  endYear: number
  startAge: number
  liuNian: { year: number; ganZhi: string; age: number }[]
}

export interface BaziChart {
  input: BaziInput
  solarText: string
  lunarText: string
  /** 生肖 */
  zodiac: string
  /** 日主 */
  dayMaster: string
  dayMasterWuXing: WuXing
  pillars: Pillar[]
  wuxingCount: Record<WuXing, number>
  hiddenDetail: Record<WuXing, string[]>
  /** 大运（不含起运前） */
  daYun: DaYun[]
  startLuck: { years: number; months: number; days: number; forward: boolean; text: string }
  currentDaYunIndex: number
  currentYear: number
  shenSha: { name: string; where: string; nature: '吉' | '凶' | '中'; note: string }[]
  taiYuan: string
  mingGong: string
  warnings: string[]
}

const PILLAR_LABELS = { year: '年柱', month: '月柱', day: '日柱', time: '时柱' } as const

/** 神煞查法：以日干 / 年支+日支三合局取 */
const TIANYI: Record<string, string[]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  辛: ['午', '寅'], 壬: ['卯', '巳'], 癸: ['卯', '巳'],
}
const WENCHANG: Record<string, string> = {
  甲: '巳', 乙: '午', 丙: '申', 戊: '申', 丁: '酉', 己: '酉',
  庚: '亥', 辛: '子', 壬: '寅', 癸: '卯',
}
const YANGREN: Record<string, string> = {
  甲: '卯', 乙: '辰', 丙: '午', 戊: '午', 丁: '未', 己: '未',
  庚: '酉', 辛: '戌', 壬: '子', 癸: '丑',
}
const SANHE_GROUP: Record<string, string> = {
  申: '申子辰', 子: '申子辰', 辰: '申子辰',
  寅: '寅午戌', 午: '寅午戌', 戌: '寅午戌',
  巳: '巳酉丑', 酉: '巳酉丑', 丑: '巳酉丑',
  亥: '亥卯未', 卯: '亥卯未', 未: '亥卯未',
}
const YIMA = { 申子辰: '寅', 寅午戌: '申', 巳酉丑: '亥', 亥卯未: '巳' } as Record<string, string>
const TAOHUA = { 申子辰: '酉', 寅午戌: '卯', 巳酉丑: '午', 亥卯未: '子' } as Record<string, string>
const HUAGAI = { 申子辰: '辰', 寅午戌: '戌', 巳酉丑: '丑', 亥卯未: '未' } as Record<string, string>
const JIANGXING = { 申子辰: '子', 寅午戌: '午', 巳酉丑: '酉', 亥卯未: '卯' } as Record<string, string>

const SHENSHA_META: Record<string, { nature: '吉' | '凶' | '中'; note: string }> = {
  天乙贵人: { nature: '吉', note: '《三命通会》列为诸神之首，主逢凶化吉、得贵人扶助' },
  文昌: { nature: '吉', note: '主聪慧、文书、考试与表达' },
  驿马: { nature: '中', note: '主迁徙、出行、变动；旺则远行，衰则奔波' },
  桃花: { nature: '中', note: '主情缘与吸引力，亦主社交场合的机遇' },
  华盖: { nature: '中', note: '主孤高、艺术、宗教哲思' },
  将星: { nature: '吉', note: '主统御、执行力，宜担纲' },
  羊刃: { nature: '凶', note: '主刚烈、争执与外伤，需以修养化之' },
  空亡: { nature: '凶', note: '该柱之力落空，吉凶皆减' },
}

export function calcBazi(input: BaziInput): BaziChart {
  const warnings: string[] = []
  let solar: any
  if (input.calendar === 'lunar') {
    const m = input.leap ? -input.month : input.month
    solar = Lunar.fromYmdHms(input.year, m, input.day, input.hour, input.minute, 0).getSolar()
  } else {
    solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0)
  }
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  // 节气交界提示：距离节令 24 小时内，月柱口径可能存疑
  try {
    const prev = lunar.getPrevJieQi(true)
    const next = lunar.getNextJieQi(true)
    const toMs = (jq: any) => {
      const s = jq.getSolar()
      return new Date(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute()).getTime()
    }
    const now = new Date(input.year, input.month - 1, input.day, input.hour, input.minute).getTime()
    if (Math.abs(toMs(prev) - now) < 86400000) warnings.push(`距「${prev.getName()}」不足 24 小时，月柱处于节气边界，口径需留意`)
    if (Math.abs(toMs(next) - now) < 86400000) warnings.push(`距「${next.getName()}」不足 24 小时，月柱处于节气边界，口径需留意`)
  } catch {
    /* 节气查询失败不影响主流程 */
  }

  const raw: { key: Pillar['key']; gan: string; zhi: string; hide: string[]; naYin: string; diShi: string; xunKong: string; ganShen: string; zhiShen: string[] }[] = [
    {
      key: 'year', gan: ec.getYearGan(), zhi: ec.getYearZhi(),
      hide: ec.getYearHideGan(), naYin: ec.getYearNaYin(), diShi: ec.getYearDiShi(),
      xunKong: ec.getYearXunKong(), ganShen: ec.getYearShiShenGan(), zhiShen: ec.getYearShiShenZhi(),
    },
    {
      key: 'month', gan: ec.getMonthGan(), zhi: ec.getMonthZhi(),
      hide: ec.getMonthHideGan(), naYin: ec.getMonthNaYin(), diShi: ec.getMonthDiShi(),
      xunKong: ec.getMonthXunKong(), ganShen: ec.getMonthShiShenGan(), zhiShen: ec.getMonthShiShenZhi(),
    },
    {
      key: 'day', gan: ec.getDayGan(), zhi: ec.getDayZhi(),
      hide: ec.getDayHideGan(), naYin: ec.getDayNaYin(), diShi: ec.getDayDiShi(),
      xunKong: ec.getDayXunKong(), ganShen: '日主', zhiShen: ec.getDayShiShenZhi(),
    },
    {
      key: 'time', gan: ec.getTimeGan(), zhi: ec.getTimeZhi(),
      hide: ec.getTimeHideGan(), naYin: ec.getTimeNaYin(), diShi: ec.getTimeDiShi(),
      xunKong: ec.getTimeXunKong(), ganShen: ec.getTimeShiShenGan(), zhiShen: ec.getTimeShiShenZhi(),
    },
  ]

  const dayGan = ec.getDayGan()
  const pillars: Pillar[] = raw.map((r) => ({
    key: r.key,
    label: PILLAR_LABELS[r.key],
    gan: r.gan,
    zhi: r.zhi,
    ganWuXing: GAN_WUXING[r.gan],
    zhiWuXing: ZHI_WUXING[r.zhi],
    ganShen: r.key === 'day' ? '日主' : shiShen(dayGan, r.gan),
    hidden: (r.hide || []).map((g: string) => ({
      gan: g,
      wuxing: GAN_WUXING[g],
      shen: g === dayGan ? '比肩' : shiShen(dayGan, g),
    })),
    naYin: r.naYin,
    diShi: r.diShi,
    xunKong: r.xunKong,
  }))

  if (input.unknownHour) {
    pillars.pop()
    warnings.push('时辰不详：仅排年月日三柱（六字），时柱相关的推断不作为结论')
  }

  // 五行个数：天干各计 1，地支按本气计 1（不做力量打分，与 fengshui.skill 口径一致）
  const wuxingCount = Object.fromEntries(WUXING.map((w) => [w, 0])) as Record<WuXing, number>
  const hiddenDetail: Record<WuXing, string[]> = { 木: [], 火: [], 土: [], 金: [], 水: [] }
  for (const p of pillars) {
    wuxingCount[p.ganWuXing]++
    hiddenDetail[p.ganWuXing].push(`${p.label}天干${p.gan}`)
    wuxingCount[p.zhiWuXing]++
    hiddenDetail[p.zhiWuXing].push(`${p.label}地支${p.zhi}（本气）`)
    for (const h of p.hidden.slice(1)) hiddenDetail[h.wuxing].push(`${p.label}地支${p.zhi}藏${h.gan}`)
  }

  // 大运
  const yun = ec.getYun(input.gender === '男' ? 1 : 0)
  const startLuck = {
    years: yun.getStartYear(),
    months: yun.getStartMonth(),
    days: yun.getStartDay(),
    forward: !!yun.isForward(),
    text: `${yun.getStartYear()} 年 ${yun.getStartMonth()} 个月 ${yun.getStartDay()} 天后起运，${yun.isForward() ? '顺排' : '逆排'}`,
  }
  const thisYear = new Date().getFullYear()
  const daYun: DaYun[] = (yun.getDaYun() || [])
    .slice(1)
    .map((d: any, i: number) => {
      const startYear = d.getStartYear()
      const endYear = d.getEndYear()
      return {
        index: i + 1,
        ganZhi: d.getGanZhi(),
        startYear,
        endYear,
        startAge: startYear - input.year,
        liuNian: (d.getLiuNian() || []).map((n: any) => ({
          year: n.getYear(),
          ganZhi: n.getGanZhi(),
          age: n.getYear() - input.year,
        })),
      }
    })
    .filter((d: DaYun) => d.ganZhi)

  const currentDaYunIndex = daYun.findIndex((d) => thisYear >= d.startYear && thisYear <= d.endYear)

  // 神煞
  const zhizhu = pillars.map((p) => p.zhi)
  const yearZhi = pillars[0]?.zhi
  const dayZhi = pillars.find((p) => p.key === 'day')?.zhi!
  const group = SANHE_GROUP[dayZhi]
  const shenSha: BaziChart['shenSha'] = []
  const addSS = (name: string, where: string) => {
    if (!where) return
    const meta = SHENSHA_META[name]
    if (meta) shenSha.push({ name, where, ...meta })
  }
  const whereOf = (zhi: string) => pillars.filter((p) => p.zhi === zhi).map((p) => p.label).join('、')

  const tianyi = TIANYI[dayGan] || []
  for (const z of tianyi) {
    const w = whereOf(z)
    if (w) addSS('天乙贵人', `${w}（${z}）`)
  }
  if (whereOf(WENCHANG[dayGan])) addSS('文昌', `${whereOf(WENCHANG[dayGan])}（${WENCHANG[dayGan]}）`)
  if (whereOf(YANGREN[dayGan])) addSS('羊刃', `${whereOf(YANGREN[dayGan])}（${YANGREN[dayGan]}）`)
  if (group) {
    if (whereOf(YIMA[group])) addSS('驿马', `${whereOf(YIMA[group])}（${YIMA[group]}）`)
    if (whereOf(TAOHUA[group])) addSS('桃花', `${whereOf(TAOHUA[group])}（${TAOHUA[group]}）`)
    if (whereOf(HUAGAI[group])) addSS('华盖', `${whereOf(HUAGAI[group])}（${HUAGAI[group]}）`)
    if (whereOf(JIANGXING[group])) addSS('将星', `${whereOf(JIANGXING[group])}（${JIANGXING[group]}）`)
  }
  // 空亡：日柱旬空落在哪一柱
  const xunkong = ec.getDayXunKong()
  const kz = String(xunkong).split('')
  const kw = pillars.filter((p) => kz.includes(p.zhi)).map((p) => p.label)
  if (kw.length) addSS('空亡', `${kw.join('、')}（日柱旬空 ${kz.join('、')}）`)
  if (zhizhu.length && yearZhi) {
    // 月支与日支相同者，另注伏吟，属结构提示而非神煞
  }

  return {
    input,
    solarText: `${solar.getYear()} 年 ${solar.getMonth()} 月 ${solar.getDay()} 日 ${String(solar.getHour()).padStart(2, '0')}:${String(solar.getMinute()).padStart(2, '0')}`,
    lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
    zodiac: lunar.getYearShengXiao(),
    dayMaster: dayGan,
    dayMasterWuXing: GAN_WUXING[dayGan],
    pillars,
    wuxingCount,
    hiddenDetail,
    daYun,
    startLuck,
    currentDaYunIndex,
    currentYear: thisYear,
    shenSha,
    taiYuan: ec.getTaiYuan(),
    mingGong: ec.getMingGong(),
    warnings,
  }
}

/** 提炼给模型的盘面事实，避免模型自己去推干支 */
export function baziToText(c: BaziChart): string {
  const lines: string[] = []
  lines.push(`公历：${c.solarText}；农历：${c.lunarText}；生肖：${c.zodiac}；性别：${c.input.gender}`)
  if (c.input.place) lines.push(`出生地：${c.input.place}`)
  lines.push('')
  lines.push('四柱：')
  for (const p of c.pillars) {
    lines.push(
      `${p.label}：${p.gan}${p.zhi}（天干${p.ganWuXing}·${p.ganShen}；地支${p.zhiWuXing}；藏干 ${p.hidden
        .map((h) => `${h.gan}${h.wuxing}/${h.shen}`)
        .join('、')}；纳音${p.naYin}；地势${p.diShi}；旬空${p.xunKong}）`,
    )
  }
  lines.push(`日主：${c.dayMaster}（${c.dayMasterWuXing}）。胎元：${c.taiYuan}；命宫：${c.mingGong}`)
  lines.push('')
  lines.push(`五行个数（天干 1、地支本气 1 计）：${WUXING.map((w) => `${w}${c.wuxingCount[w]}`).join(' ')}`)
  for (const w of WUXING) {
    if (c.hiddenDetail[w].length) lines.push(`  ${w}：${c.hiddenDetail[w].join('、')}`)
  }
  lines.push('')
  lines.push(`起运：${c.startLuck.text}`)
  lines.push('大运：')
  for (const d of c.daYun) {
    const cur = d.index - 1 === c.currentDaYunIndex ? ' ←当前' : ''
    lines.push(`  第${d.index}运 ${d.ganZhi} ${d.startYear}–${d.endYear}（${d.startAge}岁起）${cur}`)
  }
  const cur = c.daYun[c.currentDaYunIndex]
  if (cur) {
    lines.push(`当前流年段（${c.currentYear}）：${cur.liuNian.filter((n) => Math.abs(n.year - c.currentYear) <= 3).map((n) => `${n.year}${n.ganZhi}`).join('、')}`)
  }
  lines.push('')
  lines.push(`神煞（脚本口径）：${c.shenSha.length ? c.shenSha.map((s) => `${s.name}@${s.where}`).join('；') : '无主要神煞'}`)
  if (c.warnings.length) lines.push(`\n盘面提示：${c.warnings.join('；')}`)
  return lines.join('\n')
}

/** 供 UI 快速取用 */
export function ganzhiOfYear(year: number) {
  return GAN[(year - 4) % 10] + ZHI[(year - 4) % 12]
}
