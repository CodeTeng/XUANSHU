import { motion } from 'framer-motion'

/**
 * 首次引导。
 *
 * 这个站的模型是「每人自带」：不托管、不共享额度。但这件事如果不说清楚，
 * 用户会默认站长在付钱，或者担心自己的 Key 被别人用。所以第一次进来就讲明白。
 */
export default function OnboardingGuide({ onConfigure, onSkip }: { onConfigure: () => void; onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/62 px-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="panel corner-frame relative w-full max-w-[530px] overflow-hidden bg-[#0b0b13]/97 p-7 sm:p-9"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(216,176,106,0.12),transparent_60%)]" />

        <div className="relative">
          <div className="mono text-[0.58rem] tracking-[0.32em] text-[#6a5730]">BRING YOUR OWN MODEL</div>
          <h2 className="mt-2.5 serif text-[1.55rem] leading-snug tracking-[0.06em] text-[#f2dcae]">
            用你自己的模型
          </h2>
          <p className="mt-3 text-[0.84rem] leading-[1.95] text-[#b8b4c6]">
            这个站不提供模型，也不托管任何 Key。每个人打开同一个网址，
            用的是自己的端点、自己的 Key、自己的额度。
          </p>

          <div className="mt-6 space-y-3">
            {[
              ['只存在你这台设备', 'Key 写在本浏览器的 localStorage 里，换设备不会同步。'],
              ['服务端不落盘', '请求经本地服务转发以绕开跨域，内存过一遍，不写日志。'],
              ['排盘不花 token', '四柱、九局、十二宫都由算法算，只有点「开始推演」才调用模型。'],
            ].map(([t, d], i) => (
              <div key={t} className="flex gap-3">
                <span className="mono mt-[2px] shrink-0 text-[0.62rem] text-[#8a6f3c]">0{i + 1}</span>
                <div>
                  <div className="text-[0.82rem] text-[#e6e2ef]">{t}</div>
                  <div className="mt-0.5 text-[0.74rem] leading-relaxed text-[#8b8899]">{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <button onClick={onConfigure} className="btn flex-1 sm:flex-none">
              接入我的模型
            </button>
            <button onClick={onSkip} className="btn btn-ghost">
              先逛逛，稍后再说
            </button>
          </div>

          <p className="mt-4 text-[0.62rem] leading-relaxed text-[#5c5969]">
            随时可从右上角「我的模型」修改、存多套配置或一键切换。已存过的配置会保留在这台设备上。
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
