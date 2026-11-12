"use client";

import { AERIAL_MODEL_LINE, AERIAL_TILES, aerialTotals, detStyle } from "@/lib/aerial";
import type { AerialDetection, AerialImage } from "@/lib/aerial";

function DetectionMark({
  d,
  width,
  height,
  delayMs,
}: {
  d: AerialDetection;
  width: number;
  height: number;
  delayMs: number;
}) {
  const { color, stroke, fill, strokeOpacity } = detStyle(d.label);
  const label = `${d.label} ${Math.round(d.score * 100)}`;
  const style = { animationDelay: `${delayMs}ms` };
  const textX = d.polygon?.[0]?.[0] ?? d.bbox_norm[0] * width;
  const textY = Math.max(12, (d.polygon?.[0]?.[1] ?? d.bbox_norm[1] * height) - 3);

  return (
    <g className="hawk-det group" style={style}>
      {d.polygon && d.polygon.length >= 3 ? (
        <polygon
          points={d.polygon.map((pt) => `${pt[0]},${pt[1]}`).join(" ")}
          fill={color}
          fillOpacity={fill}
          stroke={color}
          strokeOpacity={strokeOpacity}
          strokeWidth={stroke}
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <rect
          x={d.bbox_norm[0] * width}
          y={d.bbox_norm[1] * height}
          width={d.bbox_norm[2] * width}
          height={d.bbox_norm[3] * height}
          fill={color}
          fillOpacity={fill}
          stroke={color}
          strokeOpacity={strokeOpacity}
          strokeWidth={stroke}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <text
        x={textX}
        y={textY}
        fill={color}
        fontSize={11}
        fontFamily="Inter, sans-serif"
        className="pointer-events-none opacity-0 group-hover:opacity-100"
      >
        {label}
      </text>
    </g>
  );
}

function AerialTile({
  code,
  label,
  src,
  image,
}: {
  code: string;
  label: string;
  src: string;
  image: AerialImage;
}) {
  const n = image.detections.length;
  const { car, "truck/van": trucks, "house/building": dwellings } = image.counts;

  return (
    <div className="relative min-h-0 overflow-hidden border border-[var(--line)] bg-black">
      <svg
        viewBox={`0 0 ${image.width} ${image.height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`${label} detections`}
      >
        <image href={src} width={image.width} height={image.height} />
        {image.detections.map((d, i) => (
          <DetectionMark
            key={`${d.label}-${d.bbox.join(",")}-${d.score}`}
            d={d}
            width={image.width}
            height={image.height}
            delayMs={n > 1 ? (i / (n - 1)) * 1000 : 0}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-2 pb-6 pt-2">
        <div className="flex items-center gap-2 font-sans text-[10px] tracking-[0.16em] text-[var(--accent)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--cyan)]" />
          {code} · {label}
        </div>
        <div className="mt-1 font-sans text-[10px] leading-snug text-[var(--ink)]">
          Cars {car} · Trucks/vans {trucks} · Dwellings {dwellings} · Vehicles/dwelling{" "}
          {image.cars_per_dwelling.toFixed(2)}
        </div>
        <div className="font-sans text-[9px] tracking-[0.08em] text-[var(--cyan)]">
          {AERIAL_MODEL_LINE}
        </div>
      </div>
    </div>
  );
}

export function AerialGrid() {
  const totals = aerialTotals();
  const vpd = totals.dwellings
    ? (totals.cars + totals.trucks) / totals.dwellings
    : 0;

  return (
    <div data-aerial-grid="1" className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-3 py-1.5">
        <div className="font-sans text-[10px] tracking-[0.16em] text-[var(--accent)]">
          ILLUSTRATIVE DETECTION RUN (REAL MODEL OUTPUT, SAMPLE IMAGERY)
        </div>
        <div className="font-sans text-[9px] text-[var(--muted)]">
          CARS {totals.cars} · TRUCKS/VANS {totals.trucks} · DWELLINGS {totals.dwellings} · V/D{" "}
          {vpd.toFixed(2)}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-px bg-[var(--line)]">
        {AERIAL_TILES.map((tile) => (
          <AerialTile
            key={tile.id}
            code={tile.code}
            label={tile.label}
            src={tile.src}
            image={tile.image}
          />
        ))}
      </div>
    </div>
  );
}
