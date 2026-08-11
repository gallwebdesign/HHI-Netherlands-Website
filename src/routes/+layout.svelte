<script lang="ts">
	import '$lib/style.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import MobileMenu from '$lib/components/MobileMenu.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap"
		rel="stylesheet"
	/>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
	<script
		src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
		defer
	></script>
	<script src="/assets/main.js" defer></script>
</svelte:head>

<div class="grain" aria-hidden="true"></div>
<div class="cursor-dot" aria-hidden="true"></div>
<div class="cursor-ring" aria-hidden="true"></div>

<Nav />
<MobileMenu />

{@render children()}

<Footer />
