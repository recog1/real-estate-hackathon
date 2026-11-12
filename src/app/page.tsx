import { Suspense } from "react";
import { ClientOnlyApp } from "@/components/ClientOnlyApp";
import { PipelineStrip } from "@/components/PipelineStrip";

function BootScreen() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#07080b] text-[#f4f4f5]">
      <div className="font-sans text-4xl tracking-[0.28em]">ASSET HAWK</div>
      <div className="mt-3 font-sans text-[11px] tracking-[0.24em] text-[#8b93a7]">
        INITIALISING GLOBE
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex h-dvh w-full flex-col">
      <PipelineStrip mode="verify" />
      <div className="relative min-h-0 flex-1">
        <Suspense fallback={<BootScreen />}>
          <ClientOnlyApp />
        </Suspense>
      </div>
    </div>
  );
}
