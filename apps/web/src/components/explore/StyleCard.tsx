import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { StyleTargetFull } from "@wine-app/shared";
import { getStructureRange } from "@/lib/wine-structure";
import { Chip } from "@/components/ui/Chip";
import { WineAttributeBar } from "@/components/ui/WineAttributeBar";

type StyleCardProps = {
  style: StyleTargetFull;
  index?: number;
};

function colorBarClass(color: string) {
  if (color === "red")
    return "bg-gradient-to-r from-wine-deep to-wine-rich";
  if (color === "white")
    return "bg-gradient-to-r from-oak-light to-cream-dark";
  return "bg-gradient-to-r from-wine-light to-cream-dark";
}

function colorBadgeClass(color: string) {
  if (color === "red") return "bg-wine-deep/15 text-wine-light";
  if (color === "white") return "bg-oak/15 text-oak-light";
  return "bg-wine-light/15 text-wine-light";
}

export function StyleCard({ style: st, index = 0 }: StyleCardProps) {
  const tannin = getStructureRange(st.structure, "tannin");
  const body = getStructureRange(st.structure, "body");
  const acidity = getStructureRange(st.structure, "acidity");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.04 }}
    >
      <Link
        to={`/explore/styles/${st.id}`}
        className="group block rounded-xl overflow-hidden shadow-soft border border-border hover:shadow-wine transition-all duration-500 hover:-translate-y-1.5 no-underline"
      >
        <div className={`h-1.5 ${colorBarClass(st.producedColor)}`} />
        <div className="bg-card p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-wine-light transition-colors">
              {st.displayName}
            </h3>
            <span
              className={`text-[10px] font-sans font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full ${colorBadgeClass(st.producedColor)}`}
            >
              {st.producedColor}
            </span>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {st.region && (
              <Chip
                variant="ghost"
                className="bg-secondary border-border text-muted-foreground text-xs"
              >
                {st.region.displayName}
              </Chip>
            )}
            {st.grapes?.map(({ grape }) => (
              <Chip
                key={grape.id}
                variant="ghost"
                className="bg-secondary border-border text-muted-foreground text-xs"
              >
                {grape.displayName}
              </Chip>
            ))}
            <Chip
              variant="ghost"
              className="bg-secondary border-border text-muted-foreground text-xs"
            >
              Tier {st.ladderTier}
            </Chip>
          </div>
          <div className="space-y-2.5 pt-3 border-t border-border">
            <WineAttributeBar
              label="Tannin"
              minValue={tannin?.minValue ?? 0}
              maxValue={tannin?.maxValue ?? 0}
              max={tannin?.scaleMax ?? 5}
            />
            <WineAttributeBar
              label="Body"
              minValue={body?.minValue ?? 0}
              maxValue={body?.maxValue ?? 0}
              max={body?.scaleMax ?? 5}
            />
            <WineAttributeBar
              label="Acidity"
              minValue={acidity?.minValue ?? 0}
              maxValue={acidity?.maxValue ?? 0}
              max={acidity?.scaleMax ?? 5}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
