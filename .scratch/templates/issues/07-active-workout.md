# 07: Start, in progress and Finish

**What to build:** Add `in_progress` status, `started_at` and `finished_at`. A planned workout shows Start. In progress, the top bar shows the elapsed time (derived from `started_at`) and a green Finish button, and the header shows the date and elapsed time as in `design_inspo/active_workout_example.png`. Only one workout can be in progress; Start elsewhere explains this and offers to open the active one. Finish confirms if any sets are unticked, then marks the workout done with a duration. Finishing without Start is allowed and records no duration. A done workout shows its duration, and the menu has "Mark not done". The week view shows in-progress workouts distinctly. See spec stories 37–46.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Start/Finish lifecycle in both stores, with the single in-progress rule enforced
- [ ] Elapsed timer correct after time passes (fake timers) and after reload
- [ ] Unticked-sets confirmation
- [ ] Duration shown on done workouts; Mark not done works
- [ ] Week card and dot for in-progress
- [ ] Tests cover the above
