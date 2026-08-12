<script lang="ts">
	import { onMount } from 'svelte';
	import { loadGsap, prefersReducedMotion } from '$lib/motion.svelte';

	/* The home page curtain: a percentage counter that fills, then lifts
	   to reveal the hero.

	   It is a fixed 1.4s animation, NOT tied to real asset loading — so
	   it cannot hang waiting for an image that never arrives. The one way
	   it could strand the page is by never lifting, which would leave a
	   full-screen overlay covering everything. Three guards prevent that:

	     - `done` starts true during SSR, so the prerendered HTML has no
	       loader at all and a visitor without JS sees the page directly.
	     - Reduced motion and a failed GSAP import both skip straight to
	       done.
	     - A watchdog lifts the curtain regardless if the tween has not
	       finished in time — rAF is throttled in background tabs, and a
	       tween that never runs would otherwise never call onComplete. */

	interface Props {
		/** Fires once the curtain is up, so the hero can start its entrance. */
		ondone?: () => void;
	}
	let { ondone }: Props = $props();

	/* True until mount, which is what keeps the loader out of the
	   prerendered HTML — see above. */
	let done = $state(true);
	let pct = $state(0);
	let lifting = $state(false);

	onMount(() => {
		if (prefersReducedMotion()) {
			ondone?.();
			return;
		}

		done = false;
		let cancelled = false;
		let watchdog: ReturnType<typeof setTimeout>;
		let killTween: (() => void) | undefined;

		const finish = () => {
			if (cancelled || done) return;
			clearTimeout(watchdog);
			done = true;
			ondone?.();
		};

		loadGsap()
			.then((gsap) => {
				if (cancelled) return;

				const state = { v: 0 };
				const tween = gsap.to(state, {
					v: 100,
					duration: 1.4,
					ease: 'power2.inOut',
					onUpdate: () => {
						pct = Math.round(state.v);
					},
					onComplete: () => {
						// Play the lift, then unmount once it has cleared.
						lifting = true;
						gsap.delayedCall(0.7, finish);
					}
				});
				killTween = () => tween.kill();
			})
			.catch(finish);

		// Belt and braces: 1.4s fill + 0.7s lift, plus generous slack.
		watchdog = setTimeout(finish, 4000);

		return () => {
			cancelled = true;
			clearTimeout(watchdog);
			killTween?.();
		};
	});
</script>

{#if !done}
	<div class="loader" class:is-lifting={lifting} aria-hidden="true">
		<div class="loader__mark">HHI<span>&middot;</span>NL</div>
		<div class="loader__bar"><i style="transform: scaleX({pct / 100})"></i></div>
		<div class="loader__pct"><span>{pct}</span>%</div>
	</div>
{/if}

<style>
	/* The lift was a GSAP tween on the element in the legacy script. As a
	   class it survives the component being unmounted mid-animation, and
	   keeps style.css (frozen until Phase 7) untouched. */
	.loader {
		transition: transform 0.7s cubic-bezier(0.76, 0, 0.24, 1);
	}
	.loader.is-lifting {
		transform: translateY(-100%);
	}

	@media (prefers-reduced-motion: reduce) {
		.loader {
			transition: none;
		}
	}
</style>
