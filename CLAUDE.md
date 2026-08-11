# HHI Netherlands — Static Site (legacy source)

This folder holds the **original static HTML site** for the Netherlands Hip Hop Dance Championship 2026. On 2026-07-19 it was ported to a custom WordPress theme — **active development now happens in the theme, not here**.

## Where the live code is

- **Theme:** `C:\Users\Iain\Local Sites\wordpress-7\app\public\wp-content\themes\hhi-netherlands`
- **Local site:** http://wordpress-7.local (LocalWP site "WordPress 7" — start it in the Local app first)
- The theme has its own `CLAUDE.md` documenting the architecture and workflows.

## What this folder is still good for

- Reference for the original markup/design when porting or debugging the theme
- `assets/style.css` and `assets/main.js` are the source the theme's assets were copied from
- Side-by-side visual comparison against the WordPress build

## Migration notes (what changed in the port)

- Dutch was removed for now: all `data-nl` attributes, the NL/EN toggle, and the i18n block in `main.js`. Theme strings are gettext-wrapped (text domain `hhi-netherlands`) so Dutch can return via Polylang/Loco Translate.
- The mailto contact form was replaced with Contact Form 7.
- The hardcoded `EVENT_DATE` in `main.js` became a Customizer setting.
- Event photos were downloaded into the theme (`assets/img/`) instead of hotlinking hhi-netherlands.com.

Do not edit the HTML files here expecting the WordPress site to change — they are disconnected.
