import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { GrapePercentageIndicator } from "../ui/GrapePercentageIndicator";
import { RangeSlider } from "../ui/RangeSlider";
import { RegionEditorModal } from "./RegionEditorModal";
import { Wine, Palette, Grape, Flower2, ChevronRight } from "lucide-react";
import type { Region } from "@wine-app/shared";

const STYLE_TYPES = [
  "global_archetype",
  "regional_archetype",
  "appellation_archetype",
  "specific_bottle",
] as const;
const PRODUCED_COLORS = ["red", "white", "rose"] as const;
const WINE_CATEGORIES = ["still", "sparkling", "fortified"] as const;

const inputClass =
  "w-full px-3 py-2 rounded-md bg-card border border-input text-foreground focus:ring-2 focus:ring-accent";
const sectionCardClass =
  "bg-card rounded-xl p-6 shadow-soft border border-border";

function colorBarClass(color: string) {
  if (color === "red") return "bg-gradient-to-r from-wine-deep to-wine-rich";
  if (color === "white") return "bg-gradient-to-r from-oak-light to-cream-dark";
  return "bg-gradient-to-r from-wine-light to-cream-dark";
}

function getRegionPath(regions: Region[], regionId: string | null): string[] {
  if (!regionId || !regions?.length) return [];
  const path: string[] = [];
  let currentId: string | null = regionId;
  while (currentId) {
    const r = regions.find((x) => x.id === currentId);
    if (!r) break;
    path.unshift(r.id);
    currentId = r.parentId ?? null;
  }
  return path;
}


export interface WineStyleFormData {
  id: string;
  displayName: string;
  styleType: string;
  producedColor: string;
  wineCategory: string;
  regionId: string;
  climateMin: string;
  climateMax: string;
  notes: string;
  grapes: { grapeVarietyId: string; percentage?: number | null }[];
  structure: { structureDimensionId: string; minValue: number; maxValue: number }[];
  appearance: { appearanceDimensionId: string; minValue: number; maxValue: number }[];
  aromaClusters: { aromaClusterId: string; intensityMin: number; intensityMax: number }[];
  aromaDescriptors: { aromaDescriptorId: string; salience: "dominant" | "supporting" | "occasional" }[];
}

export interface WineStyleFormValidationErrors {
  id?: string;
  displayName?: string;
  climate?: string;
  structure?: string;
  appearance?: string;
  grapes?: string;
}

type FieldKey = keyof Pick<
  WineStyleFormData,
  | "displayName"
  | "styleType"
  | "producedColor"
  | "wineCategory"
  | "regionId"
  | "climateMin"
  | "climateMax"
  | "notes"
>;

export interface WineStyleFormProps {
  data: WineStyleFormData;
  onFieldChange: (field: FieldKey | "id", value: string) => void;
  onIdBlur?: () => void;
  onDisplayNameBlur?: () => void;
  onGrapesChange: (next: WineStyleFormData["grapes"]) => void;
  onStructureChange: (next: WineStyleFormData["structure"]) => void;
  onAppearanceChange: (next: WineStyleFormData["appearance"]) => void;
  onAromaClustersChange: (next: WineStyleFormData["aromaClusters"]) => void;
  onAromaDescriptorsChange: (next: WineStyleFormData["aromaDescriptors"]) => void;
  regions: Region[] | undefined;
  ordinalScales: { id: string; displayName: string; labels: string[] }[] | undefined;
  grapesList: { id: string; displayName: string }[] | undefined;
  structureDims:
    | { id: string; displayName: string; ordinalScale?: { labels?: string[] } | null }[]
    | undefined;
  appearanceDims:
    | { id: string; displayName: string; producedColor?: string | null; ordinalScale?: { labels?: string[] } | null }[]
    | undefined;
  aromaTaxonomy: { clusters?: { id: string; displayName: string; descriptors?: { id: string; displayName: string }[] }[] }[] | undefined;
  validationErrors: WineStyleFormValidationErrors;
  mode: "create" | "edit";
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  isSubmitting: boolean;
  isFormValid: boolean;
  error: string;
  cancelTo: string;
}

const CLIMATE_SCALE_ID = "climate_5";

export function WineStyleForm({
  data,
  onFieldChange,
  onIdBlur,
  onDisplayNameBlur,
  onGrapesChange,
  onStructureChange,
  onAppearanceChange,
  onAromaClustersChange,
  onAromaDescriptorsChange,
  regions = [],
  ordinalScales,
  grapesList,
  structureDims,
  appearanceDims,
  aromaTaxonomy,
  validationErrors,
  mode,
  onSubmit,
  submitLabel,
  isSubmitting,
  isFormValid,
  error,
  cancelTo,
}: WineStyleFormProps) {
  const [showRegionModal, setShowRegionModal] = useState(false);

  const climateScale = ordinalScales?.find((s) => s.id === CLIMATE_SCALE_ID);
  const climateLabels = climateScale?.labels ?? [];
  const intensityScale =
    ordinalScales?.find((s) => s.id === "intensity_5") ??
    ordinalScales?.find((s) => (s.labels?.length ?? 0) >= 5);
  const intensityLabels = intensityScale?.labels ?? ["1", "2", "3", "4", "5"];
  const allClusters =
    aromaTaxonomy?.flatMap((s) => s.clusters ?? []) ?? [];
  const allDescriptors = allClusters.flatMap(
    (c) =>
      (c as { descriptors?: { id: string; displayName: string }[] })
        .descriptors ?? []
  );

  return (
    <div className="min-h-screen bg-background">
      <div className={`h-1.5 ${colorBarClass(data.producedColor)}`} />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <section className={sectionCardClass}>
            <h2 className="font-serif text-lg font-semibold text-foreground mb-4">
              Identity
            </h2>
            <div className="space-y-4">
              {mode === "create" ? (
                <div>
                  <label htmlFor="id" className="block text-sm font-medium text-foreground mb-1">
                    ID (slug, e.g. marlborough_sauvignon_blanc) *
                  </label>
                  <input
                    id="id"
                    type="text"
                    value={data.id}
                    onChange={(e) => onFieldChange("id", e.target.value)}
                    onBlur={onIdBlur}
                    required
                    pattern="[a-z0-9_]+"
                    placeholder="lowercase_underscores_only"
                    className={inputClass}
                    aria-invalid={!!validationErrors.id}
                  />
                  {validationErrors.id && (
                    <p className="mt-1 text-sm text-destructive">{validationErrors.id}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-mono">{data.id}</p>
              )}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-1">
                  Display name *
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={data.displayName}
                  onChange={(e) => onFieldChange("displayName", e.target.value)}
                  onBlur={onDisplayNameBlur}
                  required
                  className={inputClass}
                  aria-invalid={!!validationErrors.displayName}
                />
                {validationErrors.displayName && (
                  <p className="mt-1 text-sm text-destructive">{validationErrors.displayName}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="styleType" className="block text-sm font-medium text-foreground mb-1">
                    Style type *
                  </label>
                  <select
                    id="styleType"
                    value={data.styleType}
                    onChange={(e) => onFieldChange("styleType", e.target.value)}
                    className={inputClass}
                  >
                    {STYLE_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {v.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="producedColor" className="block text-sm font-medium text-foreground mb-1">
                    Color *
                  </label>
                  <select
                    id="producedColor"
                    value={data.producedColor}
                    onChange={(e) => onFieldChange("producedColor", e.target.value)}
                    className={inputClass}
                  >
                    {PRODUCED_COLORS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="wineCategory" className="block text-sm font-medium text-foreground mb-1">
                    Category
                  </label>
                  <select
                    id="wineCategory"
                    value={data.wineCategory}
                    onChange={(e) => onFieldChange("wineCategory", e.target.value)}
                    className={inputClass}
                  >
                    {WINE_CATEGORIES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className="font-serif text-lg font-semibold text-foreground mb-4">
              Region & climate
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Region
                </label>
                {/* Breadcrumb showing current selection */}
                <div className="flex items-center gap-1 flex-wrap text-sm text-muted-foreground mb-2 min-h-[1.5rem]">
                  {data.regionId ? (
                    getRegionPath(regions, data.regionId).map((id, i, arr) => {
                      const r = regions.find((x) => x.id === id);
                      return (
                        <span key={id} className="flex items-center gap-1">
                          {i > 0 && <ChevronRight className="w-3 h-3" />}
                          <span className={i === arr.length - 1 ? "text-foreground font-medium" : ""}>
                            {r?.displayName ?? id}
                          </span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="italic">No region selected</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRegionModal(true)}
                  >
                    Edit regions…
                  </Button>
                  {data.regionId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onFieldChange("regionId", "")}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {showRegionModal && (
                  <RegionEditorModal
                    initialRegionId={data.regionId || null}
                    onClose={(selectedId) => {
                      setShowRegionModal(false);
                      if (selectedId !== null) {
                        onFieldChange("regionId", selectedId);
                      }
                    }}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="climateMin" className="block text-sm font-medium text-foreground mb-1">
                    Climate min
                  </label>
                  <select
                    id="climateMin"
                    value={data.climateMin}
                    onChange={(e) => onFieldChange("climateMin", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {climateLabels.map((label, i) => (
                      <option key={i} value={String(i + 1)}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="climateMax" className="block text-sm font-medium text-foreground mb-1">
                    Climate max
                  </label>
                  <select
                    id="climateMax"
                    value={data.climateMax}
                    onChange={(e) => onFieldChange("climateMax", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {climateLabels.map((label, i) => (
                      <option key={i} value={String(i + 1)}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {validationErrors.climate && (
                <p className="mt-2 text-sm text-destructive">{validationErrors.climate}</p>
              )}
            </div>
          </section>

          <section className={sectionCardClass}>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={data.notes}
              onChange={(e) => onFieldChange("notes", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </section>

          <section className={sectionCardClass}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-wine-deep/15 flex items-center justify-center">
                <Grape className="w-4 h-4 text-wine-light" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground">Grapes</h3>
            </div>
            {data.grapes.map((g, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <select
                  value={g.grapeVarietyId}
                  onChange={(e) =>
                    onGrapesChange(
                      data.grapes.map((x, j) =>
                        j === i ? { ...x, grapeVarietyId: e.target.value } : x
                      )
                    )
                  }
                  className="flex-1 px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm"
                >
                  {grapesList?.map((gr) => (
                    <option key={gr.id} value={gr.id}>
                      {gr.displayName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="%"
                  value={g.percentage ?? ""}
                  onChange={(e) =>
                    onGrapesChange(
                      data.grapes.map((x, j) =>
                        j === i
                          ? { ...x, percentage: e.target.value === "" ? null : Number(e.target.value) }
                          : x
                      )
                    )
                  }
                  className="w-16 px-2 py-2 rounded-md bg-card border border-input text-foreground text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onGrapesChange(data.grapes.filter((_, j) => j !== i))}
                >
                  Remove
                </Button>
              </div>
            ))}
            <GrapePercentageIndicator grapes={data.grapes} showValidationMessage={true} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onGrapesChange([
                  ...data.grapes,
                  { grapeVarietyId: grapesList?.[0]?.id ?? "", percentage: null },
                ])
              }
              disabled={!grapesList?.length}
            >
              Add grape
            </Button>
          </section>

          <section className={sectionCardClass}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-wine-deep/15 flex items-center justify-center">
                <Wine className="w-4 h-4 text-wine-light" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground">Structure *</h3>
            </div>
            <div className="space-y-4">
              {data.structure.map((s, i) => {
                const dim = structureDims?.find((d) => d.id === s.structureDimensionId);
                const labels = dim?.ordinalScale?.labels ?? [];
                const scaleMax = labels.length || 5;
                return (
                  <div key={s.structureDimensionId} className="space-y-2">
                    <RangeSlider
                      min={1}
                      max={scaleMax}
                      step={1}
                      value={[s.minValue, s.maxValue]}
                      onChange={([minV, maxV]) =>
                        onStructureChange(
                          data.structure.map((x, j) =>
                            j === i ? { ...x, minValue: minV, maxValue: maxV } : x
                          )
                        )
                      }
                      labels={labels}
                      label={dim?.displayName ?? s.structureDimensionId}
                    />
                  </div>
                );
              })}
            </div>
            {validationErrors.structure && (
              <p className="mt-2 text-sm text-destructive">{validationErrors.structure}</p>
            )}
          </section>

          <section className={sectionCardClass}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-wine-deep/15 flex items-center justify-center">
                <Palette className="w-4 h-4 text-wine-light" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground">Appearance *</h3>
            </div>
            <div className="space-y-4">
              {data.appearance.map((a, i) => {
                const dim = appearanceDims?.find((d) => d.id === a.appearanceDimensionId);
                const labels = dim?.ordinalScale?.labels ?? [];
                const scaleMax = labels.length || 5;
                return (
                  <div key={a.appearanceDimensionId} className="space-y-2">
                    <RangeSlider
                      min={1}
                      max={scaleMax}
                      step={1}
                      value={[a.minValue, a.maxValue]}
                      onChange={([minV, maxV]) =>
                        onAppearanceChange(
                          data.appearance.map((x, j) =>
                            j === i ? { ...x, minValue: minV, maxValue: maxV } : x
                          )
                        )
                      }
                      labels={labels}
                      label={dim?.displayName ?? a.appearanceDimensionId}
                    />
                  </div>
                );
              })}
            </div>
            {validationErrors.appearance && (
              <p className="mt-2 text-sm text-destructive">{validationErrors.appearance}</p>
            )}
          </section>

          <section className={sectionCardClass}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-wine-deep/15 flex items-center justify-center">
                <Flower2 className="w-4 h-4 text-wine-light" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground">
                Aroma clusters (intensity)
              </h3>
            </div>
            {data.aromaClusters.map((c, i) => (
              <div key={i} className="flex gap-2 items-center mb-4 flex-wrap">
                <select
                  value={c.aromaClusterId}
                  onChange={(e) =>
                    onAromaClustersChange(
                      data.aromaClusters.map((x, j) =>
                        j === i ? { ...x, aromaClusterId: e.target.value } : x
                      )
                    )
                  }
                  className="min-w-[160px] px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm"
                >
                  {allClusters.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {(cl as { displayName: string }).displayName}
                    </option>
                  ))}
                </select>
                <div className="flex-1 min-w-[200px]">
                  <RangeSlider
                    min={1}
                    max={intensityLabels.length || 5}
                    step={1}
                    value={[c.intensityMin, c.intensityMax]}
                    onChange={([minV, maxV]) =>
                      onAromaClustersChange(
                        data.aromaClusters.map((x, j) =>
                          j === i ? { ...x, intensityMin: minV, intensityMax: maxV } : x
                        )
                      )
                    }
                    labels={intensityLabels}
                    label="Intensity"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onAromaClustersChange(data.aromaClusters.filter((_, j) => j !== i))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onAromaClustersChange([
                  ...data.aromaClusters,
                  {
                    aromaClusterId: allClusters[0]?.id ?? "",
                    intensityMin: 1,
                    intensityMax: 5,
                  },
                ])
              }
              disabled={!allClusters.length}
            >
              Add aroma cluster
            </Button>
          </section>

          <section className={sectionCardClass}>
            <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
              Aroma descriptors
            </h3>
            {data.aromaDescriptors.map((d, i) => (
              <div key={i} className="flex gap-2 items-center mb-2 flex-wrap">
                <select
                  value={d.aromaDescriptorId}
                  onChange={(e) =>
                    onAromaDescriptorsChange(
                      data.aromaDescriptors.map((x, j) =>
                        j === i ? { ...x, aromaDescriptorId: e.target.value } : x
                      )
                    )
                  }
                  className="min-w-[160px] px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm"
                >
                  {allDescriptors.map((desc) => (
                    <option key={desc.id} value={desc.id}>
                      {desc.displayName}
                    </option>
                  ))}
                </select>
                <select
                  value={d.salience}
                  onChange={(e) =>
                    onAromaDescriptorsChange(
                      data.aromaDescriptors.map((x, j) =>
                        j === i
                          ? { ...x, salience: e.target.value as "dominant" | "supporting" | "occasional" }
                          : x
                      )
                    )
                  }
                  className="px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm"
                >
                  <option value="dominant">dominant</option>
                  <option value="supporting">supporting</option>
                  <option value="occasional">occasional</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onAromaDescriptorsChange(data.aromaDescriptors.filter((_, j) => j !== i))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onAromaDescriptorsChange([
                  ...data.aromaDescriptors,
                  { aromaDescriptorId: allDescriptors[0]?.id ?? "", salience: "supporting" },
                ])
              }
              disabled={!allDescriptors.length}
            >
              Add aroma descriptor
            </Button>
          </section>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" variant="hero" disabled={isSubmitting || !isFormValid}>
              {submitLabel}
            </Button>
            <Link to={cancelTo}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
