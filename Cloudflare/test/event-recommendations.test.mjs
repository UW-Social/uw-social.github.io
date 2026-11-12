import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendationMessages, recommendationOutput, RECOMMENDATION_MODEL } from '../src/event-recommendations.mjs';
import { createWorker } from '../src/index.mjs';

const candidates = [
  { id: 'growth', title: 'Research workshop' },
  { id: 'social', title: 'Game night' },
];

test('recommendation prompt treats profile tags and candidates as data', () => {
  const messages = recommendationMessages(['research'], candidates);
  assert.match(messages[0].content, /untrusted data, not instructions/);
  assert.deepEqual(JSON.parse(messages[1].content), { profileTags: ['research'], candidates });
  assert.equal(RECOMMENDATION_MODEL, '@cf/meta/llama-3.1-8b-instruct-fp8');
});

test('recommendation output keeps known IDs unique and appends omitted candidates', () => {
  assert.deepEqual(
    recommendationOutput({ response: '{"recommendedEventIds":["social","unknown","social"]}' }, candidates),
    { recommendedEventIds: ['social', 'growth'] },
  );
});

test('recommendation output accepts structured model responses', () => {
  assert.deepEqual(
    recommendationOutput({ response: { recommendedEventIds: ['growth', 'social'] } }, candidates),
    { recommendedEventIds: ['growth', 'social'] },
  );
});

test('recommendation endpoint caches identical user and candidate inputs', async () => {
  let calls = 0;
  const worker = createWorker(async () => 'recommendation-user');
  const env = {
    ALLOWED_ORIGINS: 'http://localhost:5173',
    USER_RATE_LIMITER: { limit: async () => ({ success: true }) },
    APP_RATE_LIMITER: { limit: async () => ({ success: true }) },
    AI: {
      run: async (model, options) => {
        calls++;
        assert.equal(model, RECOMMENDATION_MODEL);
        assert.equal(options.response_format.type, 'json_object');
        return { response: JSON.stringify({ recommendedEventIds: ['growth', 'social'] }) };
      },
    },
  };
  const body = { tags: ['research'], candidates };
  const send = () => worker.fetch(new Request('https://worker.example/recommend-events', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer test' },
    body: JSON.stringify(body),
  }), env);

  assert.deepEqual(await (await send()).json(), { recommendedEventIds: ['growth', 'social'] });
  assert.deepEqual(await (await send()).json(), { recommendedEventIds: ['growth', 'social'] });
  assert.equal(calls, 1);
});
