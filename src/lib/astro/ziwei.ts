/**
 * 紫微斗数（三合派）。
 *
 * 排盘交给 iztro —— 与 Numerologist_skills 的 ziwei_cli.py 同一口径（三合派、
 * 命宫由生月逆数生时定、五行局起大限）。命宫/夫妻宫位置已与原脚本人工核对一致。
 */
import { astro } from 'iztro'
import { Solar, Lunar } from 'lunar-javascript'

export interface ZiweiStar {
  name: string
  type: string
  brightness?: string
  mutagen?: string
}

export interface ZiweiPalace {
  index: number
  name: string
  heavenlyStem: string
  earthlyBranch: string
  isBodyPalace: boolean
  isOriginalPalace: boolean
  majorStars: ZiweiStar[]
  minorStars: ZiweiStar[]
  adjectiveStars: ZiweiStar[]
  changsheng: string
  decadal: { range: [number, number]; ganZhi: string } | null
  ages: number[]
}

export interface ZiweiChart {
  solarText: string
  lunarText: string
  chineseDate: string
  timeLabel: string
  zodiac: string
  sign: string
  fiveElementsClass: string
  soul: string
  body: string
  soulPalaceBranch: string
  bodyPalaceBranch: string
  palaces: ZiweiPalace[]
  /** 命宫 / 夫妻宫 / 官禄宫 / 财帛宫 的宫名索引 */
  keyPalaces: { life?: number; spouse?: number; career?: number; wealth?: number }
  gender: '男' | '女'
  warnings: string[]
}

export interface ZiweiInput {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: '男' | '女'
  calendar: 'solar' | 'lunar'
  leap?: boolean
}

const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export function hourToTimeIndex(hour: number, minute = 0): number {
  if (hour === 23) return 12
  return Math.floor((hour + 1) / 2)
}

export function calcZiwei(input: ZiweiInput): ZiweiChart {
  const warnings: string[] = []
  let y = input.year, m = input.month, d = input.day
  if (input.calendar === 'lunar') {
    const s = Lunar.fromYmdHms(input.year, input.leap ? -input.month : input.month, input.day, input.hour, input.minute, 0).getSolar()
    y = s.getYear(); m = s.getMonth(); d = s.getDay()
  }
  const timeIndex = hourToTimeIndex(input.hour, input.minute)
  if (input.hour === 23) warnings.push('23:00 后出生按晚子时（timeIndex 12）起盘，部分流派以次日子时论，口径需注明')

  const a: any = astro.bySolar(`${y}-${m}-${d}`, timeIndex, input.gender, true, 'zh-CN')

  const palaces: ZiweiPalace[] = (a.palaces || []).map((p: any, i: number) => ({
    index: i,
    name: p.name,
    heavenlyStem: p.heavenlyStem,
    earthlyBranch: p.earthlyBranch,
    isBodyPalace: !!p.isBodyPalace,
    isOriginalPalace: !!p.isOriginalPalace,
    majorStars: (p.majorStars || []).map((s: any) => ({
      name: s.name, type: s.type, brightness: s.brightness, mutagen: s.mutagen,
    })),
    minorStars: (p.minorStars || []).map((s: any) => ({
      name: s.name, type: s.type, brightness: s.brightness, mutagen: s.mutagen,
    })),
    adjectiveStars: (p.adjectiveStars || []).map((s: any) => ({ name: s.name, type: s.type })),
    changsheng: p.changsheng12 || p.changsheng || '',
    decadal: p.decadal
      ? { range: p.decadal.range as [number, number], ganZhi: `${p.decadal.heavenlyStem}${p.decadal.earthlyBranch}` }
      : null,
    ages: p.ages || [],
  }))

  // 按地支固定顺序重排，便于 UI 落宫
  palaces.sort((x, y2) => BRANCH_ORDER.indexOf(x.earthlyBranch) - BRANCH_ORDER.indexOf(y2.earthlyBranch))

  const find = (name: string) => {
    const p = palaces.find((x) => x.name === name)
    return p ? BRANCH_ORDER.indexOf(p.earthlyBranch) : undefined
  }

  return {
    solarText: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')}`,
    lunarText: a.lunarDate,
    chineseDate: a.chineseDate,
    timeLabel: a.time,
    zodiac: a.zodiac,
    sign: a.sign,
    fiveElementsClass: a.fiveElementsClass,
    soul: a.soul,
    body: a.body,
    soulPalaceBranch: a.earthlyBranchOfSoulPalace,
    bodyPalaceBranch: a.earthlyBranchOfBodyPalace,
    palaces,
    keyPalaces: {
      life: find('命宫'),
      spouse: find('夫妻'),
      career: find('官禄'),
      wealth: find('财帛'),
    },
    gender: input.gender,
    warnings,
  }
}

export function ziweiToText(c: ZiweiChart): string {
  const L: string[] = []
  L.push(`公历：${c.solarText}；农历：${c.lunarText}；${c.gender}命`)
  L.push(`四柱：${c.chineseDate}；时辰：${c.timeLabel}`)
  L.push(`五行局：${c.fiveElementsClass}；命主：${c.soul}；身主：${c.body}`)
  L.push(`命宫在${c.soulPalaceBranch}，身宫在${c.bodyPalaceBranch}`)
  L.push('')
  L.push('十二宫：')
  for (const p of c.palaces) {
    const major = p.majorStars.length
      ? p.majorStars.map((s) => `${s.name}${s.brightness ? `(${s.brightness})` : ''}${s.mutagen ? `化${s.mutagen}` : ''}`).join('、')
      : '（无主星）'
    const minor = p.minorStars.map((s) => s.name).join('、')
    const decadal = p.decadal ? `${p.decadal.range[0]}–${p.decadal.range[1]}岁` : '—'
    L.push(
      `  ${p.earthlyBranch}宫 · ${p.name}${p.isBodyPalace ? '（身宫）' : ''}｜${p.heavenlyStem}${p.earthlyBranch}｜主星：${major}${minor ? `｜辅星：${minor}` : ''}｜大限 ${decadal}`,
    )
  }
  if (c.warnings.length) L.push(`\n盘面提示：${c.warnings.join('；')}`)
  return L.join('\n')
}
