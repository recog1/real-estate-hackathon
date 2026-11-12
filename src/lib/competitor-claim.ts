import type { DataDoc } from "@/lib/dataroom";

export const REPORTED_UTIL_PCT = 11;
export const REPORTED_VEHICLES = 100;
export const OBSERVED_UTIL_PCT = 18;
export const OBSERVED_VEHICLES = 167;
export const BAYS_ESTIMATE = 917;

export const COMPETITOR_VERDICT =
  "Traffic understated: observed 18% vs reported 11%, about 60% more vehicles than reported";

export const COMPETITOR_V7_WORKFLOW = "ASDA Leyton Mills utilisation check";

export const COMPETITOR_V7_PIPELINE = [
  "2 PDFs",
  "V7 Go extraction",
  "Reported 11%",
  "Understated flag",
] as const;

export const COMPETITOR_DOCS: (DataDoc & { available: boolean })[] = [
  {
    id: "utilisation",
    title: "Trading / car park utilisation report",
    file: "/docs/competitor/trading-car-park-utilisation-report.pdf",
    pages: 8,
    tag: "UTIL",
    available: false,
  },
  {
    id: "rent-review",
    title: "Rent review submission",
    file: "/docs/competitor/rent-review-submission.pdf",
    pages: 6,
    tag: "RENT",
    available: false,
  },
];
