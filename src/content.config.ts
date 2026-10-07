import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// Pages rendered by tools/prepare-site.mjs. Each file is <route>/index.md, so
// the id is the route without slashes at either end.
const docs = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './.generated/pages',
    generateId: ({ entry }) => entry.replace(/(^|\/)index\.md$/, ''),
  }),
});

export const collections = { docs };
