import { NextRequest } from "next/server";
import { searchSatelliteScenes } from "@/lib/integrations/satellite";

export async function GET(request: NextRequest) {
  const payload = await searchSatelliteScenes(request.nextUrl.searchParams);
  return Response.json(payload);
}
