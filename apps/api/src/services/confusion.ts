import type {
  ConfusionDifficulty,
  ConfusionDistractor,
  ConfusionGroupResponse,
  StyleTargetFull,
} from "@wine-app/shared";

type AromaTermLike = { id: string; displayName: string; parentId: string | null; source: string };

const STRUCT_DIM_IDS = ["acidity", "tannin", "alcohol", "body", "oak_intensity", "flavor_intensity"] as const;
const SCALE_MAX: Record<string, number> = {
  acidity: 5,
  tannin: 5,
  alcohol: 3,
  body: 5,
  oak_intensity: 5,
  flavor_intensity: 5,
};

const FRUIT_PROFILE_NUM: Record<string, number> = {
  Red: 0,
  Black: 1,
  Citrus: 0,
  Orchard: 0.5,
  Tropical: 1,
};

function getStructValue(
  style: StyleTargetFull,
  dimId: string
): number | null {
  const row = (style.structure ?? []).find((s) => s.structureDimensionId === dimId);
  if (!row) return null;
  if (row.categoricalValue) {
    const n = FRUIT_PROFILE_NUM[row.categoricalValue];
    return n !== undefined ? n : null;
  }
  const min = row.minValue ?? 0;
  const max = row.maxValue ?? min;
  return (min + max) / 2;
}

function getStructNormalized(style: StyleTargetFull, dimId: string): number {
  const v = getStructValue(style, dimId);
  if (v == null) return 0;
  const max = SCALE_MAX[dimId] ?? 5;
  return Math.min(1, Math.max(0, v / max));
}

function getStructureVector(style: StyleTargetFull): number[] {
  return STRUCT_DIM_IDS.map((id) => getStructNormalized(style, id));
}

function getDirectionVector(style: StyleTargetFull): [number, number, number] {
  const fruit = getStructValue(style, "fruit_profile");
  const herbalRow = (style.structure ?? []).find((s) => s.structureDimensionId === "herbal_character");
  const earthRow = (style.structure ?? []).find((s) => s.structureDimensionId === "earth_spice_character");
  const herbal = herbalRow?.minValue != null ? (herbalRow.minValue + (herbalRow.maxValue ?? herbalRow.minValue)) / 2 / 5 : 0;
  const earth = earthRow?.minValue != null ? (earthRow.minValue + (earthRow.maxValue ?? earthRow.minValue)) / 2 / 5 : 0;
  const fp = fruit != null ? fruit : 0;
  return [fp, Math.min(1, herbal), Math.min(1, earth)];
}

function getPrimaryDominantDescriptors(
  style: StyleTargetFull,
  allowedPrimaryClusterIds: Set<string>
): { descIds: Set<string>; clusterIds: Set<string> } {
  const descIds = new Set<string>();
  const clusterIds = new Set<string>();
  for (const a of style.aromas ?? []) {
    if (a.prominence !== "dominant" || !a.term) continue;
    const term = a.term as AromaTermLike;
    if (term.source !== "primary") continue;
    if (!allowedPrimaryClusterIds.has(term.parentId ?? "")) continue;
    descIds.add(a.aromaTermId);
    clusterIds.add(term.parentId!);
  }
  return { descIds, clusterIds };
}

function manhattan(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
  return sum / a.length;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function getConfusionGroup(
  styles: StyleTargetFull[],
  aromaTerms: AromaTermLike[],
  targetId: string,
  difficulty: ConfusionDifficulty
): ConfusionGroupResponse {
  const target = styles.find((s) => s.id === targetId);
  if (!target) {
    return {
      targetStyleId: targetId,
      difficulty,
      distractors: [],
      insufficientCandidates: true,
      generatedAt: new Date().toISOString(),
    };
  }

  const allowedPrimaryClusterIds = new Set(
    aromaTerms.filter((t) => t.parentId === "source_primary").map((t) => t.id)
  );

  const targetStruct = getStructureVector(target);
  const targetDir = getDirectionVector(target);
  const targetAroma = getPrimaryDominantDescriptors(target, allowedPrimaryClusterIds);

  const gateWidth = difficulty === "easy" ? 2 : 1;
  const dirThreshold = difficulty === "medium" ? 0.65 : difficulty === "hard" ? 0.55 : 1;
  const aromaMin = difficulty === "medium" ? 0.05 : difficulty === "hard" ? 0.15 : 0;

  const candidates = styles.filter((s) => {
    if (s.id === targetId) return false;
    if (s.producedColor !== target.producedColor || s.wineCategory !== target.wineCategory) return false;
    for (const id of STRUCT_DIM_IDS) {
      const tv = getStructValue(target, id);
      const sv = getStructValue(s, id);
      if (tv != null && sv != null && Math.abs(tv - sv) > gateWidth) return false;
    }
    return true;
  });

  const scored = candidates.map((s) => {
    const sStruct = getStructureVector(s);
    const sDir = getDirectionVector(s);
    const sAroma = getPrimaryDominantDescriptors(s, allowedPrimaryClusterIds);
    const D_struct = manhattan(targetStruct, sStruct);
    const D_dir = manhattan(targetDir, sDir);
    const jDesc = jaccard(targetAroma.descIds, sAroma.descIds);
    const jCluster = jaccard(targetAroma.clusterIds, sAroma.clusterIds);
    const d_aroma = 1 - 0.5 * jDesc - 0.5 * jCluster;
    const D_total = 0.6 * D_struct + 0.3 * D_dir + 0.1 * d_aroma;
    const similarity = 1 - D_total;
    const aromaSim = 0.5 * jDesc + 0.5 * jCluster;
    return {
      style: s,
      similarity,
      D_struct,
      D_dir,
      aromaSim,
      sStruct,
      sDir,
      sAroma,
    };
  });

  let filtered = scored.filter(
    (c) => c.D_dir <= dirThreshold && c.aromaSim >= aromaMin
  );
  if (filtered.length < 3) {
    filtered = scored.filter((c) => c.D_dir <= dirThreshold);
    if (filtered.length < 3) filtered = scored;
  }

  filtered.sort((a, b) => b.similarity - a.similarity);

  const termDisplayMap = new Map(aromaTerms.map((t) => [t.id, t.displayName]));

  const toDistractor = (
    c: (typeof filtered)[0],
    role: ConfusionDistractor["role"]
  ): ConfusionDistractor => {
    const shared = [...c.sAroma.descIds].filter((id) => targetAroma.descIds.has(id));
    const targetOnly = [...targetAroma.descIds].filter((id) => !c.sAroma.descIds.has(id));
    const distractorOnly = [...c.sAroma.descIds].filter((id) => !targetAroma.descIds.has(id));
    const pivotDimensions: string[] = [];
    let maxDiff = 0;
    for (let i = 0; i < STRUCT_DIM_IDS.length; i++) {
      const d = Math.abs((targetStruct[i] ?? 0) - (c.sStruct[i] ?? 0));
      if (d > maxDiff) maxDiff = d;
    }
    for (let i = 0; i < STRUCT_DIM_IDS.length; i++) {
      const d = Math.abs((targetStruct[i] ?? 0) - (c.sStruct[i] ?? 0));
      if (d >= maxDiff - 0.01 && pivotDimensions.length < 2) {
        pivotDimensions.push(STRUCT_DIM_IDS[i]);
      }
    }
    const sharedNames = shared.map((id) => termDisplayMap.get(id) ?? id);
    const targetNames = targetOnly.map((id) => termDisplayMap.get(id) ?? id);
    const distractorNames = distractorOnly.map((id) => termDisplayMap.get(id) ?? id);
    const whyConfusing =
      sharedNames.length > 0
        ? `Both show ${sharedNames.slice(0, 3).join(", ")}. Structure is similar.`
        : "Structure and style are similar.";
    const howToDistinguish =
      targetNames.length > 0 || pivotDimensions.length > 0
        ? `${target.displayName} shows ${targetNames.slice(0, 2).join(", ") || "different structure"}. Key differences: ${pivotDimensions.join(", ") || "aroma"}.`
        : `Focus on ${pivotDimensions.join(" and ")} to tell them apart.`;
    return {
      styleId: c.style.id,
      styleName: c.style.displayName,
      role,
      similarity: Math.round(c.similarity * 100) / 100,
      pivotDimensions,
      aromaSets: {
        sharedAromas: sharedNames,
        targetUniqueAromas: targetNames,
        distractorUniqueAromas: distractorNames,
      },
      whyConfusing,
      howToDistinguish,
    };
  };

  const evilTwin = filtered[0];
  const structuralMatch = filtered.find(
    (c) => c.D_struct < 0.3 && c.D_dir > 0.2
  );
  const directionalMatch = filtered.find(
    (c) => c.D_dir < 0.25 && c.D_struct > 0.15
  );

  const used = new Set<string>();
  const distractors: ConfusionDistractor[] = [];
  if (evilTwin && !used.has(evilTwin.style.id)) {
    distractors.push(toDistractor(evilTwin, "evil_twin"));
    used.add(evilTwin.style.id);
  }
  const s2 = structuralMatch ?? filtered[1];
  if (s2 && !used.has(s2.style.id)) {
    distractors.push(toDistractor(s2, "structural_match"));
    used.add(s2.style.id);
  }
  const s3 = directionalMatch ?? filtered.find((c) => !used.has(c.style.id));
  if (s3 && !used.has(s3.style.id)) {
    distractors.push(toDistractor(s3, "directional_match"));
  }

  return {
    targetStyleId: targetId,
    difficulty,
    distractors: distractors.slice(0, 3),
    insufficientCandidates: filtered.length < 3,
    generatedAt: new Date().toISOString(),
  };
}
