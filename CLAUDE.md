# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static marketing site for **HHI Netherlands** — the Netherlands Hip Hop Dance Championship, the official national qualifier of Hip Hop International. Nine hand-written HTML pages plus one shared stylesheet and one shared script.

**This folder is the live development site.** A previous port to a custom WordPress theme (`C:\Users\Iain\Local Sites\wordpress-7\...\themes\hhi-netherlands`) is dead — ignore it. Do not resurrect or sync to any other copy.

Remote: `https://github.com/gallwebdesign/HHI-Netherlands-Website.git`

## Commands

There is no build step, package manager, test suite, or linter. Editing a file changes the site.

```bash
# preview locally (any static server works)
python -m http.server 8000
```

Open `index.html` directly via `file://` for quick checks, but prefer a server — the language switcher reads `?lang=nl` from the query string.

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

### Page structure

`index.html` is the bespoke home page. The other eight pages share a common skeleton: nav → mobile menu → `.page-hero` → content sections → footer. **The nav and mobile menu blocks are duplicated verbatim across all nine files** — a nav change means editing all nine, and marking `is-active` on the current page's link.

Behaviour is attached declaratively via data attributes, so new markup opts in without JS changes: `data-reveal` (scroll fade-in), `data-magnetic` (cursor-attracted button), `data-tilt` (3D card hover), `data-count` (animated number), `data-hero-fade` (entrance stagger).

### Accessibility and motion

`prefers-reduced-motion` is honoured throughout: it disables GSAP entrances, the custom cursor, magnetics, tilt, and the pinned road section, renders the three.js floor as a single static frame, and falls back to making `[data-reveal]` elements visible via inline styles. Any new animation must check `prefersReducedMotion` the same way. The custom cursor and pointer effects are additionally gated on `(pointer: fine)`.

### External dependencies

Registration (`hhi-netherlands.com/registration.php`), ticketing (`shop.compoticketing.eu`), and media images (`hhi-netherlands.com/img/...`) all point at the legacy production host. Media images carry `onerror="this.remove()"` so broken ones disappear rather than showing a placeholder. There are no local image assets in this repo.

## Conventions

- `index.html` is Prettier-formatted (2-space, wrapped attributes); the eight sub-pages are hand-formatted with more compact markup. Match whichever file you are editing.
- Prose is written in a deliberately punchy, battle-poster voice ("Own the floor.", "Prove it."). Keep new copy in that register in both languages.
- **The event year is inconsistent across the site.** `index.html` says 2027 throughout (title, hero, countdown `EVENT_DATE = 2027-01-30`, footer); all eight sub-pages still say 2026. Confirm the intended year with the user before writing a new one — do not silently normalise either way.
