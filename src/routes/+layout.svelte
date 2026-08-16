<script lang="ts">
	import '$lib/style.css';
	/* The logo's front plate alone, cropped to a square canvas from
	   static/img/Hip Hop International Logo.svg. The full lockup is two
	   overlapping plates plus the NETHERLANDS wordmark and turns to mush
	   below ~32px; the single plate stays legible in a tab. This replaced
	   the stock Svelte logo the scaffold shipped with. */
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import MobileMenu from '$lib/components/MobileMenu.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Cursor from '$lib/components/Cursor.svelte';
	import ScrollTop from '$lib/components/ScrollTop.svelte';
	import { page } from '$app/state';
	import { EVENT_DATE_RANGE, EVENT_VENUE, SITE_URL } from '$lib/config';
	import { loadScrollTrigger, prefersReducedMotion } from '$lib/motion.svelte';

	let { children } = $props();

	/* Built from page.route.id, not page.url.pathname. The pathname carries
	   the base path under the GitHub Pages sub-path build, which would emit a
	   canonical of hhi-netherlands.com/HHI-Netherlands-Website/sponsors — a URL
	   that does not exist on the real domain. route.id is always the bare
	   route ('/sponsors'), base path or not. Trailing slash stripped so the
	   home route canonicalises to the bare origin rather than origin + '/'. */
	const canonicalPath = $derived((page.route.id ?? '/').replace(/\/$/, ''));

	/* Reduced motion gets its own class, as in the original. Note there is no
	   longer a .gsap-ready equivalent: reveals are attachments that set their
	   own starting state, so content is never hidden by CSS waiting for a CDN
	   that might never answer. That was the live bug fixed before Phase 1. */
	$effect(() => {
		if (prefersReducedMotion()) {
			document.documentElement.classList.add('reduced-motion');
		}
	});

	/* Every navigation changes the document height, and ScrollTrigger caches
	   its start/end positions. Without this refresh the pinned road section
	   lands at the wrong offset on return visits — the failure the old
	   full-page-reload model hid for free. */
	$effect(() => {
		void page.url.pathname;
		if (prefersReducedMotion()) return;

		let cancelled = false;
		loadScrollTrigger().then(({ ScrollTrigger }) => {
			if (cancelled) return;
			requestAnimationFrame(() => ScrollTrigger.refresh());
		});
		return () => {
			cancelled = true;
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Open Graph. Deliberately no og:title or og:description here: every
	     page sets its own <title> and description, and scrapers fall back to
	     those. Duplicating them in the layout would override each page's with
	     one generic pair. og:image must be absolute — a root-relative path is
	     ignored by every scraper. -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="HHI Netherlands" />
	<meta property="og:url" content="{SITE_URL}{canonicalPath}" />
	<link rel="canonical" href="{SITE_URL}{canonicalPath}" />
	<meta property="og:image" content="{SITE_URL}/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="Hip Hop International Netherlands — {EVENT_DATE_RANGE} at {EVENT_VENUE}"
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="grain" aria-hidden="true"></div>
<Cursor />

<Nav />
<MobileMenu />

{@render children()}

<Footer />

<!-- After the footer in source order so it comes last in the tab order:
     it is a shortcut back, not something to hit on the way down. -->
<ScrollTop />
