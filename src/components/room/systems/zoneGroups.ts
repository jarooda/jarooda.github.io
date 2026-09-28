import type * as THREE from "three"
import { ZONE_MEMBERS, type ZoneId } from "../sections"

export interface ZoneGroups {
  members: Map<ZoneId, THREE.Object3D[]>
  zoneOf: Map<THREE.Object3D, ZoneId>
}

// A zone is its whole Zone_* collection, so hovering any part (TV, table, chair, keyboard)
// lights up the entire zone.
export function buildZoneGroups(scene: THREE.Object3D): ZoneGroups {
  const members = new Map<ZoneId, THREE.Object3D[]>()
  const zoneOf = new Map<THREE.Object3D, ZoneId>()

  for (const [zone, names] of Object.entries(ZONE_MEMBERS) as [ZoneId, string[]][]) {
    const nodes = names.flatMap((name) => scene.getObjectByName(name) ?? [])
    members.set(zone, nodes)
    nodes.forEach((node) => zoneOf.set(node, zone))
  }

  return { members, zoneOf }
}
