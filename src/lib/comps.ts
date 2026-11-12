export const COMPS_RETRIEVED = "12 Nov 2026";

export const COMPS_SITE = "Oxford Circus";

export const COMPS_PRICES = {
  title: "Prices",
  context: "UK HPI, Westminster, Aug 2026, provisional",
  rows: [
    { label: "Average", value: "£887,206", note: "−14.3% YoY" },
    { label: "Flats", value: "£784,694", note: "−15.1%" },
  ],
  sourceLabel: "Land Registry UK HPI",
  sourceUrl:
    "http://landregistry.data.gov.uk/data/ukhpi/region/city-of-westminster/month/2026-08",
} as const;

export const COMPS_RENTS = {
  title: "Rents",
  context: "ONS PIPR, Westminster, Sep 2026",
  rows: [
    { label: "Average", value: "£3,209/month", note: "−0.4% YoY" },
    { label: "Flats", value: "£2,967", note: null },
    { label: "1-bed", value: "£2,557", note: null },
    { label: "2-bed", value: "£3,320", note: null },
  ],
  sourceLabel: "ONS private rental prices",
  sourceUrl: "https://www.ons.gov.uk/visualisations/housingpriceslocal/E09000033/",
} as const;

export const COMPS_RESIDENTIAL = {
  title: "Residential comps",
  context: "Land Registry Price Paid, 36 months to Nov 2026",
  rows: [
    {
      label: "Sales within 500 m",
      value: "111 residential sales",
      calculated: false,
    },
    {
      label: "Median",
      value: "£1,250,000",
      calculated: true,
    },
    {
      label: "Flats median",
      value: "£1,153,600",
      calculated: false,
    },
  ],
  closest: {
    address: "13 John Princes Street, W1G 0JR",
    price: "£2,200,000",
    date: "10 Jan 2025",
    distance: "103 m",
  },
  sourceLabel: "Land Registry Price Paid",
  sourceUrl: "https://landregistry.data.gov.uk/landregistry/query",
} as const;

export const COMPS_COMMERCIAL = [
  {
    address: "1 Newman Street",
    detail: "£250m (GPE to RLAM, Oct 2025, 4.48% NIY)",
  },
  {
    address: "325 Oxford Street / The Burlian",
    detail: "£195m (Hines to Allwyn, late 2025, 3.69% NIY)",
  },
  {
    address: "100 Regent Street headlease",
    detail: "£95m (Crown Estate, Jul 2025)",
  },
  {
    address: "One Chapel Place",
    detail: "£56m (GPE, Mar 2025)",
  },
  {
    address: "354-358 Oxford Street",
    detail: "£37m (Land Registry)",
  },
] as const;

export const COMPS_OCCUPANCY = {
  title: "Baseline occupancy",
  context: "Census 2021, dwellings with no usual residents",
  calculated: true,
  rows: [
    { label: "Site LSOA Westminster 013G", value: "37.3% unoccupied" },
    { label: "Westminster", value: "26.5%" },
  ],
  note: "Census Day was during COVID.",
  sourceLabel: "ONS vacant dwellings and second homes",
  sourceUrl:
    "https://www.ons.gov.uk/peoplepopulationandcommunity/housing/datasets/numberofvacantdwellingsandsecondhomeswithnousualresidents",
} as const;

export const COMPS_PIPELINE_LINE = "Westminster HPI £887,206 · 111 sales";
