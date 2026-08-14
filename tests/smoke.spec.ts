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
	'/results'
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

	const tabs = page.getByRole('tab');
	await expect(tabs).toHaveCount(3);

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

	await expect(page.locator('.division')).toHaveCount(5);
	await expect(page.locator('.road__panel')).toHaveCount(4);
	await expect(page.locator('.about__stat')).toHaveCount(3);
	// Ticker items are duplicated so the strip can loop.
	await expect(page.locator('.ticker__item')).toHaveCount(8);

	// Countdown is shared with /events and must tick here too.
	await expect(page.locator('.board__num').first()).not.toHaveText('00');
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

	await page.locator('.nav__links a', { hasText: 'Sponsors' }).click();
	await expect(page).toHaveURL(/sponsors/);
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

test('registration hub offers both competition forms', async ({ page }) => {
	await page.goto('/registration');

	/* The two JotForms are the point of the page. Asserted on the real hrefs
	   because a hub that renders but links nowhere useful is the failure mode
	   worth catching — these are the only registration routes that exist.
	   They split by competition, not by event day: the forms' own titles are
	   "Netherlands HHDC" and "HHI Open Division". */
	const forms = page.locator('.reg-day a[href*="form.jotform.com"]');
	await expect(forms).toHaveCount(2);
	await expect(forms.nth(0)).toHaveAttribute('href', /262132296237961/);
	await expect(forms.nth(1)).toHaveAttribute('href', /262132162311946/);

	await expect(page.getByText('Netherlands HHDC', { exact: true })).toBeAttached();
	await expect(page.getByText('HHI Open Division', { exact: true })).toBeAttached();

	/* Guards against the earlier mistake of presenting these as a Saturday
	   and a Sunday form — the day split is still unannounced. */
	await expect(page.locator('.reg-days')).not.toContainText(/saturday|sunday/i);
});

test('every "register" CTA points at the hub, not a form', async ({ page }) => {
	/* The six CTAs deliberately funnel through /registration rather than
	   doubling up per day, because the division split is unannounced. If one
	   ever links straight to a JotForm, a crew is asked to pick a day from a
	   button with no context to pick on. */
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
