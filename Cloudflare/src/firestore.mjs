import { importPKCS8, SignJWT } from 'jose';

const tokens = new WeakMap();
export class ImportError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number' && Number.isFinite(value)) return Number.isInteger(value)
    ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (value && typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
  throw new Error('Unsupported Firestore value');
}
function encodeFields(data) { return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)])); }
export function decodeValue(value) {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  throw new Error('Unsupported Firestore field');
}
function decodeFields(fields) { return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)])); }

async function accessToken(env, fetcher) {
  const cached = tokens.get(env);
  if (cached?.expires > Date.now() + 60000) return cached.token;
  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_PROJECT_ID) {
    throw new ImportError(503, 'Firebase server credentials are not configured.');
  }
  const key = await importPKCS8(env.FIREBASE_PRIVATE_KEY, 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/datastore' })
    .setProtectedHeader({ alg: 'RS256' }).setIssuer(env.FIREBASE_CLIENT_EMAIL)
    .setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('1h').sign(key);
  const response = await fetcher('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!response.ok) throw new ImportError(503, 'Firebase server authentication failed. Check service-account permissions.');
  const result = await response.json();
  if (typeof result.access_token !== 'string') throw new ImportError(503, 'Firebase authentication returned no token.');
  tokens.set(env, { token: result.access_token, expires: Date.now() + Number(result.expires_in || 3600) * 1000 });
  return result.access_token;
}

export function createFirestore(env, fetcher = fetch) {
  const base = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  const decode = doc => ({ data: decodeFields(doc.fields || {}), version: doc.updateTime, id: doc.name.split('/').at(-1) });
  async function request(path, options = {}, missing = false) {
    const token = await accessToken(env, fetcher);
    const response = await fetcher(`https://firestore.googleapis.com/v1/${base}${path}`, {
      ...options, signal: AbortSignal.timeout(20000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (missing && response.status === 404) return null;
    if ([409, 412].includes(response.status)) throw new ImportError(409, 'This activity changed. Refresh and review it again.');
    if (!response.ok) throw new ImportError(503, `Firestore request failed (${response.status}). Check server permissions.`);
    return response.json();
  }
  return {
    async get(path) { const doc = await request(`/${path}`, {}, true); return doc ? decode(doc) : null; },
    async list(collection, pageToken = '') {
      const params = new URLSearchParams({ pageSize: '50', orderBy: 'updatedAt desc' });
      if (pageToken) params.set('pageToken', pageToken);
      const result = await request(`/${collection}?${params}`);
      return { items: (result.documents || []).map(decode), nextPageToken: result.nextPageToken || '' };
    },
    async commit(writes) {
      return request(':commit', { method: 'POST', body: JSON.stringify({ writes: writes.map(({ path, data, version }) => ({
        update: { name: `${base}/${path}`, fields: encodeFields(data) },
        currentDocument: version ? { updateTime: version } : { exists: false },
      })) }) });
    },
  };
}
