import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SPREADS, SUIT_META, type Suit } from '../lib/tarot/deck'
import { draw, tarotToText, labelOfTimeFactor, type TarotResult } from '../lib/tarot/draw'
import { useUi } from '../lib/uiStore'
import { tarotPrompt } from '../lib/prompts'
import ReadingPanel, { useReading } from '../components/ReadingPanel'
import { FlippableCard, CardBack } from '../components/TarotCardView'
import MagicCircle from '../components/MagicCircle'
import { SectionTitle, Field, SegTabs, Badge, Empty } from '../components/ui'

type Stage = 'idle' | 'shuffle' | 'deal' | 'ready'

export default function TarotPage() {
  const openSettings = useUi((s) => s.openSettings)
  const [question, setQuestion] = useState('')
  const [spreadKey, setSpreadKey] = useState('three')
  const [result, setResult] = useState<TarotResult | null>(null)
  const [revealed, setRevealed] = useState<boolean[]>([])
  const [stage, setStage] = useState<Stage>('idle')
  const reading = useReading()

  const spread = SPREADS.find((s) => s.key === spreadKey)!

  const deal = () => {
    const r = draw({ spreadKey, question })
    setResult(r)
    setRevealed(new Array(r.drawn.length).fill(false))
    setStage('shuffle')
    reading.reset()
    window.setTimeout(() => setStage('deal'), 900)
    window.setTimeout(() => setStage('ready'), 900 + r.drawn.length * 220 + 500)
  }

  const flip = (i: number) => {
    setRevealed((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  const allRevealed = revealed.length > 0 && revealed.every(Boolean)

  const start = () => {
    if (!result) return
    const p = tarotPrompt({ chartText: tarotToText(result), userQuestion: result.question })
    reading.run(p.system, p.user)
  }

  const suitList = useMemo(() => {
    if (!result) return []
    return (Object.entries(result.suits) as [Suit, number][]).filter(([, n]) => n > 0)
  }, [result])

  return (
    <div>
      <div className="mb-8">
        <div className="mono text-[0.6rem] tracking-[0.32em] text-[#6a5730]">TAROT · 78 CARDS</div>
        <h1 className="mt-2 serif text-[1.9rem] tracking-[0.1em] text-[#f2dcae]">塔罗</h1>
        <p className="mt-2 max-w-[620px] text-[0.8rem] leading-relaxed text-[#8b8899]">
          牌是镜子，不是水晶球。洗牌由种子决定——同一天、同一问题、同一时辰，会得到同一副牌，因为可复现才可核对。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* 左：设置 */}
        <div className="space-y-4">
          <div className="panel corner-frame p-5">
            <SectionTitle index="SPREAD" title="选牌阵" />
            <div className="space-y-4">
              <div className="space-y-1.5">
                {SPREADS.map((s) => {
                  const on = s.key === spreadKey
                  return (
                    <button
                      key={s.key}
                      onClick={() => setSpreadKey(s.key)}
                      className={`w-full border px-3 py-2.5 text-left transition-all ${
                        on ? 'border-[rgba(192,122,208,0.5)] bg-[rgba(192,122,208,0.08)]' : 'border-white/7 hover:border-white/16'
                      }`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className={`text-[0.86rem] ${on ? 'text-[#f0dcf5]' : 'text-[#cfcbdb]'}`}>{s.name}</span>
                        <span className="mono text-[0.58rem] text-[#6f6c7d]">{s.count} 张</span>
                      </div>
                      <div className="mt-1 text-[0.66rem] leading-relaxed text-[#77748a]">{s.desc}</div>
                    </button>
                  )
                })}
              </div>

              <div className="hairline" />

              <Field label="你的问题" hint="越具体越好；不填则读当下整体能量">
                <textarea
                  className="field min-h-[76px] resize-y"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="如：这份工作我该不该接？"
                />
              </Field>

              <button onClick={deal} className="btn w-full">
                {stage === 'idle' ? '洗牌抽牌' : '重新洗牌'}
              </button>

              {result && (
                <div className="space-y-1.5 border-t border-white/6 pt-3 text-[0.62rem] text-[#6f6c7d]">
                  <div className="flex justify-between">
                    <span>seed</span>
                    <span className="mono text-[#a9a6b8]">{result.seed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>time_factor</span>
                    <span className="mono text-[#a9a6b8]">{result.timeFactor} · {labelOfTimeFactor(result.timeFactor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>大阿卡纳占比</span>
                    <span className="mono text-[#a9a6b8]">{Math.round(result.majorRatio * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="panel-flat p-4">
              <div className="mb-2 text-[0.6rem] tracking-[0.2em] text-[#6f6c7d]">花色分布</div>
              <div className="space-y-1.5">
                {(Object.entries(SUIT_META) as [Suit, typeof SUIT_META[Suit]][]).map(([k, m]) => {
                  const n = result.suits[k]
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className="w-8 text-[0.6rem]" style={{ color: m.color }}>{m.name}</span>
                      <div className="h-[3px] flex-1 bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(n / Math.max(1, result.drawn.length)) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.2 }}
                          className="h-full"
                          style={{ background: m.color }}
                        />
                      </div>
                      <span className="mono w-3 text-right text-[0.58rem] text-[#77748a]">{n}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.dominantSuit && <Badge color={SUIT_META[result.dominantSuit].color}>{SUIT_META[result.dominantSuit].name}主导</Badge>}
                {result.missingSuit && <Badge color="#6f6c7d" dim>缺{SUIT_META[result.missingSuit].name}</Badge>}
              </div>
            </div>
          )}
        </div>

        {/* 右：牌桌 + 解读 */}
        <div className="space-y-5">
          <div className="panel corner-frame relative overflow-hidden p-5 sm:p-7">
            <div className="table-aura left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[1]">
              <MagicCircle size={600} color="#b9a06a" />
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(216,176,106,0.05) 0%, transparent 55%)',
            }} />

            <div className="relative mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rotate-45 bg-[#d8b06a]" />
                <span className="serif text-[0.82rem] tracking-[0.2em] text-[#c9b28a]">{spread.name}</span>
              </div>
              {result && <span className="mono text-[0.58rem] tracking-[0.2em] text-[#5f5c6d]">{result.spread.count} CARDS</span>}
            </div>

            {/* 牌桌 */}
            <div className="relative flex min-h-[300px] flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {stage === 'idle' && (
                  <motion.div key="idle" exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center gap-4 py-10">
                    <div className="relative h-[190px] w-[120px]">
                      {[3, 2, 1, 0].map((i) => (
                        <div
                          key={i}
                          className="absolute"
                          style={{
                            transform: `rotate(${(i - 1.5) * 4}deg) translate(${(i - 1.5) * 5}px, ${-i * 2}px)`,
                            opacity: 0.4 + i * 0.2,
                            zIndex: 10 - i,
                          }}
                        >
                          <CardBack width={120} />
                        </div>
                      ))}
                    </div>
                    <p className="text-[0.74rem] text-[#6f6c7d]">牌未出，心先静</p>
                  </motion.div>
                )}

                {stage === 'shuffle' && (
                  <motion.div key="shuffle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5 py-10">
                    <div className="relative h-[190px] w-[120px]" style={{ perspective: 900 }}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0"
                          animate={{
                            x: [0, (i % 2 === 0 ? 1 : -1) * (18 + i * 7), 0],
                            y: [0, -12 - i * 4, 0],
                            rotate: [0, (i % 2 === 0 ? 1 : -1) * (8 + i * 3), 0],
                          }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
                        >
                          <CardBack width={120} />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-[0.74rem] tracking-[0.2em] text-[#8a6f3c]">洗牌中</p>
                  </motion.div>
                )}

                {(stage === 'deal' || stage === 'ready') && result && (
                  <motion.div key="dealt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                    <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-6 py-2">
                      {result.drawn.map((d, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: -40, scale: 0.86, rotate: -6 }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <FlippableCard
                            card={d.card}
                            reversed={d.reversed}
                            faceUp={revealed[i]}
                            width={148}
                            label={d.position.label}
                            glow={revealed[i]}
                            onClick={() => flip(i)}
                          />
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      {!allRevealed ? (
                        <div className="text-[0.72rem] text-[#6f6c7d]">
                          点击牌面翻开 · 已翻 {revealed.filter(Boolean).length}/{revealed.length}
                        </div>
                      ) : (
                        <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={start} disabled={reading.status === 'streaming'} className="btn">
                          {reading.status === 'streaming' ? '解牌中…' : '开始解牌'}
                        </motion.button>
                      )}
                    </div>

                    {allRevealed && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative mx-auto mt-5 max-w-[520px] space-y-1.5 border-t border-white/8 bg-[#07070c]/55 px-4 py-3 backdrop-blur-sm">
                        {result.relations.slice(0, 3).map((r, i) => (
                          <div key={i} className="flex gap-2 text-[0.64rem] leading-relaxed text-[#8b8899]">
                            <span className="mt-[6px] h-[3px] w-[3px] shrink-0 rotate-45 bg-[#8a6f3c]" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!result && <Empty>选一个牌阵，写下问题，然后洗牌。牌面由种子生成，翻牌后可以核对是否可复现。</Empty>}

          <ReadingPanel reading={reading} onRetry={start} openSettings={openSettings} title="牌面解读" />
        </div>
      </div>
    </div>
  )
}
