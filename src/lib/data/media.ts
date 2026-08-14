/* ============================================================
   Media — eight gallery photos and three YouTube embeds that
   were hand-written as markup in media.html.

   The photos were rescued off the legacy production host on
   14 Aug 2026 and now live in static/img/. They are the only
   real photography the site has and there is no other copy —
   the host they came from is being switched off.

   The load guard on the page (a failed image hides its whole
   <figure>, rather than the old onerror="this.remove()" which
   left an empty hole in the grid) is kept even though the files
   are local now: it costs nothing and still covers a typo.
   ============================================================ */

import { withBase } from '$lib/config';

export interface Photo {
	/** Root-relative path under static/, already base-prefixed. */
	src: string;
	/** Alt text. Generic for now — these are unlabelled archive shots. */
	alt: string;
}

const PHOTO_IDS = ['v0', 'v1', 'v2', 'v120', 'v130', 'v160', 'v190', 'v200'];

/* withBase() because the page binds src from this variable — Kit only
   rewrites root-relative paths written literally in markup. Without it
   every photo 404s on the GitHub Pages sub-path. */
export const PHOTOS: Photo[] = PHOTO_IDS.map((id) => ({
	src: withBase(`/img/slideshow-${id}.jpg`),
	alt: 'Netherlands Hip Hop Dance Championship — event photo'
}));

export interface Video {
	/** YouTube video id. */
	id: string;
	/** iframe title, for screen readers. */
	title: string;
}

export const VIDEOS: Video[] = [
	{ id: 'pbl7ZIHmokc', title: 'HHI Netherlands video' },
	{ id: 'EhhhERWaxLE', title: 'HHI Netherlands video' },
	{ id: 'c60lK5KyctM', title: 'HHI Netherlands video' }
];
