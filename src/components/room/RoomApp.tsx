import { Canvas } from "@react-three/fiber"
import { Suspense, useEffect, useMemo } from "react"
import type { RoomData } from "../../data/room"
import { RoomDataContext } from "./roomData"
import Atmosphere from "./scene/Atmosphere"
import Avatar from "./scene/Avatar"
import CameraRig from "./scene/CameraRig"
import Effects, { initialTier } from "./scene/Effects"
import Fixtures from "./scene/Fixtures"
import Interactions from "./scene/Interactions"
import Journal from "./scene/Journal"
import Lighting from "./scene/Lighting"
import MonitorScreen, { monitorPreset } from "./scene/MonitorScreen"
import Outside from "./scene/Outside"
import { usePlaceholderRoom } from "./scene/Placeholder"
import Rubik from "./scene/Rubik"
import { useRoomModel, type RoomAsset } from "./scene/roomAsset"
import Screens from "./scene/Screens"
import Whiteboard from "./scene/Whiteboard"
import { readViewPresets } from "./scene/viewPresets"
import { useRoomStore } from "./store"
import { useHashSync } from "./systems/useHashSync"
import Overlay from "./ui/Overlay"

// `?placeholder` renders the contract box scene instead of room.glb (development aid).
const usePlaceholder = new URLSearchParams(window.location.search).has("placeholder")

function RoomContent({ room, withOutside = false }: { room: RoomAsset; withOutside?: boolean }) {
  const presets = useMemo(() => {
    const fromCameras = readViewPresets(room.cameras)
    const monitor = monitorPreset(room.scene, fromCameras.desk)
    return monitor ? { ...fromCameras, monitor } : fromCameras
  }, [room])

  return (
    <>
      <CameraRig presets={presets} />
      <Atmosphere />
      <Lighting scene={room.scene} />
      <Interactions scene={room.scene} />
      {withOutside && <Outside room={room.scene} />}
      <Rubik scene={room.scene} view={presets.desk} />
      <Whiteboard scene={room.scene} />
      <Journal scene={room.scene} />
      <MonitorScreen scene={room.scene} />
      <Screens scene={room.scene} />
      <Fixtures scene={room.scene} />
      <Avatar scene={room.scene} presets={presets} />
      <Effects />
    </>
  )
}

function ModelRoom() {
  return <RoomContent room={useRoomModel()} withOutside />
}

function PlaceholderRoom() {
  return <RoomContent room={usePlaceholderRoom()} />
}

export default function RoomApp({ data }: { data: RoomData }) {
  useHashSync()
  useEffect(() => useRoomStore.getState().setTier(initialTier()), [])

  return (
    <RoomDataContext.Provider value={data}>
      <Overlay />
      <div className="room-canvas">
        <Canvas
          orthographic
          dpr={[1, 1.75]}
          shadows="percentage"
          gl={{ alpha: true, antialias: true, stencil: true }}
          camera={{ manual: true }}
          aria-label="Jalu's room"
        >
          <Suspense fallback={null}>
            {usePlaceholder ? <PlaceholderRoom /> : <ModelRoom />}
          </Suspense>
        </Canvas>
      </div>
    </RoomDataContext.Provider>
  )
}
