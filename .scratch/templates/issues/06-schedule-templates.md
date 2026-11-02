# 06: Add template to calendar

**What to build:** "Add to calendar" from a template's "•••" menu opens a sheet with two modes: single dates (chips, like Copy) and recurring (weekday toggles, start date, number of weeks). It shows "Creates N workouts" before you confirm. The client expands this into dates, and `scheduleTemplate` creates snapshot workouts with `template_id`. "+ Add workout" on the week view offers "From template…" or "Empty workout". See spec stories 20–25, Implementation Decisions: Scheduling dates, Snapshot.

**Blocked by:** 05

**Status:** resolved

- [x] Single-date and weekdays × weeks modes produce the right dates and count
- [x] Scheduled workouts copy name, notes, exercises, sets and rest times, unticked
- [x] Editing the template afterwards doesn't change scheduled workouts
- [x] Week "+ Add workout" can start from a template
- [x] Tests cover the above

## Comments

- Weekly mode counts N Monday-based weeks starting with the week that contains the start date; days in that first week before the start date are skipped (Mon & Thu × 3 weeks from Wed Nov 4 → Nov 5, 9, 12, 16, 19). Weeks are capped at 52.
- Scheduling from the template editor saves unsaved edits first, so the snapshot matches what's on screen.
- "From template…" on the week view opens the new workout straight away, like "Empty workout".
