# API Data Files

## Natural Earth Admin-1 GeoJSON

The file `ne_10m_admin_1_states_provinces.geojson` is required by the API to serve
admin-1 boundary data at `GET /regions/geo/:geoSlug`. It is excluded from version
control due to its size (~30 MB).

Download it before running the API locally:

```bash
curl -L -o apps/api/data/ne_10m_admin_1_states_provinces.geojson \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
```

**License:** Natural Earth data is public domain.
