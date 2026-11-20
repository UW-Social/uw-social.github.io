<template>
  <main class="imports-page">
    <header class="imports-header">
      <div><p class="eyebrow">UW SOCIAL / EDITORIAL</p><h1>Activity review</h1><p>Review sourced activities before they appear on UW Social.</p></div>
      <router-link to="/events" class="text-link">View published events ↗</router-link>
    </header>
    <section class="source-bar" aria-label="Import controls">
      <label>Calendar<select v-model="source" :disabled="busy"><option value="ece">UW ECE</option><option value="foster">UW Foster</option></select></label>
      <button class="primary" :disabled="busy || !authorized" @click="crawl">{{ working === 'crawl' ? 'Importing…' : 'Import next 20' }}</button>
      <button :disabled="busy" @click="load(false)">Refresh list</button>
      <span>Upcoming 60 days · Manual import</span>
    </section>
    <p v-if="message" class="notice" role="status">{{ message }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="review-layout">
      <section class="candidate-panel" aria-label="Activity drafts">
        <div class="list-heading"><h2>Review queue</h2><select v-model="filter" aria-label="Filter review status" :disabled="busy"><option value="pending">Pending</option><option value="published">Published</option><option value="rejected">Rejected</option><option value="all">All statuses</option></select></div>
        <p v-if="working === 'load'" class="empty">Loading activities…</p>
        <p v-else-if="!filtered.length" class="empty">No {{ filter === 'all' ? '' : filter }} activities in the loaded results. Import a calendar or load more results.</p>
        <button v-for="item in filtered" :key="item.id" class="candidate" :class="{ selected: selected?.id === item.id }" :disabled="busy" @click="select(item)">
          <span class="candidate-meta">{{ item.sourceName }} · {{ item.status }}</span><strong>{{ item.event.title }}</strong>
          <span>{{ formatTime(item.event.startTime) }}</span>
          <span v-if="item.issues.length && item.status === 'pending'" class="issue-count">{{ item.issues.length }} item(s) to check</span>
        </button>
        <button v-if="nextPage" class="load-more" :disabled="busy" @click="load(true)">Load older results</button>
      </section>
      <section class="detail-panel" aria-label="Review selected activity">
        <template v-if="selected">
          <div class="detail-heading"><div><p class="eyebrow">{{ selected.sourceName }}</p><h2>{{ selected.status === 'pending' ? 'Review & publish' : 'Activity record' }}</h2></div><a :href="selected.sourceUrl" target="_blank" rel="noopener noreferrer" class="text-link">Original source ↗</a></div>
          <p v-if="selected.publishedEventId && selected.status === 'pending'" class="notice">The source changed after publication. Approving will update the existing event.</p>
          <ul v-if="selected.issues.length && selected.status === 'pending'" class="issues"><li v-for="issue in selected.issues" :key="issue">{{ issue }}</li></ul>
          <form @submit.prevent="review('approve')">
            <fieldset :disabled="busy || selected.status !== 'pending'">
              <label>Title<input v-model="draft.title" required maxlength="500" /></label>
              <div class="field-row"><label>Category<select v-model="draft.category"><option v-for="category in categories" :key="category">{{ category }}</option></select></label><label>Location<input v-model="draft.location" required maxlength="500" placeholder="Venue or Online" /></label></div>
              <p class="time-note">All times below are Pacific Time (America/Los_Angeles).</p>
              <div class="field-row"><label>Start date<input v-model="startDate" type="date" required /></label><label>Start time<input v-model="startTime" type="time" required /></label></div>
              <div class="field-row"><label>End date<input v-model="endDate" type="date" required /></label><label>End time<input v-model="endTime" type="time" required /></label></div>
              <label>Description<textarea v-model="draft.description" rows="12" required maxlength="16000"></textarea></label>
            </fieldset>
            <div v-if="selected.status === 'pending'" class="review-actions"><p>Approval evaluates the final content with AI, then publishes it.</p><div><button type="button" :disabled="busy" @click="review('reject')">Reject</button><button type="submit" class="primary" :disabled="busy">{{ working === 'approve' ? 'Evaluating & publishing…' : 'Approve & Publish' }}</button></div></div>
            <router-link v-else-if="selected.publishedEventId" :to="`/events/${selected.publishedEventId}`" class="text-link">Open published activity ↗</router-link>
          </form>
        </template>
        <div v-else class="empty detail-empty"><span>Ready for your review</span><p>Select an activity to check its details and publish.</p></div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { requestImports, type EventCandidate, type ImportedEvent, type ImportList } from '../api/eventImports';
import { createDateInTimeZone, toDateInputInTimeZone, toTimeInputInTimeZone } from '../utils/timeZone';

const zone = 'America/Los_Angeles';
const categories = ['Academic', 'Career', 'Club', 'Sports', 'Interest'];
const items = ref<EventCandidate[]>([]), selected = ref<EventCandidate | null>(null);
const source = ref('ece'), filter = ref('pending'), nextPage = ref(''), authorized = ref(false);
const working = ref(''), error = ref(''), message = ref('');
const busy = computed(() => !!working.value);
const filtered = computed(() => items.value.filter(item => filter.value === 'all' || item.status === filter.value));
const draft = ref<ImportedEvent>({ title: '', description: '', location: '', category: 'Academic', startTime: '', endtime: '', timeZone: zone, link: '' });
const startDate = ref(''), startTime = ref(''), endDate = ref(''), endTime = ref('');
const formatTime = (value: string) => new Date(value).toLocaleString('en-US', { timeZone: zone, dateStyle: 'medium', timeStyle: 'short' });
function select(item: EventCandidate) {
  selected.value = item; draft.value = { ...item.event };
  startDate.value = toDateInputInTimeZone(new Date(item.event.startTime), zone);
  startTime.value = toTimeInputInTimeZone(new Date(item.event.startTime), zone);
  endDate.value = toDateInputInTimeZone(new Date(item.event.endtime), zone);
  endTime.value = toTimeInputInTimeZone(new Date(item.event.endtime), zone);
}
async function fetchList(append = false) {
  const result = await requestImports<ImportList>('list', { pageToken: append ? nextPage.value : '' });
  items.value = append ? [...items.value, ...result.items.filter(item => !items.value.some(existing => existing.id === item.id))] : result.items;
  nextPage.value = result.nextPageToken; authorized.value = true;
  if (selected.value) {
    const refreshed = items.value.find(item => item.id === selected.value?.id);
    if (refreshed) select(refreshed); else selected.value = null;
  }
}
async function load(append = false) {
  working.value = 'load'; error.value = '';
  try { await fetchList(append); } catch (e) { error.value = e instanceof Error ? e.message : 'Unable to load drafts.'; }
  finally { working.value = ''; }
}
async function crawl() {
  working.value = 'crawl'; error.value = ''; message.value = '';
  try {
    const result = await requestImports<{ imported: number; skipped: number }>('crawl', { sourceId: source.value });
    message.value = `${result.imported} new or changed drafts imported; ${result.skipped} unchanged drafts skipped. Nothing has been published.`;
    filter.value = 'pending'; await fetchList();
  } catch (e) { error.value = e instanceof Error ? e.message : 'Import failed.'; }
  finally { working.value = ''; }
}
async function review(action: 'approve' | 'reject') {
  if (!selected.value) return;
  working.value = action; error.value = ''; message.value = '';
  try {
    const event = action === 'approve' ? {
      ...draft.value,
      startTime: createDateInTimeZone(startDate.value, startTime.value, zone).toISOString(),
      endtime: createDateInTimeZone(endDate.value, endTime.value, zone).toISOString(),
    } : undefined;
    await requestImports('review', { id: selected.value.id, version: selected.value.version, action, event });
    message.value = action === 'approve' ? 'Activity published successfully.' : 'Activity rejected. Unchanged content will stay rejected on future imports.';
    selected.value = null; await fetchList();
  } catch (e) { error.value = e instanceof Error ? e.message : 'Review failed.'; }
  finally { working.value = ''; }
}
onMounted(() => load());
</script>

<style scoped>
.imports-page{max-width:1280px;margin:0 auto;padding:40px 24px 90px;color:#262332}.imports-header{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:28px}.eyebrow{font-size:11px;letter-spacing:.14em;color:#75668e;font-weight:700;margin:0 0 8px}h1{font-size:34px;margin:0 0 10px;letter-spacing:-.03em}h2{font-size:20px;margin:0}.imports-header p:not(.eyebrow){color:#706b78;margin:0}.text-link{color:#684495;text-decoration:none;font-size:14px;font-weight:600}.source-bar{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;padding:20px;background:#f4f1f8;border:1px solid #e5dfed;border-radius:14px;margin-bottom:20px}.source-bar>span{font-size:12px;color:#77717f;padding:12px 0;margin-left:auto}label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:600}input,select,textarea{font:inherit;color:inherit;padding:10px 12px;border:1px solid #dcd6e4;background:white;border-radius:8px;min-width:0}textarea{resize:vertical;line-height:1.65}button{font:inherit;border:1px solid #dcd6e4;border-radius:8px;padding:11px 16px;background:white;color:#493d59;cursor:pointer}button.primary{background:#684495;border-color:#684495;color:white;font-weight:600}button:disabled{opacity:.55;cursor:wait}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #baa5da;outline-offset:2px}.notice,.error{padding:14px 16px;border-radius:8px;font-size:14px;line-height:1.6}.notice{background:#edf6ef;color:#315c3c}.error{background:#fff0ef;color:#9d3530}.review-layout{display:grid;grid-template-columns:350px minmax(0,1fr);gap:20px;align-items:start}.candidate-panel,.detail-panel{background:white;border:1px solid #e7e2ed;border-radius:14px;overflow:hidden}.list-heading{padding:20px;display:flex;gap:12px;align-items:center;border-bottom:1px solid #eee9f2}.list-heading h2{font-size:16px;flex:1}.list-heading select{font-size:12px;max-width:130px}.candidate{display:flex;flex-direction:column;gap:9px;text-align:left;width:100%;border:0;border-bottom:1px solid #eee9f2;border-radius:0;padding:20px;border-left:3px solid transparent}.candidate.selected{background:#f6f2fb;border-left-color:#684495}.candidate strong{font-size:15px;line-height:1.5}.candidate>span{font-size:12px;color:#77717f}.candidate .candidate-meta{font-size:11px;color:#795d98}.candidate .issue-count{color:#a06523}.detail-panel{padding:26px}.detail-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:25px}fieldset{border:0;padding:0;margin:0;display:flex;flex-direction:column;gap:20px;min-width:0}fieldset:disabled{opacity:.8}.field-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.time-note{font-size:12px;color:#77717f;margin:0}.issues{padding:14px 16px 14px 32px;background:#fff8ea;color:#8b612a;font-size:13px;line-height:1.7;border-radius:8px}.review-actions{margin-top:24px;padding-top:20px;border-top:1px solid #eee9f2}.review-actions p{font-size:12px;color:#77717f;line-height:1.6}.review-actions>div{display:flex;justify-content:flex-end;gap:12px}.empty{padding:28px 20px;font-size:14px;color:#86808d;line-height:1.7}.detail-empty{min-height:300px;display:flex;flex-direction:column;justify-content:center;text-align:center}.detail-empty>span{font-size:20px;color:#62566e}.load-more{margin:16px}.detail-panel form>.text-link{display:block;margin-top:24px}@media(max-width:800px){.imports-page{padding:24px 16px 80px}.imports-header{align-items:flex-start;flex-direction:column}h1{font-size:28px}.review-layout{grid-template-columns:1fr}.candidate-panel{max-height:380px;overflow:auto}.detail-panel{padding:20px}.source-bar>span{width:100%;padding:0}.field-row{grid-template-columns:1fr}.detail-heading{align-items:flex-start;flex-direction:column}.review-actions>div{flex-wrap:wrap}}
</style>
