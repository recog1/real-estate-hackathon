import type { ReactNode } from "react";
import { V7_SUMMARY, V7_WORKFLOW_NAME, V7_WORKFLOW_URL } from "@/lib/v7";

export type PipelineMode = "verify" | "competitor";

type PipelineStripProps = {
  mode: PipelineMode;
};

type Step = {
  n: number;
  tool: string;
  output: ReactNode;
  href?: string;
  kicker?: string;
  emphasize?: boolean;
};

function stepsFor(mode: PipelineMode): Step[] {
  const claimed = `${V7_SUMMARY.seller_claimed_occupancy_pct}%`;
  const observed = `${V7_SUMMARY.observed_occupancy_pct}%`;
  const [lo, hi] = V7_SUMMARY.observed_range_pct;

  const intake: [Step, Step] =
    mode === "competitor"
      ? [
          {
            n: 1,
            tool: "Target selection",
            output: "Competing asset locked on the map",
          },
          {
            n: 2,
            tool: "Target selection",
            output: "Site ready for occupancy check",
          },
        ]
      : [
          {
            n: 1,
            tool: "Data room PDFs",
            output: "Rent roll, OM",
          },
          {
            n: 2,
            tool: "V7 Go workflow",
            kicker: "Document-AI orchestration",
            emphasize: true,
            href: V7_WORKFLOW_URL,
            output: (
              <>
                <span className="font-medium text-white">{V7_WORKFLOW_NAME}</span>
                {" "}
                extracts the claimed occupancy: {claimed}
              </>
            ),
          },
        ];

  const verdict: Step =
    mode === "competitor"
      ? {
          n: 6,
          tool: "Verdict",
          output: "Fill % vs capacity",
        }
      : {
          n: 6,
          tool: "Verdict",
          output: (
            <>
              claimed {claimed} vs observed {observed} ({lo}–{hi}%),{" "}
              <span className="font-medium text-[#ef4444]">
                material overstatement
              </span>
            </>
          ),
        };

  return [
    ...intake,
    {
      n: 3,
      tool: "Satellite tasking",
      output: "Esri World Imagery",
    },
    {
      n: 4,
      tool: "Vision detections",
      output: "YOLO11 OBB: cars, vans, buildings",
    },
    {
      n: 5,
      tool: "Comps and area data",
      output: "Land Registry, ONS, MSCI RCA",
    },
    verdict,
  ];
}

export function PipelineStrip({ mode }: PipelineStripProps) {
  const steps = stepsFor(mode);

  return (
    <section
      data-pipeline-strip="1"
      data-pipeline-mode={mode}
      aria-label="How it works"
      className="shrink-0 border-b border-white/15 bg-black font-sans text-white"
    >
      <div className="flex items-stretch gap-4 px-3 py-2.5">
        <div className="flex w-48 shrink-0 flex-col justify-center border-r border-white/15 pr-4">
          <p className="text-[13px] font-medium leading-tight tracking-tight">
            How it works
          </p>
          <p className="mt-1 text-[11px] leading-snug text-white/55">
            V7 Go is the document-AI orchestration layer
          </p>
        </div>

        <ol className="relative flex min-w-0 flex-1 items-stretch overflow-x-auto">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 right-3 top-[11px] h-px bg-white/20"
          />
          {steps.map((step, index) => {
            const body = (
              <>
                {step.kicker && (
                  <span className="block text-[10px] leading-tight text-white/50">
                    {step.kicker}
                  </span>
                )}
                <span className="block text-[11px] leading-snug text-white/70">
                  {step.output}
                </span>
              </>
            );

            return (
              <li
                key={step.n}
                data-pipeline-step={step.n}
                className="relative z-[1] flex min-w-[8.5rem] flex-1 gap-1 pr-1"
              >
                <div className="min-w-0 flex-1">
                  <div
                    className={
                      step.emphasize
                        ? "flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white text-[11px] font-medium text-black"
                        : "flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/70 bg-black text-[11px] text-white"
                    }
                  >
                    {step.n}
                  </div>
                  <p
                    className={
                      step.emphasize
                        ? "mt-1.5 text-[12px] font-medium leading-tight text-white"
                        : "mt-1.5 text-[12px] font-medium leading-tight text-white/90"
                    }
                  >
                    {step.tool}
                  </p>
                  {step.href ? (
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block underline decoration-white/35 underline-offset-2 hover:decoration-white"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="mt-0.5">{body}</div>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="mt-[3px] shrink-0 text-[11px] text-white/35"
                  >
                    →
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
