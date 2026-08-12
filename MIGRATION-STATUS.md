# Migration status

Working notes for the static HTML → SvelteKit migration.
Last updated **12 August 2026**, end of Phase 5.

Plan: <https://claude.ai/code/artifact/b42e8908-c534-4c72-8ef2-7a465a78ad28>
Branch: **`main`** — the migration was merged there in PR #2 and is deployed.
`sveltekit-migration` is merged and can be deleted. Working tree clean.

## Where we stopped

Phases 0–5 are complete and committed. **Phase 6 is next** — except the URL
cutover, which is still parked on the hosting decision (see below).

| Phase | State |
|---|---|
| 0 · Safety net | ✅ branch, 18 baselines, `.js [data-reveal]` bug fixed |
| 1 · Scaffold | ✅ skeleton + TypeScript, adapter-static, prerender |
| 2 · Layout | ✅ nav/menu/footer once, PageHero, `config.ts`, NL/EN toggle removed |
| 3 · Pilot (regulations) | ✅ data file + `nl.json`, entities → UTF-8 |
| 4 · Shared JavaScript | ✅ attachments, GSAP bundled, teardown, motion watchdog |
| 5 · Remaining sub-pages | ✅ all six ported, smoke test green; **URL cutover deferred** |
| 6 · index.html | ⬜ **next** |
| 7 · Delete old site | ⬜ |
| 8 · Finish "fully functional" | ⬜ |

## Phase 6 — what to do next

Port `static/index.html` (598 lines, the bespoke home page). It is the last
stub: `/` currently has no `<h1>` and is exempted from the smoke test's heading
check via `NOT_YET_PORTED` in [tests/smoke.spec.ts](tests/smoke.spec.ts) —
remove that exemption once the hero lands.

Pieces that need care, none of which the sub-pages exercised:

- **three.js particle stage floor** (`#stage-floor`) — the only page loading
  three.js. Must render a single static frame under `prefers-reduced-motion`,
  and dispose its renderer on destroy.
- **Preloader** (`#loader`) — has to not strand the page if an asset never loads.
- **Horizontal pinned "Road to Worlds"** (`#roadTrack`) — pins only at ≥1001px
  and must kill its ScrollTrigger on teardown.
- **Countdown** — already done. [Countdown.svelte](src/lib/components/Countdown.svelte)
  was built shared in Phase 5; reuse it, do not rebuild.
- `data-count` numbers use the existing `count()` attachment.

## GitHub Pages preview — live

Deployed and verified at
<https://gallwebdesign.github.io/HHI-Netherlands-Website/>, built by
[.github/workflows/pages.yml](.github/workflows/pages.yml) on every push to `main`.
**This is staging, not the public site** — hhi-netherlands.com is still the legacy
PHP site, and `/` here is still the Phase 1 stub until Phase 6 lands.

Verified against the deployed site in a real browser: clean hydration, correct nav
highlighting, working client-side navigation, and a live countdown.

**A workflow only registers if it exists on the default branch.** That is why the
first attempt produced no run at all — no error, no failed job, just silence, because
the file existed only on `sveltekit-migration`. If runs ever stop appearing, check
that before anything else.

How it works, and why:

- **`BASE_PATH` → `kit.paths.base`.** Project repos serve from `/<repo>`, which would
  404 every root-relative link. The env var is set only in the workflow, so local and
  real-host builds are unaffected — nothing here has to be undone at Phase 7. A
  malformed value throws at config load rather than producing a subtly broken build.
- **Links bound from a variable need `withBase()`** (in `config.ts`). Kit rewrites
  root-relative hrefs written literally in markup, but not `href={link.href}` — and the
  nav, menu and footer all render from the `config.ts` arrays.
- **`Nav.isActive` strips `base` before comparing.** `page.url.pathname` includes the
  base path, so without stripping, no nav link is ever marked current under a sub-path.
- **`.nojekyll`** — Pages runs output through Jekyll otherwise, which strips
  underscore-prefixed paths, i.e. all of `_app`. Every asset would 404.
- **robots.txt is overwritten to `Disallow: /` in the workflow only.** `static/robots.txt`
  stays crawlable for the real host. The preview must not compete with the live site in
  search or present placeholder results as fact.

Verified in a browser served from a real sub-path: hydration clean, nav highlighting
correct, client-side navigation and the logo all stay inside the sub-path.

## Still deferred — do at the start of Phase 7

**The URL cutover.** Still blocked on the hosting decision, unchanged since Phase 4.
The live site is indexed at `.html` URLs and the migrated routes are clean
(`/sponsors`), so this needs redirects or inbound links 404. All internal links
already point at clean routes, so only the redirect layer is outstanding.

Both `npx serve build` and GitHub Pages resolve `/sponsors` → `sponsors.html` on
their own, which is why the smoke test and the preview both pass today. That is those
two servers being helpful; it is **not** evidence the real host will do the same, and
it does nothing about inbound `.html` links.

## Applied in Phase 5

- **Event date and venue** (confirmed 11 Aug 2026): **30 & 31 January 2027** at
  **MECC Maastricht**, now live on the events page. The range derives from
  `EVENT_DATE` + the new `EVENT_END_DATE` in `config.ts`, so it cannot drift from
  the countdown; `EVENT_VENUE` and `EVENT_DATE_RANGE` were added alongside.
- **Two-day framing** (confirmed with Iain, 12 Aug 2026). The page was written
  around a single day, so more than the two facts changed: the hero lede now reads
  "Two days decide", the schedule heading "How the weekend runs", and the footnote
  says the split across both days follows with the announcement. **The timeline is
  still one indicative 10:00–19:30 day** — deliberately, since which divisions run
  on which day is not yet known. Split it when the official programme lands.
- **Venue sub-line** (confirmed with Iain, 12 Aug 2026): "Directly opposite
  Maastricht Randwyck station", replacing the inaccurate "Central in the
  Netherlands". The stale "Follow our socials for the announcement" is gone.
- **Results stay placeholder** (confirmed 11 Aug 2026). Structure is ported and the
  15 rows are generated by `placeholderRows()` in
  [results.ts](src/lib/data/results.ts) — filling in the real archive is now a data
  edit. Do not invent champions.

## Open questions — need answers

1. **Hosting + contact form decide each other**, and hosting also answers the redirect
   question above. This is now the one thing blocking Phase 7 — settle it before then.
2. **Contact address unconfirmed** — `CONTACT_EMAIL` in [config.ts](src/lib/config.ts) is still a guess.
3. **No images in the repo** — favicon and social preview need a source; the eleven
   media photos can be pulled off the old domain.
4. **Division split across the two event days** — not needed to ship, but the events
   schedule stays a single indicative day until the official programme lands.

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
- **The smoke test asserts `toBeAttached`, not `toBeVisible`.** `reveal()` parks content
  at `autoAlpha:0` until its ScrollTrigger fires, which also removes it from the
  accessibility tree — so `getByRole` finds nothing and visibility assertions would be
  testing scroll position. Scroll first (`settleReveals`) when a test needs the real
  a11y tree, as the tablist test does.
- **Never point the test harness at `npm run preview`**, and never pass `--single` to
  `serve`: it is present-means-on, so even `--single=false` rewrites every route to
  `index.html` and every page answers with the home page.
- **`npm test` builds before it tests, on purpose.** `serve` reads `build/` off disk, so
  a rebuild running alongside it serves half-written HTML and fails a route at random.
- **A few inline `style=` attributes survive the port** (org grid offset, checklist
  width, countdown margin, event facts width). They are carried over verbatim because
  `style.css` is frozen until Phase 7 — fold them into real rules then.
- `npm audit` reports 3 low-severity issues in SvelteKit's own `cookie` dependency.
  Irrelevant for a static site; the "fix" downgrades Kit to 0.0.30. Leave alone.

## Commands

```bash
npm run dev          # development
npm run check        # svelte-check — expect 0 errors
npm run build        # prerenders all nine routes; this is what proves SSR guards
npm test             # build + Playwright smoke test — expect 11 passed
npx serve build      # verify the real output (NOT npm run preview)
npx serve static     # the legacy site, for comparison

# Reproduce the Pages build locally. Note: PowerShell, not Git Bash —
# bash mangles a leading-slash env var into a Windows path.
$env:BASE_PATH = "/HHI-Netherlands-Website"; npm run build
```
