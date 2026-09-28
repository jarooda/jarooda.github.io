import { Bloom, EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing"
import { ToneMappingMode } from "postprocessing"
import * as THREE from "three"
import type { Tier } from "../store"

export default function PostEffects({ tier }: { tier: Exclude<Tier, "low"> }) {
  return (
    <EffectComposer stencilBuffer multisampling={tier === "high" ? 4 : 0} frameBufferType={THREE.HalfFloatType}>
      {tier === "high" ? <N8AO aoRadius={0.45} distanceFalloff={0.6} intensity={1.4} halfRes quality="medium" /> : <></>}
      <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.55} />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}
