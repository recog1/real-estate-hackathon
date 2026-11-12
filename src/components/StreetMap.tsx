"use client";

import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
} from "maplibre-gl";
import { FITZROVIA, SAMPLE_PARCELS, parcelRing } from "@/lib/sites";
import type { Site } from "@/lib/types";

setWorkerUrl("/maplibre-gl-worker.mjs");

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const START = {
  center: [FITZROVIA.lon, FITZROVIA.lat] as [number, number],
  zoom: 14.05,
  pitch: 56,
  bearing: -22,
};

type Props = {
  site: Site | null;
  onPickSite: (lat: number, lon: number) => void;
};

function ringPolygon(lat: number, lon: number): number[][] {
  const flat = parcelRing(lat, lon);
  const coords: number[][] = [];
  for (let i = 0; i < flat.length; i += 2) coords.push([flat[i], flat[i + 1]]);
  coords.push(coords[0]);
  return coords;
}

function parcelsGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: SAMPLE_PARCELS.map((p) => ({
      type: "Feature" as const,
      properties: { id: p.id, name: p.name },
      geometry: {
        type: "Polygon" as const,
        coordinates: [ringPolygon(p.lat, p.lon)],
      },
    })),
  };
}

function styleBuildings(map: MapLibreMap) {
  if (!map.getLayer("building-3d")) return;
  map.setLayerZoomRange("building-3d", 13, 24);
  map.setPaintProperty("building-3d", "fill-extrusion-vertical-gradient", true);
  map.setPaintProperty("building-3d", "fill-extrusion-opacity", 0.92);
  map.setPaintProperty("building-3d", "fill-extrusion-color", [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", "render_height"], 12],
    0,
    "#d8cfc3",
    20,
    "#c4b196",
    50,
    "#a38a6c",
    110,
    "#6f5a44",
  ]);
}

function applySatelliteMode(map: MapLibreMap, on: boolean) {
  if (!map.getLayer("esri-sat")) return;
  map.setLayoutProperty("esri-sat", "visibility", on ? "visible" : "none");
  const keep = new Set(["esri-sat", "building-3d", "hawk-parcels-fill", "hawk-parcels-line"]);
  for (const layer of map.getStyle().layers ?? []) {
    if (keep.has(layer.id) || layer.type === "symbol") continue;
    if (layer.type === "background") {
      map.setPaintProperty(layer.id, "background-color", on ? "#07080b" : "#f6f4f0");
      continue;
    }
    try {
      map.setLayoutProperty(layer.id, "visibility", on ? "none" : "visible");
    } catch {
      /* some layers reject layout visibility */
    }
  }
  if (map.getLayer("building-3d")) {
    map.setLayoutProperty("building-3d", "visibility", "visible");
  }
}

function addOverlays(map: MapLibreMap, satelliteOn: boolean) {
  if (map.getSource("hawk-parcels")) return;
  map.addSource("hawk-parcels", {
    type: "geojson",
    data: parcelsGeoJSON(),
  });
  map.addLayer({
    id: "hawk-parcels-fill",
    type: "fill",
    source: "hawk-parcels",
    paint: {
      "fill-color": "#d4a04a",
      "fill-opacity": 0.22,
    },
  });
  map.addLayer({
    id: "hawk-parcels-line",
    type: "line",
    source: "hawk-parcels",
    paint: {
      "line-color": "#d4a04a",
      "line-width": 1.6,
    },
  });
  map.addSource("esri-sat", {
    type: "raster",
    tiles: [ESRI_IMAGERY],
    tileSize: 256,
    maxzoom: 19,
    attribution: "Esri",
  });
  const before = map
    .getStyle()
    .layers?.find((l) => l.type === "symbol" || l.id === "building-3d")?.id;
  map.addLayer(
    {
      id: "esri-sat",
      type: "raster",
      source: "esri-sat",
      layout: { visibility: "none" },
      paint: { "raster-opacity": 1, "raster-fade-duration": 240 },
    },
    before,
  );
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
      loaded: () => boolean;
      idle: () => boolean;
    };
  }
}

export function StreetMap({ site, onPickSite }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const pickRef = useRef(onPickSite);
  const locked = useRef(false);
  const [satellite, setSatellite] = useState(false);
  const satRef = useRef(false);
  pickRef.current = onPickSite;
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

      const ml = new MapLibreMap({
        container: host,
        style: STYLE_URL,
        center: START.center,
        zoom: START.zoom,
        pitch: START.pitch,
        bearing: START.bearing,
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

      ml.addControl(
        new AttributionControl({
          compact: true,
          customAttribution: "© OpenFreeMap © OpenMapTiles © OpenStreetMap",
        }),
        "bottom-right",
      );

      ml.on("load", () => {
        if (cancelled) return;
        addOverlays(ml, satRef.current);
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
        if (locked.current) return;
        pickRef.current(e.lngLat.lat, e.lngLat.lng);
      });

      window.__hawkMap = {
        jumpTo: (opts) => {
          ml.jumpTo({
            center: opts.center,
            zoom: opts.zoom,
            pitch: opts.pitch ?? 56,
            bearing: opts.bearing ?? -22,
          });
        },
        getZoom: () => ml.getZoom(),
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
    const map = mapRef.current;
    if (!map) return;
    applySatelliteMode(map, satellite);
  }, [satellite]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !site) return;
    locked.current = true;
    markerRef.current?.remove();
    const el = document.createElement("div");
    el.className = "site-pulse";
    el.title = site.name;
    markerRef.current = new Marker({ element: el, anchor: "center" })
      .setLngLat([site.lon, site.lat])
      .addTo(map);
    map.easeTo({
      center: [site.lon, site.lat],
      zoom: Math.max(map.getZoom(), 15.4),
      pitch: 58,
      duration: 700,
    });
  }, [site]);

  return (
    <div
      className="street-map-host"
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
        onClick={() => setSatellite((v) => !v)}
      >
        {satellite ? "STREET" : "SATELLITE"}
      </button>
    </div>
  );
}
