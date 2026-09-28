import * as THREE from "three"

// Walkable floor from the asset (03 §5.2): 0.1 m cells over room_floor, blocked inside every
// collision_* footprint grown by the avatar radius. Coordinates are Three.js x/z.
const CELL = 0.1
export const AVATAR_RADIUS = 0.25

export interface Point {
  x: number
  z: number
}

interface Rect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface NavGrid {
  isFree(x: number, z: number): boolean
  nearestFree(point: Point): Point
  findPath(from: Point, to: Point): Point[] | null
}

export function buildNavGrid(scene: THREE.Object3D): NavGrid {
  scene.updateMatrixWorld(true)
  const floorNode = scene.getObjectByName("room_floor")
  if (!floorNode) console.warn('[room] nav: missing "room_floor", using the contract floor size')
  const floorBox = floorNode
    ? new THREE.Box3().setFromObject(floorNode)
    : new THREE.Box3(new THREE.Vector3(-2, 0, -2.5), new THREE.Vector3(2, 0, 2.5))
  const walk: Rect = {
    minX: floorBox.min.x + AVATAR_RADIUS,
    maxX: floorBox.max.x - AVATAR_RADIUS,
    minZ: floorBox.min.z + AVATAR_RADIUS,
    maxZ: floorBox.max.z - AVATAR_RADIUS
  }

  const obstacles: Rect[] = []
  scene.traverse((object) => {
    if (object.userData.type !== "collision") return
    const box = new THREE.Box3().setFromObject(object)
    obstacles.push({
      minX: box.min.x - AVATAR_RADIUS,
      maxX: box.max.x + AVATAR_RADIUS,
      minZ: box.min.z - AVATAR_RADIUS,
      maxZ: box.max.z + AVATAR_RADIUS
    })
  })

  const isFree = (x: number, z: number) =>
    x >= walk.minX &&
    x <= walk.maxX &&
    z >= walk.minZ &&
    z <= walk.maxZ &&
    !obstacles.some((r) => x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ)

  const originX = floorBox.min.x
  const originZ = floorBox.min.z
  const cols = Math.round((floorBox.max.x - floorBox.min.x) / CELL)
  const rows = Math.round((floorBox.max.z - floorBox.min.z) / CELL)
  const center = (c: number, r: number): Point => ({ x: originX + (c + 0.5) * CELL, z: originZ + (r + 0.5) * CELL })
  const free = new Uint8Array(cols * rows)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) free[r * cols + c] = isFree(center(c, r).x, center(c, r).z) ? 1 : 0

  const cellOf = ({ x, z }: Point) => ({
    c: Math.min(cols - 1, Math.max(0, Math.floor((x - originX) / CELL))),
    r: Math.min(rows - 1, Math.max(0, Math.floor((z - originZ) / CELL)))
  })

  const nearestFree = (point: Point): Point => {
    if (isFree(point.x, point.z)) return point
    let best: Point | null = null
    let bestDistance = Infinity
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!free[r * cols + c]) continue
        const p = center(c, r)
        const d = (p.x - point.x) ** 2 + (p.z - point.z) ** 2
        if (d < bestDistance) {
          bestDistance = d
          best = p
        }
      }
    }
    return best ?? point
  }

  const clearLine = (a: Point, b: Point) => {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (CELL / 2))
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      if (!isFree(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false
    }
    return true
  }

  // A* over 8 neighbours without cutting blocked corners, then string-pulled to straight segments.
  const findPath = (fromPoint: Point, toPoint: Point): Point[] | null => {
    const from = nearestFree(fromPoint)
    const to = nearestFree(toPoint)
    if (clearLine(from, to)) return [from, to]

    const start = cellOf(from)
    const goal = cellOf(to)
    const startIndex = start.r * cols + start.c
    const goalIndex = goal.r * cols + goal.c
    const g = new Float32Array(cols * rows).fill(Infinity)
    const parent = new Int32Array(cols * rows).fill(-1)
    const closed = new Uint8Array(cols * rows)
    const heuristic = (i: number) => Math.hypot((i % cols) - goal.c, Math.floor(i / cols) - goal.r)
    const open: { i: number; f: number }[] = [{ i: startIndex, f: heuristic(startIndex) }]
    g[startIndex] = 0

    while (open.length) {
      let best = 0
      for (let k = 1; k < open.length; k++) if (open[k].f < open[best].f) best = k
      const { i } = open.splice(best, 1)[0]
      if (i === goalIndex) break
      if (closed[i]) continue
      closed[i] = 1
      const c = i % cols
      const r = Math.floor(i / cols)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue
          const nc = c + dc
          const nr = r + dr
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue
          const n = nr * cols + nc
          if (!free[n] && n !== goalIndex) continue
          if (dr && dc && (!free[r * cols + nc] || !free[nr * cols + c])) continue
          const cost = g[i] + (dr && dc ? Math.SQRT2 : 1)
          if (cost < g[n]) {
            g[n] = cost
            parent[n] = i
            open.push({ i: n, f: cost + heuristic(n) })
          }
        }
      }
    }
    if (parent[goalIndex] === -1 && goalIndex !== startIndex) return null

    const cells: Point[] = []
    for (let i = goalIndex; i !== -1; i = parent[i]) cells.unshift(center(i % cols, Math.floor(i / cols)))
    const raw = [from, ...cells.slice(1, -1), to]
    const path = [raw[0]]
    let anchor = 0
    for (let k = 2; k < raw.length; k++) {
      if (!clearLine(raw[anchor], raw[k])) {
        path.push(raw[k - 1])
        anchor = k - 1
      }
    }
    path.push(raw[raw.length - 1])
    return path
  }

  return { isFree, nearestFree, findPath }
}

export const pathLength = (path: Point[]) =>
  path.reduce((sum, p, i) => (i ? sum + Math.hypot(p.x - path[i - 1].x, p.z - path[i - 1].z) : 0), 0)
