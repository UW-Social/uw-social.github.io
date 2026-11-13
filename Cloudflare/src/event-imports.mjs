import { createFirestore, ImportError } from './firestore.mjs';
import { calculateReview, SCORING_MODEL, scoringMessages, scoringSchema } from './event-scoring.mjs';

export const importSources = {
  ece: { name: 'UW ECE', calendar: 'sea_ee', url: 'https://www.ece.uw.edu/news-events/calendar/' },
  foster: { name: 'UW Foster', calendar: 'sea_foster', url: 'https://foster.uw.edu/events/trumba/' },
};
const categoryValues = ['Academic', 'Career', 'Club', 'Sports', 'Interest'];

export function plainText(value) {
  if (typeof value !== 'string') return '';
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\s*(?:br\b[^>]*|\/p|\/div|\/li)\s*>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (raw, entity) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? raw;
      const number = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '';
    }).replace(/\r/g, '').replace(/[ \t\u00a0]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function absoluteDate(value, offset) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) || !/^[+-]\d{4}$/.test(offset)) return '';
  const date = new Date(`${value}${offset.slice(0, 3)}:${offset.slice(3)}`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}
async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function issuesFor(event, now = Date.now()) {
  const issues = [];
  if (!event.title.trim()) issues.push('Title is required.');
  if (!event.description.trim()) issues.push('Description is required.');
  if (!event.location.trim()) issues.push('Location is missing. Add a location or confirm that this event is online.');
  const start = Date.parse(event.startTime), end = Date.parse(event.endtime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) issues.push('A valid start and end time are required.');
  if (Number.isFinite(end) && end <= now) issues.push('This event has ended.');
  if (!categoryValues.includes(event.category)) issues.push('Choose a valid category.');
  return issues;
}

export function normalizeTrumba(raw, sourceId) {
  const source = importSources[sourceId];
  if (!source || !raw || typeof raw !== 'object' || !/^\d+$/.test(String(raw.eventID)) || raw.canceled) return null;
  const custom = Array.isArray(raw.customFields) ? raw.customFields : [];
  const notes = custom.filter(field => ['Target Audience', 'Event Types', 'Online Meeting Link'].includes(field.label))
    .map(field => `${field.label}: ${plainText(field.value)}`).join('\n');
  const event = {
    title: plainText(raw.title).slice(0, 500),
    description: [plainText(raw.description), notes, raw.repeats ? `Source recurrence: ${plainText(raw.repeats)}. This listing covers this occurrence only.` : ''].filter(Boolean).join('\n\n').slice(0, 16000),
    location: plainText(raw.location).slice(0, 500), category: 'Academic', tags: [source.name],
    startTime: absoluteDate(raw.startDateTime, raw.startTimeZoneOffset),
    endtime: absoluteDate(raw.endDateTime, raw.endTimeZoneOffset),
    timeZone: 'America/Los_Angeles',
    link: `${source.url}?trumbaEmbed=${encodeURIComponent(`view=event&eventid=${raw.eventID}`)}`,
    imageUrl: '', maxParticipants: null, _hasStartTime: !raw.allDay, _hasEndTime: !raw.allDay,
  };
  return { id: `trumba-${raw.eventID}`, sourceId, sourceEventId: String(raw.eventID), sourceName: source.name, sourceUrl: event.link, event };
}

async function fetchFeed(source, fetcher) {
  let response;
  try {
    // Workers supports only manual/follow. Reject redirects by checking the
    // response, rather than using the unsupported Fetch-standard "error" mode.
    response = await fetcher(`https://www.trumba.com/calendars/${source.calendar}.json?months=2`, {
      signal: AbortSignal.timeout(20000), redirect: 'manual', headers: { Accept: 'application/json' },
    });
  } catch (error) {
    throw new ImportError(502, error?.name === 'TimeoutError' || error?.name === 'AbortError'
      ? 'Calendar source timed out. Please retry.' : 'Could not connect to the calendar source. Please retry.');
  }
  if (response.status >= 300 && response.status < 400) throw new ImportError(502, 'Calendar source redirected unexpectedly. The source configuration needs checking.');
  if (!response.ok) throw new ImportError(502, `Calendar source returned HTTP ${response.status}.`);
  const reader = response.body.getReader();
  let size = 0; const chunks = [];
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new ImportError(502, 'Calendar response is too large.'); }
    chunks.push(value);
  }
  const all = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  let events;
  try { events = JSON.parse(new TextDecoder().decode(all)); } catch { throw new ImportError(502, 'Calendar did not return valid JSON.'); }
  if (!Array.isArray(events)) throw new ImportError(502, 'Calendar format is unsupported.');
  return events.slice(0, 500);
}

function editedEvent(original, edits) {
  if (!edits || typeof edits !== 'object' || Array.isArray(edits)) throw new ImportError(400, 'Missing event fields.');
  const result = { ...original };
  for (const [field, max] of Object.entries({ title: 500, description: 16000, location: 500, category: 100 })) {
    if (typeof edits[field] !== 'string' || edits[field].length > max) throw new ImportError(400, `Invalid ${field}.`);
    result[field] = edits[field].trim();
  }
  for (const field of ['startTime', 'endtime']) {
    if (typeof edits[field] !== 'string' || !Number.isFinite(Date.parse(edits[field]))) throw new ImportError(400, 'Invalid date/time.');
    result[field] = new Date(edits[field]).toISOString();
  }
  return result;
}

export function createImportService(env, { store = createFirestore(env), fetcher = fetch, now = () => Date.now() } = {}) {
  const timestamp = () => new Date(now()).toISOString();
  async function score(event) {
    if (!(await env.APP_RATE_LIMITER.limit({ key: 'all-ai-requests' })).success) throw new ImportError(429, 'AI is busy. Try publishing again in a minute.');
    const zoneParts = value => {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: event.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
      const p = Object.fromEntries(parts.map(v => [v.type, v.value]));
      return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
    };
    const start = zoneParts(event.startTime), end = zoneParts(event.endtime);
    let result;
    try {
      result = await env.AI.run(SCORING_MODEL, {
        messages: scoringMessages({ ...event, startDate: start.date, startTime: start.time, endDate: end.date, endTime: end.time, recurrenceType: 'ONE_TIME' }),
        response_format: { type: 'json_schema', json_schema: scoringSchema }, max_tokens: 5000, temperature: 0.1,
      });
      const assessment = typeof result.response === 'string' ? JSON.parse(result.response.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) : result.response;
      return calculateReview(assessment, timestamp());
    } catch { throw new ImportError(503, 'AI evaluation failed. The event has not been published. Please retry.'); }
  }
  return {
    async list(pageToken = '') {
      const result = await store.list('eventCandidates', pageToken);
      return { items: result.items.map(doc => ({ ...doc.data, id: doc.id, version: doc.version, issues: issuesFor(doc.data.event, now()) })), nextPageToken: result.nextPageToken, sources: importSources };
    },
    async crawl(sourceId, uid) {
      const source = importSources[sourceId];
      if (!source) throw new ImportError(400, 'Choose ECE or Foster.');
      const runId = crypto.randomUUID(); const startedAt = timestamp();
      const run = { sourceId, startedAt, updatedAt: startedAt, requestedBy: uid, status: 'running', scanned: 0, imported: 0, skipped: 0 };
      await store.commit([{ path: `crawlRuns/${runId}`, data: run }]);
      const runDoc = await store.get(`crawlRuns/${runId}`);
      try {
        const feed = await fetchFeed(source, fetcher);
        const state = await store.get(`crawlSources/${sourceId}`);
        const eligible = feed.filter(raw => {
          const item = normalizeTrumba(raw, sourceId);
          return item && item.event.startTime && item.event.endtime && Date.parse(item.event.endtime) > now() && Date.parse(item.event.startTime) <= now() + 60 * 86400000;
        });
        const cursor = eligible.length ? (state?.data.cursor || 0) % eligible.length : 0;
        const batch = eligible.slice(cursor, cursor + 20);
        for (const raw of batch) {
          let item = normalizeTrumba(raw, sourceId); run.scanned++;
          const path = `eventCandidates/${item.id}`;
          const existing = await store.get(path);
          // Trumba event IDs are shared across UW calendars. Keep one candidate
          // and its original attribution when the same event appears in both.
          if (existing) item = normalizeTrumba(raw, existing.data.sourceId);
          const contentHash = await hash(item.event);
          if (existing?.data.sourceHash === contentHash) { run.skipped++; continue; }
          const data = {
            ...item, sourceHash: contentHash, status: 'pending',
            createdAt: existing?.data.createdAt || timestamp(), updatedAt: timestamp(),
            publishedEventId: existing?.data.publishedEventId || '',
            review: null, reviewedBy: '', reviewedAt: '',
          };
          try { await store.commit([{ path, data, version: existing?.version }]); run.imported++; }
          catch (error) { if (error.status !== 409) throw error; run.skipped++; }
        }
        await store.commit([{ path: `crawlSources/${sourceId}`, version: state?.version, data: {
          ...source, updatedAt: timestamp(), cursor: cursor + batch.length >= eligible.length ? 0 : cursor + batch.length,
        } }]);
        run.status = 'completed';
      } catch (error) {
        run.status = 'failed'; run.error = error instanceof ImportError ? error.message : 'Calendar import failed. Please retry.';
      }
      run.updatedAt = timestamp();
      await store.commit([{ path: `crawlRuns/${runId}`, data: run, version: runDoc.version }]);
      if (run.status === 'failed') throw new ImportError(502, run.error);
      return { ...run, id: runId };
    },
    async review(id, version, action, edits, uid) {
      if (typeof id !== 'string' || !/^trumba-\d+$/.test(id) || typeof version !== 'string') throw new ImportError(400, 'Invalid draft reference.');
      const path = `eventCandidates/${id}`; const doc = await store.get(path);
      if (!doc) throw new ImportError(404, 'Draft not found.');
      if (doc.data.status === 'published' && action === 'approve') return { eventId: doc.data.publishedEventId, status: 'published' };
      if (doc.version !== version || doc.data.status !== 'pending') throw new ImportError(409, 'This draft changed. Refresh and review it again.');
      if (!['approve', 'reject'].includes(action)) throw new ImportError(400, 'Invalid review action.');
      const reviewedAt = timestamp();
      if (action === 'reject') {
        await store.commit([{ path, version, data: { ...doc.data, status: 'rejected', reviewedBy: uid, reviewedAt, updatedAt: reviewedAt } }]);
        return { status: 'rejected' };
      }
      const event = editedEvent(doc.data.event, edits);
      const issues = issuesFor(event, now());
      if (issues.length) throw new ImportError(400, issues.join(' '));
      const review = await score(event);
      const eventId = `import-${id}`; const eventPath = `events/${eventId}`;
      const existing = await store.get(eventPath);
      if (existing && existing.data.importCandidateId !== id) throw new ImportError(409, 'Existing event has a different source.');
      const published = {
        ...(existing?.data || {}), ...event, review,
        schedule: { type: 'ONE_TIME', timeZone: event.timeZone, startDatetime: event.startTime, endDatetime: event.endtime },
        organizerId: env.IMPORT_ORGANIZER_UID || uid, organizerName: 'UW Social Editorial', organizerAvatar: '',
        createdAt: existing?.data.createdAt || reviewedAt, participants: existing?.data.participants || [],
        importCandidateId: id, sourceUrl: doc.data.sourceUrl, sourceName: doc.data.sourceName,
        approvedBy: uid, approvedAt: reviewedAt,
      };
      await store.commit([
        { path: eventPath, data: published, version: existing?.version },
        { path, version, data: { ...doc.data, event, review, status: 'published', publishedEventId: eventId, reviewedBy: uid, reviewedAt, updatedAt: reviewedAt } },
      ]);
      return { status: 'published', eventId };
    },
  };
}
