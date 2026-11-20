import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { grantAdmin, validateCredential } from '../scripts/setup-firebase.mjs';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const credential = {
  type: 'service_account', project_id: 'uw-social-ae4c7',
  client_email: 'test@uw-social-ae4c7.iam.gserviceaccount.com',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
};

test('setup rejects credentials from another project', () => {
  assert.throws(() => validateCredential({ ...credential, project_id: 'wrong' }));
});

test('admin setup preserves existing claims and verifies the saved claim', async () => {
  const responses = [
    { access_token: 'mock-token' },
    { users: [{ localId: 'reviewer', customAttributes: '{"editor":true}' }] },
    {}, { users: [{ localId: 'reviewer', customAttributes: '{"editor":true,"admin":true}' }] },
  ];
  const calls = [];
  await grantAdmin(credential, 'reviewer', async (url, init) => {
    calls.push({ url, body: url.includes('oauth2.googleapis.com') ? Object.fromEntries(new URLSearchParams(init.body)) : JSON.parse(init.body) });
    return Response.json(responses.shift());
  });
  assert.deepEqual(JSON.parse(calls[2].body.customAttributes), { editor: true, admin: true });
  assert.equal(calls.length, 4);
});

test('unknown or disabled users never receive admin claims', async () => {
  for (const users of [[], [{ localId: 'reviewer', disabled: true }]]) {
    let calls = 0;
    await assert.rejects(grantAdmin(credential, 'reviewer', async () => {
      calls++;
      return Response.json(calls === 1 ? { access_token: 'mock-token' } : { users });
    }));
    assert.equal(calls, 2);
  }
});
