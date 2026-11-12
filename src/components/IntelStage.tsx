"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DATA_ROOM, type DataDoc } from "@/lib/dataroom";
import { CANNED, answerFor } from "@/lib/agent";
import { V7SourceChip, V7WorkflowPanel } from "@/components/V7WorkflowPanel";
import { AerialGrid } from "@/components/AerialGrid";
import { CompetitorCapture } from "@/components/CompetitorCapture";
import { CompetitorPanel } from "@/components/CompetitorPanel";
import { CompsPanel } from "@/components/CompsPanel";
import { buildLogScript } from "@/lib/terminal";
import { AERIAL_MODEL_LINE, aerialTotals } from "@/lib/aerial";
import { useCompetitorSite } from "@/lib/competitor";
import type { WatchMode } from "@/lib/watch";
import type { ChatMessage, SatelliteSpec, Site } from "@/lib/types";

function AgentPanel({ onOpenV7 }: { onOpenV7: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys",
      role: "system",
      text: "Agent online. Data room indexed by V7 Go. Ask about occupancy, seller claims, or valuation.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 9999, behavior: "smooth" });
  }, [messages, thinking]);

  function ask(prompt: string) {
    const q = prompt.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: q }]);
    const { answer, cite, source } = answerFor(q);
    const scan = source
      ? [
          "Opening V7 Go workflow…",
          "Reading extracted occupancy fields…",
          "Resolving discrepancy flag…",
        ]
      : [
          "Opening data room…",
          `Reading ${cite}`,
          "Cross-checking vehicle time series…",
        ];
    let i = 0;
    setThinking(scan[0]);
    const iv = setInterval(() => {
      i += 1;
      if (i < scan.length) {
        setThinking(scan[i]);
        return;
      }
      clearInterval(iv);
      setThinking(null);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "agent", text: answer, cite, source },
      ]);
    }, 420);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
        <span className="font-sans text-[12px] text-[var(--ink)]">Hawk agent</span>
        <span className="font-sans text-[10px] text-[var(--muted)]">Reads data room</span>
      </div>
      <div ref={scroller} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-6 border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1.5 text-xs"
                : "mr-4 text-xs text-[var(--ink)]"
            }
          >
            {m.role !== "user" && (
              <div className="mb-1 font-sans text-[9px] text-[var(--muted)]">
                {m.role === "system" ? "System" : "Hawk"}
                {m.cite && m.source !== "v7" ? ` · ${m.cite}` : ""}
              </div>
            )}
            <div>{m.text}</div>
            {m.source === "v7" && <V7SourceChip onOpen={onOpenV7} />}
          </div>
        ))}
        {thinking && (
          <div className="font-sans text-[10px] text-[var(--muted)]">
            ▍ {thinking}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1 border-t border-[var(--line)] px-2 py-2">
        {CANNED.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => ask(c.chip)}
            className="border border-[var(--line)] px-1.5 py-0.5 font-sans text-[9px] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
          >
            {c.chip}
          </button>
        ))}
      </div>
      <form
        className="flex border-t border-[var(--line)]"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query the data room…"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 font-sans text-xs outline-none placeholder:text-[var(--muted)]"
        />
        <button
          type="submit"
          className="px-3 font-sans text-[12px] text-[var(--ink)]"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export function IntelStage({
  site,
  sat,
  mode,
  focusStep,
  onFocusStep,
}: {
  site: Site;
  sat: SatelliteSpec;
  mode: WatchMode;
  focusStep?: string | null;
  onFocusStep?: (id: string | null) => void;
}) {
  const logs = useMemo(() => buildLogScript(site, sat), [site, sat]);
  const [visible, setVisible] = useState(1);
  const [doc, setDoc] = useState<DataDoc | null>(null);
  const [roomTab, setRoomTab] = useState<"v7" | "files" | "comps">("v7");
  const totals = useMemo(() => aerialTotals(), []);
  const competitor = useCompetitorSite();

  useEffect(() => {
    if (focusStep === "comps") setRoomTab("comps");
  }, [focusStep]);

  useEffect(() => {
    const iv = setInterval(() => {
      setVisible((n) => Math.min(logs.length, n + 1));
    }, 380);
    return () => clearInterval(iv);
  }, [logs.length]);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {mode === "competitor" ? (
          <CompetitorCapture site={competitor.site} loading={competitor.loading} />
        ) : (
          <AerialGrid />
        )}
        <div className="terminal-log h-[7.5rem] shrink-0 overflow-hidden border-t border-[var(--line)] bg-black text-[11px] leading-5 text-[var(--muted)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-1 text-[10px] text-[var(--ink)]">
            <span>Collection log</span>
            <span className="text-[var(--muted)]">
              {mode === "competitor"
                ? competitor.site
                  ? `Cars ${competitor.site.cars ?? "—"} · Bays ${competitor.site.bays ?? "—"} · Fill ${
                      competitor.site.fillPct == null
                        ? "—"
                        : `${Math.round(competitor.site.fillPct)}%`
                    }`
                  : "Loading capture"
                : `Cars ${totals.cars} · Trucks/vans ${totals.trucks} · Building segments ${totals.buildings} · ${AERIAL_MODEL_LINE}`}
            </span>
          </div>
          <div className="h-full overflow-hidden px-3 py-1">
            {logs.slice(Math.max(0, visible - 6), visible).map((line, i) => (
              <div key={`${visible}-${i}`}>{line}</div>
            ))}
            <div className="animate-pulse">▍</div>
          </div>
        </div>
      </div>
      {mode === "competitor" ? (
        <aside className="flex w-[420px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--panel)]">
          <CompetitorPanel site={competitor.site} loading={competitor.loading} />
        </aside>
      ) : (
      <aside
        data-room-tab={roomTab}
        className="flex w-[420px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--panel)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
          <div className="font-sans text-[12px] text-[var(--ink)]">
            {roomTab === "comps" ? "Area data" : "Data room"}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              data-room-tab="files"
              onClick={() => {
                setRoomTab("files");
                onFocusStep?.(null);
              }}
              className={
                roomTab === "files"
                  ? "border border-[var(--accent)] px-2 py-0.5 font-sans text-[10px] text-[var(--ink)]"
                  : "border border-[var(--line)] px-2 py-0.5 font-sans text-[10px] text-[var(--muted)]"
              }
            >
              Files
            </button>
            <button
              type="button"
              data-room-tab="v7"
              onClick={() => {
                setRoomTab("v7");
                onFocusStep?.(null);
              }}
              className={
                roomTab === "v7"
                  ? "border border-[var(--accent)] bg-white/10 px-2 py-0.5 font-sans text-[10px] text-[var(--ink)]"
                  : "border border-[var(--line)] px-2 py-0.5 font-sans text-[10px] text-[var(--muted)]"
              }
            >
              V7 Go
            </button>
            <button
              type="button"
              data-room-tab="comps"
              onClick={() => {
                setRoomTab("comps");
                onFocusStep?.("comps");
              }}
              className={
                roomTab === "comps"
                  ? "border border-[var(--accent)] bg-white/10 px-2 py-0.5 font-sans text-[10px] text-[var(--ink)]"
                  : "border border-[var(--line)] px-2 py-0.5 font-sans text-[10px] text-[var(--muted)]"
              }
            >
              Area data
            </button>
          </div>
        </div>
        {roomTab === "v7" ? (
          <div className="min-h-0 flex-[1.4] overflow-y-auto border-b border-[var(--line)] px-3 py-2">
            <V7WorkflowPanel />
          </div>
        ) : roomTab === "comps" ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
            <CompsPanel />
          </div>
        ) : (
          <div className="min-h-0 max-h-[42%] overflow-y-auto border-b border-[var(--line)] px-3 py-2">
            <div className="space-y-1">
              {DATA_ROOM.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDoc(d)}
                  className="flex w-full items-center justify-between border border-[var(--line)] px-2 py-1.5 text-left hover:border-[var(--accent)]"
                >
                  <span className="text-xs">{d.title}</span>
                  <span className="font-sans text-[9px] text-[var(--muted)]">
                    {d.tag} · {d.pages}p
                  </span>
                </button>
              ))}
            </div>
            {doc && (
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between font-sans text-[10px] text-[var(--muted)]">
                  <span>{doc.title}</span>
                  <a href={doc.file} target="_blank" rel="noreferrer" className="text-[var(--ink)]">
                    Open
                  </a>
                </div>
                <iframe title={doc.title} src={doc.file} className="h-36 w-full border border-[var(--line)] bg-white" />
              </div>
            )}
          </div>
        )}
        {roomTab !== "comps" && <AgentPanel onOpenV7={() => setRoomTab("v7")} />}
      </aside>
      )}
    </div>
  );
}
