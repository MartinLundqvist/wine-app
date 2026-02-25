---
name: wine-style-admin-backlog
overview: Extract a shared WineStyleForm component used by create and edit pages, fixing the duplicate slider bug and bringing the edit page to full UI/UX parity with create.
todos:
  - id: build-shared-form
    content: Create WineStyleFormData type + WineStyleForm component in apps/web/src/components/admin/WineStyleForm.tsx. Includes all shared sections (identity, region, climate, notes, grapes, structure, appearance, aroma clusters, aroma descriptors, error area, action buttons). Uses RangeSlider only (no WineAttributeBar) for structure/appearance — fixes the duplicate slider bug. Pre-populates all structure dims and color-appropriate appearance dims.
    status: completed
  - id: migrate-create-page
    content: Refactor WineStyleCreatePage to delegate form rendering to WineStyleForm. Page retains state init, useEffects for dimension pre-population, ID field + touched validation, create region mutation, payload assembly (WineStyleCreate), and post-success navigation.
    status: completed
  - id: migrate-edit-page
    content: Refactor WineStyleEditPage to use WineStyleForm. Page retains style fetch + hydration useEffect, adds useEffects for dimension pre-population (matching create behavior), payload assembly (WineStylePatch), and post-success navigation. Gains hierarchical region picker, card layout, labeled climate selects, live validation, and color bar.
    status: completed
  - id: validate-and-polish
    content: "Lint/type-check all modified files. Manual UI verification of both create and edit flows: slider uniqueness, dimension pre-population, region picker, grape validation, save round-trip."
    status: completed
isProject: false
---

# Wine Style Admin Backlog Plan

## Current State — Key Divergences

The create page (850 lines) and edit page (483 lines) have drifted significantly:


| Concern                    | Create page                                                                                                                     | Edit page                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Layout**                 | Card sections with icons, color gradient bar                                                                                    | Flat divs with `border-t` separators, no icons, no color bar               |
| **Region picker**          | Hierarchical drill-down + inline "add new region"                                                                               | Single flat `<select>` listing all regions                                 |
| **Climate inputs**         | `<select>` with human-readable labels from `climate_5` ordinal scale                                                            | Raw `<input type="number">` 1–5, separate `climateOrdinalScaleId` dropdown |
| **Style type labels**      | Human-readable (`replace(/_/g, " ")`)                                                                                           | Raw enum values                                                            |
| **Structure / Appearance** | Pre-populated for all applicable dimensions via `useEffect`; renders both `RangeSlider` + `WineAttributeBar` (duplicate bug)    | Hydrated from existing data only; dynamic add/remove; `RangeSlider` only   |
| **Validation**             | Live per-field validation with `touched` tracking (ID, displayName, climate min≤max, structure/appearance min≤max, grape total) | Grape percentage check only                                                |


## Design Decisions

### 1. Pre-populated vs. dynamic dimensions → **Pre-populate**

Both modes will pre-populate all structure dimensions and color-appropriate appearance dimensions. Rationale:

- Structure and appearance are core profile attributes — every wine style should define a range for every dimension.
- The create page already treats them as required and pre-populates on mount.
- For edit: after the style data hydrates, a second `useEffect` fills in any dimensions that are missing from the saved data (e.g. if a new dimension was added after the style was created), using the full-scale range as the default. This ensures the form always shows every dimension.
- The "Add structure" / "Add appearance" / "Remove" buttons on the current edit page go away. Dimensions are always shown.

### 2. Region picker → **Hierarchical in both modes**

The shared form uses the hierarchical drill-down picker from the create page. Rationale:

- A flat select over hundreds of regions is unusable at scale.
- The "add new region" inline form is valuable for admins filling in missing geography in either flow.
- The create-region mutation is owned by the page container and passed as an optional callback. The shared form renders the UI if the callback is provided.

### 3. Climate inputs → **Labeled ordinal selects, hardcoded `climate_5`**

Both modes use `<select>` elements with human-readable labels from the `climate_5` ordinal scale, matching the create page. Rationale:

- There is only one climate scale in the system; exposing a scale picker adds complexity with no current benefit.
- Labeled selects ("Cool", "Moderate", "Warm", etc.) are far better UX than raw numbers.
- Validation enforces **both-or-neither**: `climateMin` and `climateMax` must either both be set or both be empty.
- The `climateOrdinalScaleId` is derived automatically: set to `climate_5` only when **both** min and max are provided, `null` otherwise.
- The separate `climateOrdinalScaleId` state variable in the edit page is removed.

### 4. Validation → **Live validation in both modes**

The shared form computes and displays validation errors for all shared constraints:

- Climate bounds are both set or both empty
- Climate min ≤ max
- Structure/appearance min ≤ max per dimension
- Grape percentages total 100% (when any percentage is set)

The `touched` tracking for the **ID field** stays create-specific (handled in the page container, passed as a prop). The shared form receives a `validationErrors` record and renders messages next to the relevant sections.

### 5. Form data interface → **Single `WineStyleFormData` object + explicit callbacks (no generic partial updater)**

Rather than 15+ individual state/setter prop pairs:

```typescript
interface WineStyleFormData {
  id: string;               // read-only on edit (shown in header, not in form)
  displayName: string;
  styleType: string;
  producedColor: string;
  wineCategory: string;
  regionId: string;
  climateMin: string;       // string for select value; "" = unset
  climateMax: string;
  notes: string;
  grapes: { grapeVarietyId: string; percentage?: number | null }[];
  structure: { structureDimensionId: string; minValue: number; maxValue: number }[];
  appearance: { appearanceDimensionId: string; minValue: number; maxValue: number }[];
  aromaClusters: { aromaClusterId: string; intensityMin: number; intensityMax: number }[];
  aromaDescriptors: { aromaDescriptorId: string; salience: "dominant" | "supporting" | "occasional" }[];
}
```

Each page owns the canonical state (individual `useState` hooks, unchanged). The page constructs a `WineStyleFormData` object on each render and passes it to the form along with:

- Narrow, typed callbacks by concern to avoid brittle nested partial updates:
  - `onFieldChange(field, value)` for simple scalar fields (`displayName`, `styleType`, `producedColor`, `wineCategory`, `regionId`, `climateMin`, `climateMax`, `notes`)
  - `onGrapesChange(next)`
  - `onStructureChange(next)`
  - `onAppearanceChange(next)`
  - `onAromaClustersChange(next)`
  - `onAromaDescriptorsChange(next)`
- Reference data props: `regions`, `ordinalScales`, `grapesList`, `structureDims`, `appearanceDims`, `aromaTaxonomy`.
- Submission props: `onSubmit`, `submitLabel` ("Create" | "Save"), `isSubmitting`, `isFormValid`, `error`.
- Mode flag: `mode: "create" | "edit"` — controls whether the ID field is rendered as an input or shown as a read-only header.
- Optional create-region callback: `onCreateRegion?`, `regionCreatePending?`, `regionCreateError?`.
- Validation: `validationErrors` record for section-level messages. Pages compute these from their own state.

### 6. Duplicate slider fix → **RangeSlider only, drop `WineAttributeBar`**

The shared form's Structure and Appearance sections render one `RangeSlider` per dimension. The `WineAttributeBar` is removed from these sections entirely — `RangeSlider` already displays the selected range visually. The `WineAttributeBar` import is removed from the create page. (It remains available for read-only detail pages.)

## Implementation Steps

### Step 1 — Build the shared form component

Create `apps/web/src/components/admin/WineStyleForm.tsx`:

- Define the `WineStyleFormData` type and `WineStyleFormProps` interface.
- Implement all shared sections using the create page's card layout, icons, and styling (`sectionCardClass`, `inputClass`, `colorBarClass`).
- Hierarchical region picker + optional "add new region" inline form.
- Climate as labeled `<select>` from `climate_5` scale.
- Grapes with `GrapePercentageIndicator`.
- Structure and Appearance with `RangeSlider` only (one per dimension, no `WineAttributeBar`).
- Aroma clusters with `RangeSlider` for intensity.
- Aroma descriptors with salience select.
- ID field: editable `<input>` when `mode === "create"`, read-only `<p>` in header when `mode === "edit"`.
- Error area + action buttons (submit + cancel link).
- Human-readable style type labels everywhere (`replace(/_/g, " ")`).
- Validation error display driven by the `validationErrors` prop.

### Step 2 — Migrate create page

Refactor `WineStyleCreatePage.tsx`:

- Keep all `useState` hooks, data queries, `useEffect`s for dimension pre-population, `createMutation`, `createRegionMutation`, `validationErrors` computation, `isFormValid` logic.
- Remove all JSX form rendering; replace with `<WineStyleForm ... />`.
- Construct `WineStyleFormData` from state, wire explicit callbacks (`onFieldChange`, `onStructureChange`, etc.) to individual setters.
- Pass `onCreateRegion` callback, region creation state.
- Remove `WineAttributeBar` import.
- Expected reduction: ~550 lines of JSX removed, ~30 lines of form wiring added.

### Step 3 — Migrate edit page

Refactor `WineStyleEditPage.tsx`:

- Keep style fetch query, all data queries.
- Keep hydration `useEffect` (populates state from fetched style).
- **Add** explicit hydration guards to prevent race/overwrite bugs:
  - `hasHydratedFromServer` ref/state: hydration runs once per loaded style id.
  - `hasUserEditedStructure` / `hasUserEditedAppearance` flags set on first user edit.
  - Dimension pre-population effects run only after hydration completes and only while the corresponding user-edited flag is false.
- **Add** dimension pre-population `useEffect`s matching create's logic: after guarded hydration, fill in any structure/appearance dimensions not present in the existing data, defaulting to full-scale range. This ensures the form always shows all applicable dimensions.
- Remove `climateOrdinalScaleId` state — derive it in the payload.
- Keep `patchMutation`; update payload assembly to derive `climateOrdinalScaleId` only when both min/max are present.
- **Add** `validationErrors` computation matching create's shared checks (climate both-or-neither, climate min≤max, structure/appearance min≤max, grape total).
- Update `isFormValid` / submit button disabled logic to use shared validation.
- Remove all JSX form rendering; replace with `<WineStyleForm ... />`.
- Gains: card layout, color bar, icons, hierarchical region picker, labeled climate selects, human-readable labels, live validation.
- Expected change: ~300 lines of JSX removed, ~50 lines of form wiring + new useEffects added.

### Step 4 — Validate and polish

- Run `tsc --noEmit` and fix any type errors in modified files.
- Run linter and fix introduced issues.
- Manual test:
  - `/admin/wine-style/new`: all sections render, sliders appear once per row, grapes validation works, region creation works, successful create navigates to list.
  - `/admin/wine-style/:id/edit`: loads existing data correctly, all dimensions pre-populated (including any newly-added ones), region picker shows current region in hierarchy, save round-trips correctly.
  - Climate validation: cannot submit with only min or only max set; can submit with both empty or both valid and ordered.
  - Hydration guard behavior: after editing a structure/appearance slider, background refetch or unrelated state changes do not overwrite the edited values.
  - Verify no regressions on the read-only wine style detail page (it uses `WineAttributeBar` independently).

## Risk Control

- **No API changes.** Payload shapes (`WineStyleCreate`, `WineStylePatch`) and endpoint behavior remain unchanged.
- **No shared schema changes.** All type changes are local to the web app.
- **Incremental approach.** Each step produces a working app. Step 1 is additive only (new file). Steps 2 and 3 can be done and tested independently.
- **Deterministic effect ordering.** Hydration and dimension pre-population are guarded to avoid refetch-driven overwrites.
- **Edit page behavior change is intentional.** Pre-populating dimensions and switching to hierarchical region picker are deliberate UX improvements, not accidental regressions. The edit page currently has strictly less functionality; this migration brings it to parity.

