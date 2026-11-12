import fs from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "node_modules/cesium/Build/Cesium");
const dest = path.join(process.cwd(), "public/cesium");

if (!fs.existsSync(src)) {
  console.warn("cesium not installed — skip asset copy");
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const dir of ["Workers", "ThirdParty", "Assets", "Widgets"]) {
  fs.cpSync(path.join(src, dir), path.join(dest, dir), { recursive: true });
}
for (const file of ["Cesium.js", "index.js", "index.cjs"]) {
  const from = path.join(src, file);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(dest, file));
}
console.log("copied cesium static assets → public/cesium");

const ml = path.join(process.cwd(), "node_modules/maplibre-gl/dist");
const pub = path.join(process.cwd(), "public");
if (fs.existsSync(path.join(ml, "maplibre-gl.css"))) {
  fs.copyFileSync(path.join(ml, "maplibre-gl.css"), path.join(pub, "maplibre-gl.css"));
}
if (fs.existsSync(path.join(ml, "maplibre-gl-worker.mjs"))) {
  fs.copyFileSync(
    path.join(ml, "maplibre-gl-worker.mjs"),
    path.join(pub, "maplibre-gl-worker.mjs"),
  );
}
console.log("copied maplibre css + worker → public/");
