# 02: Single lbs × reps per set with a ✓

**What to build:** Replace target/actual with one `weight`/`reps` pair plus `completed` per set (migration `0002` part 1 with the data migration described in the spec). The workout screen shows every exercise expanded (removing the single-expanded-row behaviour) with the columns Set | lbs | Reps | ✓. Values start from the plan, ✓ toggles completed, ticked rows are highlighted, and "+ Add Set" prefills from the previous set. Week summaries and "logged" counts use completed sets. Copy changes to "copy ticked values", and copies always start unticked. The "Last:" line keeps working off completed sets until 03 replaces it. See spec stories 26–31, Implementation Decisions: Schema (`sets`), Types, Expanded rows removed.

**Blocked by:** none

**Status:** resolved

- [x] Migration converts existing sets as specified
- [x] Both stores and the RPCs use the new set shape
- [x] All exercises render expanded; ✓ toggles completed; values editable before and after ticking
- [x] Week cards and dots count completed sets
- [x] Copy uses ticked values when chosen and creates unticked sets
- [x] Tests updated and passing

## Comments

- Copy's option is "Copy ticked values only": when checked, only ticked sets are copied (with their lbs/reps); when unchecked, every set is copied with its current values. Copies always start unticked. With a single lbs × reps pair there is no separate plan to fall back to, so this was the only meaningful reading of "copy ticked values"; revisit in triage.
