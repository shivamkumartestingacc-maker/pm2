# PM Dashboard — Design System Reference

This file is the visual/design-system reference for `prototype/`. It documents the tokens and
component rules the prototype is built against, so future screens stay consistent with what
already exists.

Scope: **visual language only.** It defines no product functionality, data model or workflow.

---

## 1. Colour

### Brand
| Token | Value | Use |
| --- | --- | --- |
| `--brand` | `#A94A44` | Active/selected states, primary buttons, the active tab underline, overdue emphasis |
| `--brand-ink` | `#8C3A35` | Brand text on light backgrounds, hover state of primary buttons |
| `--brand-wash` | `rgba(169,74,68,.08)` | Selected row / selected nav background |
| `--brand-line` | `rgba(169,74,68,.32)` | Focus ring, attention borders |
| `--warm` | `#FDF5E6` | **Very limited.** Overdue time chips and the PM Missed Work column only |

Brand is an accent, not a surface colour. If a screen has more than a handful of brand-coloured
elements, it is using too much.

### Neutrals
| Token | Value | Use |
| --- | --- | --- |
| `--white` | `#FFFFFF` | Panels, cards, modals, tables |
| `--surface` | `#FAFAFA` | Page background behind panels, table headers, sidebars |
| `--ink` | `#171717` | Primary text |
| `--muted` | `#666666` | Secondary text |
| `--faint` | `#8A8A8A` | Labels, metadata, uppercase micro-labels |
| `--line` | `#E7E7E7` | Borders |
| `--line-soft` | `#F0F0F0` | Internal dividers, row separators |
| `--page` | `#EFEFEF` | Prototype-stage background (behind the product viewport) |

### Status
Used sparingly and consistently — never decorative.

| Token | Value | Meaning |
| --- | --- | --- |
| `--ok` | `#2F6F4E` | Approved, Paid, Completed, Resolved, On track |
| `--warn` | `#8A6100` | Pending approval/review, Awaiting request, Open, At risk |
| `--info` | `#3B5B6E` | In progress, Requested, Ready to start, Sent to Finance |
| `--brand` | `#A94A44` | Rejected, Delayed, major findings, High priority |
| neutral | `--line-soft` / `--muted` | Everything else, including Unreviewed and Not started |

---

## 2. Typography

Font stack: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

| Use | Size / weight |
| --- | --- |
| Page title (`h1`) | 17 px / 600, letter-spacing −0.01em |
| Project title | 16.5 px / 600 |
| Modal title (`h2`) | 15 px / 600 |
| Body / table cell | 12–13 px / 400 |
| Card title, panel title, nav item | 12.5 px / 600 |
| Secondary text | 11.5 px / 400, `--muted` |
| Micro-label (uppercase) | 10–10.5 px / 600, letter-spacing 0.05–0.09em, `--faint` |
| KPI value | 23 px / 600, letter-spacing −0.015em |

Dates, amounts and counts always use `font-variant-numeric: tabular-nums` (`.tnum`) so columns align.

---

## 3. Spacing, radius, elevation

- Icons are 12–16 px, boxed explicitly by the `icon()` helper so an unlisted size can never render
  at the SVG default size.
- Base rhythm: 4 / 7 / 9 / 12 / 14 / 16 / 20 px. Panel bodies pad 14–16 px; page areas pad 16–20 px.
- Radii: `--r-sm` 4 px (inputs, chips, small buttons), `--r-md` 6 px (buttons, cards, menus),
  `--r-lg` 8 px (panels, viewport, modals). Nothing is pill-shaped except count chips.
- Shadows: `--sh-1` resting panels, `--sh-2` viewport/hover, `--sh-3` modals only.
- **No gradients. No decorative imagery. No charts on operational screens.**

---

## 4. Component inventory

| Component | Class | Notes |
| --- | --- | --- |
| Buttons | `.btn` + `--primary` `--quiet` `--sm` `--lg` `--block` | One primary action per surface. Secondary = bordered white. Never two primaries side by side. |
| Badges | `.badge` + `--neutral` `--ink` `--brand` `--ok` `--warn` `--info` `--outline` | 20 px tall, 10.5 px label |
| Tags | `.tag` | Uppercase 10 px micro-label for card categorisation |
| Time chips | `.time-chip` + `--overdue` `--soon` | The only place urgency is coloured |
| Panels | `.panel`, `.panel__head`, `.panel__body` | The standard content container |
| Tables | `.table` inside `.table-wrap` | Sticky uppercase header, 12 px cells, hover row, `.is-focus` for deep-linked rows |
| Tabs | `.tabs` / `.tab` | Underline tabs, brand underline when selected |
| Sidebar nav | `.pside`, `.nav-item` | Vertical tab list: flush full-width rows, no card/box treatment. Selected tab = 2 px brand rail on the left + `--brand-wash` background + brand icon + bold label. Hover tints the row to `rgba(23,23,23,.035)`. |
| Key-value grid | `.kv-grid` / `.kv` | Hairline-separated fact grid |
| Stat strip | `.stat-strip` | 3–4 headline figures at the top of a modal |
| Progress meter | `.meter` / `.meter-row` | 4 px bar; never a chart |
| Inputs | `.input`, `.select`, `textarea.input` | 30 px height, brand focus ring |
| Search | `.search` | Input with inset icon |
| Chip filter | `.chip-filter` | Pill toggle for on/off filters |
| Combobox | `.combo` | Searchable select (PM, SE, department) |
| Action card | `.action-card`, `--missed` | Board card: project → title → who → why now → footer |
| Board column | `.qcol`, `.is-expanded`, `.is-min`, `--missed` | Header (title, count, expand) + scrolling body |
| Document row | `.doc-row`, `--head` | 7-column grid shared by the handover pack and project documents |
| Report | `.report` / `.report__sec` | Read-only narrative content in a modal |
| Findings | `.finding` + `.finding__sev` | QA findings with severity badge |
| Thread | `.msg`, `.msg--internal` | Client conversation; internal notes are dashed |
| Modal | `.overlay__panel` + `--md` `--lg` `--xl` | 620 / 840 / 1040 px, contained in the product viewport |
| Drawer | `.overlay--drawer` | Right-anchored, 600 px |
| Empty state | `.empty` | Icon + one line of title + one line of explanation |
| Toast | `.toast` | Dark pill, bottom-centre of the viewport, 4.2 s |

---

## 5. Interaction states

- **Hover** — border darkens to `#D3D3D3`, surface tints to `--surface`, plus `--sh-1`. No movement.
- **Focus** — `:focus-visible` 2 px `--brand-line` outline, 2 px offset. Every interactive element is
  keyboard reachable; clickable table rows carry `tabindex="0"` and respond to Enter/Space.
- **Active/pressed** — 0.5 px downward translate on buttons only.
- **Disabled** — 45 % opacity, no hover response. A gated primary always has an explanatory hint in
  the modal footer (for example, "5 documents still unreviewed").
- **Transitions** — 120–180 ms ease on colour, border and shadow. Modal fade/pop 140–160 ms,
  drawer slide 180 ms. Nothing longer.

---

## 6. Modal anatomy

```
┌ mhead ────────────────────────────────────────── [×] ┐
  Title
  Project · QID · Category · time chip
├ mbody (scrolls) ─────────────────────────────────────┤
  Stat strip → context sections → primary content
├ mfoot ───────────────────────────────────────────────┤
  hint …………………… [Open in project] [Close] [Primary]
└──────────────────────────────────────────────────────┘
```

One primary action per modal, right-aligned, brand-filled. "Open in project" is always available for
actionable items and always deep-links to the exact project section.

---

## 7. Responsive targets

Primary: **1440 px**. Supported: **1280 px** and **1024 px**.

| Breakpoint | Prototype rail | Product sidebar | Board column |
| --- | --- | --- | --- |
| ≥ 1360 px | 264 px | 224 px | 296 px |
| ≤ 1360 px | 240 px | 208 px | 278 px |
| ≤ 1180 px | 222 px | 196 px | 262 px (expanded min 360 px) |

This is a desktop prototype. Below 1024 px nothing is redesigned; the board simply scrolls
horizontally.

---

## 8. Rules that keep it coherent

1. Neutrals carry the interface; brand carries meaning.
2. Urgency comes from typography, time labels and hierarchy — not colour.
3. One primary action per surface.
4. Every list has an empty state.
5. Every gated action explains why it is gated.
6. Statuses use the same four tones everywhere.
7. No gradients, no decorative UI, no extra shadows, no extra rounding.
