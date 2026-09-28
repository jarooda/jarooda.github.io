import { Canvas } from "@react-three/fiber"
import { createContext, useContext, useMemo } from "react"
import type { RoomData } from "../../data/room"
import CameraRig from "./scene/CameraRig"
import Placeholder, { usePlaceholderRoom } from "./scene/Placeholder"
import { prepareRoomScene } from "./scene/prepareRoom"
import { readViewPresets } from "./scene/viewPresets"

const RoomDataContext = createContext<RoomData | null>(null)

export function useRoomData() {
  const data = useContext(RoomDataContext)
  if (!data) throw new Error("useRoomData must be used inside RoomApp")
  return data
}

function Scene() {
  const room = usePlaceholderRoom()
  const presets = useMemo(() => {
    prepareRoomScene(room.scene)
    return readViewPresets(room.cameras)
  }, [room])

  return (
    <>
      {presets.main && <CameraRig preset={presets.main} />}
      <hemisphereLight args={["#fff4e0", "#6b5a4a", 1.2]} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff1dc" />
      <Placeholder room={room} />
    </>
  )
}

export default function RoomApp({ data }: { data: RoomData }) {
  return (
    <RoomDataContext.Provider value={data}>
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
