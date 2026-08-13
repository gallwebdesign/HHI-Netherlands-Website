<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { base } from '$app/paths';
	import { ORG_CARDS } from '$lib/data/organisation';
	import { FOUNDED_YEAR } from '$lib/config';
	import { magnetic, reveal } from '$lib/attachments.svelte';
</script>

<svelte:head>
	<title>Organisation | HHI Netherlands</title>
	<meta
		name="description"
		content="Hip Hop International Netherlands — the official Dutch license holder of Hip Hop International."
	/>
</svelte:head>

<PageHero
	tag="Organisation"
	titleTop="The crew behind"
	titleBottom="the crews."
	treatment="accent"
	lede="Hip Hop International Netherlands holds the official Dutch license of Hip Hop International and has produced the national championship since {FOUNDED_YEAR}."
/>

<main>
	<section class="section">
		<div class="about">
			<blockquote class="about__quote" {@attach reveal()}>
				One mission: Dutch crews <em>on the world stage.</em>
			</blockquote>
			<div class="about__body">
				<p {@attach reveal()}>
					<strong>Hip Hop International</strong>, founded in Los Angeles in 2002, produces the World
					Hip Hop Dance Championship — the biggest street-dance competition on the planet, with
					crews from over fifty countries.
				</p>
				<p {@attach reveal()}>
					As the official license holder we bring that world stage to the Netherlands: one fair,
					professional championship where every crew gets the same shot at proving themselves.
				</p>
			</div>
		</div>
	</section>

	<section class="section divisions">
		<p class="tag" {@attach reveal()}>What we do</p>
		<!-- Inline offset carried over from the legacy markup; style.css is
		     frozen until Phase 7, so the rule has nowhere else to live yet. -->
		<div class="org-grid org-grid--offset">
			{#each ORG_CARDS as card (card.title)}
				<div class="org-card" {@attach reveal()}>
					<p class="division__age">{card.tag}</p>
					<h3>{card.title}</h3>
					<p>{card.body}</p>
				</div>
			{/each}
		</div>
		<div class="notice" {@attach reveal()}>
			<b>Join us</b>
			<span>Want to volunteer or work together? We’d love to hear from you.</span>
			<a class="btn btn--sm" {@attach magnetic()} href="{base}/contact">Contact</a>
		</div>
	</section>
</main>
