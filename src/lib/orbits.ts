import {
  twoline2satrec,
  propagate,
  gstime,
  eciToEcf,
  eciToGeodetic,
  ecfToLookAngles,
  degreesLat,
  degreesLong,
} from "satellite.js";
import type { NextPass, SatelliteSpec } from "./types";

export function satrecOf(spec: SatelliteSpec) {
  return twoline2satrec(spec.tle1, spec.tle2);
}

export function geodeticAt(spec: SatelliteSpec, date: Date) {
  const rec = satrecOf(spec);
  const pv = propagate(rec, date);
  if (!pv?.position) return null;
  const gd = eciToGeodetic(pv.position, gstime(date));
  return {
    lat: degreesLat(gd.latitude),
    lon: degreesLong(gd.longitude),
    heightKm: gd.height,
  };
}

export function nextPass(
  spec: SatelliteSpec,
  lat: number,
  lon: number,
  from: Date = new Date(),
  horizonDeg = 20,
): NextPass | null {
  const rec = satrecOf(spec);
  const observer = {
    longitude: (lon * Math.PI) / 180,
    latitude: (lat * Math.PI) / 180,
    height: 0.03,
  };

  const stepMs = 30_000;
  const horizon = (horizonDeg * Math.PI) / 180;
  let inPass = false;
  let peak: NextPass | null = null;

  for (let t = 0; t <= 24 * 3600 * 1000; t += stepMs) {
    const date = new Date(from.getTime() + t);
    const pv = propagate(rec, date);
    if (!pv?.position) continue;
    const look = ecfToLookAngles(observer, eciToEcf(pv.position, gstime(date)));
    if (look.elevation > horizon) {
      inPass = true;
      const el = (look.elevation * 180) / Math.PI;
      const offNadir = Math.max(0, 90 - el);
      const rangeKm = look.rangeSat;
      if (!peak || el > peak.elevationDeg) {
        peak = { time: date, elevationDeg: el, offNadirDeg: offNadir, rangeKm };
      }
    } else if (inPass && peak) {
      return peak;
    }
  }
  return peak;
}

export function formatPassClock(date: Date) {
  return date.toISOString().replace("T", " ").replace(".000Z", "Z");
}

export function formatEta(date: Date, now = new Date()) {
  const mins = Math.max(0, Math.round((date.getTime() - now.getTime()) / 60000));
  if (mins < 1) return "NOW";
  if (mins < 90) return `T+${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `T+${h}h${m.toString().padStart(2, "0")}m`;
}
