<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { SPONSORS } from '$lib/data/sponsors';
	import { EVENT_YEAR } from '$lib/config';
	import { reveal } from '$lib/attachments.svelte';
</script>

<svelte:head>
	<title>Sponsors | HHI Netherlands</title>
	<meta
		name="description"
		content="The organisations behind the Netherlands Hip Hop Dance Championship."
	/>
</svelte:head>

<!-- Rewritten 15 Aug 2026: this page thanks the sponsors the championship
     already has. It used to sell packages ("Put your brand on the floor",
     three tiers, a Get in touch CTA) — Iain's instruction is to show current
     sponsors and not advertise for new ones, so there is deliberately no
     approach-us CTA anywhere on this page. -->
<PageHero
	tag="Sponsors"
	titleTop="Behind"
	titleBottom="the floor."
	treatment="accent"
	lede="The championship runs on the people who back it. These are the organisations that make the {EVENT_YEAR} Netherlands Hip Hop Dance Championship happen."
/>

<main>
	<section class="section">
		<div class="sponsors">
			{#each SPONSORS as sponsor (sponsor.href)}
				<a class="sponsor" {@attach reveal()} href={sponsor.href} target="_blank" rel="noopener">
					<!-- The logos are dark-on-transparent, drawn for a white page. The
					     plate is what keeps the darker ones visible on --ink. -->
					<span class="sponsor__plate">
						<img src={sponsor.logo} alt="" loading="lazy" />
					</span>
					<span class="sponsor__name">{sponsor.name}</span>
					<span class="sponsor__blurb">{sponsor.blurb}</span>
				</a>
			{/each}
		</div>
	</section>
</main>
