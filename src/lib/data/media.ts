/* ============================================================
   Media — eight gallery photos and three YouTube embeds that
   were hand-written as markup in media.html.

   The photos are still served from the legacy production host;
   there are no local image assets in this repo yet. Because the
   host may drop one, every photo is rendered behind a load guard
   (see the page) rather than the old onerror="this.remove()",
   which stripped the <img> but left an empty <figure> hole in
   the grid.
   ============================================================ */

export interface Photo {
	/** Absolute URL on the legacy host. */
	src: string;
	/** Alt text. Generic for now — these are unlabelled archive shots. */
	alt: string;
}

const PHOTO_IDS = ['v0', 'v1', 'v2', 'v120', 'v130', 'v160', 'v190', 'v200'];

export const PHOTOS: Photo[] = PHOTO_IDS.map((id) => ({
	src: `https://hhi-netherlands.com/img/slideshow-${id}.jpg`,
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
