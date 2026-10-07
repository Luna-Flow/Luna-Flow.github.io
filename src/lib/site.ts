import data from '../../.generated/site.json';

export interface Locale {
  id: string;
  path: string;
  lang: string;
  label: string;
}

export interface NavItem {
  label: string;
  url?: string;
  code?: boolean;
  overview?: boolean;
  chapter?: boolean;
  items?: NavItem[];
}

export interface Repo {
  id: string;
  title: string;
  repo: string;
  summary: Record<string, string>;
  coverage: Record<string, number>;
  nav: Record<string, NavItem[]>;
  pages: number;
}

export const site = data as unknown as {
  locales: Locale[];
  categories: { id: string; repos: string[] }[];
  repos: Record<string, Repo>;
  site: Repo;
  strings: Record<string, Record<string, string>>;
  pages: Record<string, { title: string; repo: string }>;
  redirects: { from: string; to: string }[];
};

export const locales = site.locales;
export const sourceLocale = locales[0];

export function localeOf(path: string): Locale {
  return locales.find((locale) => locale.path === path) ?? sourceLocale;
}

export function t(lang: string, key: string, vars: Record<string, string | number> = {}): string {
  const text = site.strings[lang]?.[key] ?? site.strings[sourceLocale.path]?.[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}

export function percent(value: number, lang: string): string {
  return new Intl.NumberFormat(localeOf(lang).lang, { style: 'percent', maximumFractionDigits: 0 }).format(value);
}

// The same page in another language: only the first path segment differs.
export function switchUrl(url: string, target: Locale): string {
  return url.replace(/^\/[^/]+\//, `/${target.path}/`);
}

// Pages in reading order. Package pages carry their chapter, so the pager
// can say "API · kernel" instead of a bare package name.
export function flatten(items: NavItem[], chapter = ''): (NavItem & { chapterLabel?: string })[] {
  return items.flatMap((item) => {
    const inner = item.chapter ? item.label : chapter;
    const self = item.url ? [{ ...item, chapterLabel: item.chapter ? '' : chapter }] : [];
    return [...self, ...flatten(item.items ?? [], inner)];
  });
}

export const github = 'https://github.com/Luna-Flow';
