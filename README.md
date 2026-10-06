# pm2

## Prototype

`prototype/` holds an interactive, desktop-first web prototype of the PM Dashboard:

- `prototype/index.html` — open this file directly in a browser
- `prototype/styles.css` — design-system implementation
- `prototype/app.js` — prototype chrome, product UI, dummy data and interactions
- `prototype/design.md` — visual/design-system reference

Layout, top to bottom: the **prototype bar** carries the role switch (PM Admin / PM); below it a
**demo frame** (window chrome + status readout) wraps the **product viewport**, which contains the
complete PM Dashboard UI. All navigation happens inside the viewport — there are no separate pages,
no `window.location` navigation and no second navigation path outside the product. The frame's
address bar and back button only reflect and mirror product state. Vanilla HTML/CSS/JS, no build step.
