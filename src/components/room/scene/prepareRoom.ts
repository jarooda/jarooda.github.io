import type * as THREE from "three"

const HIDDEN_PREFIXES = ["collision_", "trigger_", "spawn_", "focus_"]
const HIDDEN_NAMES = new Set(["int_sticky_note_template"])

// Helper nodes stay in the graph (they are read by name/userData) but are never rendered.
export function prepareRoomScene(root: THREE.Object3D) {
  root.traverse((object) => {
    if (HIDDEN_NAMES.has(object.name) || HIDDEN_PREFIXES.some((p) => object.name.startsWith(p))) {
      object.visible = false
    }
  })
}
