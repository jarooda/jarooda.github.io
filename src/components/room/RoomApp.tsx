import { Canvas } from "@react-three/fiber"
import { Suspense, useMemo } from "react"
import type { RoomData } from "../../data/room"
import { RoomDataContext } from "./roomData"
import CameraRig from "./scene/CameraRig"
import Interactions from "./scene/Interactions"
import Journal from "./scene/Journal"
import MonitorScreen, { monitorPreset } from "./scene/MonitorScreen"
import Outside from "./scene/Outside"
import { usePlaceholderRoom } from "./scene/Placeholder"
import Rubik from "./scene/Rubik"
import { useRoomModel, type RoomAsset } from "./scene/roomAsset"
import Screens from "./scene/Screens"
import Whiteboard from "./scene/Whiteboard"
import { readViewPresets } from "./scene/viewPresets"
import { useHashSync } from "./systems/useHashSync"
import Overlay from "./ui/Overlay"

// `?placeholder` renders the contract box scene instead of room.glb (development aid).
const usePlaceholder = new URLSearchParams(window.location.search).has("placeholder")

function RoomContent({ room }: { room: RoomAsset }) {
  const presets = useMemo(() => {
    const fromCameras = readViewPresets(room.cameras)
    const monitor = monitorPreset(room.scene, fromCameras.desk)
    return monitor ? { ...fromCameras, monitor } : fromCameras
  }, [room])

  return (
    <>
      <CameraRig presets={presets} />
      <hemisphereLight args={["#fff4e0", "#6b5a4a", 1.2]} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff1dc" />
      <Interactions scene={room.scene} />
      <Rubik scene={room.scene} view={presets.desk} />
      <Whiteboard scene={room.scene} />
      <Journal scene={room.scene} />
      <MonitorScreen scene={room.scene} />
      <Screens scene={room.scene} />
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
