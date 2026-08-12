/* ============================================================
   Events — the four event facts and the indicative day schedule
   from events.html.

   The "When" and "Where" facts are no longer TBA: the date and
   venue were confirmed on 11 Aug 2026. Both derive from config.ts
   rather than being typed here, so nothing can drift out of sync
   with the countdown.

   Text is plain UTF-8 (· – — ’ not &middot; &ndash; &mdash;).
   ============================================================ */

import { EVENT_DATE_RANGE, EVENT_VENUE } from '$lib/config';

export interface Fact {
	/** The <dt>, e.g. "When". */
	term: string;
	/** The <dd> headline. */
	value: string;
	/** The <small> under it. */
	note: string;
}

export const FACTS: Fact[] = [
	{
		term: 'What',
		value: 'Netherlands Hip Hop Dance Championship',
		note: 'The official Dutch qualifier for HHI Worlds'
	},
	{
		term: 'When',
		value: EVENT_DATE_RANGE,
		note: 'Two days of competition, finals on day two'
	},
	{
		term: 'Where',
		value: EVENT_VENUE,
		note: 'Directly opposite Maastricht Randwyck station'
	},
	{
		term: 'Who',
		value: 'Crews · Judges · You',
		note: 'Spectator tickets via the official ticket shop'
	}
];

export interface ScheduleRow {
	/** Start time, 24h. */
	time: string;
	/** What happens. */
	what: string;
	/** Right-hand qualifier. */
	note: string;
}

/** Indicative running order. Final times — and how the divisions
 *  split across the two days — follow with the official announcement. */
export const SCHEDULE: ScheduleRow[] = [
	{ time: '10:00', what: 'Doors open · crew check-in', note: 'All divisions' },
	{ time: '11:00', what: 'Junior & MiniCrew', note: 'Preliminaries' },
	{ time: '13:00', what: 'Varsity & Adult', note: 'Preliminaries' },
	{ time: '15:30', what: 'MegaCrew', note: 'Showcase' },
	{ time: '17:00', what: 'Finals · all divisions', note: 'Main stage' },
	{ time: '19:30', what: 'Awards ceremony', note: 'Who takes the Worlds ticket?' }
];
