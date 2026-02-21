import { type InputHTMLAttributes, useId } from "react";

export function Slider({
  label,
  value,
  min = 1,
  max = 5,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  value: number;
  min?: number;
  max?: number;
}) {
  const id = useId();
  return (
    <div className={`font-sans ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm text-muted-foreground mb-1"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          className="w-32 h-2 rounded-full appearance-none bg-muted-foreground accent-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          {...props}
        />
        <span className="text-sm text-foreground min-w-[1.5rem]">{value}</span>
      </div>
    </div>
  );
}
