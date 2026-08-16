<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { RULE_COLUMNS } from '$lib/data/regulations';
	import { RULES_PDFS } from '$lib/config';
	import { magnetic, reveal } from '$lib/attachments.svelte';

	/* Rule numbers derive from array position — 01, 02, … — so adding
	   or reordering a rule in the data file renumbers the page. The
	   count restarts in each column, so both read 01 at the top. */
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
		<!-- One column per competition, headed the same way the events page
		     heads its two day columns: display-font name, mono accent
		     sub-label. Both columns hold the same six rules until the
		     per-competition text lands — see the note in regulations.ts.
		     Keyed on the title, which is unique *within* a column; the two
		     columns repeating each other is exactly why the key cannot be
		     hoisted to a single flat list. -->
		<!-- reveal() goes on the column, never also on the cards inside it.
		     It animates autoAlpha, which sets visibility:hidden until the
		     element's own top crosses the trigger line — so a revealed card
		     inside a not-yet-revealed column can never become visible, and
		     the column renders as an empty grey box. The events page nests
		     the same way for the same reason: .sched-day reveals, its rows
		     do not. -->
		<div class="rule-cols">
			{#each RULE_COLUMNS as column (column.competition)}
				<div class="rule-col" {@attach reveal()}>
					<h2 class="rule-col__name">{column.competition}</h2>
					<p class="rule-col__note">{column.note}</p>
					<div class="rules">
						{#each column.rules as rule, i (rule.title)}
							<article class="rule">
								<span class="rule__num">{num(i)}</span>
								<div>
									<h3>{rule.title}</h3>
									<p>{rule.body}</p>
								</div>
							</article>
						{/each}
					</div>
				</div>
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
