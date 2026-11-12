"use client";

import { useEffect, useState } from "react";
import {
  V7_DOCS,
  V7_SUMMARY,
  V7_WORKFLOW_NAME,
  V7_WORKFLOW_URL,
} from "@/lib/v7";

const PIPELINE = [
  "5 PDFs",
  "V7 Go extraction",
  "Discrepancy Flag",
  "Underwriting Finding",
] as const;

function V7Mark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "px-1 py-px text-[9px]" : "px-1.5 py-0.5 text-[10px]";
  const go = size === "sm" ? "text-[9px]" : "text-[10px]";
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`bg-[#5B4BFF] font-sans font-semibold tracking-[0.16em] text-white ${box}`}
      >
        V7
      </span>
      <span className={`font-sans tracking-[0.18em] text-[#c8c4ff] ${go}`}>GO</span>
    </span>
  );
}

function pct(n: number | null) {
  return n == null ? "—" : `${n}%`;
}

export function V7WorkflowPanel() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setStep(0);
    setDone(false);
    let i = 0;
    const iv = window.setInterval(() => {
      i += 1;
      if (i >= PIPELINE.length) {
        window.clearInterval(iv);
        setStep(PIPELINE.length);
        setDone(true);
        return;
      }
      setStep(i);
    }, 480);
    return () => window.clearInterval(iv);
  }, []);

  return (
    <div data-v7-panel="1" data-v7-state={done ? "done" : "running"} className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <V7Mark />
            <span className="font-sans text-[10px] tracking-[0.18em] text-[#9d95ff]">
              WORKFLOW
            </span>
          </div>
          <div className="mt-1 text-[13px] leading-snug text-[var(--ink)]">
            {V7_WORKFLOW_NAME}
          </div>
        </div>
        <a
          href={V7_WORKFLOW_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 bg-[#5B4BFF] px-2.5 py-1.5 font-sans text-[10px] tracking-[0.14em] text-white hover:bg-[#6d5dff]"
        >
          OPEN IN V7 GO
        </a>
      </div>

      <div className="border border-[#5B4BFF]/35 bg-[#12101f] px-2 py-2">
        <div className="mb-2 font-sans text-[9px] tracking-[0.16em] text-[#9d95ff]">
          {done ? "PIPELINE COMPLETE" : "RUNNING EXTRACTION…"}
        </div>
        <div className="flex items-stretch gap-1">
          {PIPELINE.map((label, i) => {
            const active = !done && i === step;
            const complete = done || i < step;
            return (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-1">
                <div
                  className={
                    active
                      ? "min-w-0 flex-1 border border-[#5B4BFF] bg-[#5B4BFF]/20 px-1 py-1.5 text-center font-sans text-[8px] leading-tight tracking-[0.08em] text-[#c8c4ff]"
                      : complete
                        ? "min-w-0 flex-1 border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-1 py-1.5 text-center font-sans text-[8px] leading-tight tracking-[0.08em] text-[var(--gold)]"
                        : "min-w-0 flex-1 border border-[var(--line)] px-1 py-1.5 text-center font-sans text-[8px] leading-tight tracking-[0.08em] text-[var(--muted)]"
                  }
                >
                  {active && (
                    <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#5B4BFF]" />
                  )}
                  {label}
                </div>
                {i < PIPELINE.length - 1 && (
                  <span className="shrink-0 font-sans text-[9px] text-[var(--muted)]">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        data-v7-discrepancy="1"
        className="relative border border-[var(--danger)]/40 bg-[var(--panel-2)] px-3 py-2.5"
      >
        <div className="absolute right-2 top-2">
          <span className="inline-flex items-center gap-1 border border-[#5B4BFF]/40 bg-[#5B4BFF]/10 px-1.5 py-0.5 font-sans text-[8px] tracking-[0.14em] text-[#c8c4ff]">
            <V7Mark size="sm" />
            POWERED BY V7 GO
          </span>
        </div>
        <div className="font-sans text-[9px] tracking-[0.16em] text-[var(--muted)]">
          OCCUPANCY DISCREPANCY
        </div>
        <div className="mt-1 flex items-baseline gap-2 pr-24">
          <span className="font-sans text-2xl text-[var(--ink)]">
            {V7_SUMMARY.seller_claimed_occupancy_pct}%
          </span>
          <span className="font-sans text-[11px] text-[var(--muted)]">claimed</span>
          <span className="text-[var(--muted)]">→</span>
          <span className="font-sans text-2xl text-[var(--danger)]">
            {V7_SUMMARY.observed_occupancy_pct}%
          </span>
          <span className="font-sans text-[11px] text-[var(--muted)]">observed</span>
        </div>
        <div className="mt-1.5 inline-block border border-[var(--danger)]/50 bg-[var(--danger)]/15 px-1.5 py-0.5 font-sans text-[9px] tracking-[0.12em] text-[var(--danger)]">
          {V7_SUMMARY.flag} · {Math.abs(V7_SUMMARY.gap_pts)} PT
        </div>
      </div>

      <div className={done ? "opacity-100 transition-opacity duration-500" : "opacity-40"}>
        <div className="mb-1 font-sans text-[9px] tracking-[0.16em] text-[var(--muted)]">
          PER-DOCUMENT EXTRACTION
        </div>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--line)] font-sans text-[8px] tracking-[0.12em] text-[var(--muted)]">
              <th className="py-1 font-normal">DOC</th>
              <th className="whitespace-nowrap py-1 font-normal">CLAIMED %</th>
              <th className="whitespace-nowrap py-1 font-normal">OBSERVED %</th>
              <th className="whitespace-nowrap py-1 font-normal">FLAG</th>
            </tr>
          </thead>
          <tbody>
            {V7_DOCS.map((row) => {
              const over = row.discrepancy_flag === "Material overstatement";
              return (
                <tr key={row.file} className="border-b border-[var(--line)]/80">
                  <td className="py-1.5 pr-1 text-[10px] leading-tight">{row.document_type}</td>
                  <td className="py-1.5 font-sans text-[10px]">{pct(row.seller_claimed_occupancy_pct)}</td>
                  <td className="py-1.5 font-sans text-[10px]">{pct(row.observed_occupancy_pct)}</td>
                  <td className="py-1.5">
                    <span
                      className={
                        over
                          ? "inline-block whitespace-nowrap border border-[var(--danger)]/50 bg-[var(--danger)]/15 px-1 py-0.5 font-sans text-[8px] tracking-[0.08em] text-[var(--danger)]"
                          : "inline-block whitespace-nowrap border border-[var(--line)] px-1 py-0.5 font-sans text-[8px] tracking-[0.08em] text-[var(--muted)]"
                      }
                    >
                      {row.discrepancy_flag}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function V7SourceChip({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      data-v7-source-chip="1"
      onClick={onOpen}
      className="mt-1 inline-flex items-center gap-1 border border-[#5B4BFF]/50 bg-[#5B4BFF]/10 px-1.5 py-0.5 font-sans text-[9px] tracking-[0.12em] text-[#c8c4ff] hover:border-[#5B4BFF] hover:text-white"
    >
      <span className="bg-[#5B4BFF] px-1 py-px text-[8px] font-semibold tracking-[0.14em] text-white">
        V7
      </span>
      Source: V7 Go workflow
    </button>
  );
}
