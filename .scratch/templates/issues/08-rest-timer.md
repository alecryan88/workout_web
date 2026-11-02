# 08: Rest timer

**What to build:** Each workout exercise has `rest_seconds` (default 120, copied from templates). Dividers between sets show it, and tapping one edits it. "+ Add Set (m:ss)" shows it. Ticking a set while the workout is in progress starts a countdown in the divider below it and on the top-left timer button. That button opens controls for −15s, +15s and Skip. When the countdown ends, the phone vibrates via `navigator.vibrate` if available. Countdown state is client-only. See spec stories 47–51, Implementation Decisions: Timers.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Rest time stored per exercise and editable
- [ ] Countdown starts on tick only when in progress
- [ ] Adjust and skip work; a new tick restarts the countdown
- [ ] Tests with fake timers cover start, adjust, skip, end
