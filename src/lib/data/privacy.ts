/* ============================================================
   Privacy policy — carried over from the legacy privacy-policy.php
   on 15 Aug 2026, the last page of the old site still serving real
   content that had no migrated route.

   THE DUTCH IS THE AUTHORITATIVE TEXT and is reproduced verbatim.
   Only two things were changed, both encoding rather than wording:
   the legacy page was served as Latin-1 mislabelled as UTF-8, so
   "geïnteresseerd", "enquête" and "video’s" arrived as mojibake.
   They are restored here. Do not "improve" the Dutch — it is a
   legal document, and rewording it changes what was published.

   The English is a convenience translation only. The page says so
   explicitly, and says the Dutch prevails, because the site
   otherwise ships English-only and a visitor would reasonably
   assume the English is the real thing.

   Text is plain UTF-8 (– — ’ not &ndash; &mdash; &rsquo;).
   ============================================================ */

export interface PrivacySection {
	/** Heading, Dutch — the authoritative wording. */
	title: string;
	/** Heading, English convenience translation. */
	titleEn: string;
	/** Body paragraphs, Dutch. Each entry is one <p>. */
	body: string[];
	/** Body paragraphs, English, index-matched to `body`. */
	bodyEn: string[];
	/** Optional bullet list, Dutch — rendered between the paragraphs. */
	list?: string[];
	/** Optional bullet list, English, index-matched to `list`. */
	listEn?: string[];
	/** Paragraphs that follow the list, Dutch. */
	after?: string[];
	/** Paragraphs that follow the list, English. */
	afterEn?: string[];
}

export const PRIVACY_INTRO = {
	nl: 'De privacy van onze bezoekers is belangrijk voor ons. Dit privacy beleid document schetst de soorten persoonlijke informatie die wordt verzameld door Hip Hop International Netherlands en hoe het wordt gebruikt.',
	en: 'The privacy of our visitors is important to us. This privacy policy document outlines the types of personal information collected by Hip Hop International Netherlands and how it is used.'
};

export const PRIVACY_SECTIONS: PrivacySection[] = [
	{
		title: '1. Gebruikersrechten',
		titleEn: '1. User rights',
		body: [
			'De verantwoordelijke persoon bij Hip Hop International Netherlands voor gegevensverwerking is Marion Gall-Wierts',
			'De gegevens worden verzameld voor de identificatie van en communicatie met personen die geïnteresseerd zijn in Hip Hop International Netherlands. De gegevensopslag volgt daarom uw contact met ons op en is nodig om de relatie te ontwikkelen. U kunt toegang vragen tot al uw persoonlijke identificeerbare informatie die we online verzamelen en onderhouden in onze database door het contact formulier in te vullen op onze website.',
			'De binnen de EU verzamelde gegevens worden in Nederland verzonden en verwerkt door derden, die contractueel gebonden zijn aan zowel de regels voor vertrouwelijkheid als gegevensbescherming volgens de standaardbepalingen binnen de Europese Unie. Elke derde partij is beperkt in het gebruik van verzamelde gegevens om de afhandeling van de klant door Hip Hop International Netherlands te vergemakkelijken.',
			'Elke gebruiker heeft het recht om van de verantwoordelijke persoon informatie te vragen over de persoonlijke gegevens die voor deze gebruiker zijn opgeslagen.',
			'Elke gebruiker heeft verder het recht om dergelijke persoonlijke gegevens te laten corrigeren, te verwijderen of specifiek te beperken voor elk mogelijk gebruik.',
			'Elke gebruiker heeft het recht om verdere gegevensverwerking te weigeren om specifieke persoonlijke redenen.',
			'Elke gebruiker heeft het recht om een klacht in te dienen over de verwerking van persoonlijke gegevens door Hip Hop International Netherlands aan de verantwoordelijke instantie.',
			'Hip Hop International Netherlands maakt geen gebruik van een profileringsmechanisme met verzamelde gegevens.'
		],
		bodyEn: [
			'The person responsible for data processing at Hip Hop International Netherlands is Marion Gall-Wierts.',
			'The data is collected in order to identify and communicate with people who are interested in Hip Hop International Netherlands. Data storage therefore follows from your contact with us and is necessary to develop that relationship. You can request access to all of your personally identifiable information that we collect online and maintain in our database by filling in the contact form on our website.',
			'Data collected within the EU is transferred to and processed in the Netherlands by third parties, who are contractually bound by both confidentiality and data protection rules under the standard provisions within the European Union. Each third party is restricted in its use of collected data to facilitating the handling of customers by Hip Hop International Netherlands.',
			'Every user has the right to request information from the responsible person about the personal data stored for that user.',
			'Every user further has the right to have such personal data corrected, deleted, or specifically restricted for any possible use.',
			'Every user has the right to refuse further data processing for specific personal reasons.',
			'Every user has the right to lodge a complaint about the processing of personal data by Hip Hop International Netherlands with the responsible authority.',
			'Hip Hop International Netherlands does not use any profiling mechanism with collected data.'
		]
	},
	{
		title: 'Logboek bestanden',
		titleEn: 'Log files',
		body: [
			'Net als veel andere websites maakt Hip Hop International Netherlands gebruik van logbestanden. De informatie in de logbestanden bevat internetprotocoladressen, het type browser, internetserviceprovider, pagina’s waarnaar wordt verwezen en het aantal klikken. Deze informatie wordt gebruikt om trends te analyseren, de site te beheren, bezoekersbewegingen rond de site bij te houden en demografische informatie te verzamelen. Internetprotocoladressen en andere dergelijke informatie zijn niet gekoppeld aan informatie die persoonlijk identificeerbaar is.'
		],
		bodyEn: [
			'Like many other websites, Hip Hop International Netherlands uses log files. The information in the log files includes internet protocol addresses, browser type, internet service provider, referring pages and the number of clicks. This information is used to analyse trends, administer the site, track visitor movement around the site and gather demographic information. Internet protocol addresses and other such information are not linked to any personally identifiable information.'
		]
	},
	{
		title: 'Cookies',
		titleEn: 'Cookies',
		body: [
			'Om deze website goed te laten werken, moeten we soms kleine bestanden op uw computer zetten, zogenaamde cookies. De meeste grote websites doen dit.'
		],
		bodyEn: [
			'To make this website work properly, we sometimes have to place small files on your computer, known as cookies. Most large websites do this.'
		]
	},
	{
		title: 'Wat zijn cookies?',
		titleEn: 'What are cookies?',
		body: [
			'Een cookie is een klein tekstbestand dat een website op uw computer of mobiel toestel opslaat wanneer u die site bezoekt. Zo onthoudt de website de pagina’s die u heeft bezocht en uw voorkeuren (zoals gebruikersnaam, taal, lettergrootte en andere voorkeuren) zodat u die niet bij ieder bezoek aan de site opnieuw hoeft in te vullen.'
		],
		bodyEn: [
			'A cookie is a small text file that a website saves on your computer or mobile device when you visit that site. It lets the website remember the pages you have visited and your preferences (such as username, language, font size and other preferences) so that you do not have to enter them again on every visit.'
		]
	},
	{
		title: 'Hoe gebruiken we cookies?',
		titleEn: 'How do we use cookies?',
		body: ['Op enkele pagina’s registreren we in cookies:'],
		bodyEn: ['On some pages we record in cookies:'],
		list: [
			'uw weergavevoorkeuren, zoals contrastkleur en lettergrootte',
			'of u een enquête over onze site al heeft beantwoord (zodat we het u niet opnieuw vragen)',
			'of u al dan niet akkoord gaat met het gebruik van cookies op onze site'
		],
		listEn: [
			'your display preferences, such as contrast colour and font size',
			'whether you have already answered a survey about our site (so we do not ask you again)',
			'whether or not you agree to the use of cookies on our site'
		],
		after: [
			'Sommige video’s op onze site gebruiken ook een cookie om anonieme statistieken op te stellen over hoe u die video heeft gevonden en welke video’s u heeft bekeken.',
			'Deze website werkt ook zonder cookies, maar met cookies wordt hij wel gebruiksvriendelijker. U kunt cookies dus wissen of blokkeren, maar sommige onderdelen van de site zullen dan niet (naar behoren) werken.',
			'De informatie die de cookies verzamelen, wordt niet gebruikt om u te identificeren en wij delen de statistische gegevens niet met derden. Deze cookies worden ook niet voor andere dan de hierboven beschreven doeleinden gebruikt.'
		],
		afterEn: [
			'Some videos on our site also use a cookie to compile anonymous statistics about how you found that video and which videos you have watched.',
			'This website also works without cookies, but cookies do make it more user-friendly. You can therefore delete or block cookies, but some parts of the site will then not work (properly).',
			'The information the cookies collect is not used to identify you, and we do not share the statistical data with third parties. Nor are these cookies used for any purpose other than those described above.'
		]
	},
	{
		title: 'Hoe komt u meer te weten en wat kunt u met de cookies doen?',
		titleEn: 'How do you find out more, and what can you do about cookies?',
		body: [
			'U kunt cookies altijd controleren en/of wissen. Meer hierover leest u op aboutcookies.org en youronlinechoices.eu. U kunt alle cookies op uw computer wissen en u kunt uw browser zo instellen dat cookies geblokkeerd worden. Dit betekent wel dat u daarna uw voorkeuren bij ieder bezoek opnieuw moet instellen en dat sommige delen van de website niet (naar behoren) werken.'
		],
		bodyEn: [
			'You can always check and/or delete cookies. You can read more about this at aboutcookies.org and youronlinechoices.eu. You can delete all cookies on your computer, and you can set your browser to block cookies. This does mean that you will then have to set your preferences again on every visit, and that some parts of the website will not work (properly).'
		]
	},
	{
		title: 'Nieuwsbrieven',
		titleEn: 'Newsletters',
		body: [
			'Hip Hop International Netherlands kan elektronische nieuwsbrieven aan bezoekers aanbieden. Bezoekers kunnen zich vrijwillig abonneren op de elektronische nieuwsbrieven door hun e-mailadressen en andere relevante informatie, waaronder bezorgvoorkeuren, te verstrekken. Abonnees kunnen zich op elk gewenst moment uit de mailinglijst van de nieuwsbrief verwijderen door op de "unsubscribe" in de nieuwsbrief te klikken. Hip Hop International Netherlands deelt nooit nieuwsbriefmailinglijsten of andere bezoekersinformatie met derde partijen, waaronder adverteerders, sponsors of partners, behalve voor zover nodig door wetshandhavingsinstanties.'
		],
		bodyEn: [
			'Hip Hop International Netherlands may offer electronic newsletters to visitors. Visitors can voluntarily subscribe to the electronic newsletters by providing their email addresses and other relevant information, including delivery preferences. Subscribers can remove themselves from the newsletter mailing list at any time by clicking "unsubscribe" in the newsletter. Hip Hop International Netherlands never shares newsletter mailing lists or other visitor information with third parties, including advertisers, sponsors or partners, except insofar as required by law enforcement authorities.'
		]
	}
];
