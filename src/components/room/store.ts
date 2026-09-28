import { create } from "zustand"
import type { ViewId } from "./scene/viewPresets"
import { SECTION_ZONE, isSection, viewForSection, type NavTarget, type SectionId, type ZoneId } from "./sections"
import type { PoseTarget } from "./systems/poses"
import { readJSON, writeJSON } from "./systems/storage"

export type Mode = "loading" | "intro" | "roam" | "zoom" | "popup"
export type PhaseId = "dawn" | "morning" | "noon" | "afternoon" | "dusk" | "night" | "latenight"
export type FixtureTarget = "switch" | "window" | "bed"
export type TriggerTarget = ZoneId | FixtureTarget
export type Tier = "high" | "medium" | "low"
// Runtime reasons to offer the classic site (K32).
export type RuntimeIssue = "context-lost" | "load-failed" | "slow"

export interface PopupState {
  section: SectionId
  tab?: string
  projectId?: string
}

// Animated navigation (decision 7, 03 §5.3):
// toMain (camera back to the room view) → walk (avatar walks to the zone's pose marker and takes
// the pose, V2) → zoomIn (camera to the zone, target highlighted) → popup.
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
  // Tap/click on the light switch, window or bed: walk there, then use it.
  fixtureRequest: { target: FixtureTarget; token: number } | null
  // Pose the avatar holds or is entering (V2); null when standing.
  avatarPose: PoseTarget | null
  avatarSnap: { zone: ZoneId; token: number } | null
  lightOn: boolean
  phaseOverride: PhaseId | null
  // Phase currently shown (Semarang time or the override).
  phase: PhaseId
  timeControlOpen: boolean
  curtainsOpen: boolean
  tier: Tier
  runtimeIssue: RuntimeIssue | null
  // Intro pan (K35): index of the zone being shown, null when not running.
  introStep: number | null
  // Incremented to make the avatar wave (end of the intro).
  waveToken: number
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
  useFixture(target: FixtureTarget): void
  setAvatarPose(pose: PoseTarget | null): void
  setNearbyTarget(target: TriggerTarget | null): void
  toggleLight(): void
  toggleCurtains(): void
  setPhaseOverride(phase: PhaseId | null): void
  setTimeControlOpen(open: boolean): void
  setTier(tier: Tier): void
  reportIssue(issue: RuntimeIssue | null): void
  endIntro(skip: boolean): void
  // Section hovered/focused in the feature bar; its object is highlighted.
  hoverSection: SectionId | null
  setHoverSection(section: SectionId | null): void
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
    else get().enterZoom(target.zone)
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
    fixtureRequest: null,
    avatarPose: null,
    avatarSnap: null,
    lightOn: false,
    phaseOverride: null,
    phase: "morning",
    timeControlOpen: false,
    curtainsOpen: true,
    tier: "high",
    runtimeIssue: null,
    introStep: null,
    waveToken: 0,
    visited: loadVisited(),
    ready: false,
    settledView: null,

    enterZoom: (zone) => {
      set({ mode: "zoom", view: zone, popup: null })
      // The whiteboard is the project list, so arriving there counts as visiting Projects.
      if (zone === "whiteboard") markVisited("projects")
    },

    hoverSection: null,
    setHoverSection: (hoverSection) => set({ hoverSection }),

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
      if (mode === "intro") return get().endIntro(true)
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
      set({ popup: null, mode: "roam", introStep: null, sequence: { target, stage: "toMain" } })
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
    useFixture: (target) => set((state) => ({ fixtureRequest: { target, token: (state.fixtureRequest?.token ?? 0) + 1 } })),
    setAvatarPose: (avatarPose) => set({ avatarPose }),
    setNearbyTarget: (nearbyTarget) => {
      if (get().nearbyTarget !== nearbyTarget) set({ nearbyTarget })
    },

    toggleLight: () => set((state) => ({ lightOn: !state.lightOn })),
    toggleCurtains: () => set((state) => ({ curtainsOpen: !state.curtainsOpen })),
    setPhaseOverride: (phaseOverride) => set({ phaseOverride }),
    setTimeControlOpen: (timeControlOpen) => set({ timeControlOpen }),
    setTier: (tier) => set({ tier }),
    reportIssue: (runtimeIssue) => set({ runtimeIssue }),

    // Back to the room view; skipping jumps the camera instead of flying back.
    endIntro: (skip) => {
      if (get().mode !== "intro") return
      set((state) => ({
        mode: "roam",
        introStep: null,
        view: "main",
        instantCamera: skip && state.view !== "main",
        waveToken: state.waveToken + 1
      }))
    }
  }
})
