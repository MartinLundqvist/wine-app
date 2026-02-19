import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { AromaTerm } from "@wine-app/shared";
import { Panel } from "../../components/ui/Panel";
import { Chip } from "../../components/ui/Chip";

function buildTree(terms: AromaTerm[]) {
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

function AromaLevel({
  terms,
  byParent,
  depth,
}: {
  terms: AromaTerm[];
  byParent: Map<string | null, AromaTerm[]>;
  depth: number;
}) {
  return (
    <ul className={depth > 0 ? "ml-4 mt-2 space-y-1 border-l border-cork-500/30 pl-4" : "space-y-3"}>
      {terms.map((t) => {
        const children = byParent.get(t.id) ?? [];
        return (
          <li key={t.id}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-ui text-body text-linen-100">
                {t.displayName}
              </span>
              <Chip variant="ghost">{t.source}</Chip>
            </div>
            {children.length > 0 && (
              <AromaLevel terms={children} byParent={byParent} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ExploreAromasPage() {
  const { data: aromaTerms, isLoading } = useQuery({
    queryKey: ["aroma-terms"],
    queryFn: () => api.getAromaTerms(),
  });

  const byParent = useMemo(
    () => (aromaTerms ? buildTree(aromaTerms) : new Map<string | null, AromaTerm[]>()),
    [aromaTerms],
  );
  const roots = useMemo(
    () => (aromaTerms ? (byParent.get(null) ?? []) : []),
    [aromaTerms, byParent],
  );

  if (isLoading) return <p className="text-cork-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-linen-100">Aroma Wheel</h1>
        <p className="text-cork-400 mt-1">
          WSET-aligned aroma taxonomy: primary (grape & fermentation), secondary (winemaking), tertiary (maturation).
        </p>
      </div>
      <Panel variant="oak">
        <AromaLevel terms={roots} byParent={byParent} depth={0} />
      </Panel>
    </div>
  );
}
