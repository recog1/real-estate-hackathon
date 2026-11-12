"use client";

import { useEffect, useRef } from "react";
import type { Viewer } from "cesium";
import { SATELLITES } from "@/lib/satellites";
import { LONDON, parcelRing } from "@/lib/sites";
import { geodeticAt, satrecOf } from "@/lib/orbits";
import { propagate, gstime, eciToGeodetic, degreesLat, degreesLong } from "satellite.js";
import type { Phase, SatelliteId, Site } from "@/lib/types";

type CesiumNS = typeof import("cesium");

type Props = {
  phase: Phase;
  site: Site | null;
  selectedSat: SatelliteId | null;
  onPickSite: (lat: number, lon: number) => void;
  onPickSatellite: (id: SatelliteId) => void;
};

const ORBIT_HEADING = 42;
const ORBIT_PITCH = -60;
const ORBIT_RANGE_MIN = 6_000_000;
const ORBIT_RANGE_MAX = 9_000_000;

function framedCameraPose(Cesium: CesiumNS, site: Site, viewer: Viewer) {
  const sitePos = Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 0);
  const now = Cesium.JulianDate.toDate(viewer.clock.currentTime);
  const pts = [sitePos];
  for (const spec of SATELLITES) {
    const g = geodeticAt(spec, now);
    if (!g) continue;
    pts.push(Cesium.Cartesian3.fromDegrees(g.lon, g.lat, g.heightKm * 1000));
  }
  const sphere = Cesium.BoundingSphere.fromPoints(pts);
  const range = Cesium.Math.clamp(
    Math.max(ORBIT_RANGE_MIN, sphere.radius * 1.15),
    ORBIT_RANGE_MIN,
    ORBIT_RANGE_MAX,
  );
  const heading = Cesium.Math.toRadians(ORBIT_HEADING);
  const pitch = Cesium.Math.toRadians(ORBIT_PITCH);
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(sitePos);
  const local = new Cesium.Cartesian3(
    range * Math.cos(pitch) * Math.sin(heading),
    range * Math.cos(pitch) * Math.cos(heading),
    -range * Math.sin(pitch),
  );
  const destination = Cesium.Matrix4.multiplyByPoint(
    enu,
    local,
    new Cesium.Cartesian3(),
  );
  const direction = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.subtract(sitePos, destination, new Cesium.Cartesian3()),
    new Cesium.Cartesian3(),
  );
  const right = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.cross(direction, Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3()),
    new Cesium.Cartesian3(),
  );
  const up = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3()),
    new Cesium.Cartesian3(),
  );
  return { destination, direction, up, range };
}

function launchOrbit(
  viewer: Viewer,
  Cesium: CesiumNS,
  site: Site,
  host: HTMLDivElement | null,
) {
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

  viewer.trackedEntity = undefined;
  viewer.selectedEntity = undefined;
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  viewer.clock.multiplier = 8;
  viewer.clock.shouldAnimate = true;

  const pose = framedCameraPose(Cesium, site, viewer);
  host?.removeAttribute("data-orbit-settled");
  viewer.camera.cancelFlight();
  // Pre-frame on London so the street-map cross-fade reveals an already-set
  // orbital view instead of cutting to a 160 km jump.
  viewer.camera.setView({
    destination: pose.destination,
    orientation: { direction: pose.direction, up: pose.up },
  });
  holdFramedView(viewer, Cesium, site);
  viewer.clock.multiplier = 8;
  host?.setAttribute("data-orbit-settled", "1");
}

function holdFramedView(viewer: Viewer, Cesium: CesiumNS, site: Site) {
  viewer.trackedEntity = undefined;
  viewer.selectedEntity = undefined;
  viewer.camera.cancelFlight();
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  const pose = framedCameraPose(Cesium, site, viewer);
  viewer.camera.setView({
    destination: pose.destination,
    orientation: { direction: pose.direction, up: pose.up },
  });
  const ctrl = viewer.scene.screenSpaceCameraController;
  ctrl.inertiaSpin = 0;
  ctrl.inertiaTranslate = 0;
  ctrl.inertiaZoom = 0;
  ctrl.enableCollisionDetection = false;
}

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
    __hawkHeight?: () => number;
    __hawkCam?: () => { lon: number; lat: number; h: number };
    __hawkGlobeBox?: () => {
      w: number;
      h: number;
      top: number;
      left: number;
      vw: number;
      vh: number;
    };
    __hawkDebug?: () => {
      pendingTiles: number;
      tilesLoaded: boolean;
      layers: number;
      satAlpha: number;
      height: number;
    };
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
    let handler: InstanceType<CesiumNS["ScreenSpaceEventHandler"]> | null = null;
    let resizeObs: ResizeObserver | null = null;
    let onResize: (() => void) | null = null;

    const waitForSize = (el: HTMLElement) =>
      new Promise<void>((resolve) => {
        if (el.clientWidth > 8 && el.clientHeight > 8) {
          resolve();
          return;
        }
        const ro = new ResizeObserver(() => {
          if (el.clientWidth > 8 && el.clientHeight > 8) {
            ro.disconnect();
            resolve();
          }
        });
        ro.observe(el);
      });

    (async () => {
      window.CESIUM_BASE_URL = "/cesium/";
      await waitForSize(host);
      if (cancelled) return;
      const Cesium = await import("cesium");
      if (cancelled || !hostRef.current) return;
      cesiumRef.current = Cesium;
      Cesium.Ion.defaultAccessToken = "";
      (
        Cesium.buildModuleUrl as typeof Cesium.buildModuleUrl & {
          setBaseUrl: (url: string) => void;
        }
      ).setBaseUrl("/cesium/");

      const satellite = new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        maximumLevel: 19,
        tileWidth: 256,
        tileHeight: 256,
        enablePickFeatures: false,
        credit: "",
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
        requestRenderMode: false,
        useBrowserRecommendedResolution: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        baseLayer: new Cesium.ImageryLayer(satellite),
        msaaSamples: 1,
        creditContainer: document.createElement("div"),
        contextOptions: {
          webgl: {
            alpha: false,
            antialias: true,
            preserveDrawingBuffer: true,
          },
        },
      });
      viewerRef.current = viewer;
      viewer.resolutionScale = 1;
      viewer.scene.globe.maximumScreenSpaceError = 2;
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.showGroundAtmosphere = true;
      const skyAtmosphere = viewer.scene.skyAtmosphere;
      if (skyAtmosphere) skyAtmosphere.show = true;
      viewer.scene.globe.baseColor = Cesium.Color.BLACK;
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      viewer.scene.fog.enabled = true;
      viewer.scene.highDynamicRange = false;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 180;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 4.2e7;
      viewer.clock.shouldAnimate = true;
      viewer.clock.multiplier = 1;
      viewer.clock.currentTime = Cesium.JulianDate.now();
      viewer.trackedEntity = undefined;
      viewer.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
      );
      viewer.scene.preUpdate.addEventListener(() => {
        if (viewer.trackedEntity) viewer.trackedEntity = undefined;
      });

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(LONDON.lon, LONDON.lat, 180_000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-70),
          roll: 0,
        },
      });
      window.__hawkHeight = () => viewer.camera.positionCartographic.height;
      window.__hawkCam = () => {
        const c = viewer.camera.positionCartographic;
        return {
          lon: Cesium.Math.toDegrees(c.longitude),
          lat: Cesium.Math.toDegrees(c.latitude),
          h: c.height,
        };
      };
      const pending = siteRef.current;

      const now = new Date();
      for (const spec of SATELLITES) {
        const rec = satrecOf(spec);
        const orbit: ReturnType<typeof Cesium.Cartesian3.fromDegrees>[] = [];
        const periodMin = (2 * Math.PI) / rec.no;
        const samples = 180;
        for (let i = 0; i <= samples; i++) {
          const t = new Date(now.getTime() + (i / samples) * periodMin * 60 * 1000);
          const pv = propagate(rec, t);
          if (!pv?.position) continue;
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
          position: new Cesium.CallbackPositionProperty((time) => {
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
            font: "12px Inter, sans-serif",
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
        if (phaseRef.current === "survey") return;
        const picked = viewer.scene.pick(click.position as never);
        const id: string | undefined = picked?.id?.id;
        if (id?.startsWith("sat-")) {
          viewer.trackedEntity = undefined;
          pickSat.current(id.replace("sat-", "") as SatelliteId);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      onResize = () => {
        viewer.resize();
        viewer.scene.requestRender();
        const box = hostRef.current?.getBoundingClientRect();
        if (box) {
          hostRef.current?.setAttribute("data-globe-w", String(Math.round(box.width)));
          hostRef.current?.setAttribute("data-globe-h", String(Math.round(box.height)));
        }
      };
      resizeObs = new ResizeObserver(onResize);
      resizeObs.observe(hostRef.current);
      window.addEventListener("resize", onResize);
      requestAnimationFrame(onResize);
      window.setTimeout(onResize, 80);
      window.__hawkGlobeBox = () => {
        const box = hostRef.current?.getBoundingClientRect();
        return {
          w: box?.width ?? 0,
          h: box?.height ?? 0,
          top: box?.top ?? 0,
          left: box?.left ?? 0,
          vw: window.innerWidth,
          vh: window.innerHeight,
        };
      };
      if (pending && lastFly.current !== pending.id) {
        lastFly.current = pending.id;
        launchOrbit(viewer, Cesium, pending, hostRef.current);
      }
    })();

    return () => {
      cancelled = true;
      handler?.destroy();
      resizeObs?.disconnect();
      if (onResize) window.removeEventListener("resize", onResize);
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    const host = hostRef.current;
    if (!viewer || !host) return;
    const run = () => {
      viewer.resize();
      viewer.scene.requestRender();
      const box = host.getBoundingClientRect();
      host.setAttribute("data-globe-w", String(Math.round(box.width)));
      host.setAttribute("data-globe-h", String(Math.round(box.height)));
    };
    run();
    const a = requestAnimationFrame(run);
    const t = window.setTimeout(run, 60);
    const t2 = window.setTimeout(run, 320);
    return () => {
      cancelAnimationFrame(a);
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [phase]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || !site) return;
    if (lastFly.current === site.id) return;
    lastFly.current = site.id;
    launchOrbit(viewer, Cesium, site, hostRef.current);
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

  return (
    <div
      ref={hostRef}
      className="globe-host"
      data-globe-full="1"
      style={{
        position: "absolute",
        inset: 0,
        width: "100vw",
        height: "100vh",
        minWidth: "100vw",
        minHeight: "100vh",
      }}
    />
  );
}
