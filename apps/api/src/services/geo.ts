import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { topology } from "topojson-server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEO_FILE = path.resolve(__dirname, "..", "..", "data", "ne_10m_admin_1_states_provinces.geojson");
const COUNTRIES_FILE = path.resolve(__dirname, "..", "..", "data", "countries.json");

type GeoJsonFeature = {
  type: string;
  properties: Record<string, unknown>;
  geometry: unknown;
};

type GeoJson = {
  type: string;
  features: GeoJsonFeature[];
};

let _geoData: GeoJson | null = null;

function loadGeoData(): GeoJson {
  if (_geoData) return _geoData;
  const raw = readFileSync(GEO_FILE, "utf-8");
  _geoData = JSON.parse(raw) as GeoJson;
  return _geoData;
}

type CountryEntry = { name: string; iso_numeric: string };
let _countriesData: CountryEntry[] | null = null;

function loadCountriesData(): CountryEntry[] {
  if (_countriesData) return _countriesData;
  const raw = readFileSync(COUNTRIES_FILE, "utf-8");
  _countriesData = JSON.parse(raw) as CountryEntry[];
  return _countriesData;
}

function lookupIsoNumeric(adminName: string): number | null {
  const entry = loadCountriesData().find((c) => c.name === adminName);
  if (!entry) return null;
  const n = parseInt(entry.iso_numeric, 10);
  return Number.isNaN(n) ? null : n;
}

function toGeoSlug(adminName: string): string {
  return adminName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

const _cache = new Map<string, object>();

/**
 * Returns sorted, deduplicated admin-1 feature names for a given Natural Earth country.
 * Powers the boundary-mapping checkbox list.
 */
export function getCountryFeatureNames(naturalEarthAdminName: string): string[] {
  const geo = loadGeoData();
  const names = geo.features
    .filter((f) => f.properties["admin"] === naturalEarthAdminName)
    .map((f) => f.properties["name"] as string)
    .filter(Boolean);
  return [...new Set(names)].sort();
}

/**
 * Computes suggested centerLon, centerLat, and zoomLevel from Natural Earth admin-1 features.
 * Uses median lat/lon to be robust against overseas territories.
 * Suggests zoom from the IQR-filtered latitude span.
 * Returns null if no features match.
 */
export function getCountryGeoSuggestions(
  naturalEarthAdminName: string
): { centerLon: number; centerLat: number; suggestedZoom: number; isoNumeric: number | null; geoSlug: string } | null {
  const geo = loadGeoData();
  const features = geo.features.filter(
    (f) => f.properties["admin"] === naturalEarthAdminName
  );
  if (features.length === 0) return null;

  const lats = features
    .map((f) => f.properties["latitude"] as number)
    .filter((v) => v != null && !Number.isNaN(v))
    .sort((a, b) => a - b);
  const lons = features
    .map((f) => f.properties["longitude"] as number)
    .filter((v) => v != null && !Number.isNaN(v))
    .sort((a, b) => a - b);
  if (lats.length === 0) return null;

  const median = (arr: number[]) => arr[Math.floor(arr.length / 2)];
  const centerLat = median(lats);
  const centerLon = median(lons);

  const n = lats.length;
  const q1 = lats[Math.floor(n / 4)];
  const q3 = lats[Math.floor((3 * n) / 4)];
  const iqr = q3 - q1;
  const filtered = lats.filter((l) => l >= q1 - 1.5 * iqr && l <= q3 + 1.5 * iqr);
  const span = filtered[filtered.length - 1] - filtered[0];
  const suggestedZoom =
    span > 0 ? Math.max(1, Math.min(8, Math.round(Math.log2(180 / span)))) : 5;

  return {
    centerLon: Math.round(centerLon * 100) / 100,
    centerLat: Math.round(centerLat * 100) / 100,
    suggestedZoom,
    isoNumeric: lookupIsoNumeric(naturalEarthAdminName),
    geoSlug: toGeoSlug(naturalEarthAdminName),
  };
}

/**
 * Returns a TopoJSON object for the given Natural Earth admin name (e.g. "France").
 * The result is cached in memory after the first call for each country.
 * Returns null if no features match the admin name.
 */
export function getCountryTopoJson(naturalEarthAdminName: string): object | null {
  const cached = _cache.get(naturalEarthAdminName);
  if (cached) return cached;

  const geo = loadGeoData();
  const features = geo.features.filter(
    (f) => f.properties["admin"] === naturalEarthAdminName
  );

  if (features.length === 0) return null;

  const fc = { type: "FeatureCollection" as const, features };
  const topo = topology({ regions: fc });
  _cache.set(naturalEarthAdminName, topo);
  return topo;
}
