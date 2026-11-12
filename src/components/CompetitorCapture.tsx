"use client";

import { COMPETITOR_NOTE } from "@/lib/watch";
import type { CompetitorSite } from "@/lib/competitor";

export function CompetitorCapture({
  site,
  loading,
  onRunCapture,
}: {
  site: CompetitorSite | null;
  loading: boolean;
  onRunCapture?: () => void;
}) {
  const width = site?.width ?? 1500;
  const height = site?.height ?? 1500;
  const src = site?.src ?? null;
  const ready = Boolean(site && src);
  const name = site?.name ?? "ASDA Leyton Mills Superstore";
  const vehicles = site?.vehicles;
  const cars = site?.cars;
  const vans = site?.trucks;
  const bays = site?.bays;
  const fill = site?.fillPct == null ? null : Math.round(site.fillPct);

  if (!ready) {
    return (
      <div
        data-competitor-capture={loading ? "pending" : "empty"}
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center bg-[var(--panel)]"
      >
        <div className="font-sans text-[13px] text-[var(--ink)]">
          {loading ? "Opening ASDA Leyton Mills capture" : "No capture on disk"}
        </div>
        <div className="mt-1 max-w-sm text-center font-sans text-[11px] text-[var(--muted)]">
          {loading
            ? "Esri World Imagery, Leyton E10 5NH"
            : "Run capture to task a satellite over ASDA Leyton Mills."}
        </div>
        {onRunCapture && !loading && (
          <button
            type="button"
            onClick={onRunCapture}
            className="mt-4 bg-[var(--accent)] px-4 py-2 font-sans text-[12px] text-black"
          >
            Run capture
          </button>
        )}
      </div>
    );
  }

  const hud =
    vehicles != null && cars != null && vans != null && bays != null && fill != null
      ? `${vehicles} vehicles in the car park (${cars} cars, ${vans} vans) · ~${bays} bays · fill ${fill}%`
      : "Run capture";

  return (
    <div
      data-competitor-capture="ready"
      className="relative flex min-h-0 flex-1 flex-col bg-[var(--panel)]"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={name}
      >
        <image href={src ?? undefined} width={width} height={height} />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
        <div className="font-sans text-[11px] text-white">{hud}</div>
        <div className="mt-0.5 font-sans text-[10px] text-white/75">{COMPETITOR_NOTE}</div>
      </div>
    </div>
  );
}
