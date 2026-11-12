"use client";

import dynamic from "next/dynamic";

function BootScreen() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-[#07080b] text-[#f4f4f5]">
      <div className="font-sans text-4xl tracking-[0.28em]">ASSET HAWK</div>
      <div className="mt-3 font-sans text-[11px] tracking-[0.24em] text-[#8b93a7]">
        INITIALISING GLOBE
      </div>
    </div>
  );
}

const CommandApp = dynamic(
  () => import("@/components/CommandApp").then((m) => ({ default: m.CommandApp })),
  { ssr: false, loading: BootScreen },
);

export function ClientOnlyApp() {
  return <CommandApp />;
}
