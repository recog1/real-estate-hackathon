import type { Site } from "./types";

export const LONDON = { lon: -0.1276, lat: 51.5074 };

/** Oxford Circus — default demo start. */
export const FITZROVIA = { lon: -0.142, lat: 51.5155 };

/** ASDA Leyton Mills Superstore — competitor-watch demo. */
export const ASDA_LEYTON = { lon: -0.00901, lat: 51.55636 };

export const SAMPLE_PARCELS: Site[] = [
  {
    id: "cubitt",
    name: "Cubitt Wharf Residences",
    borough: "Tower Hamlets",
    lat: 51.4976,
    lon: -0.0072,
    units: 142,
    sellerOccupancy: 0.95,
    claimedRentRoll: "£3.42m TTM",
  },
  {
    id: "ladbroke",
    name: "Ladbroke Grove Court",
    borough: "Kensington & Chelsea",
    lat: 51.5174,
    lon: -0.2088,
    units: 86,
    sellerOccupancy: 0.94,
    claimedRentRoll: "£2.18m TTM",
  },
  {
    id: "fields",
    name: "London Fields Terrace",
    borough: "Hackney",
    lat: 51.5421,
    lon: -0.0576,
    units: 118,
    sellerOccupancy: 0.96,
    claimedRentRoll: "£2.91m TTM",
  },
  {
    id: "greenwich",
    name: "East Greenwich Quay",
    borough: "Greenwich",
    lat: 51.4879,
    lon: 0.0084,
    units: 164,
    sellerOccupancy: 0.93,
    claimedRentRoll: "£3.75m TTM",
  },
  {
    id: "battersea",
    name: "Battersea Park Mansions",
    borough: "Wandsworth",
    lat: 51.4758,
    lon: -0.1534,
    units: 104,
    sellerOccupancy: 0.95,
    claimedRentRoll: "£2.64m TTM",
  },
  {
    id: "stratford",
    name: "Stratford E20 Blocks",
    borough: "Newham",
    lat: 51.5452,
    lon: -0.0168,
    units: 210,
    sellerOccupancy: 0.97,
    claimedRentRoll: "£4.80m TTM",
  },
];

export const DEMO_INTEL = {
  borough: "London",
  units: 142,
  sellerOccupancy: 0.95,
  claimedRentRoll: "£3.42m TTM",
} as const;

export function siteFromClick(lat: number, lon: number): Site {
  const demo =
    Math.abs(lat - FITZROVIA.lat) < 1e-4 && Math.abs(lon - FITZROVIA.lon) < 1e-4;
  const asda =
    Math.abs(lat - ASDA_LEYTON.lat) < 5e-4 && Math.abs(lon - ASDA_LEYTON.lon) < 5e-4;
  return {
    id: `site-${lat.toFixed(4)}-${lon.toFixed(4)}`,
    name: asda
      ? "ASDA Leyton Mills Superstore"
      : demo
        ? "Oxford Circus"
        : "Selected site",
    borough: asda ? "Waltham Forest" : DEMO_INTEL.borough,
    lat,
    lon,
    units: DEMO_INTEL.units,
    sellerOccupancy: DEMO_INTEL.sellerOccupancy,
    claimedRentRoll: DEMO_INTEL.claimedRentRoll,
  };
}

export function isAsdaSite(site: Pick<Site, "lat" | "lon">): boolean {
  return (
    Math.abs(site.lat - ASDA_LEYTON.lat) < 5e-4 &&
    Math.abs(site.lon - ASDA_LEYTON.lon) < 5e-4
  );
}

export function asdaSite(): Site {
  return siteFromClick(ASDA_LEYTON.lat, ASDA_LEYTON.lon);
}

/** Axis-aligned square matching the Oxford Circus capture (~300 m). */
export const SITE_PLOT_M = 300;
/** ASDA Leyton Mills capture is a 278.5 m plot (detections.json imagery.size_m). */
export const COMPETITOR_PLOT_M = 278;

/** Capture bounds from public/competitor/detections.json. */
export const ASDA_BOUNDS = {
  north: 51.557070801828274,
  south: 51.554569299041376,
  west: -0.0116729736328125,
  east: -0.007649660110473633,
};

export function plotSizeFor(site: Pick<Site, "lat" | "lon">): number {
  return isAsdaSite(site) ? COMPETITOR_PLOT_M : SITE_PLOT_M;
}

export function parcelRing(lat: number, lon: number, sizeM = SITE_PLOT_M): number[] {
  const half = sizeM / 2;
  const dLat = half / 111_320;
  const dLon = half / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [
    lon - dLon,
    lat - dLat,
    lon + dLon,
    lat - dLat,
    lon + dLon,
    lat + dLat,
    lon - dLon,
    lat + dLat,
  ];
}

export function parcelRingForSite(site: Pick<Site, "lat" | "lon">): number[] {
  if (isAsdaSite(site)) {
    const { north, south, east, west } = ASDA_BOUNDS;
    return [west, south, east, south, east, north, west, north];
  }
  return parcelRing(site.lat, site.lon, plotSizeFor(site));
}
