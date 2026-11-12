export type DataDoc = {
  id: string;
  title: string;
  file: string;
  pages: number;
  tag: string;
};

export const DATA_ROOM: DataDoc[] = [
  {
    id: "occupancy",
    title: "Occupancy Analysis Report",
    file: "/dataroom/occupancy-analysis-report.pdf",
    pages: 6,
    tag: "CORE",
  },
  {
    id: "vehicles",
    title: "Vehicle Count Time Series",
    file: "/dataroom/vehicle-count-time-series.pdf",
    pages: 4,
    tag: "SERIES",
  },
  {
    id: "imagery",
    title: "Site Imagery Pack",
    file: "/dataroom/site-imagery-pack.pdf",
    pages: 5,
    tag: "IMINT",
  },
  {
    id: "claims",
    title: "Seller Claims vs Observed",
    file: "/dataroom/seller-claims-vs-observed.pdf",
    pages: 3,
    tag: "DELTA",
  },
  {
    id: "memo",
    title: "Underwriting Memo",
    file: "/dataroom/underwriting-memo.pdf",
    pages: 4,
    tag: "IC",
  },
];
