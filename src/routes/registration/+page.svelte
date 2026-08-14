<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { CHECKLIST, STEPS } from '$lib/data/registration';
	import { EVENT_YEAR, EVENT_DATE_RANGE, EVENT_VENUE, REGISTRATION_FORMS } from '$lib/config';
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
	lede="Two competitions, two forms. Pick the one your crew is entering, fill it in, and you&rsquo;re on the floor."
>
	{#snippet actions()}
		<!-- In-page: the forms are below, and sending someone straight off-site
		     would skip the choice they have to make. -->
		<a class="btn btn--solid" {@attach magnetic()} href="#choose-your-form">Choose your form</a>
	{/snippet}
</PageHero>

<main>
	<section class="section" id="choose-your-form">
		<p class="tag" {@attach reveal()}>Choose your form</p>
		<h2 class="h2" {@attach reveal()}>
			Two competitions. <span class="accent">Two forms.</span>
		</h2>
		<p class="reg-day__lede" {@attach reveal()}>
			Both run at {EVENT_VENUE} across {EVENT_DATE_RANGE}. Register on the form for the competition
			your crew is entering.
		</p>
		<div class="reg-days">
			{#each REGISTRATION_FORMS as form (form.href)}
				<div class="reg-day" {@attach reveal()}>
					<p class="reg-day__name">{form.name}</p>
					<p class="reg-day__blurb">{form.blurb}</p>
					<a
						class="btn btn--solid"
						{@attach magnetic()}
						href={form.href}
						target="_blank"
						rel="noopener">Register — {form.name}</a
					>
				</div>
			{/each}
		</div>
		<!-- Open question 4: which divisions dance on which day is still
		     unannounced. That is a schedule question, not a registration one —
		     the forms split by competition — but crews will ask it here, so
		     say plainly that it is coming rather than leave it unaddressed. -->
		<div class="notice" {@attach reveal()}>
			<b>Which day do we dance?</b>
			<span
				>The championship runs across both days, and which divisions dance on which day is announced
				with the full programme. Register now — we&rsquo;ll confirm the schedule before the event.</span
			>
		</div>
	</section>

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
			<b>Ready?</b>
			<span>Checklist done — pick your competition and fill in its form.</span>
			<a class="btn btn--sm btn--solid" {@attach magnetic()} href="#choose-your-form"
				>Choose your form</a
			>
		</div>
	</section>
</main>
