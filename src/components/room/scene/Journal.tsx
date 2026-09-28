import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { useRoomData } from "../roomData"
import { createCanvasSurface } from "./canvasTexture"

// Open journal (two pages, 10:7): handwritten Blog titles on the left, Talks on the right,
// taken from the room data so the pages follow new posts and talks.
const WIDTH = 1000
const HEIGHT = 700
const PAGE = WIDTH / 2
const LINE_GAP = 44
const MAX_ENTRIES = 5
const HAND = "'Segoe Print', 'Comic Sans MS', 'Bradley Hand', cursive"
const INK = "#1e3a8a"
const RED_INK = "#b91c1c"

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines.slice(0, 2)
}

function drawPage(ctx: CanvasRenderingContext2D, left: number, title: string, entries: string[], seed: number) {
  ctx.fillStyle = "#f5ecd7"
  ctx.fillRect(left, 0, PAGE, HEIGHT)

  // Ruled lines and a red margin.
  ctx.strokeStyle = "rgba(59,130,246,0.25)"
  ctx.lineWidth = 2
  for (let y = 120; y < HEIGHT - 20; y += LINE_GAP) {
    ctx.beginPath()
    ctx.moveTo(left + 20, y)
    ctx.lineTo(left + PAGE - 20, y)
    ctx.stroke()
  }
  ctx.strokeStyle = "rgba(220,38,38,0.35)"
  ctx.beginPath()
  ctx.moveTo(left + 70, 20)
  ctx.lineTo(left + 70, HEIGHT - 20)
  ctx.stroke()

  // Title with a wobbly underline.
  ctx.fillStyle = INK
  ctx.font = `bold 52px ${HAND}`
  ctx.fillText(title, left + 86, 92)
  const width = ctx.measureText(title).width
  ctx.strokeStyle = RED_INK
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(left + 84, 104)
  ctx.quadraticCurveTo(left + 86 + width / 2, 112 + (seed % 2) * 4, left + 92 + width, 102)
  ctx.stroke()

  // Entries: a dash bullet each, wrapped to two lines, on the ruled lines.
  ctx.font = `26px ${HAND}`
  let y = 120 + LINE_GAP - 10
  for (const entry of entries) {
    const lines = wrap(ctx, entry, PAGE - 130)
    if (y + (lines.length - 1) * LINE_GAP > HEIGHT - 40) break
    ctx.fillStyle = RED_INK
    ctx.fillText("–", left + 80, y)
    ctx.fillStyle = INK
    lines.forEach((line, i) => ctx.fillText(line, left + 104, y + i * LINE_GAP))
    y += lines.length * LINE_GAP
  }
}

function drawScribbles(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = RED_INK
  ctx.lineWidth = 3
  // Star in the left page corner, arrow and squiggle on the right page.
  ctx.beginPath()
  for (let i = 0; i <= 10; i++) {
    const r = i % 2 === 0 ? 22 : 9
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const x = PAGE - 60 + r * Math.cos(a)
    const y = 70 + r * Math.sin(a)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.strokeStyle = INK
  ctx.beginPath()
  ctx.moveTo(WIDTH - 150, HEIGHT - 60)
  ctx.bezierCurveTo(WIDTH - 120, HEIGHT - 90, WIDTH - 90, HEIGHT - 30, WIDTH - 60, HEIGHT - 70)
  ctx.moveTo(WIDTH - 72, HEIGHT - 82)
  ctx.lineTo(WIDTH - 60, HEIGHT - 70)
  ctx.lineTo(WIDTH - 76, HEIGHT - 62)
  ctx.stroke()

  // Soft shadow along the spine.
  const spine = ctx.createLinearGradient(PAGE - 40, 0, PAGE + 40, 0)
  spine.addColorStop(0, "rgba(0,0,0,0)")
  spine.addColorStop(0.5, "rgba(0,0,0,0.18)")
  spine.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = spine
  ctx.fillRect(PAGE - 40, 0, 80, HEIGHT)
}

export default function Journal({ scene }: { scene: THREE.Object3D }) {
  const { blog, talks } = useRoomData()
  const pages = useMemo(() => scene.getObjectByName("int_journal_pages") ?? null, [scene])

  useEffect(() => {
    if (!(pages instanceof THREE.Mesh) || !(pages.material instanceof THREE.MeshStandardMaterial)) return
    const { ctx, texture } = createCanvasSurface(WIDTH, HEIGHT)
    drawPage(ctx, 0, "Blog", blog.slice(0, MAX_ENTRIES).map((post) => post.title), 1)
    drawPage(ctx, PAGE, "Talks", talks.slice(0, MAX_ENTRIES).map((talk) => talk.title), 2)
    drawScribbles(ctx)
    const material = pages.material
    material.map = texture
    material.color.set("#ffffff")
    material.needsUpdate = true
    return () => texture.dispose()
  }, [pages, blog, talks])

  return null
}
