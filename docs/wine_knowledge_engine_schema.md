# Wine Knowledge Engine – Encyclopedic Static Schema (v4)

## Design Principles

- **Truth-first, curated benchmarks** (no runtime modifier math)
- **Style-centric architecture** (`style_target` is the atomic wine concept)
- **Clear separation of concerns**
  - Truth Layer (wine reality)
  - Metadata Layer (climate, production, aging context)
  - Relationship Layer (comparative meaning)
  - Exercise Layer (game logic)
- **Range-based structural coordinates**
- **WSET-aligned aroma hierarchy**
- **Pedagogy does not pollute geography or identity tables**

---

# 1️⃣ Truth Layer (Authoritative Wine Data)

## `grape`

Canonical grape identity. Rose is a winemaking style, not a grape; model it via `style_target` if needed. A grape’s unlock tier is derived from the minimum `ladder_tier` of its associated style targets.

- `id` (PK, text)
- `display_name` (text)
- `color` (enum: `red|white`)
- `sort_order` (int)
- `notes` (text, optional)

---

## `region`

Pure hierarchical geography.

- `id` (PK, text)
- `display_name` (text)
- `country` (text)
- `parent_region_id` (FK → `region.id`, nullable)
- `notes` (text)

---

## `structure_dimension`

Defines structural assessment axes.

Examples:
- acidity, tannin, alcohol, body (ordinal 1–5)
- oak_intensity, flavor_intensity, color_intensity
- herbal_character (ordinal 1–5)
- earth_spice_character (ordinal 1–5)
- fruit_profile (categorical: Red/Black for reds; Citrus/Orchard/Tropical for whites)
- sweetness (ordinal 1–5)

Schema:

- `id` (PK, text)
- `display_name` (text)
- `domain` (enum: `appearance|structural`)
- `scale_type` (enum: `ordinal_5|ordinal_3|categorical`)
- `scale_min` (int, nullable)
- `scale_max` (int, nullable)
- `description` (text)

---

## `aroma_term`

Controlled aroma/flavor vocabulary aligned to WSET SAT lexicon. Three-level hierarchy via `parent_id`:

- **Level 1 (source):** `primary` (grape + fermentation), `secondary` (post-fermentation winemaking), `tertiary` (maturation). Root nodes have `parent_id = null`.
- **Level 2 (cluster):** e.g. Floral, Green Fruit, Citrus Fruit, Stone Fruit, Tropical Fruit, Red Fruit, Black Fruit, Herbaceous, Herbal, Pungent Spice, Yeast/Autolysis, Malolactic, Oak, Deliberate Oxidation, Fruit Development, Bottle Age.
- **Level 3 (descriptor):** e.g. acacia, honeysuckle, blackberry, vanilla, leather.

Schema:

- `id` (PK, text)
- `display_name` (text)
- `parent_id` (FK → `aroma_term.id`, nullable)
- `source` (enum: `primary|secondary|tertiary`)
- `description` (text)

---

## `style_target`

Core benchmark wine expression. Grape(s) are linked via `style_target_grape` (supports blends).

- `id` (PK, text)
- `display_name` (text)
- `region_id` (FK → `region.id`, nullable)
- `style_kind` (enum: `grape_archetype|regional_benchmark|method_benchmark|commercial_modern`)
- `ladder_tier` (int)
- `confidence` (enum: `high|medium|low`)
- `status` (enum: `draft|approved|deprecated`)
- `authoring_basis` (text)
- `notes_internal` (text)

---

## `style_target_grape`

Links style targets to one or more grapes; supports blends with percentage share.

- `style_target_id` (FK → `style_target.id`)
- `grape_id` (FK → `grape.id`)
- `percentage` (int, nullable — null when sole grape, implicit 100%)
- `role` (enum: `primary|blending`)

Primary Key: (`style_target_id`, `grape_id`)

---

## `style_target_structure`

Range-based structural coordinates for a style.

- `style_target_id` (FK → `style_target.id`)
- `structure_dimension_id` (FK → `structure_dimension.id`)
- `min_value` (int, nullable)
- `max_value` (int, nullable)
- `categorical_value` (text, nullable)
- `confidence` (enum: `high|medium|low`)

Primary Key: (`style_target_id`, `structure_dimension_id`)

---

## `style_target_aroma_profile`

Aromatic identity for benchmark style.

- `style_target_id` (FK → `style_target.id`)
- `aroma_term_id` (FK → `aroma_term.id`)
- `prominence` (enum: `dominant|supporting|optional`)

Primary Key: (`style_target_id`, `aroma_term_id`)

---

# 2️⃣ Metadata Layer (Contextual Encyclopedic Depth)

Adds filtering and explanatory richness without computation. Climate, production, and aging context are consolidated into one 1:1 table per style target.

---

## `thermal_band`

Temperature-based climate categorization (continentality is separate on `style_target_context`). Examples: `cool`, `moderate`, `warm`, `hot`.

- `id` (PK, text)
- `description` (text)

---

## `style_target_context`

Single 1:1 table for climate, production, and aging context per style target. All fields except `style_target_id` and `notes` are nullable.

- `style_target_id` (PK, FK → `style_target.id`)
- `thermal_band_id` (FK → `thermal_band.id`, nullable)
- `elevation_meters` (int, nullable)
- `continentality` (enum: `maritime|continental|mixed`, nullable)
- `oak_new_percentage_range` (text, nullable)
- `oak_type` (text, nullable)
- `malolactic_conversion` (enum: `none|partial|full`, nullable)
- `lees_aging` (bool, nullable)
- `whole_cluster` (bool, nullable)
- `carbonic_maceration` (bool, nullable)
- `skin_contact_white` (bool, nullable)
- `aging_vessel` (text, nullable)
- `aging_potential_years_min` (int, nullable)
- `aging_potential_years_max` (int, nullable)
- `common_tertiary_aromas` (text, nullable)
- `structure_evolution_notes` (text, nullable)
- `notes` (text)

---

# Summary

- **Grape:** `color` is `red|white` only (rose is a style, not grape identity); `unlocked_tier` removed (derived from style targets).
- **Aroma:** WSET-aligned 3-level hierarchy (source → cluster → descriptor) via `aroma_term.source` and `parent_id`.
- **Blends:** `style_target_grape` join table with `percentage` and `role`; `grape_id` removed from `style_target`.
- **Truth layer:** Weights removed from `style_target_structure` and `style_target_aroma_profile`; structure dimensions explicitly include herbal_character, earth_spice_character, fruit_profile, sweetness.
- **Metadata:** `thermal_band` (cool/moderate/warm/hot) replaces `climate_band`; climate, production, and aging consolidated into single `style_target_context` table.
