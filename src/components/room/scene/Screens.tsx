import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useReducedMotion } from "../systems/useReducedMotion"
import { applyScreenTexture, createCanvasSurface, meshMaterial, type CanvasSurface } from "./canvasTexture"

// Idle life for the small screens (00 §5): slow, low-contrast changes so they read as "on"
// without pulling attention. Redraws are throttled; reduced motion keeps one still frame.
const REDRAW_SECONDS = 0.12
const TV_CHANNEL_SECONDS = 6
const LED_PERIOD_SECONDS = 2.8

const TV_CHANNELS = [
  ["#0f766e", "#1e3a8a"],
  ["#9a3412", "#7c2d12"],
  ["#4c1d95", "#be185d"],
  ["#14532d", "#0369a1"]
]

function drawTv({ ctx, canvas }: CanvasSurface, time: number) {
  const channel = Math.floor(time / TV_CHANNEL_SECONDS) % TV_CHANNELS.length
  const [a, b] = TV_CHANNELS[channel]
  const shift = (time % TV_CHANNEL_SECONDS) / TV_CHANNEL_SECONDS
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height * (0.5 + shift))
  gradient.addColorStop(0, a)
  gradient.addColorStop(1, b)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "rgba(255,255,255,0.12)"
  ctx.beginPath()
  ctx.arc(canvas.width * (0.2 + 0.6 * shift), canvas.height * 0.55, canvas.height * 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "rgba(0,0,0,0.12)"
  for (let y = 0; y < canvas.height; y += 4) ctx.fillRect(0, y, canvas.width, 1)
}

function drawConsole({ ctx, canvas }: CanvasSurface, time: number) {
  ctx.fillStyle = "#1e293b"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#16a34a"
  ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25)
  const x = ((time * 20) % (canvas.width + 16)) - 16
  const hop = Math.abs(Math.sin(time * 3)) * 10
  ctx.fillStyle = "#facc15"
  ctx.fillRect(x, canvas.height * 0.75 - 12 - hop, 12, 12)
  ctx.fillStyle = "#e2e8f0"
  ctx.fillRect(canvas.width * 0.7, canvas.height * 0.2, 16, 6)
}

function drawMp3({ ctx, canvas }: CanvasSurface, time: number) {
  ctx.fillStyle = "#0f172a"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const bars = 6
  const width = canvas.width / bars
  for (let i = 0; i < bars; i++) {
    const level = 0.25 + 0.6 * Math.abs(Math.sin(time * (1.3 + i * 0.37) + i))
    ctx.fillStyle = i % 2 ? "#38bdf8" : "#22d3ee"
    ctx.fillRect(i * width + 2, canvas.height * (1 - level), width - 4, canvas.height * level)
  }
}

const SCREENS = [
  { material: "emit_screen_tv", size: [320, 180], draw: drawTv, glow: 0.85 },
  { material: "emit_screen_console", size: [96, 160], draw: drawConsole, glow: 0.8 },
  { material: "emit_screen_mp3", size: [64, 80], draw: drawMp3, glow: 0.8 }
] as const

export default function Screens({ scene }: { scene: THREE.Object3D }) {
  const reducedMotion = useReducedMotion()
  const surfaces = useMemo(
    () =>
      SCREENS.flatMap((screen) => {
        const material = meshMaterial(scene, screen.material)
        if (!material) return []
        const surface = createCanvasSurface(screen.size[0], screen.size[1])
        screen.draw(surface, 0)
        applyScreenTexture(material, surface.texture, screen.glow)
        return [{ ...screen, surface }]
      }),
    [scene]
  )
  const led = useMemo(() => meshMaterial(scene, "emit_led_pc"), [scene])
  const lastDraw = useRef(0)

  useEffect(() => () => surfaces.forEach(({ surface }) => surface.texture.dispose()), [surfaces])

  useFrame(({ clock }) => {
    if (reducedMotion) return
    const time = clock.elapsedTime
    if (led instanceof THREE.MeshStandardMaterial) {
      led.emissiveIntensity = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin((time / LED_PERIOD_SECONDS) * Math.PI * 2))
    }
    if (time - lastDraw.current < REDRAW_SECONDS) return
    lastDraw.current = time
    for (const { surface, draw } of surfaces) {
      draw(surface, time)
      surface.texture.needsUpdate = true
    }
  })

  return null
}
