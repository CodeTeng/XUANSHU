import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { calcZiwei, ziweiToText, hourToTimeIndex, type ZiweiInput } from '../lib/astro/ziwei'
import { useUi } from '../lib/uiStore'
import { ziweiPrompt } from '../lib/prompts'
import ReadingPanel, { useReading } from '../components/ReadingPanel'
import { SectionTitle, Field, SegTabs, Badge, Reveal } from '../components/ui'

const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
/** 传统盘式：巳午未申 在顶行，寅丑子亥 在底行 */
const POS: Record<string, [number, number]> = {
  巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4],
  辰: [2, 1], 酉: [2, 4],
  卯: [3, 1], 戌: [3, 4],
  寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4],
}

const KEY_COLOR: Record<string, string> = {
  命宫: '#f2dcae',
  夫妻: '#d4736b',
  官禄: '#45c2b0',
  财帛: '#c9a227',
}

export default function ZiweiPage() {
  const openSettings = useUi((s) => s.openSettings)
  const [form, setForm] = useState({
    gender: '男' as '男' | '女',
    calendar: 'solar' as 'solar' | 'lunar',
    year: 1990,
    month: 5,
    day: 15,
    hour: 12,
    minute: 0,
    leap: false,
  })
  const [question, setQuestion] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const reading = useReading()

  const input: ZiweiInput = {
    year: form.year, month: form.month, day: form.day,
    hour: form.hour, minute: form.minute, gender: form.gender,
    calendar: form.calendar, leap: form.leap,
  }

  const chart = useMemo(() => {
    try {
      return { ok: true as const, data: calcZiwei(input) }
    } catch (e: any) {
      return { ok: false as const, error: e?.message || '排盘失败' }
    }
  }, [form.year, form.month, form.day, form.hour, form.minute, form.gender, form.calendar, form.leap])

  const start = () => {
    if (!chart.ok) return
    const p = ziweiPrompt({ chartText: ziweiToText(chart.data), userQuestion: question })
    reading.run(p.system, p.user)
  }

  const pickedPalace = chart.ok ? chart.data.palaces.find((p) => p.earthlyBranch === picked) : null

  // 当前虚岁落在哪一步大限
  const currentDecadal = useMemo(() => {
    if (!chart.ok) return null
    const age = new Date().getFullYear() - form.year + 1
    return chart.data.palaces.find((p) => p.decadal && age >= p.decadal.range[0] && age <= p.decadal.range[1]) ?? null
  }, [chart, form.year])

  /** 空宫借对宫 */
  const oppositeOf = (branch: string) => {
    if (!chart.ok) return null
    const idx = (BRANCH_ORDER.indexOf(branch) + 6) % 12
    return chart.data.palaces.find((p) => p.earthlyBranch === BRANCH_ORDER[idx]) ?? null
  }

  /** 命宫三方四正：命、财帛、官禄、迁移 */
  const sanFang = useMemo(() => {
    if (!chart.ok) return null
    const names = ['命宫', '财帛', '官禄', '迁移']
    return names
      .map((n) => chart.data.palaces.find((p) => p.name === n))
      .filter(Boolean)
      .map((p) => ({
        name: p!.name,
        branch: p!.earthlyBranch,
        stars: p!.majorStars.length
          ? p!.majorStars.map((s) => `${s.name}${s.brightness ? `(${s.brightness})` : ''}`).join('、')
          : `空宫·借${oppositeOf(p!.earthlyBranch)?.majorStars.map((s) => s.name).join('、') ?? '对宫'}`,
        good: p!.minorStars.some((s) => ['左辅', '右弼', '天魁', '天钺', '文昌', '文曲', '禄存', '天马'].includes(s.name)),
        bad: p!.minorStars.some((s) => ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'].includes(s.name)),
      }))
  }, [chart])

  return (
    <div>
      <div className="mb-8">
        <div className="mono text-[0.6rem] tracking-[0.32em] text-[#6a5730]">ZIWEI DOUSHU · 三合派</div>
        <h1 className="mt-2 serif text-[1.9rem] tracking-[0.1em] text-[#f2dcae]">紫微斗数</h1>
        <p className="mt-2 max-w-[600px] text-[0.8rem] leading-relaxed text-[#8b8899]">
          十二宫安星，命宫由生月逆数生时定，五行局起大限。庙旺落陷与生年四化按三合派口径，与 ziwei_cli.py 的命宫位置已逐例核对。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="panel corner-frame p-5">
            <SectionTitle index="INPUT" title="生辰" />
            <div className="space-y-4">
              <Field label="性别">
                <SegTabs
                  value={form.gender}
                  onChange={(v) => setForm({ ...form, gender: v })}
                  options={[{ value: '男', label: '男命' }, { value: '女', label: '女命' }]}
                />
              </Field>
              <Field label="历法">
                <SegTabs
                  value={form.calendar}
                  onChange={(v) => setForm({ ...form, calendar: v })}
                  options={[{ value: 'solar', label: '公历' }, { value: 'lunar', label: '农历' }]}
                />
              </Field>
              <div className="grid-form">
                <Field label="年">
                  <select className="field" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
                    {Array.from({ length: 101 }, (_, i) => 1920 + i).reverse().map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </Field>
                <Field label="月 / 日">
                  <div className="flex gap-2">
                    <select className="field min-w-0 flex-1" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="field min-w-0 flex-1" value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </Field>
              </div>
              <Field label="出生时辰" hint={`对应索引 ${hourToTimeIndex(form.hour)}：${form.hour === 23 ? '晚子时' : BRANCH_ORDER[Math.floor(((form.hour + 1) % 24) / 2)] + '时'}`}>
                <select className="field" value={form.hour} onChange={(e) => setForm({ ...form, hour: Number(e.target.value) })}>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00 · {h === 23 ? '晚子时' : BRANCH_ORDER[Math.floor(((h + 1) % 24) / 2)] + '时'}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="hairline" />
              <Field label="想问的事（可选）">
                <textarea className="field min-h-[72px] resize-y" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="如：今年适合换工作吗" />
              </Field>
              <button onClick={start} disabled={!chart.ok || reading.status === 'streaming'} className="btn w-full">
                {reading.status === 'streaming' ? '推演中…' : '开始推演'}
              </button>
            </div>
          </div>

          {chart.ok && (
            <div className="panel-flat space-y-2 p-4 text-[0.72rem]">
              <div className="flex justify-between"><span className="text-[#6f6c7d]">五行局</span><span className="text-[#d8b06a]">{chart.data.fiveElementsClass}</span></div>
              <div className="flex justify-between"><span className="text-[#6f6c7d]">命主 / 身主</span><span className="text-[#c9b28a]">{chart.data.soul} / {chart.data.body}</span></div>
              <div className="flex justify-between"><span className="text-[#6f6c7d]">命宫 / 身宫</span><span className="text-[#c9b28a]">{chart.data.soulPalaceBranch} / {chart.data.bodyPalaceBranch}</span></div>
              <div className="flex justify-between"><span className="text-[#6f6c7d]">四柱</span><span className="mono text-[0.68rem] text-[#a9a6b8]">{chart.data.chineseDate}</span></div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {chart.ok && (
            <div className="panel corner-frame p-4 sm:p-5">
              <SectionTitle
                index="CHART"
                title="十二宫"
                desc="点击任一宫查看星曜详情 · 金=命宫 朱=夫妻 青=官禄 黄=财帛"
                right={<Badge color="#8a6f3c">{chart.data.timeLabel}</Badge>}
              />

              <div className="relative mx-auto grid w-full max-w-[760px] auto-rows-[104px] gap-1 sm:auto-rows-[140px] lg:auto-rows-[158px]" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
                {/* 中央信息区 */}
                <div className="col-start-2 col-end-4 row-start-2 row-end-4 flex flex-col items-center justify-center border border-[rgba(216,176,106,0.18)] bg-[radial-gradient(circle_at_50%_40%,rgba(216,176,106,0.08),transparent_70%)] p-3 text-center">
                  <div className="serif text-[1.6rem] tracking-[0.2em] text-[#f2dcae]">{chart.data.soul}</div>
                  <div className="mt-1 text-[0.6rem] tracking-[0.2em] text-[#8a6f3c]">命主</div>
                  <div className="mt-3 text-[0.68rem] text-[#a9a6b8]">{chart.data.fiveElementsClass}</div>
                  <div className="mt-1.5 text-[0.62rem] leading-relaxed text-[#6f6c7d]">
                    命宫 {chart.data.soulPalaceBranch} · 身宫 {chart.data.bodyPalaceBranch}
                  </div>
                  <div className="mt-2.5 flex flex-wrap justify-center gap-1">
                    {chart.data.palaces.filter((p) => p.majorStars.some((s) => s.mutagen)).map((p) => (
                      <span key={p.earthlyBranch} className="text-[0.56rem] text-[#b8766a]">
                        {p.earthlyBranch}宫{p.majorStars.filter((s) => s.mutagen).map((s) => `${s.name}化${s.mutagen}`).join(' ')}
                      </span>
                    ))}
                  </div>
                  {currentDecadal && (
                    <div className="mt-3 border-t border-white/8 pt-2.5 text-[0.6rem] text-[#a9a6b8]">
                      当前大限 · <span className="text-[#45c2b0]">{currentDecadal.name}</span>
                      <span className="mono ml-1.5 text-[#6f6c7d]">{currentDecadal.decadal?.range[0]}–{currentDecadal.decadal?.range[1]} 岁</span>
                    </div>
                  )}
                </div>

                {chart.data.palaces.map((p, i) => {
                  const [row, col] = POS[p.earthlyBranch]
                  const isKey = ['命宫', '夫妻', '官禄', '财帛'].includes(p.name)
                  const kc = KEY_COLOR[p.name]
                  const on = picked === p.earthlyBranch
                  return (
                    <motion.button
                      key={p.earthlyBranch}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.035, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => setPicked(on ? null : p.earthlyBranch)}
                      className="relative h-full overflow-hidden border p-1.5 text-left transition-all duration-300 sm:p-2"
                      style={{
                        gridRow: row,
                        gridColumn: col,
                        borderColor: on ? 'rgba(242,220,174,0.7)' : isKey ? `${kc}44` : 'rgba(255,255,255,0.07)',
                        background: on ? 'rgba(242,220,174,0.09)' : isKey ? `${kc}0a` : 'rgba(10,10,16,0.6)',
                        boxShadow: on ? '0 0 30px -10px rgba(242,220,174,0.6)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[0.58rem] tracking-wider" style={{ color: isKey ? kc : '#77748a' }}>{p.name}</span>
                        <span className="mono text-[0.52rem] text-[#5c5969]">{p.heavenlyStem}{p.earthlyBranch}</span>
                      </div>

                      <div className="mt-1 space-y-0.5">
                        {p.majorStars.length ? (
                          p.majorStars.map((s) => (
                            <div key={s.name} className="flex items-baseline gap-1">
                              <span
                                className="serif text-[0.92rem] leading-tight sm:text-[1.02rem]"
                                style={{
                                  color: s.brightness === '庙' || s.brightness === '旺' ? '#f2dcae' : s.brightness === '陷' ? '#8b8899' : '#d8c9a8',
                                  textShadow: s.brightness === '庙' ? '0 0 14px rgba(242,220,174,0.4)' : 'none',
                                }}
                              >
                                {s.name}
                              </span>
                              {s.brightness && <span className="text-[0.5rem] text-[#6f6c7d]">{s.brightness}</span>}
                              {s.mutagen && <span className="text-[0.5rem] text-[#b8766a]">化{s.mutagen}</span>}
                            </div>
                          ))
                        ) : (
                          <span className="text-[0.58rem] text-[#5c5969]">
                            空宫
                            {(() => {
                              const op = oppositeOf(p.earthlyBranch)
                              const stars = op?.majorStars.map((s) => s.name).join('、')
                              return stars ? <span className="ml-1 text-[#6f6c7d]">借{stars}</span> : null
                            })()}
                          </span>
                        )}
                      </div>

                      {p.minorStars.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-x-1 text-[0.52rem] leading-tight text-[#7d7a8d]">
                          {p.minorStars.slice(0, 4).map((s) => <span key={s.name}>{s.name}</span>)}
                        </div>
                      )}

                      <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between">
                        <span className="mono text-[0.48rem] text-[#5c5969]">{p.decadal ? `${p.decadal.range[0]}-${p.decadal.range[1]}` : ''}</span>
                        {p.isBodyPalace && <span className="text-[0.48rem] text-[#8a6f3c]">身</span>}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {pickedPalace && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 border border-white/8 bg-[#0a0a12]/80 p-3.5"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="serif text-[0.95rem] text-[#f2dcae]">{pickedPalace.name}</span>
                    <span className="mono text-[0.6rem] text-[#6f6c7d]">{pickedPalace.heavenlyStem}{pickedPalace.earthlyBranch}</span>
                    {pickedPalace.isBodyPalace && <Badge color="#8a6f3c">身宫</Badge>}
                    {pickedPalace.decadal && <Badge color="#45c2b0">大限 {pickedPalace.decadal.range[0]}–{pickedPalace.decadal.range[1]} 岁</Badge>}
                  </div>
                  <div className="grid gap-2 text-[0.7rem] leading-relaxed sm:grid-cols-3">
                    <div>
                      <span className="text-[#6f6c7d]">主星 · </span>
                      <span className="text-[#d8c9a8]">
                        {pickedPalace.majorStars.length
                          ? pickedPalace.majorStars.map((s) => `${s.name}${s.brightness ? `(${s.brightness})` : ''}${s.mutagen ? `化${s.mutagen}` : ''}`).join('、')
                          : '无主星，借对宫'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6f6c7d]">辅星 · </span>
                      <span className="text-[#a9a6b8]">{pickedPalace.minorStars.map((s) => s.name).join('、') || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[#6f6c7d]">杂曜 · </span>
                      <span className="text-[#7d7a8d]">{pickedPalace.adjectiveStars.slice(0, 8).map((s) => s.name).join('、') || '—'}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {sanFang && (
                <div className="mt-4 border-t border-white/6 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="mono text-[0.58rem] tracking-[0.22em] text-[#6f6c7d]">命宫三方四正</span>
                    <span className="text-[0.54rem] text-[#5c5969]">命 · 财帛 · 官禄 · 迁移</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {sanFang.map((p) => (
                      <div key={p.name} className="border border-white/7 bg-white/[0.012] px-2 py-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[0.58rem] text-[#8a7a5a]">{p.name}</span>
                          <span className="mono text-[0.52rem] text-[#5c5969]">{p.branch}</span>
                        </div>
                        <div className="mt-1 text-[0.64rem] leading-tight text-[#cfcbdb]">{p.stars}</div>
                        <div className="mt-1 flex gap-1.5">
                          {p.good && <span className="text-[0.48rem] text-[#8ec9a8]">吉星加会</span>}
                          {p.bad && <span className="text-[0.48rem] text-[#c08a82]">煞星同宫</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!chart.ok && <div className="panel p-6 text-[0.8rem] text-[#b8473a]">{chart.error}</div>}

          <ReadingPanel reading={reading} onRetry={start} openSettings={openSettings} title="紫微解读" />
        </div>
      </div>
    </div>
  )
}
