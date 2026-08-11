# Migration status

Working notes for the static HTML → SvelteKit migration.
Last updated **11 August 2026**, end of Phase 4.

Plan: <https://claude.ai/code/artifact/b42e8908-c534-4c72-8ef2-7a465a78ad28>
Branch: `sveltekit-migration` — **6 commits, not yet pushed**. Working tree clean.

## Where we stopped

Phases 0–4 are complete and committed. **Phase 5 is next.**

| Phase | State |
|---|---|
| 0 · Safety net | ✅ branch, 18 baselines, `.js [data-reveal]` bug fixed |
| 1 · Scaffold | ✅ skeleton + TypeScript, adapter-static, prerender |
| 2 · Layout | ✅ nav/menu/footer once, PageHero, `config.ts`, NL/EN toggle removed |
| 3 · Pilot (regulations) | ✅ data file + `nl.json`, entities → UTF-8 |
| 4 · Shared JavaScript | ✅ attachments, GSAP bundled, teardown, motion watchdog |
| 5 · Remaining sub-pages | ⬜ **next** |
| 6 · index.html | ⬜ |
| 7 · Delete old site | ⬜ |
| 8 · Finish "fully functional" | ⬜ |

## Phase 5 — what to do next

Port the remaining page bodies, **one commit each**, simplest first. The recipe is
established in [regulations/+page.svelte](src/routes/regulations/+page.svelte) — copy that shape.

Six stubs remain (hero + `<svelte:head>` only, empty `<main>`):

1. **sponsors** — simplest
2. **organisation**
3. **registration**
4. **media** — eight photos + three videos become data; replace the
   `onerror="this.remove()"` handlers with a proper guard
5. **events** — check the countdown/date contradiction first (see below)
6. **results** — three year-panels × five divisions become one data file; tabs
   become state. All 15 rows are placeholder text.

Source markup for each is in `static/<page>.html`, still in the repo until Phase 7.

Per page: structured records → `src/lib/data/<page>.ts`, Dutch → `src/lib/messages/nl.json`
under flat dotted keys, entities → real UTF-8 characters, strings with no Dutch get an
empty-string key. Attach behaviour with `reveal()`, `magnetic()`, `tilt()`, `count()`
from [attachments.svelte.ts](src/lib/attachments.svelte.ts) — never the old `data-*` attributes.

**URL cutover happens once, at the end of Phase 5** — not per page. The live site is
indexed at `.html` URLs, so clean URLs need redirects or inbound links will 404. This
depends on the hosting decision, which is still open.

Also add the ~40-line Playwright smoke test here (every route 200, has a title, no
console errors).

## Open questions — need answers

1. **The countdown contradicts the events page.** `events.html` says "Date TBA" and
   "Venue TBA" while the countdown targets 30 January 2027, both visible at once.
   Blocks porting `events` honestly. Either the date is known and the copy is stale,
   or it isn't and the countdown shouldn't claim that precision.
2. **The results archive is entirely placeholder** — all 15 rows read "fill from
   archive". The migration makes them a data edit, but the champions need gathering.
3. **Hosting + contact form decide each other**, and hosting also answers the redirect
   question above. Settle before the end of Phase 5.
4. **Contact address unconfirmed** — `CONTACT_EMAIL` in [config.ts](src/lib/config.ts) is still a guess.
5. **No images in the repo** — favicon and social preview need a source; the eleven
   media photos can be pulled off the old domain.

## Things to remember

- **`npm run preview` is misleading right now.** It serves `static/` in preference to
  the prerendered pages, so you see the *old* HTML. Verify with `npx serve build` instead.
  This stops being an issue at Phase 7 when the legacy files are deleted.
- **Legacy files stay in `static/` until Phase 7** — they are the revert escape hatch.
  They do not shadow the routes: Kit's prerendered output overwrites same-path static files.
- **Do not touch `src/lib/style.css`.** 689 lines of working token-driven CSS, imported
  once as a global. The `.lang__btn` rules in it are dead but harmless — they come back
  when Dutch ships.
- **The site ships English-only.** All 413 `data-nl` strings are preserved in `static/`
  and move to `nl.json` as each page is ported. The NL/EN toggle returns with Dutch.
- **Everything year-shaped derives from `EVENT_DATE`** in `config.ts`. Never type a year
  into a page. Event year is 2027; the 2026s in `static/` are stale.
- **Screenshots in `screenshots/` are the legacy site**, captured with reveals triggered.
  When diffing, expect two intentional differences: the NL/EN toggle is present in the
  baselines but gone from the migrated site, and baselines read 2015–2026 on sub-pages
  while the migrated site correctly reads 2015–2027. See [screenshots/README.md](screenshots/README.md).
- **Prettier and ESLint are deliberately not installed** until Phase 7, so formatting
  churn doesn't bury real changes.
- `npm audit` reports 3 low-severity issues in SvelteKit's own `cookie` dependency.
  Irrelevant for a static site; the "fix" downgrades Kit to 0.0.30. Leave alone.

## Commands

```bash
npm run dev          # development
npm run check        # svelte-check — expect 0 errors
npm run build        # prerenders all nine routes; this is what proves SSR guards
npx serve build      # verify the real output (NOT npm run preview)
npx serve static     # the legacy site, for comparison
```
