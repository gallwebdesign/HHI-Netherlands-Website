<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import { FACTS, SCHEDULE } from '$lib/data/events';
	import { EVENT_YEAR, EXTERNAL } from '$lib/config';
	import { magnetic, reveal } from '$lib/attachments.svelte';
</script>

<svelte:head>
	<title>Events | HHI Netherlands</title>
	<meta
		name="description"
		content="The {EVENT_YEAR} Netherlands Hip Hop Dance Championship — date, venue and schedule."
	/>
</svelte:head>

<PageHero
	tag="Events &middot; {EVENT_YEAR}"
	titleTop="The {EVENT_YEAR}"
	titleBottom="championship."
	treatment="accent"
	lede="Two days decide who represents the Netherlands at the World Hip Hop Dance Championship. Here&rsquo;s everything you need to plan for it."
>
	{#snippet actions()}
		<a
			class="btn btn--solid"
			{@attach magnetic()}
			href={EXTERNAL.registration}
			target="_blank"
			rel="noopener">Register your crew</a
		><a
			class="btn btn--ghost"
			{@attach magnetic()}
			href={EXTERNAL.tickets}
			target="_blank"
			rel="noopener">Get tickets</a
		>
	{/snippet}
</PageHero>

<main>
	<section class="section" id="countdown">
		<p class="tag" {@attach reveal()}>Countdown</p>
		<Countdown />
		<!-- Inline width carried over from the legacy markup; style.css is
		     frozen until Phase 7, so the rule has nowhere else to live yet. -->
		<dl class="event__facts" style="max-width: 820px">
			{#each FACTS as fact (fact.term)}
				<div class="event__fact" {@attach reveal()}>
					<dt>{fact.term}</dt>
					<dd>{fact.value}<small>{fact.note}</small></dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="section divisions" id="schedule">
		<p class="tag" {@attach reveal()}>Day schedule</p>
		<h2 class="h2" {@attach reveal()}>How the weekend <span class="accent">runs.</span></h2>
		<div class="sched" style="margin-top: 40px">
			{#each SCHEDULE as row (row.time)}
				<div class="sched__row" {@attach reveal()}>
					<span class="sched__time">{row.time}</span><span class="sched__what">{row.what}</span
					><span class="sched__note">{row.note}</span>
				</div>
			{/each}
		</div>
		<p class="footnote" {@attach reveal()}>
			* Indicative schedule — final times, and how the divisions split across the two days, follow
			with the official announcement.
		</p>
	</section>

	<section class="cta">
		<h2 class="h2" {@attach reveal()}>Be <span class="accent">there.</span></h2>
		<div class="cta__btns" {@attach reveal()}>
			<a
				class="btn btn--solid"
				{@attach magnetic()}
				href={EXTERNAL.tickets}
				target="_blank"
				rel="noopener">Get tickets</a
			>
			<a class="btn" {@attach magnetic()} href="/regulations">Read the regulations</a>
		</div>
	</section>
</main>
