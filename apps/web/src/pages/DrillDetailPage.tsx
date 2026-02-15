import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Panel } from "../components/ui/Panel";
import { useAuth } from "../contexts/AuthContext";

export function DrillDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const { state } = useAuth();
  const { data: templates } = useQuery({
    queryKey: ["exercise-templates"],
    queryFn: () => api.getExerciseTemplates(),
  });
  const template = templates?.find((t) => t.exerciseTemplateId === templateId);

  if (!template) {
    return (
      <div className="space-y-4">
        <p className="text-cork-400">Template not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-h1 text-linen-100">{template.name}</h1>
      <Panel variant="oak">
        <p className="text-body text-cork-400 mb-4">{template.promptStem}</p>
        {state.user ? (
          <p className="text-small text-cork-400">
            Exercise UI for format &quot;{template.format}&quot; — full implementation in Phase 7.
            Use Maps for map_place / map_recall.
          </p>
        ) : (
          <p className="text-cork-400">Log in to play drills.</p>
        )}
      </Panel>
    </div>
  );
}
