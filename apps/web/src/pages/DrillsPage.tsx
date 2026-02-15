import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Panel } from "../components/ui/Panel";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

const FORMAT_LABELS: Record<string, string> = {
  map_place: "Map Place",
  map_recall: "Map Recall",
  order_rank: "Order by Attribute",
  descriptor_match: "Descriptor Matching",
  structure_deduction: "Structure Deduction",
  elimination: "Elimination",
  skeleton_deduction: "Skeleton Deduction",
  tasting_input: "Tasting Mode",
};

export function DrillsPage() {
  const [searchParams] = useSearchParams();
  const format = searchParams.get("format") ?? "";
  const { data: templates, isLoading } = useQuery({
    queryKey: ["exercise-templates"],
    queryFn: () => api.getExerciseTemplates(),
  });

  const filtered = format && templates
    ? templates.filter((t) => t.format === format)
    : templates ?? [];
  const formats = templates
    ? [...new Set(templates.map((t) => t.format))]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-h1 text-linen-100">Drills</h1>
      <p className="text-cork-400">
        {format ? `Format: ${FORMAT_LABELS[format] ?? format}` : "Choose a format from the launcher or below."}
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {formats.map((f) => (
          <Link key={f} to={`/drills?format=${f}`}>
            <Button variant={format === f ? "primary" : "tertiary"}>{FORMAT_LABELS[f] ?? f}</Button>
          </Link>
        ))}
      </div>
      {isLoading ? (
        <p className="text-cork-400">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => (
            <Panel key={t.exerciseTemplateId} variant="oak">
              <h3 className="text-h3 text-linen-100 mb-1">{t.name}</h3>
              <p className="text-small text-cork-400 mb-4">{t.promptStem}</p>
              <Link to={`/drills/${t.exerciseTemplateId}`}>
                <Button variant="secondary">Start</Button>
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
