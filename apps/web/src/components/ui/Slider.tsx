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
    <div className={`font-ui ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-small text-cork-400 mb-1 tracking-ui"
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
          className="w-32 h-2 rounded-full appearance-none bg-cork-500 accent-burgundy-700 focus:outline-none focus:ring-2 focus:ring-brass-500 focus:ring-offset-2 focus:ring-offset-cellar-950"
          {...props}
        />
        <span className="text-small text-linen-100 min-w-[1.5rem]">{value}</span>
      </div>
    </div>
  );
}
