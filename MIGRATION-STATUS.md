# Migration status

Working notes for the static HTML → SvelteKit migration.
Last updated **13 August 2026**, Phase 7 items 2–5 complete.

Plan: <https://claude.ai/code/artifact/b42e8908-c534-4c72-8ef2-7a465a78ad28>
Branch: **`main`** — the migration was merged there in PR #2. Working tree clean,
everything pushed, `sveltekit-migration` merged and safe to delete.

## Where we stopped

**Phases 0–6 are complete, pushed, and deployed**, and **Phase 7 items 2–5 are
done**. All nine routes are ported. What remains in Phase 7 is the URL cutover
(item 1), which is no longer blocked — **hosting is settled: Cloud86** (see
below). It has not been executed yet.

| Phase | State |
|---|---|
| 0 · Safety net | ✅ branch, 18 baselines, `.js [data-reveal]` bug fixed |
| 1 · Scaffold | ✅ skeleton + TypeScript, adapter-static, prerender |
| 2 · Layout | ✅ nav/menu/footer once, PageHero, `config.ts`, NL/EN toggle removed |
| 3 · Pilot (regulations) | ✅ data file + `nl.json`, entities → UTF-8 |
| 4 · Shared JavaScript | ✅ attachments, GSAP bundled, teardown, motion watchdog |
| 5 · Remaining sub-pages | ✅ all six ported, smoke test green |
| 6 · index.html | ✅ hero, stage floor, preloader, road pin, all sections |
| 7 · Delete old site | 🟨 items 2–5 done; **item 1, the cutover, is next** |
| 8 · Finish "fully functional" | ⬜ |

## Hosting — decided: Cloud86 (13 Aug 2026)

**Dutch shared hosting, and it clears every requirement.** The deciding
constraint was that Iain wants site and mail with one provider, on one invoice —
which ruled out Cloudflare Pages outright, since Pages has no mailboxes and
Cloudflare's email routing only forwards.

Verified from Cloud86's own feature and support pages:

| Need | Cloud86 |
|---|---|
| IMAP mailboxes | 50 addresses, Roundcube webmail |
| Redirect layer | LiteSpeed, reads Apache `.htaccess` |
| Deploy access | SSH, plus "Git integratie" |
| Outbound mail auth | Documented SPF/DKIM/DMARC setup |
| PHP | 7.4 and 8.x |
| TLS | Free certificate |
| Data residency | NL datacenter, AVG-proof |

Two things to confirm before purchase, neither a blocker: **what "Git
integratie" actually does** (push-to-deploy vs. a clone button — SSH means the
GitHub Action approach works regardless), and **whether a cheaper tier carries
the same mail + SSH + `.htaccess`**, since the plan screenshotted is pitched at
WordPress and none of that is needed here.

Consequences for the code, all still to do as part of the cutover:

- `BASE_PATH` stops being set — Cloud86 serves from the domain root, so `base`
  returns to `''`. [vite.config.ts](vite.config.ts) needs no change; the env var
  simply goes unset. `withBase()` and `Nav.isActive` stay correct as no-ops.
- [.github/workflows/pages.yml](.github/workflows/pages.yml) gets deleted, as its
  own header comment already instructs.
- `.nojekyll` becomes unnecessary (harmless if left).
- `static/robots.txt` ships as-is; the workflow's noindex overwrite disappears
  with the workflow.

## Phase 7 — item 1, the URL cutover (next)

The live site is indexed at `.html` URLs while the migrated routes are clean
(`/sponsors`), so it needs redirects or inbound links 404. Every internal link
already points at a clean route, so only the redirect layer is outstanding.

**Iain's note (13 Aug 2026): the old site will disappear, so its own links stop
mattering.** That is true of *our* links but not of *other people's* — search
results, socials and press links keep arriving at `sponsors.html` after the old
site is gone. Hence redirects are still worth doing once:

```apache
RewriteEngine On
RewriteRule ^sponsors\.html$ /sponsors [R=301,L]
# ...one line per legacy page
```

Both `npx serve build` and GitHub Pages resolve `/sponsors` → `sponsors.html` by
themselves, which is why the smoke test and preview pass. That is those servers
being helpful; it is **not** evidence about Cloud86, and it does nothing about
already-indexed inbound `.html` links.

## Phase 7 — items 2–5, done 13 August 2026

2. ✅ **Legacy files deleted from `static/`** — nine `.html` files and `assets/`.
   `static/robots.txt` is all that remains there, as intended.
3. ✅ **Prettier and ESLint installed.** `npm run format` and `npm run lint`.
   Config matches the house style (tabs, single quotes, 100 cols, CRLF).
   `src/lib/style.css` and `*.md` are in `.prettierignore` — reformatting 689
   lines of working CSS, or reflowing hand-wrapped prose, would bury real diffs.
   Prettier normalised `events/+page.svelte` from the old hand-formatted
   two-space/double-quote style; verified with `git diff -w` to be whitespace and
   attribute rewrapping only.

   **Four recommended Svelte rules are switched off deliberately**, each reviewed
   against the real code and the reasoning recorded in
   [eslint.config.js](eslint.config.js): `no-navigation-without-resolve` (the base
   path is already solved by `withBase()`), `no-at-html-tags` (hero copy is
   hardcoded in page source; no user input on a static site),
   `prefer-svelte-reactivity` (the broken-image `Set`s are reassigned on purpose),
   and `no-dom-manipulating` (three.js must append its own canvas).
4. ✅ **Twelve inline `style=` attributes folded into `style.css`**, under a new
   `PHASE 7: FORMER INLINE STYLES` banner. `Preloader.svelte` keeps its `style=` —
   it is a computed `transform: scaleX()`, not a static rule, and is now the only
   `style=` left in `src/`.
5. ✅ **`npm run preview` is trustworthy again** — verified serving the real
   prerendered `/sponsors`, not the legacy HTML.

Verified after the change: `npm run lint` clean, `npm run check` 0 errors/0
warnings, `npm test` 15 passed.

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

## External links — confirmed 13 August 2026

**Registration is two JotForms, one per day** (Iain, 13 Aug 2026):

- Saturday — <https://form.jotform.com/262132162311946>
- Sunday — <https://form.jotform.com/262132296237961>

**Not yet wired in.** `EXTERNAL.registration` in [config.ts](src/lib/config.ts) is
still the single legacy `registration.php` link, used in **six places**: the home
hero and its road CTA, `/events`, `/registration` twice, and `MobileMenu`.

**Agreed shape (Iain, 13 Aug 2026): a hub on `/registration`.** The nav, hero and
mobile-menu CTAs keep one "Register" button pointing at `/registration`; that page
presents both day links side by side with context. Chosen over doubling all six
CTAs because **which divisions dance on which day is still unknown** — asking a
crew to pick a day is asking something they cannot yet answer, so the two links
need a page with room to explain that.

**Ticketing is already correct.** `EXTERNAL.tickets` is
`https://shop.celebratix.io/?c=2mdtq`, matching what Iain confirmed. The
`shop.compoticketing.eu` reference in [CLAUDE.md](CLAUDE.md) is stale.

**Registration needs no PHP** — all three destinations are third-party, so the new
host serves static files and mail only, and `registration.php` dies with the old
site.

**Three `EXTERNAL` links still point at the dying host** and break when it goes:
`contactForm` and `regulations` (used on [contact](src/routes/contact/+page.svelte#L76)
and [regulations](src/routes/regulations/+page.svelte#L47)) and `privacy` in the
footer. Regulations probably wants to become a hosted PDF; the contact form is
Phase 8, and Cloud86's PHP means it can be a real form.

## Open questions — need answers

1. ~~**Hosting**~~ — **settled 13 Aug 2026: Cloud86.** See the hosting section above.
   Two purchase-time details still to confirm there (Git integration, cheaper tier).
2. **Contact address** — `CONTACT_EMAIL` in [config.ts](src/lib/config.ts) is still
   a guess, but **stops being one at Cloud86**: the mailbox gets created by hand, so
   `info@hhi-netherlands.com` becomes true by construction. Confirm on setup.
3. **No images in the repo** — favicon and social preview need a source; the eleven
   media photos can be pulled off the old domain **before it disappears**.
4. **Division split across the two event days** — not needed to ship, but it now also
   gates how much the registration hub can say, not just the events schedule.

## Things to remember

- **`npm run preview` is trustworthy again** as of Phase 7 — `static/` no longer
  shadows the prerendered pages. `npx serve build` remains a fine second opinion.
- **The legacy files are gone** (Phase 7, 13 Aug 2026). The revert escape hatch is now
  git history: they were deleted in a single commit, so `git show` recovers any of them.
- **`src/lib/style.css` is no longer frozen** — it was unfrozen at Phase 7 item 4 and
  gained a `PHASE 7: FORMER INLINE STYLES` section at the end. It is still 689+ lines of
  working token-driven CSS imported once as a global, so keep changes surgical; it is in
  `.prettierignore` so a stray format run cannot churn the whole file. The `.lang__btn`
  rules are dead but harmless — they come back when Dutch ships.
- **The site ships English-only, and the Dutch extraction is complete.** Verified before
  `static/` was deleted: the 413 `data-nl` attributes there were only **190 unique
  strings** — 22 nav/menu/footer chrome repeated across all nine files, 168 page-specific.
  [nl.json](src/lib/messages/nl.json) holds 244 keys, 46 deliberately empty where no Dutch
  ever existed. **Nothing was lost.** The NL/EN toggle returns when Dutch actually ships;
  it has to be a store rather than the legacy innerHTML swap, or it goes stale on
  client-side navigation.
- **Everything year-shaped derives from `EVENT_DATE`** in `config.ts`. Never type a year
  into a page. Event year is 2027.
- **Screenshots in `screenshots/` are the legacy site**, captured with reveals triggered.
  When diffing, expect two intentional differences: the NL/EN toggle is present in the
  baselines but gone from the migrated site, and baselines read 2015–2026 on sub-pages
  while the migrated site correctly reads 2015–2027. See [screenshots/README.md](screenshots/README.md).
- **Prettier and ESLint are installed** as of Phase 7 — `npm run format`, `npm run lint`.
  Four Svelte rules are off on purpose, each with its reasoning in
  [eslint.config.js](eslint.config.js); read that before switching any back on.
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
- **One inline `style=` remains in `src/`** — `Preloader.svelte`'s computed
  `transform: scaleX()`. The other twelve moved into `style.css` at Phase 7. If a new
  static `style=` appears, it belongs in the stylesheet instead.
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
npm run check        # svelte-check — expect 0 errors, 0 warnings
npm run lint         # prettier --check + eslint — expect both clean
npm run format       # prettier --write
npm run build        # prerenders all nine routes; this is what proves SSR guards
npm test             # build + Playwright smoke test — expect 15 passed
npm run preview      # trustworthy again since Phase 7
npx serve build      # second opinion on the real output

# Reproduce the Pages build locally. Note: PowerShell, not Git Bash —
# bash mangles a leading-slash env var into a Windows path.
$env:BASE_PATH = "/HHI-Netherlands-Website"; npm run build
```
