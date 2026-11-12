import raw from "@/data/site-detections.json";

export type AerialLabel = "car" | "truck/van" | "building" | "person";

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
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center?: [number, number];
  size_m?: number;
  models_used: string[];
  counts: {
    car: number;
    "truck/van": number;
    person: number;
    building: number;
  };
  cars_per_building?: number;
  detections: AerialDetection[];
};

export type AerialRun = {
  models: Record<string, string>;
  imagery?: {
    source: string;
    attribution: string;
  };
  images: AerialImage[];
};

export const AERIAL_RUN = raw as unknown as AerialRun;

export const AERIAL_MODEL_LINE = "YOLO11m-OBB (DOTA) + OWLv2";

export const AERIAL_ATTRIBUTION = "Imagery: Esri, Maxar, Earthstar Geographics";

const heroImage = AERIAL_RUN.images[0]!;

export const AERIAL_HERO = {
  id: "oxford" as const,
  code: "T-1",
  label: "Oxford Circus",
  src: `/intel/${heroImage.file_bw}`,
  image: heroImage,
};

export function aerialTotals() {
  const { counts } = AERIAL_HERO.image;
  return {
    cars: counts.car,
    trucks: counts["truck/van"],
    buildings: counts.building,
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
