import { useDroppable } from "@dnd-kit/core";

const DEFAULT_GRID_SIZE = 5;
const CELL_PX = 96;

export type MapCanvasProps = {
  xAttr: string;
  yAttr: string;
  dropId?: string;
  /** Number of columns (X positions). Default 5. Use 2 for binary categorical (e.g. Red/Black). */
  gridCols?: number;
  /** Number of rows (Y positions). Default 5. */
  gridRows?: number;
  /** Override X-axis tick labels (one per column). Used e.g. for categorical (Red/Black). */
  xTickLabels?: string[];
  /** Override Y-axis tick labels (positions top-to-bottom). Used e.g. for derived scale. */
  yTickLabels?: string[];
  children?: React.ReactNode;
};

const attrLabels: Record<string, string> = {
  tannin: "Tannin",
  acidity: "Acidity",
  body: "Body",
  alcohol: "Alcohol",
  oak_intensity: "Oak",
  fruit_profile: "Fruit profile",
  fruit_forward_index: "Fruit forward",
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
  gridCols = DEFAULT_GRID_SIZE,
  gridRows = DEFAULT_GRID_SIZE,
  xTickLabels,
  yTickLabels,
  children,
}: MapCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  const gridW = gridCols * CELL_PX;
  const gridH = gridRows * CELL_PX;

  const xLabel = (pos: number) => xTickLabels?.[pos - 1] ?? ORDINAL_SHORT[pos];
  const yLabel = (pos: number) => {
    if (yTickLabels) {
      const idx = gridRows - pos;
      return yTickLabels[idx] ?? ORDINAL_SHORT[pos];
    }
    return ORDINAL_SHORT[pos];
  };

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="flex items-stretch gap-4">
        {/* Y-axis title (vertical, left side) */}
        <div
          className="text-sm font-sans text-muted-foreground flex items-center justify-center shrink-0"
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            letterSpacing: "0.1em",
            width: 24,
          }}
        >
          {attrLabels[yAttr] ?? yAttr}
        </div>

        {/* Y-axis tick labels */}
        <div className="relative shrink-0" style={{ width: 56, height: gridH }}>
          {Array.from({ length: gridRows }, (_, i) => {
            const val = gridRows - i; // top-to-bottom
            return (
              <span
                key={`y-${i}`}
                className="absolute right-1 text-xs font-sans text-muted-foreground text-right leading-none"
                style={{
                  top: i * CELL_PX + CELL_PX / 2,
                  transform: "translateY(-50%)",
                }}
              >
                {yLabel(val)}
              </span>
            );
          })}
        </div>

        {/* Grid */}
        <div
          ref={setNodeRef}
          data-droppable-id={dropId}
          className={`relative rounded-lg transition-colors ${
            isOver ? "ring-2 ring-accent/60" : ""
          }`}
          style={{ width: gridW, height: gridH }}
        >
          {/* Background */}
          <div className="absolute inset-0 rounded-lg bg-card border border-border" />

          {/* Vertical grid lines */}
          {Array.from({ length: gridCols - 1 }, (_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-2 bottom-2 border-l border-dashed border-border/50"
              style={{ left: (i + 1) * CELL_PX }}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: gridRows - 1 }, (_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-2 right-2 border-t border-dashed border-border/50"
              style={{ top: (i + 1) * CELL_PX }}
            />
          ))}

          {/* Child markers (tokens) */}
          {children}
        </div>
      </div>

      {/* X-axis tick labels */}
      <div
        className="relative"
        style={{ width: gridW, height: 20, marginLeft: 96 }}
      >
        {Array.from({ length: gridCols }, (_, i) => (
          <span
            key={`x-${i}`}
            className="absolute text-xs font-sans text-muted-foreground text-center leading-none"
            style={{
              left: i * CELL_PX,
              width: CELL_PX,
              top: 2,
            }}
          >
            {xLabel(i + 1)}
          </span>
        ))}
      </div>

      {/* X-axis title */}
      <div
        className="text-sm font-sans text-muted-foreground text-center"
        style={{ letterSpacing: "0.1em", marginLeft: 96 }}
      >
        {attrLabels[xAttr] ?? xAttr}
      </div>
    </div>
  );
}

export function mapPositionToCoord(
  px: number,
  py: number,
  gridCols: number = DEFAULT_GRID_SIZE,
  gridRows: number = DEFAULT_GRID_SIZE,
): { x: number; y: number } {
  const x = Math.min(gridCols - 1, Math.max(0, Math.floor(px / CELL_PX)));
  const y = Math.min(gridRows - 1, Math.max(0, Math.floor(py / CELL_PX)));
  return { x: x + 1, y: gridRows - y };
}

export const MAP_CELL_PX = CELL_PX;
export const MAP_GRID_SIZE = DEFAULT_GRID_SIZE;
