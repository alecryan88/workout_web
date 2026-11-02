# 03: Per-set Previous column with tap-to-fill

**What to build:** Add a Previous column (Set | Previous | lbs | Reps | ✓) that shows "165 lb × 8" from the same set number in the most recent done workout containing the exercise before this workout's date, counting only completed sets, or "—" otherwise. Tapping a value fills that row. Remove the "Last:" summary line. Update `last_performance` to return ordered per-set values. See spec stories 33–36.

**Blocked by:** 02

**Status:** resolved

- [x] Previous matches by set number from the right workout
- [x] Unticked sets and non-done workouts are ignored
- [x] "—" shown for missing sets
- [x] Tap fills lbs and reps
- [x] Tests cover these rules
