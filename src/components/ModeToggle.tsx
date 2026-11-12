"use client";

import type { WatchMode } from "@/lib/watch";

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: WatchMode;
  onChange: (mode: WatchMode) => void;
}) {
  return (
    <div className="mode-toggle" data-mode={mode} role="tablist" aria-label="Watch mode">
      <button
        type="button"
        role="tab"
        aria-pressed={mode === "claim"}
        onClick={() => onChange("claim")}
      >
        Verify a claim
      </button>
      <button
        type="button"
        role="tab"
        aria-pressed={mode === "competitor"}
        onClick={() => onChange("competitor")}
      >
        Watch a competitor
      </button>
    </div>
  );
}
