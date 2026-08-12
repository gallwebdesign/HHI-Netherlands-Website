/* ============================================================
   Regulations — the six rule records that were hand-written as
   markup in regulations.html. Adding or reordering a rule is now
   a data edit; the numbering derives from array position.

   Text is plain UTF-8 (– — ’ not &ndash; &mdash; &rsquo;). The
   entity encoding was only ever an HTML-attribute workaround.
   ============================================================ */

export interface Rule {
	/** Short heading, e.g. "Crew size". */
	title: string;
	/** One-paragraph plain-language summary. */
	body: string;
}

export const RULES: Rule[] = [
	{
		title: 'Divisions & ages',
		body: 'Junior (7–12), Varsity (13–17), Adult (18+), plus MiniCrew and MegaCrew open to all ages. Your division is set by your dancers’ ages on competition day.'
	},
	{
		title: 'Crew size',
		body: 'Crews are 5–9 dancers, MiniCrews exactly 3, MegaCrews 10–40. Each dancer may compete in only one crew per division.'
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
