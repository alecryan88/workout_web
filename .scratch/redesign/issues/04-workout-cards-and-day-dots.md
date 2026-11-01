# 04: Workout cards with progress, and day dots

**What to build:** Make the workout cards and day strip show progress at a glance. The week summary gains an exercise count, a set count and a logged-set count (a set counts as logged when it has an actual reps or an actual weight value), computed by both the in-memory and Supabase stores (the Supabase store selects the nested workout exercises and sets in the week query and counts on the client; no schema migration). Each card shows the workout name in bold, "N exercises · x/y sets", a progress bar of logged over total sets, and a status-coloured left edge: green with a green check when done, blue when planned, grey and dimmed with a "Not done" label when missed (planned and dated before today). Each day in the strip with workouts shows a small dot: green when all that day's workouts are done, grey when any is missed, otherwise blue. The dot's state is also available as accessible text, not colour alone. See `.scratch/redesign/spec.md` (Week view: day strip, Week view: selected day's workouts; Implementation Decisions: Workout summary interface change, Derived states).

**Blocked by:** 03 (Day strip and selected day's workouts)

**Status:** ready-for-agent

- [ ] The workout summary includes exercise count, set count and logged-set count in both stores
- [ ] Cards show "N exercises · x/y sets" based on logged actuals
- [ ] Cards show a progress bar of logged over total sets
- [ ] Done cards show a green edge and a check; planned cards a blue edge; missed cards are dimmed with a grey edge and "Not done"
- [ ] Days with workouts show a dot: green when all done, grey when any missed, blue otherwise; days without workouts show no dot
- [ ] The dot state is exposed as accessible text
- [ ] Tests cover card counts and dot states through the UI; all tests pass
