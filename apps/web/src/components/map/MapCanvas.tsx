import { useDroppable } from "@dnd-kit/core";
import { Panel } from "../ui/Panel";

const GRID_SIZE = 5;
const CELL_PX = 64;

export type MapCanvasProps = {
  xAttr: string;
  yAttr: string;
  dropId?: string;
  children?: React.ReactNode;
};

const attrLabels: Record<string, string> = {
  tannin: "Tannin",
  acidity: "Acidity",
  body: "Body",
  alcohol: "Alcohol",
  oak_intensity: "Oak",
};

export function MapCanvas({
  xAttr,
  yAttr,
  dropId = "map-drop",
  children,
}: MapCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  return (
    <Panel variant="oak" className="relative p-6">
      <div className="flex flex-col gap-2">
        <div
          className="text-micro text-cork-400 text-center"
          style={{ letterSpacing: "0.08em" }}
        >
          {attrLabels[yAttr] ?? yAttr} (Y)
        </div>
        <div className="flex gap-2 items-stretch">
          <div
            className="text-micro text-cork-400 flex items-center justify-center w-6"
            style={{ letterSpacing: "0.08em", writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {attrLabels[xAttr] ?? xAttr} (X)
          </div>
          <div
            ref={setNodeRef}
            data-droppable-id={dropId}
            className={`relative border-2 border-dashed rounded-card transition-colors ${
              isOver ? "border-brass-500 bg-burgundy-800/20" : "border-cork-500/50"
            }`}
            style={{
              width: GRID_SIZE * CELL_PX + 2,
              height: GRID_SIZE * CELL_PX + 2,
            }}
          >
            {Array.from({ length: GRID_SIZE - 1 }, (_, i) => (
              <div
                key={`v-${i}`}
                className="absolute top-0 bottom-0 w-px bg-cork-500/40"
                style={{ left: (i + 1) * CELL_PX }}
              />
            ))}
            {Array.from({ length: GRID_SIZE - 1 }, (_, i) => (
              <div
                key={`h-${i}`}
                className="absolute left-0 right-0 h-px bg-cork-500/40"
                style={{ top: (i + 1) * CELL_PX }}
              />
            ))}
            {Array.from({ length: GRID_SIZE }, (_, i) => (
              <span
                key={`x-${i}`}
                className="absolute text-micro text-cork-400"
                style={{ left: i * CELL_PX + CELL_PX / 2 - 6, bottom: -18 }}
              >
                {i + 1}
              </span>
            ))}
            {Array.from({ length: GRID_SIZE }, (_, i) => (
              <span
                key={`y-${i}`}
                className="absolute text-micro text-cork-400"
                style={{ top: (GRID_SIZE - 1 - i) * CELL_PX + CELL_PX / 2 - 6, left: -18 }}
              >
                {i + 1}
              </span>
            ))}
            {children}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function mapPositionToCoord(px: number, py: number): { x: number; y: number } {
  const x = Math.min(4, Math.max(0, Math.floor(px / CELL_PX)));
  const y = Math.min(4, Math.max(0, Math.floor(py / CELL_PX)));
  return { x: x + 1, y: 5 - y };
}

export const MAP_CELL_PX = CELL_PX;
export const MAP_GRID_SIZE = GRID_SIZE;
