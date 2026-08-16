/* ============================================================
   Regulations — the rule records that were hand-written as
   markup in regulations.html. Adding or reordering a rule is now
   a data edit; the numbering derives from array position.

   The rules are split into two columns, one per competition, the
   same split the site uses everywhere else (REGISTRATION_FORMS,
   the events schedule): the HHI Open Division and the Netherlands
   HHDC. Column order follows the event days, matching those.

   ⚠️ EDIT EACH COLUMN BELOW. The two columns are written out in
   full and independently, so changing one never touches the other
   — that is deliberate, not duplication to be factored out. They
   currently hold the SAME six rules, carried over from the single
   list that used to run full width; replace the second column's
   text as the per-competition rules arrive. Numbering restarts
   per column, so both read 01 at the top.

   ⚠️ Titles must be unique WITHIN a column — the page keys its
   each block on the title, and two identical titles in one column
   throw each_key_duplicate on hydration. The same title appearing
   in both columns is fine, and is the current state.

   Text is plain UTF-8 (– — ’ not &ndash; &mdash; &rsquo;). The
   entity encoding was only ever an HTML-attribute workaround.
   ============================================================ */

export interface Rule {
	/** Short heading, e.g. "Crew size". */
	title: string;
	/** One-paragraph plain-language summary. */
	body: string;
}

export interface RuleColumn {
	/** Which competition these rules govern — the column heading. */
	competition: string;
	/** Mono sub-label under the heading, matching the events day columns. */
	note: string;
	/** That competition's rules, numbered from 01 by array position. */
	rules: Rule[];
}

/* ---------- COLUMN 1 — left ---------- */
const OPEN_DIVISION_RULES: Rule[] = [
	{
		title: 'Divisions & ages',
		body: 'Junior (7–12), Varsity (13–17), Adult (18+), Parents and Special Crews (Dancers with a disability or special needs) open to all ages.'
	},
	{
		title: 'Crew size',
		body: 'Junior, Varsity, Adult, Parents & Special Crews are all 5-20 dancers. Each dancer may compete in two crews per division.'
	},
	{
		title: 'Routine & music',
		body: 'Routine length for all HHI Open Division categories is maximum two minutes thirty seconds. Music must be clean — no explicit lyrics — and submitted before the deadline.'
	},
	{
		title: 'Judging',
		body: 'An international judging panel scores by the HHI system: performance and skill, weighing musicality, creativity, execution and variety of street-dance styles.'
	},
	{
		title: 'Deductions',
		body: 'Falls, stalled routines and rulebook violations cost points. The head judge decides, and that decision is final.'
	},
	{
		title: 'Attire & props',
		body: 'Outfits are free within the rulebook’s guidelines. Loose props and set pieces are restricted — check the official document before you build.'
	}
];

/* ---------- COLUMN 2 — right ---------- */
const HHDC_RULES: Rule[] = [
	{
		title: 'Divisions & ages',
		body: 'Junior (7–12), Varsity (13–17), Adult (18+), JV-MegaCrew (17 and younger) plus MiniCrew and MegaCrew open to all ages. Your division is set by your dancers’ ages in the competition year.'
	},
	{
		title: 'Crew size',
		body: 'Junior, Varsity & Adult Crews are 5–9 dancers, MiniCrews are 3-4 dancers, JV-MegaCrew & MegaCrews are 10–40 dancers. Each dancer may compete in two crews per division.'
	},
	{
		title: 'Routine & music',
		body: 'Routine length and music requirements are set per division in the official rulebook. Music must be clean — no explicit lyrics — and submitted before the deadline.'
	},
	{
		title: 'Judging',
		body: 'An international judging panel scores by the HHI system: performance and skill, weighing musicality, creativity, execution and variety of street-dance styles.'
	},
	{
		title: 'Deductions',
		body: 'Falls, stalled routines and rulebook violations cost points. The head judge decides, and that decision is final.'
	},
	{
		title: 'Attire & props',
		body: 'Outfits are free within the rulebook’s guidelines. Loose props and set pieces are restricted — check the official document before you build.'
	}
];

export const RULE_COLUMNS: RuleColumn[] = [
	{
		competition: 'HHI Open Division',
		note: 'Open Division rules',
		rules: OPEN_DIVISION_RULES
	},
	{
		competition: 'Netherlands HHDC',
		note: 'National Championship rules',
		rules: HHDC_RULES
	}
];
