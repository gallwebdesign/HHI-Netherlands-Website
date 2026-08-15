<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
	import { PHOTOS, VIDEOS } from '$lib/data/media';
	import { EXTERNAL } from '$lib/config';
	import { magnetic, reveal } from '$lib/attachments.svelte';

	/* The photos live on the legacy host, so any one of them can 404.
	   The legacy page used onerror="this.remove()", which dropped the
	   <img> but left its <figure> behind as an empty cell in the grid.
	   Tracking failures here instead lets the whole figure go.

	   Note the markup still renders every figure: the prerendered HTML
	   has to contain them all, and this only narrows the list once a
	   real load error fires in the browser. */
	let broken = $state(new Set<string>());

	function onError(src: string) {
		broken.add(src);
		broken = new Set(broken);
	}
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
	lede="Highlights from past editions of the Netherlands Hip Hop Dance Championship."
/>

<main>
	<section class="section media">
		<!-- The "Full photo archive" button was removed on 15 Aug 2026. It pointed
		     at the legacy photos.php, which dies with the old host and has no
		     migrated equivalent — the ~8,163-image archive is being pulled over
		     FTP and has not been republished. A button that 404s on cutover day
		     is worse than no button. Restore it if the archive gets real routes. -->
		<div class="media__head">
			<p class="tag" {@attach reveal()}>Photos</p>
		</div>
		<div class="gallery">
			{#each PHOTOS as photo (photo.src)}
				{#if !broken.has(photo.src)}
					<figure class="media__cell" {@attach reveal()}>
						<img
							src={photo.src}
							alt={photo.alt}
							loading="lazy"
							onerror={() => onError(photo.src)}
						/>
					</figure>
				{/if}
			{/each}
		</div>
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
