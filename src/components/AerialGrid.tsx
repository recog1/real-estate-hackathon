"use client";

import { AERIAL_HERO, AERIAL_MODEL_LINE, detStyle } from "@/lib/aerial";
import type { AerialDetection } from "@/lib/aerial";

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

export function AerialGrid() {
  const { image, src, label } = AERIAL_HERO;
  const n = image.detections.length;
  const { car, "truck/van": trucks, "house/building": dwellings } = image.counts;
  const vpd = dwellings ? (car + trucks) / dwellings : 0;

  return (
    <div data-aerial-grid="1" className="relative flex min-h-0 flex-1 flex-col bg-black">
      <svg
        viewBox={`0 0 ${image.width} ${image.height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
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
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-3 py-2">
        <div className="font-sans text-[11px] text-[var(--ink)]">
          Cars {car} · Trucks/vans {trucks} · Dwellings {dwellings} · Vehicles/dwelling{" "}
          {vpd.toFixed(2)} · {AERIAL_MODEL_LINE}
        </div>
      </div>
    </div>
  );
}
