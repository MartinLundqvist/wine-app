import { useQuery } from "@tanstack/react-query";
import { Panel } from "../components/ui/Panel";
import { Chip } from "../components/ui/Chip";
import { useAuth } from "../contexts/AuthContext";
import { progressApi } from "../api/client";

const FORMAT_DISPLAY_NAMES: Record<string, string> = {
  map_place: "Map Place",
  map_recall: "Map Recall",
  descriptor_match: "Descriptor Matching",
  elimination: "Elimination",
  skeleton_deduction: "Skeleton Deduction",
};

export function ProgressPage() {
  const { state } = useAuth();
  const { data: progress, isLoading } = useQuery({
    queryKey: ["progress", state.accessToken],
    queryFn: () => progressApi.getProgress(state.accessToken!),
    enabled: !!state.accessToken,
  });

  if (!state.user) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-h1 font-semibold text-linen-100">
          Progress
        </h1>
        <Panel variant="oak">
          <p className="text-body text-cork-400">
            Log in to track your progress and mastery.
          </p>
        </Panel>
      </div>
    );
  }

  const totalAttempts =
    progress?.reduce((sum, row) => sum + row.totalAttempts, 0) ?? 0;
  const totalCorrect =
    progress?.reduce((sum, row) => sum + row.correctAttempts, 0) ?? 0;
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const masteredCount =
    progress?.filter((row) => row.masteryState === "mastered").length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-h1 font-semibold text-linen-100">
        Progress
      </h1>
      <p className="text-small text-cork-400">
        Logged in as {state.user.email}
      </p>
      {isLoading ? (
        <p className="text-cork-400">Loading...</p>
      ) : progress && progress.length > 0 ? (
        <>
          <Panel variant="linenSheet" className="space-y-2">
            <h3 className="font-display text-h3 text-cellar-950">
              Overall summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-h2 font-display text-cellar-950">
                  {totalAttempts}
                </p>
                <p className="text-small text-cork-600">Total exercises</p>
              </div>
              <div>
                <p className="text-h2 font-display text-cellar-950">
                  {overallAccuracy}%
                </p>
                <p className="text-small text-cork-600">Overall accuracy</p>
              </div>
              <div>
                <p className="text-h2 font-display text-cellar-950">
                  {masteredCount}
                </p>
                <p className="text-small text-cork-600">Mastery badges</p>
              </div>
            </div>
          </Panel>
          <h3 className="font-display text-h2 text-linen-100">Per format</h3>
          <div className="space-y-4">
            {progress.map((row) => (
              <Panel
                key={`${row.exerciseFormat}-${row.wineColor}`}
                variant="oak"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-body text-linen-100">
                    {FORMAT_DISPLAY_NAMES[row.exerciseFormat] ??
                      row.exerciseFormat.replace(/_/g, " ")}{" "}
                    ({row.wineColor})
                  </span>
                  <Chip
                    variant={
                      row.masteryState === "mastered"
                        ? "correct"
                        : row.masteryState === "in_progress"
                          ? "selected"
                          : "base"
                    }
                  >
                    {row.masteryState === "mastered"
                      ? "Mastered"
                      : "In progress"}
                  </Chip>
                </div>
                <p className="text-small text-cork-400 mt-2">
                  {row.correctAttempts}/{row.totalAttempts} correct ·{" "}
                  {Math.round(row.accuracy * 100)}% accuracy
                </p>
              </Panel>
            ))}
          </div>
        </>
      ) : (
        <Panel variant="oak">
          <p className="text-body text-cork-400">
            Complete map exercises or drills to see your progress here.
          </p>
        </Panel>
      )}
    </div>
  );
}
