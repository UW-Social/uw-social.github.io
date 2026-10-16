const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the component's full filter/sort/ranking pipeline without Firebase.
function createList(props) {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/EventList.vue'), 'utf8');
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];
  const { outputText } = ts.transpileModule(
    `${script}\nmodule.exports = { refresh, filteredEvents };`,
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
  );
  const events = [
    {
      id: 'christmas', title: 'Seattle Christmas Market', tags: ['festival'], participants: [],
      location: 'Seattle Center', createdAt: '2026-10-14T00:00:00Z',
      startTime: '2026-11-20T08:00:00Z', endtime: '2026-12-25T07:59:59Z',
      schedule: { type: 'DAILY', startDate: '2026-11-20T08:00:00Z', endDate: '2026-12-24T08:00:00Z' },
    },
    {
      id: 'micron', title: 'Careers That Power Micron', tags: ['career'], participants: [],
      location: 'Online', createdAt: { seconds: Date.parse('2026-10-13T00:00:00Z') / 1000 },
      startTime: '2026-10-16T18:00:00Z', endtime: '2026-10-16T20:00:00Z',
      schedule: { type: 'ONE_TIME', startDatetime: '2026-10-16T18:00:00Z' },
    },
  ];
  const dependencies = {
    vue: { ref: value => ({ value }), watch() {}, onMounted() {} },
    'fuse.js': { default: require('fuse.js') },
    './EventCard.vue': {},
    '../stores/event': { useEventStore: () => ({ events }) },
    '../stores/user': {
      useUserStore: () => ({ isLoggedIn: true, userProfile: { tags: ['festival'] } }),
    },
  };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'defineProps', 'defineEmits', outputText)(
    name => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    }, mod, mod.exports, () => props, () => {},
  );
  return mod.exports;
}

test('explicit date sorting wins over recommendation ranking for a logged-in user', async () => {
  const originalNow = Date.now;
  Date.now = () => Date.parse('2026-10-15T12:00:00Z');
  try {
    for (const recommendationMode of [undefined, 'latest', 'personalized', 'trending']) {
      const props = { sort: 'soonest', recommendationMode };
      const list = createList(props);
      await list.refresh();
      assert.deepEqual(list.filteredEvents.value.map(event => event.id), ['micron', 'christmas'], recommendationMode);

      props.sort = 'newly-added';
      await list.refresh();
      assert.deepEqual(list.filteredEvents.value.map(event => event.id), ['christmas', 'micron'], recommendationMode);

      props.sort = 'online';
      await list.refresh();
      assert.deepEqual(list.filteredEvents.value.map(event => event.id), ['micron'], recommendationMode);

      props.sort = 'soonest';
      await list.refresh();
      assert.deepEqual(list.filteredEvents.value.map(event => event.id), ['micron', 'christmas'], recommendationMode);
    }

    // Recommendation feeds that do not request a date sort still use ranking.
    const feed = createList({ recommendationMode: 'personalized' });
    await feed.refresh();
    assert.equal(feed.filteredEvents.value[0].id, 'christmas');
  } finally {
    Date.now = originalNow;
  }
});
