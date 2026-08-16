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

test('hero splits into two columns without growing taller', async ({ page }) => {
	/* Layout: the lockup and the title sit side by side as two columns; the
	   lede, countdown and CTAs run full width beneath both.

	   Iain's constraint when the lockup was added: keep the original hero
	   height. It is min-height:100svh with justify-content:flex-end, so a
	   tall left column does not stretch the hero — it pushes the countdown
	   and CTAs off the bottom, which is what the first attempt did (978px
	   against a 900px viewport).

	   Baselines were measured on main before this change: 900px tall at
	   1440x900 with the CTAs ending at 864px, and 780px at 390x780 ending
	   at 749px. Both are asserted here.

	   NOT asserted at 1280x620: main itself is 757px against that 620px
	   viewport with its CTAs off-screen, so the short-landscape overflow
	   is pre-existing and this layout is not the place to fix it. */
	for (const size of [
		{ width: 1440, height: 900 },
		{ width: 390, height: 780 }
	]) {
		await page.setViewportSize(size);
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		// The curtain has to lift before the hero has its real height.
		await page.waitForTimeout(2200);

		const m = await page.evaluate(() => {
			const q = (s: string) => document.querySelector(s)!;
			const hero = q('.hero').getBoundingClientRect();
			const logo = q('.hero__mark') as HTMLImageElement;
			return {
				heroH: hero.height,
				viewportH: window.innerHeight,
				logoLoaded: logo.naturalWidth > 0,
				logoRight: logo.getBoundingClientRect().right,
				copyLeft: q('.hero__copy').getBoundingClientRect().left,
				ctaBottom: q('.hero__ctas').getBoundingClientRect().bottom,
				metaWidth: q('.hero__meta').getBoundingClientRect().width,
				innerWidth: q('.hero__inner').getBoundingClientRect().width,
				/* How far the lockup's centre sits from the column's centre. */
				logoCentreOffset: (() => {
					const l = logo.getBoundingClientRect();
					const i = q('.hero__inner').getBoundingClientRect();
					return l.left + l.width / 2 - (i.left + i.width / 2);
				})(),
				boardWidth: q('.board').getBoundingClientRect().width,
				/* The BUTTONS, not their container: the container is a grid item
				   and is stretched to the column either way, so measuring it
				   cannot detect whether the buttons themselves went full width. */
				btnWidths: [...document.querySelectorAll('.hero__ctas .btn')].map(
					(b) => b.getBoundingClientRect().width
				),
				overflowsX: document.documentElement.scrollWidth > window.innerWidth,
				stacked: window.innerWidth <= 1000
			};
		});

		const label = `${size.width}x${size.height}`;
		expect(m.logoLoaded, `${label}: lockup should load`).toBe(true);
		expect(m.overflowsX, `${label}: nothing should overflow sideways`).toBe(false);

		/* The one-viewport rule is desktop-only. On mobile Iain chose the
		   screenshot's proportions over fitting the fold (16 Aug 2026): the
		   lockup gets real size and the CTAs may sit below it, so the hero
		   is allowed to grow and the page scrolls. Asserting the height
		   there would be asserting the opposite of what was asked for. */
		if (!m.stacked) {
			expect(m.heroH, `${label}: hero should not exceed one viewport`).toBeLessThanOrEqual(
				m.viewportH + 2
			);
			expect(m.ctaBottom, `${label}: CTAs should stay on screen`).toBeLessThanOrEqual(
				m.viewportH + 2
			);
		}

		/* Only the lockup and the title share the two columns. The lede,
		   countdown and CTAs span the full width beneath them, as on main —
		   an earlier revision nested them inside the right-hand column, which
		   crushed the lede to ~8 words a line and stacked the buttons. */
		expect(
			Math.abs(m.metaWidth - m.innerWidth),
			`${label}: meta row should span the full hero width`
		).toBeLessThanOrEqual(2);

		/* Side by side above the breakpoint, stacked below it. Without the
		   column split the logo and copy would share the same left edge. */
		if (!m.stacked) {
			expect(m.logoRight, `${label}: columns should not overlap`).toBeLessThanOrEqual(m.copyLeft);
		} else {
			/* Stacked and centred: the lockup sits in the middle of the column
			   rather than against the left gutter, and the countdown and both
			   buttons stretch to the same full width as each other. Measured,
			   because "centred" in CSS is several separate properties here —
			   text-align does not centre the eyebrow's flex row, and widening
			   .board does not spread cells that have no flex-grow. */
			expect(
				Math.abs(m.logoCentreOffset),
				`${label}: lockup should be centred in the column`
			).toBeLessThanOrEqual(2);
			for (const [i, w] of m.btnWidths.entries()) {
				expect(
					Math.abs(w - m.boardWidth),
					`${label}: CTA ${i + 1} should be as wide as the countdown`
				).toBeLessThanOrEqual(2);
			}
		}
	}
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

test('scroll-to-top button appears on scroll and returns to the top', async ({ page }) => {
	/* Asserted by measurement rather than by reading CSS: the button is
	   opacity/visibility driven, so a rule that computes plausibly can still
	   leave it either permanently on screen or never reachable. Playwright's
	   toBeVisible() covers both, since it accounts for visibility:hidden. */
	await page.goto('/events');
	await page.waitForLoadState('networkidle');

	const btn = page.getByRole('button', { name: 'Back to top' });

	// At the top of a page there is nothing to scroll back to.
	await expect(btn, 'should be hidden before scrolling').toBeHidden();

	/* Two viewports down: past the fold, but not so far that the footer is on
	   screen, where the button deliberately stands down to keep the footer's
	   own links clickable. */
	await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
	await page.waitForTimeout(700);
	await expect(btn, 'should appear once scrolled past a viewport').toBeVisible();

	await btn.click();
	await page.waitForTimeout(1200);
	expect(await page.evaluate(() => window.scrollY), 'should be back at the top').toBeLessThan(5);

	// And it takes itself away again once its job is done.
	await expect(btn, 'should hide again at the top').toBeHidden();
});

test('scroll-to-top button never covers a footer link', async ({ page }) => {
	/* Found by measuring, not by looking: at 1440px the footer wraps its links
	   to a second row, which puts PRIVACY in the bottom-right corner under the
	   button — document.elementFromPoint at that link's own centre returned
	   .scroll-top__label. The full-page screenshot showed no collision because
	   that row was below the fold when it was captured.
	   It matters beyond tidiness: the privacy policy tells visitors to use that
	   link to exercise their data rights. The button now stands down while the
	   footer is on screen. */
	await page.goto('/events');
	await page.waitForLoadState('networkidle');

	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.waitForTimeout(800);

	const covered = await page.evaluate(() => {
		const btn = document.querySelector('.scroll-top');
		if (!btn) return ['no button'];
		const style = getComputedStyle(btn);
		if (style.visibility === 'hidden' || style.opacity === '0') return [];
		/* Ask the document what is actually painted at each link's centre. */
		return [...document.querySelectorAll('footer a')]
			.filter((a) => {
				const r = a.getBoundingClientRect();
				const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
				return hit !== a && !a.contains(hit);
			})
			.map((a) => (a as HTMLElement).innerText.trim());
	});

	expect(covered, 'no footer link should be sitting under the button').toEqual([]);
});

test('scroll-to-top button gets out of the way of the mobile menu', async ({ page }) => {
	/* The menu is a full-screen panel at z-index 55 and the button sits at 65,
	   so without the explicit hide it floats over a page you are no longer
	   looking at. `inert` also has to take it out of the tab order, or it is
	   reachable behind the open menu. */
	await page.setViewportSize({ width: 390, height: 780 });
	await page.goto('/events');
	await page.waitForLoadState('networkidle');

	/* Mid-page, not the very bottom: the button stands down once the footer
	   is on screen, and the nav (which carries the burger) hides on scroll
	   down and only returns on scroll up. Scrolling to the end would leave
	   neither control reachable — both correct behaviours. */
	await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
	await page.waitForTimeout(700);
	await page.evaluate(() => window.scrollBy(0, -120));
	await page.waitForTimeout(600);

	const btn = page.getByRole('button', { name: 'Back to top' });
	await expect(btn).toBeVisible();

	await page.getByRole('button', { name: /menu/i }).click();
	await page.waitForTimeout(600);
	await expect(btn, 'should be hidden while the menu is open').toBeHidden();
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
	   of the desktop nav (16 Aug 2026). The label is "Rules" while the route is
	   /regulations — see NAV_LINKS for why the nav abbreviates it. */
	await page.locator('.nav__links a', { hasText: 'Rules' }).click();
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
	   only — the old third column is gone. Seven rows per day: five competition
	   categories bracketed by doors-open and the awards ceremony (confirmed
	   16 Aug 2026 — the schedule gained those bookends and this count trailed
	   it at 6). */
	await expect(days.nth(0).locator('.sched__row')).toHaveCount(7);
	await expect(days.nth(1).locator('.sched__row')).toHaveCount(7);
	await expect(page.locator('.sched__note')).toHaveCount(0);

	/* The times are indicative and the running order is not final, so the page
	   must say so. Published times people plan travel around, presented as fact
	   before the programme exists, is the failure mode this guards.

	   Matched on intent rather than one phrase: the footnote said "subject to
	   change" until 16 Aug 2026, when the times were pulled to TBA and it became
	   a promise to post them after registration closes. Both discharge the duty
	   to mark the schedule provisional, so either wording passes. */
	await expect(page.locator('.footnote')).toContainText(
		/subject to change|will be posted|to be announced|TBA/i
	);
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

test('regulations splits into two competition columns, aligned row for row', async ({ page }) => {
	/* Nothing asserted this page's content until 16 Aug 2026, and two visibly
	   broken renders shipped past a green suite because of it: first every rule
	   card rendered as an empty grey box (reveal() nested inside reveal(), so the
	   cards stayed visibility:hidden forever), then the second column stacked
	   below the first (grid-column set without grid-row, so auto-placement gave
	   every item its own row). Both looked correct in the markup.

	   The geometry assertions below were verified to catch the second bug and a
	   per-column-grid regression, each by reintroducing it and watching this
	   fail. The first bug is no longer reproducible in this markup — see the
	   note on the visibility check. */
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/regulations');
	await settleReveals(page);

	/* One column per competition, ordered by event day like REGISTRATION_FORMS
	   and the events schedule — Open Division dances first. */
	const cols = page.locator('.rule-col');
	await expect(cols).toHaveCount(2);
	await expect(cols.nth(0)).toContainText('HHI Open Division');
	await expect(cols.nth(1)).toContainText('Netherlands HHDC');

	/* Visible, not merely attached — settleReveals has already scrolled, so a
	   card still hidden here is genuinely broken rather than merely off-screen.

	   Note this does NOT currently reproduce the nested-reveal bug that shipped
	   on 16 Aug: .rule-col is display:contents, which generates no box and so
	   cannot hide its children whatever reveal() does to it. Verified by
	   re-adding reveal() to the cards and watching this still pass. It is kept
	   as a guard for the day the wrapper regains a box — the alignment
	   assertions below are what actually carry this test. */
	const cards = page.locator('.rule');
	await expect(cards).toHaveCount(12);
	await expect(cards.first()).toBeVisible();
	await expect(cards.last()).toBeVisible();

	/* Numbering restarts per column, so both read 01 at the top. */
	await expect(cols.nth(0).locator('.rule__num').first()).toHaveText('01');
	await expect(cols.nth(1).locator('.rule__num').first()).toHaveText('01');

	/* The columns must sit SIDE BY SIDE and each rule must line up with its
	   opposite number. One shared grid is what guarantees this: a row is as tall
	   as its tallest cell, so a short rule is padded to match. Per-column grids
	   drift apart as soon as the two texts differ in length, which they now do —
	   the Open Division's first two rules are markedly shorter than the HHDC's.

	   Measured rather than asserted on CSS, because the failure mode is a
	   layout that computes plausibly and renders wrong. */
	const rows = await page.evaluate(() => {
		const read = (col: Element) =>
			[...col.querySelectorAll('.rule')].map((el) => {
				const r = el.getBoundingClientRect();
				return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left) };
			});
		const [a, b] = [...document.querySelectorAll('.rule-col')].map(read);
		return a.map((l, i) => ({
			topDelta: Math.abs(l.top - b[i].top),
			bottomDelta: Math.abs(l.bottom - b[i].bottom),
			sideBySide: b[i].left > l.left
		}));
	});

	expect(rows).toHaveLength(6);
	for (const [i, row] of rows.entries()) {
		expect(row.sideBySide, `rule ${i + 1}: column 2 should sit beside column 1`).toBe(true);
		// 1px of tolerance for sub-pixel rounding; anything more is real drift.
		expect(row.topDelta, `rule ${i + 1}: tops should align across columns`).toBeLessThanOrEqual(1);
		expect(
			row.bottomDelta,
			`rule ${i + 1}: bottoms should align across columns`
		).toBeLessThanOrEqual(1);
	}
});

test('regulations columns stack in reading order on mobile', async ({ page }) => {
	/* Below 1000px the shared grid is unwound to plain blocks. Left as a grid,
	   display:contents plus an explicit grid-column drops both columns into the
	   single remaining track and INTERLEAVES them — an Open Division rule, then
	   an HHDC rule, alternating. Each column must keep its own header with its
	   own six rules. */
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/regulations');
	await settleReveals(page);

	const order = await page.evaluate(() =>
		[...document.querySelectorAll('.rule-col__name, .rule h3')]
			.map((el) => ({
				text: el.textContent?.trim() ?? '',
				y: el.getBoundingClientRect().top + window.scrollY,
				heading: el.classList.contains('rule-col__name')
			}))
			.sort((a, b) => a.y - b.y)
	);

	// Two headings, and the second must come after all six of the first's rules.
	const headings = order.map((o, i) => (o.heading ? i : -1)).filter((i) => i >= 0);
	expect(headings).toEqual([0, 7]);

	// Nothing may overflow sideways at this width.
	const overflows = await page.evaluate(
		() => document.documentElement.scrollWidth > window.innerWidth
	);
	expect(overflows, 'page should not scroll horizontally on mobile').toBe(false);
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
