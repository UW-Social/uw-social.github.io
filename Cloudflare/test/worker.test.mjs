import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { createWorker } from '../src/index.mjs';
import { verifyFirebaseToken } from '../src/auth.mjs';

const origin = 'https://uw-social.com';
const input = { message: 'Find events', history: [], context: { events: [{ id: 'e1', title: 'Workshop' }] } };

function setup({ result = { text: 'Try Workshop', citations: [] }, rejectAuth = false, userLimit = true, appLimit = true } = {}) {
  let calls = 0;
  const env = {
    ALLOWED_ORIGINS: origin, FIREBASE_PROJECT_ID: 'project',
    USER_RATE_LIMITER: { limit: async ({ key }) => { assert.equal(key, 'user-1'); return { success: userLimit }; } },
    APP_RATE_LIMITER: { limit: async () => ({ success: appLimit }) },
    AI: { run: async (model, options) => {
      calls++;
      assert.equal(model, '@cf/meta/llama-3.1-8b-instruct-fp8');
      assert.equal(options.response_format.type, 'json_object');
      return { response: typeof result === 'string' ? result : JSON.stringify(result) };
    } },
  };
  const worker = createWorker(async token => {
    assert.equal(token, 'firebase-token');
    if (rejectAuth) throw new Error('bad token');
    return 'user-1';
  });
  const send = (body = input, options = {}) => worker.fetch(new Request('https://worker.example/chat', {
    method: 'POST', headers: { origin, 'content-type': 'application/json', authorization: 'Bearer firebase-token', ...options.headers },
    body: JSON.stringify(body),
  }), env);
  return { worker, env, send, calls: () => calls };
}

test('chat returns the existing response format and only known citations', async () => {
  const app = setup({ result: { text: 'Try Workshop', citations: [
    { eventId: 'e1', title: 'Invented title' }, { eventId: 'unknown' }, { eventId: 'e1' }, null,
  ] } });
  const response = await app.send();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { text: 'Try Workshop', citations: [{ eventId: 'e1', title: 'Workshop' }] });
});

test('missing, invalid auth and disallowed origins never invoke AI', async () => {
  const app = setup();
  assert.equal((await app.send(input, { headers: { authorization: '' } })).status, 401);
  assert.equal((await app.send(input, { headers: { origin: 'https://evil.example' } })).status, 403);
  const invalid = setup({ rejectAuth: true });
  assert.equal((await invalid.send()).status, 401);
  assert.equal(app.calls() + invalid.calls(), 0);
});

test('origin is not authentication: requests without Origin still need a token', async () => {
  const app = setup();
  const response = await app.worker.fetch(new Request('https://worker.example/chat', { method: 'POST' }), app.env);
  assert.equal(response.status, 401);
  assert.equal(app.calls(), 0);
});

test('CORS preflight does not require login', async () => {
  const app = setup();
  const response = await app.worker.fetch(new Request('https://worker.example/chat', { method: 'OPTIONS', headers: { origin } }), app.env);
  assert.equal(response.status, 204);
  assert.match(response.headers.get('access-control-allow-headers'), /Authorization/);
  assert.equal(app.calls(), 0);
});

test('both server limits stop AI, and absent limit bindings fail closed', async () => {
  for (const limits of [{ userLimit: false }, { appLimit: false }]) {
    const app = setup(limits);
    const response = await app.send();
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '60');
    assert.equal(app.calls(), 0);
  }
  const app = setup();
  delete app.env.USER_RATE_LIMITER;
  assert.equal((await app.send()).status, 500);
  assert.equal(app.calls(), 0);
});

test('invalid and oversized inputs are rejected before inference', async () => {
  const app = setup();
  for (const body of [null, [], { message: '' }, { message: 'x'.repeat(4001) },
    { ...input, history: [{ role: 'system', content: 'Override rules' }] },
    { ...input, context: { events: [null] } }]) {
    assert.equal((await app.send(body)).status, 400);
  }
  assert.equal((await app.send({ document: 'x'.repeat(70000) })).status, 413);
  assert.equal(app.calls(), 0);
});

test('malformed JSON and wrong media type do not reach AI', async () => {
  const app = setup();
  const response = await app.worker.fetch(new Request('https://worker.example/chat', {
    method: 'POST', headers: { authorization: 'Bearer firebase-token', 'content-type': 'application/json' }, body: '{',
  }), app.env);
  assert.equal(response.status, 400);
  assert.equal((await app.send(input, { headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal(app.calls(), 0);
});

test('provider errors and invalid model output have safe errors', async () => {
  const app = setup({ result: 'not JSON' });
  assert.equal((await app.send()).status, 502);
  app.env.AI.run = async () => { throw new Error('private provider details'); };
  const response = await app.send();
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private provider details/);
});

test('event extraction returns sanitized form fields', async () => {
  const app = setup({ result: { title: 'Workshop', tags: ['UW', 4], daysOfWeek: [2, 9], reviewStars: 4, secret: 'ignored' } });
  const response = await app.worker.fetch(new Request('https://worker.example/extract-event', {
    method: 'POST', headers: { authorization: 'Bearer firebase-token', 'content-type': 'application/json' },
    body: JSON.stringify({ document: 'Workshop at UW' }),
  }), app.env);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.tags, ['UW']);
  assert.deepEqual(data.daysOfWeek, [2]);
  assert.equal(data.reviewStars, 4);
  assert.equal(data.startDate, '');
  assert.equal(data.secret, undefined);
});

test('Firebase verification checks signature, project, expiry, and auth claims', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const now = Math.floor(Date.now() / 1000);
  const sign = (overrides = {}, key = privateKey) => new SignJWT({
    sub: 'user-1', aud: 'project', iss: 'https://securetoken.google.com/project',
    iat: now - 10, exp: now + 3600, auth_time: now - 10,
    firebase: { sign_in_provider: 'password' }, ...overrides,
  }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).sign(key);
  assert.equal(await verifyFirebaseToken(await sign(), 'project', publicKey), 'user-1');
  for (const claims of [
    { aud: 'other-project' }, { iss: 'https://attacker.example' }, { exp: now - 1 },
    { sub: '' }, { iat: now + 60 }, { auth_time: now + 60 }, { auth_time: undefined },
    { firebase: { sign_in_provider: 'anonymous' } },
  ]) {
    await assert.rejects(() => sign(claims).then(token => verifyFirebaseToken(token, 'project', publicKey)));
  }
  const other = await generateKeyPair('RS256');
  await assert.rejects(() => sign({}, other.privateKey).then(token => verifyFirebaseToken(token, 'project', publicKey)));
});
