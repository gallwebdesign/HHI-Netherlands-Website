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

	/* ---- ticker pinned to the bottom of the first screen (desktop) -------
	   (17 Aug 2026) On load the strip sits against the bottom edge of the
	   viewport so it is visible without scrolling. The moment the reader
	   scrolls it unpins for good and behaves exactly as it did before,
	   scrolling up and away under the content below.

	   Three guards, and each one is load-bearing:

	   1. Desktop only, matching the 1000px breakpoint the pinned road
	      section and the two-column hero already use. Mobile keeps the
	      in-flow strip — the hero there is deliberately taller than the
	      screen, so there is no "bottom of the first screen" to pin to.

	   2. Only when it FITS. The hero fills the viewport and the countdown
	      sits at the bottom of it, so a blind pin covers the thing the
	      reader most needs. Measured at 1280x700: 42.9px of clear space
	      against a 74px strip, i.e. it would have covered the CTAs and the
	      countdown's lower edge. At 1440x900 there is 100.8px and it fits
	      with room to spare. The check is therefore made against the real
	      boxes at runtime, not against a viewport-height guess.

	   3. Unpin on the first scroll, not on a threshold. The brief is that
	      it scrolls "as it does now" once you start, so any movement at all
	      ends the pinned state permanently — no re-pinning when you return
	      to the top, which would make the strip jump around under you. */
	let tickerPinned = $state(false);

	$effect(() => {
		/* ⚠️ Wait for the curtain. Measured before the preloader lifts, the
		   hero has not laid out and .hero__meta reads far lower than it ends
		   up: at 1280x700 the gap measured 42.9px against a settled 162.9px,
		   so the strip refused to pin on a viewport where it fits easily.
		   heroReady is the same signal the hero entrance waits on, and
		   reading it here is what re-runs this effect once it flips. */
		if (!heroReady) return;

		const ticker = document.querySelector<HTMLElement>('.ticker');
		const slot = document.querySelector<HTMLElement>('.ticker-slot');
		const meta = document.querySelector<HTMLElement>('.hero__meta');
		if (!ticker || !slot || !meta) return;

		/* Already scrolled on arrival — a reload part-way down the page, or a
		   restored scroll position. Never pin in that case. */
		if (window.scrollY > 0) return;

		const fits = () => {
			if (!window.matchMedia('(min-width:1001px)').matches) return false;
			/* Measure the strip unpinned, so its own height is the real one
			   rather than whatever the fixed position gives it. Publishing it
			   as --ticker-h lets the placeholder reserve exactly this height;
			   the item's font-size is a clamp() on vw, so the box is only
			   knowable at runtime. */
			const h = ticker.offsetHeight;
			/* Published on <main>, the common ancestor: the slot reads it to
			   reserve the strip's space, and the hero reads it to reserve the
			   same band at its bottom edge so it centres between the nav and
			   the strip rather than within the raw viewport. Setting it on
			   the slot would put it out of the hero's reach — custom
			   properties inherit down the tree, and the hero is a sibling. */
			if (h) {
				slot.style.setProperty('--ticker-h', `${h}px`);
				document.querySelector('main')?.style.setProperty('--hero-ticker-h', `${h}px`);
			}
			const room = window.innerHeight - meta.getBoundingClientRect().bottom;
			return room >= h;
		};

		/* One frame past heroReady: the curtain has lifted but the entrance
		   tween is still settling the meta row into place on that first tick,
		   and this reads its final box rather than its starting one. */
		const raf = requestAnimationFrame(() => {
			tickerPinned = fits();
		});

		/* Once unpinned, stay unpinned: listeners are torn down on the first
		   scroll so nothing keeps measuring for the rest of the visit. */
		const unpin = () => {
			if (window.scrollY <= 0) return;
			tickerPinned = false;
			window.removeEventListener('scroll', unpin);
			window.removeEventListener('resize', onResize);
		};

		/* Resizing while still at the top re-tests the fit — dragging a window
		   shorter is exactly how the countdown would get covered. */
		const onResize = () => {
			if (window.scrollY > 0) return;
			tickerPinned = fits();
		};

		window.addEventListener('scroll', unpin, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('scroll', unpin);
			window.removeEventListener('resize', onResize);
		};
	});
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
		<div class="hero__inner hero__inner--split">
			<!-- Left column: the championship lockup. Purely decorative here —
			     the <h1> beside it already names the event, and the section's
			     aria-label repeats it, so alt="" keeps a screen reader from
			     hearing the same title three times. -->
			<div class="hero__brand" {@attach heroFade(0, heroReady)}>
				<img
					class="hero__mark"
					src="{base}/img/NHHDC_Zwart-Wit-Rood_No Shadow.svg"
					alt=""
					width="898"
					height="590"
					decoding="async"
					fetchpriority="high"
				/>
			</div>

			<!-- Right column: the eyebrow and the title only. -->
			<div class="hero__copy">
				<p class="hero__eyebrow" {@attach heroFade(0, heroReady)}>
					Netherlands Hip Hop Dance Championship &middot; {EVENT_YEAR}
				</p>
				<h1 class="hero__title">
					<span class="row"><span {@attach heroRow(0, heroReady)}>Own the</span></span>
					<span class="row"><span class="accent" {@attach heroRow(1, heroReady)}>floor.</span></span
					>
					<span class="row row--sub"
						><span class="hollow" {@attach heroRow(2, heroReady)}>Rep NL at Worlds.</span></span
					>
				</h1>
			</div>

			<!-- Full-width row beneath BOTH columns, not inside the right one:
			     lede, countdown and CTAs span the whole hero, exactly as they do
			     on main. It stays a child of the same grid (spanning 1 / -1)
			     rather than a sibling of .hero__inner, so it keeps the same
			     positioning context and its own three-column layout. -->
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

	<!-- The placeholder reserves the strip's height while it is pinned, so
	     unpinning on the first scroll does not yank the rest of the page up
	     by 74px. It collapses to nothing the moment the strip rejoins the
	     flow, and never exists at all on mobile. -->
	<div class="ticker-slot" class:is-pinned={tickerPinned}>
		<!-- Items are duplicated so the strip can loop seamlessly. The legacy
		     script did this by appending innerHTML at runtime. -->
		<div class="ticker" class:is-pinned={tickerPinned} aria-hidden="true">
			<div class="ticker__track">
				{#each [...TICKER_ITEMS, ...TICKER_ITEMS] as item, i (i)}
					<span class="ticker__item">{item}</span>
				{/each}
			</div>
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
					Since 2016 we've sent the country's best crews to face the world. This is where Dutch
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
				Six divisions, one rulebook. Build a routine, bring your crew, and battle for a national
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
						<!-- Optional: the captions were specific to the old photos and are
						     empty until someone describes the new ones. Four identical
						     captions read as unfinished, which is worse than none. -->
						{#if photo.caption}
							<figcaption>{photo.caption}</figcaption>
						{/if}
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
