import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calcBazi, baziToText, type BaziInput } from '../lib/astro/bazi'
import { WUXING, WUXING_COLOR, SHICHEN, SHICHEN_RANGE, CURRENT_YEAR, BIRTH_YEARS, MINUTE_OPTIONS, daysInSolarMonth } from '../lib/constants'
import { useUi } from '../lib/uiStore'
import { baziPrompt } from '../lib/prompts'
import ReadingPanel, { useReading } from '../components/ReadingPanel'
import { SectionTitle, Field, SegTabs, Stat, Badge, Empty, Reveal, Term } from '../components/ui'


/** 同一对柱子之间的多种关系合并成一条弧，颜色取最强者 */
const REL_PRIORITY: Record<string, number> = { 冲: 4, 刑: 3, 自刑: 3, 害: 2, 六合: 1, 合: 1 }

function groupRels(list: { a: string; b: string; kind: string; color: string; dashed: boolean; label: string }[]) {
  const map = new Map<string, { a: string; b: string; kinds: string[]; color: string; dashed: boolean; labels: string[] }>()
  for (const r of list) {
    const key = [r.a, r.b].sort().join('|')
    if (!map.has(key)) {
      map.set(key, { a: r.a, b: r.b, kinds: [], color: r.color, dashed: r.dashed, labels: [] })
    }
    const g = map.get(key)!
    g.kinds.push(r.kind)
    g.labels.push(r.label)
    if ((REL_PRIORITY[r.kind] ?? 0) > (REL_PRIORITY[g.kinds[0]] ?? 0)) {
      g.color = r.color
      g.dashed = r.dashed
    }
  }
  return [...map.values()]
}

export default function BaziPage() {
  const openSettings = useUi((s) => s.openSettings)
  const [form, setForm] = useState({
    name: '',
    gender: '男' as '男' | '女',
    calendar: 'solar' as 'solar' | 'lunar',
    year: CURRENT_YEAR,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    leap: false,
    unknownHour: false,
    place: '',
    question: '',
  })
  const [question, setQuestion] = useState('')
  const reading = useReading()

  // 换了月份导致日期超出当月天数时，回落到月末
  const maxDay = form.calendar === 'solar' ? daysInSolarMonth(form.year, form.month) : 30
  useEffect(() => {
    if (form.day > maxDay) setForm((f) => ({ ...f, day: maxDay }))
  }, [maxDay])

  const input: BaziInput = {
    year: form.year, month: form.month, day: form.day,
    hour: form.hour, minute: form.minute, gender: form.gender,
    calendar: form.calendar, leap: form.leap, unknownHour: form.unknownHour,
    place: form.place,
  }

  const chart = useMemo(() => {
    try {
      return { ok: true as const, data: calcBazi(input) }
    } catch (e: any) {
      return { ok: false as const, error: e?.message || '排盘失败' }
    }
  }, [form.year, form.month, form.day, form.hour, form.minute, form.gender, form.calendar, form.leap, form.unknownHour, form.place])

  const start = () => {
    if (!chart.ok) return
    const ctx = { chartText: baziToText(chart.data), userQuestion: question || form.question }
    const p = baziPrompt(ctx)
    reading.run(p.system, p.user)
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mono text-[0.6rem] tracking-[0.32em] text-[#6a5730]">FOUR PILLARS · 子平</div>
          <h1 className="mt-2 serif text-[1.9rem] tracking-[0.1em] text-[#f2dcae]">四柱八字</h1>
          <p className="mt-2 max-w-[560px] text-[0.8rem] leading-relaxed text-[#8b8899]">
            年柱以立春为界、月柱以节为界、日柱按真太阳时，时柱用五鼠遁。四柱与十神由 lunar-javascript 排出，与 pai_pan.py 同源同解。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ---------------- 左：输入 ---------------- */}
        <div className="space-y-4">
          <div className="panel corner-frame p-5">
            <SectionTitle index="INPUT" title="生辰信息" />
            <div className="space-y-4">
              <div className="grid-form">
                <Field label="姓名">
                  <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="可留空" />
                </Field>
                <Field label="性别">
                  <SegTabs
                    value={form.gender}
                    onChange={(v) => setForm({ ...form, gender: v })}
                    options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]}
                  />
                </Field>
              </div>

              <Field label="历法">
                <SegTabs
                  value={form.calendar}
                  onChange={(v) => setForm({ ...form, calendar: v })}
                  options={[
                    { value: 'solar', label: '公历' },
                    { value: 'lunar', label: '农历' },
                  ]}
                />
              </Field>

              <div className="grid-form">
                <Field label="年">
                  <select className="field" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
                    {BIRTH_YEARS.map((y) => (
                      <option key={y} value={y}>{y}{y === CURRENT_YEAR ? '（今年）' : ''}</option>
                    ))}
                  </select>
                </Field>
                <Field label="月 / 日">
                  <div className="flex gap-2">
                    <select className="field min-w-0 flex-1" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{m} 月</option>
                      ))}
                    </select>
                    <select className="field min-w-0 flex-1" value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}>
                      {Array.from({ length: form.calendar === 'solar' ? daysInSolarMonth(form.year, form.month) : 30 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{d} 日</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>

              {form.calendar === 'lunar' && (
                <label className="flex cursor-pointer items-center gap-2 text-[0.74rem] text-[#a9a6b8]">
                  <input type="checkbox" checked={form.leap} onChange={(e) => setForm({ ...form, leap: e.target.checked })} className="accent-[#d8b06a]" />
                  闰月
                </label>
              )}

              <Field label="出生时间" hint={form.unknownHour ? '时辰不详时只排六字' : `${String(form.hour).padStart(2, '0')}:${String(form.minute).padStart(2, '0')} · ${SHICHEN[Math.floor(((form.hour + 1) % 24) / 2)]}时`}>
                <div className="flex gap-2">
                  <select
                    className="field min-w-0 flex-1"
                    value={form.hour}
                    disabled={form.unknownHour}
                    onChange={(e) => setForm({ ...form, hour: Number(e.target.value) })}
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')} 时</option>
                    ))}
                  </select>
                  <select
                    className="field min-w-0 flex-1"
                    value={form.minute}
                    disabled={form.unknownHour}
                    onChange={(e) => setForm({ ...form, minute: Number(e.target.value) })}
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')} 分</option>
                    ))}
                  </select>
                </div>
              </Field>

              <label className="flex cursor-pointer items-center gap-2 text-[0.74rem] text-[#a9a6b8]">
                <input
                  type="checkbox"
                  checked={form.unknownHour}
                  onChange={(e) => setForm({ ...form, unknownHour: e.target.checked })}
                  className="accent-[#d8b06a]"
                />
                时辰不详（只做六字分析）
              </label>

              <Field label="出生地" hint="用于真太阳时与节气边界提示">
                <input className="field" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="如：辽宁省丹东市" />
              </Field>

              <div className="hairline" />

              <Field label="想问的事（可选）">
                <textarea
                  className="field min-h-[76px] resize-y"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="如：今年换工作合适吗？或者留空做完整分析。"
                />
              </Field>

              <button onClick={start} disabled={!chart.ok || reading.status === 'streaming'} className="btn w-full">
                {reading.status === 'streaming' ? '推演中…' : '开始推演'}
              </button>
              {!chart.ok && <div className="text-[0.7rem] text-[#b8473a]">{chart.error}</div>}
            </div>
          </div>
        </div>

        {/* ---------------- 右：盘面 + 解读 ---------------- */}
        <div className="space-y-5">
          {chart.ok && (
            <>
              {/* 概览 */}
              <div className="panel corner-frame p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="serif text-[1.5rem] text-[#f2dcae]">
                      {chart.data.pillars.map((p) => p.gan + p.zhi).join(' ')}
                    </span>
                    <span className="text-[0.68rem] text-[#77748a]">{chart.data.input.gender}命 · 属{chart.data.zodiac}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={WUXING_COLOR[chart.data.dayMasterWuXing]}>日主 {chart.data.dayMaster}{chart.data.dayMasterWuXing}</Badge>
                    <Badge color="#8a6f3c">{chart.data.lunarText}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="公历" value={<span className="text-[0.86rem]">{chart.data.solarText}</span>} />
                  <Stat label="起运" value={<span className="text-[0.82rem]">{chart.data.startLuck.years} 年 {chart.data.startLuck.months} 月</span>} hint={chart.data.startLuck.forward ? '顺排' : '逆排'} />
                  <Stat
                    label="当前大运"
                    value={
                      chart.data.currentDaYunIndex >= 0 ? (
                        <span className="text-[0.95rem]">{chart.data.daYun[chart.data.currentDaYunIndex]?.ganZhi}</span>
                      ) : (
                        <span className="text-[0.86rem] text-[#8b8899]">未起运</span>
                      )
                    }
                    hint={
                      chart.data.currentDaYunIndex >= 0
                        ? `${chart.data.daYun[chart.data.currentDaYunIndex].startYear}–${chart.data.daYun[chart.data.currentDaYunIndex].endYear}`
                        : `${chart.data.input.year + chart.data.startLuck.years} 年起运`
                    }
                  />
                  <Stat label="命宫 / 胎元" value={<span className="text-[0.86rem]">{chart.data.mingGong} / {chart.data.taiYuan}</span>} />
                </div>
              </div>

              {/* 四柱 */}
              <div className="panel corner-frame p-5">
                <SectionTitle index="PILLARS" title="四柱命盘" desc="逐柱翻开 · 十干十神以日干为「我」推定 · 柱间弧线标合冲刑害" />
                <div className="relative mt-11 mb-11">
                  {/* 天干弧线 */}
                  <svg
                    className="absolute inset-x-0 -top-[66px] hidden h-[66px] w-full sm:block"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {groupRels(chart.data.relations.gan).map((g, i) => {
                      const n = chart.data.pillars.length
                      const ia = chart.data.pillars.findIndex((p) => g.a.startsWith(p.label))
                      const ib = chart.data.pillars.findIndex((p) => g.b.startsWith(p.label))
                      if (ia < 0 || ib < 0) return null
                      const x1 = ((ia + 0.5) / n) * 100
                      const x2 = ((ib + 0.5) / n) * 100
                      const h = 40 + (i % 3) * 20
                      return (
                        <path
                          key={`g${i}`}
                          d={`M ${x1} 100 Q ${(x1 + x2) / 2} ${100 - h} ${x2} 100`}
                          fill="none"
                          stroke={g.color}
                          strokeWidth={1.6}
                          strokeDasharray={g.dashed ? '5 4' : undefined}
                          vectorEffect="non-scaling-stroke"
                          opacity={0.95}
                        >
                          <title>{g.labels.join('；')}</title>
                        </path>
                      )
                    })}
                  </svg>

                  <div className={`grid grid-cols-2 gap-2.5 ${chart.data.pillars.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
                    {chart.data.pillars.map((p, i) => (
                      <Reveal key={p.key} delay={i * 0.09}>
                        <div className="group relative border border-white/8 bg-[#0a0a12]/70 p-3 text-center transition-colors hover:border-[rgba(216,176,106,0.32)]">
                          <div className="flex items-center justify-between text-[0.6rem] tracking-[0.16em] text-[#6f6c7d]">
                            <span>{p.label}</span>
                            <span style={{ color: WUXING_COLOR[p.ganWuXing] }}>{p.ganWuXing}</span>
                          </div>

                          <div className="mt-2 text-[0.66rem] tracking-wide text-[#8a6f3c]"><Term k={p.ganShen}>{p.ganShen}</Term></div>

                          <div className="mt-1.5 flex items-center justify-center gap-1">
                            <span className="serif text-[2.05rem] leading-none" style={{ color: WUXING_COLOR[p.ganWuXing], textShadow: `0 0 22px ${WUXING_COLOR[p.ganWuXing]}55` }}>
                              {p.gan}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-center gap-1">
                            <span className="serif text-[2.05rem] leading-none" style={{ color: WUXING_COLOR[p.zhiWuXing], textShadow: `0 0 22px ${WUXING_COLOR[p.zhiWuXing]}55` }}>
                              {p.zhi}
                            </span>
                          </div>

                          <div className="mt-2.5 space-y-0.5 border-t border-white/6 pt-2">
                            {p.hidden.map((h) => (
                              <div key={h.gan} className="flex items-center justify-between text-[0.6rem]">
                                <span style={{ color: WUXING_COLOR[h.wuxing] }}>{h.gan}</span>
                                <span className="text-[#6f6c7d]">{h.shen}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-2 flex items-center justify-center gap-1 text-[0.58rem] text-[#5c5969]"><Term k="纳音">{p.naYin}</Term><span>·</span><Term k={p.diShi}>{p.diShi}</Term></div>
                        </div>
                      </Reveal>
                    ))}
                  </div>

                  {/* 地支弧线 */}
                  <svg
                    className="absolute inset-x-0 -bottom-[66px] hidden h-[66px] w-full sm:block"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {groupRels(chart.data.relations.zhi).map((g, i) => {
                      const n = chart.data.pillars.length
                      const ia = chart.data.pillars.findIndex((p) => g.a.startsWith(p.label))
                      const ib = chart.data.pillars.findIndex((p) => g.b.startsWith(p.label))
                      if (ia < 0 || ib < 0) return null
                      const x1 = ((ia + 0.5) / n) * 100
                      const x2 = ((ib + 0.5) / n) * 100
                      const h = 40 + (i % 3) * 22
                      return (
                        <path
                          key={`z${i}`}
                          d={`M ${x1} 0 Q ${(x1 + x2) / 2} ${h} ${x2} 0`}
                          fill="none"
                          stroke={g.color}
                          strokeWidth={g.kinds.includes('冲') ? 2 : 1.5}
                          strokeDasharray={g.dashed ? '5 4' : undefined}
                          vectorEffect="non-scaling-stroke"
                          opacity={0.95}
                        >
                          <title>{g.labels.join('；')}</title>
                        </path>
                      )
                    })}
                  </svg>
                </div>

                {/* 关系图例与文字 */}
                {(chart.data.relations.gan.length > 0 || chart.data.relations.zhi.length > 0 || chart.data.relations.combos.length > 0) && (
                  <div className="-mt-2 mb-4 border-t border-white/6 pt-3">
                    <div className="mb-2 flex flex-wrap items-center gap-3 text-[0.56rem] text-[#6f6c7d]">
                      <span className="flex items-center gap-1"><span className="h-[2px] w-4 bg-[#d8b06a]" />合</span>
                      <span className="flex items-center gap-1"><span className="h-[2px] w-4 bg-[#c0392b]" />冲</span>
                      <span className="flex items-center gap-1"><span className="h-0 w-4 border-t border-dashed border-[#b8473a]" />刑 / 害</span>
                      <span className="ml-auto text-[#5c5969]">悬停弧线看关系</span>
                    </div>
                    <div className="space-y-1">
                      {chart.data.relations.gan.map((r, i) => (
                        <div key={`gl${i}`} className="text-[0.66rem] leading-relaxed text-[#a9a6b8]">
                          <span style={{ color: r.color }}>{r.kind}</span> · {r.label}
                        </div>
                      ))}
                      {chart.data.relations.zhi.map((r, i) => (
                        <div key={`zl${i}`} className="text-[0.66rem] leading-relaxed text-[#a9a6b8]">
                          <span style={{ color: r.color }}>{r.kind}</span> · {r.label}
                        </div>
                      ))}
                      {chart.data.relations.combos.map((r, i) => (
                        <div key={`cl${i}`} className="text-[0.66rem] leading-relaxed text-[#c9b28a]">
                          {r.kind} · {r.label}（{r.members.join('、')}）
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 五行 */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="mono text-[0.58rem] tracking-[0.22em] text-[#6f6c7d]">五行分布 · 天干 1 / 地支本气 1</span>
                    <span className="text-[0.58rem] text-[#5c5969]">不做力量打分</span>
                  </div>
                  <div className="flex items-end gap-1.5">
                    {WUXING.map((w, i) => {
                      const n = chart.data.wuxingCount[w]
                      const max = Math.max(1, ...WUXING.map((x) => chart.data.wuxingCount[x]))
                      return (
                        <div key={w} className="flex-1">
                          <div className="flex h-[62px] items-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(6, (n / max) * 100)}%` }}
                              transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                              className="w-full"
                              style={{
                                background: `linear-gradient(180deg, ${WUXING_COLOR[w]}bb, ${WUXING_COLOR[w]}22)`,
                                boxShadow: n > 0 ? `0 0 16px -4px ${WUXING_COLOR[w]}88` : 'none',
                              }}
                            />
                          </div>
                          <div className="mt-1.5 flex items-baseline justify-between">
                            <span className="text-[0.7rem]" style={{ color: WUXING_COLOR[w] }}>{w}</span>
                            <span className="mono text-[0.66rem] text-[#8b8899]">{n}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 space-y-1">
                    {WUXING.filter((w) => chart.data.hiddenDetail[w].length > 0).map((w) => (
                      <div key={w} className="flex gap-2 text-[0.62rem] leading-relaxed">
                        <span style={{ color: WUXING_COLOR[w] }} className="w-4 shrink-0">{w}</span>
                        <span className="text-[#6f6c7d]">{chart.data.hiddenDetail[w].join('、')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 神煞 */}
                {chart.data.shenSha.length > 0 && (
                  <div className="mt-4 border-t border-white/6 pt-3">
                    <div className="mb-2 mono text-[0.58rem] tracking-[0.22em] text-[#6f6c7d]">神煞</div>
                    <div className="flex flex-wrap gap-1.5">
                      {chart.data.shenSha.map((s, i) => (
                        <span
                          key={`${s.name}-${i}`}
                          className="border px-2 py-1 text-[0.64rem]"
                          style={{
                            borderColor: s.nature === '吉' ? 'rgba(78,168,122,0.3)' : s.nature === '凶' ? 'rgba(184,71,58,0.3)' : 'rgba(216,176,106,0.25)',
                            color: s.nature === '吉' ? '#8ec9a8' : s.nature === '凶' ? '#d69a92' : '#c9b28a',
                            background: s.nature === '吉' ? 'rgba(78,168,122,0.06)' : s.nature === '凶' ? 'rgba(184,71,58,0.06)' : 'rgba(216,176,106,0.05)',
                          }}
                          title={s.note}
                        >
                          <Term k={s.name}>{s.name}</Term> <span className="opacity-60">{s.where}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {chart.data.warnings.length > 0 && (
                  <div className="mt-3 border-l border-[rgba(216,176,106,0.3)] bg-[rgba(216,176,106,0.04)] px-3 py-2 text-[0.66rem] leading-relaxed text-[#c9b28a]">
                    {chart.data.warnings.map((w, i) => <div key={i}>· {w}</div>)}
                  </div>
                )}
              </div>

              {/* 大运 */}
              <div className="panel corner-frame p-5">
                <SectionTitle index="LUCK" title="大运" desc={chart.data.currentDaYunIndex >= 0 ? '每十年一步，当前运高亮。横向滚动查看全部' : '尚未起运，下列为未来各步大运'} />
                <div className="relative -mx-1 overflow-x-auto pb-2">
                  <div className="flex gap-1.5 px-1">
                    {chart.data.daYun.map((d, i) => {
                      const cur = i === chart.data.currentDaYunIndex
                      return (
                        <div
                          key={d.index}
                          className={`min-w-[92px] border px-2.5 py-2 text-center transition-all ${cur ? 'border-[rgba(216,176,106,0.6)] bg-[rgba(216,176,106,0.09)]' : 'border-white/7'}`}
                          style={cur ? { boxShadow: '0 0 26px -10px rgba(216,176,106,0.8)' } : undefined}
                        >
                          <div className={`serif text-[1.1rem] ${cur ? 'text-[#f2dcae]' : 'text-[#a9a6b8]'}`}>{d.ganZhi}</div>
                          <div className="mono mt-1 text-[0.56rem] text-[#6f6c7d]">{d.startAge}岁起</div>
                          <div className="mono text-[0.54rem] text-[#5c5969]">{d.startYear}</div>
                          {cur && <div className="mt-1 text-[0.54rem] tracking-widest text-[#8a6f3c]">当前</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
                {chart.data.daYun[chart.data.currentDaYunIndex] && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {chart.data.daYun[chart.data.currentDaYunIndex].liuNian
                      .filter((n) => Math.abs(n.year - chart.data.currentYear) <= 4)
                      .map((n) => (
                        <span
                          key={n.year}
                          className={`mono border px-2 py-1 text-[0.62rem] ${n.year === chart.data.currentYear ? 'border-[rgba(216,176,106,0.4)] text-[#f2dcae]' : 'border-white/7 text-[#77748a]'}`}
                        >
                          {n.year} {n.ganZhi}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}

          {!chart.ok && <Empty>{chart.error}——请检查日期是否合法。</Empty>}

          <ReadingPanel reading={reading} onRetry={start} openSettings={openSettings} title="命理解读" />
        </div>
      </div>
    </div>
  )
}
