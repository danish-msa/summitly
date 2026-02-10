/**
 * Pure orbit animation runner. No React – just map + options.
 * Call startOrbit() to run; returns stop() to cancel.
 */
import type { Map } from "mapbox-gl";
import { FLY_AROUND } from "./constants";

export interface OrbitOptions {
  center: [number, number];
  zoom?: number;
  pitch?: number;
  orbitDurationMs?: number;
  /** When true, orbit stops and no more frames run. */
  getStopped: () => boolean;
}

export function startOrbit(map: Map, options: OrbitOptions): () => void {
  const {
    center,
    zoom = FLY_AROUND.ZOOM,
    pitch = FLY_AROUND.PITCH,
    orbitDurationMs = FLY_AROUND.ORBIT_DURATION_MS,
    getStopped,
  } = options;

  let rafId: number | null = null;
  const startTime = performance.now();

  const animate = () => {
    if (getStopped()) return;

    const elapsed = performance.now() - startTime;
    const t = (elapsed % orbitDurationMs) / orbitDurationMs;
    const bearing = t * 360;

    map.jumpTo({ center, zoom, pitch, bearing });
    rafId = requestAnimationFrame(animate);
  };

  const stop = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  rafId = requestAnimationFrame(animate);
  return stop;
}
