# SCRUM-116 — Responsive main pages

**Jira:** [SCRUM-116](https://vimukthiherath123.atlassian.net/browse/SCRUM-116)  
**Status:** Implemented (code)  
**Sprint 4 (usability):** Pairs with SCRUM-113–115 (UX and content).

## User story

As a user, I want the main pages to be responsive on different screen sizes, so that the web application is usable on various devices.

## What was implemented

1. **`frontend/public/index.html`**
   - Viewport includes `viewport-fit=cover` so `env(safe-area-inset-*)` works on notched devices.

2. **`frontend/src/styles/globals.css`**
   - `overflow-x: clip` on `html` / `body` to avoid stray horizontal scroll; `min-w-0` on `#root`, `.page-wrapper`, `.content`, and `.ui-shell`.
   - Horizontal safe-area padding on `.page-wrapper`; toast container uses safe-area insets for bottom and sides on small viewports.
   - `.ui-shell` slightly tighter vertical padding on the smallest screens (`py-6` → `sm:py-8`…); `.ui-page-header` `min-w-0` / `max-w-full`.

3. **`frontend/src/components/ui/PortalPrimitives.jsx`**
   - `PageIntro`: `min-w-0` on title and actions row so long headings and action buttons wrap instead of forcing width.

4. **`frontend/src/components/common/Navbar.jsx`**
   - `min-w-0` on bar and brand link; smaller logo and wordmark on very small viewports; spacing tweaks so the menu control fits.

5. **`frontend/src/components/ui/AuthShell.jsx`**
   - `overflow-x-clip` + `overflow-y-auto`, `100dvh`-based min-height for mobile browser chrome, responsive card/title padding and type scale.

6. **`frontend/src/pages/public/LandingPage.css`**
   - `overflow-x: clip` on `#landing-page` (existing breakpoints already cover hero, sections, and footer).

7. **`frontend/src/pages/worker/BrowseRequestsPage.jsx`**
   - Filter selects: `w-full min-w-0` on small screens; `min-w` from `sm` up so filters do not force horizontal scroll.

## Files touched

- `frontend/public/index.html`
- `frontend/src/styles/globals.css`
- `frontend/src/components/ui/PortalPrimitives.jsx`
- `frontend/src/components/common/Navbar.jsx`
- `frontend/src/components/ui/AuthShell.jsx`
- `frontend/src/pages/public/LandingPage.css`
- `frontend/src/pages/worker/BrowseRequestsPage.jsx`
- `docs/sprints/SCRUM-116.md` (this file)

## Verification

- Resize the browser (or use devtools device mode) for landing, login/register, a portal dashboard, and **Find Work** filters: no horizontal page scroll; toasts clear the home indicator on notched phones.
- Confirm auth and long portal titles still read clearly at ~320px width.
