/* ============================================================
   Events — the four event facts and the indicative day schedule
   from events.html.

   The "When" and "Where" facts are no longer TBA: the date and
   venue were confirmed on 11 Aug 2026, and which competition runs
   on which day on 15 Aug 2026. All of it derives from config.ts
   rather than being typed here, so nothing can drift out of sync
   with the countdown.

   Text is plain UTF-8 (· – — ’ not &middot; &ndash; &mdash;).
   ============================================================ */

import { EVENT_DATE_RANGE, EVENT_DAY_ONE, EVENT_DAY_TWO, EVENT_VENUE } from '$lib/config';

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
		note: `Two days of competition — ${EVENT_DAY_ONE}: HHI Open Division · ${EVENT_DAY_TWO}: Netherlands HHDC`
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
	/** What happens — the category. */
	what: string;
}

export interface ScheduleDay {
	/** Day label, e.g. "30 January". Derived from config, never typed. */
	date: string;
	/** Which competition runs that day. */
	competition: string;
	/** That day's running order. */
	rows: ScheduleRow[];
}

/** The running order, split by day. Which competition runs on which day is
 *  confirmed: 30 January is the HHI Open Division, 31 January the Netherlands
 *  HHDC. The categories below are each competition's own divisions, taken from
 *  REGISTRATION_FORMS in config.ts rather than retyped.
 *
 *  The times are still indicative — both days reuse the same 10:00–19:30
 *  skeleton, which is what the page's footnote says. Replace them per day when
 *  the official programme lands; the shape here already allows the two days to
 *  diverge. */
export const SCHEDULE: ScheduleDay[] = [
	{
		date: EVENT_DAY_ONE,
		competition: 'HHI Open Division',
		rows: [
			{ time: '10:00', what: 'Doors open · crew check-in' },
			{ time: '11:00', what: 'Junior' },
			{ time: '13:00', what: 'Varsity & Adult' },
			{ time: '15:30', what: 'Parents & Special Crews' },
			{ time: '17:00', what: 'Finals · all Open categories' },
			{ time: '19:30', what: 'Awards ceremony' }
		]
	},
	{
		date: EVENT_DAY_TWO,
		competition: 'Netherlands HHDC',
		rows: [
			{ time: '10:00', what: 'Doors open · crew check-in' },
			{ time: '11:00', what: 'Junior & MiniCrew' },
			{ time: '13:00', what: 'Varsity & Adult' },
			{ time: '15:30', what: 'JV MegaCrew & MegaCrew' },
			{ time: '17:00', what: 'Finals · all divisions' },
			{ time: '19:30', what: 'Awards ceremony' }
		]
	}
];
