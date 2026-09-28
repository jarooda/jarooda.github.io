import { PerformanceMonitor } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { Bloom, EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing"
import { ToneMappingMode } from "postprocessing"
import { useEffect } from "react"
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

export default function Effects() {
  const tier = useRoomStore((state) => state.tier)
  const setTier = useRoomStore((state) => state.setTier)
  const gl = useThree((state) => state.gl)

  // With the composer the ToneMapping effect maps the image; without it the renderer does.
  useEffect(() => {
    gl.toneMapping = tier === "low" ? THREE.AgXToneMapping : THREE.NoToneMapping
  }, [gl, tier])

  return (
    <>
      <PerformanceMonitor
        onDecline={() => {
          const current = useRoomStore.getState().tier
          // Still too slow on the lowest tier: offer the classic site (K32).
          if (current === "low") useRoomStore.getState().reportIssue("slow")
          else setTier(LOWER[current])
        }}
        flipflops={3}
      />
      {tier !== "low" && (
        <EffectComposer stencilBuffer multisampling={tier === "high" ? 4 : 0} frameBufferType={THREE.HalfFloatType}>
          {tier === "high" ? <N8AO aoRadius={0.45} distanceFalloff={0.6} intensity={1.4} halfRes quality="medium" /> : <></>}
          <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.55} />
          <ToneMapping mode={ToneMappingMode.AGX} />
        </EffectComposer>
      )}
    </>
  )
}
