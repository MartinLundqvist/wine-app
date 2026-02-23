# Admin-1 region geometry

Source: **Natural Earth** 10m Admin 1 – States, Provinces (used for global coverage).  
URL: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/  
GeoJSON mirror: https://github.com/nvkelso/natural-earth-vector (master branch, `geojson/ne_10m_admin_1_states_provinces.geojson`)

**License:** Natural Earth data is public domain.

## Regenerating geo files

The build script reads the country list from the API. **Start the API first.**

From repo root:

```bash
pnpm dev:api
```

In another terminal:

```bash
pnpm --filter web geo:build
```

Or with a custom API base URL:

```bash
API_URL=http://localhost:3000 pnpm --filter web geo:build
```

This fetches `GET /regions/map-config`, then for each country in the response fetches the Natural Earth 10m admin-1 GeoJSON, filters by `naturalEarthAdminName`, converts to TopoJSON, and writes `<geoSlug>-admin1.json` into this directory. Target size per file: under ~150 KB.

## How to add a new country (e.g. Germany → Rhineland)

1. **Insert region rows** (in `packages/db/src/seed.ts` or via SQL):
   - Root (country): `{ id: "germany", displayName: "Germany", regionLevel: "country", parentId: null }`
   - Sub-region: `{ id: "rhineland", displayName: "Rhineland", regionLevel: "sub_region", parentId: "germany" }`

2. **Insert `country_map_config` row** (ISO numeric, geo slug, zoom, Natural Earth admin name):
   - `countryName: "Germany"`, `isoNumeric: 276`, `geoSlug: "germany"`, `naturalEarthAdminName: "Germany"`, `zoomCenterLon`, `zoomCenterLat`, `zoomLevel`

3. **Insert `region_boundary_mapping` rows** for each sub-region (one row per admin-1 feature name in the TopoJSON):
   - e.g. `{ regionId: "rhineland", featureName: "Rheinland-Pfalz" }` (check Natural Earth feature `properties.name` for exact spelling)

4. **Run DB migration + seed:** `pnpm db:up`

5. **Start API:** `pnpm dev:api`

6. **Generate geo file:** `pnpm --filter web geo:build` — produces `germany-admin1.json` in this directory

7. **Commit** the new `public/geo/<slug>-admin1.json` and deploy

No frontend or API code changes required.
