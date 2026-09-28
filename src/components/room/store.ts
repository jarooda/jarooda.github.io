import { create } from "zustand"
import type { ViewId } from "./scene/viewPresets"
import { SECTION_ZONE, isSection, type NavTarget, type SectionId, type ZoneId } from "./sections"
import { readJSON, writeJSON } from "./systems/storage"

export type Mode = "loading" | "intro" | "roam" | "zoom" | "popup"
export type PhaseId = "dawn" | "morning" | "noon" | "afternoon" | "dusk" | "night" | "latenight"

export interface PopupState {
  section: SectionId
  tab?: string
  projectId?: string
}

// Animated navigation (decision 7). Until K25 adds walking, the only stage is the camera move.
export type SequenceStage = "camera"

export interface Sequence {
  target: NavTarget
  stage: SequenceStage
}

const VISITED_KEY = "room-visited"

interface RoomState {
  mode: Mode
  view: ViewId
  popup: PopupState | null
  sequence: Sequence | null
  // Incremented to ask CameraRig to finish the current transition immediately.
  skipToken: number
  nearbyTarget: string | null
  lightOn: boolean
  phaseOverride: PhaseId | null
  curtainsOpen: boolean
  visited: SectionId[]
  // True once the camera has framed the first view; deep links wait for it so they animate.
  ready: boolean

  enterZoom(zone: ZoneId): void
  openPopup(section: SectionId, tab?: string): void
  closePopup(): void
  setPopupTab(tab: string): void
  openProject(projectId: string | undefined): void
  back(): void
  travelTo(target: NavTarget): void
  skipSequence(): void
  cameraSettled(view: ViewId): void
  toggleLight(): void
  setPhaseOverride(phase: PhaseId | null): void
}

const loadVisited = () => readJSON<unknown[]>(VISITED_KEY, []).filter(isSection)

export const useRoomStore = create<RoomState>((set, get) => {
  const markVisited = (section: SectionId) => {
    const { visited } = get()
    if (visited.includes(section)) return
    const next = [...visited, section]
    writeJSON(VISITED_KEY, next)
    set({ visited: next })
  }

  const finishSequence = (target: NavTarget) => {
    set({ sequence: null })
    if (target.section) get().openPopup(target.section, target.tab)
    else set({ mode: "zoom", view: target.zone, popup: null })
  }

  return {
    mode: "roam",
    view: "main",
    popup: null,
    sequence: null,
    skipToken: 0,
    nearbyTarget: null,
    lightOn: false,
    phaseOverride: null,
    curtainsOpen: true,
    visited: loadVisited(),
    ready: false,

    enterZoom: (zone) => set({ mode: "zoom", view: zone, popup: null }),

    openPopup: (section, tab) => {
      set({ mode: "popup", view: SECTION_ZONE[section], popup: { section, tab } })
      markVisited(section)
    },

    closePopup: () => set({ mode: "zoom", popup: null }),

    setPopupTab: (tab) => {
      const { popup } = get()
      if (popup) set({ popup: { ...popup, tab, projectId: undefined } })
    },

    openProject: (projectId) => {
      const { popup } = get()
      if (popup) set({ popup: { ...popup, projectId } })
    },

    back: () => {
      const { sequence, popup, mode } = get()
      if (sequence) return get().skipSequence()
      if (popup?.projectId) return get().openProject(undefined)
      if (mode === "popup") return get().closePopup()
      if (mode === "zoom") return set({ mode: "roam", view: "main" })
    },

    travelTo: (target) => {
      const { view } = get()
      set({ popup: null, mode: "zoom", sequence: { target, stage: "camera" } })
      // Already framed on the zone: nothing to animate, finish right away.
      if (view === target.zone) finishSequence(target)
      else set({ view: target.zone })
    },

    skipSequence: () => set((state) => ({ skipToken: state.skipToken + 1 })),

    cameraSettled: (view) => {
      if (!get().ready) set({ ready: true })
      const { sequence } = get()
      if (sequence && sequence.target.zone === view) finishSequence(sequence.target)
    },

    toggleLight: () => set((state) => ({ lightOn: !state.lightOn })),
    setPhaseOverride: (phaseOverride) => set({ phaseOverride })
  }
})
