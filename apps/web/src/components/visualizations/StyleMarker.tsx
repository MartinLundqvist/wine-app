import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

type StyleMarkerProps = {
  x: number;
  y: number;
  to: string;
  "aria-label": string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
};

export function StyleMarker({
  x,
  y,
  to,
  "aria-label": ariaLabel,
  onMouseEnter,
  onMouseLeave,
  className = "",
}: StyleMarkerProps) {
  const navigate = useNavigate();
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={`cursor-pointer ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => navigate(to)}
      onKeyDown={(e) => e.key === "Enter" && navigate(to)}
      role="link"
      tabIndex={0}
      aria-label={ariaLabel}
    >
      <motion.circle
        r={6}
        cx={0}
        cy={0}
        fill="hsl(var(--wine-deep))"
        whileHover={{
          scale: 1.4,
          filter: "drop-shadow(0 0 6px hsl(var(--wine-deep) / 0.6))",
        }}
        transition={{ duration: 0.15 }}
        style={{ transformOrigin: "0px 0px" }}
      />
    </g>
  );
}
