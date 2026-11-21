/**
 * 排盘内核自检脚本：npx tsx scripts/verify.ts
 * 输出人工可核对的盘面事实。
 */
import { calcBazi, baziToText } from '../src/lib/astro/bazi'
import { calcQimen, qimenToText } from '../src/lib/astro/qimen'
import { calcZiwei, ziweiToText } from '../src/lib/astro/ziwei'

const b = calcBazi({ year: 1990, month: 5, day: 15, hour: 12, minute: 0, gender: '男', calendar: 'solar' })
console.log('=== 八字 ===')
console.log(baziToText(b))

console.log('\n=== 奇门（2026-11-21 14:30）===')
const q = calcQimen({ year: 2026, month: 11, day: 21, hour: 14, minute: 30 })
console.log(qimenToText(q))

console.log('\n=== 紫微 ===')
const z = calcZiwei({ year: 1990, month: 5, day: 15, hour: 12, minute: 0, gender: '男', calendar: 'solar' })
console.log(ziweiToText(z))
