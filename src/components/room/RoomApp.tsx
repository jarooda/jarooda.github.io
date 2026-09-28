import { Canvas } from "@react-three/fiber"
import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react"
import * as THREE from "three"
import type { RoomData } from "../../data/room"
import { RoomDataContext } from "./roomData"
import Atmosphere from "./scene/Atmosphere"
import Avatar from "./scene/Avatar"
import CameraRig from "./scene/CameraRig"
import Fixtures from "./scene/Fixtures"
import Interactions from "./scene/Interactions"
import Journal from "./scene/Journal"
import Lighting from "./scene/Lighting"
import MonitorScreen, { monitorPreset } from "./scene/MonitorScreen"
import Outside from "./scene/Outside"
import Quality, { initialTier } from "./scene/Quality"
import { usePlaceholderRoom } from "./scene/Placeholder"
import Rubik from "./scene/Rubik"
import { useRoomModel, type RoomAsset } from "./scene/roomAsset"
import Screens from "./scene/Screens"
import Weather from "./scene/Weather"
import Whiteboard from "./scene/Whiteboard"
import { frameContent, readViewPresets } from "./scene/viewPresets"
import { ZONE_MEMBERS } from "./sections"
import { useRoomStore } from "./store"
import { useHashSync } from "./systems/useHashSync"
import { useWeatherPolling } from "./systems/weather"
import Overlay from "./ui/Overlay"
import PageRain from "./ui/PageRain"

// `?placeholder` renders the contract box scene instead of room.glb (development aid).
const usePlaceholder = new URLSearchParams(window.location.search).has("placeholder")

function RoomContent({ room, withOutside = false }: { room: RoomAsset; withOutside?: boolean }) {
  const presets = useMemo(() => {
    const fromCameras = readViewPresets(room.cameras)
    // Zone views framed on their objects; the desk chair stands in front and is left out.
    for (const zone of ["desk", "tv", "whiteboard"] as const) {
      const preset = fromCameras[zone]
      if (!preset) continue
      const content = new THREE.Box3()
      for (const name of ZONE_MEMBERS[zone]) {
        const node = room.scene.getObjectByName(name)
        if (node && name !== "deco_desk_chair" && name !== "int_sticky_note_template") content.expandByObject(node)
      }
      fromCameras[zone] = frameContent(preset, content)
    }
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
      {withOutside && <Weather room={room.scene} />}
      <Rubik scene={room.scene} view={presets.desk} />
      <Whiteboard scene={room.scene} />
      <Journal scene={room.scene} />
      <MonitorScreen scene={room.scene} />
      <Screens scene={room.scene} />
      <Fixtures scene={room.scene} />
      <Avatar scene={room.scene} presets={presets} />
      <Quality />
    </>
  )
}

function ModelRoom() {
  return <RoomContent room={useRoomModel()} withOutside />
}

function PlaceholderRoom() {
  return <RoomContent room={usePlaceholderRoom()} />
}

// A model that fails to load (or any scene error) offers the classic site instead of a blank page.
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error("[room] scene failed", error)
    useRoomStore.getState().reportIssue("load-failed")
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

const announceReady = () => void window.dispatchEvent(new Event("room:ready"))

export default function RoomApp({ data }: { data: RoomData }) {
  useHashSync()
  useWeatherPolling()
  useEffect(() => useRoomStore.getState().setTier(initialTier()), [])

  // The splash (RoomSplash.astro) fades out once the first view is framed, or on failure.
  useEffect(() => {
    const done = (state: ReturnType<typeof useRoomStore.getState>) => state.ready || state.runtimeIssue !== null
    if (done(useRoomStore.getState())) return announceReady()
    return useRoomStore.subscribe((state) => {
      if (done(state)) announceReady()
    })
  }, [])

  return (
    <RoomDataContext.Provider value={data}>
      <Overlay />
      <PageRain />
      <div className="room-canvas">
        <Canvas
          orthographic
          dpr={[1, 1.75]}
          shadows="percentage"
          gl={{ alpha: true, antialias: true, stencil: true }}
          camera={{ manual: true }}
          aria-label="Jalu's room"
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (event) => {
              event.preventDefault()
              useRoomStore.getState().reportIssue("context-lost")
            })
          }}
        >
          <SceneBoundary>
            <Suspense fallback={null}>
              {usePlaceholder ? <PlaceholderRoom /> : <ModelRoom />}
            </Suspense>
          </SceneBoundary>
        </Canvas>
      </div>
    </RoomDataContext.Provider>
  )
}
