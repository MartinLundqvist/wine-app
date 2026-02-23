import type {
  ConfusionDifficulty,
  ConfusionDistractor,
  ConfusionGroupResponse,
  WineStyleFull,
} from "@wine-app/shared";

type ClusterRow = { id: string; displayName: string; aromaSourceId: string };
type DescriptorRow = { id: string; displayName: string; aromaClusterId: string };

const STRUCT_DIM_IDS = [
  "tannins",
  "sweetness",
  "body",
  "acidity",
  "alcohol",
  "overall_intensity",
  "oak_influence",
  "finish_length",
] as const;
const SCALE_MAX = 5;

function getStructValue(
  style: WineStyleFull,
  dimId: string
): number | null {
  const row = (style.structure ?? []).find(
    (s) => s.structureDimensionId === dimId
  );
  if (!row) return null;
  const min = row.minValue ?? 0;
  const max = row.maxValue ?? min;
  return (min + max) / 2;
}

function getStructNormalized(style: WineStyleFull, dimId: string): number {
  const v = getStructValue(style, dimId);
  if (v == null) return 0;
  return Math.min(1, Math.max(0, v / SCALE_MAX));
}

function getStructureVector(style: WineStyleFull): number[] {
  return STRUCT_DIM_IDS.map((id) => getStructNormalized(style, id));
}

function getDirectionVector(style: WineStyleFull): [number, number, number] {
  const body = getStructValue(style, "body");
  const oak = getStructValue(style, "oak_influence");
  const intensity = getStructValue(style, "overall_intensity");
  return [
    body != null ? body / SCALE_MAX : 0,
    oak != null ? oak / SCALE_MAX : 0,
    intensity != null ? intensity / SCALE_MAX : 0,
  ];
}

function getPrimaryDominantDescriptors(
  style: WineStyleFull,
  primaryClusterIds: Set<string>
): { descIds: Set<string>; clusterIds: Set<string> } {
  const descIds = new Set<string>();
  const clusterIds = new Set<string>();
  for (const a of style.aromaDescriptors ?? []) {
    if (a.salience !== "dominant" || !a.descriptor) continue;
    const clusterId = a.cluster?.id;
    if (!clusterId || !primaryClusterIds.has(clusterId)) continue;
    descIds.add(a.aromaDescriptorId);
    clusterIds.add(clusterId);
  }
  return { descIds, clusterIds };
}

function manhattan(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++)
    sum += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
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
  styles: WineStyleFull[],
  clusters: ClusterRow[],
  descriptors: DescriptorRow[],
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

  const primaryClusterIds = new Set(
    clusters.filter((c) => c.aromaSourceId === "primary").map((c) => c.id)
  );

  const targetStruct = getStructureVector(target);
  const targetDir = getDirectionVector(target);
  const targetAroma = getPrimaryDominantDescriptors(
    target,
    primaryClusterIds
  );

  const gateWidth = difficulty === "easy" ? 2 : 1;
  const dirThreshold =
    difficulty === "medium" ? 0.65 : difficulty === "hard" ? 0.55 : 1;
  const aromaMin =
    difficulty === "medium" ? 0.05 : difficulty === "hard" ? 0.15 : 0;

  const candidates = styles.filter((s) => {
    if (s.id === targetId) return false;
    if (
      s.producedColor !== target.producedColor ||
      s.wineCategory !== target.wineCategory
    )
      return false;
    for (const id of STRUCT_DIM_IDS) {
      const tv = getStructValue(target, id);
      const sv = getStructValue(s, id);
      if (
        tv != null &&
        sv != null &&
        Math.abs(tv - sv) > gateWidth
      )
        return false;
    }
    return true;
  });

  const scored = candidates.map((s) => {
    const sStruct = getStructureVector(s);
    const sDir = getDirectionVector(s);
    const sAroma = getPrimaryDominantDescriptors(s, primaryClusterIds);
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

  const termDisplayMap = new Map(
    descriptors.map((d) => [d.id, d.displayName] as const)
  );

  const toDistractor = (
    c: (typeof filtered)[0],
    role: ConfusionDistractor["role"]
  ): ConfusionDistractor => {
    const shared = [...c.sAroma.descIds].filter((id) =>
      targetAroma.descIds.has(id)
    );
    const targetOnly = [...targetAroma.descIds].filter(
      (id) => !c.sAroma.descIds.has(id)
    );
    const distractorOnly = [...c.sAroma.descIds].filter(
      (id) => !targetAroma.descIds.has(id)
    );
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
    const distractorNames = distractorOnly.map(
      (id) => termDisplayMap.get(id) ?? id
    );
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
