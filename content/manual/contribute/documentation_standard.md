# Documentation standard

This standard applies to every Luna Flow repository. It fixes where documentation lives, how it is divided into pages, and which source is authoritative. A repository may add rules of its own in `doc/manual/conventions.md`, but it may not relax these.

## Principles

**Describe what exists.** Pages document the implementation on the current branch: public names, behaviour, and the design decisions behind them. Plans belong in issues, not in the manual.

**English is the source.** Pages are written once, in English. Translations are made from that text through [gettext catalogs](translation.md) and are never edited as copies of a page.

**The interface file is the authority.** For MoonBit packages, `pkg.generated.mbti` defines the public surface. A name that is not in the interface file is not documented as public.

**One page, one purpose.** A page is an API reference, a design note, a tutorial or a guide. It does not mix them.

## Repository layout

```text
doc/
├── conf.json                      title, summary and locales
├── manual/                        English source pages
│   ├── index.md                   overview of the repository
│   ├── conventions.md             optional repository-specific rules
│   ├── <guide>.md                 optional guides (getting_started, architecture, ...)
│   ├── api/<package>.md           one chapter per document type,
│   ├── design/<package>.md        one page per package inside it
│   └── tutorial/<package>.md
├── attachments/                   Typst sources, PDFs and images, shared by all locales
└── locale/
    ├── manual.pot                 generated template, never edited
    ├── zh_CN/LC_MESSAGES/manual.po
    └── ja_JP/LC_MESSAGES/manual.po
```

Nothing else belongs in `doc/`. The retired layout with one directory per language (`doc/en_US`, `doc/zh_CN`, ...) is rejected by `lunadoc check`.

### `conf.json`

```json
{
  "title": "luna-generic",
  "summary": "Algebraic traits and default numeric instances for Luna Flow math packages.",
  "locales": ["zh_CN", "ja_JP"]
}
```

`title` is the repository name as shown in the library. `summary` is one sentence that appears in the library directory; it is translated like any page text. `locales` lists the translations the repository maintains.

### Chapters and packages

The manual is divided by what a reader is looking for, not by where the code lives. Each document type is a chapter, and each documented MoonBit package has one page in every chapter:

| Chapter | Answers | A package page contains |
| --- | --- | --- |
| `api/` | What can I call? | Every public type, trait and function, grouped by purpose, with signatures and semantics. |
| `design/` | Why is it like this? | Goals, constraints, the decisions taken and the alternatives rejected. |
| `tutorial/` | How do I use it? | A task worked from start to finish with small examples that compile. |

The page is named after the package path relative to the source root: the package at `src/core` is documented in `api/core.md`, `design/core.md` and `tutorial/core.md`; a package at `src/backend/dense` in `api/backend/dense.md` and so on. Every documented package has a page in all three chapters.

A repository may add the chapters `conformance/` (what a standard or specification requires and how a package meets it), `performance/` (measurements and their method) and `integration/` (how other packages use one). A chapter may have an `index.md` that introduces it. Other chapters need a rule in `conventions.md`.

### Guides

Pages directly under `manual/` are guides that span packages: `getting_started.md`, `architecture.md`, `verification.md` and similar. Use lowercase file names with underscores between words.

## Page structure

- A page starts with exactly one level-one heading. It is the page title.
- Headings use sentence case: "Design decisions", not "Design Decisions".
- Do not skip heading levels.
- An API page lists each item under a heading named after it, in code: ``## `Hom::then` ``. The first sentence after the heading states what the item does.
- A design page ends with its boundaries: what the package deliberately does not do.
- A tutorial states its goal in the first paragraph and ends with where to go next.

Front matter is optional. When present it may set `title` (when the navigation label should differ from the heading) and `description` (one sentence for search results). Both are translated.

## Links

Link to other pages with relative paths to the Markdown file: `[design](../design/core.md)`, `[overview](../index.md)`. The site turns them into the right route for every language. Link to other repositories with absolute site URLs such as `https://luna-flow.github.io/en/luna-generic/`. Link to source code with a relative path out of `doc/`, for example `../../src/hom.mbt`; the site turns it into a GitHub link.

## Checks

`lunadoc check` fails when:

- `conf.json` or `manual/index.md` is missing;
- the retired per-language layout is present;
- the catalogs do not match the English source;
- a relative link points to a file that does not exist, or leaves the repository;
- a Typst attachment does not compile (with `--compile`).

It warns about fuzzy translations and a missing summary.
