import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import BaguaRing from '../components/BaguaRing'
import { useUi, type RouteKey } from '../lib/uiStore'
import { Solar } from 'lunar-javascript'
import { GAN, ZHI } from '../lib/constants'

interface Entry {
  key: RouteKey
  no: string
  title: string
  en: string
  gua: string
  symbol: string
  color: string
  desc: string
  tags: string[]
}

const ENTRIES: Entry[] = [
  {
    key: 'bazi', no: '壹', title: '四柱八字', en: 'FOUR PILLARS', gua: '乾', symbol: '☰', color: '#d8b06a',
    desc: '以出生时刻排出年月日时四柱，看日主旺衰、十神结构、五行分布与大运流年。',
    tags: ['四柱', '十神', '大运', '神煞'],
  },
  {
    key: 'ziwei', no: '贰', title: '紫微斗数', en: 'ZIWEI DOUSHU', gua: '离', symbol: '☲', color: '#9b8ae6',
    desc: '十二宫安星，看命宫身宫、三方四正、生年四化，以及大限流年落在哪一宫。',
    tags: ['十二宫', '四化', '大限', '流年'],
  },
  {
    key: 'qimen', no: '叁', title: '奇门遁甲', en: 'QIMEN DUNJIA', gua: '坎', symbol: '☵', color: '#45c2b0',
    desc: '时家转盘起局，九宫布星门神仪，看值符值使与用神落宫，问一件具体的事。',
    tags: ['九宫', '八门', '九星', '八神'],
  },
  {
    key: 'tarot', no: '肆', title: '塔罗牌', en: 'TAROT', gua: '兑', symbol: '☱', color: '#c07ad0',
    desc: '七十八张牌，五种牌阵。洗牌与抽牌由种子决定，可复现、可核对。',
    tags: ['78 张', '5 种牌阵', '可复现'],
  },
  {
    key: 'love', no: '伍', title: '姻缘', en: 'MARRIAGE', gua: '坤', symbol: '☷', color: '#d4736b',
    desc: '八字合婚、生肖配对、夫妻宫、桃花运、求签与红线画像，六种问法。',
    tags: ['合婚', '桃花', '求签', '红线'],
  },
  {
    key: 'fengshui', no: '陆', title: '堪舆风水', en: 'FENGSHUI', gua: '艮', symbol: '☶', color: '#c9a227',
    desc: '玄空飞星排九宫、八宅游年定四吉四凶，再按黄历选一个合适的入宅日子。',
    tags: ['飞星', '八宅', '命卦', '择日'],
  },
]

export default function Home() {
  const goto = useUi((s) => s.goto)
  const [active, setActive] = useState<Entry | null>(null)

  const today = useMemo(() => {
    const l = Solar.fromDate(new Date()).getLunar()
    return {
      date: `${l.getYear()} · ${l.getMonth()} · ${l.getDay()}`,
      lunar: `${l.getMonthInChinese()}月${l.getDayInChinese()}`,
      ganZhi: `${l.getYearInGanZhi()}年 ${l.getMonthInGanZhi()}月 ${l.getDayInGanZhi()}日`,
      shengxiao: l.getYearShengXiao(),
      yi: (l.getDayYi() || []).slice(0, 3),
      ji: (l.getDayJi() || []).slice(0, 3),
      jieqi: l.getPrevJieQi(true)?.getName?.() || '',
    }
  }, [])

  const color = active?.color || '#d8b06a'

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="relative grid min-h-[72vh] items-center gap-10 pb-16 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="h-[1px] w-8 bg-[#8a6f3c]" />
              <span className="mono text-[0.62rem] tracking-[0.34em] text-[#8a6f3c]">TRADITIONAL DIVINATION · ENGINEERED</span>
            </div>

            <h1 className="serif text-[clamp(1.85rem,4.1vw,3.3rem)] leading-[1.22] tracking-[0.04em] text-[#f5ebd8]">
              在星图与卦象之间
              <br />
              <span className="gold-gradient">问一个具体的问题</span>
            </h1>

            <p className="mt-6 max-w-[520px] text-[0.9rem] leading-[1.95] text-[#a5a1b3]">
              四柱、紫微、奇门、飞星——这些体系的排盘规则是确定的，可以逐条核对。
              玄枢把它们写成算法，再让模型只做一件事：把盘面上的符号，翻成你能用的话。
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={() => document.getElementById('entries')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn"
              >
                选择一门术数
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1">
                  <path d="M7 2v10M3 8l4 4 4-4" />
                </svg>
              </button>
              <button onClick={() => goto('tarot')} className="btn btn-ghost">
                先抽一张牌
              </button>
            </div>

            {/* 今日盘面 */}
            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/6 pt-5 text-[0.7rem] text-[#77748a]">
              <span className="mono tracking-wider text-[#a9a6b8]">
                {today.ganZhi}
              </span>
              <span className="text-[#5f5c6d]">|</span>
              <span>农历 {today.lunar} · {today.shengxiao}年</span>
              {today.jieqi && <span className="text-[#8a6f3c]">节气 · {today.jieqi}</span>}
              {today.yi.length > 0 && (
                <>
                  <span className="text-[#5f5c6d]">|</span>
                  <span>
                    宜 <span className="text-[#7fae8e]">{today.yi.join(' ')}</span>
                  </span>
                </>
              )}
              {today.ji.length > 0 && (
                <span>
                  忌 <span className="text-[#b8766a]">{today.ji.join(' ')}</span>
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* 八卦环 */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-[62%] w-[62%] rounded-full blur-[60px] transition-colors duration-700"
              style={{ background: `radial-gradient(circle, ${color}22, transparent 70%)` }}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.86, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[460px]"
          >
            <BaguaRing size={460} color={color} spin={140} active={active?.gua ?? null} className="max-w-full">
              <div className="pointer-events-none text-center">
                <div className="serif text-[2.6rem] leading-none tracking-[0.3em] text-[#f2dcae]/85" style={{ textShadow: `0 0 40px ${color}66` }}>
                  {active ? active.gua : '玄'}
                </div>
                <div className="mono mt-2 text-[0.54rem] tracking-[0.3em] text-[#8a6f3c]">
                  {active ? active.en : 'WUJI'}
                </div>
              </div>
            </BaguaRing>
          </motion.div>
        </div>
      </section>

      {/* ---------------- 入口 ---------------- */}
      <section id="entries" className="scroll-mt-24 pb-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="mono text-[0.6rem] tracking-[0.3em] text-[#6a5730]">SIX SYSTEMS</div>
            <h2 className="mt-1.5 text-[1.35rem] tracking-wide text-[#ede7f5]">六门 · 各有所问</h2>
          </div>
          <div className="hidden text-[0.7rem] text-[#605d70] sm:block">悬停查看卦象</div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ENTRIES.map((e, i) => {
            const on = active?.key === e.key
            return (
              <motion.button
                key={e.key}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setActive(e)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(e)}
                onClick={() => goto(e.key)}
                className="group relative overflow-hidden border p-5 text-left transition-all duration-500"
                style={{
                  borderColor: on ? `${e.color}66` : 'rgba(255,255,255,0.07)',
                  background: on
                    ? `linear-gradient(150deg, ${e.color}14, rgba(10,10,16,0.9))`
                    : 'linear-gradient(150deg, rgba(20,20,30,0.7), rgba(9,9,15,0.85))',
                  transform: on ? 'translateY(-3px)' : 'none',
                  boxShadow: on ? `0 18px 50px -22px ${e.color}88` : 'none',
                }}
              >
                {/* 角落符号 */}
                <div
                  className="pointer-events-none absolute -right-4 -top-5 select-none text-[5.4rem] leading-none transition-all duration-700"
                  style={{ color: e.color, opacity: on ? 0.13 : 0.055 }}
                >
                  {e.symbol}
                </div>

                <div className="relative flex items-start justify-between">
                  <span className="mono text-[0.6rem] tracking-[0.25em]" style={{ color: `${e.color}99` }}>
                    {e.no}
                  </span>
                  <span className="mono text-[0.52rem] tracking-[0.22em] text-[#5f5c6d]">{e.en}</span>
                </div>

                <div className="relative mt-5 flex items-baseline gap-2.5">
                  <h3 className="serif text-[1.3rem] tracking-[0.1em] text-[#f0eaf7]">{e.title}</h3>
                  <span className="text-[0.7rem]" style={{ color: e.color }}>
                    {e.symbol} {e.gua}
                  </span>
                </div>

                <p className="relative mt-2.5 text-[0.78rem] leading-[1.85] text-[#8b8899]">{e.desc}</p>

                <div className="relative mt-5 flex flex-wrap items-center gap-1.5">
                  {e.tags.map((t) => (
                    <span
                      key={t}
                      className="border px-1.5 py-0.5 text-[0.6rem] tracking-wide"
                      style={{ borderColor: `${e.color}2e`, color: `${e.color}cc` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-5 flex items-center gap-1.5 text-[0.68rem] tracking-[0.14em] transition-all duration-300"
                  style={{ color: e.color, opacity: on ? 1 : 0.45 }}
                >
                  进入
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.1">
                    <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" />
                  </svg>
                </div>
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* ---------------- 为什么可信 ---------------- */}
      <section className="mt-16 border-t border-white/6 pt-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="mono text-[0.6rem] tracking-[0.3em] text-[#6a5730]">HOW IT WORKS</div>
            <h2 className="mt-2 text-[1.5rem] leading-snug tracking-wide text-[#ede7f5]">
              盘是算出来的
              <br />
              <span className="text-[#8a6f3c]">话是问出来的</span>
            </h2>
            <p className="mt-4 text-[0.82rem] leading-[1.95] text-[#8b8899]">
              大模型很会说话，但不擅长排盘。历法换算、定局起盘、安星布门这些地方，「看起来对」的错误最难被发现。
              所以这里把它们拆开了。
            </p>

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/6 pt-6">
              {[
                ['9', '部典籍', '穷通宝典 · 三命通会 · 沈氏玄空学'],
                ['78', '张塔罗', '22 大阿卡纳 + 56 小阿卡纳'],
                ['100', '支姻缘签', '签诗 · 签解 · 姻缘解读'],
                ['24', '山罗盘', '玄空阴阳 · 三元龙 · 兼向'],
              ].map(([n, unit, note]) => (
                <div key={unit}>
                  <div className="flex items-baseline gap-1">
                    <span className="mono text-[1.25rem] leading-none text-[#d8b06a]">{n}</span>
                    <span className="text-[0.62rem] text-[#77748a]">{unit}</span>
                  </div>
                  <div className="mt-1.5 text-[0.58rem] leading-tight text-[#5c5969]">{note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { n: '01', t: '确定性计算', d: '四柱、九局、十二宫、飞星全部由代码算出，同一次输入永远得到同一结果。', c: '#45c2b0' },
              { n: '02', t: '可核对', d: '冬至定阳遁、符头定三元、立春分年——每条规则都写在出处，可以与通行排盘软件对照。', c: '#d8b06a' },
              { n: '03', t: '口径声明', d: '流派有分歧的地方（子时换日、中五寄坤、兼向度数）明确标注取哪一派，不假装唯一答案。', c: '#9b8ae6' },
              { n: '04', t: '模型只做解读', d: '换模型不会改变盘面。你接入的模型只负责把符号翻译成话，而不是替你想出一个盘。', c: '#d4736b' },
            ].map((x, i) => (
              <motion.div
                key={x.n}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="panel-flat p-4"
              >
                <div className="mono text-[0.58rem] tracking-[0.28em]" style={{ color: x.c }}>
                  {x.n}
                </div>
                <div className="mt-2 text-[0.9rem] tracking-wide text-[#ded9ea]">{x.t}</div>
                <p className="mt-1.5 text-[0.74rem] leading-[1.8] text-[#7d7a8d]">{x.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部卦序装饰 */}
      <div className="mt-16 flex items-center justify-center gap-3 opacity-[0.18]">
        {['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'].map((s, i) => (
          <span key={i} className="serif text-[0.9rem] tracking-[0.3em] text-[#d8b06a]">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
