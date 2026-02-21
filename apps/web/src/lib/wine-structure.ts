import type { StyleTargetFull } from "@wine-app/shared";

export type StructureRow = NonNullable<StyleTargetFull["structure"]>[number];

export function getStructureRow(
  structure: StyleTargetFull["structure"],
  dimensionId: string,
): StructureRow | undefined {
  return structure?.find(
    (s) =>
      s.structureDimensionId === dimensionId || s.dimension?.id === dimensionId,
  );
}

/** Returns min, max, and scale max for an ordinal dimension. Used for range display and sort. */
export function getStructureRange(
  structure: StyleTargetFull["structure"],
  dimensionId: string,
): { minValue: number; maxValue: number; scaleMax: number } | null {
  const row = getStructureRow(structure, dimensionId);
  if (!row?.dimension || row.dimension.scaleType !== "ordinal") return null;
  const scaleMax = row.dimension.scaleMax ?? 5;
  const min = row.minValue ?? row.maxValue ?? 0;
  const max = row.maxValue ?? row.minValue ?? 0;
  return {
    minValue: Math.min(min, max),
    maxValue: Math.min(Math.max(min, max), scaleMax),
    scaleMax,
  };
}

/** Single numeric value for sorting: midpoint when range, else the value. */
export function getStructureSortValue(
  structure: StyleTargetFull["structure"],
  dimensionId: string,
): number {
  const range = getStructureRange(structure, dimensionId);
  if (!range) return 0;
  return (range.minValue + range.maxValue) / 2;
}
