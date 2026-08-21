import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { existsSync, readdirSync } from 'node:fs';
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
