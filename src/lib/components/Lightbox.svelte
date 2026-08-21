<script lang="ts">
	import type { GalleryPhoto } from '$lib/data/gallery';
	import { prefersReducedMotion } from '$lib/motion.svelte';

	/* The lightbox is handed the *filtered* list and an index into it, never
	   the whole gallery: arrowing through a division should stay inside that
	   division rather than wandering into photos the visitor filtered out. */
	let {
		photos,
		index = $bindable(),
		onclose
	}: {
		photos: GalleryPhoto[];
		index: number;
		onclose: () => void;
	} = $props();

	let closeButton = $state<HTMLButtonElement | null>(null);
	let dialog = $state<HTMLDivElement | null>(null);

	/* prefersReducedMotion() touches window.matchMedia. That is safe here only
	   because the lightbox is never rendered during the prerender — it mounts
	   in response to a click, so by the time this evaluates there is a window.
	   Nothing else in this component may assume that. */
	const instant = $derived(prefersReducedMotion());

	const photo = $derived(photos[index]);

	/* Modulo so the ends wrap, matching how the tablists behave. */
	function step(delta: number) {
		if (photos.length === 0) return;
		index = (index + delta + photos.length) % photos.length;
	}

	/* Escape and the arrows share one window listener, as MobileMenu does, so
	   there is exactly one teardown to get right. Registered in an $effect
	   because it touches window — this component is prerendered too. */
	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				onclose();
				return;
			}
			const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
			if (!delta) return;
			e.preventDefault();
			step(delta);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	/* body.lightbox-open, deliberately NOT the menu-open class MobileMenu
	   owns: its teardown removes that class unconditionally, so a menu closing
	   behind an open lightbox would unlock scrolling underneath it. Two
	   owners, one class, no coordination — this keeps them separate. */
	$effect(() => {
		document.body.classList.add('lightbox-open');
		return () => document.body.classList.remove('lightbox-open');
	});

	/* Focus moves in on open. Focus returning to the tile that opened the
	   lightbox is the Gallery's job — it is the only thing that still has a
	   reference to that button once this component is gone. */
	$effect(() => {
		closeButton?.focus();
	});

	/* Minimal containment rather than a full trap: Tab cycles between the
	   three controls. The site has no full trap anywhere (MobileMenu does not
	   either), and a real one belongs in a shared helper, not here. */
	function onKeydownTrap(e: KeyboardEvent) {
		if (e.key !== 'Tab' || !dialog) return;
		const focusable = dialog.querySelectorAll<HTMLElement>('button');
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}
</script>

<!-- The backdrop closes on click, but only when the click is on the backdrop
     itself: a click that lands on the photo or a control must not fall
     through and close it. Escape covers the keyboard, from the window
     listener above, so there is no key handler to mirror the click.

     tabindex="-1" makes the dialog focusable as a container without putting
     it in the tab order — required of role="dialog", and what lets focus
     rest somewhere sane if a control is ever removed. -->
<div
	class="lightbox"
	class:lightbox--instant={instant}
	role="dialog"
	aria-modal="true"
	aria-label="Photo viewer"
	tabindex="-1"
	bind:this={dialog}
	onkeydown={onKeydownTrap}
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
>
	<button class="lightbox__close" onclick={onclose} bind:this={closeButton} aria-label="Close">
		<span class="lightbox__x" aria-hidden="true"></span>
	</button>

	{#if photos.length > 1}
		<button
			class="lightbox__nav lightbox__nav--prev"
			onclick={() => step(-1)}
			aria-label="Previous photo"
		>
			<span class="lightbox__chevron" aria-hidden="true"></span>
		</button>
	{/if}

	<figure class="lightbox__frame">
		{#if photo}
			<img class="lightbox__img" src={photo.src} alt={photo.alt} />
		{/if}
		<!-- Counter, not a caption: the division is already named by the tab
		     that filtered this list, and the photos carry no per-shot detail
		     worth printing under them. -->
		<figcaption class="lightbox__count">{index + 1} / {photos.length}</figcaption>
	</figure>

	{#if photos.length > 1}
		<button
			class="lightbox__nav lightbox__nav--next"
			onclick={() => step(1)}
			aria-label="Next photo"
		>
			<span class="lightbox__chevron" aria-hidden="true"></span>
		</button>
	{/if}
</div>
