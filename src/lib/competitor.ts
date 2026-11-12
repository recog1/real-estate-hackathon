"use client";

import { useEffect, useState } from "react";
import type { AerialDetection } from "@/lib/aerial";

export type CompetitorSite = {
  name: string | null;
  lat: number | null;
  lon: number | null;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  cars: number | null;
  trucks: number | null;
  bays: number | null;
  fillPct: number | null;
  width: number | null;
  height: number | null;
  src: string | null;
  detections: AerialDetection[];
  method: string | null;
};

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asFillPct(v: unknown): number | null {
  const n = num(v);
  if (n == null) return null;
  return n <= 1 ? n * 100 : n;
}

function asDetections(raw: unknown): AerialDetection[] {
  if (!Array.isArray(raw)) return [];
  const out: AerialDetection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const d = item as Record<string, unknown>;
    const bbox = Array.isArray(d.bbox) ? d.bbox.map(Number) : [];
    const bbox_norm = Array.isArray(d.bbox_norm) ? d.bbox_norm.map(Number) : [];
    if (bbox_norm.length < 4 && bbox.length < 4) continue;
    const polygon = Array.isArray(d.polygon)
      ? (d.polygon as unknown[]).filter(
          (pt): pt is number[] => Array.isArray(pt) && pt.length >= 2,
        )
      : undefined;
    out.push({
      label: str(d.label) ?? "car",
      score: num(d.score) ?? 0,
      bbox,
      bbox_norm:
        bbox_norm.length >= 4
          ? bbox_norm
          : [0, 0, 0, 0],
      polygon,
      source: str(d.source) ?? "yolo",
    });
  }
  return out;
}

function coords(raw: unknown): { lat: number | null; lon: number | null } {
  if (Array.isArray(raw) && raw.length >= 2) {
    return { lat: num(raw[0]), lon: num(raw[1]) };
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return { lat: num(o.lat) ?? num(o.latitude), lon: num(o.lon) ?? num(o.lng) ?? num(o.longitude) };
  }
  return { lat: null, lon: null };
}

export function parseCompetitor(raw: unknown): CompetitorSite | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const image =
    Array.isArray(root.images) && root.images[0] && typeof root.images[0] === "object"
      ? (root.images[0] as Record<string, unknown>)
      : root;
  const counts =
    image.counts && typeof image.counts === "object"
      ? (image.counts as Record<string, unknown>)
      : root.counts && typeof root.counts === "object"
        ? (root.counts as Record<string, unknown>)
        : {};
  const boundsRaw = image.bounds ?? root.bounds;
  const bounds =
    boundsRaw && typeof boundsRaw === "object"
      ? {
          north: num((boundsRaw as Record<string, unknown>).north),
          south: num((boundsRaw as Record<string, unknown>).south),
          east: num((boundsRaw as Record<string, unknown>).east),
          west: num((boundsRaw as Record<string, unknown>).west),
        }
      : null;
  const xy = coords(root.coords ?? root.center ?? image.center);
  const file =
    str(image.file_bw) ??
    str(root.file_bw) ??
    str(image.file) ??
    str(root.file) ??
    "supermarket-bw.jpg";
  const detections = asDetections(image.detections ?? root.detections);
  return {
    name: str(root.name) ?? str(image.name) ?? str(image.label),
    lat: xy.lat,
    lon: xy.lon,
    bounds:
      bounds &&
      bounds.north != null &&
      bounds.south != null &&
      bounds.east != null &&
      bounds.west != null
        ? { north: bounds.north, south: bounds.south, east: bounds.east, west: bounds.west }
        : null,
    cars: num(counts.car) ?? num(counts.cars),
    trucks: num(counts["truck/van"]) ?? num(counts.trucks),
    bays: num(root.bays) ?? num(image.bays) ?? num(counts.bays),
    fillPct: asFillPct(root.fill) ?? asFillPct(image.fill) ?? asFillPct(root.fill_pct),
    width: num(image.width) ?? num(root.width),
    height: num(image.height) ?? num(root.height),
    src: `/competitor/${file}`,
    detections,
    method: str(root.method) ?? str(image.method),
  };
}

export async function fetchCompetitorSite(): Promise<CompetitorSite | null> {
  try {
    const res = await fetch("/competitor/detections.json", { cache: "no-store" });
    if (!res.ok) return null;
    return parseCompetitor(await res.json());
  } catch {
    return null;
  }
}

export function useCompetitorSite() {
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<CompetitorSite | null>(null);
  useEffect(() => {
    let live = true;
    void fetchCompetitorSite().then((data) => {
      if (!live) return;
      setSite(data);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);
  return { loading, site };
}
