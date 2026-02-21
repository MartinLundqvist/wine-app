// Aroma terms and structure dimensions sourced from:
// WSET Level 3 Systematic Approach to Tasting Wine (Jun 2016)
// See: docs/wset_l3_wines_sat_en_jun-2016.pdf

import { db } from "./client";
import {
  grape,
  region,
  styleTarget,
  styleTargetGrape,
  structureDimension,
  styleTargetStructure,
  aromaTerm,
  styleTargetAromaProfile,
  thermalBand,
  styleTargetContext,
  countryMapConfig,
  regionBoundaryMapping,
} from "./schema";

async function seed() {
  console.log("Seeding wine knowledge engine (v4)...");

  // Thermal bands
  console.log("Seeding thermal_band...");
  await db.insert(thermalBand).values([
    { id: "cool", description: "Cool climate" },
    { id: "moderate", description: "Moderate climate" },
    { id: "warm", description: "Warm climate" },
    { id: "hot", description: "Hot climate" },
  ]).onConflictDoNothing();

  // Regions (countries and sub-regions)
  console.log("Seeding region...");
  const regions = [
    { id: "france", displayName: "France", country: "France", parentRegionId: null as string | null, notes: null },
    { id: "bordeaux", displayName: "Bordeaux", country: "France", parentRegionId: "france", notes: null },
    { id: "burgundy", displayName: "Burgundy", country: "France", parentRegionId: "france", notes: null },
    { id: "rhone", displayName: "Rhône", country: "France", parentRegionId: "france", notes: null },
    { id: "loire", displayName: "Loire", country: "France", parentRegionId: "france", notes: null },
    { id: "italy", displayName: "Italy", country: "Italy", parentRegionId: null, notes: null },
    { id: "tuscany", displayName: "Tuscany", country: "Italy", parentRegionId: "italy", notes: null },
    { id: "piedmont", displayName: "Piedmont", country: "Italy", parentRegionId: "italy", notes: null },
    { id: "spain", displayName: "Spain", country: "Spain", parentRegionId: null, notes: null },
    { id: "rioja", displayName: "Rioja", country: "Spain", parentRegionId: "spain", notes: null },
    { id: "usa", displayName: "USA", country: "USA", parentRegionId: null, notes: null },
    { id: "california", displayName: "California", country: "USA", parentRegionId: "usa", notes: null },
    { id: "australia", displayName: "Australia", country: "Australia", parentRegionId: null, notes: null },
    { id: "generic", displayName: "Generic / International", country: "International", parentRegionId: null, notes: "Archetype without specific region" },
  ];
  for (const r of regions) {
    await db.insert(region).values({
      id: r.id,
      displayName: r.displayName,
      country: r.country,
      parentRegionId: r.parentRegionId,
      notes: r.notes,
    }).onConflictDoNothing();
  }

  // Country map config (mirrors countryCodes.ts for world map + admin-1 overlay)
  console.log("Seeding country_map_config...");
  const countryConfigs = [
    { countryName: "France", isoNumeric: 250, geoSlug: "france", naturalEarthAdminName: "France", zoomCenterLon: 2.5, zoomCenterLat: 46.5, zoomLevel: 5, isMappable: true },
    { countryName: "Italy", isoNumeric: 380, geoSlug: "italy", naturalEarthAdminName: "Italy", zoomCenterLon: 12.5, zoomCenterLat: 42.5, zoomLevel: 5, isMappable: true },
    { countryName: "Spain", isoNumeric: 724, geoSlug: "spain", naturalEarthAdminName: "Spain", zoomCenterLon: -3.5, zoomCenterLat: 40, zoomLevel: 5, isMappable: true },
    { countryName: "USA", isoNumeric: 840, geoSlug: "usa", naturalEarthAdminName: "United States of America", zoomCenterLon: -98, zoomCenterLat: 39, zoomLevel: 3, isMappable: true },
    { countryName: "Australia", isoNumeric: 36, geoSlug: "australia", naturalEarthAdminName: "Australia", zoomCenterLon: 133, zoomCenterLat: -26, zoomLevel: 4, isMappable: true },
  ];
  for (const c of countryConfigs) {
    await db.insert(countryMapConfig).values(c).onConflictDoNothing();
  }

  // Region boundary mapping (sub-region id -> admin-1 feature names in TopoJSON)
  console.log("Seeding region_boundary_mapping...");
  const boundaryMappings: { regionId: string; featureName: string }[] = [
    { regionId: "bordeaux", featureName: "Gironde" },
    { regionId: "burgundy", featureName: "Côte-d'Or" },
    { regionId: "burgundy", featureName: "Saône-et-Loire" },
    { regionId: "burgundy", featureName: "Yonne" },
    { regionId: "burgundy", featureName: "Nièvre" },
    { regionId: "rhone", featureName: "Rhône" },
    { regionId: "rhone", featureName: "Ardèche" },
    { regionId: "rhone", featureName: "Drôme" },
    { regionId: "rhone", featureName: "Vaucluse" },
    { regionId: "rhone", featureName: "Gard" },
    { regionId: "rhone", featureName: "Bouches-du-Rhône" },
    { regionId: "loire", featureName: "Loire-Atlantique" },
    { regionId: "loire", featureName: "Maine-et-Loire" },
    { regionId: "loire", featureName: "Indre-et-Loire" },
    { regionId: "loire", featureName: "Loir-et-Cher" },
    { regionId: "loire", featureName: "Loire" },
    { regionId: "loire", featureName: "Cher" },
    { regionId: "loire", featureName: "Nièvre" },
    { regionId: "loire", featureName: "Allier" },
    { regionId: "loire", featureName: "Haute-Loire" },
    { regionId: "tuscany", featureName: "Firenze" },
    { regionId: "tuscany", featureName: "Siena" },
    { regionId: "tuscany", featureName: "Grosseto" },
    { regionId: "tuscany", featureName: "Livorno" },
    { regionId: "tuscany", featureName: "Pisa" },
    { regionId: "tuscany", featureName: "Lucca" },
    { regionId: "tuscany", featureName: "Massa-Carrara" },
    { regionId: "tuscany", featureName: "Arezzo" },
    { regionId: "tuscany", featureName: "Pistoia" },
    { regionId: "tuscany", featureName: "Prato" },
    { regionId: "piedmont", featureName: "Turin" },
    { regionId: "piedmont", featureName: "Cuneo" },
    { regionId: "piedmont", featureName: "Alessandria" },
    { regionId: "piedmont", featureName: "Asti" },
    { regionId: "piedmont", featureName: "Vercelli" },
    { regionId: "piedmont", featureName: "Novara" },
    { regionId: "piedmont", featureName: "Biella" },
    { regionId: "piedmont", featureName: "Verbano-Cusio-Ossola" },
    { regionId: "rioja", featureName: "La Rioja" },
    { regionId: "california", featureName: "California" },
  ];
  for (const b of boundaryMappings) {
    await db.insert(regionBoundaryMapping).values(b).onConflictDoNothing();
  }

  // Grapes (9 red, 3 white)
  console.log("Seeding grape...");
  const grapesData: { id: string; displayName: string; color: "red" | "white"; sortOrder: number; notes: string | null }[] = [
    { id: "cabernet_sauvignon", displayName: "Cabernet Sauvignon", color: "red", sortOrder: 1, notes: null },
    { id: "merlot", displayName: "Merlot", color: "red", sortOrder: 2, notes: null },
    { id: "pinot_noir", displayName: "Pinot Noir", color: "red", sortOrder: 3, notes: null },
    { id: "syrah", displayName: "Syrah", color: "red", sortOrder: 4, notes: null },
    { id: "grenache", displayName: "Grenache", color: "red", sortOrder: 5, notes: null },
    { id: "nebbiolo", displayName: "Nebbiolo", color: "red", sortOrder: 6, notes: null },
    { id: "sangiovese", displayName: "Sangiovese", color: "red", sortOrder: 7, notes: null },
    { id: "tempranillo", displayName: "Tempranillo", color: "red", sortOrder: 8, notes: null },
    { id: "zinfandel", displayName: "Zinfandel", color: "red", sortOrder: 9, notes: null },
    { id: "chardonnay", displayName: "Chardonnay", color: "white", sortOrder: 10, notes: null },
    { id: "riesling", displayName: "Riesling", color: "white", sortOrder: 11, notes: null },
    { id: "sauvignon_blanc", displayName: "Sauvignon Blanc", color: "white", sortOrder: 12, notes: null },
  ];
  for (const g of grapesData) {
    await db.insert(grape).values(g).onConflictDoNothing();
  }

  // Structure dimensions (WSET SAT: appearance, nose, palate, conclusion)
  console.log("Seeding structure_dimension...");
  type Domain = "appearance" | "nose" | "palate" | "conclusion";
  type ScaleType = "ordinal" | "categorical";
  const ordinal5Labels = ["low", "medium(-)", "medium", "medium(+)", "high"];
  const ordinal3Labels = ["pale", "medium", "deep"];
  const dimensions: {
    id: string;
    displayName: string;
    domain: Domain;
    scaleType: ScaleType;
    scaleMin: number | null;
    scaleMax: number | null;
    scaleLabels: string[] | null;
    description: string;
  }[] = [
    { id: "acidity", displayName: "Acidity", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ordinal5Labels, description: "Perceived acidity" },
    { id: "tannin", displayName: "Tannin", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ordinal5Labels, description: "Tannin intensity" },
    { id: "alcohol", displayName: "Alcohol", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 3, scaleLabels: ["low", "medium", "high"], description: "Alcohol warmth" },
    { id: "body", displayName: "Body", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ["light", "medium(-)", "medium", "medium(+)", "full"], description: "Weight/viscosity" },
    { id: "oak_intensity", displayName: "Oak intensity", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ordinal5Labels, description: "Oak impact" },
    { id: "flavor_intensity", displayName: "Flavor intensity", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ["light", "medium(-)", "medium", "medium(+)", "pronounced"], description: "Intensity of flavors" },
    { id: "color_intensity", displayName: "Color intensity", domain: "appearance", scaleType: "ordinal", scaleMin: 1, scaleMax: 3, scaleLabels: ordinal3Labels, description: "Pale to deep" },
    { id: "herbal_character", displayName: "Herbal character", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ordinal5Labels, description: "Green/herbal intensity" },
    { id: "earth_spice_character", displayName: "Earth/spice character", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ordinal5Labels, description: "Earth and spice presence" },
    { id: "fruit_profile", displayName: "Fruit profile", domain: "palate", scaleType: "categorical", scaleMin: null, scaleMax: null, scaleLabels: ["Red", "Black", "Citrus", "Orchard", "Tropical"], description: "Red/Black or Citrus/Orchard/Tropical" },
    { id: "sweetness", displayName: "Sweetness", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 6, scaleLabels: ["dry", "off-dry", "medium-dry", "medium-sweet", "sweet", "luscious"], description: "Residual sugar perception" },
    { id: "nose_intensity", displayName: "Nose intensity", domain: "nose", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ["light", "medium(-)", "medium", "medium(+)", "pronounced"], description: "Aroma intensity" },
    { id: "nose_development", displayName: "Development", domain: "nose", scaleType: "ordinal", scaleMin: 1, scaleMax: 4, scaleLabels: ["youthful", "developing", "fully developed", "tired/past its best"], description: "Stage of development" },
    { id: "finish", displayName: "Finish", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ["short", "medium(-)", "medium", "medium(+)", "long"], description: "Length of finish" },
    { id: "mousse", displayName: "Mousse", domain: "palate", scaleType: "ordinal", scaleMin: 1, scaleMax: 3, scaleLabels: ["delicate", "creamy", "aggressive"], description: "Sparkling wine bubble character" },
    { id: "color_hue_white", displayName: "Color hue (white)", domain: "appearance", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ["lemon-green", "lemon", "gold", "amber", "brown"], description: "White wine hue" },
    { id: "color_hue_rose", displayName: "Color hue (rosé)", domain: "appearance", scaleType: "ordinal", scaleMin: 1, scaleMax: 3, scaleLabels: ["pink", "salmon", "orange"], description: "Rosé wine hue" },
    { id: "color_hue_red", displayName: "Color hue (red)", domain: "appearance", scaleType: "ordinal", scaleMin: 1, scaleMax: 5, scaleLabels: ["purple", "ruby", "garnet", "tawny", "brown"], description: "Red wine hue" },
    { id: "quality", displayName: "Quality level", domain: "conclusion", scaleType: "ordinal", scaleMin: 1, scaleMax: 6, scaleLabels: ["faulty", "poor", "acceptable", "good", "very good", "outstanding"], description: "Assessment of quality" },
  ];
  for (const d of dimensions) {
    await db.insert(structureDimension).values({
      ...d,
      scaleLabels: d.scaleLabels as unknown,
    }).onConflictDoNothing();
  }

  // Aroma terms: L1 sources (root), L2 clusters, L3 descriptors
  console.log("Seeding aroma_term...");
  type AromaSource = "primary" | "secondary" | "tertiary";
  const aromaL1: { id: string; displayName: string; parentId: string | null; source: AromaSource; description: string | null }[] = [
    { id: "source_primary", displayName: "Primary", parentId: null, source: "primary", description: "Grape and fermentation" },
    { id: "source_secondary", displayName: "Secondary", parentId: null, source: "secondary", description: "Post-fermentation winemaking" },
    { id: "source_tertiary", displayName: "Tertiary", parentId: null, source: "tertiary", description: "Maturation" },
  ];
  for (const a of aromaL1) {
    await db.insert(aromaTerm).values(a).onConflictDoNothing();
  }
  const aromaL2: { id: string; displayName: string; parentId: string; source: AromaSource; description: string | null }[] = [
    { id: "cluster_floral", displayName: "Floral", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_green_fruit", displayName: "Green Fruit", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_citrus", displayName: "Citrus Fruit", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_stone_fruit", displayName: "Stone Fruit", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_tropical", displayName: "Tropical Fruit", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_red_fruit", displayName: "Red Fruit", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_black_fruit", displayName: "Black Fruit", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_dried_cooked_fruit", displayName: "Dried / Cooked Fruit", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_herbaceous", displayName: "Herbaceous", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_herbal", displayName: "Herbal", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_pungent_spice", displayName: "Pungent Spice", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_other_primary", displayName: "Other", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_yeast", displayName: "Yeast / Autolysis", parentId: "source_secondary", source: "secondary", description: null },
    { id: "cluster_malolactic", displayName: "Malolactic", parentId: "source_secondary", source: "secondary", description: null },
    { id: "cluster_oak", displayName: "Oak", parentId: "source_secondary", source: "secondary", description: null },
    { id: "cluster_oxidation", displayName: "Deliberate Oxidation", parentId: "source_tertiary", source: "tertiary", description: null },
    { id: "cluster_fruit_dev_white", displayName: "Fruit Development (White)", parentId: "source_tertiary", source: "tertiary", description: null },
    { id: "cluster_fruit_dev_red", displayName: "Fruit Development (Red)", parentId: "source_tertiary", source: "tertiary", description: null },
    { id: "cluster_bottle_age_white", displayName: "Bottle Age (White)", parentId: "source_tertiary", source: "tertiary", description: null },
    { id: "cluster_bottle_age_red", displayName: "Bottle Age (Red)", parentId: "source_tertiary", source: "tertiary", description: null },
  ];
  for (const a of aromaL2) {
    await db.insert(aromaTerm).values(a).onConflictDoNothing();
  }
  const aromaL3: { id: string; displayName: string; parentId: string; source: AromaSource; description: string | null }[] = [
    // Primary – Floral
    { id: "desc_acacia", displayName: "Acacia", parentId: "cluster_floral", source: "primary", description: null },
    { id: "desc_honeysuckle", displayName: "Honeysuckle", parentId: "cluster_floral", source: "primary", description: null },
    { id: "desc_chamomile", displayName: "Chamomile", parentId: "cluster_floral", source: "primary", description: null },
    { id: "desc_elderflower", displayName: "Elderflower", parentId: "cluster_floral", source: "primary", description: null },
    { id: "desc_geranium", displayName: "Geranium", parentId: "cluster_floral", source: "primary", description: null },
    { id: "desc_blossom", displayName: "Blossom", parentId: "cluster_floral", source: "primary", description: null },
    { id: "desc_rose", displayName: "Rose", parentId: "cluster_floral", source: "primary", description: null },
    { id: "desc_violet", displayName: "Violet", parentId: "cluster_floral", source: "primary", description: null },
    // Primary – Green fruit
    { id: "desc_apple", displayName: "Apple", parentId: "cluster_green_fruit", source: "primary", description: null },
    { id: "desc_gooseberry", displayName: "Gooseberry", parentId: "cluster_green_fruit", source: "primary", description: null },
    { id: "desc_pear", displayName: "Pear", parentId: "cluster_green_fruit", source: "primary", description: null },
    { id: "desc_pear_drop", displayName: "Pear drop", parentId: "cluster_green_fruit", source: "primary", description: null },
    { id: "desc_quince", displayName: "Quince", parentId: "cluster_green_fruit", source: "primary", description: null },
    { id: "desc_grape", displayName: "Grape", parentId: "cluster_green_fruit", source: "primary", description: null },
    // Primary – Citrus
    { id: "desc_grapefruit", displayName: "Grapefruit", parentId: "cluster_citrus", source: "primary", description: null },
    { id: "desc_lemon", displayName: "Lemon", parentId: "cluster_citrus", source: "primary", description: null },
    { id: "desc_lime", displayName: "Lime", parentId: "cluster_citrus", source: "primary", description: null },
    { id: "desc_orange_peel", displayName: "Orange peel", parentId: "cluster_citrus", source: "primary", description: null },
    { id: "desc_lemon_peel", displayName: "Lemon peel", parentId: "cluster_citrus", source: "primary", description: null },
    // Primary – Stone fruit
    { id: "desc_peach", displayName: "Peach", parentId: "cluster_stone_fruit", source: "primary", description: null },
    { id: "desc_apricot", displayName: "Apricot", parentId: "cluster_stone_fruit", source: "primary", description: null },
    { id: "desc_nectarine", displayName: "Nectarine", parentId: "cluster_stone_fruit", source: "primary", description: null },
    // Primary – Tropical
    { id: "desc_banana", displayName: "Banana", parentId: "cluster_tropical", source: "primary", description: null },
    { id: "desc_lychee", displayName: "Lychee", parentId: "cluster_tropical", source: "primary", description: null },
    { id: "desc_mango", displayName: "Mango", parentId: "cluster_tropical", source: "primary", description: null },
    { id: "desc_melon", displayName: "Melon", parentId: "cluster_tropical", source: "primary", description: null },
    { id: "desc_passion_fruit", displayName: "Passion fruit", parentId: "cluster_tropical", source: "primary", description: null },
    { id: "desc_pineapple", displayName: "Pineapple", parentId: "cluster_tropical", source: "primary", description: null },
    // Primary – Red fruit
    { id: "desc_redcurrant", displayName: "Redcurrant", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_cranberry", displayName: "Cranberry", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_raspberry", displayName: "Raspberry", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_strawberry", displayName: "Strawberry", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_red_cherry", displayName: "Red cherry", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_red_plum", displayName: "Red plum", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_cherry", displayName: "Cherry", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_plum", displayName: "Plum", parentId: "cluster_red_fruit", source: "primary", description: null },
    // Primary – Black fruit
    { id: "desc_blackcurrant", displayName: "Blackcurrant", parentId: "cluster_black_fruit", source: "primary", description: null },
    { id: "desc_blackberry", displayName: "Blackberry", parentId: "cluster_black_fruit", source: "primary", description: null },
    { id: "desc_bramble", displayName: "Bramble", parentId: "cluster_black_fruit", source: "primary", description: null },
    { id: "desc_blueberry", displayName: "Blueberry", parentId: "cluster_black_fruit", source: "primary", description: null },
    { id: "desc_black_cherry", displayName: "Black cherry", parentId: "cluster_black_fruit", source: "primary", description: null },
    { id: "desc_black_plum", displayName: "Black plum", parentId: "cluster_black_fruit", source: "primary", description: null },
    // Primary – Dried/cooked fruit
    { id: "desc_fig", displayName: "Fig", parentId: "cluster_dried_cooked_fruit", source: "primary", description: null },
    { id: "desc_prune", displayName: "Prune", parentId: "cluster_dried_cooked_fruit", source: "primary", description: null },
    { id: "desc_raisin", displayName: "Raisin", parentId: "cluster_dried_cooked_fruit", source: "primary", description: null },
    { id: "desc_sultana", displayName: "Sultana", parentId: "cluster_dried_cooked_fruit", source: "primary", description: null },
    { id: "desc_kirsch", displayName: "Kirsch", parentId: "cluster_dried_cooked_fruit", source: "primary", description: null },
    { id: "desc_jamminess", displayName: "Jamminess", parentId: "cluster_dried_cooked_fruit", source: "primary", description: null },
    { id: "desc_baked_stewed_fruits", displayName: "Baked/stewed fruits", parentId: "cluster_dried_cooked_fruit", source: "primary", description: null },
    { id: "desc_preserved_fruits", displayName: "Preserved fruits", parentId: "cluster_dried_cooked_fruit", source: "primary", description: null },
    // Primary – Herbaceous
    { id: "desc_bell_pepper", displayName: "Green bell pepper", parentId: "cluster_herbaceous", source: "primary", description: null },
    { id: "desc_grass", displayName: "Grass", parentId: "cluster_herbaceous", source: "primary", description: null },
    { id: "desc_tomato_leaf", displayName: "Tomato leaf", parentId: "cluster_herbaceous", source: "primary", description: null },
    { id: "desc_asparagus", displayName: "Asparagus", parentId: "cluster_herbaceous", source: "primary", description: null },
    { id: "desc_blackcurrant_leaf", displayName: "Blackcurrant leaf", parentId: "cluster_herbaceous", source: "primary", description: null },
    // Primary – Herbal
    { id: "desc_eucalyptus", displayName: "Eucalyptus", parentId: "cluster_herbal", source: "primary", description: null },
    { id: "desc_mint", displayName: "Mint", parentId: "cluster_herbal", source: "primary", description: null },
    { id: "desc_medicinal", displayName: "Medicinal", parentId: "cluster_herbal", source: "primary", description: null },
    { id: "desc_lavender", displayName: "Lavender", parentId: "cluster_herbal", source: "primary", description: null },
    { id: "desc_fennel", displayName: "Fennel", parentId: "cluster_herbal", source: "primary", description: null },
    { id: "desc_dill", displayName: "Dill", parentId: "cluster_herbal", source: "primary", description: null },
    { id: "desc_black_pepper", displayName: "Black pepper", parentId: "cluster_herbal", source: "primary", description: null },
    // Primary – Pungent spice
    { id: "desc_white_pepper", displayName: "White pepper", parentId: "cluster_pungent_spice", source: "primary", description: null },
    { id: "desc_liquorice", displayName: "Liquorice", parentId: "cluster_pungent_spice", source: "primary", description: null },
    // Primary – Other
    { id: "desc_flint", displayName: "Flint", parentId: "cluster_other_primary", source: "primary", description: null },
    { id: "desc_wet_stones", displayName: "Wet stones", parentId: "cluster_other_primary", source: "primary", description: null },
    { id: "desc_wet_wool", displayName: "Wet wool", parentId: "cluster_other_primary", source: "primary", description: null },
    // Secondary – Yeast
    { id: "desc_biscuit", displayName: "Biscuit", parentId: "cluster_yeast", source: "secondary", description: null },
    { id: "desc_bread", displayName: "Bread", parentId: "cluster_yeast", source: "secondary", description: null },
    { id: "desc_toast_yeast", displayName: "Toast", parentId: "cluster_yeast", source: "secondary", description: null },
    { id: "desc_pastry", displayName: "Pastry", parentId: "cluster_yeast", source: "secondary", description: null },
    { id: "desc_brioche", displayName: "Brioche", parentId: "cluster_yeast", source: "secondary", description: null },
    { id: "desc_bread_dough", displayName: "Bread dough", parentId: "cluster_yeast", source: "secondary", description: null },
    { id: "desc_cheese_yeast", displayName: "Cheese", parentId: "cluster_yeast", source: "secondary", description: null },
    // Secondary – Malolactic
    { id: "desc_butter", displayName: "Butter", parentId: "cluster_malolactic", source: "secondary", description: null },
    { id: "desc_cream", displayName: "Cream", parentId: "cluster_malolactic", source: "secondary", description: null },
    { id: "desc_cheese_mlf", displayName: "Cheese", parentId: "cluster_malolactic", source: "secondary", description: null },
    // Secondary – Oak
    { id: "desc_vanilla", displayName: "Vanilla", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_cloves", displayName: "Cloves", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_nutmeg", displayName: "Nutmeg", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_coconut", displayName: "Coconut", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_butterscotch", displayName: "Butterscotch", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_toast_oak", displayName: "Toast", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_cedar", displayName: "Cedar", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_charred_wood", displayName: "Charred wood", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_smoke", displayName: "Smoke", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_chocolate_oak", displayName: "Chocolate", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_coffee_oak", displayName: "Coffee", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_resinous", displayName: "Resinous", parentId: "cluster_oak", source: "secondary", description: null },
    // Tertiary – Deliberate oxidation
    { id: "desc_almond", displayName: "Almond", parentId: "cluster_oxidation", source: "tertiary", description: null },
    { id: "desc_marzipan", displayName: "Marzipan", parentId: "cluster_oxidation", source: "tertiary", description: null },
    { id: "desc_hazelnut", displayName: "Hazelnut", parentId: "cluster_oxidation", source: "tertiary", description: null },
    { id: "desc_walnut", displayName: "Walnut", parentId: "cluster_oxidation", source: "tertiary", description: null },
    { id: "desc_chocolate_ox", displayName: "Chocolate", parentId: "cluster_oxidation", source: "tertiary", description: null },
    { id: "desc_coffee_ox", displayName: "Coffee", parentId: "cluster_oxidation", source: "tertiary", description: null },
    { id: "desc_toffee", displayName: "Toffee", parentId: "cluster_oxidation", source: "tertiary", description: null },
    { id: "desc_caramel", displayName: "Caramel", parentId: "cluster_oxidation", source: "tertiary", description: null },
    // Tertiary – Fruit development (white)
    { id: "desc_dried_apricot", displayName: "Dried apricot", parentId: "cluster_fruit_dev_white", source: "tertiary", description: null },
    { id: "desc_marmalade", displayName: "Marmalade", parentId: "cluster_fruit_dev_white", source: "tertiary", description: null },
    { id: "desc_dried_apple", displayName: "Dried apple", parentId: "cluster_fruit_dev_white", source: "tertiary", description: null },
    { id: "desc_dried_banana", displayName: "Dried banana", parentId: "cluster_fruit_dev_white", source: "tertiary", description: null },
    // Tertiary – Fruit development (red)
    { id: "desc_tar", displayName: "Tar", parentId: "cluster_fruit_dev_red", source: "tertiary", description: null },
    { id: "desc_dried_blackberry", displayName: "Dried blackberry", parentId: "cluster_fruit_dev_red", source: "tertiary", description: null },
    { id: "desc_dried_cranberry", displayName: "Dried cranberry", parentId: "cluster_fruit_dev_red", source: "tertiary", description: null },
    { id: "desc_cooked_blackberry", displayName: "Cooked blackberry", parentId: "cluster_fruit_dev_red", source: "tertiary", description: null },
    { id: "desc_cooked_red_plum", displayName: "Cooked red plum", parentId: "cluster_fruit_dev_red", source: "tertiary", description: null },
    // Tertiary – Bottle age (white)
    { id: "desc_petrol", displayName: "Petrol", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    { id: "desc_kerosene", displayName: "Kerosene", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    { id: "desc_cinnamon", displayName: "Cinnamon", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    { id: "desc_ginger", displayName: "Ginger", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    { id: "desc_nutmeg_ba", displayName: "Nutmeg", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    { id: "desc_toast_ba", displayName: "Toast", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    { id: "desc_nutty", displayName: "Nutty", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    { id: "desc_mushroom_white", displayName: "Mushroom", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    { id: "desc_hay", displayName: "Hay", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    { id: "desc_honey", displayName: "Honey", parentId: "cluster_bottle_age_white", source: "tertiary", description: null },
    // Tertiary – Bottle age (red)
    { id: "desc_leather", displayName: "Leather", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_forest_floor", displayName: "Forest floor", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_earth", displayName: "Earth", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_mushroom_red", displayName: "Mushroom", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_game", displayName: "Game", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_tobacco", displayName: "Tobacco", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_vegetal", displayName: "Vegetal", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_wet_leaves", displayName: "Wet leaves", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_savoury", displayName: "Savoury", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_meaty", displayName: "Meaty", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
    { id: "desc_farmyard", displayName: "Farmyard", parentId: "cluster_bottle_age_red", source: "tertiary", description: null },
  ];
  for (const a of aromaL3) {
    await db.insert(aromaTerm).values(a).onConflictDoNothing();
  }

  // Style targets (one grape_archetype per grape), grapes link, structure, aromas, context
  console.log("Seeding style_target, style_target_grape, style_target_structure, style_target_aroma_profile, style_target_context...");

  type StyleTargetSeed = {
    id: string;
    displayName: string;
    regionId: string | null;
    grapeId: string;
    wineCategory: "still" | "sparkling" | "fortified";
    producedColor: "red" | "white" | "rose";
    structure: Record<string, { min: number; max: number; cat?: string }>;
    aromas: string[];
    thermalBandId: string | null;
  };

  // Alcohol on 1–3 scale: low=1, medium=2, high=3. Finish/nose/quality: 1–5 or 1–6 as per dimension.
  const styleTargetsData: StyleTargetSeed[] = [
    { id: "st_cabernet_sauvignon", displayName: "Cabernet Sauvignon", regionId: "bordeaux", grapeId: "cabernet_sauvignon", wineCategory: "still", producedColor: "red", thermalBandId: "moderate", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 5, max: 5 }, alcohol: { min: 2, max: 2 }, body: { min: 5, max: 5 }, oak_intensity: { min: 4, max: 4 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 3, max: 3 }, color_hue_red: { min: 2, max: 2 }, herbal_character: { min: 2, max: 2 }, earth_spice_character: { min: 2, max: 2 }, fruit_profile: { min: 0, max: 0, cat: "Black" }, finish: { min: 4, max: 5 }, nose_intensity: { min: 4, max: 4 }, nose_development: { min: 1, max: 2 }, quality: { min: 5, max: 6 } }, aromas: ["desc_blackcurrant", "desc_blackberry", "desc_vanilla", "desc_cloves"] },
    { id: "st_merlot", displayName: "Merlot", regionId: "bordeaux", grapeId: "merlot", wineCategory: "still", producedColor: "red", thermalBandId: "moderate", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 3, max: 3 }, alcohol: { min: 2, max: 2 }, body: { min: 3, max: 3 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, color_hue_red: { min: 2, max: 2 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 2, max: 2 }, fruit_profile: { min: 0, max: 0, cat: "Black" }, finish: { min: 3, max: 4 }, nose_intensity: { min: 3, max: 4 }, nose_development: { min: 1, max: 2 }, quality: { min: 4, max: 5 } }, aromas: ["desc_plum", "desc_cherry", "desc_vanilla"] },
    { id: "st_pinot_noir", displayName: "Pinot Noir", regionId: "burgundy", grapeId: "pinot_noir", wineCategory: "still", producedColor: "red", thermalBandId: "cool", structure: { acidity: { min: 4, max: 4 }, tannin: { min: 2, max: 2 }, alcohol: { min: 2, max: 2 }, body: { min: 2, max: 2 }, oak_intensity: { min: 2, max: 2 }, flavor_intensity: { min: 3, max: 3 }, color_intensity: { min: 1, max: 1 }, color_hue_red: { min: 1, max: 2 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 3, max: 3 }, fruit_profile: { min: 0, max: 0, cat: "Red" }, finish: { min: 4, max: 5 }, nose_intensity: { min: 3, max: 4 }, nose_development: { min: 2, max: 3 }, quality: { min: 5, max: 6 } }, aromas: ["desc_cherry", "desc_raspberry", "desc_earth", "desc_leather"] },
    { id: "st_syrah", displayName: "Syrah", regionId: "rhone", grapeId: "syrah", wineCategory: "still", producedColor: "red", thermalBandId: "warm", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 4, max: 4 }, alcohol: { min: 2, max: 2 }, body: { min: 4, max: 4 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 3, max: 3 }, color_hue_red: { min: 2, max: 3 }, herbal_character: { min: 2, max: 2 }, earth_spice_character: { min: 4, max: 4 }, fruit_profile: { min: 0, max: 0, cat: "Black" }, finish: { min: 4, max: 5 }, nose_intensity: { min: 4, max: 4 }, nose_development: { min: 1, max: 2 }, quality: { min: 5, max: 6 } }, aromas: ["desc_blackberry", "desc_black_pepper", "desc_leather"] },
    { id: "st_grenache", displayName: "Grenache", regionId: "rhone", grapeId: "grenache", wineCategory: "still", producedColor: "red", thermalBandId: "warm", structure: { acidity: { min: 2, max: 2 }, tannin: { min: 3, max: 3 }, alcohol: { min: 3, max: 3 }, body: { min: 3, max: 3 }, oak_intensity: { min: 2, max: 2 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, color_hue_red: { min: 1, max: 2 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 2, max: 2 }, fruit_profile: { min: 0, max: 0, cat: "Red" }, finish: { min: 3, max: 4 }, nose_intensity: { min: 3, max: 4 }, nose_development: { min: 1, max: 2 }, quality: { min: 4, max: 5 } }, aromas: ["desc_raspberry", "desc_strawberry"] },
    { id: "st_nebbiolo", displayName: "Nebbiolo", regionId: "piedmont", grapeId: "nebbiolo", wineCategory: "still", producedColor: "red", thermalBandId: "cool", structure: { acidity: { min: 4, max: 4 }, tannin: { min: 5, max: 5 }, alcohol: { min: 2, max: 2 }, body: { min: 4, max: 4 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, color_hue_red: { min: 2, max: 2 }, herbal_character: { min: 2, max: 2 }, earth_spice_character: { min: 3, max: 3 }, fruit_profile: { min: 0, max: 0, cat: "Red" }, finish: { min: 4, max: 5 }, nose_intensity: { min: 4, max: 4 }, nose_development: { min: 2, max: 3 }, quality: { min: 5, max: 6 } }, aromas: ["desc_cherry", "desc_leather", "desc_earth", "desc_black_pepper"] },
    { id: "st_sangiovese", displayName: "Sangiovese", regionId: "tuscany", grapeId: "sangiovese", wineCategory: "still", producedColor: "red", thermalBandId: "moderate", structure: { acidity: { min: 4, max: 4 }, tannin: { min: 4, max: 4 }, alcohol: { min: 2, max: 2 }, body: { min: 3, max: 3 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, color_hue_red: { min: 2, max: 2 }, herbal_character: { min: 2, max: 2 }, earth_spice_character: { min: 3, max: 3 }, fruit_profile: { min: 0, max: 0, cat: "Red" }, finish: { min: 4, max: 4 }, nose_intensity: { min: 3, max: 4 }, nose_development: { min: 1, max: 2 }, quality: { min: 4, max: 5 } }, aromas: ["desc_cherry", "desc_earth", "desc_plum"] },
    { id: "st_tempranillo", displayName: "Tempranillo", regionId: "rioja", grapeId: "tempranillo", wineCategory: "still", producedColor: "red", thermalBandId: "moderate", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 4, max: 4 }, alcohol: { min: 2, max: 2 }, body: { min: 4, max: 4 }, oak_intensity: { min: 4, max: 4 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 3, max: 3 }, color_hue_red: { min: 2, max: 3 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 3, max: 3 }, fruit_profile: { min: 0, max: 0, cat: "Red" }, finish: { min: 4, max: 5 }, nose_intensity: { min: 4, max: 4 }, nose_development: { min: 2, max: 3 }, quality: { min: 5, max: 6 } }, aromas: ["desc_strawberry", "desc_plum", "desc_leather", "desc_vanilla"] },
    { id: "st_zinfandel", displayName: "Zinfandel", regionId: "california", grapeId: "zinfandel", wineCategory: "still", producedColor: "red", thermalBandId: "warm", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 3, max: 3 }, alcohol: { min: 3, max: 3 }, body: { min: 4, max: 4 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 5, max: 5 }, color_intensity: { min: 3, max: 3 }, color_hue_red: { min: 2, max: 3 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 2, max: 2 }, fruit_profile: { min: 0, max: 0, cat: "Black" }, finish: { min: 3, max: 4 }, nose_intensity: { min: 4, max: 5 }, nose_development: { min: 1, max: 2 }, quality: { min: 4, max: 5 } }, aromas: ["desc_blackberry", "desc_raspberry", "desc_vanilla"] },
    { id: "st_chardonnay", displayName: "Chardonnay", regionId: "burgundy", grapeId: "chardonnay", wineCategory: "still", producedColor: "white", thermalBandId: "cool", structure: { acidity: { min: 4, max: 4 }, tannin: { min: 1, max: 1 }, alcohol: { min: 2, max: 2 }, body: { min: 4, max: 4 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, color_hue_white: { min: 1, max: 2 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 1, max: 1 }, fruit_profile: { min: 0, max: 0, cat: "Orchard" }, sweetness: { min: 1, max: 1 }, finish: { min: 4, max: 5 }, nose_intensity: { min: 3, max: 4 }, nose_development: { min: 1, max: 2 }, quality: { min: 5, max: 6 } }, aromas: ["desc_apple", "desc_butter", "desc_vanilla", "desc_cream"] },
    { id: "st_riesling", displayName: "Riesling", regionId: "generic", grapeId: "riesling", wineCategory: "still", producedColor: "white", thermalBandId: "cool", structure: { acidity: { min: 5, max: 5 }, tannin: { min: 1, max: 1 }, alcohol: { min: 1, max: 1 }, body: { min: 2, max: 2 }, oak_intensity: { min: 1, max: 1 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 1, max: 1 }, color_hue_white: { min: 1, max: 1 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 1, max: 1 }, fruit_profile: { min: 0, max: 0, cat: "Citrus" }, sweetness: { min: 2, max: 5 }, finish: { min: 3, max: 5 }, nose_intensity: { min: 3, max: 4 }, nose_development: { min: 1, max: 2 }, quality: { min: 4, max: 6 } }, aromas: ["desc_grapefruit", "desc_apple", "desc_honeysuckle"] },
    { id: "st_sauvignon_blanc", displayName: "Sauvignon Blanc", regionId: "loire", grapeId: "sauvignon_blanc", wineCategory: "still", producedColor: "white", thermalBandId: "cool", structure: { acidity: { min: 5, max: 5 }, tannin: { min: 1, max: 1 }, alcohol: { min: 1, max: 1 }, body: { min: 2, max: 2 }, oak_intensity: { min: 1, max: 1 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 1, max: 1 }, color_hue_white: { min: 1, max: 1 }, herbal_character: { min: 4, max: 4 }, earth_spice_character: { min: 1, max: 1 }, fruit_profile: { min: 0, max: 0, cat: "Citrus" }, sweetness: { min: 1, max: 1 }, finish: { min: 3, max: 4 }, nose_intensity: { min: 4, max: 5 }, nose_development: { min: 1, max: 1 }, quality: { min: 4, max: 5 } }, aromas: ["desc_grapefruit", "desc_grass", "desc_bell_pepper"] },
  ];

  const dimIds = ["acidity", "tannin", "alcohol", "body", "oak_intensity", "flavor_intensity", "color_intensity", "color_hue_white", "color_hue_red", "herbal_character", "earth_spice_character", "fruit_profile", "sweetness", "finish", "nose_intensity", "nose_development", "quality"];

  for (const st of styleTargetsData) {
    await db.insert(styleTarget).values({
      id: st.id,
      displayName: st.displayName,
      regionId: st.regionId,
      styleKind: "grape_archetype",
      wineCategory: st.wineCategory,
      producedColor: st.producedColor,
      ladderTier: 1,
      confidence: "high",
      status: "approved",
      authoringBasis: "WSET-style benchmark",
      notesInternal: null,
    }).onConflictDoNothing();

    await db.insert(styleTargetGrape).values({
      styleTargetId: st.id,
      grapeId: st.grapeId,
      percentage: null,
      role: "primary",
    }).onConflictDoNothing();

    for (const dimId of dimIds) {
      const val = st.structure[dimId as keyof typeof st.structure];
      if (!val) continue;
      const isCat = dimId === "fruit_profile";
      await db.insert(styleTargetStructure).values({
        styleTargetId: st.id,
        structureDimensionId: dimId,
        minValue: isCat ? null : val.min,
        maxValue: isCat ? null : val.max,
        categoricalValue: isCat ? (val as { cat?: string }).cat ?? null : null,
        confidence: "high",
      }).onConflictDoNothing();
    }

    for (const aromaId of st.aromas) {
      await db.insert(styleTargetAromaProfile).values({
        styleTargetId: st.id,
        aromaTermId: aromaId,
        prominence: "dominant",
      }).onConflictDoNothing();
    }

    await db.insert(styleTargetContext).values({
      styleTargetId: st.id,
      thermalBandId: st.thermalBandId,
      notes: null,
    }).onConflictDoNothing();
  }

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
