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
console.log("copied cesium static assets → public/cesium");
