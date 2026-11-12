import capture from "@/data/competitor-capture.json";

export type SatelliteSource = "live" | "sample";

export type SatellitePoint = {
  lat: number;
  lng: number;
};

export type SatelliteScene = {
  id: string;
  provider: string;
  capturedAt: string | null;
  gsdM: number | null;
  cloudPct: number | null;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  imageUrl: string;
  annotatedUrl: string;
  detectionsUrl: string;
  width: number;
  height: number;
  vehicles: number | null;
  cars: number | null;
  vans: number | null;
  bays: number | null;
  fillPct: number | null;
};

export type SatelliteTaskRequest = SatellitePoint & {
  windowHours?: number;
  collection?: string;
};

export type SatelliteTaskResponse = {
  source: SatelliteSource;
  requestId: string;
  status: "queued" | "delivered";
  scene: SatelliteScene;
};

export type SatelliteScenesResponse = {
  source: SatelliteSource;
  query: SatellitePoint & { radiusKm: number };
  scenes: SatelliteScene[];
};

const ASDA = {
  lat: capture.site.lat,
  lng: capture.site.lng,
};

function sampleScene(): SatelliteScene {
  const img = capture.images[0];
  return {
    id: "asda-leyton-mills-esri-z19",
    provider: "Esri World Imagery (Maxar / Earthstar Geographics)",
    capturedAt: null,
    gsdM: 0.19,
    cloudPct: null,
    bounds: capture.bounds,
    imageUrl: "/competitor/supermarket-bw.jpg",
    annotatedUrl: "/competitor/annotated.jpg",
    detectionsUrl: "/competitor/detections.json",
    width: img.width,
    height: img.height,
    vehicles: img.counts.vehicles,
    cars: img.counts.car,
    vans: img.counts["truck/van"],
    bays: img.bays.estimate,
    fillPct: img.occupancy.fill_pct_rounded,
  };
}

function parsePoint(input: Partial<SatellitePoint> | URLSearchParams): SatellitePoint {
  if (input instanceof URLSearchParams) {
    const lat = Number(input.get("lat"));
    const lng = Number(input.get("lng"));
    return {
      lat: Number.isFinite(lat) ? lat : ASDA.lat,
      lng: Number.isFinite(lng) ? lng : ASDA.lng,
    };
  }
  return {
    lat: typeof input.lat === "number" && Number.isFinite(input.lat) ? input.lat : ASDA.lat,
    lng: typeof input.lng === "number" && Number.isFinite(input.lng) ? input.lng : ASDA.lng,
  };
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function liveScenes(
  query: SatellitePoint & { radiusKm: number },
  apiUrl: string,
  apiKey: string,
): Promise<SatelliteScene[]> {
  const url = new URL(joinUrl(apiUrl, "scenes"));
  url.searchParams.set("lat", String(query.lat));
  url.searchParams.set("lng", String(query.lng));
  url.searchParams.set("radiusKm", String(query.radiusKm));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Satellite scenes ${res.status}`);
  const body = (await res.json()) as { scenes?: SatelliteScene[] } | SatelliteScene[];
  return Array.isArray(body) ? body : (body.scenes ?? []);
}

async function liveTask(
  request: SatelliteTaskRequest,
  apiUrl: string,
  apiKey: string,
): Promise<SatelliteTaskResponse> {
  const url = new URL(joinUrl(apiUrl, "task"));
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Satellite task ${res.status}`);
  return (await res.json()) as SatelliteTaskResponse;
}

export async function searchSatelliteScenes(
  search: URLSearchParams,
): Promise<SatelliteScenesResponse> {
  const point = parsePoint(search);
  const radiusKmRaw = Number(search.get("radiusKm") ?? search.get("radius") ?? 3);
  const query = {
    ...point,
    radiusKm: Number.isFinite(radiusKmRaw) && radiusKmRaw > 0 ? radiusKmRaw : 3,
  };
  const apiKey = process.env.SATELLITE_API_KEY?.trim();
  const apiUrl = process.env.SATELLITE_API_URL?.trim();
  if (apiKey && apiUrl) {
    try {
      const scenes = await liveScenes(query, apiUrl, apiKey);
      return { source: "live", query, scenes };
    } catch {
      /* provider unavailable — ASDA capture */
    }
  }
  return { source: "sample", query, scenes: [sampleScene()] };
}

export async function taskSatellite(
  body: Partial<SatelliteTaskRequest>,
): Promise<SatelliteTaskResponse> {
  const request: SatelliteTaskRequest = {
    ...parsePoint(body),
    windowHours: body.windowHours,
    collection: body.collection,
  };
  const apiKey = process.env.SATELLITE_API_KEY?.trim();
  const apiUrl = process.env.SATELLITE_API_URL?.trim();
  if (apiKey && apiUrl) {
    try {
      const live = await liveTask(request, apiUrl, apiKey);
      return { ...live, source: "live" };
    } catch {
      /* provider unavailable — ASDA capture */
    }
  }
  const scene = sampleScene();
  return {
    source: "sample",
    requestId: `sample-${scene.id}`,
    status: "delivered",
    scene,
  };
}
