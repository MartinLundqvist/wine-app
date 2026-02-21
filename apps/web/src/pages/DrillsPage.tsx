import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Panel } from "../components/ui/Panel";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

const DRILL_FORMATS = [
  "descriptor_match",
  "elimination",
  "map_recall",
  "skeleton_deduction",
] as const;

const FORMAT_LABELS: Record<string, string> = {
  descriptor_match: "Descriptor Matching",
  elimination: "Elimination",
  map_recall: "Map Recall",
  skeleton_deduction: "Skeleton Deduction",
};

export function DrillsPage() {
  const [searchParams] = useSearchParams();
  const format = searchParams.get("format") ?? "";
  const { data: templates, isLoading } = useQuery({
    queryKey: ["exercise-templates"],
    queryFn: () => api.getExerciseTemplates(),
  });

  const drillTemplates =
    templates?.filter((t) =>
      DRILL_FORMATS.includes(t.format as (typeof DRILL_FORMATS)[number]),
    ) ?? [];
  const filtered =
    format && drillTemplates.length > 0
      ? drillTemplates.filter((t) => t.format === format)
      : drillTemplates;
  const formats = DRILL_FORMATS;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-foreground">Drills</h1>
      <p className="text-muted-foreground">
        {format
          ? `Format: ${FORMAT_LABELS[format] ?? format}`
          : "Choose a format from the launcher or below."}
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {formats.map((f) => (
          <Link key={f} to={`/drills?format=${f}`}>
            <Button variant={format === f ? "primary" : "tertiary"}>
              {FORMAT_LABELS[f] ?? f}
            </Button>
          </Link>
        ))}
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => (
            <Panel key={t.exerciseTemplateId} variant="oak">
              <h3 className="text-xl text-foreground mb-1">{t.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t.promptStem}</p>
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
