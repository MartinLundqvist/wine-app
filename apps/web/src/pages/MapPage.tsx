import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  // DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  MapCanvas,
  mapPositionToCoord,
  MAP_CELL_PX,
  ORDINAL_FULL,
} from "../components/map/MapCanvas";
import { GrapeToken } from "../components/map/GrapeToken";
import { Chip } from "../components/ui/Chip";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import {
  exerciseApi,
  type ExercisePayload,
  type ExerciseSubmitResult,
} from "../api/client";

const MAP_IDS = [
  "red-structure",
  "body-alcohol",
  "flavor-direction",
  "white-structure",
];

const attrLabels: Record<string, string> = {
  tannin: "Tannin",
  acidity: "Acidity",
  body: "Body",
  alcohol: "Alcohol",
  oak_intensity: "Oak",
  fruit_profile: "Fruit profile",
  fruit_forward_index: "Fruit forward",
};

const FLAVOR_DIRECTION_X_LABELS: Record<number, string> = {
  1: "Red",
  2: "Black",
};
const FLAVOR_DIRECTION_Y_LABELS: Record<number, string> = {
  1: "Earth-driven",
  2: "Savory-leaning",
  3: "Balanced",
  4: "Fruit-leaning",
  5: "Fruit-forward",
};

function coordToPixel(
  x: number,
  y: number,
  gridRows = 5,
  halfW = 28,
  halfH = 14,
) {
  return {
    left: (x - 1) * MAP_CELL_PX + MAP_CELL_PX / 2 - halfW,
    top: (gridRows - y) * MAP_CELL_PX + MAP_CELL_PX / 2 - halfH,
  };
}

export function MapPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [payload, setPayload] = useState<ExercisePayload | null>(null);
  const [result, setResult] = useState<ExerciseSubmitResult | null>(null);
  const [placed, setPlaced] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Session tracking
  const [sessionRound, setSessionRound] = useState(1);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionTotal, setSessionTotal] = useState(10);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string>(
    "map_place_red_structure",
  );
  const [completedGrapes, setCompletedGrapes] = useState<
    { name: string; x: number; y: number }[]
  >([]);

  const mapId = id && MAP_IDS.includes(id) ? id : "red-structure";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const generateExercise = useCallback(
    (token: string, exclude: string[] = []) => {
      setResult(null);
      setPlaced(null);
      return exerciseApi
        .generate(token, mapId, exclude.length > 0 ? exclude : undefined)
        .then(({ payload: p, totalAvailable, templateId: tid }) => {
          setPayload(p);
          setTemplateId(tid);
          const sid = p.correctStyleTargetId;
          if (sid) setSeenIds((prev) => [...prev, sid]);
          if (exclude.length === 0) {
            setSessionTotal(totalAvailable);
          }
        })
        .catch((e) => setError(String(e)));
    },
    [mapId],
  );

  useEffect(() => {
    if (!state.accessToken) return;
    setSessionRound(1);
    setSessionCorrect(0);
    setSessionComplete(false);
    setSeenIds([]);
    setCompletedGrapes([]);
    setSessionTotal(10);
    generateExercise(state.accessToken);
  }, [mapId, state.accessToken, generateExercise]);

  // // DEBUG: log grid position while dragging
  // const handleDragMove = (event: DragMoveEvent) => {
  //   const { delta, activatorEvent } = event;
  //   const droppableEl = document.querySelector("[data-droppable-id='map-drop']");
  //   if (!droppableEl) return;
  //   const zoneRect = droppableEl.getBoundingClientRect();
  //   const startEvt = activatorEvent as PointerEvent;
  //   const dropX = startEvt.clientX + delta.x - zoneRect.left;
  //   const dropY = startEvt.clientY + delta.y - zoneRect.top;
  //   const { x, y } = mapPositionToCoord(dropX, dropY);
  //   console.log(`[drag] pointer=(${Math.round(dropX)}, ${Math.round(dropY)})  grid=(${x}, ${y})  cell=${MAP_CELL_PX}px`);
  // };

  const gridCols = mapId === "flavor-direction" ? 2 : 5;
  const gridRows = 5;

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, delta, activatorEvent } = event;
    if (!payload || !state.accessToken || over?.id !== "map-drop") return;
    const droppableEl = document.querySelector(
      "[data-droppable-id='map-drop']",
    );
    if (!droppableEl) return;
    const zoneRect = droppableEl.getBoundingClientRect();
    const startEvt = activatorEvent as PointerEvent;
    const dropX = startEvt.clientX + delta.x - zoneRect.left;
    const dropY = startEvt.clientY + delta.y - zoneRect.top;
    const { x, y } = mapPositionToCoord(dropX, dropY, gridCols, gridRows);
    setPlaced({ x, y });
    setLoading(true);
    exerciseApi
      .submit(state.accessToken, templateId, payload, { x, y })
      .then((res) => {
        setResult(res);
        if (res.isCorrect) setSessionCorrect((c) => c + 1);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  };

  const handleNext = () => {
    if (!state.accessToken || !payload) return;
    // Record the current grape at its correct position
    const pos = payload.correctPosition;
    const name = payload.correctName;
    if (pos && name)
      setCompletedGrapes((prev) => [...prev, { name, x: pos.x, y: pos.y }]);
    if (sessionRound >= sessionTotal) {
      setSessionComplete(true);
      return;
    }
    setSessionRound((r) => r + 1);
    // Pass current grape explicitly so we never get duplicates (avoids React state batching)
    const excludeIds = payload.correctStyleTargetId
      ? [...seenIds, payload.correctStyleTargetId]
      : seenIds;
    generateExercise(state.accessToken, excludeIds);
  };

  const handlePlayAgain = () => {
    if (!state.accessToken) return;
    setSessionRound(1);
    setSessionCorrect(0);
    setSessionComplete(false);
    setSeenIds([]);
    setCompletedGrapes([]);
    generateExercise(state.accessToken);
  };

  /* ---------- Guard states ---------- */

  if (!state.accessToken) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Log in to play map exercises.</p>
        <Button variant="secondary" onClick={() => navigate("/login")}>
          Log in
        </Button>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!payload) {
    return <p className="text-muted-foreground">Loading exercise...</p>;
  }

  /* ---------- Session complete ---------- */

  if (sessionComplete) {
    const accuracy =
      sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="font-serif text-3xl text-foreground">
          Session Complete
        </h1>
        <Panel variant="linenSheet" className="space-y-4">
          <h3 className="font-serif text-xl text-foreground">Results</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-serif text-foreground">
                {sessionTotal}
              </p>
              <p className="text-sm text-muted-foreground">Rounds</p>
            </div>
            <div>
              <p className="text-2xl font-serif text-foreground">
                {sessionCorrect}
              </p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-serif text-foreground">
                {accuracy}%
              </p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
          </div>
          <p className="text-base text-foreground">
            {accuracy >= 80
              ? "Excellent work! You have a strong grasp of this map."
              : accuracy >= 50
                ? "Good effort! Keep practicing to sharpen your placements."
                : "Keep at it! Repeated practice will build your muscle memory."}
          </p>
        </Panel>
        <div className="flex gap-3">
          <Button variant="primary" onClick={handlePlayAgain}>
            Play Again
          </Button>
          <Button variant="secondary" onClick={() => navigate("/learn")}>
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- Derived values ---------- */

  const correctPos = payload.correctPosition!;
  const xAttrName = attrLabels[payload.xAttr ?? ""] ?? payload.xAttr ?? "";
  const yAttrName = attrLabels[payload.yAttr ?? ""] ?? payload.yAttr ?? "";
  const correctXLabel =
    mapId === "flavor-direction"
      ? (FLAVOR_DIRECTION_X_LABELS[correctPos.x] ?? String(correctPos.x))
      : (ORDINAL_FULL[correctPos.x] ?? String(correctPos.x));
  const correctYLabel =
    mapId === "flavor-direction"
      ? (FLAVOR_DIRECTION_Y_LABELS[correctPos.y] ?? String(correctPos.y))
      : (ORDINAL_FULL[correctPos.y] ?? String(correctPos.y));

  const answeredSoFar = sessionRound - (result ? 0 : 1);
  const progressPct = (answeredSoFar / sessionTotal) * 100;
  const currentAccuracy =
    answeredSoFar > 0 ? Math.round((sessionCorrect / answeredSoFar) * 100) : 0;

  /* ---------- Render ---------- */

  return (
    <DndContext
      sensors={sensors}
      // onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* -------- Left: Map -------- */}
        <div className="shrink-0">
          <MapCanvas
            xAttr={payload.xAttr ?? "tannin"}
            yAttr={payload.yAttr ?? "acidity"}
            dropId="map-drop"
            gridCols={gridCols}
            gridRows={gridRows}
            xTickLabels={
              mapId === "flavor-direction"
                ? ["Red", "Black"]
                : undefined
            }
            yTickLabels={
              mapId === "flavor-direction"
                ? ["Fruit-forward", "Fruit-leaning", "Balanced", "Savory-leaning", "Earth-driven"]
                : undefined
            }
          >
            {/* Previously completed grapes (ghost markers, stacked within shared cells) */}
            {completedGrapes.map((g, i) => {
              const sameCell = completedGrapes
                .slice(0, i)
                .filter((p) => p.x === g.x && p.y === g.y).length;
              const base = coordToPixel(g.x, g.y, gridRows);
              return (
                <div
                  key={`ghost-${i}`}
                  className="absolute pointer-events-none z-0"
                  style={{ left: base.left, top: base.top + sameCell * 18 }}
                >
                  <Chip variant="ghost">{g.name}</Chip>
                </div>
              );
            })}

            {/* Current round result markers */}
            {result && (
              <>
                {/* User's placement (when incorrect) */}
                {!result.isCorrect && placed && (
                  <div
                    className="absolute pointer-events-none z-10"
                    style={coordToPixel(placed.x, placed.y, gridRows)}
                  >
                    <Chip variant="incorrect">
                      {payload.correctName ?? "Grape"}
                    </Chip>
                  </div>
                )}
                {/* Correct placement */}
                <div
                  className="absolute pointer-events-none z-20"
                  style={coordToPixel(correctPos.x, correctPos.y, gridRows)}
                >
                  <Chip variant="correct">
                    {payload.correctName ?? "Grape"}
                  </Chip>
                </div>
              </>
            )}
          </MapCanvas>
        </div>

        {/* -------- Right: Controls -------- */}
        <div className="flex flex-col gap-6 min-w-[260px] max-w-sm w-full">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Round {sessionRound} of {sessionTotal}
              </span>
              <span>
                {sessionCorrect}/{answeredSoFar} correct
                {answeredSoFar > 0 && ` (${currentAccuracy}%)`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-card rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1 className="font-serif text-2xl text-foreground mb-1">
              Place the grape
            </h1>
            <p className="text-sm text-muted-foreground">
              Drag{" "}
              <span className="text-foreground font-medium">
                {payload.correctName ?? "Grape"}
              </span>{" "}
              to its correct position on the map.
            </p>
          </div>

          {/* Draggable token (before answer) */}
          {!result && (
            <div className="py-4">
              <GrapeToken id="grape-1" name={payload.correctName ?? "Grape"} />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Checking...
            </p>
          )}

          {/* Feedback (after answer) */}
          {result && (
            <Panel variant="linenSheet" className="!max-w-none">
              <h3 className="font-serif text-xl text-foreground mb-1">
                {result.isCorrect ? "Correct!" : "Not quite"}
              </h3>
              <p className="text-base text-foreground mb-4">
                {result.isCorrect
                  ? `${payload.correctName ?? "Grape"} has ${correctXLabel} ${xAttrName} and ${correctYLabel} ${yAttrName}.`
                  : `${payload.correctName ?? "Grape"} has ${correctXLabel} ${xAttrName} and ${correctYLabel} ${yAttrName}. You placed it at ${mapId === "flavor-direction" ? (FLAVOR_DIRECTION_X_LABELS[placed!.x] ?? placed!.x) : (ORDINAL_FULL[placed!.x] ?? placed!.x)} ${xAttrName}, ${mapId === "flavor-direction" ? (FLAVOR_DIRECTION_Y_LABELS[placed!.y] ?? placed!.y) : (ORDINAL_FULL[placed!.y] ?? placed!.y)} ${yAttrName}.`}
              </p>
              <Button variant="primary" onClick={handleNext}>
                {sessionRound >= sessionTotal ? "See Results" : "Next"}
              </Button>
            </Panel>
          )}
        </div>
      </div>
    </DndContext>
  );
}
