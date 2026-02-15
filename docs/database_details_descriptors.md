# Level 1 Descriptor Set — Agent Instructions

This document defines the **Level 1** tasting descriptor vocabulary for the wine app. It is the single source of truth for seeding and validating the `descriptor` and `style_target_descriptor` tables. All implementations **must** align with the schemas in [docs/database_schema.md](docs/database_schema.md).

---

## Schema alignment

- **Table:** `descriptor` — canonical vocabulary rows.  
- **Table:** `style_target_descriptor` — which descriptors link to which style targets (grape archetypes), with `relevance` (`primary` / `secondary` / `occasional`).

Use only these fields from the schema:

|Schema field|Type|Use in this doc|
|------------|----|---------------|
|`descriptor_id`|ID|Stable slug, e.g. `strawberry`, `black_pepper`|
|`name`|string|Display-ready name; unique within category (e.g. "Strawberry", "Black Pepper")|
|`category`|enum|One of: `fruit`, `floral`, `herbal`, `spice`, `earth`, `oak`|
|`wine_color_scope`|enum|`red`, `white`, or `both`|
|`description`|string|Optional; can hold subcategory or usage note|

The schema does **not** define `display_name`, `primary_category`, `subcategory`, or `level`. Use `name` for display. **Subcategory** (e.g. Berry, Citrus) is for UI grouping or documentation only unless the schema is extended later.

---

## Design principles

When adding or changing descriptors, follow these rules:

1. **~30 descriptors maximum** for Level 1.
2. **Differentiate the 12 archetypes** — only include descriptors that help tell the canonical style targets apart (see coordinate tables in `database_schema.md`).
3. **Clear category hierarchy** — each descriptor has exactly one `category` from the enum above; subcategory is optional display/grouping.
4. **No redundant synonyms** — one canonical term per concept (e.g. one "Berry" red fruit term per role).
5. **No ultra-specific niche aromas** — avoid terms like "gooseberry jam" or "wet saddle"; keep terms recognizable and teachable.

Categories mirror the Wine Aroma Wheel inner ring: Fruit, Floral, Herbal/Green, Spice, Earth/Savory, Oak.

---

## Canonical Level 1 descriptors

Below, **Category** is the schema `category` enum. **Subcategory** is for UI/display only (not stored). **Wine scope** is `wine_color_scope`. **Archetype anchors** indicate which style targets this descriptor helps differentiate (use when populating `style_target_descriptor`).

### 1. Fruit (`category: fruit`)

|descriptor_id|name|subcategory|wine_color_scope|Archetype anchors|
|-------------|----|-----------|----------------|-----------------|
|strawberry|Strawberry|Berry|red|Pinot Noir|
|cherry|Cherry|Berry|red|Sangiovese, Pinot Noir|
|raspberry|Raspberry|Berry|red|Grenache|
|red_plum|Red Plum|Stone fruit|red|Sangiovese|
|blackcurrant|Blackcurrant|Berry|red|Cabernet Sauvignon|
|blackberry|Blackberry|Berry|red|Syrah|
|black_plum|Black Plum|Stone fruit|red|Merlot|
|blueberry|Blueberry|Berry|red|Zinfandel|
|lemon|Lemon|Citrus|white|Riesling|
|lime|Lime|Citrus|white|Sauvignon Blanc|
|grapefruit|Grapefruit|Citrus|white|Sauvignon Blanc|
|green_apple|Green Apple|Pome|white|Riesling|
|pear|Pear|Pome|white|Chardonnay|
|peach|Peach|Stone fruit|white|Riesling (ripe)|
|pineapple|Pineapple|Tropical|white|Oaked Chardonnay|
|mango|Mango|Tropical|white|Chardonnay|
|passionfruit|Passionfruit|Tropical|white|Sauvignon Blanc|

### 2. Floral (`category: floral`)

|descriptor_id|name|subcategory|wine_color_scope|Archetype anchors|
|-------------|----|-----------|----------------|-----------------|
|violet|Violet|Floral|red|Nebbiolo|
|rose|Rose|Floral|red|Nebbiolo|
|white_blossom|White Blossom|Floral|white|Riesling|
|honeysuckle|Honeysuckle|Floral|white|Riesling (off-dry)|

### 3. Herbal / Green (`category: herbal`)

|descriptor_id|name|subcategory|wine_color_scope|Archetype anchors|
|-------------|----|-----------|----------------|-----------------|
|green_pepper|Green Pepper|Vegetal|red|Cabernet Sauvignon|
|tomato_leaf|Tomato Leaf|Vegetal|red|Cabernet Sauvignon|
|fresh_herbs|Fresh Herbs|Herbal|red|Sangiovese|
|grass|Grass|Herbal|white|Sauvignon Blanc|

### 4. Spice (`category: spice`)

|descriptor_id|name|subcategory|wine_color_scope|Archetype anchors|
|-------------|----|-----------|----------------|-----------------|
|black_pepper|Black Pepper|Spice|red|Syrah|
|clove|Clove|Baking spice|red|Oak-driven reds|
|cinnamon|Cinnamon|Baking spice|red|Tempranillo|
|anise|Anise|Spice|red|Nebbiolo|

### 5. Earth / Savory (`category: earth`)

|descriptor_id|name|subcategory|wine_color_scope|Archetype anchors|
|-------------|----|-----------|----------------|-----------------|
|mushroom|Mushroom|Earth|red|Pinot Noir|
|leather|Leather|Savory|red|Tempranillo|
|dried_leaves|Dried Leaves|Earth|red|Nebbiolo|
|smoke|Smoke|Savory|red|Syrah|

### 6. Oak-derived (`category: oak`)

|descriptor_id|name|subcategory|wine_color_scope|Archetype anchors|
|-------------|----|-----------|----------------|-----------------|
|vanilla|Vanilla|Oak|both|Oaked Chardonnay|
|toast|Toast|Oak|both|Oak marker|
|caramel|Caramel|Oak|white|Oaked Chardonnay|
|cedar|Cedar|Oak|red|Cabernet Sauvignon|

---

## Agent checklist

When implementing or seeding descriptors:

1. **IDs:** Use `descriptor_id` values from the tables above (e.g. `strawberry`, `black_pepper`). Prefer snake_case.
2. **Names:** Store the exact **name** column as the descriptor’s display name in the DB.
3. **Category:** Map only to schema enum: `fruit` | `floral` | `herbal` | `spice` | `earth` | `oak`.
4. **Wine scope:** Map only to schema enum: `red` | `white` | `both`.
5. **Subcategory:** Do not add a column for it unless the schema is updated; use `description` or UI-only logic if needed.
6. **style_target_descriptor:** Use the "Archetype anchors" column to decide which style_targets get each descriptor; set `relevance` (`primary` / `secondary` / `occasional`) per link.
7. **Uniqueness:** Ensure `name` is unique within `category` as per schema.

If the schema in `docs/database_schema.md` gains new fields (e.g. `subcategory`, `level`), update this instruction set and the canonical tables to match.
