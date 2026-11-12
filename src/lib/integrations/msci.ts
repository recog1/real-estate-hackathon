import sample from "@/data/msci-sample-comps.json";

export type MsciSource = "msci" | "sample";

export type MsciCompQuery = {
  lat: number;
  lng: number;
  radiusKm: number;
};

export type MsciComp = {
  id: string;
  name: string;
  address: string;
  assetType: string;
  lat: number;
  lng: number;
  saleDate: string;
  priceGbp: number;
  niyPct: number | null;
  glaSqft: number | null;
  tenants: string[];
  buyer: string | null;
  seller: string | null;
  distanceM: number;
};

export type MsciCompsResponse = {
  source: MsciSource;
  query: MsciCompQuery;
  retrieved: string;
  comps: MsciComp[];
};

const DEFAULT_QUERY: MsciCompQuery = {
  lat: 51.55636,
  lng: -0.00901,
  radiusKm: 4,
};

const RCA_URL =
  process.env.MSCI_API_URL ?? "https://api.msci.com/rca/v1/transactions";

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}

function asComp(raw: Record<string, unknown>, query: MsciCompQuery): MsciComp | null {
  const lat = num(raw.lat) ?? num(raw.latitude);
  const lng = num(raw.lng) ?? num(raw.lon) ?? num(raw.longitude);
  if (lat == null || lng == null) return null;
  const id = str(raw.id) ?? `${lat.toFixed(5)}-${lng.toFixed(5)}-${str(raw.saleDate) ?? "undated"}`;
  return {
    id,
    name: str(raw.name) ?? str(raw.property_name) ?? "Retail asset",
    address: str(raw.address) ?? "",
    assetType: str(raw.assetType) ?? str(raw.property_type) ?? "Retail",
    lat,
    lng,
    saleDate: str(raw.saleDate) ?? str(raw.sale_date) ?? "",
    priceGbp: num(raw.priceGbp) ?? num(raw.price) ?? num(raw.sale_price) ?? 0,
    niyPct: num(raw.niyPct) ?? num(raw.niy) ?? num(raw.cap_rate),
    glaSqft: num(raw.glaSqft) ?? num(raw.gla) ?? num(raw.area_sqft),
    tenants: Array.isArray(raw.tenants) ? raw.tenants.map(String) : [],
    buyer: str(raw.buyer),
    seller: str(raw.seller),
    distanceM: Math.round(haversineM(query.lat, query.lng, lat, lng)),
  };
}

function sampleComps(query: MsciCompQuery): MsciComp[] {
  const radiusM = query.radiusKm * 1000;
  const rows = sample.comps
    .map((row) => asComp(row as unknown as Record<string, unknown>, query))
    .filter((row): row is MsciComp => row != null)
    .filter((row) => row.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);
  return rows;
}

async function liveComps(query: MsciCompQuery, apiKey: string): Promise<MsciComp[]> {
  const url = new URL(RCA_URL);
  url.searchParams.set("lat", String(query.lat));
  url.searchParams.set("lng", String(query.lng));
  url.searchParams.set("radiusKm", String(query.radiusKm));
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`MSCI RCA ${res.status}`);
  }
  const body = (await res.json()) as unknown;
  const list = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { comps?: unknown }).comps)
      ? (body as { comps: unknown[] }).comps
      : body && typeof body === "object" && Array.isArray((body as { transactions?: unknown }).transactions)
        ? (body as { transactions: unknown[] }).transactions
        : [];
  return list
    .map((item) =>
      item && typeof item === "object" ? asComp(item as Record<string, unknown>, query) : null,
    )
    .filter((row): row is MsciComp => row != null)
    .sort((a, b) => a.distanceM - b.distanceM);
}

export function parseMsciQuery(search: URLSearchParams): MsciCompQuery {
  const lat = Number(search.get("lat"));
  const lng = Number(search.get("lng"));
  const radiusKm = Number(search.get("radiusKm") ?? search.get("radius"));
  return {
    lat: Number.isFinite(lat) ? lat : DEFAULT_QUERY.lat,
    lng: Number.isFinite(lng) ? lng : DEFAULT_QUERY.lng,
    radiusKm: Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : DEFAULT_QUERY.radiusKm,
  };
}

export async function getMsciComps(query: MsciCompQuery): Promise<MsciCompsResponse> {
  const apiKey = process.env.MSCI_API_KEY?.trim();
  if (apiKey) {
    try {
      const comps = await liveComps(query, apiKey);
      return {
        source: "msci",
        query,
        retrieved: new Date().toISOString().slice(0, 10),
        comps,
      };
    } catch {
      /* live RCA unavailable — serve the bundled Leyton set */
    }
  }
  return {
    source: "sample",
    query,
    retrieved: sample.retrieved,
    comps: sampleComps(query),
  };
}

export function formatGbp(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m`;
  if (n >= 1_000) return `£${Math.round(n / 1_000)}k`;
  return `£${n.toLocaleString("en-GB")}`;
}
