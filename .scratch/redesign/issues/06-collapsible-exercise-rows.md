# 06: Collapsible exercise rows

**What to build:** Turn each exercise in the editor into a compact row, like the reference "Template" screenshot but without thumbnails. A collapsed row shows the exercise name, "x/y sets" while in progress or a green check once every set has actuals, the "Last: …" line when the exercise has been done before, and a chevron. Tapping a row expands it to show its existing set table and "+ Add set"; tapping the expanded header collapses it. Only one exercise is expanded at a time. When a workout opens, the first exercise with any unlogged set starts expanded; if the workout is done or every set is logged, all rows start collapsed. Moving or removing exercises keeps the same exercise expanded. A "+ Add exercise" row at the end of the list, in the same card style, turns into the existing search field with autocomplete when tapped; the newly added exercise is expanded. Existing per-exercise move/remove controls remain usable until ticket 07 moves them into a menu. See `.scratch/redesign/spec.md` (Workout editor: exercise rows, Workout editor: adding exercises; Implementation Decisions: Expanded-exercise state, Exercise row).

**Blocked by:** 05 (Editor top bar, notes, actions menu and bottom bar). This ordering avoids conflicting changes to the same editor screen.

**Status:** ready-for-agent

- [ ] Collapsed rows show name, "x/y sets" or a done check, the last-performance line when there is one, and a chevron
- [ ] Tapping a row expands it; tapping the expanded header collapses it
- [ ] Only one exercise is expanded at a time
- [ ] On open, the first exercise with unlogged sets is expanded; a done or fully logged workout starts with all rows collapsed
- [ ] Moving or removing exercises keeps the same exercise expanded
- [ ] "+ Add exercise" reveals the search field; picking or creating an exercise adds it expanded
- [ ] Logging tests open (or rely on the auto-expanded) exercise before entering values; new tests cover expand/collapse rules; all tests pass
