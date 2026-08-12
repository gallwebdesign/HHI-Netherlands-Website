/* ============================================================
   Attachments replacing the legacy script's attribute-driven
   wiring. Each one returns its teardown, which is what the old
   IIFE never had: with a client router, listeners and triggers
   outlive the page they were created for unless killed.
   ============================================================ */

import type { Attachment } from 'svelte/attachments';
import {
	isFinePointer,
	loadGsap,
	loadScrollTrigger,
	prefersReducedMotion,
	withWatchdog
} from './motion.svelte';

/** Scroll fade-in. Replaces [data-reveal] + the global ScrollTrigger sweep. */
export function reveal(): Attachment<HTMLElement> {
	return (node) => {
		if (prefersReducedMotion()) {
			// Reduced motion: the CSS fallback keeps content visible. Nothing to do.
			return;
		}

		let cancelled = false;
		let trigger: { kill: () => void } | undefined;
		let stopWatchdog: (() => void) | undefined;

		loadScrollTrigger().then(({ gsap }) => {
			if (cancelled) return;
			const tween = gsap.fromTo(
				node,
				{ y: 40, autoAlpha: 0 },
				{
					y: 0,
					autoAlpha: 1,
					duration: 0.9,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: node,
						start: 'top 88%',
						once: true,
						// Only guard once the element is actually meant to be visible.
						onEnter: () => {
							stopWatchdog = withWatchdog(tween, 0.9);
						}
					}
				}
			);
			trigger = tween.scrollTrigger;
		});

		return () => {
			cancelled = true;
			stopWatchdog?.();
			trigger?.kill();
		};
	};
}

/** Cursor-attracted button. Replaces [data-magnetic]. */
export function magnetic(strength = 0.35): Attachment<HTMLElement> {
	return (node) => {
		if (!isFinePointer() || prefersReducedMotion()) return;

		let cancelled = false;
		let cleanup: (() => void) | undefined;

		loadGsap().then((gsap) => {
			if (cancelled) return;

			const onMove = (e: PointerEvent) => {
				const r = node.getBoundingClientRect();
				gsap.to(node, {
					x: (e.clientX - (r.left + r.width / 2)) * strength,
					y: (e.clientY - (r.top + r.height / 2)) * strength,
					duration: 0.3,
					ease: 'power2.out'
				});
			};
			const onLeave = () => {
				gsap.to(node, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
			};

			node.addEventListener('pointermove', onMove);
			node.addEventListener('pointerleave', onLeave);
			cleanup = () => {
				node.removeEventListener('pointermove', onMove);
				node.removeEventListener('pointerleave', onLeave);
				gsap.killTweensOf(node);
			};
		});

		return () => {
			cancelled = true;
			cleanup?.();
		};
	};
}

/** 3D card hover. Replaces [data-tilt]. */
export function tilt(): Attachment<HTMLElement> {
	return (node) => {
		if (!isFinePointer() || prefersReducedMotion()) return;

		let cancelled = false;
		let cleanup: (() => void) | undefined;

		loadGsap().then((gsap) => {
			if (cancelled) return;

			const onMove = (e: PointerEvent) => {
				const r = node.getBoundingClientRect();
				gsap.to(node, {
					rotateX: ((e.clientY - r.top) / r.height - 0.5) * -8,
					rotateY: ((e.clientX - r.left) / r.width - 0.5) * 8,
					transformPerspective: 700,
					duration: 0.4,
					ease: 'power2.out'
				});
			};
			const onLeave = () => {
				gsap.to(node, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
			};

			node.addEventListener('pointermove', onMove);
			node.addEventListener('pointerleave', onLeave);
			cleanup = () => {
				node.removeEventListener('pointermove', onMove);
				node.removeEventListener('pointerleave', onLeave);
				gsap.killTweensOf(node);
			};
		});

		return () => {
			cancelled = true;
			cleanup?.();
		};
	};
}

/** Animated number. Replaces [data-count]; suffixes 50+ like the original. */
export function count(end: number): Attachment<HTMLElement> {
	return (node) => {
		const suffix = end >= 50 ? '+' : '';

		if (prefersReducedMotion()) {
			// No animation, but the final value still has to be written out.
			node.textContent = `${end}${suffix}`;
			return;
		}

		let cancelled = false;
		let trigger: { kill: () => void } | undefined;
		let stopWatchdog: (() => void) | undefined;

		loadScrollTrigger().then(({ gsap }) => {
			if (cancelled) return;
			const state = { v: 0 };
			const tween = gsap.to(state, {
				v: end,
				duration: 1.4,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: node,
					start: 'top 90%',
					once: true,
					onEnter: () => {
						stopWatchdog = withWatchdog(tween, 1.4);
					}
				},
				onUpdate: () => {
					node.textContent = `${Math.round(state.v)}${suffix}`;
				}
			});
			trigger = tween.scrollTrigger;
		});

		return () => {
			cancelled = true;
			stopWatchdog?.();
			trigger?.kill();
		};
	};
}

/** Entrance stagger. Replaces [data-hero-fade]; index sets the order.
 *  `ready` gates the start: the home page holds its hero until the
 *  preloader curtain has lifted, so the two do not animate at once.
 *  Sub-pages have no curtain and pass nothing, starting immediately. */
export function heroFade(index = 0, ready = true): Attachment<HTMLElement> {
	return (node) => {
		if (prefersReducedMotion()) return;

		let cancelled = false;
		let tween: { kill: () => void } | undefined;
		let stopWatchdog: (() => void) | undefined;

		/* Not ready yet: hold the element hidden rather than letting it
		   paint and then jump when the animation starts. The attachment
		   re-runs when `ready` flips, and this teardown restores it. */
		if (!ready) {
			const previous = node.style.visibility;
			node.style.visibility = 'hidden';
			return () => {
				node.style.visibility = previous;
			};
		}

		loadGsap().then((gsap) => {
			if (cancelled) return;
			const delay = 0.35 + index * 0.1;
			const t = gsap.from(node, {
				y: 26,
				autoAlpha: 0,
				duration: 0.8,
				ease: 'power3.out',
				delay
			});
			tween = t;
			stopWatchdog = withWatchdog(t, delay + 0.8);
		});

		return () => {
			cancelled = true;
			stopWatchdog?.();
			tween?.kill();
		};
	};
}

/** Horizontal pinned scroll for the "Road to Worlds" track.
 *  Desktop only (≥1001px) — below that the track scrolls normally. */
export function roadPin(): Attachment<HTMLElement> {
	return (node) => {
		if (prefersReducedMotion()) return;

		let cancelled = false;
		let revert: (() => void) | undefined;

		loadScrollTrigger().then(({ gsap }) => {
			if (cancelled) return;

			/* matchMedia owns the breakpoint: it builds the tween when the
			   query matches and runs the returned teardown when it stops,
			   so resizing past 1000px cleans up the pin by itself. */
			const mm = gsap.matchMedia();
			mm.add('(min-width: 1001px)', () => {
				const distance = () => node.scrollWidth - window.innerWidth;
				const tween = gsap.to(node, {
					x: () => -distance(),
					ease: 'none',
					scrollTrigger: {
						// The section pins; the track inside it is what moves.
						trigger: node.closest('.road') ?? node,
						start: 'top top',
						end: () => `+=${distance()}`,
						pin: true,
						scrub: 1,
						invalidateOnRefresh: true
					}
				});
				return () => tween.scrollTrigger?.kill();
			});

			/* revert() runs every matchMedia teardown and drops the pin
			   spacer ScrollTrigger injects into the DOM. Killing the tween
			   alone would leave that spacer behind on navigation. */
			revert = () => mm.revert();
		});

		return () => {
			cancelled = true;
			revert?.();
		};
	};
}

/** Hero title row rising into place. `ready` gates the start the same
 *  way heroFade does — see there. */
export function heroRow(index = 0, ready = true): Attachment<HTMLElement> {
	return (node) => {
		if (prefersReducedMotion()) return;

		let cancelled = false;
		let tween: { kill: () => void } | undefined;
		let stopWatchdog: (() => void) | undefined;

		/* The rows sit inside an overflow-hidden .row, so holding them
		   translated down keeps them out of sight without a visibility
		   flip — which would fight the yPercent tween on release. */
		if (!ready) {
			const previous = node.style.transform;
			node.style.transform = 'translateY(110%)';
			return () => {
				node.style.transform = previous;
			};
		}

		loadGsap().then((gsap) => {
			if (cancelled) return;
			const delay = index * 0.12;
			const t = gsap.from(node, {
				yPercent: 110,
				duration: 1,
				ease: 'power4.out',
				delay
			});
			tween = t;
			stopWatchdog = withWatchdog(t, delay + 1);
		});

		return () => {
			cancelled = true;
			stopWatchdog?.();
			tween?.kill();
		};
	};
}
