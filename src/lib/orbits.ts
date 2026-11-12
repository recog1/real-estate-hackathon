import type { NextPass, SatelliteId, SatelliteSpec } from "./types";
import { SATELLITES } from "./satellites";

const RE_KM = 6371;
const MU_KM3 = 398600.4418;

export type Vec3 = { x: number; y: number; z: number };

export type GeoPose = {
  lat: number;
  lon: number;
  heightKm: number;
};

const LEAD_DEG: Record<SatelliteId, number> = {
  wv3: 0.7,
  pneo3: 2.2,
  "skysat-c1": 3.8,
  "skysat-a": 5.4,
  s2a: 7.2,
  l9: 9.0,
};

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}
function dot(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
function norm(a: Vec3): Vec3 {
  const n = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / n, y: a.y / n, z: a.z / n };
}

function geoToUnit(lat: number, lon: number): Vec3 {
  const φ = (lat * Math.PI) / 180;
  const λ = (lon * Math.PI) / 180;
  return {
    x: Math.cos(φ) * Math.cos(λ),
    y: Math.cos(φ) * Math.sin(λ),
    z: Math.sin(φ),
  };
}

function unitToGeo(u: Vec3) {
  const n = norm(u);
  return {
    lat: (Math.asin(Math.max(-1, Math.min(1, n.z))) * 180) / Math.PI,
    lon: (Math.atan2(n.y, n.x) * 180) / Math.PI,
  };
}

function rotateAround(v: Vec3, axis: Vec3, ang: number): Vec3 {
  const k = norm(axis);
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const d = dot(k, v);
  return add(add(scale(v, c), scale(cross(k, v), s)), scale(k, d * (1 - c)));
}

export function tleInclinationDeg(spec: SatelliteSpec) {
  const n = Number.parseFloat(spec.tle2.slice(8, 16));
  return Number.isFinite(n) ? n : 97.8;
}

export function tleAltitudeKm(spec: SatelliteSpec) {
  const revPerDay = Number.parseFloat(spec.tle2.slice(52, 63));
  if (!Number.isFinite(revPerDay) || revPerDay <= 0) return 617;
  const n = (revPerDay * 2 * Math.PI) / 86400;
  const a = Math.cbrt(MU_KM3 / (n * n));
  return Math.max(400, a - RE_KM);
}

/** Orbital-plane normal for a ~SSO track that contains the site. */
export function planeThroughSite(lat: number, lon: number, inclinationDeg: number): Vec3 {
  const i = (inclinationDeg * Math.PI) / 180;
  const nz = Math.cos(i);
  const site = geoToUnit(lat, lon);
  const target = -site.z * nz;
  const sxy = Math.hypot(site.x, site.y);
  const r2 = Math.sin(i) ** 2;
  if (sxy < 1e-6) return { x: Math.sin(i), y: 0, z: nz };
  const ux = site.x / sxy;
  const uy = site.y / sxy;
  const p = target / sxy;
  const q = Math.sqrt(Math.max(0, r2 - p * p));
  return {
    x: ux * p + -uy * q,
    y: uy * p + ux * q,
    z: nz,
  };
}

export function demoSatOverSite(
  spec: SatelliteSpec,
  lat: number,
  lon: number,
  leadDeg = LEAD_DEG[spec.id] ?? 2,
): GeoPose {
  const i = tleInclinationDeg(spec);
  const heightKm = tleAltitudeKm(spec);
  const N = planeThroughSite(lat, lon, i);
  const site = geoToUnit(lat, lon);
  const p = rotateAround(site, N, (-leadDeg * Math.PI) / 180);
  const g = unitToGeo(p);
  return { ...g, heightKm };
}

export function demoOrbitSamples(
  spec: SatelliteSpec,
  lat: number,
  lon: number,
  count = 180,
): GeoPose[] {
  const i = tleInclinationDeg(spec);
  const heightKm = tleAltitudeKm(spec);
  const N = planeThroughSite(lat, lon, i);
  const site = geoToUnit(lat, lon);
  const out: GeoPose[] = [];
  for (let k = 0; k <= count; k++) {
    const p = rotateAround(site, N, (k / count) * Math.PI * 2);
    out.push({ ...unitToGeo(p), heightKm });
  }
  return out;
}

/** Demo next-pass: imminent overhead of the clicked site. */
export function nextPass(
  spec: SatelliteSpec,
  _lat: number,
  _lon: number,
  from: Date = new Date(),
): NextPass {
  const idx = Math.max(0, SATELLITES.findIndex((s) => s.id === spec.id));
  return {
    time: new Date(from.getTime() + (70 + idx * 35) * 1000),
    elevationDeg: 82 - idx * 3,
    offNadirDeg: 8 + idx * 1.6,
    rangeKm: tleAltitudeKm(spec),
  };
}

export function formatPassClock(date: Date) {
  return date.toISOString().replace("T", " ").replace(".000Z", "Z");
}

export function formatEta(date: Date, now = new Date()) {
  const mins = Math.max(0, Math.round((date.getTime() - now.getTime()) / 60000));
  if (mins < 1) return "Now";
  if (mins < 90) return `T+${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `T+${h}h${m.toString().padStart(2, "0")}m`;
}
