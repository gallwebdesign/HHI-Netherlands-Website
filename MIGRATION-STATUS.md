# Migration status

Working notes for the static HTML → SvelteKit migration.
Last updated **15 August 2026** — the event day split was confirmed and carried
through the site (events schedule now splits by day; registration notice states
the mapping), and the **privacy policy was migrated to `/privacy`**, which was
the last legacy page still serving real content. Before that, on 14 Aug: media
photos rescued, registration hub built, favicon and social preview shipped, two
layout/navigation bugs fixed.

Plan: <https://claude.ai/code/artifact/b42e8908-c534-4c72-8ef2-7a465a78ad28>
Branch: **`main`** — the migration was merged there in PR #2. **Working tree
clean and everything is pushed**; `main` and `origin/main` are level.
`sveltekit-migration` merged and safe to delete.

Verified on the final commit: `npm run lint` clean, `npm run check` 0 errors / 0
warnings, `npm test` **24 passed**.

## ▶ Start here on 16 August 2026

**Nothing is half-finished.** Every pre-purchase task is done and pushed. What
is left needs either the Cloud86 account or a decision:

1. **Buy the Cloud86 plan.** Two details to confirm at purchase: what "Git
   integratie" actually does, and whether a cheaper tier keeps mail + SSH +
   `.htaccess`. This unblocks everything below.
2. **The photo archive — ~8,163 images, ≈7.8 GB.** Iain's own FTP pull. No
   switch-off date is set, but it is the only irreversible deadline left.
3. **Cutover day** (needs the account): delete the Pages workflow, stop setting
   `BASE_PATH`, verify the `.htaccess` redirects on the real host.
4. **Phase 8** (needs the mailbox): `CONTACT_EMAIL` becomes real, and the
   contact form becomes a working PHP form.

~~One small chore: `src/lib/config.ts` fails `npm run lint` on line endings.~~
✅ **Done 15 Aug 2026** — formatted as part of the day-split work, since that
commit had to touch `config.ts` anyway. `npm run lint` is clean.

## The event day split — ✅ confirmed 15 August 2026

**30 January is the HHI Open Division; 31 January is the Netherlands HHDC.**
This closes open question 4 for everything except the running order within each
day. Iain confirmed it and stated it on the events page first (`1ed0ea2`); the
rest of the site was brought in line afterwards.

Where it now lives:

- **`EVENT_DAY_ONE` / `EVENT_DAY_TWO`** in [config.ts](src/lib/config.ts) —
  derived from `EVENT_DATE` and `EVENT_END_DATE`, like `EVENT_DATE_RANGE`. **No
  page hand-types a day label**, so the schedule cannot drift from the countdown.
- **The events schedule is now two days side by side** — `SCHEDULE` in
  [events.ts](src/lib/data/events.ts) is a `ScheduleDay[]`, each with its own
  competition and rows. Two columns ≥1001px, stacked below. Rows are **time +
  category only**; the old right-hand qualifier column (`.sched__note`) is gone.
- **Each day's categories are that competition's own divisions**, taken from
  `REGISTRATION_FORMS` rather than retyped — Open gets Parents and Special
  Crews, HHDC gets MiniCrew and the two MegaCrews.
- **The `/registration` notice answers the question** instead of promising an
  announcement. It also carries the qualifier point, because that is the reason
  to enter the HHDC over the Open Division and this is where crews choose.

**The times are still indicative.** Both days reuse the same 10:00–19:30
skeleton, and the events footnote says the schedule is subject to change. The
data shape already lets the two days diverge — replace the rows per day when the
official programme lands, and drop the "final times" sentence from the notice.

**`REGISTRATION_FORMS` is ordered by day** (Open first) as of `1ed0ea2`, and the
events schedule renders in the same order. The comment in `config.ts` says so;
do not re-sort it alphabetically.

⚠️ **Two naming inconsistencies, both harmless but worth knowing.** The
registration notice says **"HHI World Finals"** while
[events.ts](src/lib/data/events.ts) says **"HHI Worlds"** and the home page says
**"World Hip Hop Dance Championship"** — three names for one event. The smoke
test deliberately matches loosely (`/HHI World/`) so it asserts the claim, not
the wording. Worth settling on one name in a copy pass.

Three tests now guard this, and the day-mapping one was verified non-vacuous by
swapping the two days and watching it fail:

- `events schedule splits into the two confirmed days`
- `registration hub states which competition dances on which day`
- the footnote's "subject to change" wording

## Privacy policy — ✅ migrated 15 August 2026

**The last page of the old site still serving real content with no migrated
route.** It is now [/privacy](src/routes/privacy/+page.svelte), with the text in
[privacy.ts](src/lib/data/privacy.ts).

**The Dutch is the authoritative text and is reproduced verbatim.** Only the
encoding was touched: the legacy page served Latin-1 mislabelled as UTF-8, so
`geïnteresseerd`, `enquête` and `video’s` arrived as mojibake. **Do not reword
the Dutch** — it is a legal document, and rewriting it changes what was
published.

**Both languages ship, Dutch primary** (decided with Iain, 15 Aug). The site is
otherwise English-only, so a visitor would reasonably assume an English policy
is the real document. A notice at the top of the page states in both languages
that the Dutch prevails, and a local toggle switches between them. That toggle is
**not** the site-wide i18n removed in Phase 2 — it is a local `$state` swap
between two fields on the same records, so it needs no store and no URL
parameter, and both languages are in the prerendered HTML either way.

**`EXTERNAL.privacy` is gone.** The footer now links to `/privacy` internally
rather than at the dying host, and `.htaccess` gained the two rules its own
comment had been asking for (`privacy-policy.php` and `.html` → `/privacy`).

**Two things on the page are deliberately not `reveal()`'d**: the precedence
notice and the language switch. `reveal()` parks an element at `autoAlpha:0`
until its ScrollTrigger fires, which also drops it out of the accessibility
tree — wrong for a control that chooses the language and for the text stating
the document's legal standing. This was caught by a test timing out on a button
it could not see.

⚠️ **Two things to confirm with Iain before the old host goes dark:**

- **The controller named in the policy is Marion Gall-Wierts.** Carried over
  as-is (confirmed 15 Aug), but worth re-checking it is still current.
- **The policy tells people to use "het contact formulier" to exercise their
  rights.** That was `contact.php`. The page links to `/contact` instead, whose
  form is still the Phase 8 placeholder — so the route a visitor is told to use
  for a GDPR request is not yet functional. **This is the strongest argument for
  Phase 8 being real work, not polish.**

## What was done on 14 August 2026

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

**Two bugs found by Iain testing on a real device and by clicking around**, both
fixed and both now covered by tests:

- **The hero collided with the nav on short viewports** (`6ef33cb`). Reported
  from a Samsung S24+, where browser chrome leaves ~640px and the eyebrow
  landed 43px *inside* the logo. The nav is `position:fixed` and contributes
  nothing to flow, so `.hero` now reserves `--nav-h` (72px) plus breathing room
  in its top padding. The desktop screenshot never showed this because there is
  plenty of vertical room at 1440px.
- **Navigation did not return you to the top of the page.** Leave `/events` with
  the footer on screen, arrive at `/sponsors` still looking at the footer. Cause
  and fix are written up under *Things to remember*; the short version is that
  `html{ scroll-behavior:smooth }` cannot be used on a client-routed site.

  ⚠️ **This fix lives in `6796ebc`, whose message reads "Updated Division Total
  on Homepage".** The message badly understates the commit: it carries
  `smoothAnchor()` in `attachments.svelte.ts`, the `style.css` change, the
  registration page's two anchors and 69 lines of new tests, alongside the
  one-line division-total edit. There is no separate scroll-fix commit to find.

**Iain's content pass** (`def7aaa`, `086a868`, `95bc742`, `6796ebc`, `7be1562`):
founded year, current year, NHHDC categories, the homepage division total, and
the results categories. Note the divisions are now **six** — JV MegaCrew was
added — which is why the smoke test no longer hard-codes a count of 5.

**Every pre-purchase task is now done.** What remains needs either the Cloud86
account or a decision from Iain:

- **The photo archive — ~8,163 images, ≈7.8 GB.** ✅ Decided: **Iain pulls it
  himself over FTP.** No switch-off date is set, so it is not immediate, but it
  carries the only irreversible deadline on the project. See the section below.
- Cutover day: delete the Pages workflow, stop setting `BASE_PATH`, verify the
  redirects on the real host.
- Phase 8: `CONTACT_EMAIL` and a real contact form, both needing the mailbox.

**Explicitly NOT before the account exists, and why** — agreed with Iain 13 Aug,
and still true:

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
and pushed. All nine legacy routes are ported, plus /privacy (15 Aug). What remains in Phase 7 is the URL
cutover (item 1), which is no longer blocked — **hosting is settled: Cloud86**
(see below). It has not been executed yet.

Since then, on 14 Aug: the media photos are rescued, the registration hub is
built, the favicon and social preview have shipped, `static/.htaccess` is
written, and two bugs are fixed. **Every pre-purchase task is complete** — what
remains needs the Cloud86 account or the mailbox.

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

[static/.htaccess](static/.htaccess) now holds 17 rules, all `[R=301,L]`.
`.html` is still handled — cheap, and those URLs were linked over the years even
though they served a stub.

~~**`privacy-policy.php` is deliberately NOT redirected.**~~ ✅ **Resolved 15 Aug
2026** — it now has a real route at `/privacy`, so both `privacy-policy.php` and
`privacy-policy.html` 301 there, and the footer links internally. `.htaccess` is
17 rules. See *Privacy policy* below.

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

**The "which day" notice was rewritten, not deleted** (15 Aug 2026). The earlier
instruction here said to delete it once the schedule landed; that turned out to
be wrong. The question does not go away when it gets an answer — crews still ask
it, so the notice now states the mapping (Open on day one, HHDC on day two) and
carries the qualifier point. See *The event day split* above.

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

**Two `EXTERNAL` links still point at the dying host** and break when it goes:
`contactForm` and `regulations` (used on [contact](src/routes/contact/+page.svelte#L76)
and [regulations](src/routes/regulations/+page.svelte#L47)). Regulations probably
wants to become a hosted PDF; the contact form is Phase 8, and Cloud86's PHP
means it can be a real form.

~~`privacy` in the footer~~ — ✅ **fixed 15 Aug 2026**: `/privacy` is a real
route now and `EXTERNAL.privacy` is gone. See *Privacy policy* above.

## Open questions — need answers

1. ~~**Hosting**~~ — **settled 13 Aug 2026: Cloud86.** See the hosting section above.
   Two purchase-time details still to confirm there (Git integration, cheaper tier).
2. **Contact address** — `CONTACT_EMAIL` in [config.ts](src/lib/config.ts) is still
   a guess, but **stops being one at Cloud86**: the mailbox gets created by hand, so
   `info@hhi-netherlands.com` becomes true by construction. Confirm on setup.
3. ~~**Favicon and social preview**~~ — ✅ **settled 14 Aug 2026.** Iain supplied
   the official logo as a true vector. See *Brand assets* below.
4. ~~**Division split across the two event days**~~ — ✅ **settled 15 Aug 2026:
   30 Jan is the HHI Open Division, 31 Jan the Netherlands HHDC.** Live on the
   events page and the registration hub. See *The event day split* above. What
   is still open is narrower: **the running order within each day**, which is
   why both days currently show the same indicative 10:00–19:30 skeleton.
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
- **A second console flake, seen 15 Aug 2026:** `Permissions policy violation:
  compute-pressure is not allowed in this document`. Chrome emits it, it hits a
  random page (seen on `/media`), and it passes on re-run with identical code —
  same shape as the `fonts.gstatic.com` flake above. **It was not filtered out**:
  the console-error assertion is deliberately strict, and widening it to silence
  browser chatter is how a real regression gets hidden. Re-run before believing a
  lone console failure on a page you did not touch.
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
- **Never put `scroll-behavior:smooth` on `html`.** It was inherited from the legacy site
  and removed 14 Aug 2026. Globally it also applies to SvelteKit's `scrollTo(0,0)`
  navigation reset, turning it into an animation that the layout's `ScrollTrigger.refresh()`
  interrupts — leaving you at the *old* scroll position on the new page (leave `/events`
  at the footer, arrive at `/sponsors` still at the footer; measured landing at 478–545px
  instead of 0). In-page anchors use `smoothAnchor()` in `attachments.svelte.ts` instead,
  which scopes the animation to the click and honours reduced motion. Two tests guard it,
  and both were verified to fail with the rule reinstated.
- **Verify a fix against a build made from the fixed source.** `npx playwright test` alone
  reuses whatever is in `build/`, so a test can pass against a stale build while the bug is
  live in `src/` — that happened while fixing the scroll bug and briefly looked like a
  passing test. `npm test` rebuilds first, which is why it is the command that counts.
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
npm run build        # prerenders all ten routes; this is what proves SSR guards
npm test             # build + Playwright smoke test — expect 24 passed
npm run preview      # trustworthy again since Phase 7
npx serve build      # second opinion on the real output

# Reproduce the Pages build locally. Note: PowerShell, not Git Bash —
# bash mangles a leading-slash env var into a Windows path.
$env:BASE_PATH = "/HHI-Netherlands-Website"; npm run build
```
