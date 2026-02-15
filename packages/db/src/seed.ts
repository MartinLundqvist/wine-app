import { db } from "./client";
import {
  attribute,
  grape,
  styleTarget,
  styleTargetAttribute,
  descriptor,
  styleTargetDescriptor,
  exerciseTemplate,
} from "./schema";

// Unique attributes: shared ones use scope "both", red-only and white-only use "red"/"white"
const ALL_ATTRIBUTES = [
  {
    attributeId: "tannin",
    name: "Tannin",
    wineColorScope: "red",
    dataType: "ordinal",
    scaleKey: "ordinal_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Perceived tannin intensity",
    sortOrder: 1,
  },
  {
    attributeId: "acidity",
    name: "Acidity",
    wineColorScope: "both",
    dataType: "ordinal",
    scaleKey: "ordinal_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Perceived acidity",
    sortOrder: 2,
  },
  {
    attributeId: "body",
    name: "Body",
    wineColorScope: "both",
    dataType: "ordinal",
    scaleKey: "ordinal_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Weight/viscosity",
    sortOrder: 3,
  },
  {
    attributeId: "alcohol",
    name: "Alcohol",
    wineColorScope: "both",
    dataType: "ordinal",
    scaleKey: "ordinal_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Alcohol warmth",
    sortOrder: 4,
  },
  {
    attributeId: "oak_intensity",
    name: "Oak intensity",
    wineColorScope: "both",
    dataType: "ordinal",
    scaleKey: "ordinal_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Oak impact",
    sortOrder: 5,
  },
  {
    attributeId: "color_intensity",
    name: "Color intensity",
    wineColorScope: "both",
    dataType: "ordinal",
    scaleKey: "color_intensity_1_3",
    minValue: 1,
    maxValue: 3,
    allowedValues: null,
    description: "Pale–Deep",
    sortOrder: 6,
  },
  {
    attributeId: "fruit_profile",
    name: "Fruit profile",
    wineColorScope: "both",
    dataType: "categorical",
    scaleKey: null,
    minValue: null,
    maxValue: null,
    allowedValues: '["Red","Black","Citrus","Orchard","Tropical"]',
    description: "Fruit direction",
    sortOrder: 7,
  },
  {
    attributeId: "fruit_intensity",
    name: "Fruit intensity",
    wineColorScope: "red",
    dataType: "ordinal",
    scaleKey: "ordinal_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Raw fruit expression level",
    sortOrder: 8,
  },
  {
    attributeId: "herbal_character",
    name: "Herbal character",
    wineColorScope: "both",
    dataType: "ordinal",
    scaleKey: "ordinal_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Green/herbal intensity",
    sortOrder: 9,
  },
  {
    attributeId: "earth_spice_character",
    name: "Earth/spice character",
    wineColorScope: "red",
    dataType: "ordinal",
    scaleKey: "ordinal_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Earth/spice presence",
    sortOrder: 10,
  },
  {
    attributeId: "sweetness",
    name: "Sweetness",
    wineColorScope: "white",
    dataType: "ordinal",
    scaleKey: "sweetness_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Residual sugar perception",
    sortOrder: 11,
  },
  {
    attributeId: "floral_character",
    name: "Floral character",
    wineColorScope: "white",
    dataType: "ordinal",
    scaleKey: "ordinal_1_5",
    minValue: 1,
    maxValue: 5,
    allowedValues: null,
    description: "Floral intensity",
    sortOrder: 12,
  },
];

async function seed() {
  console.log("Seeding attributes...");
  for (const a of ALL_ATTRIBUTES) {
    await db
      .insert(attribute)
      .values({
        attributeId: a.attributeId,
        name: a.name,
        wineColorScope: a.wineColorScope as "red" | "white" | "mixed" | "both",
        dataType: a.dataType as "ordinal" | "categorical",
        scaleKey: a.scaleKey as
          | "ordinal_1_5"
          | "color_intensity_1_3"
          | "sweetness_1_5"
          | null,
        minValue: a.minValue,
        maxValue: a.maxValue,
        allowedValues: a.allowedValues,
        description: a.description,
        sortOrder: a.sortOrder,
      })
      .onConflictDoNothing();
  }

  // Red grapes and style targets (coordinate table from schema)
  const RED_GRAPES: {
    grapeId: string;
    name: string;
    styleTargetId: string;
    styleTargetName: string;
    tannin: number;
    acidity: number;
    body: number;
    alcohol: number;
    oak: number;
    color: number;
    fruit: string;
    fruitIntensity: number;
    herbal: number;
    earthSpice: number;
  }[] = [
    {
      grapeId: "cabernet_sauvignon",
      name: "Cabernet Sauvignon",
      styleTargetId: "lvl1_cabernet_sauvignon",
      styleTargetName: "Cabernet Sauvignon",
      tannin: 5,
      acidity: 3,
      body: 5,
      alcohol: 4,
      oak: 4,
      color: 4,
      fruit: "Black",
      fruitIntensity: 4,
      herbal: 2,
      earthSpice: 2,
    },
    {
      grapeId: "merlot",
      name: "Merlot",
      styleTargetId: "lvl1_merlot",
      styleTargetName: "Merlot",
      tannin: 3,
      acidity: 3,
      body: 3,
      alcohol: 3,
      oak: 3,
      color: 3,
      fruit: "Black",
      fruitIntensity: 4,
      herbal: 1,
      earthSpice: 2,
    },
    {
      grapeId: "pinot_noir",
      name: "Pinot Noir",
      styleTargetId: "lvl1_pinot_noir",
      styleTargetName: "Pinot Noir",
      tannin: 2,
      acidity: 4,
      body: 2,
      alcohol: 3,
      oak: 2,
      color: 1,
      fruit: "Red",
      fruitIntensity: 3,
      herbal: 1,
      earthSpice: 3,
    },
    {
      grapeId: "syrah",
      name: "Syrah",
      styleTargetId: "lvl1_syrah",
      styleTargetName: "Syrah",
      tannin: 4,
      acidity: 3,
      body: 4,
      alcohol: 4,
      oak: 3,
      color: 3,
      fruit: "Black",
      fruitIntensity: 4,
      herbal: 2,
      earthSpice: 4,
    },
    {
      grapeId: "grenache",
      name: "Grenache",
      styleTargetId: "lvl1_grenache",
      styleTargetName: "Grenache",
      tannin: 3,
      acidity: 2,
      body: 3,
      alcohol: 5,
      oak: 2,
      color: 2,
      fruit: "Red",
      fruitIntensity: 4,
      herbal: 1,
      earthSpice: 2,
    },
    {
      grapeId: "nebbiolo",
      name: "Nebbiolo",
      styleTargetId: "lvl1_nebbiolo",
      styleTargetName: "Nebbiolo",
      tannin: 5,
      acidity: 5,
      body: 3,
      alcohol: 4,
      oak: 2,
      color: 1,
      fruit: "Red",
      fruitIntensity: 3,
      herbal: 2,
      earthSpice: 5,
    },
    {
      grapeId: "sangiovese",
      name: "Sangiovese",
      styleTargetId: "lvl1_sangiovese",
      styleTargetName: "Sangiovese",
      tannin: 3,
      acidity: 4,
      body: 3,
      alcohol: 3,
      oak: 2,
      color: 2,
      fruit: "Red",
      fruitIntensity: 3,
      herbal: 4,
      earthSpice: 3,
    },
    {
      grapeId: "tempranillo",
      name: "Tempranillo",
      styleTargetId: "lvl1_tempranillo",
      styleTargetName: "Tempranillo",
      tannin: 3,
      acidity: 3,
      body: 3,
      alcohol: 3,
      oak: 4,
      color: 2,
      fruit: "Red",
      fruitIntensity: 3,
      herbal: 2,
      earthSpice: 3,
    },
    {
      grapeId: "zinfandel",
      name: "Zinfandel",
      styleTargetId: "lvl1_zinfandel",
      styleTargetName: "Zinfandel",
      tannin: 3,
      acidity: 3,
      body: 4,
      alcohol: 5,
      oak: 3,
      color: 3,
      fruit: "Black",
      fruitIntensity: 5,
      herbal: 1,
      earthSpice: 3,
    },
  ];

  const WHITE_GRAPES: {
    grapeId: string;
    name: string;
    styleTargetId: string;
    styleTargetName: string;
    acidity: number;
    body: number;
    alcohol: number;
    oak: number;
    sweetness: number;
    color: number;
    fruit: string;
    herbal: number;
    floral: number;
  }[] = [
    {
      grapeId: "chardonnay",
      name: "Chardonnay",
      styleTargetId: "lvl1_chardonnay_oaked_ca",
      styleTargetName: "Chardonnay (Oaked CA)",
      acidity: 3,
      body: 4,
      alcohol: 4,
      oak: 4,
      sweetness: 1,
      color: 2,
      fruit: "Tropical",
      herbal: 1,
      floral: 1,
    },
    {
      grapeId: "riesling",
      name: "Riesling",
      styleTargetId: "lvl1_riesling_mosel",
      styleTargetName: "Riesling (Mosel)",
      acidity: 5,
      body: 2,
      alcohol: 2,
      oak: 1,
      sweetness: 2,
      color: 1,
      fruit: "Citrus",
      herbal: 1,
      floral: 4,
    },
    {
      grapeId: "sauvignon_blanc",
      name: "Sauvignon Blanc",
      styleTargetId: "lvl1_sauvignon_blanc_nz",
      styleTargetName: "Sauvignon Blanc (NZ)",
      acidity: 5,
      body: 2,
      alcohol: 3,
      oak: 1,
      sweetness: 1,
      color: 1,
      fruit: "Citrus",
      herbal: 5,
      floral: 2,
    },
  ];

  console.log("Seeding grapes and style targets...");
  for (const g of RED_GRAPES) {
    await db
      .insert(grape)
      .values({
        grapeId: g.grapeId,
        name: g.name,
        wineColor: "red",
        level: 1,
        canonicalStyleTargetId: g.styleTargetId,
      })
      .onConflictDoNothing();
    await db
      .insert(styleTarget)
      .values({
        styleTargetId: g.styleTargetId,
        grapeId: g.grapeId,
        name: g.styleTargetName,
        wineColor: "red",
        level: 1,
        isPrimaryForGrape: true,
        version: 1,
      })
      .onConflictDoNothing();
  }
  for (const g of WHITE_GRAPES) {
    await db
      .insert(grape)
      .values({
        grapeId: g.grapeId,
        name: g.name,
        wineColor: "white",
        level: 1,
        canonicalStyleTargetId: g.styleTargetId,
      })
      .onConflictDoNothing();
    await db
      .insert(styleTarget)
      .values({
        styleTargetId: g.styleTargetId,
        grapeId: g.grapeId,
        name: g.styleTargetName,
        wineColor: "white",
        level: 1,
        isPrimaryForGrape: true,
        version: 1,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding style_target_attribute (red)...");
  const RED_ATTR_IDS = [
    "tannin",
    "acidity",
    "body",
    "alcohol",
    "oak_intensity",
    "color_intensity",
    "fruit_profile",
    "fruit_intensity",
    "herbal_character",
    "earth_spice_character",
  ];
  for (const g of RED_GRAPES) {
    const vals = [
      g.tannin,
      g.acidity,
      g.body,
      g.alcohol,
      g.oak,
      g.color,
      g.fruit,
      g.fruitIntensity,
      g.herbal,
      g.earthSpice,
    ];
    for (let i = 0; i < RED_ATTR_IDS.length; i++) {
      const attrId = RED_ATTR_IDS[i];
      const v = vals[i];
      await db
        .insert(styleTargetAttribute)
        .values({
          styleTargetId: g.styleTargetId,
          attributeId: attrId,
          valueOrdinal: typeof v === "number" ? v : null,
          valueCategorical: typeof v === "string" ? v : null,
          source: "Level 1 canonical table v1",
        })
        .onConflictDoNothing();
    }
  }

  console.log("Seeding style_target_attribute (white)...");
  const WHITE_ATTR_IDS = [
    "acidity",
    "body",
    "alcohol",
    "oak_intensity",
    "sweetness",
    "color_intensity",
    "fruit_profile",
    "herbal_character",
    "floral_character",
  ];
  for (const g of WHITE_GRAPES) {
    const vals = [
      g.acidity,
      g.body,
      g.alcohol,
      g.oak,
      g.sweetness,
      g.color,
      g.fruit,
      g.herbal,
      g.floral,
    ];
    for (let i = 0; i < WHITE_ATTR_IDS.length; i++) {
      const attrId = WHITE_ATTR_IDS[i];
      const v = vals[i];
      await db
        .insert(styleTargetAttribute)
        .values({
          styleTargetId: g.styleTargetId,
          attributeId: attrId,
          valueOrdinal: typeof v === "number" ? v : null,
          valueCategorical: typeof v === "string" ? v : null,
          source: "Level 1 canonical table v1",
        })
        .onConflictDoNothing();
    }
  }

  console.log("Seeding descriptors...");
  const DESCRIPTORS: {
    descriptorId: string;
    name: string;
    category: string;
    wineColorScope: string;
  }[] = [
    {
      descriptorId: "strawberry",
      name: "Strawberry",
      category: "fruit",
      wineColorScope: "red",
    },
    {
      descriptorId: "cherry",
      name: "Cherry",
      category: "fruit",
      wineColorScope: "red",
    },
    {
      descriptorId: "raspberry",
      name: "Raspberry",
      category: "fruit",
      wineColorScope: "red",
    },
    {
      descriptorId: "red_plum",
      name: "Red Plum",
      category: "fruit",
      wineColorScope: "red",
    },
    {
      descriptorId: "blackcurrant",
      name: "Blackcurrant",
      category: "fruit",
      wineColorScope: "red",
    },
    {
      descriptorId: "blackberry",
      name: "Blackberry",
      category: "fruit",
      wineColorScope: "red",
    },
    {
      descriptorId: "black_plum",
      name: "Black Plum",
      category: "fruit",
      wineColorScope: "red",
    },
    {
      descriptorId: "blueberry",
      name: "Blueberry",
      category: "fruit",
      wineColorScope: "red",
    },
    {
      descriptorId: "lemon",
      name: "Lemon",
      category: "fruit",
      wineColorScope: "white",
    },
    {
      descriptorId: "lime",
      name: "Lime",
      category: "fruit",
      wineColorScope: "white",
    },
    {
      descriptorId: "grapefruit",
      name: "Grapefruit",
      category: "fruit",
      wineColorScope: "white",
    },
    {
      descriptorId: "green_apple",
      name: "Green Apple",
      category: "fruit",
      wineColorScope: "white",
    },
    {
      descriptorId: "pear",
      name: "Pear",
      category: "fruit",
      wineColorScope: "white",
    },
    {
      descriptorId: "peach",
      name: "Peach",
      category: "fruit",
      wineColorScope: "white",
    },
    {
      descriptorId: "pineapple",
      name: "Pineapple",
      category: "fruit",
      wineColorScope: "white",
    },
    {
      descriptorId: "mango",
      name: "Mango",
      category: "fruit",
      wineColorScope: "white",
    },
    {
      descriptorId: "passionfruit",
      name: "Passionfruit",
      category: "fruit",
      wineColorScope: "white",
    },
    {
      descriptorId: "violet",
      name: "Violet",
      category: "floral",
      wineColorScope: "red",
    },
    {
      descriptorId: "rose",
      name: "Rose",
      category: "floral",
      wineColorScope: "red",
    },
    {
      descriptorId: "white_blossom",
      name: "White Blossom",
      category: "floral",
      wineColorScope: "white",
    },
    {
      descriptorId: "honeysuckle",
      name: "Honeysuckle",
      category: "floral",
      wineColorScope: "white",
    },
    {
      descriptorId: "green_pepper",
      name: "Green Pepper",
      category: "herbal",
      wineColorScope: "red",
    },
    {
      descriptorId: "tomato_leaf",
      name: "Tomato Leaf",
      category: "herbal",
      wineColorScope: "red",
    },
    {
      descriptorId: "fresh_herbs",
      name: "Fresh Herbs",
      category: "herbal",
      wineColorScope: "red",
    },
    {
      descriptorId: "grass",
      name: "Grass",
      category: "herbal",
      wineColorScope: "white",
    },
    {
      descriptorId: "black_pepper",
      name: "Black Pepper",
      category: "spice",
      wineColorScope: "red",
    },
    {
      descriptorId: "clove",
      name: "Clove",
      category: "spice",
      wineColorScope: "red",
    },
    {
      descriptorId: "cinnamon",
      name: "Cinnamon",
      category: "spice",
      wineColorScope: "red",
    },
    {
      descriptorId: "anise",
      name: "Anise",
      category: "spice",
      wineColorScope: "red",
    },
    {
      descriptorId: "mushroom",
      name: "Mushroom",
      category: "earth",
      wineColorScope: "red",
    },
    {
      descriptorId: "leather",
      name: "Leather",
      category: "earth",
      wineColorScope: "red",
    },
    {
      descriptorId: "dried_leaves",
      name: "Dried Leaves",
      category: "earth",
      wineColorScope: "red",
    },
    {
      descriptorId: "smoke",
      name: "Smoke",
      category: "earth",
      wineColorScope: "red",
    },
    {
      descriptorId: "vanilla",
      name: "Vanilla",
      category: "oak",
      wineColorScope: "both",
    },
    {
      descriptorId: "toast",
      name: "Toast",
      category: "oak",
      wineColorScope: "both",
    },
    {
      descriptorId: "caramel",
      name: "Caramel",
      category: "oak",
      wineColorScope: "white",
    },
    {
      descriptorId: "cedar",
      name: "Cedar",
      category: "oak",
      wineColorScope: "red",
    },
  ];
  for (const d of DESCRIPTORS) {
    await db
      .insert(descriptor)
      .values({
        descriptorId: d.descriptorId,
        name: d.name,
        category: d.category as
          | "fruit"
          | "floral"
          | "herbal"
          | "spice"
          | "earth"
          | "oak",
        wineColorScope: d.wineColorScope as "red" | "white" | "both",
      })
      .onConflictDoNothing();
  }

  // style_target_descriptor: map descriptor to style targets (archetype anchors from doc)
  const STD: {
    styleTargetId: string;
    descriptorId: string;
    relevance: "primary" | "secondary" | "occasional";
  }[] = [
    {
      styleTargetId: "lvl1_pinot_noir",
      descriptorId: "strawberry",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_sangiovese",
      descriptorId: "cherry",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_pinot_noir",
      descriptorId: "cherry",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_grenache",
      descriptorId: "raspberry",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_sangiovese",
      descriptorId: "red_plum",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_cabernet_sauvignon",
      descriptorId: "blackcurrant",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_syrah",
      descriptorId: "blackberry",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_merlot",
      descriptorId: "black_plum",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_zinfandel",
      descriptorId: "blueberry",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_riesling_mosel",
      descriptorId: "lemon",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_sauvignon_blanc_nz",
      descriptorId: "lime",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_sauvignon_blanc_nz",
      descriptorId: "grapefruit",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_riesling_mosel",
      descriptorId: "green_apple",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_chardonnay_oaked_ca",
      descriptorId: "pear",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_riesling_mosel",
      descriptorId: "peach",
      relevance: "secondary",
    },
    {
      styleTargetId: "lvl1_chardonnay_oaked_ca",
      descriptorId: "pineapple",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_chardonnay_oaked_ca",
      descriptorId: "mango",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_sauvignon_blanc_nz",
      descriptorId: "passionfruit",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_nebbiolo",
      descriptorId: "violet",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_nebbiolo",
      descriptorId: "rose",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_riesling_mosel",
      descriptorId: "white_blossom",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_riesling_mosel",
      descriptorId: "honeysuckle",
      relevance: "secondary",
    },
    {
      styleTargetId: "lvl1_cabernet_sauvignon",
      descriptorId: "green_pepper",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_cabernet_sauvignon",
      descriptorId: "tomato_leaf",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_sangiovese",
      descriptorId: "fresh_herbs",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_sauvignon_blanc_nz",
      descriptorId: "grass",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_syrah",
      descriptorId: "black_pepper",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_tempranillo",
      descriptorId: "cinnamon",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_nebbiolo",
      descriptorId: "anise",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_pinot_noir",
      descriptorId: "mushroom",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_tempranillo",
      descriptorId: "leather",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_nebbiolo",
      descriptorId: "dried_leaves",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_syrah",
      descriptorId: "smoke",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_chardonnay_oaked_ca",
      descriptorId: "vanilla",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_chardonnay_oaked_ca",
      descriptorId: "caramel",
      relevance: "primary",
    },
    {
      styleTargetId: "lvl1_cabernet_sauvignon",
      descriptorId: "cedar",
      relevance: "primary",
    },
  ];
  for (const row of STD) {
    await db
      .insert(styleTargetDescriptor)
      .values({
        styleTargetId: row.styleTargetId,
        descriptorId: row.descriptorId,
        relevance: row.relevance,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding exercise templates...");
  const TEMPLATES = [
    {
      exerciseTemplateId: "map_place_red_structure",
      name: "Red Structure Map (Place)",
      level: 1,
      wineColor: "red",
      format: "map_place",
      promptStem: "Place {grape} on the map.",
      testedAttributeIds: '["tannin","acidity"]',
      selectionRules: "{}",
      correctnessRules: "{}",
      difficulty: "easy",
    },
    {
      exerciseTemplateId: "map_recall_red",
      name: "Red Map Recall",
      level: 1,
      wineColor: "red",
      format: "map_recall",
      promptStem: "Place all red grapes on the map.",
      testedAttributeIds: '["tannin","acidity"]',
      selectionRules: "{}",
      correctnessRules: "{}",
      difficulty: "medium",
    },
    {
      exerciseTemplateId: "order_rank_tannin_red",
      name: "Order by Tannin (Red)",
      level: 1,
      wineColor: "red",
      format: "order_rank",
      promptStem: "Rank these grapes by tannin (low to high).",
      testedAttributeIds: '["tannin"]',
      selectionRules: "{}",
      correctnessRules: "{}",
      difficulty: "easy",
    },
    {
      exerciseTemplateId: "descriptor_match_red",
      name: "Descriptor Matching (Red)",
      level: 1,
      wineColor: "red",
      format: "descriptor_match",
      promptStem: "Match descriptors to grapes.",
      testedAttributeIds: "[]",
      selectionRules: "{}",
      correctnessRules: "{}",
      difficulty: "medium",
    },
    {
      exerciseTemplateId: "structure_deduction_red",
      name: "Structure Deduction (Red)",
      level: 1,
      wineColor: "red",
      format: "structure_deduction",
      promptStem: "Given the structure, identify the grape.",
      testedAttributeIds: '["tannin","acidity","body"]',
      selectionRules: "{}",
      correctnessRules: "{}",
      difficulty: "medium",
    },
    {
      exerciseTemplateId: "elimination_red",
      name: "Elimination (Red)",
      level: 1,
      wineColor: "red",
      format: "elimination",
      promptStem: "Remove the grape that doesn't match.",
      testedAttributeIds: "[]",
      selectionRules: "{}",
      correctnessRules: "{}",
      difficulty: "hard",
    },
    {
      exerciseTemplateId: "skeleton_deduction_red",
      name: "Skeleton Deduction (Red)",
      level: 1,
      wineColor: "red",
      format: "skeleton_deduction",
      promptStem: "Structure only: identify the grape.",
      testedAttributeIds: '["tannin","acidity","body"]',
      selectionRules: "{}",
      correctnessRules: "{}",
      difficulty: "hard",
    },
    {
      exerciseTemplateId: "tasting_input_red",
      name: "Tasting Mode (Red)",
      level: 1,
      wineColor: "red",
      format: "tasting_input",
      promptStem: "Enter your tasting notes.",
      testedAttributeIds:
        '["tannin","acidity","body","alcohol","oak_intensity"]',
      selectionRules: "{}",
      correctnessRules: "{}",
      difficulty: "medium",
    },
  ];
  for (const t of TEMPLATES) {
    await db
      .insert(exerciseTemplate)
      .values({
        exerciseTemplateId: t.exerciseTemplateId,
        name: t.name,
        level: t.level,
        wineColor: t.wineColor,
        format: t.format as any,
        promptStem: t.promptStem,
        testedAttributeIds: t.testedAttributeIds,
        selectionRules: t.selectionRules,
        correctnessRules: t.correctnessRules,
        difficulty: t.difficulty as any,
      })
      .onConflictDoNothing();
  }

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
