/* ============================================================
   Results — the three year panels × five divisions that were
   fifteen hand-written table rows in results.html.

   PLACEHOLDER CONTENT, deliberately. Confirmed 11 Aug 2026: the
   real past results are still being gathered, so the structure
   is ported but the rows keep their "— fill from archive" text.
   Do not invent champions. Filling this in is a data edit: drop
   the real crew names into the podium fields below.

   The years are listed rather than derived. They are the
   editions with an archive to publish, which is not the same as
   "the last three years" — deriving them from EVENT_YEAR would
   silently invent a panel each time the event date moves.
   ============================================================ */

/** Stand-in used wherever a crew name is not yet known. */
export const TBC = '—';

/** Longer stand-in for the gold column, which carries the note. */
export const TBC_GOLD = '— fill from archive';

export interface DivisionResult {
	/** Division name, e.g. "Junior". */
	division: string;
	/** Winning crew, or TBC_GOLD while the archive is unconfirmed. */
	gold: string;
	/** Runner-up, or TBC. */
	silver: string;
	/** Third place, or TBC. */
	bronze: string;
}

export interface YearResults {
	/** Championship year, used as the tab label and panel id. */
	year: string;
	/** One row per division, in competition order. */
	rows: DivisionResult[];
}

const DIVISIONS = ['Junior', 'Varsity', 'Adult', 'MiniCrew', 'MegaCrew'];

/** Every division for a year, all podium places still unconfirmed. */
const placeholderRows = (): DivisionResult[] =>
	DIVISIONS.map((division) => ({
		division,
		gold: TBC_GOLD,
		silver: TBC,
		bronze: TBC
	}));

export const RESULTS: YearResults[] = [
	{ year: '2025', rows: placeholderRows() },
	{ year: '2024', rows: placeholderRows() },
	{ year: '2023', rows: placeholderRows() }
];
