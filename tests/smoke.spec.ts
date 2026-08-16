import { expect, test } from '@playwright/test';

/* Smoke test for the migrated site: every route serves, carries a
   title, and hydrates without console errors. It is deliberately
   shallow — it catches a route that stopped prerendering or a
   component that throws on hydration, which is what a bulk port of
   nine pages is most likely to break. */

const ROUTES = [
	'/',
	'/events',
	'/registration',
	'/media',
	'/organisation',
	'/sponsors',
	'/contact',
	'/regulations',
	'/results',
	'/privacy'
];

for (const route of ROUTES) {
	test(`${route} serves, has a title, and logs no console errors`, async ({ page }) => {
		const problems: string[] = [];

		/* Chrome logs "Failed to load resource: … 404 ()" without naming the
		   URL, so that message alone is both untraceable and impossible to
		   attribute to an origin. Requests are tracked via the response event
		   instead, which does carry the URL; the matching console noise is
		   dropped here so one failed request is not counted twice. */
		page.on('console', (msg) => {
			if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text())) {
				problems.push(`console: ${msg.text()}`);
			}
		});
		page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
		page.on('response', (r) => {
			if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`);
		});

		const response = await page.goto(route);
		expect(response?.status(), `${route} should serve 200`).toBe(200);

		await expect(page).toHaveTitle(/HHI Netherlands/);

		/* attached, not visible: reveal() hands the element to GSAP, which
		   holds it at autoAlpha:0 (visibility:hidden) until its ScrollTrigger
		   fires. Asserting visibility here would test the scroll position,
		   not the page. */
		await expect(page.locator('h1')).toBeAttached();

		/* Let hydration and the deferred GSAP import settle, so an error
		   thrown inside an attachment is not missed by a fast assertion. */
		await page.waitForLoadState('networkidle');

		/* The gallery photos used to be exempt here because they were
		   hot-linked off an unreliable host; they moved into static/img/ on
		   14 Aug 2026, so a missing image is a real failure again and that
		   exemption is gone.

		   What remains exempt is third-party origins only — fonts.gstatic.com
		   intermittently 404s a .woff2 (seen ~1 run in 3), and a CDN having a
		   bad minute is not a regression in this site. Anything served from
		   our own origin still fails, which is the point: the filter is by
		   origin, not by resource type, so a local asset can never slip
		   through it. */
		const external = /^https?:\/\/(?!localhost|127\.0\.0\.1)/;
		const real = problems.filter((p) => {
			const url = p.match(/^http \d+: (\S+)/)?.[1];
			return !(url && external.test(url));
		});
		expect(real, `${route} should log no console errors`).toEqual([]);
	});
}

/* reveal() parks content at visibility:hidden until its ScrollTrigger
   fires, which also takes it out of the accessibility tree — so
   getByRole finds nothing. Scrolling first puts it back. */
async function settleReveals(page: import('@playwright/test').Page) {
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.waitForTimeout(1200);
	await page.evaluate(() => window.scrollTo(0, 0));
}

test('results tabs switch panels', async ({ page }) => {
	await page.goto('/results');
	await settleReveals(page);

	/* One tab per published edition. Asserted as "more than one" rather than an
	   exact count: this test is about the tablist contract, not the size of the
	   archive, and it was hard-coded to 3 until 2026 was added on 15 Aug 2026. */
	const tabs = page.getByRole('tab');
	expect(await tabs.count()).toBeGreaterThan(1);

	// First year open by default, the others closed.
	await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('tabpanel')).toHaveCount(1);

	await tabs.nth(1).click();
	await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
	await expect(tabs.first()).toHaveAttribute('aria-selected', 'false');

	// Arrow keys move between tabs, per the tablist contract.
	await tabs.nth(1).press('ArrowRight');
	await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
});

test('home preloader lifts and reveals the hero', async ({ page }) => {
	await page.goto('/');

	/* The single worst failure mode on this page: a full-screen curtain
	   that never lifts leaves the site unusable. Preloader has a watchdog
	   for exactly this, so give it room and then require the loader gone
	   and the hero actually readable. */
	await expect(page.locator('.loader')).toHaveCount(0, { timeout: 10_000 });

	const title = page.locator('.hero__title');
	await expect(title).toBeVisible();
	await expect(title).toContainText('Own the');

	// Nothing may sit over the hero once the curtain is up.
	const covered = await page.evaluate(() => {
		const el = document.querySelector('.hero__title');
		if (!el) return 'missing';
		const r = el.getBoundingClientRect();
		const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
		return top && el.contains(top) ? 'clear' : (top?.className ?? 'unknown');
	});
	expect(covered).toBe('clear');
});

test('home renders its ported sections', async ({ page }) => {
	await page.goto('/');

	/* Lower bounds, not exact counts. The divisions are content and get
	   edited — JV MegaCrew was added on 14 Aug 2026, which broke a hard-coded
	   5 here for a perfectly legitimate copy change. What this test is for is
	   "the section rendered at all", so assert that and let the count move.
	   (Importing the data file to derive exact counts does not work: it pulls
	   in $lib/config, and $app/paths does not resolve in the test runner.) */
	await expect(page.locator('.division').first()).toBeAttached();
	expect(await page.locator('.division').count()).toBeGreaterThanOrEqual(5);
	await expect(page.locator('.road__panel')).toHaveCount(4);
	await expect(page.locator('.about__stat')).toHaveCount(3);
	/* Ticker items are duplicated so the strip can loop, so this is always
	   an even number and never zero. */
	const tickers = await page.locator('.ticker__item').count();
	expect(tickers).toBeGreaterThan(0);
	expect(tickers % 2).toBe(0);

	// Countdown is shared with /events and must tick here too.
	await expect(page.locator('.board__num').first()).not.toHaveText('00');
});

test('navigating from deep in a page lands at the top of the next one', async ({ page }) => {
	/* Regression, reported 14 Aug 2026: leave /events with the footer on
	   screen, arrive at the next page still looking at the footer.

	   Cause was html{ scroll-behavior:smooth } in style.css — inherited from
	   the legacy site, where every page change was a full reload so it never
	   mattered. Under the client router it also applies to SvelteKit's
	   scrollTo(0,0) navigation reset, turning that into an animation which the
	   layout's ScrollTrigger.refresh() then interrupts, stranding the scroll
	   partway. The rule is gone; the two in-page anchors use smoothAnchor()
	   instead. */
	await page.goto('/events');
	await page.waitForLoadState('networkidle');

	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.waitForTimeout(600);
	expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

	await page.locator('footer a[href$="/sponsors"]').first().click();
	await expect(page).toHaveURL(/\/sponsors$/);
	await page.waitForTimeout(1200);

	expect(
		await page.evaluate(() => window.scrollY),
		'should land at the top of the new page'
	).toBeLessThan(5);

	/* The global rule must not come back by any route — a computed value of
	   "smooth" on <html> reintroduces the bug even if this navigation passes
	   by luck of timing. */
	expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
		'auto'
	);
});

test('in-page anchors still scroll to their target', async ({ page }) => {
	/* The other half of the fix: removing the global rule must not break the
	   registration page's "#choose-your-form" links, which are the only
	   in-page anchors on the site. */
	await page.goto('/registration');
	await page.waitForLoadState('networkidle');

	await page.locator('a[href="#choose-your-form"]').first().click();
	await page.waitForTimeout(1200);

	const offset = await page.evaluate(() => {
		const t = document.getElementById('choose-your-form');
		return t ? Math.abs(t.getBoundingClientRect().top) : -1;
	});
	expect(offset, 'target should be at the top of the viewport').toBeLessThan(20);
	expect(page.url()).toContain('#choose-your-form');
});

test('home works with reduced motion', async ({ browser }) => {
	/* Reduced motion takes a different path through every animated piece:
	   no curtain, a single static three.js frame, no pin. The risk is
	   content that only becomes visible via an animation that now never
	   runs. */
	const context = await browser.newContext({ reducedMotion: 'reduce' });
	const page = await context.newPage();

	const problems: string[] = [];
	page.on('pageerror', (e) => problems.push(e.message));

	await page.goto('/');
	await expect(page.locator('.loader')).toHaveCount(0);
	await expect(page.locator('.hero__title')).toBeVisible();
	await expect(page.locator('.division').first()).toBeVisible();
	expect(problems).toEqual([]);

	await context.close();
});

test('home tears down its animations on navigation', async ({ page }) => {
	/* The home page is the only one holding resources that outlive a
	   render: a WebGL context and rAF loop, and a ScrollTrigger pin that
	   injects a spacer element. The legacy script released none of them —
	   harmless on a static site, a leak once a client router keeps the
	   document alive. */
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));

	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await expect(page.locator('#stage-floor canvas')).toBeAttached();

	// Scroll through the pinned road so ScrollTrigger builds its spacer.
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
	await page.waitForTimeout(800);

	// Back to the top — the nav hides on scroll-down.
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.waitForTimeout(600);

	/* Any nav link that leaves home does; Sponsors used to, until it moved out
	   of the desktop nav to make room for Regulations (16 Aug 2026). */
	await page.locator('.nav__links a', { hasText: 'Regulations' }).click();
	await expect(page).toHaveURL(/regulations/);
	await page.waitForTimeout(800);

	const leaked = await page.evaluate(() => ({
		canvases: document.querySelectorAll('canvas').length,
		stageFloor: document.querySelectorAll('#stage-floor').length,
		pinSpacers: document.querySelectorAll('.pin-spacer').length,
		loaders: document.querySelectorAll('.loader').length
	}));

	expect(leaked).toEqual({ canvases: 0, stageFloor: 0, pinSpacers: 0, loaders: 0 });
	expect(errors).toEqual([]);
});

test('events page shows the confirmed date and venue', async ({ page }) => {
	await page.goto('/events');

	/* Both derive from config.ts; this guards the wiring, not the copy.
	   Asserted on text content rather than visibility — the facts sit
	   behind reveal(), so visibility would test scroll position. */
	await expect(page.getByText('30 & 31 January 2027')).toBeAttached();
	await expect(page.getByText('MECC Maastricht')).toBeAttached();

	// The countdown prerenders zeroes and must start ticking once hydrated.
	await expect(page.locator('.board__num').first()).not.toHaveText('00');
});

test('events schedule splits into the two confirmed days', async ({ page }) => {
	await page.goto('/events');

	/* The day split was confirmed on 15 Aug 2026: 30 January is the HHI Open
	   Division, 31 January the Netherlands HHDC. Before that the page carried a
	   single indicative day and said the split was unannounced, so this guards
	   against a regression to that shape as much as it checks the content.

	   The dates derive from EVENT_DATE / EVENT_END_DATE in config.ts, so this
	   also catches a day label drifting away from the countdown. */
	const days = page.locator('.sched-day');
	await expect(days).toHaveCount(2);

	await expect(days.nth(0)).toContainText('30 January');
	await expect(days.nth(0)).toContainText('HHI Open Division');
	await expect(days.nth(1)).toContainText('31 January');
	await expect(days.nth(1)).toContainText('Netherlands HHDC');

	/* Each day carries its own running order, and the rows are time + category
	   only — the old third column is gone. */
	await expect(days.nth(0).locator('.sched__row')).toHaveCount(6);
	await expect(days.nth(1).locator('.sched__row')).toHaveCount(6);
	await expect(page.locator('.sched__note')).toHaveCount(0);

	/* The times are indicative and the running order is not final, so the page
	   must say so. Published times people plan travel around, presented as fact
	   before the programme exists, is the failure mode this guards. */
	await expect(page.locator('.footnote')).toContainText(/subject to change/i);
});

test('registration hub offers both competition forms', async ({ page }) => {
	await page.goto('/registration');

	/* The two JotForms are the point of the page. Asserted on the real hrefs
	   because a hub that renders but links nowhere useful is the failure mode
	   worth catching — these are the only registration routes that exist.
	   They split by competition, not by event day: the forms' own titles are
	   "Netherlands HHDC" and "HHI Open Division".

	   Asserted as a set, not per index. The card order is presentation — it was
	   changed on 15 Aug 2026 to run in day order (Open Division first, since it
	   dances on day one) — and an index-bound assertion fails on a reorder that
	   broke nothing. What must hold is that both forms are linked exactly once. */
	const forms = page.locator('.reg-day a[href*="form.jotform.com"]');
	await expect(forms).toHaveCount(2);
	const hrefs = await forms.evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
	expect(hrefs.filter((h) => h.includes('262132296237961'))).toHaveLength(1);
	expect(hrefs.filter((h) => h.includes('262132162311946'))).toHaveLength(1);

	/* Scoped to the card names. Both competitions are also named in bold inside
	   the day notice below, so an unscoped exact-text match resolves to two
	   elements and fails on strict mode. */
	await expect(page.locator('.reg-day__name', { hasText: /^Netherlands HHDC$/ })).toBeAttached();
	await expect(page.locator('.reg-day__name', { hasText: /^HHI Open Division$/ })).toBeAttached();

	/* Guards against the earlier mistake of presenting these as a Saturday and a
	   Sunday form. The day split is now confirmed (30 Jan Open, 31 Jan HHDC) and
	   is stated on /events by date — weekday names are still wrong here, since a
	   crew registers by competition, not by the day it happens to fall on. */
	await expect(page.locator('.reg-days')).not.toContainText(/saturday|sunday/i);
});

test('registration hub states which competition dances on which day', async ({ page }) => {
	await page.goto('/registration');

	/* Until 15 Aug 2026 this notice said the split was unannounced. It now
	   answers the question, which makes it load-bearing: a crew reads it to know
	   when to turn up. The assertion is on the pairing, not on the two dates
	   appearing somewhere on the page — the failure that actually costs someone
	   their competition is the days being swapped, and a looser check would pass
	   straight through it. */
	/* The page has two .notice blocks — this one and the "Ready?" prompt at the
	   end — so it is selected by its heading rather than by position. */
	const notice = page.locator('.notice', { hasText: 'Which day do we dance?' });
	await expect(notice).toContainText(/HHI Open Division dances on 30 January/i);
	await expect(notice).toContainText(/Netherlands HHDC on 31 January/i);

	/* The qualifier framing is the reason to enter the HHDC over the Open
	   Division, and this is the page where that choice is made. Matched loosely
	   on the Worlds name — the site calls it both "HHI Worlds" and "HHI World
	   Finals" — because what must survive an edit is the claim, not the wording. */
	await expect(notice).toContainText(/national qualifier/i);
	await expect(notice).toContainText(/HHI World/i);
});

test('privacy policy serves the Dutch text and can switch to English', async ({ page }) => {
	await page.goto('/privacy');

	/* The Dutch is the authoritative legal text, carried over verbatim from the
	   legacy privacy-policy.php. It must be what loads — the site is otherwise
	   English-only, so a default of English would quietly present a convenience
	   translation as the published document. */
	await expect(page.locator('.policy')).toHaveAttribute('lang', 'nl');
	await expect(page.locator('.policy')).toContainText('Gebruikersrechten');
	await expect(page.locator('.policy')).toContainText('Marion Gall-Wierts');

	/* Prerendered, not client-rendered: a legal page has to be readable with no
	   JavaScript at all. Asserted on the served HTML rather than the DOM. */
	const html = await (await page.request.get('/privacy')).text();
	expect(html).toContain('Gebruikersrechten');

	// The toggle is a local $state swap, not the removed site-wide i18n.
	await page.getByRole('button', { name: 'English' }).click();
	await expect(page.locator('.policy')).toHaveAttribute('lang', 'en');
	await expect(page.locator('.policy')).toContainText('User rights');
	await expect(page.locator('.policy')).not.toContainText('Gebruikersrechten');

	/* The precedence notice is the point of shipping both languages — without
	   it the translation reads as equally binding. */
	await expect(page.locator('.notice').first()).toContainText(/Dutch text prevails/i);
});

test('2026 results are the real podium, with their score sheets', async ({ page }) => {
	await page.goto('/results');
	await settleReveals(page);

	/* 2026 was recovered from the six official score sheets on 15 Aug 2026 and
	   every placement checked against the rank number in its source PDF. These
	   are real crews and real placings — a silent corruption here misreports
	   someone's championship, so the podium is asserted row by row rather than
	   by counting cells. */
	const panel = page.locator('#panel-2026');
	/* Anchored on the first cell's exact text, not the row's. A plain
	   hasText:'MegaCrew' also matches the JV MegaCrew row — and matches it
	   first, since it comes earlier in competition order. */
	const row = (division: string) =>
		panel
			.locator('tr')
			.filter({ has: page.locator('td', { hasText: new RegExp(`^${division}$`) }) });

	await expect(row('Junior')).toContainText('C-Fam Jr');
	await expect(row('Varsity')).toContainText('C-Fam Varsity');
	await expect(row('Adult')).toContainText('D&D VIII');
	await expect(row('JV MegaCrew')).toContainText('ELITE');
	await expect(row('MiniCrew')).toContainText('D&D CREW');
	await expect(row('MegaCrew').first()).toContainText('D&D');

	/* No placeholder may survive in a year that is published as official. */
	await expect(panel).not.toContainText('fill from archive');

	/* The six score sheets carry the full rankings and deductions. Fetched, not
	   just asserted on the href — they are the evidence for the table above. */
	const sheets = panel.locator('.sheets__links a');
	await expect(sheets).toHaveCount(6);
	for (const href of await sheets.evaluateAll((links) =>
		links.map((a) => a.getAttribute('href') ?? '')
	)) {
		const res = await page.request.get(href);
		expect(res.status(), `${href} should serve`).toBe(200);
		expect(res.headers()['content-type']).toContain('pdf');
	}

	/* Every edition is real as of 15 Aug 2026 — no panel may show a
	   placeholder, and each must carry its six score sheets. */
	const panels = page.locator('[role="tabpanel"]');
	expect(await panels.count()).toBeGreaterThan(3);
	for (let i = 0; i < (await panels.count()); i++) {
		await expect(panels.nth(i)).not.toContainText('fill from archive');
		await expect(panels.nth(i).locator('.sheets__links a')).toHaveCount(6);
	}
});

test('2025 results are the real podium, from the tabulation workbooks', async ({ page }) => {
	await page.goto('/results');
	await settleReveals(page);

	/* 2025 came from the division tabulation workbooks rather than the PDFs:
	   those PDFs embed subset fonts with no ToUnicode map and cannot be read by
	   machine. Taken from the Rank column, not by sorting on score — in
	   MegaCrew, deductions put two higher-scoring crews below rank 7. */
	await page.getByRole('tab', { name: '2025' }).click();
	const panel = page.locator('#panel-2025');
	/* Anchored on the first cell's exact text, not the row's. A plain
	   hasText:'MegaCrew' also matches the JV MegaCrew row — and matches it
	   first, since it comes earlier in competition order. */
	const row = (division: string) =>
		panel
			.locator('tr')
			.filter({ has: page.locator('td', { hasText: new RegExp(`^${division}$`) }) });

	await expect(row('Junior')).toContainText('OXYKIDZ');
	await expect(row('Varsity')).toContainText('C-Fam Varsity');
	await expect(row('Adult')).toContainText('D&D-VIII');
	await expect(row('JV MegaCrew')).toContainText('Elite');
	await expect(row('MiniCrew')).toContainText('D&D-CREW');
	await expect(row('MegaCrew').first()).toContainText('D&D');

	await expect(panel).not.toContainText('fill from archive');
	await expect(panel.locator('.sheets__links a')).toHaveCount(6);
});

test('2024 results are the real podium, without the tabulation asterisks', async ({ page }) => {
	await page.goto('/results');
	await settleReveals(page);

	await page.getByRole('tab', { name: '2024' }).click();
	const panel = page.locator('#panel-2024');
	/* Anchored on the first cell's exact text, not the row's. A plain
	   hasText:'MegaCrew' also matches the JV MegaCrew row — and matches it
	   first, since it comes earlier in competition order. */
	const row = (division: string) =>
		panel
			.locator('tr')
			.filter({ has: page.locator('td', { hasText: new RegExp(`^${division}$`) }) });

	/* Rank column again, not score order: in Junior, rank 3 (Trouble) scored
	   higher than rank 2 but took a 0.3 deduction. */
	await expect(row('Junior')).toContainText('225 crew');
	await expect(row('Varsity')).toContainText('C-Fam Varsity');
	await expect(row('Adult')).toContainText('C-Fam Adult');
	await expect(row('JV MegaCrew')).toContainText('Young C-Fam');
	await expect(row('MiniCrew')).toContainText('C-Fam Mini');
	await expect(row('MegaCrew').first()).toContainText('C-Fam');

	/* The workbooks flag defending champions with a trailing asterisk. That is
	   tabulation notation, not part of a crew's name, and must not leak onto the
	   page — four 2024 crews carry it at source. Asserted on the panel's whole
	   text: a per-<td> locator resolves to 24 elements and trips strict mode. */
	await expect(panel).not.toContainText('*');

	await expect(panel).not.toContainText('fill from archive');
	await expect(panel.locator('.sheets__links a')).toHaveCount(6);
});

test('2023 results keep their two easily-mistaken crew names', async ({ page }) => {
	await page.goto('/results');
	await settleReveals(page);

	await page.getByRole('tab', { name: '2023' }).click();
	const panel = page.locator('#panel-2023');
	/* Anchored on the first cell's exact text, not the row's. A plain
	   hasText:'MegaCrew' also matches the JV MegaCrew row — and matches it
	   first, since it comes earlier in competition order. */
	const row = (division: string) =>
		panel
			.locator('tr')
			.filter({ has: page.locator('td', { hasText: new RegExp(`^${division}$`) }) });

	await expect(row('Junior')).toContainText('Wanted');
	await expect(row('Varsity')).toContainText('Oxygen 2.0');
	await expect(row('Adult')).toContainText('C-Fam Adult');
	await expect(row('JV MegaCrew')).toContainText('The Pack');

	/* Two spellings a well-meaning edit would "fix" and get wrong:
	   - MiniCrew's gold and silver are C-Fam Mini and Mini C-Fam. Two different
	     crews in the same division, not a transcription slip.
	   - MegaCrew's silver is "D & D", spaced. Every other year writes "D&D". */
	await expect(row('MiniCrew')).toContainText('C-Fam Mini');
	await expect(row('MiniCrew')).toContainText('Mini C-Fam');
	await expect(row('MegaCrew').first()).toContainText('D & D');

	// Defending-champion asterisks must not leak here either.
	await expect(panel).not.toContainText('*');
});

test('sponsors page credits real sponsors and does not solicit new ones', async ({ page }) => {
	await page.goto('/sponsors');
	await settleReveals(page);

	/* Rewritten 15 Aug 2026 from a three-tier sales page to a credit page.
	   Iain's instruction was explicit: show current sponsors, do not advertise
	   for new ones — so the absence of a pitch is the requirement, not a
	   side effect, and it is what this test is really guarding.

	   No hardcoded count: sponsors get added (Houben Souren, 15 Aug 2026) and
	   a literal turns that into a failing test rather than a passing one.
	   SPONSORS cannot be imported here either — it pulls in $lib/config and
	   then $app, which only resolve inside Vite. So assert the shape instead:
	   a plausible number of cards, each one complete. */
	const cards = page.locator('.sponsor');
	const count = await cards.count();
	expect(count, 'sponsor cards should render').toBeGreaterThanOrEqual(7);

	await expect(page.locator('.sponsor__name', { hasText: 'MECC Maastricht' })).toBeAttached();
	await expect(page.locator('.sponsor__name', { hasText: 'Provincie Limburg' })).toBeAttached();

	/* Every card links out to the sponsor, in a new tab, and carries its
	   name and blurb — a half-filled entry should fail here. */
	for (const a of await cards.all()) {
		await expect(a).toHaveAttribute('href', /^https?:\/\//);
		await expect(a).toHaveAttribute('target', '_blank');
		await expect(a.locator('.sponsor__name')).not.toBeEmpty();
		await expect(a.locator('.sponsor__blurb')).not.toBeEmpty();
	}

	/* The logos are local: the original seven were rescued off the legacy
	   host, and a 404 here would leave blank plates. One per card — that is
	   what catches a sponsor added to the data without its logo shipped. */
	const logos = page.locator('.sponsor__plate img');
	await expect(logos).toHaveCount(count);
	for (const src of await logos.evaluateAll((imgs) =>
		imgs.map((i) => i.getAttribute('src') ?? '')
	)) {
		expect(src).toContain('/img/sponsors/');
		expect((await page.request.get(src)).status(), `${src} should serve`).toBe(200);
	}

	// No sales language, and no "approach us" CTA.
	await expect(page.locator('main')).not.toContainText(/package|become a sponsor|get in touch/i);
	await expect(page.locator('main a[href*="/contact"]')).toHaveCount(0);
});

test('regulations links both rules PDFs, and they actually download', async ({ page }) => {
	await page.goto('/regulations');

	/* The legacy regulations.php was only a wrapper around these two PDFs. They
	   are now in static/download/, so the page links them directly instead of
	   bouncing through a host that is being switched off. */
	const pdfs = page.locator('.notice a[href$=".pdf"]');
	await expect(pdfs).toHaveCount(2);

	/* Fetched, not just asserted on the href. A link to a PDF that 404s looks
	   perfectly correct in the markup, and this is the binding rulebook — the
	   one document on the site a crew is told to go and read. */
	for (const href of await pdfs.evaluateAll((links) =>
		links.map((a) => a.getAttribute('href') ?? '')
	)) {
		const res = await page.request.get(href);
		expect(res.status(), `${href} should serve`).toBe(200);
		expect(res.headers()['content-type']).toContain('pdf');
		expect(Number(res.headers()['content-length'] ?? 0)).toBeGreaterThan(100_000);
	}

	// New tab: leaving the site to read a PDF should not lose the page behind it.
	for (const target of await pdfs.evaluateAll((links) =>
		links.map((a) => a.getAttribute('target'))
	)) {
		expect(target).toBe('_blank');
	}
});

test('no link anywhere still points at the legacy host', async ({ page }) => {
	/* EXTERNAL was emptied of legacy-host links on 15 Aug 2026 — privacy became
	   a route, regulations became local PDFs, contactForm was dropped. This
	   asserts the result across every page rather than trusting config.ts, since
	   a hardcoded href in markup would bypass it entirely. */
	for (const route of ROUTES) {
		await page.goto(route);
		const stale = page.locator(
			'a[href*="hhi-netherlands.com/"][href$=".php"], a[href*="compoticketing"]'
		);
		expect(await stale.count(), `${route} still links at the legacy host`).toBe(0);
	}
});

test('the footer privacy link points at the migrated route', async ({ page }) => {
	await page.goto('/');

	/* It pointed at the legacy host until 15 Aug 2026, which dies with the old
	   site. A footer link to a switched-off host is the exact failure the
	   migration exists to prevent. */
	const privacy = page.locator('.footer a', { hasText: /^Privacy$/ });
	await expect(privacy).toHaveAttribute('href', /\/privacy$/);
	await expect(privacy).not.toHaveAttribute('href', /hhi-netherlands\.com/);
	await expect(privacy).not.toHaveAttribute('target', '_blank');
});

test('every "register" CTA points at the hub, not a form', async ({ page }) => {
	/* The six CTAs deliberately funnel through /registration rather than
	   doubling up per competition. The forms split by what a crew is entering,
	   and the hub is where that choice gets explained; a CTA pointing straight
	   at a JotForm asks a crew to pick with no context to pick on. */
	/* Counts are chrome + page CTAs. Every page carries three chrome links to
	   the hub (nav, mobile menu, footer); the home page adds its hero and
	   closing CTAs, /events adds its hero CTA. Exact counts rather than a
	   minimum, so a CTA silently retargeted at a JotForm fails here. */
	for (const [route, expected] of [
		['/', 6],
		['/events', 5]
	] as const) {
		await page.goto(route);

		/* Located by href, not by role: several of these sit behind reveal()
		   at visibility:hidden, which takes them out of the accessibility
		   tree, and the mobile-menu one is inside a closed panel. Counting
		   anchors in the DOM sidesteps both. */
		await expect(page.locator('a[href$="/registration"]')).toHaveCount(expected);

		// No CTA outside the hub may link straight to a day form.
		await expect(page.locator('a[href*="form.jotform.com"]')).toHaveCount(0);
	}
});
