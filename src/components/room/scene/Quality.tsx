import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { lazy, Suspense, useEffect } from "react"
import * as THREE from "three"
import { useRoomStore, type Tier } from "../store"

// Quality tiers (03 §5.10):
// high   = tone mapping, N8AO, Bloom, soft (blurred PCF) shadows (default desktop)
// medium = tone mapping, Bloom, plain shadows (tablets, or FPS dropped)
// low    = tone mapping only, no shadows (phones, or FPS stays low)
export function initialTier(): Tier {
  const coarse = window.matchMedia("(pointer: coarse)").matches
  const small = Math.max(window.screen.width, window.screen.height) < 900
  if (coarse && small) return "low"
  if (coarse) return "medium"
  return "high"
}

const LOWER: Record<Tier, Tier> = { high: "medium", medium: "low", low: "low" }

// Post-processing (postprocessing + N8AO) is its own chunk, never downloaded on the low tier.
const PostEffects = lazy(() => import("./PostEffects"))

export default function Quality() {
  const tier = useRoomStore((state) => state.tier)
  const gl = useThree((state) => state.gl)

  // With the composer the ToneMapping effect maps the image; without it the renderer does.
  useEffect(() => {
    gl.toneMapping = tier === "low" ? THREE.AgXToneMapping : THREE.NoToneMapping
  }, [gl, tier])

  return (
    <>
      <PerformanceMonitor
        onDecline={() => {
          const { tier: current, setTier, reportIssue } = useRoomStore.getState()
          // Still too slow on the lowest tier: offer the classic site (K32).
          if (current === "low") reportIssue("slow")
          else setTier(LOWER[current])
        }}
        flipflops={3}
      />
      {/* Lowers the pixel ratio while the scene is under load (camera moves, drags). */}
      <AdaptiveDpr />
      {tier !== "low" && (
        <Suspense fallback={null}>
          <PostEffects tier={tier} />
        </Suspense>
      )}
    </>
  )
}
