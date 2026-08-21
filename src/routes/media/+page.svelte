<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import { VIDEOS } from '$lib/data/media';
	import { GALLERY_YEAR } from '$lib/data/gallery';
	import { EXTERNAL } from '$lib/config';
	import { magnetic, reveal } from '$lib/attachments.svelte';

	/* The eight-photo grid this page used to show (PHOTOS in data/media.ts)
	   was replaced by the 2026 gallery on 21 Aug 2026. Its broken-image guard
	   went with it: every src in the gallery is generated from a file the
	   build just read off disk, so the typo the guard existed to survive
	   cannot happen, and a genuine 404 already fails the smoke test outright.
	   The guard stays where filenames are still hand-written — home.ts. */
</script>

<svelte:head>
	<title>Media | HHI Netherlands</title>
	<meta
		name="description"
		content="Photos and videos from the Netherlands Hip Hop Dance Championship."
	/>
</svelte:head>

<PageHero
	tag="Media"
	titleTop="Loud, in"
	titleBottom="pictures."
	treatment="hollow"
	lede="The 2026 championship floor, division by division."
/>

<main>
	<section class="section media">
		<!-- The "Full photo archive" button was removed on 15 Aug 2026. It pointed
		     at the legacy photos.php, which dies with the old host and has no
		     migrated equivalent — the ~8,163-image archive is being pulled over
		     FTP and has not been republished. A button that 404s on cutover day
		     is worse than no button. Restore it if the archive gets real routes. -->
		<div class="media__head">
			<p class="tag" {@attach reveal()}>Photos &mdash; {GALLERY_YEAR}</p>
		</div>
		<Gallery />
	</section>

	<section class="section">
		<!-- Inline overrides carried over from the legacy markup; style.css is
		     frozen until Phase 7, so the rules have nowhere else to live yet. -->
		<div class="media__head media__head--flush">
			<p class="tag" {@attach reveal()}>Videos</p>
			<a
				class="btn btn--ghost btn--sm"
				{@attach magnetic()}
				href={EXTERNAL.youtube}
				target="_blank"
				rel="noopener">Our YouTube channel</a
			>
		</div>
		<div class="videos">
			{#each VIDEOS as video (video.id)}
				<div class="video" {@attach reveal()}>
					<iframe
						src="https://www.youtube.com/embed/{video.id}"
						title={video.title}
						loading="lazy"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				</div>
			{/each}
		</div>
	</section>
</main>
