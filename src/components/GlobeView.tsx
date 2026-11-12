"use client";

import { useEffect, useRef } from "react";
import type { Viewer } from "cesium";
import { SATELLITES } from "@/lib/satellites";
import { LONDON, parcelRingForSite } from "@/lib/sites";
import { demoOrbitSamples, demoSatOverSite } from "@/lib/orbits";
import type { Phase, SatelliteId, Site } from "@/lib/types";

type CesiumNS = typeof import("cesium");

type Props = {
  phase: Phase;
  site: Site | null;
  selectedSat: SatelliteId | null;
  onPickSite: (lat: number, lon: number) => void;
  onPickSatellite: (id: SatelliteId) => void;
  onNadirLocked?: () => void;
};

const ORBIT_HEIGHT_M = 1_650_000;
/** ~1.1 km nadir — 250 m block fills a good part of Esri World Imagery. */
const SITE_HEIGHT_M = 1_100;

function nadirView(Cesium: CesiumNS, lon: number, lat: number, heightM: number) {
  return {
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, heightM),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
  };
}

function applySiteEntities(
  viewer: Viewer,
  Cesium: CesiumNS,
  site: Site,
) {
  const existing = viewer.entities.getById("active-parcel");
  if (existing) viewer.entities.remove(existing);
  const pin = viewer.entities.getById("active-pin");
  if (pin) viewer.entities.remove(pin);

  viewer.entities.add({
    id: "active-parcel",
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray(parcelRingForSite(site)),
      material: Cesium.Color.fromCssColorString("#22c55e").withAlpha(0.15),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString("#22c55e"),
      height: 1,
      extrudedHeight: 24,
    },
  });
  viewer.entities.add({
    id: "active-pin",
    position: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 40),
    billboard: {
      image: "/icons/satellite.svg",
      width: 1,
      height: 1,
      color: Cesium.Color.TRANSPARENT,
    },
    point: {
      pixelSize: 14,
      color: Cesium.Color.fromCssColorString("#22c55e"),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}

function applyDemoOrbits(viewer: Viewer, Cesium: CesiumNS, site: Site) {
  for (const spec of SATELLITES) {
    const samples = demoOrbitSamples(spec, site.lat, site.lon);
    const positions = samples.map((g) =>
      Cesium.Cartesian3.fromDegrees(g.lon, g.lat, g.heightKm * 1000),
    );
    const orbit = viewer.entities.getById(`orbit-${spec.id}`);
    if (orbit?.polyline) {
      orbit.polyline.positions = new Cesium.ConstantProperty(positions);
      orbit.show = true;
    }
    const sat = viewer.entities.getById(`sat-${spec.id}`);
    if (sat) sat.show = true;
  }
}

function launchOrbit(
  viewer: Viewer,
  Cesium: CesiumNS,
  site: Site,
  host: HTMLDivElement | null,
) {
  applySiteEntities(viewer, Cesium, site);
  applyDemoOrbits(viewer, Cesium, site);

  viewer.trackedEntity = undefined;
  viewer.selectedEntity = undefined;
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  viewer.clock.shouldAnimate = false;
  viewer.clock.multiplier = 0;

  host?.removeAttribute("data-orbit-settled");
  viewer.camera.cancelFlight();
  const start = nadirView(Cesium, site.lon, site.lat, 90_000);
  viewer.camera.setView(start);
  viewer.camera.flyTo({
    ...nadirView(Cesium, site.lon, site.lat, ORBIT_HEIGHT_M),
    duration: 2.4,
    complete: () => {
      host?.setAttribute("data-orbit-settled", "1");
    },
  });
  const ctrl = viewer.scene.screenSpaceCameraController;
  ctrl.enableRotate = false;
  ctrl.enableTranslate = false;
  ctrl.enableTilt = false;
  ctrl.enableLook = false;
  ctrl.inertiaSpin = 0;
  ctrl.inertiaTranslate = 0;
  ctrl.inertiaZoom = 0;
  ctrl.enableCollisionDetection = false;
}

function diveToSite(
  viewer: Viewer,
  Cesium: CesiumNS,
  site: Site,
  onDone: () => void,
) {
  viewer.camera.cancelFlight();
  viewer.trackedEntity = undefined;
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  viewer.camera.flyTo({
    ...nadirView(Cesium, site.lon, site.lat, SITE_HEIGHT_M),
    duration: 2.2,
    complete: onDone,
  });
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
  onNadirLocked,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const cesiumRef = useRef<typeof import("cesium") | null>(null);
  const phaseRef = useRef(phase);
  const siteRef = useRef(site);
  const pickSite = useRef(onPickSite);
  const pickSat = useRef(onPickSatellite);
  const nadirLocked = useRef(onNadirLocked);
  const lastFly = useRef<string | null>(null);
  const lastDive = useRef<string | null>(null);

  phaseRef.current = phase;
  siteRef.current = site;
  pickSite.current = onPickSite;
  pickSat.current = onPickSatellite;
  nadirLocked.current = onNadirLocked;

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
        shouldAnimate: false,
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
      viewer.clock.shouldAnimate = false;
      viewer.clock.multiplier = 0;
      viewer.clock.currentTime = Cesium.JulianDate.now();
      viewer.trackedEntity = undefined;
      viewer.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
      );
      viewer.scene.preUpdate.addEventListener(() => {
        if (viewer.trackedEntity) viewer.trackedEntity = undefined;
      });

      viewer.camera.setView(nadirView(Cesium, LONDON.lon, LONDON.lat, 180_000));
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

      for (const spec of SATELLITES) {
        viewer.entities.add({
          id: `orbit-${spec.id}`,
          polyline: {
            positions: [],
            width: 1.6,
            material: Cesium.Color.fromCssColorString(spec.color).withAlpha(0.7),
          },
          show: false,
        });

        viewer.entities.add({
          id: `sat-${spec.id}`,
          name: spec.name,
          position: new Cesium.CallbackPositionProperty(() => {
            const current = siteRef.current;
            if (!current) return undefined;
            const g = demoSatOverSite(spec, current.lat, current.lon);
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
    lastDive.current = null;
    launchOrbit(viewer, Cesium, site, hostRef.current);
  }, [site]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    const current = siteRef.current;
    if (!viewer || !Cesium || !current) return;

    const setSatVisible = (show: boolean) => {
      for (const spec of SATELLITES) {
        const orbit = viewer.entities.getById(`orbit-${spec.id}`);
        const sat = viewer.entities.getById(`sat-${spec.id}`);
        if (orbit) orbit.show = show;
        if (sat) sat.show = show;
      }
    };

    if (phase === "orbit" && selectedSat) {
      const key = `${current.id}:${selectedSat}`;
      if (lastDive.current === key) return;
      lastDive.current = key;
      setSatVisible(false);
      viewer.scene.globe.maximumScreenSpaceError = 1.1;
      diveToSite(viewer, Cesium, current, () => {
        hostRef.current?.setAttribute("data-nadir-locked", "1");
        nadirLocked.current?.();
      });
      return;
    }

    if (phase === "orbit" && !selectedSat && lastDive.current) {
      lastDive.current = null;
      hostRef.current?.removeAttribute("data-nadir-locked");
      setSatVisible(true);
      viewer.scene.globe.maximumScreenSpaceError = 2;
      viewer.camera.cancelFlight();
      viewer.camera.flyTo({
        ...nadirView(Cesium, current.lon, current.lat, ORBIT_HEIGHT_M),
        duration: 1.6,
      });
    }
  }, [selectedSat, phase]);

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
