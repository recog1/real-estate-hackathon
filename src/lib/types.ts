export type Phase = "survey" | "orbit" | "confirm" | "tasking" | "intel";

export type Site = {
  id: string;
  name: string;
  borough: string;
  lat: number;
  lon: number;
  units: number;
  sellerOccupancy: number;
  claimedRentRoll: string;
};

export type SatelliteId =
  | "wv3"
  | "pneo3"
  | "skysat-c1"
  | "skysat-a"
  | "s2a"
  | "l9";

export type SatelliteSpec = {
  id: SatelliteId;
  name: string;
  short: string;
  operator: string;
  resolution: string;
  resolutionM: number;
  band: string;
  tle1: string;
  tle2: string;
  color: string;
  vhr: boolean;
};

export type NextPass = {
  time: Date;
  elevationDeg: number;
  offNadirDeg: number;
  rangeKm: number;
};

export type DetectClass = "house" | "car" | "person";

export type Box = {
  id: string;
  cls: DetectClass;
  x: number;
  y: number;
  w: number;
  h: number;
  conf: number;
};

export type DetectionFrame = {
  t: number;
  boxes: Box[];
};

export type DetectionTrack = {
  zone: string;
  duration: number;
  frames: DetectionFrame[];
};

export type ZoneId = "a" | "b" | "c" | "d";

export type ZoneSpec = {
  id: ZoneId;
  code: string;
  label: string;
  video: string;
  detections: string;
};

export type ChatRole = "user" | "agent" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  cite?: string;
};
