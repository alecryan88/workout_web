# Workout Tracker v1

## Problem Statement

I want to plan and log my workouts from my phone. Today I have no simple place to schedule what I'm going to do each day of the week, record the weights, reps and sets I actually hit, and look back at what I did last time so I know what to lift next. Existing apps are bloated, social, or subscription-based; I want a small, private tool that only I use and that costs nothing to host.

## Solution

A mobile-first web app, installable to my phone's home screen, that I log into with email and password. It opens on a week view (Monday to Sunday) showing the workouts scheduled on each day. I can create a workout on any date, give it a name and notes, add exercises from my own saved exercise list, and add sets with target reps and weight. At the gym I open the workout, fill in the actual reps and weight for each set, and mark it done. While logging, each exercise shows what I did the last time I performed it. I can copy any workout to other dates so my routine is quick to schedule. Past workouts I never completed show as dimmed "not done". Data lives in Supabase so it's available from any device; the app is hosted free on GitHub Pages.

## User Stories

### Access

1. As the user, I want to log in with my email and password, so that only I can see and change my workouts.
2. As the user, I want to stay logged in on my phone between visits, so that I don't have to type my password at the gym.
3. As the user, I want to log out, so that I can end my session on a shared or borrowed device.
4. As the user, I want unauthenticated visitors to see only the login screen, so that my data is never exposed.
5. As the user, I want new account sign-ups to be impossible, so that nobody else can create an account and read my data.
6. As the user, I want a clear error when my email or password is wrong, so that I know to retry.

### Installing and using on a phone

7. As the user, I want to add the app to my phone's home screen, so that it opens full-screen like a native app.
8. As the user, I want the layout designed for a phone-sized screen, so that I can use it one-handed between sets.
9. As the user, I want tap targets large enough to hit with sweaty hands, so that I don't mis-tap while logging.
10. As the user, I want numeric fields to bring up the number keypad, so that entering reps and weight is fast.
11. As the user, I want a clear message when I have no connection, so that I know my changes didn't save.

### Week view

12. As the user, I want the app to open on the current week, so that I immediately see what's scheduled.
13. As the user, I want the week to run Monday to Sunday, so that it matches how I plan my training.
14. As the user, I want each day to list its workouts by name, so that I can see my plan at a glance.
15. As the user, I want today visually highlighted, so that I can find it instantly.
16. As the user, I want to move to the previous and next week with arrows, so that I can review past weeks and plan ahead.
17. As the user, I want to swipe left and right to change weeks, so that navigation feels natural on a phone.
18. As the user, I want a way to jump back to the current week, so that I don't have to swipe repeatedly after browsing.
19. As the user, I want completed workouts marked as done, so that I can see what I've accomplished this week.
20. As the user, I want past workouts I never completed shown dimmed as "not done", so that I can see what I missed.
21. As the user, I want future planned workouts shown normally, so that they're distinguishable from missed ones.
22. As the user, I want empty days to be clearly empty, so that I can see rest days.
23. As the user, I want to tap a workout to open it, so that I can view or log it.
24. As the user, I want to add a workout to a specific day from the week view, so that scheduling is one tap away.
25. As the user, I want more than one workout on the same day, so that I can schedule a morning and evening session.

### Creating and editing workouts

26. As the user, I want to give a workout a name like "Push Day", so that I can recognise it in the week view.
27. As the user, I want to add optional notes to a workout, so that I can record how I felt or what to change.
28. As the user, I want to change a workout's date, so that I can reschedule it.
29. As the user, I want to add exercises to a workout, so that I can build out the session.
30. As the user, I want to remove an exercise from a workout, so that I can fix mistakes or drop a movement.
31. As the user, I want to reorder exercises within a workout, so that they match the order I'll do them.
32. As the user, I want to add sets to an exercise, so that I can plan how many sets I'll do.
33. As the user, I want a new set to prefill from the previous set, so that adding identical sets is quick.
34. As the user, I want to remove a set, so that I can adjust volume.
35. As the user, I want to enter target reps and target weight for each set ahead of time, so that I know what to aim for at the gym.
36. As the user, I want weight to be optional, so that I can plan bodyweight exercises like pull-ups.
37. As the user, I want all weights in pounds, so that numbers match the plates I use.
38. As the user, I want to delete a workout, so that I can remove plans I no longer need.
39. As the user, I want confirmation before deleting a workout, so that I don't lose data by accident.
40. As the user, I want to edit a workout even after it's marked done, so that I can correct mistakes.

### Exercise list

41. As the user, I want exercise names to autocomplete from exercises I've used before, so that I type less and stay consistent.
42. As the user, I want typing a name that doesn't exist to create a new exercise, so that I don't need a separate management screen.
43. As the user, I want exercise matching to be case-insensitive, so that "bench press" and "Bench Press" are the same exercise.
44. As the user, I want each exercise to be a single shared record, so that history for that exercise is gathered across all workouts.

### Logging at the gym

45. As the user, I want to enter actual reps and actual weight for each set, so that I record what I really did.
46. As the user, I want the target values visible next to the actual fields, so that I can compare as I go.
47. As the user, I want a quick way to fill actuals with the targets when I hit them exactly, so that logging is a single tap.
48. As the user, I want to log actuals for sets I didn't plan, by adding a set during the workout, so that bonus sets get recorded.
49. As the user, I want to leave actuals blank for sets I skipped, so that the record reflects reality.
50. As the user, I want my entries saved without leaving the screen, so that I don't lose data if my phone locks.
51. As the user, I want to mark a workout as done, so that it shows as completed in the week view.
52. As the user, I want to unmark a workout as done, so that I can fix an accidental tap.
53. As the user, I want to log a workout on a day other than its scheduled day, so that I can do Monday's session on Tuesday by changing the date.

### History while logging

54. As the user, I want each exercise in a workout to show my last performance of it, e.g. "Last: 3×8 @ 185 on Oct 27", so that I know what to lift today.
55. As the user, I want "last performance" to come from the most recent completed workout before this workout's date that contains the exercise, so that planned or future sessions don't pollute it.
56. As the user, I want last performance to use actual values, so that it reflects what I really did rather than what I planned.
57. As the user, I want a sensible summary when sets differed (e.g. "8, 8, 6 @ 185" or varying weights), so that the line stays truthful.
58. As the user, I want no "last" line for an exercise I've never completed, so that the screen isn't cluttered with empty placeholders.

### Copying workouts

59. As the user, I want to copy a workout to another date, so that I can reuse a routine without rebuilding it.
60. As the user, I want to copy a workout to several dates at once, so that I can schedule a routine for multiple weeks quickly.
61. As the user, I want a copied workout to keep its name, notes, exercises, order and target sets, so that the copy is a ready-to-use plan.
62. As the user, I want a copied workout to start as planned with actuals cleared, so that I log it fresh.
63. As the user, I want copying a completed workout to use its actuals as the new targets, as an option, so that I can progress from what I actually lifted.

## Implementation Decisions

- **Architecture**: Static single-page app built with React, Vite and TypeScript, deployed to GitHub Pages from a public GitHub repo via a GitHub Actions workflow on push to the main branch. No custom server.
- **Routing**: Client-side routing that works on GitHub Pages without server rewrites (hash-based routing, or the 404 fallback trick). The app is served under the repo sub-path, so the build base path must match.
- **Backend**: Supabase provides Postgres and email/password auth. The app talks to Supabase directly from the browser using the public anon key, which is shipped in the bundle and is not a secret.
- **Single user**: The app will only ever have one user. Sign-ups are disabled in Supabase; the single account is created manually in the Supabase dashboard. No `user_id` columns.
- **Security**: Row-level security is enabled on every table, with policies allowing all operations to authenticated users only and nothing to anonymous users. This is the only protection for the data, since the anon key is public.
- **Session**: Supabase's persisted session keeps the user logged in across visits; the app redirects to the login screen when there is no session.
- **Schema** (logical):
  - `exercises`: id, name (unique, case-insensitive), created_at.
  - `workouts`: id, date, name, notes (nullable), status (`planned` | `done`), created_at, updated_at.
  - `workout_exercises`: id, workout_id (cascade delete), exercise_id, position.
  - `sets`: id, workout_exercise_id (cascade delete), position, target_reps, target_weight, actual_reps, actual_weight (all nullable integers or decimals; weight in lbs).
- **Workout lifecycle**: A workout is a single record that starts `planned` and becomes `done` when the user marks it. There is no `skipped` status. "Not done" is derived for display: status is `planned` and the date is before today.
- **Data store module**: All persistence goes through one data-store interface. The rest of the app depends only on this interface. Two implementations: a Supabase-backed store for production and an in-memory store for tests and local development. Operations:
  - list workouts in a date range (summaries for the week view)
  - get a workout with its exercises and sets
  - create, update (including exercises and sets) and delete a workout
  - set a workout's status
  - copy a workout to one or more dates, with an option to use actuals as targets
  - search exercises by name prefix and find-or-create an exercise by name
  - get last performance of an exercise before a given date
- **Week logic**: Weeks start Monday, computed in the device's local time zone. Dates are stored as calendar dates (no time component) to avoid time-zone drift.
- **Saving**: Workout edits save automatically (debounced) instead of needing an explicit save button, so data isn't lost when the phone locks. Save failures surface a visible message.
- **PWA**: A web app manifest and icons so the app can be installed to the home screen and launched standalone. No service-worker offline caching or offline writes.
- **Units**: Pounds only, with no unit setting.

## Testing Decisions

- **Seam**: One seam, the data-store interface. Tests render the real app with the in-memory store and drive it through the UI the way the user would. No other test seams are introduced; week date math, "not done" derivation, last-performance summarising and copy behaviour are all verified through these app-level tests.
- **What makes a good test**: It asserts on what the user sees and can do (text on screen, workouts in a day, values in fields) after realistic interactions. It never asserts on component internals, state shape, or which store methods were called. A refactor that keeps behaviour identical should not break any test.
- **Tooling**: Vitest with React Testing Library and user-event, in a jsdom environment. Tests control "today" with fake timers so week and "not done" behaviour is deterministic.
- **Covered behaviour** (examples): week view shows the right days and workouts for a given date; navigating weeks; today highlighted; past planned workouts dimmed as not done; creating a workout with exercises and sets; autocomplete and find-or-create of exercises; logging actuals and marking done; the last-performance line uses the most recent prior completed workout and actual values; copying to multiple dates produces planned copies with actuals cleared (or promoted to targets when chosen); deleting with confirmation; the login gate shows only the login screen when signed out.
- **Not automatically tested**: The Supabase store implementation and RLS policies are thin and environment-dependent. They are verified manually once against the real Supabase project: signed-out requests are rejected, signed-in CRUD works, and sign-up is refused.
- **Prior art**: None. This is a new codebase.

## Out of Scope

- Multiple users, sharing or social features
- Workout templates and automatic recurrence (copying covers repetition)
- Charts, progress graphs and personal-record tracking beyond the "last performance" line
- Cardio fields (time, distance), RPE, rest timers, supersets
- Kilogram units or unit conversion
- Offline mode and background sync
- Magic-link, OAuth or password-reset flows in-app (password reset can be done from the Supabase dashboard)
- Custom domain
- Month calendar view

## Further Notes

- Manual setup the user must perform: create a Supabase project and supply its URL and anon key; disable sign-ups; create the single user account; enable GitHub Pages (GitHub Actions source) on the repo.
- The Supabase URL and anon key are provided to the build as public environment variables (repo Actions variables), not committed secrets.
- Supabase's free tier pauses projects after a period of inactivity. Regular use avoids this; if it happens, the project is resumed from the dashboard.
