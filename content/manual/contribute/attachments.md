# Attachments

Proofs, specifications and longer derivations are better typeset than written in Markdown. Luna Flow keeps them as Typst documents in `doc/attachments/`, compiles them to PDF when the site is built, and shows them inside the page in a reader that opens on demand.

## Where files go

Everything in `doc/attachments/` is shared by all languages.

| File | Published as |
| --- | --- |
| `<name>.typ` | `<name>.pdf` |
| `<name>/main.typ` | `<name>.pdf`, for a document split over several files |
| `<name>.<locale>.typ` or `<name>/main.<locale>.typ` | the version of `<name>.pdf` for that locale |
| any other file | the file itself |

Commit the Typst source, not the PDF. Continuous integration compiles every document on each build, so the published PDF always matches its source. A file that is not Typst, such as a figure or a PDF produced by another tool, is published unchanged.

Typst documents are compiled with `doc/attachments/` as the project root, so they may import shared templates from it. Builds have the Typst default fonts and the Noto CJK fonts.

### Names

Use lowercase names with underscores between words. Images follow the convention of the Blender manual: the name starts with the path of the page that uses it, with `_` between path parts and `-` inside a part, for example `core_api_hom-composition.svg` for a figure on `core/api.md`. A flat directory with such names shows at a glance which page each file belongs to.

## Embedding a document

Link to the Typst source. When the link is the only content of its paragraph, the page shows a reader that can be expanded in place:

```md
[Formal specification of the QED kernel](../attachments/qed_formal_spec.typ)
```

Add `#page=12` to open the document at a page. A link inside a sentence stays a link and opens the PDF directly.

The reader shows the title from the link text, renders pages on demand, and offers zoom, opening in a new tab and download. On GitHub the same link opens the Typst source, so the page remains usable there.

When a document has locale variants, every language links to the same name and the site picks the variant of the page's locale, falling back to the version without a locale suffix.

## Images

Embed images with Markdown image syntax and a description:

```md
![Composition of two ring homomorphisms](../attachments/core_api_hom-composition.svg)
```

Prefer SVG for diagrams and PNG for screenshots. Give every image alternative text; it is translated with the page.
