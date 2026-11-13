import test from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, facts, buildReviewPatch, runPool, isVisibleUpcoming } from '../scripts/rescore-events.mjs';

const name = 'projects/test/databases/(default)/documents/events/event-1';
const before = '2026-11-01T00:00:00.000000Z';
const after = '2026-11-05T00:00:00.000000Z';

test('Firestore encoding round-trips nested criterion ratings, zero, null and ranges', () => {
  const review = { source: 'ai', scoreRange: { lower: 0, upper: 100 }, informationCoverage: 0.64,
    categoryEvaluations: [{ category: 'social', dimensions: { socialConnection: { score: null, criteria: { one: { rating: null, evidence: 'Unknown.' }, two: { rating: 0, evidence: 'Absent.' } } } } }],
  };
  assert.deepEqual(decode(encode(review)), review);
});

test('update patches only review and refuses to overwrite an edited event', () => {
  const item = { original: { name, updateTime: before, fields: encode({ title: 'Original', review: { score100: 10 } }).mapValue.fields }, review: { score100: 78 } };
  const { url, body } = buildReviewPatch(item);
  assert.equal(url.searchParams.get('currentDocument.updateTime'), before);
  assert.deepEqual(url.searchParams.getAll('updateMask.fieldPaths'), ['review']);
  assert.deepEqual(Object.keys(body.fields), ['review']);
  assert.deepEqual(decode(body.fields.review), { score100: 78 });
  assert.throws(() => buildReviewPatch({ ...item, original: { ...item.original, updateTime: undefined } }));
});

test('restore uses the applied update time and exactly the original review; absent review is deleted', () => {
  const savedReview = encode({ score100: 10 });
  const item = { original: { name, updateTime: before, fields: { review: savedReview } }, appliedUpdateTime: after };
  const patch = buildReviewPatch(item, true);
  assert.equal(patch.url.searchParams.get('currentDocument.updateTime'), after);
  assert.deepEqual(patch.body.fields.review, savedReview);
  assert.deepEqual(buildReviewPatch({ ...item, original: { name, fields: {} } }, true).body.fields, {});
});

test('batch scoring facts include the schedule and omit existing ratings and personal identifiers', () => {
  const fields = encode({ title: 'Study workshop', description: 'Hands-on exercises.', review: { score100: 100 }, organizerId: 'private-id', participants: ['student-id'],
    schedule: { type: 'ONE_TIME', timeZone: 'America/Los_Angeles', startDatetime: '2026-11-05T22:00:00Z', endDatetime: '2026-11-05T23:00:00Z' },
  }).mapValue.fields;
  const event = facts({ fields });
  assert.equal(event.startDate, '2026-11-05');
  assert.equal(event.startTime, '14:00');
  assert.equal(event.endTime, '15:00');
  assert.equal(event.review, undefined);
  assert.equal(event.participants, undefined);
  assert.equal(event.organizerId, undefined);
});


test('bounded scoring pool runs every item once and waits for in-flight work after a failure', async () => {
  let active = 0, maximum = 0;
  const completed = [];
  await runPool([1, 2, 3, 4, 5], 3, async item => {
    active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 5));
    completed.push(item); active--;
  });
  assert.equal(maximum, 3);
  assert.deepEqual(completed.sort(), [1, 2, 3, 4, 5]);
  let finished = false;
  await assert.rejects(runPool([1, 2, 3], 2, async item => {
    if (item === 1) throw new Error('Provider failure');
    await new Promise(resolve => setTimeout(resolve, 5));
    finished = true;
  }), /Provider failure/);
  assert.equal(finished, true);
  await assert.rejects(runPool([], 4, async () => {}), /Concurrency/);
});


test('batch scope matches visible upcoming events and keeps recurring events through their end day', () => {
  const now = Date.parse('2026-11-06T01:00:00Z'); // November 5, 5pm Pacific.
  const document = event => ({ fields: encode(event).mapValue.fields });
  assert.equal(isVisibleUpcoming(document({ endtime: '2026-11-06T02:00:00Z' }), now), true);
  assert.equal(isVisibleUpcoming(document({ endtime: '2026-11-06T00:59:59Z' }), now), false);
  assert.equal(isVisibleUpcoming(document({}), now), false);
  assert.equal(isVisibleUpcoming(document({ schedule: { type: 'WEEKLY' } }), now), true);
  assert.equal(isVisibleUpcoming(document({ schedule: { type: 'WEEKLY', endDate: '2026-11-05T08:00:00Z' }, endtime: '2026-11-05T10:00:00Z' }), now), true);
  assert.equal(isVisibleUpcoming(document({ schedule: { type: 'WEEKLY', endDate: '2026-11-04T08:00:00Z' } }), now), false);
  assert.equal(isVisibleUpcoming(document({ schedule: { type: 'ONE_TIME', endDatetime: '2027-01-01T00:00:00Z' }, endtime: '2026-11-04T00:00:00Z' }), now), false);
});

test('expired Firebase sessions refresh in memory; failed refreshes disclose no credentials', async () => {
  const { firebaseAccessToken } = await import('../scripts/rescore-events.mjs');
  const config = { tokens: { access_token: 'old-test-token', expires_at: 0, refresh_token: 'test-refresh-token' } };
  assert.equal(await firebaseAccessToken(config, async (url, options) => {
    assert.equal(url, 'https://oauth2.googleapis.com/token');
    assert.equal(options.body.get('refresh_token'), 'test-refresh-token');
    return new Response(JSON.stringify({ access_token: 'new-test-token' }));
  }), 'new-test-token');
  assert.equal(config.tokens.access_token, 'old-test-token');
  await assert.rejects(firebaseAccessToken(config, async () => new Response(JSON.stringify({ error: 'test-refresh-token' }), { status: 400 })), /Firebase login could not be refreshed/);
  assert.equal(await firebaseAccessToken({ tokens: { access_token: 'valid-test-token', expires_at: Date.now() + 120000 } }, async () => { throw new Error('Should not refresh a valid token'); }), 'valid-test-token');
});
