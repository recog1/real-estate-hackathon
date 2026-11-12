"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  "Uplink established",
  "Tasking window locked",
  "Slewing payload",
  "Acquisition",
  "Ka-band downlink",
  "VLM inference",
];

export function CommandApp() {
  const [phase, setPhase] = useState<Phase>("survey");
  const [site, setSite] = useState<Site | null>(() =>
    siteFromClick(FITZROVIA.lat, FITZROVIA.lon),
  );
  const [satId, setSatId] = useState<SatelliteId | null>(null);
  const [taskStep, setTaskStep] = useState(0);
  const [departing, setDeparting] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

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
  }

  const confirmOpen = phase === "confirm" && sat && site;
  const intel = phase === "intel" && site && sat;
  const space = phase === "orbit" || phase === "confirm" || phase === "tasking";
  const floatPanel =
    "border border-[var(--line)] bg-[var(--panel)]/92 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.45)]";

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
            onNadirLocked={() => {
              if (phaseRef.current === "orbit") setPhase("confirm");
            }}
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
          <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 border border-[var(--line)] bg-black/70 px-3 py-1 font-sans text-[11px] text-[var(--ink)]">
            Scroll, zoom, click anywhere to select a site
          </div>
        )}
        {phase === "orbit" && (
          <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 border border-[var(--line)] bg-black/70 px-3 py-1 font-sans text-[11px] text-[var(--ink)]">
            Click a satellite to task
          </div>
        )}
        {confirmOpen && sat && site && (
          <div className={`absolute right-[18.5rem] top-20 z-40 w-80 p-4 ${floatPanel}`}>
            <div className="font-sans text-[12px] text-[var(--ink)]">Task confirm</div>
            <div className="mt-1 text-lg">{sat.name}</div>
            <dl className="mt-3 space-y-1 font-sans text-[11px] text-[var(--muted)]">
              <div className="flex justify-between">
                <dt>Resolution</dt>
                <dd className="text-[var(--ink)]">{sat.resolution}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Band</dt>
                <dd className="text-[var(--ink)]">{sat.band}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Next pass</dt>
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
                <dt>Off-nadir</dt>
                <dd className="text-[var(--ink)]">
                  {pass ? `${pass.offNadirDeg.toFixed(1)}°` : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Site</dt>
                <dd className="max-w-[9rem] truncate text-[var(--ink)]">{site.name}</dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPhase("tasking")}
                className="flex-1 bg-[var(--accent)] py-2 font-sans text-[12px] text-black"
              >
                Task satellite
              </button>
              <button
                type="button"
                onClick={() => {
                  setSatId(null);
                  setPhase("orbit");
                }}
                className="px-3 font-sans text-[12px] text-[var(--muted)]"
              >
                Abort
              </button>
            </div>
          </div>
        )}
        {phase === "tasking" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45">
            <div className={`w-96 p-5 ${floatPanel}`}>
              <div className="font-sans text-[var(--ink)]">Collection in flight</div>
              <div className="mt-4 space-y-2">
                {TASK_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-3 font-sans text-[11px]">
                    <span
                      className={
                        i < taskStep
                          ? "text-[var(--ink)]"
                          : i === taskStep
                            ? "text-[var(--ink)]"
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
                  className="h-full bg-[var(--accent)] transition-all duration-500"
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

      <header className="absolute inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-4">
        <div className="flex items-center gap-3">
          <HawkMark className="h-8 w-8" />
          <div>
            <div className="font-sans text-lg leading-none text-[var(--ink)]">Asset Hawk</div>
            <div className="mt-0.5 font-sans text-[10px] text-[var(--muted)]">
              Orbital occupancy intelligence
            </div>
          </div>
        </div>
        {phase === "survey" && site && (
          <button
            type="button"
            disabled={departing}
            onClick={beginAscent}
            className="bg-[var(--accent)] px-4 py-2 font-sans text-[12px] text-black disabled:opacity-60"
          >
            {departing ? "Ascending…" : "Task satellite"}
          </button>
        )}
      </header>

      {space && (
        <aside className={`absolute bottom-3 right-3 top-16 z-30 w-[260px] overflow-y-auto ${floatPanel}`}>
          <div className="px-3 py-3 font-sans text-[12px] text-[var(--ink)]">Constellation</div>
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
                <div className="font-sans text-[10px] text-[var(--muted)]">
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
