<script lang="ts">
	import { EXTERNAL, MENU_LINKS, REGISTRATION_HUB, withBase } from '$lib/config';
	import { menu } from '$lib/menu.svelte';
	import { loadGsap, prefersReducedMotion } from '$lib/motion.svelte';

	let panel = $state<HTMLDivElement | null>(null);

	/* body.menu-open locks scrolling; the class is owned here so it can
	   never be left behind on navigation. */
	$effect(() => {
		document.body.classList.toggle('menu-open', menu.open);
		return () => document.body.classList.remove('menu-open');
	});

	/* Escape closes and returns focus to the burger, as in the original. */
	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && menu.open) {
				menu.close();
				document.getElementById('burger')?.focus();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	/* Links and CTAs stagger in each time the panel opens. */
	$effect(() => {
		if (!menu.open || !panel || prefersReducedMotion()) return;

		let cancelled = false;
		const node = panel;

		loadGsap().then((gsap) => {
			if (cancelled) return;
			gsap.fromTo(
				node.querySelectorAll('.menu__link'),
				{ y: 34, autoAlpha: 0 },
				{ y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.05, delay: 0.08 }
			);
			gsap.fromTo(
				node.querySelectorAll('.menu__ctas, .menu__socials'),
				{ y: 20, autoAlpha: 0 },
				{ y: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.08, delay: 0.3 }
			);
		});

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="menu" id="menu" class:is-open={menu.open} aria-hidden={!menu.open} bind:this={panel}>
	<nav class="menu__links" aria-label="Mobile navigation">
		{#each MENU_LINKS as link (link.href)}
			<a class="menu__link" href={withBase(link.href)} onclick={() => menu.close()}>{link.label}</a>
		{/each}
	</nav>
	<div class="menu__ctas">
		<!-- Internal now: the hub, not a form. Needs menu.close() like the
		     nav links above — client-side navigation leaves the panel open. -->
		<a class="btn btn--solid" href={withBase(REGISTRATION_HUB)} onclick={() => menu.close()}
			>Register your crew</a
		>
		<a class="btn btn--ghost" href={EXTERNAL.tickets} target="_blank" rel="noopener">Tickets</a>
	</div>
	<div class="menu__socials">
		<a href={EXTERNAL.instagram} target="_blank" rel="noopener">Instagram</a>
		<a href={EXTERNAL.facebook} target="_blank" rel="noopener">Facebook</a>
		<a href={EXTERNAL.youtube} target="_blank" rel="noopener">YouTube</a>
	</div>
</div>
