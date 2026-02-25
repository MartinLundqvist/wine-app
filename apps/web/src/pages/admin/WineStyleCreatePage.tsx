import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { wineStyleIdSchema } from "@wine-app/shared";
import type { WineStyleCreate } from "@wine-app/shared";

const CLIMATE_SCALE_ID = "climate_5";

const STYLE_TYPES = [
  "global_archetype",
  "regional_archetype",
  "appellation_archetype",
  "specific_bottle",
] as const;
const PRODUCED_COLORS = ["red", "white", "rose"] as const;
const WINE_CATEGORIES = ["still", "sparkling", "fortified"] as const;

export function WineStyleCreatePage() {
  useDocumentTitle("Admin – New Wine Style");
  const { state } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const accessToken = state.accessToken ?? "";

  const [id, setId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [styleType, setStyleType] = useState<(typeof STYLE_TYPES)[number]>("regional_archetype");
  const [producedColor, setProducedColor] = useState<(typeof PRODUCED_COLORS)[number]>("red");
  const [wineCategory, setWineCategory] = useState<(typeof WINE_CATEGORIES)[number]>("still");
  const [regionId, setRegionId] = useState("");
  const [climateMin, setClimateMin] = useState("");
  const [climateMax, setClimateMax] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<{ id?: boolean; displayName?: boolean }>({});
  const [grapes, setGrapes] = useState<{ grapeVarietyId: string; percentage?: number | null }[]>([]);
  const [structure, setStructure] = useState<{ structureDimensionId: string; minValue: number; maxValue: number }[]>([]);
  const [appearance, setAppearance] = useState<{ appearanceDimensionId: string; minValue: number; maxValue: number }[]>([]);
  const [aromaClusters, setAromaClusters] = useState<{ aromaClusterId: string; intensityMin: number; intensityMax: number }[]>([]);
  const [aromaDescriptors, setAromaDescriptors] = useState<{ aromaDescriptorId: string; salience: "dominant" | "supporting" | "occasional" }[]>([]);

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

  // Pre-populate structure with all dimensions (required)
  useEffect(() => {
    if (structureDims?.length && structure.length === 0) {
      setStructure(
        structureDims.map((d) => {
          const scaleLen = d.ordinalScale?.labels?.length ?? 5;
          return {
            structureDimensionId: d.id,
            minValue: 1,
            maxValue: scaleLen,
          };
        })
      );
    }
  }, [structureDims, structure.length]);

  // Pre-populate appearance with dimensions applicable to current producedColor (required)
  useEffect(() => {
    if (!appearanceDims?.length) return;
    const applicable = appearanceDims.filter(
      (d) => d.producedColor == null || d.producedColor === producedColor
    );
    setAppearance(
      applicable.map((d) => {
        const scaleLen = d.ordinalScale?.labels?.length ?? 5;
        return { appearanceDimensionId: d.id, minValue: 1, maxValue: scaleLen };
      })
    );
  }, [appearanceDims, producedColor]);

  // Live validation: compute field errors from current state
  const validationErrors = ((): WineStyleFormValidationErrors => {
    const errs: WineStyleFormValidationErrors = {};
    const rawId = id.trim().toLowerCase().replace(/\s+/g, "_");
    if (touched.id && rawId) {
      const parsed = wineStyleIdSchema.safeParse(rawId);
      if (!parsed.success) {
        errs.id = parsed.error.errors.map((e) => e.message).join(" ") || "Invalid ID format";
      }
    }
    if (touched.displayName) {
      if (!displayName.trim()) errs.displayName = "Display name is required";
    }
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
      errs.grapes = grapeTotal > 100 ? "Grape percentages must not exceed 100%." : "Grape percentages should total 100%.";
    }
    return errs;
  })();

  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const rawId = id.trim().toLowerCase().replace(/\s+/g, "_");
  const idValid = !rawId || wineStyleIdSchema.safeParse(rawId).success;
  const grapeTotal = grapes.reduce((s, g) => s + (g.percentage != null ? g.percentage : 0), 0);
  const hasGrapePct = grapes.some((g) => g.percentage != null && g.percentage > 0);
  const grapesValid = !hasGrapePct || grapeTotal === 100;
  const isFormValid =
    !hasValidationErrors &&
    grapesValid &&
    id.trim().length > 0 &&
    idValid &&
    displayName.trim().length > 0 &&
    structure.length > 0 &&
    !structure.some((s) => s.minValue > s.maxValue) &&
    appearance.length > 0 &&
    !appearance.some((a) => a.minValue > a.maxValue);

  const createMutation = useMutation({
    mutationFn: (body: WineStyleCreate) => adminApi.createWineStyle(accessToken, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wineStyles });
      navigate("/admin/wine-styles");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Create failed");
    },
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload: WineStyleCreate = {
      id: id.trim().toLowerCase().replace(/\s+/g, "_"),
      displayName: displayName.trim(),
      styleType,
      producedColor,
      wineCategory,
      regionId: regionId || undefined,
      climateMin: climateMin === "" ? undefined : Number(climateMin),
      climateMax: climateMax === "" ? undefined : Number(climateMax),
      climateOrdinalScaleId:
        climateMin !== "" || climateMax !== "" ? CLIMATE_SCALE_ID : undefined,
      notes: notes.trim() || undefined,
      grapes: grapes.length ? grapes.map((g) => ({ grapeVarietyId: g.grapeVarietyId, percentage: g.percentage ?? undefined })) : undefined,
      structure: structure.length ? structure : undefined,
      appearance: appearance.length ? appearance : undefined,
      aromaClusters: aromaClusters.length ? aromaClusters : undefined,
      aromaDescriptors: aromaDescriptors.length ? aromaDescriptors : undefined,
    };
    if (!payload.id.match(/^[a-z0-9_]+$/)) {
      setError("ID must be lowercase letters, numbers, and underscores only.");
      return;
    }
    try {
      await createMutation.mutateAsync(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  };

  const isLoading = regionsLoading || scalesLoading;
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const formData: WineStyleFormData = {
    id,
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
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">
          New wine style
        </h1>
      </div>
      <WineStyleForm
        data={formData}
        onFieldChange={(field, value) => {
          switch (field) {
            case "id":
              setId(value);
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
        onIdBlur={() => setTouched((t) => ({ ...t, id: true }))}
        onDisplayNameBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
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
        mode="create"
        onSubmit={handleSubmit}
        submitLabel="Create"
        isSubmitting={createMutation.isPending}
        isFormValid={isFormValid}
        error={error}
        cancelTo="/admin/wine-styles"
      />
    </>
  );
}
