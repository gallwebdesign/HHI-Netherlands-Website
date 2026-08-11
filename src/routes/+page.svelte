<script lang="ts">
	import { EVENT_YEAR } from '$lib/config';
	import { reveal } from '$lib/attachments.svelte';
</script>

<svelte:head>
	<title>HHI Netherlands &middot; Netherlands Hip Hop Dance Championship {EVENT_YEAR}</title>
	<meta
		name="description"
		content="The official national qualifier of Hip Hop International. Crews battle for the Dutch title and carry the flag to the World Hip Hop Dance Championship."
	/>
</svelte:head>

<main id="top">
	<section class="section">
		<p class="tag" {@attach reveal()}>Phase 4</p>
		<h2 class="h2" {@attach reveal()}>
			Shared JavaScript <span class="accent">ported.</span>
		</h2>
		<p {@attach reveal()}>
			The home page content lands in Phase 6, along with the three.js stage floor, the preloader and
			the pinned road section.
		</p>
	</section>
</main>
