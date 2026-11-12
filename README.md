# Asset Hawk

Asset Hawk is orbital occupancy intelligence for real estate: it uses satellite imagery and computer vision to check what a competitor or asset is actually doing on the ground, then compares that observation with figures in the documents. This repo is the Grok Bot Real Estate Hackathon London (12 Nov 2026) demo. The shipped walkthrough is **Watch a competitor** on **ASDA Leyton Mills Superstore**, Marshall Road, Leyton E10 5NH. A precomputed satellite capture detects **167 vehicles (154 cars, 13 vans)** against about **917 bays**, so **18% fill**. Illustrative documents, extracted with V7 Go, report **11% utilisation** (about 100 cars at midday). The in-app verdict is: *Traffic understated: observed 18% vs reported 11%, about 60% more vehicles than reported.*

## Prerequisites

- **Node.js 20+** (tested on Node 24; `package.json` does not set `engines`)
- **pnpm 10** (the repo pins `packageManager`: `pnpm@10.14.0`; Corepack can activate it with `corepack enable`)
- A browser and a network connection for Esri map/imagery tiles and the Inter font

No API keys are required for the main demo.

## Quick start

```bash
git clone https://github.com/recog1/real-estate-hackathon.git
cd real-estate-hackathon
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm install` (and `predev`) copies Cesium and MapLibre static assets into `public/`. Those files are not fully committed.

The only env var is optional:

```bash
# .env.local
NEXT_PUBLIC_CESIUM_ION_TOKEN=
```

Leave it blank unless you want the header **3D view** button (Google Photorealistic 3D Tiles via [Cesium ion](https://ion.cesium.com)). Without a token, the map, globe, satellite tasking, capture and 11% vs 18% verdict still run. With a token, restart the dev server after saving `.env.local`.

Production build:

```bash
pnpm build
pnpm start
```

## Demo walkthrough

The UI opens in competitor mode (hard-coded). No parcel is selected.

1. **Landing.** The header reads **Asset Hawk** / **Watch a competitor**. The map is a zoomed-out satellite view over Leyton / Stratford (centre near 51.556, −0.012, zoom 14.5). The sidebar says *Click an asset on the map to watch it*.
2. **Select ASDA.** Click within about 400 m of ASDA Leyton Mills Superstore (1 Leyton Mills, Marshall Road, Leyton E10 5NH). The parcel snaps to that site and **Task satellite** appears in the header.
3. **Ascent.** Click **Task satellite**. The map zooms out (*Ascending…*) onto a Cesium globe with satellites on orbit. A prompt says *Click a satellite to task*. A **Constellation** list is also available in the corner.
4. **Task.** Click a satellite on the globe (or a row in the constellation list). The camera dives back to nadir over ASDA.
5. **Collection overlay.** A **Collection in flight** pop-up streams these lines, then closes:
   - Ka-band downlink, Esri World Imagery z19
   - Detection run, YOLO11m-OBB + OWLv2
   - 167 vehicles in the car park (154 cars, 13 vans)
   - Bay estimate ~917 (marked area / 30 m²)
   - Observed fill 18%
   - V7 Go: documents report 11% utilisation (~100 cars at midday)
   - Traffic understated: 18% observed vs 11% reported
6. **Capture and verdict.** The annotated capture fills the main view (`public/competitor/annotated.jpg`) with a HUD of the vehicle count, bay estimate and fill. The sidebar is titled **Competitor: ASDA Leyton Mills Superstore**, address **Marshall Road, Leyton E10 5NH**, and shows **Reported 11%**, **Observed 18%**, **Bays ~917**, plus the red-flag verdict above. A V7 Go panel named **ASDA Leyton Mills utilisation check** animates a short extraction pipeline and repeats 11% reported → 18% observed, flagged *Traffic understated*.

Optional: with a site selected, **3D view** opens Google Photorealistic 3D Tiles. If `NEXT_PUBLIC_CESIUM_ION_TOKEN` is unset, that view shows *Set NEXT_PUBLIC_CESIUM_ION_TOKEN to enable 3D* and does not block the rest of the demo.

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**, **pnpm**
- **MapLibre GL** for the opening street/satellite map
- **Esri World Imagery** XYZ tiles (keyless), including zoom 19 for the capture
- **CesiumJS** for the globe and orbital camera (Esri imagery on an ellipsoid terrain; no ion token required for this path)
- **satellite.js** with hard-coded Celestrak TLEs (epoch ~12 Nov 2026) for constellation orbits and next-pass / off-nadir figures
- **YOLO11m-OBB + OWLv2** vehicle detections, precomputed into `public/competitor/detections.json` and `src/data/competitor-capture.json`
- **V7 Go** document extraction, presented in-app from hard-coded ASDA figures (see limitations)

## Project structure

```
src/app/                  # Next.js app shell (single route: /)
src/components/           # Map, globe, tasking overlay, capture, competitor / V7 panels
src/lib/                  # Sites, orbits, competitor capture parsing, claim figures
src/data/                 # Bundled capture and V7 JSON
public/competitor/        # annotated.jpg, supermarket-bw.jpg, detections.json
public/dataroom/          # Leftover PDFs from an earlier occupancy-claim prototype
scripts/copy-cesium.mjs   # Copies Cesium / MapLibre assets into public/ on install
```

## Known limitations

- This is a scripted demo. Vehicle detections, bay counts, utilisation percentages and the V7 extraction animation are precomputed or hard-coded, not live model or workflow runs.
- The ASDA imagery date is unknown (Esri mosaic; the capture date is not published on the XYZ tiles). Occupancy is park-level and described in-app as a slight lower bound.
- The two document titles in the competitor sidebar (*Trading / car park utilisation report* and *Rent review submission*) are illustrative demo docs. Their PDFs are not in the repo, and the UI does not link out to them.
- `src/data/v7-results.json` still holds an earlier Oxford Circus / seller-claim extraction (95% claimed vs 73% observed). The competitor UI does not use those figures. The **Open in V7 Go** button points at that older workflow URL and may require a V7 login.
- Clicking a parcel that is not near ASDA still lets you task a satellite, but the capture and verdict remain the ASDA competitor file.
- `pnpm lint` also lints vendored `public/cesium` assets copied during install, and will print a very large warning dump. `tsc` is clean. ESLint on `src/` reports existing React hooks rule violations; they do not block `pnpm dev` or `pnpm build`.
