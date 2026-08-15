<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { PRIVACY_INTRO, PRIVACY_SECTIONS } from '$lib/data/privacy';
	import { base } from '$app/paths';
	import { reveal } from '$lib/attachments.svelte';

	/* Dutch is the authoritative text and therefore the default. This is a
	   local toggle, not the site-wide i18n that was removed in Phase 2 — it
	   swaps two fields on the same records rather than translating the site,
	   so it does not need a store or a URL parameter. Both languages are in
	   the prerendered HTML regardless; only visibility changes. */
	let lang = $state<'nl' | 'en'>('nl');
</script>

<svelte:head>
	<title>Privacybeleid | HHI Netherlands</title>
	<meta
		name="description"
		content="Privacybeleid van Hip Hop International Netherlands — welke persoonsgegevens wij verzamelen en hoe wij daarmee omgaan."
	/>
</svelte:head>

<PageHero
	tag="Privacy"
	titleTop="Privacy"
	titleBottom="policy."
	treatment="hollow"
	lede="Welke gegevens wij verzamelen, waarom, en wat u daarover te zeggen heeft."
/>

<main>
	<section class="section">
		<!-- The site is otherwise English-only, so a visitor landing here would
		     reasonably assume the English is the real document. It is not: this
		     is the text that was published, and it was published in Dutch. Say
		     so in both languages, above the toggle, before anything else.
		     Not reveal()'d, for the same reason as the switch below: this states
		     the document's legal standing and must not wait on a scroll. -->
		<div class="notice notice--measure">
			<b>{lang === 'nl' ? 'Nederlands is leidend' : 'Dutch is authoritative'}</b>
			<span>
				{#if lang === 'nl'}
					Dit privacybeleid is opgesteld in het Nederlands. De Engelse vertaling is uitsluitend ter
					informatie; bij verschillen prevaleert de Nederlandse tekst.
				{:else}
					This privacy policy was written in Dutch. The English translation is provided for
					convenience only; in the event of any difference, the Dutch text prevails.
				{/if}
			</span>
		</div>

		<!-- Deliberately NOT reveal()'d. reveal() parks an element at autoAlpha:0
		     until its ScrollTrigger fires, which also drops it out of the
		     accessibility tree — fine for prose, wrong for the control that
		     chooses the language, which sits above the fold and must be
		     operable the moment the page loads. -->
		<div class="lang-switch">
			<button
				type="button"
				class="lang-switch__btn"
				class:is-active={lang === 'nl'}
				aria-pressed={lang === 'nl'}
				onclick={() => (lang = 'nl')}>Nederlands</button
			><button
				type="button"
				class="lang-switch__btn"
				class:is-active={lang === 'en'}
				aria-pressed={lang === 'en'}
				onclick={() => (lang = 'en')}>English</button
			>
		</div>

		<div class="policy" {lang}>
			<p class="policy__lede">
				{lang === 'nl' ? PRIVACY_INTRO.nl : PRIVACY_INTRO.en}
			</p>

			{#each PRIVACY_SECTIONS as section (section.title)}
				<article class="policy__section" {@attach reveal()}>
					<h2 class="policy__h">{lang === 'nl' ? section.title : section.titleEn}</h2>
					{#each lang === 'nl' ? section.body : section.bodyEn as para (para)}
						<p>{para}</p>
					{/each}
					{#if section.list}
						<ul class="policy__list">
							{#each (lang === 'nl' ? section.list : section.listEn) ?? [] as item (item)}
								<li>{item}</li>
							{/each}
						</ul>
					{/if}
					{#each (lang === 'nl' ? section.after : section.afterEn) ?? [] as para (para)}
						<p>{para}</p>
					{/each}
				</article>
			{/each}
		</div>

		<!-- The policy tells people to use the contact form to exercise their
		     rights, so the page has to offer a route to it. CONTACT_EMAIL is
		     still the config TODO — it becomes real with the Cloud86 mailbox. -->
		<div class="notice notice--measure" {@attach reveal()}>
			<b>{lang === 'nl' ? 'Vragen over uw gegevens?' : 'Questions about your data?'}</b>
			<span>
				{#if lang === 'nl'}
					Neem contact met ons op om uw gegevens in te zien, te laten corrigeren of te laten
					verwijderen.
				{:else}
					Get in touch to access, correct or delete the data we hold about you.
				{/if}
			</span>
			<a class="btn btn--sm" href="{base}/contact">{lang === 'nl' ? 'Contact' : 'Contact us'}</a>
		</div>
	</section>
</main>
