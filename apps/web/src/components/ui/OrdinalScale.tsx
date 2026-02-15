import { type HTMLAttributes } from "react";

export function OrdinalScale({
  value,
  max = 5,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { value: number; max?: number }) {
  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="img"
      aria-label={`${value} of ${max}`}
      {...props}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full transition-colors duration-fast ${
            i < value ? "bg-brass-500" : "bg-cork-500/60"
          }`}
        />
      ))}
    </div>
  );
}
