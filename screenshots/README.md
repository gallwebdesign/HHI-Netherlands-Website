# Visual baseline — legacy site (historical)

Reference screenshots of the **legacy static site**, captured at 1440×900 and
390×844 during the SvelteKit migration. Each phase was visually diffed against
these.

`<page>_1440.png` desktop · `<page>_390.png` mobile

> ⚠️ **These cannot be regenerated.** The `static/*.html` files they were taken
> from no longer exist — the migration replaced them with `src/routes/`, and
> the capture command below would now serve a directory with no pages in it.
> The images are kept as the only record of what the pre-migration site looked
> like, which is the whole reason they are still tracked in the repo.
>
> To compare the *current* site against them, run `npm run preview` and shoot
> `http://localhost:4173` instead — but expect the differences listed at the
> bottom, which are intended.

## How they were captured

Serve the legacy files, then walk each page top to bottom before shooting:

```bash
npx serve static -p 4190   # no longer works — see the note above
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

- **NL/EN toggle** — present here, deliberately removed from the migrated site.
  There is no language switcher at all now; the Dutch that did ship is content,
  not UI — the `/regulations` page carries a `lang="nl"` block linking the Dutch
  rules PDFs alongside the English pair.
- **Footer year** — the migrated footer reads **© 2016–2026**, built in
  [Footer.svelte](../src/lib/components/Footer.svelte) from `FOUNDED_YEAR`
  (2016) and `CURRENT_YEAR` (today). Note it is *not* derived from
  `EVENT_DATE`, so it does not track the championship year — the end of the
  range rolls over on 1 January, not at the next event.
- **Everything below the fold on `/media`** — the eight-photo grid these
  baselines show was replaced by the filtered 2026 gallery, which has
  competition and division tabs, paging and a lightbox. Different page.
