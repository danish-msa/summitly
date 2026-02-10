"use client";

import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import type { Map } from "mapbox-gl";
import { FLY_AROUND } from "./constants";
import { startOrbit as runOrbit } from "./orbitRunner";

export interface FlyAroundCameraOptions {
  center: [number, number];
  zoom?: number;
  pitch?: number;
  orbitDurationMs?: number;
  stoppedRef?: MutableRefObject<boolean>;
}

export function useFlyAroundCamera() {
  const stopRef = useRef<(() => void) | null>(null);

  const startOrbit = useCallback((map: Map, options: FlyAroundCameraOptions) => {
    stopRef.current?.();
    const stoppedRef = options.stoppedRef;
    return (stopRef.current = runOrbit(map, {
      center: options.center,
      zoom: options.zoom ?? FLY_AROUND.ZOOM,
      pitch: options.pitch ?? FLY_AROUND.PITCH,
      orbitDurationMs: options.orbitDurationMs ?? FLY_AROUND.ORBIT_DURATION_MS,
      getStopped: () => stoppedRef?.current ?? false,
    }));
  }, []);

  const stopOrbit = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  return { startOrbit, stopOrbit };
}
