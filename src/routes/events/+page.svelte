<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { EVENT_YEAR, EXTERNAL } from '$lib/config';
	import { magnetic } from '$lib/attachments.svelte';
</script>

<svelte:head>
	<title>Events | HHI Netherlands</title>
	<meta
		name="description"
		content="The Netherlands Hip Hop Dance Championship — dates, venue and what to expect."
	/>
</svelte:head>

<PageHero
	tag="Events &middot; {EVENT_YEAR}"
	titleTop="The {EVENT_YEAR}"
	titleBottom="championship."
	treatment="accent"
	lede="One day decides who represents the Netherlands at the World Hip Hop Dance Championship. Here&rsquo;s everything you need to plan for it."
>
	{#snippet actions()}
		<a
			class="btn btn--solid"
			{@attach magnetic()}
			href={EXTERNAL.registration}
			target="_blank"
			rel="noopener">Register your crew</a
		>
		<a class="btn btn--ghost" {@attach magnetic()} href={EXTERNAL.tickets} target="_blank" rel="noopener"
			>Get tickets</a
		>
	{/snippet}
</PageHero>

<main></main>
