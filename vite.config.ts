import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';

/* ============================================================
   2026 gallery manifest.

   The gallery is folder-driven: Iain drops photos into
   static/img/gallery/2026/<competition>/<division>/ and they
   appear, with no code edit. This plugin walks that tree at
   build time and hands the result to src/lib/data/gallery.ts
   through a virtual module.

   Why a plugin and not import.meta.glob: glob only sees project
   source, never static/. Moving the photos into src/lib/assets/
   to make glob work would put them through Vite's asset
   pipeline — hashing and copying every file on every build, for
   an archive that runs to thousands of images — and would break
   the rule that static/img/ is source material whose absence
   fails the build loudly.

   ⚠️ eslint.config.js imports THIS FILE to hand svelteConfig to
   the Svelte parser, so `npm run lint` executes everything at
   module scope here. Every fs call must therefore stay inside
   load(); a readdirSync at the top level turns a missing folder
   into a lint failure that reads as unrelated to the gallery.
   ============================================================ */
const GALLERY_ROOT = fileURLToPath(new URL('./static/img/gallery/2026', import.meta.url));

/* Kept in step with COMPETITIONS in src/lib/data/gallery.ts, which is the
   canonical list — it has to be hand-written there because the tabs must
   render with correct labels and order when no folders exist at all. Here we
   only need to know which directory names are real, so that a stray
   Thumbs.db or a mistyped `juniour/` is skipped rather than inventing a
   division nobody can compete in. */
const GALLERY_TREE: Record<string, readonly string[]> = {
	'hhi-open-division': ['junior', 'varsity', 'adult', 'parents', 'special-crews'],
	'netherlands-hhdc': ['junior', 'varsity', 'adult', 'jv-megacrew', 'minicrew', 'megacrew']
};

const PHOTO_RE = /\.(jpe?g|png|webp)$/i;

interface ManifestRecord {
	competition: string;
	division: string;
	src: string;
}

/* Numeric collation, because a camera dump is exactly the case that breaks a
   plain sort: "IMG_10.jpg" < "IMG_2.jpg" byte-wise, which reverses the order
   the photos were actually taken in. */
const byName = new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare;

function readGallery(warn: (msg: string) => void): ManifestRecord[] {
	if (!existsSync(GALLERY_ROOT)) return [];

	const records: ManifestRecord[] = [];

	for (const compEntry of readdirSync(GALLERY_ROOT, { withFileTypes: true })) {
		if (!compEntry.isDirectory()) continue;
		const divisions = GALLERY_TREE[compEntry.name];
		if (!divisions) {
			warn(`unknown competition folder "${compEntry.name}" — skipped`);
			continue;
		}

		const compDir = `${GALLERY_ROOT}/${compEntry.name}`;
		for (const divEntry of readdirSync(compDir, { withFileTypes: true })) {
			if (!divEntry.isDirectory()) continue;
			if (!divisions.includes(divEntry.name)) {
				warn(`unknown division folder "${compEntry.name}/${divEntry.name}" — skipped`);
				continue;
			}

			const files = readdirSync(`${compDir}/${divEntry.name}`, { withFileTypes: true })
				.filter((f) => f.isFile() && PHOTO_RE.test(f.name))
				.map((f) => f.name)
				.sort(byName);

			for (const name of files) {
				records.push({
					competition: compEntry.name,
					division: divEntry.name,
					/* A path, not a URL: gallery.ts runs it through withBase() so the
					   GitHub Pages sub-path build resolves. */
					src: `/img/gallery/2026/${compEntry.name}/${divEntry.name}/${name}`
				});
			}
		}
	}

	return records;
}

function galleryManifest(): Plugin {
	const virtualId = 'virtual:gallery-manifest';
	const resolvedId = '\0' + virtualId;

	return {
		name: 'hhi-gallery-manifest',
		resolveId(id) {
			return id === virtualId ? resolvedId : null;
		},
		load(id) {
			if (id !== resolvedId) return null;
			const records = readGallery((msg) => this.warn(msg));
			return `export const MANIFEST = ${JSON.stringify(records)};\n`;
		},
		/* Dropping a photo in should not need a dev-server restart. The folder may
		   not exist yet, and chokidar is happy to watch a path that appears later. */
		configureServer(server: ViteDevServer) {
			server.watcher.add(GALLERY_ROOT);
			server.watcher.on('all', (_event, path) => {
				if (!path.startsWith(GALLERY_ROOT)) return;
				const mod = server.moduleGraph.getModuleById(resolvedId);
				if (!mod) return;
				server.moduleGraph.invalidateModule(mod);
				server.ws.send({ type: 'full-reload' });
			});
		}
	};
}

/* ============================================================
   sitemap.xml

   robots.txt advertises a sitemap, so one has to exist — a
   Sitemap: line pointing at a 404 is worse than no line at all.

   The route list is READ FROM DISK, not hand-written, for the
   same reason the gallery manifest is: a hardcoded list goes
   stale the first time someone adds a route, and nothing fails
   to tell you. Every route here is prerendered (+layout.js sets
   prerender = true), so "directory under src/routes containing
   a +page.svelte" is exactly the set of real public URLs.

   Two things this deliberately does NOT do:
   - No <lastmod>. A build timestamp would claim every page
     changed on every deploy, which is a lie crawlers learn to
     ignore. No date is better than a wrong one.
   - No <priority>/<changefreq>. Google has ignored both for
     years; they are noise.

   ⚠️ Absolute URLs, built from SITE_URL. The sitemap spec
   requires them, and BASE_PATH is deliberately NOT applied: the
   GitHub Pages preview is noindex staging whose robots.txt is
   overwritten to Disallow: / by the workflow, so a sitemap
   describing the production domain is never consulted there.
   ============================================================ */
const ROUTES_ROOT = fileURLToPath(new URL('./src/routes', import.meta.url));

/** Canonical origin. Mirrors SITE_URL in src/lib/config.ts, which cannot be
 *  imported here — this file is loaded by eslint.config.js, and pulling in a
 *  .ts module from src/ at config-load time is exactly the kind of side
 *  effect the gallery plugin's warning above is about. Change both together. */
const SITEMAP_ORIGIN = 'https://hhi-netherlands.com';

function readRoutes(): string[] {
	/* '' is the home route: src/routes/+page.svelte itself. */
	const found = existsSync(join(ROUTES_ROOT, '+page.svelte')) ? [''] : [];

	if (existsSync(ROUTES_ROOT)) {
		for (const entry of readdirSync(ROUTES_ROOT, { withFileTypes: true })) {
			/* Skip (groups), [params] and anything without a page. A dynamic
			   segment has no single URL to list, and there are none today. */
			if (!entry.isDirectory()) continue;
			if (entry.name.startsWith('(') || entry.name.startsWith('[')) continue;
			if (!existsSync(join(ROUTES_ROOT, entry.name, '+page.svelte'))) continue;
			found.push(entry.name);
		}
	}

	return found.sort();
}

function sitemap(): Plugin {
	return {
		name: 'hhi-sitemap',
		apply: 'build',
		/* enforce:'post' + closeBundle is the ONLY combination that works here,
		   and getting it wrong fails silently in a way worth spelling out.

		   adapter-static runs inside SvelteKit's own closeBundle and populates
		   build/ from scratch at that point. Writing the sitemap any earlier —
		   generateBundle, or closeBundle without enforce:'post' — succeeds,
		   logs happily, and is then wiped by the adapter. The file simply is
		   not there afterwards, with nothing in the build log to say so.
		   enforce:'post' puts this plugin last in the hook order, so it writes
		   into the finished build/ rather than one about to be replaced. */
		enforce: 'post',
		closeBundle() {
			/* Both the SSR and client passes reach this hook. build/ only
			   exists once the adapter has finished, so this guard skips the
			   pass that runs too early instead of writing a doomed file. */
			const out = fileURLToPath(new URL('./build', import.meta.url));
			if (!existsSync(out)) return;

			const routes = readRoutes();
			const urls = routes
				.map((r) => `\t<url>\n\t\t<loc>${SITEMAP_ORIGIN}/${r}</loc>\n\t</url>`)
				.join('\n');

			const xml =
				'<?xml version="1.0" encoding="UTF-8"?>\n' +
				'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
				urls +
				'\n</urlset>\n';

			writeFileSync(join(out, 'sitemap.xml'), xml, 'utf-8');
			this.info(`sitemap.xml written with ${routes.length} URLs`);
		}
	};
}

/* GitHub Pages serves a project repo from a sub-path
   (/HHI-Netherlands-Website), which would 404 every root-relative link.
   BASE_PATH tells Kit about it and it rewrites internal hrefs at build
   time, so no link in the source has to know where the site is hosted.

   Unset everywhere else, which is what the real host wants — so this is
   a preview affordance, not something to undo when hosting is settled. */
const raw = process.env.BASE_PATH ?? '';

/* Kit types base as '' | `/${string}` and rejects a trailing slash, so a
   malformed BASE_PATH should fail loudly here rather than produce a build
   whose links are all subtly wrong. */
if (raw && (!raw.startsWith('/') || raw.endsWith('/'))) {
	throw new Error(`BASE_PATH must start with "/" and not end with one — got "${raw}"`);
}
const base = raw as '' | `/${string}`;

export default defineConfig({
	plugins: [
		galleryManifest(),
		sitemap(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter(),
			paths: { base },

			/* Pages has no SPA fallback and no server-side redirects: a
			   directory URL must resolve to a real file on disk. */
			prerender: { entries: ['*'] }
		})
	]
});
