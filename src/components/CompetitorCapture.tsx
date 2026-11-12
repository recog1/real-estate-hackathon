"use client";

import { DetectionMark } from "@/components/AerialGrid";
import { AERIAL_ATTRIBUTION } from "@/lib/aerial";
import type { CompetitorSite } from "@/lib/competitor";

export function CompetitorCapture({
  site,
  loading,
}: {
  site: CompetitorSite | null;
  loading: boolean;
}) {
  const width = site?.width ?? null;
  const height = site?.height ?? null;
  const src = site?.src ?? null;
  const ready = !loading && site != null && width != null && height != null && src != null;
  const n = site?.detections.length ?? 0;

  if (!ready || !site || width == null || height == null || src == null) {
    return (
      <div
        data-competitor-capture="loading"
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center bg-black"
      >
        <div className="font-sans text-[12px] text-[var(--ink)]">Loading capture</div>
        <div className="mt-1 font-sans text-[10px] text-[var(--muted)]">
          Waiting for supermarket still
        </div>
      </div>
    );
  }

  const detections = site.detections;
  const name = site.name;

  return (
    <div
      data-competitor-capture="ready"
      className="relative flex min-h-0 flex-1 flex-col bg-black"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={name ?? "Competitor capture"}
      >
        <image href={src} width={width} height={height} />
        {detections.map((d, i) => (
          <DetectionMark
            key={`${d.label}-${d.bbox.join(",")}-${d.score}-${i}`}
            d={d}
            width={width}
            height={height}
            delayMs={n > 1 ? (i / (n - 1)) * 800 : 0}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-1.5">
        <div className="font-sans text-[10px] text-white/70">
          {AERIAL_ATTRIBUTION} · Imagery date unknown
        </div>
      </div>
    </div>
  );
}
