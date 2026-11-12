"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DATA_ROOM, type DataDoc } from "@/lib/dataroom";
import { CANNED, answerFor } from "@/lib/agent";
import { V7SourceChip, V7WorkflowPanel } from "@/components/V7WorkflowPanel";
import { AerialGrid } from "@/components/AerialGrid";
import { buildLogScript } from "@/lib/terminal";
import { AERIAL_MODEL_LINE, aerialTotals } from "@/lib/aerial";
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
        <span className="font-sans text-[11px] tracking-[0.22em] text-[var(--accent)]">
          HAWK AGENT
        </span>
        <span className="font-sans text-[10px] text-[var(--muted)]">READS DATA ROOM</span>
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
              <div className="mb-1 font-sans text-[9px] tracking-[0.16em] text-[var(--accent)]">
                {m.role === "system" ? "SYS" : "HAWK"}
                {m.cite && m.source !== "v7" ? ` · ${m.cite}` : ""}
              </div>
            )}
            <div>{m.text}</div>
            {m.source === "v7" && <V7SourceChip onOpen={onOpenV7} />}
          </div>
        ))}
        {thinking && (
          <div className="font-sans text-[10px] text-[var(--cyan)]">
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
            className="border border-[var(--line)] px-1.5 py-0.5 font-sans text-[9px] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
          className="px-3 font-sans text-[11px] tracking-[0.2em] text-[var(--accent)]"
        >
          SEND
        </button>
      </form>
    </div>
  );
}

export function IntelStage({ site, sat }: { site: Site; sat: SatelliteSpec }) {
  const logs = useMemo(() => buildLogScript(site, sat), [site, sat]);
  const [visible, setVisible] = useState(1);
  const [doc, setDoc] = useState<DataDoc | null>(null);
  const [roomTab, setRoomTab] = useState<"v7" | "files">("v7");
  const totals = useMemo(() => aerialTotals(), []);

  useEffect(() => {
    const iv = setInterval(() => {
      setVisible((n) => Math.min(logs.length, n + 1));
    }, 380);
    return () => clearInterval(iv);
  }, [logs.length]);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <AerialGrid />
        <div className="terminal-log h-[7.5rem] shrink-0 overflow-hidden border-t border-[var(--line)] bg-black text-[11px] leading-5 text-[var(--cyan)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-1 text-[10px] tracking-[0.18em] text-[var(--accent)]">
            <span>AH-TERM // COLLECTION LOG</span>
            <span className="text-[var(--muted)]">
              CARS {totals.cars} · TRUCKS {totals.trucks} · DWELLINGS {totals.dwellings} ·{" "}
              {AERIAL_MODEL_LINE}
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
      <aside
        data-room-tab={roomTab}
        className="flex w-[420px] shrink-0 flex-col border-l border-[var(--line)] bg-[var(--panel)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
          <div className="font-sans text-[11px] tracking-[0.22em] text-[var(--accent)]">
            DATA ROOM
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              data-room-tab="files"
              onClick={() => setRoomTab("files")}
              className={
                roomTab === "files"
                  ? "border border-[var(--accent)] px-2 py-0.5 font-sans text-[9px] tracking-[0.14em] text-[var(--accent)]"
                  : "border border-[var(--line)] px-2 py-0.5 font-sans text-[9px] tracking-[0.14em] text-[var(--muted)]"
              }
            >
              FILES
            </button>
            <button
              type="button"
              data-room-tab="v7"
              onClick={() => setRoomTab("v7")}
              className={
                roomTab === "v7"
                  ? "border border-[#5B4BFF] bg-[#5B4BFF]/15 px-2 py-0.5 font-sans text-[9px] tracking-[0.14em] text-[#c8c4ff]"
                  : "border border-[var(--line)] px-2 py-0.5 font-sans text-[9px] tracking-[0.14em] text-[var(--muted)]"
              }
            >
              V7 GO
            </button>
          </div>
        </div>
        {roomTab === "v7" ? (
          <div className="min-h-0 flex-[1.4] overflow-y-auto border-b border-[var(--line)] px-3 py-2">
            <V7WorkflowPanel />
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
                  <a href={doc.file} target="_blank" rel="noreferrer" className="text-[var(--accent)]">
                    OPEN
                  </a>
                </div>
                <iframe title={doc.title} src={doc.file} className="h-36 w-full border border-[var(--line)] bg-white" />
              </div>
            )}
          </div>
        )}
        <AgentPanel onOpenV7={() => setRoomTab("v7")} />
      </aside>
    </div>
  );
}
