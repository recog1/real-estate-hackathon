import type { Box, DetectClass, DetectionFrame, DetectionTrack, ZoneId } from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Track = {
  id: string;
  cls: DetectClass;
  x0: number;
  y0: number;
  w: number;
  h: number;
  conf: number;
  vx: number;
  vy: number;
};

function tracksFor(zone: ZoneId): Track[] {
  const rand = mulberry32({ a: 11, b: 23, c: 41, d: 71 }[zone]);
  const houses: Track[] = [];
  const cols = zone === "a" ? 4 : 3;
  const rows = 3;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      n += 1;
      houses.push({
        id: `H${zone}${n}`,
        cls: "house",
        x0: 0.06 + c * 0.3 + rand() * 0.04,
        y0: 0.08 + r * 0.28 + rand() * 0.05,
        w: 0.16 + rand() * 0.06,
        h: 0.12 + rand() * 0.05,
        conf: 0.86 + rand() * 0.12,
        vx: 0,
        vy: 0,
      });
    }
  }
  const cars: Track[] = [];
  const carCount = 10 + Math.floor(rand() * 8);
  for (let i = 0; i < carCount; i++) {
    const moving = i < 3;
    cars.push({
      id: `C${zone}${i + 1}`,
      cls: "car",
      x0: 0.05 + rand() * 0.85,
      y0: moving ? 0.42 + rand() * 0.08 : 0.08 + rand() * 0.8,
      w: 0.028 + rand() * 0.016,
      h: 0.018 + rand() * 0.012,
      conf: 0.78 + rand() * 0.2,
      vx: moving ? 0.012 + rand() * 0.01 : (rand() - 0.5) * 0.001,
      vy: moving ? (rand() - 0.5) * 0.002 : (rand() - 0.5) * 0.001,
    });
  }
  const people: Track[] = [];
  const personCount = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < personCount; i++) {
    people.push({
      id: `P${zone}${i + 1}`,
      cls: "person",
      x0: 0.1 + rand() * 0.8,
      y0: 0.15 + rand() * 0.7,
      w: 0.01 + rand() * 0.006,
      h: 0.016 + rand() * 0.008,
      conf: 0.62 + rand() * 0.25,
      vx: (rand() - 0.5) * 0.008,
      vy: (rand() - 0.5) * 0.008,
    });
  }
  return [...houses, ...cars, ...people];
}

export function syntheticTrack(zone: ZoneId, duration = 24): DetectionTrack {
  const tracks = tracksFor(zone);
  const dt = 0.4;
  const frames: DetectionFrame[] = [];
  for (let t = 0; t <= duration + 0.001; t += dt) {
    const boxes: Box[] = tracks.map((tr) => {
      const jitter = 0.0015 * Math.sin(t * 3 + tr.id.length);
      let x = tr.x0 + tr.vx * t + jitter;
      let y = tr.y0 + tr.vy * t;
      x = ((x % 1) + 1) % 1;
      y = Math.min(0.95, Math.max(0.02, y));
      return {
        id: tr.id,
        cls: tr.cls,
        x,
        y,
        w: tr.w,
        h: tr.h,
        conf: Math.min(0.99, tr.conf + 0.02 * Math.sin(t + tr.w * 10)),
      };
    });
    frames.push({ t: Math.round(t * 100) / 100, boxes });
  }
  return { zone, duration, frames };
}

export function interpolateBoxes(track: DetectionTrack, time: number): Box[] {
  const frames = track.frames;
  if (!frames.length) return [];
  const t = ((time % track.duration) + track.duration) % track.duration;
  if (t <= frames[0].t) return frames[0].boxes;
  const last = frames[frames.length - 1];
  if (t >= last.t) return last.boxes;
  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].t < t) i += 1;
  const a = frames[i];
  const b = frames[i + 1];
  const u = (t - a.t) / Math.max(0.0001, b.t - a.t);
  const next = new Map(b.boxes.map((box) => [box.id, box]));
  return a.boxes.map((box) => {
    const other = next.get(box.id);
    if (!other) return box;
    return {
      ...box,
      x: box.x + (other.x - box.x) * u,
      y: box.y + (other.y - box.y) * u,
      w: box.w + (other.w - box.w) * u,
      h: box.h + (other.h - box.h) * u,
      conf: box.conf + (other.conf - box.conf) * u,
    };
  });
}

export type OccupancyStats = {
  houses: number;
  cars: number;
  people: number;
  carsPerHouse: number;
  occupied: number;
  occupancy: number;
};

export function statsFromBoxes(boxes: Box[]): OccupancyStats {
  const houses = boxes.filter((b) => b.cls === "house");
  const cars = boxes.filter((b) => b.cls === "car");
  const people = boxes.filter((b) => b.cls === "person");
  let occupied = 0;
  for (const house of houses) {
    const hx = house.x + house.w / 2;
    const hy = house.y + house.h / 2;
    const hasCar = cars.some((car) => {
      const cx = car.x + car.w / 2;
      const cy = car.y + car.h / 2;
      const dx = cx - hx;
      const dy = cy - hy;
      return dx * dx + dy * dy < 0.045;
    });
    if (hasCar) occupied += 1;
  }
  const carsPerHouse = houses.length ? cars.length / houses.length : 0;
  const occupancy = houses.length ? occupied / houses.length : 0;
  return {
    houses: houses.length,
    cars: cars.length,
    people: people.length,
    carsPerHouse,
    occupied,
    occupancy,
  };
}

const cache: Partial<Record<ZoneId, DetectionTrack>> = {};

export function trackFor(zone: ZoneId): DetectionTrack {
  cache[zone] ??= syntheticTrack(zone);
  return cache[zone]!;
}
