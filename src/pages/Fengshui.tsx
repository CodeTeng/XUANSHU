import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useUi } from '../lib/uiStore'
import { CURRENT_YEAR, BIRTH_YEARS } from '../lib/constants'
import { fengshuiPrompt } from '../lib/prompts'
import ReadingPanel, { useReading } from '../components/ReadingPanel'
import Compass from '../components/Compass'
import { SectionTitle, Field, SegTabs, Badge, Stat, Empty, Reveal } from '../components/ui'
import {
  feixingChart, yunOfYear, yunRange, GRID, STAR_SHORT, STAR_NAMES, STAR_ELEM, PALACE_DIR,
  mingGua, younian, YOUNIAN_NOTE, yearSha, zeri, annualCenter, fly, MOUNTAINS, mountainPalace,
  type ZeriDay,
} from '../lib/astro/fengshui'

type Mode = 'feixing' | 'bazhai' | 'zeri'

const STAR_COLOR: Record<number, string> = {
  1: '#c8cbd4', 2: '#6b6b7a', 3: '#4ea87a', 4: '#5fa88a', 5: '#c9a227',
  6: '#e0e3ea', 7: '#d8553f', 8: '#f0e6d2', 9: '#9b6ad8',
}

const GUA_LIST = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑'] as const
const GUAS = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑'] as const
/** 八卦方位（上南下北） */
const GUA_POS: Record<string, [number, number]> = {
  巽: [1, 1], 离: [1, 2], 坤: [1, 3],
  震: [2, 1], 兑: [2, 3],
  艮: [3, 1], 坎: [3, 2], 乾: [3, 3],
}

const EVENTS = ['入宅', '开业', '动土', '嫁娶']
const JI_COLOR = (name: string) => (['生气', '延年', '天医', '伏位'].includes(name) ? '#8ec9a8' : name === '祸害' || name === '六煞' ? '#c9b28a' : '#d69a92')

export default function FengshuiPage() {
  const openSettings = useUi((s) => s.openSettings)
  const [mode, setMode] = useState<Mode>('feixing')
  const [sit, setSit] = useState('子')
  const [moveInYear, setMoveInYear] = useState(new Date().getFullYear() - 3)
  const [tigua, setTigua] = useState(false)
  const [birthYear, setBirthYear] = useState(CURRENT_YEAR)
  const [gender, setGender] = useState<'男' | '女'>('男')
  const [houseGua, setHouseGua] = useState('坎')
  const [event, setEvent] = useState('入宅')
  const [start, setStart] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [end, setEnd] = useState(() => {
    const d = new Date(Date.now() + 30 * 86400000)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [question, setQuestion] = useState('')
  const reading = useReading()

  const yun = yunOfYear(moveInYear)
  const chart = useMemo(() => {
    try {
      return { ok: true as const, data: feixingChart(yun, sit, tigua) }
    } catch (e: any) {
      return { ok: false as const, error: e?.message || '排盘失败' }
    }
  }, [yun, sit, tigua])

  const mg = useMemo(() => mingGua(birthYear, gender), [birthYear, gender])
  const yn = useMemo(() => younian(mg.gua), [mg.gua])
  const zeriDays = useMemo<ZeriDay[]>(() => zeri({ event, start, end, birthYear }), [event, start, end, birthYear])
  const annual = useMemo(() => yearSha(new Date().getFullYear()), [])

  const chartText = () => {
    if (mode === 'feixing') {
      if (!chart.ok) return ''
      const c = chart.data
      const lines = [
        `玄空飞星：${c.yun}运（${yunRange(c.yun)[0]}–${yunRange(c.yun)[1]}）· 坐${c.sit}山（${mountainPalace(c.sit)}宫）· 向${c.facing}山`,
        `山星入中${c.shanEntry.center}（依${c.shanEntry.by}山，${c.shanEntry.forward ? '顺' : '逆'}飞）；向星入中${c.xiangEntry.center}（依${c.xiangEntry.by}山，${c.xiangEntry.forward ? '顺' : '逆'}飞）`,
        '',
        ...GRID.map((row) =>
          row
            .map((pal) => `${pal}宫(山${c.shanPan[pal]}/向${c.xiangPan[pal]}/运${c.yunPan[pal]})`)
            .join('  '),
        ),
        '',
        `格局：${c.patterns.join('；') || '无特殊格局'}`,
        '',
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `${STAR_NAMES[n]} 落${Object.keys(c.shanPan).find((p) => c.shanPan[p] === n)}宫（山）/ ${Object.keys(c.xiangPan).find((p) => c.xiangPan[p] === n)}宫（向）`),
      ]
      return lines.join('\n')
    }
    if (mode === 'bazhai') {
      return [
        `八宅明镜：${birthYear} 年${gender}命，命卦 ${mg.gua}（${mg.number}数，${mg.group}）${mg.note ? `，${mg.note}` : ''}`,
        `宅卦：${houseGua}宅（坐${houseGua}）`,
        '',
        '游年八方位：',
        ...Object.entries(yn).map(([k, v]) => `${k} → ${v}方（${YOUNIAN_NOTE[k]}）`),
        '',
        `${mg.group}宜住${mg.group === '东四命' ? '东四宅（坎离震巽）' : '西四宅（乾坤艮兑）'}`,
      ].join('\n')
    }
    const top = zeriDays.filter((d) => !d.excluded).slice(0, 5)
    return [
      `择日：${event}，${start} 至 ${end}，当事人 ${birthYear} 年生`,
      top.length ? '推荐吉日：' : '该区间内没有明显合适的吉日，建议放宽范围。',
      ...top.map((d) => `${d.date}（${d.ganZhi}，${d.zhiXing}）${d.score}分：${d.reasons.join('；')}；宜 ${d.yi.join('、')}`),
    ].join('\n')
  }

  const run = () => {
    const p = fengshuiPrompt({ chartText: chartText(), userQuestion: question }, mode)
    reading.run(p.system, p.user)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mono text-[0.6rem] tracking-[0.32em] text-[#6a5730]">KANYU · 峦头为体 理气为用</div>
        <h1 className="mt-2 serif text-[1.9rem] tracking-[0.1em] text-[#f2dcae]">堪舆</h1>
        <p className="mt-2 max-w-[620px] text-[0.8rem] leading-relaxed text-[#8b8899]">
          玄空飞星看九宫旺衰，八宅游年定四吉四凶，择日参建除与黄历宜忌。风水左右吉凶概率，不决定命运——所以这里不卖摆件。
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SegTabs
          value={mode}
          onChange={(v) => { setMode(v); reading.reset() }}
          options={[
            { value: 'feixing', label: '玄空飞星' },
            { value: 'bazhai', label: '八宅命卦' },
            { value: 'zeri', label: '择日' },
          ]}
        />
        <div className="ml-auto flex items-center gap-2 text-[0.62rem] text-[#6f6c7d]">
          <span>流年 {annual.ganZhi}</span>
          <span className="text-[#5f5c6d]">·</span>
          <span>五黄在{annual.wuHuang}</span>
          <span className="text-[#5f5c6d]">·</span>
          <span>太岁{annual.taiSui}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="panel corner-frame p-5">
            <SectionTitle index="INPUT" title={mode === 'feixing' ? '宅向与元运' : mode === 'bazhai' ? '命卦与宅卦' : '择日条件'} />

            {mode === 'feixing' && (
              <div className="space-y-4">
                <Compass sit={sit} onPick={setSit} size={260} />
                <div className="text-center text-[0.66rem] text-[#6f6c7d]">
                  点击罗盘选择坐山 · 当前 <span className="text-[#d8b06a]">{sit}山</span>
                </div>
                <Field label="入住 / 大修年份" hint={`按此年定元运：${yun}运（${yunRange(yun)[0]}–${yunRange(yun)[1]}），以立春为界`}>
                  <select className="field" value={moveInYear} onChange={(e) => setMoveInYear(Number(e.target.value))}>
                    {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y} · {yunOfYear(y)}运</option>
                    ))}
                  </select>
                </Field>
                <label className="flex cursor-pointer items-center gap-2 text-[0.72rem] text-[#a9a6b8]">
                  <input type="checkbox" checked={tigua} onChange={(e) => setTigua(e.target.checked)} className="accent-[#d8b06a]" />
                  用替卦（兼向超过 3° 时）
                </label>
              </div>
            )}

            {mode === 'bazhai' && (
              <div className="space-y-4">
                <Field label="出生年份" hint="命卦以立春分年，年初出生请留意">
                  <select className="field" value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))}>
                    {BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}{y === CURRENT_YEAR ? '（今年）' : ''}</option>)}
                  </select>
                </Field>
                <Field label="性别">
                  <SegTabs value={gender} onChange={setGender} options={[{ value: '男', label: '男' }, { value: '女', label: '女' }]} />
                </Field>
                <Field label="宅卦（坐方）">
                  <div className="grid grid-cols-4 gap-1.5">
                    {GUA_LIST.map((g) => (
                      <button
                        key={g}
                        onClick={() => setHouseGua(g)}
                        className={`border py-1.5 text-[0.78rem] transition ${houseGua === g ? 'border-[rgba(216,176,106,0.5)] bg-[rgba(216,176,106,0.1)] text-[#f2dcae]' : 'border-white/8 text-[#8b8899]'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="panel-flat p-3 text-[0.7rem] text-[#a9a6b8]">
                  你的命卦：<span className="text-[#d8b06a]">{mg.gua}</span>（{mg.number} 数 · {mg.group}）
                  {mg.note && <span className="text-[#8a6f3c]"> · {mg.note}</span>}
                </div>
              </div>
            )}

            {mode === 'zeri' && (
              <div className="space-y-4">
                <Field label="事项">
                  <SegTabs value={event} onChange={setEvent} options={EVENTS.map((e) => ({ value: e, label: e }))} />
                </Field>
                <div className="grid-form">
                  <Field label="起始">
                    <input type="date" className="field" value={start} onChange={(e) => setStart(e.target.value)} />
                  </Field>
                  <Field label="结束">
                    <input type="date" className="field" value={end} onChange={(e) => setEnd(e.target.value)} />
                  </Field>
                </div>
                <Field label="当事人出生年" hint="用于排除日支冲年支的日子">
                  <input type="number" className="field" value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} />
                </Field>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <Field label="补充情况（可选）">
                <textarea className="field min-h-[70px] resize-y" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="如：主卧想放在东南，合适吗？" />
              </Field>
              <button onClick={run} disabled={reading.status === 'streaming'} className="btn w-full">
                {reading.status === 'streaming' ? '推演中…' : '开始分析'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {mode === 'feixing' && chart.ok && (
            <div className="panel corner-frame p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-baseline gap-2.5">
                  <span className="serif text-[1.3rem] text-[#f2dcae]">{chart.data.yun}运 · {sit}山{fengshuiFacing(sit)}向</span>
                  <span className="text-[0.66rem] text-[#8b8899]">{mountainPalace(sit)}宫 坐 · {yunRange(chart.data.yun)[0]}–{yunRange(chart.data.yun)[1]}</span>
                </div>
                {chart.data.mainPattern && <Badge color="#c9a227">{chart.data.mainPattern}</Badge>}
              </div>

              <div className="mx-auto grid max-w-[600px] grid-cols-3 gap-1.5">
                {GRID.flat().map((pal, idx) => {
                  const isCenter = pal === '中'
                  const shan = chart.data.shanPan[pal]
                  const xiang = chart.data.xiangPan[pal]
                  const yunStar = chart.data.yunPan[pal]
                  const annualStar = fly(annualCenter(new Date().getFullYear()), true)[pal]
                  return (
                    <motion.div
                      key={pal}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45, delay: idx * 0.04 }}
                      className="relative aspect-square border p-1.5 sm:p-2"
                      style={{
                        borderColor: isCenter ? 'rgba(216,176,106,0.4)' : 'rgba(255,255,255,0.08)',
                        background: isCenter ? 'rgba(216,176,106,0.05)' : 'rgba(8,8,13,0.6)',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[0.62rem] tracking-wide text-[#a08a52]">{pal}</span>
                        <span className="text-[0.5rem] text-[#5c5969]">{PALACE_DIR[pal]}</span>
                      </div>

                      {/* 三数 */}
                      <div className="mt-1.5 flex items-start justify-between">
                        <div className="text-center leading-none">
                          <div className="text-[0.44rem] text-[#5c5969]">山</div>
                          <div className="mono mt-0.5 text-[1.05rem] leading-none" style={{ color: STAR_COLOR[shan] }}>{shan}</div>
                        </div>
                        <div className="text-center leading-none">
                          <div className="text-[0.44rem] text-[#5c5969]">向</div>
                          <div className="mono mt-0.5 text-[1.05rem] leading-none" style={{ color: STAR_COLOR[xiang] }}>{xiang}</div>
                        </div>
                      </div>

                      <div className="mt-1 flex flex-col items-center">
                        <div
                          className="flex items-baseline gap-1"
                          style={{
                            color: STAR_COLOR[yunStar],
                            textShadow: yunStar === chart.data.yun ? `0 0 16px ${STAR_COLOR[yunStar]}aa` : 'none',
                          }}
                        >
                          <span className="mono text-[1.45rem] leading-none">{yunStar}</span>
                          {yunStar === chart.data.yun && <span className="text-[0.46rem] text-[#d8b06a]">旺</span>}
                        </div>
                        <div className="mt-0.5 text-[0.48rem]" style={{ color: `${STAR_COLOR[yunStar]}99` }}>
                          {STAR_SHORT[yunStar]}
                        </div>
                      </div>

                      <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between">
                        <span className="mono text-[0.44rem] text-[#5c5969]">年{annualStar}</span>
                        {(shan === 5 || xiang === 5) && <span className="text-[0.44rem] text-[#d8553f]">五黄</span>}
                        {shan === 2 && xiang === 5 && <span className="text-[0.44rem] text-[#d69a92]">二五</span>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.56rem] text-[#6f6c7d]">
                <span>图例：左上=山星（人丁） 右上=向星（财） 中=运星 左下=年星</span>
              </div>

              {chart.data.patterns.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {chart.data.patterns.map((p, i) => (
                    <span key={i} className="border border-[rgba(216,176,106,0.25)] px-2 py-1 text-[0.62rem] text-[#c9b28a]">{p}</span>
                  ))}
                </div>
              )}
              {chart.data.warnings.length > 0 && (
                <div className="mt-3 border-l border-[rgba(216,176,106,0.3)] bg-[rgba(216,176,106,0.04)] px-3 py-2 text-[0.64rem] leading-relaxed text-[#c9b28a]">
                  {chart.data.warnings.map((w, i) => <div key={i}>· {w}</div>)}
                </div>
              )}
            </div>
          )}

          {mode === 'bazhai' && (
            <div className="panel corner-frame p-5">
              <SectionTitle index="BAZHAI" title="游年八宅" desc={`命卦 ${mg.gua} · ${mg.group} · 宅卦 ${houseGua}`} />
              <div className="mx-auto grid max-w-[440px] grid-cols-3 gap-1.5">
                {GUAS.map((g) => {
                  const [r, c] = GUA_POS[g]
                  const key = Object.keys(yn).find((k) => yn[k] === g)
                  const isMine = g === mg.gua
                  const good = key ? ['生气', '延年', '天医', '伏位'].includes(key) : false
                  return (
                    <div
                      key={g}
                      className="relative aspect-square border p-2"
                      style={{
                        gridRow: r,
                        gridColumn: c,
                        borderColor: isMine ? 'rgba(242,220,174,0.6)' : key ? `${JI_COLOR(key)}44` : 'rgba(255,255,255,0.07)',
                        background: key ? `${JI_COLOR(key)}0a` : 'transparent',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="serif text-[0.9rem]" style={{ color: isMine ? '#f2dcae' : '#8b8899' }}>{g}</span>
                        <span className="mono text-[0.48rem] text-[#5c5969]">{PALACE_DIR[g]}</span>
                      </div>
                      {key && (
                        <div className="mt-2">
                          <div className="text-[0.8rem]" style={{ color: JI_COLOR(key) }}>{key}</div>
                          <div className="mt-0.5 text-[0.48rem] leading-tight text-[#6f6c7d]">{YOUNIAN_NOTE[key]}</div>
                        </div>
                      )}
                      {isMine && <span className="absolute bottom-1.5 right-2 text-[0.46rem] text-[#8a6f3c]">本命</span>}
                    </div>
                  )
                })}
                <div className="col-start-2 row-start-2 flex flex-col items-center justify-center border border-[rgba(216,176,106,0.15)] text-center">
                  <div className="serif text-[1.3rem] text-[#f2dcae]">{houseGua}</div>
                  <div className="mt-1 text-[0.5rem] tracking-widest text-[#8a6f3c]">宅卦</div>
                  <div className="mt-2 text-[0.52rem] text-[#6f6c7d]">
                    {mg.group === (['坎', '离', '震', '巽'].includes(houseGua) ? '东四命' : '西四命') ? '宅命相配' : '宅命不配'}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="panel-flat p-3">
                  <div className="mb-1.5 text-[0.6rem] tracking-widest text-[#8ec9a8]">四吉方</div>
                  <div className="space-y-1 text-[0.68rem] text-[#a9a6b8]">
                    {Object.entries(yn).filter(([k]) => ['生气', '延年', '天医', '伏位'].includes(k)).map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span>{k}</span><span className="text-[#8ec9a8]">{v}方 · {PALACE_DIR[v]}</span></div>
                    ))}
                  </div>
                </div>
                <div className="panel-flat p-3">
                  <div className="mb-1.5 text-[0.6rem] tracking-widest text-[#d69a92]">四凶方</div>
                  <div className="space-y-1 text-[0.68rem] text-[#a9a6b8]">
                    {Object.entries(yn).filter(([k]) => !['生气', '延年', '天医', '伏位'].includes(k)).map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span>{k}</span><span className="text-[#d69a92]">{v}方 · {PALACE_DIR[v]}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'zeri' && (
            <div className="panel corner-frame p-5">
              <SectionTitle index="ALMANAC" title="择日结果" desc="硬排除：日冲当事人年支、月破、黄历忌该事项" />
              {zeriDays.length === 0 ? (
                <Empty>区间无效，或跨度超过 62 天。</Empty>
              ) : (
                <div className="space-y-1.5">
                  {zeriDays.slice(0, 14).map((d, i) => (
                    <Reveal key={d.date} delay={i * 0.03}>
                      <div
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 border px-3 py-2"
                        style={{
                          borderColor: d.excluded ? 'rgba(184,71,58,0.2)' : 'rgba(216,176,106,0.18)',
                          background: d.excluded ? 'rgba(184,71,58,0.03)' : 'rgba(216,176,106,0.03)',
                          opacity: d.excluded ? 0.55 : 1,
                        }}
                      >
                        <span className="mono w-[86px] text-[0.72rem] text-[#d8c9a8]">{d.date}</span>
                        <span className="mono w-[46px] text-[0.66rem] text-[#8a6f3c]">{d.ganZhi}</span>
                        <span className="w-[26px] text-[0.66rem] text-[#a9a6b8]">{d.zhiXing}</span>
                        <span className={`mono w-[34px] text-[0.7rem] ${d.excluded ? 'text-[#b8473a]' : 'text-[#8ec9a8]'}`}>{d.excluded ? '×' : d.score}</span>
                        <span className="min-w-[120px] flex-1 text-[0.64rem] leading-snug text-[#77748a]">{d.reasons.join('；')}</span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}

          <ReadingPanel reading={reading} onRetry={run} openSettings={openSettings} title="堪舆解读" />
        </div>
      </div>
    </div>
  )
}

function fengshuiFacing(sit: string) {
  const idx = MOUNTAINS.indexOf(sit)
  return MOUNTAINS[(idx + 12) % 24]
}
