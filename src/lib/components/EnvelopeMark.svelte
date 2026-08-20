<script lang="ts">
	/* Decorative envelope for /contact, filling the space the Socials and
	   E-mail facts left when they were removed on 20 Aug 2026.

	   ⚠️ Decorative, and marked as such: aria-hidden with no title or role, so
	   screen readers skip it entirely. It says nothing the page does not
	   already say in text, and announcing "envelope" before the form would be
	   noise rather than information.

	   Drawn rather than shipped as an asset because it is nine paths of flat
	   geometry — an SVG file in static/ would be a network request and a
	   second place to keep the colours in sync. The strokes read the theme
	   tokens through currentColor and CSS custom properties, so it follows
	   --oranje automatically if the palette ever moves. */

	import type { Attachment } from 'svelte/attachments';

	interface Props {
		/** Draw-in animation. Set false to render it already-complete. */
		animate?: boolean;
	}

	let { animate = true }: Props = $props();

	/* The draw-in must not start until the drawing is actually on screen.
	   ⚠️ A CSS animation starts at load, and the wrapper around this component
	   is held at visibility:hidden by reveal() until its ScrollTrigger fires —
	   so an ungated animation finishes while nobody can see it and the
	   envelope simply fades in already-complete. That is not a hypothetical:
	   it was measured here at dashoffset 0 before the section was ever
	   scrolled to. The class below is what starts it, at the moment the
	   element enters the viewport. */
	let drawn = $state(false);

	const startWhenSeen: Attachment<SVGElement> = (node) => {
		/* No IntersectionObserver (or reduced motion) means no gating: show it
		   complete rather than risk an illustration that never draws. */
		if (typeof IntersectionObserver === 'undefined') {
			drawn = true;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					drawn = true;
					observer.disconnect();
				}
			},
			/* Matches reveal()'s own "top 88%" trigger closely enough that the
			   two do not visibly disagree about when this element arrives. */
			{ rootMargin: '0px 0px -12% 0px' }
		);
		observer.observe(node);

		return () => observer.disconnect();
	};
</script>

<!-- viewBox is the drawing's own coordinate space; the element is sized
     entirely in CSS so the illustration scales with its column. -->
<svg
	class="envelope"
	class:envelope--animate={animate}
	class:envelope--drawn={drawn}
	viewBox="0 0 240 190"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
	focusable="false"
	{@attach startWhenSeen}
>
	<!-- The letter, rising out of the envelope mouth.
	     ⚠️ Its bottom edge (y=86) must stay ABOVE the envelope's top edge
	     (y=78) plus the fold's fall at the letter's own left edge. The front
	     panel occludes along the diagonal (12,78)→(120,140), so at x=52 that
	     boundary is already at y≈101 — a letter reaching lower than this
	     shows its bottom corners *below* the envelope and the illusion dies.
	     Verified visually; do not lengthen this rect without re-checking. -->
	<g class="envelope__letter">
		<rect x="52" y="4" width="136" height="82" rx="5" class="envelope__paper" />

		<!-- Address block: one filled tile and three rules, matching the
		     reference's letterhead without pretending to be real text. -->
		<rect x="66" y="17" width="32" height="21" rx="3" class="envelope__tile" />
		<path d="M108 21h66M108 30h66M108 39h46" class="envelope__rule" />

		<!-- Body copy. The short last line is what makes a block of rules
		     read as a paragraph rather than a grid. -->
		<path d="M66 55h108M66 66h108M66 77h72" class="envelope__rule" />
	</g>

	<!-- Envelope front, drawn AFTER the letter so it occludes everything below
	     the fold — that overlap is the whole illusion of the sheet sitting
	     *inside* the envelope. It needs an opaque fill for that, so it carries
	     the page ground rather than `none`; a transparent front lets the
	     letter's bottom edge show through and the drawing goes flat. -->
	<path
		d="M12 78 L120 140 L228 78 V174 a8 8 0 0 1 -8 8 H20 a8 8 0 0 1 -8 -8 Z"
		class="envelope__front"
	/>

	<!-- The two front flaps, drawn as one path each so the V where they meet
	     stays a single crisp line at any size. -->
	<path d="M12 78 L120 140 L228 78" class="envelope__fold" />
	<path d="M12 174 L96 116 M228 174 L144 116" class="envelope__fold envelope__fold--sides" />

	<!-- Outer body last, so its stroke sits cleanly on top of the folds. -->
	<rect x="12" y="78" width="216" height="104" rx="8" class="envelope__body" />
</svg>
