// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// aunt-mabel-web — Astro 5 on Cloudflare Pages.
//
// output: 'static' is the default for every page. Individual pages opt INTO
// server rendering with `export const prerender = false` in their frontmatter.
// Nothing needs SSR yet — auth is entirely client-side against Supabase — so
// today every page prerenders. The adapter is here so the first page that does
// need SSR (a webhook receiver, a signed redirect) works without a config change.
export default defineConfig({
  // Set to the real domain once DNS is pointed. Used for canonical URLs.
  site: 'https://auntmabel.app',

  output: 'static',
  adapter: cloudflare(),

  // Clean /page URLs (no trailing slash), matching Homer's *.html route names.
  trailingSlash: 'ignore',
});
