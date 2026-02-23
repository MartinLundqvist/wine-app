---
name: Seed WSET L3 descriptors
overview: Extend the DB seed with every aroma/flavour descriptor from page 2 of the WSET L3 Wine-Lexicon PDF with exact cluster parity, including repeated terms in multiple clusters via cluster-specific IDs while preserving existing style-linked IDs.
todos: []
isProject: false
---

# Seed all WSET L3 Wine-Lexicon descriptors from PDF page 2 (exact parity)

## Source

[docs/wset_l3_wines_sat_en_jun-2016.pdf](docs/wset_l3_wines_sat_en_jun-2016.pdf) — second page is the **WSET Level 3 Wine-Lexicon** with three sections: Primary, Secondary, and Tertiary aromas/flavours. Each section lists **Clusters** and **Descriptors** (comma-separated).

## Current state

- **[packages/db/src/schema/descriptors.ts](packages/db/src/schema/descriptors.ts)**  
  - `aroma_descriptor`: `id`, `display_name`, `aroma_cluster_id` (each descriptor belongs to exactly one cluster).
- **[packages/db/src/seed.ts](packages/db/src/seed.ts)**  
  - All 19 **aroma clusters** already match the PDF (primary: floral, green fruit, citrus, stone fruit, tropical, red fruit, black fruit, dried/cooked fruit, herbaceous, herbal, pungent spice, other; secondary: yeast, malolactic, oak; tertiary: oxidation, fruit dev white, fruit dev red, bottle age white, bottle age red).  
  - Only **19 descriptors** are seeded; wine styles reference them by ID (e.g. `desc_apple`, `desc_vanilla`, `desc_leather`). Those IDs must be kept.

## Descriptor list from PDF (full extraction)

Terms that appear in more than one PDF cluster (e.g. toast, cheese, chocolate, coffee, nutmeg, mushroom, fig, prune) will be seeded **in each cluster where listed** to match page-2 lexicon parity. Because `aroma_descriptor` requires one `aromaClusterId` per row, duplicates will use **cluster-specific IDs** with the same `displayName`.


| Cluster (existing ID)      | Descriptors to seed                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Primary**                |                                                                                                                |
| cluster_floral             | acacia, honeysuckle, chamomile, elderflower, geranium, blossom, rose, violet                                   |
| cluster_green_fruit        | apple, gooseberry, pear, pear drop, quince, grape                                                              |
| cluster_citrus             | grapefruit, lemon, lime, orange peel, lemon peel                                                               |
| cluster_stone_fruit        | peach, apricot, nectarine                                                                                      |
| cluster_tropical           | banana, lychee, mango, melon, passion fruit, pineapple                                                         |
| cluster_red_fruit          | redcurrant, cranberry, raspberry, strawberry, red cherry, red plum                                             |
| cluster_black_fruit        | blackcurrant, blackberry, bramble, blueberry, black cherry, black plum                                         |
| cluster_dried_cooked_fruit | fig, prune, raisin, sultana, kirsch, jamminess, baked/stewed fruits, preserved fruits                          |
| cluster_herbaceous         | green bell pepper (capsicum), grass, tomato leaf, asparagus, blackcurrant leaf                                 |
| cluster_herbal             | eucalyptus, mint, medicinal, lavender, fennel, dill                                                            |
| cluster_pungent_spice      | black/white pepper, liquorice                                                                                  |
| cluster_other_primary      | flint, wet stones, wet wool                                                                                    |
| **Secondary**              |                                                                                                                |
| cluster_yeast              | biscuit, bread, toast, pastry, brioche, bread dough, cheese                                                    |
| cluster_malolactic         | butter, cheese, cream                                                                                          |
| cluster_oak                | vanilla, cloves, nutmeg, coconut, butterscotch, toast, cedar, charred wood, smoke, chocolate, coffee, resinous |
| **Tertiary**               |                                                                                                                |
| cluster_oxidation          | almond, marzipan, hazelnut, walnut, chocolate, coffee, toffee, caramel                                         |
| cluster_fruit_dev_white    | dried apricot, marmalade, dried apple, dried banana                                                            |
| cluster_fruit_dev_red      | fig, prune, tar, dried blackberry, dried cranberry, cooked blackberry, cooked red plum                         |
| cluster_bottle_age_white   | petrol, kerosene, cinnamon, ginger, nutmeg, toast, nutty, mushroom, hay, honey                                 |
| cluster_bottle_age_red     | leather, forest floor, earth, mushroom, game, tobacco, vegetal, wet leaves, savoury, meaty, farmyard           |


**Display-name and ID rules**

- Normalise display: title case, keep PDF wording (e.g. “Black/white pepper”, “Baked/stewed fruits”, “Green bell pepper (capsicum)”).
- For “lime (juice or zest?)” use display name “Lime” (parenthetical is guidance, not a separate descriptor).
- Existing style-referenced descriptor IDs stay unchanged where possible (e.g. `desc_apple`, `desc_vanilla`, `desc_leather`, `desc_plum`, `desc_cherry`).
- For new descriptors: `id` is `desc_<slug>` (lowercase; spaces/slashes/punctuation -> underscores), e.g. `desc_orange_peel`, `desc_black_white_pepper`, `desc_baked_stewed_fruits`.
- For repeated display names across clusters, create cluster-specific IDs, e.g. `desc_toast_yeast` + `desc_toast_oak` + `desc_toast_bottle_age_white`, `desc_cheese_yeast` + `desc_cheese_malolactic`, `desc_mushroom_bottle_age_white` + `desc_mushroom_bottle_age_red`.
- For current taxonomy mismatch: keep `desc_black_pepper` for backward compatibility, and move/add pungent-spice parity terms as needed so page-2 wording is represented in `cluster_pungent_spice`.

## Implementation

1. **Preserve style-linked IDs** in [packages/db/src/seed.ts](packages/db/src/seed.ts) so `wine_style_aroma_descriptor` remains valid.
2. **Seed exact page-2 cluster parity** by adding every descriptor listed under each cluster, including repeated terms in multiple clusters.
3. **Use cluster-specific IDs for repeated terms** while keeping identical `displayName` text, so each row maps to exactly one `aromaClusterId`.
4. **Correct cluster placement for page-2 parity**, including pungent-spice mapping (e.g. pepper descriptors under `cluster_pungent_spice`) while preserving backwards-compatible IDs where referenced.
5. **Insert** all descriptors with existing `onConflictDoNothing()` to keep reruns idempotent.
6. **Optional**: add a short inline source note (“WSET Level 3 Wine-Lexicon, page 2”).

No schema or migration changes; no changes to wine style seed data (existing descriptor IDs continue to resolve). After implementation, run the seed script (e.g. `pnpm db:seed` or project equivalent) to populate new descriptors.