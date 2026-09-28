import { useFrame, useThree } from "@react-three/fiber"
import gsap from "gsap"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { RUBIK_FACES } from "../rubikFaces"
import { useRubikStore } from "../rubikStore"
import { useRoomStore } from "../store"
import {
  SIDE_ORDER,
  orientationShowing,
  sideFacingCamera,
  snapOrientation,
  type RubikSide
} from "../systems/rubikOrientation"
import { findOccluders } from "../systems/occluders"
import { useReducedMotion } from "../systems/useReducedMotion"
import { createCanvasSurface, loadImage, meshMaterial } from "./canvasTexture"
import type { ViewPreset } from "./viewPresets"

const TEXTURE_SIZE = 512
const FOCUS_SCALE = 6
const FLY_SECONDS = 0.7
const SNAP_SECONDS = 0.35
const DRAG_RADIANS_PER_PX = 0.01

const LOGO_OUTLINE = 6
// Far enough to reach past the room's open side from the focus point.
const OCCLUDER_DISTANCE = 3

// Logo with a white outline (a white silhouette stamped around it), so logo colors never
// blend into the tinted sticker.
function outlinedLogo(image: HTMLImageElement, width: number, height: number) {
  const pad = LOGO_OUTLINE
  const silhouette = document.createElement("canvas")
  silhouette.width = width + pad * 2
  silhouette.height = height + pad * 2
  const s = silhouette.getContext("2d")!
  s.drawImage(image, pad, pad, width, height)
  s.globalCompositeOperation = "source-in"
  s.fillStyle = "#ffffff"
  s.fillRect(0, 0, silhouette.width, silhouette.height)

  const result = document.createElement("canvas")
  result.width = silhouette.width
  result.height = silhouette.height
  const r = result.getContext("2d")!
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    r.drawImage(silhouette, Math.cos(angle) * pad, Math.sin(angle) * pad)
  }
  r.drawImage(image, pad, pad, width, height)
  return result
}

// int_rubik's origin is its bottom center (contract origin rule for objects on a desk), so it
// would orbit around its underside. A pivot group at the cube's center takes over position,
// rotation and scale; int_rubik sits inside it, offset so nothing moves visually.
function centerPivot(rubik: THREE.Object3D): THREE.Object3D {
  if (rubik.parent?.name === "int_rubik_pivot") return rubik.parent
  const parent = rubik.parent!
  const center = new THREE.Box3()
  rubik.updateWorldMatrix(true, true)
  const toLocal = rubik.matrixWorld.clone().invert()
  rubik.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.computeBoundingBox()
      center.union(object.geometry.boundingBox!.clone().applyMatrix4(object.matrixWorld).applyMatrix4(toLocal))
    }
  })
  const offset = center.getCenter(new THREE.Vector3())

  const pivot = new THREE.Group()
  pivot.name = "int_rubik_pivot"
  pivot.position.copy(offset).multiply(rubik.scale).applyQuaternion(rubik.quaternion).add(rubik.position)
  pivot.quaternion.copy(rubik.quaternion)
  pivot.scale.copy(rubik.scale)
  parent.add(pivot)
  pivot.add(rubik)
  rubik.position.copy(offset).negate()
  rubik.quaternion.identity()
  rubik.scale.setScalar(1)
  return pivot
}

async function paintFace(side: RubikSide, material: THREE.Material) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return
  const { ctx, texture } = createCanvasSurface(TEXTURE_SIZE, TEXTURE_SIZE)
  const cell = TEXTURE_SIZE / 3
  const { slots, color } = RUBIK_FACES[side]

  // Slot = row × 3 + column, row 0 at the top (contract §8.2); glTF UVs put v = 0 at the top.
  const drawCell = (slot: number, image: HTMLImageElement | null, name: string) => {
    const x = (slot % 3) * cell
    const y = Math.floor(slot / 3) * cell
    ctx.fillStyle = color
    ctx.fillRect(x, y, cell, cell)
    if (image) {
      const size = cell * 0.58
      const ratio = image.width / image.height || 1
      const w = ratio >= 1 ? size : size * ratio
      const h = ratio >= 1 ? size / ratio : size
      const logo = outlinedLogo(image, w, h)
      ctx.drawImage(logo, x + (cell - logo.width) / 2, y + (cell - logo.height) / 2)
    } else {
      ctx.fillStyle = "#374151"
      ctx.font = "bold 26px Lato, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(name, x + cell / 2, y + cell / 2, cell - 16)
    }
  }

  slots.forEach((item, slot) => drawCell(slot, null, item.name))
  material.map = texture
  material.needsUpdate = true

  const images = await Promise.all(slots.map((item) => loadImage(item.logo).catch(() => null)))
  images.forEach((image, slot) => drawCell(slot, image, slots[slot].name))
  texture.needsUpdate = true
}

// `view` is the camera preset the focused Rubik is seen from; facing and snapping use it rather
// than the live camera, which may still be mid-transition when Tech Stack opens.
export default function Rubik({ scene, view }: { scene: THREE.Object3D; view: ViewPreset | undefined }) {
  const liveCamera = useThree((state) => state.camera)
  const camera = view ?? liveCamera
  const gl = useThree((state) => state.gl)
  const popup = useRoomStore((state) => state.popup)
  const request = useRubikStore((state) => state.request)
  const reducedMotion = useReducedMotion()
  const focused = popup?.section === "techstack" && !popup.projectId

  const rubik = useMemo(() => scene.getObjectByName("int_rubik") ?? null, [scene])
  const focus = useMemo(() => scene.getObjectByName("focus_rubik") ?? null, [scene])
  // Everything below moves the pivot, never int_rubik itself.
  const pivot = useMemo(() => (rubik ? centerPivot(rubik) : null), [rubik])
  const home = useMemo(
    () => pivot && { position: pivot.position.clone(), quaternion: pivot.quaternion.clone(), scale: pivot.scale.clone() },
    [pivot]
  )
  const faces = useMemo(
    () => SIDE_ORDER.map((side) => rubik?.getObjectByName(`int_rubik_face_${side}`)).filter((o): o is THREE.Mesh => o instanceof THREE.Mesh),
    [rubik]
  )
  // Objects between the focused cube and the desk camera (e.g. the chair) are hidden meanwhile.
  const occluders = useMemo(() => {
    if (!rubik || !pivot || !focus || !view) return []
    const cube = new THREE.Box3().setFromObject(rubik).getSize(new THREE.Vector3()).multiplyScalar(FOCUS_SCALE)
    const box = new THREE.Box3().setFromCenterAndSize(focus.getWorldPosition(new THREE.Vector3()), cube)
    const towardCamera = new THREE.Vector3(0, 0, 1).applyQuaternion(view.quaternion)
    return findOccluders(scene, box, towardCamera, OCCLUDER_DISTANCE, [pivot])
  }, [scene, rubik, pivot, focus, view])
  // Flying in/out and turning are separate so a turn can never cut the fly animation short.
  const flight = useRef<gsap.core.Timeline | null>(null)
  const flying = useRef(false)
  const tween = useRef<gsap.core.Timeline | null>(null)
  const dragging = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  useEffect(() => {
    if (!rubik) return
    for (const side of SIDE_ORDER) {
      const material = meshMaterial(rubik, `rubik_face_${side}`)
      if (material) void paintFace(side, material)
      else console.warn(`[room] rubik: missing material "rubik_face_${side}"`)
    }
  }, [rubik])

  // The pivot lives in the room hierarchy, so world-space targets are converted to its parent's space.
  const toParentQuaternion = (world: THREE.Quaternion) => {
    const parent = pivot!.parent!.getWorldQuaternion(new THREE.Quaternion())
    return parent.invert().multiply(world)
  }
  const worldQuaternion = () => pivot!.getWorldQuaternion(new THREE.Quaternion())

  const turnTo = (world: THREE.Quaternion, seconds: number, onDone?: () => void) => {
    if (!pivot || flying.current) return
    const from = pivot.quaternion.clone()
    const to = toParentQuaternion(world)
    const progress = { t: 0 }
    tween.current?.kill()
    tween.current = gsap.timeline({ onComplete: onDone }).to(progress, {
      t: 1,
      duration: reducedMotion ? 0 : seconds,
      ease: "power2.out",
      onUpdate: () => pivot.quaternion.copy(from).slerp(to, progress.t)
    })
  }

  const settleOn = (world: THREE.Quaternion) => {
    turnTo(world, SNAP_SECONDS, () => useRubikStore.getState().setSide(sideFacingCamera(worldQuaternion(), camera)))
  }

  // Fly to focus_rubik facing the camera when Tech Stack opens, and back home when it closes.
  useEffect(() => {
    if (!pivot || !home) return
    tween.current?.kill()
    flight.current?.kill()
    const duration = reducedMotion ? 0 : FLY_SECONDS
    flying.current = true
    const timeline = gsap.timeline({ onComplete: () => void (flying.current = false) })
    const from = pivot.quaternion.clone()
    const progress = { t: 0 }
    if (focused && focus) {
      // The cube's center lands exactly on focus_rubik.
      const target = pivot.parent!.worldToLocal(focus.getWorldPosition(new THREE.Vector3()))
      const facing = toParentQuaternion(orientationShowing("front", worldQuaternion(), camera))
      timeline
        .to(pivot.position, { x: target.x, y: target.y, z: target.z, duration, ease: "power2.inOut" }, 0)
        .to(pivot.scale, { x: home.scale.x * FOCUS_SCALE, y: home.scale.y * FOCUS_SCALE, z: home.scale.z * FOCUS_SCALE, duration, ease: "power2.inOut" }, 0)
        .to(progress, { t: 1, duration, ease: "power2.inOut", onUpdate: () => pivot.quaternion.copy(from).slerp(facing, progress.t) }, 0)
      useRubikStore.getState().setSide("front")
    } else {
      timeline
        .to(pivot.position, { x: home.position.x, y: home.position.y, z: home.position.z, duration, ease: "power2.inOut" }, 0)
        .to(pivot.scale, { x: home.scale.x, y: home.scale.y, z: home.scale.z, duration, ease: "power2.inOut" }, 0)
        .to(progress, { t: 1, duration, ease: "power2.inOut", onUpdate: () => pivot.quaternion.copy(from).slerp(home.quaternion, progress.t) }, 0)
      useRubikStore.getState().setTooltip(null)
      gl.domElement.style.cursor = ""
    }
    flight.current = timeline
  }, [focused, pivot, home, focus, camera, gl, reducedMotion])

  useEffect(() => {
    if (!focused) return
    occluders.forEach((node) => (node.visible = false))
    return () => occluders.forEach((node) => (node.visible = true))
  }, [focused, occluders])

  useEffect(() => {
    if (focused && pivot && request) settleOn(orientationShowing(request.side, worldQuaternion(), camera))
  }, [request])

  // Drag to rotate the whole cube (camera-relative), snap to the nearest face on release.
  useEffect(() => {
    if (!focused || !rubik || !pivot) return
    const element = gl.domElement
    const raycaster = new THREE.Raycaster()
    const pick = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(ndc, liveCamera)
      return raycaster.intersectObject(rubik, true)[0] ?? null
    }

    const onDown = (event: PointerEvent) => {
      if (flying.current || !pick(event)) return
      tween.current?.kill()
      dragging.current = { x: event.clientX, y: event.clientY, moved: false }
      element.setPointerCapture(event.pointerId)
      useRubikStore.getState().setTooltip(null)
    }
    const onMove = (event: PointerEvent) => {
      const drag = dragging.current
      if (drag) {
        const dx = event.clientX - drag.x
        const dy = event.clientY - drag.y
        drag.x = event.clientX
        drag.y = event.clientY
        drag.moved ||= Math.abs(dx) + Math.abs(dy) > 2
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(liveCamera.quaternion)
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(liveCamera.quaternion)
        const turn = new THREE.Quaternion()
          .setFromAxisAngle(up, dx * DRAG_RADIANS_PER_PX)
          .multiply(new THREE.Quaternion().setFromAxisAngle(right, dy * DRAG_RADIANS_PER_PX))
        pivot.quaternion.copy(toParentQuaternion(turn.multiply(worldQuaternion())))
        return
      }
      const hit = pick(event)
      const face = hit && faces.find((mesh) => mesh === hit.object)
      if (!hit || !face || !hit.uv) return useRubikStore.getState().setTooltip(null)
      const side = face.name.replace("int_rubik_face_", "") as RubikSide
      const slot = Math.min(2, Math.floor(hit.uv.y * 3)) * 3 + Math.min(2, Math.floor(hit.uv.x * 3))
      useRubikStore.getState().setTooltip({ name: RUBIK_FACES[side].slots[slot].name, x: event.clientX, y: event.clientY })
    }
    const onUp = (event: PointerEvent) => {
      if (!dragging.current) return
      dragging.current = null
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
      settleOn(snapOrientation(worldQuaternion(), camera))
    }
    const onLeave = () => !dragging.current && useRubikStore.getState().setTooltip(null)

    element.addEventListener("pointerdown", onDown)
    element.addEventListener("pointermove", onMove)
    element.addEventListener("pointerup", onUp)
    element.addEventListener("pointercancel", onUp)
    element.addEventListener("pointerleave", onLeave)
    return () => {
      element.removeEventListener("pointerdown", onDown)
      element.removeEventListener("pointermove", onMove)
      element.removeEventListener("pointerup", onUp)
      element.removeEventListener("pointercancel", onUp)
      element.removeEventListener("pointerleave", onLeave)
      dragging.current = null
    }
  }, [focused, rubik, pivot, faces, camera, liveCamera, gl])

  // Cursor feedback while the cube is focused.
  useFrame(() => {
    if (!focused) return
    gl.domElement.style.cursor = dragging.current ? "grabbing" : useRubikStore.getState().tooltip ? "grab" : ""
  })

  useEffect(
    () => () => {
      tween.current?.kill()
      flight.current?.kill()
    },
    []
  )

  return null
}
