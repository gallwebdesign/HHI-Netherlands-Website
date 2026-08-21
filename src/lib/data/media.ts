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

/* ⚠️ /media no longer renders PHOTOS. The 2026 gallery in data/gallery.ts
   replaced the flat eight-photo grid on 21 Aug 2026, so TEASER_PHOTOS in
   home.ts — which uses image01…image04 — is now the only live consumer of
   these files.

   PHOTOS is kept rather than deleted because image05…image08 stay on disk and
   nothing else names them: drop this and those four become files no reader
   can account for, on a site where static/img/ is the only copy of the
   photography that exists. Delete it only together with the files, and only
   deliberately.

   Eight photos, image01…image08, replacing the eight legacy slideshow-vN
   banners on 15 Aug 2026. Eight because the grid is four across: two full
   rows on desktop, four rows of two on mobile, no ragged final row. Change
   the count in fours or the last row goes short.

   Source frames are 3:2 landscape, exported to 4:3 at 1200x900 to match
   .media__cell — see the note above that rule in style.css. JPEG, 1.79 MB for
   the eight.

   The filenames are built in exactly two places, here and home.ts. Change both
   together or the build fails on a 404, which is the intended behaviour — a
   missing photo should never ship silently. */
const PHOTO_COUNT = 8;

/* withBase() because the page binds src from this variable — Kit only
   rewrites root-relative paths written literally in markup. Without it
   every photo 404s on the GitHub Pages sub-path. */
export const PHOTOS: Photo[] = Array.from({ length: PHOTO_COUNT }, (_, i) => ({
	src: withBase(`/img/image${String(i + 1).padStart(2, '0')}.jpg`),
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
