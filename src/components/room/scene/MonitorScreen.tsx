import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { useRoomStore } from "../store"
import { placeMonitorElement } from "../systems/monitorOverlay"
import { findOccluders } from "../systems/occluders"
import logoSvg from "../../../assets/jalu-logo.svg?raw"
import { applyScreenTexture, createCanvasSurface, loadImage } from "./canvasTexture"
import type { ViewPreset } from "./viewPresets"

const WALLPAPER_WIDTH = 1024
const WALLPAPER_HEIGHT = 576
// Space around the screen in the close-up: keeps the bezel visible and leaves room for the
// quick menu above and the Back button below.
const CLOSE_UP_MARGIN = 1.28
const CLOSE_UP_DISTANCE = 1.5

function drawWallpaper(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, WALLPAPER_WIDTH, WALLPAPER_HEIGHT)
  gradient.addColorStop(0, "#1f2937")
  gradient.addColorStop(0.55, "#115e59")
  gradient.addColorStop(1, "#b45309")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WALLPAPER_WIDTH, WALLPAPER_HEIGHT)
  ctx.fillStyle = "rgba(255,255,255,0.08)"
  ctx.beginPath()
  ctx.arc(WALLPAPER_WIDTH * 0.78, WALLPAPER_HEIGHT * 0.3, 190, 0, Math.PI * 2)
  ctx.fill()
  ctx.font = "32px Lato, sans-serif"
  ctx.fillStyle = "rgba(255,255,255,0.75)"
  ctx.fillText("jaluwibowo.id", 78, WALLPAPER_HEIGHT - 70)
}

const LOGO_SIZE = 170

// The site logo (same SVG as JaluLogoIcon.astro) in white, above the domain name.
async function drawLogo(ctx: CanvasRenderingContext2D) {
  const white = logoSvg.replaceAll("currentColor", "#ffffff")
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(white)}`)
  ctx.globalAlpha = 0.92
  ctx.drawImage(image, 64, WALLPAPER_HEIGHT - 110 - LOGO_SIZE, LOGO_SIZE, LOGO_SIZE)
  ctx.globalAlpha = 1
}

// Close-up camera for About & Contact, derived from the screen mesh (not a Blender camera).
export function monitorPreset(scene: THREE.Object3D, reference: ViewPreset | undefined): ViewPreset | null {
  const screen = scene.getObjectByName("int_monitor_screen")
  if (!(screen instanceof THREE.Mesh)) return null
  screen.updateWorldMatrix(true, false)
  screen.geometry.computeBoundingBox()
  const box = screen.geometry.boundingBox!
  const scale = screen.getWorldScale(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3()).applyMatrix4(screen.matrixWorld)
  const normal = new THREE.Vector3(0, 0, 1).transformDirection(screen.matrixWorld)
  const position = center.clone().addScaledVector(normal, CLOSE_UP_DISTANCE)
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().lookAt(position, center, new THREE.Vector3(0, 1, 0))
  )
  const halfWidth = ((box.max.x - box.min.x) * scale.x * CLOSE_UP_MARGIN) / 2
  const halfHeight = ((box.max.y - box.min.y) * scale.y * CLOSE_UP_MARGIN) / 2
  return { position, quaternion, halfWidth, halfHeight, near: 0.01, far: reference?.far ?? 30 }
}

// Objects between the screen and the close-up camera (e.g. the desk chair) are hidden while
// the close-up is active so nothing covers the desktop.
function screenOccluders(scene: THREE.Object3D, screen: THREE.Mesh): THREE.Object3D[] {
  screen.updateWorldMatrix(true, false)
  const normal = new THREE.Vector3(0, 0, 1).transformDirection(screen.matrixWorld)
  return findOccluders(scene, new THREE.Box3().setFromObject(screen), normal, CLOSE_UP_DISTANCE, [screen.parent!])
}

export default function MonitorScreen({ scene }: { scene: THREE.Object3D }) {
  const screen = useMemo(() => scene.getObjectByName("int_monitor_screen") ?? null, [scene])
  const inCloseUp = useRoomStore((state) => state.view === "monitor")
  const occluders = useMemo(() => (screen instanceof THREE.Mesh ? screenOccluders(scene, screen) : []), [scene, screen])

  useEffect(() => {
    if (!inCloseUp) return
    occluders.forEach((node) => (node.visible = false))
    return () => occluders.forEach((node) => (node.visible = true))
  }, [inCloseUp, occluders])
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useEffect(() => {
    if (!(screen instanceof THREE.Mesh)) return
    const { ctx, texture } = createCanvasSurface(WALLPAPER_WIDTH, WALLPAPER_HEIGHT)
    drawWallpaper(ctx)
    applyScreenTexture(screen.material as THREE.Material, texture, 0.9)
    drawLogo(ctx)
      .then(() => (texture.needsUpdate = true))
      .catch(() => console.warn("[room] monitor: logo could not be drawn"))
    return () => texture.dispose()
  }, [screen])

  // Keeps the DOM mini desktop glued to the projected screen once the close-up has settled.
  useFrame(() => {
    const { settledView, popup } = useRoomStore.getState()
    if (!(screen instanceof THREE.Mesh) || settledView !== "monitor" || popup?.section !== "about-contact") {
      return placeMonitorElement(null)
    }
    const box = screen.geometry.boundingBox ?? (screen.geometry.computeBoundingBox(), screen.geometry.boundingBox!)
    const corners = [
      [box.min.x, box.min.y],
      [box.max.x, box.max.y]
    ].map(([x, y]) => new THREE.Vector3(x, y, 0).applyMatrix4(screen.matrixWorld).project(camera))
    const xs = corners.map((p) => ((p.x + 1) / 2) * size.width)
    const ys = corners.map((p) => ((1 - p.y) / 2) * size.height)
    placeMonitorElement({
      left: Math.min(...xs),
      top: Math.min(...ys),
      width: Math.abs(xs[1] - xs[0]),
      height: Math.abs(ys[1] - ys[0])
    })
  })

  return null
}
