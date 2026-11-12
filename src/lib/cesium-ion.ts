export function cesiumIonToken(): string | null {
  const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
  if (typeof token !== "string") return null;
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
}
