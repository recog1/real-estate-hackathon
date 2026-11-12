"use client";

import { useEffect, useMemo, useState } from "react";
import { HawkMark } from "@/components/HawkMark";
import { GlobeView } from "@/components/GlobeView";
import { StreetMap } from "@/components/StreetMap";
import { IntelStage } from "@/components/IntelStage";
import { SATELLITES, getSatellite } from "@/lib/satellites";
import { FITZROVIA, siteFromClick } from "@/lib/sites";
import { formatEta, formatPassClock, nextPass } from "@/lib/orbits";
import type { Phase, SatelliteId, Site } from "@/lib/types";

declare global {
  interface Window {
    __hawkSkipToIntel?: () => void;
  }
}

const TASK_STEPS = [
  "UPLINK ESTABLISHED",
  "TASKING WINDOW LOCKED",
  "SLEWING PAYLOAD",
  "ACQUISITION",
  "KA-BAND DOWNLINK",
  "VLM INFERENCE",
];

export function CommandApp() {
  const [phase, setPhase] = useState<Phase>("survey");
  const [site, setSite] = useState<Site | null>(null);
  const [satId, setSatId] = useState<SatelliteId | null>(null);
  const [taskStep, setTaskStep] = useState(0);
  const [departing, setDeparting] = useState(false);

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
    window.__hawkSkipToIntel = () => {
      setSite(siteFromClick(FITZROVIA.lat, FITZROVIA.lon));
      setSatId("wv3");
      setDeparting(false);
      setPhase("intel");
    };
    return () => {
      delete window.__hawkSkipToIntel;
    };
  }, []);

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
    if (departing) return;
    const next = siteFromClick(lat, lon);
    setSite(next);
    setSatId(null);
    setDeparting(false);
    if (phase !== "survey") setPhase("survey");
  }

  function beginAscent() {
    if (!site || departing || phase !== "survey") return;
    setDeparting(true);
  }

  function pickSat(id: SatelliteId) {
    setSatId(id);
    setPhase("confirm");
  }

  const confirmOpen = phase === "confirm" && sat && site;
  const intel = phase === "intel" && site && sat;
  const space = phase === "orbit" || phase === "confirm" || phase === "tasking";
  const floatPanel =
    "border border-[var(--line)] bg-[var(--panel)]/82 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.45)]";

  return (
    <div
      data-phase={phase}
      data-departing={departing ? "1" : "0"}
      data-site={site?.id ?? ""}
      data-space={space ? "1" : "0"}
      className="relative h-dvh w-dvw overflow-hidden bg-[var(--bg)] text-[var(--ink)]"
    >
      <div
        data-stage="viewport"
        className="absolute inset-0 z-0 h-dvh w-dvw"
        style={{ width: "100vw", height: "100vh" }}
      >
        {site && (
          <GlobeView
            phase={phase}
            site={site}
            selectedSat={satId}
            onPickSite={pickSite}
            onPickSatellite={pickSat}
          />
        )}
        <div
          data-map-layer={phase === "survey" ? "street" : "globe"}
          className={
            phase === "survey"
              ? "absolute inset-0 z-10 h-full w-full opacity-100 transition-opacity duration-1000"
              : "pointer-events-none absolute inset-0 z-10 h-full w-full opacity-0 transition-opacity duration-1000"
          }
        >
          <StreetMap
            site={site}
            departing={departing}
            followSite={phase === "survey"}
            onPickSite={pickSite}
            onDeparted={() => {
              setDeparting(false);
              setPhase("orbit");
            }}
          />
        </div>
        {phase === "survey" && !site && (
          <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 border border-[var(--accent)]/40 bg-black/60 px-3 py-1 font-sans text-[10px] tracking-[0.18em] text-[var(--accent)]">
            SCROLL · ZOOM · CLICK ANYWHERE TO SELECT A SITE
          </div>
        )}
        {phase === "survey" && site && (
          <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2">
            <button
              type="button"
              disabled={departing}
              onClick={beginAscent}
              className="bg-[var(--accent)] px-4 py-2 font-sans text-[11px] tracking-[0.18em] text-black shadow-[0_8px_24px_rgba(0,0,0,0.45)] disabled:opacity-60"
            >
              {departing ? "ASCENDING…" : "TASK SATELLITE"}
            </button>
          </div>
        )}
        {phase === "orbit" && (
          <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 border border-[var(--cyan)]/40 bg-black/55 px-3 py-1 font-sans text-[10px] tracking-[0.18em] text-[var(--cyan)]">
            DRAG TO ORBIT · CLICK A SATELLITE TO TASK
          </div>
        )}
        {confirmOpen && sat && site && (
          <div className={`absolute right-[18.5rem] top-20 z-40 w-80 p-4 ${floatPanel} border-[var(--accent)]`}>
            <div className="font-sans text-[11px] tracking-[0.22em] text-[var(--accent)]">
              TASK CONFIRM
            </div>
            <div className="mt-1 text-lg">{sat.name}</div>
            <dl className="mt-3 space-y-1 font-sans text-[11px] text-[var(--muted)]">
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
                className="flex-1 bg-[var(--accent)] py-2 font-sans text-[12px] tracking-[0.2em] text-black"
              >
                TASK SATELLITE
              </button>
              <button
                type="button"
                onClick={() => {
                  setSatId(null);
                  setPhase("orbit");
                }}
                className="px-3 font-sans text-[10px] text-[var(--muted)]"
              >
                ABORT
              </button>
            </div>
          </div>
        )}
        {phase === "tasking" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45">
            <div className={`w-96 p-5 ${floatPanel} border-[var(--cyan)]`}>
              <div className="font-sans tracking-[0.22em] text-[var(--cyan)]">
                COLLECTION IN FLIGHT
              </div>
              <div className="mt-4 space-y-2">
                {TASK_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-3 font-sans text-[11px]">
                    <span
                      className={
                        i < taskStep
                          ? "text-[var(--accent)]"
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

      {intel && site && sat && (
        <div className="absolute inset-0 z-20 flex flex-col bg-[var(--bg)] pt-14">
          <IntelStage site={site} sat={sat} />
        </div>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3">
        <div className={`pointer-events-auto flex items-center justify-between px-4 py-2 ${floatPanel}`}>
          <div className="flex items-center gap-3">
            <HawkMark className="h-8 w-8" />
            <div>
              <div className="font-sans text-xl leading-none tracking-[0.18em] text-[var(--accent)]">
                ASSET HAWK
              </div>
              <div className="font-sans text-[10px] tracking-[0.22em] text-[var(--muted)]">
                ORBITAL OCCUPANCY INTELLIGENCE
              </div>
            </div>
          </div>
        </div>
      </header>

      {space && (
        <aside className={`absolute bottom-3 right-3 top-16 z-30 w-[260px] overflow-y-auto ${floatPanel}`}>
          <div className="px-3 py-3 font-sans text-[11px] tracking-[0.22em] text-[var(--accent)]">
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
                  <div className="font-sans text-[10px] text-[var(--muted)]">
                    {s.resolution} · {s.operator}
                  </div>
                </div>
                <div className="font-sans text-[10px] text-[var(--cyan)]">
                  {p ? formatEta(p.time) : "—"}
                </div>
              </button>
            );
          })}
        </aside>
      )}
    </div>
  );
}
