import type { Site, SatelliteSpec } from "./types";

export function buildLogScript(site: Site, sat: SatelliteSpec): string[] {
  const unit = site.units;
  return [
    `AH-TASK  uplink ${sat.short}  aes-256  window=42s`,
    `AH-TASK  slew complete  off-nadir 18.4°  target ${site.lat.toFixed(4)}N ${(site.lon < 0 ? "" : "+")}${site.lon.toFixed(4)}E`,
    `AH-TASK  shutter  /  TDI  /  pan-sharpen ${sat.resolution}`,
    `AH-DL    ka-band burst  1.8 Gb  crc=ok  latency 11.4s`,
    `AH-INGEST  tiles=4  crs=EPSG:3857  gsd≈${sat.resolutionM}m`,
    `AH-DET   illustrative sample imagery  models=YOLO11m-OBB (DOTA) + OWLv2`,
    `AH-DET   T-1  cars=6  trucks=0  dwellings=253  v/d=0.02`,
    `AH-DET   T-2  cars=70  trucks=3  dwellings=212  v/d=0.34`,
    `AH-DET   T-3  cars=107 trucks=4  dwellings=141  v/d=0.79`,
    `AH-DET   T-4  cars=284 trucks=13 dwellings=268  v/d=1.11`,
    `AH-OCC   site story (separate)  seller=${Math.round(site.sellerOccupancy * 100)}%  units=${unit}`,
    `AH-OCC   observed=73%  gap=-22pt  flag=MATERIAL_OVERSTATEMENT`,
    `AH-PDF   wrote occupancy-analysis-report.pdf`,
    `AH-PDF   wrote vehicle-count-time-series.pdf`,
    `AH-PDF   wrote site-imagery-pack.pdf`,
    `AH-PDF   wrote seller-claims-vs-observed.pdf`,
    `AH-PDF   wrote underwriting-memo.pdf`,
    `AH-ROOM  5 documents indexed  agent=ready`,
  ];
}
