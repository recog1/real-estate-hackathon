"use client";

import type { CompetitorSite } from "@/lib/competitor";
import { ALSO_WORKS_FOR, COMPETITOR_HEADLINE } from "@/lib/watch";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--line)] px-3 py-2">
      <div className="font-sans text-[9px] text-[var(--muted)]">{label}</div>
      <div className="mt-0.5 font-sans text-xl text-[var(--ink)]">{value}</div>
    </div>
  );
}

function fmt(n: number | null, suffix = ""): string {
  return n == null ? "—" : `${n}${suffix}`;
}

export function CompetitorPanel({
  site,
  loading,
}: {
  site: CompetitorSite | null;
  loading: boolean;
}) {
  const ready = !loading && site != null;
  const fill =
    ready && site.fillPct != null ? `${Math.round(site.fillPct)}%` : "—";

  return (
    <div data-competitor-panel="1" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3">
      <div className="font-sans text-[15px] leading-snug text-[var(--ink)]">
        {COMPETITOR_HEADLINE}
      </div>
      <div className="mt-1 font-sans text-[11px] text-[var(--muted)]">
        {ready && site.name ? site.name : "London supermarket car park"}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Car count" value={ready ? fmt(site.cars) : "—"} />
        <Stat label="Bay estimate" value={ready ? fmt(site.bays) : "—"} />
        <Stat label="Fill" value={fill} />
      </div>

      <p className="mt-3 font-sans text-[11px] leading-relaxed text-[var(--muted)]">
        {ready && site.method
          ? site.method
          : ready
            ? "Vehicle detections from YOLO OBB on Esri World Imagery. Counts, bays and fill are read from detections.json when present."
            : "Capture not loaded yet. Figures appear only from detections.json."}
      </p>
      <p className="mt-1 font-sans text-[10px] text-[var(--muted)]">Imagery date unknown</p>

      <div className="mt-5 border-t border-[var(--line)] pt-3">
        <div className="font-sans text-[10px] text-[var(--muted)]">Also works for</div>
        <ul className="mt-2 space-y-2">
          {ALSO_WORKS_FOR.map((item) => (
            <li key={item.id} className="border border-[var(--line)] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-[12px] text-[var(--ink)]">{item.label}</span>
                {item.roadmap && (
                  <span className="border border-[var(--line)] px-1.5 py-0.5 font-sans text-[8px] text-[var(--muted)]">
                    Roadmap
                  </span>
                )}
              </div>
              <div className="mt-0.5 font-sans text-[10px] text-[var(--muted)]">{item.detail}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
