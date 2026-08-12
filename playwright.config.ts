import { defineConfig } from '@playwright/test';

/* The smoke test runs against the real prerendered output in build/,
   served by `npx serve`. Deliberately NOT `npm run preview`: preview
   serves static/ in preference to the prerendered pages, so it would
   quietly test the OLD legacy HTML. That trap disappears at Phase 7
   when the legacy files are deleted. */
/* Run `npm run build` BEFORE this, never alongside it: `serve` reads
   build/ straight off disk, so a concurrent rebuild serves half-written
   HTML and fails a route at random. `npm test` chains them in order. */
export default defineConfig({
	testDir: 'tests',
	fullyParallel: true,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:4173'
	},
	webServer: {
		/* Plain `serve build` — no --single. `serve` treats that flag as
		   present-means-on regardless of its value, so --single=false
		   still rewrites every route to index.html and every page then
		   answers with the home page. */
		command: 'npx serve build --listen 4173',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
