<script lang="ts">
	import '$lib/style.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import MobileMenu from '$lib/components/MobileMenu.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Cursor from '$lib/components/Cursor.svelte';
	import { page } from '$app/state';
	import { loadScrollTrigger, prefersReducedMotion } from '$lib/motion.svelte';

	let { children } = $props();

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
