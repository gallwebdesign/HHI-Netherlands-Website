# Visual baseline — legacy site

Reference screenshots of the **legacy static site** (`static/*.html`), captured at
1440×900 and 390×844. Every later migration phase is visually diffed against these.

`<page>_1440.png` desktop · `<page>_390.png` mobile

## How they were captured

Serve the legacy files, then walk each page top to bottom before shooting:

```bash
npx serve static -p 4190
```

The walk matters. `[data-reveal]` elements start at `opacity:0` and only become
visible when GSAP's ScrollTrigger fires them, so a naive `fullPage` screenshot
records blank space where content should be. Scroll the full height in ~60vh
steps (~130ms apart), settle at the bottom, return to top, then capture.

Verify before trusting a capture — this should report 0:

```js
[...document.querySelectorAll('[data-reveal]')]
  .filter((el) => getComputedStyle(el).opacity === '0').length;
```

The first baseline set (commit `b37bde3`) was taken without the walk. Several
pages recorded an empty grey block instead of their content — `regulations`
lost all six rule records — which made them useless as diff targets. That set
also had no mobile captures. Replaced 11 August 2026.

## Expected differences when diffing against SvelteKit

Not regressions:

- **NL/EN toggle** — present here, deliberately removed from the migrated site
  (English-only until Dutch ships).
- **Footer year** — reads 2015–2026 on the eight sub-pages here. The migrated
  site derives it from `EVENT_DATE` and correctly reads 2015–2027 everywhere.
