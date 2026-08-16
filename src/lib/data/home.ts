/* ============================================================
   Home page — the repeating records that were hand-written as
   markup in index.html: six divisions, four "Road to Worlds"
   panels, three stats, the ticker strip and the media teaser.

   Text is plain UTF-8 (· – — ’ “ ” not &middot; &ndash; &mdash;
   &rsquo; &ldquo; &rdquo;).

   Nothing here hard-codes a year: EVENT_YEAR does that, so the
   ticker and the road panels stay correct when the date moves.
   ============================================================ */

import { EVENT_YEAR, withBase } from '$lib/config';

export interface Division {
	/** Age band, e.g. "Ages 7–12". */
	age: string;
	/** Division name. */
	name: string;
	/** Crew size line. */
	crew: string;
	/** One-line pitch, in the battle-poster voice. */
	desc: string;
}

export const DIVISIONS: Division[] = [
	{
		age: 'Ages 7–12',
		name: 'Junior',
		crew: '5–9 dancers',
		desc: 'The youngest crews on the biggest stage. Foundations first — swagger included.'
	},
	{
		age: 'Ages 13–17',
		name: 'Varsity',
		crew: '5–9 dancers',
		desc: 'Where crews find their identity and routines get dangerous.'
	},
	{
		age: 'Ages 18+',
		name: 'Adult',
		crew: '5–9 dancers',
		desc: 'The open class. Full power, full precision, no excuses.'
	},
	{
		age: 'Ages 17 & younger',
		name: 'JV MegaCrew',
		crew: '10–40 dancers',
		desc: 'Junior and Varsity on one floor. Two generations, one formation, twice the noise.'
	},
	{
		age: 'All ages',
		name: 'MiniCrew',
		crew: '3-4 dancers',
		desc: 'Three or Four dancers, zero hiding places. Pure chemistry and detail.'
	},
	{
		age: 'All ages',
		name: 'MegaCrew',
		crew: '10–40 dancers',
		desc: 'Full-scale productions. Formations that hit like a wall of sound.'
	}
];

export interface RoadPanel {
	/** Step heading. */
	title: string;
	/** The body paragraph. */
	body: string;
	/** Small "where this happens" line under the body. */
	where: string;
	/** Marks the last panel, which is styled differently. */
	final?: boolean;
}

/** Numbering derives from array position, as on the other ported pages. */
export const ROAD_PANELS: RoadPanel[] = [
	{
		title: 'Register your crew',
		body: 'Pick your division, lock your roster, and submit your crew online. Registration closes when the bracket is full — Dutch crews don’t wait, and neither should you.',
		where: 'Online · hhi-netherlands.com'
	},
	{
		title: 'Build the routine',
		body: 'One minute thirty seconds to four minutes judged on performance, skill, musicality, and style variety — the official HHI scoring system. Read the regulations, then break them open creatively.',
		where: 'HHI rulebook · Regulations'
	},
	{
		title: 'Battle at nationals',
		body: 'One day, one stage, every crew in the country that wants your title. The Netherlands Hip Hop Dance Championship decides who reps the flag.',
		where: `Netherlands HHDC · ${EVENT_YEAR}`
	},
	{
		title: 'Represent NL at the World Championship',
		body: 'National medalists earn their place at the World Hip Hop Dance Championship — 50+ countries, one world stage, orange in the building.',
		where: 'World Hip Hop Dance Championship',
		final: true
	}
];

export interface Stat {
	/** Target number; count() adds the "+" suffix at 50 and above. */
	value: number;
	/** Label under the number. */
	label: string;
}

export const STATS: Stat[] = [
	{ value: 50, label: 'Nations at Worlds' },
	{ value: 6, label: 'Crew divisions' },
	{ value: 1, label: 'Dutch title' }
];

/** Scrolling strip under the hero. Duplicated in the markup to loop. */
export const TICKER_ITEMS: string[] = [
	`Netherlands HHDC ${EVENT_YEAR}`,
	'Road to Worlds',
	'Uniting the world of hip hop through dance',
	'Registration open'
];

export interface TeaserPhoto {
	/** Root-relative path under static/, already base-prefixed. */
	src: string;
	/** Alt text — these are described shots, unlike the media grid. */
	alt: string;
	/** Caption overlaid on the image. Empty string renders no caption at all —
	 *  see the note on TEASER_PHOTOS below. */
	caption: string;
}

/* The first four of the eight files the media page uses — replaced with new
   photography on 15 Aug 2026, and withBase() for the same reason as there.
   The load guard on the page stays: a failed image hides its whole figure
   rather than leaving a gap in the row.

   ⚠️ The captions and alt text were specific to the old photos ("MegaCrew",
   "Podium", "Award ceremony"), and those claims do not survive a change of
   image — a caption reading "Podium" under a crowd shot is worse than no
   caption. They are generic until someone says what the new photos show;
   fill them in then, one entry per file. */
export const TEASER_PHOTOS: TeaserPhoto[] = [1, 2, 3, 4].map((n) => ({
	src: withBase(`/img/image${String(n).padStart(2, '0')}.jpg`),
	alt: 'Netherlands Hip Hop Dance Championship — event photo',
	caption: ''
}));
