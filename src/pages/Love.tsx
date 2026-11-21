import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useUi } from '../lib/uiStore'
import { lovePrompt } from '../lib/prompts'
import ReadingPanel, { useReading } from '../components/ReadingPanel'
import { SectionTitle, Field, SegTabs, Badge, Stat, Empty, Reveal } from '../components/ui'
import { zodiacPair, hehun, taohua, drawStick, redThread, type ZodiacPair } from '../lib/love/match'
import { calcBazi, type BaziInput } from '../lib/astro/bazi'
import { calcZiwei } from '../lib/astro/ziwei'

type Mode = 'hehun' | 'zodiac' | 'ziwei' | 'stick' | 'taohua' | 'redthread'

const MODES: { key: Mode; name: string; desc: string; icon: string }[] = [
  { key: 'hehun', name: '八字合婚', desc: '两个人的四柱对照', icon: '合' },
  { key: 'zodiac', name: '生肖配对', desc: '六合三合六冲', icon: '肖' },
  { key: 'ziwei', name: '夫妻宫', desc: '紫微看婚姻格局', icon: '宫' },
  { key: 'stick', name: '求签', desc: '月老灵签一百支', icon: '签' },
  { key: 'taohua', name: '桃花运', desc: '本命与流年桃花', icon: '桃' },
  { key: 'redthread', name: '红线', desc: '正缘画像与窗口', icon: '线' },
]

interface PersonForm {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: '男' | '女'
}

function PersonInput({
  label,
  value,
  onChange,
  accent = '#d4736b',
}: {
  label: string
  value: PersonForm
  onChange: (v: PersonForm) => void
  accent?: string
}) {
  return (
    <div className="border border-white/7 p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[0.7rem] tracking-[0.16em]" style={{ color: accent }}>{label}</span>
        <div className="flex gap-1">
          {(['男', '女'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onChange({ ...value, gender: g })}
              className={`px-2 py-0.5 text-[0.62rem] border ${value.gender === g ? 'border-[rgba(216,176,106,0.45)] text-[#f2dcae]' : 'border-white/8 text-[#77748a]'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <select className="field !px-2 !text-[0.74rem]" value={value.year} onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}>
          {Array.from({ length: 81 }, (_, i) => 1950 + i).reverse().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="field !px-2 !text-[0.74rem]" value={value.month} onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
        </select>
        <select className="field !px-2 !text-[0.74rem]" value={value.day} onChange={(e) => onChange({ ...value, day: Number(e.target.value) })}>
          {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}日</option>)}
        </select>
      </div>
      <div className="mt-1.5">
        <select className="field !px-2 !text-[0.74rem]" value={value.hour} onChange={(e) => onChange({ ...value, hour: Number(e.target.value) })}>
          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}:00 · {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][Math.floor(((h + 1) % 24) / 2)]}时
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

/** 两个点之间画一条红线 */
function RedThreadViz({ a, b, score }: { a: string; b: string; score: number }) {
  return (
    <div className="relative flex items-center justify-center py-6">
      <svg viewBox="0 0 400 120" className="w-full max-w-[420px]">
        <defs>
          <linearGradient id="thread" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b8473a" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#e0655a" />
            <stop offset="100%" stopColor="#b8473a" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow-thread">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          d="M40 60 C 120 10, 280 110, 360 60"
          stroke="url(#thread)"
          strokeWidth="1.6"
          fill="none"
          filter="url(#glow-thread)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
        />
        <motion.circle cx="40" cy="60" r="4" fill="#e0655a" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} />
        <motion.circle cx="360" cy="60" r="4" fill="#e0655a" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} />
        <text x="40" y="92" textAnchor="middle" fill="#c9b28a" fontSize="11" fontFamily="var(--font-serif)">{a}</text>
        <text x="360" y="92" textAnchor="middle" fill="#c9b28a" fontSize="11" fontFamily="var(--font-serif)">{b}</text>
        <text x="200" y="26" textAnchor="middle" fill="#8a6f3c" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="2">
          姻缘指数 {score}
        </text>
      </svg>
    </div>
  )
}

export default function LovePage() {
  const openSettings = useUi((s) => s.openSettings)
  const [mode, setMode] = useState<Mode>('zodiac')
  const [a, setA] = useState<PersonForm>({ year: 1995, month: 8, day: 20, hour: 10, minute: 0, gender: '男' })
  const [b, setB] = useState<PersonForm>({ year: 1996, month: 3, day: 12, hour: 14, minute: 0, gender: '女' })
  const [name, setName] = useState('')
  const [question, setQuestion] = useState('')
  const reading = useReading()

  const toInput = (p: PersonForm): BaziInput => ({ ...p, calendar: 'solar' })

  const computed = useMemo(() => {
    try {
      switch (mode) {
        case 'zodiac':
          return { ok: true as const, kind: 'zodiac' as const, data: zodiacPair(a.year, b.year) }
        case 'hehun': {
          const ca = calcBazi(toInput(a))
          const cb = calcBazi(toInput(b))
          return { ok: true as const, kind: 'hehun' as const, data: hehun(ca, cb) }
        }
        case 'ziwei': {
          const z = calcZiwei({ ...a, calendar: 'solar' })
          const spouse = z.palaces.find((p) => p.name === '夫妻')
          return { ok: true as const, kind: 'ziwei' as const, data: { z, spouse } }
        }
        case 'stick':
          return { ok: true as const, kind: 'stick' as const, data: drawStick(name || '无名', question || '姻缘何时到') }
        case 'taohua':
          return { ok: true as const, kind: 'taohua' as const, data: taohua(a.year, a.gender) }
        case 'redthread':
          return { ok: true as const, kind: 'redthread' as const, data: redThread(toInput(a)) }
      }
    } catch (e: any) {
      return { ok: false as const, error: e?.message || '测算失败' }
    }
  }, [mode, a, b, name, question])

  const chartText = useMemo(() => {
    if (!computed.ok) return ''
    const d: any = computed.data
    switch (computed.kind) {
      case 'zodiac':
        return `生肖配对：${d.a.shengxiao}(${d.a.zhi}) × ${d.b.shengxiao}(${d.b.zhi})；关系：${d.relation}；指数 ${d.score}。${d.detail}`
      case 'hehun':
        return `八字合婚：\n甲方 ${d.a.pillars.map((p: any) => p.gan + p.zhi).join(' ')}，日主${d.a.dayMaster}\n乙方 ${d.b.pillars.map((p: any) => p.gan + p.zhi).join(' ')}，日主${d.b.dayMaster}\n综合 ${d.score} 分\n${d.sections.map((s: any) => `${s.title}（${s.rating}/5）：${s.text}`).join('\n')}`
      case 'ziwei':
        return `紫微夫妻宫：命宫${d.z.soulPalaceBranch}，夫妻宫在${d.spouse?.earthlyBranch}，主星${d.spouse?.majorStars.map((s: any) => s.name + (s.brightness || '')).join('、') || '空宫'}；辅星${d.spouse?.minorStars.map((s: any) => s.name).join('、') || '无'}；五行局${d.z.fiveElementsClass}`
      case 'stick':
        return `求签：第${d.stick.no}签 · ${d.stick.level}\n签诗：${d.stick.poem.join('')}\n签解：${d.stick.jie}\n姻缘解读：${d.stick.love}`
      case 'taohua':
        return `桃花运势：${d.type}；流年：${d.yearPeach.map((y: any) => `${y.year}${y.ganZhi}${y.active ? '(旺)' : ''}`).join('、')}；旺月：${d.months.filter((m: any) => m.stars >= 3).map((m: any) => m.label).join('、')}`
      case 'redthread':
        return `红线测算：日柱${d.bazi.pillars.find((p: any) => p.key === 'day')?.gan}${d.spousePalace.zhi}；配偶宫${d.spousePalace.note}；配偶星为${d.spouseStar}；本命桃花在${d.peach.peachZhi}（${d.peach.peachDir}）；高分年：${d.windows.slice(0, 4).map((w: any) => `${w.year}${w.ganZhi}(${w.score})`).join('、')}`
      default:
        return ''
    }
  }, [computed])

  const start = () => {
    const p = lovePrompt({ chartText, userQuestion: question }, mode)
    reading.run(p.system, p.user)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mono text-[0.6rem] tracking-[0.32em] text-[#6a5730]">MARRIAGE · 赛博月老</div>
        <h1 className="mt-2 serif text-[1.9rem] tracking-[0.1em] text-[#f2dcae]">姻缘</h1>
        <p className="mt-2 max-w-[600px] text-[0.8rem] leading-relaxed text-[#8b8899]">
          六种问法，同一件事的不同切面。合婚看结构，生肖看气场合不合，签看此刻的心，红线看时间窗口。娱乐为主，不制造焦虑。
        </p>
      </div>

      {/* 模式选择 */}
      <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {MODES.map((m) => {
          const on = mode === m.key
          return (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); reading.reset() }}
              className={`group relative border px-2 py-3 text-center transition-all ${on ? 'border-[rgba(212,115,107,0.5)] bg-[rgba(212,115,107,0.08)]' : 'border-white/7 hover:border-white/18'}`}
            >
              <div className={`serif text-[1.1rem] ${on ? 'text-[#f0c8c2]' : 'text-[#8b8899]'}`}>{m.icon}</div>
              <div className={`mt-1 text-[0.72rem] ${on ? 'text-[#f0e0dd]' : 'text-[#a9a6b8]'}`}>{m.name}</div>
              <div className="mt-0.5 hidden text-[0.56rem] leading-tight text-[#605d70] sm:block">{m.desc}</div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* 输入 */}
        <div className="panel corner-frame space-y-3 p-5">
          <SectionTitle index="INPUT" title={MODES.find((m) => m.key === mode)?.name ?? '测算'} />

          {(mode === 'hehun') && (
            <>
              <PersonInput label="你" value={a} onChange={setA} />
              <div className="flex items-center justify-center gap-2 text-[0.6rem] text-[#b8473a]">
                <span className="h-[1px] w-10 bg-[#b8473a]/40" />红线<span className="h-[1px] w-10 bg-[#b8473a]/40" />
              </div>
              <PersonInput label="对方" value={b} onChange={setB} accent="#9b8ae6" />
            </>
          )}

          {mode === 'zodiac' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label="你">
                  <select className="field" value={a.year} onChange={(e) => setA({ ...a, year: Number(e.target.value) })}>
                    {Array.from({ length: 81 }, (_, i) => 1950 + i).reverse().map((y) => <option key={y} value={y}>{y} · {['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'][(y - 4) % 12]}</option>)}
                  </select>
                </Field>
                <Field label="对方">
                  <select className="field" value={b.year} onChange={(e) => setB({ ...b, year: Number(e.target.value) })}>
                    {Array.from({ length: 81 }, (_, i) => 1950 + i).reverse().map((y) => <option key={y} value={y}>{y} · {['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'][(y - 4) % 12]}</option>)}
                  </select>
                </Field>
              </div>
              <p className="text-[0.62rem] leading-relaxed text-[#605d70]">
                生肖按立春分年。年初出生的人，公历年与生肖年可能差一年，若要精确请用「八字合婚」。
              </p>
            </>
          )}

          {(mode === 'ziwei' || mode === 'taohua' || mode === 'redthread') && (
            <PersonInput label={mode === 'taohua' ? '你的出生信息' : '你的生辰'} value={a} onChange={setA} />
          )}

          {mode === 'stick' && (
            <>
              <Field label="姓名">
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="求签人姓名" />
              </Field>
              <Field label="心中所问" hint="一事一签，同一问题今日不宜再求">
                <textarea className="field min-h-[80px] resize-y" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="如：我心里那个人，还有可能吗？" />
              </Field>
            </>
          )}

          {mode !== 'stick' && (
            <Field label="想问的（可选）">
              <textarea className="field min-h-[70px] resize-y" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="留空则按完整解读" />
            </Field>
          )}

          <button onClick={start} disabled={!computed.ok || reading.status === 'streaming'} className="btn w-full">
            {reading.status === 'streaming' ? '测算中…' : '开始测算'}
          </button>
        </div>

        {/* 结果 */}
        <div className="space-y-5">
          {!computed.ok && <Empty>{computed.error}</Empty>}

          {computed.ok && computed.kind === 'zodiac' && <ZodiacView data={computed.data} />}
          {computed.ok && computed.kind === 'hehun' && <HehunView data={computed.data} />}

          {computed.ok && computed.kind === 'ziwei' && (
            <div className="panel corner-frame p-5">
              <SectionTitle index="SPOUSE" title="夫妻宫" />
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="夫妻宫" value={computed.data.spouse?.earthlyBranch ?? '—'} hint={computed.data.spouse?.heavenlyStem} />
                <Stat label="主星" value={<span className="text-[0.9rem]">{computed.data.spouse?.majorStars.map((s) => s.name).join(' ') || '空宫'}</span>} />
                <Stat label="五行局" value={<span className="text-[0.9rem]">{computed.data.z.fiveElementsClass}</span>} />
              </div>
              <div className="mt-4 space-y-2 text-[0.74rem] leading-relaxed text-[#a9a6b8]">
                <div>
                  <span className="text-[#6f6c7d]">主星庙旺 · </span>
                  {computed.data.spouse?.majorStars.length
                    ? computed.data.spouse.majorStars.map((s) => `${s.name}${s.brightness ? `(${s.brightness})` : ''}`).join('、')
                    : '夫妻宫无主星，需借对宫（官禄宫）星曜参看'}
                </div>
                <div>
                  <span className="text-[#6f6c7d]">辅星 · </span>
                  {computed.data.spouse?.minorStars.map((s) => s.name).join('、') || '无'}
                </div>
                <div>
                  <span className="text-[#6f6c7d]">大限 · </span>
                  {computed.data.spouse?.decadal ? `${computed.data.spouse.decadal.range[0]}–${computed.data.spouse.decadal.range[1]} 岁` : '—'}
                </div>
              </div>
            </div>
          )}

          {computed.ok && computed.kind === 'stick' && (
            <div className="panel corner-frame relative overflow-hidden p-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(184,71,58,0.12),transparent_60%)]" />
              <div className="relative flex flex-col items-center">
                <div className="mono text-[0.6rem] tracking-[0.3em] text-[#8a6f3c]">第 {computed.data.stick.no} 签</div>
                <div className="mt-2 serif text-[1.5rem] tracking-[0.2em] text-[#f2dcae]">{computed.data.stick.level}</div>
                <div className="my-5 h-[1px] w-16 bg-gradient-to-r from-transparent via-[#b8473a]/60 to-transparent" />
                <div
                  className="serif text-[1rem] leading-[2.4] tracking-[0.28em] text-[#e8dcc4]"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'upright', height: 190 }}
                >
                  {computed.data.stick.poem.join('')}
                </div>
                <div className="mt-6 w-full space-y-2.5 text-[0.76rem] leading-[1.95] text-[#a9a6b8]">
                  {computed.data.stick.jie && (
                    <p><span className="text-[#8a6f3c]">签解 · </span>{computed.data.stick.jie}</p>
                  )}
                  {computed.data.stick.love && (
                    <p><span className="text-[#8a6f3c]">姻缘 · </span>{computed.data.stick.love}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {computed.ok && computed.kind === 'taohua' && (
            <div className="panel corner-frame p-5">
              <SectionTitle index="PEACH" title="桃花运势" desc={computed.data.type} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Stat label="本命桃花位" value={computed.data.peachZhi} hint={computed.data.peachDir} color="#d4736b" />
                <Stat label="年支" value={computed.data.yearZhi} hint={computed.data.birthYear + ' 年生'} />
                <Stat label="旺月数" value={computed.data.months.filter((m) => m.stars >= 3).length} unit="个月" />
              </div>
              <div className="mt-4 grid grid-cols-6 gap-1.5">
                {computed.data.months.map((m) => (
                  <div key={m.month} className="border border-white/7 px-1 py-2 text-center" style={{ background: m.stars === 4 ? 'rgba(212,115,107,0.12)' : m.stars === 3 ? 'rgba(212,115,107,0.05)' : 'transparent' }}>
                    <div className="text-[0.56rem] text-[#6f6c7d]">{m.label}</div>
                    <div className="mt-1 flex justify-center gap-[2px]">
                      {Array.from({ length: m.stars }).map((_, i) => (
                        <span key={i} className="h-1 w-1 rounded-full bg-[#d4736b]" style={{ opacity: 0.5 + i * 0.16 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5">
                {computed.data.yearPeach.map((y) => (
                  <div key={y.year} className="flex items-center gap-2 text-[0.68rem]">
                    <span className={`mono w-16 ${y.active ? 'text-[#f0c8c2]' : 'text-[#77748a]'}`}>{y.year} {y.ganZhi}</span>
                    <span className={`flex-1 ${y.active ? 'text-[#c9b28a]' : 'text-[#605d70]'}`}>{y.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {computed.ok && computed.kind === 'redthread' && (
            <div className="panel corner-frame p-5">
              <SectionTitle index="RED THREAD" title="红线测算" desc="配偶宫 + 配偶星 + 桃花位 + 流年窗口" />
              <RedThreadViz a="你" b="正缘" score={computed.data.windows[0]?.score ?? 0} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Stat label="配偶宫" value={computed.data.spousePalace.zhi} hint={`属${computed.data.spousePalace.wuxing}`} color="#d4736b" />
                <Stat label="配偶星" value={<span className="text-[0.78rem]">{computed.data.spouseStar.split('（')[0]}</span>} hint={computed.data.spouseStar} />
                <Stat label="桃花方位" value={computed.data.peach.peachDir} hint={computed.data.peach.peachZhi} />
              </div>
              <div className="mt-4">
                <div className="mb-2 mono text-[0.58rem] tracking-[0.22em] text-[#6f6c7d]">时间窗口</div>
                <div className="space-y-1.5">
                  {computed.data.windows.slice(0, 6).map((w) => (
                    <div key={w.year} className="flex items-center gap-2.5">
                      <span className="mono w-20 text-[0.68rem] text-[#a9a6b8]">{w.year} {w.ganZhi}</span>
                      <div className="h-[3px] flex-1 bg-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${w.score}%` }} transition={{ duration: 0.7 }} className="h-full bg-gradient-to-r from-[#b8473a] to-[#e0655a]" />
                      </div>
                      <span className="w-[52%] truncate text-[0.62rem] text-[#77748a]" title={w.note}>{w.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {computed.ok && (
            <ReadingPanel reading={reading} onRetry={start} openSettings={openSettings} title="月老解读" />
          )}
        </div>
      </div>
    </div>
  )
}

function ZodiacView({ data }: { data: ZodiacPair }) {
  return (
    <div className="panel corner-frame p-5">
      <SectionTitle index="ZODIAC" title="生肖配对" right={<Badge color="#d4736b">{data.relation}</Badge>} />
      <div className="flex items-center justify-center gap-6 py-2">
        <div className="text-center">
          <div className="serif text-[2.4rem] leading-none text-[#f2dcae]">{data.a.shengxiao}</div>
          <div className="mono mt-1.5 text-[0.6rem] text-[#6f6c7d]">{data.a.zhi} · {data.a.year}</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="mono text-[1.5rem] text-[#d4736b]">{data.score}</div>
          <div className="text-[0.52rem] tracking-[0.2em] text-[#6f6c7d]">指数</div>
        </div>
        <div className="text-center">
          <div className="serif text-[2.4rem] leading-none text-[#f2dcae]">{data.b.shengxiao}</div>
          <div className="mono mt-1.5 text-[0.6rem] text-[#6f6c7d]">{data.b.zhi} · {data.b.year}</div>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {data.dims.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2.5">
            <span className="w-8 text-[0.66rem] text-[#8b8899]">{d.label}</span>
            <div className="h-[4px] flex-1 bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.value}%` }}
                transition={{ duration: 0.8, delay: i * 0.08 }}
                className="h-full"
                style={{ background: d.label === '摩擦' ? 'linear-gradient(90deg,#8a6f3c,#b8473a)' : 'linear-gradient(90deg,#8a6f3c,#d8b06a)' }}
              />
            </div>
            <span className="mono w-7 text-right text-[0.62rem] text-[#8b8899]">{d.value}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 border-l border-[rgba(212,115,107,0.35)] pl-3 text-[0.76rem] leading-[1.9] text-[#a9a6b8]">{data.detail}</p>
      <p className="mt-2 pl-3 text-[0.74rem] leading-[1.9] text-[#8b8899]">{data.advice}</p>
    </div>
  )
}

function HehunView({ data }: { data: ReturnType<typeof hehun> }) {
  return (
    <div className="panel corner-frame p-5">
      <SectionTitle index="MATCH" title="八字合婚" right={<Badge color="#d4736b">姻缘指数 {data.score}</Badge>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-4">
        <div>
          <div className="serif text-[1.1rem] text-[#f2dcae]">{data.a.pillars.map((p) => p.gan + p.zhi).join(' ')}</div>
          <div className="mt-1 text-[0.62rem] text-[#6f6c7d]">日主 {data.a.dayMaster}{data.a.dayMasterWuXing}</div>
        </div>
        <div className="text-[0.6rem] text-[#b8473a]">×</div>
        <div className="text-right">
          <div className="serif text-[1.1rem] text-[#f2dcae]">{data.b.pillars.map((p) => p.gan + p.zhi).join(' ')}</div>
          <div className="mt-1 text-[0.62rem] text-[#6f6c7d]">日主 {data.b.dayMaster}{data.b.dayMasterWuXing}</div>
        </div>
      </div>

      <div className="space-y-3">
        {data.sections.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.06}>
            <div className="flex gap-3">
              <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                <span className="text-[0.58rem] tracking-wider text-[#8a6f3c]">{s.title.split(' · ')[0]}</span>
                <div className="flex gap-[2px]">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <span key={k} className="h-1 w-1.5" style={{ background: k < s.rating ? '#d8b06a' : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
              </div>
              <p className="text-[0.75rem] leading-[1.85] text-[#a9a6b8]">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
