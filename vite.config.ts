import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

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
