# Information to build wine database

## Description of ordinal values

### All ordinal values use

1 = Low

2 = Medium−

3 = Medium

4 = Medium+

5 = High

### Color intensity

1 = Pale

2 = Medium

3 = Deep

### Sweetness

1 = Dry

2 = Off-dry

3 = Medium

4 = Medium-sweet

5 = Sweet

## Red wine attributes

| Attribute             | Type        | Scale       | Description                |
| --------------------- | ----------- | ----------- | -------------------------- |
| tannin                | Ordinal     | 1–5         | Perceived tannin intensity |
| acidity               | Ordinal     | 1–5         | Perceived acidity          |
| body                  | Ordinal     | 1–5         | Weight/viscosity           |
| alcohol               | Ordinal     | 1–5         | Alcohol warmth             |
| oak_intensity         | Ordinal     | 1–5         | Oak impact                 |
| color_intensity       | Ordinal     | 1–3         | Pale–Deep                  |
| fruit_profile         | Categorical | Red / Black | Dominant fruit direction   |
| fruit_intensity       | Ordinal     | 1–5         | Raw fruit expression level |
| herbal_character      | Ordinal     | 1–5         | Green/herbal intensity     |
| earth_spice_character | Ordinal     | 1–5         | Earth/spice presence       |

### Derived: Fruit Forward Index

The Flavor Direction Map Y-axis uses a **computed** value, not a stored attribute:

```
FruitForwardIndex = fruit_intensity - (earth_spice_character * 0.5) - (herbal_character * 0.5)
```

A grape can have high raw `fruit_intensity` but low fruit-forwardness if earth/spice/herbal compete with the fruit (e.g., Syrah has abundant dark fruit but is not perceived as fruit-forward due to dominant spice/earth). This index is calculated at render time from the stored attributes — it is never stored in the database.

## White wine attributes

> **Note:** `sweetness` and `floral_character` are included for data completeness and future levels. They are **not actively drilled** in Level 1 — the White Structure Map uses only Body vs Acidity with an Oak overlay.

| Attribute        | Type        | Scale                       | Description               | Level 1 active |
| ---------------- | ----------- | --------------------------- | ------------------------- | -------------- |
| acidity          | Ordinal     | 1–5                         | Perceived acidity         | Yes            |
| body             | Ordinal     | 1–5                         | Weight                    | Yes            |
| alcohol          | Ordinal     | 1–5                         | Alcohol warmth            | Yes            |
| oak_intensity    | Ordinal     | 1–5                         | Oak presence              | Yes            |
| sweetness        | Ordinal     | 1–5                         | Residual sugar perception | No (future)    |
| color_intensity  | Ordinal     | 1–3                         | Pale–Deep                 | Yes            |
| fruit_profile    | Categorical | Citrus / Orchard / Tropical |                           | Yes            |
| herbal_character | Ordinal     | 1–5                         | Green/herbal intensity    | Yes            |
| floral_character | Ordinal     | 1–5                         | Floral intensity          | No (future)    |

## Coordinate table for red grapes

| Grape              | Tannin | Acidity | Body | Alcohol | Oak | Color | Fruit | Fruit Intensity | Herbal | Earth/Spice | FFI (derived) |
| ------------------ | ------ | ------- | ---- | ------- | --- | ----- | ----- | --------------- | ------ | ----------- | ------------- |
| Cabernet Sauvignon | 5      | 3       | 5    | 4       | 4   | 3     | Black | 4               | 2      | 2           | 2.0           |
| Merlot             | 3      | 3       | 3    | 3       | 3   | 2     | Black | 4               | 1      | 2           | 2.5           |
| Pinot Noir         | 2      | 4       | 2    | 3       | 2   | 1     | Red   | 3               | 1      | 3           | 1.0           |
| Syrah              | 4      | 3       | 4    | 4       | 3   | 3     | Black | 4               | 1      | 4           | 1.5           |
| Grenache           | 3      | 3       | 3    | 5       | 2   | 2     | Red   | 4               | 1      | 2           | 2.5           |
| Nebbiolo           | 5      | 5       | 3    | 3       | 2   | 1     | Red   | 3               | 2      | 5           | -0.5          |
| Sangiovese         | 3      | 4       | 3    | 3       | 2   | 2     | Red   | 3               | 4      | 3           | -0.5          |
| Tempranillo        | 3      | 3       | 3    | 3       | 4   | 2     | Red   | 3               | 2      | 3           | 0.5           |
| Zinfandel          | 3      | 3       | 4    | 5       | 3   | 3     | Black | 5               | 1      | 3           | 3.0           |

> **FFI (derived)** = `fruit_intensity - (earth_spice * 0.5) - (herbal * 0.5)`. Not stored; shown here for reference. Higher = more fruit-forward.

## Coordinate table for white grapes

| Grape                 | Acidity | Body | Alcohol | Oak | Sweetness | Color | Fruit    | Herbal | Floral |
| --------------------- | ------- | ---- | ------- | --- | --------- | ----- | -------- | ------ | ------ |
| Chardonnay (Oaked CA) | 3       | 4    | 4       | 4   | 1         | 2     | Tropical | 1      | 1      |
| Riesling (Mosel)      | 5       | 2    | 2       | 1   | 2         | 1     | Citrus   | 1      | 4      |
| Sauvignon Blanc (NZ)  | 5       | 2    | 3       | 1   | 1         | 1     | Citrus   | 5      | 2      |

## Data schema

user
user_progress
grape
style_target
attribute
style_target_attribute
descriptor
style_target_descriptor
exercise_template
exercise_instance
confusion_set
confusion_set_member
wine_bottle
bottle_style_match

### user

Stores registered accounts. Authentication is email + password (bcrypt-hashed).

| Field            | Type     | Required | Constraints | Notes                            |
| ---------------- | -------- | -------- | ----------- | -------------------------------- |
| user_id          | ID       | Yes      | unique      | UUID                             |
| email            | string   | Yes      | unique      | Login identifier                 |
| password_hash    | string   | Yes      |             | bcrypt hash, never stored plain  |
| display_name     | string   | No       |             | Optional profile name            |
| created_at       | datetime | Yes      |             |                                  |
| last_active_at   | datetime | No       |             | Updated on login / activity      |

### user_progress

Tracks per-user mastery state for each exercise format. Populated/updated after each `exercise_instance` submission.

| Field                | Type     | Required | Constraints                  | Notes                                                                  |
| -------------------- | -------- | -------- | ---------------------------- | ---------------------------------------------------------------------- |
| user_id              | ID       | Yes      | FK -> user                   |                                                                        |
| exercise_format      | enum     | Yes      | must match exercise_template | e.g. `map_place`, `elimination`                                        |
| wine_color           | enum     | Yes      | `red` / `white` / `mixed`   | Separate tracking per color scope                                      |
| total_attempts       | int      | Yes      | >= 0                         |                                                                        |
| correct_attempts     | int      | Yes      | >= 0                         |                                                                        |
| accuracy             | float    | Yes      | 0..1                         | `correct_attempts / total_attempts`                                    |
| avg_response_time_ms | int      | No       |                              | Rolling average                                                        |
| mastery_state        | enum     | Yes      | `locked` / `in_progress` / `mastered` | Derived from accuracy thresholds and attempt minimums       |
| last_attempted_at    | datetime | No       |                              |                                                                        |
| updated_at           | datetime | Yes      |                              |                                                                        |

Primary Key (conceptually): (user_id, exercise_format, wine_color)

**Mastery thresholds** (configurable):
- `in_progress`: at least 1 attempt
- `mastered`: accuracy >= 0.80 AND total_attempts >= 10 AND (for timed formats) avg_response_time_ms <= configured limit

### grape

| Field                     | Type        | Required | Constraints       | Notes                         |
| ------------------------- | ----------- | -------- | ----------------- | ----------------------------- |
| grape_id                  | ID (string) | Yes      | unique            | e.g. `cabernet_sauvignon`     |
| name                      | string      | Yes      |                   | Display name                  |
| wine_color                | enum        | Yes      | `red` / `white`   |                               |
| level                     | int         | Yes      | `=1`              | Level gating                  |
| canonical_style_target_id | ID          | Yes      | FK -> style_target | Primary archetype for Level 1 |
| aliases                   | string[]    | No       |                   | Optional synonyms             |
| notes                     | string      | No       |                   | Optional                      |

### style_target

A "canonical style/archetype" target. This is where "Riesling (Mosel)" lives (i.e., grape + archetype).

| Field                | Type   | Required | Constraints      | Notes                                             |
| -------------------- | ------ | -------- | ---------------- | ------------------------------------------------- |
| style_target_id      | ID     | Yes      | unique           | e.g. `lvl1_riesling_mosel`                        |
| grape_id             | ID     | Yes      | FK -> grape      |                                                   |
| name                 | string | Yes      |                  | e.g. "Riesling (Mosel)"                           |
| wine_color           | enum   | Yes      | must match grape | `red`/`white`                                     |
| level                | int    | Yes      | `=1`             |                                                   |
| is_primary_for_grape | bool   | Yes      |                  | For MVP you'll have exactly one primary per grape |
| description          | string | No       |                  | Short archetype explanation                       |
| version              | int    | Yes      | starts at 1      | When you tune coordinates                         |

### attribute

Registry of attributes and how they are measured (ordinal scale or categorical values). This is where your "agreement" is enforced.

| Field            | Type     | Required | Constraints               | Notes                                                                        |
| ---------------- | -------- | -------- | ------------------------- | ---------------------------------------------------------------------------- |
| attribute_id     | ID       | Yes      | unique                    | e.g. `acidity`, `fruit_profile`                                              |
| name             | string   | Yes      |                           |                                                                              |
| wine_color_scope | enum     | Yes      | `red` / `white` / `both`  | Because sets differ                                                          |
| data_type        | enum     | Yes      | `ordinal` / `categorical` |                                                                              |
| scale_key        | enum     | No       | required if ordinal       | `ordinal_1_5` / `color_intensity_1_3` / `sweetness_1_5`                      |
| min_value        | int      | No       | if ordinal                | derived from scale_key                                                       |
| max_value        | int      | No       | if ordinal                | derived from scale_key                                                       |
| allowed_values   | string[] | No       | required if categorical   | Red fruit: `["Red","Black"]`; White fruit: `["Citrus","Orchard","Tropical"]` |
| description      | string   | Yes      |                           | Your description column                                                      |
| sort_order       | int      | Yes      |                           | Stable UI ordering                                                           |

### style_target_attribute

The coordinate table: for each style_target, store its value for each attribute.

| Field             | Type   | Required | Constraints                          | Notes                                           |
| ----------------- | ------ | -------- | ------------------------------------ | ----------------------------------------------- |
| style_target_id   | ID     | Yes      | FK -> style_target                   |                                                 |
| attribute_id      | ID     | Yes      | FK -> attribute                      | Must be valid for style_target's wine_color     |
| value_ordinal     | int    | No       | required if attribute is ordinal     | Must obey scale (1-5; color 1-3; sweetness 1-5) |
| value_categorical | string | No       | required if attribute is categorical | Must be in allowed_values                       |
| source            | string | No       |                                      | e.g. "Level 1 canonical table v1"               |
| confidence        | float  | No       | 0..1                                 | Optional; useful later                          |
| notes             | string | No       |                                      | Optional                                        |

### descriptor

A reusable vocabulary item for tasting language and mnemonics. **MVP-essential** — required for Descriptor Matching drills (Part 1 of game objectives).

| Field               | Type   | Required | Constraints                                               | Notes                                                         |
| ------------------- | ------ | -------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| descriptor_id       | ID     | Yes      | unique                                                    |                                                               |
| name                | string | Yes      | unique (within category)                                  | e.g. "blackcurrant", "violet", "pepper"                       |
| category            | enum   | Yes      | e.g. `fruit`, `floral`, `herbal`, `spice`, `earth`, `oak` | Keep broad                                                    |
| wine_color_scope    | enum   | Yes      | `red` / `white` / `both`                                  |                                                               |
| description         | string | No       |                                                           | Optional                                                      |
| intensity_scale_key | enum   | No       | optional                                                  | If you want "typical intensity" later (usually `ordinal_1_5`) |

### style_target_descriptor

Join table linking descriptors to style_targets. Defines which tasting descriptors are canonical for each grape archetype. **MVP-essential** — required for Descriptor Matching drills.

| Field           | Type   | Required | Constraints                            | Notes                                   |
| --------------- | ------ | -------- | -------------------------------------- | --------------------------------------- |
| style_target_id | ID     | Yes      | FK -> style_target                     |                                         |
| descriptor_id   | ID     | Yes      | FK -> descriptor                       |                                         |
| relevance       | enum   | Yes      | `primary` / `secondary` / `occasional` | How strongly this descriptor associates |
| notes           | string | No       |                                        | e.g. "only in warm-climate expressions" |

Primary Key (conceptually): (style_target_id, descriptor_id)

### exercise_template

Defines a generative exercise recipe.

| Field                | Type   | Required | Constraints                                                                                                                      | Notes                                                                           |
| -------------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| exercise_template_id | ID     | Yes      | unique                                                                                                                           |                                                                                 |
| name                 | string | Yes      |                                                                                                                                  |                                                                                 |
| level                | int    | Yes      | `=1`                                                                                                                             |                                                                                 |
| wine_color           | enum   | Yes      | `red` / `white` / `mixed`                                                                                                        |                                                                                 |
| format               | enum   | Yes      | `map_place` / `map_recall` / `order_rank` / `descriptor_match` / `structure_deduction` / `elimination` / `skeleton_deduction` / `tasting_input` | See format reference below |
| prompt_stem          | string | Yes      |                                                                                                                                  | With placeholders                                                               |
| tested_attribute_ids | ID[]   | Yes      | must exist in attribute                                                                                                          | What it tests                                                                   |
| selection_rules      | object | Yes      |                                                                                                                                  | How to pick style_targets/options (schema defined during implementation)        |
| correctness_rules    | object | Yes      |                                                                                                                                  | How to score using style_target_attribute (schema defined during implementation)|
| ambiguity_guardrails | object | No       |                                                                                                                                  | e.g. minimum ordinal delta (schema defined during implementation)               |
| feedback_template    | object | No       |                                                                                                                                  | Rules for generating computed feedback (see Feedback section below)             |
| difficulty           | enum   | Yes      | `easy` / `medium` / `hard` / `expert`                                                                                            |                                                                                 |
| time_limit_ms        | int    | No       |                                                                                                                                  | If set, exercise is timed; used for difficulty scaling and mastery evaluation    |

#### Exercise format reference

| Format                 | Game mode                     | Description                                                         |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `map_place`            | Canonical Structure Maps      | Drag individual grapes onto the correct position on a map           |
| `map_recall`           | Map Recall Mode               | Place all 12 grapes from memory onto a blank map                    |
| `order_rank`           | Attribute Reinforcement       | Rank grapes by a single attribute (e.g. order by tannin)            |
| `descriptor_match`     | Descriptor Matching           | Match descriptors to grapes, remove incorrect ones, sort categories |
| `structure_deduction`  | Structure-First / Fruit-Driven | Given attributes, identify or drag top candidates                  |
| `elimination`          | Elimination Mode              | Given 3-4 grapes, remove incorrect ones with reasoning              |
| `skeleton_deduction`   | Skeleton Mode                 | Structure-only clues (no fruit), identify the grape                 |
| `tasting_input`        | Tasting Mode                  | Input slider values from a real bottle, system returns top matches  |

#### Feedback generation

Feedback is **computed dynamically** from attribute deltas between the user's answer and the correct answer. The `feedback_template` field on `exercise_template` configures which sections to generate:

- **Structure match**: Compare ordinal attributes (tannin, acidity, body, alcohol) between chosen and correct style_target
- **Fruit direction**: Highlight fruit_profile, fruit_intensity, and derived Fruit Forward Index differences
- **Oak influence**: Compare oak_intensity values
- **"Why not X?"**: For each incorrect candidate, show the 1-2 attributes with largest delta from the correct answer

No static explanation text is stored. All feedback is derived from `style_target_attribute` coordinate data at render time.

### exercise_instance

A single generated question shown to a user, including payload and outcome.

| Field                | Type     | Required | Constraints            | Notes                                                  |
| -------------------- | -------- | -------- | ---------------------- | ------------------------------------------------------ |
| exercise_instance_id | ID       | Yes      | unique                 |                                                        |
| user_id              | ID       | Yes      | FK -> user             |                                                        |
| occurred_at          | datetime | Yes      |                        |                                                        |
| exercise_template_id | ID       | Yes      | FK -> exercise_template |                                                       |
| seed                 | int      | Yes      |                        | For reproducible generation                            |
| payload              | object   | Yes      |                        | Chosen style_targets, options, attribute, map_id, etc. |
| user_answer          | object   | Yes      |                        |                                                        |
| is_correct           | bool     | Yes      |                        |                                                        |
| score                | float    | Yes      | 0..1                   |                                                        |
| response_time_ms     | int      | No       |                        |                                                        |
| bottle_id            | ID       | No       | FK -> wine_bottle      | "answered while tasting X"                             |

### confusion_set (optional for MVP)

A named set of "commonly confused" style_targets, for targeted drills.

| Field             | Type   | Required | Constraints                         | Notes                   |
| ----------------- | ------ | -------- | ----------------------------------- | ----------------------- |
| confusion_set_id  | ID     | Yes      | unique                              |                         |
| name              | string | Yes      |                                     | e.g. "High tannin reds" |
| wine_color        | enum   | Yes      |                                     |                         |
| level             | int    | Yes      | `=1`                                |                         |
| rationale         | string | No       |                                     | Why these are confused  |
| generation_method | enum   | No       | `manual` / `distance` / `telemetry` | Helpful later           |

### confusion_set_member (optional for MVP)

Membership table for confusion sets.

| Field            | Type  | Required | Constraints               | Notes                    |
| ---------------- | ----- | -------- | ------------------------- | ------------------------ |
| confusion_set_id | ID    | Yes      | FK -> confusion_set       |                          |
| style_target_id  | ID    | Yes      | FK -> style_target        |                          |
| role             | enum  | No       | e.g. `core`, `distractor` | Optional                 |
| weight           | float | No       | 0..1                      | Optional sampling weight |

Primary Key (conceptually): (confusion_set_id, style_target_id)

### wine_bottle

A bottle anchor (taste-along object). Importantly, it's not "inventory"; it's a curated training reference.

| Field          | Type   | Required | Constraints     | Notes                                               |
| -------------- | ------ | -------- | --------------- | --------------------------------------------------- |
| bottle_id      | ID     | Yes      | unique          |                                                     |
| display_name   | string | Yes      |                 | Producer + cuvee                                    |
| wine_color     | enum   | Yes      | `red` / `white` |                                                     |
| region         | string | No       |                 |                                                     |
| vintage        | int    | No       |                 | Optional                                            |
| grapes_label   | string | No       |                 | Free text if you don't want full blend modeling yet |
| notes          | string | No       |                 |                                                     |
| teaching_notes | string | Yes      |                 | Why it's a good anchor                              |

### bottle_style_match

Maps a real bottle to one (or more) style_targets, with a confidence/fit score.

| Field            | Type   | Required | Constraints       | Notes                                       |
| ---------------- | ------ | -------- | ----------------- | ------------------------------------------- |
| bottle_id        | ID     | Yes      | FK -> wine_bottle |                                             |
| style_target_id  | ID     | Yes      | FK -> style_target |                                            |
| match_score      | float  | Yes      | 0..1              | How well it matches the canonical archetype |
| is_primary_match | bool   | Yes      |                   | If you want one "main" mapping              |
| deviation_notes  | string | No       |                   | What differs from canonical                 |
| curator          | string | No       |                   | Optional attribution                        |

## Agent extra instructions

Make sure to also consider the 'descriptors.md' file as it contains information about that part of the schema / database seeding
