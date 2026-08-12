/* ============================================================
   Sponsors — the three partnership tiers that were hand-written
   as markup in sponsors.html. Adding a tier or a bullet is now a
   data edit.

   Text is plain UTF-8 (– — ’ not &ndash; &mdash; &rsquo;). The
   entity encoding was only ever an HTML-attribute workaround.

   The packages are deliberately indicative, not a price list —
   see the notice under the tier grid on the page.
   ============================================================ */

export interface Tier {
	/** Small eyebrow above the tier name, e.g. "Main stage". */
	tag: string;
	/** Tier name. */
	title: string;
	/** What the partner gets. Order is the order shown. */
	items: string[];
	/** Marks the visually promoted middle tier (.tier--hot). */
	featured?: boolean;
}

export const TIERS: Tier[] = [
	{
		tag: 'Community',
		title: 'Support',
		items: ['Logo on website and screens', 'Social media mentions', 'Tickets for your team']
	},
	{
		tag: 'Main stage',
		title: 'Stage',
		items: [
			'Branding on and around the stage',
			'Activation on the event floor',
			'Content with crews and winners',
			'Everything in Support'
		],
		featured: true
	},
	{
		tag: 'Headline',
		title: 'Title partner',
		items: [
			'Name attached to the championship',
			'Campaign around the Road to Worlds',
			'Custom scope, built together'
		]
	}
];
