# Admin-1 region geometry

Admin-1 boundary data is now served directly by the API at `GET /regions/geo/:geoSlug`.

The source file (`ne_10m_admin_1_states_provinces.geojson`) is loaded by the API at startup
from `apps/api/data/`. The API filters by country on demand, converts to TopoJSON, and caches
the result in memory. No build step or static files are required.

See `apps/api/src/services/geo.ts` and the route in `apps/api/src/routes/read.ts`.
