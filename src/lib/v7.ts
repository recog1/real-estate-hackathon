import raw from "@/data/v7-results.json";

export type V7Document = (typeof raw)["documents"][number];

export const V7_RESULTS = raw;

export const V7_WORKFLOW_URL = raw.workflow.url;

export const V7_WORKFLOW_NAME = raw.workflow.name;

export const V7_SUMMARY = raw.summary;

export const V7_DOCS = raw.documents;

export const V7_FLAGGED = raw.documents.filter(
  (d) => d.discrepancy_flag === "Material overstatement",
);
