<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import { base } from '$app/paths';
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
		<a class="btn btn--solid" {@attach magnetic()} href="{base}/registration">Register your crew</a
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
		<dl class="event__facts event__facts--wide">
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
		<h2 class="h2" {@attach reveal()}>
			How the weekend <span class="accent">runs.</span>
		</h2>
		<div class="sched-days">
			{#each SCHEDULE as day (day.date)}
				<div class="sched-day" {@attach reveal()}>
					<p class="sched-day__date">{day.date}</p>
					<p class="sched-day__comp">{day.competition}</p>
					<div class="sched">
						{#each day.rows as row (row.time)}
							<div class="sched__row">
								<span class="sched__time">{row.time}</span><span class="sched__what"
									>{row.what}</span
								>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<!-- The day split above is confirmed; the running order within each day is
		     not. The footnote has to mark the whole schedule as provisional without
		     reading as though which competition dances when is still open. -->
		<p class="footnote" {@attach reveal()}>
			*  Times will be posted after registration is closed.
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
			<a class="btn" {@attach magnetic()} href="{base}/regulations">Read the regulations</a>
		</div>
	</section>
</main>
