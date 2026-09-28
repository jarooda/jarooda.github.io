import { useFrame, useThree } from "@react-three/fiber"
import gsap from "gsap"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useRoomStore } from "../store"
import { useReducedMotion } from "../systems/useReducedMotion"
import { fitFrustum, VIEW_ZOOM, type ViewId, type ViewPreset } from "./viewPresets"

const TRANSITION_SECONDS = 0.8

interface Pose {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  halfWidth: number
  halfHeight: number
  near: number
  far: number
}

const poseOf = (preset: ViewPreset, view: ViewId): Pose => ({
  position: preset.position.clone(),
  quaternion: preset.quaternion.clone(),
  halfWidth: preset.halfWidth / VIEW_ZOOM[view],
  halfHeight: preset.halfHeight / VIEW_ZOOM[view],
  near: preset.near,
  far: preset.far
})

export default function CameraRig({ presets }: { presets: Partial<Record<ViewId, ViewPreset>> }) {
  const camera = useThree((state) => state.camera)
  const view = useRoomStore((state) => state.view)
  const skipToken = useRoomStore((state) => state.skipToken)
  const cameraSettled = useRoomStore((state) => state.cameraSettled)
  const reducedMotion = useReducedMotion()

  const current = useRef<Pose | null>(null)
  const tween = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const preset = presets[view]
    if (!preset) {
      console.warn(`[room] missing camera preset for view "${view}"`)
      cameraSettled(view)
      return
    }
    const to = poseOf(preset, view)
    const from = current.current

    tween.current?.kill()
    if (!from || reducedMotion) {
      current.current = to
      cameraSettled(view)
      return
    }

    const start: Pose = { ...from, position: from.position.clone(), quaternion: from.quaternion.clone() }
    const progress = { t: 0 }
    tween.current = gsap.to(progress, {
      t: 1,
      duration: TRANSITION_SECONDS,
      ease: "power2.inOut",
      onUpdate: () => {
        const t = progress.t
        current.current = {
          position: start.position.clone().lerp(to.position, t),
          quaternion: start.quaternion.clone().slerp(to.quaternion, t),
          halfWidth: THREE.MathUtils.lerp(start.halfWidth, to.halfWidth, t),
          halfHeight: THREE.MathUtils.lerp(start.halfHeight, to.halfHeight, t),
          // Keep the widest clip range mid-flight so nothing pops in or out.
          near: Math.min(start.near, to.near),
          far: Math.max(start.far, to.far)
        }
      },
      onComplete: () => {
        current.current = to
        tween.current = null
        cameraSettled(view)
      }
    })
  }, [view, presets, reducedMotion, cameraSettled])

  useEffect(() => {
    if (skipToken) tween.current?.progress(1)
  }, [skipToken])

  useEffect(() => () => void tween.current?.kill(), [])

  useFrame(({ size }) => {
    const pose = current.current
    if (!pose || !(camera instanceof THREE.OrthographicCamera)) return
    const { halfWidth, halfHeight } = fitFrustum(pose, size.width / size.height)

    camera.position.copy(pose.position)
    camera.quaternion.copy(pose.quaternion)
    camera.left = -halfWidth
    camera.right = halfWidth
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.near = pose.near
    camera.far = pose.far
    camera.zoom = 1
    camera.updateProjectionMatrix()
  }, -1)

  return null
}
