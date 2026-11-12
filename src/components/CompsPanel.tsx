"use client";

import {
  COMPS_COMMERCIAL,
  COMPS_OCCUPANCY,
  COMPS_PRICES,
  COMPS_RENTS,
  COMPS_RESIDENTIAL,
  COMPS_RETRIEVED,
  COMPS_SITE,
} from "@/lib/comps";

function Source({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-1 inline-block font-sans text-[9px] text-[var(--muted)] underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--ink)]"
    >
      Source: {label}
    </a>
  );
}

function Calculated() {
  return (
    <span className="ml-1 border border-[var(--line)] px-1 py-px font-sans text-[8px] text-[var(--muted)]">
      calculated
    </span>
  );
}

export function CompsPanel() {
  return (
    <div data-comps-panel="1" className="space-y-4 px-1 py-1">
      <div>
        <div className="font-sans text-[13px] text-[var(--ink)]">Area data and comps</div>
        <div className="mt-0.5 font-sans text-[10px] text-[var(--muted)]">
          {COMPS_SITE} · retrieved {COMPS_RETRIEVED}
        </div>
      </div>

      <section>
        <div className="font-sans text-[11px] text-[var(--ink)]">{COMPS_PRICES.title}</div>
        <div className="font-sans text-[9px] text-[var(--muted)]">{COMPS_PRICES.context}</div>
        <dl className="mt-1.5 space-y-1">
          {COMPS_PRICES.rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2">
              <dt className="font-sans text-[10px] text-[var(--muted)]">{row.label}</dt>
              <dd className="font-sans text-[11px] text-[var(--ink)]">
                {row.value}{" "}
                <span className="text-[var(--muted)]">{row.note}</span>
              </dd>
            </div>
          ))}
        </dl>
        <Source href={COMPS_PRICES.sourceUrl} label={COMPS_PRICES.sourceLabel} />
      </section>

      <section>
        <div className="font-sans text-[11px] text-[var(--ink)]">{COMPS_RENTS.title}</div>
        <div className="font-sans text-[9px] text-[var(--muted)]">{COMPS_RENTS.context}</div>
        <dl className="mt-1.5 space-y-1">
          {COMPS_RENTS.rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2">
              <dt className="font-sans text-[10px] text-[var(--muted)]">{row.label}</dt>
              <dd className="font-sans text-[11px] text-[var(--ink)]">
                {row.value}
                {row.note ? <span className="text-[var(--muted)]"> {row.note}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
        <Source href={COMPS_RENTS.sourceUrl} label={COMPS_RENTS.sourceLabel} />
      </section>

      <section>
        <div className="font-sans text-[11px] text-[var(--ink)]">{COMPS_RESIDENTIAL.title}</div>
        <div className="font-sans text-[9px] text-[var(--muted)]">{COMPS_RESIDENTIAL.context}</div>
        <dl className="mt-1.5 space-y-1">
          {COMPS_RESIDENTIAL.rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2">
              <dt className="font-sans text-[10px] text-[var(--muted)]">{row.label}</dt>
              <dd className="text-right font-sans text-[11px] text-[var(--ink)]">
                {row.value}
                {row.calculated ? <Calculated /> : null}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-2 border border-[var(--line)] px-2 py-1.5">
          <div className="font-sans text-[9px] text-[var(--muted)]">Closest</div>
          <div className="font-sans text-[11px] text-[var(--ink)]">
            {COMPS_RESIDENTIAL.closest.address}
          </div>
          <div className="font-sans text-[10px] text-[var(--muted)]">
            {COMPS_RESIDENTIAL.closest.price} · {COMPS_RESIDENTIAL.closest.date} ·{" "}
            {COMPS_RESIDENTIAL.closest.distance}
          </div>
        </div>
        <Source href={COMPS_RESIDENTIAL.sourceUrl} label={COMPS_RESIDENTIAL.sourceLabel} />
      </section>

      <section>
        <div className="font-sans text-[11px] text-[var(--ink)]">Commercial deals nearby</div>
        <ul className="mt-1.5 space-y-1.5">
          {COMPS_COMMERCIAL.map((deal) => (
            <li key={deal.address} className="border-b border-[var(--line)] pb-1.5 last:border-0">
              <div className="font-sans text-[11px] text-[var(--ink)]">{deal.address}</div>
              <div className="font-sans text-[10px] text-[var(--muted)]">{deal.detail}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center gap-1">
          <span className="font-sans text-[11px] text-[var(--ink)]">{COMPS_OCCUPANCY.title}</span>
          {COMPS_OCCUPANCY.calculated ? <Calculated /> : null}
        </div>
        <div className="font-sans text-[9px] text-[var(--muted)]">{COMPS_OCCUPANCY.context}</div>
        <dl className="mt-1.5 space-y-1">
          {COMPS_OCCUPANCY.rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2">
              <dt className="font-sans text-[10px] text-[var(--muted)]">{row.label}</dt>
              <dd className="font-sans text-[11px] text-[var(--ink)]">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-1.5 font-sans text-[9px] text-[var(--muted)]">{COMPS_OCCUPANCY.note}</p>
        <Source href={COMPS_OCCUPANCY.sourceUrl} label={COMPS_OCCUPANCY.sourceLabel} />
      </section>

      <p className="border border-[var(--line)] px-2 py-1.5 font-sans text-[11px] text-[var(--muted)]">
        MSCI comps: pending access
      </p>
    </div>
  );
}
