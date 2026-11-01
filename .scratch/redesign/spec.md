# App Redesign

Status: resolved

## Problem Statement

The workout tracker works, but it looks and feels like a plain web form rather than a polished mobile app. The week view stacks seven day cards, so I have to scroll to find today and the workouts I care about are mixed in with rest days. The workout editor shows every exercise fully expanded with its whole set table, plus name, date and notes form fields at the top, so at the gym I scroll through a long page to find the next set to log. Actions like copy, delete and mark done sit at the bottom of the page, and logging out is a bare text link. I want the web app to look similar to the reference screenshots in `design_inspo/`, without adding new features.

## Solution

A visual and layout redesign of the web app, modelled on the reference screenshots in `design_inspo/`, keeping every existing feature and behaviour.

- **Week view.** A header with a date-range title, previous/next week arrows and a Mon–Sun day strip. I tap a day in the strip to select it, and below it I see only that day's workouts as cards with a status-coloured edge, exercise and set counts, a progress bar and a done check. Days with workouts show a coloured dot in the strip. A full-width "+ Add workout" button creates a workout on the selected day. A gear icon opens a sheet with Log out. A "Today" button appears when I'm viewing another week.
- **Workout editor.** A navigation bar with a back button, the workout name with save status, and a "•••" menu for Edit details, Copy and Delete. Notes show under the header when present. Each exercise is a compact row that expands one at a time to reveal its set table. "Mark done" sits in a bottom bar that stays on screen.
- **Sheets.** Copy, delete confirmation, edit details and log out all appear as bottom sheets.
- **Login.** Restyled to match.

## User Stories

### Overall look

1. As the user, I want the app to use the clean card-based look from the reference screenshots (light grey background, white rounded cards, blue accent, bold large headings), so that it feels polished on my phone.
2. As the user, I want the app to follow my phone's light/dark setting, with a matching dark variant, so that it is comfortable to use at night.
3. As the user, I want tap targets to stay large, so that I can still hit them with sweaty hands.
4. As the user, I want numeric fields to keep bringing up the number keypad, so that logging stays fast.
5. As the user, I want layouts to respect the phone's safe areas (notch, home indicator), so that nothing is hidden when the app runs from the home screen.

### Login

6. As the user, I want the login screen to show the app name as a large title above a card holding the email and password fields, so that it matches the rest of the app.
7. As the user, I want a full-width blue "Log in" button, so that the main action is obvious.
8. As the user, I want the wrong-credentials error to still appear clearly, so that I know to retry.

### Week view: header and navigation

9. As the user, I want the week view to show a date-range title like "Nov 2 – Nov 8", so that I know which week I'm looking at.
10. As the user, I want previous and next week arrows either side of the title, so that I can move between weeks.
11. As the user, I want swiping left and right to keep changing weeks, so that navigation still feels natural.
12. As the user, I want a "Today" button in the top-left when I'm viewing a week other than the current one, so that I can jump straight back.
13. As the user, I want the "Today" button hidden when I'm already on the current week, so that the header stays clean.
14. As the user, I want tapping "Today" to go to the current week and select today, so that I land on what's relevant now.
15. As the user, I want a gear icon in the top-right, so that settings are out of the way but easy to find.
16. As the user, I want the gear to open a sheet with "Log out", so that logging out is deliberate rather than an accidental tap on a link.

### Week view: day strip

17. As the user, I want a Mon–Sun strip showing each day's short weekday name and date number, so that I can see the whole week at a glance.
18. As the user, I want to tap a day in the strip to select it, so that I can see that day's workouts.
19. As the user, I want the selected day shown with a filled circle behind its number, so that I know which day I'm looking at.
20. As the user, I want today shown in blue text, so that I can find it instantly even when another day is selected.
21. As the user, I want today selected by default when the app opens on the current week, so that I see today's plan immediately.
22. As the user, I want Monday selected by default when I move to another week, so that the selection is predictable.
23. As the user, I want a small dot under each day that has workouts, so that I can spot training days and rest days at a glance.
24. As the user, I want the dot green when every workout that day is done, so that I can see completed days.
25. As the user, I want the dot grey when that day has a missed workout (planned, in the past), so that I can see what I skipped.
26. As the user, I want the dot blue when that day's workouts are all still planned and not missed, so that I can see upcoming training.

### Week view: selected day's workouts

27. As the user, I want a heading for the selected day, "Today's workouts" for today and "<Weekday>'s workouts" otherwise, so that I know whose list I'm reading.
28. As the user, I want each workout shown as a card, so that it's easy to tap.
29. As the user, I want each card to show the workout name in bold, so that I recognise it.
30. As the user, I want each card to show "N exercises · x/y sets", so that I know the size of the session and how much I've logged.
31. As the user, I want each card to show a progress bar of logged sets over total sets, so that I can see progress at a glance.
32. As the user, I want a done workout's card to show a green check and green edge, so that completed sessions stand out.
33. As the user, I want a planned workout's card to show a blue edge, so that upcoming sessions are distinct.
34. As the user, I want a missed workout's card dimmed with a grey edge and a "Not done" label, so that I can see what I missed.
35. As the user, I want multiple workouts on the same day listed in creation order, so that a morning and evening session both appear.
36. As the user, I want tapping a card to open that workout, so that I can view or log it.
37. As the user, I want an empty day to show a muted "Rest day" line, so that rest days are clearly empty.
38. As the user, I want a full-width blue "+ Add workout" button below the list, so that scheduling a workout on the selected day is one tap.
39. As the user, I want "+ Add workout" to create the workout and open it, so that I can build it right away.
40. As the user, I want returning from a workout to bring me back to that workout's week with its day selected, so that I don't lose my place.
41. As the user, I want load errors to still show clearly on the week view, so that I know when I'm offline.

### Workout editor: header

42. As the user, I want a navigation bar with "‹ Week" on the left, so that I can get back to the week view.
43. As the user, I want the workout name shown as the title of the navigation bar, so that I know which workout I'm in.
44. As the user, I want the save status ("Saving…", "Saved", or an error) shown in small text under the title, so that I know my entries are safe.
45. As the user, I want a "•••" button on the right that opens a menu with Edit details, Copy and Delete, so that less-used actions are out of the way.
46. As the user, I want the workout's notes, when present, shown as muted text under the header, so that I can read them without opening a sheet.
47. As the user, I want nothing shown under the header when there are no notes, so that the screen isn't cluttered.

### Workout editor: edit details

48. As the user, I want "Edit details" to open a sheet with the workout's name, date and notes fields, so that I can change them.
49. As the user, I want changes in the details sheet to autosave like the rest of the workout, so that I never need a save button.
50. As the user, I want changing the date in the details sheet to still reschedule the workout, so that I can do Monday's session on Tuesday.

### Workout editor: exercise rows

51. As the user, I want each exercise shown as a compact row, so that I can see the whole workout without scrolling.
52. As the user, I want a closed exercise row to show the exercise name, so that I recognise it.
53. As the user, I want a closed row to show "x/y sets" for an exercise in progress, so that I know what's left.
54. As the user, I want a closed row to show a green check once every set has actuals logged, so that finished exercises stand out.
55. As the user, I want a closed row to show the "Last: …" line when I've done the exercise before, so that I know what to lift before opening it.
56. As the user, I want a chevron on each row, so that I know it can be expanded.
57. As the user, I want tapping a row to expand it and reveal its set table, so that I can log it.
58. As the user, I want only one exercise expanded at a time, so that the screen stays focused.
59. As the user, I want tapping an expanded row's header to collapse it, so that I can get back to the overview.
60. As the user, I want the first exercise with unlogged sets to start expanded when I open a workout, so that I'm ready to log straight away.
61. As the user, I want every exercise to start collapsed when the workout is done or fully logged, so that I see a clean summary.

### Workout editor: set table

62. As the user, I want each set row laid out as set number, target reps × lbs, actual reps × lbs and a ✓ button, so that I can compare and log in one line.
63. As the user, I want target inputs styled smaller and grey and actual inputs in normal text, so that I can tell planned from performed at a glance.
64. As the user, I want to still be able to edit targets inline, so that I can plan sets ahead of time.
65. As the user, I want the ✓ button to copy targets into actuals, so that logging a set I hit exactly is a single tap.
66. As the user, I want a set row with actuals logged to turn light green, so that I can see which sets are done.
67. As the user, I want weight to remain optional, so that bodyweight exercises still work.
68. As the user, I want "+ Add set" at the bottom of the expanded exercise, prefilled from the previous set, so that adding identical sets stays quick.
69. As the user, I want a "•••" menu in the expanded exercise's header with Move up, Move down, Edit sets and Remove exercise, so that rarely-used actions don't crowd the set table.
70. As the user, I want Move up disabled on the first exercise and Move down disabled on the last, so that I can't make impossible moves.
71. As the user, I want "Edit sets" to reveal a remove button on each set row, so that I can delete sets without the button being in the way while logging.
72. As the user, I want to leave Edit sets mode with a "Done" control, so that the remove buttons go away again.

### Workout editor: adding exercises

73. As the user, I want a "+ Add exercise" row at the end of the exercise list, in the same card style, so that adding is easy to find.
74. As the user, I want tapping "+ Add exercise" to show the existing search field with autocomplete in its place, so that I can pick or create an exercise.
75. As the user, I want a newly added exercise to be expanded, so that I can add sets immediately.

### Workout editor: bottom bar

76. As the user, I want a bottom bar that stays on screen with a "Mark done" button, so that finishing a workout is always one tap away.
77. As the user, I want the bottom bar to show "Mark not done" when the workout is done, so that I can undo an accidental tap.
78. As the user, I want the editor content to leave space for the bottom bar, so that the last exercise isn't hidden behind it.

### Sheets

79. As the user, I want Copy to open a bottom sheet with the existing date picker and "use actuals as targets" option, so that copying works as before.
80. As the user, I want Delete to open a bottom sheet confirmation, so that I don't delete a workout by accident.
81. As the user, I want sheets to slide up from the bottom over a dimmed backdrop, so that they feel like part of a mobile app.
82. As the user, I want tapping the backdrop or a Cancel/Close control to dismiss a sheet, so that I can back out easily.
83. As the user, I want sheets to respect the bottom safe area, so that their buttons aren't hidden behind the home indicator.

## Implementation Decisions

- **Scope**: Layout and look only. No new screens, no tab bar, no supersets, no exercise images, no new workout features. The only data change is extra counts in the week summary.
- **Style system**: Replace the current dark-first palette with a new set of colour tokens defined as CSS custom properties, matching the reference screenshots: page background, card surface, separator, primary and secondary text, blue accent, green for done, grey for missed, red for danger. Provide a dark variant under the light/dark media query. Keep the large tap-target minimum and 16px input font size (stops mobile browsers zooming in when a field is focused). Continue with plain CSS; no CSS framework or component library is introduced.
- **Workout summary interface change**: `WorkoutSummary` gains `exerciseCount`, `setCount` and `loggedSetCount`. A set counts as **logged** when it has an actual reps or an actual weight value. Both store implementations (in-memory and Supabase) compute these. The Supabase store gets them by selecting the nested workout exercises and sets in the week query and counting on the client. No schema migration.
- **Derived states**: "Missed" stays derived (planned and dated before today). The day dot colour is derived from that day's summaries: all done → green, any missed → grey, otherwise → blue.
- **Week view state**: The viewed week stays in the URL query (`week`) as today. The selected day is added to the URL query too (e.g. `day`), so that returning from a workout restores the week and selected day. Default selection is today on the current week and Monday on other weeks. Navigating back from the editor goes to that workout's week and day.
- **Week view composition**: The week view is split into a header (Today button, gear, date-range title with arrows), a day strip component, and a day's workout list with workout cards and the add button. Swipe-to-change-week remains on the view.
- **Editor composition**: The editor gets a navigation bar, a notes line, a list of collapsible exercise rows, an add-exercise row wrapping the existing exercise picker, and a bottom action bar. Name, date and notes fields move into an Edit details sheet and keep their current autosave behaviour.
- **Expanded-exercise state**: The editor holds which single exercise index is expanded (or none). Initial value is the first exercise with any set lacking actuals, unless the workout is done, in which case none. Adding an exercise expands it. Removing or moving exercises keeps the same exercise expanded.
- **Exercise row**: The exercise card component becomes a collapsible row. When collapsed it shows the name, the "x/y sets" or done check, the last-performance line and a chevron. When expanded it shows the set table, "+ Add set", and a per-exercise "•••" menu with Move up, Move down, Edit sets and Remove exercise. Edit sets is local state per exercise that shows a remove button on each set row.
- **Sheet component**: One shared bottom-sheet component with a dimmed backdrop, title, content, and dismiss on backdrop tap or Cancel. It is exposed with a dialog role and an accessible name. Used by Copy, Delete confirmation, Edit details, Log out, and the workout and exercise "•••" action menus.
- **Accessible names**: Keep existing accessible names where the control still exists (e.g. "Previous week", "Next week", "Back to week", per-set input labels, "hit target", "Add set to …", "Move … up/down", "Remove …"), so that behaviour tests keep reading naturally. New controls get descriptive accessible names (e.g. "Settings", "Workout actions", "Actions for <exercise>", day strip buttons named by full day label like "Wed Nov 4" with pressed/current state).
- **Login**: Same behaviour and fields; restyled to a large-title plus card layout.
- **No behaviour regressions**: Autosave, offline/error messages, copy options, delete confirmation, last-performance rules, and unmarking done all behave exactly as in v1.

## Testing Decisions

- **Seam**: The existing single seam, the data-store interface. Tests render the real app with the in-memory store and drive it through the UI as the user would. No new seams are introduced.
- **What makes a good test**: It asserts on what the user sees and can do (text on screen, which workouts appear for the selected day, values in fields, which exercise is expanded) after realistic interactions. It never asserts on component internals, CSS classes, state shape, or which store methods were called. Pure styling is not tested.
- **Existing tests to update**: The week-view tests assume all seven days are rendered as regions with their workouts visible at once. They are updated to select a day in the strip and then check that day's workouts. Tests that reach the name, date or notes fields, copy, delete or log out now open the relevant sheet or menu first. Logging tests open (or rely on the auto-expanded) exercise before entering set values.
- **New behaviour to cover**:
  - The day strip shows the week, today is marked current, and today is selected by default; Monday is selected after changing week.
  - Selecting a day shows only its workouts, with the right heading, and "Rest day" for empty days.
  - Workout cards show "N exercises · x/y sets" based on logged actuals.
  - Day markers reflect done / missed / planned for that day (via accessible description or label text, not colour).
  - "Today" appears only off the current week and returns to the current week with today selected.
  - "+ Add workout" creates a workout on the selected day.
  - Returning from a workout restores its week and selected day.
  - Only one exercise is expanded at a time; the first exercise with unlogged sets starts expanded; a done workout starts with all collapsed; a newly added exercise is expanded.
  - A collapsed exercise shows "x/y sets" or a done state and the last-performance line.
  - Edit sets mode reveals set removal.
  - Notes appear under the header when present and not otherwise.
  - Edit details, Copy, Delete and Log out work through sheets and can be cancelled.
- **Prior art**: The existing app-level tests and the shared test harness (in-memory store, fake "today", seeding helpers) are the model for all new and updated tests.

## Out of Scope

- Bottom tab bar, and any Templates, History, Exercises or Stats screens
- Supersets and exercise grouping
- Exercise thumbnails or images
- Workout start times or durations
- Rest timers, auto-progression, or any other new workout features
- Changes to the database schema
- Swipe gestures on rows (e.g. swipe to delete)
- Animations beyond the sheet slide-up and row expand/collapse
- A theme toggle inside the app

## Further Notes

- Reference images: `design_inspo/` (a "Today" week screen and a "Template" exercise list screen). They guide the layout and visual language only; features shown there that aren't in v1 are out of scope.
- Decisions were settled in a grilling session; every recommended option was accepted.
