# Luna-Flow documentation site

This repository builds <https://lunaflow.cn>, the documentation of every Luna-Flow repository, and hosts `lunadoc`, the tool that keeps those docs in shape. The contributor guide that every repository follows is part of the site itself: [content/manual/contribute](content/manual/contribute/index.md).

## How it works

Each repository keeps its manual in `doc/`: English pages in `doc/manual`, gettext catalogs in `doc/locale`, and Typst or other attachments in `doc/attachments`. On every build:

1. `tools/discover-repos.mjs` lists the public, non-fork repositories of the organisation (minus `exclude` in `config/repos.json`).
2. The workflow downloads each repository's `main` branch.
3. `tools/prepare-site.mjs` renders every page in every locale from the English source and the catalog, rewrites links into site routes, compiles Typst attachments into PDFs, and writes the navigation, coverage and redirect data.
4. Astro builds the site, `tools/finalize-site.mjs` writes redirects for the routes of the old site, and Pagefind indexes each language separately.

The site's own pages (home, about, contribute) use the same layout in `content/`, so the interface strings are translated through `content/locale` like everything else.

## Layout

| Path | Contents |
| --- | --- |
| `config/locales.json` | Locales: gettext id, URL segment, `lang` and display name |
| `config/repos.json` | Organisation, branch, excluded repositories, library categories |
| `content/` | The site's own documentation and interface strings, in the standard layout |
| `src/` | Astro pages, layouts, components, Markdown plugins and styles |
| `tools/lunadoc/` | The documentation tool: extraction, `msgmerge`-style updates, rendering, checks, Typst builds, migration |
| `tools/prepare-site.mjs` | Collects repositories into `.generated/` and `public/attachments/` |
| `.github/workflows/deploy.yml` | Builds and deploys on push, daily, manually and on `repository_dispatch` (`docs-updated`) |
| `.github/workflows/check-docs.yml` | Reusable check that every repository calls from its own `docs.yml` |

## Development

```sh
npm ci
npm run dev          # uses every sibling directory with doc/conf.json
npm run build        # full build including redirects and the search index
npm run preview
npm test             # lunadoc unit tests
```

A local build needs `typst` on the `PATH` to compile attachments; without it the build still succeeds and reports the attachments it skipped.

To reproduce the deployed set of repositories, generate a manifest and pass it in:

```sh
GH_TOKEN=... node tools/discover-repos.mjs ../workspace/repositories.json
LUNAFLOW_REPO_ROOT=../workspace LUNAFLOW_REPO_MANIFEST=../workspace/repositories.json npm run build
```

Repositories that have not adopted the `doc/conf.json` layout are skipped with a warning.

## Design

Text is set for reading: a serif for Latin prose and for headings, a sans for Chinese and Japanese body text and for the interface, IBM Plex Mono for code. The text column keeps one measure; on wide screens a margin column carries the table of contents and footnotes as margin notes. Grouping comes from space and hairline rules; the only accent is the Luna-Flow magenta, used for the current location, focus and links under the pointer. Tokens are in `src/styles/tokens.css`.
