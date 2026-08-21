<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { RULE_COLUMNS } from '$lib/data/regulations';
	import { RULES_PDFS, RULES_PDFS_NL } from '$lib/config';
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
		     sub-label. Keyed on the title, which is unique *within* a
		     column; the two columns may repeat each other's titles, which
		     is why the key cannot be hoisted to a single flat list.

		     ONE grid holds BOTH columns, rather than a grid per column.
		     That is what keeps rule 03 level with rule 03 across the two:
		     grid sizes each row to its tallest cell, so a short rule on
		     one side is padded to match the other. Per-column grids size
		     their rows independently and drift apart as soon as the two
		     texts differ in length. Consequences:
		       - .rule-col is display:contents — it stays for the header
		         but generates no box, so the cards it wraps are children
		         of .rule-cols and take part in its row sizing.
		       - the header and the cards are placed by explicit column,
		         so each column's content stays in its own track.
		       - reveal() therefore CANNOT live on .rule-col: an element
		         with display:contents has no box for ScrollTrigger to
		         measure. It goes on the container instead, once for the
		         whole block. Never also on the cards — reveal animates
		         autoAlpha, and a revealed card inside a not-yet-revealed
		         ancestor stays visibility:hidden, which renders as an
		         empty grey box. -->
		<div class="rule-cols" {@attach reveal()}>
			{#each RULE_COLUMNS as column, col (column.competition)}
				<div class="rule-col" style="--col: {col + 1}">
					<header class="rule-col__head" style="--row: 1">
						<h2 class="rule-col__name">{column.competition}</h2>
						<p class="rule-col__note">{column.note}</p>
					</header>
					{#each column.rules as rule, i (rule.title)}
						<article class="rule" class:rule--first={i === 0} style="--row: {i + 2}">
							<span class="rule__num">{num(i)}</span>
							<div>
								<h3>{rule.title}</h3>
								<p>{rule.body}</p>
							</div>
						</article>
					{/each}
				</div>
			{/each}
		</div>
		<!-- Two PDFs per language, not one link. The legacy regulations.php was
		     only a wrapper around the English pair; they now live in
		     static/download/ alongside their Dutch translations, so the page
		     links all four directly rather than bouncing through a host that is
		     being switched off. -->
		<div class="notice notice--rules-en" {@attach reveal()}>
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
		<!-- The same two rulebooks in Dutch. A second .notice rather than two more
		     buttons in the first: the pairs are the same documents in different
		     languages, and a flat row of four gives a Dutch reader no way to tell
		     which two are theirs. Same styles throughout — only the modifier class
		     differs, and it carries no styling of its own, it exists so the smoke
		     test can count each language's links separately.

		     ⚠ The label text is Dutch on purpose. Someone scanning for their own
		     language finds this block by reading Dutch in it; an English caption
		     over Dutch files is the one thing that would hide it from them. -->
		<div class="notice notice--rules-nl" lang="nl" {@attach reveal()}>
			<b>Nederlands</b>
			<span>De offici&euml;le HHI-regels zijn ook in het Nederlands beschikbaar.</span>
			{#each RULES_PDFS_NL as pdf (pdf.href)}
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
