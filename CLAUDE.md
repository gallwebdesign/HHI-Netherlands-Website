# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static marketing site for **HHI Netherlands** — the Netherlands Hip Hop Dance Championship, the official national qualifier of Hip Hop International.

⚠️ **Most of the Architecture section below is pre-migration and stale.** The site was ported to **SvelteKit** (adapter-static, prerendered) across Phases 0–7; there are no hand-written HTML pages, no `assets/main.js`, and no `data-nl` attributes in the markup any more. Sections describing those are kept only because parts still explain *why* the current code looks as it does. **[MIGRATION-STATUS.md](MIGRATION-STATUS.md) is the authoritative document** — read it first, and trust it over this file wherever they disagree.

**This folder is the live development site.** A previous port to a custom WordPress theme (`C:\Users\Iain\Local Sites\wordpress-7\...\themes\hhi-netherlands`) is dead — ignore it. Do not resurrect or sync to any other copy.

Remote: `https://github.com/gallwebdesign/HHI-Netherlands-Website.git`

## Commands

There is a build step, a package manager, a test suite and a linter — the note that once said otherwise was pre-migration.

```bash
npm run dev          # development
npm run check        # svelte-check — expect 0 errors, 0 warnings
npm run lint         # prettier --check + eslint — expect both clean
npm run build        # prerenders every route; this is what proves the SSR guards
npm test             # build + Playwright smoke test — expect 36 passed (37 on hero-two-column)
npm run preview      # serves build/ (see the port-4173 trap below)
```

⚠️ **`npm test` rebuilds first, and that matters.** Plain `npx playwright test` reuses whatever is already in `build/`, so a test can pass against a stale build while the bug is live in `src/`. Also kill any stray `vite preview` on **port 4173** before testing — it hijacks the harness and fails ~16 tests wholesale with `_app/immutable` 404s on pages you never touched.

## Architecture

### One stylesheet, one script, every page

Every page loads the same [assets/style.css](assets/style.css) and [assets/main.js](assets/main.js), plus GSAP + ScrollTrigger from cdnjs. Only [index.html](index.html) additionally loads three.js.

`main.js` is a single IIFE where **every feature guards on its own markup** before initialising (`if (!mount) return`, `if (!contactForm) return`). This is what makes one script safe for all pages — preserve that pattern when adding features. Feature-to-page mapping:

| Feature | Hook | Lives on |
|---|---|---|
| three.js particle stage floor | `#stage-floor` | index only |
| Preloader + countdown | `#loader`, `#cdD`…`#cdS` | index only |
| Horizontal pinned "Road to Worlds" | `#roadTrack` | index only, ≥1001px |
| Results tabs | `[data-tab]` / `[data-tab-panel]` | results |
| Contact form | `#contactForm` | contact |
| Nav, mobile menu, reveals, cursor, magnetics | shared markup | all pages |

Config constants sit at the top of `main.js`: `EVENT_DATE` drives the countdown, `CONTACT_EMAIL` is the mailto target (still flagged TODO — confirm the real inbox before relying on it).

### Bilingual content lives in the markup

There is no translation file. **English is the element's inner HTML; Dutch is its `data-nl` attribute**, which may contain HTML:

```html
<h2 data-nl="Elke leeftijd.<br><span class='accent'>Elke stijl.</span>">
  Every age.<br /><span class="accent">Every style.</span>
</h2>
```

On load, `main.js` snapshots every `[data-nl]` element's English `innerHTML`, then `setLang()` swaps `innerHTML` between the two. The choice does **not** persist in storage — instead `applyLangToLinks()` rewrites every internal `href` to carry `?lang=nl`, and each page re-reads that param on load.

Consequences to respect when editing:
- Any new user-visible string needs a `data-nl` counterpart, or it will stay English when a visitor switches to Dutch.
- Use HTML entities (`&euml;`, `&mdash;`, `&ldquo;`) in `data-nl`, matching existing content.
- Use single quotes for attributes *inside* a `data-nl` value — the outer attribute is double-quoted.
- Because the swap is `innerHTML`, event listeners bound to children of a `[data-nl]` element are destroyed on language change. Don't bind to them.

### Styling

`style.css` is plain CSS with design tokens on `:root` — `--ink` (near-black ground), `--oranje` (Dutch accent), `--violet`, `--bone` (text), plus `--font-display` (Anton), `--font-body` (Space Grotesk), `--font-mono` (Space Mono). Use the tokens rather than raw hex.

The file is organised by banner comments (`/* ==== NAV ==== */`) roughly in page order, with a `MULTIPAGE ADDITIONS` section at the end holding sub-page styles like `.page-hero`. Classes follow BEM-ish naming (`.nav__logo`, `.division__age`, `.btn--solid`). Breakpoints are `max-width:1000px` and `max-width:560px`.

⚠️ **Two specificity traps, both of which have shipped visible bugs here.** The file is one flat global stylesheet with no nesting, so cascade order is the only thing separating rules:

- **A media query adds no specificity.** A desktop `.a .b {…}` (0,2,0) beats a mobile `.b {…}` (0,1,0) inside `@media (max-width:1000px)` — the mobile rule is silently dead. Repeat the prefix inside the media query, or scope the desktop rule with `min-width`.
- **Equal specificity means source order wins.** A `--modifier` override must be written *after* the base rule it overrides, not before. Written earlier it loses, and the page looks as though the rule was never added.

**Never verify a layout change from the numbers alone, and never from a screenshot alone.** Both have missed real bugs on this site: a full-page screenshot captures reveals before they fire and hides below-the-fold collisions, while a passing measurement can be asserting the wrong box entirely. Measure *and* look.

### Page structure

`index.html` is the bespoke home page. The other eight pages share a common skeleton: nav → mobile menu → `.page-hero` → content sections → footer. **The nav and mobile menu blocks are duplicated verbatim across all nine files** — a nav change means editing all nine, and marking `is-active` on the current page's link.

Behaviour is attached declaratively via data attributes, so new markup opts in without JS changes: `data-reveal` (scroll fade-in), `data-magnetic` (cursor-attracted button), `data-tilt` (3D card hover), `data-count` (animated number), `data-hero-fade` (entrance stagger).

### Accessibility and motion

`prefers-reduced-motion` is honoured throughout: it disables GSAP entrances, the custom cursor, magnetics, tilt, and the pinned road section, and falls back to making `[data-reveal]` elements visible via inline styles. Any new animation must check `prefersReducedMotion` the same way. The custom cursor and pointer effects are additionally gated on `(pointer: fine)`.

**Reduced motion means less motion, not a frozen frame.** The three.js floor used to render a single static frame and the ticker was `animation:none`; both read as broken rather than still, and that is exactly how the 15 Aug 2026 "static floor on a Galaxy S22" report arose — Android Power saving and Samsung's "Animaties verminderen" both report `prefers-reduced-motion: reduce`. The floor now drifts at a fifth speed and a third amplitude with no cursor tracking, and the ticker runs at 55s instead of 26s. Follow that pattern for anything new: slow it down, drop the pointer-following, keep it alive.

⚠️ **When an animation is reported broken on a phone, ask about that setting before profiling.** Identical failure across several browsers is the tell — independent engines do not fail the same way for performance reasons.

The floor's wave runs in a **vertex shader** ([StageFloor.svelte](src/lib/components/StageFloor.svelte)), not a JS loop. Its `uScale` uniform mirrors three's own points shader (half the drawing-buffer height in device pixels) and **must be refreshed on resize**; a constant there blows the dots into a white haze. The ticker's reduced-motion override needs `!important` and must stay *after* the blanket `*{ animation-duration:.01ms !important }` in the same block, or it is silently ignored.

### External dependencies

Media images live in `static/img/` — eight 1200×900 JPEGs (`image01`–`image08`), real crew photography that replaced the rescued legacy banners on 15 Aug 2026 — plus two logos: `Hip Hop International Logo.svg` (the HHI plates lockup) and `NHHDC_Zwart-Wit-Rood_No Shadow.svg` (the graffiti *Netherlands Hip Hop Dance Championship* lockup, used in the home hero). **There is no other copy of these files**; the photos are the only real photography the site has, and the favicon (`src/lib/assets/favicon.svg`, the HHI logo's front plate cropped square) and `static/og-image.png` are both generated from the HHI logo. They are referenced through `withBase()` in [media.ts](src/lib/data/media.ts) and [home.ts](src/lib/data/home.ts), because the pages bind `src` from a variable and Kit only rewrites root-relative paths written literally in markup. Each page keeps a load guard that hides a failed image's whole `<figure>` rather than leaving a gap.

⚠️ **Treat `static/img/` as source material, never build output**, and check `git status` there before deleting a branch: the NHHDC lockup sat untracked for a session and was nearly lost with an experiment branch. A missing image fails the build hard (`Error: 404 /img/…`), which is the property that caught it.

Off-site destinations live in `EXTERNAL` in [src/lib/config.ts](src/lib/config.ts), not in the markup. Ticketing is `shop.celebratix.io` (**not** the older `shop.compoticketing.eu`).

**Registration is two JotForms, split by competition — `Netherlands HHDC` and `HHI Open Division` — not by event day.** They live in `REGISTRATION_FORMS`; every "Register" CTA on the site points at the `/registration` hub (`REGISTRATION_HUB`), and only that page links out to a form. Do not point a CTA straight at a JotForm; a smoke test enforces this.

`SITE_URL` is the canonical origin, needed because Open Graph ignores root-relative image paths. Anything building a canonical URL must use `page.route.id`, **not** `page.url.pathname` — the pathname carries the base path under the GitHub Pages build.

See `MIGRATION-STATUS.md`, which is the authoritative note on what is confirmed and what still points at the dying host.

## Conventions

- `index.html` is Prettier-formatted (2-space, wrapped attributes); the eight sub-pages are hand-formatted with more compact markup. Match whichever file you are editing.
- Prose is written in a deliberately punchy, battle-poster voice ("Own the floor.", "Prove it."). Keep new copy in that register in both languages.
- **The event year is inconsistent across the site.** `index.html` says 2027 throughout (title, hero, countdown `EVENT_DATE = 2027-01-30`, footer); all eight sub-pages still say 2026. Confirm the intended year with the user before writing a new one — do not silently normalise either way.
