import { useMemo } from "react"
import * as THREE from "three"
import { fromBlender, sizeFromBlender, vecFromBlender, type Vec3 } from "../systems/coords"

// Stand-in for room.glb built from the asset contract (01-kontrak-aset.md §5, §6, §9).
// It exposes the same { scene, cameras } shape, node names, userData and material names
// as the glTF, so code that reads nodes by name works unchanged on the real asset.

interface BoxSpec {
  name: string
  // Box center and size in Blender coordinates (contract origins converted with the origin rules).
  center: Vec3
  size: Vec3
  color?: string
  material?: string
  emissive?: boolean
  // Empties (like int_rubik) have no geometry; `center` is then the object origin.
  empty?: boolean
  userData?: Record<string, unknown>
  children?: BoxSpec[]
}

interface MarkerSpec {
  name: string
  position: Vec3
  userData: Record<string, unknown>
}

interface CameraSpec {
  view: "main" | "desk" | "tv" | "whiteboard"
  target: Vec3
  direction: Vec3
  orthoScale: number
  near: number
}

const WOOD = "#b98a5e"
const WOOD_DARK = "#8a5f3d"
const WALL = "#efe3d0"
const FABRIC = "#7a9e7e"
const DARK = "#3a3f47"
const SCREEN = "#6fb7ff"

const int = (section: string, zone: string, extra: Record<string, unknown> = {}) => ({
  section,
  zone,
  ...extra
})

const books: BoxSpec[] = Array.from({ length: 10 }, (_, i) => ({
  name: `int_bookshelf_book_${String(i + 1).padStart(2, "0")}`,
  center: [-1.8, -0.14 + i * 0.032, 0.5 + 0.1],
  size: [0.14, 0.028, 0.2],
  color: ["#c0504d", "#4f81bd", "#9bbb59", "#f79646", "#8064a2"][i % 5]
}))

const rubikFaces: BoxSpec[] = (
  [
    ["front", [0.8, 2.3095, 0.79], [0.07, 0.001, 0.07]],
    ["back", [0.8, 2.3905, 0.79], [0.07, 0.001, 0.07]],
    ["right", [0.8405, 2.35, 0.79], [0.001, 0.07, 0.07]],
    ["left", [0.7595, 2.35, 0.79], [0.001, 0.07, 0.07]],
    ["top", [0.8, 2.35, 0.8305], [0.07, 0.07, 0.001]],
    ["bottom", [0.8, 2.35, 0.7495], [0.07, 0.07, 0.001]]
  ] as const
).map(([side, center, size]) => ({
  name: `int_rubik_face_${side}`,
  center: [...center] as Vec3,
  size: [...size] as Vec3,
  color: "#ffffff",
  material: `rubik_face_${side}`
}))

// 3×3×3 minus the hidden core, like the real Rubik.
const rubikCubies: BoxSpec[] = [-1, 0, 1]
  .flatMap((x) => [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((z) => [x, y, z])))
  .filter(([x, y, z]) => x || y || z)
  .map(([x, y, z], i) => ({
    name: `int_rubik_cubie_${String(i + 1).padStart(2, "0")}`,
    center: [0.8 + x * 0.0267, 2.35 + y * 0.0267, 0.79 + z * 0.0267] as Vec3,
    size: [0.026, 0.026, 0.026] as Vec3,
    color: "#111111"
  }))

const BOXES: BoxSpec[] = [
  // Room
  { name: "room_base", center: [-0.075, 0.075, -0.135], size: [4.15, 5.15, 0.23], color: WOOD_DARK },
  { name: "room_floor", center: [0, 0, -0.01], size: [4.0, 5.0, 0.02], color: WOOD },
  { name: "room_wall_a", center: [-0.075, 2.575, 1.4], size: [4.15, 0.15, 2.8], color: WALL },
  { name: "room_wall_b", center: [-2.075, 0, 1.4], size: [0.15, 5.0, 2.8], color: WALL },
  { name: "room_door", center: [-1.975, -2.0, 1.05], size: [0.05, 0.8, 2.1], color: WOOD_DARK },
  {
    name: "int_window",
    center: [0.2, 2.5, 1.5],
    size: [1.2, 0.15, 1.2],
    color: "#f4f1ea",
    userData: int("window", "room"),
    children: [
      { name: "int_window_glass", center: [0.2, 2.49, 1.5], size: [1.1, 0.02, 1.1], color: "#bfe3ff", material: "glass_window", emissive: true },
      { name: "int_window_curtain_l", center: [-0.5, 2.4, 1.45], size: [0.25, 0.05, 1.3], color: "#d9b38c" },
      { name: "int_window_curtain_r", center: [0.9, 2.4, 1.45], size: [0.25, 0.05, 1.3], color: "#d9b38c" }
    ]
  },
  {
    name: "int_switch",
    center: [-1.99, -1.45, 1.3],
    size: [0.02, 0.08, 0.12],
    color: "#f7f7f7",
    userData: int("switch", "room"),
    children: [{ name: "int_switch_toggle", center: [-1.975, -1.45, 1.3], size: [0.015, 0.02, 0.04], color: "#cccccc" }]
  },
  {
    name: "deco_ceiling_lamp",
    center: [0, 0.2, 2.475],
    size: [0.35, 0.35, 0.15],
    color: "#f0e6d2",
    children: [
      { name: "deco_ceiling_lamp_bulb", center: [0, 0.2, 2.37], size: [0.1, 0.1, 0.1], color: "#fff3d6", material: "emit_bulb_ceiling", emissive: true }
    ]
  },

  // Zone_Desk
  { name: "zone_desk", center: [1.3, 2.2, 0.375], size: [1.2, 0.6, 0.75], color: WOOD, userData: { zone_root: true } },
  { name: "deco_desk_chair", center: [1.3, 1.65, 0.45], size: [0.5, 0.5, 0.9], color: DARK },
  {
    name: "int_monitor",
    center: [1.35, 2.35, 0.975],
    size: [0.62, 0.05, 0.45],
    color: DARK,
    userData: int("about-contact", "desk"),
    children: [
      { name: "int_monitor_screen", center: [1.35, 2.32, 1.0], size: [0.58, 0.005, 0.326], color: SCREEN, material: "emit_screen_monitor", emissive: true }
    ]
  },
  { name: "deco_keyboard", center: [1.35, 2.05, 0.765], size: [0.44, 0.14, 0.03], color: "#e5e5e5" },
  { name: "deco_mouse", center: [1.72, 2.05, 0.765], size: [0.06, 0.1, 0.03], color: "#e5e5e5" },
  {
    name: "deco_pc_tower",
    center: [1.72, 2.2, 0.225],
    size: [0.2, 0.45, 0.45],
    color: DARK,
    children: [{ name: "deco_pc_tower_led", center: [1.72, 1.97, 0.35], size: [0.1, 0.01, 0.02], color: "#2dd4bf", material: "emit_led_pc", emissive: true }]
  },
  {
    name: "int_rubik",
    center: [0.8, 2.35, 0.75],
    size: [0.08, 0.08, 0.08],
    empty: true,
    userData: int("techstack", "desk"),
    children: [...rubikCubies, ...rubikFaces]
  },
  {
    name: "int_journal",
    center: [0.95, 2.02, 0.76],
    size: [0.3, 0.21, 0.02],
    color: "#7b4a2a",
    userData: int("blog-talks", "desk"),
    children: [{ name: "int_journal_pages", center: [0.95, 2.02, 0.772], size: [0.28, 0.196, 0.004], color: "#f5ecd7", material: "mat_journal_pages" }]
  },
  { name: "deco_tea_glass", center: [1.1, 2.33, 0.8], size: [0.07, 0.07, 0.1], color: "#c47a2c" },
  {
    name: "deco_desk_lamp",
    center: [1.8, 2.38, 0.95],
    size: [0.12, 0.12, 0.4],
    color: DARK,
    children: [{ name: "deco_desk_lamp_bulb", center: [1.8, 2.34, 1.12], size: [0.05, 0.05, 0.05], color: "#fff3d6", material: "emit_bulb_desklamp", emissive: true }]
  },

  // Zone_TV
  { name: "zone_tv_table", center: [-1.78, -0.55, 0.25], size: [0.4, 1.6, 0.5], color: WOOD, userData: { zone_root: true } },
  {
    name: "int_tv",
    center: [-1.85, -0.7, 0.82],
    size: [0.05, 0.96, 0.6],
    color: DARK,
    userData: int("films", "tv"),
    children: [{ name: "int_tv_screen", center: [-1.823, -0.7, 0.84], size: [0.004, 0.92, 0.5175], color: SCREEN, material: "emit_screen_tv", emissive: true }]
  },
  {
    name: "int_console",
    center: [-1.65, -0.7, 0.5075],
    size: [0.1, 0.24, 0.015],
    color: "#e24a4a",
    userData: int("games", "tv"),
    children: [{ name: "int_console_screen", center: [-1.65, -0.7, 0.516], size: [0.07, 0.1, 0.002], color: SCREEN, material: "emit_screen_console", emissive: true }]
  },
  {
    name: "int_mp3_player",
    center: [-1.65, -0.4, 0.505],
    size: [0.05, 0.1, 0.01],
    color: "#d0d0d0",
    userData: int("music", "tv"),
    children: [{ name: "int_mp3_player_screen", center: [-1.65, -0.38, 0.511], size: [0.04, 0.04, 0.002], color: SCREEN, material: "emit_screen_mp3", emissive: true }]
  },
  {
    name: "int_headset",
    center: [-1.72, -1.02, 0.66],
    size: [0.1, 0.18, 0.2],
    color: "#2f2f2f",
    userData: int("gadgets", "tv"),
    children: [{ name: "int_headset_stand", center: [-1.72, -1.02, 0.53], size: [0.12, 0.12, 0.06], color: "#555555" }]
  },
  { name: "int_robot_figure", center: [-1.75, -1.25, 0.6], size: [0.08, 0.08, 0.2], color: "#9aa5b1", userData: int("figures", "tv") },
  {
    name: "int_bookshelf",
    center: [-1.8, 0.02, 0.505],
    size: [0.15, 0.36, 0.01],
    color: WOOD_DARK,
    userData: int("books", "tv"),
    children: [
      ...books,
      { name: "int_bookshelf_bookend_01", center: [-1.8, -0.17, 0.59], size: [0.14, 0.02, 0.18], color: DARK },
      { name: "int_bookshelf_bookend_02", center: [-1.8, 0.2, 0.59], size: [0.14, 0.02, 0.18], color: DARK }
    ]
  },

  // Zone_Whiteboard
  {
    name: "int_whiteboard",
    center: [-1.985, 1.0, 1.35],
    size: [0.03, 1.2, 0.9],
    color: "#b0b7bf",
    userData: int("projects", "whiteboard", { zone_root: true }),
    children: [
      { name: "int_whiteboard_surface", center: [-1.968, 1.0, 1.35], size: [0.004, 1.14, 0.855], color: "#ffffff", material: "mat_whiteboard_surface" }
    ]
  },
  { name: "deco_whiteboard_tray", center: [-1.97, 1.0, 0.885], size: [0.06, 0.8, 0.03], color: "#b0b7bf" },
  {
    name: "int_sticky_note_template",
    center: [-1.964, 1.4, 1.6],
    size: [0.004, 0.14, 0.14],
    color: "#ffe066",
    material: "mat_sticky_note",
    userData: int("projects", "whiteboard")
  },

  // Decor
  { name: "deco_wardrobe", center: [-1.45, 2.2, 0.95], size: [1.0, 0.55, 1.9], color: WOOD },
  { name: "deco_landmark_mini", center: [-1.45, 2.2, 2.0], size: [0.1, 0.1, 0.2], color: "#c9a227" },
  { name: "deco_painting", center: [-1.9875, -0.7, 1.55], size: [0.025, 0.7, 0.5], color: "#6a8caf" },
  { name: "deco_bed", center: [0.95, -1.95, 0.225], size: [2.0, 1.0, 0.45], color: "#dfe7f2" },
  { name: "deco_rug", center: [0.1, 0.3, 0.005], size: [1.8, 1.3, 0.01], color: "#c8553d" },
  { name: "deco_plant", center: [-0.6, 2.2, 0.3], size: [0.35, 0.35, 0.6], color: FABRIC },
  { name: "deco_trash_bin", center: [0.55, 2.3, 0.15], size: [0.25, 0.25, 0.3], color: "#8d99ae" },
  {
    name: "deco_fan",
    center: [1.8, 0.5, 0.55],
    size: [0.3, 0.3, 1.1],
    color: "#e8e8e8",
    children: [{ name: "deco_fan_blades", center: [1.7, 0.5, 0.95], size: [0.05, 0.4, 0.4], color: "#bcd4e6" }]
  },
  { name: "deco_sandals", center: [-1.83, -1.47, 0.015], size: [0.25, 0.25, 0.03], color: "#3d5a80" }
]

const COLLISIONS: [string, Vec3, [number, number]][] = [
  ["zone_desk", [1.3, 2.2, 0], [1.2, 0.6]],
  ["deco_desk_chair", [1.3, 1.65, 0], [0.5, 0.5]],
  ["deco_pc_tower", [1.72, 2.2, 0], [0.2, 0.45]],
  ["zone_tv_table", [-1.78, -0.55, 0], [0.4, 1.6]],
  ["deco_wardrobe", [-1.45, 2.2, 0], [1.0, 0.55]],
  ["deco_bed", [0.95, -1.95, 0], [2.0, 1.0]],
  ["deco_plant", [-0.6, 2.2, 0], [0.35, 0.35]],
  ["deco_trash_bin", [0.55, 2.3, 0], [0.25, 0.25]],
  ["deco_fan", [1.8, 0.5, 0], [0.3, 0.3]]
]

const MARKERS: MarkerSpec[] = [
  { name: "spawn_avatar", position: [0.1, 0.2, 0], userData: { type: "spawn" } },
  { name: "trigger_desk", position: [0.7, 1.4, 0], userData: { type: "trigger", target: "desk", radius: 0.6 } },
  { name: "trigger_whiteboard", position: [-1.2, 1.0, 0], userData: { type: "trigger", target: "whiteboard", radius: 0.6 } },
  { name: "trigger_tv", position: [-1.1, -0.55, 0], userData: { type: "trigger", target: "tv", radius: 0.6 } },
  { name: "trigger_switch", position: [-1.5, -1.75, 0], userData: { type: "trigger", target: "switch", radius: 0.45 } },
  { name: "trigger_window", position: [0.2, 1.8, 0], userData: { type: "trigger", target: "window", radius: 0.45 } },
  { name: "focus_rubik", position: [1.35, 1.95, 1.05], userData: { type: "focus" } }
]

// Contract §6 targets/directions; ortho scale and near plane match room.glb.
const CAMERAS: CameraSpec[] = [
  { view: "main", target: [-0.53, 0.53, 0.9], direction: [1, -1, 0.82], orthoScale: 11.399, near: 0.01 },
  { view: "desk", target: [1.3, 2.2, 0.85], direction: [0.35, -1, 0.9], orthoScale: 3.753, near: 0.01 },
  { view: "tv", target: [-1.78, -0.55, 0.75], direction: [1, -0.3, 0.8], orthoScale: 3.331, near: 0.01 },
  { view: "whiteboard", target: [-1.97, 1.0, 1.35], direction: [1, -0.25, 0.15], orthoScale: 1.929, near: 1.2 }
]

const CAMERA_DISTANCE = 3
const FRAME_ASPECT = 16 / 9

function buildBox(spec: BoxSpec, parentCenter: Vec3 | null): THREE.Object3D {
  const object = spec.empty ? new THREE.Object3D() : buildMesh(spec)
  object.name = spec.name
  object.userData = { name: spec.name, ...spec.userData }

  const world = fromBlender(spec.center)
  const origin = parentCenter ? fromBlender(parentCenter) : [0, 0, 0]
  object.position.set(world[0] - origin[0], world[1] - origin[1], world[2] - origin[2])

  for (const child of spec.children ?? []) object.add(buildBox(child, spec.center))
  return object
}

function buildMesh(spec: BoxSpec): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(...sizeFromBlender(spec.size))
  geometry.name = spec.name

  const material = new THREE.MeshStandardMaterial({ color: spec.color ?? "#cccccc", roughness: 0.8 })
  material.name = spec.material ?? "mat_palette"
  if (spec.emissive) {
    material.emissive.set(spec.color ?? "#ffffff")
    material.emissiveIntensity = 1
  }

  return new THREE.Mesh(geometry, material)
}

function buildCollision([name, [x, y], [sx, sy]]: (typeof COLLISIONS)[number]): THREE.Mesh {
  const collisionName = `collision_${name}`
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...sizeFromBlender([sx, sy, 0.5])))
  mesh.name = collisionName
  mesh.userData = { name: collisionName, type: "collision" }
  mesh.position.copy(vecFromBlender([x, y, 0.25]))
  return mesh
}

function buildMarker({ name, position, userData }: MarkerSpec): THREE.Object3D {
  const marker = new THREE.Object3D()
  marker.name = name
  marker.userData = { name, ...userData }
  marker.position.copy(vecFromBlender(position))
  return marker
}

function buildCamera({ view, target, direction, orthoScale, near }: CameraSpec): THREE.OrthographicCamera {
  const halfWidth = orthoScale / 2
  const halfHeight = halfWidth / FRAME_ASPECT
  const camera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, near, 30)
  const name = `cam_${view}`
  camera.name = name
  camera.userData = { name, type: "camera", view }

  const targetVec = vecFromBlender(target)
  camera.position.copy(targetVec).add(vecFromBlender(direction).normalize().multiplyScalar(CAMERA_DISTANCE))
  camera.lookAt(targetVec)
  return camera
}

export function buildPlaceholderScene() {
  const scene = new THREE.Group()
  scene.name = "Scene"

  for (const spec of BOXES) scene.add(buildBox(spec, null))
  for (const collision of COLLISIONS) scene.add(buildCollision(collision))
  for (const marker of MARKERS) scene.add(buildMarker(marker))

  const cameras = CAMERAS.map(buildCamera)
  scene.add(...cameras)

  return { scene, cameras }
}

export type RoomAsset = ReturnType<typeof buildPlaceholderScene>

export function usePlaceholderRoom(): RoomAsset {
  return useMemo(buildPlaceholderScene, [])
}

export default function Placeholder({ room }: { room: RoomAsset }) {
  return <primitive object={room.scene} />
}
