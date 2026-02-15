import { useQuery } from "@tanstack/react-query";
import { Panel } from "../components/ui/Panel";
import { Chip } from "../components/ui/Chip";
import { useAuth } from "../contexts/AuthContext";
import { progressApi } from "../api/client";

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
        <h1 className="font-display text-h1 font-semibold text-linen-100">Progress</h1>
        <Panel variant="oak">
          <p className="text-body text-cork-400">Log in to track your progress and mastery.</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-h1 font-semibold text-linen-100">Progress</h1>
      <p className="text-small text-cork-400">Logged in as {state.user.email}</p>
      {isLoading ? (
        <p className="text-cork-400">Loading...</p>
      ) : progress && progress.length > 0 ? (
        <div className="space-y-4">
          {progress.map((row) => (
            <Panel key={`${row.exerciseFormat}-${row.wineColor}`} variant="oak">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-body text-linen-100">
                  {row.exerciseFormat} ({row.wineColor})
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
                  {row.masteryState}
                </Chip>
              </div>
              <p className="text-small text-cork-400 mt-2">
                {row.correctAttempts}/{row.totalAttempts} correct ·{" "}
                {Math.round(row.accuracy * 100)}% accuracy
              </p>
            </Panel>
          ))}
        </div>
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
