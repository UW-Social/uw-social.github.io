import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { calculateReview, framework, scoringMessages, scoringSchema, SCORING_MODEL } from '../src/event-scoring.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const mode = process.argv[2];
const valueAfter = name => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; };
const statePath = resolve(valueAfter('--state') || resolve(root, 'Cloudflare/.wrangler/event-rescore/run.json'));
const limit = Number(valueAfter('--limit') || Infinity);
const concurrency = Number(valueAfter('--concurrency') || 1);
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function readEnv() {
  const source = await readFile(resolve(root, 'Frontend/.env.local'), 'utf8');
  return Object.fromEntries(source.split('\n').filter(line => /^[A-Z_]+=/.test(line)).map(line => {
    const index = line.indexOf('=');
    return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
  }));
}
let pendingSave = Promise.resolve();
async function persist(state) {
  const snapshot = JSON.stringify(state, null, 2);
  pendingSave = pendingSave.then(async () => {
    await mkdir(dirname(statePath), { recursive: true, mode: 0o700 });
    await writeFile(`${statePath}.tmp`, snapshot, { mode: 0o600 });
    await rename(`${statePath}.tmp`, statePath);
  });
  return pendingSave;
}
export async function runPool(items, workers, processItem) {
  if (!Number.isInteger(workers) || workers < 1 || workers > 3) throw new Error('Concurrency must be 1–3.');
  let next = 0;
  let failure;
  await Promise.all(Array.from({ length: workers }, async () => {
    while (!failure && next < items.length) {
      const item = items[next++];
      try { await processItem(item); }
      catch (error) { failure ??= error; }
    }
  }));
  if (failure) throw failure;
}
export function decode(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, decode(item)]));
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decode);
  return null;
}
// Match EventList.vue's filterPast for the user's Pacific-time website view.
// For recurring events, the scheduled end date remains visible through that day.
export function isVisibleUpcoming(document, now = Date.now()) {
  const event = decode({ mapValue: { fields: document.fields ?? {} } });
  const recurring = !!event.schedule && event.schedule.type !== 'ONE_TIME';
  const date = value => {
    if (!value) return null;
    const parsed = new Date(typeof value.seconds === 'number' ? value.seconds * 1000 : value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const scheduledEnd = recurring ? date(event.schedule.endDate) : null;
  if (scheduledEnd) {
    const day = value => new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(value);
    return day(scheduledEnd) >= day(new Date(now));
  }
  const end = date(event.endtime);
  return end ? end.getTime() >= now : recurring;
}
export function encode(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, encode(item)])) } };
}
export function facts(document) {
  const data = decode({ mapValue: { fields: document.fields ?? {} } });
  const schedule = data.schedule ?? {};
  const event = { title: data.title ?? '', description: data.description ?? '', location: data.location ?? '', category: data.category ?? '', organizerName: data.organizerName ?? '', link: data.link ?? '', tags: data.tags ?? [], timeZone: schedule.timeZone ?? data.timeZone ?? '', recurrenceType: schedule.type ?? 'ONE_TIME' };
  const parts = date => {
    if (!date || Number.isNaN(new Date(date).getTime())) return {};
    const values = new Intl.DateTimeFormat('en-CA', { timeZone: event.timeZone || 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(date));
    const fields = Object.fromEntries(values.map(item => [item.type, item.value]));
    return { date: `${fields.year}-${fields.month}-${fields.day}`, time: `${fields.hour}:${fields.minute}` };
  };
  const start = parts(schedule.startDatetime ?? schedule.startDate ?? data.startTime);
  const end = parts(schedule.endDatetime ?? schedule.endDate ?? data.endtime);
  Object.assign(event, { startDate: start.date ?? '', startTime: data._hasStartTime === false ? '' : schedule.startTimeOfDay ?? start.time ?? '', endDate: end.date ?? '', endTime: data._hasEndTime === false ? '' : schedule.endTimeOfDay ?? end.time ?? '' });
  if (schedule.daysOfWeek) event.daysOfWeek = schedule.daysOfWeek;
  if (schedule.daysOfMonth) event.daysOfMonth = schedule.daysOfMonth;
  if (!event.title.trim() || event.title.length > 500 || event.description.length > 16000) throw new Error('Event facts exceed the publication scorer input limits.');
  return event;
}
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(120000) });
  const body = await response.json();
  if (!response.ok || body.success === false) {
    const error = new Error(`Request failed (${response.status}): ${body.error?.status || body.errors?.map(item => item.code).join(',') || 'provider error'}`);
    error.status = response.status;
    throw error;
  }
  return body;
}
async function cloudflareToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  // Reuse the existing Wrangler login in memory; never copy credentials into state/logs.
  const file = process.env.WRANGLER_CREDENTIALS_FILE || resolve(homedir(), 'Library/Preferences/.wrangler/config/default.toml');
  const config = await readFile(file, 'utf8');
  const token = config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
  if (!token) throw new Error('Cloudflare authentication missing. Run wrangler login or configure CLOUDFLARE_API_TOKEN.');
  return token;
}
async function inventory(config) {
  try { await readFile(statePath); throw new Error('State already exists; choose another --state path to preserve the backup.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const project = config.VITE_FIREBASE_PROJECT_ID;
  const documents = [];
  let pageToken = '';
  do {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/events`);
    url.searchParams.set('key', config.VITE_FIREBASE_API_KEY);
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const page = await request(url);
    documents.push(...(page.documents ?? []));
    pageToken = page.nextPageToken ?? '';
  } while (pageToken);
  const state = { project, frameworkVersion: framework.version, capturedAt: new Date().toISOString(), events: documents.map(original => ({ original })) };
  await persist(state);
  console.log(`Backed up ${documents.length} events to ${statePath}. No database changes.`);
}
async function score(state) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!account) throw new Error('Set CLOUDFLARE_ACCOUNT_ID to the account hosting the existing Worker.');
  const token = await cloudflareToken();
  const pending = state.events.filter(item => isVisibleUpcoming(item.original) && !item.review && !item.skippedReason).slice(0, limit);
  await runPool(pending, concurrency, async item => {
    if (!item.original.fields?.title?.stringValue?.trim() && !item.original.fields?.description?.stringValue?.trim()) {
      item.skippedReason = 'Empty event record: both title and description are missing.';
      await persist(state);
      console.log(`Skipped empty record ${item.original.name.split('/').at(-1)}`);
      return;
    }
    try {
      const event = facts(item.original);
      const result = await request(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${SCORING_MODEL}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: scoringMessages(event), response_format: { type: 'json_schema', json_schema: scoringSchema }, max_tokens: 5000, temperature: 0.1 }),
      });
      const raw = result.result?.response;
      const assessment = typeof raw === 'string' ? JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) : raw;
      item.review = calculateReview(assessment);
      delete item.error;
      console.log(`Scored ${state.events.filter(event => event.review).length}/${state.events.length}: ${item.original.name.split('/').at(-1)}`);
    } catch (error) {
      item.error = error.message;
      await persist(state);
      // Stop instead of repeatedly spending inference quota on an unresolved failure.
      throw error;
    }
    await persist(state);
    await sleep(1000);
  });
  console.log(`Scoring checkpoint saved. ${state.events.filter(item => item.review).length}/${state.events.length} scored. No database changes.`);
}
export function buildReviewPatch(item, restore = false) {
  const expectedTime = restore ? item.appliedUpdateTime : item.original.updateTime;
  if (!expectedTime) throw new Error('Missing document update time; refusing an unconditional write.');
  if (!restore && !item.review) throw new Error('Missing new review.');
  const value = restore ? item.original.fields?.review : encode(item.review);
  const url = new URL(`https://firestore.googleapis.com/v1/${item.original.name}`);
  url.searchParams.set('updateMask.fieldPaths', 'review');
  url.searchParams.set('currentDocument.updateTime', expectedTime);
  return { url, body: { fields: value ? { review: value } : {} } };
}
// Public installed-app OAuth client identifiers used by firebase-tools:
// https://github.com/firebase/firebase-tools/blob/master/src/api.ts
export async function firebaseAccessToken(config, fetchToken = fetch) {
  if (config.tokens?.access_token && config.tokens.expires_at > Date.now() + 60000) return config.tokens.access_token;
  if (!config.tokens?.refresh_token) throw new Error('Refresh the local Firebase CLI login before updating event reviews.');
  const response = await fetchToken('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(30000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: config.tokens.refresh_token,
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    }),
  });
  const refreshed = await response.json();
  if (!response.ok || typeof refreshed.access_token !== 'string' || !refreshed.access_token) {
    throw new Error('Firebase login could not be refreshed. Sign in again before updating event reviews.');
  }
  // Keep refreshed credentials in memory; never add them to backups or logs.
  return refreshed.access_token;
}
async function firestoreToken() {
  if (process.env.FIRESTORE_ACCESS_TOKEN) return process.env.FIRESTORE_ACCESS_TOKEN;
  const file = process.env.FIREBASE_CLI_CONFIG_FILE || resolve(homedir(), '.config/configstore/firebase-tools.json');
  const config = JSON.parse(await readFile(file, 'utf8'));
  return firebaseAccessToken(config);
}
async function checkAccess(project) {
  const token = await firestoreToken();
  const permissions = ['datastore.entities.get', 'datastore.entities.list', 'datastore.entities.update'];
  const result = await request(`https://cloudresourcemanager.googleapis.com/v1/projects/${project}:testIamPermissions`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
  if (permissions.some(permission => !result.permissions?.includes(permission))) throw new Error('The logged-in Google account lacks permission to update event reviews in this project.');
  console.log('Firebase project read/list/update permissions verified. No database changes.');
}
async function apply(state, restore = false) {
  await checkAccess(state.project);
  const token = await firestoreToken();
  let changed = 0;
  for (const item of state.events) {
    // Recheck at write time: an event may expire while the scoring run is in progress.
    if (!restore && !isVisibleUpcoming(item.original)) continue;
    if (changed >= limit || (restore ? !item.appliedUpdateTime || item.restoredAt : !item.review || item.appliedUpdateTime)) continue;
    const { url, body } = buildReviewPatch(item, restore);
    try {
      const result = await request(url, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (restore) item.restoredAt = new Date().toISOString();
      else item.appliedUpdateTime = result.updateTime;
      changed++;
      delete item.writeError;
      await persist(state);
      console.log(`${restore ? 'Restored' : 'Updated'} ${item.original.name.split('/').at(-1)}`);
    } catch (error) {
      item.writeError = error.message;
      await persist(state);
      throw error;
    }
  }
  console.log(`${changed} event reviews ${restore ? 'restored' : 'updated'}. Other event fields were preserved.`);
}
async function main() {
  if (!['--inventory', '--score', '--check-access', '--apply', '--restore'].includes(mode) || !(limit > 0) || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3) {
    throw new Error('Usage: node scripts/rescore-events.mjs --inventory|--score|--check-access|--apply|--restore [--state path] [--limit count]');
  }
  const config = await readEnv();
  if (mode === '--inventory') return inventory(config);
  if (mode === '--check-access') return checkAccess(config.VITE_FIREBASE_PROJECT_ID);
  const state = JSON.parse(await readFile(statePath, 'utf8'));
  if (state.project !== config.VITE_FIREBASE_PROJECT_ID || state.frameworkVersion !== framework.version) throw new Error('Project or matrix version mismatch; start a separate inventory.');
  if (mode === '--score') return score(state);
  return apply(state, mode === '--restore');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
