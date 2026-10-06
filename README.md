# pm2

## Prototype

`prototype/` holds an interactive, desktop-first web prototype of the PM Dashboard:

- `prototype/index.html` — open this file directly in a browser
- `prototype/styles.css` — design-system implementation
- `prototype/app.js` — prototype controller, product UI, dummy data and interactions
- `prototype/design.md` — visual/design-system reference

Layout: the left rail is the **prototype controller** — it carries the role switch (PM Admin / PM)
and, while a deep-linked project is open, a small location block with the way back. The right panel
is the **embedded product viewport** containing the complete PM Dashboard UI.

All navigation happens inside the product viewport: the product sidebar (Quick Actions, Insights,
Records) is the only navigation path. Views re-render in place — there are no separate pages and no
`window.location` navigation. Vanilla HTML/CSS/JS, no build step.
