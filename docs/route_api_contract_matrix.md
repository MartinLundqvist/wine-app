# Route-to-API Contract Matrix

Trace of each web route → page → query key → API client method → endpoint → shared schema → UI assumptions. Impact from schema change: `ordinalScale.labels` is variable length (min 2); `WineStyleFull.appearance` is optional.

## Explore routes

| Route | Page | Query key(s) | API method(s) | Endpoint(s) | Response contract(s) | Ordinal/appearance usage | Status |
|-------|------|--------------|---------------|-------------|----------------------|--------------------------|--------|
| `/explore` | ExploreLandingPage | grapes, styleTargets, regions, aromaTaxonomy | getGrapes, getStyleTargets, getRegions, getAromaTaxonomy | GET /grapes, /style-targets, /regions, /aroma-taxonomy | GrapeWithWineStyleIds[], WineStyleFull[], Region[], AromaSourceWithClusters[] | Counts only | Safe |
| `/explore/styles` | ExploreStylesPage | styleTargets | getStyleTargets | GET /style-targets | WineStyleFull[] | getStructureSortValue(structure, "tannins"); scaleMax 5 in lib | Safe |
| `/explore/styles/:id` | WineStyleDetailPage | styleTarget(id) | getStyleTarget | GET /style-targets/:id | WineStyleFull | climate labels[climateMin/Max-1]; structure/appearance scaleMax from labels.length | Guard climate |
| `/explore/grapes` | ExploreGrapesPage | grapes | getGrapes | GET /grapes | GrapeWithWineStyleIds[] | None | Safe |
| `/explore/grapes/:id` | GrapeDetailPage | grapes, styleTargets | getGrapes, getStyleTargets | GET /grapes, /style-targets | Same + WineStyleFull[] | StyleCard → getStructureRange (scaleMax 5) | Safe |
| `/explore/regions` | ExploreRegionsPage | regions, styleTargets, regionsMapConfig | getRegions, getStyleTargets, getRegionsMapConfig | GET /regions, /style-targets, /regions/map-config | Region[], WineStyleFull[], RegionsMapConfigResponse | None | Safe |
| `/explore/aromas` | ExploreAromasPage | aromaTaxonomy | getAromaTaxonomy | GET /aroma-taxonomy | AromaSourceWithClusters[] | None | Safe |

## Visualize routes

| Route | Page | Query key(s) | API method(s) | Endpoint(s) | Response contract(s) | Ordinal/appearance usage | Status |
|-------|------|--------------|---------------|-------------|----------------------|--------------------------|--------|
| `/visualize/structure` | StructureRadarPage | styleTargets, structureDimensions | getStyleTargets, getStructureDimensions | GET /style-targets, /structure-dimensions | WineStyleFull[], StructureDimensionWithScale[] | SCALE_MAX=5 for 0–1 normalization only | Safe |
| `/visualize/flavor-map` | FlavorMapPage | styleTargets, ordinalScales | getStyleTargets, getOrdinalScales | GET /style-targets, /ordinal-scales | WineStyleFull[], OrdinalScale[] | FlavorMap: climate filter labels[climateMin-1]; climate_5 chips | Guard FlavorMap |
| `/visualize/climate` | ClimateExplorerPage | styleTargets | getStyleTargets | GET /style-targets | WineStyleFull[] | ClimateGradient: getClimateLabel(labels[min-1]); fixed CLIMATE_LABELS bands | Already guarded |
| `/visualize/confusion` | ConfusionZonePage | styleTargets, structureDimensions, confusionGroup | getStyleTargets, getStructureDimensions, getConfusionGroup | GET /style-targets, /structure-dimensions, /style-targets/:id/confusion-group | WineStyleFull[], StructureDimensionWithScale[], ConfusionGroupResponse | SCALE_MAX=5 normalization | Safe |
| `/visualize/aging` | AgingSimulatorPage | styleTargets, structureDimensions | getStyleTargets, getStructureDimensions | GET /style-targets, /structure-dimensions | WineStyleFull[], StructureDimensionWithScale[] | SCALE_MAX=5 in AgingTimeline | Safe |

## Shared components (contract assumptions)

| Component | File | Assumption | Fix |
|-----------|------|------------|-----|
| WineStyleDetailPage | pages/explore/WineStyleDetailPage.tsx | climateOrdinalScale.labels[climateMin/Max - 1] | Use 1-based index in range 1..labels.length; fallback to numeric or "—" |
| ClimateGradient | components/visualizations/ClimateGradient.tsx | labels[min-1] when min in 1..labels.length | Already guarded |
| FlavorMap | components/visualizations/FlavorMap.tsx | labels[climateMin - 1] for filter | Only use when 1 <= climateMin <= labels.length |
| WineAttributeBar | components/ui/WineAttributeBar.tsx | max = scale length from caller | Callers pass scaleMax from dimension; WineStyleDetailPage uses labels.length | OK |
| getStructureRange | lib/wine-structure.ts | scaleMax = 5 | Kept; structure dimensions remain 5-point in seed |

## Contract assumption risks (variable-length ordinal labels)

1. **labels[index]** – Any code using `labels[oneBasedIndex - 1]` or `labels[i]` assumes a fixed length. If the scale has 2–4 labels, indices for 4 or 5 are out of bounds and yield `undefined`. Affected: WineStyleDetailPage (climate range text), FlavorMap (climate filter), ClimateGradient (band label). ClimateGradient already checks `min >= 1 && min <= labels.length`.
2. **Fixed band lists** – ClimateGradient uses a fixed `CLIMATE_LABELS` array of 5 bands. Styles whose scale returns a label not in that array are bucketed into "Moderate". Acceptable; no crash.
3. **Optional appearance** – WineStyleDetailPage uses `st.appearance ?? []` and derives scaleMax from `dim?.ordinalScale?.labels?.length ?? 5`. No assumption that appearance exists or has length 5.

## Summary

- **Required guards:** WineStyleDetailPage (climate label), FlavorMap (climate filter index).
- **Shared helper:** Add `getOrdinalLabel(labels, oneBasedIndex)` in shared validation for consistent bounds checking.
- **Appearance:** All consumers use `st.appearance ?? []` and optional scale length; no change needed.

## Verification (post-implementation)

- **Typecheck/build:** `pnpm run build` (web: `tsc -b && vite build`, api: `tsc`) completed successfully.
- **Lint:** No linter errors on modified files (shared/validation.ts, WineStyleDetailPage, FlavorMap, ClimateGradient).
- **Changes applied:**
  - `packages/shared/src/validation.ts`: added `getOrdinalLabel(labels, oneBasedIndex)`.
  - `WineStyleDetailPage`: climate range text uses `getOrdinalLabel`; fallback to numeric "min–max" when label out of range.
  - `FlavorMap`: climate filter uses `getOrdinalLabel` so only in-range indices match.
  - `ClimateGradient`: `getClimateLabel` now uses `getOrdinalLabel` for consistency.
