<script lang="ts">
	/* Decorative envelope for /contact, filling the space the Socials and
	   E-mail facts left when they were removed on 20 Aug 2026.

	   ⚠️ Decorative, and marked as such: aria-hidden with no title or role, so
	   screen readers skip it entirely. It says nothing the page does not
	   already say in text, and announcing "envelope" before the form would be
	   noise rather than information.

	   ⚠️ THE GEOMETRY IS TRACED FROM A SUPPLIED SOURCE FILE, NOT DRAWN BY EYE.
	   Three earlier versions (0edec31, db35dce, b452d9c) were each drawn from a
	   description of a reference image and each rejected. Iain supplied the
	   actual `Envelope.svg` on 21 Aug 2026 and every coordinate below is that
	   file's, unchanged, in its own 280.69 × 235.35 viewBox. If this needs to
	   change shape again, ask for an updated source file — do not nudge the
	   numbers. What IS this file's own work: the token colours, the
	   currentColor plumbing, and the draw-in animation.

	   Drawn inline rather than shipped as an asset in static/ because the
	   strokes read the theme tokens through currentColor, so the illustration
	   follows --oranje automatically if the palette ever moves; a flat .svg
	   file would hard-code #ff4d00 in a second place. */

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

<!-- viewBox is the source file's own coordinate space, kept verbatim so the
     traced coordinates need no arithmetic. The element is sized entirely in
     CSS so the illustration scales with its column. -->
<svg
	class="envelope"
	class:envelope--animate={animate}
	class:envelope--drawn={drawn}
	viewBox="0 0 280.69 235.35"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
	focusable="false"
	{@attach startWhenSeen}
>
	<!-- ⚠️ PAINT ORDER IS THE WHOLE DRAWING. SVG has no z-index: later
	     elements paint over earlier ones. Back to front:
	       letter (sheet + its contents) → envelope front panel → its folds.
	     The front panel carries an opaque --ink fill; that is what buries the
	     letter's lower half inside the envelope. With fill:none the sheet
	     shows straight through and the drawing goes flat.

	     ⚠️ THE V POINTS UP, FROM THE BOTTOM CORNERS. Two earlier versions put
	     a V descending from the top edge, which reads as a sealed envelope.
	     Here the front panel's fold rises from the two bottom corners to an
	     apex at (140.35, 146.86), and the mouth is two SEPARATE diagonals
	     running down-inward from the top corners to either side of the letter.
	     That pair is what makes it read as open. -->

	<!-- 1. The envelope's filled body, painted FIRST and behind everything.
	        It carries no stroke — it exists only to give the drawing an opaque
	        ground so the fold and mouth lines below read against a solid
	        shape rather than the page. Matching the source's paint order, the
	        letter goes OVER this, which is what lets the sheet's side edges
	        and its last rule stay visible across the envelope's mouth. -->
	<path
		d="M27.52 81.72 L2.5 97.35 V232.85 H278.19 V96.31 L254.74 82.24 Z"
		class="envelope__panel"
	/>

	<!-- 2. The envelope outline, its front fold rising from the bottom corners
	        to the apex at (140.35, 146.86), and the two mouth edges running
	        down-inward from the top corners. That pair is what reads as open. -->
	<polyline
		points="27.52 81.72 2.5 97.35 2.5 232.85 278.19 232.85 278.19 96.31 254.74 82.24"
		class="envelope__body"
	/>
	<polyline points="9.8 226.08 140.35 146.86 271.94 226.08" class="envelope__fold" />
	<path d="M9.8 98.91 L120.8 155.07 M271.94 98.91 L160.41 155.07" class="envelope__mouth" />

	<!-- 3. The letter, painted LAST as in the source, so it stands in front of
	        the envelope's mouth. Its side/top edges are a polyline, open at the
	        bottom: the sheet has no bottom edge because it continues down
	        inside the envelope. -->
	<g class="envelope__letter">
		<polyline points="31.68 104.13 31.68 2.5 249.53 2.5 249.53 104.13" class="envelope__paper" />

		<!-- Letterhead: one filled tile beside three short rules. -->
		<rect x="44.2" y="14.49" width="55.24" height="35.44" class="envelope__tile" />
		<rect x="109.31" y="13.76" width="118.38" height="8.12" class="envelope__rule" />
		<rect x="109.31" y="28.15" width="118.38" height="8.12" class="envelope__rule" />
		<rect x="109.31" y="41.81" width="100.39" height="8.12" class="envelope__rule" />

		<!-- Body copy. The short last line is what makes a block of rules read
		     as a paragraph rather than a grid. -->
		<rect x="43.15" y="58.39" width="184.54" height="8.12" class="envelope__rule" />
		<rect x="43.15" y="73.71" width="184.54" height="8.12" class="envelope__rule" />
		<rect x="43.15" y="87.5" width="184.54" height="8.12" class="envelope__rule" />
		<rect x="43.15" y="102.85" width="116.62" height="8.12" class="envelope__rule" />
	</g>
</svg>
