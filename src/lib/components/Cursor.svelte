<script lang="ts">
	import { isFinePointer, loadGsap, prefersReducedMotion } from '$lib/motion.svelte';

	let dot = $state<HTMLDivElement | null>(null);
	let ring = $state<HTMLDivElement | null>(null);

	/* Gated on (pointer: fine) and reduced motion, as in the original.
	   The is-hot state uses delegated listeners on document rather than
	   per-element ones, so links added by a later navigation still work. */
	$effect(() => {
		if (!dot || !ring) return;
		if (!isFinePointer() || prefersReducedMotion()) return;

		const HOT = 'a, button, .division, input, textarea';
		const root = document.documentElement;
		let cancelled = false;
		let cleanup: (() => void) | undefined;

		loadGsap().then((gsap) => {
			if (cancelled || !dot || !ring) return;
			root.classList.add('has-cursor');

			const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
			const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
			const ringX = gsap.quickTo(ring, 'x', { duration: 0.32, ease: 'power3.out' });
			const ringY = gsap.quickTo(ring, 'y', { duration: 0.32, ease: 'power3.out' });

			const onMove = (e: PointerEvent) => {
				dotX(e.clientX);
				dotY(e.clientY);
				ringX(e.clientX);
				ringY(e.clientY);
			};
			const onOver = (e: PointerEvent) => {
				const el = e.target as Element | null;
				if (el?.closest?.(HOT)) ring?.classList.add('is-hot');
			};
			const onOut = (e: PointerEvent) => {
				const el = e.target as Element | null;
				if (el?.closest?.(HOT)) ring?.classList.remove('is-hot');
			};

			window.addEventListener('pointermove', onMove);
			document.addEventListener('pointerover', onOver);
			document.addEventListener('pointerout', onOut);

			cleanup = () => {
				window.removeEventListener('pointermove', onMove);
				document.removeEventListener('pointerover', onOver);
				document.removeEventListener('pointerout', onOut);
				root.classList.remove('has-cursor');
			};
		});

		return () => {
			cancelled = true;
			cleanup?.();
		};
	});
</script>

<div class="cursor-dot" aria-hidden="true" bind:this={dot}></div>
<div class="cursor-ring" aria-hidden="true" bind:this={ring}></div>
