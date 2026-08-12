/* ============================================================
   Registration — the four "how it works" steps and the
   four-item pre-registration checklist from registration.html.

   Step numbers derive from array position, like the regulations
   rules: reordering the array renumbers the page.

   Text is plain UTF-8 (– — ’ not &ndash; &mdash; &rsquo;).
   ============================================================ */

export interface Step {
	/** Step heading, e.g. "Pick your division". */
	title: string;
	/** One-sentence instruction. */
	body: string;
}

export const STEPS: Step[] = [
	{
		title: 'Pick your division',
		body: 'Check ages and crew size against the regulations.'
	},
	{
		title: 'Fill in the form',
		body: 'Crew name, dancers, contact person — via the official form.'
	},
	{
		title: 'Submit your music',
		body: 'Clean edit, on time, in the requested format.'
	},
	{
		title: 'Take the floor',
		body: 'Check in on competition day and battle for the Worlds ticket.'
	}
];

export interface CheckItem {
	/** Bolded lead-in, e.g. "Roster locked." */
	label: string;
	/** The rest of the line. */
	body: string;
}

export const CHECKLIST: CheckItem[] = [
	{
		label: 'Roster locked.',
		body: 'All dancers confirmed, ages match your division.'
	},
	{
		label: 'Rulebook read.',
		body: 'Routine length, music and props per the official regulations.'
	},
	{
		label: 'Music clean.',
		body: 'No explicit lyrics; edit ready before the deadline.'
	},
	{
		label: 'Point of contact.',
		body: 'One reachable crew manager for all communication.'
	}
];
