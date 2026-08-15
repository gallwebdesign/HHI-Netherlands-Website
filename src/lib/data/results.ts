/* ============================================================
   Results — one panel per edition, six divisions each.

   ALL FOUR EDITIONS ARE REAL, filled on 15 Aug 2026. Nothing
   here is placeholder any more.

   2026 came from the six official score sheets the legacy
   results.php linked to (dated 1 February 2026), recovered off
   the dying host. Every placement was checked against the rank
   number in its source PDF.

   2025, 2024 and 2023 came from the division tabulation
   workbooks on Iain's drive — the source those PDFs are
   generated from. That detour was necessary for 2025: its PDFs
   embed subset fonts with no ToUnicode map, so their text is
   not machine-readable at all. The workbooks are, and are
   closer to the original record in any case, so the two earlier
   years were read the same way.

   Every year's PDFs are in static/download/results-<year>/ and
   linked from the page. For 2023–2025 this repo may be the only
   copy outside Iain's own drive.

   TWO RULES FOR ADDING A YEAR:
   1. Read the Rank column. Do NOT sort by score — deductions
      mean the two disagree, and they have in three of the four
      years here.
   2. Strip the trailing asterisk. The workbooks use it to flag
      a defending champion; it is not part of a crew's name.

   The years are listed rather than derived. They are the
   editions with an archive to publish, which is not the same as
   "the last three years" — deriving them from EVENT_YEAR would
   silently invent a panel each time the event date moves.
   ============================================================ */

import { withBase } from '$lib/config';

/* The TBC / TBC_GOLD stand-ins and placeholderRows() were removed on 15 Aug
   2026 once the last edition was filled in. Nothing renders "— fill from
   archive" any more. If a future year is added before its results exist, add
   the panel only when the data does — an empty tab is worse than no tab. */

export interface DivisionResult {
	/** Division name, e.g. "Junior". */
	division: string;
	/** Winning crew. */
	gold: string;
	/** Runner-up. */
	silver: string;
	/** Third place. */
	bronze: string;
}

export interface YearResults {
	/** Championship year, used as the tab label and panel id. */
	year: string;
	/** One row per division, in competition order. */
	rows: DivisionResult[];
	/** Official score sheets for that edition. Optional so a future year can
	 *  be published before its PDFs are to hand; all four current editions
	 *  carry theirs. */
	sheets?: { label: string; href: string }[];
}

/** Competition order. Every year's rows follow it, so the tables line up
 *  when a reader switches tabs. All four editions ran the same six. */
export const DIVISIONS = [
	'Junior',
	'Varsity',
	'Adult',
	'JV MegaCrew',
	'MiniCrew',
	'MegaCrew'
] as const;

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

/* The score sheets behind a year's table. They carry far more than the podium —
   full rankings, per-judge performance and skill scores, and deductions with
   their reasons — so they are worth offering rather than summarising away.
   Both editions use the same six files and the same naming, so the list is
   built rather than written out twice. withBase() because the page binds href
   from this array. */
const SHEET_FILES = [
	['Junior', 'Junior'],
	['Varsity', 'Varsity'],
	['Adult', 'Adult'],
	['JV MegaCrew', 'JV-MegaCrew'],
	['MiniCrew', 'MiniCrew'],
	['MegaCrew', 'MegaCrew']
] as const;

const sheetsFor = (year: string) =>
	SHEET_FILES.map(([label, file]) => ({
		label,
		href: withBase(`/download/results-${year}/HHI-NL-${year}-${file}-Division.pdf`)
	}));

const SHEETS_2026 = sheetsFor('2026');
const SHEETS_2025 = sheetsFor('2025');

/* 2024's and 2023's PDFs were named "01_HHI NL <year> Junior Division
   Tabulation.pdf" on Iain's drive. They were renamed to the convention the
   other years use when copied in, so one builder covers all four editions. */
const SHEETS_2024 = sheetsFor('2024');
const SHEETS_2023 = sheetsFor('2023');

/* 2025, read from the division tabulation workbooks Iain supplied on 15 Aug
   2026 (HHI Tabulation/Excel/HHI NL/*.xlsm, "Final Scores" sheet) — the source
   the score-sheet PDFs were generated from. The 2025 PDFs themselves embed
   subset fonts with no ToUnicode map, so their text is not machine-readable;
   the workbooks are, which makes them the better source anyway.

   Taken from the Rank column, not by sorting on score. In MegaCrew, ranks 8
   and 9 hold higher combined scores than rank 7 — deductions of 0.15 and 0.5
   put them below it — so score order and finishing order are not the same. */
const ROWS_2025: DivisionResult[] = [
	{ division: 'Junior', gold: 'OXYKIDZ', silver: 'D-Lions', bronze: 'Trouble' },
	{ division: 'Varsity', gold: 'C-Fam Varsity', silver: 'D&D-Fear', bronze: 'Wanted' },
	{ division: 'Adult', gold: 'D&D-VIII', silver: 'C-Fam Adult', bronze: 'D-Flame' },
	{ division: 'JV MegaCrew', gold: 'Elite', silver: 'Young C-Fam', bronze: 'D&D-Young' },
	{ division: 'MiniCrew', gold: 'D&D-CREW', silver: 'C-Fam Mini', bronze: 'Triple Connected' },
	{ division: 'MegaCrew', gold: 'D&D', silver: 'C-Fam', bronze: 'LEZ FAMILY' }
];

/* 2024, from the same tabulation workbooks as 2025. Read from the Rank column
   for the same reason: in Junior, rank 3 (Trouble) scored higher than rank 2 —
   a 0.3 deduction for a fall and use of props put it third.

   The workbooks mark some crews with a trailing asterisk to flag a defending
   champion (C-Fam Adult *, The Pack *, C-Fam Mini *, C-Fam *). That is
   tabulation notation, not part of the crew's name, and Iain confirmed on
   15 Aug 2026 that it does not belong on the page — so it is stripped here
   rather than reproduced. */
const ROWS_2024: DivisionResult[] = [
	{ division: 'Junior', gold: '225 crew', silver: 'D-Lions', bronze: 'Trouble' },
	{ division: 'Varsity', gold: 'C-Fam Varsity', silver: 'D-Squad', bronze: 'Wanted' },
	{ division: 'Adult', gold: 'C-Fam Adult', silver: 'D-Flame', bronze: 'NEW ENERGY' },
	{ division: 'JV MegaCrew', gold: 'Young C-Fam', silver: 'O2', bronze: 'The Pack' },
	{
		division: 'MiniCrew',
		gold: 'C-Fam Mini',
		silver: 'A-SHAQUEENIES',
		bronze: 'D-Three (DCBD - Brunssum)'
	},
	{ division: 'MegaCrew', gold: 'C-Fam', silver: 'D-Pack', bronze: 'Paradox' }
];

/* 2023, from the same tabulation workbooks. Asterisks stripped as elsewhere.

   Two spellings here are deliberate and must not be "corrected":
   - "D & D" is spaced in 2023 only; every other year writes it "D&D".
   - MiniCrew's gold and silver are "C-Fam Mini" and "Mini C-Fam" — two
     different crews, not a transcription slip. */
const ROWS_2023: DivisionResult[] = [
	{ division: 'Junior', gold: 'Wanted', silver: 'D-Reaction Crew', bronze: 'D&D-Lions' },
	{ division: 'Varsity', gold: 'Oxygen 2.0', silver: 'C-Fam Varsity', bronze: 'D&D-Fear' },
	{ division: 'Adult', gold: 'C-Fam Adult', silver: 'D&D-VIII', bronze: 'D&D-New Flame' },
	{ division: 'JV MegaCrew', gold: 'The Pack', silver: 'CDDEMO', bronze: 'Tha Radicalz' },
	{ division: 'MiniCrew', gold: 'C-Fam Mini', silver: 'Mini C-Fam', bronze: 'D&D-Three' },
	{ division: 'MegaCrew', gold: 'C-Fam', silver: 'D & D', bronze: 'MDF CREW' }
];

export const RESULTS: YearResults[] = [
	{ year: '2026', rows: ROWS_2026, sheets: SHEETS_2026 },
	{ year: '2025', rows: ROWS_2025, sheets: SHEETS_2025 },
	{ year: '2024', rows: ROWS_2024, sheets: SHEETS_2024 },
	{ year: '2023', rows: ROWS_2023, sheets: SHEETS_2023 }
];
