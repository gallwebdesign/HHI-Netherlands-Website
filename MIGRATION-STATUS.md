# Migration status

Working notes for the static HTML → SvelteKit migration.
Last updated **14 August 2026** — media photos rescued, registration hub built,
favicon and social preview shipped.

Plan: <https://claude.ai/code/artifact/b42e8908-c534-4c72-8ef2-7a465a78ad28>
Branch: **`main`** — the migration was merged there in PR #2. Working tree clean;
`sveltekit-migration` merged and safe to delete.

## ▶ Start here on 14 August 2026

Everything below is written up in full; this is the short version.

**Do these in order. None of them needs the Cloud86 plan to exist yet.**

1. ~~**`git push`**~~ — ✅ done; `main` and `origin/main` are level.
2. ~~**Rescue the eight media photos from the old domain.**~~ ✅ **done 14 Aug** —
   all eight are in `static/img/` and the old host is no longer referenced. See
   the media section below. Note it did **not** solve the favicon gap: they are
   2000 × 600 banners, so open question 3 is still open.
3. ~~**Build the registration hub**~~ ✅ **done 14 Aug** — see *Registration hub*
   below. Note the two forms split by **competition, not by day**; the earlier
   "one form per day" note was wrong.
4. ~~**Write `static/.htaccess`**~~ ✅ **done 14 Aug** — legacy `.php` →
   clean-route 301s. Written and rule-tested, but **only verifiable once Cloud86
   is live**; verify on cutover day.

Also done 14 Aug, unplanned: **favicon and social preview** (open question 3),
once Iain supplied the logo. See *Brand assets* below.

**Every pre-purchase task is now done.** What remains needs either the Cloud86
account or a decision from Iain:

- **The photo archive — ~8,163 images, ≈7.8 GB.** ✅ Decided: **Iain pulls it
  himself over FTP.** No switch-off date is set, so it is not immediate, but it
  carries the only irreversible deadline on the project. See the section below.
- Cutover day: delete the Pages workflow, stop setting `BASE_PATH`, verify the
  redirects on the real host.
- Phase 8: `CONTACT_EMAIL` and a real contact form, both needing the mailbox.

**Explicitly NOT tomorrow, and why** — agreed with Iain 13 Aug:

- **Do not delete [.github/workflows/pages.yml](.github/workflows/pages.yml).** It
  is the only deployed staging environment that exists. Deleting it before Cloud86
  is live leaves no preview anywhere during the gap. It goes on cutover day.
- **Do not strip the base-path handling.** `BASE_PATH`, `withBase()` and
  `Nav.isActive`'s base-stripping are what make the Pages preview work, and they
  are already no-ops when `BASE_PATH` is unset. The cutover is "stop setting the
  env var and delete the workflow", *not* a code change. These two items are one
  task, and it belongs to cutover day.
- **Contact form and `CONTACT_EMAIL`** — both need the real mailbox to exist.
  Phase 8.

## Where we stopped

**Phases 0–6 are complete and deployed**, and **Phase 7 items 2–5 are done**
and pushed. All nine routes are ported. What remains in Phase 7 is the URL
cutover (item 1), which is no longer blocked — **hosting is settled: Cloud86**
(see below). It has not been executed yet.

Since then, on 14 Aug: the media photos are rescued, the registration hub is
built, and the favicon and social preview have shipped. The only pre-purchase
task left is `static/.htaccess`.

| Phase | State |
|---|---|
| 0 · Safety net | ✅ branch, 18 baselines, `.js [data-reveal]` bug fixed |
| 1 · Scaffold | ✅ skeleton + TypeScript, adapter-static, prerender |
| 2 · Layout | ✅ nav/menu/footer once, PageHero, `config.ts`, NL/EN toggle removed |
| 3 · Pilot (regulations) | ✅ data file + `nl.json`, entities → UTF-8 |
| 4 · Shared JavaScript | ✅ attachments, GSAP bundled, teardown, motion watchdog |
| 5 · Remaining sub-pages | ✅ all six ported, smoke test green |
| 6 · index.html | ✅ hero, stage floor, preloader, road pin, all sections |
| 7 · Delete old site | 🟨 items 2–5 done; `.htaccess` written — **only the cutover itself is left, and it needs the account** |
| 8 · Finish "fully functional" | 🟨 registration hub, favicon + social preview done; contact form and `CONTACT_EMAIL` still need the mailbox |

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

## Phase 7 — item 1, the URL cutover — `.htaccess` ✅ written 14 Aug 2026

**Correction to the earlier note: the legacy URLs are `.php`, not `.html`.**
The `.html` variants answer 200 but serve a **43-byte stub** — and so does any
nonexistent name, e.g. `zzz-not-a-page.html`. So `.html` was never a real URL,
and rules written only against it would have missed every genuine inbound link.
The `.php` set was read off the live site's own nav, not guessed.

**Two more corrections that came out of reading the real nav:**

- There is **no `media.php`**. The legacy site split media into **`photos.php`**
  and **`videos.php`**, both real; the migrated `/media` covers both.
- **`tickets.php`** exists and embeds the **old `shop.compoticketing.eu`**. It
  redirects to `/events`, which carries the current (Celebratix) tickets CTA —
  it cannot go to a local route because ticketing is off-site.

[static/.htaccess](static/.htaccess) now holds 15 rules, all `[R=301,L]`.
`.html` is still handled — cheap, and those URLs were linked over the years even
though they served a stub.

**`privacy-policy.php` is deliberately NOT redirected.** It is real, still linked
from the footer as `EXTERNAL.privacy`, and has no migrated route. Sending a legal
document people go looking for specifically to the home page is worse than a 404.
Give it a route, then add the rule.

**Verified** by replaying Apache's first-match-wins semantics over the parsed
rules: 24 cases pass including the negatives (clean routes, `/img` assets,
`/og-image.png`, `/_app/…` all correctly untouched), the gallery regex matches all
71 archive pages with none missed, and `adapter-static` does copy the dotfile into
`build/`. **Not** verified on LiteSpeed — that needs the Cloud86 account.

Both `npx serve build` and GitHub Pages resolve `/sponsors` by themselves, which
is why the smoke test and preview pass. That is those servers being helpful; it is
**not** evidence about Cloud86, and it does nothing about already-indexed inbound
links.

### What needs the plan, and what does not

Asked by Iain 13 Aug 2026: *can all of this be done before buying?* Mostly, but
not entirely — the split is what drives the running order at the top of this file.

| Task | Before the plan? |
|---|---|
| Registration hub (two JotForms) | ✅ fully — external URLs, no host involved |
| ~~Rescue the eight media photos~~ | ✅ **done 14 Aug 2026** |
| ~~Write `static/.htaccess`~~ | ✅ **written 14 Aug**, rule-tested; **verify on cutover day** — whether LiteSpeed applies it as expected is untestable until the account exists |
| Rescue the ~8,163-photo archive | ✅ **settled 14 Aug — Iain pulls it over FTP**, outside this repo; ≈7.8 GB is far too large for git |
| `regulations` → local PDF | ⚠️ partly — the dependency can be removed, but only once the PDF exists |
| Delete the Pages workflow | ❌ hold — it is the only staging environment; deleting it early leaves no preview at all |
| Stop setting `BASE_PATH` | ❌ hold — same task as the workflow. The two are in tension: the workflow *sets* `BASE_PATH` because Pages serves from a sub-path, so removing base handling early breaks the preview |
| `CONTACT_EMAIL` becomes real | ❌ needs the mailbox to exist |
| Real contact form (PHP) | ❌ needs somewhere to run — Phase 8 |

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

## Media photos — ✅ rescued 14 August 2026

**Done, and the deadline is cleared.** All eight files were pulled off
`hhi-netherlands.com/img/...` while it was still up and now live in
`static/img/`. **This repo is the only copy** — there is no backup anywhere else,
so treat `static/img/` as irreplaceable source material, not build output.

**Eight files**, all **2000 × 600**, 5.64 MB total — earlier notes said "eleven",
which conflated the eight photos with the three YouTube embeds. The videos are on
YouTube and were never at risk.

```
slideshow-v0.jpg    slideshow-v1.jpg    slideshow-v2.jpg    slideshow-v120.jpg
slideshow-v130.jpg  slideshow-v160.jpg  slideshow-v190.jpg  slideshow-v200.jpg
```

What changed:

- [media.ts](src/lib/data/media.ts) and [home.ts](src/lib/data/home.ts) now build
  their paths with **`withBase('/img/…')`**, not an absolute host. `withBase()` is
  required here for the same reason the nav needs it — both pages bind `src` from
  a variable, and Kit only rewrites root-relative paths written *literally* in
  markup. Verified: a `BASE_PATH` build emits
  `src="/HHI-Netherlands-Website/img/slideshow-v0.jpg"`.
- The home teaser reuses four of the eight (`v1`, `v120`, `v160`, `v190`) — same
  files, no duplicates on disk.
- **The smoke test's exemption is gone.** `smoke.spec.ts` used to filter
  `slideshow-v\d+\.jpg|ERR_|net::` out of the console-error assertion because the
  legacy host was unreliable. The whole filter was removed, so a missing image now
  fails the test. The 15 passing tests mean something they did not before.
- The load guard on both pages stays — it costs nothing and still catches a typo.

Verified after the change: `npm run check` 0/0, `npm run lint` clean, `npm test`
15 passed, and `build/img/` contains all eight with **no** `hhi-netherlands.com/img`
reference left anywhere in `build/`.

**The favicon / social-preview gap is *not* solved by these** (open question 3).
At 2000 × 600 they are 3.33:1 letterbox banners: unusable for a square favicon,
and a social preview at 1.91:1 would need a deliberate crop of someone's choosing.
A real logo asset is still needed.

## ⚠️ The photo archive — ~8,163 photos, undecided, and on the same deadline

**Found 14 Aug 2026 while writing `.htaccess`, by reading the legacy site's own
nav instead of assuming the nine main pages were everything.**

`photos.php` links to **71 gallery pages** — `hhi2010.php` through
`hhinl2026m.php`, covering **2010–2026**. Between them they hold roughly
**8,163 unique images**. Each exists twice: a thumbnail under `…/thumbs/` and a
full-size original under `…/big/`, referenced from a `data-image` attribute.

```
hhinl2019a.php   →  images/2019/zaterdag/1/thumbs/tile1.jpg   (thumb)
                 →  images/2019/zaterdag/1/big/tile1.jpg      (~1 MB original)
```

Sampled full-size images average **~1 MB**, so the originals alone are
**≈7.8 GB**, plus thumbnails.

**This dies with the host, exactly like the eight media photos did — but it is
about a thousand times larger.** The eight rescued photos are a rounding error
next to this; they were the slideshow, not the archive.

### ✅ Decided (Iain, 14 Aug 2026): Iain pulls it himself over FTP

**Not a task for this repo, and not something to scrape.** FTP takes the
originals straight off the filesystem, which is both faster than fetching 71
pages and *more complete* — it picks up anything the gallery markup never
linked. 7.8 GB must not go into git in any case.

**No switch-off date is set** (Iain, 14 Aug 2026), so this is urgent-but-not-
immediate. It is still the item with the only irreversible deadline, so it
should not drift indefinitely.

**Useful facts if the FTP pull needs checking against the web view:** the paths
follow `images/<year>/<day>/<n>/big/tileN.jpg` with a `thumbs/` sibling; `big/`
holds the ~1 MB originals. 71 pages, ~8,163 unique images, 2010–2026.

Note the `.htaccess` collapses all 71 gallery URLs to `/media` so inbound links
do not 404. If the archive is ever republished, give it real routes and replace
that one rule.

## Brand assets — ✅ 14 August 2026

**`static/img/Hip Hop International Logo.svg`** — the official logo, supplied by
Iain. A true vector: 23 paths, no embedded raster, no `<text>`. Its orange is
`#ff4d00`, which is exactly `--oranje` — the site was designed around this asset.
The SVG has usefully named groups (`HipHop_Front`, `Netherlands`,
`Red_Border_White_Fill_Tags`, …), which is what made the favicon crop possible.

**Favicon** — `src/lib/assets/favicon.svg`, the logo's **front plate alone** on a
square canvas. The full lockup is two overlapping rotated plates plus the
NETHERLANDS wordmark; below ~32px it is an orange smudge. Verified by rendering
at 180/64/32/16px on dark and light grounds. **This replaced the stock Svelte
logo** — the scaffold's default had been shipping as the site's favicon all along.

**Social preview** — `static/og-image.png`, 1200 × 630, the full logo over
`--ink` with the date and venue **read out of `config.ts`**, not typed in.

Both were produced by throwaway Node scripts (Playwright renders the PNG, so no
image dependency was added). The scripts are not in the repo: regenerating is a
once-a-year job and the inputs are all recorded here.

**One trap worth remembering.** `og:url` and `rel="canonical"` are built from
`page.route.id`, **not** `page.url.pathname`. The pathname carries the base path
under the Pages build, which emitted
`hhi-netherlands.com/HHI-Netherlands-Website/sponsors` — a URL that does not exist
on the real domain. `route.id` is always the bare route. Verified both build modes
now emit identical canonicals.

`SITE_URL` is new in `config.ts`: Open Graph ignores root-relative image paths, so
the production domain has to be written down exactly once.

## External links — confirmed 13 August 2026

## Registration hub — ✅ built 14 August 2026

**Correction to the 13 Aug note.** These are *not* a Saturday form and a Sunday
form. Both were fetched on 14 Aug and their own titles are:

- **Netherlands HHDC** — <https://form.jotform.com/262132296237961>
  ("Netherlands HHDC Registration Form 2027")
- **HHI Open Division** — <https://form.jotform.com/262132162311946>
  ("HHI Open Division Registration Form 2027")

**They split by competition, not by event day.** Both return 200. The day framing
was wrong and appears nowhere on the site; a smoke test asserts the cards never
say Saturday or Sunday, so it cannot creep back.

This also *dissolves* the problem the hub was designed around — a crew picks by
what they are entering, which they know, not by a day nobody has announced.

**Shape as built:** all six CTAs (home hero, home closing CTA, `/events`,
`/registration` ×2, `MobileMenu`) point at `/registration`. Only the hub links
out to a form. `EXTERNAL.registration` is gone, replaced by `REGISTRATION_FORMS`
and `REGISTRATION_HUB` in [config.ts](src/lib/config.ts).

The unannounced day split is still addressed on the page — a notice says the
programme decides which divisions dance when, rather than implying a crew should
already know. Delete that notice when the schedule lands.

Two details worth keeping in mind:

- **The `MobileMenu` CTA is internal now, so it needed `menu.close()`.** Client-side
  navigation would otherwise leave the panel open on top of the destination.
- **A pre-existing `.check` layout bug was fixed here**, found only by looking at
  the page in a browser: the `li` is a two-column grid with *three* children (the
  `::before` marker, `<b>`, `<span>`), so the span was pushed into an implicit
  ~26px third column and the body text wrapped one word per line.

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
3. ~~**Favicon and social preview**~~ — ✅ **settled 14 Aug 2026.** Iain supplied
   the official logo as a true vector. See *Brand assets* below.
4. **Division split across the two event days** — not needed to ship. It no longer
   gates the registration hub (the forms split by competition, not by day), but it
   still gates the events schedule and the hub's "which day" notice.
5. ~~**The photo archive**~~ — ✅ **settled 14 Aug 2026: Iain pulls it over FTP.**
   Not a repo task. No switch-off date is set, but it is the only irreversible
   deadline on the project, so do not let it drift. See the archive section above.

## Things to remember

- **`static/img/` is irreplaceable.** The eight photos and the logo SVG there are
  the only copies in existence — the host the photos came from is being switched
  off. Never "clean" that directory, and never treat it as build output.
- **The smoke test exempts third-party origins only, and by origin — not by
  resource type.** `fonts.gstatic.com` intermittently 404s a `.woff2` (seen ~1 run
  in 3, and it fails a *different* page each time, which is what makes it look
  like a real regression). Anything served from our own origin still fails the
  test. Do not widen that filter to silence a local asset: verified by deleting an
  image from `build/` and confirming the test fails and names the URL.
- **Chrome's console message for a failed request does not include the URL** — it
  is literally `Failed to load resource: … 404 ()`. The smoke test therefore
  tracks requests through the `response` event, which does carry it, and drops the
  matching console line so one failure is not counted twice. Without this a 404 is
  untraceable and cannot be attributed to an origin.
- **Image paths must go through `withBase()`.** Both `media.ts` and `home.ts` bind
  `src` from a variable, and Kit only rewrites root-relative paths written literally
  in markup. A raw `/img/…` there silently 404s on the Pages sub-path while looking
  perfectly fine locally.
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
npm test             # build + Playwright smoke test — expect 17 passed
npm run preview      # trustworthy again since Phase 7
npx serve build      # second opinion on the real output

# Reproduce the Pages build locally. Note: PowerShell, not Git Bash —
# bash mangles a leading-slash env var into a Windows path.
$env:BASE_PATH = "/HHI-Netherlands-Website"; npm run build
```
