/* The 2026 gallery manifest is generated at build time by the
   hhi-gallery-manifest plugin in vite.config.ts, which walks
   static/img/gallery/2026/. It has no file on disk for TypeScript to
   resolve, so its shape is declared here.

   Keep this in step with ManifestRecord in vite.config.ts — they describe
   the same object from opposite sides of the virtual module, and nothing
   checks them against each other. */
declare module 'virtual:gallery-manifest' {
	export const MANIFEST: {
		/** Competition folder slug, e.g. 'hhi-open-division'. */
		competition: string;
		/** Division folder slug, e.g. 'jv-megacrew'. */
		division: string;
		/** Root-relative path under static/. NOT yet base-prefixed. */
		src: string;
	}[];
}
