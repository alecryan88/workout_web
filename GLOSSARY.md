# Glossary

- **Exercise**: A library record for one movement variant, identified by name + equipment (e.g. "Bench Press (Barbell)"). History is gathered per exercise. Archived exercises are hidden but keep their history.
- **Template**: A reusable workout with no date or status: name, notes, ordered exercises with sets and rest times. Not "routine" or "program".
- **Workout**: A dated session you plan and log. Created empty, copied from another workout, or scheduled from a template, in which case it is a snapshot and is not linked to the template after creation.
- **Set**: One lbs × reps pair on a workout or template exercise. Both values are optional.
- **Completed set**: A workout set ticked with ✓. Only completed sets count as logged and feed Previous.
- **Status**: `planned` → `in_progress` (after Start) → `done` (after Finish). "Missed" is derived: planned and dated before today.
- **In-progress workout**: The single workout currently being timed, from Start until Finish.
- **Previous**: For a set row, the completed set with the same number from the most recent done workout containing that exercise before this workout's date.
- **Rest time**: Per-exercise rest duration between sets (default 2:00). The rest countdown starts when a set is ticked during an in-progress workout.
