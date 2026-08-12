/* ============================================================
   Shared motion primitives.

   Everything here touches window/document, so every export is
   designed to be called from inside an $effect — which only runs
   in the browser. adapter-static prerenders in Node, where window
   does not exist; a top-level GSAP import would crash the build,
   so GSAP is imported dynamically inside the effects that use it.
   ============================================================ */

/** Matches the CSS breakpoints and the legacy script's guards. */
export const prefersReducedMotion = () =>
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isFinePointer = () => window.matchMedia('(pointer: fine)').matches;

/** GSAP core, loaded once and shared. */
let gsapPromise: Promise<typeof import('gsap').gsap> | null = null;

export async function loadGsap() {
	if (!gsapPromise) {
		gsapPromise = import('gsap').then((m) => m.gsap);
	}
	return gsapPromise;
}

/* Headless browsers, background tabs and heavily loaded machines throttle
   requestAnimationFrame, and GSAP drives every tween from it. A 0.9s tween
   given only a handful of frames never visibly lands, which would leave
   content stranded mid-fade.

   Rather than probe the frame rate (a probe needs rAF to answer, so it is
   starved too), each animation registers a watchdog: if the tween has not
   finished within a generous multiple of its duration, jump it to the end.
   Content always arrives, however slow the ticker. */
export function withWatchdog(
	tween: { progress: (p?: number) => unknown; kill: () => void },
	durationSeconds: number
) {
	const timer = setTimeout(
		() => {
			tween.progress(1);
		},
		durationSeconds * 1000 + 1200
	);
	return () => clearTimeout(timer);
}

/** GSAP + ScrollTrigger, registered once. */
let scrollTriggerPromise: Promise<{
	gsap: typeof import('gsap').gsap;
	ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
}> | null = null;

export async function loadScrollTrigger() {
	if (!scrollTriggerPromise) {
		scrollTriggerPromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
			([{ gsap }, { ScrollTrigger }]) => {
				gsap.registerPlugin(ScrollTrigger);
				return { gsap, ScrollTrigger };
			}
		);
	}
	return scrollTriggerPromise;
}
