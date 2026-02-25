import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Trash2, Map, MapPin } from "lucide-react";
import { Button } from "../ui/Button";
import { adminApi, api } from "../../api/client";
import { queryKeys } from "../../api/queryKeys";
import { useAuth } from "../../contexts/AuthContext";
import type { Region, RegionCreate, CountryMapConfigUpsert } from "@wine-app/shared";

const REGION_LEVEL_ORDER = [
  "country",
  "region",
  "sub_region",
  "appellation",
  "vineyard",
] as const;

type RegionLevel = (typeof REGION_LEVEL_ORDER)[number];

function getChildren(regions: Region[], parentId: string | null): Region[] {
  return regions
    .filter((r) => (r.parentId ?? null) === parentId)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function getAncestors(regions: Region[], id: string): Region[] {
  const ancestors: Region[] = [];
  let currentId: string | null = id;
  while (currentId) {
    const r = regions.find((x) => x.id === currentId);
    if (!r) break;
    ancestors.unshift(r);
    currentId = r.parentId ?? null;
  }
  return ancestors;
}

function getCountryAncestor(regions: Region[], region: Region): Region | null {
  let currentId: string | null = region.parentId ?? null;
  while (currentId) {
    const r = regions.find((x) => x.id === currentId);
    if (!r) break;
    if (r.regionLevel === "country") return r;
    currentId = r.parentId ?? null;
  }
  // If this region itself is at country level
  if (region.regionLevel === "country") return region;
  return null;
}

function matchesSearch(region: Region, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    region.displayName.toLowerCase().includes(q) ||
    region.id.toLowerCase().includes(q)
  );
}

function regionMatchesOrHasMatchingDescendant(
  regions: Region[],
  regionId: string,
  query: string
): boolean {
  const r = regions.find((x) => x.id === regionId);
  if (!r) return false;
  if (matchesSearch(r, query)) return true;
  const children = getChildren(regions, regionId);
  return children.some((c) => regionMatchesOrHasMatchingDescendant(regions, c.id, query));
}

interface TreeNodeProps {
  region: Region;
  allRegions: Region[];
  searchQuery: string;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  depth: number;
  countriesWithMapConfig: Set<string>;
  mappableCountryIds: Set<string>;
  regionsWithBoundaryMappings: Set<string>;
}

function TreeNode({
  region,
  allRegions,
  searchQuery,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
  depth,
  countriesWithMapConfig,
  mappableCountryIds,
  regionsWithBoundaryMappings,
}: TreeNodeProps) {
  const children = getChildren(allRegions, region.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(region.id);
  const isSelected = selectedId === region.id;

  const visibleChildren = searchQuery
    ? children.filter((c) =>
        regionMatchesOrHasMatchingDescendant(allRegions, c.id, searchQuery)
      )
    : children;

  if (
    searchQuery &&
    !regionMatchesOrHasMatchingDescendant(allRegions, region.id, searchQuery)
  ) {
    return null;
  }

  const shouldShowExpanded = isExpanded || (searchQuery.length > 0 && visibleChildren.length > 0);

  // Amber dot logic
  let showAmberDot = false;
  if (region.regionLevel === "country") {
    showAmberDot = !countriesWithMapConfig.has(region.id);
  } else {
    const countryAncestor = getCountryAncestor(allRegions, region);
    if (countryAncestor && mappableCountryIds.has(countryAncestor.id)) {
      showAmberDot = !regionsWithBoundaryMappings.has(region.id);
    }
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-md px-2 py-1 cursor-pointer select-none text-sm transition-colors ${
          isSelected
            ? "bg-wine-deep/15 text-foreground font-medium"
            : "hover:bg-muted/60 text-foreground/80"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(region.id)}
      >
        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(region.id);
          }}
          tabIndex={-1}
        >
          {hasChildren ? (
            shouldShowExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          ) : null}
        </button>
        {isExpanded || shouldShowExpanded ? (
          <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className="truncate flex-1">{region.displayName}</span>
        {showAmberDot && (
          <span
            className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
            title="Geo configuration incomplete"
          />
        )}
        {hasChildren && (
          <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">
            ({children.length})
          </span>
        )}
      </div>
      {shouldShowExpanded && visibleChildren.length > 0 && (
        <div>
          {visibleChildren.map((child) => (
            <TreeNode
              key={child.id}
              region={child}
              allRegions={allRegions}
              searchQuery={searchQuery}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              depth={depth + 1}
              countriesWithMapConfig={countriesWithMapConfig}
              mappableCountryIds={mappableCountryIds}
              regionsWithBoundaryMappings={regionsWithBoundaryMappings}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MapConfigSection ────────────────────────────────────────────────────────

interface MapConfigSectionProps {
  region: Region;
  accessToken: string;
}

function MapConfigSection({ region, accessToken }: MapConfigSectionProps) {
  const queryClient = useQueryClient();

  const { data: mapConfigData } = useQuery({
    queryKey: queryKeys.regionsMapConfig,
    queryFn: () => api.getRegionsMapConfig(),
  });

  const existingConfig = mapConfigData?.countries.find((c) => c.regionId === region.id) ?? null;

  const [cfgIsoNumeric, setCfgIsoNumeric] = useState("");
  const [cfgNaturalEarthAdminName, setCfgNaturalEarthAdminName] = useState("");
  const [cfgGeoSlug, setCfgGeoSlug] = useState("");
  const [cfgZoomCenterLon, setCfgZoomCenterLon] = useState("");
  const [cfgZoomCenterLat, setCfgZoomCenterLat] = useState("");
  const [cfgZoomLevel, setCfgZoomLevel] = useState("");
  const [cfgIsMappable, setCfgIsMappable] = useState(false);
  const [cfgSaveStatus, setCfgSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [cfgSaveError, setCfgSaveError] = useState("");
  const [cfgSuggestError, setCfgSuggestError] = useState("");
  const [cfgSuggesting, setCfgSuggesting] = useState(false);

  // Reset form when region changes or config data loads
  useEffect(() => {
    if (existingConfig) {
      setCfgIsoNumeric(String(existingConfig.isoNumeric));
      setCfgNaturalEarthAdminName(existingConfig.naturalEarthAdminName);
      setCfgGeoSlug(existingConfig.geoSlug);
      setCfgZoomCenterLon(String(existingConfig.zoomCenterLon));
      setCfgZoomCenterLat(String(existingConfig.zoomCenterLat));
      setCfgZoomLevel(String(existingConfig.zoomLevel));
      setCfgIsMappable(existingConfig.isMappable ?? false);
    } else {
      setCfgIsoNumeric("");
      setCfgNaturalEarthAdminName("");
      setCfgGeoSlug("");
      setCfgZoomCenterLon("");
      setCfgZoomCenterLat("");
      setCfgZoomLevel("");
      setCfgIsMappable(false);
    }
    setCfgSaveStatus("idle");
    setCfgSaveError("");
    setCfgSuggestError("");
  }, [region.id, existingConfig?.geoSlug]);

  const upsertMutation = useMutation({
    mutationFn: (body: CountryMapConfigUpsert) =>
      adminApi.upsertMapConfig(accessToken, region.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regionsMapConfig });
      setCfgSaveStatus("saved");
      setCfgSaveError("");
      setTimeout(() => setCfgSaveStatus("idle"), 2000);
    },
    onError: (err) => {
      setCfgSaveStatus("error");
      setCfgSaveError(err instanceof Error ? err.message : "Save failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteMapConfig(accessToken, region.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regionsMapConfig });
      setCfgSaveStatus("idle");
    },
    onError: (err) => {
      setCfgSaveStatus("error");
      setCfgSaveError(err instanceof Error ? err.message : "Delete failed");
    },
  });

  const handleSuggest = async () => {
    if (!cfgNaturalEarthAdminName.trim()) return;
    setCfgSuggestError("");
    setCfgSuggesting(true);
    try {
      const result = await api.getGeoSuggestions(cfgNaturalEarthAdminName.trim());
      if (result.suggestions) {
        setCfgZoomCenterLon(String(result.suggestions.centerLon));
        setCfgZoomCenterLat(String(result.suggestions.centerLat));
        setCfgZoomLevel(String(result.suggestions.suggestedZoom));
        if (result.suggestions.isoNumeric != null) {
          setCfgIsoNumeric(String(result.suggestions.isoNumeric));
        }
        if (cfgGeoSlug === "") {
          setCfgGeoSlug(result.suggestions.geoSlug);
        }
      } else {
        setCfgSuggestError("No features found for this admin name.");
      }
    } catch {
      setCfgSuggestError("Failed to fetch suggestions.");
    } finally {
      setCfgSuggesting(false);
    }
  };

  const isRequiredFilled =
    cfgIsoNumeric.trim() !== "" &&
    cfgNaturalEarthAdminName.trim() !== "" &&
    cfgGeoSlug.trim() !== "" &&
    cfgZoomCenterLon.trim() !== "" &&
    cfgZoomCenterLat.trim() !== "" &&
    cfgZoomLevel.trim() !== "";

  const handleSave = () => {
    if (!isRequiredFilled) return;
    setCfgSaveStatus("saving");
    upsertMutation.mutate({
      isoNumeric: parseInt(cfgIsoNumeric, 10),
      naturalEarthAdminName: cfgNaturalEarthAdminName.trim(),
      geoSlug: cfgGeoSlug.trim(),
      zoomCenterLon: parseFloat(cfgZoomCenterLon),
      zoomCenterLat: parseFloat(cfgZoomCenterLat),
      zoomLevel: parseFloat(cfgZoomLevel),
      isMappable: cfgIsMappable,
    });
  };

  return (
    <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Map className="w-4 h-4" />
          Map Configuration
        </h4>
        {existingConfig && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </Button>
        )}
      </div>

      {/* Warning banners */}
      {!existingConfig && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          This country is not visible on the explore map. Fill in the fields below to configure it.
        </div>
      )}
      {existingConfig && !existingConfig.isMappable && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          This country is in draft mode and not yet visible on the map.
        </div>
      )}

      {/* Natural Earth Admin Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Natural Earth Admin Name *
        </label>
        <input
          type="text"
          value={cfgNaturalEarthAdminName}
          onChange={(e) => setCfgNaturalEarthAdminName(e.target.value)}
          placeholder="e.g. New Zealand"
          className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm focus:ring-2 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Must match the <code>admin</code> property in the Natural Earth dataset exactly.
        </p>
      </div>

      {/* Suggest defaults button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!cfgNaturalEarthAdminName.trim() || cfgSuggesting}
          onClick={handleSuggest}
        >
          {cfgSuggesting ? "Fetching…" : "Auto-suggest center & zoom"}
        </Button>
        {cfgSuggestError && (
          <p className="text-xs text-destructive">{cfgSuggestError}</p>
        )}
      </div>

      {/* 2-column grid fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">ISO Numeric *</label>
          <input
            type="number"
            value={cfgIsoNumeric}
            onChange={(e) => setCfgIsoNumeric(e.target.value)}
            placeholder="e.g. 554"
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Geo Slug *</label>
          <input
            type="text"
            value={cfgGeoSlug}
            onChange={(e) => setCfgGeoSlug(e.target.value)}
            placeholder="e.g. new_zealand"
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm font-mono focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Center Longitude *</label>
          <input
            type="number"
            step="0.01"
            value={cfgZoomCenterLon}
            onChange={(e) => setCfgZoomCenterLon(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Center Latitude *</label>
          <input
            type="number"
            step="0.01"
            value={cfgZoomCenterLat}
            onChange={(e) => setCfgZoomCenterLat(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Zoom Level *</label>
          <input
            type="number"
            step="0.5"
            min="1"
            max="8"
            value={cfgZoomLevel}
            onChange={(e) => setCfgZoomLevel(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* isMappable checkbox */}
      <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
        <input
          type="checkbox"
          checked={cfgIsMappable}
          onChange={(e) => setCfgIsMappable(e.target.checked)}
          className="rounded border-input"
        />
        Visible on explore map
      </label>

      {/* Save button + status */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="hero"
          size="sm"
          disabled={!isRequiredFilled || upsertMutation.isPending}
          onClick={handleSave}
        >
          {upsertMutation.isPending ? "Saving…" : "Save map config"}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        {cfgSaveStatus === "saving" && <span>Saving…</span>}
        {cfgSaveStatus === "saved" && <span className="text-green-600 dark:text-green-400">Map config saved</span>}
        {cfgSaveStatus === "error" && (
          <span className="text-destructive">Save failed: {cfgSaveError}</span>
        )}
      </div>
    </div>
  );
}

// ─── BoundaryMappingsSection ─────────────────────────────────────────────────

interface BoundaryMappingsSectionProps {
  region: Region;
  allRegions: Region[];
  accessToken: string;
}

function BoundaryMappingsSection({ region, allRegions, accessToken }: BoundaryMappingsSectionProps) {
  const queryClient = useQueryClient();

  const { data: mapConfigData } = useQuery({
    queryKey: queryKeys.regionsMapConfig,
    queryFn: () => api.getRegionsMapConfig(),
  });

  // Find the country-level ancestor
  const countryAncestor = getCountryAncestor(allRegions, region);
  const parentConfig = countryAncestor
    ? mapConfigData?.countries.find((c) => c.regionId === countryAncestor.id)
    : null;

  const parentGeoSlug = parentConfig?.geoSlug ?? null;

  const { data: geoFeaturesData, isLoading: geoFeaturesLoading } = useQuery({
    queryKey: queryKeys.geoFeatures(parentGeoSlug ?? ""),
    queryFn: () => api.getGeoFeatures(parentGeoSlug!),
    enabled: parentGeoSlug != null,
  });

  const { data: boundaryData } = useQuery({
    queryKey: queryKeys.boundaryMappings(region.id),
    queryFn: () => api.getBoundaryMappings(region.id),
  });

  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState("");
  const [bndSaveStatus, setBndSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [bndSaveError, setBndSaveError] = useState("");

  // Init selectedFeatures from saved mappings
  useEffect(() => {
    if (boundaryData) {
      setSelectedFeatures(new Set(boundaryData.featureNames));
    } else {
      setSelectedFeatures(new Set());
    }
    setBndSaveStatus("idle");
    setBndSaveError("");
    setSearchFilter("");
  }, [region.id, boundaryData]);

  const upsertMutation = useMutation({
    mutationFn: (featureNames: string[]) =>
      adminApi.upsertBoundaryMappings(accessToken, region.id, { featureNames }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boundaryMappings(region.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.regionsMapConfig });
      setBndSaveStatus("saved");
      setBndSaveError("");
      setTimeout(() => setBndSaveStatus("idle"), 2000);
    },
    onError: (err) => {
      setBndSaveStatus("error");
      setBndSaveError(err instanceof Error ? err.message : "Save failed");
    },
  });

  // Skip rendering if we can't determine parent country config
  if (!parentGeoSlug) return null;

  const allFeatureNames = geoFeaturesData?.featureNames ?? [];
  const filteredFeatures = searchFilter
    ? allFeatureNames.filter((name) =>
        name.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : allFeatureNames;

  const toggleFeature = (name: string) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Boundary Mappings
      </h4>

      {selectedFeatures.size === 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          No map boundaries configured. This sub-region won't highlight on the country map.
        </div>
      )}

      <input
        type="text"
        placeholder="Filter features…"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        className="max-w-xs w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm focus:ring-2 focus:ring-accent"
      />

      <div className="max-h-48 overflow-y-auto rounded-md border border-input bg-card">
        {geoFeaturesLoading && (
          <p className="text-xs text-muted-foreground p-2">Loading features…</p>
        )}
        {!geoFeaturesLoading && filteredFeatures.length === 0 && (
          <p className="text-xs text-muted-foreground p-2">No features found.</p>
        )}
        {filteredFeatures.map((name) => (
          <label
            key={name}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              checked={selectedFeatures.has(name)}
              onChange={() => toggleFeature(name)}
              className="rounded border-input"
            />
            {name}
          </label>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{selectedFeatures.size} features selected</p>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="hero"
          size="sm"
          disabled={upsertMutation.isPending}
          onClick={() => {
            setBndSaveStatus("saving");
            upsertMutation.mutate([...selectedFeatures]);
          }}
        >
          {upsertMutation.isPending ? "Saving…" : "Save mappings"}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        {bndSaveStatus === "saving" && <span>Saving…</span>}
        {bndSaveStatus === "saved" && <span className="text-green-600 dark:text-green-400">Mappings saved</span>}
        {bndSaveStatus === "error" && (
          <span className="text-destructive">Save failed: {bndSaveError}</span>
        )}
      </div>
    </div>
  );
}

// ─── nextLevel helper ─────────────────────────────────────────────────────────

function nextLevel(current: RegionLevel): RegionLevel {
  const idx = REGION_LEVEL_ORDER.indexOf(current);
  return REGION_LEVEL_ORDER[Math.min(idx + 1, REGION_LEVEL_ORDER.length - 1)];
}

// ─── RegionDetailPanel ────────────────────────────────────────────────────────

interface RegionDetailPanelProps {
  region: Region | null;
  allRegions: Region[];
  accessToken: string;
  onCreated: (newRegion: Region, parentId: string | null) => void;
  onDeleted: (id: string) => void;
  onUpdated: (updated: Region) => void;
}

function RegionDetailPanel({
  region,
  allRegions,
  accessToken,
  onCreated,
  onDeleted,
  onUpdated,
}: RegionDetailPanelProps) {
  const queryClient = useQueryClient();

  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState<RegionLevel>("region");
  const [editNotes, setEditNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildId, setNewChildId] = useState("");
  const [newChildLevel, setNewChildLevel] = useState<RegionLevel>("region");
  const [createError, setCreateError] = useState("");

  const [deleteError, setDeleteError] = useState("");

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!region) return;
    setEditName(region.displayName);
    setEditLevel(region.regionLevel as RegionLevel);
    setEditNotes(region.notes ?? "");
    setSaveStatus("idle");
    setSaveError("");
    setShowAddChild(false);
    setNewChildName("");
    setNewChildId("");
    setDeleteError("");
  }, [region?.id]);

  const updateMutation = useMutation({
    mutationFn: (body: Partial<Omit<RegionCreate, "id">>) =>
      adminApi.updateRegion(accessToken, region!.id, body),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regions });
      setSaveStatus("saved");
      setSaveError("");
      onUpdated(updated);
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: (err) => {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    },
  });

  const createChildMutation = useMutation({
    mutationFn: (body: RegionCreate) => adminApi.createRegion(accessToken, body),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regions });
      setShowAddChild(false);
      setNewChildName("");
      setNewChildId("");
      setCreateError("");
      onCreated(created, region?.id ?? null);
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : "Create failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteRegion(accessToken, region!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regions });
      onDeleted(region!.id);
    },
    onError: (err) => {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    },
  });

  const scheduleAutoSave = useCallback(
    (name: string, level: RegionLevel, notes: string) => {
      if (!region) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(() => {
        updateMutation.mutate({ displayName: name, regionLevel: level, notes: notes || undefined });
      }, 600);
    },
    [region, updateMutation]
  );

  if (!region) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
        Select a region from the tree to view and edit it, or use "Add Child" on a selected region.
      </div>
    );
  }

  const ancestors = getAncestors(allRegions, region.id);
  const children = getChildren(allRegions, region.id);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center flex-wrap gap-1 text-xs text-muted-foreground">
        <span>Root</span>
        {ancestors.map((a) => (
          <span key={a.id} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <span className={a.id === region.id ? "text-foreground font-medium" : ""}>{a.displayName}</span>
          </span>
        ))}
      </div>

      {/* Level badge */}
      <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {region.regionLevel.replace(/_/g, " ")}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowAddChild((v) => !v);
            if (!showAddChild) {
              const childLevel = nextLevel(region.regionLevel as RegionLevel);
              setNewChildLevel(childLevel);
              setNewChildName("");
              setNewChildId("");
              setCreateError("");
            }
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Child
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={children.length > 0 || deleteMutation.isPending}
          onClick={() => {
            setDeleteError("");
            deleteMutation.mutate();
          }}
          title={children.length > 0 ? "Cannot delete: has child regions" : undefined}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </div>

      {deleteError && (
        <p className="text-sm text-destructive">{deleteError}</p>
      )}

      {/* Add child form */}
      {showAddChild && (
        <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
          <h4 className="text-sm font-medium text-foreground">New child region</h4>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Name *</label>
            <input
              type="text"
              value={newChildName}
              onChange={(e) => {
                setNewChildName(e.target.value);
                const slug = e.target.value
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, "_")
                  .replace(/[^a-z0-9_]/g, "");
                setNewChildId(slug);
              }}
              placeholder="e.g. Marlborough"
              className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">ID (slug) *</label>
            <input
              type="text"
              value={newChildId}
              onChange={(e) => setNewChildId(e.target.value)}
              placeholder="e.g. marlborough"
              className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm font-mono focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Level</label>
            <select
              value={newChildLevel}
              onChange={(e) => setNewChildLevel(e.target.value as RegionLevel)}
              className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground text-sm"
            >
              {REGION_LEVEL_ORDER.map((l) => (
                <option key={l} value={l}>
                  {l.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="hero"
              size="sm"
              disabled={
                !newChildName.trim() ||
                !newChildId.trim() ||
                !/^[a-z0-9_]+$/.test(newChildId) ||
                createChildMutation.isPending
              }
              onClick={() => {
                createChildMutation.mutate({
                  id: newChildId.trim(),
                  displayName: newChildName.trim(),
                  regionLevel: newChildLevel,
                  parentId: region.id,
                });
              }}
            >
              {createChildMutation.isPending ? "Creating…" : "Create"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddChild(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Editable fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Name *
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              scheduleAutoSave(e.target.value, editLevel, editNotes);
            }}
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Level *
          </label>
          <select
            value={editLevel}
            onChange={(e) => {
              const v = e.target.value as RegionLevel;
              setEditLevel(v);
              scheduleAutoSave(editName, v, editNotes);
            }}
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground focus:ring-2 focus:ring-accent"
          >
            {REGION_LEVEL_ORDER.map((l) => (
              <option key={l} value={l}>
                {l.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Notes
          </label>
          <textarea
            value={editNotes}
            onChange={(e) => {
              setEditNotes(e.target.value);
              scheduleAutoSave(editName, editLevel, e.target.value);
            }}
            rows={3}
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Auto-save status */}
      <div className="text-xs text-muted-foreground">
        {saveStatus === "saving" && <span>Saving…</span>}
        {saveStatus === "saved" && <span className="text-green-600 dark:text-green-400">Changes saved</span>}
        {saveStatus === "error" && (
          <span className="text-destructive">Save failed: {saveError}</span>
        )}
        {saveStatus === "idle" && <span>Changes are saved automatically</span>}
      </div>

      {/* Map config section (country-level only) */}
      {region.regionLevel === "country" && (
        <MapConfigSection region={region} accessToken={accessToken} />
      )}

      {/* Boundary mappings section (sub-regions) */}
      {region.regionLevel !== "country" && (
        <BoundaryMappingsSection
          region={region}
          allRegions={allRegions}
          accessToken={accessToken}
        />
      )}

      {/* Read-only metadata */}
      <div className="pt-2 border-t border-border text-xs text-muted-foreground space-y-0.5 font-mono">
        <div>ID: {region.id}</div>
        <div>Children: {children.length}</div>
      </div>
    </div>
  );
}

// ─── RegionEditorModal ────────────────────────────────────────────────────────

export interface RegionEditorModalProps {
  initialRegionId?: string | null;
  onClose: (selectedRegionId: string | null) => void;
}

export function RegionEditorModal({ initialRegionId, onClose }: RegionEditorModalProps) {
  const { state } = useAuth();
  const accessToken = state.accessToken ?? "";

  const { data: regionsData = [] } = useQuery({
    queryKey: queryKeys.regions,
    queryFn: () => api.getRegions(),
  });

  const { data: mapConfigData } = useQuery({
    queryKey: queryKeys.regionsMapConfig,
    queryFn: () => api.getRegionsMapConfig(),
  });

  // Derive completeness sets for tree indicators
  const countriesWithMapConfig = new Set(
    mapConfigData?.countries.map((c) => c.regionId) ?? []
  );
  const mappableCountryIds = new Set(
    mapConfigData?.countries.filter((c) => c.isMappable).map((c) => c.regionId) ?? []
  );
  const regionsWithBoundaryMappings = new Set(
    Object.entries(mapConfigData?.boundaryMappings ?? {})
      .filter(([, names]) => names.length > 0)
      .map(([id]) => id)
  );

  const [regions, setRegions] = useState<Region[]>([]);
  useEffect(() => {
    setRegions(regionsData);
  }, [regionsData]);

  const [selectedId, setSelectedId] = useState<string | null>(initialRegionId ?? null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const selectedRegion = regions.find((r) => r.id === selectedId) ?? null;

  const rootRegions = getChildren(regions, null);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(regions.map((r) => r.id)));
  }, [regions]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleCreated = useCallback((newRegion: Region, parentId: string | null) => {
    setRegions((prev) => [...prev, newRegion]);
    setSelectedId(newRegion.id);
    if (parentId) {
      setExpandedIds((prev) => new Set([...prev, parentId]));
    }
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id));
    setSelectedId(null);
  }, []);

  const handleUpdated = useCallback((updated: Region) => {
    setRegions((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  const handleClose = useCallback(() => {
    onClose(selectedId);
  }, [onClose, selectedId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative bg-card rounded-2xl shadow-xl border border-border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Geographic Administration</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {regions.length} location{regions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: two-column layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left panel: tree */}
          <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <input
                type="text"
                placeholder="Search locations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-muted border border-input text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:outline-none"
              />
            </div>
            {/* Expand/Collapse */}
            <div className="flex gap-2 px-3 py-2 border-b border-border">
              <button
                type="button"
                onClick={collapseAll}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3" /> Collapse All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={expandAll}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ChevronDown className="w-3 h-3" /> Expand All
              </button>
            </div>
            {/* Tree */}
            <div className="flex-1 overflow-y-auto py-2 px-1">
              {rootRegions.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-2">No regions yet.</p>
              )}
              {rootRegions.map((r) => (
                <TreeNode
                  key={r.id}
                  region={r}
                  allRegions={regions}
                  searchQuery={searchQuery}
                  selectedId={selectedId}
                  expandedIds={expandedIds}
                  onSelect={setSelectedId}
                  onToggleExpand={handleToggleExpand}
                  depth={0}
                  countriesWithMapConfig={countriesWithMapConfig}
                  mappableCountryIds={mappableCountryIds}
                  regionsWithBoundaryMappings={regionsWithBoundaryMappings}
                />
              ))}
            </div>
            {/* Add top-level region */}
            <div className="p-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedId(null);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add top-level region
              </Button>
            </div>
          </div>

          {/* Right panel: detail */}
          {selectedId ? (
            <RegionDetailPanel
              region={selectedRegion}
              allRegions={regions}
              accessToken={accessToken}
              onCreated={handleCreated}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ) : (
            <NewRootRegionPanel
              allRegions={regions}
              accessToken={accessToken}
              onCreated={(r) => {
                handleCreated(r, null);
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-between items-center flex-shrink-0 bg-muted/20">
          <span className="text-xs text-muted-foreground">
            {selectedRegion
              ? `Selected: ${selectedRegion.displayName}`
              : "No region selected"}
          </span>
          <Button type="button" variant="hero" size="sm" onClick={handleClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── NewRootRegionPanel ───────────────────────────────────────────────────────

interface NewRootRegionPanelProps {
  allRegions: Region[];
  accessToken: string;
  onCreated: (r: Region) => void;
}

function NewRootRegionPanel({ allRegions: _allRegions, accessToken, onCreated }: NewRootRegionPanelProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [level, setLevel] = useState<RegionLevel>("country");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: (body: RegionCreate) => adminApi.createRegion(accessToken, body),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regions });
      onCreated(created);
      setName("");
      setId("");
      setError("");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Create failed");
    },
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h3 className="font-serif text-base font-semibold text-foreground mb-4">New top-level region</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              const slug = e.target.value
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-z0-9_]/g, "");
              setId(slug);
            }}
            placeholder="e.g. France"
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">ID (slug) *</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. france"
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground font-mono focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as RegionLevel)}
            className="w-full px-3 py-2 rounded-md bg-card border border-input text-foreground"
          >
            {REGION_LEVEL_ORDER.map((l) => (
              <option key={l} value={l}>
                {l.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="button"
          variant="hero"
          disabled={
            !name.trim() ||
            !id.trim() ||
            !/^[a-z0-9_]+$/.test(id) ||
            createMutation.isPending
          }
          onClick={() => {
            createMutation.mutate({ id: id.trim(), displayName: name.trim(), regionLevel: level, parentId: null });
          }}
        >
          {createMutation.isPending ? "Creating…" : "Create region"}
        </Button>
      </div>
    </div>
  );
}
