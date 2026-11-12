"use client";

import { useEffect, useRef } from "react";
import type { Viewer } from "cesium";
import { SATELLITES } from "@/lib/satellites";
import { LONDON, SAMPLE_PARCELS, parcelRing } from "@/lib/sites";
import { geodeticAt, satrecOf } from "@/lib/orbits";
import { propagate, gstime, eciToGeodetic, degreesLat, degreesLong } from "satellite.js";
import type { Phase, SatelliteId, Site } from "@/lib/types";

type Props = {
  phase: Phase;
  site: Site | null;
  selectedSat: SatelliteId | null;
  onPickSite: (lat: number, lon: number) => void;
  onPickSatellite: (id: SatelliteId) => void;
};

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

export function GlobeView({
  phase,
  site,
  selectedSat,
  onPickSite,
  onPickSatellite,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const cesiumRef = useRef<typeof import("cesium") | null>(null);
  const phaseRef = useRef(phase);
  const siteRef = useRef(site);
  const pickSite = useRef(onPickSite);
  const pickSat = useRef(onPickSatellite);
  const lastFly = useRef<string | null>(null);

  phaseRef.current = phase;
  siteRef.current = site;
  pickSite.current = onPickSite;
  pickSat.current = onPickSatellite;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let handler: { destroy: () => void } | null = null;
    let resizeObs: ResizeObserver | null = null;

    (async () => {
      window.CESIUM_BASE_URL = "/cesium/";
      const Cesium = await import("cesium");
      if (cancelled || !hostRef.current) return;
      cesiumRef.current = Cesium;
      Cesium.Ion.defaultAccessToken = "";
      Cesium.buildModuleUrl.setBaseUrl("/cesium/");

      const imagery = new Cesium.UrlTemplateImageryProvider({
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        subdomains: ["a", "b", "c", "d"],
        maximumLevel: 19,
        credit: "CARTO",
      });

      const viewer = new Cesium.Viewer(hostRef.current, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        shouldAnimate: true,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        baseLayer: new Cesium.ImageryLayer(imagery),
        msaaSamples: 4,
        creditContainer: document.createElement("div"),
      });
      viewerRef.current = viewer;

      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.globe.baseColor = Cesium.Color.BLACK;
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      viewer.scene.fog.enabled = true;
      viewer.scene.highDynamicRange = false;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 180;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 4.2e7;
      viewer.clock.shouldAnimate = true;
      viewer.clock.multiplier = 1;
      viewer.clock.currentTime = Cesium.JulianDate.now();

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(LONDON.lon, LONDON.lat, 14000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-89),
          roll: 0,
        },
      });

      for (const parcel of SAMPLE_PARCELS) {
        viewer.entities.add({
          id: `parcel-${parcel.id}`,
          name: parcel.name,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(
              parcelRing(parcel.lat, parcel.lon),
            ),
            material: Cesium.Color.fromCssColorString("#d4a04a").withAlpha(0.22),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString("#d4a04a"),
            height: 1,
            extrudedHeight: 18,
          },
        });
      }

      const now = new Date();
      for (const spec of SATELLITES) {
        const rec = satrecOf(spec);
        const orbit: ReturnType<typeof Cesium.Cartesian3.fromDegrees>[] = [];
        const periodMin = (2 * Math.PI) / rec.no;
        const samples = 180;
        for (let i = 0; i <= samples; i++) {
          const t = new Date(now.getTime() + (i / samples) * periodMin * 60 * 1000);
          const pv = propagate(rec, t);
          if (!pv.position) continue;
          const gd = eciToGeodetic(pv.position, gstime(t));
          orbit.push(
            Cesium.Cartesian3.fromDegrees(
              degreesLong(gd.longitude),
              degreesLat(gd.latitude),
              gd.height * 1000,
            ),
          );
        }

        viewer.entities.add({
          id: `orbit-${spec.id}`,
          polyline: {
            positions: orbit,
            width: 1.6,
            material: Cesium.Color.fromCssColorString(spec.color).withAlpha(0.55),
          },
          show: false,
        });

        viewer.entities.add({
          id: `sat-${spec.id}`,
          name: spec.name,
          position: new Cesium.CallbackProperty((time) => {
            const date = Cesium.JulianDate.toDate(time ?? viewer.clock.currentTime);
            const g = geodeticAt(spec, date);
            if (!g) return undefined;
            return Cesium.Cartesian3.fromDegrees(g.lon, g.lat, g.heightKm * 1000);
          }, false),
          billboard: {
            image: "/icons/satellite.svg",
            width: 36,
            height: 36,
            color: Cesium.Color.fromCssColorString(spec.color),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: spec.short,
            font: "11px IBM Plex Mono, monospace",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -28),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          show: false,
        });
      }

      handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click: { position: unknown }) => {
        const picked = viewer.scene.pick(click.position as never);
        const id: string | undefined = picked?.id?.id;
        if (id?.startsWith("sat-") && phaseRef.current !== "survey") {
          pickSat.current(id.replace("sat-", "") as SatelliteId);
          return;
        }
        if (phaseRef.current !== "survey") return;
        const cartesian = viewer.camera.pickEllipsoid(
          click.position as never,
          viewer.scene.globe.ellipsoid,
        );
        if (!cartesian) return;
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        pickSite.current(
          Cesium.Math.toDegrees(carto.latitude),
          Cesium.Math.toDegrees(carto.longitude),
        );
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      resizeObs = new ResizeObserver(() => viewer.resize());
      resizeObs.observe(hostRef.current);
    })();

    return () => {
      cancelled = true;
      handler?.destroy();
      resizeObs?.disconnect();
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || !site) return;
    if (lastFly.current === site.id) return;
    lastFly.current = site.id;

    const existing = viewer.entities.getById("active-parcel");
    if (existing) viewer.entities.remove(existing);
    viewer.entities.add({
      id: "active-parcel",
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(parcelRing(site.lat, site.lon, 200)),
        material: Cesium.Color.fromCssColorString("#d4a04a").withAlpha(0.45),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#f0d9a0"),
        height: 1,
        extrudedHeight: 36,
      },
    });

    for (const spec of SATELLITES) {
      const orbit = viewer.entities.getById(`orbit-${spec.id}`);
      const sat = viewer.entities.getById(`sat-${spec.id}`);
      if (orbit) orbit.show = true;
      if (sat) sat.show = true;
    }

    viewer.clock.multiplier = 48;
    viewer.clock.shouldAnimate = true;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 9_800_000),
      orientation: {
        heading: Cesium.Math.toRadians(18),
        pitch: Cesium.Math.toRadians(-38),
        roll: 0,
      },
      duration: 5.4,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }, [site]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;
    for (const spec of SATELLITES) {
      const sat = viewer.entities.getById(`sat-${spec.id}`);
      if (!sat?.billboard) continue;
      const active = selectedSat === spec.id;
      sat.billboard.scale = new Cesium.ConstantProperty(active ? 1.45 : 1);
      sat.billboard.color = new Cesium.ConstantProperty(
        Cesium.Color.fromCssColorString(active ? "#ffffff" : spec.color),
      );
    }
  }, [selectedSat]);

  return <div ref={hostRef} className="globe-host h-full w-full" />;
}
