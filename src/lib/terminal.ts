import { aerialTotals } from "./aerial";
import type { CompetitorSite } from "./competitor";
import type { Site, SatelliteSpec } from "./types";

export function buildLogScript(site: Site, sat: SatelliteSpec): string[] {
  const unit = site.units;
  const { cars, trucks, buildings } = aerialTotals();
  return [
    `Task uplink ${sat.short}, window 42s`,
    `Slew complete, off-nadir 18.4°, target ${site.lat.toFixed(4)}N ${(site.lon < 0 ? "" : "+")}${site.lon.toFixed(4)}E`,
    `Shutter / TDI / pan-sharpen ${sat.resolution}`,
    `Ka-band burst 1.8 Gb, crc ok, latency 11.4s`,
    `Ingest 1 tile, crs EPSG:3857, gsd ≈ ${sat.resolutionM}m`,
    `Detection run, models YOLO11m-OBB (DOTA) + OWLv2`,
    `Oxford Circus: cars ${cars}, trucks/vans ${trucks}, building segments ${buildings}`,
    `Site story: seller ${Math.round(site.sellerOccupancy * 100)}%, units ${unit}`,
    `Observed 73%, gap −22pt, flag material overstatement`,
    `Wrote occupancy-analysis-report.pdf`,
    `Wrote vehicle-count-time-series.pdf`,
    `Wrote site-imagery-pack.pdf`,
    `Wrote seller-claims-vs-observed.pdf`,
    `Wrote underwriting-memo.pdf`,
    `5 documents indexed, agent ready`,
  ];
}

export function buildCompetitorLog(
  site: Site,
  sat: SatelliteSpec,
  capture: CompetitorSite | null,
): string[] {
  const vehicles = capture?.vehicles;
  const cars = capture?.cars;
  const vans = capture?.trucks;
  const bays = capture?.bays;
  const fill =
    capture?.fillPct == null ? null : Math.round(capture.fillPct);
  const vehicleLine =
    vehicles != null && cars != null && vans != null
      ? `${vehicles} vehicles in the car park (${cars} cars, ${vans} vans)`
      : "Run capture";
  const bayLine =
    bays != null
      ? `Bay estimate ~${bays} (marked car-park area / 30 m² per bay)`
      : "Run capture";
  const fillLine = fill != null ? `Fill ${fill}% vs capacity` : "Run capture";
  return [
    `Selected ASDA Leyton Mills Superstore, Marshall Road, Leyton E10 5NH`,
    `Task uplink ${sat.short} over ${site.name}`,
    `Pulled Esri World Imagery z19, 278 m plot, ${site.lat.toFixed(5)}N ${Math.abs(site.lon).toFixed(5)}W`,
    `Ran vehicle detection, YOLO11m-OBB + OWLv2`,
    vehicleLine,
    bayLine,
    fillLine,
    `Park-level occupancy, slight lower bound; imagery date unknown`,
    `Source: Esri, Maxar, Earthstar Geographics`,
  ];
}
