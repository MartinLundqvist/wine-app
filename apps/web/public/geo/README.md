# Admin-1 region geometry

Source: **Natural Earth** 10m Admin 1 – States, Provinces (used for global coverage; 50m only covers USA/Australia).  
URL: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/  
GeoJSON mirror: https://github.com/nvkelso/natural-earth-vector (master branch, `geojson/ne_10m_admin_1_states_provinces.geojson`)

**License:** Natural Earth data is public domain.

## Regeneration

From repo root:

```bash
cd apps/web && node scripts/build-region-geo.mjs
```

Or with pnpm:

```bash
pnpm --filter web geo:build
```

This fetches the Natural Earth 10m admin-1 GeoJSON, filters to the five wine countries (France, Italy, Spain, USA, Australia), converts each to TopoJSON, and writes `france-admin1.json`, `italy-admin1.json`, `spain-admin1.json`, `usa-admin1.json`, `australia-admin1.json` into this directory. Target size per file: under ~150 KB.
