import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { calcQimen, qimenToText, QIMEN_GRID, type QimenChart } from '../lib/astro/qimen'
import { useUi } from '../lib/uiStore'
import { qimenPrompt } from '../lib/prompts'
import ReadingPanel, { useReading } from '../components/ReadingPanel'
import { SectionTitle, Field, SegTabs, Badge, Stat, Reveal } from '../components/ui'

const ELEM_COLOR: Record<string, string> = { 水: '#4a7fc1', 土: '#c9a227', 木: '#4ea87a', 金: '#c8cbd4', 火: '#d8553f' }
/** 洛书飞泊顺序：中→乾→兑→艮→离→坎→坤→震→巽 */
const FLY_ORDER = [5, 6, 7, 8, 9, 1, 2, 3, 4]

const PRESET_QUESTIONS = ['近期事业走向', '这笔钱能不能投', '这次面试结果如何', '感情该主动还是等', '出行是否顺利', '找失物']

export default function QimenPage() {
  const openSettings = useUi((s) => s.openSettings)
  const now = new Date()
  const [form, setForm] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: 0,
    calendar: 'solar' as 'solar' | 'lunar',
  })
  const [question, setQuestion] = useState('')
  const [animKey, setAnimKey] = useState(0)
  const reading = useReading()

  const chart = useMemo(() => {
    try {
      return { ok: true as const, data: calcQimen({ ...form }) }
    } catch (e: any) {
      return { ok: false as const, error: e?.message || '起局失败' }
    }
  }, [form.year, form.month, form.day, form.hour, form.minute, form.calendar])

  useEffect(() => {
    if (chart.ok) setAnimKey((k) => k + 1)
  }, [chart.ok, chart.ok ? chart.data.timeGanZhi : '', chart.ok ? chart.data.dayGanZhi : ''])

  const useNow = () => {
    const d = new Date()
    setForm({ ...form, year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: 0 })
  }

  const start = () => {
    if (!chart.ok) return
    const p = qimenPrompt({ chartText: qimenToText(chart.data, question), userQuestion: question })
    reading.run(p.system, p.user)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mono text-[0.6rem] tracking-[0.32em] text-[#6a5730]">QIMEN DUNJIA · 时家转盘</div>
        <h1 className="mt-2 serif text-[1.9rem] tracking-[0.1em] text-[#f2dcae]">奇门遁甲</h1>
        <p className="mt-2 max-w-[620px] text-[0.8rem] leading-relaxed text-[#8b8899]">
          二十四节气定阴阳遁，符头定三元，旬首定值符。中五寄坤、值符加时干、值使逐时移宫——口径与 qimen_cli.py 逐条对应。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="panel corner-frame p-5">
            <SectionTitle index="TIME" title="起局时间" right={<button onClick={useNow} className="text-[0.62rem] text-[#8a6f3c] hover:text-[#f2dcae]">用此刻</button>} />
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Field label="年">
                  <select className="field !px-2" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
                    {Array.from({ length: 41 }, (_, i) => 2006 + i).map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>
                <Field label="月">
                  <select className="field !px-2" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="日">
                  <select className="field !px-2" value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="时辰">
                <select className="field" value={form.hour} onChange={(e) => setForm({ ...form, hour: Number(e.target.value) })}>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00 · {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][Math.floor(((h + 1) % 24) / 2)]}时
                    </option>
                  ))}
                </select>
              </Field>
              <div className="hairline" />
              <Field label="所问之事" hint="奇门讲究一事一局，问得越具体，用神越准">
                <textarea className="field min-h-[80px] resize-y" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="如：下周三的面试能否通过？" />
              </Field>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuestion(q)}
                    className="border border-white/8 px-2 py-1 text-[0.62rem] text-[#8b8899] transition hover:border-[rgba(216,176,106,0.35)] hover:text-[#d8b06a]"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button onClick={start} disabled={!chart.ok || reading.status === 'streaming'} className="btn w-full">
                {reading.status === 'streaming' ? '推演中…' : '起局推演'}
              </button>
              {chart.ok && <button onClick={() => setAnimKey((k) => k + 1)} className="btn btn-ghost w-full !py-1.5 !text-[0.68rem]">重播飞布</button>}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {chart.ok && <NinePalace chart={chart.data} animKey={animKey} />}
          {!chart.ok && <div className="panel p-6 text-[0.8rem] text-[#b8473a]">{chart.error}</div>}

          <ReadingPanel reading={reading} onRetry={start} openSettings={openSettings} title="奇门断事" />
        </div>
      </div>
    </div>
  )
}

function NinePalace({ chart, animKey }: { chart: QimenChart; animKey: number }) {
  const byNo = Object.fromEntries(chart.palaces.map((p) => [p.palace, p]))
  const delayOf = (no: number) => Math.max(0, FLY_ORDER.indexOf(no)) * 0.075

  return (
    <div className="panel corner-frame p-4 sm:p-5">
      {/* 局式信息 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="serif text-[1.35rem] tracking-wider" style={{ color: chart.dunType === '阳遁' ? '#d8b06a' : '#8b7bd8' }}>
            {chart.dunType}{chart.juNumber}局
          </span>
          <span className="text-[0.68rem] text-[#8b8899]">{chart.activeJie}{chart.yuan} · {chart.dayGanZhi}日 {chart.timeGanZhi}时</span>
        </div>
        <div className="flex gap-1.5">
          <Badge color="#45c2b0">值符 {chart.zhifu.star}</Badge>
          <Badge color="#d4736b">值使 {chart.zhishi.door}</Badge>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="旬首" value={chart.xunshou} hint={`遁${chart.hiddenYi}`} />
        <Stat label="时干" value={chart.timeStem} hint={`落 ${chart.zhishi.palace} 宫`} />
        <Stat label="空亡" value={chart.kongwang.join('')} hint={chart.kongwangPalaces.map((p) => `${p}宫`).join(' ')} />
        <Stat label="驿马" value={chart.hourYima.branch ?? '—'} hint={`时马 · ${chart.hourYima.palace ?? '—'}宫`} />
      </div>

      {/* 九宫 */}
      <div className="relative mx-auto max-w-[560px]">
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[80%] w-[80%] rounded-full bg-[radial-gradient(circle,rgba(69,194,176,0.07),transparent_68%)]" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {QIMEN_GRID.map((no) => {
            const p = byNo[no]
            const c = ELEM_COLOR[p.element] || '#d8b06a'
            const isCenter = p.isCenter
            const isZhifu = chart.zhifu.palace === no
            const isZhishi = chart.zhishi.palace === no
            const hasPattern = chart.patterns.some((x) => x.palace === no)
            return (
              <motion.div
                key={`${animKey}-${no}`}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, delay: delayOf(no), ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-square overflow-hidden border p-1.5 sm:p-2"
                style={{
                  borderColor: isZhifu ? 'rgba(69,194,176,0.55)' : isZhishi ? 'rgba(212,115,107,0.5)' : `${c}30`,
                  background: isCenter
                    ? 'radial-gradient(circle, rgba(216,176,106,0.09), rgba(8,8,12,0.9))'
                    : `radial-gradient(circle at 30% 20%, ${c}0e, rgba(8,8,12,0.82))`,
                }}
              >
                {/* 宫名 */}
                <div className="flex items-start justify-between">
                  <span className="text-[0.55rem] tracking-wider" style={{ color: `${c}cc` }}>{p.trigram}</span>
                  <span className="mono text-[0.5rem] text-[#5c5969]">{p.direction}</span>
                </div>

                {isCenter ? (
                  <div className="flex h-[calc(100%-14px)] flex-col items-center justify-center text-center">
                    <div className="serif text-[1.5rem] text-[#c9b28a]">{p.earthStem}</div>
                    <div className="mt-1 text-[0.5rem] leading-tight text-[#5c5969]">中宫寄坤</div>
                    <div className="mt-1 text-[0.5rem] text-[#8a6f3c]">天禽随芮</div>
                  </div>
                ) : (
                  <div className="mt-0.5 flex h-[calc(100%-15px)] flex-col justify-between">
                    {/* 上排：八神 · 九星 */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-[0.58rem] tracking-wide text-[#9a96aa]">{p.god}</span>
                      <span className="truncate text-[0.64rem]" style={{ color: `${c}dd` }}>
                        {p.star}
                        {p.hostedStar && <span className="ml-0.5 text-[0.46rem] text-[#8a6f3c]">禽</span>}
                      </span>
                    </div>

                    {/* 中：天盘干（大） 地盘干（小） */}
                    <div className="flex items-baseline justify-center gap-[3px]">
                      <span
                        className="serif leading-none"
                        style={{ color: '#f5e9d2', fontSize: 'clamp(1.15rem, 2vw, 1.7rem)', textShadow: `0 0 18px ${c}66` }}
                      >
                        {p.skyStems.join('')}
                      </span>
                      <span className="serif text-[0.8rem] leading-none text-[#7d7a8d]">{p.earthStem}</span>
                    </div>

                    {/* 下排：八门 · 标记 */}
                    <div className="flex items-end justify-between gap-1">
                      <span
                        className="text-[0.7rem] tracking-wide"
                        style={{ color: ['开门', '休门', '生门'].includes(p.door || '') ? '#8ec9a8' : '#c08a82' }}
                      >
                        {p.door}
                      </span>
                      <div className="flex gap-0.5">
                        {isZhifu && <span className="text-[0.46rem] text-[#45c2b0]">符</span>}
                        {isZhishi && <span className="text-[0.46rem] text-[#d4736b]">使</span>}
                        {p.flags.includes('空亡') && <span className="text-[0.46rem] text-[#8b7bd8]">空</span>}
                        {hasPattern && <span className="text-[0.46rem] text-[#c9a227]">格</span>}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 格局 */}
      {chart.patterns.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 mono text-[0.58rem] tracking-[0.22em] text-[#6f6c7d]">自动检出格局</div>
          <div className="flex flex-wrap gap-1.5">
            {chart.patterns.map((p, i) => (
              <span
                key={i}
                className="border px-2 py-1 text-[0.64rem]"
                style={{
                  borderColor: p.nature === '吉' ? 'rgba(78,168,122,0.35)' : 'rgba(184,71,58,0.3)',
                  color: p.nature === '吉' ? '#8ec9a8' : '#d69a92',
                  background: p.nature === '吉' ? 'rgba(78,168,122,0.06)' : 'rgba(184,71,58,0.05)',
                }}
                title={p.detail}
              >
                {p.name}
                {p.palace ? ` · ${p.palace}宫` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {chart.warnings.length > 0 && (
        <div className="mt-3 border-l border-[rgba(216,176,106,0.3)] bg-[rgba(216,176,106,0.04)] px-3 py-2 text-[0.66rem] leading-relaxed text-[#c9b28a]">
          {chart.warnings.map((w, i) => <div key={i}>· {w}</div>)}
        </div>
      )}
    </div>
  )
}
