/**
 * Map our region "country" display values to identifiers used in TopoJSON.
 * world-atlas@2/countries-110m uses ISO 3166-1 numeric ids.
 */
export const COUNTRY_TO_ISO_NUMERIC: Record<string, number> = {
  France: 250,
  Italy: 380,
  Spain: 724,
  USA: 840,
  "United States": 840,
  Australia: 36,
};

/** Country names we have in the DB that have map geometry (excludes "International"). */
export function getWineCountryNames(countries: string[]): string[] {
  return countries.filter((c) => c !== "International");
}

export function isWineCountry(countryName: string): boolean {
  return countryName in COUNTRY_TO_ISO_NUMERIC;
}
