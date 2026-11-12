"use client";

import { aerialTotals } from "@/lib/aerial";
import { useCompetitorSite } from "@/lib/competitor";
import { V7_SUMMARY, V7_WORKFLOW_NAME, V7_WORKFLOW_URL } from "@/lib/v7";
import type { Phase } from "@/lib/types";
import type { WatchMode } from "@/lib/watch";

type Step = {
  id: string;
  n: string;
  title: string;
  tool: string;
  output: string;
  href?: string;
  flag?: boolean;
  span?: 1 | 2;
};

function activeIndex(phase: Phase): number {
  if (phase === "intel") return 5;
  if (phase === "orbit" || phase === "confirm" || phase === "tasking") return 2;
  return 2;
}

function competitorActive(phase: Phase): number {
  if (phase === "intel") return 4;
  if (phase === "orbit" || phase === "confirm" || phase === "tasking") return 2;
  return 0;
}

export function PipelineStrip({ mode, phase }: { mode: WatchMode; phase: Phase }) {
  const totals = aerialTotals();
  const competitor = useCompetitorSite();
  const fill =
    competitor.site?.fillPct != null ? `${Math.round(competitor.site.fillPct)}%` : "—";
  const cars = competitor.site?.cars != null ? String(competitor.site.cars) : "—";

  const steps: Step[] =
    mode === "competitor"
      ? [
          {
            id: "target",
            n: "1–2",
            title: "Target selection",
            tool: "Map click",
            output: "Watch an asset you do not own",
            span: 2,
          },
          {
            id: "sat",
            n: "3",
            title: "Satellite tasking + Esri imagery",
            tool: "WorldView-3 · Esri",
            output: "Nadir still",
          },
          {
            id: "vision",
            n: "4",
            title: "Vision detections",
            tool: "YOLO OBB",
            output: `Cars ${cars}, vans, buildings`,
          },
          {
            id: "comps",
            n: "5",
            title: "Comps and area data",
            tool: "Peers",
            output: "Capacity from marked bays",
          },
          {
            id: "verdict",
            n: "6",
            title: "Fill % vs capacity",
            tool: "Verdict",
            output: competitor.site ? `Fill ${fill}` : "From detections.json",
          },
        ]
      : [
          {
            id: "docs",
            n: "1",
            title: "Data room PDFs",
            tool: "Rent roll, OM",
            output: "5 documents",
          },
          {
            id: "v7",
            n: "2",
            title: "V7 Go workflow",
            tool: "Document-AI orchestration",
            output: `${V7_WORKFLOW_NAME} · extracted ${V7_SUMMARY.seller_claimed_occupancy_pct}% from the rent roll`,
            href: V7_WORKFLOW_URL,
          },
          {
            id: "sat",
            n: "3",
            title: "Satellite tasking + Esri imagery",
            tool: "WorldView-3 · Esri",
            output: "Nadir still",
          },
          {
            id: "vision",
            n: "4",
            title: "Vision detections",
            tool: "YOLO OBB",
            output: `Cars ${totals.cars}, vans ${totals.trucks}, buildings ${totals.buildings}`,
          },
          {
            id: "comps",
            n: "5",
            title: "Comps and area data",
            tool: "Area / peers",
            output: "London plot, 142 units",
          },
          {
            id: "verdict",
            n: "6",
            title: "Verdict",
            tool: "Claimed vs observed",
            output: `${V7_SUMMARY.seller_claimed_occupancy_pct}% vs ${V7_SUMMARY.observed_occupancy_pct}%`,
            flag: true,
          },
        ];

  const current = mode === "competitor" ? competitorActive(phase) : activeIndex(phase);

  return (
    <div
      data-pipeline="1"
      data-pipeline-mode={mode}
      className="pipeline-strip flex h-[4.35rem] items-stretch gap-2.5 px-3 py-1.5"
    >
      <div className="flex w-28 shrink-0 flex-col justify-center">
        <div className="font-sans text-[10px] text-[var(--ink)]">How it works</div>
        <div className="font-sans text-[8px] text-[var(--muted)]">
          {mode === "claim" ? "V7 Go orchestrates the documents" : "Same stack, different question"}
        </div>
      </div>
      <ol className="m-0 flex min-w-0 flex-1 list-none flex-row gap-1 p-0">
        {steps.map((step, i) => {
          const lit = i <= current;
          const active = i === current;
          const wide = step.span === 2 ? " min-w-0 flex-[2]" : " min-w-0 flex-1";
          return (
            <li
              key={step.id}
              data-pipeline-step={step.id}
              data-lit={lit ? "1" : "0"}
              data-active={active ? "1" : "0"}
              className={`pipeline-step overflow-hidden${wide}${lit ? " is-lit" : ""}${active ? " is-active" : ""}`}
            >
              <div className="flex items-baseline gap-1">
                <span className="font-sans text-[9px] text-[var(--muted)]">{step.n}</span>
                {step.href ? (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-sans text-[10px] text-[var(--ink)] underline decoration-[var(--line)] underline-offset-2"
                  >
                    {step.title}
                  </a>
                ) : (
                  <span className="truncate font-sans text-[10px] text-[var(--ink)]">
                    {step.title}
                  </span>
                )}
              </div>
              <div className="truncate font-sans text-[8px] text-[var(--muted)]">{step.tool}</div>
              <div
                className={
                  step.flag
                    ? "truncate font-sans text-[9px] text-[var(--danger)]"
                    : "truncate font-sans text-[9px] text-[var(--ink)]"
                }
              >
                {step.output}
                {step.flag ? " · overstatement flag" : ""}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
