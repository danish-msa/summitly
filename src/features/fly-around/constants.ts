/**
 * Fly Around feature – 3D drone-style view over a location.
 * Tuned for a dramatic, “cool” 3D look.
 */
export const FLY_AROUND = {
  /** Zoom: higher = closer to the property (drone view). */
  ZOOM: 19,
  /** Steep pitch = strong drone / bird’s-eye 3D effect. */
  PITCH: 72,
  /** One full 360° orbit duration (ms). */
  ORBIT_DURATION_MS: 28_000,
  /** Style with 3D buildings + satellite. */
  MAP_STYLE: "mapbox://styles/mapbox/satellite-streets-v12",
  /** Terrain height multiplier – higher = more dramatic hills/valleys. */
  TERRAIN_EXAGGERATION: 3,
} as const;
