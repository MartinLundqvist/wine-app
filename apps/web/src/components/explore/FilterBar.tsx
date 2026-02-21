import { motion } from "framer-motion";

type FilterOption<T extends string> = { label: string; value: T };

type FilterBarProps<TFilter extends string, TSort extends string> = {
  filterLabel?: string;
  filterOptions: readonly FilterOption<TFilter>[];
  filterValue: TFilter;
  onFilterChange: (value: TFilter) => void;
  sortLabel?: string;
  sortOptions: readonly FilterOption<TSort>[];
  sortValue: TSort;
  onSortChange: (value: TSort) => void;
};

export function FilterBar<TFilter extends string, TSort extends string>({
  filterLabel = "Color:",
  filterOptions,
  filterValue,
  onFilterChange,
  sortLabel = "Sort:",
  sortOptions,
  sortValue,
  onSortChange,
}: FilterBarProps<TFilter, TSort>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-wrap items-center gap-6 bg-card rounded-xl p-4 shadow-soft border border-border"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-sans text-muted-foreground font-medium">
          {filterLabel}
        </span>
        <div className="flex gap-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => onFilterChange(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-sans font-medium transition-all duration-200 ${
                filterValue === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-sans text-muted-foreground font-medium">
          {sortLabel}
        </span>
        <div className="flex gap-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSortChange(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-sans font-medium transition-all duration-200 ${
                sortValue === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
