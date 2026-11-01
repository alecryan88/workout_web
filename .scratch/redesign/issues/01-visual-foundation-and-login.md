# 01: Visual foundation and login restyle

**What to build:** Give the whole app the clean card-based look from the reference screenshots in `design_inspo/`, without changing any layout or behaviour yet. Replace the current dark-first palette with a new set of colour tokens (page background, card surface, separator, primary and secondary text, blue accent, green for done, grey for missed, red for danger) that follow the phone's light/dark setting, with a dark variant built from the same pattern. Update base styles for headings, buttons, inputs and cards (larger corner radius, bold large headings, blue primary buttons) so every existing screen picks up the new look. Restyle the login screen as the app name in a large title above a white card holding the email and password fields, with a full-width blue "Log in" button. See `.scratch/redesign/spec.md` (Overall look, Login).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] Colour tokens defined as CSS custom properties, with a light default and a dark variant under the light/dark media query
- [ ] Existing screens (week view, editor, panels) render with the new tokens and base styles, with no behaviour change
- [ ] Tap targets remain at least the current minimum size and inputs keep a 16px font size (stops mobile browsers zooming in when a field is focused)
- [ ] Layouts respect the phone's safe areas
- [ ] Login screen shows a large title, a card with email and password fields, and a full-width blue "Log in" button
- [ ] Wrong-credentials error still appears clearly on the login screen
- [ ] No CSS framework or component library introduced
- [ ] All existing tests pass
