import type { ZoneSpec } from "./types";

export const ZONES: ZoneSpec[] = [
  {
    id: "a",
    code: "Z-N",
    label: "North courtyard",
    video: "/videos/zone-a.mp4",
    detections: "/detections/zone-a.json",
  },
  {
    id: "b",
    code: "Z-E",
    label: "East street grid",
    video: "/videos/zone-b.mp4",
    detections: "/detections/zone-b.json",
  },
  {
    id: "c",
    code: "Z-W",
    label: "West terrace",
    video: "/videos/zone-c.mp4",
    detections: "/detections/zone-c.json",
  },
  {
    id: "d",
    code: "Z-S",
    label: "South car park",
    video: "/videos/zone-d.mp4",
    detections: "/detections/zone-d.json",
  },
];
