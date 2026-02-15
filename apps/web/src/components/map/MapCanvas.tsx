import { useDroppable } from "@dnd-kit/core";

const GRID_SIZE = 5;
const CELL_PX = 96;

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

/** Short labels for grid tick marks */
export const ORDINAL_SHORT: Record<number, string> = {
  1: "Low",
  2: "Med\u2212",
  3: "Med",
  4: "Med+",
  5: "High",
};

/** Full canonical labels for feedback text */
export const ORDINAL_FULL: Record<number, string> = {
  1: "Low",
  2: "Medium\u2212",
  3: "Medium",
  4: "Medium+",
  5: "High",
};

export function MapCanvas({
  xAttr,
  yAttr,
  dropId = "map-drop",
  children,
}: MapCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  const gridW = GRID_SIZE * CELL_PX;
  const gridH = GRID_SIZE * CELL_PX;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="flex items-stretch gap-0">
        {/* Y-axis title (vertical, left side) */}
        <div
          className="text-small font-ui text-cork-400 flex items-center justify-center shrink-0"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            letterSpacing: "0.1em",
            width: 20,
          }}
        >
          {attrLabels[yAttr] ?? yAttr}
        </div>

        {/* Y-axis tick labels */}
        <div className="relative shrink-0" style={{ width: 44, height: gridH }}>
          {Array.from({ length: GRID_SIZE }, (_, i) => {
            const val = GRID_SIZE - i; // 5, 4, 3, 2, 1 top-to-bottom
            return (
              <span
                key={`y-${i}`}
                className="absolute right-1 text-micro font-ui text-cork-400 text-right leading-none"
                style={{
                  top: i * CELL_PX + CELL_PX / 2,
                  transform: "translateY(-50%)",
                }}
              >
                {ORDINAL_SHORT[val]}
              </span>
            );
          })}
        </div>

        {/* Grid */}
        <div
          ref={setNodeRef}
          data-droppable-id={dropId}
          className={`relative rounded-card transition-colors ${
            isOver ? "ring-2 ring-brass-500/60" : ""
          }`}
          style={{ width: gridW, height: gridH }}
        >
          {/* Background */}
          <div className="absolute inset-0 rounded-card bg-cellar-800 border border-cork-500/30" />

          {/* Vertical grid lines */}
          {Array.from({ length: GRID_SIZE - 1 }, (_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-2 bottom-2 border-l border-dashed border-cork-500/20"
              style={{ left: (i + 1) * CELL_PX }}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: GRID_SIZE - 1 }, (_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-2 right-2 border-t border-dashed border-cork-500/20"
              style={{ top: (i + 1) * CELL_PX }}
            />
          ))}

          {/* Child markers (tokens) */}
          {children}
        </div>
      </div>

      {/* X-axis tick labels */}
      <div className="relative" style={{ width: gridW, height: 20, marginLeft: 64 }}>
        {Array.from({ length: GRID_SIZE }, (_, i) => (
          <span
            key={`x-${i}`}
            className="absolute text-micro font-ui text-cork-400 text-center leading-none"
            style={{
              left: i * CELL_PX,
              width: CELL_PX,
              top: 2,
            }}
          >
            {ORDINAL_SHORT[i + 1]}
          </span>
        ))}
      </div>

      {/* X-axis title */}
      <div
        className="text-small font-ui text-cork-400 text-center"
        style={{ letterSpacing: "0.1em", marginLeft: 64 }}
      >
        {attrLabels[xAttr] ?? xAttr}
      </div>
    </div>
  );
}

export function mapPositionToCoord(px: number, py: number): { x: number; y: number } {
  const x = Math.min(4, Math.max(0, Math.floor(px / CELL_PX)));
  const y = Math.min(4, Math.max(0, Math.floor(py / CELL_PX)));
  return { x: x + 1, y: 5 - y };
}

export const MAP_CELL_PX = CELL_PX;
export const MAP_GRID_SIZE = GRID_SIZE;
