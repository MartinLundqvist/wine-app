import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { progressApi } from "../api/client";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import { useAuth } from "../contexts/AuthContext";

const FORMAT_DISPLAY_NAMES: Record<string, string> = {
  map_place: "Map Place",
  map_recall: "Map Recall",
  descriptor_match: "Descriptor Matching",
  elimination: "Elimination",
  skeleton_deduction: "Skeleton Deduction",
};

const MAPS = [
  {
    id: "red-structure",
    name: "Red Structure Map",
    path: "/maps/red-structure",
    description: "Tannin vs Acidity",
  },
  {
    id: "body-alcohol",
    name: "Body & Alcohol Map",
    path: "/maps/body-alcohol",
    description: "Alcohol vs Body",
  },
  {
    id: "flavor-direction",
    name: "Flavor Direction (Reds)",
    path: "/maps/flavor-direction",
    description: "Red/Black fruit vs Fruit-forward",
  },
  {
    id: "white-structure",
    name: "White Structure Map",
    path: "/maps/white-structure",
    description: "Body vs Acidity",
  },
];

export function LauncherPage() {
  const { state } = useAuth();
  const { data: progress } = useQuery({
    queryKey: ["progress", state.accessToken],
    queryFn: () => progressApi.getProgress(state.accessToken!),
    enabled: !!state.accessToken,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-h1 font-semibold text-linen-100 mb-2">
          Level 1 — Archetype Training
        </h1>
        <p className="text-body text-cork-400">
          Build canonical mental maps. Recognize structure, fruit direction, and
          oak.
        </p>
      </div>

      <section>
        <h2 className="font-display text-h2 text-linen-100 mb-4">
          Canonical Maps
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MAPS.map((map) => (
            <Panel
              key={map.id}
              variant="oak"
              className="hover:border-cork-400/50 transition-colors"
            >
              <h3 className="text-h3 text-linen-100 mb-1">{map.name}</h3>
              <p className="text-small text-cork-400 mb-4">{map.description}</p>
              <Link to={map.path}>
                <Button variant="secondary" className="w-full sm:w-auto">
                  Open map
                </Button>
              </Link>
            </Panel>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-h2 text-linen-100 mb-4">Drills</h2>
        <p className="text-small text-cork-400 mb-4">
          Descriptor matching, elimination, map recall, and skeleton deduction.
          Filter by format on the Drills page.
        </p>
        <Link to="/drills">
          <Button variant="secondary">Open Drills</Button>
        </Link>
        <p className="text-small text-cork-400 mt-4">
          {state.user
            ? "You are logged in. Progress is saved."
            : "Log in to save progress."}
        </p>
      </section>

      {state.user && progress && progress.length > 0 && (
        <section>
          <h2 className="font-display text-h2 text-linen-100 mb-4">
            Your progress
          </h2>
          <div className="flex flex-wrap gap-2">
            {progress.map((row) => (
              <Chip
                key={`${row.exerciseFormat}-${row.wineColor}`}
                variant={
                  row.masteryState === "mastered"
                    ? "correct"
                    : row.masteryState === "in_progress"
                      ? "selected"
                      : "base"
                }
              >
                {FORMAT_DISPLAY_NAMES[row.exerciseFormat] ??
                  row.exerciseFormat.replace(/_/g, " ")}{" "}
                ({row.wineColor}): {Math.round(row.accuracy * 100)}%
              </Chip>
            ))}
          </div>
          <Link to="/progress" className="inline-block mt-2">
            <Button variant="tertiary">View full progress</Button>
          </Link>
        </section>
      )}
    </div>
  );
}
