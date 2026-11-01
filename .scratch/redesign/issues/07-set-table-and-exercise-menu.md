# 07: Set table, exercise actions menu and Edit sets

**What to build:** Redesign the inside of an expanded exercise. Each set row reads set number, target reps × lbs, actual reps × lbs, and a ✓ button. Target inputs are smaller and grey and actual inputs use normal text; targets stay editable inline. ✓ copies targets into actuals, and a row with actuals logged turns light green. Weight stays optional. "+ Add set" at the bottom still prefills from the previous set. The expanded exercise's header gets a "•••" button (accessible name "Actions for <exercise>") opening a sheet with Move up, Move down, Edit sets and Remove exercise; Move up is disabled on the first exercise and Move down on the last. The per-set remove button no longer appears in normal rows; "Edit sets" reveals a remove button on each set row, and a "Done" control leaves that mode. Existing accessible names for set inputs, "hit target", "Add set to …", "Move … up/down" and "Remove …" are kept. See `.scratch/redesign/spec.md` (Workout editor: set table; Implementation Decisions: Exercise row, Accessible names).

**Blocked by:** 02 (Bottom sheet and log out behind a gear), 06 (Collapsible exercise rows)

**Status:** resolved

- [ ] Set rows show set number, target reps × lbs, actual reps × lbs and ✓, with targets visually secondary and still editable
- [ ] ✓ fills actuals from targets; logged rows are tinted light green
- [ ] "+ Add set" still prefills from the previous set
- [ ] The expanded exercise's "•••" opens a sheet with Move up, Move down, Edit sets and Remove exercise, with Move up/down disabled at the ends
- [ ] Set remove buttons are hidden by default and shown only in Edit sets mode, which is left with "Done"
- [ ] Existing accessible names are preserved
- [ ] Tests updated for the menu and Edit sets mode; all tests pass
