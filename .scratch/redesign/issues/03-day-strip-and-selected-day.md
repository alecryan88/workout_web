# 03: Day strip and selected day's workouts

**What to build:** Replace the seven stacked day cards on the week view with the layout from the reference screenshot. The header shows a date-range title (e.g. "Nov 2 – Nov 8") with previous/next week arrows, and below it a Mon–Sun strip of short weekday names and date numbers. Tapping a day selects it (filled circle); today is shown in blue text. Below the strip, a heading ("Today's workouts" or "<Weekday>'s workouts") lists only the selected day's workouts, in creation order, as cards that open the workout when tapped (cards keep their current content for now: name plus done / not done badge). Empty days show a muted "Rest day" line. A full-width blue "+ Add workout" button creates a workout on the selected day and opens it. A "Today" button appears top-left only when viewing a week other than the current one, and returns to the current week with today selected. Swiping still changes weeks. The selected day is kept in the URL alongside the week, so returning from a workout restores that workout's week and day. See `.scratch/redesign/spec.md` (Week view sections; Implementation Decisions: Week view state, Week view composition).

**Blocked by:** 01 (Visual foundation and login restyle)

**Status:** resolved

- [ ] Header shows a date-range title with "Previous week" and "Next week" arrow buttons
- [ ] The strip shows Mon–Sun for the viewed week; each day is a button named by its full day label (e.g. "Wed Nov 4") with its selected state exposed
- [ ] Today is marked as the current date and shown in blue text
- [ ] On the current week, today is selected by default; after changing week, Monday is selected
- [ ] Only the selected day's workouts are listed, under the right heading, in creation order
- [ ] Empty days show "Rest day"
- [ ] "+ Add workout" creates a workout on the selected day and opens it
- [ ] "Today" appears only off the current week and returns to the current week with today selected
- [ ] Swiping left/right still changes weeks
- [ ] Returning from a workout restores its week and selected day
- [ ] Load errors still show on the week view
- [ ] Week-view tests rewritten to select a day before checking its workouts; all tests pass
