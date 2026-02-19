import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { StyleTargetFull } from "@wine-app/shared";
import { Panel } from "../../components/ui/Panel";
import { Chip } from "../../components/ui/Chip";
import { Button } from "../../components/ui/Button";

export function StyleTargetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: style, isLoading, error } = useQuery({
    queryKey: ["style-target", id],
    queryFn: () => api.getStyleTarget(id!),
    enabled: !!id,
  });

  if (isLoading || !id) return <p className="text-cork-400">Loading...</p>;
  if (error || !style) return <p className="text-cork-400">Style not found.</p>;

  const st = style as StyleTargetFull;
  const ordinalDims = st.structure?.filter(
    (s) => s.dimension?.scaleType === "ordinal"
  ) ?? [];
  const catDims = st.structure?.filter(
    (s) => s.dimension?.scaleType === "categorical"
  ) ?? [];
  const aromasBySource = (st.aromas ?? []).reduce(
    (acc, a) => {
      const src = a.term?.source ?? "primary";
      if (!acc[src]) acc[src] = [];
      if (a.term) acc[src].push(a);
      return acc;
    },
    {} as Record<string, typeof st.aromas>,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/explore/styles" className="text-small text-cork-400 hover:text-linen-100 no-underline">
            ← Wine Styles
          </Link>
          <h1 className="font-display text-h1 text-linen-100 mt-2">{st.displayName}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {st.region && (
              <Chip variant="base">{st.region.displayName}</Chip>
            )}
            <Chip variant="ghost">Tier {st.ladderTier}</Chip>
            <Chip variant="ghost">{st.styleKind.replace(/_/g, " ")}</Chip>
          </div>
          {st.grapes && st.grapes.length > 0 && (
            <p className="text-body text-cork-300 mt-2">
              Grapes: {st.grapes.map((g) => g.grape.displayName).join(", ")}
            </p>
          )}
        </div>
        <Link to="/explore/styles">
          <Button variant="tertiary">Back to list</Button>
        </Link>
      </div>

      <Panel variant="oak">
        <h2 className="font-display text-h2 text-linen-100 mb-4">Structure</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {ordinalDims.map((row) => {
            const dim = row.dimension;
            const maxVal = dim?.scaleMax ?? 5;
            const val = row.maxValue ?? row.minValue ?? 0;
            const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
            return (
              <div key={row.structureDimensionId}>
                <div className="flex justify-between text-small text-cork-400 mb-1">
                  <span>{dim?.displayName ?? row.structureDimensionId}</span>
                  <span>{val}</span>
                </div>
                <div className="h-2 bg-cellar-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-burgundy-600 rounded"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {catDims.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {catDims.map((row) => (
              <Chip key={row.structureDimensionId} variant="base">
                {row.dimension?.displayName}: {row.categoricalValue ?? "—"}
              </Chip>
            ))}
          </div>
        )}
      </Panel>

      <Panel variant="oak">
        <h2 className="font-display text-h2 text-linen-100 mb-4">Aroma profile</h2>
        {["primary", "secondary", "tertiary"].map((source) => {
          const list = aromasBySource[source];
          if (!list?.length) return null;
          return (
            <div key={source} className="mb-4 last:mb-0">
              <h3 className="text-small font-semibold text-cork-300 capitalize mb-2">{source}</h3>
              <div className="flex flex-wrap gap-2">
                {list.map((a) => (
                  <Chip key={a.aromaTermId} variant="ghost">
                    {a.term?.displayName} ({a.prominence})
                  </Chip>
                ))}
              </div>
            </div>
          );
        })}
      </Panel>

      {st.context && (
        <Panel variant="oak">
          <h2 className="font-display text-h2 text-linen-100 mb-4">Context</h2>
          <dl className="grid gap-2 sm:grid-cols-2 text-small">
            {st.context.thermalBandId && (
              <>
                <dt className="text-cork-400">Thermal band</dt>
                <dd className="text-linen-100">{st.context.thermalBandId}</dd>
              </>
            )}
            {st.context.continentality && (
              <>
                <dt className="text-cork-400">Continentality</dt>
                <dd className="text-linen-100">{st.context.continentality}</dd>
              </>
            )}
            {st.context.oakNewPercentageRange && (
              <>
                <dt className="text-cork-400">Oak (new %)</dt>
                <dd className="text-linen-100">{st.context.oakNewPercentageRange}</dd>
              </>
            )}
            {st.context.malolacticConversion && (
              <>
                <dt className="text-cork-400">Malolactic</dt>
                <dd className="text-linen-100">{st.context.malolacticConversion}</dd>
              </>
            )}
            {st.context.agingPotentialYearsMin != null && (
              <>
                <dt className="text-cork-400">Aging potential (years)</dt>
                <dd className="text-linen-100">
                  {st.context.agingPotentialYearsMin}
                  {st.context.agingPotentialYearsMax != null &&
                    ` – ${st.context.agingPotentialYearsMax}`}
                </dd>
              </>
            )}
            {st.context.notes && (
              <>
                <dt className="text-cork-400">Notes</dt>
                <dd className="text-linen-100">{st.context.notes}</dd>
              </>
            )}
          </dl>
        </Panel>
      )}
    </div>
  );
}
