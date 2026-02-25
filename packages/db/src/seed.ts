// Wine knowledge engine v2 seed – ordinal scales, regions, grapes, structure, aroma taxonomy, wine styles.
// Aroma taxonomy aligned to WSET Level 3 Systematic Approach to Tasting Wine.

import { validateOrdinalRange } from "@wine-app/shared";
import { db } from "./client";
import { eq } from "drizzle-orm";
import {
  ordinalScale,
  region,
  grapeVariety,
  wineStyle,
  wineStyleGrape,
  structureDimension,
  wineStyleStructure,
  appearanceDimension,
  wineStyleAppearance,
  aromaSource,
  aromaCluster,
  aromaDescriptor,
  wineStyleAromaCluster,
  wineStyleAromaDescriptor,
  countryMapConfig,
  regionBoundaryMapping,
  user,
} from "./schema";

const DEFAULT_5 = ["Low", "Medium-", "Medium", "Medium+", "High"];
const CLIMATE_5 = [
  "Cool",
  "Moderate-Cool",
  "Moderate",
  "Moderate-Warm",
  "Warm",
];
const BODY_5 = ["Light", "Medium-", "Medium", "Medium+", "Full"];
const INTENSITY_5 = ["Light", "Medium-", "Medium", "Medium+", "Pronounced"];
const FINISH_5 = ["Short", "Medium-", "Medium", "Medium+", "Long"];
const SWEETNESS_5 = ["Dry", "Off-dry", "Medium-dry", "Medium-sweet", "Sweet"];
const COLOR_INTENSITY_3 = ["Pale", "Medium", "Deep"];
const COLOR_HUE_RED_5 = ["Purple", "Ruby", "Garnet", "Tawny", "Brown"];
const COLOR_HUE_WHITE_5 = ["Lemon-green", "Lemon", "Gold", "Amber", "Brown"];
const COLOR_HUE_ROSE_3 = ["Pink", "Salmon", "Orange"];

async function seed() {
  console.log("Seeding wine knowledge engine (v2)...");

  // Ordinal scales
  console.log("Seeding ordinal_scale...");
  await db
    .insert(ordinalScale)
    .values([
      { id: "default_5", displayName: "Default Low–High", labels: DEFAULT_5 },
      { id: "climate_5", displayName: "Climate Cool–Warm", labels: CLIMATE_5 },
      { id: "body_5", displayName: "Body Light–Full", labels: BODY_5 },
      {
        id: "intensity_5",
        displayName: "Intensity Light–Pronounced",
        labels: INTENSITY_5,
      },
      { id: "finish_5", displayName: "Finish Short–Long", labels: FINISH_5 },
      {
        id: "sweetness_5",
        displayName: "Sweetness Dry–Sweet",
        labels: SWEETNESS_5,
      },
      {
        id: "color_intensity_3",
        displayName: "Color Intensity",
        labels: COLOR_INTENSITY_3,
      },
      {
        id: "color_hue_red_5",
        displayName: "Red Hue",
        labels: COLOR_HUE_RED_5,
      },
      {
        id: "color_hue_white_5",
        displayName: "White Hue",
        labels: COLOR_HUE_WHITE_5,
      },
      {
        id: "color_hue_rose_3",
        displayName: "Rosé Hue",
        labels: COLOR_HUE_ROSE_3,
      },
    ])
    .onConflictDoNothing();

  // Regions: countries then sub-regions (single table, region_level + parent_id)
  console.log("Seeding region...");
  const countryLevel = "country" as const;
  const regionLevel = "region" as const;
  const countries = [
    {
      id: "france",
      displayName: "France",
      regionLevel: countryLevel,
      parentId: null as string | null,
    },
    {
      id: "italy",
      displayName: "Italy",
      regionLevel: countryLevel,
      parentId: null,
    },
    {
      id: "spain",
      displayName: "Spain",
      regionLevel: countryLevel,
      parentId: null,
    },
    {
      id: "usa",
      displayName: "USA",
      regionLevel: countryLevel,
      parentId: null,
    },
    {
      id: "australia",
      displayName: "Australia",
      regionLevel: countryLevel,
      parentId: null,
    },
    {
      id: "generic",
      displayName: "Generic / International",
      regionLevel: countryLevel,
      parentId: null,
    },
  ];
  for (const r of countries) {
    await db
      .insert(region)
      .values({
        id: r.id,
        displayName: r.displayName,
        regionLevel: r.regionLevel,
        parentId: r.parentId,
        notes: null,
      })
      .onConflictDoNothing();
  }
  const subRegions = [
    { id: "bordeaux", displayName: "Bordeaux", parentId: "france" },
    { id: "burgundy", displayName: "Burgundy", parentId: "france" },
    { id: "rhone", displayName: "Rhône", parentId: "france" },
    { id: "loire", displayName: "Loire", parentId: "france" },
    { id: "tuscany", displayName: "Tuscany", parentId: "italy" },
    { id: "piedmont", displayName: "Piedmont", parentId: "italy" },
    { id: "rioja", displayName: "Rioja", parentId: "spain" },
    { id: "california", displayName: "California", parentId: "usa" },
  ];
  for (const r of subRegions) {
    await db
      .insert(region)
      .values({
        id: r.id,
        displayName: r.displayName,
        regionLevel: regionLevel,
        parentId: r.parentId,
        notes: null,
      })
      .onConflictDoNothing();
  }

  // Grapes
  console.log("Seeding grape_variety...");
  const grapesData: {
    id: string;
    displayName: string;
    color: "red" | "white";
    sortOrder: number;
  }[] = [
    {
      id: "cabernet_sauvignon",
      displayName: "Cabernet Sauvignon",
      color: "red",
      sortOrder: 1,
    },
    { id: "merlot", displayName: "Merlot", color: "red", sortOrder: 2 },
    { id: "pinot_noir", displayName: "Pinot Noir", color: "red", sortOrder: 3 },
    { id: "syrah", displayName: "Syrah", color: "red", sortOrder: 4 },
    { id: "grenache", displayName: "Grenache", color: "red", sortOrder: 5 },
    { id: "nebbiolo", displayName: "Nebbiolo", color: "red", sortOrder: 6 },
    { id: "sangiovese", displayName: "Sangiovese", color: "red", sortOrder: 7 },
    {
      id: "tempranillo",
      displayName: "Tempranillo",
      color: "red",
      sortOrder: 8,
    },
    { id: "zinfandel", displayName: "Zinfandel", color: "red", sortOrder: 9 },
    {
      id: "chardonnay",
      displayName: "Chardonnay",
      color: "white",
      sortOrder: 10,
    },
    { id: "riesling", displayName: "Riesling", color: "white", sortOrder: 11 },
    {
      id: "sauvignon_blanc",
      displayName: "Sauvignon Blanc",
      color: "white",
      sortOrder: 12,
    },
  ];
  for (const g of grapesData) {
    await db.insert(grapeVariety).values(g).onConflictDoNothing();
  }

  // Structure dimensions (8 required)
  console.log("Seeding structure_dimension...");
  await db
    .insert(structureDimension)
    .values([
      { id: "tannins", displayName: "Tannins", ordinalScaleId: "default_5" },
      {
        id: "sweetness",
        displayName: "Sweetness",
        ordinalScaleId: "sweetness_5",
      },
      { id: "body", displayName: "Body", ordinalScaleId: "body_5" },
      { id: "acidity", displayName: "Acidity", ordinalScaleId: "default_5" },
      { id: "alcohol", displayName: "Alcohol", ordinalScaleId: "default_5" },
      {
        id: "overall_intensity",
        displayName: "Overall Intensity",
        ordinalScaleId: "intensity_5",
      },
      {
        id: "oak_influence",
        displayName: "Oak Influence",
        ordinalScaleId: "default_5",
      },
      {
        id: "finish_length",
        displayName: "Finish Length",
        ordinalScaleId: "finish_5",
      },
    ])
    .onConflictDoNothing();

  // Appearance dimensions (color intensity + color-dependent hue)
  console.log("Seeding appearance_dimension...");
  await db
    .insert(appearanceDimension)
    .values([
      {
        id: "color_intensity",
        displayName: "Color Intensity",
        producedColor: null,
        ordinalScaleId: "color_intensity_3",
      },
      {
        id: "color_hue_red",
        displayName: "Color Hue",
        producedColor: "red",
        ordinalScaleId: "color_hue_red_5",
      },
      {
        id: "color_hue_white",
        displayName: "Color Hue",
        producedColor: "white",
        ordinalScaleId: "color_hue_white_5",
      },
      {
        id: "color_hue_rose",
        displayName: "Color Hue",
        producedColor: "rose",
        ordinalScaleId: "color_hue_rose_3",
      },
    ])
    .onConflictDoNothing();

  // Aroma sources
  console.log("Seeding aroma_source...");
  await db
    .insert(aromaSource)
    .values([
      { id: "primary", displayName: "Primary" },
      { id: "secondary", displayName: "Secondary" },
      { id: "tertiary", displayName: "Tertiary" },
    ])
    .onConflictDoNothing();

  // Aroma clusters
  console.log("Seeding aroma_cluster...");
  const clusters: { id: string; displayName: string; aromaSourceId: string }[] =
    [
      { id: "cluster_floral", displayName: "Floral", aromaSourceId: "primary" },
      {
        id: "cluster_green_fruit",
        displayName: "Green Fruit",
        aromaSourceId: "primary",
      },
      {
        id: "cluster_citrus",
        displayName: "Citrus Fruit",
        aromaSourceId: "primary",
      },
      {
        id: "cluster_stone_fruit",
        displayName: "Stone Fruit",
        aromaSourceId: "primary",
      },
      {
        id: "cluster_tropical",
        displayName: "Tropical Fruit",
        aromaSourceId: "primary",
      },
      {
        id: "cluster_red_fruit",
        displayName: "Red Fruit",
        aromaSourceId: "primary",
      },
      {
        id: "cluster_black_fruit",
        displayName: "Black Fruit",
        aromaSourceId: "primary",
      },
      {
        id: "cluster_dried_cooked_fruit",
        displayName: "Dried / Cooked Fruit",
        aromaSourceId: "primary",
      },
      {
        id: "cluster_herbaceous",
        displayName: "Herbaceous",
        aromaSourceId: "primary",
      },
      { id: "cluster_herbal", displayName: "Herbal", aromaSourceId: "primary" },
      {
        id: "cluster_pungent_spice",
        displayName: "Pungent Spice",
        aromaSourceId: "primary",
      },
      {
        id: "cluster_other_primary",
        displayName: "Other",
        aromaSourceId: "primary",
      },
      {
        id: "cluster_yeast",
        displayName: "Yeast / Autolysis",
        aromaSourceId: "secondary",
      },
      {
        id: "cluster_malolactic",
        displayName: "Malolactic",
        aromaSourceId: "secondary",
      },
      { id: "cluster_oak", displayName: "Oak", aromaSourceId: "secondary" },
      {
        id: "cluster_oxidation",
        displayName: "Deliberate Oxidation",
        aromaSourceId: "tertiary",
      },
      {
        id: "cluster_fruit_dev_white",
        displayName: "Fruit Development (White)",
        aromaSourceId: "tertiary",
      },
      {
        id: "cluster_fruit_dev_red",
        displayName: "Fruit Development (Red)",
        aromaSourceId: "tertiary",
      },
      {
        id: "cluster_bottle_age_white",
        displayName: "Bottle Age (White)",
        aromaSourceId: "tertiary",
      },
      {
        id: "cluster_bottle_age_red",
        displayName: "Bottle Age (Red)",
        aromaSourceId: "tertiary",
      },
    ];
  for (const c of clusters) {
    await db.insert(aromaCluster).values(c).onConflictDoNothing();
  }

  // Aroma descriptors: WSET Level 3 Wine-Lexicon, page 2 (exact cluster parity)
  console.log("Seeding aroma_descriptor...");
  const descriptors: {
    id: string;
    displayName: string;
    aromaClusterId: string;
  }[] = [
    // Primary — Floral
    {
      id: "desc_acacia",
      displayName: "Acacia",
      aromaClusterId: "cluster_floral",
    },
    {
      id: "desc_honeysuckle",
      displayName: "Honeysuckle",
      aromaClusterId: "cluster_floral",
    },
    {
      id: "desc_chamomile",
      displayName: "Chamomile",
      aromaClusterId: "cluster_floral",
    },
    {
      id: "desc_elderflower",
      displayName: "Elderflower",
      aromaClusterId: "cluster_floral",
    },
    {
      id: "desc_geranium",
      displayName: "Geranium",
      aromaClusterId: "cluster_floral",
    },
    {
      id: "desc_blossom",
      displayName: "Blossom",
      aromaClusterId: "cluster_floral",
    },
    { id: "desc_rose", displayName: "Rose", aromaClusterId: "cluster_floral" },
    {
      id: "desc_violet",
      displayName: "Violet",
      aromaClusterId: "cluster_floral",
    },
    // Primary — Green Fruit
    {
      id: "desc_apple",
      displayName: "Apple",
      aromaClusterId: "cluster_green_fruit",
    },
    {
      id: "desc_gooseberry",
      displayName: "Gooseberry",
      aromaClusterId: "cluster_green_fruit",
    },
    {
      id: "desc_pear",
      displayName: "Pear",
      aromaClusterId: "cluster_green_fruit",
    },
    {
      id: "desc_pear_drop",
      displayName: "Pear Drop",
      aromaClusterId: "cluster_green_fruit",
    },
    {
      id: "desc_quince",
      displayName: "Quince",
      aromaClusterId: "cluster_green_fruit",
    },
    {
      id: "desc_grape",
      displayName: "Grape",
      aromaClusterId: "cluster_green_fruit",
    },
    // Primary — Citrus
    {
      id: "desc_grapefruit",
      displayName: "Grapefruit",
      aromaClusterId: "cluster_citrus",
    },
    {
      id: "desc_lemon",
      displayName: "Lemon",
      aromaClusterId: "cluster_citrus",
    },
    { id: "desc_lime", displayName: "Lime", aromaClusterId: "cluster_citrus" },
    {
      id: "desc_orange_peel",
      displayName: "Orange Peel",
      aromaClusterId: "cluster_citrus",
    },
    {
      id: "desc_lemon_peel",
      displayName: "Lemon Peel",
      aromaClusterId: "cluster_citrus",
    },
    // Primary — Stone Fruit
    {
      id: "desc_peach",
      displayName: "Peach",
      aromaClusterId: "cluster_stone_fruit",
    },
    {
      id: "desc_apricot",
      displayName: "Apricot",
      aromaClusterId: "cluster_stone_fruit",
    },
    {
      id: "desc_nectarine",
      displayName: "Nectarine",
      aromaClusterId: "cluster_stone_fruit",
    },
    // Primary — Tropical
    {
      id: "desc_banana",
      displayName: "Banana",
      aromaClusterId: "cluster_tropical",
    },
    {
      id: "desc_lychee",
      displayName: "Lychee",
      aromaClusterId: "cluster_tropical",
    },
    {
      id: "desc_mango",
      displayName: "Mango",
      aromaClusterId: "cluster_tropical",
    },
    {
      id: "desc_melon",
      displayName: "Melon",
      aromaClusterId: "cluster_tropical",
    },
    {
      id: "desc_passion_fruit",
      displayName: "Passion Fruit",
      aromaClusterId: "cluster_tropical",
    },
    {
      id: "desc_pineapple",
      displayName: "Pineapple",
      aromaClusterId: "cluster_tropical",
    },
    // Primary — Red Fruit
    {
      id: "desc_redcurrant",
      displayName: "Redcurrant",
      aromaClusterId: "cluster_red_fruit",
    },
    {
      id: "desc_cranberry",
      displayName: "Cranberry",
      aromaClusterId: "cluster_red_fruit",
    },
    {
      id: "desc_raspberry",
      displayName: "Raspberry",
      aromaClusterId: "cluster_red_fruit",
    },
    {
      id: "desc_strawberry",
      displayName: "Strawberry",
      aromaClusterId: "cluster_red_fruit",
    },
    {
      id: "desc_red_cherry",
      displayName: "Red Cherry",
      aromaClusterId: "cluster_red_fruit",
    },
    {
      id: "desc_red_plum",
      displayName: "Red Plum",
      aromaClusterId: "cluster_red_fruit",
    },
    // Primary — Black Fruit
    {
      id: "desc_blackcurrant",
      displayName: "Blackcurrant",
      aromaClusterId: "cluster_black_fruit",
    },
    {
      id: "desc_blackberry",
      displayName: "Blackberry",
      aromaClusterId: "cluster_black_fruit",
    },
    {
      id: "desc_bramble",
      displayName: "Bramble",
      aromaClusterId: "cluster_black_fruit",
    },
    {
      id: "desc_blueberry",
      displayName: "Blueberry",
      aromaClusterId: "cluster_black_fruit",
    },
    {
      id: "desc_black_cherry",
      displayName: "Black Cherry",
      aromaClusterId: "cluster_black_fruit",
    },
    {
      id: "desc_black_plum",
      displayName: "Black Plum",
      aromaClusterId: "cluster_black_fruit",
    },
    // Primary — Dried/Cooked Fruit
    {
      id: "desc_fig",
      displayName: "Fig",
      aromaClusterId: "cluster_dried_cooked_fruit",
    },
    {
      id: "desc_prune",
      displayName: "Prune",
      aromaClusterId: "cluster_dried_cooked_fruit",
    },
    {
      id: "desc_raisin",
      displayName: "Raisin",
      aromaClusterId: "cluster_dried_cooked_fruit",
    },
    {
      id: "desc_sultana",
      displayName: "Sultana",
      aromaClusterId: "cluster_dried_cooked_fruit",
    },
    {
      id: "desc_kirsch",
      displayName: "Kirsch",
      aromaClusterId: "cluster_dried_cooked_fruit",
    },
    {
      id: "desc_jamminess",
      displayName: "Jamminess",
      aromaClusterId: "cluster_dried_cooked_fruit",
    },
    {
      id: "desc_baked_stewed_fruits",
      displayName: "Baked/Stewed Fruits",
      aromaClusterId: "cluster_dried_cooked_fruit",
    },
    {
      id: "desc_preserved_fruits",
      displayName: "Preserved Fruits",
      aromaClusterId: "cluster_dried_cooked_fruit",
    },
    // Primary — Herbaceous
    {
      id: "desc_green_bell_pepper",
      displayName: "Green Bell Pepper (Capsicum)",
      aromaClusterId: "cluster_herbaceous",
    },
    {
      id: "desc_grass",
      displayName: "Grass",
      aromaClusterId: "cluster_herbaceous",
    },
    {
      id: "desc_tomato_leaf",
      displayName: "Tomato Leaf",
      aromaClusterId: "cluster_herbaceous",
    },
    {
      id: "desc_asparagus",
      displayName: "Asparagus",
      aromaClusterId: "cluster_herbaceous",
    },
    {
      id: "desc_blackcurrant_leaf",
      displayName: "Blackcurrant Leaf",
      aromaClusterId: "cluster_herbaceous",
    },
    // Primary — Herbal
    {
      id: "desc_eucalyptus",
      displayName: "Eucalyptus",
      aromaClusterId: "cluster_herbal",
    },
    { id: "desc_mint", displayName: "Mint", aromaClusterId: "cluster_herbal" },
    {
      id: "desc_medicinal",
      displayName: "Medicinal",
      aromaClusterId: "cluster_herbal",
    },
    {
      id: "desc_lavender",
      displayName: "Lavender",
      aromaClusterId: "cluster_herbal",
    },
    {
      id: "desc_fennel",
      displayName: "Fennel",
      aromaClusterId: "cluster_herbal",
    },
    { id: "desc_dill", displayName: "Dill", aromaClusterId: "cluster_herbal" },
    // Primary — Pungent Spice
    {
      id: "desc_black_white_pepper",
      displayName: "Black/White Pepper",
      aromaClusterId: "cluster_pungent_spice",
    },
    {
      id: "desc_liquorice",
      displayName: "Liquorice",
      aromaClusterId: "cluster_pungent_spice",
    },
    // Primary — Other
    {
      id: "desc_flint",
      displayName: "Flint",
      aromaClusterId: "cluster_other_primary",
    },
    {
      id: "desc_wet_stones",
      displayName: "Wet Stones",
      aromaClusterId: "cluster_other_primary",
    },
    {
      id: "desc_wet_wool",
      displayName: "Wet Wool",
      aromaClusterId: "cluster_other_primary",
    },
    // Secondary — Yeast
    {
      id: "desc_biscuit",
      displayName: "Biscuit",
      aromaClusterId: "cluster_yeast",
    },
    { id: "desc_bread", displayName: "Bread", aromaClusterId: "cluster_yeast" },
    {
      id: "desc_toast_yeast",
      displayName: "Toast",
      aromaClusterId: "cluster_yeast",
    },
    {
      id: "desc_pastry",
      displayName: "Pastry",
      aromaClusterId: "cluster_yeast",
    },
    {
      id: "desc_brioche",
      displayName: "Brioche",
      aromaClusterId: "cluster_yeast",
    },
    {
      id: "desc_bread_dough",
      displayName: "Bread Dough",
      aromaClusterId: "cluster_yeast",
    },
    {
      id: "desc_cheese_yeast",
      displayName: "Cheese",
      aromaClusterId: "cluster_yeast",
    },
    // Secondary — Malolactic
    {
      id: "desc_butter",
      displayName: "Butter",
      aromaClusterId: "cluster_malolactic",
    },
    {
      id: "desc_cheese_malolactic",
      displayName: "Cheese",
      aromaClusterId: "cluster_malolactic",
    },
    {
      id: "desc_cream",
      displayName: "Cream",
      aromaClusterId: "cluster_malolactic",
    },
    // Secondary — Oak
    {
      id: "desc_vanilla",
      displayName: "Vanilla",
      aromaClusterId: "cluster_oak",
    },
    { id: "desc_cloves", displayName: "Cloves", aromaClusterId: "cluster_oak" },
    {
      id: "desc_nutmeg_oak",
      displayName: "Nutmeg",
      aromaClusterId: "cluster_oak",
    },
    {
      id: "desc_coconut",
      displayName: "Coconut",
      aromaClusterId: "cluster_oak",
    },
    {
      id: "desc_butterscotch",
      displayName: "Butterscotch",
      aromaClusterId: "cluster_oak",
    },
    {
      id: "desc_toast_oak",
      displayName: "Toast",
      aromaClusterId: "cluster_oak",
    },
    { id: "desc_cedar", displayName: "Cedar", aromaClusterId: "cluster_oak" },
    {
      id: "desc_charred_wood",
      displayName: "Charred Wood",
      aromaClusterId: "cluster_oak",
    },
    { id: "desc_smoke", displayName: "Smoke", aromaClusterId: "cluster_oak" },
    {
      id: "desc_chocolate_oak",
      displayName: "Chocolate",
      aromaClusterId: "cluster_oak",
    },
    {
      id: "desc_coffee_oak",
      displayName: "Coffee",
      aromaClusterId: "cluster_oak",
    },
    {
      id: "desc_resinous",
      displayName: "Resinous",
      aromaClusterId: "cluster_oak",
    },
    // Tertiary — Oxidation
    {
      id: "desc_almond",
      displayName: "Almond",
      aromaClusterId: "cluster_oxidation",
    },
    {
      id: "desc_marzipan",
      displayName: "Marzipan",
      aromaClusterId: "cluster_oxidation",
    },
    {
      id: "desc_hazelnut",
      displayName: "Hazelnut",
      aromaClusterId: "cluster_oxidation",
    },
    {
      id: "desc_walnut",
      displayName: "Walnut",
      aromaClusterId: "cluster_oxidation",
    },
    {
      id: "desc_chocolate_oxidation",
      displayName: "Chocolate",
      aromaClusterId: "cluster_oxidation",
    },
    {
      id: "desc_coffee_oxidation",
      displayName: "Coffee",
      aromaClusterId: "cluster_oxidation",
    },
    {
      id: "desc_toffee",
      displayName: "Toffee",
      aromaClusterId: "cluster_oxidation",
    },
    {
      id: "desc_caramel",
      displayName: "Caramel",
      aromaClusterId: "cluster_oxidation",
    },
    // Tertiary — Fruit Development (White)
    {
      id: "desc_dried_apricot",
      displayName: "Dried Apricot",
      aromaClusterId: "cluster_fruit_dev_white",
    },
    {
      id: "desc_marmalade",
      displayName: "Marmalade",
      aromaClusterId: "cluster_fruit_dev_white",
    },
    {
      id: "desc_dried_apple",
      displayName: "Dried Apple",
      aromaClusterId: "cluster_fruit_dev_white",
    },
    {
      id: "desc_dried_banana",
      displayName: "Dried Banana",
      aromaClusterId: "cluster_fruit_dev_white",
    },
    // Tertiary — Fruit Development (Red)
    {
      id: "desc_fig_fruit_dev_red",
      displayName: "Fig",
      aromaClusterId: "cluster_fruit_dev_red",
    },
    {
      id: "desc_prune_fruit_dev_red",
      displayName: "Prune",
      aromaClusterId: "cluster_fruit_dev_red",
    },
    {
      id: "desc_tar",
      displayName: "Tar",
      aromaClusterId: "cluster_fruit_dev_red",
    },
    {
      id: "desc_dried_blackberry",
      displayName: "Dried Blackberry",
      aromaClusterId: "cluster_fruit_dev_red",
    },
    {
      id: "desc_dried_cranberry",
      displayName: "Dried Cranberry",
      aromaClusterId: "cluster_fruit_dev_red",
    },
    {
      id: "desc_cooked_blackberry",
      displayName: "Cooked Blackberry",
      aromaClusterId: "cluster_fruit_dev_red",
    },
    {
      id: "desc_cooked_red_plum",
      displayName: "Cooked Red Plum",
      aromaClusterId: "cluster_fruit_dev_red",
    },
    // Tertiary — Bottle Age (White)
    {
      id: "desc_petrol",
      displayName: "Petrol",
      aromaClusterId: "cluster_bottle_age_white",
    },
    {
      id: "desc_kerosene",
      displayName: "Kerosene",
      aromaClusterId: "cluster_bottle_age_white",
    },
    {
      id: "desc_cinnamon",
      displayName: "Cinnamon",
      aromaClusterId: "cluster_bottle_age_white",
    },
    {
      id: "desc_ginger",
      displayName: "Ginger",
      aromaClusterId: "cluster_bottle_age_white",
    },
    {
      id: "desc_nutmeg_bottle_age_white",
      displayName: "Nutmeg",
      aromaClusterId: "cluster_bottle_age_white",
    },
    {
      id: "desc_toast_bottle_age_white",
      displayName: "Toast",
      aromaClusterId: "cluster_bottle_age_white",
    },
    {
      id: "desc_nutty",
      displayName: "Nutty",
      aromaClusterId: "cluster_bottle_age_white",
    },
    {
      id: "desc_mushroom_bottle_age_white",
      displayName: "Mushroom",
      aromaClusterId: "cluster_bottle_age_white",
    },
    {
      id: "desc_hay",
      displayName: "Hay",
      aromaClusterId: "cluster_bottle_age_white",
    },
    {
      id: "desc_honey",
      displayName: "Honey",
      aromaClusterId: "cluster_bottle_age_white",
    },
    // Tertiary — Bottle Age (Red)
    {
      id: "desc_leather",
      displayName: "Leather",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_forest_floor",
      displayName: "Forest Floor",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_earth",
      displayName: "Earth",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_mushroom_bottle_age_red",
      displayName: "Mushroom",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_game",
      displayName: "Game",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_tobacco",
      displayName: "Tobacco",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_vegetal",
      displayName: "Vegetal",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_wet_leaves",
      displayName: "Wet Leaves",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_savoury",
      displayName: "Savoury",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_meaty",
      displayName: "Meaty",
      aromaClusterId: "cluster_bottle_age_red",
    },
    {
      id: "desc_farmyard",
      displayName: "Farmyard",
      aromaClusterId: "cluster_bottle_age_red",
    },
  ];
  for (const d of descriptors) {
    await db.insert(aromaDescriptor).values(d).onConflictDoNothing();
  }

  // Country map config
  console.log("Seeding country_map_config...");
  const countryConfigs = [
    {
      regionId: "france",
      isoNumeric: 250,
      geoSlug: "france",
      naturalEarthAdminName: "France",
      zoomCenterLon: 2.5,
      zoomCenterLat: 46.5,
      zoomLevel: 5,
      isMappable: true,
    },
    {
      regionId: "italy",
      isoNumeric: 380,
      geoSlug: "italy",
      naturalEarthAdminName: "Italy",
      zoomCenterLon: 12.5,
      zoomCenterLat: 42.5,
      zoomLevel: 5,
      isMappable: true,
    },
    {
      regionId: "spain",
      isoNumeric: 724,
      geoSlug: "spain",
      naturalEarthAdminName: "Spain",
      zoomCenterLon: -3.5,
      zoomCenterLat: 40,
      zoomLevel: 5,
      isMappable: true,
    },
    {
      regionId: "usa",
      isoNumeric: 840,
      geoSlug: "usa",
      naturalEarthAdminName: "United States of America",
      zoomCenterLon: -98,
      zoomCenterLat: 39,
      zoomLevel: 3,
      isMappable: true,
    },
    {
      regionId: "australia",
      isoNumeric: 36,
      geoSlug: "australia",
      naturalEarthAdminName: "Australia",
      zoomCenterLon: 133,
      zoomCenterLat: -26,
      zoomLevel: 4,
      isMappable: true,
    },
  ];
  for (const c of countryConfigs) {
    await db.insert(countryMapConfig).values(c).onConflictDoNothing();
  }

  // Region boundary mapping
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
    { regionId: "piedmont", featureName: "Turin" },
    { regionId: "piedmont", featureName: "Cuneo" },
    { regionId: "rioja", featureName: "La Rioja" },
    { regionId: "california", featureName: "California" },
  ];
  for (const b of boundaryMappings) {
    await db.insert(regionBoundaryMapping).values(b).onConflictDoNothing();
  }

  // Wine styles: 12 regional archetypes with structure, blend, aromas, climate
  type StyleSeed = {
    id: string;
    displayName: string;
    regionId: string | null;
    grapeId: string;
    climateMin: number;
    climateMax: number;
    structure: Record<string, { min: number; max: number }>;
    aromaClusters: {
      clusterId: string;
      intensityMin: number;
      intensityMax: number;
    }[];
    aromaDescriptors: {
      descriptorId: string;
      salience: "dominant" | "supporting" | "occasional";
    }[];
  };

  const stylesData: StyleSeed[] = [
    {
      id: "ws_cabernet_sauvignon",
      displayName: "Cabernet Sauvignon",
      regionId: "bordeaux",
      grapeId: "cabernet_sauvignon",
      climateMin: 2,
      climateMax: 3,
      structure: {
        tannins: { min: 5, max: 5 },
        sweetness: { min: 1, max: 1 },
        body: { min: 5, max: 5 },
        acidity: { min: 3, max: 3 },
        alcohol: { min: 3, max: 3 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 4, max: 4 },
        finish_length: { min: 4, max: 5 },
      },
      aromaClusters: [
        { clusterId: "cluster_black_fruit", intensityMin: 4, intensityMax: 5 },
        { clusterId: "cluster_oak", intensityMin: 4, intensityMax: 4 },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_blackcurrant", salience: "dominant" },
        { descriptorId: "desc_blackberry", salience: "dominant" },
        { descriptorId: "desc_vanilla", salience: "dominant" },
        { descriptorId: "desc_cloves", salience: "supporting" },
      ],
    },
    {
      id: "ws_merlot",
      displayName: "Merlot",
      regionId: "bordeaux",
      grapeId: "merlot",
      climateMin: 2,
      climateMax: 3,
      structure: {
        tannins: { min: 3, max: 3 },
        sweetness: { min: 1, max: 1 },
        body: { min: 3, max: 3 },
        acidity: { min: 3, max: 3 },
        alcohol: { min: 3, max: 3 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 3, max: 3 },
        finish_length: { min: 3, max: 4 },
      },
      aromaClusters: [
        { clusterId: "cluster_red_fruit", intensityMin: 4, intensityMax: 4 },
        { clusterId: "cluster_oak", intensityMin: 3, intensityMax: 3 },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_red_plum", salience: "dominant" },
        { descriptorId: "desc_red_cherry", salience: "dominant" },
        { descriptorId: "desc_vanilla", salience: "supporting" },
      ],
    },
    {
      id: "ws_pinot_noir",
      displayName: "Pinot Noir",
      regionId: "burgundy",
      grapeId: "pinot_noir",
      climateMin: 1,
      climateMax: 2,
      structure: {
        tannins: { min: 2, max: 2 },
        sweetness: { min: 1, max: 1 },
        body: { min: 2, max: 2 },
        acidity: { min: 4, max: 4 },
        alcohol: { min: 3, max: 3 },
        overall_intensity: { min: 3, max: 3 },
        oak_influence: { min: 2, max: 2 },
        finish_length: { min: 4, max: 5 },
      },
      aromaClusters: [
        { clusterId: "cluster_red_fruit", intensityMin: 3, intensityMax: 4 },
        {
          clusterId: "cluster_bottle_age_red",
          intensityMin: 2,
          intensityMax: 3,
        },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_red_cherry", salience: "dominant" },
        { descriptorId: "desc_raspberry", salience: "dominant" },
        { descriptorId: "desc_earth", salience: "supporting" },
        { descriptorId: "desc_leather", salience: "supporting" },
      ],
    },
    {
      id: "ws_syrah",
      displayName: "Syrah",
      regionId: "rhone",
      grapeId: "syrah",
      climateMin: 3,
      climateMax: 4,
      structure: {
        tannins: { min: 4, max: 4 },
        sweetness: { min: 1, max: 1 },
        body: { min: 4, max: 4 },
        acidity: { min: 3, max: 3 },
        alcohol: { min: 3, max: 3 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 3, max: 3 },
        finish_length: { min: 4, max: 5 },
      },
      aromaClusters: [
        { clusterId: "cluster_black_fruit", intensityMin: 4, intensityMax: 4 },
        { clusterId: "cluster_herbal", intensityMin: 3, intensityMax: 4 },
        {
          clusterId: "cluster_bottle_age_red",
          intensityMin: 2,
          intensityMax: 3,
        },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_blackberry", salience: "dominant" },
        { descriptorId: "desc_black_white_pepper", salience: "dominant" },
        { descriptorId: "desc_leather", salience: "supporting" },
      ],
    },
    {
      id: "ws_grenache",
      displayName: "Grenache",
      regionId: "rhone",
      grapeId: "grenache",
      climateMin: 3,
      climateMax: 4,
      structure: {
        tannins: { min: 3, max: 3 },
        sweetness: { min: 1, max: 1 },
        body: { min: 3, max: 3 },
        acidity: { min: 2, max: 2 },
        alcohol: { min: 4, max: 5 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 2, max: 2 },
        finish_length: { min: 3, max: 4 },
      },
      aromaClusters: [
        { clusterId: "cluster_red_fruit", intensityMin: 4, intensityMax: 5 },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_raspberry", salience: "dominant" },
        { descriptorId: "desc_strawberry", salience: "dominant" },
      ],
    },
    {
      id: "ws_nebbiolo",
      displayName: "Nebbiolo",
      regionId: "piedmont",
      grapeId: "nebbiolo",
      climateMin: 1,
      climateMax: 2,
      structure: {
        tannins: { min: 5, max: 5 },
        sweetness: { min: 1, max: 1 },
        body: { min: 4, max: 4 },
        acidity: { min: 4, max: 4 },
        alcohol: { min: 3, max: 3 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 3, max: 3 },
        finish_length: { min: 4, max: 5 },
      },
      aromaClusters: [
        { clusterId: "cluster_red_fruit", intensityMin: 4, intensityMax: 4 },
        { clusterId: "cluster_herbal", intensityMin: 2, intensityMax: 3 },
        {
          clusterId: "cluster_bottle_age_red",
          intensityMin: 3,
          intensityMax: 4,
        },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_red_cherry", salience: "dominant" },
        { descriptorId: "desc_leather", salience: "dominant" },
        { descriptorId: "desc_earth", salience: "supporting" },
        { descriptorId: "desc_black_white_pepper", salience: "supporting" },
      ],
    },
    {
      id: "ws_sangiovese",
      displayName: "Sangiovese",
      regionId: "tuscany",
      grapeId: "sangiovese",
      climateMin: 2,
      climateMax: 3,
      structure: {
        tannins: { min: 4, max: 4 },
        sweetness: { min: 1, max: 1 },
        body: { min: 3, max: 3 },
        acidity: { min: 4, max: 4 },
        alcohol: { min: 3, max: 3 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 3, max: 3 },
        finish_length: { min: 4, max: 4 },
      },
      aromaClusters: [
        { clusterId: "cluster_red_fruit", intensityMin: 4, intensityMax: 4 },
        {
          clusterId: "cluster_bottle_age_red",
          intensityMin: 2,
          intensityMax: 3,
        },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_red_cherry", salience: "dominant" },
        { descriptorId: "desc_earth", salience: "supporting" },
        { descriptorId: "desc_red_plum", salience: "supporting" },
      ],
    },
    {
      id: "ws_tempranillo",
      displayName: "Tempranillo",
      regionId: "rioja",
      grapeId: "tempranillo",
      climateMin: 2,
      climateMax: 3,
      structure: {
        tannins: { min: 4, max: 4 },
        sweetness: { min: 1, max: 1 },
        body: { min: 4, max: 4 },
        acidity: { min: 3, max: 3 },
        alcohol: { min: 3, max: 3 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 4, max: 4 },
        finish_length: { min: 4, max: 5 },
      },
      aromaClusters: [
        { clusterId: "cluster_red_fruit", intensityMin: 4, intensityMax: 4 },
        { clusterId: "cluster_oak", intensityMin: 4, intensityMax: 4 },
        {
          clusterId: "cluster_bottle_age_red",
          intensityMin: 3,
          intensityMax: 4,
        },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_strawberry", salience: "dominant" },
        { descriptorId: "desc_red_plum", salience: "dominant" },
        { descriptorId: "desc_leather", salience: "supporting" },
        { descriptorId: "desc_vanilla", salience: "supporting" },
      ],
    },
    {
      id: "ws_zinfandel",
      displayName: "Zinfandel",
      regionId: "california",
      grapeId: "zinfandel",
      climateMin: 3,
      climateMax: 4,
      structure: {
        tannins: { min: 3, max: 3 },
        sweetness: { min: 1, max: 1 },
        body: { min: 4, max: 4 },
        acidity: { min: 3, max: 3 },
        alcohol: { min: 4, max: 5 },
        overall_intensity: { min: 5, max: 5 },
        oak_influence: { min: 3, max: 3 },
        finish_length: { min: 3, max: 4 },
      },
      aromaClusters: [
        { clusterId: "cluster_black_fruit", intensityMin: 4, intensityMax: 5 },
        { clusterId: "cluster_red_fruit", intensityMin: 4, intensityMax: 4 },
        { clusterId: "cluster_oak", intensityMin: 3, intensityMax: 3 },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_blackberry", salience: "dominant" },
        { descriptorId: "desc_raspberry", salience: "dominant" },
        { descriptorId: "desc_vanilla", salience: "supporting" },
      ],
    },
    {
      id: "ws_chardonnay",
      displayName: "Chardonnay",
      regionId: "burgundy",
      grapeId: "chardonnay",
      climateMin: 1,
      climateMax: 2,
      structure: {
        tannins: { min: 1, max: 1 },
        sweetness: { min: 1, max: 1 },
        body: { min: 4, max: 4 },
        acidity: { min: 4, max: 4 },
        alcohol: { min: 3, max: 3 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 3, max: 3 },
        finish_length: { min: 4, max: 5 },
      },
      aromaClusters: [
        { clusterId: "cluster_green_fruit", intensityMin: 3, intensityMax: 4 },
        { clusterId: "cluster_malolactic", intensityMin: 3, intensityMax: 4 },
        { clusterId: "cluster_oak", intensityMin: 3, intensityMax: 3 },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_apple", salience: "dominant" },
        { descriptorId: "desc_butter", salience: "dominant" },
        { descriptorId: "desc_vanilla", salience: "dominant" },
        { descriptorId: "desc_cream", salience: "supporting" },
      ],
    },
    {
      id: "ws_riesling",
      displayName: "Riesling",
      regionId: "generic",
      grapeId: "riesling",
      climateMin: 1,
      climateMax: 2,
      structure: {
        tannins: { min: 1, max: 1 },
        sweetness: { min: 2, max: 5 },
        body: { min: 2, max: 2 },
        acidity: { min: 5, max: 5 },
        alcohol: { min: 1, max: 2 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 1, max: 1 },
        finish_length: { min: 3, max: 5 },
      },
      aromaClusters: [
        { clusterId: "cluster_citrus", intensityMin: 4, intensityMax: 4 },
        { clusterId: "cluster_green_fruit", intensityMin: 3, intensityMax: 4 },
        { clusterId: "cluster_floral", intensityMin: 3, intensityMax: 4 },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_grapefruit", salience: "dominant" },
        { descriptorId: "desc_apple", salience: "dominant" },
        { descriptorId: "desc_honeysuckle", salience: "supporting" },
      ],
    },
    {
      id: "ws_sauvignon_blanc",
      displayName: "Sauvignon Blanc",
      regionId: "loire",
      grapeId: "sauvignon_blanc",
      climateMin: 1,
      climateMax: 2,
      structure: {
        tannins: { min: 1, max: 1 },
        sweetness: { min: 1, max: 1 },
        body: { min: 2, max: 2 },
        acidity: { min: 5, max: 5 },
        alcohol: { min: 1, max: 2 },
        overall_intensity: { min: 4, max: 4 },
        oak_influence: { min: 1, max: 1 },
        finish_length: { min: 3, max: 4 },
      },
      aromaClusters: [
        { clusterId: "cluster_citrus", intensityMin: 4, intensityMax: 5 },
        { clusterId: "cluster_herbaceous", intensityMin: 4, intensityMax: 5 },
      ],
      aromaDescriptors: [
        { descriptorId: "desc_grapefruit", salience: "dominant" },
        { descriptorId: "desc_grass", salience: "dominant" },
        { descriptorId: "desc_green_bell_pepper", salience: "supporting" },
      ],
    },
  ];

  const structureDimIds = [
    "tannins",
    "sweetness",
    "body",
    "acidity",
    "alcohol",
    "overall_intensity",
    "oak_influence",
    "finish_length",
  ];

  for (const st of stylesData) {
    await db
      .insert(wineStyle)
      .values({
        id: st.id,
        displayName: st.displayName,
        styleType: "regional_archetype",
        producedColor:
          st.grapeId === "chardonnay" ||
          st.grapeId === "riesling" ||
          st.grapeId === "sauvignon_blanc"
            ? "white"
            : "red",
        wineCategory: "still",
        regionId: st.regionId,
        climateMin: st.climateMin,
        climateMax: st.climateMax,
        climateOrdinalScaleId: "climate_5",
        notes: null,
      })
      .onConflictDoNothing();

    await db
      .insert(wineStyleGrape)
      .values({
        wineStyleId: st.id,
        grapeVarietyId: st.grapeId,
        percentage: null,
      })
      .onConflictDoNothing();

    for (const dimId of structureDimIds) {
      const val = st.structure[dimId];
      if (!val) continue;
      await db
        .insert(wineStyleStructure)
        .values({
          wineStyleId: st.id,
          structureDimensionId: dimId,
          minValue: val.min,
          maxValue: val.max,
        })
        .onConflictDoNothing();
    }

    for (const ac of st.aromaClusters) {
      await db
        .insert(wineStyleAromaCluster)
        .values({
          wineStyleId: st.id,
          aromaClusterId: ac.clusterId,
          intensityMin: ac.intensityMin,
          intensityMax: ac.intensityMax,
        })
        .onConflictDoNothing();
    }

    for (const ad of st.aromaDescriptors) {
      await db
        .insert(wineStyleAromaDescriptor)
        .values({
          wineStyleId: st.id,
          aromaDescriptorId: ad.descriptorId,
          salience: ad.salience,
        })
        .onConflictDoNothing();
    }

    // Appearance: color_intensity for all; color_hue by producedColor (red/white). Values bounded by scale length.
    const isWhite =
      st.grapeId === "chardonnay" ||
      st.grapeId === "riesling" ||
      st.grapeId === "sauvignon_blanc";
    const appearanceRows: {
      dimensionId: string;
      scaleLength: number;
      min: number;
      max: number;
    }[] = [
      { dimensionId: "color_intensity", scaleLength: 3, min: 2, max: 3 }, // default Medium–Deep for reds, overwritten for some
    ];
    if (isWhite) {
      appearanceRows.push({
        dimensionId: "color_hue_white",
        scaleLength: 5,
        min: 1,
        max: 3,
      });
      if (st.grapeId === "riesling") {
        appearanceRows[0] = {
          dimensionId: "color_intensity",
          scaleLength: 3,
          min: 1,
          max: 2,
        };
      } else if (st.grapeId === "sauvignon_blanc") {
        appearanceRows[0] = {
          dimensionId: "color_intensity",
          scaleLength: 3,
          min: 1,
          max: 1,
        };
      }
    } else {
      appearanceRows.push({
        dimensionId: "color_hue_red",
        scaleLength: 5,
        min: 2,
        max: 3,
      });
      if (st.grapeId === "pinot_noir") {
        appearanceRows[0] = {
          dimensionId: "color_intensity",
          scaleLength: 3,
          min: 1,
          max: 2,
        };
      } else if (
        st.grapeId === "grenache" ||
        st.grapeId === "merlot" ||
        st.grapeId === "sangiovese"
      ) {
        appearanceRows[0] = {
          dimensionId: "color_intensity",
          scaleLength: 3,
          min: 2,
          max: 2,
        };
      }
    }
    for (const row of appearanceRows) {
      const result = validateOrdinalRange(row.scaleLength, row.min, row.max);
      if (!result.valid) throw new Error(`Appearance range: ${result.message}`);
      await db
        .insert(wineStyleAppearance)
        .values({
          wineStyleId: st.id,
          appearanceDimensionId: row.dimensionId,
          minValue: row.min,
          maxValue: row.max,
        })
        .onConflictDoNothing();
    }
  }

  // Promote user to admin. In local dev, fall back to a default email if env is not set.
  const adminEmail = process.env.ADMIN_EMAIL ?? "iphonelynden@gmail.com";
  if (!process.env.ADMIN_EMAIL) {
    console.log(
      `ADMIN_EMAIL not set; using default ${adminEmail} for local development admin promotion.`,
    );
  }
  const updated = await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, adminEmail))
    .returning({ email: user.email });
  if (updated.length > 0) {
    console.log(`Promoted ${adminEmail} to admin.`);
  } else {
    console.log(
      `No user found with email ${adminEmail}; register/login with that email, then rerun seed to promote.`,
    );
  }

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
