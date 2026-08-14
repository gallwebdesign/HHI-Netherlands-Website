<script lang="ts">
	import { base } from '$app/paths';
	import Countdown from '$lib/components/Countdown.svelte';
	import Preloader from '$lib/components/Preloader.svelte';
	import StageFloor from '$lib/components/StageFloor.svelte';
	import { DIVISIONS, ROAD_PANELS, STATS, TEASER_PHOTOS, TICKER_ITEMS } from '$lib/data/home';
	import { EVENT_YEAR, EXTERNAL } from '$lib/config';
	import {
		count,
		heroFade,
		heroRow,
		magnetic,
		reveal,
		roadPin,
		tilt
	} from '$lib/attachments.svelte';

	/* The hero entrance waits for the curtain to lift, so the two are not
	   animating over each other. Preloader guarantees this fires — see the
	   watchdog there — so the hero can never be left hidden. */
	let heroReady = $state(false);

	/* Road panel numbers derive from array position, as elsewhere. */
	const num = (i: number) => String(i + 1).padStart(2, '0');

	/* Same legacy-host guard as the media page: hide the whole figure
	   rather than leaving an empty cell in the row. */
	let broken = $state(new Set<string>());
	function onError(src: string) {
		broken.add(src);
		broken = new Set(broken);
	}
</script>

<svelte:head>
	<title>HHI Netherlands &middot; Netherlands Hip Hop Dance Championship {EVENT_YEAR}</title>
	<meta
		name="description"
		content="The Netherlands Hip Hop Dance Championship. Win here, dance at Worlds. Register your crew."
	/>
</svelte:head>

<Preloader ondone={() => (heroReady = true)} />

<main id="top">
	<section class="hero" aria-label="Netherlands Hip Hop Dance Championship {EVENT_YEAR}">
		<StageFloor />
		<div class="hero__inner">
			<p class="hero__eyebrow" {@attach heroFade(0, heroReady)}>
				Netherlands Hip Hop Dance Championship &middot; {EVENT_YEAR}
			</p>
			<h1 class="hero__title">
				<span class="row"><span {@attach heroRow(0, heroReady)}>Own the</span></span>
				<span class="row"><span class="accent" {@attach heroRow(1, heroReady)}>floor.</span></span>
				<span class="row row--sub"
					><span class="hollow" {@attach heroRow(2, heroReady)}>Rep NL at Worlds.</span></span
				>
			</h1>
			<div class="hero__meta">
				<p class="hero__lede" {@attach heroFade(1, heroReady)}>
					The official national qualifier of <strong>Hip Hop International</strong>. Crews battle
					for the Dutch title — and the winners carry the flag to the
					<strong>World Hip Hop Dance Championship</strong>.
				</p>
				<Countdown heroEntrance ready={heroReady} />
				<div class="hero__ctas" {@attach heroFade(3, heroReady)}>
					<a class="btn btn--solid" {@attach magnetic()} href="{base}/registration"
						>Register your crew</a
					>
					<a class="btn btn--ghost" {@attach magnetic()} href="{base}/events"
						>The {EVENT_YEAR} event</a
					>
				</div>
			</div>
		</div>
		<p class="hero__scroll" aria-hidden="true">Scroll</p>
	</section>

	<!-- Items are duplicated so the strip can loop seamlessly. The legacy
	     script did this by appending innerHTML at runtime. -->
	<div class="ticker" aria-hidden="true">
		<div class="ticker__track">
			{#each [...TICKER_ITEMS, ...TICKER_ITEMS] as item, i (i)}
				<span class="ticker__item">{item}</span>
			{/each}
		</div>
	</div>

	<section class="section" id="about">
		<p class="tag" {@attach reveal()}>What is HHI Netherlands</p>
		<div class="about">
			<blockquote class="about__quote" {@attach reveal()}>
				“Uniting the world of hip hop <em>through dance.”</em>
			</blockquote>
			<div class="about__body">
				<p {@attach reveal()}>
					<strong>Hip Hop International Netherlands</strong> runs the official Dutch edition of the world’s
					biggest street-dance championship. One stage, every style — from popping and breaking to choreo
					— judged by the international HHI rulebook.
				</p>
				<p {@attach reveal()}>
					Since 2015 we’ve sent the country’s best crews to face the world. This is where Dutch
					crews are made, tested, and crowned.
				</p>
				<div class="about__stats">
					{#each STATS as stat (stat.label)}
						<div class="about__stat" {@attach reveal()}>
							<b {@attach count(stat.value)}>0</b><span>{stat.label}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="section divisions" id="divisions">
		<div class="divisions__head">
			<div>
				<p class="tag" {@attach reveal()}>Divisions</p>
				<h2 class="h2" {@attach reveal()}>
					Every age.<br /><span class="accent">Every style.</span>
				</h2>
			</div>
			<p {@attach reveal()}>
				Five divisions, one rulebook. Build a routine, bring your crew, and battle for a national
				title under official HHI judging.
			</p>
		</div>
		<div class="division-grid">
			{#each DIVISIONS as division (division.name)}
				<article class="division" {@attach reveal()} {@attach tilt()}>
					<p class="division__age">{division.age}</p>
					<h3 class="division__name">{division.name}</h3>
					<p class="division__crew">{division.crew}</p>
					<p class="division__desc">{division.desc}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="road" id="road">
		<div class="road__head">
			<p class="tag" {@attach reveal()}>The sequence</p>
			<h2 class="h2" {@attach reveal()}>Road to <span class="hollow">Worlds</span></h2>
		</div>
		<div class="road__viewport">
			<div class="road__track" {@attach roadPin()}>
				{#each ROAD_PANELS as panel, i (panel.title)}
					<article class="road__panel" class:road__panel--final={panel.final}>
						<p class="road__num">{num(i)}</p>
						<h3>{panel.title}</h3>
						<p>{panel.body}</p>
						<p class="road__where">{panel.where}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="section media" id="media-teaser">
		<div class="media__head">
			<div>
				<p class="tag" {@attach reveal()}>Media</p>
				<h2 class="h2" {@attach reveal()}>Last year <span class="hollow">was loud.</span></h2>
			</div>
			<div class="btn-row" {@attach reveal()}>
				<a class="btn btn--ghost btn--sm" {@attach magnetic()} href="{base}/media"
					>All photos &amp; videos</a
				>
			</div>
		</div>
		<div class="media__row">
			{#each TEASER_PHOTOS as photo (photo.src)}
				{#if !broken.has(photo.src)}
					<figure class="media__cell" {@attach reveal()}>
						<img
							src={photo.src}
							alt={photo.alt}
							loading="lazy"
							onerror={() => onError(photo.src)}
						/>
						<figcaption>{photo.caption}</figcaption>
					</figure>
				{/if}
			{/each}
		</div>
	</section>

	<section class="cta" id="register">
		<h2 class="h2" {@attach reveal()}>Ready? <span class="accent">Prove it.</span></h2>
		<p {@attach reveal()}>
			Registration for the Netherlands Hip Hop Dance Championship {EVENT_YEAR} is open. Lock in your crew
			before the bracket fills.
		</p>
		<div class="cta__btns" {@attach reveal()}>
			<a class="btn btn--solid" {@attach magnetic()} href="{base}/registration"
				>Register your crew</a
			>
			<a class="btn" {@attach magnetic()} href={EXTERNAL.tickets} target="_blank" rel="noopener"
				>Get tickets</a
			>
		</div>
	</section>
</main>
