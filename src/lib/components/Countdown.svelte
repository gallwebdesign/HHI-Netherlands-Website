<script lang="ts">
	import { onMount } from 'svelte';
	import { EVENT_DATE } from '$lib/config';
	import { reveal } from '$lib/attachments.svelte';

	/* The countdown board, shared by the events page and (in Phase 6)
	   the home page. The legacy version set an interval and never
	   cleared it — harmless on a static site, a leak once a client
	   router keeps the document alive across navigations. */

	const target = new Date(EVENT_DATE).getTime();
	const pad = (n: number) => String(n).padStart(2, '0');

	function remaining(now: number) {
		const diff = Math.max(0, target - now);
		return {
			d: pad(Math.floor(diff / 86400000)),
			h: pad(Math.floor(diff / 3600000) % 24),
			m: pad(Math.floor(diff / 60000) % 60),
			s: pad(Math.floor(diff / 1000) % 60)
		};
	}

	/* Prerender renders zeroes rather than a server-time snapshot: a
	   baked-in value would ship stale in the HTML and visibly jump on
	   hydration. The real count starts on mount. */
	let time = $state({ d: '00', h: '00', m: '00', s: '00' });

	onMount(() => {
		const tick = () => (time = remaining(Date.now()));
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	});
</script>

<!-- Inline offset carried over from the legacy markup; style.css is
     frozen until Phase 7, so the rule has nowhere else to live yet. -->
<div
	class="board"
	{@attach reveal()}
	aria-label="Countdown to the championship"
	style="margin-bottom: 34px"
>
	<div class="board__cell">
		<div class="board__num">{time.d}</div>
		<div class="board__lbl">Days</div>
	</div>
	<div class="board__cell">
		<div class="board__num">{time.h}</div>
		<div class="board__lbl">Hrs</div>
	</div>
	<div class="board__cell">
		<div class="board__num">{time.m}</div>
		<div class="board__lbl">Min</div>
	</div>
	<div class="board__cell">
		<div class="board__num">{time.s}</div>
		<div class="board__lbl">Sec</div>
	</div>
</div>
