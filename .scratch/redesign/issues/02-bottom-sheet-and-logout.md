# 02: Bottom sheet and log out behind a gear

**What to build:** Build one shared bottom-sheet component that slides up from the bottom over a dimmed backdrop, has a title, and is dismissed by tapping the backdrop or a Cancel/Close control. It is exposed with a dialog role and an accessible name, and respects the bottom safe area. Use it first for logging out: the "Log out" text link on the week view is replaced by a gear icon (accessible name "Settings") in the top-right that opens a sheet containing "Log out". See `.scratch/redesign/spec.md` (Sheets, Week view: header and navigation; Implementation Decisions: Sheet component).

**Blocked by:** 01 (Visual foundation and login restyle)

**Status:** ready-for-agent

- [ ] A shared sheet component exists with dimmed backdrop, title, content area, and dismiss on backdrop tap or Cancel/Close
- [ ] The sheet has a dialog role and an accessible name
- [ ] The sheet's buttons are not hidden behind the home indicator
- [ ] The week view shows a gear icon in the top-right and no longer shows a "Log out" text link
- [ ] Tapping the gear opens a sheet with "Log out"; tapping "Log out" signs out and shows the login screen
- [ ] The log out sheet can be dismissed without logging out
- [ ] Login/logout tests updated to go through the gear and sheet; all tests pass
