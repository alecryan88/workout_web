# Templates, Exercise Library and Active Workouts

Status: ready-for-agent

## Problem Statement

I run multi-week programs, but the app only knows about workouts that sit on a date. To repeat "Push Day" across a program I have to copy a real, dated workout to other dates one date at a time, and the routine I'm repeating is mixed in with my logs. Exercises are just names typed into a picker, so I can't tell "Bench Press (Barbell)" from "Bench Press (Dumbbell)", and I have nowhere to tidy them up. At the gym the set table splits target and actual columns, only shows a one-line summary of last time, and has no timer for the session or for rest between sets.

## Solution

Three connected models:

- **Exercise library.** Exercises are managed records with a name, equipment, an optional muscle group and notes. They are browsed and edited on an Exercises screen and can still be created inline from the picker.
- **Templates.** A template is a reusable workout with no date: a name, notes and an ordered list of exercises, each with its sets (lbs × reps) and a rest time. It is built in a template editor modelled on `design_inspo/template_exeaomple.png`.
- **Scheduling from templates.** Adding a template to the calendar, either on single dates or on chosen weekdays for N weeks, creates dated workouts that are snapshots of the template.

Dated workouts get a new look and lifecycle modelled on `design_inspo/active_workout_example.png`. Each set is one lbs × reps pair with a ✓, and a "Previous" column shows what you did last time for that set. **Start** begins a timed in-progress session, **Finish** completes it, and a rest timer counts down after each ticked set.

## User Stories

### Navigation

1. As the user, I want a bottom tab bar with Workouts, Templates and Exercises, so that I can move between my calendar, my routines and my exercise list.

### Exercise library

2. As the user, I want an Exercises screen listing every active exercise alphabetically, with a search field, so that I can find and manage exercises.
3. As the user, I want each exercise to have a name, an equipment type (barbell, dumbbell, machine, cable, bodyweight, other), an optional muscle group (chest, back, legs, shoulders, arms, core, full body) and optional notes, so that I can tell variants apart and keep form cues.
4. As the user, I want exercises shown as "Name (Equipment)", e.g. "Incline Bench Press (Barbell)", so that variants are clear everywhere.
5. As the user, I want name + equipment to be unique (case-insensitive), so that "Bench Press (Barbell)" and "Bench Press (Dumbbell)" can both exist with separate histories.
6. As the user, I want to create, edit and delete exercises from the Exercises screen, so that I can keep the list tidy.
7. As the user, I want deleting an exercise that has been used in a workout or template to archive it (hidden from the list and picker, history kept), so that I never lose logged data.
8. As the user, I want deleting an unused exercise to remove it completely, so that typos don't linger.
9. As the user, I want to still create an exercise by typing a new name in the picker, which then appears in the library with equipment "other" and empty fields, so that I'm not slowed down mid-workout.
10. As the user, I want bodyweight exercises to label the weight column "+lbs", so that I can record added weight.

### Templates

11. As the user, I want a Templates screen listing my templates with their exercise count, so that I can see my routines.
12. As the user, I want to create a template from scratch, so that I can define a routine before I ever do it.
13. As the user, I want to save an existing workout as a new template ("Save as template" in the workout menu), so that I can turn a session I liked into a routine.
14. As the user, I want the template editor to look like the template reference screenshot: ✕ and Save in the top bar, a large name with a "•••" menu, and each exercise with a "•••" menu, a set table (Set | Previous | lbs | Reps), rest dividers and "+ Add Set (2:00)", with "Add Exercises" at the bottom, so that building routines is fast.
15. As the user, I want a template to hold its name, notes, ordered exercises, each exercise's sets (lbs × reps, both optional) and each exercise's rest time, so that the routine is a complete plan.
16. As the user, I want Save to store the template and ✕ to discard my changes, with a confirmation if there are unsaved edits, so that I can experiment safely.
17. As the user, I want the template's "•••" menu to offer Edit name & notes, Add to calendar and Delete, so that template actions are together.
18. As the user, I want each exercise's "•••" menu in the template to offer Move up, Move down, Edit sets and Remove exercise, as in the workout editor, so that both editors behave the same.
19. As the user, I want deleting a template to leave already-scheduled workouts untouched, so that my calendar doesn't change unexpectedly.

### Scheduling from templates

20. As the user, I want "Add to calendar" on a template to let me add single dates, so that I can schedule one-off sessions.
21. As the user, I want "Add to calendar" to also let me pick weekdays, a start date and a number of weeks (e.g. Mon & Thu for 8 weeks from Nov 2), so that I can lay out a whole program in one go.
22. As the user, I want to see how many workouts will be created before confirming, so that I don't accidentally create dozens.
23. As the user, I want each scheduled workout to be a snapshot of the template at that moment, so that later template edits don't rewrite planned or logged sessions.
24. As the user, I want "+ Add workout" on the week view to ask whether to start from a template or empty, so that scheduling a routine on a day is quick.
25. As the user, I want every scheduled week to use the template's values exactly, so that I control progression myself.

### Workout screen: layout

26. As the user, I want the workout screen to look like the active-workout reference screenshot: a large name with a "•••" menu, the date, every exercise shown expanded with its "•••" menu and set table, rest dividers, and "+ Add Set", so that I can log without expanding rows.
27. As the user, I want each set row to show set number, Previous, lbs, reps and a ✓, so that I can log a set in one line.
28. As the user, I want a set's lbs and reps to start with the planned values, so that logging a set I hit is a single tap on ✓.
29. As the user, I want to change lbs or reps before or after ticking ✓, so that the record matches what I actually did.
30. As the user, I want a ticked set's row highlighted, so that I can see which sets are done.
31. As the user, I want unticked sets to count as not done, so that skipped sets don't pollute my history.
32. As the user, I want the workout's "•••" menu to keep Edit details, Copy and Delete, and gain Save as template, so that existing actions are still there.

### Workout screen: Previous column

33. As the user, I want each set row's Previous column to show the lbs × reps of the same set number from the most recent completed session of that exercise before this workout's date, e.g. "165 lb × 8", so that I know what to beat.
34. As the user, I want "—" when there is no matching previous set, so that the column stays honest.
35. As the user, I want tapping a Previous value to copy it into that row's lbs and reps, so that repeating last time is one tap.
36. As the user, I want only ticked sets from finished workouts to count as previous, so that planned or skipped sets never show up.

### Active workout lifecycle

37. As the user, I want a planned workout to show a **Start** button, so that I can begin a timed session.
38. As the user, I want Start to put the workout in progress and record the start time, so that the session is timed.
39. As the user, I want an in-progress workout to show the elapsed time in the top bar and under the date, plus a green **Finish** button, so that I can see how long I've been training.
40. As the user, I want the elapsed timer to keep counting correctly after the phone locks or the app reloads, so that the duration is accurate.
41. As the user, I want only one workout in progress at a time, with Start on another workout telling me to finish the current one first and offering to open it, so that I can't time two sessions.
42. As the user, I want Finish to ask for confirmation when some sets are unticked, so that I don't finish early by accident.
43. As the user, I want Finish to mark the workout done and save its duration, so that the week view shows it completed.
44. As the user, I want to tick sets on a planned workout without pressing Start (for example when logging a past session), and still Finish it, with no duration recorded, so that timing is optional.
45. As the user, I want a done workout to show its duration and a "Mark not done" option in its menu, so that I can fix an accidental Finish.
46. As the user, I want the week view to show in-progress workouts distinctly, so that I can get back into an active session.

### Rest timer

47. As the user, I want each exercise to have a rest time (default 2:00), shown as dividers between sets and in "+ Add Set (2:00)", so that rest is part of the plan.
48. As the user, I want tapping a rest divider to change that exercise's rest time, so that heavy lifts can rest longer.
49. As the user, I want ticking a set during an in-progress workout to start a countdown in the divider below it and on the timer button in the top bar, so that I know when to start my next set.
50. As the user, I want the timer button to let me add or subtract 15 seconds or skip the rest, so that I can adjust on the fly.
51. As the user, I want the phone to vibrate (where the browser supports it) when rest ends, so that I notice without staring at the screen.

### Look

52. As the user, I want the app restyled so that dark mode matches the reference screenshots and light mode uses the same layout in light colours, still following my phone's setting, so that the whole app feels consistent.

## Implementation Decisions

- **Glossary**: Terms are defined in `GLOSSARY.md`: Exercise, Template, Workout, Set, Completed set, In-progress workout, Rest time.
- **Schema (migration `0002`)**:
  - `exercises`: add `equipment` (text, check in the enum, default `'other'`), `muscle_group` (nullable text, check in the enum), `notes` (nullable text), `archived_at` (nullable timestamptz). Replace the unique index on `lower(name)` with one on `(lower(name), equipment)`.
  - `templates`: id, name, notes, created_at, updated_at.
  - `template_exercises`: id, template_id (cascade), exercise_id, position, rest_seconds (default 120).
  - `template_sets`: id, template_exercise_id (cascade), position, weight, reps.
  - `workouts`: `status` check becomes `planned | in_progress | done`; add `started_at`, `finished_at` (nullable timestamptz) and `template_id` (nullable, `on delete set null`). Duration is `finished_at - started_at`. A partial unique index allows at most one `in_progress` row.
  - `workout_exercises`: add `rest_seconds` (default 120).
  - `sets`: replace `target_*`/`actual_*` with `weight`, `reps` and `completed boolean not null default false`. Data migration: rows with `actual_reps` or `actual_weight` → `weight/reps` = actuals, `completed = true`; other rows → `weight/reps` = targets, `completed = false`.
  - RPCs: update `save_workout`, `copy_workout` (the "use actuals as targets" option becomes "copy ticked values", and copies always start unticked) and `last_performance` (now returns per-set completed values from the latest `done` workout before the date). Add `save_template`, `schedule_template(template_id, dates[])`, `start_workout`, `finish_workout`. Exercise create/update/delete-or-archive go through RPCs or direct table writes under the same RLS.
- **Types**: `SetEntry` becomes `{ weight, reps, completed }`. `isLogged` becomes "completed". `WorkoutStatus` gains `in_progress`. `Workout` gains `startedAt`, `finishedAt`, `templateId` and per-exercise `restSeconds`. `Exercise` gains `equipment`, `muscleGroup`, `notes`. New `Template`, `TemplateSummary`. `LastPerformance` keeps the date and becomes an ordered per-set list.
- **Store interface additions**: list/get/save/delete templates; create template from workout; schedule template to dates; start/finish workout; get in-progress workout; list/update/delete-or-archive exercises. `findOrCreateExercise(name)` keeps working for inline creation (equipment `other`). Both the in-memory and Supabase stores implement everything.
- **Scheduling dates**: The recurrence UI only builds a list of dates on the client (weekdays × N weeks from a start date, Monday-based weeks, local dates). The store receives plain dates. Nothing recurring is stored.
- **Snapshot**: Scheduling copies the template's exercises, sets and rest times into each new workout and records `template_id` for reference only. No live sync.
- **Editors**: The template editor and the workout screen share the exercise block (header, "•••" menu, set table, rest dividers, add set) and the exercise picker. The template editor hides ✓ and Previous-driven fill is still allowed. The template editor holds a local draft and saves explicitly. The workout screen keeps debounced autosave.
- **Expanded rows removed**: Every exercise is always expanded. The single-expanded-row state from the redesign (issue 06) is removed.
- **Timers**: The elapsed time is derived from `started_at` and the current time on each tick, never accumulated. The rest countdown is client-only state holding an end timestamp, so it survives re-renders. If the page reloads it is lost, which is accepted. Vibration uses `navigator.vibrate` when it's available. There are no background notifications.
- **Week view**: Summaries count completed sets. In-progress workouts get their own card treatment and day-dot colour. "Missed" still means `planned` and dated before today. An in-progress workout from an earlier date is not shown as missed.
- **Tab bar**: The bottom tab bar is shown on the Workouts, Templates and Exercises screens and hidden inside the workout and template editors. Routes stay hash-based.

## Testing Decisions

- **Seam**: One seam, the existing data-store interface. Tests render the real app with the in-memory store and drive it through the UI. Fake timers control "today" and the elapsed and rest timers; elapsed time is derived from the start time and the clock, so no separate clock seam is needed. Recurrence date expansion, Previous lookup, snapshot behaviour and the single in-progress rule are all verified through the UI, not unit-tested separately.
- **Good tests** assert on what the user sees and can do, never on store calls or internals.
- **Prior art**: The existing app-level tests and the shared test harness (in-memory store, fake "today", seeding helpers).
- **Existing tests to update**: Logging, history, copy, summary and editor tests move from target/actual inputs to lbs/reps + ✓, and from the "Last:" line to the Previous column. The expand/collapse tests from the redesign are replaced.
- **New behaviour to cover**: exercise library CRUD, archive vs delete, uniqueness by name + equipment, inline create; template create/edit/save/discard, save workout as template, delete template keeps workouts; scheduling single dates and weekdays × weeks with the correct count and dates, and that snapshots don't change when the template is edited; ticking sets and editing values; Previous per set, "—", tap-to-fill, unticked sets excluded; Start/Finish, single in-progress rule, unticked-sets confirmation, duration shown, finishing without Start; rest countdown starts on tick, adjust/skip, and the rest time can be edited.
- **Not automatically tested**: The Supabase migration and RPCs, checked manually against the real project, including the data migration of existing sets. Vibration.

## Out of Scope

- A Program entity (grouping templates into a named block with a week counter)
- Live sync from templates to scheduled workouts
- Automatic progression rules
- Supersets (chain icon) and the template lock column
- Exercise charts and history screens, images and media
- Background or lock-screen rest notifications, and rest timers that survive a reload
- Kilograms, RPE, cardio fields
- A theme toggle inside the app

## Further Notes

- Reference images: `design_inspo/template_exeaomple.png` (template editor) and `design_inspo/active_workout_example.png` (in-progress workout). They are a guide to layout and visual language. Features shown in them that are listed under Out of Scope are excluded.
- This supersedes these items in `SPEC.md` Out of Scope: "Workout templates", "rest timers", and "workout start times or durations" from the redesign spec.
- Decisions were settled in a grilling session (Q1–Q20). These were not asked and were taken as defaults, so revisit them in triage: the tab bar for navigation (story 1), equipment "other" for inline-created exercises (9), the template "•••" contents (17), the Finish confirmation for unticked sets (42), finishing without Start (44), ±15s/skip on the rest timer (50), and Copy changing to "copy ticked values".
