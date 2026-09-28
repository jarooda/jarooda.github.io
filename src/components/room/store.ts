import { create } from "zustand"
import type { ViewId } from "./scene/viewPresets"
import { SECTION_ZONE, isSection, viewForSection, type NavTarget, type SectionId, type ZoneId } from "./sections"
import { readJSON, writeJSON } from "./systems/storage"

export type Mode = "loading" | "intro" | "roam" | "zoom" | "popup"
export type PhaseId = "dawn" | "morning" | "noon" | "afternoon" | "dusk" | "night" | "latenight"
export type TriggerTarget = ZoneId | "switch" | "window"
export type Tier = "high" | "medium" | "low"
// Runtime reasons to offer the classic site (K32).
export type RuntimeIssue = "context-lost" | "load-failed" | "slow"

export interface PopupState {
  section: SectionId
  tab?: string
  projectId?: string
}

// Animated navigation (decision 7, 03 §5.3):
// toMain (camera back to the room view) → walk (avatar walks, faces the object, plays interact)
// → zoomIn (camera to the zone, target highlighted) → popup.
export type SequenceStage = "toMain" | "walk" | "zoomIn"

export interface Sequence {
  target: NavTarget
  stage: SequenceStage
}

const VISITED_KEY = "room-visited"

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

interface RoomState {
  mode: Mode
  view: ViewId
  popup: PopupState | null
  sequence: Sequence | null
  // Next view change jumps instead of animating (skip, reduced motion).
  instantCamera: boolean
  nearbyTarget: TriggerTarget | null
  // Requests for the avatar; tokens make repeated requests distinct.
  walkRequest: { x: number; z: number; token: number } | null
  interactRequest: number
  avatarSnap: { zone: ZoneId; token: number } | null
  lightOn: boolean
  phaseOverride: PhaseId | null
  // Phase currently shown (Semarang time or the override).
  phase: PhaseId
  timeControlOpen: boolean
  curtainsOpen: boolean
  tier: Tier
  runtimeIssue: RuntimeIssue | null
  visited: SectionId[]
  // True once the camera has framed the first view; deep links wait for it so they animate.
  ready: boolean
  // View the camera has finished moving to; null while a transition runs.
  settledView: ViewId | null

  enterZoom(zone: ZoneId): void
  openPopup(section: SectionId, tab?: string, projectId?: string): void
  closePopup(): void
  setPopupTab(tab: string): void
  openProject(projectId: string | undefined): void
  back(): void
  travelTo(target: NavTarget): void
  skipSequence(): void
  avatarArrived(): void
  cameraSettled(view: ViewId): void
  walkTo(x: number, z: number): void
  requestInteract(): void
  setNearbyTarget(target: TriggerTarget | null): void
  toggleLight(): void
  toggleCurtains(): void
  setPhaseOverride(phase: PhaseId | null): void
  setTimeControlOpen(open: boolean): void
  setTier(tier: Tier): void
  reportIssue(issue: RuntimeIssue | null): void
}

const loadVisited = () => readJSON<unknown[]>(VISITED_KEY, []).filter(isSection)

const finalViewOf = (target: NavTarget): ViewId => (target.section ? viewForSection(target.section) : target.zone)

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

  // Skip / reduced motion: the avatar jumps to the trigger and the camera jumps to the end view.
  const jumpToEnd = (target: NavTarget) => {
    const { view, avatarSnap } = get()
    set({
      avatarSnap: { zone: target.zone, token: (avatarSnap?.token ?? 0) + 1 },
      instantCamera: finalViewOf(target) !== view
    })
    finishSequence(target)
  }

  return {
    mode: "roam",
    view: "main",
    popup: null,
    sequence: null,
    instantCamera: false,
    nearbyTarget: null,
    walkRequest: null,
    interactRequest: 0,
    avatarSnap: null,
    lightOn: false,
    phaseOverride: null,
    phase: "morning",
    timeControlOpen: false,
    curtainsOpen: true,
    tier: "high",
    runtimeIssue: null,
    visited: loadVisited(),
    ready: false,
    settledView: null,

    enterZoom: (zone) => set({ mode: "zoom", view: zone, popup: null }),

    openPopup: (section, tab, projectId) => {
      set({ mode: "popup", view: viewForSection(section), popup: { section, tab, projectId } })
      markVisited(section)
    },

    closePopup: () => {
      const { popup } = get()
      set({ mode: "zoom", popup: null, ...(popup && { view: SECTION_ZONE[popup.section] }) })
    },

    setPopupTab: (tab) => {
      const { popup } = get()
      if (popup) set({ popup: { ...popup, tab, projectId: undefined } })
    },

    openProject: (projectId) => {
      const { popup } = get()
      if (popup) set({ popup: { ...popup, projectId } })
    },

    back: () => {
      const { sequence, mode } = get()
      if (sequence) return get().skipSequence()
      if (mode === "popup") return get().closePopup()
      if (mode === "zoom") return set({ mode: "roam", view: "main" })
    },

    travelTo: (target) => {
      const { view, settledView, popup } = get()
      // Already at the zone (its view, a close-up, or a popup of the same zone): open it in place.
      const currentZone = popup ? SECTION_ZONE[popup.section] : view
      if (currentZone === target.zone || view === finalViewOf(target)) return finishSequence(target)
      if (prefersReducedMotion()) return jumpToEnd(target)
      set({ popup: null, mode: "roam", sequence: { target, stage: "toMain" } })
      if (view === "main" && settledView === "main") set({ sequence: { target, stage: "walk" } })
      else set({ view: "main" })
    },

    skipSequence: () => {
      const { sequence } = get()
      if (sequence) jumpToEnd(sequence.target)
    },

    avatarArrived: () => {
      const { sequence } = get()
      if (sequence?.stage !== "walk") return
      set({ sequence: { ...sequence, stage: "zoomIn" }, mode: "zoom", view: sequence.target.zone })
    },

    cameraSettled: (view) => {
      set({ ready: true, settledView: view })
      const { sequence } = get()
      if (!sequence) return
      if (sequence.stage === "toMain" && view === "main") set({ sequence: { ...sequence, stage: "walk" } })
      else if (sequence.stage === "zoomIn" && view === sequence.target.zone) finishSequence(sequence.target)
    },

    walkTo: (x, z) => set((state) => ({ walkRequest: { x, z, token: (state.walkRequest?.token ?? 0) + 1 } })),
    requestInteract: () => set((state) => ({ interactRequest: state.interactRequest + 1 })),
    setNearbyTarget: (nearbyTarget) => {
      if (get().nearbyTarget !== nearbyTarget) set({ nearbyTarget })
    },

    toggleLight: () => set((state) => ({ lightOn: !state.lightOn })),
    toggleCurtains: () => set((state) => ({ curtainsOpen: !state.curtainsOpen })),
    setPhaseOverride: (phaseOverride) => set({ phaseOverride }),
    setTimeControlOpen: (timeControlOpen) => set({ timeControlOpen }),
    setTier: (tier) => set({ tier }),
    reportIssue: (runtimeIssue) => set({ runtimeIssue })
  }
})
