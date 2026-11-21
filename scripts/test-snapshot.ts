/**
 * 排盘快照测试。
 *
 * 做法照 fengshui.skill 的 tests/golden：把固定输入的输出整段存成 JSON，
 * 之后任何改动只要让某一个字变了就会 diff 出来。
 *
 *   npm run test          比对
 *   npm run test -- -u    重新生成快照（改口径时才用，且必须 review diff）
 */
import fs from 'node:fs'
import path from 'node:path'
import { calcBazi } from '../src/lib/astro/bazi'
import { calcQimen } from '../src/lib/astro/qimen'
import { calcZiwei } from '../src/lib/astro/ziwei'
import { feixingChart, mingGua, younian, yunOfYear } from '../src/lib/astro/fengshui'
import { draw } from '../src/lib/tarot/draw'
import { zodiacPair, hehun, drawStick } from '../src/lib/love/match'

const GOLDEN_DIR = path.resolve('scripts/golden')
const update = process.argv.includes('-u') || process.argv.includes('--update')

function pickBazi(c: ReturnType<typeof calcBazi>) {
  return {
    solar: c.solarText,
    lunar: c.lunarText,
    zishi: c.zishi,
    pillars: c.pillars.map((p) => `${p.label}:${p.gan}${p.zhi}/${p.ganShen}/${p.hidden.map((h) => h.gan + h.shen).join('')}/${p.naYin}/${p.diShi}`),
    wuxing: c.wuxingCount,
    relations: {
      gan: c.relations.gan.map((r) => r.label),
      zhi: c.relations.zhi.map((r) => r.label),
      combos: c.relations.combos.map((r) => r.label),
    },
    daYun: c.daYun.map((d) => `${d.ganZhi}:${d.startYear}-${d.endYear}`),
    shensha: c.shenSha.map((s) => `${s.name}@${s.where}`),
    warnings: c.warnings.length,
  }
}

const cases: { name: string; run: () => unknown }[] = [
  {
    name: 'bazi-standard',
    run: () => pickBazi(calcBazi({ year: 1990, month: 5, day: 15, hour: 12, minute: 0, gender: '男', calendar: 'solar' })),
  },
  {
    // 夜子时：日柱必须取次日（甲申），与 pai_pan.py 一致
    name: 'bazi-late-zi',
    run: () => pickBazi(calcBazi({ year: 1995, month: 8, day: 20, hour: 23, minute: 30, gender: '男', calendar: 'solar' })),
  },
  {
    // 立春前后（1990 立春 2/4 11:14），年柱归属易错
    name: 'bazi-lichun-edge',
    run: () => pickBazi(calcBazi({ year: 1990, month: 2, day: 4, hour: 6, minute: 0, gender: '女', calendar: 'solar' })),
  },
  {
    name: 'bazi-unknown-hour',
    run: () => pickBazi(calcBazi({ year: 1988, month: 11, day: 2, hour: 12, minute: 0, gender: '女', calendar: 'solar', unknownHour: true })),
  },
  {
    name: 'qimen-yin-9',
    run: () => {
      const c = calcQimen({ year: 2026, month: 11, day: 21, hour: 15, minute: 0 })
      return {
        ju: `${c.dunType}${c.juNumber}局/${c.activeJie}${c.yuan}`,
        pillars: `${c.dayGanZhi}日 ${c.timeGanZhi}时`,
        zhifu: `${c.zhifu.star}@${c.zhifu.palace}`,
        zhishi: `${c.zhishi.door}@${c.zhishi.palace}`,
        kongwang: c.kongwang.join(''),
        palaces: c.palaces.map((p) => `${p.palace}:${p.god ?? ''}/${p.star ?? ''}/${p.skyStems.join('')}/${p.earthStem ?? ''}/${p.door ?? ''}`),
        patterns: c.patterns.map((p) => `${p.name}@${p.palace}`),
      }
    },
  },
  {
    name: 'qimen-yang-summer',
    run: () => {
      const c = calcQimen({ year: 2024, month: 6, day: 10, hour: 9, minute: 0 })
      return {
        ju: `${c.dunType}${c.juNumber}局/${c.activeJie}${c.yuan}`,
        zhifu: `${c.zhifu.star}@${c.zhifu.palace}`,
        zhishi: `${c.zhishi.door}@${c.zhishi.palace}`,
        palaces: c.palaces.map((p) => `${p.palace}:${p.god ?? ''}/${p.star ?? ''}/${p.skyStems.join('')}/${p.door ?? ''}`),
      }
    },
  },
  {
    name: 'ziwei-standard',
    run: () => {
      const c = calcZiwei({ year: 1990, month: 5, day: 15, hour: 12, minute: 0, gender: '男', calendar: 'solar' })
      return {
        lunar: c.lunarText,
        chinese: c.chineseDate,
        ju: c.fiveElementsClass,
        soul: `${c.soul}/${c.body}`,
        soulPalace: c.soulPalaceBranch,
        palaces: c.palaces.map((p) => `${p.earthlyBranch}${p.name}:${p.majorStars.map((s) => s.name + (s.brightness ?? '') + (s.mutagen ? '化' + s.mutagen : '')).join(',')}`),
      }
    },
  },
  {
    name: 'feixing-8yun-zishan',
    run: () => {
      const c = feixingChart(8, '子', false, 0)
      return {
        patterns: c.patterns,
        main: c.mainPattern,
        yunPan: c.yunPan,
        shanPan: c.shanPan,
        xiangPan: c.xiangPan,
      }
    },
  },
  {
    name: 'bazhai-1990-male',
    run: () => {
      const mg = mingGua(1990, '男')
      return { gua: mg.gua, number: mg.number, group: mg.group, younian: younian(mg.gua) }
    },
  },
  {
    name: 'tarot-seed-locked',
    run: () => {
      const r = draw({ spreadKey: 'three', question: '测试', seed: 12345, timeFactor: 'night', now: new Date(2026, 0, 1, 22, 0) })
      return {
        seed: r.seed,
        tf: r.timeFactor,
        cards: r.drawn.map((d) => `${d.card.name}${d.reversed ? '(逆)' : '(正)'}@${d.position.label}`),
        suits: r.suits,
        relations: r.relations,
      }
    },
  },
  {
    name: 'love-zodiac',
    run: () => {
      const z = zodiacPair(1995, 1996)
      return { relation: z.relation, score: z.score, dims: z.dims }
    },
  },
  {
    name: 'love-hehun',
    run: () => {
      const a = calcBazi({ year: 1995, month: 8, day: 20, hour: 10, minute: 30, gender: '男', calendar: 'solar' })
      const b = calcBazi({ year: 1996, month: 3, day: 12, hour: 14, minute: 0, gender: '女', calendar: 'solar' })
      const h = hehun(a, b)
      return { score: h.score, sections: h.sections.map((s) => `${s.title}:${s.rating}`) }
    },
  },
  {
    name: 'love-stick-fixed-day',
    run: () => {
      const s = drawStick('测试', '什么时候遇到对的人', new Date(2026, 10, 21, 14, 30))
      return { no: s.no, level: s.stick.level }
    },
  },
]

fs.mkdirSync(GOLDEN_DIR, { recursive: true })

let failed = 0
for (const c of cases) {
  const actual = c.run()
  const json = JSON.stringify(actual, null, 2)
  const file = path.join(GOLDEN_DIR, `${c.name}.json`)

  if (update || !fs.existsSync(file)) {
    fs.writeFileSync(file, json + '\n', 'utf8')
    console.log(`  ○ ${c.name} 写入快照`)
    continue
  }
  const expected = fs.readFileSync(file, 'utf8').trim()
  if (expected !== json.trim()) {
    failed++
    console.log(`  ✗ ${c.name} 与快照不一致`)
    const e = expected.split('\n')
    const a = json.trim().split('\n')
    for (let i = 0; i < Math.max(e.length, a.length); i++) {
      if (e[i] !== a[i]) {
        console.log(`      行 ${i + 1}\n      - ${e[i] ?? ''}\n      + ${a[i] ?? ''}`)
        break
      }
    }
  } else {
    console.log(`  ✓ ${c.name}`)
  }
}

if (failed) {
  console.log(`\n${failed} 个用例与快照不一致。若确认是口径变更，用 npm run test -- -u 重新生成并 review diff。`)
  process.exit(1)
}
console.log(`\n全部 ${cases.length} 个用例通过`)
