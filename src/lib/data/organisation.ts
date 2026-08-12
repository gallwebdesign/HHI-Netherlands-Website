/* ============================================================
   Organisation — the three "what we do" cards from
   organisation.html. The prose above them stays in the page: it
   is two hand-written paragraphs with inline <strong>, not a
   repeating record, so a data file would only add indirection.

   Text is plain UTF-8 (– — ’ not &ndash; &mdash; &rsquo;).
   ============================================================ */

export interface OrgCard {
	/** Small eyebrow above the card title, e.g. "Production". */
	tag: string;
	/** Card heading. */
	title: string;
	/** One-sentence description. */
	body: string;
}

export const ORG_CARDS: OrgCard[] = [
	{
		tag: 'Production',
		title: 'The event',
		body: 'Stage, lights, sound and a schedule that runs tight — so crews only have to think about dancing.'
	},
	{
		tag: 'Competition',
		title: 'Judging & registration',
		body: 'International judges, the official HHI scoring system and a fair, transparent registration process.'
	},
	{
		tag: 'Community',
		title: 'The scene',
		body: 'From volunteers to the floor team: the championship runs on people from the Dutch hip hop scene itself.'
	}
];
