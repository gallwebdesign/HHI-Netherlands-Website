<script lang="ts">
	import type { Snippet } from 'svelte';

	/* The 11-line .page-hero block that was copy-pasted into all eight
	   sub-pages. Content is trusted, hand-authored copy from our own
	   pages — HTML entities have to survive, so the text slots render
	   with {@html}. Never feed this user input. */
	interface Props {
		/** Small eyebrow above the title, e.g. "Events &middot; 2027". */
		tag: string;
		/** First title row (plain). */
		titleTop: string;
		/** Second title row, wrapped in the chosen treatment. */
		titleBottom: string;
		/** Treatment applied to the second row. */
		treatment?: 'accent' | 'hollow';
		/** Intro paragraph. */
		lede: string;
		/** Optional CTA row rendered under the lede. */
		actions?: Snippet;
	}

	let { tag, titleTop, titleBottom, treatment = 'accent', lede, actions }: Props = $props();
</script>

<section class="page-hero">
	<div class="page-hero__inner">
		<p class="tag" data-hero-fade>{@html tag}</p>
		<h1>
			<span class="row"><span>{@html titleTop}</span></span>
			<span class="row"><span class={treatment}>{@html titleBottom}</span></span>
		</h1>
		<p class="page-hero__lede" data-hero-fade>{@html lede}</p>
		{#if actions}
			<div class="page-hero__actions" data-hero-fade>{@render actions()}</div>
		{/if}
	</div>
</section>
