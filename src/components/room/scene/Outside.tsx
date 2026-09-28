import { useOutsideModel } from "./roomAsset"

// Loaded and validated now; it stays hidden until K28 masks it to the window glass,
// otherwise the sky and skyline would show around the diorama.
export default function Outside() {
  const scene = useOutsideModel()
  return <primitive object={scene} visible={false} />
}
