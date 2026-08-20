# Migration status

Working notes for the static HTML → SvelteKit migration.
Last updated **17 August 2026** — **`hero-two-column` landed on `main`**,
settling the one unresolved piece of work in the repo. On top of it, three
pieces of home-hero polish landed the same day: the **black band under the nav
was trimmed 25%**, the **ticker now pins to the bottom of the viewport on load**
at desktop widths and unpins on the first scroll, and the **hero block was
re-centred between the nav and that pinned strip** rather than within the raw
viewport. Iain also added the **Dutch translations of both rules PDFs**, which
nothing links yet. On 16 Aug the hero was rebuilt as two columns with the NHHDC
lockup, a **scroll-to-top button** was added to every route, and
**`/regulations` was split into two competition columns** (Open Division and
Netherlands HHDC), with Iain writing the real Open Division rules. Before that,
on 15 Aug: the event day split was confirmed and carried through the site, the
**privacy policy was migrated to `/privacy`**, and **the reduced-motion freeze
on the hero was found and fixed** (Android's reduce-animations setting, not
performance). On 14 Aug: media photos rescued, registration hub built, favicon
and social preview shipped, two layout/navigation bugs fixed.

Plan: <https://claude.ai/code/artifact/b42e8908-c534-4c72-8ef2-7a465a78ad28>
Branch: **`main`** — the migration was merged there in PR #2.
`sveltekit-migration` merged and safe to delete.

⚠️ **One commit is unpushed** as of the end of 17 Aug: `af789e8`, the Dutch full
rules manual. Everything else is level with `origin/main`. Nothing is
half-finished — see *Start here* below.

**The commit before the hero work is tagged `pre-hero-merge` (`b6e895b`).**
`git reset --hard pre-hero-merge` undoes all of 17 August. ⚠️ **The `revert -m 1`
escape hatch does not apply here** — the branch was fast-forwarded, so there is
no merge commit to revert; undoing selectively means reverting the individual
commits listed in *Home hero finished* below.

Verified on `main` at the end of 17 Aug: `npm run lint` clean, `npm run check`
0 errors / 0 warnings, `npm test` **37 passed** (31 → 33 with the two
regulations layout tests, → 36 with the three scroll-to-top tests on 16 Aug,
→ 37 with the hero layout test, which arrived with the hero merge).

## ▶ Start here on 18 August 2026

**Nothing on `main` is half-finished.** Every pre-purchase task is done. What is
left needs either the Cloud86 account or a decision:

0. **`git push`.** One unpushed commit: `af789e8`, the Dutch full rules manual.
   Everything else from 17 Aug is already on `origin/main`.
1. **Buy the Cloud86 plan.** Two details to confirm at purchase: what "Git
   integratie" actually does, and whether a cheaper tier keeps mail + SSH +
   `.htaccess`. This unblocks everything below.
2. **The photo archive — ~8,163 images, ≈7.8 GB.** Iain's own FTP pull. No
   switch-off date is set, but it is the only irreversible deadline left.
3. **Cutover day** (needs the account): delete the Pages workflow, stop setting
   `BASE_PATH`, verify the `.htaccess` redirects on the real host.
4. ~~**Phase 8** (needs the mailbox): `CONTACT_EMAIL` becomes real, and the
   contact form becomes a working PHP form.~~ ✅ **Built 20 Aug 2026** on
   `contact-form-php` — see *The contact form* below. **One step is still
   Iain's: create the `info@hhi-netherlands.com` mailbox in the Cloud86
   panel.** Until it exists the form accepts submissions and delivers
   nothing, which is the one failure mode that looks like success.

~~One small chore: `src/lib/config.ts` fails `npm run lint` on line endings.~~
✅ **Done 15 Aug 2026** — formatted as part of the day-split work, since that
commit had to touch `config.ts` anyway. `npm run lint` is clean.

## The contact form — Phase 8, built 20 August 2026

**Branch `contact-form-php`.** The form stopped being a `mailto:` compose and
became a real submission: it posts JSON to a PHP endpoint on Cloud86, which
validates it, filters spam and mails `info@hhi-netherlands.com`.

⚠️ **IT DOES NOT DELIVER YET, AND IT FAILS SILENTLY.** The mailbox
`info@hhi-netherlands.com` had not been created on Cloud86 as of 20 Aug 2026.
Until it exists, `mail()` accepts the message, returns success, and the mail
goes nowhere — the visitor sees "We got it." and nothing arrives. **Create the
mailbox in the Cloud86 panel, then send a test through the live form before
trusting the page.** This is the only outstanding step, and it is not repo work.

### What was removed, and the one consequence

Two of the three "Reach us" facts are gone at Iain's request: **Socials** and
**E-mail**. The socials survive in the footer on every page, so nothing was lost
sitewide. **The e-mail address is now absent from the markup entirely, and that
is deliberate rather than incidental** — a `mailto:` in the HTML is harvested by
the same crawlers the endpoint's spam defences exist to stop, so printing it
would undo part of what was just built.

~~⚠️ **The visible consequence: the left column is now mostly empty.**~~
✅ **Filled 20 Aug 2026** — see *The envelope* below. The left column went from
178px to 460px against a 578px form.

### The endpoint — `static/api/contact.php`

Lives in `static/`, so Vite copies it verbatim into `build/api/contact.php` and
the existing FTP action pushes it to `/httpdocs/api/contact.php`. **No workflow
step was added for it**; the only workflow change was an `exclude` (see below).

Six layers, cheapest first. The ordering is the point: an instant-submit bot is
rejected before any string work happens.

| Layer | Catches | Answer |
|---|---|---|
| Method + content type + `Origin` | cross-site and drive-by posts | 405 / 415 / 403 |
| Honeypot (`company`) | anything that fills every input | **200, silently dropped** |
| Timing trap (<3s, >6h) | scripted instant submits, replays | **200, silently dropped** |
| Rate limit (3/15min, 10/day per IP) | flooding | 429, honestly |
| Field validation | malformed input | 422 + per-field messages |
| **CRLF / header tokens** | **mail-header injection** | 400 |
| Link and markup heuristics | bot spam payloads | **200, silently dropped** |

Three things about that table are load-bearing:

- **The silent drops answer 200 on purpose.** A bot told "rejected" retries with
  a variation; a bot told "sent" goes away. The rate limit is the exception — it
  can hit a real person who sent one message and thought of something to add, so
  it says what happened.
- **CRLF is rejected, never stripped.** This is the only layer defending against
  a real security bug rather than a nuisance: a newline in a value that reaches a
  header lets an attacker append `Bcc:` and turn the form into an open relay,
  which gets the domain blacklisted. A name containing a CRLF is not a name that
  needed cleaning — quietly repairing it into a delivered mail hides the attack.
- **The heuristics layer is deliberately the weakest.** A false positive there
  silently discards a real message from a real crew, which is worse than a spam
  mail someone deletes in two seconds. One or two links pass; four do not.

The IP is **hashed, never stored in the clear**, in the rate-limit files under
`sys_get_temp_dir()` — that file is a log of who contacted the championship, and
the policy at `/privacy` does not promise to keep one.

### SMTP, if mail() ever proves unreliable

`mail()` is what ships, because it needs no secret. If mail starts landing in
spam, create `/httpdocs/api/contact.secret.php` **on the server by hand**
returning `['host', 'port', 'user', 'pass']`, and `contact.php` picks it up
automatically — no code change. It is gitignored, **and the FTP action now
carries an `exclude` for it**, because the action mirrors `build/` and deletes
what it does not find there; without that exclusion the next deploy would wipe
the credentials and silently fall back to `mail()`.

⚠️ Setting `exclude` **replaces the action's default excludes wholesale**, so
the `.git*` and `node_modules` patterns are repeated in the workflow. Do not
trim them.

### How it was verified

- **`npm test` → 45 passed** (37 before, plus five contact-form tests and three
  for the envelope and the form width).
- ⚠️ **The Playwright tests stub the endpoint and prove nothing about the PHP.**
  The harness serves `build/` as static files, so the PHP never executes;
  `page.route()` stands in for it. They prove the *client* handles each response
  shape. **Do not read a green suite as "the form works".**
- **The PHP was verified separately against `php -S`** — 18 of 20 cases passing,
  with the two "failures" traced to the bash harness mangling multi-byte
  characters, not the endpoint. Re-tested with PHP-generated JSON: em dashes,
  curly quotes, apostrophes, emoji and Dutch accents all pass. Header
  construction was checked separately (RFC 2047 encoding, 7-bit-clean headers,
  SMTP dot-stuffing).
- **Looked at, not just measured** — desktop and mobile, plus the confirmation
  and error states, per the standing rule in CLAUDE.md.

⚠️ **A trap for the next person writing a contact test.** The form sits behind
`reveal()`, which holds it at `visibility:hidden` until its ScrollTrigger fires.
Below the fold it is *attached but unfillable*, so `page.fill()` times out
against a perfectly working form. `fillContactForm()` scrolls first, which is
what a real visitor does. Three tests failed this way before it was added, and
a fourth did later — the envelope test, the same afternoon, the same cause.

### The envelope — 20 August 2026

**Fills the space the two removed facts left**, built from a reference Iain
supplied: an open envelope with a letter rising out of it, redrawn in the site's
palette. Lives in [EnvelopeMark.svelte](src/lib/components/EnvelopeMark.svelte)
and is **the first inline SVG in the repo** — drawn rather than shipped as an
asset because it is nine paths of flat geometry, and a file in `static/` would
be a request plus a second place to keep the colours in sync. It reads `--oranje`
through `currentColor`, so it follows the palette automatically.

Decorative and marked as such: `aria-hidden`, no title, no role. It says nothing
the page does not already say in text.

⚠️ **Three geometry and layering rules, each of which produced a visibly wrong
drawing before it was fixed:**

- **The front panel needs an opaque `--ink` fill, not `fill:none`.** That
  overlap is the entire illusion of a sheet sitting *inside* an envelope. With
  no fill, the letter's bottom edge shows straight through and the drawing goes
  flat.
- **The letter's bottom edge must stay above the fold's fall at the letter's own
  left edge.** The front occludes along the diagonal (12,78)→(120,140), which at
  x=52 is already down at y≈101 — a letter reaching lower shows its bottom
  corners *below* the envelope. It is 82 units tall for that reason; do not
  lengthen it without re-checking.
- **`--panel` fills and `--line` strokes are too dim at this size.** The letter
  first rendered as a grey ghost and the address tile as muddy brown
  (`currentColor` at .28 over `--ink`). The paper carries its own `#1c1c28` with
  a bright edge, the tile is full-strength orange, and the text rules are
  `--bone` at .35.

⚠️ **The draw-in has to be gated on visibility, and the reason is not obvious.**
A CSS animation starts at page load, but the wrapper is held at
`visibility:hidden` by `reveal()` until its ScrollTrigger fires — so an ungated
draw *finishes unseen* and the envelope simply fades in already-complete. That
was measured here at dashoffset 0 before the section had ever been scrolled to,
not guessed. An IntersectionObserver in the component adds `.envelope--drawn`,
and the animation hangs off `.envelope--animate.envelope--drawn`; `--animate`
alone only sets the undrawn start state. A test asserts the whole sequence.

Under reduced motion it is forced complete, **without waiting for the
observer** — the undrawn state lives on `--animate` alone, so a rule keyed to
`--drawn` would leave a blank frame. Same principle as the stage floor and the
ticker: less motion, never a missing drawing.

On mobile it is `display:none`. Stacked, it would sit between the Organisation
fact and the form and push the form below the fold for the sake of a decoration.

### The form width

⚠️ **The cap on `.form` is what narrows the form — the grid is not.** Evening
`.contact-grid` from 5fr:6fr to 1:1 was expected to trim the form and **did the
opposite**: measured 625px, up from 610px, because the columns had slack the
form was already absorbing. `max-width:540px` on `.form` (and on `.form-sent`,
so the column does not jump on submit) is the only reliable control. A test
asserts the rendered width, so a future grid change cannot silently widen it.

## Home hero finished — 17 August 2026

**`hero-two-column` went to `main`**, and three pieces of polish followed on top
of it. All of it is desktop-facing; mobile was verified unchanged at each step.
The commits:

| Commit | What |
|---|---|
| `bfba52b` | Desktop lockup enlarged, mobile type rebalanced |
| `f778bf3` | Black band under the nav trimmed 25% |
| `52a1981` | Ticker pinned to the bottom on load **and** hero re-centred against it |

⚠️ **It was a fast-forward, not a merge — there is no merge commit**, so
`git revert -m 1` has nothing to act on and `git log --merges` will not show
this work. `bfba52b` sits directly on top of 16 Aug's `d92fca8`. To undo the
whole day, reset to the `pre-hero-merge` tag (`b6e895b`).

⚠️ **The `hero-two-column` branch still exists** and now points into `main`'s
own history, so it is a stale label rather than unmerged work. Deleting it is
safe; `git branch -d hero-two-column` will confirm that by succeeding.

⚠️ **`52a1981`'s message understates it.** "Pinned Ticker to bootm of viewport
when loaded for first time" also carries the hero re-centring, a separate
mechanism with its own traps — the same kind of understated message as
`6796ebc` further down this file. There is no separate centring commit to find.

### The lockup sizing — `bfba52b`

Desktop had room the lockup was not using: the width cap went **520 → 700px**
and the height cap **420 → 460px**. Mobile pulled the other way — the lockup
dropped to **90%** width to keep it off the screen edges, and the title stepped
up **14vw → 18vw** (sub-row 6.4 → 8vw) to fill the space that freed. The
hero-height smoke test still passes, so the taller cap stays inside the budget.

### The black band under the nav — `f778bf3`

`.hero`'s top padding is `calc(var(--nav-h) + clamp(…))`. **Only the clamp is
negotiable** — it went `52/4vh/56` → `39/3vh/42`, a 25% trim. The `--nav-h` term
is the fixed nav's own reservation, and shrinking it reopens the S24+
print-through bug from 14 Aug. Verified at 412×640 that the lockup still clears
the logo and burger by 49px.

⚠️ **Desktop and mobile respond differently to that one declaration, and the
difference is not a bug.** Mobile is `justify-content:flex-start`, so the
padding sets the gap directly: 44 → 31px, the full 25%. Desktop is
`justify-content:center`, so the block is centred in leftover height and gives
most of the cut straight back: 126.2 → 100.2px, about 21%. **Padding is the
wrong lever for the desktop gap** — see the centring section below, which is
what actually moved it.

### The pinned ticker — `52a1981`

**Iain's brief: the ticker is visible on load without scrolling, and once you
start scrolling it behaves exactly as it did before.** So the pin is a
*load-time* state, not a scroll-triggered one — the opposite of how the
scroll-to-top button works, and worth reading twice before changing it.

Three guards in [+page.svelte](src/routes/+page.svelte), each load-bearing:

- **Desktop only** (≥1001px), matching the breakpoint the road pin and the
  two-column hero already use. Mobile's hero is deliberately taller than the
  screen, so there is no "bottom of the first screen" to pin to.
- **Only when it fits.** ⚠️ **The countdown sits at the bottom of the hero, so a
  blind pin covers the one thing a visitor most needs.** Measured at 1280×700:
  42.9px of clear space against a 74px strip — it would have covered the CTAs.
  At 1440×900 there is 100.8px and it fits with room to spare. The check is made
  against the real boxes at runtime, never against a viewport-height guess.
- **Unpin on the first scroll, permanently.** No re-pinning on a return to the
  top, which would make the strip jump around under the reader.

⚠️ **The fit check must wait for the preloader.** Measured before the curtain
lifts, the hero has not laid out and `.hero__meta` reads far lower than it ends
up — at 1280×700 the gap measured 42.9px against a settled 162.9px, so the strip
refused to pin on a viewport where it fits easily. It is gated on `heroReady`
plus one `requestAnimationFrame`. **This was written wrong first and caught by
measuring**, not by looking: the screenshot of the unpinned strip looks entirely
reasonable.

**`.ticker-slot` reserves the height while pinned**, so unpinning does not yank
the page up by 74px — measured shift is **0px**. Its height comes from a
`--ticker-h` custom property measured off the live element, because
`.ticker__item`'s font-size is a `clamp()` on viewport width; arithmetic in the
stylesheet would drift out of agreement with the real box at some window size.

### Centring between the nav and the ticker — also in `52a1981`

**Iain's observation: the hero block sat too low.** The cause is worth
remembering because the stylesheet looks correct either way — **the hero
reserved the nav but not the ticker.** `padding-top` accounts for the fixed nav,
so the top edge was honest; with the strip pinned it covers the bottom 74px, but
the hero still centred as though that band were free, seating the block half a
strip low.

`.hero:has(~ .ticker-slot.is-pinned)` adds a matching `padding-bottom`, so
centring splits what is genuinely visible. Measured at 1440×900, gap above the
content vs. below it: **100.8/26.8 → 63.2/63.8px**, an imbalance of 0.6px.

⚠️ **Two traps here, both hit during the work:**

- **`--ticker-h` had to move to `<main>`.** It was first set on `.ticker-slot`,
  which the hero can never read — custom properties inherit *down* the tree and
  the hero is a **sibling**, not a descendant. It would have silently fallen
  back to `0px` and looked as though the rule did nothing.
- **There is a genuine feedback loop.** The padding moves the countdown up,
  which increases the room, which feeds the fit check that decides whether to
  pin at all. It settles rather than flapping — the loop only ever reinforces
  "pins" — but this was verified by hammering the resize handler, not assumed.

**No test covers the pinned ticker.** The scroll-to-top button has three; this
has none. That is the known coverage gap at the end of 17 Aug — the geometry is
exactly the kind that computes plausibly and renders wrong, which is the lesson
the regulations and scroll-to-top work both recorded.

## The hero experiments — 16 August 2026, branch `hero-two-column` (now merged)

**Iain wanted the championship logo in the home hero.** Three designs were built
before one was accepted; the two rejected ones are recorded here because the
reasons they failed are design decisions, not bugs, and re-proposing them would
waste another session.

### ❌ Attempt 1 — logo inline in the title, joined by an "@"

*"Own the floor @ [HHI plates logo]"*, using
`Hip Hop International Logo.svg`. **Rejected on sight.** Worth knowing why the
markup fought back, since the same trap applies to any graphic set inside the
title rows:

⚠️ **The title rows are `overflow:hidden` masks with `line-height:.88`, and
flex breaks them.** As a flex *item* the word's own Anton font box (~1.5em)
drives the container height instead of the line-height, which inflated row 2
from 196px to 316px and dropped the logo onto the line below. Pinning the
container height pushed it out of the bottom instead (393px). **Plain inline
flow is correct** — the line box then governs all three children exactly as it
does for the other rows. Two flex versions were built and measured before this
was understood.

Also: the copy read *"Own the floor @ Hip Hop International Netherlands"*, a
venue construction, which reads as though HHI Netherlands were the *place*
rather than the championship.

### ❌ Attempt 2 — NHHDC lockup centred above a one-line title

Logo centred, `OWN THE FLOOR.` on a single centred line beneath, footnote
"Represent the Netherlands at the Worlds." **Also rejected.** The build was
sound and the measurements were fine; Iain simply did not want it.

⚠️ **One real trap surfaced here.** Its `.hero__title--centred` overrides had to
sit **after** the `.hero__title` rules in the file: both are specificity
(0,2,0), so source order decides, and written earlier the footnote kept the 96px
hollow-outline treatment and rendered as a full-width second headline. **The
screenshot showed it; the numbers did not.** That class no longer exists — it
was removed when attempt 3 replaced this layout — but the ordering rule it
taught applies to every `--modifier` override in this stylesheet.

### ✅ Attempt 3 — two columns, lockup left, title right

**Accepted, and now on `main`** (17 Aug — see *Home hero finished* above, which
also records the polish applied on top of it). Four commits:

| Commit | What |
|---|---|
| `48bd779` | The two-column split |
| `d63de5d` | Meta row moved to full width beneath both columns |
| `a953ec2` | Mobile becomes one centred column |
| `d9e59a4` | Desktop hero centred, cutting the black band above it |

**Shape.** Above 1000px the NHHDC lockup and the title sit side by side; the
lede, countdown and both CTAs span the full width underneath, exactly as on
`main`. Below 1000px everything stacks and centres, with the countdown and both
buttons stretched to the column width.

**The hero keeps `main`'s height on desktop** — that was Iain's constraint, and
the baselines were measured on `main` first: 900px at 1440×900 with the CTAs
ending at 864px. On mobile the constraint was **deliberately dropped** (Iain's
call): the lockup gets real size and the hero runs to 978px on a 780px screen,
so the CTAs sit below the fold and the page scrolls.

⚠️ **Four things that were got wrong first, all found by measuring rather than
looking:**

- **The title is sized in `cqw`, not `vw`.** At `15.5vw` it was scaling off the
  whole window while living in a ~45% column, so the hero hit 978px against a
  900px viewport with the CTAs off the bottom. `.hero__copy` is a
  `container-type:inline-size` so the type resolves against its own column.
- **`.hero__meta` belongs at `grid-column:1 / -1`, not inside the right
  column.** Nested there it crushed the lede to ~8 words a line and stacked the
  CTAs; full width, `main`'s own 1.4fr/1fr/auto grid applies unchanged.
- **Mobile overrides must repeat the `.hero__inner--split` prefix.** A media
  query adds no specificity, so the desktop two-column meta rule (0,2,0) beat a
  plain `.hero__meta` (0,1,0) and the countdown stayed squeezed at 390px with
  the hero 891px tall. **The same trap caught the desktop-centring rule**, which
  leaked to mobile until it was wrapped in `min-width:1001px`.
- **`min-height:auto` is required on the mobile hero.** Left at `100svh` with
  `justify-content:flex-end`, a block taller than the screen is bottom-anchored
  and its top is pushed up under the fixed nav — the S24+ collision class again.

**The black band above the hero** (Iain, same day) was `justify-content:flex-end`
on `.hero`. Bottom-anchoring suited a hero whose content nearly filled the
screen; with the shorter two-column block all the slack collected above it —
165px above against 36px below. It is now `center`, scoped with
`:has(.hero__inner--split)` so the eight `.page-hero` sub-pages are untouched.

**`static/img/NHHDC_Zwart-Wit-Rood_No Shadow.svg`** is the graffiti lockup
(898 × 590, true vector, no embedded raster). ⚠️ **It was sitting untracked in
`static/img/` and was nearly lost** when an experiment branch was deleted — the
build caught it (`Error: 404 …`) and it was recovered from the dangling commit.
✅ **Now on `main`** (17 Aug), so that particular risk is closed — but the lesson
stands for anything new in `static/`: check `git status` there before deleting a
branch. Two more untracked files appeared in `static/download/` the same day and
were committed for exactly this reason.

## Scroll-to-top button — 16 August 2026

**[ScrollTop.svelte](src/lib/components/ScrollTop.svelte), rendered once in
`+layout.svelte`, so it is on all ten routes.** Requested by Iain so readers do
not have to scroll back by hand. Bottom-right, a hard-edged 60px square with the
`--line` hairline, a drawn chevron over a Space Mono `TOP`, filling `--oranje` on
hover; 48px and arrow-only below 560px, which still clears the 44px touch
target.

**It is deliberately plain CSS and no GSAP.** The show/hide is an
opacity + visibility transition, so unlike the tween-driven attachments it
cannot be stranded mid-fade by a starved ticker — there is nothing for
`withWatchdog()` to rescue, nothing to load and nothing to kill on teardown.

**When it shows: past one viewport, but not once the footer is visible.**
Threshold is `window.scrollY > window.innerHeight` rather than a fixed pixel
count, so a phone and a 1440px monitor behave the same; `resize` is listened to
as well as `scroll`, because rotating a phone changes the threshold.

⚠️ **The footer rule is not cosmetic — it fixes a real collision.** At 1440px
the footer wraps its links to a second row, which puts **PRIVACY** in the
bottom-right corner directly under the button: `document.elementFromPoint` at
that link's own centre returned `.scroll-top__label`, i.e. the link was
unclickable. **The full-page screenshot showed nothing wrong**, because that row
was below the fold when it was captured — it was found by measuring hit-testing,
which is the lesson the regulations work already recorded. It matters more than
most links: the privacy policy tells visitors to use it to exercise their GDPR
rights. Nudging the button up by a fixed offset would only move the collision to
whatever width the footer wraps differently at, so it yields the corner instead,
via an `IntersectionObserver` on the footer.

**Two more things it has to get out of the way of:**

- **The mobile menu.** The menu is a full-screen panel at z-index 55 and the
  button is 65, so it would float over a page you are no longer looking at. It
  hides *and* goes `inert` while `menu.open`, so it also leaves the tab order.
- **The preloader.** z-index 65 sits above page content and the fixed nav (60)
  but below the grain (70), the cursor (90) and the curtain (100) — verified
  hidden at load on the home page.

**Reduced motion needs no override.** The scroll itself jumps
(`behavior:'auto'`, matching `smoothAnchor()`), and the blanket
`transition-duration:.01ms` rule makes the button appear rather than fade —
correct here, since this is a control, not decoration. The "slow it down rather
than freeze it" rule applies to *decorative* motion; a control should just be
there. Verified on the home page with `reducedMotion:'reduce'`: hidden at load,
visible mid-page, click jumped 1800 → 0, no console errors.

### Three tests, all verified non-vacuous

`npm test` is now **36 passed**. Each was proved to fail by reintroducing the
real bug:

- **`appears on scroll and returns to the top`** — failed with *"should be
  hidden before scrolling"* when the threshold was forced to `true`.
- **`never covers a footer link`** — failed when the footer rule was removed.
  It hit-tests every footer link's centre rather than comparing rectangles, so
  it asserts what a user can actually click.
- **`gets out of the way of the mobile menu`** — failed when the `menu.open`
  guard was dropped.

⚠️ **Two test-harness gotchas found writing these**, both correct site
behaviour rather than bugs: the nav hides on scroll down, so **the burger is
genuinely unreachable at the very bottom of a page** — scroll up a little first;
and the button now hides at the footer, so a test that scrolls to
`document.body.scrollHeight` and then expects to click it will fail. Both tests
scroll to `innerHeight * 2` instead.

## Regulations split into two columns — 16 August 2026

**`/regulations` now carries one column per competition**, headed the way the
events page heads its two day columns: display-font name over a mono accent
sub-label. Left is the **HHI Open Division**, right the **Netherlands HHDC** —
the same order as `REGISTRATION_FORMS` and the events schedule, which follow the
event days. Built in `b9deecc`, aligned in `9f23e9a`.

**Iain wrote the real Open Division rules** in the same pass (`b9deecc`): the
divisions now read Junior/Varsity/Adult/Parents/Special Crews, crew size is
5–20 across all Open categories, and routine length is capped at 2:30. **The
HHDC column still holds the original six rules** carried over from the
single-column page — those are the ones to replace as the per-competition text
lands.

**The two rule lists are written out separately and in full** in
[regulations.ts](src/lib/data/regulations.ts) — `OPEN_DIVISION_RULES` and
`HHDC_RULES`, each marked with a `COLUMN 1` / `COLUMN 2` banner comment.
⚠️ **That duplication is deliberate; do not factor it back into one shared
array.** The first build did exactly that (both columns built from a single
`GENERAL_RULES` via `.map()`) and Iain could not find where to edit a single
column — which is the whole point of the page. Column headings live in
`RULE_COLUMNS` at the bottom of the same file.

⚠️ **Rule titles must be unique *within* a column.** The each block is keyed on
the title, so two identical titles in one column throw `each_key_duplicate` on
hydration — the same crash class as the events schedule bug in `f54bcb4`. The
same title appearing in *both* columns is fine, and is the current state for
five of the six rules.

### The rows align because it is ONE grid, not two

**Rule N sits level with rule N across the columns even when one body is much
shorter.** That matters as soon as the two texts diverge, which they now have:
Open Division rules 01 and 02 are visibly shorter than their HHDC counterparts.

The mechanism, and the trap in it:

- **`.rule-cols` is a single grid spanning both columns.** A grid row is as tall
  as its tallest cell, so the shorter card is padded to match its opposite
  number. Per-column grids — which is how this was first built — size their rows
  independently and drift apart the moment the texts differ in length. **No
  fixed heights are involved**; it keeps working as the copy is edited.
- **`.rule-col` is `display:contents`**, so the wrapper survives for the header
  but generates no box and its children become real items of the outer grid.
- ⚠️ **Both `grid-column` *and* `grid-row` are required**, set from `--col` and
  `--row` in the markup. With only `grid-column`, auto-placement gives every
  item a row of its own and **column 2 lands entirely below column 1** — which
  looks plausible in the CSS and is completely wrong on screen. That bug was
  written and caught during this work, by measuring card positions rather than
  eyeballing the page.
- **`reveal()` therefore cannot live on `.rule-col`** — an element with
  `display:contents` has no box for ScrollTrigger to measure. It sits on the
  `.rule-cols` container instead, once for the whole block.
- **Cards draw their own borders now.** The old 1px-gap-over-`--line` separator
  trick needs a dedicated wrapper, which `display:contents` removes; `.rule`
  carries the hairline and `.rule--first` adds the top one.
- **Below 1000px the whole grid is unwound** back to plain blocks. Leaving
  `display:contents` with an explicit `grid-column` would drop both columns into
  the single remaining track and interleave them — header, six rules, header,
  six rules is the required stacked order.

⚠️ **An earlier version of this page rendered as two empty grey boxes.**
`reveal()` was on both the column *and* each card inside it; it animates
`autoAlpha`, so a revealed card inside a not-yet-revealed ancestor stays
`visibility:hidden` forever. **Never nest `reveal()`** — the events page follows
the same rule (`.sched-day` reveals, its rows do not). **No test caught this**:
the suite passed green while the page was visibly broken, because nothing
asserted rule content. It was found by screenshotting the page.

**Verified in a browser at 1440px and 390px**, not just by the test suite: all
six rows measured `topDelta: 0` and `bottomDelta: 0` between columns with
matching heights; stacked mobile keeps each column's header with its own rules
and does not overflow horizontally.

### Two tests now cover the page — added 16 Aug 2026

The coverage gap that let both bugs ship is closed. `npm test` is now
**33 passed**, and the geometry is asserted by measurement rather than by
reading CSS, because the failure mode is a layout that computes plausibly and
renders wrong:

- **`regulations splits into two competition columns, aligned row for row`** —
  two columns in day order, 12 cards, numbering restarting at 01 per column,
  and every rule's top *and* bottom level with its opposite number to within
  1px, with column 2 to the right of column 1.
- **`regulations columns stack in reading order on mobile`** — at 390px the two
  headings sit at positions 0 and 7, i.e. each column keeps its own six rules
  instead of interleaving, and nothing overflows sideways.

**Both were verified non-vacuous by reintroducing the real bugs** and watching
them fail: dropping `grid-row` produced *"rule 1: tops should align across
columns"*, making `.rule-col` `display:block` (per-column grids again) produced
*"rule 1: bottoms should align across columns"*, and removing the mobile unwind
failed the reading-order check.

⚠️ **One assertion is knowingly inert.** The `toBeVisible()` check on the cards
does **not** reproduce the nested-`reveal()` bug: `.rule-col` is
`display:contents`, so it generates no box and cannot hide its children whatever
`reveal()` does to it. Confirmed by re-adding `reveal()` to the cards and
watching the test still pass. It is kept as a guard for the day that wrapper
regains a box, and the test comment says so — **the alignment assertions are
what actually carry the test.** The general rule against nesting `reveal()`
still stands everywhere else, where wrappers *do* generate boxes.

**`nl.json` still holds `regulations.rule.*` keys that nothing reads.** The page
has rendered English straight from the data file since Phase 3, so the Dutch
there is dead until the NL/EN toggle returns — and it now describes the *old*
single list, not the split. Worth knowing before trusting it as a translation
source.

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

## Photography replaced — 15 August 2026

**The eight legacy `slideshow-v*.jpg` banners are gone**, replaced by
`image01`–`image08`: real crew photography from the championship, shot at
6720 × 4480 (3:2) and exported to **1200 × 900 (4:3)**.

**`.media__cell` changed from 3:4 portrait to 4:3 landscape.** The old cell was
built around 3.33:1 letterbox banners and cropped roughly two thirds off a
landscape frame, cutting dancers' limbs — the worst thing to do to dance
photography. 4:3 trims ~11% from the sides of a 3:2 frame and keeps the grid
dense: two rows of four on desktop, four rows of two on mobile.

**Eight is the right count** — the grid is four across, so the number must stay
a multiple of four or the last row goes short.

**JPEG, 1.79 MB for the eight** (130–349 KB each). They arrived as PNG first, at
4.32 MB; Iain re-exported them to JPEG the same day, a 59% saving with no visible
difference. For comparison, the eight legacy banners they replaced were 5.64 MB.

**The filenames are built in exactly two places** — `media.ts` and `home.ts`.
Change both together. **The build fails hard on a missing image**
(`Error: 404 /img/image01.jpg`), which is a useful property: a misnamed or
missing photo cannot ship silently. It also means the repo will not build until
all eight exist.

**The home teaser captions are deliberately empty.** They used to be specific to
the old photos ("MegaCrew", "Podium", "Award ceremony"), and those claims do not
survive a change of image — a caption reading "Podium" under a crowd shot is
worse than no caption. `figcaption` now renders only when a caption is
non-empty, so filling them in later is a data edit in `home.ts` with no markup
change. Alt text is generic by Iain's decision (15 Aug).

## Results — ✅ the whole archive is real as of 15 August 2026

**All four editions — 2026, 2025, 2024 and 2023 — carry real podiums, and each
links its six official score sheets.** Nothing on the page is placeholder.

The starting point: **the legacy `results.php` had no tables at all.** It was six
PDF score sheets, one per division — and for **2026**, not the 2023–2025 the
migrated page had tabs for. Those three years were placeholder guesses from the
original port; all three have since been filled from Iain's tabulation archive.

All six PDFs were pulled off the dying host and are now in
`static/download/results-2026/` (1.1 MB). **This is the only other copy.** The
page links them per division under the 2026 table; they carry the full
rankings, per-judge performance and skill scores, and deductions with reasons,
which the podium table deliberately leaves out.

**Every one of the 18 placements was verified against the rank number in its
source PDF**, not eyeballed from a text dump. The score sheets are dated
1 February 2026 and name Meg Vasselli as head judge.

| Division | Gold | Silver | Bronze |
|---|---|---|---|
| Junior | C-Fam Jr | D&D LIONS | MDS-Mini JR |
| Varsity | C-Fam Varsity | D&D FEAR | D&D IGNITE |
| Adult | D&D VIII | C-Fam Adult | C-Fam Adult 2.0 |
| JV MegaCrew | ELITE | Young C-Fam | D&D YOUNG |
| MiniCrew | D&D CREW | D&D BADDEST | GYB |
| MegaCrew | D&D | C-FAM | D-PACK |

**Crew names are reproduced exactly as the score sheets spell them**, including
casing that is inconsistent between divisions — "D&D" in MegaCrew but "D&D CREW"
in MiniCrew, "C-Fam Jr" but "C-FAM". Do not tidy it: these are the names crews
entered under.

### 2025 — added the same day, from the tabulation workbooks

Iain pointed at `G:\HHI Netherlands 2025\HHI Tabulation\`. **The PDFs there are
not machine-readable**: unlike the 2026 set they embed subset fonts with no
`/ToUnicode` map and store objects in `/ObjStm` streams, so the text comes out as
glyph indices. Two decoding attempts produced convincing-looking garbage
("MegaeCrw Dvsnvs"), which is exactly how a wrong crew name gets published.

**The `.xlsm` tabulation workbooks in `Excel/HHI NL/` are the better source** —
they are the origin the PDFs are generated from, and are plain readable XML
inside the zip. Their "Final Scores" sheet carries rank, crew and every judge's
score.

⚠️ **Podiums are taken from the Rank column, never by sorting on score.** In
MegaCrew 2025, ranks 8 and 9 hold *higher* combined scores than rank 7 —
deductions of 0.15 and 0.5 put them below it. Sorting by score would have
published the wrong order.

The 2025 PDFs are in `static/download/results-2025/` and linked from the page
anyway: unreadable by machine is not unreadable by people, and for this edition
the repo may be the only copy outside Iain's drive.

### 2024 — added the same day, same route

Read from the tabulation workbooks in
`G:\HHI Netherlands 2024\HHI Tabulation\Excel\HHI NL`. Same six divisions, same
sheet layout. Rank again disagrees with score order: in Junior, rank 3
(Trouble) scored *higher* than rank 2 but took a 0.3 deduction for a fall and
use of props.

⚠️ **The workbooks mark defending champions with a trailing asterisk** —
"C-Fam Adult *", "The Pack *", "C-Fam Mini *", "C-Fam *". Iain confirmed
(15 Aug 2026) that this is tabulation notation and does not belong on the page,
so it is stripped. A smoke test asserts no asterisk appears in the 2024 panel,
since re-importing from source would reintroduce it.

The 2024 PDFs were named `01_HHI NL 2024 Junior Division Tabulation.pdf` on the
drive; they were **renamed on copy** to the `HHI-NL-<year>-<Division>-Division`
convention the other years use, so one `sheetsFor(year)` builder covers all
three editions.

### 2023 — the last one, added the same day

Same route again, from `G:\HHI Netherlands 2023\`. The `.jpg` files in that
Final Scores folder were ignored on Iain's instruction.

⚠️ **Two spellings here look like mistakes and are not.** A well-meaning tidy-up
would get both wrong:

- **MiniCrew gold is "C-Fam Mini", silver is "Mini C-Fam".** Two different crews
  in the same division, not a transcription slip.
- **MegaCrew silver is "D & D", spaced.** Every other year writes "D&D".

A smoke test asserts all three strings, so a future "correction" fails loudly.

**`placeholderRows()`, `TBC` and `TBC_GOLD` are gone.** Every edition is real, so
nothing renders "— fill from archive" any more and the scaffolding was dead code.
The page notice no longer lists which years are official — it says where the
numbers come from instead, which is what makes them checkable.

**If a future edition is added before its results exist, add the panel when the
data does.** An empty tab is worse than no tab.

## Sponsors — rewritten as a credit page, 15 August 2026

**Iain's instruction: show the current sponsors, do not advertise for new
ones.** The page used to be a sales pitch — "Put your brand on the floor", three
`TIERS` packages (Support / Stage / Title partner), and a *Get in touch* CTA.
All of it is gone, along with the `TIERS` data and the `.tiers`/`.tier` CSS.
Recover from git history if a sales page is ever wanted again.

**The seven real sponsors** were read off the legacy `sponsors.php`, with their
own descriptions and websites: Heijnens Audio · Light · Vision, VSBfonds,
Provincie Limburg, Gemeente Maastricht, MECC Maastricht, het Cultuurfonds, and
APS Groep. VSBfonds's blurb is Dutch in the original and is **kept in Dutch** —
it is their copy, not ours to translate.

**Their logos were rescued** into `static/img/sponsors/` (seven 180×180 PNGs,
104 KB total), the same way the media photos were. The legacy host was the only
source.

⚠️ **The logos are dark-on-transparent, drawn for a white page.** Measured
average luminance against this site's near-black ground runs from **20**
(APS Groep) to 159 (Heijnens) — the darkest three would have been effectively
invisible dropped straight onto `--ink`. `.sponsor__plate` paints a white panel
behind each one. **Do not "simplify" that away**; it is the only reason all
seven are legible.

**The grid is four columns, not `auto-fit`.** With seven cards, auto-fit settles
on five at desktop width and leaves three empty cells; four gives 4 + 3. Borders
also sit on the cards rather than on a 1px gap over a lit background — the gap
technique paints a short row's empty cells as a solid panel, which reads as a
hole rather than as the row ending.

A smoke test asserts all seven cards, that every logo actually serves, and that
**no sales language or `/contact` CTA appears on the page** — the absence of a
pitch is the requirement here, not a side effect.

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
- ~~**The policy tells people to use "het contact formulier" to exercise their
  rights.**~~ ✅ **Resolved 20 Aug 2026.** The form is a real submission now, so
  the route a visitor is told to use for a GDPR request works — **once the
  mailbox exists.** That last condition is the whole of what is left: a GDPR
  request that silently goes nowhere is worse than one that bounces, so
  creating the mailbox is not an optional finishing touch.

## The reduced-motion freeze — ✅ fixed 15 August 2026

**Reported as the hero's stage floor being completely static on a Galaxy S22,
in several different browsers.** The cross-browser part was the clue and it was
misread at first: independent rendering engines do not fail identically for
performance reasons, so "static everywhere" points at a device setting, not at
a slow GPU.

**The cause was Samsung's *Instellingen → Toegankelijkheid →
Zichtbaarheidsverbeteringen → Animaties verminderen*.** Android's Power saving
mode does the same thing. Both make the browser report
`prefers-reduced-motion: reduce`, and the floor's reduced-motion branch drew
exactly one frame and stopped — which reads as a broken image, not as a
deliberately still background. Confirmed on the device: turning the setting off
made the unmodified site flow correctly.

⚠️ **Ask about this setting before profiling anything.** The same guard gates
the GSAP entrances, the custom cursor, magnetics, tilt and the pinned road
section, so they all go inert together — a useful confirming signal. Chasing
frame rate first cost most of a session.

**What changed** (merge `e3d0352`, then `8f2d544`):

- **The wave runs in a vertex shader.** It used to be computed in JS for every
  point every frame — two sines, a `sqrt` and a third sine each — followed by a
  full re-upload of the position buffer. Positions now upload once and each
  frame writes three uniforms. Because point count is no longer a CPU cost,
  mobile gets the same 130 × 70 grid as desktop instead of a thinned one.
- **Reduced motion drifts instead of freezing** — a fifth of the speed, a third
  of the travel, no cursor tracking. Both numbers were tried louder (0.33 / 0.5)
  and taken back down after looking at them on the phone.
- **The ticker was stopped dead by a pre-existing rule** in the same
  `prefers-reduced-motion` block, with the same broken-looking result. It now
  runs at **55s** instead of its normal 26s.
- Mobile also gets no MSAA, a pixel-ratio cap of 1.5 (an S22 reports 3), a 30fps
  cap, and no pointer listener where the ripple could never fire anyway.

⚠️ **Two traps in this code, both easy to reintroduce:**

- **`uScale` mirrors three's own points shader** — half the drawing-buffer
  height, in device pixels — and **must be refreshed on resize**, or dot size
  drifts with the viewport. A hardcoded constant there blows the dots into a
  white haze on some pixel ratios; that bug was written and caught during this
  work.
- **The ticker override needs `!important` and must stay *after* the blanket
  `*{ animation-duration:.01ms !important }`** in the same block. Without both,
  it is silently overridden and the ticker stays frozen while the CSS looks
  correct.

**The perf half fixed nothing that was reported.** The old CPU loop measured
~0.25ms/frame on a desktop core — real, but not what froze the floor. It was
kept because it is written, tested and a genuine improvement; do not expect a
visible speed change from it.

**Verified:** shader compiles and links with no fallback (checked by
instrumenting `shaderSource`/`compileShader`/`linkProgram`), rendering visually
identical to the pre-merge `main` at mobile and desktop, ticker measured at 55s
and actually moving under reduced motion while staying 26s without it, `npm
test` 31 passed. **Then confirmed by Iain on the real S22 with the setting both
on and off.**

**The commit before this work is tagged `pre-stage-floor-gpu` (`0a39e36`).**
`git reset --hard pre-stage-floor-gpu` undoes all of it; the merge was made with
`--no-ff`, so `git revert -m 1 e3d0352` also takes it out as one unit.

⚠️ **Unrelated, found while testing and still unfixed:** on mobile the hero has
a strong white wash over its lower portion that makes the body text hard to
read. It is **pre-existing** — reproduced on the pre-merge `main` — and looks
like the `.hero::after` vignette in [style.css](src/lib/style.css). Worth a
look in a copy/design pass.

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
- Phase 8: ✅ **built 20 Aug 2026.** Only the mailbox itself is outstanding.

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
- ~~**Contact form and `CONTACT_EMAIL`**~~ — ✅ **built 20 Aug 2026.** The form
  and its PHP endpoint are done and testable; only *delivery* waits on the
  mailbox, and that is a panel click rather than repo work.

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
| 3 · Pilot (regulations) | ✅ data file + `nl.json`, entities → UTF-8; **split into two competition columns 16 Aug 2026** |
| 4 · Shared JavaScript | ✅ attachments, GSAP bundled, teardown, motion watchdog |
| 5 · Remaining sub-pages | ✅ all six ported, smoke test green |
| 6 · index.html | ✅ hero, stage floor, preloader, road pin, all sections |
| 7 · Delete old site | 🟨 items 2–5 done; `.htaccess` written — **only the cutover itself is left, and it needs the account** |
| 8 · Finish "fully functional" | 🟨 registration hub, favicon + social preview, **contact form (20 Aug)** done; only the mailbox itself is left |

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
| `CONTACT_EMAIL` becomes real | 🟨 **confirmed as the address 20 Aug**; the mailbox still has to be created |
| Real contact form (PHP) | ✅ **built 20 Aug 2026** — `static/api/contact.php`, deployed by the existing FTP action |

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
  land in its own chunk that no other page preloads. Disposes geometry, material,
  renderer, the rAF loop, the IntersectionObserver and both window listeners on
  destroy. **The wave moved into a vertex shader on 15 Aug 2026, and the
  reduced-motion path no longer renders a single static frame** — see *The
  reduced-motion freeze* below.
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
PHP site. (The results archive was still placeholder when this was written; 2026 is real as of 15 Aug — see *Results* above.)

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
  → **Fully superseded 15 Aug 2026**: all four editions were recovered from the
  official score sheets and tabulation workbooks. `placeholderRows()` is deleted
  and nothing on the page is provisional. The rule against inventing champions
  still stands for any future year. See *Results* above.

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

📌 **Superseded 15 Aug 2026.** All eight were replaced by real crew photography
(`image01`–`image08`) and deleted — see *Photography replaced* above. The
section below is kept as the record of the rescue, since it explains why
`withBase()` is required and why the smoke test's exemption was removed. The
rescue still mattered: it is what kept the site from having no photography at
all during the gap.

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

✅ **Nothing points at the legacy host any more** (15 Aug 2026). `EXTERNAL` now
holds only genuinely off-site destinations — ticketing and the three socials —
so no link on the site breaks when the old host is switched off.

What changed, and why none of these was a simple repoint:

- ~~`privacy`~~ → the `/privacy` route. See *Privacy policy* above.
- ~~`regulations`~~ → **two local PDFs.** The legacy `regulations.php` was only a
  wrapper around `HHI-Official-Rules-Regulations-Simplified.pdf` and
  `HHI2025-2026-RULES-MANUAL.pdf`; Iain put both in `static/download/`, so the
  page links them directly via `RULES_PDFS` in `config.ts`.
- ~~`contactForm`~~ → **removed.** `contact.php` was only a Dutch form posting to
  `mail.php` and carried nothing `/contact` lacks. The "Prefer the official
  form?" block is now the e-mail address instead — which matters because the
  privacy policy sends people to this page to exercise their data rights.

**Two more hardcoded legacy links were found by the new sweep test**, not by
reading `config.ts` — they bypassed `EXTERNAL` entirely:

- **`/media`'s "Full photo archive" button** → removed. It pointed at
  `photos.php`; the ~8,163-image archive is being pulled over FTP and has not
  been republished, so there is nothing to point at.
- **`/results`' "Official results" button** → removed, along with the claim that
  the complete archive "lives in the official archive" — it will not, once the
  old site is gone. The notice now says results are being restored.

Both come back as links the moment the archives get real routes.

## Open questions — need answers

1. ~~**Hosting**~~ — **settled 13 Aug 2026: Cloud86.** See the hosting section above.
   Two purchase-time details still to confirm there (Git integration, cheaper tier).
2. **Contact address** — ✅ **confirmed 20 Aug 2026** as
   `info@hhi-netherlands.com`, and now written in two places: `CONTACT_EMAIL` in
   [config.ts](src/lib/config.ts) as the record, and `MAIL_TO` in
   [static/api/contact.php](static/api/contact.php) as the copy that actually
   routes mail. **The mailbox itself still has to be created in the Cloud86
   panel** — see *The contact form* below.
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

- **`static/download/` holds four official rules PDFs** — the simplified rules
  and the full manual (added by Iain 15 Aug 2026), plus **Dutch translations of
  both**, `…-Simplified-NL.pdf` and `…-RULES-MANUAL-NL.pdf` (added 17 Aug).
  ⚠️ **Nothing links the two Dutch files yet.** `RULES_PDFS` in
  [config.ts](src/lib/config.ts) still offers only the English pair, so
  `/regulations` serves English only; they were added "for later use". Wiring
  them up is a content decision — most likely alongside the return of the NL/EN
  toggle removed in Phase 2, since a Dutch PDF beside English page copy is a
  half-measure.
  ⚠️ **The Dutch PDFs are re-typeset translations, and only the finished files
  are committed.** Every build script that produced them (HTML sources, the
  Playwright render pass, the PyMuPDF assembly) lived in a session scratchpad
  under `AppData/Local/Temp/` and is gone. **A correction means rebuilding the
  PDF from scratch — there is nothing in the repo to edit.** If that happens,
  check numeric fidelity by comparing deduction values and time codes against
  the English original; the counts must match exactly. Note the manual is named for the **2025–2026** season
  while the event is 2027 — that is HHI's own filename; do not rename it to look
  current. Replace all four when HHI publishes the next edition, keeping
  `RULES_PDFS` in step. ⚠️ **The smoke test hard-asserts
  `toHaveCount(2)`** on `.notice a[href$=".pdf"]`, so adding the Dutch links to
  the page fails `regulations links both rules PDFs` until that count is
  updated — a deliberate tripwire, not a bug. The page's own rule summaries are
  **per competition** — see *Regulations split into two columns* above; the HHDC
  column is still the pre-split generic text.
- **`static/img/` is irreplaceable.** The photography and the logo SVG there are
  the only copies in the repo. Never "clean" that directory, and never treat it
  as build output. **Updated 15 Aug 2026:** the eight rescued
  `slideshow-v*.jpg` banners were deleted here once `image01`–`image08` replaced
  them — recoverable from git history at `4a7c57c` if ever needed, but note they
  were themselves the only copy off the dying host, so recover from git rather
  than assuming they can be re-fetched.
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
- **Never nest `reveal()` inside another `reveal()`.** It animates `autoAlpha`,
  which holds `visibility:hidden` until the element's *own* ScrollTrigger fires —
  so a revealed child inside a not-yet-revealed parent never becomes visible, and
  the parent renders as an empty panel. Reveal the container or the items, never
  both: `.sched-day` reveals but its rows do not, `.rule-cols` reveals but its
  cards do not. Caught on `/regulations` 16 Aug 2026, **with the whole suite
  green** — no test asserts that page's content.
- **A green `npm test` is not evidence the page looks right.** The suite covers
  routes, links, results data and CTAs; outside `/regulations` it asserts almost
  nothing about layout. Two visibly broken renders shipped past it on 16 Aug
  (empty grey rule cards, then a second column stacked below the first). **Look
  at the page in a browser** after any layout change, and measure geometry rather
  than trusting a screenshot glance — the full-page screenshot is itself
  misleading, since it captures reveals before they fire. The two regulations
  tests added that day are the model for closing this on another page: assert
  measured positions, then **prove the test fails** by reintroducing the bug.
- **A media query adds no specificity.** A desktop rule written as
  `.a .b { … }` (0,2,0) beats a mobile `.b { … }` (0,1,0) inside
  `@media (max-width:1000px)`, so the mobile rule is silently dead. This bit
  twice in one session on the hero — once leaving the countdown squeezed at
  390px, once leaking desktop centring to mobile where it happened to be
  harmless *only* because there was no slack to distribute. Either repeat the
  prefix in the media query or scope the desktop rule with `min-width`.
- **Equal specificity means source order decides.** `.hero__title--centred
  .row--sub` and `.hero__title .row--sub` are both (0,2,0); the override has to
  come **after** in the file. Written earlier it loses silently, and the result
  looks like the rule was never written at all.
- **Sizing type in `vw` is wrong inside a column.** `clamp(…, 15.5vw, …)`
  resolves against the window, not the container, so a headline moved into a
  half-width column overflows it. Use `cqw` with `container-type:inline-size`
  on the column.
- **Flex breaks the hero's title rows.** They are `overflow:hidden` masks
  relying on `line-height:.88`; as flex items the children's own font boxes
  drive the height instead, inflating the row and pushing content onto the line
  below. Keep those rows in plain inline flow.
- **A fixed-position control can cover a link without looking like it does.**
  The scroll-to-top button sat exactly on the footer's PRIVACY link at 1440px,
  and the screenshot showed nothing — the footer row was below the fold when it
  was captured. **Hit-test with `document.elementFromPoint` at the link's own
  centre** rather than comparing rectangles or trusting a picture; overlap of
  boxes is not the question, what the user's click lands on is. Anything new and
  `position:fixed` should be checked against the footer, which wraps its links
  to a second row at desktop widths.
- **`display:contents` grid items need both `grid-column` and `grid-row`.**
  Setting only the column leaves auto-placement to give each item its own row, so
  a second logical column stacks *below* the first instead of beside it. Used on
  `/regulations` to make both columns share one grid; see that section above.
- **An animation reported dead on a phone is a reduced-motion setting until
  proven otherwise.** Android Power saving and Samsung's "Animaties verminderen"
  both report `prefers-reduced-motion: reduce`. Ask before profiling — and treat
  *identical failure across different browsers* as the tell, since independent
  engines do not fail the same way for performance reasons. Cost most of a
  session on 15 Aug 2026. See *The reduced-motion freeze* above.
- **Honouring reduced motion does not mean freezing a frame.** A decorative
  element stopped dead reads as broken, which is worse than the motion it
  avoids. The stage floor drifts slowly and the ticker creeps at 55s instead of
  stopping. New animations should follow that pattern rather than `animation:none`.
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
npm test             # build + Playwright smoke test — expect 36 passed
npm run preview      # trustworthy again since Phase 7
npx serve build      # second opinion on the real output

# Reproduce the Pages build locally. Note: PowerShell, not Git Bash —
# bash mangles a leading-slash env var into a Windows path.
$env:BASE_PATH = "/HHI-Netherlands-Website"; npm run build
```
