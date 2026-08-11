<script lang="ts">
	import { page } from '$app/state';
	import { EXTERNAL, NAV_LINKS } from '$lib/config';

	/* The old markup hand-placed is-active on one link per file. Deriving it
	   from the URL means a new page can never forget to mark itself. */
	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<header class="nav" id="nav">
	<a class="nav__logo" href="/" aria-label="HHI Netherlands home">HHI<b>&middot;</b>NL</a>
	<ul class="nav__links">
		{#each NAV_LINKS as link (link.href)}
			<li>
				<a
					href={link.href}
					class:is-active={isActive(link.href)}
					aria-current={isActive(link.href) ? 'page' : undefined}>{link.label}</a
				>
			</li>
		{/each}
	</ul>
	<div class="nav__right">
		<a
			class="btn btn--solid btn--sm"
			data-magnetic
			href={EXTERNAL.tickets}
			target="_blank"
			rel="noopener">Tickets</a
		>
		<button
			class="burger"
			id="burger"
			aria-expanded="false"
			aria-controls="menu"
			aria-label="Open menu"
		>
			<span></span><span></span>
		</button>
	</div>
</header>
