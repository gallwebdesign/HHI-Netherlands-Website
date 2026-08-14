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
export const EVENT_DATE = '2027-01-30T12:00:00+01:00';

/** Final day of the championship. Confirmed 11 Aug 2026. */
export const EVENT_END_DATE = '2027-01-31T12:00:00+01:00';

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

/** First edition of the championship; the left half of the footer range. */
export const FOUNDED_YEAR = 2015;

/** TODO: confirm the real inbox before relying on this. */
export const CONTACT_EMAIL = 'info@hhi-netherlands.com';

/** Registration is two JotForms. They split by **competition, not by day** —
 *  confirmed 14 Aug 2026 from the live forms, whose own titles read "HHI Open
 *  Division Registration Form 2027" and "Netherlands HHDC Registration Form
 *  2027". An earlier note called these the Saturday and Sunday forms; that was
 *  wrong, and the day split remains unannounced.
 *
 *  Every CTA across the site points at the /registration hub rather than at a
 *  form, so the choice is made on a page with room to explain it. */
export const REGISTRATION_FORMS = [
	{
		name: 'Netherlands HHDC',
		blurb: 'The national championship — Junior, Varsity, Adult, MiniCrew and MegaCrew.',
		href: 'https://form.jotform.com/262132296237961'
	},
	{
		name: 'HHI Open Division',
		blurb: 'The open division categories, run alongside the national championship.',
		href: 'https://form.jotform.com/262132162311946'
	}
] as const;

/** Where every "Register" CTA points — the hub, not a form. See above. */
export const REGISTRATION_HUB = '/registration';

/** Off-site destinations. Three still point at the legacy production host. */
export const EXTERNAL = {
	tickets: 'https://shop.celebratix.io/?c=2mdtq',
	contactForm: 'https://hhi-netherlands.com/contact.php',
	regulations: 'https://hhi-netherlands.com/regulations.php',
	privacy: 'https://hhi-netherlands.com/privacy-policy.php',
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

/** Primary nav — order matters, it is the visible desktop nav. */
export const NAV_LINKS = [
	{ href: '/', label: 'Home' },
	{ href: '/events', label: 'Events' },
	{ href: '/registration', label: 'Registration' },
	{ href: '/media', label: 'Media' },
	{ href: '/organisation', label: 'Organisation' },
	{ href: '/sponsors', label: 'Sponsors' },
	{ href: '/contact', label: 'Contact' }
] as const;

/** Mobile menu carries two extra links the desktop nav omits. */
export const MENU_LINKS = [
	...NAV_LINKS,
	{ href: '/regulations', label: 'Regulations' },
	{ href: '/results', label: 'Results' }
] as const;

/** Footer nav. Internal links first, then socials and privacy. */
export const FOOTER_LINKS = [
	{ href: '/events', label: 'Events' },
	{ href: '/regulations', label: 'Regulations' },
	{ href: '/results', label: 'Results' },
	{ href: '/registration', label: 'Registration' },
	{ href: '/sponsors', label: 'Sponsors' },
	{ href: EXTERNAL.instagram, label: 'Instagram', external: true },
	{ href: EXTERNAL.facebook, label: 'Facebook', external: true },
	{ href: EXTERNAL.youtube, label: 'YouTube', external: true },
	{ href: EXTERNAL.privacy, label: 'Privacy', external: true }
] as const;
