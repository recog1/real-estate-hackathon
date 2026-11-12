import raw from "@/data/detections.json";

export type AerialLabel = "car" | "truck/van" | "house/building" | "person";

export type AerialDetection = {
  label: string;
  score: number;
  bbox: number[];
  bbox_norm: number[];
  polygon?: number[][];
  source: string;
};

export type AerialImage = {
  file: string;
  file_bw: string;
  width: number;
  height: number;
  models_used: string[];
  counts: {
    car: number;
    "truck/van": number;
    person: number;
    "house/building": number;
  };
  cars_per_dwelling: number;
  detections: AerialDetection[];
};

export type AerialRun = {
  generated: string;
  models: Record<string, string>;
  images: AerialImage[];
};

export const AERIAL_RUN = raw as unknown as AerialRun;

export const AERIAL_MODEL_LINE = "YOLO11m-OBB (DOTA) + OWLv2";

export const AERIAL_TILES = AERIAL_RUN.images.map((image, index) => ({
  id: ["a", "b", "c", "d"][index] as "a" | "b" | "c" | "d",
  code: `T-${index + 1}`,
  label: `Aerial ${index + 1}`,
  src: `/intel/${image.file_bw}`,
  image,
}));

/** Aerial-4 — most detections; used as the single intel photo. */
export const AERIAL_HERO =
  AERIAL_TILES.find((t) => t.image.file === "aerial-4.jpg") ?? AERIAL_TILES[3]!;

export function aerialTotals() {
  const image = AERIAL_HERO.image;
  return {
    cars: image.counts.car,
    trucks: image.counts["truck/van"],
    dwellings: image.counts["house/building"],
  };
}

export function detStyle(label: string): {
  color: string;
  stroke: number;
  fill: number;
  strokeOpacity: number;
} {
  if (label === "car") {
    return { color: "#ff2d2d", stroke: 1.7, fill: 0.16, strokeOpacity: 1 };
  }
  if (label === "truck/van") {
    return { color: "#9a1010", stroke: 1.7, fill: 0.16, strokeOpacity: 1 };
  }
  return { color: "#ff2d2d", stroke: 0.7, fill: 0.04, strokeOpacity: 0.45 };
}
