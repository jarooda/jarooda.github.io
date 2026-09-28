// Storm flash strength (0–1), decaying to 0 after each trigger. A module-level mutable value
// (same pattern as Atmosphere's `live`) so Weather.tsx (which decides when to flash) and
// Outside.tsx / Lighting.tsx (which brighten the sky and window glass) don't need to pass props
// through the scene tree every frame.
export const lightning = { strength: 0 }
