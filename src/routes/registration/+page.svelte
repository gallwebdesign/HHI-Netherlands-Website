<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { CHECKLIST, STEPS } from '$lib/data/registration';
	import { EVENT_YEAR, EXTERNAL } from '$lib/config';
	import { magnetic, reveal } from '$lib/attachments.svelte';

	/* Step numbers derive from array position — 01, 02, … */
	const num = (i: number) => String(i + 1).padStart(2, '0');
</script>

<svelte:head>
	<title>Registration | HHI Netherlands</title>
	<meta
		name="description"
		content="Register your crew for the Netherlands Hip Hop Dance Championship."
	/>
</svelte:head>

<PageHero
	tag="Registration &middot; {EVENT_YEAR}"
	titleTop="Lock in"
	titleBottom="your crew."
	treatment="accent"
	lede="Registration runs through our official form. Four steps, one checklist, and your crew is on the floor."
>
	{#snippet actions()}
		<a
			class="btn btn--solid"
			{@attach magnetic()}
			href={EXTERNAL.registration}
			target="_blank"
			rel="noopener">Go to the registration form</a
		>
	{/snippet}
</PageHero>

<main>
	<section class="section">
		<p class="tag" {@attach reveal()}>How it works</p>
		<div class="steps">
			{#each STEPS as step, i (step.title)}
				<div class="step" {@attach reveal()}>
					<p class="step__num">{num(i)}</p>
					<h3>{step.title}</h3>
					<p>{step.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="section divisions">
		<p class="tag" {@attach reveal()}>Before you register</p>
		<h2 class="h2" {@attach reveal()}>The <span class="accent">checklist.</span></h2>
		<!-- Inline sizing carried over from the legacy markup; style.css is
		     frozen until Phase 7, so the rule has nowhere else to live yet. -->
		<ul class="check check--narrow">
			{#each CHECKLIST as item (item.label)}
				<li {@attach reveal()}><b>{item.label}</b> <span>{item.body}</span></li>
			{/each}
		</ul>
		<div class="notice" {@attach reveal()}>
			<b>Register</b>
			<span>Registration runs through the official form on hhi-netherlands.com.</span>
			<a
				class="btn btn--sm btn--solid"
				{@attach magnetic()}
				href={EXTERNAL.registration}
				target="_blank"
				rel="noopener">Register your crew</a
			>
		</div>
	</section>
</main>
