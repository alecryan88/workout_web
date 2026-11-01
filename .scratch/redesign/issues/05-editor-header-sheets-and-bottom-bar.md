# 05: Editor top bar, notes, actions menu and bottom bar

**What to build:** Restructure the top and bottom of the workout editor. A navigation bar shows "‹ Week" on the left (keeping the "Back to week" accessible name), the workout name as the title with the save status ("Saving…", "Saved", or the error) in small text underneath, and a "•••" button (accessible name "Workout actions") on the right. The "•••" opens a sheet with Edit details, Copy and Delete. Edit details opens a sheet with the name, date and notes fields, which autosave like the rest of the workout; changing the date still reschedules it. Copy opens a sheet with the existing date picker and "use actuals as targets" option. Delete opens a sheet confirmation. The name, date and notes fields are removed from the top of the page; when the workout has notes, they show as muted text under the header, and nothing shows otherwise. "Mark done" / "Mark not done" moves into a bottom bar that stays on screen, with page content padded so the last exercise isn't hidden. See `.scratch/redesign/spec.md` (Workout editor: header, Workout editor: edit details, Workout editor: bottom bar, Sheets).

**Blocked by:** 02 (Bottom sheet and log out behind a gear)

**Status:** ready-for-agent

- [ ] Navigation bar shows "‹ Week", the workout name, the save status, and a "•••" button
- [ ] "‹ Week" saves pending changes and returns to the workout's week and day
- [ ] "•••" opens a sheet with Edit details, Copy and Delete
- [ ] Edit details sheet edits name, date and notes with autosave; changing the date reschedules the workout
- [ ] Copy works through a sheet with the same options and results as before
- [ ] Delete works through a sheet confirmation and can be cancelled
- [ ] Name, date and notes fields no longer appear at the top of the editor
- [ ] Notes show as muted text under the header only when present
- [ ] "Mark done" / "Mark not done" sits in a bottom bar that stays on screen and toggles status as before
- [ ] The last exercise is not hidden behind the bottom bar
- [ ] Tests updated to open the relevant sheet or menu first; notes visibility covered; all tests pass
