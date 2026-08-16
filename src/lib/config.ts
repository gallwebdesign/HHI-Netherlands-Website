import { base } from '$app/paths';

/* ============================================================
   HHI NETHERLANDS — single source of truth
   The event year used to be hand-typed into nine HTML files,
   which is how index.html drifted to 2027 while the eight
   sub-pages stayed on 2026. Everything year-shaped now derives
   from EVENT_DATE. Change it here, change it everywhere.
   ============================================================ */

/** Championship date. Drives the countdown and every displayed year.
 *  This is day one — the countdown target. The event runs two days;
 *  see EVENT_END_DATE and EVENT_DATE_RANGE for what gets displayed. */
export const EVENT_DATE = '2027-01-30T08:00:00+01:00';

/** Final day of the championship. Confirmed 11 Aug 2026. */
export const EVENT_END_DATE = '2027-01-31T23:59:00+01:00';

/** Current year, derived — never hand-typed into a page. */
export const CURRENT_YEAR = new Date().getFullYear();

/** Event year, derived — never hand-typed into a page. */
export const EVENT_YEAR = new Date(EVENT_DATE).getFullYear();

/** Venue. Confirmed 11 Aug 2026. */
export const EVENT_VENUE = 'MECC Maastricht';

/** Displayed date range, e.g. "30 & 31 January 2027". Derived so the
 *  events page never hand-types a date that can drift out of sync. */
export const EVENT_DATE_RANGE = (() => {
	const start = new Date(EVENT_DATE);
	const end = new Date(EVENT_END_DATE);
	const month = end.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
	return `${start.getUTCDate()} & ${end.getUTCDate()} ${month} ${end.getUTCFullYear()}`;
})();

/** The two competition days on their own, e.g. "30 January" / "31 January".
 *  Derived for the same reason as EVENT_DATE_RANGE: the events schedule labels
 *  each day, and a hand-typed date there would drift the moment EVENT_DATE
 *  moves. Day one is the HHI Open Division, day two the Netherlands HHDC —
 *  confirmed 15 Aug 2026. */
const dayLabel = (iso: string) =>
	new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });

export const EVENT_DAY_ONE = dayLabel(EVENT_DATE);
export const EVENT_DAY_TWO = dayLabel(EVENT_END_DATE);

/** First edition of the championship; the left half of the footer range. */
export const FOUNDED_YEAR = 2016;

/** TODO: confirm the real inbox before relying on this. */
export const CONTACT_EMAIL = 'info@hhi-netherlands.com';

/** Canonical origin, no trailing slash. Open Graph requires absolute URLs —
 *  a root-relative og:image is ignored by every scraper — so this is the one
 *  place the production domain is written down. It is the live domain today
 *  and stays correct after the Cloud86 cutover, since the domain moves with
 *  the site. Only the GitHub Pages preview serves from elsewhere, and that
 *  is staging, which should not be sharing preview cards anyway. */
export const SITE_URL = 'https://hhi-netherlands.com';

/** Registration is two JotForms. They split by **competition, not by day** —
 *  confirmed 14 Aug 2026 from the live forms, whose own titles read "HHI Open
 *  Division Registration Form 2027" and "Netherlands HHDC Registration Form
 *  2027". An earlier note called these the Saturday and Sunday forms; that was
 *  wrong — a crew registers by what it is entering, not by when it dances.
 *
 *  The day split is now confirmed (15 Aug 2026): the Open Division dances on
 *  day one, the HHDC on day two. **The order below is deliberate — it follows
 *  the days**, and the events schedule is rendered in the same order. Keep it.
 *
 *  Every CTA across the site points at the /registration hub rather than at a
 *  form, so the choice is made on a page with room to explain it. */
export const REGISTRATION_FORMS = [
	{
		name: 'HHI Open Division',
		blurb: 'The Open Division Categories — Junior, Varsity, Adult, Parents and Special Crews.',
		href: 'https://form.jotform.com/262132162311946'
	},
	{
		name: 'Netherlands HHDC',
		blurb:
			'The National Championship — Junior, Varsity, Adult, JV MegaCrew, MiniCrew and MegaCrew.',
		href: 'https://form.jotform.com/262132296237961'
	}
] as const;

/** Where every "Register" CTA points — the hub, not a form. See above. */
export const REGISTRATION_HUB = '/registration';

/** Off-site destinations. **Nothing here points at the legacy host any more**
 *  (cleared 15 Aug 2026), so none of these break when it is switched off:
 *  `privacy` became the /privacy route, `regulations` became the two local PDFs
 *  below, and `contactForm` was dropped — the legacy contact.php was only a
 *  Dutch form posting to mail.php and carried nothing /contact lacks. */
export const EXTERNAL = {
	tickets: 'https://shop.celebratix.io/?c=2mdtq',
	instagram: 'https://www.instagram.com/hhinetherlands',
	facebook: 'https://www.facebook.com/hhinetherlands/',
	youtube: 'https://www.youtube.com/c/HipHopInternationalNetherlands'
} as const;

/* The site ships English-only. The ~253 Dutch strings are preserved in the
   legacy HTML under static/ and move to src/lib/messages/nl.json in Phase 3;
   the NL/EN toggle returns when Dutch actually ships. */

/* Kit rewrites root-relative hrefs written literally in markup, but not
   ones bound from a variable — the link arrays below are bound, so the
   base path has to be applied by hand wherever they are rendered. Only
   matters while the site is served from a sub-path (GitHub Pages
   preview); base is '' everywhere else, making this a no-op. */
export const withBase = (href: string) => (href.startsWith('/') ? `${base}${href}` : href);

/** The official rules, as PDFs in static/download/. These are what the legacy
 *  regulations.php actually served — it was only a wrapper around these two
 *  files — so copying them into the repo (Iain, 15 Aug 2026) is what let the
 *  last regulations link off the dying host be removed.
 *
 *  withBase() because the page binds href from this array, and Kit only
 *  rewrites root-relative paths written literally in markup.
 *
 *  ⚠️ The manual is named for the **2025–2026** season while the event is 2027.
 *  That is the file HHI published; do not rename it to look current. Replace it
 *  when HHI issues the next edition. */
export const RULES_PDFS = [
	{
		label: 'Simplified rules',
		note: 'The short version — divisions, crew sizes and the essentials.',
		href: withBase('/download/HHI-Official-Rules-Regulations-Simplified.pdf')
	},
	{
		label: 'Full rules manual',
		note: 'The complete HHI 2025–2026 rules manual.',
		href: withBase('/download/HHI2025-2026-RULES-MANUAL.pdf')
	}
] as const;

/** Primary nav — order matters, it is the visible desktop nav.
 *
 *  ⚠️ Eight items is the ceiling, and the labels are load-bearing. At the 1001px
 *  breakpoint the row has no slack left: with "Regulations" spelled out the nav
 *  needed 945px against a 906px content box, which flex paid for by closing the
 *  logo/links/Tickets gaps to zero — the logo ran into "HOME" and the Tickets
 *  button clipped "CONTACT". Hence "Rules" here — and in the footer too, so the
 *  label reads the same everywhere; only the /regulations route keeps the full
 *  word. Measure at 1001px before adding a ninth item or lengthening a label. */
export const NAV_LINKS = [
	{ href: '/', label: 'Home' },
	{ href: '/events', label: 'Events' },
	{ href: '/registration', label: 'Registration' },
	{ href: '/regulations', label: 'Rules' },
	{ href: '/results', label: 'Results' },
	{ href: '/media', label: 'Media' },
	{ href: '/organisation', label: 'Organisation' },
	{ href: '/contact', label: 'Contact' }
] as const;

/** Mobile menu carries the one link the desktop nav omits. The mobile menu has
 *  vertical room the nav does not, so it stays complete. Regulations traded
 *  places with Sponsors on 16 Aug 2026 (Sponsors is already carried by the
 *  footer), and Results was promoted into the nav the same day. Both are spread
 *  in from NAV_LINKS now; do not re-add either here or it renders twice. */
export const MENU_LINKS = [...NAV_LINKS, { href: '/sponsors', label: 'Sponsors' }] as const;

/** Footer nav. Internal links first, then socials and privacy. */
export const FOOTER_LINKS = [
	{ href: '/events', label: 'Events' },
	{ href: '/registration', label: 'Registration' },
	{ href: '/regulations', label: 'Rules' },
	{ href: '/results', label: 'Results' },
	{ href: '/sponsors', label: 'Sponsors' },
	{ href: EXTERNAL.instagram, label: 'Instagram', external: true },
	{ href: EXTERNAL.facebook, label: 'Facebook', external: true },
	{ href: EXTERNAL.youtube, label: 'YouTube', external: true },
	{ href: '/privacy', label: 'Privacy' }
] as const;
