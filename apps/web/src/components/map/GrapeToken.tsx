import { useDraggable } from "@dnd-kit/core";
import { Chip } from "../ui/Chip";

type GrapeTokenProps = {
  id: string;
  name: string;
  variant?: "base" | "selected" | "correct" | "incorrect";
};

export function GrapeToken({ id, name, variant = "base" }: GrapeTokenProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative inline-flex cursor-grab active:cursor-grabbing touch-none select-none ${
        isDragging ? "z-50 shadow-soft ring-2 ring-accent rounded-full" : ""
      }`}
    >
      <Chip variant={variant}>{name}</Chip>
    </div>
  );
}
