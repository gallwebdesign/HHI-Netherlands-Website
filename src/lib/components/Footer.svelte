<script lang="ts">
	import { EVENT_YEAR, FOOTER_LINKS, FOUNDED_YEAR } from '$lib/config';
</script>

<footer class="footer">
	<p>&copy; {FOUNDED_YEAR}&ndash;{EVENT_YEAR} Hip Hop International Netherlands</p>
	<nav aria-label="Footer">
		{#each FOOTER_LINKS as link (link.href)}
			<a
				href={link.href}
				target={'external' in link ? '_blank' : undefined}
				rel={'external' in link ? 'noopener' : undefined}>{link.label}</a
			>
		{/each}
	</nav>
</footer>
