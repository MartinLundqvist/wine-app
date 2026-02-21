import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { api, exerciseApi } from "../api/client";
import type { ExercisePayload, ExerciseSubmitResult } from "../api/client";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import {
  MapCanvas,
  mapPositionToCoord,
  MAP_CELL_PX,
} from "../components/map/MapCanvas";
import { GrapeToken } from "../components/map/GrapeToken";
import { useAuth } from "../contexts/AuthContext";

const DRILL_FORMATS = [
  "descriptor_match",
  "elimination",
  "map_recall",
  "skeleton_deduction",
] as const;
const ORDINAL_LABELS: Record<number, string> = {
  1: "Low",
  2: "Medium−",
  3: "Medium",
  4: "Medium+",
  5: "High",
};

function coordToPixel(x: number, y: number, halfW = 28, halfH = 14) {
  return {
    left: (x - 1) * MAP_CELL_PX + MAP_CELL_PX / 2 - halfW,
    top: (5 - y) * MAP_CELL_PX + MAP_CELL_PX / 2 - halfH,
  };
}

export function DrillDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const { data: templates } = useQuery({
    queryKey: ["exercise-templates"],
    queryFn: () => api.getExerciseTemplates(),
  });
  const template = templates?.find((t) => t.exerciseTemplateId === templateId);

  const [payload, setPayload] = useState<ExercisePayload | null>(null);
  const [result, setResult] = useState<ExerciseSubmitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
  const [mapRecallPlacements, setMapRecallPlacements] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [mapRecallDragging, setMapRecallDragging] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const generate = useCallback(() => {
    if (!state.accessToken || !templateId) return;
    setResult(null);
    setError("");
    setEliminatedIds(new Set());
    setMapRecallPlacements({});
    setPayload(null);
    exerciseApi
      .generateDrill(state.accessToken, templateId)
      .then(({ payload: p }) => setPayload(p))
      .catch((e) => setError(String(e)));
  }, [state.accessToken, templateId]);

  useEffect(() => {
    if (
      state.accessToken &&
      templateId &&
      template &&
      DRILL_FORMATS.includes(template.format as (typeof DRILL_FORMATS)[number])
    ) {
      generate();
    }
  }, [templateId, state.accessToken, template?.format]); // eslint-disable-line react-hooks/exhaustive-deps -- run once when template/access available

  const submitDescriptorMatch = (selectedStyleTargetId: string) => {
    if (!state.accessToken || !payload) return;
    setLoading(true);
    exerciseApi
      .submit(state.accessToken, templateId!, payload, {
        selectedStyleTargetId,
      })
      .then((res) => {
        setResult(res);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  };

  const submitElimination = (remainingStyleTargetId: string) => {
    if (!state.accessToken || !payload) return;
    setLoading(true);
    exerciseApi
      .submit(state.accessToken, templateId!, payload, {
        remainingStyleTargetId,
      })
      .then((res) => {
        setResult(res);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  };

  const submitSkeletonDeduction = (selectedStyleTargetId: string) => {
    if (!state.accessToken || !payload) return;
    setLoading(true);
    exerciseApi
      .submit(state.accessToken, templateId!, payload, {
        selectedStyleTargetId,
      })
      .then((res) => {
        setResult(res);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  };

  const submitMapRecall = () => {
    if (!state.accessToken || !payload?.styleTargets) return;
    const placements = payload.styleTargets.map((s) => ({
      styleTargetId: s.styleTargetId,
      x: mapRecallPlacements[s.styleTargetId]?.x ?? 0,
      y: mapRecallPlacements[s.styleTargetId]?.y ?? 0,
    }));
    if (placements.some((p) => p.x === 0 && p.y === 0)) {
      setError("Place all grapes on the map first.");
      return;
    }
    setLoading(true);
    exerciseApi
      .submit(state.accessToken, templateId!, payload, { placements })
      .then((res) => {
        setResult(res);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  };

  const handleMapRecallDragEnd = (event: DragEndEvent) => {
    const { over, active, delta, activatorEvent } = event;
    if (!payload?.styleTargets || over?.id !== "map-drop-recall") return;
    const droppableEl = document.querySelector(
      "[data-droppable-id='map-drop-recall']",
    );
    if (!droppableEl) return;
    const zoneRect = droppableEl.getBoundingClientRect();
    const startEvt = activatorEvent as PointerEvent;
    const dropX = startEvt.clientX + delta.x - zoneRect.left;
    const dropY = startEvt.clientY + delta.y - zoneRect.top;
    const { x, y } = mapPositionToCoord(dropX, dropY);
    const styleTargetId = String(active.id).replace("recall-", "");
    setMapRecallPlacements((prev) => ({ ...prev, [styleTargetId]: { x, y } }));
    setMapRecallDragging(null);
  };

  if (!template) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Template not found.</p>
      </div>
    );
  }

  const isDrill = DRILL_FORMATS.includes(
    template.format as (typeof DRILL_FORMATS)[number],
  );

  if (!state.user) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-foreground">{template.name}</h1>
        <Panel variant="oak">
          <p className="text-base text-muted-foreground">Log in to play drills.</p>
        </Panel>
      </div>
    );
  }

  if (!isDrill) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-foreground">{template.name}</h1>
        <Panel variant="oak">
          <p className="text-base text-muted-foreground">
            This format is not implemented. Use Maps or one of the four drill
            types.
          </p>
        </Panel>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="secondary" onClick={generate}>
          Retry
        </Button>
      </div>
    );
  }

  if (!payload) {
    return <p className="text-muted-foreground">Loading exercise...</p>;
  }

  const format = payload.format ?? template.format;

  if (result) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="font-serif text-3xl text-foreground">{template.name}</h1>
        <Panel variant="linenSheet" className="space-y-4">
          <h3 className="font-serif text-xl text-foreground">
            {result.isCorrect ? "Correct!" : "Not quite"}
          </h3>
          <p className="text-base text-foreground">
            {result.feedback.structureMatch}
          </p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={generate}>
              Next
            </Button>
            <Button variant="secondary" onClick={() => navigate("/drills")}>
              Back to Drills
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  if (format === "descriptor_match") {
    const options = payload.options ?? [];
    const clue = payload.descriptorClue?.name ?? "this descriptor";
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="font-serif text-3xl text-foreground">{template.name}</h1>
        <Panel variant="oak" className="space-y-4">
          <p className="text-base text-foreground">
            Which grape best matches the descriptor &quot;{clue}&quot;?
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt.styleTargetId}
                type="button"
                onClick={() => submitDescriptorMatch(opt.styleTargetId)}
                disabled={loading}
                className="focus:outline-none focus:ring-2 focus:ring-accent rounded-full"
              >
                <Chip variant="base">{opt.name}</Chip>
              </button>
            ))}
          </div>
          {loading && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Checking...
            </p>
          )}
        </Panel>
      </div>
    );
  }

  if (format === "elimination") {
    const options = payload.options ?? [];
    const remaining = options.filter(
      (o) => !eliminatedIds.has(o.styleTargetId),
    );
    const canSubmit = remaining.length === 1;

    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="font-serif text-3xl text-foreground">{template.name}</h1>
        <Panel variant="oak" className="space-y-4">
          <p className="text-base text-foreground">
            Tap grapes to eliminate the one that doesn&apos;t match. Submit the
            remaining grape.
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const eliminated = eliminatedIds.has(opt.styleTargetId);
              return (
                <button
                  key={opt.styleTargetId}
                  type="button"
                  onClick={() => {
                    if (eliminated) return;
                    if (remaining.length <= 2) return;
                    setEliminatedIds((prev) =>
                      new Set(prev).add(opt.styleTargetId),
                    );
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-accent rounded-full"
                >
                  <Chip variant={eliminated ? "incorrect" : "base"}>
                    {eliminated ? "✕ " : ""}
                    {opt.name}
                  </Chip>
                </button>
              );
            })}
          </div>
          {canSubmit && (
            <Button
              variant="primary"
              onClick={() => submitElimination(remaining[0].styleTargetId)}
              disabled={loading}
            >
              Submit: {remaining[0].name}
            </Button>
          )}
          {loading && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Checking...
            </p>
          )}
        </Panel>
      </div>
    );
  }

  if (format === "skeleton_deduction") {
    const options = payload.options ?? [];
    const clues = payload.structureClues ?? {};
    const clueText = Object.entries(clues)
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${ORDINAL_LABELS[v] ?? v}`)
      .join(", ");

    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="font-serif text-3xl text-foreground">{template.name}</h1>
        <Panel variant="oak" className="space-y-4">
          <p className="text-base text-foreground">Structure only (no fruit):</p>
          <p className="text-base text-foreground font-medium">{clueText}</p>
          <p className="text-sm text-muted-foreground">
            Which grape matches this structure?
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt.styleTargetId}
                type="button"
                onClick={() => submitSkeletonDeduction(opt.styleTargetId)}
                disabled={loading}
                className="focus:outline-none focus:ring-2 focus:ring-accent rounded-full"
              >
                <Chip variant="base">{opt.name}</Chip>
              </button>
            ))}
          </div>
          {loading && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Checking...
            </p>
          )}
        </Panel>
      </div>
    );
  }

  if (format === "map_recall") {
    const styleTargets = payload.styleTargets ?? [];
    const allPlaced = styleTargets.every(
      (s) => mapRecallPlacements[s.styleTargetId],
    );
    const xAttr = payload.xAttr ?? "tannin";
    const yAttr = payload.yAttr ?? "acidity";

    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-foreground">{template.name}</h1>
        <p className="text-sm text-muted-foreground">
          Drag each grape to its correct position on the map.
        </p>
        <DndContext
          sensors={sensors}
          onDragStart={(e) =>
            setMapRecallDragging(String(e.active.id).replace("recall-", ""))
          }
          onDragEnd={handleMapRecallDragEnd}
        >
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="shrink-0">
              <MapCanvas xAttr={xAttr} yAttr={yAttr} dropId="map-drop-recall">
                {styleTargets.map((s) => {
                  const pos = mapRecallPlacements[s.styleTargetId];
                  if (!pos || mapRecallDragging === s.styleTargetId)
                    return null;
                  const base = coordToPixel(pos.x, pos.y);
                  return (
                    <div
                      key={s.styleTargetId}
                      className="absolute pointer-events-none z-0"
                      style={{ left: base.left, top: base.top }}
                    >
                      <Chip variant="ghost">{s.name}</Chip>
                    </div>
                  );
                })}
              </MapCanvas>
            </div>
            <div className="flex flex-col gap-4 min-w-[200px]">
              <p className="text-sm text-muted-foreground">Grapes to place:</p>
              <div className="flex flex-wrap gap-2">
                {styleTargets
                  .filter((s) => !mapRecallPlacements[s.styleTargetId])
                  .map((s) => (
                    <GrapeToken
                      key={s.styleTargetId}
                      id={`recall-${s.styleTargetId}`}
                      name={s.name}
                    />
                  ))}
              </div>
              <Button
                variant="primary"
                onClick={submitMapRecall}
                disabled={!allPlaced || loading}
              >
                Submit placements
              </Button>
              {loading && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Checking...
                </p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
        </DndContext>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-foreground">{template.name}</h1>
      <Panel variant="oak">
        <p className="text-base text-muted-foreground">
          Unknown format: {String(format)}
        </p>
      </Panel>
    </div>
  );
}
