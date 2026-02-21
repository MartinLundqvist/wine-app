#!/usr/bin/env node
/**
 * Build admin-1 TopoJSON files for wine countries from Natural Earth 50m data.
 * Source: https://github.com/nvkelso/natural-earth-vector (Natural Earth, public domain)
 * Run: node scripts/build-region-geo.mjs
 */

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// 50m only has USA/Australia; use 10m for global coverage (France, Italy, Spain, etc.)
const GEO_JSON_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";

const WINE_COUNTRIES = [
  { slug: "france", admin: "France" },
  { slug: "italy", admin: "Italy" },
  { slug: "spain", admin: "Spain" },
  { slug: "usa", admin: "United States of America" },
  { slug: "australia", admin: "Australia" },
];

const OUT_DIR = join(__dirname, "..", "public", "geo");
const BUDGET_KB = 150;

async function main() {
  console.log("Fetching Natural Earth 10m admin-1 GeoJSON...");
  const res = await fetch(GEO_JSON_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const geojson = await res.json();
  const features = geojson.features || [];

  const topology = require("topojson-server").topology;

  mkdirSync(OUT_DIR, { recursive: true });

  for (const { slug, admin } of WINE_COUNTRIES) {
    const filtered = features.filter(
      (f) => (f.properties && f.properties.admin) === admin
    );
    const fc = { type: "FeatureCollection", features: filtered };
    const topo = topology({ regions: fc });
    const json = JSON.stringify(topo);
    const path = join(OUT_DIR, `${slug}-admin1.json`);
    writeFileSync(path, json, "utf8");
    const sizeKB = (Buffer.byteLength(json, "utf8") / 1024).toFixed(1);
    if (parseFloat(sizeKB) > BUDGET_KB) {
      console.warn(
        `Warning: ${slug}-admin1.json is ${sizeKB} KB (budget ${BUDGET_KB} KB)`
      );
    }
    console.log(`Wrote ${path} (${filtered.length} features, ${sizeKB} KB)`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
