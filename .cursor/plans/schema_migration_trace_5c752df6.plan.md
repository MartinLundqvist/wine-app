---
name: Schema migration trace
overview: Comprehensive trace of the DB schema and contract breaking changes through every web application route and API endpoint, identifying what was already migrated and what remains.
todos:
  - id: migrate-aroma-explorer
    content: "Migrate aroma explorer from legacy /aroma-terms to new /aroma-taxonomy endpoint: add client method, query key, rewrite AromaFlowTree and ExploreAromasPage"
    status: pending
  - id: update-aroma-count
    content: Update ExploreLandingPage aroma count to use new taxonomy endpoint instead of inflated flat count
    status: pending
  - id: cleanup-legacy
    content: "Remove dead code: thermalBands query key, description from structureDimensionSchema, and deprecated type aliases"
    status: pending
  - id: rename-files
    content: Rename StyleTargetDetailPage.tsx to WineStyleDetailPage.tsx, update App.tsx import
    status: pending
  - id: remove-legacy-endpoint
    content: Remove /aroma-terms legacy API endpoint and getAromaTerms() client method after aroma explorer migration
    status: pending
  - id: update-readme
    content: Update geo README to reference new region schema fields (regionLevel, parentId)
    status: pending
isProject: false
---

# Schema Migration: Web Route and API Trace

## Summary of Breaking Changes (commit `a9020b0`)

The commit restructured the entire wine knowledge engine from a v1 "style target + context" model to a v2 "wine style + ordinal scales" model:

**Key renames:**

- `styleTarget` -> `wineStyle` (DB table and all types)
- `styleKind` -> `styleType` (with new enum values: `global_archetype`, `regional_archetype`, `appellation_archetype`, `specific_bottle`)
- `grape` -> `grapeVariety` (DB table)
- `styleTargetGrape` -> `wineStyleGrape` (with `grapeId` -> `grapeVarietyId`, removed `role`)
- `styleTargetStructure` -> `wineStyleStructure` (removed `categoricalValue`, `confidence`; `minValue`/`maxValue` now NOT NULL)
- `prominence` -> `salience` (on aroma descriptors)

**Key structural changes:**

- `region.country` + `region.parentRegionId` -> `region.regionLevel` (enum) + `region.parentId`
- `structureDimension` lost `domain`, `scaleType`, `scaleMin`, `scaleMax`, `scaleLabels` -> now references new `ordinalScale` table via `ordinalScaleId`
- `aromaTerm` (single self-referencing table) -> split into 3 tables: `aromaSource`, `aromaCluster`, `aromaDescriptor`
- `styleTargetAromaProfile` -> split into `wineStyleAromaCluster` (intensity range) + `wineStyleAromaDescriptor` (salience)
- `styleTargetContext` + `thermalBand` -> **removed entirely** (climate is now inline on `wineStyle` as `climateMin`/`climateMax`/`climateOrdinalScaleId`)
- Removed fields: `ladderTier`, `confidence`, `status`, `authoringBasis`, `notesInternal`

---

## Current State: TypeScript Compiles Cleanly

Both `apps/api` and `apps/web` pass `tsc --noEmit` with zero errors. The commit updated types and field accesses across all layers simultaneously.

---

## Route-by-Route Trace

### 1. `/explore` - ExploreLandingPage

- **API calls:** `getGrapes()`, `getStyleTargets()`, `getRegions()`, `getAromaTerms()`
- **Status:** MOSTLY DONE - uses new types for grapes, styles, and regions
- **Remaining issue:** Still calls legacy `getAromaTerms()` for the aroma count (`aromaTerms?.length`). This returns flat terms (sources + clusters + descriptors combined = inflated count). Should use the new `/aroma-taxonomy` endpoint, but it is not yet exposed in the web API client.

### 2. `/explore/styles` - ExploreStylesPage

- **API calls:** `getStyleTargets()` -> `WineStyleFull[]`
- **Fields used:** `producedColor`, `styleType`, `structure` (via `getStructureSortValue`)
- **Status:** DONE - correctly uses `styleType` (new enum), `WineStyleFull`, and new structure accessors.

### 3. `/explore/styles/:id` - StyleTargetDetailPage

- **API calls:** `getStyleTarget(id)` -> `WineStyleFull`
- **Fields used:** `styleType`, `producedColor`, `wineCategory`, `climateMin`, `climateMax`, `climateOrdinalScale`, `region`, `grapes[].grape`, `structure[].dimension`, `aromaDescriptors[].cluster.aromaSourceId`, `aromaDescriptors[].descriptor`, `aromaDescriptors[].salience`, `notes`
- **Status:** DONE - fully migrated to new composite types. Uses `aromaDescriptors` (not old `aromas`), groups by `cluster?.aromaSourceId`, shows `salience`.
- **Cosmetic:** File is still named `StyleTargetDetailPage.tsx` (old name).

### 4. `/explore/grapes` - ExploreGrapesPage

- **API calls:** `getGrapes()` -> `GrapeWithWineStyleIds[]`
- **Fields used:** `color`, `sortOrder`, `notes`, `wineStyleIds`
- **Status:** DONE - uses `GrapeWithWineStyleIds` (new type replacing `GrapeWithStyleTargets`), `wineStyleIds` (new field replacing `styleTargetIds`).

### 5. `/explore/grapes/:id` - GrapeDetailPage

- **API calls:** `getGrapes()`, `getStyleTargets()`
- **Fields used:** `st.grapes?.some(g => g.grape.id === id)` to find linked styles
- **Status:** DONE - correctly references `g.grape.id` (the `grapes` array no longer has `role`).

### 6. `/explore/regions` - ExploreRegionsPage

- **API calls:** `getRegions()`, `getStyleTargets()`, `getRegionsMapConfig()`
- **Status:** DONE - delegates to `RegionMap` and `RegionDetailPanel`.

#### RegionMap component

- **Fields used:** `region.regionLevel`, `region.parentId`, `region.displayName`
- **Status:** DONE - correctly uses `regionLevel === "country"` and `parentId` (not old `country` / `parentRegionId`).

#### RegionDetailPanel component

- **Fields used:** `region.regionLevel`, `region.parentId`, `st.regionId`
- **Status:** DONE - correctly matches on `regionLevel === "country"` and `parentId === null` for root regions.

### 7. `/explore/aromas` - ExploreAromasPage

- **API calls:** `getAromaTerms()` -> `AromaTermFlat[]` (legacy endpoint)
- **Status:** NOT MIGRATED - still uses the legacy `/aroma-terms` endpoint that flattens the new 3-table aroma taxonomy into the old `{ id, displayName, parentId, source }` shape. The API serves this as a backwards-compatible shim (see [apps/api/src/routes/read.ts](apps/api/src/routes/read.ts) L158-201).
The new `/aroma-taxonomy` endpoint returns the proper hierarchical `AromaSourceWithClusters[]` format (source -> clusters -> descriptors), but:
  - The web API client (`client.ts`) does **not** expose `getAromaTaxonomy()`
  - `queryKeys.ts` does **not** have an `aromaTaxonomy` key
  - `AromaFlowTree` component is built entirely around the flat `AromaTermFlat` type
  This works at runtime but is a semantic mismatch with the new schema.

### 8. `/visualize/structure` - StructureRadarPage

- **API calls:** `getStyleTargets()`, `getStructureDimensions()`
- **Fields used:** `style.structure[].structureDimensionId`, `.minValue`, `.maxValue`, `style.notes`
- **Status:** DONE - `minValue`/`maxValue` are now NOT NULL in the schema (always present), and the code handles them correctly with `SCALE_MAX = 5`.

### 9. `/visualize/flavor-map` - FlavorMapPage

- **API calls:** `getStyleTargets()`, `getOrdinalScales()`
- **Fields used:** `style.producedColor`, `climateMin`, `climateOrdinalScale.labels`, `structure[].structureDimensionId` for body/intensity, `aromaDescriptors[].descriptor.displayName`
- **Status:** DONE - correctly uses new `climateOrdinalScale` and `ordinalScales` API for climate filter labels.

### 10. `/visualize/climate` - ClimateExplorerPage

- **API calls:** `getStyleTargets()`
- **Fields used:** `climateOrdinalScale.labels`, `climateMin`, structure dimensions for callout
- **Status:** DONE - uses new inline climate fields. `ClimateGradient` component correctly derives band from `climateOrdinalScale.labels[climateMin - 1]`.

### 11. `/visualize/confusion` - ConfusionZonePage

- **API calls:** `getStyleTargets()`, `getStructureDimensions()`, `getConfusionGroup()`
- **Fields used:** `structure`, `ConfusionDistractor`, `ConfusionDifficulty`
- **Status:** DONE - confusion service ([apps/api/src/services/confusion.ts](apps/api/src/services/confusion.ts)) fully rewritten for new types. Uses `aromaDescriptors[].salience` (not old `prominence`), `cluster.aromaSourceId` for primary filtering.

### 12. `/visualize/aging` - AgingSimulatorPage

- **API calls:** `getStyleTargets()`, `getStructureDimensions()`
- **Fields used:** `structure[].structureDimensionId`, `.minValue`, `.maxValue`, `aromaDescriptors[].cluster?.aromaSourceId`, `aromaDescriptors[].descriptor`
- **Status:** DONE - `AgingTimeline` correctly uses `aromaDescriptors` to separate primary vs tertiary aromas by `cluster?.aromaSourceId`.

---

## Remaining Work Items

### P1: Migrate aroma explorer to new taxonomy endpoint

- Add `getAromaTaxonomy()` to [apps/web/src/api/client.ts](apps/web/src/api/client.ts) hitting `/aroma-taxonomy`
- Add `aromaTaxonomy` key to [apps/web/src/api/queryKeys.ts](apps/web/src/api/queryKeys.ts)
- Rewrite [apps/web/src/components/aroma/AromaFlowTree.tsx](apps/web/src/components/aroma/AromaFlowTree.tsx) to accept `AromaSourceWithClusters[]` instead of `AromaTermFlat[]`
- Update [apps/web/src/pages/explore/ExploreAromasPage.tsx](apps/web/src/pages/explore/ExploreAromasPage.tsx) to use new endpoint
- Update [apps/web/src/pages/explore/ExploreLandingPage.tsx](apps/web/src/pages/explore/ExploreLandingPage.tsx) aroma count to use new endpoint or show descriptor count

### P2: Clean up legacy artifacts

- Remove `thermalBands` key from [apps/web/src/api/queryKeys.ts](apps/web/src/api/queryKeys.ts)
- Remove deprecated `StyleTargetFull` / `styleTargetFullSchema` aliases from [packages/shared/src/schemas.ts](packages/shared/src/schemas.ts) (verify nothing imports them)
- Remove `getAromaTerms()` from client and `/aroma-terms` legacy endpoint from API once aroma explorer is migrated
- Remove `description` from `structureDimensionSchema` in contracts (field no longer exists in DB table)

### P3: Naming consistency

- Rename `StyleTargetDetailPage.tsx` -> `WineStyleDetailPage.tsx` (update lazy import in [apps/web/src/App.tsx](apps/web/src/App.tsx))
- Consider renaming API paths `/style-targets` -> `/wine-styles` (requires updating all `queryKeys` and `client.ts` references)
- Update [apps/web/public/geo/README.md](apps/web/public/geo/README.md) which still references `country` and `parentRegionId`

