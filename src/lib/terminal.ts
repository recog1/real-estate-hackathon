import type { Site, SatelliteSpec } from "./types";

export function buildLogScript(site: Site, sat: SatelliteSpec): string[] {
  const unit = site.units;
  return [
    `AH-TASK  uplink ${sat.short}  aes-256  window=42s`,
    `AH-TASK  slew complete  off-nadir 18.4°  target ${site.lat.toFixed(4)}N ${(site.lon < 0 ? "" : "+")}${site.lon.toFixed(4)}E`,
    `AH-TASK  shutter  /  TDI  /  pan-sharpen ${sat.resolution}`,
    `AH-DL    ka-band burst  1.8 Gb  crc=ok  latency 11.4s`,
    `AH-INGEST  tiles=4  crs=EPSG:3857  gsd≈${sat.resolutionM}m`,
    `AH-VLM   weights=hawk-v11n  classes=[house,car,person]  fps=5`,
    `AH-VLM   Z-N  houses=12  cars=9   people=3  occ=0.75`,
    `AH-VLM   Z-E  houses=12  cars=11  people=2  occ=0.83`,
    `AH-VLM   Z-W  houses=12  cars=7   people=4  occ=0.67`,
    `AH-VLM   Z-S  houses=12  cars=8   people=3  occ=0.71`,
    `AH-OCC   proxy=car_at_dwelling  occupied=34/${unit}  seller=${Math.round(site.sellerOccupancy * 100)}%`,
    `AH-OCC   observed=73%  gap=-22pt  flag=MATERIAL_OVERSTATEMENT`,
    `AH-PDF   wrote occupancy-analysis-report.pdf`,
    `AH-PDF   wrote vehicle-count-time-series.pdf`,
    `AH-PDF   wrote site-imagery-pack.pdf`,
    `AH-PDF   wrote seller-claims-vs-observed.pdf`,
    `AH-PDF   wrote underwriting-memo.pdf`,
    `AH-ROOM  5 documents indexed  agent=ready`,
  ];
}
