import { V7_SUMMARY } from "@/lib/v7";

export type Canned = {
  id: string;
  chip: string;
  match: RegExp;
  cite: string;
  answer: string;
  source?: "v7";
};

export const CANNED: Canned[] = [
  {
    id: "results",
    chip: "What are the results of this analysis?",
    match: /result|findings|summary|analysis|what did|occupancy/i,
    cite: "Source: V7 Go workflow",
    source: "v7",
    answer: V7_SUMMARY.answer,
  },
  {
    id: "claims",
    chip: "How does this compare to the seller’s claim?",
    match: /seller|claim|rent roll|95%|overstat/i,
    cite: "Seller Claims vs Observed · p.1",
    answer:
      "Seller pack: 95% occupied, 142 units, £3.42m TTM rent. Observed: 71–75% occupied on a cars-per-dwelling proxy, with the north and west tiles the weakest (64% and 69%). That is a ~20–24pt occupancy gap. We would treat the rent roll as unconfirmed until night-time and weekend revisits. Source: Seller Claims vs Observed p.1, Occupancy Analysis Report p.3.",
  },
  {
    id: "valuation",
    chip: "What’s the implied valuation impact?",
    match: /valu|price|cap rate|underwrit|impact|worth/i,
    cite: "Underwriting Memo · p.2",
    answer:
      "If NOI scales with occupancy, a 95% → 73% miss is ~23% on in-place income. At a 5.25% cap that is roughly a 20–25% value haircut versus the asking implied cap — on a £48–55m ask, call it £10–13m of unsupported value. We would bid off 73% occupancy with a 150bps vacancy reserve, not the seller’s 5%. Underwriting Memo p.2.",
  },
  {
    id: "method",
    chip: "How did you count vehicles?",
    match: /count|vehicle|car|method|vlm|model|how/i,
    cite: "Vehicle Count Time Series · p.1",
    answer:
      "Four 20–24s nadir loops, VLM overlay on COCO-mapped car/person plus stable house footprints. Counts are per-frame then median-smoothed; parked cars are nearly static, through-traffic is excluded if displacement > 4 m/s. Occupied = dwelling with ≥1 car within ~18 m of the footprint. Vehicle Count Time Series p.1–2.",
  },
  {
    id: "ic",
    chip: "What should I send to IC?",
    match: /ic|committee|memo|send|pack|data room/i,
    cite: "Underwriting Memo · p.1",
    answer:
      "Send the Underwriting Memo (primary), Seller Claims vs Observed (the gap), Occupancy Analysis Report (method + tiles), and the Site Imagery Pack. Flag that this is orbital underwriting before any seller data-room access — independent, timestamped, and revisitable. Underwriting Memo p.1.",
  },
];

export const FALLBACK =
  "I only underwrite from this collection’s data room. Ask about occupancy, seller claims, vehicle counts, valuation impact, or what to send to IC. I will not speculate beyond the five PDFs on file.";

export function answerFor(
  prompt: string,
): { answer: string; cite: string; source?: "v7" } {
  const hit = CANNED.find((c) => c.match.test(prompt));
  if (hit) return { answer: hit.answer, cite: hit.cite, source: hit.source };
  return { answer: FALLBACK, cite: "Data room index" };
}
