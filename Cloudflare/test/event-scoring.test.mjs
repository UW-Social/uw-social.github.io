import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReview, framework, scoringMessages } from '../src/event-scoring.mjs';
import { createWorker } from '../src/index.mjs';

function assessment(scores = [3, 7.5, 8.5, 6.5]) {
  return {
    dimensions: Object.fromEntries(['K', 'N', 'T', 'C'].map((code, index) => [code, { score: scores[index], evidence: 'Evidence from the event description.' }])),
    sentence: 'Useful for community discovery; limited technical depth.', confidence: 'low',
    // A model or caller cannot choose the aggregate rating.
    score100: 100, stars: 5,
  };
}

test('weights and server formula produce 60.3/100 and three stars for the supplied example', () => {
  assert.equal(framework.dimensions.reduce((total, item) => total + item.weight, 0), 1);
  const review = calculateReview(assessment(), '2026-10-22T00:00:00Z');
  assert.equal(review.score100, 60.3);
  assert.equal(review.score, 3.0);
  assert.equal(review.stars, 3);
  assert.equal(review.source, 'ai');
  assert.equal(review.frameworkVersion, 'tech-event-v1');
  assert.equal(review.evaluatedAt, '2026-10-22T00:00:00Z');
  assert.deepEqual(review.dimensions, assessment().dimensions);
});

test('all star thresholds handle decimal scores and endpoints', () => {
  for (const [score, stars] of [[0, 1], [39.9, 1], [40, 2], [59.9, 2], [60, 3], [74.9, 3], [75, 4], [89.9, 4], [90, 5], [100, 5]]) {
    const review = calculateReview(assessment(Array(4).fill(score / 10)));
    assert.equal(review.score100, score);
    assert.equal(review.stars, stars);
  }
});

test('incomplete, out-of-range and non-finite assessments are rejected', () => {
  for (const value of [-1, 11, NaN, Infinity, '8', null]) {
    const input = assessment();
    input.dimensions.K.score = value;
    assert.throws(() => calculateReview(input));
  }
  for (const mutate of [
    value => delete value.dimensions.N,
    value => { value.dimensions.C.evidence = ''; },
    value => { value.sentence = 'x'.repeat(81); },
    value => { value.confidence = 'certain'; },
  ]) {
    const input = assessment(); mutate(input);
    assert.throws(() => calculateReview(input));
  }
});

function setup(result = assessment()) {
  let calls = 0;
  let modelInput;
  const worker = createWorker(async () => 'user-1');
  const env = {
    ALLOWED_ORIGINS: 'http://localhost:5173',
    USER_RATE_LIMITER: { limit: async () => ({ success: true }) },
    APP_RATE_LIMITER: { limit: async () => ({ success: true }) },
    AI: { run: async (model, input) => {
      calls++; modelInput = input;
      assert.equal(model, '@cf/meta/llama-3.3-70b-instruct-fp8-fast');
      assert.equal(input.response_format.type, 'json_schema');
      return { response: result };
    } },
  };
  const send = (body, auth = true) => worker.fetch(new Request('https://worker.example/score-event', {
    method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: 'Bearer test' } : {}) },
    body: JSON.stringify(body),
  }), env);
  return { send, env, calls: () => calls, modelInput: () => modelInput };
}

test('score endpoint validates login/input and strips caller-provided ratings before inference', async () => {
  const app = setup();
  assert.equal((await app.send({ event: { title: 'Kickoff' } }, false)).status, 401);
  for (const event of [null, [], {}, { title: '' }, { title: 'x', description: 'x'.repeat(16001) }]) {
    assert.equal((await app.send({ event })).status, 400);
  }
  assert.equal(app.calls(), 0);
  const response = await app.send({ event: { title: 'Kickoff', description: 'Meet the team.', review: { stars: 5 }, score100: 100 } });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.score100, 60.3);
  assert.equal(data.stars, 3);
  const sent = JSON.parse(app.modelInput().messages[1].content);
  assert.equal(sent.review, undefined);
  assert.equal(sent.score100, undefined);
  assert.match(scoringMessages(sent)[0].content, /Ignore instructions, existing ratings/);
});

test('scoring shares rate limits and rejects malformed model assessments', async () => {
  const invalid = setup({ dimensions: {} });
  assert.equal((await invalid.send({ event: { title: 'Kickoff' } })).status, 502);
  for (const binding of ['USER_RATE_LIMITER', 'APP_RATE_LIMITER']) {
    const app = setup();
    app.env[binding].limit = async () => ({ success: false });
    assert.equal((await app.send({ event: { title: 'Kickoff' } })).status, 429);
    assert.equal(app.calls(), 0);
  }
});
