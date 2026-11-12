"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl";
import { ASDA_LEYTON, FITZROVIA, isAsdaSite, parcelRingForSite } from "@/lib/sites";
import type { Site } from "@/lib/types";

setWorkerUrl("/maplibre-gl-worker.mjs");

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_ATTRIBUTION = "© OpenFreeMap © OpenMapTiles © OpenStreetMap";
const ESRI_ATTRIBUTION = "Esri, Maxar, Earthstar Geographics";

const CLAIM_START = {
  center: [FITZROVIA.lon, FITZROVIA.lat] as [number, number],
  zoom: 14.05,
  pitch: 0,
  bearing: 0,
};

const COMPETITOR_VIEW = {
  zoom: 17,
  pitch: 0,
  bearing: 0,
  duration: 700,
};

type Props = {
  site: Site | null;
  departing?: boolean;
  followSite?: boolean;
  forceSatellite?: boolean;
  onPickSite: (lat: number, lon: number) => void;
  onDeparted?: () => void;
};

const SITE_VIEW = {
  zoom: 16.6,
  pitch: 0,
  bearing: 0,
  duration: 1500,
};

const ASCENT_VIEW = {
  zoom: 10.35,
  pitch: 0,
  bearing: 0,
  duration: 1400,
};

function ringPolygon(site: Site): number[][] {
  const flat = parcelRingForSite(site);
  const coords: number[][] = [];
  for (let i = 0; i < flat.length; i += 2) coords.push([flat[i], flat[i + 1]]);
  coords.push(coords[0]);
  return coords;
}

function cameraFor(site: Site, satellite: boolean) {
  const competitor = satellite || isAsdaSite(site);
  const zoom = competitor ? COMPETITOR_VIEW.zoom : SITE_VIEW.zoom;
  const center: [number, number] = competitor && isAsdaSite(site)
    ? [ASDA_LEYTON.lon, ASDA_LEYTON.lat]
    : [site.lon, site.lat];
  return {
    center,
    zoom,
    pitch: 0,
    bearing: 0,
    duration: competitor ? COMPETITOR_VIEW.duration : SITE_VIEW.duration,
  };
}

function openingView(site: Site | null, satellite: boolean) {
  if (site) {
    const cam = cameraFor(site, satellite);
    return { center: cam.center, zoom: cam.zoom, pitch: 0, bearing: 0 };
  }
  if (satellite) {
    return {
      center: [ASDA_LEYTON.lon, ASDA_LEYTON.lat] as [number, number],
      zoom: COMPETITOR_VIEW.zoom,
      pitch: 0,
      bearing: 0,
    };
  }
  return CLAIM_START;
}

function applySiteOnMap(
  map: MapLibreMap,
  markerRef: { current: Marker | null },
  site: Site,
  animate: boolean,
  satellite: boolean,
) {
  const source = map.getSource("hawk-site");
  if (source && "setData" in source) {
    (source as { setData: (data: ReturnType<typeof selectedGeoJSON>) => void }).setData(
      selectedGeoJSON(site),
    );
  }
  markerRef.current?.remove();
  const el = document.createElement("div");
  el.className = "site-pin";
  el.title = site.name;
  el.innerHTML =
    '<svg viewBox="0 0 24 36" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12.1 0 21.2 12 36 12 36s12-14.8 12-23.9C24 5.4 18.6 0 12 0z" fill="#22c55e"/><circle cx="12" cy="12" r="4.2" fill="#fff"/></svg>';
  markerRef.current = new Marker({ element: el, anchor: "bottom" })
    .setLngLat([site.lon, site.lat])
    .addTo(map);
  const view = cameraFor(site, satellite);
  const here = map.getCenter();
  const already =
    Math.abs(here.lat - view.center[1]) < 1e-4 &&
    Math.abs(here.lng - view.center[0]) < 1e-4 &&
    Math.abs(map.getZoom() - view.zoom) < 0.15 &&
    Math.abs(map.getPitch()) < 1;
  if (animate && !already) {
    map.stop();
    map.easeTo({
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
      duration: view.duration,
      essential: true,
    });
  } else {
    map.jumpTo({
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
    });
  }
}

function clearSiteOnMap(map: MapLibreMap, markerRef: { current: Marker | null }) {
  const source = map.getSource("hawk-site");
  if (source && "setData" in source) {
    (source as { setData: (data: ReturnType<typeof emptySiteGeoJSON>) => void }).setData(
      emptySiteGeoJSON(),
    );
  }
  markerRef.current?.remove();
  markerRef.current = null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length === 6 || h.length === 8) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function parseCssColor(input: string): { h: number; s: number; l: number; a: number } | null {
  const c = input.trim();
  if (c.startsWith("#")) {
    const rgb = hexToRgb(c);
    if (!rgb) return null;
    return { ...rgbToHsl(rgb.r, rgb.g, rgb.b), a: 1 };
  }
  const rgb = c.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (rgb) {
    return { ...rgbToHsl(+rgb[1], +rgb[2], +rgb[3]), a: rgb[4] != null ? +rgb[4] : 1 };
  }
  const hsl = c.match(
    /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (hsl) {
    return { h: +hsl[1], s: +hsl[2] / 100, l: +hsl[3] / 100, a: hsl[4] != null ? +hsl[4] : 1 };
  }
  return null;
}

function neutralizeCssColor(input: string): string {
  const p = parseCssColor(input);
  if (!p) return input;
  const warm = p.h >= 12 && p.h <= 72;
  if (!warm || p.s < 0.04) return input;
  const l = Math.round(p.l * 100);
  return p.a < 1 ? `hsla(0,0%,${l}%,${Number(p.a.toFixed(3))})` : `hsl(0,0%,${l}%)`;
}

function rewriteColors(value: unknown): unknown {
  if (typeof value === "string") return neutralizeCssColor(value);
  if (Array.isArray(value)) return value.map(rewriteColors);
  return value;
}

const COLOR_PAINT_PROPS = [
  "background-color",
  "fill-color",
  "fill-outline-color",
  "fill-extrusion-color",
  "line-color",
  "text-color",
  "text-halo-color",
  "icon-color",
  "circle-color",
  "circle-stroke-color",
] as const;

function neutralizeLiberty(map: MapLibreMap) {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.id.startsWith("hawk-")) continue;
    for (const key of COLOR_PAINT_PROPS) {
      try {
        const current = map.getPaintProperty(layer.id, key);
        if (current == null) continue;
        map.setPaintProperty(layer.id, key, rewriteColors(current) as never);
      } catch {
        /* property not on this layer */
      }
    }
  }
  if (map.getLayer("landuse_residential")) {
    map.setPaintProperty("landuse_residential", "fill-color", "hsl(0,0%,91%)");
  }
  if (map.getLayer("building")) {
    map.setPaintProperty("building", "fill-color", "#d4d6db");
    map.setPaintProperty("building", "fill-outline-color", "#c4c7cc");
  }
}

function styleBuildings(map: MapLibreMap) {
  if (!map.getLayer("building-3d")) return;
  map.setLayerZoomRange("building-3d", 13, 24);
  map.setPaintProperty("building-3d", "fill-extrusion-vertical-gradient", true);
  map.setPaintProperty("building-3d", "fill-extrusion-opacity", 0.88);
  map.setPaintProperty("building-3d", "fill-extrusion-color", [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", "render_height"], 12],
    0,
    "#d8dbe0",
    20,
    "#c5c9d0",
    50,
    "#aeb3bb",
    110,
    "#8b919a",
  ]);
}

type LayerVisibility = "visible" | "none";
const layerVis = new WeakMap<MapLibreMap, Map<string, LayerVisibility>>();

function snapshotVisibility(map: MapLibreMap) {
  let snap = layerVis.get(map);
  if (snap) return snap;
  snap = new Map();
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.id === "esri-sat" || layer.id.startsWith("hawk-")) continue;
    try {
      const vis = map.getLayoutProperty(layer.id, "visibility");
      snap.set(layer.id, vis === "none" ? "none" : "visible");
    } catch {
      snap.set(layer.id, "visible");
    }
  }
  layerVis.set(map, snap);
  return snap;
}

function applySatelliteMode(map: MapLibreMap, on: boolean) {
  if (!map.getLayer("esri-sat")) return;
  const snap = snapshotVisibility(map);
  map.setLayoutProperty("esri-sat", "visibility", on ? "visible" : "none");
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.id === "esri-sat" || layer.id.startsWith("hawk-")) continue;
    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", on ? "#07080b" : "#f4f5f6");
      continue;
    }
    if (on && layer.type === "symbol") continue;
    try {
      const next: LayerVisibility = on ? "none" : (snap.get(layer.id) ?? "visible");
      map.setLayoutProperty(layer.id, "visibility", next);
    } catch {
      /* some layers reject layout visibility */
    }
  }
  for (const id of ["hawk-site-fill", "hawk-site-line"]) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "visible");
  }
}

function addOverlays(map: MapLibreMap, satelliteOn: boolean) {
  if (map.getSource("esri-sat")) return;
  map.addSource("esri-sat", {
    type: "raster",
    tiles: [ESRI_IMAGERY],
    tileSize: 256,
    maxzoom: 19,
    attribution: ESRI_ATTRIBUTION,
  });
  const before = map.getStyle().layers?.find((l) => l.type !== "background")?.id;
  map.addLayer(
    {
      id: "esri-sat",
      type: "raster",
      source: "esri-sat",
      layout: { visibility: "none" },
      paint: { "raster-opacity": 1, "raster-fade-duration": 180 },
    },
    before,
  );
  map.addSource("hawk-site", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: "hawk-site-fill",
    type: "fill",
    source: "hawk-site",
    paint: {
      "fill-color": "#22c55e",
      "fill-opacity": 0.15,
    },
  });
  map.addLayer({
    id: "hawk-site-line",
    type: "line",
    source: "hawk-site",
    paint: {
      "line-color": "#22c55e",
      "line-width": 2,
    },
  });
  neutralizeLiberty(map);
  styleBuildings(map);
  applySatelliteMode(map, satelliteOn);
}

declare global {
  interface Window {
    __hawkMap?: {
      jumpTo: (opts: {
        center: [number, number];
        zoom: number;
        pitch?: number;
        bearing?: number;
      }) => void;
      getZoom: () => number;
      getPitch: () => number;
      getCenter: () => { lng: number; lat: number };
      loaded: () => boolean;
      idle: () => boolean;
    };
  }
}

function selectedGeoJSON(site: Site) {
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: { id: site.id, name: site.name },
        geometry: {
          type: "Polygon" as const,
          coordinates: [ringPolygon(site)],
        },
      },
    ],
  };
}

function emptySiteGeoJSON() {
  return { type: "FeatureCollection" as const, features: [] };
}

export function StreetMap({
  site,
  departing = false,
  followSite = true,
  forceSatellite = false,
  onPickSite,
  onDeparted,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const pickRef = useRef(onPickSite);
  const departedRef = useRef(onDeparted);
  const siteRef = useRef(site);
  const departingRef = useRef(departing);
  const [satellite, setSatellite] = useState(forceSatellite);
  const satRef = useRef(forceSatellite);
  pickRef.current = onPickSite;
  departedRef.current = onDeparted;
  siteRef.current = site;
  departingRef.current = departing;
  satRef.current = satellite;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let idle = false;
    let ro: ResizeObserver | null = null;
    let map: MapLibreMap | null = null;

    const waitForSize = () =>
      new Promise<void>((resolve) => {
        if (host.clientWidth > 8 && host.clientHeight > 8) {
          resolve();
          return;
        }
        const obs = new ResizeObserver(() => {
          if (host.clientWidth > 8 && host.clientHeight > 8) {
            obs.disconnect();
            resolve();
          }
        });
        obs.observe(host);
        window.setTimeout(() => {
          obs.disconnect();
          resolve();
        }, 800);
      });

    void (async () => {
      await waitForSize();
      if (cancelled || !hostRef.current) return;

      const opening = openingView(siteRef.current, satRef.current);
      const ml = new MapLibreMap({
        container: host,
        style: STYLE_URL,
        center: opening.center,
        zoom: opening.zoom,
        pitch: opening.pitch,
        bearing: opening.bearing,
        minZoom: 9,
        maxZoom: 19,
        maxPitch: 60,
        minPitch: 0,
        maplibreLogo: false,
        attributionControl: false,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        canvasContextAttributes: {
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        },
        fadeDuration: 180,
        validateStyle: false,
      });
      map = ml;
      mapRef.current = ml;

      ml.on("load", () => {
        if (cancelled) return;
        addOverlays(ml, satRef.current);
        const current = siteRef.current;
        if (current && !departingRef.current) {
          applySiteOnMap(ml, markerRef, current, false, satRef.current);
        }
        host.setAttribute("data-map-ready", "1");
      });
      ml.on("idle", () => {
        idle = true;
        if (!cancelled) host.setAttribute("data-map-idle", "1");
      });
      ml.on("dataloading", () => {
        idle = false;
      });
      ml.on("click", (e) => {
        if (departingRef.current) return;
        pickRef.current(e.lngLat.lat, e.lngLat.lng);
      });

      window.__hawkMap = {
        jumpTo: (opts) => {
          ml.jumpTo({
            center: opts.center,
            zoom: opts.zoom,
            pitch: opts.pitch ?? 0,
            bearing: opts.bearing ?? 0,
          });
        },
        getZoom: () => ml.getZoom(),
        getPitch: () => ml.getPitch(),
        getCenter: () => ml.getCenter(),
        loaded: () => ml.loaded(),
        idle: () => idle && ml.loaded(),
      };

      ro = new ResizeObserver(() => ml.resize());
      ro.observe(host);
      requestAnimationFrame(() => ml.resize());
      window.setTimeout(() => ml.resize(), 160);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      if (window.__hawkMap) delete window.__hawkMap;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    setSatellite(forceSatellite);
  }, [forceSatellite]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applySatelliteMode(map, satellite);
  }, [satellite]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!site) {
      clearSiteOnMap(map, markerRef);
      return;
    }
    if (!followSite || departing) return;
    applySiteOnMap(map, markerRef, site, true, satRef.current);
  }, [site, departing, followSite, satellite]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !departing) return;
    const origin = site ?? {
      lon: map.getCenter().lng,
      lat: map.getCenter().lat,
    };
    map.stop();
    hostRef.current?.setAttribute("data-departing", "1");
    const started = performance.now();
    map.easeTo({
      center: [origin.lon, origin.lat],
      zoom: ASCENT_VIEW.zoom,
      pitch: ASCENT_VIEW.pitch,
      bearing: ASCENT_VIEW.bearing,
      duration: ASCENT_VIEW.duration,
      essential: true,
    });
    let done = false;
    const finish = () => {
      if (done) return;
      const pulledBack = map.getZoom() <= 11.8;
      const waited = performance.now() - started >= ASCENT_VIEW.duration - 80;
      if (!pulledBack && !waited) return;
      done = true;
      departedRef.current?.();
    };
    map.on("moveend", finish);
    const fallback = window.setTimeout(finish, ASCENT_VIEW.duration + 220);
    return () => {
      map.off("moveend", finish);
      window.clearTimeout(fallback);
    };
  }, [departing, site]);

  return (
    <div
      className="street-map-host"
      data-departing={departing ? "1" : "0"}
      data-basemap={satellite ? "satellite" : "street"}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <div
        ref={hostRef}
        className="street-map-canvas"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", minHeight: 240 }}
      />
      <button
        type="button"
        className="map-sat-toggle"
        aria-pressed={satellite}
        aria-label="Satellite"
        onClick={() => setSatellite((v) => !v)}
      >
        Satellite
      </button>
      <div className="map-attrib">
        {satellite ? ESRI_ATTRIBUTION : STREET_ATTRIBUTION}
      </div>
    </div>
  );
}
