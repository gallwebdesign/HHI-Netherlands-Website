<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { EVENT_YEAR, EXTERNAL } from '$lib/config';
</script>

<svelte:head>
	<title>Registration | HHI Netherlands</title>
	<meta
		name="description"
		content="How to register your crew for the Netherlands Hip Hop Dance Championship."
	/>
</svelte:head>

<PageHero
	tag="Registration &middot; {EVENT_YEAR}"
	titleTop="Lock in"
	titleBottom="your crew."
	treatment="accent"
	lede="Registration runs through our official form. Four steps, one checklist, and your crew is on the floor."
>
	{#snippet actions()}
		<a
			class="btn btn--solid"
			data-magnetic
			href={EXTERNAL.registration}
			target="_blank"
			rel="noopener">Go to the registration form</a
		>
	{/snippet}
</PageHero>

<main></main>
