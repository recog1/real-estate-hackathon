"use client";

import { useEffect, useMemo, useState } from "react";
import { HawkMark } from "@/components/HawkMark";
import { GlobeView } from "@/components/GlobeView";
import { IntelStage } from "@/components/IntelStage";
import { SATELLITES, getSatellite } from "@/lib/satellites";
import { SAMPLE_PARCELS, siteFromClick } from "@/lib/sites";
import { formatEta, formatPassClock, nextPass } from "@/lib/orbits";
import type { Phase, SatelliteId, Site } from "@/lib/types";

const TASK_STEPS = [
  "UPLINK ESTABLISHED",
  "TASKING WINDOW LOCKED",
  "SLEWING PAYLOAD",
  "ACQUISITION",
  "KA-BAND DOWNLINK",
  "VLM INFERENCE",
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--ink)]">
      {now.toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z")}
    </span>
  );
}

export function CommandApp() {
  const [phase, setPhase] = useState<Phase>("survey");
  const [site, setSite] = useState<Site | null>(null);
  const [satId, setSatId] = useState<SatelliteId | null>(null);
  const [taskStep, setTaskStep] = useState(0);

  const sat = satId ? getSatellite(satId) : null;
  const pass = useMemo(() => {
    if (!site || !sat) return null;
    return nextPass(sat, site.lat, site.lon);
  }, [site, sat]);
  const catalogPasses = useMemo(() => {
    if (!site) return {} as Record<string, ReturnType<typeof nextPass>>;
    const out: Record<string, ReturnType<typeof nextPass>> = {};
    for (const s of SATELLITES) out[s.id] = nextPass(s, site.lat, site.lon);
    return out;
  }, [site]);

  useEffect(() => {
    if (phase !== "tasking") return;
    setTaskStep(0);
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setTaskStep(i);
      if (i >= TASK_STEPS.length) {
        clearInterval(iv);
        setPhase("intel");
      }
    }, 700);
    return () => clearInterval(iv);
  }, [phase]);

  function pickSite(lat: number, lon: number) {
    const next = siteFromClick(lat, lon);
    setSite(next);
    setSatId(null);
    setPhase("orbit");
  }

  function pickSat(id: SatelliteId) {
    setSatId(id);
    setPhase("confirm");
  }

  const confirmOpen = phase === "confirm" && sat && site;
  const intel = phase === "intel" && site && sat;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg)] text-[var(--ink)]">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-4 py-2">
        <div className="flex items-center gap-3">
          <HawkMark className="h-8 w-8" />
          <div>
            <div className="font-display text-xl leading-none tracking-[0.18em] text-[var(--gold)]">
              ASSET HAWK
            </div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--muted)]">
              ORBITAL OCCUPANCY INTELLIGENCE
            </div>
          </div>
        </div>
        <div className="hidden max-w-xl text-center text-[11px] leading-snug text-[var(--muted)] md:block">
          Occupancy underpins value. If you cannot fill it, what is it worth?
          Underwrite from orbit before you ask the seller for a single document.
        </div>
        <div className="flex items-center gap-4">
          <Clock />
          <span className="font-mono text-[11px] text-[var(--gold)]">LONDON</span>
        </div>
      </header>
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-4 py-1 font-mono text-[10px] tracking-[0.2em] text-[var(--muted)]">
        <span>CLASSIFICATION // DEMO · UNCLASSIFIED</span>
        <span>
          LAYER {phase === "survey" ? "01 MAP" : phase === "intel" ? "03 COLLECTION" : "02 SPACE"}
        </span>
        <span>CLICK LAND TO TASK · NO KEYS REQUIRED</span>
      </div>

      <div className="flex min-h-0 flex-1">
        {phase !== "intel" && (
          <aside className="flex w-[280px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel)]">
            <div className="border-b border-[var(--line)] px-3 py-3">
              <div className="font-display text-[11px] tracking-[0.22em] text-[var(--gold)]">
                BRIEF
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink)]">
                Sellers claim occupancy. Asset Hawk counts cars outside a
                multifamily from orbit and estimates true occupancy — so you
                underwrite the deal independently.
              </p>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-[var(--muted)]">
                Pan and zoom London. Click any land parcel. Camera flies to
                space. Task a VHR bird. Four tiles land in the data room.
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              <div className="mb-2 font-display text-[11px] tracking-[0.22em] text-[var(--muted)]">
                SAMPLE ASSETS
              </div>
              {SAMPLE_PARCELS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickSite(p.lat, p.lon)}
                  className="mb-1 w-full border border-transparent px-2 py-1.5 text-left hover:border-[var(--line)] hover:bg-[var(--panel-2)]"
                >
                  <div className="text-xs">{p.name}</div>
                  <div className="font-mono text-[10px] text-[var(--muted)]">
                    {p.borough} · {p.units}u · seller {Math.round(p.sellerOccupancy * 100)}%
                  </div>
                </button>
              ))}
            </div>
            {site && (
              <div className="border-t border-[var(--line)] px-3 py-3">
                <div className="font-display text-[11px] tracking-[0.22em] text-[var(--gold)]">
                  SELECTED
                </div>
                <div className="mt-1 text-sm">{site.name}</div>
                <div className="font-mono text-[10px] text-[var(--muted)]">
                  {site.lat.toFixed(4)}N {site.lon.toFixed(4)}E
                  <br />
                  {site.units} units · claimed {Math.round(site.sellerOccupancy * 100)}% ·{" "}
                  {site.claimedRentRoll}
                </div>
              </div>
            )}
          </aside>
        )}

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className={intel ? "relative h-[32%] min-h-[180px] shrink-0" : "relative min-h-0 flex-1"}>
            <GlobeView
              phase={phase}
              site={site}
              selectedSat={satId}
              onPickSite={pickSite}
              onPickSatellite={pickSat}
            />
            {phase === "survey" && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 border border-[var(--gold)]/40 bg-black/60 px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-[var(--gold)]">
                SCROLL · ZOOM · CLICK ANY LAND PARCEL
              </div>
            )}
            {phase === "orbit" && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 border border-[var(--cyan)]/40 bg-black/60 px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-[var(--cyan)]">
                DRAG TO ORBIT · CLICK A SATELLITE TO TASK
              </div>
            )}
            {confirmOpen && sat && site && (
              <div className="absolute right-4 top-4 w-80 border border-[var(--gold)] bg-[var(--panel)]/95 p-4 shadow-[0_0_40px_rgba(212,160,74,0.12)]">
                <div className="font-display text-[11px] tracking-[0.22em] text-[var(--gold)]">
                  TASK CONFIRM
                </div>
                <div className="mt-1 text-lg">{sat.name}</div>
                <dl className="mt-3 space-y-1 font-mono text-[11px] text-[var(--muted)]">
                  <div className="flex justify-between">
                    <dt>RESOLUTION</dt>
                    <dd className="text-[var(--ink)]">{sat.resolution}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>BAND</dt>
                    <dd className="text-[var(--ink)]">{sat.band}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>NEXT PASS</dt>
                    <dd className="text-[var(--ink)]">
                      {pass ? formatEta(pass.time) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>UTC</dt>
                    <dd className="text-[var(--ink)]">
                      {pass ? formatPassClock(pass.time) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>OFF-NADIR</dt>
                    <dd className="text-[var(--ink)]">
                      {pass ? `${pass.offNadirDeg.toFixed(1)}°` : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>SITE</dt>
                    <dd className="max-w-[9rem] truncate text-[var(--ink)]">{site.name}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhase("tasking")}
                    className="flex-1 bg-[var(--gold)] py-2 font-display text-[12px] tracking-[0.2em] text-black"
                  >
                    TASK SATELLITE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSatId(null);
                      setPhase("orbit");
                    }}
                    className="px-3 font-mono text-[10px] text-[var(--muted)]"
                  >
                    ABORT
                  </button>
                </div>
              </div>
            )}
            {phase === "tasking" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                <div className="w-96 border border-[var(--cyan)] bg-[var(--panel)] p-5">
                  <div className="font-display tracking-[0.22em] text-[var(--cyan)]">
                    COLLECTION IN FLIGHT
                  </div>
                  <div className="mt-4 space-y-2">
                    {TASK_STEPS.map((s, i) => (
                      <div key={s} className="flex items-center gap-3 font-mono text-[11px]">
                        <span
                          className={
                            i < taskStep
                              ? "text-[var(--gold)]"
                              : i === taskStep
                                ? "text-[var(--cyan)]"
                                : "text-[var(--muted)]"
                          }
                        >
                          {i < taskStep ? "■" : i === taskStep ? "▸" : "□"}
                        </span>
                        <span className={i <= taskStep ? "text-[var(--ink)]" : "text-[var(--muted)]"}>
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-1 bg-[var(--line)]">
                    <div
                      className="h-full bg-[var(--cyan)] transition-all duration-500"
                      style={{ width: `${(taskStep / TASK_STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          {intel && site && sat && <IntelStage site={site} sat={sat} />}
        </div>

        {phase !== "survey" && phase !== "intel" && (
          <aside className="w-[260px] shrink-0 overflow-y-auto border-l border-[var(--line)] bg-[var(--panel)]">
            <div className="px-3 py-3 font-display text-[11px] tracking-[0.22em] text-[var(--gold)]">
              CONSTELLATION
            </div>
            {SATELLITES.map((s) => {
              const p = catalogPasses[s.id] ?? null;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickSat(s.id)}
                  className="flex w-full items-start justify-between border-b border-[var(--line)] px-3 py-2 text-left hover:bg-[var(--panel-2)]"
                >
                  <div>
                    <div className="text-xs">{s.name}</div>
                    <div className="font-mono text-[10px] text-[var(--muted)]">
                      {s.resolution} · {s.operator}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-[var(--cyan)]">
                    {p ? formatEta(p.time) : "—"}
                  </div>
                </button>
              );
            })}
          </aside>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-[var(--line)] px-4 py-1 font-mono text-[10px] tracking-[0.14em] text-[var(--muted)]">
        <span>ASSET HAWK · Grok Bot Real Estate Hackathon London</span>
        <span>Esri World Dark Gray · TLE SGP4 · no Ion token</span>
        {site ? (
          <span>
            {site.lat.toFixed(5)}N {site.lon.toFixed(5)}E
          </span>
        ) : (
          <span>51.5074N 0.1276W</span>
        )}
      </footer>
    </div>
  );
}
