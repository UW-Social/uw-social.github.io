const DEFAULT_SITE = 'https://uw-social.com';

export function canonicalUrl(path: string, site = import.meta.env.VITE_URL || DEFAULT_SITE): string {
  const base = site.startsWith('http') ? site : `https://${site}`;
  const url = new URL(base.replace(/\/$/, '') + '/' + path.replace(/^\//, ''));
  url.search = '';
  url.hash = '';
  return url.href;
}

// Convert only old router hashes, not normal anchors or OAuth callback hashes.
// Running before router creation preserves queries, anchors and deployment bases.
export function legacyRouteUrl(href: string): string | null {
  const url = new URL(href);
  if (!url.hash.startsWith('#/') || url.hash.startsWith('#//')) return null;
  const base = url.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  const target = new URL(`${url.origin}${base}${url.hash.slice(1)}`);
  for (const [key, value] of url.searchParams) {
    if (!target.searchParams.has(key)) target.searchParams.append(key, value);
  }
  return target.pathname + target.search + target.hash;
}
