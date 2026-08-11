<script lang="ts">
	import { EXTERNAL, MENU_LINKS } from '$lib/config';
</script>

<div class="menu" id="menu" aria-hidden="true">
	<nav class="menu__links" aria-label="Mobile navigation">
		{#each MENU_LINKS as link (link.href)}
			<a class="menu__link" href={link.href}>{link.label}</a>
		{/each}
	</nav>
	<div class="menu__ctas">
		<a class="btn btn--solid" href={EXTERNAL.registration} target="_blank" rel="noopener"
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
