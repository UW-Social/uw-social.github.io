const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const review = { source: 'ai', score100: 60.3, stars: 3, score: 3.02, sentence: 'Community discovery with limited technical depth.', frameworkVersion: 'tech-event-v1' };

function createSubmission(file, rejectScoring = false) {
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];
  const editing = file.includes('EditEvent');
  const start = script.indexOf(editing ? 'async function handleSubmit()' : 'const handleSubmit = async () =>');
  const handler = script.slice(start, editing ? script.indexOf('\nonMounted(', start) : script.length);
  const { outputText } = ts.transpileModule(handler, { compilerOptions: { target: ts.ScriptTarget.ES2020 } });
  const calls = [];
  const writes = [];
  const alerts = [];
  const formData = { value: {
    title: 'Club kickoff', description: 'Final edited description, not the originally pasted brief.',
    location: 'HUB', category: 'Club', startDate: '2026-10-29', endDate: '2026-10-29',
    startTime: '16:00', endTime: '17:00', timeZone: 'America/Los_Angeles', recurrenceType: 'ONE_TIME',
    tags: ['Cloud Computing'], link: 'https://example.com', imageUrl: '', maxParticipants: null,
    organizerId: 'user-1', participants: [],
    // Old human/imported ratings must not be persisted by either submission flow.
    reviewStars: 5, reviewScore: 5, reviewSentence: 'Human score',
  } };
  const save = async (...args) => { calls.push('save'); writes.push(args.at(-1)); return { id: 'event-1' }; };
  const ctx = {
    formData, isSubmitting: { value: false }, submitStatus: { value: '' }, currentStep: { value: 4 },
    originalEvent: { value: { createdAt: '2026-10-01T00:00:00Z' } }, eventId: { value: 'event-1' },
    userStore: { userProfile: { uid: 'user-1', displayName: 'User' } },
    eventStore: { fetchEvents: async () => {} }, router: { push() {} },
    db: { app: { options: { projectId: 'test' } } }, selectedImageFile: { value: null },
    RecurrenceType: { ONE_TIME: 'ONE_TIME', DAILY: 'DAILY', WEEKLY: 'WEEKLY', MONTHLY: 'MONTHLY' },
    normalizeTimeField() {}, normalizeEventCategory: value => value,
    createDateInTimeZone: (date, time) => new Date(`${date}T${time}:00Z`),
    isValidDate: date => !Number.isNaN(date.getTime()),
    runPublishStep: async (_label, task) => task(),
    formatErrorMessage: error => error.message, logFormSnapshot() {}, willShowInEventList: () => true,
    collection() {}, doc() {}, addDoc: save, updateDoc: save,
    scoreEventForSubmission: async draft => {
      calls.push('score');
      assert.equal(draft.description, formData.value.description);
      if (rejectScoring) throw new Error('AI evaluation unavailable');
      return review;
    },
    alert: value => alerts.push(value), console: { log() {}, error() {} },
  };
  const submit = new Function(...Object.keys(ctx), `${outputText}\nreturn handleSubmit;`)(...Object.values(ctx));
  return { submit, writes, calls, alerts, formData, state: ctx.isSubmitting };
}

for (const file of ['components/EventForm.vue', 'views/EditEvent.vue']) {
  test(`${file}: scores the final form before saving and persists only the AI review`, async () => {
    const app = createSubmission(file);
    await app.submit();
    assert.deepEqual(app.calls, ['score', 'save']);
    assert.equal(app.writes.length, 1);
    assert.deepEqual(app.writes[0].review, review);
    assert.equal(app.writes[0].description, app.formData.value.description);
    assert.equal(app.state.value, false);
  });

  test(`${file}: evaluation failure keeps the form and prevents a database write`, async () => {
    const app = createSubmission(file, true);
    const before = JSON.stringify(app.formData.value);
    await app.submit();
    assert.deepEqual(app.calls, ['score']);
    assert.equal(app.writes.length, 0);
    assert.equal(JSON.stringify(app.formData.value), before);
    assert.equal(app.state.value, false);
    assert.ok(app.alerts.some(value => value.includes('AI evaluation unavailable')));
  });
}

test('the scoring API sends final event facts and excludes any imported/human ratings', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/api/eventScoring.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  let payload;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(() => ({ requestAi: async (endpoint, body) => {
    assert.equal(endpoint, '/score-event'); payload = body; return review;
  } }), mod, mod.exports);
  const draft = createSubmission('components/EventForm.vue').formData.value;
  assert.equal(await mod.exports.scoreEventForSubmission(draft), review);
  assert.equal(payload.event.description, draft.description);
  assert.deepEqual(payload.event.tags, ['Cloud Computing']);
  assert.equal(payload.event.reviewStars, undefined);
  assert.equal(payload.event.reviewScore, undefined);
  assert.equal(payload.event.reviewSentence, undefined);
});
