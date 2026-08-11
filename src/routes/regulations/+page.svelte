<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { RULES } from '$lib/data/regulations';
	import { EXTERNAL } from '$lib/config';

	/* Rule numbers derive from array position — 01, 02, … — so adding
	   or reordering a rule in the data file renumbers the page. */
	const num = (i: number) => String(i + 1).padStart(2, '0');
</script>

<svelte:head>
	<title>Regulations | HHI Netherlands</title>
	<meta
		name="description"
		content="How the Netherlands Hip Hop Dance Championship is judged — a summary of the official HHI rules."
	/>
</svelte:head>

<PageHero
	tag="Regulations"
	titleTop="Rules of"
	titleBottom="the floor."
	treatment="hollow"
	lede="A plain-language summary of how the championship works. The official HHI Rules &amp; Regulations are always leading."
/>

<main>
	<section class="section">
		<div class="rules">
			{#each RULES as rule, i (rule.title)}
				<article class="rule" data-reveal>
					<span class="rule__num">{num(i)}</span>
					<div>
						<h3>{rule.title}</h3>
						<p>{rule.body}</p>
					</div>
				</article>
			{/each}
		</div>
		<div class="notice" data-reveal>
			<b>Heads up</b>
			<span>This is a summary. The full, binding rules live on the official page.</span>
			<a
				class="btn btn--sm"
				data-magnetic
				href={EXTERNAL.regulations}
				target="_blank"
				rel="noopener">Official regulations</a
			>
		</div>
	</section>
</main>
