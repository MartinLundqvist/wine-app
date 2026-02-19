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

  // Structure dimensions
  console.log("Seeding structure_dimension...");
  type Domain = "appearance" | "structural";
  type ScaleType = "ordinal_5" | "ordinal_3" | "categorical";
  const dimensions: { id: string; displayName: string; domain: Domain; scaleType: ScaleType; scaleMin: number | null; scaleMax: number | null; description: string }[] = [
    { id: "acidity", displayName: "Acidity", domain: "structural", scaleType: "ordinal_5", scaleMin: 1, scaleMax: 5, description: "Perceived acidity" },
    { id: "tannin", displayName: "Tannin", domain: "structural", scaleType: "ordinal_5", scaleMin: 1, scaleMax: 5, description: "Tannin intensity" },
    { id: "alcohol", displayName: "Alcohol", domain: "structural", scaleType: "ordinal_5", scaleMin: 1, scaleMax: 5, description: "Alcohol warmth" },
    { id: "body", displayName: "Body", domain: "structural", scaleType: "ordinal_5", scaleMin: 1, scaleMax: 5, description: "Weight/viscosity" },
    { id: "oak_intensity", displayName: "Oak intensity", domain: "structural", scaleType: "ordinal_5", scaleMin: 1, scaleMax: 5, description: "Oak impact" },
    { id: "flavor_intensity", displayName: "Flavor intensity", domain: "structural", scaleType: "ordinal_5", scaleMin: 1, scaleMax: 5, description: "Intensity of flavors" },
    { id: "color_intensity", displayName: "Color intensity", domain: "appearance", scaleType: "ordinal_3", scaleMin: 1, scaleMax: 3, description: "Pale to deep" },
    { id: "herbal_character", displayName: "Herbal character", domain: "structural", scaleType: "ordinal_5", scaleMin: 1, scaleMax: 5, description: "Green/herbal intensity" },
    { id: "earth_spice_character", displayName: "Earth/spice character", domain: "structural", scaleType: "ordinal_5", scaleMin: 1, scaleMax: 5, description: "Earth and spice presence" },
    { id: "fruit_profile", displayName: "Fruit profile", domain: "structural", scaleType: "categorical", scaleMin: null, scaleMax: null, description: "Red/Black or Citrus/Orchard/Tropical" },
    { id: "sweetness", displayName: "Sweetness", domain: "structural", scaleType: "ordinal_5", scaleMin: 1, scaleMax: 5, description: "Residual sugar perception" },
  ];
  for (const d of dimensions) {
    await db.insert(structureDimension).values(d).onConflictDoNothing();
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
    { id: "cluster_herbaceous", displayName: "Herbaceous", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_herbal", displayName: "Herbal", parentId: "source_primary", source: "primary", description: null },
    { id: "cluster_oak", displayName: "Oak", parentId: "source_secondary", source: "secondary", description: null },
    { id: "cluster_malolactic", displayName: "Malolactic", parentId: "source_secondary", source: "secondary", description: null },
    { id: "cluster_yeast", displayName: "Yeast / Autolysis", parentId: "source_secondary", source: "secondary", description: null },
    { id: "cluster_fruit_dev", displayName: "Fruit Development", parentId: "source_tertiary", source: "tertiary", description: null },
    { id: "cluster_bottle_age", displayName: "Bottle Age", parentId: "source_tertiary", source: "tertiary", description: null },
  ];
  for (const a of aromaL2) {
    await db.insert(aromaTerm).values(a).onConflictDoNothing();
  }
  const aromaL3: { id: string; displayName: string; parentId: string; source: AromaSource; description: string | null }[] = [
    { id: "desc_blackberry", displayName: "Blackberry", parentId: "cluster_black_fruit", source: "primary", description: null },
    { id: "desc_blackcurrant", displayName: "Blackcurrant", parentId: "cluster_black_fruit", source: "primary", description: null },
    { id: "desc_cherry", displayName: "Cherry", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_strawberry", displayName: "Strawberry", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_raspberry", displayName: "Raspberry", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_plum", displayName: "Plum", parentId: "cluster_red_fruit", source: "primary", description: null },
    { id: "desc_vanilla", displayName: "Vanilla", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_clove", displayName: "Clove", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_coconut", displayName: "Coconut", parentId: "cluster_oak", source: "secondary", description: null },
    { id: "desc_butter", displayName: "Butter", parentId: "cluster_malolactic", source: "secondary", description: null },
    { id: "desc_cream", displayName: "Cream", parentId: "cluster_malolactic", source: "secondary", description: null },
    { id: "desc_leather", displayName: "Leather", parentId: "cluster_bottle_age", source: "tertiary", description: null },
    { id: "desc_earth", displayName: "Earth", parentId: "cluster_bottle_age", source: "tertiary", description: null },
    { id: "desc_citrus", displayName: "Citrus", parentId: "cluster_citrus", source: "primary", description: null },
    { id: "desc_apple", displayName: "Apple", parentId: "cluster_stone_fruit", source: "primary", description: null },
    { id: "desc_peach", displayName: "Peach", parentId: "cluster_stone_fruit", source: "primary", description: null },
    { id: "desc_grass", displayName: "Grass", parentId: "cluster_herbaceous", source: "primary", description: null },
    { id: "desc_bell_pepper", displayName: "Bell pepper", parentId: "cluster_herbaceous", source: "primary", description: null },
    { id: "desc_black_pepper", displayName: "Black pepper", parentId: "cluster_herbal", source: "primary", description: null },
    { id: "desc_floral", displayName: "Floral", parentId: "cluster_floral", source: "primary", description: null },
    { id: "desc_honeysuckle", displayName: "Honeysuckle", parentId: "cluster_floral", source: "primary", description: null },
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
    structure: Record<string, { min: number; max: number; cat?: string }>;
    aromas: string[]; // L3 aroma term ids
    thermalBandId: string | null;
  };

  const styleTargetsData: StyleTargetSeed[] = [
    { id: "st_cabernet_sauvignon", displayName: "Cabernet Sauvignon", regionId: "bordeaux", grapeId: "cabernet_sauvignon", thermalBandId: "moderate", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 5, max: 5 }, alcohol: { min: 4, max: 4 }, body: { min: 5, max: 5 }, oak_intensity: { min: 4, max: 4 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 3, max: 3 }, herbal_character: { min: 2, max: 2 }, earth_spice_character: { min: 2, max: 2 }, fruit_profile: { min: 0, max: 0, cat: "Black" } }, aromas: ["desc_blackcurrant", "desc_blackberry", "desc_vanilla", "desc_clove"] },
    { id: "st_merlot", displayName: "Merlot", regionId: "bordeaux", grapeId: "merlot", thermalBandId: "moderate", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 3, max: 3 }, alcohol: { min: 3, max: 3 }, body: { min: 3, max: 3 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 2, max: 2 }, fruit_profile: { min: 0, max: 0, cat: "Black" } }, aromas: ["desc_plum", "desc_cherry", "desc_vanilla"] },
    { id: "st_pinot_noir", displayName: "Pinot Noir", regionId: "burgundy", grapeId: "pinot_noir", thermalBandId: "cool", structure: { acidity: { min: 4, max: 4 }, tannin: { min: 2, max: 2 }, alcohol: { min: 3, max: 3 }, body: { min: 2, max: 2 }, oak_intensity: { min: 2, max: 2 }, flavor_intensity: { min: 3, max: 3 }, color_intensity: { min: 1, max: 1 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 3, max: 3 }, fruit_profile: { min: 0, max: 0, cat: "Red" } }, aromas: ["desc_cherry", "desc_raspberry", "desc_earth", "desc_leather"] },
    { id: "st_syrah", displayName: "Syrah", regionId: "rhone", grapeId: "syrah", thermalBandId: "warm", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 4, max: 4 }, alcohol: { min: 4, max: 4 }, body: { min: 4, max: 4 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 3, max: 3 }, herbal_character: { min: 2, max: 2 }, earth_spice_character: { min: 4, max: 4 }, fruit_profile: { min: 0, max: 0, cat: "Black" } }, aromas: ["desc_blackberry", "desc_black_pepper", "desc_leather"] },
    { id: "st_grenache", displayName: "Grenache", regionId: "rhone", grapeId: "grenache", thermalBandId: "warm", structure: { acidity: { min: 2, max: 2 }, tannin: { min: 3, max: 3 }, alcohol: { min: 5, max: 5 }, body: { min: 3, max: 3 }, oak_intensity: { min: 2, max: 2 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 2, max: 2 }, fruit_profile: { min: 0, max: 0, cat: "Red" } }, aromas: ["desc_raspberry", "desc_strawberry"] },
    { id: "st_nebbiolo", displayName: "Nebbiolo", regionId: "piedmont", grapeId: "nebbiolo", thermalBandId: "cool", structure: { acidity: { min: 4, max: 4 }, tannin: { min: 5, max: 5 }, alcohol: { min: 4, max: 4 }, body: { min: 4, max: 4 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, herbal_character: { min: 2, max: 2 }, earth_spice_character: { min: 3, max: 3 }, fruit_profile: { min: 0, max: 0, cat: "Red" } }, aromas: ["desc_cherry", "desc_leather", "desc_earth", "desc_black_pepper"] },
    { id: "st_sangiovese", displayName: "Sangiovese", regionId: "tuscany", grapeId: "sangiovese", thermalBandId: "moderate", structure: { acidity: { min: 4, max: 4 }, tannin: { min: 4, max: 4 }, alcohol: { min: 3, max: 3 }, body: { min: 3, max: 3 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, herbal_character: { min: 2, max: 2 }, earth_spice_character: { min: 3, max: 3 }, fruit_profile: { min: 0, max: 0, cat: "Red" } }, aromas: ["desc_cherry", "desc_earth", "desc_plum"] },
    { id: "st_tempranillo", displayName: "Tempranillo", regionId: "rioja", grapeId: "tempranillo", thermalBandId: "moderate", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 4, max: 4 }, alcohol: { min: 3, max: 3 }, body: { min: 4, max: 4 }, oak_intensity: { min: 4, max: 4 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 3, max: 3 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 3, max: 3 }, fruit_profile: { min: 0, max: 0, cat: "Red" } }, aromas: ["desc_strawberry", "desc_plum", "desc_leather", "desc_vanilla"] },
    { id: "st_zinfandel", displayName: "Zinfandel", regionId: "california", grapeId: "zinfandel", thermalBandId: "warm", structure: { acidity: { min: 3, max: 3 }, tannin: { min: 3, max: 3 }, alcohol: { min: 5, max: 5 }, body: { min: 4, max: 4 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 5, max: 5 }, color_intensity: { min: 3, max: 3 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 2, max: 2 }, fruit_profile: { min: 0, max: 0, cat: "Black" } }, aromas: ["desc_blackberry", "desc_raspberry", "desc_vanilla"] },
    { id: "st_chardonnay", displayName: "Chardonnay", regionId: "burgundy", grapeId: "chardonnay", thermalBandId: "cool", structure: { acidity: { min: 4, max: 4 }, tannin: { min: 1, max: 1 }, alcohol: { min: 3, max: 3 }, body: { min: 4, max: 4 }, oak_intensity: { min: 3, max: 3 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 2, max: 2 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 1, max: 1 }, fruit_profile: { min: 0, max: 0, cat: "Orchard" }, sweetness: { min: 1, max: 1 } }, aromas: ["desc_apple", "desc_butter", "desc_vanilla", "desc_cream"] },
    { id: "st_riesling", displayName: "Riesling", regionId: "generic", grapeId: "riesling", thermalBandId: "cool", structure: { acidity: { min: 5, max: 5 }, tannin: { min: 1, max: 1 }, alcohol: { min: 2, max: 2 }, body: { min: 2, max: 2 }, oak_intensity: { min: 1, max: 1 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 1, max: 1 }, herbal_character: { min: 1, max: 1 }, earth_spice_character: { min: 1, max: 1 }, fruit_profile: { min: 0, max: 0, cat: "Citrus" }, sweetness: { min: 2, max: 4 } }, aromas: ["desc_citrus", "desc_apple", "desc_honeysuckle"] },
    { id: "st_sauvignon_blanc", displayName: "Sauvignon Blanc", regionId: "loire", grapeId: "sauvignon_blanc", thermalBandId: "cool", structure: { acidity: { min: 5, max: 5 }, tannin: { min: 1, max: 1 }, alcohol: { min: 2, max: 2 }, body: { min: 2, max: 2 }, oak_intensity: { min: 1, max: 1 }, flavor_intensity: { min: 4, max: 4 }, color_intensity: { min: 1, max: 1 }, herbal_character: { min: 4, max: 4 }, earth_spice_character: { min: 1, max: 1 }, fruit_profile: { min: 0, max: 0, cat: "Citrus" }, sweetness: { min: 1, max: 1 } }, aromas: ["desc_citrus", "desc_grass", "desc_bell_pepper"] },
  ];

  const dimIds = ["acidity", "tannin", "alcohol", "body", "oak_intensity", "flavor_intensity", "color_intensity", "herbal_character", "earth_spice_character", "fruit_profile", "sweetness"];

  for (const st of styleTargetsData) {
    await db.insert(styleTarget).values({
      id: st.id,
      displayName: st.displayName,
      regionId: st.regionId,
      styleKind: "grape_archetype",
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
