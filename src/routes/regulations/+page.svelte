<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { RULES } from '$lib/data/regulations';
	import { RULES_PDFS } from '$lib/config';
	import { magnetic, reveal } from '$lib/attachments.svelte';

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
				<article class="rule" {@attach reveal()}>
					<span class="rule__num">{num(i)}</span>
					<div>
						<h3>{rule.title}</h3>
						<p>{rule.body}</p>
					</div>
				</article>
			{/each}
		</div>
		<!-- Two PDFs, not one link. The legacy regulations.php was only a wrapper
		     around these same two files; they now live in static/download/, so
		     the page links them directly rather than bouncing through a host
		     that is being switched off. -->
		<div class="notice" {@attach reveal()}>
			<b>Heads up</b>
			<span>This is a summary. The full, binding rules are the official HHI PDFs.</span>
			{#each RULES_PDFS as pdf (pdf.href)}
				<a
					class="btn btn--sm"
					{@attach magnetic()}
					href={pdf.href}
					target="_blank"
					rel="noopener"
					title={pdf.note}>{pdf.label}</a
				>
			{/each}
		</div>
	</section>
</main>
