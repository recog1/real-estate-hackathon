export type WatchMode = "claim" | "competitor";

export function readWatchMode(): WatchMode {
  if (typeof window === "undefined") return "claim";
  const q = new URLSearchParams(window.location.search);
  if (q.get("mode") === "competitor") return "competitor";
  const hash = window.location.hash.replace(/^#/, "");
  if (hash === "competitor") return "competitor";
  return "claim";
}

export function writeWatchMode(mode: WatchMode) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (mode === "competitor") url.searchParams.set("mode", "competitor");
  else url.searchParams.delete("mode");
  url.hash = "";
  const next = `${url.pathname}${url.search}`;
  if (`${window.location.pathname}${window.location.search}` !== next) {
    window.history.replaceState(null, "", next);
  }
}

export const CLAIM_HEADLINE = "Orbital occupancy intelligence";
export const COMPETITOR_HEADLINE = "Competitor: ASDA Leyton Mills Superstore";
export const COMPETITOR_SUBHEAD = "Marshall Road, Leyton E10 5NH";
export const COMPETITOR_NOTE =
  "Park-level occupancy, slight lower bound; imagery date unknown; Source: Esri, Maxar, Earthstar Geographics";

export const ALSO_WORKS_FOR = [
  {
    id: "offices",
    label: "Offices",
    detail: "Car park fill + street activity vs a peer building",
    roadmap: false,
  },
  {
    id: "multifamily",
    label: "Multifamily",
    detail: "Resident parking fill; night-light windows",
    roadmap: true,
    roadmapNote: "Night-light windows",
  },
  {
    id: "qsr",
    label: "QSR / McDonald's",
    detail: "Drive-thru queues",
    roadmap: true,
  },
] as const;
