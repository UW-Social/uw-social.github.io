const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/siteUrls.ts'), 'utf8')
  .replace('import.meta.env.VITE_URL', 'undefined');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const mod = { exports: {} };
new Function('exports', outputText)(mod.exports);
const { canonicalUrl, legacyRouteUrl } = mod.exports;

test('legacy bookmarks retain detail IDs, queries, page anchors and deployment bases', () => {
  assert.equal(legacyRouteUrl('https://uw-social.com/#/events/123?returnTo=%2Fevents#comments'),
    '/events/123?returnTo=%2Fevents#comments');
  assert.equal(legacyRouteUrl('https://example.com/test/#/clubs/456'), '/test/clubs/456');
  assert.equal(legacyRouteUrl('https://example.com/index.html?utm_source=email#/events/123?q=meetup'),
    '/events/123?q=meetup&utm_source=email');
  assert.equal(legacyRouteUrl('https://example.com/?q=outer#/events?q=inner'), '/events?q=inner');
  assert.equal(legacyRouteUrl('https://example.com/#/'), '/');
});

test('normal URLs, in-page anchors and authentication hashes are left alone', () => {
  for (const url of ['https://example.com/events/123', 'https://example.com/#comments',
    'https://example.com/#access_token=abc', 'https://example.com/#//other.example']) {
    assert.equal(legacyRouteUrl(url), null);
  }
});

test('canonical URLs remove navigation/search parameters and hashes, preserving deployment bases', () => {
  assert.equal(canonicalUrl('/events/123?returnTo=%2Fevents#comments'), 'https://uw-social.com/events/123');
  assert.equal(canonicalUrl('/clubs/456', 'example.com/test'), 'https://example.com/test/clubs/456');
  assert.equal(canonicalUrl('/', 'https://example.com/'), 'https://example.com/');
});
