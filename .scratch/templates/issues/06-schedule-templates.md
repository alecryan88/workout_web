# 06: Add template to calendar

**What to build:** "Add to calendar" from a template's "•••" menu opens a sheet with two modes: single dates (chips, like Copy) and recurring (weekday toggles, start date, number of weeks). It shows "Creates N workouts" before you confirm. The client expands this into dates, and `scheduleTemplate` creates snapshot workouts with `template_id`. "+ Add workout" on the week view offers "From template…" or "Empty workout". See spec stories 20–25, Implementation Decisions: Scheduling dates, Snapshot.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Single-date and weekdays × weeks modes produce the right dates and count
- [ ] Scheduled workouts copy name, notes, exercises, sets and rest times, unticked
- [ ] Editing the template afterwards doesn't change scheduled workouts
- [ ] Week "+ Add workout" can start from a template
- [ ] Tests cover the above
