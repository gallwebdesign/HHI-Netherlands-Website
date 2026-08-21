# HHI Netherlands

Marketing site for the **Netherlands Hip Hop Dance Championship**, the official
national qualifier of Hip Hop International.

Live: <https://hhi-netherlands.com>

SvelteKit with `adapter-static`, prerendered to flat HTML and deployed to
Cloud86 by FTP on every push to `main`. Three hand-written PHP endpoints are
the only dynamic parts — see below.

## Quick start

Requires Node 22 (matching CI).

```sh
npm install
npm run dev
```

## Commands

```sh
npm run dev      # dev server
npm run check    # svelte-check — expect 0 errors, 0 warnings
npm run lint     # prettier --check + eslint — expect both clean
npm run build    # prerenders every route; this is what proves the SSR guards
npm test         # build + Playwright smoke tests
npm run preview  # serves build/
```

`npm test` rebuilds first, deliberately: plain `npx playwright test` reuses
whatever is already in `build/`, so a test can pass against a stale build while
the bug is live in `src/`. Kill any stray `vite preview` on port 4173 before
testing — it hijacks the harness and fails a batch of tests wholesale.

The test count depends on whether the gallery photos are on your disk, and they
are **not in the repo**. A fresh clone skips the photo-dependent tests rather
than failing them. See CLAUDE.md for the exact numbers.

## Layout

```
src/routes/         one directory per page, all prerendered
src/lib/            components, config.ts, data/
src/lib/style.css   one global stylesheet, design tokens on :root
static/             copied verbatim into build/ — images, PDFs, api/*.php
tests/smoke.spec.ts the whole test suite
screenshots/        visual baseline of the pre-migration site (historical)
```

Everything a page needs to say about dates, URLs and destinations comes from
[src/lib/config.ts](src/lib/config.ts). `EVENT_DATE` drives every user-facing
year; a hardcoded year anywhere else is a bug, with one deliberate exception
(the media gallery, which shows the edition that already happened).

## The PHP endpoints

Static site, three dynamic pieces, all in `static/api/` so Vite copies them
into `build/` and the existing deploy pushes them:

| | |
|---|---|
| `contact.php` | Validates, rate-limits and filters the contact form, then mails it. |
| `gallery.php` | Lists the gallery photos on the server so `/media` can show them. |
| `thumb.php` | Serves a small cached WebP for each grid tile. |

⚠️ **The Playwright suite stubs `contact.php` and cannot execute any of them** —
the harness serves static files, so a green run says nothing about the PHP.
Verify PHP changes against `php -S` separately.

## The gallery, in one paragraph

The ~951 competition photos are **not in the repo** and must not be added to it.
They are uploaded to `/httpdocs/img/gallery/` by FTP by hand, and the deploy
excludes that path so the mirror cannot delete them. Because CI therefore
cannot see them, `/media` asks `api/gallery.php` for the real folder listing at
runtime rather than trusting the list baked at build time. Drop a photo in by
FTP and it appears on the next page load — no rebuild, no push.

## Before changing anything

**Read [CLAUDE.md](CLAUDE.md) and [MIGRATION-STATUS.md](MIGRATION-STATUS.md)
first.** Between them they document the traps that have actually shipped bugs
here — CSS specificity order, reduced-motion handling, the two gallery
manifests, the canonical-URL base path, and why some things that look
redundant are load-bearing. MIGRATION-STATUS.md is authoritative wherever the
two disagree.
