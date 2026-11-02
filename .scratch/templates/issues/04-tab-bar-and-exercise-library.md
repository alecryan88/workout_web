# 04: Tab bar and Exercise library

**What to build:** A bottom tab bar (Workouts, Templates placeholder, Exercises), hidden inside editors. An Exercises screen with search, create, edit and delete. Exercise fields are equipment, muscle group and notes. Uniqueness is on name + equipment, case-insensitive. Deleting a used exercise archives it, and deleting an unused one removes it. Exercises display as "Name (Equipment)" everywhere, and bodyweight exercises label the weight column "+lbs". The picker still creates exercises inline with equipment "other", and the picker can choose between variants. Migration `0002` part 2. See spec stories 1–10.

**Blocked by:** none (if 02 lands first, rebase onto its migration)

**Status:** resolved

- [x] Tab bar navigates between screens and is hidden in editors
- [x] Exercise CRUD with archive-vs-delete
- [x] Name + equipment uniqueness; existing exercises migrate to equipment "other"
- [x] Display name and "+lbs" applied in workout screen and picker
- [x] Archived exercises hidden from list and picker but history intact
- [x] Tests cover the above

## Comments

- Display name leaves out "(Other)": an exercise with equipment "other" shows as just its name, so inline-created exercises and existing ones (migrated to "other") read as before. Every other equipment shows as "Name (Equipment)".
- Pressing Enter in the picker picks the existing exercise when exactly one active variant has that name; otherwise it finds or creates "Name" with equipment "other".
