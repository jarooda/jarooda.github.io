import { useGLTF } from "@react-three/drei"
import { useMemo } from "react"
import type * as THREE from "three"
import { checkAsset, OUTSIDE_MATERIALS, OUTSIDE_NODES, ROOM_MATERIALS, ROOM_NODES } from "./assetContract"
import { useAssetUrl } from "../systems/assets"
import { prepareRoomScene } from "./prepareRoom"

export const ROOM_URL = "/models/room.glb"
export const OUTSIDE_URL = "/models/outside.glb"

// Same shape for room.glb and the contract placeholder, so the rest of the scene
// only ever reads nodes by name and userData.
export interface RoomAsset {
  scene: THREE.Object3D
  cameras: THREE.Camera[]
}

export function useRoomModel(): RoomAsset {
  const gltf = useGLTF(useAssetUrl(ROOM_URL))
  return useMemo(() => {
    checkAsset("room.glb", gltf.scene, ROOM_NODES, ROOM_MATERIALS)
    prepareRoomScene(gltf.scene)
    return { scene: gltf.scene, cameras: gltf.cameras }
  }, [gltf])
}

export function useOutsideModel(): THREE.Object3D {
  const gltf = useGLTF(useAssetUrl(OUTSIDE_URL))
  return useMemo(() => {
    checkAsset("outside.glb", gltf.scene, OUTSIDE_NODES, OUTSIDE_MATERIALS)
    return gltf.scene
  }, [gltf])
}
