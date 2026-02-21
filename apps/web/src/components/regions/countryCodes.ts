/**
 * Map our region "country" display values to identifiers used in TopoJSON.
 * world-atlas@2/countries-110m uses ISO 3166-1 numeric ids.
 */
export const COUNTRY_TO_ISO_NUMERIC: Record<string, number> = {
  France: 250,
  Italy: 380,
  Spain: 724,
  USA: 840,
  Australia: 36,
};

/** Country names we have in the DB that have map geometry (excludes "International"). */
export function getWineCountryNames(countries: string[]): string[] {
  return countries.filter((c) => c !== "International");
}

export function isWineCountry(countryName: string): boolean {
  return countryName in COUNTRY_TO_ISO_NUMERIC;
}

/** Center [lon, lat] and zoom for programmatic zoom when a country is selected. */
export type ZoomConfig = { center: [number, number]; zoom: number };

export const COUNTRY_ZOOM_CONFIG: Record<string, ZoomConfig> = {
  France: { center: [2.5, 46.5], zoom: 5 },
  Italy: { center: [12.5, 42.5], zoom: 5 },
  Spain: { center: [-3.5, 40], zoom: 5 },
  USA: { center: [-98, 39], zoom: 3 },
  Australia: { center: [133, -26], zoom: 4 },
};

/** Slug used for admin-1 geo file path (e.g. france -> /geo/france-admin1.json). */
export const COUNTRY_TO_GEO_SLUG: Record<string, string> = {
  France: "france",
  Italy: "italy",
  Spain: "spain",
  USA: "usa",
  Australia: "australia",
};

/**
 * Wine sub-region ID -> admin-1 feature names in Natural Earth TopoJSON (properties.name).
 * 1:many allowed (e.g. Loire spans multiple admin-1 regions).
 */
export const SUB_REGION_TO_ADMIN1_NAMES: Record<string, string[]> = {
  // France (départements / regions)
  bordeaux: ["Gironde"],
  burgundy: ["Côte-d'Or", "Saône-et-Loire", "Yonne", "Nièvre"],
  rhone: ["Rhône", "Ardèche", "Drôme", "Vaucluse", "Gard", "Bouches-du-Rhône"],
  loire: [
    "Loire-Atlantique",
    "Maine-et-Loire",
    "Indre-et-Loire",
    "Loir-et-Cher",
    "Loire",
    "Cher",
    "Nièvre",
    "Allier",
    "Haute-Loire",
  ],
  // Italy (provinces)
  tuscany: [
    "Firenze",
    "Siena",
    "Grosseto",
    "Livorno",
    "Pisa",
    "Lucca",
    "Massa-Carrara",
    "Arezzo",
    "Pistoia",
    "Prato",
  ],
  piedmont: [
    "Turin",
    "Cuneo",
    "Alessandria",
    "Asti",
    "Vercelli",
    "Novara",
    "Biella",
    "Verbano-Cusio-Ossola",
  ],
  // Spain
  rioja: ["La Rioja"],
  // USA
  california: ["California"],
};
