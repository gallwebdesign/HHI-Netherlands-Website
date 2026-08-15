/* ============================================================
   Sponsors — the seven organisations that actually back the
   championship, as listed on the legacy sponsors.php.

   REWRITTEN 15 Aug 2026. The page used to advertise three
   sponsorship tiers ("Example packages", "Put your brand on the
   floor", a Get in touch CTA). Iain's instruction: show the
   current sponsors and do not solicit new ones. The TIERS data
   is gone with it — recover from git history if a sales page is
   ever wanted again.

   Logos were rescued from the legacy host into
   static/img/sponsors/ on 15 Aug 2026, the same way the media
   photos were. All seven are 180x180 PNGs with transparency.

   ⚠️ They are dark-on-transparent, drawn for a white page —
   measured average luminance runs from 20 (apsgroep) to 159
   (heijnens) against this site's near-black ground. That is why
   .sponsor__plate paints a light panel behind each one rather
   than dropping them straight onto --ink, where the darker
   three would be invisible. Do not "simplify" that away.

   Descriptions are the sponsors' own words from the legacy
   page, trimmed only where they ran long. VSBfonds's is Dutch
   in the original and is kept in Dutch — it is their copy, not
   ours to translate.

   Text is plain UTF-8 (– — ’ not &ndash; &mdash; &rsquo;).
   ============================================================ */

import { withBase } from '$lib/config';

export interface Sponsor {
	/** Display name, as the sponsor writes it. */
	name: string;
	/** Logo path under static/img/sponsors/, already base-prefixed. */
	logo: string;
	/** The sponsor's own one-line description. */
	blurb: string;
	/** Their website. */
	href: string;
}

/* withBase() because the page binds src from this array, and Kit only
   rewrites root-relative paths written literally in markup. */
const logo = (file: string) => withBase(`/img/sponsors/${file}.png`);

/** Order follows the legacy page. */
export const SPONSORS: Sponsor[] = [
	{
		name: 'Heijnens Audio · Light · Vision',
		logo: logo('heijnens'),
		blurb:
			'The complete supplier for the technical part of your event. Audio, light, vision and power.',
		href: 'http://www.heijnensaudio.nl/'
	},
	{
		name: 'VSBfonds',
		logo: logo('vsbfonds'),
		blurb:
			'VSBfonds ondersteunt initiatieven van en voor iedereen die actief wil meedoen aan de samenleving.',
		href: 'https://www.vsbfonds.nl/'
	},
	{
		name: 'Provincie Limburg',
		logo: logo('limburg'),
		blurb:
			'Taking an active role in supporting, facilitating, connecting and networking with organisations working for the social domain.',
		href: 'https://www.limburg.nl/'
	},
	{
		name: 'Gemeente Maastricht',
		logo: logo('maastricht'),
		blurb:
			'Embedding art and culture more deeply in the city, and creating new connections between the arts and the public.',
		href: 'https://www.gemeentemaastricht.nl/'
	},
	{
		name: 'MECC Maastricht',
		logo: logo('mecc'),
		blurb:
			'30,000 m² of exhibition space, a congress centre and auditoriums — and the home of the championship.',
		href: 'https://www.mecc.nl/'
	},
	{
		name: 'het Cultuurfonds',
		logo: logo('bernhard'),
		blurb: 'het Cultuurfonds supports culture, nature and science in the Netherlands.',
		href: 'https://www.cultuurfonds.nl/'
	},
	{
		name: 'APS Groep',
		logo: logo('apsgroep'),
		blurb: 'APS Groep: for all your promotions.',
		href: 'http://www.apsgroep.nl/'
	}
];
