# Writing and markup

Pages are GitHub-flavoured Markdown. Everything described here also renders on GitHub, so a page read in the repository and the same page on this site say the same thing.

## Code

Fence MoonBit code with `moonbit` (or `mbt`). Interface excerpts can use `mbti`.

```moonbit
pub fn[S, A, B, C] Hom::then(self : Hom[S, A, B], next : Hom[S, B, C]) -> Hom[S, A, C] {
  trust(x => next.apply(self.apply(x)))
}
```

Keep examples small and make sure they compile. Prefer one complete example over several fragments.

## Mathematics

Write mathematics in TeX notation: `$f(x + y) = f(x) + f(y)$` inline and a `$$` block for display.

$$
\operatorname{Hom}(\mathbb{Z}, R) = \{\, \iota_R \,\}
$$

Mathematics is not translated. Use words around it for what needs translating.

## Notes in the margin

Footnotes become margin notes on wide screens and stay footnotes on narrow ones. Use them for remarks a reader may skip: a reference, a historical note, a proof sketch.[^margin]

[^margin]: Like this one. Write the footnote definition right after the paragraph that uses it.

## Admonitions

Use GitHub alerts for the few things a reader must not miss:

> [!NOTE]
> Fixed-width integers wrap on overflow, so they are not the integers.

The kinds are `NOTE`, `TIP`, `IMPORTANT`, `WARNING` and `CAUTION`. Facts that every reader needs belong in the text itself, not in an alert. An optional aside is a plain block quote.

## Tables

Use tables for facts that line up: signatures and meanings, options and defaults. Keep cells short; a cell that needs a paragraph belongs in the text.

## Style

- Write in the present tense and the active voice.
- Use the second person for instructions: "Run `lunadoc update`."
- Name a thing the way the code names it, in code: `Hom::postulate`, not "the postulate function".
- Prefer a sentence to a bullet list when the items depend on each other.
