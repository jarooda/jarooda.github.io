import { useEffect, useState } from "react"
import { useRoomStore } from "../store"

// `?fps` shows frame rate, quality tier and pixel ratio, for measuring on real devices (K38).
export const showFps = new URLSearchParams(window.location.search).has("fps")

export default function FpsMeter() {
  const tier = useRoomStore((state) => state.tier)
  const [stats, setStats] = useState({ fps: 0, min: 0 })

  useEffect(() => {
    let frames = 0
    let last = performance.now()
    let worst = Infinity
    let previous = last
    let raf = 0
    const loop = (now: number) => {
      frames++
      worst = Math.min(worst, 1000 / Math.max(1, now - previous))
      previous = now
      if (now - last >= 1000) {
        setStats({ fps: Math.round((frames * 1000) / (now - last)), min: Math.round(worst) })
        frames = 0
        worst = Infinity
        last = now
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <output className="pointer-events-none fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-sm bg-black/70 px-2 py-1 font-mono text-xs text-white">
      {stats.fps} fps (min {stats.min}) · {tier} · dpr {window.devicePixelRatio.toFixed(2)}
    </output>
  )
}
