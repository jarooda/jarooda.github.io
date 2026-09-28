import { useFrame, useThree } from "@react-three/fiber"
import gsap from "gsap"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useRoomStore } from "../store"
import { avatarPosition } from "../systems/avatarState"
import { useReducedMotion } from "../systems/useReducedMotion"
import { fitFrustum, PORTRAIT_ZOOM, VIEW_ZOOM, type ViewId, type ViewPreset } from "./viewPresets"

const TRANSITION_SECONDS = 0.8
// Mobile follow (portrait, main view): how fast the camera catches up with the avatar, and the
// height of the avatar point kept at the screen center.
const FOLLOW_RATE = 4
const FOLLOW_HEIGHT = 0.8

interface Pose {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  halfWidth: number
  halfHeight: number
  near: number
  far: number
  portraitZoom: number
}

const poseOf = (preset: ViewPreset, view: ViewId): Pose => ({
  position: preset.position.clone(),
  quaternion: preset.quaternion.clone(),
  halfWidth: preset.halfWidth / VIEW_ZOOM[view],
  halfHeight: preset.halfHeight / VIEW_ZOOM[view],
  near: preset.near,
  far: preset.far,
  portraitZoom: PORTRAIT_ZOOM[view]
})

export default function CameraRig({ presets }: { presets: Partial<Record<ViewId, ViewPreset>> }) {
  const camera = useThree((state) => state.camera)
  const view = useRoomStore((state) => state.view)
  const cameraSettled = useRoomStore((state) => state.cameraSettled)
  const reducedMotion = useReducedMotion()

  const current = useRef<Pose | null>(null)
  const followOffset = useRef(new THREE.Vector3())
  const followTarget = useRef(new THREE.Vector3())

  // World point at the center of the main view (at avatar height): the follow offset keeps the
  // avatar there instead.
  const mainCenter = useRef<THREE.Vector3 | null>(null)
  useEffect(() => {
    const main = presets.main
    if (!main) return
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(main.quaternion)
    const t = (FOLLOW_HEIGHT - main.position.y) / forward.y
    mainCenter.current = main.position.clone().addScaledVector(forward, t)
  }, [presets])
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
    useRoomStore.setState({ settledView: null })

    tween.current?.kill()
    const instant = useRoomStore.getState().instantCamera
    if (instant) useRoomStore.setState({ instantCamera: false })
    if (!from || reducedMotion || instant) {
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
          far: Math.max(start.far, to.far),
          portraitZoom: THREE.MathUtils.lerp(start.portraitZoom, to.portraitZoom, t)
        }
      },
      onComplete: () => {
        current.current = to
        tween.current = null
        cameraSettled(view)
      }
    })
  }, [view, presets, reducedMotion, cameraSettled])

  useEffect(() => () => void tween.current?.kill(), [])

  useFrame(({ size }, delta) => {
    const pose = current.current
    if (!pose || !(camera instanceof THREE.OrthographicCamera)) return
    const aspect = size.width / size.height

    // Portrait screens zoom in close on the room view, so the camera follows the avatar there.
    const follow = aspect < 1 && mainCenter.current && useRoomStore.getState().view === "main"
    if (follow) followTarget.current.set(avatarPosition.x, FOLLOW_HEIGHT, avatarPosition.z).sub(mainCenter.current!)
    else followTarget.current.set(0, 0, 0)
    followOffset.current.lerp(followTarget.current, reducedMotion ? 1 : Math.min(1, delta * FOLLOW_RATE))
    const fitted = fitFrustum(pose, aspect)
    const zoom = aspect < 1 ? pose.portraitZoom : 1
    const halfWidth = fitted.halfWidth / zoom
    const halfHeight = fitted.halfHeight / zoom

    camera.position.copy(pose.position).add(followOffset.current)
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
