# Contributing to the documentation

Luna Flow documentation lives next to the code it describes. Each repository keeps its manual in `doc/`, written in English, and keeps translations as gettext catalogs beside it. This site collects every repository on each build, so a change merged into `main` appears here without any change to the site itself.

The same rules apply to every repository:

- [Documentation standard](documentation_standard.md): where files go and what each page contains.
- [Writing and markup](writing.md): headings, code, mathematics, notes and admonitions.
- [Attachments](attachments.md): Typst documents, PDFs and images.
- [Translation](translation.md): how the gettext workflow keeps every language in step with English.

## Tools

All commands come from `lunadoc`, which lives in the site repository. Clone it next to the repository you are working on:

```sh
git clone https://github.com/Luna-Flow/Luna-Flow.github.io.git
npm ci --prefix Luna-Flow.github.io
```

Then, from your repository:

```sh
node ../Luna-Flow.github.io/tools/lunadoc/cli.mjs update      # refresh catalogs after editing English
node ../Luna-Flow.github.io/tools/lunadoc/cli.mjs status      # translation coverage
node ../Luna-Flow.github.io/tools/lunadoc/cli.mjs check --compile
```

`check` is what continuous integration runs. A pull request that changes `doc/manual` must also contain the updated catalogs produced by `update`.

## Previewing the site

Run the site with your repository next to it:

```sh
cd Luna-Flow.github.io
npm run dev
```

Without a repository manifest the build includes every sibling directory that has `doc/conf.json`, so a local preview shows your unpublished changes.
