import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "public/dataroom");
fs.mkdirSync(outDir, { recursive: true });

function pdfEscape(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text, width) {
  if (!text) return [""];
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > width) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function makePdf(title, lines) {
  const pageW = 612;
  const pageH = 792;
  const pages = [];
  let y = 700;
  let buf = [];
  const pushPage = () => {
    pages.push(buf);
    buf = [];
    y = 700;
  };
  for (const line of lines) {
    for (const w of wrapText(line, 90)) {
      if (y < 64) pushPage();
      buf.push({ text: w, y });
      y -= 14;
    }
  }
  pages.push(buf);

  const objs = [];
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  const pageIds = pages.map((_, i) => 3 + i);
  const contentIds = pages.map((_, i) => 3 + pages.length + i);
  const font1 = 3 + pages.length * 2;
  const font2 = font1 + 1;
  objs.push(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );
  pages.forEach((_, i) => {
    objs.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentIds[i]} 0 R /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> >>`,
    );
  });
  pages.forEach((pl, idx) => {
    const ops = [
      "0.83 0.63 0.29 rg",
      "0 760 612 32 re f",
      "0.93 0.90 0.84 rg",
      "0 0 612 48 re f",
      "BT",
      "1 1 1 rg",
      "/F2 10 Tf",
      "36 771 Td",
      "(ASSET HAWK   ORBITAL OCCUPANCY INTELLIGENCE) Tj",
      "0.07 0.08 0.10 rg",
      "/F2 18 Tf",
      "0 -48 Td",
      `(${pdfEscape(title)}) Tj`,
      "/F1 10 Tf",
      "0.15 0.16 0.18 rg",
    ];
    let lastY = 720;
    for (const row of pl) {
      ops.push(`${row.y - lastY} Td`);
      ops.push(`(${pdfEscape(row.text)}) Tj`);
      lastY = row.y;
    }
    ops.push("ET");
    ops.push("0.07 0.08 0.10 rg");
    ops.push("BT");
    ops.push("/F1 8 Tf");
    ops.push("36 28 Td");
    ops.push(
      `(DEMO / UNCLASSIFIED    p. ${idx + 1}/${pages.length}    Independent of seller data room) Tj`,
    );
    ops.push("ET");
    const stream = ops.join("\n");
    objs.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>");
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>");

  const parts = ["%PDF-1.4\n"];
  const offsets = [0];
  let pos = parts[0].length;
  objs.forEach((obj, i) => {
    offsets.push(pos);
    const chunk = `${i + 1} 0 obj\n${obj}\nendobj\n`;
    parts.push(chunk);
    pos += chunk.length;
  });
  const xrefPos = pos;
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  parts.push(xref);
  parts.push(
    `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`,
  );
  return parts.join("");
}

const docs = [
  {
    file: "occupancy-analysis-report.pdf",
    title: "Occupancy Analysis Report",
    lines: [
      "Collection ID  AH-2026-1112-LHR-CUBITT",
      "Asset          Cubitt Wharf Residences / Tower Hamlets (or nearest named multifamily)",
      "Sensor         WorldView-3  31 cm PAN   off-nadir 18.4 deg",
      "Tiles          4 nadir loops  ·  20-24 s  ·  VLM hawk-v11n",
      "",
      "1. Purpose",
      "Occupancy underpins real-estate value. If a multifamily cannot be filled with tenants, the rent roll is not an income stream - it is a claim. Asset Hawk lets an investor underwrite that claim from orbit before requesting a single seller document.",
      "",
      "2. Method",
      "Dwellings are stable house footprints. Vehicles are COCO car detections, median-smoothed across the loop. A dwelling is occupied if at least one parked car sits within ~18 m of its footprint. Through-traffic (displacement > 4 m/s) is excluded. People are counted but not used in the occupancy proxy.",
      "",
      "3. Observed (regional roll-up)",
      "Dwellings counted          48",
      "Parked cars (median)       34",
      "Cars per dwelling          0.71",
      "Occupied (car-at-kerb)     34 / 48",
      "Observed occupancy         71-75%  (point 73%)",
      "Seller claimed occupancy   95%",
      "Gap                        -22 percentage points",
      "",
      "4. Tile breakdown",
      "Z-N North courtyard   occ 75%   cars 9    houses 12",
      "Z-E East street grid  occ 83%   cars 11   houses 12",
      "Z-W West terrace      occ 67%   cars 7    houses 12",
      "Z-S South car park    occ 71%   cars 8    houses 12",
      "",
      "5. Interpretation",
      "The west and south tiles drive the miss. Pattern is consistent with empty units rather than a single-day event: parked-car counts are stable across the loops. Night-time and weekend revisits recommended before IC.",
      "",
      "6. Confidence",
      "This is a physical-occupancy proxy, not a tenancy legal conclusion. Company cars, residents without cars, and underground parking can bias the ratio. Even with those caveats, a 20pt+ gap versus a 95% rent roll is material and should be treated as an overstatement until proven otherwise.",
    ],
  },
  {
    file: "vehicle-count-time-series.pdf",
    title: "Vehicle Count Time Series",
    lines: [
      "Sampling  5 Hz overlay, interpolated display, loops 20-24 s",
      "",
      "t(s)   Z-N cars  Z-E cars  Z-W cars  Z-S cars  region",
      "0.0    9         11        7         8         35",
      "4.0    9         11        7         8         35",
      "8.0    8         12        7         7         34",
      "12.0   9         11        6         8         34",
      "16.0   9         11        7         8         35",
      "20.0   9         10        7         8         34",
      "24.0   9         11        7         8         35",
      "",
      "Median regional parked cars: 34",
      "Through-traffic excluded (tracks with speed > 4 m/s): 3 vehicles, not in occupancy.",
      "",
      "Notes",
      "Counts are stable. That stability is the point: a one-off delivery van does not create a 22pt occupancy miss. The kerbside stock is consistently below what a 95% occupied 142-unit block should show at 0.7-0.9 cars per occupied unit.",
    ],
  },
  {
    file: "site-imagery-pack.pdf",
    title: "Site Imagery Pack",
    lines: [
      "Four nadir tiles tasked over the selected London multifamily. Footage is demonstration-grade aerial loops (Pexels, transcoded 720p) standing in for a VHR strip.",
      "",
      "Tile Z-N  North courtyard   /videos/zone-a.mp4   Pexels 31210490",
      "Tile Z-E  East street grid  /videos/zone-b.mp4   Pexels 31061104",
      "Tile Z-W  West terrace      /videos/zone-c.mp4   Pexels 5597032",
      "Tile Z-S  South car park    /videos/zone-d.mp4   Pexels 36721611",
      "",
      "VLM overlay classes: house (gold), car (cyan), person (signal red).",
      "House footprints are stable (detector + heuristic). Cars and people are tracked per frame with interpolation.",
      "",
      "This pack is timestamped to the collection. It is not seller marketing imagery. Revisit windows: next SSO morning pass + weekend evening.",
    ],
  },
  {
    file: "seller-claims-vs-observed.pdf",
    title: "Seller Claims vs Observed",
    lines: [
      "Field                     Seller pack           Asset Hawk observed",
      "Occupancy                 95%                   71-75% (73% point)",
      "Units                     142                   48 dwellings in the four tiles (subset of massing)",
      "TTM rent                  3.42m GBP             unsupported at claimed occupancy",
      "Cars / occupied unit      not disclosed         0.71 cars / dwelling",
      "Vacancy                   5%                    ~27% physical proxy",
      "",
      "Delta",
      "Occupancy gap             -22 percentage points",
      "Flag                      MATERIAL OVERSTATEMENT",
      "",
      "Narrative",
      "This multifamily residential property is offered as a 95% occupied income stream. Independent orbital collection shows parked-car density consistent with roughly 70-75% occupancy. We do not need the seller's data room to see the miss. We should not ask for it until we have priced the gap.",
    ],
  },
  {
    file: "underwriting-memo.pdf",
    title: "Underwriting Memo",
    lines: [
      "To       Investment Committee",
      "From     Asset Hawk  /  collection AH-2026-1112",
      "Re       Bid posture on London multifamily (Cubitt Wharf or selected parcel)",
      "",
      "Recommendation",
      "Do not underwrite at 95% occupancy. Bid off 73% physical occupancy with a 150 bps vacancy reserve. Treat the asking cap as 20-25% too tight until tenancy is proven.",
      "",
      "Valuation sketch",
      "Ask implied value (illustrative)     48-55m GBP at ~5.25% cap on claimed NOI",
      "Occupancy haircut                    95% -> 73%  approx -23% in-place income",
      "Unsupported value                    10-13m GBP",
      "Hawk bid frame                       price the 73% case, not the 95% case",
      "",
      "Why this exists",
      "Occupancy underpins value. If you cannot fill it with tenants, what is it worth? Asset Hawk answers that from orbit, before the seller opens a data room, so the first conversation is on our numbers - not theirs.",
      "",
      "IC pack",
      "1. This memo",
      "2. Seller Claims vs Observed",
      "3. Occupancy Analysis Report",
      "4. Site Imagery Pack",
      "5. Vehicle Count Time Series",
    ],
  },
];

for (const doc of docs) {
  const bytes = makePdf(doc.title, doc.lines);
  const dest = path.join(outDir, doc.file);
  fs.writeFileSync(dest, bytes);
  console.log("wrote", dest, Buffer.byteLength(bytes), "bytes");
}
