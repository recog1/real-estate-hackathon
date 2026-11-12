import { NextRequest } from "next/server";
import { taskSatellite } from "@/lib/integrations/satellite";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const lat = Number(search.get("lat"));
  const lng = Number(search.get("lng"));
  const windowHours = Number(search.get("windowHours"));
  const payload = await taskSatellite({
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    windowHours: Number.isFinite(windowHours) && windowHours > 0 ? windowHours : undefined,
    collection: search.get("collection") ?? undefined,
  });
  return Response.json(payload);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    lat?: number;
    lng?: number;
    windowHours?: number;
    collection?: string;
  };
  const payload = await taskSatellite(body);
  return Response.json(payload);
}
