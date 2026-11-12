"use client";

import { useEffect, useRef, useState } from "react";
import type { Viewer } from "cesium";
import { cesiumIonToken } from "@/lib/cesium-ion";
import { FITZROVIA, parcelRingForSite, siteFromClick } from "@/lib/sites";
import type { Site } from "@/lib/types";

type CesiumNS = typeof import("cesium");

const MISSING_TOKEN = "Set NEXT_PUBLIC_CESIUM_ION_TOKEN to enable 3D";
const HEADING_DEG = 42;
const PITCH_DEG = -35;
const RANGE_M = 400;

function inspectSite(site: Site | null): Site {
  return site ?? siteFromClick(FITZROVIA.lat, FITZROVIA.lon);
}

function plotTarget(Cesium: CesiumNS, site: Site) {
  return Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 16);
}

function plotOffset(Cesium: CesiumNS) {
  return new Cesium.HeadingPitchRange(
    Cesium.Math.toRadians(HEADING_DEG),
    Cesium.Math.toRadians(PITCH_DEG),
    RANGE_M,
  );
}

function applyPlot(viewer: Viewer, Cesium: CesiumNS, site: Site) {
  const fill = viewer.entities.getById("plot-fill");
  if (fill) viewer.entities.remove(fill);
  const pin = viewer.entities.getById("plot-pin");
  if (pin) viewer.entities.remove(pin);

  viewer.entities.add({
    id: "plot-fill",
    polygon: {
      hierarchy: Cesium.Cartesian3.fromDegreesArray(parcelRingForSite(site)),
      material: Cesium.Color.fromCssColorString("#22c55e").withAlpha(0.22),
      classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
    },
  });
  viewer.entities.add({
    id: "plot-pin",
    position: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 28),
    point: {
      pixelSize: 12,
      color: Cesium.Color.fromCssColorString("#22c55e"),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}

function flyToPlot(viewer: Viewer, Cesium: CesiumNS, site: Site) {
  const target = plotTarget(Cesium, site);
  const offset = plotOffset(Cesium);
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  viewer.camera.cancelFlight();
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 1600),
    orientation: {
      heading: Cesium.Math.toRadians(HEADING_DEG),
      pitch: Cesium.Math.toRadians(-50),
      roll: 0,
    },
  });
  viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 90), {
    offset,
    duration: 1.8,
    complete: () => {
      viewer.camera.lookAt(target, offset);
    },
  });
}

type Props = {
  site: Site | null;
  onClose: () => void;
};

export function Site3DView({ site, onClose }: Props) {
  const token = cesiumIonToken();
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const siteRef = useRef(inspectSite(site));
  const [status, setStatus] = useState<"missing" | "loading" | "ready" | "error">(
    token ? "loading" : "missing",
  );
  siteRef.current = inspectSite(site);

  useEffect(() => {
    if (!token) return;
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let resizeObs: ResizeObserver | null = null;
    let onResize: (() => void) | null = null;

    (async () => {
      window.CESIUM_BASE_URL = "/cesium/";
      const Cesium = await import("cesium");
      if (cancelled || !hostRef.current) return;
      Cesium.Ion.defaultAccessToken = token;
      (
        Cesium.buildModuleUrl as typeof Cesium.buildModuleUrl & {
          setBaseUrl: (url: string) => void;
        }
      ).setBaseUrl("/cesium/");

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
        baseLayer: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        msaaSamples: 2,
        contextOptions: {
          webgl: {
            alpha: false,
            antialias: true,
            preserveDrawingBuffer: true,
          },
        },
      });
      if (cancelled) {
        viewer.destroy();
        return;
      }
      viewerRef.current = viewer;
      viewer.scene.globe.show = false;
      viewer.scene.globe.baseColor = Cesium.Color.BLACK;
      viewer.imageryLayers.removeAll();
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
      viewer.scene.fog.enabled = false;
      viewer.scene.highDynamicRange = false;
      const ctrl = viewer.scene.screenSpaceCameraController;
      ctrl.enableRotate = true;
      ctrl.enableTranslate = true;
      ctrl.enableZoom = true;
      ctrl.enableTilt = true;
      ctrl.enableLook = true;
      ctrl.minimumZoomDistance = 40;
      ctrl.maximumZoomDistance = 2500;
      viewer.scene.screenSpaceCameraController.inertiaSpin = 0.8;

      try {
        const tileset = await Cesium.createGooglePhotorealistic3DTileset();
        tileset.showCreditsOnScreen = true;
        if (cancelled || viewer.isDestroyed()) {
          tileset.destroy();
          return;
        }
        viewer.scene.globe.show = false;
        viewer.scene.primitives.add(tileset);
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }

      const current = siteRef.current;
      applyPlot(viewer, Cesium, current);
      flyToPlot(viewer, Cesium, current);
      if (!cancelled) setStatus("ready");
      host.setAttribute("data-tiles3d-cam", `${current.lat.toFixed(4)},${current.lon.toFixed(4)}`);

      onResize = () => {
        if (viewer.isDestroyed()) return;
        viewer.resize();
        viewer.scene.requestRender();
      };
      resizeObs = new ResizeObserver(onResize);
      resizeObs.observe(host);
      window.addEventListener("resize", onResize);
      requestAnimationFrame(onResize);
    })().catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      resizeObs?.disconnect();
      if (onResize) window.removeEventListener("resize", onResize);
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [token]);

  const blocked = status === "missing" || status === "error";
  const message = status === "error" ? "3D tiles could not be loaded" : MISSING_TOKEN;

  return (
    <div
      className="tiles-3d-host"
      data-tiles3d={status}
      data-tiles3d-site={siteRef.current.id}
      style={{ position: "absolute", inset: 0, background: "#07080b" }}
    >
      {token ? <div ref={hostRef} className="tiles-3d-canvas" /> : null}
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center font-sans text-[12px] text-[var(--ink)]">
          Loading 3D…
        </div>
      )}
      {blocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <p className="font-sans text-[12px] text-[var(--muted)]">{message}</p>
        </div>
      )}
      <button type="button" className="tiles-3d-back" onClick={onClose}>
        Back to map
      </button>
    </div>
  );
}
