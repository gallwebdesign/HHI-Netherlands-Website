<script lang="ts">
	import { prefersReducedMotion } from '$lib/motion.svelte';
	import { menu } from '$lib/menu.svelte';

	/* Appear once the reader is a full viewport down. Tied to viewport height
	   rather than a fixed pixel count so it behaves the same on a phone as on
	   a 1440px desktop — a 600px threshold is most of the way down an S22 but
	   barely past the fold on a monitor. */
	let pastFold = $state(false);

	/* ...and stand down again once the footer is on screen. The footer wraps
	   its links to a second row at desktop widths, which puts PRIVACY in the
	   bottom-right corner — exactly where this button sits, covering it
	   completely. Measured at 1440px: the link's own centre point hit
	   .scroll-top__label rather than the link. That is not a cosmetic
	   overlap, and the privacy link is the route the policy itself tells
	   people to use for a GDPR request.
	   Nudging the button up by a fixed amount would only move the collision
	   to whatever width the footer wraps differently at, so it yields the
	   corner instead: by the time the footer is visible the reader has
	   reached the links they were scrolling for. */
	let footerVisible = $state(false);

	const shown = $derived(pastFold && !footerVisible);

	$effect(() => {
		const onScroll = () => {
			pastFold = window.scrollY > window.innerHeight;
		};

		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		/* Rotating a phone changes innerHeight, which changes the threshold. */
		window.addEventListener('resize', onScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});

	/* The footer lives in the layout alongside this component, so it is
	   present for every route and is not replaced on navigation — one
	   observer set up once covers the whole site. */
	$effect(() => {
		const footer = document.querySelector('footer');
		if (!footer) return;

		const io = new IntersectionObserver(
			([entry]) => {
				footerVisible = entry.isIntersecting;
			},
			/* A small negative margin means the button clears out just before
			   the footer's links are actually reachable, rather than at the
			   moment its top edge crosses the fold. */
			{ rootMargin: '0px 0px -40px 0px' }
		);
		io.observe(footer);
		return () => io.disconnect();
	});

	/* No GSAP here on purpose: this is a CSS transition on opacity and
	   transform, so the button cannot be left stranded mid-fade if the
	   ticker is starved — the failure mode withWatchdog() exists to catch
	   for the tween-driven attachments. Nothing to load, nothing to kill.

	   Reduced motion jumps instead of animating the scroll, matching
	   smoothAnchor(). The button's own fade is softened rather than
	   removed, by the blanket transition-duration rule in style.css. */
	const toTop = () => {
		window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
	};
</script>

<!-- Hidden while the mobile menu is open: the menu is a full-screen panel at
     z-index 55 and this sits above it, so it would otherwise float over a
     page you are no longer looking at. `inert` rather than a bare class so
     it also leaves the tab order and the accessibility tree. -->
<button
	class="scroll-top"
	class:is-shown={shown && !menu.open}
	inert={!shown || menu.open}
	onclick={toTop}
	aria-label="Back to top"
>
	<span class="scroll-top__arrow" aria-hidden="true"></span>
	<span class="scroll-top__label" aria-hidden="true">Top</span>
</button>
