import { useEffect, useMemo } from "react"
import * as THREE from "three"
import type { RoomProject } from "../../../data/room"
import { useRoomData } from "../roomData"
import { layoutBoard, type BoardLayout } from "../systems/boardLayout"
import { PROJECT_CATEGORY_LABELS } from "../ui/format"
import { createCanvasSurface } from "./canvasTexture"

const BOARD_WIDTH = 1024
const BOARD_HEIGHT = 768
const NOTE_SIZE = 256
// Share of the board (from its right edge) used for the project graph; doodles use the rest.
const NOTE_AREA = 0.62
// Physical sticky-note size on the board (the template is larger; notes are scaled down).
const NOTE_METERS = 0.1
const AREA_PADDING = 24
const HUB_FONT = "30px 'Segoe Print', 'Comic Sans MS', 'Bradley Hand', cursive"
const HUB_PADDING = 22

export const CATEGORY_COLORS: Record<string, string> = {
  "web-app": "#fde68a",
  "mobile-app": "#fbcfe8",
  library: "#bfdbfe",
  tool: "#bbf7d0",
  extension: "#fed7aa",
  game: "#ddd6fe",
  other: "#e5e7eb"
}

const MARKERS = ["#1d4ed8", "#b91c1c", "#1f2937", "#047857"]

function drawDoodles(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f7f7f2"
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  const left = BOARD_WIDTH * (1 - NOTE_AREA)

  // A slightly wobbly stroke reads as hand-drawn marker.
  const wobble = (points: [number, number][], color: string, width = 6) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    points.forEach(([x, y], i) => {
      const jx = x + Math.sin(i * 12.9898 + x) * 2
      const jy = y + Math.cos(i * 78.233 + y) * 2
      if (i === 0) ctx.moveTo(jx, jy)
      else ctx.lineTo(jx, jy)
    })
    ctx.stroke()
  }
  const box = (x: number, y: number, w: number, h: number, color: string) =>
    wobble([[x, y], [x + w, y + 2], [x + w - 2, y + h], [x + 1, y + h - 2], [x, y]], color)
  const arrow = (x1: number, y1: number, x2: number, y2: number, color: string) => {
    wobble([[x1, y1], [(x1 + x2) / 2 + 6, (y1 + y2) / 2 - 6], [x2, y2]], color)
    const angle = Math.atan2(y2 - y1, x2 - x1)
    wobble([[x2 - 26 * Math.cos(angle - 0.5), y2 - 26 * Math.sin(angle - 0.5)], [x2, y2], [x2 - 26 * Math.cos(angle + 0.5), y2 - 26 * Math.sin(angle + 0.5)]], color)
  }

  ctx.font = "bold 58px 'Segoe Print', 'Comic Sans MS', 'Bradley Hand', cursive"
  ctx.fillStyle = MARKERS[0]
  ctx.fillText("Projects", 60, 110)
  wobble([[56, 128], [200, 132], [330, 126]], MARKERS[1], 5)

  // Tiny "idea → build → ship" flow.
  box(70, 200, 120, 80, MARKERS[2])
  box(250, 330, 130, 80, MARKERS[3])
  box(70, 470, 120, 80, MARKERS[0])
  arrow(190, 245, 250, 350, MARKERS[1])
  arrow(250, 395, 195, 500, MARKERS[1])
  ctx.font = "34px 'Segoe Print', 'Comic Sans MS', 'Bradley Hand', cursive"
  ctx.fillStyle = MARKERS[2]
  ctx.fillText("idea", 95, 252)
  ctx.fillStyle = MARKERS[3]
  ctx.fillText("build", 272, 382)
  ctx.fillStyle = MARKERS[0]
  ctx.fillText("ship!", 92, 522)

  // Checkbox list and a little star.
  for (let i = 0; i < 3; i++) box(70, 610 + i * 44, 26, 26, MARKERS[2])
  wobble([[74, 624], [84, 634], [100, 606]], MARKERS[3], 5)
  wobble([[74, 668], [84, 678], [100, 650]], MARKERS[3], 5)
  const star = Array.from({ length: 11 }, (_, i) => {
    const r = i % 2 === 0 ? 38 : 16
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    return [left - 70 + r * Math.cos(a), 150 + r * Math.sin(a)] as [number, number]
  })
  wobble(star, MARKERS[1], 5)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
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
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "")}…`
  }
  return lines
}

function drawNote(project: RoomProject | null) {
  const { ctx, texture } = createCanvasSurface(NOTE_SIZE, NOTE_SIZE)
  ctx.fillStyle = project ? CATEGORY_COLORS[project.category] ?? CATEGORY_COLORS.other : "#ffffff"
  ctx.fillRect(0, 0, NOTE_SIZE, NOTE_SIZE)
  ctx.fillStyle = "rgba(0,0,0,0.06)"
  ctx.fillRect(0, 0, NOTE_SIZE, 26)
  ctx.fillStyle = "#1f2937"
  ctx.textAlign = "center"

  if (!project) {
    ctx.font = "bold 34px Lato, sans-serif"
    ctx.fillText("See all →", NOTE_SIZE / 2, NOTE_SIZE / 2 + 12)
    return texture
  }

  ctx.font = "bold 28px Lato, sans-serif"
  const lines = wrapText(ctx, project.title, NOTE_SIZE - 40, 4)
  const top = NOTE_SIZE / 2 - ((lines.length - 1) * 32) / 2
  lines.forEach((line, i) => ctx.fillText(line, NOTE_SIZE / 2, top + i * 32))
  ctx.font = "20px Lato, sans-serif"
  ctx.fillStyle = "#4b5563"
  ctx.fillText(PROJECT_CATEGORY_LABELS[project.category] ?? project.category, NOTE_SIZE / 2, NOTE_SIZE - 22)
  return texture
}

// Marker links between notes and hubs, then the hubs as circled handwritten names.
// Notes are 3D meshes drawn on top, so lines can simply run to their centers.
function drawGraph(ctx: CanvasRenderingContext2D, layout: BoardLayout) {
  ctx.lineCap = "round"
  layout.edges.forEach(({ from, to, toHub }, i) => {
    ctx.strokeStyle = toHub ? "#475569" : MARKERS[1]
    ctx.lineWidth = 4
    ctx.setLineDash(i % 3 === 2 ? [14, 10] : [])
    const midX = (from.x + to.x) / 2 + Math.sin(i * 7.1) * 12
    const midY = (from.y + to.y) / 2 + Math.cos(i * 5.3) * 12
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.quadraticCurveTo(midX, midY, to.x, to.y)
    ctx.stroke()
  })
  ctx.setLineDash([])

  ctx.font = HUB_FONT
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  layout.hubs.forEach(({ title, x, y }, i) => {
    const w = ctx.measureText(title).width / 2 + HUB_PADDING
    ctx.fillStyle = "#f7f7f2"
    ctx.strokeStyle = MARKERS[i % MARKERS.length]
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.ellipse(x, y, w, 30, (i % 2 ? -1 : 1) * 0.06, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = MARKERS[i % MARKERS.length]
    ctx.fillText(title, x, y + 2)
  })
  ctx.textAlign = "start"
  ctx.textBaseline = "alphabetic"
}

export default function Whiteboard({ scene }: { scene: THREE.Object3D }) {
  const { projects } = useRoomData()
  const board = useMemo(() => scene.getObjectByName("int_whiteboard") ?? null, [scene])
  const surface = useMemo(() => scene.getObjectByName("int_whiteboard_surface") ?? null, [scene])
  const template = useMemo(() => scene.getObjectByName("int_sticky_note_template") ?? null, [scene])

  useEffect(() => {
    if (!board || !(surface instanceof THREE.Mesh) || !(template instanceof THREE.Mesh)) return
    if (!(surface.material instanceof THREE.MeshStandardMaterial)) return

    // Surface bounds in the board's space: the surface faces +X, the viewer's left is +Z.
    surface.geometry.computeBoundingBox()
    const bounds = surface.geometry.boundingBox!.clone().translate(surface.position)
    const boardWidth = bounds.max.z - bounds.min.z
    const boardHeight = bounds.max.y - bounds.min.y
    const pxPerMeter = BOARD_WIDTH / boardWidth
    const toBoard = (x: number, y: number) => ({
      z: bounds.max.z - (x / BOARD_WIDTH) * boardWidth,
      y: bounds.max.y - (y / BOARD_HEIGHT) * boardHeight
    })

    const { ctx, texture } = createCanvasSurface(BOARD_WIDTH, BOARD_HEIGHT)
    ctx.font = HUB_FONT
    const layout = layoutBoard(
      projects,
      { left: BOARD_WIDTH * (1 - NOTE_AREA), top: AREA_PADDING, right: BOARD_WIDTH - AREA_PADDING, bottom: BOARD_HEIGHT - AREA_PADDING },
      NOTE_METERS * pxPerMeter,
      (title) => ctx.measureText(title).width + HUB_PADDING * 2
    )

    drawDoodles(ctx)
    drawGraph(ctx, layout)
    const material = surface.material
    material.map = texture
    material.color.set("#ffffff")
    material.needsUpdate = true

    template.geometry.computeBoundingBox()
    const templateBox = template.geometry.boundingBox!
    const scale = NOTE_METERS / (templateBox.max.z - templateBox.min.z)
    const noteHeight = (templateBox.max.y - templateBox.min.y) * scale

    const notes = layout.notes.map(({ project, x, y, tilt }) => {
      const note = template.clone()
      const noteMaterial = (template.material as THREE.Material).clone() as THREE.MeshStandardMaterial
      noteMaterial.map = drawNote(project)
      noteMaterial.color.set("#ffffff")
      note.material = noteMaterial
      note.name = project ? `sticky_note_${project.id}` : "sticky_note_see_all"
      note.visible = true
      note.userData = {
        section: "projects",
        zone: "whiteboard",
        label: project ? project.title : "See all projects",
        ...(project ? { projectId: project.id } : { seeAll: true })
      }
      const center = toBoard(x, y)
      // The template's origin is its bottom edge; place it so the note is centered on the layout point.
      note.position.set(bounds.max.x, center.y - noteHeight / 2, center.z)
      note.scale.setScalar(scale)
      note.rotation.set(THREE.MathUtils.degToRad(tilt), 0, 0)
      board.add(note)
      return note
    })

    return () => {
      texture.dispose()
      for (const note of notes) {
        board.remove(note)
        const noteMaterial = note.material as THREE.MeshStandardMaterial
        noteMaterial.map?.dispose()
        noteMaterial.dispose()
      }
    }
  }, [board, surface, template, projects])

  return null
}
