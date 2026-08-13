import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './vite.config.ts';

/* eslint-config-prettier is last on purpose: it switches off the
   stylistic rules that would otherwise fight Prettier over the same
   lines. Formatting is Prettier's job, correctness is ESLint's. */
export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'node_modules/', 'test-results/', 'screenshots/', 'static/']
	},

	/* Four recommended Svelte rules are switched off deliberately. Each was
	   reviewed against the actual code when the linter was installed in
	   Phase 7 — these are not "fix later" suppressions.

	   no-navigation-without-resolve — wants Kit's resolve() on every href.
	   The base path is already handled by withBase() in config.ts, which is
	   what makes the GitHub Pages sub-path build work; the rule would have us
	   re-plumb a solved problem in 28 places.

	   no-at-html-tags — PageHero renders {@html} for the hero copy, whose
	   markup (<br>, <span class="accent">) is hardcoded in each page's source.
	   No user input reaches it: the site is static and has no user content.

	   prefer-svelte-reactivity — the broken-image Sets are reassigned
	   (broken = new Set(broken)) precisely to trigger reactivity, which is
	   correct; SvelteSet would be a heavier way to do what already works.

	   no-dom-manipulating — StageFloor appends the WebGL canvas, which is the
	   only way three.js can mount. It is disposed on destroy. */
	{
		rules: {
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/no-at-html-tags': 'off',
			'svelte/prefer-svelte-reactivity': 'off',
			'svelte/no-dom-manipulating': 'off'
		}
	},

	...svelte.configs.prettier
);
