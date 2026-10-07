import katex from 'katex';

// Minimal inline rendering for UI strings: `code`, $math$ and **strong**.
export function renderInline(text: string): string {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .split(/(\$[^$]+\$|`[^`]+`)/g)
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        return katex.renderToString(part.slice(1, -1), { throwOnError: false });
      }
      if (part.startsWith('`') && part.endsWith('`')) return `<code>${escape(part.slice(1, -1))}</code>`;
      return escape(part).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    })
    .join('');
}
