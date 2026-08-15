<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { RESULTS } from '$lib/data/results';
	import { reveal } from '$lib/attachments.svelte';

	/* The legacy version toggled .is-active by hand across two
	   NodeLists. It is one piece of state: which year is open.
	   RESULTS[0] is the newest edition, and the one with real data. */
	let active = $state(RESULTS[0].year);

	/* Derived so the notice cannot go stale as earlier editions are filled in.
	   A year counts as filled when it carries its official score sheets. */
	const FILLED_YEARS = RESULTS.filter((r) => r.sheets)
		.map((r) => r.year)
		.join(', ');

	/* The markup carried role="tablist" but the buttons had no
	   role="tab" and no aria-selected, so the tablist announced
	   itself and then contradicted its own contract. Completing it
	   means the buttons also need roving focus and arrow keys. */
	let tabs: HTMLButtonElement[] = [];

	function onKeydown(e: KeyboardEvent, i: number) {
		const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
		if (!delta) return;
		e.preventDefault();
		const next = (i + delta + RESULTS.length) % RESULTS.length;
		active = RESULTS[next].year;
		tabs[next]?.focus();
	}
</script>

<svelte:head>
	<title>Results | HHI Netherlands</title>
	<meta
		name="description"
		content="Past champions of the Netherlands Hip Hop Dance Championship."
	/>
</svelte:head>

<PageHero
	tag="Results"
	titleTop="Hall of"
	titleBottom="crews."
	treatment="accent"
	lede="Every crew that took a Dutch title and carried it to Worlds."
/>

<main>
	<section class="section">
		<div class="tabs" {@attach reveal()} role="tablist" aria-label="Year">
			{#each RESULTS as { year }, i (year)}
				<button
					bind:this={tabs[i]}
					role="tab"
					id="tab-{year}"
					aria-controls="panel-{year}"
					aria-selected={active === year}
					tabindex={active === year ? 0 : -1}
					class:is-active={active === year}
					onclick={() => (active = year)}
					onkeydown={(e) => onKeydown(e, i)}>{year}</button
				>
			{/each}
		</div>
		<div {@attach reveal()}>
			{#each RESULTS as { year, rows, sheets } (year)}
				<!-- Visibility is `hidden`, not the legacy .is-active class: that
				     class only ever worked via the [data-tab-panel] selector in
				     style.css, which this markup no longer emits. `hidden` also
				     keeps the closed panels out of the accessibility tree. -->
				<div
					id="panel-{year}"
					role="tabpanel"
					aria-labelledby="tab-{year}"
					hidden={active !== year}
				>
					<table class="rtable">
						<thead>
							<tr><th>Division</th><th>Gold</th><th>Silver</th><th>Bronze</th></tr>
						</thead>
						<tbody>
							{#each rows as row (row.division)}
								<tr>
									<td>{row.division}</td>
									<td class="gold">{row.gold}</td>
									<td>{row.silver}</td>
									<td>{row.bronze}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<!-- Only the years whose score sheets were recovered carry these.
					     They hold the full rankings, per-judge scores and deductions
					     that the podium table deliberately leaves out. -->
					{#if sheets}
						<div class="sheets">
							<p class="sheets__label">Official score sheets</p>
							<div class="sheets__links">
								{#each sheets as sheet (sheet.href)}
									<a class="btn btn--sm" href={sheet.href} target="_blank" rel="noopener"
										>{sheet.label}</a
									>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
		<!-- 2026 is real, recovered from the official score sheets on 15 Aug 2026.
		     The earlier editions are genuinely still missing, so the notice says
		     which is which rather than implying the whole page is provisional. -->
		<div class="notice" {@attach reveal()}>
			<b>Archive</b>
			<span
				>The {FILLED_YEARS} results are official, taken from the judges&rsquo; score sheets. Earlier editions
				are still being restored.</span
			>
		</div>
	</section>
</main>
