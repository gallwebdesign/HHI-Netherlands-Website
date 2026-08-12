# Migration status

Working notes for the static HTML → SvelteKit migration.
Last updated **12 August 2026**, end of Phase 6.

Plan: <https://claude.ai/code/artifact/b42e8908-c534-4c72-8ef2-7a465a78ad28>
Branch: **`main`** — the migration was merged there in PR #2. Working tree clean,
everything pushed, `sveltekit-migration` merged and safe to delete.

## Where we stopped

**Phases 0–6 are complete, pushed, and deployed.** All nine routes are ported;
run #7 published commit `e15e5ba` and the live home page was checked to be the
real one, not the old stub. **Phase 7 (cleanup) is next**, led by the URL
cutover, which is still parked on the hosting decision (see below).

| Phase | State |
|---|---|
| 0 · Safety net | ✅ branch, 18 baselines, `.js [data-reveal]` bug fixed |
| 1 · Scaffold | ✅ skeleton + TypeScript, adapter-static, prerender |
| 2 · Layout | ✅ nav/menu/footer once, PageHero, `config.ts`, NL/EN toggle removed |
| 3 · Pilot (regulations) | ✅ data file + `nl.json`, entities → UTF-8 |
| 4 · Shared JavaScript | ✅ attachments, GSAP bundled, teardown, motion watchdog |
| 5 · Remaining sub-pages | ✅ all six ported, smoke test green; **URL cutover deferred** |
| 6 · index.html | ✅ hero, stage floor, preloader, road pin, all sections |
| 7 · Delete old site | ⬜ **next** |
| 8 · Finish "fully functional" | ⬜ |

## Phase 7 — what to do next

All nine routes are ported. Remaining work is cleanup:

1. **The URL cutover — do this first**, and note it is the one item that cannot
   simply be worked through: it is still blocked on the hosting decision,
   unchanged since Phase 4. The live site is indexed at `.html` URLs while the
   migrated routes are clean (`/sponsors`), so it needs redirects or inbound
   links 404. Every internal link already points at a clean route, so only the
   redirect layer is outstanding.

   Both `npx serve build` and GitHub Pages resolve `/sponsors` → `sponsors.html`
   by themselves, which is why the smoke test and the preview pass today. That is
   those two servers being helpful; it is **not** evidence the real host will do
   the same, and it does nothing about already-indexed inbound `.html` links.

   **Items 2–5 below are self-contained and can proceed while hosting is undecided.**
2. **Delete the legacy files in `static/`** (nine `.html` files plus
   `assets/`). They are the revert escape hatch and stop being needed once the
   cutover is settled. `static/robots.txt` **stays** — it is the real host's
   crawlable copy.
3. **Install Prettier and ESLint**, deliberately held back so formatting churn
   did not bury real changes.
4. **Fold the surviving inline `style=` attributes into `style.css`.** Twelve
   static ones across six files, all carried over verbatim from the legacy
   markup; `style.css` stops being frozen at this point. Find them with:

   ```bash
   grep -rn 'style="' src/ --include=*.svelte
   ```

   Four are `color:var(--oranje)` on contact links and two are `margin-top:0`;
   the rest are one-off layout offsets in `+page.svelte` (media teaser row),
   `events` (facts width, schedule offset), `media` (head padding),
   `organisation` (grid offset) and `registration` (checklist width).
   **Leave `Preloader.svelte` alone** — its `style=` is a computed
   `transform: scaleX()` driving the progress bar, not a static rule.
5. **`npm run preview` becomes trustworthy again** once `static/` no longer
   shadows the prerendered output.

## Phase 6 — what landed

The home page is ported, with three pieces the sub-pages never exercised:

- **[StageFloor.svelte](src/lib/components/StageFloor.svelte)** — the three.js
  particle floor. `three` is imported dynamically: it is ~500KB, only this route
  uses it, and it touches `window`, which would break the prerender. Verified to
  land in its own chunk that no other page preloads. Renders one static frame
  under reduced motion, and disposes geometry, material, renderer, the rAF loop,
  the IntersectionObserver and both window listeners on destroy.
- **[Preloader.svelte](src/lib/components/Preloader.svelte)** — the curtain. It is
  a fixed 1.4s animation, never tied to real asset loading, so it cannot hang on
  a missing image. Three guards stop it stranding the page: it is absent from the
  prerendered HTML (so no-JS visitors never see it), reduced motion and a failed
  GSAP import both skip straight to done, and a 4s watchdog lifts it regardless.
- **`roadPin()`** in [attachments.svelte.ts](src/lib/attachments.svelte.ts) — the
  pinned horizontal scroll, ≥1001px only via `gsap.matchMedia`. Teardown calls
  `mm.revert()`, not just `tween.scrollTrigger.kill()`, because ScrollTrigger
  injects a `.pin-spacer` element into the DOM that killing the tween leaves
  behind.

`heroFade()` and `heroRow()` gained a `ready` argument so the hero waits for the
curtain instead of animating underneath it. Sub-pages pass nothing and are
unaffected. `Countdown` gained a `heroEntrance` variant — in the hero it must not
carry a scroll `reveal()`, which would hold an above-the-fold element hidden
until a scroll that never comes.

**`@types/three` is pinned to 0.128 to match the runtime version.** It caught a
real bug: `BufferAttribute.array` is typed read-only, and the render loop mutates
it every frame.

## GitHub Pages preview — live

Deployed and verified at
<https://gallwebdesign.github.io/HHI-Netherlands-Website/>, built by
[.github/workflows/pages.yml](.github/workflows/pages.yml) on every push to `main`.
**This is staging, not the public site** — hhi-netherlands.com is still the legacy
PHP site, and the results archive here is still placeholder text.

Verified against the deployed site in a real browser: clean hydration, correct nav
highlighting, working client-side navigation, and a live countdown. The home page
was re-checked after Phase 6 shipped — the real hero, not the old stub.

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
- **The site ships English-only, and the Dutch extraction is complete.** Checked
  before Phase 7 deletes `static/`: the 413 `data-nl` attributes there are only **190
  unique strings** — 22 are nav/menu/footer chrome repeated across all nine files, 168
  are page-specific. [nl.json](src/lib/messages/nl.json) holds 244 keys, 46 of them
  deliberately empty where no Dutch ever existed. **Nothing is lost when the legacy
  files go.** The NL/EN toggle returns when Dutch actually ships; it has to be a store
  rather than the legacy innerHTML swap, or it goes stale on client-side navigation.
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
- **Twelve static inline `style=` attributes survive the port**, carried over verbatim
  because `style.css` is frozen until Phase 7. Listed under Phase 7 item 4 above.
- **The smoke test got slower when the home page landed, and that is the harness.**
  Route tests went from ~1s to ~10s under 8 parallel workers, because three of them
  now spin up a WebGL context on the same machine; run alone, `/sponsors` is still
  ~870ms. Nothing shipped got slower — three.js is in its own chunk that only the
  home route loads.
- `npm audit` reports 3 low-severity issues in SvelteKit's own `cookie` dependency.
  Irrelevant for a static site; the "fix" downgrades Kit to 0.0.30. Leave alone.

## Commands

```bash
npm run dev          # development
npm run check        # svelte-check — expect 0 errors
npm run build        # prerenders all nine routes; this is what proves SSR guards
npm test             # build + Playwright smoke test — expect 15 passed
npx serve build      # verify the real output (NOT npm run preview)
npx serve static     # the legacy site, for comparison

# Reproduce the Pages build locally. Note: PowerShell, not Git Bash —
# bash mangles a leading-slash env var into a Windows path.
$env:BASE_PATH = "/HHI-Netherlands-Website"; npm run build
```
