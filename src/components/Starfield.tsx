import { useEffect, useRef } from 'react'

/**
 * 星空：缓慢漂移的星点 + 视差 + 偶发流星。
 * 用 canvas 而不是几百个 DOM 节点，滚动和动画都不会卡。
 */
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

    type Star = { x: number; y: number; z: number; r: number; tw: number; ph: number }
    let stars: Star[] = []
    let meteors: { x: number; y: number; vx: number; vy: number; life: number; len: number }[] = []

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(420, Math.floor((w * h) / 4200))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,
        r: Math.random() * 1.3 + 0.25,
        tw: Math.random() * 0.9 + 0.3,
        ph: Math.random() * Math.PI * 2,
      }))
    }

    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2
    }

    let t = 0
    const draw = () => {
      t += 0.006
      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04
      ctx.clearRect(0, 0, w, h)

      for (const s of stars) {
        const px = s.x - mouse.x * 18 * s.z
        const py = s.y - mouse.y * 18 * s.z
        const alpha = reduced ? 0.4 : 0.1 + Math.sin(t * 2 * s.tw + s.ph) * 0.14 + 0.2
        ctx.beginPath()
        ctx.arc(px, py, s.r * s.z * 0.85, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${226 + s.z * 20}, ${222 + s.z * 16}, ${244}, ${Math.max(0.05, alpha)})`
        ctx.fill()
        if (s.r > 1.1) {
          ctx.beginPath()
          ctx.arc(px, py, s.r * 4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200, 210, 255, ${alpha * 0.055})`
          ctx.fill()
        }
      }

      if (!reduced) {
        if (Math.random() < 0.0022 && meteors.length < 2) {
          const fromLeft = Math.random() < 0.5
          meteors.push({
            x: fromLeft ? -60 : w + 60,
            y: Math.random() * h * 0.55,
            vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 4),
            vy: 1.6 + Math.random() * 1.6,
            life: 1,
            len: 90 + Math.random() * 90,
          })
        }
        meteors = meteors.filter((m) => {
          m.x += m.vx
          m.y += m.vy
          m.life -= 0.006
          if (m.life <= 0) return false
          const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * (m.len / 8), m.y - m.vy * (m.len / 8))
          g.addColorStop(0, `rgba(255, 236, 200, ${0.55 * m.life})`)
          g.addColorStop(1, 'rgba(255, 236, 200, 0)')
          ctx.strokeStyle = g
          ctx.lineWidth = 1.1
          ctx.beginPath()
          ctx.moveTo(m.x, m.y)
          ctx.lineTo(m.x - m.vx * (m.len / 8), m.y - m.vy * (m.len / 8))
          ctx.stroke()
          return true
        })
      }

      raf = requestAnimationFrame(draw)
    }

    build()
    draw()
    window.addEventListener('resize', build)
    window.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', build)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#06060a]">
      {/* 星云底色 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1100px 700px at 18% -8%, rgba(108,92,231,0.16), transparent 62%),' +
            'radial-gradient(900px 620px at 86% 8%, rgba(184,71,58,0.12), transparent 60%),' +
            'radial-gradient(1200px 800px at 50% 110%, rgba(63,184,168,0.07), transparent 65%),' +
            'linear-gradient(180deg, #08080e 0%, #06060a 55%, #050509 100%)',
        }}
      />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      {/* 细颗粒，避免大面积渐变出现色带 */}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
