/**
 * 时家奇门遁甲（转盘奇门）排盘。
 *
 * 逐行移植自 Numerologist_skills/qimen-dunjia/scripts/qimen_cli.py，
 * 口径保持一致：中五寄坤、值符加时干、值使逐时移宫、阴遁逆布。
 * 唯一替换是把 lunar_python 换成同作者的 lunar-javascript。
 */
import { Solar, Lunar } from 'lunar-javascript'

const JIAZI: string[] = []
for (let i = 0; i < 60; i++) JIAZI.push('甲乙丙丁戊己庚辛壬癸'[i % 10] + '子丑寅卯辰巳午未申酉戌亥'[i % 12])

const YANG_TERMS = new Set([
  '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
  '春分', '清明', '谷雨', '立夏', '小满', '芒种',
])

type JuTable = Record<string, Record<string, Record<string, number>>>

const JU_TABLE: JuTable = {
  阳遁: {
    冬至: { 上元: 1, 中元: 7, 下元: 4 },
    小寒: { 上元: 2, 中元: 8, 下元: 5 },
    大寒: { 上元: 3, 中元: 9, 下元: 6 },
    立春: { 上元: 8, 中元: 5, 下元: 2 },
    雨水: { 上元: 9, 中元: 6, 下元: 3 },
    惊蛰: { 上元: 1, 中元: 7, 下元: 4 },
    春分: { 上元: 3, 中元: 9, 下元: 6 },
    清明: { 上元: 4, 中元: 1, 下元: 7 },
    谷雨: { 上元: 5, 中元: 2, 下元: 8 },
    立夏: { 上元: 4, 中元: 1, 下元: 7 },
    小满: { 上元: 5, 中元: 2, 下元: 8 },
    芒种: { 上元: 6, 中元: 3, 下元: 9 },
  },
  阴遁: {
    夏至: { 上元: 9, 中元: 3, 下元: 6 },
    小暑: { 上元: 8, 中元: 2, 下元: 5 },
    大暑: { 上元: 7, 中元: 1, 下元: 4 },
    立秋: { 上元: 2, 中元: 5, 下元: 8 },
    处暑: { 上元: 1, 中元: 4, 下元: 7 },
    白露: { 上元: 9, 中元: 3, 下元: 6 },
    秋分: { 上元: 7, 中元: 1, 下元: 4 },
    寒露: { 上元: 6, 中元: 9, 下元: 3 },
    霜降: { 上元: 5, 中元: 8, 下元: 2 },
    立冬: { 上元: 6, 中元: 9, 下元: 3 },
    小雪: { 上元: 5, 中元: 8, 下元: 2 },
    大雪: { 上元: 4, 中元: 7, 下元: 1 },
  },
}

const EARTH_STEM_ORDER: Record<string, string[]> = {
  阳遁: ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'],
  阴遁: ['戊', '乙', '丙', '丁', '癸', '壬', '辛', '庚', '己'],
}

const ROTATION_RING = [1, 8, 3, 4, 9, 2, 7, 6]
const STAR_RING = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心']
const DOOR_RING = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门']
const STAR_HOME: Record<string, number> = Object.fromEntries(STAR_RING.map((s, i) => [s, ROTATION_RING[i]]))
const DOOR_HOME: Record<string, number> = Object.fromEntries(DOOR_RING.map((s, i) => [s, ROTATION_RING[i]]))
const OPPOSITE: Record<number, number> = { 1: 9, 9: 1, 8: 2, 2: 8, 3: 7, 7: 3, 4: 6, 6: 4 }

const GOD_RING_YANG = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天']
const GOD_RING_YIN = ['值符', '九天', '九地', '玄武', '白虎', '六合', '太阴', '螣蛇']

const XUNSHOU_TO_HIDDEN_YI: Record<string, string> = {
  甲子: '戊', 甲戌: '己', 甲申: '庚', 甲午: '辛', 甲辰: '壬', 甲寅: '癸',
}

const BRANCH_TO_PALACE: Record<string, number> = {
  子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6,
}

const PALACE_INFO: Record<number, { name: string; direction: string; trigram: string; element: string }> = {
  1: { name: '坎宫', direction: '正北', trigram: '坎', element: '水' },
  2: { name: '坤宫', direction: '西南', trigram: '坤', element: '土' },
  3: { name: '震宫', direction: '正东', trigram: '震', element: '木' },
  4: { name: '巽宫', direction: '东南', trigram: '巽', element: '木' },
  5: { name: '中宫', direction: '中', trigram: '中', element: '土' },
  6: { name: '乾宫', direction: '西北', trigram: '乾', element: '金' },
  7: { name: '兑宫', direction: '正西', trigram: '兑', element: '金' },
  8: { name: '艮宫', direction: '东北', trigram: '艮', element: '土' },
  9: { name: '离宫', direction: '正南', trigram: '离', element: '火' },
}

export const QIMEN_GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6]

const STAR_ELEMENT: Record<string, string> = {
  天蓬: '水', 天任: '土', 天冲: '木', 天辅: '木', 天英: '火', 天芮: '土', 天柱: '金', 天心: '金', 天禽: '土',
}
const DOOR_ELEMENT: Record<string, string> = {
  休门: '水', 生门: '土', 伤门: '木', 杜门: '木', 景门: '火', 死门: '土', 惊门: '金', 开门: '金',
}
const SAN_QI = new Set(['乙', '丙', '丁'])
const JI_MEN = new Set(['开门', '休门', '生门'])
const STEM_ELEMENT: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}
const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

function rotateToStart<T>(seq: T[], start: T): T[] {
  const i = seq.indexOf(start)
  if (i < 0) return seq.slice()
  return seq.slice(i).concat(seq.slice(0, i))
}

function hostedPalace(p: number) {
  return p === 5 ? 2 : p
}

export interface QimenPalace {
  palace: number
  name: string
  direction: string
  trigram: string
  element: string
  earthStem: string | null
  skyStem: string | null
  skyStems: string[]
  star: string | null
  hostedStar?: string
  door: string | null
  god: string | null
  isCenter: boolean
  hostsCenterSky: boolean
  note?: string
  flags: string[]
}

export interface QimenPattern {
  name: string
  palace: number
  detail: string
  nature: '吉' | '凶' | '中'
}

export interface QimenChart {
  solarText: string
  lunarText: string
  dayGanZhi: string
  timeGanZhi: string
  dunType: '阳遁' | '阴遁'
  yuan: string
  juNumber: number
  activeJie: string
  nextJie: string | null
  xunshou: string
  hiddenYi: string
  timeStem: string
  zhifu: { star: string; palace: number }
  zhishi: { door: string; palace: number }
  kongwang: string[]
  kongwangPalaces: number[]
  hourYima: { branch: string | null; palace: number | null }
  dayYima: { branch: string | null; palace: number | null }
  palaces: QimenPalace[]
  patterns: QimenPattern[]
  warnings: string[]
}

export interface QimenInput {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  calendar?: 'solar' | 'lunar'
  leap?: boolean
  /** 问事主题，仅用于解读，不参与排盘 */
  topic?: string
}

export function calcQimen(input: QimenInput): QimenChart {
  const warnings: string[] = []
  let solar: any
  if (input.calendar === 'lunar') {
    const m = input.leap ? -input.month : input.month
    solar = Lunar.fromYmdHms(input.year, m, input.day, input.hour, input.minute, 0).getSolar()
  } else {
    solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0)
  }
  const lunar = solar.getLunar()

  const prevJie = lunar.getPrevJieQi(false)
  const nextJie = lunar.getNextJieQi(false)
  if (!prevJie) throw new Error('无法确定当前节气')
  const jieName: string = prevJie.getName()
  const dunType: '阳遁' | '阴遁' = YANG_TERMS.has(jieName) ? '阳遁' : '阴遁'

  const dayGanzhi: string = lunar.getDayInGanZhiExact()
  const yuan = ['上元', '中元', '下元'][Math.floor(JIAZI.indexOf(dayGanzhi) / 5) % 3]
  const juTable = JU_TABLE[dunType]
  const juForJie = juTable[jieName]
  if (!juForJie) {
    throw new Error(`节气「${jieName}」不在定局表内，属规则集未覆盖的边界（当前为 ${dunType}）`)
  }
  const juNumber = juForJie[yuan]

  // 地盘
  const palacesSeq = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const rotated = rotateToStart(palacesSeq, juNumber)
  const stems = EARTH_STEM_ORDER[dunType]
  const earthPlate: Record<number, string> = {}
  rotated.forEach((p, i) => (earthPlate[p] = stems[i]))

  const timeGanzhi: string = lunar.getTimeInGanZhi()
  const timeGan: string = lunar.getTimeGan()
  const timeXun: string = lunar.getTimeXun()
  const timeXunKong: string = lunar.getTimeXunKong()
  const hiddenYi = XUNSHOU_TO_HIDDEN_YI[timeXun]
  const visibleTimeGan = timeGan === '甲' ? hiddenYi : timeGan
  if (timeGan === '甲') warnings.push(`时干为甲，按旬首所遁之仪「${hiddenYi}」入盘`)

  const findStemPalace = (stem: string) => {
    const e = Object.entries(earthPlate).find(([, s]) => s === stem)
    if (!e) throw new Error(`地盘中未找到天干 ${stem}`)
    return Number(e[0])
  }

  const xunshouRaw = findStemPalace(hiddenYi)
  const timeRaw = findStemPalace(visibleTimeGan)
  const xunshouPalace = hostedPalace(xunshouRaw)
  const timePalace = hostedPalace(timeRaw)
  if (xunshouRaw === 5 || timeRaw === 5) warnings.push('本盘涉及中五，相关判断一律寄坤处理')

  const hoursFromXunshou = JIAZI.indexOf(timeGanzhi) - JIAZI.indexOf(timeXun)
  const step = dunType === '阳遁' ? 1 : -1
  const zhishiRaw = ((xunshouRaw - 1 + step * hoursFromXunshou) % 9 + 9) % 9 + 1
  const zhishiPalace = hostedPalace(zhishiRaw)

  let palaceOrder: number[]
  let doorPalaceOrder: number[]
  let starOrder: string[]
  let doorOrder: string[]
  let godOrder: string[]
  let outerEarth: string[]

  if (dunType === '阳遁') {
    palaceOrder = rotateToStart(ROTATION_RING, timePalace)
    doorPalaceOrder = rotateToStart(ROTATION_RING, zhishiPalace)
    starOrder = rotateToStart(STAR_RING, STAR_RING[ROTATION_RING.indexOf(xunshouPalace)])
    doorOrder = rotateToStart(DOOR_RING, DOOR_RING[ROTATION_RING.indexOf(xunshouPalace)])
    godOrder = GOD_RING_YANG
    outerEarth = ROTATION_RING.map((p) => earthPlate[p])
  } else {
    const reverseRing = [...ROTATION_RING].reverse()
    const reverseStar = [...STAR_RING].reverse()
    const reverseDoor = [...DOOR_RING].reverse()
    palaceOrder = rotateToStart(reverseRing, timePalace)
    doorPalaceOrder = rotateToStart(reverseRing, zhishiPalace)
    starOrder = rotateToStart(reverseStar, STAR_RING[ROTATION_RING.indexOf(xunshouPalace)])
    doorOrder = rotateToStart(reverseDoor, DOOR_RING[ROTATION_RING.indexOf(xunshouPalace)])
    godOrder = GOD_RING_YIN
    outerEarth = reverseRing.map((p) => earthPlate[p])
  }

  const skyStartStem = xunshouRaw === 5 ? earthPlate[xunshouPalace] : hiddenYi
  const skyOrder = rotateToStart(outerEarth, skyStartStem)

  const starMap: Record<number, string> = {}
  const skyMap: Record<number, string> = {}
  const doorMap: Record<number, string> = {}
  const godMap: Record<number, string> = {}
  palaceOrder.forEach((p, i) => {
    starMap[p] = starOrder[i]
    skyMap[p] = skyOrder[i]
  })
  doorPalaceOrder.forEach((p, i) => (doorMap[p] = doorOrder[i]))
  rotateToStart(ROTATION_RING, timePalace).forEach((p, i) => (godMap[p] = godOrder[i]))

  const zhifuStar = starMap[timePalace]
  const zhishiDoor = doorMap[zhishiPalace]
  const tianruiPalace = Number(Object.entries(starMap).find(([, s]) => s === '天芮')?.[0])
  const centerStem = earthPlate[5]

  // 空亡与驿马
  const kwBranches = String(timeXunKong).split('')
  const kwPalaces = [...new Set(kwBranches.map((b) => BRANCH_TO_PALACE[b]).filter(Boolean))]
  const yimaOf = (zhi: string) => {
    const g = { 申: '申子辰', 子: '申子辰', 辰: '申子辰', 寅: '寅午戌', 午: '寅午戌', 戌: '寅午戌', 亥: '亥卯未', 卯: '亥卯未', 未: '亥卯未', 巳: '巳酉丑', 酉: '巳酉丑', 丑: '巳酉丑' }[zhi]
    const b = { 申子辰: '寅', 寅午戌: '申', 亥卯未: '巳', 巳酉丑: '亥' }[g as string]
    return { branch: b || null, palace: b ? BRANCH_TO_PALACE[b] : null }
  }

  const palaces: QimenPalace[] = Object.keys(PALACE_INFO)
    .map(Number)
    .sort((a, b) => a - b)
    .map((no) => {
      const info = PALACE_INFO[no]
      const star = no === 5 ? null : starMap[no] ?? null
      const door = no === 5 ? null : doorMap[no] ?? null
      const god = no === 5 ? null : godMap[no] ?? null
      const skyStem = skyMap[no] ?? null
      const hostsCenterSky = no === tianruiPalace
      const skyStems = [skyStem, hostsCenterSky ? centerStem : null].filter(Boolean) as string[]
      const earthStem = earthPlate[no] ?? null
      const notes: string[] = []
      if (no === 5) notes.push(`中宫地盘${centerStem}寄坤，天禽随天芮转出`)
      if (no === 2) notes.push('地盘寄坤：承载中五地盘干')
      if (hostsCenterSky) notes.push(`天盘随转：天禽与中干${centerStem}随天芮落此宫`)

      const flags: string[] = []
      if (skyStem && earthStem) {
        const a = STEM_ELEMENT[skyStem]
        const b = STEM_ELEMENT[earthStem]
        if (a === b) flags.push('伏吟')
        else if (SHENG[a] === b) flags.push('天生地')
        else if (SHENG[b] === a) flags.push('地生天')
        else if (KE[a] === b) flags.push('天克地')
        else if (KE[b] === a) flags.push('地克天')
      }
      if (door && star) {
        const dEl = DOOR_ELEMENT[door]
        const pEl = info.element
        if (KE[dEl] === pEl) flags.push('门迫')
        else if (KE[pEl] === dEl) flags.push('门受制')
        if (door === '开门' || door === '休门' || door === '生门') flags.push('吉门')
        if (SAN_QI.has(skyStem || '') && ['开门', '休门', '生门'].includes(door)) flags.push('三奇得使')
      }
      if (kwPalaces.includes(no)) flags.push('空亡')
      return {
        palace: no,
        name: info.name,
        direction: info.direction,
        trigram: info.trigram,
        element: info.element,
        earthStem,
        skyStem,
        skyStems,
        star,
        hostedStar: hostsCenterSky ? '天禽' : undefined,
        door,
        god,
        isCenter: no === 5,
        hostsCenterSky,
        note: notes.join('；') || undefined,
        flags: [...new Set(flags)],
      }
    })

  // 格局检测（与脚本同口径）
  const patterns: QimenPattern[] = []
  for (const p of palaces) {
    if (p.isCenter) continue
    for (const st of p.skyStems) {
      if (SAN_QI.has(st) && p.door && JI_MEN.has(p.door)) {
        patterns.push({ name: '三奇配吉门', palace: p.palace, detail: `${st} + ${p.door}`, nature: '吉' })
      }
    }
    if (p.skyStem && p.earthStem && p.skyStem === p.earthStem) {
      patterns.push({ name: '伏吟', palace: p.palace, detail: `天地盘同为${p.skyStem}`, nature: '凶' })
    }
    if (p.star && STAR_HOME[p.star] && OPPOSITE[STAR_HOME[p.star]] === p.palace) {
      patterns.push({
        name: '反吟', palace: p.palace,
        detail: `${p.star}本宫在${STAR_HOME[p.star]}宫，落对冲${p.palace}宫`, nature: '凶',
      })
    }
    if (p.door && DOOR_HOME[p.door] && OPPOSITE[DOOR_HOME[p.door]] === p.palace) {
      patterns.push({ name: '门反吟', palace: p.palace, detail: `${p.door}落对冲宫`, nature: '凶' })
    }
  }
  if (zhifuStar && STAR_HOME[zhifuStar] === timePalace) {
    patterns.push({ name: '值符得位', palace: timePalace, detail: `${zhifuStar}回归本宫`, nature: '吉' })
  }

  // 八门全落对冲宫时，八条同名标签毫无信息量，合并成一条全局格
  const doorFan = patterns.filter((p) => p.name === '门反吟')
  const merged: QimenPattern[] = patterns.filter((p) => p.name !== '门反吟')
  if (doorFan.length >= 6) {
    merged.unshift({
      name: '八门反吟',
      palace: 0,
      detail: `八门有 ${doorFan.length} 门落于本宫对冲位，主事情反复、计划常改`,
      nature: '凶',
    })
  } else {
    merged.push(...doorFan)
  }

  if (zhishiRaw === 5) warnings.push('值使移宫落中五，按寄坤处理')

  return {
    solarText: `${solar.getYear()}-${String(solar.getMonth()).padStart(2, '0')}-${String(solar.getDay()).padStart(2, '0')} ${String(solar.getHour()).padStart(2, '0')}:${String(solar.getMinute()).padStart(2, '0')}`,
    lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
    dayGanZhi: dayGanzhi,
    timeGanZhi: timeGanzhi,
    dunType,
    yuan,
    juNumber,
    activeJie: jieName,
    nextJie: nextJie?.getName() ?? null,
    xunshou: timeXun,
    hiddenYi,
    timeStem: visibleTimeGan,
    zhifu: { star: zhifuStar, palace: timePalace },
    zhishi: { door: zhishiDoor, palace: zhishiPalace },
    kongwang: kwBranches,
    kongwangPalaces: kwPalaces,
    hourYima: yimaOf(timeGanzhi[1]),
    dayYima: yimaOf(dayGanzhi[1]),
    palaces,
    patterns: merged,
    warnings,
  }
}

export function qimenToText(c: QimenChart, topic?: string): string {
  const L: string[] = []
  L.push(`起局时间：${c.solarText}（${c.lunarText}）`)
  if (topic) L.push(`所问之事：${topic}`)
  L.push(`局式：${c.dunType}${c.juNumber}局 · ${c.activeJie}${c.yuan} · 时家转盘奇门`)
  L.push(`四柱：日${c.dayGanZhi} 时${c.timeGanZhi}；旬首${c.xunshou}（遁${c.hiddenYi}）；时干${c.timeStem}`)
  L.push(`值符：${c.zhifu.star} 落 ${c.zhifu.palace} 宫；值使：${c.zhishi.door} 落 ${c.zhishi.palace} 宫`)
  L.push(`时空亡：${c.kongwang.join('、')}（${c.kongwangPalaces.map((p) => PALACE_INFO[p].name).join('、')}）`)
  L.push(`驿马：时马在${c.hourYima.branch ?? '—'}（${c.hourYima.palace ?? '—'}宫）｜日马在${c.dayYima.branch ?? '—'}（${c.dayYima.palace ?? '—'}宫）`)
  L.push('')
  L.push('九宫（按坎1→离9）：')
  for (const p of c.palaces) {
    if (p.isCenter) {
      L.push(`  ${p.name}：地盘${p.earthStem}（${p.note ?? ''}）`)
      continue
    }
    L.push(
      `  ${p.name}(${p.direction}·${p.element})：天盘${p.skyStems.join('/')||'—'} 地盘${p.earthStem}｜${p.star}${p.hostedStar ? '+天禽' : ''}｜${p.door}｜${p.god}${p.flags.length ? '｜' + p.flags.join('/') : ''}`,
    )
  }
  if (c.patterns.length) {
    L.push('')
    L.push('自动检出格局：' + c.patterns.map((p) => `${p.name}@${p.palace}宫(${p.detail})`).join('；'))
  }
  if (c.warnings.length) L.push(`\n盘面提示：${c.warnings.join('；')}`)
  return L.join('\n')
}

export const PALACE_LABELS = PALACE_INFO
