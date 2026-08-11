/* ============================================================
   HHI NETHERLANDS — single source of truth
   The event year used to be hand-typed into nine HTML files,
   which is how index.html drifted to 2027 while the eight
   sub-pages stayed on 2026. Everything year-shaped now derives
   from EVENT_DATE. Change it here, change it everywhere.
   ============================================================ */

/** Championship date. Drives the countdown and every displayed year. */
export const EVENT_DATE = '2027-01-30T12:00:00+01:00';

/** Event year, derived — never hand-typed into a page. */
export const EVENT_YEAR = new Date(EVENT_DATE).getFullYear();

/** First edition of the championship; the left half of the footer range. */
export const FOUNDED_YEAR = 2015;

/** TODO: confirm the real inbox before relying on this. */
export const CONTACT_EMAIL = 'info@hhi-netherlands.com';

/** Off-site destinations, all still pointing at the legacy production host. */
export const EXTERNAL = {
	registration: 'https://hhi-netherlands.com/registration.php',
	tickets: 'https://shop.compoticketing.eu/nl/shop/ticketshop/event/F206E0CDD477',
	contactForm: 'https://hhi-netherlands.com/contact.php',
	privacy: 'https://hhi-netherlands.com/privacy-policy.php',
	instagram: 'https://www.instagram.com/hhinetherlands',
	facebook: 'https://www.facebook.com/hhinetherlands/',
	youtube: 'https://www.youtube.com/c/HipHopInternationalNetherlands'
} as const;

/* The site ships English-only. The ~253 Dutch strings are preserved in the
   legacy HTML under static/ and move to src/lib/messages/nl.json in Phase 3;
   the NL/EN toggle returns when Dutch actually ships. */

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
