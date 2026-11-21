/**
 * 姻缘：生肖配对、八字合婚、桃花运、求签、红线测算。
 *
 * 规则取自 yinyuan-skills/references/：
 *   zodiac-compatibility.md（六合/三合/六冲/六害/三刑）
 *   bazi-matching.md（年柱 / 日柱 / 五行互补三段）
 *   taohua-luck.md（本命桃花位）
 *   fortune-sticks.md（100 签，已抽成 src/data/sticks.json）
 */
import { Solar } from 'lunar-javascript'
import { GAN, ZHI, SHENGXIAO, GAN_WUXING, ZHI_WUXING, WUXING_SHENG, WUXING_KE, shiShen, type WuXing } from '../constants'
import { calcBazi, type BaziChart } from '../astro/bazi'
import sticksData from '../../data/sticks.json'

export interface Stick {
  no: number
  level: string
  poem: string[]
  jie: string
  love: string
}

export const STICKS = sticksData as Stick[]

export const LIUHE: [string, string][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]
export const SANHE: string[][] = [['申', '子', '辰'], ['寅', '午', '戌'], ['巳', '酉', '丑'], ['亥', '卯', '未']]
export const LIUCHONG: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]
export const LIUHAI: [string, string][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]
export const SANXING: string[][] = [['寅', '巳', '申'], ['丑', '戌', '未'], ['子', '卯'], ['辰'], ['午'], ['酉'], ['亥']]

const pairEq = (p: [string, string], a: string, b: string) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a)
const zhiOfYear = (y: number) => ZHI[(y - 4) % 12]

export interface ZodiacPair {
  a: { year: number; zhi: string; shengxiao: string }
  b: { year: number; zhi: string; shengxiao: string }
  relation: '六合' | '三合' | '六冲' | '六害' | '三刑' | '普通'
  score: number
  detail: string
  advice: string
  dims: { label: string; value: number }[]
}

export function zodiacPair(yearA: number, yearB: number): ZodiacPair {
  const a = { year: yearA, zhi: zhiOfYear(yearA), shengxiao: SHENGXIAO[(yearA - 4) % 12] }
  const b = { year: yearB, zhi: zhiOfYear(yearB), shengxiao: SHENGXIAO[(yearB - 4) % 12] }

  let relation: ZodiacPair['relation'] = '普通'
  let score = 72
  let detail = `${a.zhi}与${b.zhi}之间没有明显的合冲关系，属于需要靠相处去磨合的普通配对。`
  let advice = '没有天生的助力，也没有天生的阻力——这类配对的上限完全由沟通质量决定。'

  if (LIUHE.some((p) => pairEq(p, a.zhi, b.zhi))) {
    relation = '六合'; score = 95
    detail = `${a.zhi}${b.zhi}六合，是十二地支里最紧密的一对，属于「见面就熟」的组合。`
    advice = '默契是天生的，但默契不等于理解。别把「他应该懂」当成不用说的理由。'
  } else if (SANHE.some((g) => g.includes(a.zhi) && g.includes(b.zhi))) {
    relation = '三合'; score = 88
    detail = `${a.zhi}${b.zhi}同属一个三合局，节奏与价值观容易对上，是很好的搭档型配对。`
    advice = '合拍之处在目标感，摩擦之处在谁说了算。分工说清楚，这段关系会很省力。'
  } else if (LIUCHONG.some((p) => pairEq(p, a.zhi, b.zhi))) {
    relation = '六冲'; score = 48
    detail = `${a.zhi}${b.zhi}相冲，一个要动一个要守，冲突会以「节奏不同」的形式反复出现。`
    advice = '冲不是不能在一起，是必须给彼此留出独处的空间。硬要同步，两边都会累。'
  } else if (LIUHAI.some((p) => pairEq(p, a.zhi, b.zhi))) {
    relation = '六害'; score = 58
    detail = `${a.zhi}${b.zhi}相害，问题不在明面上的争吵，而在暗处的消耗与误解。`
    advice = '把「我不说你也该懂」换成「我现在需要什么」，这句能解掉八成的害。'
  } else if (SANXING.some((g) => g.length > 1 && g.includes(a.zhi) && g.includes(b.zhi))) {
    relation = '三刑'; score = 52
    detail = `${a.zhi}${b.zhi}入刑，关系里容易出现拉扯、翻旧账、谁也不肯先低头的局面。`
    advice = '刑的核心是「较真」。约定一个规则：吵架不过夜，不翻三个月前的事。'
  }

  const dims = [
    { label: '默契', value: Math.min(98, score + (relation === '六合' || relation === '三合' ? 4 : -6)) },
    { label: '长久', value: Math.min(96, Math.round(score * 0.92) + 6) },
    { label: '摩擦', value: Math.max(12, 100 - score + 10) },
    { label: '成长', value: Math.round(60 + score * 0.3) },
  ]

  return { a, b, relation, score, detail, advice, dims }
}

/* ------------------------------ 八字合婚 ------------------------------ */

export interface HehunResult {
  a: BaziChart
  b: BaziChart
  score: number
  sections: { title: string; rating: number; text: string }[]
  dayMasterRelation: string
  complement: string
  total: number
}

const GAN_HE: [string, string, WuXing][] = [
  ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'], ['丁', '壬', '木'], ['戊', '癸', '火'],
]

export function hehun(a: BaziChart, b: BaziChart): HehunResult {
  const sections: HehunResult['sections'] = []
  const da = a.pillars.find((p) => p.key === 'day')!
  const db = b.pillars.find((p) => p.key === 'day')!
  const ya = a.pillars[0]
  const yb = b.pillars[0]

  // 年柱
  let yearRating = 3
  let yearText = `年柱 ${ya.gan}${ya.zhi} × ${yb.gan}${yb.zhi}：两支无明显合冲，根基平顺。`
  const zPair = zodiacPair(a.input.year, b.input.year)
  if (zPair.relation === '六合' || zPair.relation === '三合') {
    yearRating = 5
    yearText = `年柱 ${ya.zhi}${yb.zhi}${zPair.relation}，两家根基相投。${zPair.detail}`
  } else if (zPair.relation === '六冲' || zPair.relation === '六害') {
    yearRating = 2
    yearText = `年柱 ${ya.zhi}${yb.zhi}${zPair.relation}，家庭背景或生活习惯的差异会比较明显。${zPair.advice}`
  }
  sections.push({ title: '年柱 · 根基', rating: yearRating, text: yearText })

  // 日柱：日主关系
  const ea = GAN_WUXING[da.gan]
  const eb = GAN_WUXING[db.gan]
  let dmRelation = ''
  let dmRating = 3
  const he = GAN_HE.find(([x, y]) => (x === da.gan && y === db.gan) || (x === db.gan && y === da.gan))
  if (he) {
    dmRelation = `${da.gan}${db.gan}天干相合，化${he[2]}。两人之间有天然的吸引力，容易一见如故。`
    dmRating = 5
  } else if (ea === eb) {
    dmRelation = `日主同为${ea}，像照镜子：理解得快，也容易在同一处卡住。`
    dmRating = 4
  } else if (WUXING_SHENG[ea] === eb) {
    dmRelation = `你的日主${ea}生对方${eb}，你在这段关系里更常扮演付出的一方。`
    dmRating = 4
  } else if (WUXING_SHENG[eb] === ea) {
    dmRelation = `对方日主${eb}生你${ea}，你更容易被照顾，也更依赖这段关系。`
    dmRating = 4
  } else if (WUXING_KE[ea] === eb || WUXING_KE[eb] === ea) {
    dmRelation = `日主${ea}与${eb}相克，摩擦来自「谁的方式更对」这种争论。克不是不好，是需要翻译。`
    dmRating = 2
  }
  sections.push({ title: '日柱 · 本人', rating: dmRating, text: dmRelation })

  // 配偶宫（日支）
  const dayZhiA = da.zhi
  const dayZhiB = db.zhi
  let gongRating = 3
  let gongText = `配偶宫 ${dayZhiA} × ${dayZhiB}：无刑冲合害，关系走向取决于日常经营。`
  if (LIUHE.some((p) => pairEq(p, dayZhiA, dayZhiB))) {
    gongRating = 5
    gongText = `配偶宫 ${dayZhiA}${dayZhiB}六合，两人在亲密关系里的需求容易对上。`
  } else if (LIUCHONG.some((p) => pairEq(p, dayZhiA, dayZhiB))) {
    gongRating = 2
    gongText = `配偶宫 ${dayZhiA}${dayZhiB}相冲，作息、家庭分工或亲密节奏上需要重新谈一次。`
  } else if (LIUHAI.some((p) => pairEq(p, dayZhiA, dayZhiB))) {
    gongRating = 3
    gongText = `配偶宫 ${dayZhiA}${dayZhiB}相害，容易把不满攒着不说，最后一次性爆发。`
  }
  sections.push({ title: '日支 · 配偶宫', rating: gongRating, text: gongText })

  // 五行互补
  const lackA = (Object.keys(a.wuxingCount) as WuXing[]).filter((w) => a.wuxingCount[w] === 0)
  const lackB = (Object.keys(b.wuxingCount) as WuXing[]).filter((w) => b.wuxingCount[w] === 0)
  const fill = lackA.filter((w) => b.wuxingCount[w] >= 2).concat(lackB.filter((w) => a.wuxingCount[w] >= 2))
  const compRating = fill.length >= 2 ? 5 : fill.length === 1 ? 4 : 3
  const complement = fill.length
    ? `你缺${lackA.join('、') || '无'}，对方缺${lackB.join('、') || '无'}；互补处：${[...new Set(fill)].join('、')}。`
    : `双方五行分布相近（你缺${lackA.join('、') || '无'}，对方缺${lackB.join('、') || '无'}），互补性一般，同频感更强。`
  sections.push({ title: '五行 · 互补', rating: compRating, text: complement })

  const total = Math.round((sections.reduce((s, x) => s + x.rating, 0) / (sections.length * 5)) * 100)
  return { a, b, score: total, sections, dayMasterRelation: dmRelation, complement, total }
}

/* ------------------------------ 桃花 ------------------------------ */

const TAOHUA_BY_GROUP: Record<string, string> = {
  申子辰: '酉', 寅午戌: '卯', 巳酉丑: '午', 亥卯未: '子',
}
const GROUP_OF: Record<string, string> = {
  申: '申子辰', 子: '申子辰', 辰: '申子辰', 寅: '寅午戌', 午: '寅午戌', 戌: '寅午戌',
  亥: '亥卯未', 卯: '亥卯未', 未: '亥卯未', 巳: '巳酉丑', 酉: '巳酉丑', 丑: '巳酉丑',
}
const ZHI_DIR: Record<string, string> = {
  子: '正北', 丑: '东北', 寅: '东北', 卯: '正东', 辰: '东南', 巳: '东南',
  午: '正南', 未: '西南', 申: '西南', 酉: '正西', 戌: '西北', 亥: '西北',
}

export interface TaohuaResult {
  birthYear: number
  yearZhi: string
  peachZhi: string
  peachDir: string
  yearPeach: { year: number; ganZhi: string; zhi: string; active: boolean; note: string }[]
  months: { month: number; label: string; stars: number; note: string }[]
  type: string
  advice: string
}

export function taohua(birthYear: number, gender: '男' | '女', currentYear = new Date().getFullYear()): TaohuaResult {
  const yz = zhiOfYear(birthYear)
  const group = GROUP_OF[yz]
  const peach = TAOHUA_BY_GROUP[group]
  const yearPeach = Array.from({ length: 6 }, (_, i) => {
    const y = currentYear - 1 + i
    const z = zhiOfYear(y)
    const gz = GAN[(y - 4) % 10] + z
    const active = z === peach || GROUP_OF[z] === group
    return {
      year: y, ganZhi: gz, zhi: z, active,
      note: z === peach ? '桃花临太岁，感情事最容易起波澜' : active ? '同气之年，人缘与介绍机会偏多' : '平年，桃花靠主动经营',
    }
  })
  const months = Array.from({ length: 12 }, (_, i) => {
    const mz = ZHI[(i + 2) % 12] // 寅月起步
    const stars = mz === peach ? 4 : GROUP_OF[mz] === group ? 3 : LIUHE.some((p) => p.includes(mz) && p.includes(yz)) ? 3 : 2
    return {
      month: i + 1,
      label: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][i],
      stars,
      note: stars === 4 ? '桃花当令' : stars === 3 ? '人缘活跃' : '平稳',
    }
  })
  return {
    birthYear, yearZhi: yz, peachZhi: peach, peachDir: ZHI_DIR[peach],
    yearPeach, months,
    type: `${SHENGXIAO[(birthYear - 4) % 12]}年生人，本命桃花在${peach}（${ZHI_DIR[peach]}）`,
    advice: `多往${ZHI_DIR[peach]}方向的场合走：那边的咖啡馆、书店、朋友的局。${gender === '男' ? '男命看财星，' : '女命看官星，'}配偶星出现的年份往往也伴随工作或生活半径的变化。`,
  }
}

/* ------------------------------ 求签 ------------------------------ */

export function drawStick(name: string, question: string, now = new Date()): { stick: Stick; no: number } {
  const hourIdx = Math.floor(((now.getHours() + 1) % 24) / 2)
  const dayNo = Math.floor(now.getTime() / 86400000)
  const codeSum = (s: string) => Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0)
  const no = ((codeSum(name) + codeSum(question) + hourIdx + dayNo) % 100) + 1
  const stick = STICKS.find((s) => s.no === no) || STICKS[0]
  return { stick, no }
}

/* ------------------------------ 红线测算 ------------------------------ */

export interface RedThreadResult {
  bazi: BaziChart
  spousePalace: { zhi: string; wuxing: WuXing; hidden: string[]; note: string }
  peach: TaohuaResult
  spouseStar: string
  windows: { year: number; ganZhi: string; score: number; note: string }[]
}

export function redThread(input: Parameters<typeof calcBazi>[0], currentYear = new Date().getFullYear()): RedThreadResult {
  const bazi = calcBazi(input)
  const day = bazi.pillars.find((p) => p.key === 'day')!
  const gender = input.gender
  const spouseStar = gender === '男' ? '财星（正财/偏财）' : '官星（正官/七杀）'
  const spousePalace = {
    zhi: day.zhi,
    wuxing: ZHI_WUXING[day.zhi],
    hidden: day.hidden.map((h) => `${h.gan}(${h.shen})`),
    note: `日支为配偶宫，${day.zhi}属${ZHI_WUXING[day.zhi]}，藏${day.hidden.map((h) => h.gan).join('、')}`,
  }
  const peach = taohua(input.year, input.gender, currentYear)
  const windows = bazi.daYun
    .flatMap((d) => d.liuNian)
    .filter((n) => n.year >= currentYear - 1 && n.year <= currentYear + 6)
    .map((n) => {
      const z = n.ganZhi[1]
      const g = n.ganZhi[0]
      const gs = shiShen(day.gan, g)
      let score = 40
      const notes: string[] = []
      if (z === peach.peachZhi) { score += 25; notes.push('流年支临本命桃花') }
      if (LIUHE.some((p) => pairEq(p, z, day.zhi))) { score += 30; notes.push('流年与配偶宫六合') }
      if (LIUCHONG.some((p) => pairEq(p, z, day.zhi))) { score += 8; notes.push('冲动配偶宫，主变动') }
      if (gs === (gender === '男' ? '正财' : '正官')) { score += 25; notes.push(`流年天干为${gs}，配偶星透出`) }
      if (gs === (gender === '男' ? '偏财' : '七杀')) { score += 15; notes.push(`流年天干为${gs}`) }
      return {
        year: n.year, ganZhi: n.ganZhi, score: Math.min(99, score),
        note: notes.length ? notes.join('；') : '无明显配偶星或合冲，属平年',
      }
    })
    .sort((a, b) => b.score - a.score)

  return { bazi, spousePalace, peach, spouseStar, windows }
}
