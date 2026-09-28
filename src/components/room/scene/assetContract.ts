import * as THREE from "three"

// Names the code relies on, from the asset contract (01-kontrak-aset.md §5–§9).
// Missing entries only produce console warnings; the room keeps working with what exists.

const books = Array.from({ length: 10 }, (_, i) => `int_bookshelf_book_${String(i + 1).padStart(2, "0")}`)
const rubikFaces = ["front", "back", "left", "right", "top", "bottom"]

export const ROOM_NODES = [
  // Room
  "room_base",
  "room_floor",
  "room_wall_a",
  "room_wall_b",
  "room_door",
  "int_window",
  "int_window_glass",
  "int_window_curtain_l",
  "int_window_curtain_r",
  "int_switch",
  "int_switch_toggle",
  "deco_ceiling_lamp",
  "deco_ceiling_lamp_bulb",
  // Zone_Desk
  "zone_desk",
  "deco_desk_chair",
  "int_monitor",
  "int_monitor_screen",
  "deco_keyboard",
  "deco_mouse",
  "deco_pc_tower",
  "deco_pc_tower_led",
  "int_rubik",
  ...rubikFaces.map((side) => `int_rubik_face_${side}`),
  "int_journal",
  "int_journal_pages",
  "deco_tea_glass",
  "deco_desk_lamp",
  "deco_desk_lamp_bulb",
  // Zone_TV
  "zone_tv_table",
  "int_tv",
  "int_tv_screen",
  "int_console",
  "int_console_screen",
  "int_mp3_player",
  "int_mp3_player_screen",
  "int_headset",
  "int_headset_stand",
  "int_robot_figure",
  "int_bookshelf",
  ...books,
  "int_bookshelf_bookend_01",
  "int_bookshelf_bookend_02",
  // Zone_Whiteboard
  "int_whiteboard",
  "int_whiteboard_surface",
  "deco_whiteboard_tray",
  "int_sticky_note_template",
  // Markers
  "spawn_avatar",
  "trigger_desk",
  "trigger_whiteboard",
  "trigger_tv",
  "trigger_switch",
  "trigger_window",
  "focus_rubik",
  "cam_main",
  "cam_desk",
  "cam_tv",
  "cam_whiteboard"
]

export const ROOM_MATERIALS = [
  "mat_palette",
  "glass_window",
  "emit_screen_monitor",
  "emit_screen_tv",
  "emit_screen_console",
  "emit_screen_mp3",
  "emit_led_pc",
  "emit_bulb_ceiling",
  "emit_bulb_desklamp",
  "mat_whiteboard_surface",
  "mat_journal_pages",
  "mat_sticky_note",
  ...rubikFaces.map((side) => `rubik_face_${side}`)
]

export const OUTSIDE_NODES = [
  "outside_sky",
  "outside_skyline_far",
  "outside_skyline_mid",
  "outside_skyline_near",
  "outside_city_lights"
]

export const OUTSIDE_MATERIALS = ["mat_sky", "mat_skyline_far", "mat_skyline_mid", "mat_skyline_near", "emit_city_lights"]

// Returns the missing names so callers (and tests) can inspect them; also warns once per asset.
export function checkAsset(label: string, root: THREE.Object3D, nodes: string[], materials: string[]) {
  const materialNames = new Set<string>()
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      for (const material of [object.material].flat()) materialNames.add(material.name)
    }
  })

  const missingNodes = nodes.filter((name) => !root.getObjectByName(name))
  const missingMaterials = materials.filter((name) => !materialNames.has(name))
  const collisions = [] as string[]
  root.traverse((object) => object.userData.type === "collision" && collisions.push(object.name))

  for (const name of missingNodes) console.warn(`[room] ${label}: missing node "${name}"`)
  for (const name of missingMaterials) console.warn(`[room] ${label}: missing material "${name}"`)
  if (nodes === ROOM_NODES && collisions.length === 0) console.warn(`[room] ${label}: no collision_* boxes found`)

  return { missingNodes, missingMaterials, collisions }
}
