# pm2

## Prototype

`prototype/` holds an interactive, desktop-first web prototype of the PM Dashboard:

- `prototype/index.html` — open this file directly in a browser
- `prototype/styles.css` — design-system implementation
- `prototype/app.js` — prototype controller, product UI, dummy data and interactions
- `prototype/design.md` — visual/design-system reference

Layout: the left rail is the **prototype controller** (role switch + flow selector) and can be
collapsed to a slim strip with the Collapse/Expand button under its header — the role switch stays
reachable as initials. The product sidebar (Quick Actions / Insights / Records) collapses too, via
the button in its brand row, down to a 52px icon rail. Both states survive re-renders. The right
panel is the **embedded product viewport** containing the complete PM Dashboard UI.
Flow switching re-renders the viewport in place — there are no separate pages and no
`window.location` navigation. Vanilla HTML/CSS/JS, no build step.
