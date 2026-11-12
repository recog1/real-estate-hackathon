import { Suspense } from "react";
import { CommandApp } from "@/components/CommandApp";

function BootScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#07080b] text-[#d4a04a]">
      <div className="font-display text-4xl tracking-[0.28em]">ASSET HAWK</div>
      <div className="mt-3 font-mono text-[11px] tracking-[0.24em] text-[#8b93a7]">
        INITIALISING GLOBE
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<BootScreen />}>
      <CommandApp />
    </Suspense>
  );
}
