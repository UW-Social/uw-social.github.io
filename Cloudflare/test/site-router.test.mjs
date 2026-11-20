import test from 'node:test';
import assert from 'node:assert/strict';
import { createSiteRouter } from '../src/site-router.mjs';

test('direct page requests load index.html while retaining the public hostname', async () => {
  const paths = ['/events', '/events/abc123?returnTo=%2Fevents', '/clubs/club-1',
    '/forum', '/forums/event-1', '/forum/posts/event-1/post-1', '/login?redirect=%2Fevents',
    '/profile/edit', '/events/abc123/edit', '/score-framework', '/ai-consultant', '/publish', '/admin/imports'];
  for (const path of paths) {
    const worker = createSiteRouter(async request => {
      assert.equal(request.url, 'https://uw-social.com/index.html');
      assert.equal(request.headers.get('if-none-match'), null);
      assert.equal(request.headers.get('if-modified-since'), null);
      assert.equal(request.headers.get('range'), null);
      return new Response('<div id="app"></div>', { headers: { 'Content-Type': 'text/html', ETag: 'shell' } });
    });
    const response = await worker.fetch(new Request(`https://uw-social.com${path}`, {
      headers: { 'if-none-match': 'previous-page', 'if-modified-since': 'yesterday', range: 'bytes=0-5' },
    }));
    assert.equal(response.status, 200);
    assert.match(await response.text(), /id="app"/);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
  }
});

test('assets, APIs, unknown paths and write requests pass through unchanged', async () => {
  const requests = [
    ...['/', '/index.html', '/assets/main.js', '/events/missing.js', '/images/photo.jpg',
      '/api/events', '/api', '/sitemap.xml', '/robots.txt', '/.well-known/test',
      '/not-a-page', '/events/id/unknown'].map(path => new Request(`https://uw-social.com${path}`)),
    new Request('https://uw-social.com/events/id', { method: 'POST', body: 'data' }),
    new Request('https://uw-social.com/events/id', { method: 'OPTIONS' }),
  ];
  for (const request of requests) {
    const originResponse = new Response('origin response', { status: 404 });
    const worker = createSiteRouter(async forwarded => {
      assert.equal(forwarded, request);
      return originResponse;
    });
    assert.equal(await worker.fetch(request), originResponse);
  }
});

test('HEAD stays HEAD and origin failures/redirects are not changed to 200', async () => {
  for (const status of [200, 301, 404, 503]) {
    const worker = createSiteRouter(async request => {
      assert.equal(request.method, 'HEAD');
      assert.equal(request.redirect, 'manual');
      return new Response(null, { status });
    });
    const response = await worker.fetch(new Request('https://uw-social.com/events/123', { method: 'HEAD' }));
    assert.equal(response.status, status);
    assert.equal(await response.text(), '');
  }
});

test('origin network failures are surfaced instead of producing a misleading page', async () => {
  const worker = createSiteRouter(async () => { throw new Error('origin unavailable'); });
  await assert.rejects(worker.fetch(new Request('https://uw-social.com/events/123')), /origin unavailable/);
});
