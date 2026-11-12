export type WatchMode = "claim" | "competitor";

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
