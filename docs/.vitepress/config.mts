import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	srcDir: "./pages",
	title: "Luna Flow",
	vite: {
		publicDir: "../.vitepress/public",
	},
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
						link: "/linear-algebra/index",
					},
					{
						text: "luna-generic",
						link: "/luna-generic/index",
					},
					{
						text: "luna-poly",
						link: "/luna-poly/index",
					},
				],
			},
		],

		sidebar: [
			{
				text: "Documentation",
				items: [
					{
						text: "linear-algebra",
						items: [
							{ text: "Introduction", link: "/linear-algebra/index" },
							{ text: "API reference", link: "/linear-algebra/api" },
						],
					},
					{
						text: "luna-generic",
						items: [
							{ text: "Introduction", link: "/luna-generic/index" },
							{ text: "API reference", link: "/luna-generic/api" },
						],
					},
					{
						text: "luna-poly",
						items: [
							{ text: "Introduction", link: "/luna-poly/index" },
							{ text: "API reference", link: "/luna-poly/api" },
						],
					},
				],
			},
		],

		socialLinks: [{ icon: "github", link: "https://github.com/Luna-Flow" }],
		search: {
			provider: "local",
		},
	},
});