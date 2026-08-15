/* ============================================================
   Results — one panel per edition, six divisions each.

   2026 IS REAL. It was recovered on 15 Aug 2026 from the six
   official score sheets the legacy results.php linked to
   (HHI-NL-2026-<Division>-Division.pdf, dated 1 February 2026).
   Those PDFs are now in static/download/results-2026/ — they
   were on the dying host and this is the only other copy.
   Every placement below was checked against the rank number in
   its source PDF.

   2023–2025 ARE STILL PLACEHOLDER. Those editions were never on
   the legacy site in any form I could find, so their rows keep
   the "— fill from archive" text. Do not invent champions:
   filling them in is a data edit, exactly like 2026 was.

   The years are listed rather than derived. They are the
   editions with an archive to publish, which is not the same as
   "the last three years" — deriving them from EVENT_YEAR would
   silently invent a panel each time the event date moves.
   ============================================================ */

import { withBase } from '$lib/config';

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
	/** Official score sheets for that edition, if they exist. Omitted for
	 *  years whose archive has not been recovered. */
	sheets?: { label: string; href: string }[];
}

const DIVISIONS = ['Junior', 'Varsity', 'Adult', 'JV MegaCrew', 'MiniCrew', 'MegaCrew'];

/** Every division for a year, all podium places still unconfirmed. */
const placeholderRows = (): DivisionResult[] =>
	DIVISIONS.map((division) => ({
		division,
		gold: TBC_GOLD,
		silver: TBC,
		bronze: TBC
	}));

/* 2026, read off the official score sheets. Division order matches DIVISIONS
   above, which is competition order rather than the order the PDFs happen to
   sort in. Crew names are reproduced exactly as the score sheets spell them —
   including the casing, which is inconsistent between divisions ("D&D" in
   MegaCrew, "D&D CREW" in MiniCrew, "C-Fam Jr" vs "C-FAM"). Do not tidy it;
   these are the names crews entered under. */
const ROWS_2026: DivisionResult[] = [
	{ division: 'Junior', gold: 'C-Fam Jr', silver: 'D&D LIONS', bronze: 'MDS-Mini JR' },
	{ division: 'Varsity', gold: 'C-Fam Varsity', silver: 'D&D FEAR', bronze: 'D&D IGNITE' },
	{ division: 'Adult', gold: 'D&D VIII', silver: 'C-Fam Adult', bronze: 'C-Fam Adult 2.0' },
	{ division: 'JV MegaCrew', gold: 'ELITE', silver: 'Young C-Fam', bronze: 'D&D YOUNG' },
	{ division: 'MiniCrew', gold: 'D&D CREW', silver: 'D&D BADDEST', bronze: 'GYB' },
	{ division: 'MegaCrew', gold: 'D&D', silver: 'C-FAM', bronze: 'D-PACK' }
];

/* The score sheets behind the 2026 table. They carry far more than the podium —
   full rankings, per-judge performance and skill scores, and deductions with
   their reasons — so they are worth offering rather than summarising away.
   withBase() because the page binds href from this array. */
const SHEETS_2026 = [
	['Junior', 'Junior'],
	['Varsity', 'Varsity'],
	['Adult', 'Adult'],
	['JV MegaCrew', 'JV-MegaCrew'],
	['MiniCrew', 'MiniCrew'],
	['MegaCrew', 'MegaCrew']
].map(([label, file]) => ({
	label,
	href: withBase(`/download/results-2026/HHI-NL-2026-${file}-Division.pdf`)
}));

export const RESULTS: YearResults[] = [
	{ year: '2026', rows: ROWS_2026, sheets: SHEETS_2026 },
	{ year: '2025', rows: placeholderRows() },
	{ year: '2024', rows: placeholderRows() },
	{ year: '2023', rows: placeholderRows() }
];
