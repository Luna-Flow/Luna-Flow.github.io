// Heading ids come from the English source (front matter `headings`), so an
// anchor is the same in every language and survives the language switcher.
import { visit } from 'unist-util-visit';

export default function rehypeHeadingIds() {
  return (tree, file) => {
    const slugs = file.data?.astro?.frontmatter?.headings;
    if (!Array.isArray(slugs)) return;
    let index = 0;
    visit(tree, 'element', (node) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      const slug = slugs[index];
      index += 1;
      if (slug) node.properties.id = slug;
    });
  };
}
