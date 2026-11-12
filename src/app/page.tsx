import { Suspense } from "react";
import { ClientOnlyApp } from "@/components/ClientOnlyApp";

function BootScreen() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-[#07080b] text-[#d4a04a]">
      <div className="font-sans text-4xl tracking-[0.28em]">ASSET HAWK</div>
      <div className="mt-3 font-sans text-[11px] tracking-[0.24em] text-[#8b93a7]">
        INITIALISING GLOBE
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="h-dvh w-full">
      <Suspense fallback={<BootScreen />}>
        <ClientOnlyApp />
      </Suspense>
    </div>
  );
}
