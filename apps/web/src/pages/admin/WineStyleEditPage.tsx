import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, adminApi } from "../../api/client";
import { queryKeys } from "../../api/queryKeys";
import { useAuth } from "../../contexts/AuthContext";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { WineStyleForm } from "../../components/admin/WineStyleForm";
import type { WineStyleFormData, WineStyleFormValidationErrors } from "../../components/admin/WineStyleForm";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { WineStylePatch } from "@wine-app/shared";

const CLIMATE_SCALE_ID = "climate_5";

const STYLE_TYPES = [
  "global_archetype",
  "regional_archetype",
  "appellation_archetype",
  "specific_bottle",
] as const;
const PRODUCED_COLORS = ["red", "white", "rose"] as const;
const WINE_CATEGORIES = ["still", "sparkling", "fortified"] as const;

export function WineStyleEditPage() {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle(id ? `Edit ${id}` : "Edit wine style");
  const { state } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const accessToken = state.accessToken ?? "";
  const preFilledStyleIdRef = useRef<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [styleType, setStyleType] = useState<(typeof STYLE_TYPES)[number]>("regional_archetype");
  const [producedColor, setProducedColor] = useState<(typeof PRODUCED_COLORS)[number]>("red");
  const [wineCategory, setWineCategory] = useState<(typeof WINE_CATEGORIES)[number]>("still");
  const [regionId, setRegionId] = useState("");
  const [climateMin, setClimateMin] = useState("");
  const [climateMax, setClimateMax] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [grapes, setGrapes] = useState<{ grapeVarietyId: string; percentage?: number | null }[]>([]);
  const [structure, setStructure] = useState<{ structureDimensionId: string; minValue: number; maxValue: number }[]>([]);
  const [appearance, setAppearance] = useState<{ appearanceDimensionId: string; minValue: number; maxValue: number }[]>([]);
  const [aromaClusters, setAromaClusters] = useState<{ aromaClusterId: string; intensityMin: number; intensityMax: number }[]>([]);
  const [aromaDescriptors, setAromaDescriptors] = useState<{ aromaDescriptorId: string; salience: "dominant" | "supporting" | "occasional" }[]>([]);

  const { data: style, isLoading: styleLoading } = useQuery({
    queryKey: id ? queryKeys.wineStyle(id) : ["skip"],
    queryFn: () => api.getWineStyle(id!),
    enabled: !!id,
  });
  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: queryKeys.regions,
    queryFn: () => api.getRegions(),
  });
  const { data: ordinalScales, isLoading: scalesLoading } = useQuery({
    queryKey: queryKeys.ordinalScales,
    queryFn: () => api.getOrdinalScales(),
  });
  const { data: grapesList } = useQuery({
    queryKey: queryKeys.grapes,
    queryFn: () => api.getGrapes(),
  });
  const { data: structureDims } = useQuery({
    queryKey: queryKeys.structureDimensions,
    queryFn: () => api.getStructureDimensions(),
  });
  const { data: appearanceDims } = useQuery({
    queryKey: queryKeys.appearanceDimensions,
    queryFn: () => api.getAppearanceDimensions(),
  });
  const { data: aromaTaxonomy } = useQuery({
    queryKey: queryKeys.aromaTaxonomy,
    queryFn: () => api.getAromaTaxonomy(),
  });

  // Hydrate state from fetched style
  useEffect(() => {
    if (style) {
      setDisplayName(style.displayName);
      setStyleType(style.styleType as (typeof STYLE_TYPES)[number]);
      setProducedColor(style.producedColor as (typeof PRODUCED_COLORS)[number]);
      setWineCategory(style.wineCategory as (typeof WINE_CATEGORIES)[number]);
      setRegionId(style.regionId ?? "");
      setClimateMin(style.climateMin != null ? String(style.climateMin) : "");
      setClimateMax(style.climateMax != null ? String(style.climateMax) : "");
      setNotes(style.notes ?? "");
      setGrapes(
        (style.grapes ?? []).map((g) => ({
          grapeVarietyId: g.grape.id,
          percentage: g.percentage ?? null,
        }))
      );
      setStructure(
        (style.structure ?? []).map((s) => ({
          structureDimensionId: s.structureDimensionId,
          minValue: s.minValue,
          maxValue: s.maxValue,
        }))
      );
      setAppearance(
        (style.appearance ?? []).map((a) => ({
          appearanceDimensionId: a.appearanceDimensionId,
          minValue: a.minValue,
          maxValue: a.maxValue,
        }))
      );
      setAromaClusters(
        (style.aromaClusters ?? []).map((c) => ({
          aromaClusterId: c.aromaClusterId,
          intensityMin: c.intensityMin,
          intensityMax: c.intensityMax,
        }))
      );
      setAromaDescriptors(
        (style.aromaDescriptors ?? []).map((d) => ({
          aromaDescriptorId: d.aromaDescriptorId,
          salience: d.salience as "dominant" | "supporting" | "occasional",
        }))
      );
    }
  }, [style]);

  // Pre-fill structure and appearance with any dimensions missing from saved data (once per style load)
  useEffect(() => {
    if (!style || !structureDims?.length || !appearanceDims?.length) return;
    if (preFilledStyleIdRef.current === style.id) return;
    preFilledStyleIdRef.current = style.id;

    setStructure((prev) => {
      const existingIds = new Set(prev.map((s) => s.structureDimensionId));
      const missing = structureDims.filter((d) => !existingIds.has(d.id));
      if (missing.length === 0) return prev;
      return [
        ...prev,
        ...missing.map((d) => ({
          structureDimensionId: d.id,
          minValue: 1,
          maxValue: d.ordinalScale?.labels?.length ?? 5,
        })),
      ];
    });

    setAppearance((prev) => {
      const applicable = appearanceDims.filter(
        (d) => d.producedColor == null || d.producedColor === style.producedColor
      );
      const existingIds = new Set(prev.map((a) => a.appearanceDimensionId));
      const missing = applicable.filter((d) => !existingIds.has(d.id));
      if (missing.length === 0) return prev;
      return [
        ...prev,
        ...missing.map((d) => ({
          appearanceDimensionId: d.id,
          minValue: 1,
          maxValue: d.ordinalScale?.labels?.length ?? 5,
        })),
      ];
    });
  }, [style, structureDims, appearanceDims]);

  // When producedColor changes, replace appearance with dimensions applicable to the new color (preserve values where present)
  useEffect(() => {
    if (!appearanceDims?.length) return;
    const applicable = appearanceDims.filter(
      (d) => d.producedColor == null || d.producedColor === producedColor
    );
    setAppearance((prev) => {
      const prevByKey = new Map(prev.map((a) => [a.appearanceDimensionId, a]));
      return applicable.map((d) => {
        const existing = prevByKey.get(d.id);
        const scaleLen = d.ordinalScale?.labels?.length ?? 5;
        return existing ?? { appearanceDimensionId: d.id, minValue: 1, maxValue: scaleLen };
      });
    });
  }, [producedColor, appearanceDims]);

  const validationErrors = ((): WineStyleFormValidationErrors => {
    const errs: WineStyleFormValidationErrors = {};
    const cMin = climateMin === "" ? undefined : Number(climateMin);
    const cMax = climateMax === "" ? undefined : Number(climateMax);
    if (cMin != null && cMax != null && cMin > cMax) {
      errs.climate = "Climate min must be ≤ max";
    }
    const structureInvalid = structure.some((s) => s.minValue > s.maxValue);
    if (structureInvalid) errs.structure = "For each dimension, min must be ≤ max";
    const appearanceInvalid = appearance.some((a) => a.minValue > a.maxValue);
    if (appearanceInvalid) errs.appearance = "For each dimension, min must be ≤ max";
    const grapeTotal = grapes.reduce((s, g) => s + (g.percentage != null ? g.percentage : 0), 0);
    const hasGrapePct = grapes.some((g) => g.percentage != null && g.percentage > 0);
    if (hasGrapePct && grapeTotal !== 100) {
      errs.grapes =
        grapeTotal > 100
          ? "Grape percentages must not exceed 100%."
          : "Grape percentages should total 100%.";
    }
    return errs;
  })();

  const grapeTotal = grapes.reduce((s, g) => s + (g.percentage != null ? g.percentage : 0), 0);
  const hasGrapePct = grapes.some((g) => g.percentage != null && g.percentage > 0);
  const grapesValid = !hasGrapePct || grapeTotal === 100;
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const isFormValid =
    !hasValidationErrors &&
    grapesValid &&
    displayName.trim().length > 0 &&
    structure.length > 0 &&
    !structure.some((s) => s.minValue > s.maxValue) &&
    appearance.length > 0 &&
    !appearance.some((a) => a.minValue > a.maxValue);

  const patchMutation = useMutation({
    mutationFn: (body: WineStylePatch) =>
      adminApi.updateWineStyle(accessToken, id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: id ? queryKeys.wineStyle(id) : [] });
      queryClient.invalidateQueries({ queryKey: queryKeys.wineStyles });
      navigate("/admin/wine-styles");
    },
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!grapesValid) return;
    setError("");
    const payload: WineStylePatch = {
      displayName: displayName.trim(),
      styleType,
      producedColor,
      wineCategory,
      regionId: regionId ? regionId : null,
      climateMin: climateMin === "" ? null : Number(climateMin),
      climateMax: climateMax === "" ? null : Number(climateMax),
      climateOrdinalScaleId:
        climateMin !== "" && climateMax !== "" ? CLIMATE_SCALE_ID : null,
      notes: notes.trim() === "" ? null : notes.trim(),
      grapes: grapes.map((g) => ({
        grapeVarietyId: g.grapeVarietyId,
        percentage: g.percentage ?? undefined,
      })),
      structure,
      appearance,
      aromaClusters,
      aromaDescriptors,
    };
    try {
      await patchMutation.mutateAsync(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const isLoading = styleLoading || regionsLoading || scalesLoading;
  if (isLoading || !style) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const formData: WineStyleFormData = {
    id: style.id,
    displayName,
    styleType,
    producedColor,
    wineCategory,
    regionId,
    climateMin,
    climateMax,
    notes,
    grapes,
    structure,
    appearance,
    aromaClusters,
    aromaDescriptors,
  };

  return (
    <>
      <div className="max-w-2xl mx-auto px-6 pt-8">
        <Link
          to="/admin/wine-styles"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Link>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
          Edit wine style
        </h1>
      </div>
      <WineStyleForm
        data={formData}
        onFieldChange={(field, value) => {
          switch (field) {
            case "id":
              break;
            case "displayName":
              setDisplayName(value);
              break;
            case "styleType":
              setStyleType(value as (typeof STYLE_TYPES)[number]);
              break;
            case "producedColor":
              setProducedColor(value as (typeof PRODUCED_COLORS)[number]);
              break;
            case "wineCategory":
              setWineCategory(value as (typeof WINE_CATEGORIES)[number]);
              break;
            case "regionId":
              setRegionId(value);
              break;
            case "climateMin":
              setClimateMin(value);
              break;
            case "climateMax":
              setClimateMax(value);
              break;
            case "notes":
              setNotes(value);
              break;
            default:
              break;
          }
        }}
        onGrapesChange={setGrapes}
        onStructureChange={setStructure}
        onAppearanceChange={setAppearance}
        onAromaClustersChange={setAromaClusters}
        onAromaDescriptorsChange={setAromaDescriptors}
        regions={regions}
        ordinalScales={ordinalScales}
        grapesList={grapesList}
        structureDims={structureDims}
        appearanceDims={appearanceDims}
        aromaTaxonomy={aromaTaxonomy}
        validationErrors={validationErrors}
        mode="edit"
        onSubmit={handleSubmit}
        submitLabel="Save"
        isSubmitting={patchMutation.isPending}
        isFormValid={isFormValid}
        error={error}
        cancelTo="/admin/wine-styles"
      />
    </>
  );
}
