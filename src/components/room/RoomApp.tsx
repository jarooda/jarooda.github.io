import { Canvas } from "@react-three/fiber"
import { Suspense, useMemo } from "react"
import type { RoomData } from "../../data/room"
import { RoomDataContext } from "./roomData"
import CameraRig from "./scene/CameraRig"
import Interactions from "./scene/Interactions"
import Outside from "./scene/Outside"
import { usePlaceholderRoom } from "./scene/Placeholder"
import { useRoomModel, type RoomAsset } from "./scene/roomAsset"
import { readViewPresets } from "./scene/viewPresets"
import { useHashSync } from "./systems/useHashSync"
import Overlay from "./ui/Overlay"

// `?placeholder` renders the contract box scene instead of room.glb (development aid).
const usePlaceholder = new URLSearchParams(window.location.search).has("placeholder")

function RoomContent({ room }: { room: RoomAsset }) {
  const presets = useMemo(() => readViewPresets(room.cameras), [room])

  return (
    <>
      <CameraRig presets={presets} />
      <hemisphereLight args={["#fff4e0", "#6b5a4a", 1.2]} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff1dc" />
      <Interactions scene={room.scene} />
    </>
  )
}

function ModelRoom() {
  return <RoomContent room={useRoomModel()} />
}

function PlaceholderRoom() {
  return <RoomContent room={usePlaceholderRoom()} />
}

export default function RoomApp({ data }: { data: RoomData }) {
  useHashSync()

  return (
    <RoomDataContext.Provider value={data}>
      <Overlay />
      <div className="room-canvas">
        <Canvas
          orthographic
          dpr={[1, 1.75]}
          gl={{ alpha: true, antialias: true }}
          camera={{ manual: true }}
          aria-label="Jalu's room"
        >
          <Suspense fallback={null}>
            {usePlaceholder ? (
              <PlaceholderRoom />
            ) : (
              <>
                <ModelRoom />
                <Outside />
              </>
            )}
          </Suspense>
        </Canvas>
      </div>
    </RoomDataContext.Provider>
  )
}
