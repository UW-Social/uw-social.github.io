import { readFile } from 'node:fs/promises';
import { createPrivateKey, createSign } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectId = 'uw-social-ae4c7';
const root = fileURLToPath(new URL('../', import.meta.url));

export function validateCredential(value) {
  if (value?.type !== 'service_account' || value.project_id !== projectId ||
      typeof value.client_email !== 'string' || !value.client_email.endsWith(`@${projectId}.iam.gserviceaccount.com`) ||
      typeof value.private_key !== 'string') {
    throw new Error(`Expected a service account for ${projectId}.`);
  }
  createPrivateKey(value.private_key);
  return value;
}

async function post(url, body, token, fetcher) {
  const response = await fetcher(url, {
    method: 'POST', signal: AbortSignal.timeout(30000),
    headers: { 'Content-Type': body instanceof URLSearchParams ? 'application/x-www-form-urlencoded' : 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body instanceof URLSearchParams ? body.toString() : JSON.stringify(body),
  });
  // Do not echo provider response bodies: they can contain credentials/user data.
  if (!response.ok) throw new Error(`Firebase setup request failed (HTTP ${response.status}). Check service-account permissions and project access.`);
  return response.json();
}

export async function grantAdmin(credential, uid, fetcher = fetch, checkOnly = false) {
  validateCredential(credential);
  if (typeof uid !== 'string' || !uid.trim() || uid.length > 128 || /\s/.test(uid)) {
    throw new Error('Provide a valid Firebase User UID.');
  }
  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: credential.client_email,
    scope: 'https://www.googleapis.com/auth/identitytoolkit',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(credential.private_key, 'base64url')}`;
  const oauth = await post('https://oauth2.googleapis.com/token', new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion,
  }), null, fetcher);
  if (typeof oauth.access_token !== 'string' || !oauth.access_token) throw new Error('Google did not return an access token.');
  const endpoint = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts`;
  const found = await post(`${endpoint}:lookup`, { localId: [uid] }, oauth.access_token, fetcher);
  const user = found.users?.find(value => value.localId === uid);
  if (!user || user.disabled) throw new Error('User UID was not found in this project, or the account is disabled.');
  const claims = user.customAttributes ? JSON.parse(user.customAttributes) : {};
  if (!claims || typeof claims !== 'object' || Array.isArray(claims)) throw new Error('Existing custom claims are invalid.');
  if (checkOnly) return claims.admin === true;
  const customAttributes = JSON.stringify({ ...claims, admin: true });
  if (Buffer.byteLength(customAttributes) > 1000) throw new Error('Custom claims exceed Firebase size limit.');
  await post(`${endpoint}:update`, { localId: uid, customAttributes }, oauth.access_token, fetcher);
  const verified = await post(`${endpoint}:lookup`, { localId: [uid] }, oauth.access_token, fetcher);
  const saved = verified.users?.find(value => value.localId === uid);
  if (!saved || JSON.parse(saved.customAttributes || '{}').admin !== true) throw new Error('Admin claim could not be verified.');
}

async function uploadSecrets(credential) {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  if (config.name !== 'uw-social-ai' || config.vars?.FIREBASE_PROJECT_ID !== projectId) {
    throw new Error('Worker configuration does not match the expected project.');
  }
  const bin = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, 'secret', 'bulk', '--name', 'uw-social-ai'], {
      cwd: root, stdio: ['pipe', 'inherit', 'inherit'],
    });
    child.on('error', reject);
    child.stdin.on('error', () => {}); // The process exit below reports upload failure.
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('Cloudflare secret upload failed.')));
    child.stdin.end(JSON.stringify({
      FIREBASE_CLIENT_EMAIL: credential.client_email,
      FIREBASE_PRIVATE_KEY: credential.private_key,
    }));
  });
}

async function main() {
  const [action, filename, uid] = process.argv.slice(2);
  if (!['check', 'status', 'admin', 'secrets'].includes(action) || !filename) {
    throw new Error('Usage: npm run setup:firebase -- <check|status|admin|secrets> <credential-path> [admin-uid]');
  }
  const credential = validateCredential(JSON.parse(await readFile(filename, 'utf8')));
  if (action === 'check') console.log(`Credential validated for ${projectId}. No remote changes made.`);
  if (action === 'status') {
    const enabled = await grantAdmin(credential, uid, fetch, true);
    console.log(enabled ? 'Admin claim is configured.' : 'Admin claim is missing. Run the admin setup command.');
  }
  if (action === 'admin') {
    await grantAdmin(credential, uid);
    console.log(`Verified admin claim for UID ${uid}. Sign out and sign in to refresh the website token.`);
  }
  if (action === 'secrets') {
    await uploadSecrets(credential);
    console.log('Firebase credentials uploaded to uw-social-ai secrets.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error('Setup failed. Check the command arguments, credential project, network access and account permissions. No credential values are printed.');
    process.exitCode = 1;
  });
}
