<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { EXTERNAL, NAV_LINKS, withBase } from '$lib/config';
	import { magnetic } from '$lib/attachments.svelte';
	import { prefersReducedMotion } from '$lib/motion.svelte';
	import { menu } from '$lib/menu.svelte';

	/* The old markup hand-placed is-active on one link per file. Deriving it
	   from the URL means a new page can never forget to mark itself.

	   page.url.pathname carries the base path when the site is served from a
	   sub-path (GitHub Pages), so it is stripped before comparing — otherwise
	   nothing ever matches and no link is marked current. */
	const isActive = (href: string) => {
		const path = page.url.pathname.slice(base.length) || '/';
		return href === '/' ? path === '/' : path.startsWith(href);
	};

	let scrolled = $state(false);
	let hidden = $state(false);

	/* Nav hides on scroll down, returns on scroll up — but never while the
	   mobile menu is open, and never under reduced motion. */
	$effect(() => {
		let lastY = window.scrollY;
		const reduced = prefersReducedMotion();

		const onScroll = () => {
			const y = window.scrollY;
			scrolled = y > 40;
			if (!reduced && !menu.open) {
				hidden = y > lastY && y > 300;
			}
			lastY = y;
		};

		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<header class="nav" id="nav" class:is-scrolled={scrolled} class:is-hidden={hidden && !menu.open}>
	<a class="nav__logo" href="{base}/" aria-label="HHI Netherlands home">HHI<b>&middot;</b>NL</a>
	<ul class="nav__links">
		{#each NAV_LINKS as link (link.href)}
			<li>
				<a
					href={withBase(link.href)}
					class:is-active={isActive(link.href)}
					aria-current={isActive(link.href) ? 'page' : undefined}>{link.label}</a
				>
			</li>
		{/each}
	</ul>
	<div class="nav__right">
		<a
			class="btn btn--solid btn--sm"
			{@attach magnetic()}
			href={EXTERNAL.tickets}
			target="_blank"
			rel="noopener">Tickets</a
		>
		<button
			class="burger"
			id="burger"
			class:is-open={menu.open}
			aria-expanded={menu.open}
			aria-controls="menu"
			aria-label={menu.open ? 'Close menu' : 'Open menu'}
			onclick={() => menu.toggle()}
		>
			<span></span><span></span>
		</button>
	</div>
</header>
