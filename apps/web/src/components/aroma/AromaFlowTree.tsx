import { useMemo, useState } from "react";
import type { AromaTerm } from "@wine-app/shared";
import { Chip } from "../ui/Chip";

type AromaSource = "primary" | "secondary" | "tertiary";

const SOURCE_COLORS: Record<AromaSource, { border: string; bg: string }> = {
  primary: {
    border: "border-burgundy-700",
    bg: "bg-burgundy-800/30",
  },
  secondary: {
    border: "border-oak-600",
    bg: "bg-oak-800/30",
  },
  tertiary: {
    border: "border-moss-600",
    bg: "bg-moss-700/30",
  },
};

function buildByParent(terms: AromaTerm[]) {
  const byParent = new Map<string | null, AromaTerm[]>();
  for (const t of terms) {
    const key = t.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(t);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
  return byParent;
}

export function AromaFlowTree({ terms }: { terms: AromaTerm[] }) {
  const byParent = useMemo(() => buildByParent(terms), [terms]);
  const roots = useMemo(
    () => (byParent.get(null) ?? []).filter((r): r is AromaTerm & { source: AromaSource } => r.source != null),
    [byParent],
  );

  const [selectedSource, setSelectedSource] = useState<AromaTerm | null>(
    null,
  );
  const [selectedCluster, setSelectedCluster] = useState<AromaTerm | null>(
    null,
  );

  const clusters = useMemo(
    () =>
      selectedSource
        ? (byParent.get(selectedSource.id) ?? [])
        : [],
    [byParent, selectedSource],
  );
  const descriptors = useMemo(
    () =>
      selectedCluster
        ? (byParent.get(selectedCluster.id) ?? [])
        : [],
    [byParent, selectedCluster],
  );

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[480px] transition-opacity duration-base">
      {/* Column 1: Sources */}
      <div className="relative z-10 flex flex-col gap-3">
        <p className="text-micro text-cork-400 uppercase tracking-wider font-ui mb-1">
          Source
        </p>
        {roots.map((r) => {
          const colors = SOURCE_COLORS[r.source as AromaSource];
          const isSelected = selectedSource?.id === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelectedSource(isSelected ? null : r);
                setSelectedCluster(null);
              }}
              className={`text-left rounded-control p-4 border-2 transition-all duration-base ${colors.border} ${colors.bg} ${
                isSelected
                  ? "ring-2 ring-brass-500/50 ring-offset-2 ring-offset-cellar-950"
                  : "hover:opacity-90"
              }`}
            >
              <span className="font-display text-h3 text-linen-100 block">
                {r.displayName}
              </span>
              {r.description && (
                <span className="text-small text-cork-300 mt-0.5 block">
                  {r.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Column 2: Clusters */}
      <div className="relative z-10 flex flex-col">
        <p className="text-micro text-cork-400 uppercase tracking-wider font-ui mb-1">
          Cluster
        </p>
        {selectedSource ? (
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1">
            {clusters.map((c) => {
              const colors = SOURCE_COLORS[c.source as AromaSource];
              const isSelected = selectedCluster?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setSelectedCluster(isSelected ? null : c)
                  }
                  className={`text-left rounded-control px-3 py-2.5 border transition-all duration-base ${colors.border} ${colors.bg} ${
                    isSelected
                      ? "ring-2 ring-brass-500/50 ring-offset-2 ring-offset-cellar-950"
                      : "hover:opacity-90"
                  }`}
                >
                  <span className="font-ui text-body text-linen-100">
                    {c.displayName}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-small text-cork-500 font-ui mt-2">
            Select a source
          </p>
        )}
      </div>

      {/* Column 3: Descriptors */}
      <div className="relative z-10 flex flex-col">
        <p className="text-micro text-cork-400 uppercase tracking-wider font-ui mb-1">
          Descriptors
        </p>
        {selectedCluster ? (
          <div className="flex flex-wrap gap-2 content-start overflow-y-auto max-h-[280px]">
            {descriptors.map((d) => (
              <Chip
                key={d.id}
                variant="ghost"
                className="cursor-default"
                title={d.description ?? undefined}
              >
                {d.displayName}
              </Chip>
            ))}
          </div>
        ) : (
          <p className="text-small text-cork-500 font-ui mt-2">
            {selectedSource
              ? "Select a cluster"
              : "Select a source"}
          </p>
        )}
      </div>
    </div>
  );
}
