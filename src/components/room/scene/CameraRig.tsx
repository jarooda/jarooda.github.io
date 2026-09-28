import { useThree } from "@react-three/fiber"
import { useLayoutEffect } from "react"
import * as THREE from "three"
import { fitFrustum, type ViewPreset } from "./viewPresets"

export default function CameraRig({ preset }: { preset: ViewPreset }) {
  const camera = useThree((state) => state.camera)
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return
    const { halfWidth, halfHeight } = fitFrustum(preset, width / height)

    camera.position.copy(preset.position)
    camera.quaternion.copy(preset.quaternion)
    camera.left = -halfWidth
    camera.right = halfWidth
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.near = preset.near
    camera.far = preset.far
    camera.zoom = 1
    camera.updateProjectionMatrix()
  }, [camera, preset, width, height])

  return null
}
