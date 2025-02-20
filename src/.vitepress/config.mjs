import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Luna Flow",
	description: "A MoonBit\nScientific Computing Ecosystem.",
	markdown: {
		math: true,
	},
	themeConfig: {
		logo: "/logo.svg",
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Home", link: "/" },
			{ text: "Examples", link: "/markdown-examples" },
		],

		sidebar: [
			{
				text: "Examples",
				items: [
					{ text: "Markdown Examples", link: "/markdown-examples" },
					{ text: "Runtime API Examples", link: "/api-examples" },
				],
			},
		],

		socialLinks: [
			{ icon: "github", link: "https://github.com/luna-flow" },
		],

		footer: {
			message: "Released under the MIT License.",
			copyright: "Copyright © 2025-present Luna Flow",
		},

		search: {
			provider: "local",
		},
	},
});
