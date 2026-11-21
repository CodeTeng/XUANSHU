import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Starfield from './components/Starfield'
import LlmSettings from './components/LlmSettings'
import OnboardingGuide from './components/OnboardingGuide'
import { useUi, routeFromHash, type RouteKey } from './lib/uiStore'
import { isConfigured, useLlm } from './lib/llm'
import Home from './pages/Home'

// 各术数页按需加载：首屏只带首页，iztro / lunar 的体量压到各自分块里
const BaziPage = lazy(() => import('./pages/Bazi'))
const ZiweiPage = lazy(() => import('./pages/Ziwei'))
const QimenPage = lazy(() => import('./pages/Qimen'))
const TarotPage = lazy(() => import('./pages/Tarot'))
const LovePage = lazy(() => import('./pages/Love'))
const FengshuiPage = lazy(() => import('./pages/Fengshui'))
const MethodPage = lazy(() => import('./pages/Method'))

function PageFallback() {
  return (
    <div className="flex min-h-[52vh] flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border border-[#d8b06a]/25 border-t-[#d8b06a]" />
        <div className="absolute inset-[10px] animate-pulse rounded-full border border-[#d8b06a]/15" />
      </div>
      <div className="mono text-[0.6rem] tracking-[0.3em] text-[#6a5730]">LOADING</div>
    </div>
  )
}

const NAV: { key: RouteKey; label: string; sub: string }[] = [
  { key: 'home', label: '玄枢', sub: 'XUANSHU' },
  { key: 'bazi', label: '四柱', sub: 'BAZI' },
  { key: 'ziwei', label: '紫微', sub: 'ZIWEI' },
  { key: 'qimen', label: '奇门', sub: 'QIMEN' },
  { key: 'tarot', label: '塔罗', sub: 'TAROT' },
  { key: 'love', label: '姻缘', sub: 'LOVE' },
  { key: 'fengshui', label: '堪舆', sub: 'FENGSHUI' },
]

export default function App() {
  const { route, goto, settingsOpen, openSettings, closeSettings } = useUi()
  const cfg = useLlm()
  const onboarded = useLlm((s) => s.onboarded)
  const setOnboarded = useLlm((s) => s.setOnboarded)

  useEffect(() => {
    useUi.setState({ route: routeFromHash() })
    const onHash = () => useUi.setState({ route: routeFromHash() })
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const ready = isConfigured(cfg)

  return (
    <div className="relative min-h-screen">
      <Starfield />

      {/* 顶部导航 */}
      <header className="sticky top-0 z-30 border-b border-[rgba(216,176,106,0.12)] bg-[#06060a]/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <button onClick={() => goto('home')} className="group flex items-baseline gap-2.5">
            <span className="serif text-[1.28rem] tracking-[0.28em] text-[#f2dcae] transition group-hover:text-white">玄枢</span>
            <span className="mono hidden text-[0.54rem] tracking-[0.3em] text-[#6a5730] sm:block">XUANSHU</span>
          </button>

          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV.slice(1).map((n) => {
              const on = route === n.key
              return (
                <button
                  key={n.key}
                  onClick={() => goto(n.key)}
                  className={`relative px-3 py-2 text-[0.76rem] tracking-[0.12em] transition ${
                    on ? 'text-[#f2dcae]' : 'text-[#8b8899] hover:text-[#d6d2e0]'
                  }`}
                >
                  {n.label}
                  {on && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2 -bottom-[1px] h-[1px] bg-[#d8b06a]"
                      style={{ boxShadow: '0 0 8px rgba(216,176,106,0.8)' }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={openSettings}
              title={ready ? '切换模型或配置档案 · 本机私有' : '接入你自己的模型'}
              className="group flex items-center gap-2 border border-white/10 px-2.5 py-1.5 transition hover:border-[rgba(216,176,106,0.4)]"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-[#4ea87a]' : 'bg-[#b8473a]'}`}
                style={{ boxShadow: ready ? '0 0 8px #4ea87a' : '0 0 8px #b8473a' }}
              />
              <span className="max-w-[92px] truncate text-[0.68rem] tracking-wide text-[#a9a6b8] group-hover:text-[#f2dcae] sm:max-w-none">
                {ready ? cfg.model : '我的模型'}
              </span>
              <span className="hidden text-[0.52rem] tracking-wider text-[#5c5969] sm:inline">本机</span>
            </button>
          </div>
        </div>

        {/* 移动端导航 */}
        <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
          {NAV.slice(1).map((n) => {
            const on = route === n.key
            return (
              <button
                key={n.key}
                onClick={() => goto(n.key)}
                className={`whitespace-nowrap px-3 py-1.5 text-[0.72rem] tracking-wide ${on ? 'text-[#f2dcae]' : 'text-[#8b8899]'}`}
              >
                {n.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-[1320px] px-5 pb-24 pt-8 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            {route === 'home' && <Home />}
            <Suspense fallback={<PageFallback />}>
              {route === 'bazi' && <BaziPage />}
              {route === 'ziwei' && <ZiweiPage />}
              {route === 'qimen' && <QimenPage />}
              {route === 'tarot' && <TarotPage />}
              {route === 'love' && <LovePage />}
              {route === 'fengshui' && <FengshuiPage />}
              {route === 'about' && <MethodPage />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-5 py-6 text-center sm:px-8">
        <div className="mb-2.5 flex items-center justify-center gap-4 text-[0.66rem]">
          <button onClick={() => goto('about')} className="text-[#8a7a5a] transition hover:text-[#d8b06a]">
            方法与出处
          </button>
          <span className="h-3 w-[1px] bg-white/10" />
          <button onClick={openSettings} className="text-[#8a7a5a] transition hover:text-[#d8b06a]">
            接入模型
          </button>
        </div>
        <p className="text-[0.66rem] leading-relaxed text-[#5f5c6d]">
          排盘由确定性算法完成，解读由你接入的模型完成 · 内容为传统文化研究与娱乐参考，不构成医疗、法律、投资建议
        </p>
      </footer>

      <LlmSettings open={settingsOpen} onClose={closeSettings} />

      <AnimatePresence>
        {!onboarded && (
          <OnboardingGuide
            onConfigure={() => {
              setOnboarded(true)
              window.setTimeout(openSettings, 240)
            }}
            onSkip={() => setOnboarded(true)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
