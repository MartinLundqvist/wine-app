import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { MapCanvas, mapPositionToCoord, MAP_CELL_PX } from "../components/map/MapCanvas";
import { GrapeToken } from "../components/map/GrapeToken";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { exerciseApi, type ExercisePayload, type ExerciseSubmitResult } from "../api/client";

const MAP_IDS = ["red-structure", "body-alcohol", "flavor-direction", "white-structure"];

export function MapPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [payload, setPayload] = useState<ExercisePayload | null>(null);
  const [result, setResult] = useState<ExerciseSubmitResult | null>(null);
  const [placed, setPlaced] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mapId = id && MAP_IDS.includes(id) ? id : "red-structure";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    if (!state.accessToken) return;
    setResult(null);
    setPlaced(null);
    exerciseApi
      .generate(state.accessToken, mapId)
      .then(({ payload: p }) => setPayload(p))
      .catch((e) => setError(String(e)));
  }, [mapId, state.accessToken]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!payload || !state.accessToken || over?.id !== "map-drop") return;
    const droppableEl = document.querySelector("[data-droppable-id='map-drop']");
    if (!droppableEl) return;
    const zoneRect = droppableEl.getBoundingClientRect();
    const rectCurrent = active.rect.current as { initial: { left: number; top: number; width: number; height: number } | null; translated: { left: number; top: number; width: number; height: number } | null } | undefined;
    const rect = rectCurrent?.translated ?? rectCurrent?.initial;
    if (!rect) return;
    const centerX = rect.left + rect.width / 2 - zoneRect.left;
    const centerY = rect.top + rect.height / 2 - zoneRect.top;
    const { x, y } = mapPositionToCoord(centerX, centerY);
    setPlaced({ x, y });
    setLoading(true);
    exerciseApi
      .submit(state.accessToken, "map_place_red_structure", payload, { x, y })
      .then((res) => {
        setResult(res);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  };

  if (!state.accessToken) {
    return (
      <div className="space-y-4">
        <p className="text-cork-400">Log in to play map exercises.</p>
        <Button variant="secondary" onClick={() => navigate("/login")}>
          Log in
        </Button>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="space-y-4">
        <p className="text-oxblood-700">{error}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!payload) {
    return <p className="text-cork-400">Loading exercise...</p>;
  }

  const correctPos = payload.correctPosition;
  const showTokenOnMap = result != null && placed != null;
  const tokenX = (showTokenOnMap ? placed.x : correctPos.x) - 1;
  const tokenY = 5 - (showTokenOnMap ? placed.y : correctPos.y);
  const tokenLeft = tokenX * MAP_CELL_PX + MAP_CELL_PX / 2 - 28;
  const tokenTop = tokenY * MAP_CELL_PX + MAP_CELL_PX / 2 - 16;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h1 text-linen-100 mb-2">
          Place the grape on the map
        </h1>
        <p className="text-cork-400">Drag {payload.correctName} to its correct position.</p>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-8 items-start flex-wrap">
          {!result ? (
            <>
              <div className="mb-4">
                <p className="text-small text-cork-400 mb-2">Drag to map:</p>
                <GrapeToken id="grape-1" name={payload.correctName} />
              </div>
              <MapCanvas xAttr={payload.xAttr} yAttr={payload.yAttr} dropId="map-drop" />
            </>
          ) : (
            <MapCanvas xAttr={payload.xAttr} yAttr={payload.yAttr} dropId="map-drop">
              <div
                className="absolute pointer-events-none"
                style={{ left: tokenLeft, top: tokenTop }}
              >
                <GrapeToken
                  id="grape-placed"
                  name={payload.correctName}
                  variant={result.isCorrect ? "correct" : "incorrect"}
                />
              </div>
            </MapCanvas>
          )}
        </div>
      </DndContext>

      {loading && <p className="text-cork-400">Checking...</p>}

      {result && (
        <Panel variant="linenSheet" className="max-w-lg">
          <h3 className="font-display text-h3 text-cellar-950 mb-2">
            {result.isCorrect ? "Correct!" : "Not quite"}
          </h3>
          <p className="text-body text-cellar-950 mb-4">{result.feedback.structureMatch}</p>
          <Button
            variant="primary"
            onClick={() => {
              setResult(null);
              setPlaced(null);
              exerciseApi.generate(state.accessToken!, mapId).then(({ payload: p }) => setPayload(p));
            }}
          >
            Next
          </Button>
        </Panel>
      )}
    </div>
  );
}
