/* ============================================================
   2026 competition gallery.

   Photos are folder-driven: drop files into
   static/img/gallery/2026/<competition>/<division>/ and they
   appear on /media with no code edit. The walk happens at build
   time in vite.config.ts and arrives here as MANIFEST.

   As of 21 Aug 2026 that tree is empty — the January 2026
   photography has not been handed over yet — so the page ships
   the tab shell and an empty state rather than a claim it
   cannot back. Everything below is written to work at zero
   photos and at several thousand.
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
	/** Root-relative path under static/, already base-prefixed. */
	src: string;
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
			{ slug: 'special-crews', label: 'Special Crews' }
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
			{ slug: 'megacrew', label: 'MegaCrew' }
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

/* withBase() because the page binds src from this variable, and Kit only
   rewrites root-relative paths written literally in markup. Without it every
   photo 404s on the GitHub Pages sub-path build. */
export const GALLERY_PHOTOS: GalleryPhoto[] = MANIFEST.map((record) => ({
	src: withBase(record.src),
	alt: photoAlt(record.competition, record.division),
	competition: record.competition,
	division: record.division
}));

/** Photos for one competition, optionally narrowed to a single division.
 *  Pass ALL_DIVISIONS to keep the whole competition. */
export function photosFor(competition: string, division: string): GalleryPhoto[] {
	return GALLERY_PHOTOS.filter(
		(photo) =>
			photo.competition === competition &&
			(division === ALL_DIVISIONS || photo.division === division)
	);
}
