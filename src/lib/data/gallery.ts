/* ============================================================
   2026 competition gallery.

   Photos are folder-driven: drop files into
   img/gallery/2026/<competition>/<division>/ and they appear on
   /media with no code edit.

   ⚠️ THERE ARE TWO MANIFESTS, and which one wins depends on
   where the page is running. This is the whole design, so read
   it before changing either:

   1. BUILD-TIME — vite.config.ts walks static/img/gallery/2026/
      and hands the result here as MANIFEST. Correct on Iain's
      machine and in the smoke tests, where the photos are on
      disk. EMPTY in CI, because the ~951 photos are deliberately
      not in the repo.

   2. RUNTIME — api/gallery.php walks the same tree ON THE
      SERVER, where the FTP-uploaded photos actually live, and
      the page fetches it on mount.

   The build manifest is the initial value and the runtime one
   replaces it. That ordering matters: it means the prerendered
   HTML is never empty in dev, and production — where the baked
   list is empty and the server's is not — fills in a moment
   after load.

   Everything below works at zero photos and at several thousand.
   ============================================================ */

import { MANIFEST } from 'virtual:gallery-manifest';
import { withBase } from '$lib/config';

/* Hardcoded, and deliberately NOT derived from EVENT_DATE/EVENT_YEAR in
   config.ts — those say 2027, because they describe the next championship.
   This gallery is the January 2026 edition that has already happened, and it
   does not roll forward: next year's photos are a new folder and a new
   constant, not a re-labelling of these. */
export const GALLERY_YEAR = 2026;

export interface Division {
	/** Folder slug on disk, e.g. 'jv-megacrew'. */
	slug: string;
	/** Display label, e.g. 'JV MegaCrew'. Canonical casing. */
	label: string;
}

export interface Competition {
	/** Folder slug on disk, e.g. 'netherlands-hhdc'. */
	slug: string;
	/** Display label, e.g. 'Netherlands HHDC'. */
	label: string;
	divisions: Division[];
}

export interface GalleryPhoto {
	/** Root-relative path under static/, already base-prefixed. The FULL-SIZE
	 *  original — used by the lightbox, where the resolution is looked at. */
	src: string;
	/** Small WebP derivative for the grid tile, served by api/thumb.php.
	 *  See THUMB_ENDPOINT for why the grid must not use `src`. */
	thumb: string;
	/** Derived from the competition and division — see photoAlt(). */
	alt: string;
	/** Competition slug. */
	competition: string;
	/** Division slug. */
	division: string;
}

/* Hand-written, not derived from the folders, for two reasons. The tabs have
   to render with the right labels in the right order when the tree is empty —
   which is the state the site ships in today — and no generic un-slugging
   rule recovers "JV MegaCrew" or "MiniCrew" from a directory name.

   The division lists match REGISTRATION_FORMS in config.ts, which is how
   crews actually enter. Note events.ts runs Junior and Varsity as one HHDC
   heat ("Junior & Varsity"); that is a running order, not a division list,
   and the two are right to differ. Do not reconcile them.

   The slugs here are mirrored by GALLERY_TREE in vite.config.ts, which
   decides which folders are real. Change one and you must change the other —
   a division added only here shows an empty tab forever, and one added only
   there has its photos read and then dropped. */
export const COMPETITIONS: Competition[] = [
	{
		slug: 'hhi-open-division',
		label: 'HHI Open Division',
		divisions: [
			{ slug: 'junior', label: 'Junior' },
			{ slug: 'varsity', label: 'Varsity' },
			{ slug: 'adult', label: 'Adult' },
			{ slug: 'parents', label: 'Parents' },
			{ slug: 'special-crews', label: 'Special Crews' },
			{ slug: 'awards', label: 'Awards' }
		]
	},
	{
		slug: 'netherlands-hhdc',
		label: 'Netherlands HHDC',
		divisions: [
			{ slug: 'junior', label: 'Junior' },
			{ slug: 'varsity', label: 'Varsity' },
			{ slug: 'adult', label: 'Adult' },
			{ slug: 'jv-megacrew', label: 'JV MegaCrew' },
			{ slug: 'minicrew', label: 'MiniCrew' },
			{ slug: 'megacrew', label: 'MegaCrew' },
			{ slug: 'awards', label: 'Awards' }
		]
	}
];

/** The key the "All divisions" tab filters on. Not a real folder. */
export const ALL_DIVISIONS = 'all';

const byCompetition = new Map(COMPETITIONS.map((c) => [c.slug, c]));

function labelsFor(competition: string, division: string) {
	const comp = byCompetition.get(competition);
	const div = comp?.divisions.find((d) => d.slug === division);
	return { competition: comp?.label ?? competition, division: div?.label ?? division };
}

/* One derivation for every photo, because there is no per-photo alt text and
   inventing one would be a guess about a picture nobody here has seen. The
   competition and division are the two things the folder genuinely proves. */
function photoAlt(competition: string, division: string): string {
	const label = labelsFor(competition, division);
	return `${label.competition} ${label.division} — Netherlands Hip Hop Dance Championship ${GALLERY_YEAR}`;
}

/** Shape of one record from either manifest source. */
interface ManifestRecord {
	competition: string;
	division: string;
	src: string;
}

/* withBase() because the page binds src from this variable, and Kit only
   rewrites root-relative paths written literally in markup. Without it every
   photo 404s on the GitHub Pages sub-path build. */
function toPhotos(records: readonly ManifestRecord[]): GalleryPhoto[] {
	return records.map((record) => ({
		src: withBase(record.src),
		thumb: thumbUrl(record.src),
		alt: photoAlt(record.competition, record.division),
		competition: record.competition,
		division: record.division
	}));
}

/* ============================================================
   Thumbnails.

   The photos are ~1500x1000 at ~318KB, and a grid tile is about
   209px wide at a 1440px viewport — so the first screen of 24
   was 6.6MB, roughly 90% of which the browser throws away after
   decoding. Measured on the live site 21 Aug 2026.

   api/thumb.php serves a ~480px WebP instead (~30KB), generated
   on first request and cached on disk. The LIGHTBOX still gets
   `src`, the untouched original, because that is the one place
   the full resolution is actually looked at.

   ⚠️ The URL is built here rather than in the PHP so that
   withBase() applies to both halves — the endpoint path and the
   photo path inside the query string — which is what makes it
   resolve under the GitHub Pages sub-path build.
   ============================================================ */
export const THUMB_ENDPOINT = withBase('/api/thumb.php');

function thumbUrl(src: string): string {
	return `${THUMB_ENDPOINT}?src=${encodeURIComponent(withBase(src))}`;
}

/* ============================================================
   The BUILD-TIME manifest — a fallback, no longer the source of
   truth in production.

   It is still exactly right in two situations and wrong in one:

   ✅ `npm run dev` and `npm run build` on Iain's machine, where
      static/img/gallery/ holds the real photos. This is what
      makes the smoke tests meaningful and what makes dropping a
      photo into the folder work locally with no server.

   ❌ Production. The photos are deliberately not in the repo, so
      a GitHub Actions checkout walks an empty tree and bakes an
      EMPTY list — and the build succeeds, because an empty
      gallery is a legitimate state. That is precisely how /media
      shipped with zero photos on 21 Aug 2026 while all 951 sat
      on the server returning 200.

   So it stays as the initial value, and fetchGalleryPhotos()
   below replaces it at runtime with what is actually on the
   server. In production that swaps an empty list for 951 photos;
   in dev it replaces the list with an identical one.
   ============================================================ */
export const GALLERY_PHOTOS: GalleryPhoto[] = toPhotos(MANIFEST);

/* Where the runtime manifest lives. Root-relative through withBase() for the
   same reason the photo paths are — the GitHub Pages preview is served from a
   sub-path, and a bare '/api/gallery.php' would miss it. */
export const GALLERY_ENDPOINT = withBase('/api/gallery.php');

/* ============================================================
   The RUNTIME manifest.

   Asks api/gallery.php what is actually in the folders, which is
   the only party that can answer: the photos reach the server by
   FTP and the build never sees them.

   Returns null rather than throwing on ANY failure — a network
   error, a non-200, malformed JSON, or a response whose shape is
   not what we expect. The caller keeps whatever it already had
   (the build manifest) in that case, so a broken endpoint
   degrades to today's behaviour instead of emptying a gallery
   that was rendering fine. On GitHub Pages there is no PHP at
   all, so this 404s every time by design and the preview simply
   keeps its build-time list.
   ============================================================ */
export async function fetchGalleryPhotos(
	fetcher: typeof fetch = fetch
): Promise<GalleryPhoto[] | null> {
	try {
		const response = await fetcher(GALLERY_ENDPOINT, { headers: { accept: 'application/json' } });
		if (!response.ok) return null;

		const payload: unknown = await response.json();
		if (typeof payload !== 'object' || payload === null) return null;

		const { ok, photos } = payload as { ok?: unknown; photos?: unknown };
		if (ok !== true || !Array.isArray(photos)) return null;

		/* Validate every record rather than trusting the endpoint. This is the
		   one place where data from off-machine becomes an img src, and a
		   malformed entry would render a broken tile with no clue where it came
		   from. Anything that is not three non-empty strings is dropped. */
		const records = photos.filter(
			(record): record is ManifestRecord =>
				typeof record === 'object' &&
				record !== null &&
				typeof (record as ManifestRecord).competition === 'string' &&
				typeof (record as ManifestRecord).division === 'string' &&
				typeof (record as ManifestRecord).src === 'string' &&
				(record as ManifestRecord).src.startsWith('/img/gallery/')
		);

		return toPhotos(records);
	} catch {
		return null;
	}
}

/** Photos for one competition, optionally narrowed to a single division.
 *  Pass ALL_DIVISIONS to keep the whole competition.
 *
 *  `source` defaults to the build manifest so existing callers and the
 *  prerendered first paint are unchanged; the Gallery passes the runtime list
 *  once it has one. */
export function photosFor(
	competition: string,
	division: string,
	source: readonly GalleryPhoto[] = GALLERY_PHOTOS
): GalleryPhoto[] {
	return source.filter(
		(photo) =>
			photo.competition === competition &&
			(division === ALL_DIVISIONS || photo.division === division)
	);
}
