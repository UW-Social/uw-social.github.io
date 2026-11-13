import test from 'node:test';
import assert from 'node:assert/strict';
import { createImportService, normalizeTrumba, plainText } from '../src/event-imports.mjs';
import { createWorker } from '../src/index.mjs';
import { encodeValue, decodeValue, ImportError } from '../src/firestore.mjs';
import { framework } from '../src/event-scoring.mjs';

const now = Date.parse('2026-11-05T12:00:00Z');
const raw = {
  eventID: 123, title: 'Research &amp; Engineering', description: '<p>A public talk.</p>',
  location: '<a href="https://example.com">ECE 105</a>',
  startDateTime: '2026-11-10T15:00:00', endDateTime: '2026-11-10T16:00:00',
  startTimeZoneOffset: '-0800', endTimeZoneOffset: '-0800', customFields: [],
};
function memoryStore() {
  const docs = new Map(); let version = 0;
  return {
    docs,
    async get(path) { return structuredClone(docs.get(path) || null); },
    async list(collection) { return { items: [...docs.entries()].filter(([path]) => path.startsWith(`${collection}/`)).map(([path, doc]) => ({ ...structuredClone(doc), id: path.split('/').at(-1) })), nextPageToken: '' }; },
    async commit(writes) {
      for (const w of writes) {
        const current = docs.get(w.path);
        if (w.version ? current?.version !== w.version : !!current) throw new ImportError(409, 'stale');
      }
      for (const w of writes) docs.set(w.path, { data: structuredClone(w.data), version: String(++version) });
    },
  };
}
function setup(events = [raw]) {
  const store = memoryStore(); let aiCalls = 0;
  const env = { IMPORT_ORGANIZER_UID: 'editor', APP_RATE_LIMITER: { limit: async () => ({ success: true }) }, AI: { run: async () => {
    aiCalls++;
    const category = framework.categories.find(item => item.id === 'growth');
    return { response: {
      evaluationCategory: 'growth', classificationReason: 'A research talk.',
      categoryEvaluations: [{ category: 'growth', dimensions: Object.fromEntries(category.dimensions.map(dimension => [dimension.code, {
        criteria: Object.fromEntries(dimension.criteria.map(criterion => [criterion.id, { rating: 2, evidence: 'Agenda describes a public research talk.' }])),
      }])) }],
      sentence: 'Public research talk.', confidence: 'low', confidenceExplanation: 'Limited detail.',
      bestFor: 'Students.', scoringBasis: 'Research talk agenda.', limitations: 'Depth is unknown.',
    } };
  } } };
  const service = createImportService(env, { store, now: () => now, fetcher: async () => Response.json(events) });
  return { service, store, env, events, aiCalls: () => aiCalls };
}
async function pending(app) {
  await app.service.crawl('ece', 'admin');
  return (await app.service.list()).items[0];
}

test('Trumba parsing uses explicit offsets across DST and strips HTML as text', () => {
  const event = normalizeTrumba(raw, 'ece').event;
  assert.equal(event.startTime, '2026-11-10T23:00:00.000Z');
  assert.equal(event.title, 'Research & Engineering');
  assert.equal(event.location, 'ECE 105');
  assert.equal(normalizeTrumba({ ...raw, startDateTime: '2026-10-30T15:00:00', startTimeZoneOffset: '-0700' }, 'ece').event.startTime, '2026-10-30T22:00:00.000Z');
  assert.equal(plainText('<script>bad()</script><b>Hello</b><br>&#160;world'), 'Hello\n world');
  assert.equal(normalizeTrumba({ ...raw, canceled: true }, 'ece'), null);
});

test('crawl stages future events, filters ended/cancelled events, and never invokes AI or publishes', async () => {
  const app = setup([raw, { ...raw, eventID: 124, canceled: true }, { ...raw, eventID: 125, startDateTime: '2026-01-01T15:00:00', endDateTime: '2026-01-01T16:00:00' }]);
  const draft = await pending(app);
  assert.equal(draft.status, 'pending'); assert.deepEqual(draft.issues, []);
  assert.equal(app.aiCalls(), 0);
  assert.equal([...app.store.docs.keys()].some(path => path.startsWith('events/')), false);
  const rerun = await app.service.crawl('ece', 'admin');
  assert.equal(rerun.imported, 0); assert.equal(rerun.skipped, 1);
});

test('calendar fetch uses Workers-compatible redirect handling and does not follow redirects', async () => {
  const store = memoryStore();
  let calls = 0;
  const service = createImportService({}, { store, now: () => now, fetcher: async (_url, init) => {
    calls++;
    // Mirror Workers: unlike Node, it rejects redirect: "error" immediately.
    if (!['manual', 'follow'].includes(init.redirect)) throw new TypeError('Invalid redirect value');
    assert.equal(init.redirect, 'manual');
    return new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example/feed' } });
  } });
  await assert.rejects(service.crawl('ece', 'admin'), error => error.status === 502 && /redirected unexpectedly/.test(error.message));
  assert.equal(calls, 1);
  assert.equal((await store.list('eventCandidates')).items.length, 0);
});

test('network failures are recorded as actionable calendar errors', async () => {
  const store = memoryStore();
  const service = createImportService({}, { store, fetcher: async () => { throw new TypeError('network failure'); } });
  await assert.rejects(service.crawl('ece', 'admin'), error => error.status === 502 && /connect to the calendar source/.test(error.message));
  assert.match((await store.list('crawlRuns')).items[0].data.error, /connect to the calendar source/);
});

test('rejected identical content stays rejected; changed source reopens a draft', async () => {
  const app = setup(); const draft = await pending(app);
  await app.service.review(draft.id, draft.version, 'reject', null, 'admin');
  await app.service.crawl('ece', 'admin');
  assert.equal((await app.service.list()).items[0].status, 'rejected');
  app.events[0] = { ...raw, title: 'Changed title' };
  await app.service.crawl('ece', 'admin');
  assert.equal((await app.service.list()).items[0].status, 'pending');
});

test('approval evaluates edited content and atomically publishes once; stale decisions fail', async () => {
  const app = setup(); const draft = await pending(app);
  const event = { ...draft.event, title: 'Edited title' };
  await assert.rejects(app.service.review(draft.id, 'stale', 'approve', event, 'admin'), { status: 409 });
  const result = await app.service.review(draft.id, draft.version, 'approve', event, 'admin');
  const saved = await app.store.get(`events/${result.eventId}`);
  assert.equal(saved.data.title, 'Edited title');
  assert.equal(saved.data.organizerId, 'editor');
  assert.equal(saved.data.schedule.startDatetime, event.startTime);
  assert.ok(saved.data.review.score100);
  assert.equal((await app.service.review(draft.id, draft.version, 'approve', event, 'admin')).eventId, result.eventId);
  assert.equal(app.aiCalls(), 1);
});

test('AI failure and missing required fields never publish', async () => {
  const app = setup(); const draft = await pending(app);
  await assert.rejects(app.service.review(draft.id, draft.version, 'approve', { ...draft.event, location: '' }, 'admin'), { status: 400 });
  app.env.AI.run = async () => { throw new Error('provider error'); };
  await assert.rejects(app.service.review(draft.id, draft.version, 'approve', draft.event, 'admin'), { status: 503 });
  assert.equal((await app.service.list()).items[0].status, 'pending');
  assert.equal([...app.store.docs.keys()].some(path => path.startsWith('events/')), false);
});

test('same Trumba event in ECE and Foster produces one draft', async () => {
  const app = setup(); await pending(app);
  await app.service.crawl('foster', 'admin');
  assert.equal((await app.service.list()).items.length, 1);
});

test('crawl cursor advances beyond unchanged first batch', async () => {
  const app = setup(Array.from({ length: 25 }, (_, i) => ({ ...raw, eventID: i + 1 })));
  assert.equal((await app.service.crawl('ece', 'admin')).imported, 20);
  assert.equal((await app.service.crawl('ece', 'admin')).imported, 5);
  assert.equal((await app.service.list()).items.length, 25);
});

test('source change updates existing published event while preserving participants', async () => {
  const app = setup(); let draft = await pending(app);
  const { eventId } = await app.service.review(draft.id, draft.version, 'approve', draft.event, 'admin');
  const saved = await app.store.get(`events/${eventId}`);
  await app.store.commit([{ path: `events/${eventId}`, version: saved.version, data: { ...saved.data, participants: ['attendee'] } }]);
  app.events[0] = { ...raw, title: 'Updated source' };
  await app.service.crawl('ece', 'admin'); draft = (await app.service.list()).items[0];
  assert.equal(draft.publishedEventId, eventId);
  await app.service.review(draft.id, draft.version, 'approve', draft.event, 'admin');
  assert.deepEqual((await app.store.get(`events/${eventId}`)).data.participants, ['attendee']);
});

test('import API requires verified admin claims and checks before touching storage', async () => {
  for (const admin of [undefined, false, 'true', true]) {
    let calls = 0;
    const worker = createWorker(undefined, async () => ({ sub: 'reviewer', admin }), () => ({ list: async () => { calls++; return { items: [] }; } }));
    const response = await worker.fetch(new Request('https://worker.example/admin/imports/list', {
      method: 'POST', headers: { authorization: 'Bearer token', 'content-type': 'application/json' }, body: '{}',
    }), { USER_RATE_LIMITER: { limit: async () => ({ success: true }) } });
    assert.equal(response.status, admin === true ? 200 : 403);
    assert.equal(calls, admin === true ? 1 : 0);
  }
});

test('Firestore value encoding preserves event data including empty arrays and nulls', () => {
  const data = { title: 'Event', score: 60.3, review: null, participants: [], schedule: { start: '2026-11-10', enabled: true }, count: 2 };
  assert.deepEqual(decodeValue(encodeValue(data)), data);
});
