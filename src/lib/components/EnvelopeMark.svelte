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
	<!-- ⚠️ PAINT ORDER IS THE WHOLE DRAWING. SVG has no z-index: later
	     elements paint over earlier ones. Back to front:
	       envelope back wall → letter → envelope front (with its V).
	     Reordering any two breaks the illusion rather than moving a line.

	     ⚠️ THERE IS NO FLAP STICKING UP. Two earlier versions invented one —
	     first a downward V in front (a sealed envelope), then an inverted V
	     behind (a flap folded back). Neither is the reference. In the
	     reference the envelope is simply a wide rounded rectangle whose top
	     edge crosses the letter, with the V descending from that top edge;
	     "open" is conveyed by the letter sitting inside it, nothing else.
	     Do not add a flap back. -->

	<!-- 1. Back wall. Only the part above the front's V is ever visible —
	        a thin band either side of the letter — but it is what closes the
	        silhouette behind the sheet. -->
	<rect x="16" y="74" width="208" height="104" rx="10" class="envelope__back" />

	<!-- 2. The letter. Large and centred, dominating the upper two-thirds
	        exactly as in the reference: its top sits well clear of the
	        envelope and its bottom disappears behind the front panel.
	        ⚠️ It must extend BELOW the front's top edge (y=96) or a gap opens
	        between sheet and envelope; it ends at y=150, comfortably inside. -->
	<g class="envelope__letter">
		<rect x="52" y="10" width="136" height="140" rx="8" class="envelope__paper" />

		<!-- Letterhead: one filled tile beside three short rules, matching the
		     reference's header block without pretending to be real text. -->
		<rect x="68" y="26" width="34" height="24" rx="4" class="envelope__tile" />
		<path d="M112 30h60M112 39h60M112 48h42" class="envelope__rule" />

		<!-- Body copy. The short last line is what makes a block of rules read
		     as a paragraph rather than a grid. -->
		<path d="M68 68h104M68 80h104M68 92h104M68 104h68" class="envelope__rule" />
	</g>

	<!-- 3. Envelope front, painted last so it hides the letter's lower half.
	        Opaque --ink fill: with fill:none the letter shows straight through
	        and the drawing goes flat. The top edge is the envelope mouth and
	        the V descends from its two top corners. -->
	<path
		d="M16 96 L120 172 L224 96 V168 a10 10 0 0 1 -10 10 H26 a10 10 0 0 1 -10 -10 Z"
		class="envelope__front"
	/>

	<!-- The V itself, and the two short creases running from the mouth's
	     corners down to the bottom corners — both visible in the reference. -->
	<path d="M16 96 L120 172 L224 96" class="envelope__fold" />

	<!-- Outer body last of all, so its stroke sits cleanly over every fill and
	     gives the whole envelope one unbroken rounded outline. -->
	<rect x="16" y="96" width="208" height="82" rx="10" class="envelope__body" />
</svg>
