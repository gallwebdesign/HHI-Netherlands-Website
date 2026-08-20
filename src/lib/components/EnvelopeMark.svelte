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
	     elements paint over earlier ones, and every "is it open?" / "is the
	     letter inside?" question is answered by this sequence alone. Back to
	     front: open flap → back wall → letter → front panel. Reordering any
	     two of these breaks the illusion rather than merely moving a line. -->

	<!-- 1. The open flap, folded back BEHIND the envelope. This is what makes
	        it read as open rather than sealed: an inverted V rising above the
	        body's top edge, drawn first so the back wall covers where it
	        joins. A flap drawn in FRONT as a downward V is a closed
	        envelope — that was the previous version's mistake. -->
	<path d="M20 84 L120 16 L220 84" class="envelope__flap" />

	<!-- 2. Back wall. Opaque, so the flap's lower ends disappear behind it
	        and the fold reads as a crease rather than a line crossing the
	        body. -->
	<rect x="12" y="80" width="216" height="102" rx="8" class="envelope__back" />

	<!-- 3. The letter, part-way into the envelope. It sits ABOVE the back
	        wall and BELOW the front panel, which is exactly what "being
	        inserted" looks like: the top half clear of the mouth, the bottom
	        half already swallowed.

	        ⚠️ Two constraints pull in opposite directions here, and both were
	        measured rather than guessed:
	        - It must overlap the front panel's top edge (y=112) or a gap
	          opens between sheet and envelope — hence it ends at y=110.
	        - It must be NARROW enough to leave the flap's peak visible. At
	          132 wide it covered the flap's whole V (flap spans x=20–220,
	          y=16–84) and the envelope read as closed again. 108 wide leaves
	          both shoulders of the flap showing, which is what says "open". -->
	<g class="envelope__letter">
		<rect x="66" y="26" width="108" height="84" rx="5" class="envelope__paper" />

		<!-- Address block: one filled tile and three rules, matching the
		     reference's letterhead without pretending to be real text. -->
		<rect x="78" y="38" width="26" height="18" rx="3" class="envelope__tile" />
		<path d="M112 41h50M112 49h50M112 57h34" class="envelope__rule" />

		<!-- Body copy. The short last line is what makes a block of rules
		     read as a paragraph rather than a grid. -->
		<path d="M78 72h84M78 83h84M78 94h54" class="envelope__rule" />
	</g>

	<!-- 4. Front panel, painted last so it hides the letter's lower half.
	        Opaque --ink fill: with fill:none the letter shows straight
	        through and the drawing goes flat. Its top edge is the envelope
	        mouth, and the two diagonals running up to the corners are the
	        side creases of the front face. -->
	<path
		d="M12 112 L120 172 L228 112 V174 a8 8 0 0 1 -8 8 H20 a8 8 0 0 1 -8 -8 Z"
		class="envelope__front"
	/>
	<path d="M12 112 L120 172 L228 112" class="envelope__fold" />

	<!-- Outer body last of all, so its stroke sits cleanly over every fill
	     and gives the whole shape one unbroken outline. -->
	<rect x="12" y="80" width="216" height="102" rx="8" class="envelope__body" />
</svg>
