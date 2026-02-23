export const queryKeys = {
  grapes: ["grapes"] as const,
  styleTargets: ["style-targets"] as const,
  styleTarget: (id: string) => ["style-target", id] as const,
  regions: ["regions"] as const,
  regionsMapConfig: ["regions-map-config"] as const,
  aromaTaxonomy: ["aroma-taxonomy"] as const,
  structureDimensions: ["structure-dimensions"] as const,
  ordinalScales: ["ordinal-scales"] as const,
  confusionGroup: (id: string, difficulty: string) =>
    ["confusion-group", id, difficulty] as const,
} as const;
