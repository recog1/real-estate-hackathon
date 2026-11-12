import type { Site } from "./types";

export const LONDON = { lon: -0.1276, lat: 51.5074 };

/** Fitzrovia / Margaret Street — demo start and screenshot target. */
export const FITZROVIA = { lon: -0.1428, lat: 51.5165 };

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
  return {
    id: `site-${lat.toFixed(4)}-${lon.toFixed(4)}`,
    name: "Selected site",
    borough: DEMO_INTEL.borough,
    lat,
    lon,
    units: DEMO_INTEL.units,
    sellerOccupancy: DEMO_INTEL.sellerOccupancy,
    claimedRentRoll: DEMO_INTEL.claimedRentRoll,
  };
}

export function parcelRing(lat: number, lon: number, sizeM = 160): number[] {
  const dLat = sizeM / 111_320;
  const dLon = sizeM / (111_320 * Math.cos((lat * Math.PI) / 180));
  const jitter = 0.22;
  return [
    lon - dLon * (0.9 + jitter),
    lat - dLat * 0.7,
    lon + dLon * 0.85,
    lat - dLat * (0.95),
    lon + dLon * 1.05,
    lat + dLat * 0.8,
    lon - dLon * 0.75,
    lat + dLat * 1.05,
  ];
}
