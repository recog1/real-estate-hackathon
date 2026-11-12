# Asset Hawk

Orbital occupancy intelligence for real estate.

**Occupancy underpins value.** If you cannot fill a multifamily with tenants, what is it worth? Sellers will hand you a 95% rent roll. Asset Hawk lets an investor underwrite that claim **from orbit**, before asking for a single document — by counting cars outside the asset and estimating true physical occupancy.

This is the Grok Bot Real Estate Hackathon London (12 Nov 2026) demo. Dark command UI, London globe, live-looking satellite tasking, four VLM feeds, a data room, and an agent that reads it.

No API keys. No Cesium Ion token. Esri World Dark Gray / World Imagery tiles (keyless) + hard-coded TLEs.

## Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm install` copies Cesium static assets into `public/cesium/` (not committed). Then:

```bash
pnpm build
pnpm start
```

## Demo script (~2 minutes)

1. **Landing (0:00–0:20).** Header reads ASSET HAWK. Full-screen London street map. Any click on land works.
2. **Select (0:20).** Click anywhere on land. A green parcel highlights the selected site. **TASK SATELLITE** appears at the bottom centre.
3. **Space (0:22–0:32).** One continuous camera flight, same globe, out to an orbital view. Satellites move on real SGP4 orbits (accelerated). Drag to orbit the camera.
4. **Task (0:32–0:45).** Click **WorldView-3** (31 cm). Confirm card: resolution, next pass, off-nadir. **TASK SATELLITE**. Short fake uplink/downlink animation.
5. **Collection (0:45–1:10).** Four live tiles (2×2) with VLM boxes: house / car / person + confidence. Counts on the terminal. Occupancy proxy = dwellings with ≥1 car at the kerb.
6. **Data room (1:10–1:30).** Open **Seller Claims vs Observed** or the **Underwriting Memo**.
7. **Agent (1:30–2:00).** Chip: *What are the results of this analysis?* Hawk reads the PDFs, then: seller claims ~95%, observed cars-per-unit implies ~70–75%, likely material overstatement, valuation haircut, cites the PDF.

## What is real vs mocked

| Piece | Real | Mocked |
| --- | --- | --- |
| Map / globe | CesiumJS, Esri raster tiles, one scene 2D→space | — |
| Parcels | Hard-coded London footprints; any land click mints a site | Names/unit counts |
| Orbits | `satellite.js` SGP4 on real Celestrak TLEs | Clock runs ~48× |
| Next-pass / off-nadir | Computed from TLE vs site | — |
| Tasking / downlink | — | Scripted progress + logs |
| Footage | Real Pexels aerial loops, local 720p | Not the actual tasked strip |
| VLM boxes | Interpolated tracks (YOLO if present, else synthetic) | House class is heuristic |
| Occupancy % | Cars-near-house proxy on those tracks | Not a legal tenancy conclusion |
| PDFs | Real files in `public/dataroom/` | Numbers are the demo case |
| Agent | Chat UI, PDF “scan” animation | Canned Q&A + fallback |

## Footage

Transcoded with ffmpeg, no audio, 720p H.264, ~20–24 s, committed under `public/videos/`.

- `zone-a.mp4` — Pexels [31210490](https://www.pexels.com/video/31210490/)
- `zone-b.mp4` — Pexels [31061104](https://www.pexels.com/video/31061104/)
- `zone-c.mp4` — Pexels [5597032](https://www.pexels.com/video/5597032/)
- `zone-d.mp4` — Pexels [36721611](https://www.pexels.com/video/36721611/)
