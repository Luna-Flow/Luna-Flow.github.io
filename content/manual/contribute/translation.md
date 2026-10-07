# Translation

Luna Flow translates its documentation the way the Blender manual does: English pages are the only source, and every other language is a gettext catalog of translated messages. A page in Chinese or Japanese is generated from the English page and the catalog when the site is built.

This has three consequences:

- A language can never fall out of structure with English. Pages, headings, code and links come from one source.
- An untranslated or outdated passage is shown in English instead of disappearing or being wrong. The page says how much of it is translated.
- The site knows the coverage of every page and every repository, and shows it in the library.

## Messages

`lunadoc` splits every page into messages: headings, paragraphs, list items, table cells, and the `title` and `description` front matter keys. Code blocks, display mathematics and raw HTML are never messages; they appear in every language exactly as written in English.

A paragraph that wraps over several lines is one message. Re-wrapping English text does not change its message, so it does not invalidate translations.

## The workflow

1. Edit the English pages in `doc/manual`.
2. Run `lunadoc update`. It regenerates `doc/locale/manual.pot` and merges it into every `manual.po`.
3. Commit the pages and the catalogs together.

`update` behaves like GNU `msgmerge`:

- A message whose English text is unchanged keeps its translation.
- A message whose English text changed takes the translation of the most similar old message and is marked `fuzzy`. The previous English text is kept in a `#| msgid` comment so a translator can see what changed.
- A translation whose message disappeared is kept as an obsolete entry (`#~`) at the end of the catalog, where `update` can recover it later.

Fuzzy translations are not shown on the site. They count as untranslated until a translator reviews them and removes the `fuzzy` flag.

## Translating

Open `doc/locale/<locale>/LC_MESSAGES/manual.po` in a text editor or a gettext editor such as Poedit, and fill in `msgstr` for each `msgid`:

```po
#: manual/core/api.md:12
msgid "The `Ring` trait models rings with $0$ and $1$."
msgstr "`Ring` trait 刻画带有 $0$ 与 $1$ 的环。"
```

When translating:

- Keep inline code, mathematics and link destinations exactly as in English. Translate link text.
- Keep Markdown markup: emphasis, inline code and links must still be balanced.
- Keep a GitHub alert marker such as `[!NOTE]` at the start of the message.
- Do not translate identifiers, even in prose.
- Leave `msgstr` empty rather than guessing. An empty message falls back to English.

Check the result with `lunadoc status --pages` and preview it with the site.

## Locales

Locale names follow gettext: `zh_CN` for Simplified Chinese and `ja_JP` for Japanese. They appear in `conf.json`, in the catalog paths and in `config/locales.json` of the site, which also gives each locale its URL segment and display name. Adding a language to the site means adding it there; adding it to a repository means listing it in `conf.json` and running `update`.
