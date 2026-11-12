"use client";

import { useEffect, useState } from "react";
import type { AerialDetection } from "@/lib/aerial";
import raw from "@/data/competitor-capture.json";

export type CompetitorSite = {
  name: string | null;
  address: string | null;
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
  vehicles: number | null;
  bays: number | null;
  fillPct: number | null;
  width: number | null;
  height: number | null;
  src: string | null;
  detections: AerialDetection[];
  method: string | null;
  note: string | null;
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
  const siteMeta =
    root.site && typeof root.site === "object" ? (root.site as Record<string, unknown>) : {};
  const summary =
    root.summary && typeof root.summary === "object"
      ? (root.summary as Record<string, unknown>)
      : {};
  const occupancy =
    image.occupancy && typeof image.occupancy === "object"
      ? (image.occupancy as Record<string, unknown>)
      : root.occupancy && typeof root.occupancy === "object"
        ? (root.occupancy as Record<string, unknown>)
        : {};
  const baysRaw = image.bays ?? root.bays ?? summary.bays;
  const bays =
    typeof baysRaw === "number"
      ? baysRaw
      : baysRaw && typeof baysRaw === "object"
        ? num((baysRaw as Record<string, unknown>).estimate)
        : null;
  const xy = coords(
    siteMeta.lat != null
      ? { lat: siteMeta.lat, lng: siteMeta.lng ?? siteMeta.lon }
      : (root.coords ?? root.center ?? image.center ?? summary),
  );
  const file =
    str(image.file_annotated) ??
    str(root.file_annotated) ??
    "annotated.jpg";
  const detections = asDetections(image.detections ?? root.detections);
  const fillPct =
    asFillPct(occupancy.fill_pct_rounded) ??
    asFillPct(occupancy.fill_pct) ??
    asFillPct(summary.fill_pct) ??
    asFillPct(root.fill) ??
    asFillPct(image.fill);
  return {
    name:
      str(siteMeta.name) ??
      str(summary.site) ??
      str(root.name) ??
      str(image.name) ??
      "ASDA Leyton Mills Superstore",
    address: str(siteMeta.address) ?? str(summary.address),
    lat: xy.lat ?? num(siteMeta.lat) ?? num(summary.lat),
    lon: xy.lon ?? num(siteMeta.lng) ?? num(summary.lng),
    bounds:
      bounds &&
      bounds.north != null &&
      bounds.south != null &&
      bounds.east != null &&
      bounds.west != null
        ? { north: bounds.north, south: bounds.south, east: bounds.east, west: bounds.west }
        : null,
    cars: num(counts.car) ?? num(summary.car) ?? num(counts.cars),
    trucks: num(counts["truck/van"]) ?? num(summary.truck_van) ?? num(counts.trucks),
    vehicles: num(counts.vehicles) ?? num(summary.vehicles) ?? num(occupancy.vehicles),
    bays: bays ?? num(summary.bays),
    fillPct,
    width: num(image.width) ?? num(root.width),
    height: num(image.height) ?? num(root.height),
    src: `/competitor/${file}`,
    detections,
    method:
      str(root.method) ??
      str(image.method) ??
      (baysRaw && typeof baysRaw === "object"
        ? str((baysRaw as Record<string, unknown>).method)
        : null),
    note: str(occupancy.definition),
  };
}

export const COMPETITOR_CAPTURE = parseCompetitor(raw);

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
  const [loading, setLoading] = useState(!COMPETITOR_CAPTURE);
  const [site, setSite] = useState<CompetitorSite | null>(COMPETITOR_CAPTURE);
  useEffect(() => {
    if (COMPETITOR_CAPTURE) return;
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
