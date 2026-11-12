"use client";

import { V7WorkflowPanel } from "@/components/V7WorkflowPanel";
import type { CompetitorSite } from "@/lib/competitor";
import {
  BAYS_ESTIMATE,
  COMPETITOR_DOCS,
  COMPETITOR_VERDICT,
  OBSERVED_UTIL_PCT,
  OBSERVED_VEHICLES,
  REPORTED_UTIL_PCT,
  REPORTED_VEHICLES,
} from "@/lib/competitor-claim";
import { COMPETITOR_HEADLINE, COMPETITOR_NOTE, COMPETITOR_SUBHEAD } from "@/lib/watch";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--line)] px-3 py-2">
      <div className="font-sans text-[9px] text-[var(--muted)]">{label}</div>
      <div className="mt-0.5 font-sans text-xl text-[var(--ink)]">{value}</div>
    </div>
  );
}

export function CompetitorPanel({
  site,
  loading,
}: {
  site: CompetitorSite | null;
  loading: boolean;
}) {
  const ready = !loading && site != null;
  const observed =
    ready && site.fillPct != null ? `${Math.round(site.fillPct)}%` : `${OBSERVED_UTIL_PCT}%`;
  const vehicles = ready && site.vehicles != null ? site.vehicles : OBSERVED_VEHICLES;
  const bays = ready && site.bays != null ? site.bays : BAYS_ESTIMATE;
  const mix =
    ready && site.cars != null && site.trucks != null
      ? `${site.cars} cars, ${site.trucks} vans`
      : "154 cars, 13 vans";

  return (
    <div data-competitor-panel="1" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3">
      <div className="font-sans text-[15px] leading-snug text-[var(--ink)]">
        {COMPETITOR_HEADLINE}
      </div>
      <div className="mt-1 font-sans text-[11px] text-[var(--muted)]">{COMPETITOR_SUBHEAD}</div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Reported" value={`${REPORTED_UTIL_PCT}%`} />
        <Stat label="Observed" value={observed} />
        <Stat label="Bays" value={`~${bays}`} />
      </div>

      <p className="mt-3 font-sans text-[11px] leading-relaxed text-[var(--ink)]">
        Documents: ~{REPORTED_VEHICLES} cars at midday ({REPORTED_UTIL_PCT}%). Satellite: {vehicles}{" "}
        vehicles ({mix}) / ~{bays} bays.
      </p>
      <p className="mt-2 border border-[var(--danger)]/50 bg-[var(--danger)]/15 px-2 py-1.5 font-sans text-[11px] leading-relaxed text-[var(--danger)]">
        {COMPETITOR_VERDICT}
      </p>
      <p className="mt-2 font-sans text-[10px] leading-relaxed text-[var(--muted)]">
        {COMPETITOR_NOTE}
      </p>

      <div className="mt-4 border-t border-[var(--line)] pt-3">
        <div className="mb-2 font-sans text-[10px] text-[var(--muted)]">Documents</div>
        <ul className="space-y-1.5">
          {COMPETITOR_DOCS.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 border border-[var(--line)] px-2.5 py-1.5"
            >
              <span className="font-sans text-[11px] text-[var(--ink)]">{doc.title}</span>
              {doc.available ? (
                <a
                  href={doc.file}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 font-sans text-[10px] text-[var(--ink)] underline"
                >
                  Open
                </a>
              ) : (
                <span className="shrink-0 font-sans text-[9px] text-[var(--muted)]">{doc.tag}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 border-t border-[var(--line)] pt-3">
        <V7WorkflowPanel />
      </div>
    </div>
  );
}
