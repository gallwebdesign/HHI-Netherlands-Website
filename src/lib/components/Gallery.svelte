<script lang="ts">
	import Lightbox from '$lib/components/Lightbox.svelte';
	import {
		ALL_DIVISIONS,
		COMPETITIONS,
		GALLERY_PHOTOS,
		GALLERY_YEAR,
		fetchGalleryPhotos,
		photosFor,
		type GalleryPhoto
	} from '$lib/data/gallery';
	import { magnetic, reveal } from '$lib/attachments.svelte';

	let competition = $state(COMPETITIONS[0].slug);
	let division = $state<string>(ALL_DIVISIONS);

	/* ============================================================
	   The photo list starts as the build-time manifest and is
	   replaced by the server's own folder listing once it answers.

	   Why it cannot just be the build manifest: the ~951 photos are
	   deliberately not in the repo, so the CI build that produces
	   the live site walks an empty tree and bakes an empty list.
	   That is how /media shipped showing nothing on 21 Aug 2026
	   while every photo sat on the server returning 200.

	   Starting from GALLERY_PHOTOS rather than an empty array is
	   what keeps this honest in the other two environments: `npm
	   run dev` and the smoke tests both have the real photos on
	   disk, so the grid is populated on first paint and the tests
	   still assert against real tiles rather than a loading state.
	   In production the initial list is empty and the fetch fills
	   it; on GitHub Pages there is no PHP, the fetch fails, and
	   the build manifest is kept. Every path renders something
	   truthful.
	   ============================================================ */
	let photoSource = $state<GalleryPhoto[]>(GALLERY_PHOTOS);

	/* Only true while the FIRST load is in flight AND there is nothing to
	   show yet. Used to tell "still asking" apart from "asked, and the answer
	   was no photos" — the empty state must not accuse Iain of having
	   uploaded nothing while the request is still open. */
	let loading = $state(GALLERY_PHOTOS.length === 0);

	$effect(() => {
		/* Runs once, in the browser only. The prerender pass has no server to
		   ask and must not block on one; it renders the build manifest, which
		   is what the crawler and a no-JS visitor see. */
		let cancelled = false;

		fetchGalleryPhotos().then((photos) => {
			if (cancelled) return;
			/* null means the endpoint failed in some way — keep whatever we
			   already had rather than emptying a working gallery. */
			if (photos) photoSource = photos;
			loading = false;
		});

		return () => {
			cancelled = true;
		};
	});

	/* Roving focus needs a handle on each button, and the two tablists are
	   independent — separate arrays, separate handlers, separate wrap lengths. */
	let compTabs: HTMLButtonElement[] = [];
	let divTabs: HTMLButtonElement[] = [];

	const activeCompetition = $derived(
		COMPETITIONS.find((c) => c.slug === competition) ?? COMPETITIONS[0]
	);

	/* The division tablist is "All" followed by that competition's divisions,
	   so the keys and the buttons share one source and cannot drift apart. */
	const divisionKeys = $derived([ALL_DIVISIONS, ...activeCompetition.divisions.map((d) => d.slug)]);

	const photos = $derived(photosFor(competition, division, photoSource));

	/* Selecting a competition resets the division in the same synchronous
	   update. Doing it in an $effect instead would let one render happen with
	   a division slug that does not exist in the new competition — Parents is
	   an Open Division only, so switching to HHDC with it still selected
	   filters to nothing and shows an empty state for a competition that has
	   photos. Both handlers below call this; missing it in the keyboard one
	   is the easy bug. */
	function selectCompetition(slug: string) {
		competition = slug;
		division = ALL_DIVISIONS;
		resetPaging();
	}

	function selectDivision(slug: string) {
		division = slug;
		resetPaging();
	}

	function onCompetitionKeydown(e: KeyboardEvent, i: number) {
		const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
		if (!delta) return;
		e.preventDefault();
		const next = (i + delta + COMPETITIONS.length) % COMPETITIONS.length;
		selectCompetition(COMPETITIONS[next].slug);
		compTabs[next]?.focus();
	}

	function onDivisionKeydown(e: KeyboardEvent, i: number) {
		const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
		if (!delta) return;
		e.preventDefault();
		const next = (i + delta + divisionKeys.length) % divisionKeys.length;
		selectDivision(divisionKeys[next]);
		divTabs[next]?.focus();
	}

	function divisionLabel(slug: string) {
		if (slug === ALL_DIVISIONS) return 'All';
		return activeCompetition.divisions.find((d) => d.slug === slug)?.label ?? slug;
	}

	/* Paging. A division can run to hundreds of shots and every tile is a real
	   <img>, so the whole set is not put on the page at once. */
	const PAGE_SIZE = 24;
	let shown = $state(PAGE_SIZE);

	/* Any change of filter starts the count again — carrying a large `shown`
	   from a big division into a small one would render its entire set, and
	   carrying a small one the other way would hide photos with no way back
	   short of clicking Load more. Assigning in the same handlers as the
	   filter change keeps it synchronous, for the reason above. */
	function resetPaging() {
		shown = PAGE_SIZE;
	}

	const visible = $derived(photos.slice(0, shown));
	const remaining = $derived(photos.length - visible.length);

	let grid = $state<HTMLDivElement | null>(null);

	/* Focus has to be moved by hand. The button either disappears (last page)
	   or stays put while the content it added lands above it, so a keyboard
	   user is left either on a dead node or with no idea anything happened.
	   Sending focus to the first newly added tile both announces the change
	   and puts them where the new photos are. */
	function loadMore() {
		const firstNew = shown;
		shown += PAGE_SIZE;
		requestAnimationFrame(() => {
			grid?.querySelectorAll<HTMLButtonElement>('.gallery__tile')[firstNew]?.focus();
		});
	}

	/* Lightbox state. `openIndex` indexes into `photos` — the FULL filtered
	   list, deliberately not `visible`: arrowing through the lightbox should
	   run to the end of the division rather than stopping at whatever the grid
	   has paged in. The tile that opened it is kept so focus can go back
	   there, which the Lightbox itself cannot do once it has unmounted. */
	let openIndex = $state<number | null>(null);
	let opener: HTMLButtonElement | null = null;

	function openAt(i: number, button: HTMLButtonElement) {
		opener = button;
		openIndex = i;
	}

	function closeLightbox() {
		openIndex = null;
		opener?.focus();
		opener = null;
	}
</script>

<!-- One reveal() on the whole shell, never one per tile. Tiles come and go as
     the filters change, and a reveal() on each would leave an orphaned
     ScrollTrigger behind every time; nesting reveal() inside reveal() also
     strands the inner nodes at visibility:hidden, which has shipped here
     before. The cost is that the gallery fades in as a block — with a grid
     this size, a per-tile stagger was never the right effect anyway. -->
<div class="gallery-shell" {@attach reveal()}>
	<div class="gallery-tabs">
		<div class="tabs" role="tablist" aria-label="Competition">
			{#each COMPETITIONS as comp, i (comp.slug)}
				<button
					bind:this={compTabs[i]}
					role="tab"
					id="comptab-{comp.slug}"
					aria-controls="comppanel-{comp.slug}"
					aria-selected={competition === comp.slug}
					tabindex={competition === comp.slug ? 0 : -1}
					class:is-active={competition === comp.slug}
					onclick={() => selectCompetition(comp.slug)}
					onkeydown={(e) => onCompetitionKeydown(e, i)}>{comp.label}</button
				>
			{/each}
		</div>

		<!-- Keyed on the competition so the whole division tablist is rebuilt
		     when it changes, rather than Svelte reusing buttons across two
		     lists of different lengths and leaving stale bind:this entries. -->
		{#key competition}
			<div class="tabs tabs--divisions" role="tablist" aria-label="Division">
				{#each divisionKeys as key, i (key)}
					<button
						bind:this={divTabs[i]}
						role="tab"
						id="divtab-{key}"
						aria-controls="divpanel-{key}"
						aria-selected={division === key}
						tabindex={division === key ? 0 : -1}
						class:is-active={division === key}
						onclick={() => selectDivision(key)}
						onkeydown={(e) => onDivisionKeydown(e, i)}>{divisionLabel(key)}</button
					>
				{/each}
			</div>
		{/key}
	</div>

	<!-- Only the open panel is rendered. `hidden` on the others would keep
	     every division's photos in the document at once, which for a full
	     archive is thousands of <img> the browser must still account for. -->
	<div
		id="comppanel-{competition}"
		role="tabpanel"
		aria-labelledby="comptab-{competition}"
		tabindex="-1"
	>
		<div id="divpanel-{division}" role="tabpanel" aria-labelledby="divtab-{division}">
			{#if photos.length > 0}
				<div class="gallery gallery--grid" bind:this={grid}>
					{#each visible as photo, i (photo.src)}
						<button
							class="media__cell gallery__tile"
							onclick={(e) => openAt(i, e.currentTarget)}
							aria-label="Open photo {i + 1} of {photos.length}"
						>
							<!-- photo.thumb, NOT photo.src. The original is ~318KB and this
							     tile is ~209px wide; the lightbox is what serves the full-size
							     file. decoding="async" keeps a batch of 24 off the main thread
							     so the tabs stay responsive while they land. -->
							<img src={photo.thumb} alt={photo.alt} loading="lazy" decoding="async" />
						</button>
					{/each}
				</div>
				{#if remaining > 0}
					<div class="gallery-more">
						<p class="gallery-more__count" aria-live="polite">
							Showing {visible.length} of {photos.length}
						</p>
						<button class="btn btn--ghost" {@attach magnetic()} onclick={loadMore}>
							Load more
						</button>
					</div>
				{/if}
			{:else if loading}
				<!-- Distinct from the empty state on purpose. In production the
				     build manifest is empty and the real list arrives from
				     api/gallery.php a moment later, so "Coming soon" would flash
				     up and call Iain a liar about photos that are about to
				     appear. aria-live announces the change to a screen reader
				     once the tiles land, since nothing moves focus. -->
				<div class="gallery-empty" aria-live="polite">
					<b>Loading photos&hellip;</b>
					<span>Pulling the {GALLERY_YEAR} gallery.</span>
				</div>
			{:else}
				<div class="gallery-empty">
					<b>Coming soon</b>
					<span
						>The {GALLERY_YEAR} floor is still being cut. These crews left everything out there &mdash;
						the proof lands here shortly.</span
					>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if openIndex !== null}
	<Lightbox {photos} bind:index={openIndex} onclose={closeLightbox} />
{/if}
