#!/usr/bin/env node
/**
 * Build admin-1 TopoJSON files for wine countries from Natural Earth 10m data.
 * Country list is read from GET /regions/map-config (API must be running).
 * Source: https://github.com/nvkelso/natural-earth-vector (Natural Earth, public domain)
 * Run: node scripts/build-region-geo.mjs
 */

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const GEO_JSON_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";

const OUT_DIR = join(__dirname, "..", "public", "geo");
const BUDGET_KB = 150;

async function main() {
  const apiUrl = process.env.API_URL ?? "http://localhost:3000";
  console.log(`Fetching map config from ${apiUrl}/regions/map-config...`);
  let mapConfigRes;
  try {
    mapConfigRes = await fetch(`${apiUrl}/regions/map-config`);
  } catch (err) {
    console.error(
      `API not reachable at ${apiUrl}. Start the API first: pnpm dev:api`
    );
    process.exit(1);
  }
  if (!mapConfigRes.ok) {
    console.error(
      `Map config request failed: ${mapConfigRes.status} ${mapConfigRes.statusText}`
    );
    process.exit(1);
  }
  const mapConfig = await mapConfigRes.json();
  const countries = mapConfig.countries ?? [];
  if (countries.length === 0) {
    console.warn("No countries in map config. Run db seed first.");
  }

  console.log("Fetching Natural Earth 10m admin-1 GeoJSON...");
  const res = await fetch(GEO_JSON_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const geojson = await res.json();
  const features = geojson.features || [];

  const topology = require("topojson-server").topology;

  mkdirSync(OUT_DIR, { recursive: true });

  for (const country of countries) {
    const slug = country.geoSlug;
    const admin = country.naturalEarthAdminName;
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
