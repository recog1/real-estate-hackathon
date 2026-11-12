import { NextRequest } from "next/server";
import { getMsciComps, parseMsciQuery } from "@/lib/integrations/msci";

export async function GET(request: NextRequest) {
  const payload = await getMsciComps(parseMsciQuery(request.nextUrl.searchParams));
  return Response.json(payload);
}
