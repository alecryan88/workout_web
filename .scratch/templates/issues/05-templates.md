# 05: Templates screen and template editor

**What to build:** The Templates tab lists templates (name, exercise count) and has a "New template" button. The template editor follows `design_inspo/template_exeaomple.png`: ✕ / Save top bar, large name with a "•••" menu (Edit name & notes, Delete; Add to calendar arrives in 06), and the shared exercise block with its "•••" menu, set table without ✓, rest dividers and "+ Add Set (2:00)", with "Add Exercises" at the bottom. The editor works on a local draft with explicit Save, and ✕ confirms before discarding unsaved edits. "Save as template" in the workout menu creates a template from a workout. Deleting a template leaves workouts alone (`template_id` set null). Template tables from the spec. See spec stories 11–19.

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] Template CRUD in both stores
- [ ] Editor draft/save/discard with confirmation
- [ ] Save as template from a workout copies exercises, sets and rest times
- [ ] Exercise block shared with the workout screen
- [ ] Tests cover create, edit, discard, save-as, delete
