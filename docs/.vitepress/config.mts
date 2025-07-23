import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	srcDir: "./.vitepress/public",

	title: "Luna Flow",
	description: "A MoonBitScientific Computing Ecosystem.",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		logo: "/logo.svg",
		nav: [
			{ text: "Home", link: "/" },
			{ text: "Examples", link: "/api/index" },
			{
				text: "Documentation",
				items: [
					{
						text: "linear-algebra",
						items: [
							{ text: "Introduction", link: "/luna-generic/index" },
							{ text: "Section B Item B", link: "..." },
						],
					},
					{
						text: "luna-generic",
						items: [
							{ text: "Section A Item A", link: "..." },
							{ text: "Section B Item B", link: "..." },
						],
					},
					{
						text: "luna-poly",
						items: [
							{ text: "Section A Item A", link: "..." },
							{ text: "Section B Item B", link: "..." },
						],
					},
				],
			},
		],

		sidebar: [
			{
				text: "Examples",
				items: [
					{ text: "calculus-numerical", link: "/api/calculus-numerical" },
					{ text: "Runtime API Examples", link: "/api-examples" },
				],
			},
		],

		socialLinks: [{ icon: "github", link: "https://github.com/Luna-Flow" }],
		search: {
			provider: "local",
		},
	},
});