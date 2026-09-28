import { Canvas } from "@react-three/fiber"
import { useMemo } from "react"
import type { RoomData } from "../../data/room"
import { RoomDataContext } from "./roomData"
import CameraRig from "./scene/CameraRig"
import Interactions from "./scene/Interactions"
import { usePlaceholderRoom } from "./scene/Placeholder"
import { prepareRoomScene } from "./scene/prepareRoom"
import { readViewPresets } from "./scene/viewPresets"
import { useHashSync } from "./systems/useHashSync"
import Overlay from "./ui/Overlay"

function Scene() {
  const room = usePlaceholderRoom()
  const presets = useMemo(() => {
    prepareRoomScene(room.scene)
    return readViewPresets(room.cameras)
  }, [room])

  return (
    <>
      <CameraRig presets={presets} />
      <hemisphereLight args={["#fff4e0", "#6b5a4a", 1.2]} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff1dc" />
      <Interactions scene={room.scene} />
    </>
  )
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
          <Scene />
        </Canvas>
      </div>
    </RoomDataContext.Provider>
  )
}
