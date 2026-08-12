<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { TIERS } from '$lib/data/sponsors';
	import { magnetic, reveal } from '$lib/attachments.svelte';
</script>

<svelte:head>
	<title>Sponsors | HHI Netherlands</title>
	<meta name="description" content="Partner with the Netherlands Hip Hop Dance Championship." />
</svelte:head>

<PageHero
	tag="Sponsors"
	titleTop="Put your brand"
	titleBottom="on the floor."
	treatment="accent"
	lede="A full house, a young energetic audience, and a stage that ends at the World Championship. That&rsquo;s the room your brand steps into."
/>

<main>
	<section class="section">
		<p class="tag" {@attach reveal()}>Example packages</p>
		<div class="tiers">
			{#each TIERS as tier (tier.title)}
				<div class="tier" class:tier--hot={tier.featured} {@attach reveal()}>
					<p class="tier__tag">{tier.tag}</p>
					<h3>{tier.title}</h3>
					<ul>
						{#each tier.items as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
		<div class="notice" {@attach reveal()}>
			<b>Interested?</b>
			<span>Packages are indicative — every partnership is built to fit.</span>
			<a class="btn btn--sm btn--solid" {@attach magnetic()} href="/contact">Get in touch</a>
		</div>
	</section>
</main>
