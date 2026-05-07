<template>
  <div class="editor-page">
    <div class="editor-shell">
      <header class="editor-header">
        <div>
          <h1>Share your experience!</h1>
          <p class="header-copy">Write a longer review, recap, or reflection from an event.</p>
        </div>
      </header>

      <section v-if="!userStore.isLoggedIn" class="login-card">
        <h2>Log in to share your experience.</h2>
        <p>Your draft starts here after you sign in.</p>
        <button class="login-button" type="button" @click="goToLogin">Log in</button>
      </section>

      <div v-else class="editor-layout">
        <main class="editor-card">
          <div class="form-field">
            <label class="field-label" for="experience-title">
              Title <span class="required-marker">*</span>
            </label>
            <input
              id="experience-title"
              v-model="title"
              class="title-input"
              type="text"
              placeholder="Give your experience a title"
            />
          </div>

          <div class="form-field">
            <label class="field-label" for="experience-subtitle">Subtitle</label>
            <input
              id="experience-subtitle"
              v-model="subtitle"
              class="subtitle-input"
              type="text"
              placeholder="Add a short subtitle or summary"
            />
          </div>

          <div class="form-field editor-body-field">
            <label class="field-label" for="experience-body">
              Body <span class="required-marker">*</span>
            </label>

            <div class="toolbar" aria-label="Text formatting tools">
              <button type="button" class="tool-button" title="Bold" @click="formatText('bold')">B</button>
              <button type="button" class="tool-button italic" title="Italic" @click="formatText('italic')">I</button>
              <button type="button" class="tool-button underline" title="Underline" @click="formatText('underline')">U</button>
              <button type="button" class="tool-button highlight" title="Highlight" @click="formatText('hiliteColor', '#fff3a3')">H</button>

              <select class="tool-select" title="Font size" @change="setFontSize">
                <option value="">Size</option>
                <option value="3">Normal</option>
                <option value="4">Large</option>
                <option value="5">XL</option>
              </select>

              <select class="tool-select" title="Heading" @change="setBlock">
                <option value="">Heading</option>
                <option value="p">Paragraph</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
              </select>

              <button type="button" class="tool-button" title="Bullet list" @click="formatText('insertUnorderedList')">•</button>
              <button type="button" class="tool-button" title="Numbered list" @click="formatText('insertOrderedList')">1.</button>
            </div>

            <div class="link-row">
              <input
                v-model="linkUrl"
                type="url"
                placeholder="Paste a link, select text, then add"
              />
              <button type="button" class="secondary-button" :disabled="!linkUrl.trim()" @click="insertLink">
                Add Link
              </button>
            </div>

            <div
              id="experience-body"
              ref="editorRef"
              class="body-editor"
              contenteditable="true"
              role="textbox"
              aria-multiline="true"
              :data-placeholder="bodyPlaceholder"
              @input="syncBody"
              @blur="syncBody"
            ></div>
          </div>

          <div class="media-placeholder">
            <div>
              <h3>Media and attachments</h3>
              <p>Images, video, and file attachments will live here.</p>
            </div>
            <button type="button" class="secondary-button" disabled>
              Upload coming soon
            </button>
          </div>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </main>

        <aside class="publish-panel">
          <div ref="eventSelectorRef" class="event-selector">
            <label class="field-label" for="related-event-search">Related Event</label>

            <div v-if="selectedEvent && !isEventSelectorOpen" class="selected-event-card">
              <div>
                <h2>{{ selectedEvent.title }}</h2>
                <p>{{ formatEventSchedule(selectedEvent) }}</p>
                <p>{{ selectedEvent.location || 'Location TBD' }}</p>
              </div>
              <button class="change-event-button" type="button" @click="openEventSelector">
                Change
              </button>
            </div>

            <div v-else class="event-combobox">
              <button
                class="event-combobox-trigger"
                type="button"
                @click="openEventSelector"
              >
                <span>{{ selectedEvent?.title || 'Search and select an event' }}</span>
              </button>

              <div v-if="isEventSelectorOpen" class="event-dropdown">
                <input
                  id="related-event-search"
                  ref="eventSearchRef"
                  v-model="eventSearch"
                  class="event-search-input"
                  type="search"
                  placeholder="Search by title, location, tag, or category"
                  @keydown.esc="closeEventSelector"
                />

                <div
                  v-if="eventResults.length > 0"
                  ref="eventResultListRef"
                  class="event-result-list"
                  @scroll="handleEventListScroll"
                >
                  <button
                    v-for="event in eventResults"
                    :key="event.id"
                    class="event-result"
                    type="button"
                    @click="selectEvent(event.id)"
                  >
                    <span class="event-result-title">{{ event.title }}</span>
                    <span class="event-result-meta">{{ formatEventSchedule(event) }}</span>
                    <span class="event-result-meta">{{ event.location || 'Location TBD' }}</span>
                  </button>

                  <p v-if="eventResults.length < searchedEvents.length" class="event-result-status">
                    Scroll to load more events
                  </p>
                </div>

                <div v-else class="event-empty-state">
                  <p>No matching events found.</p>
                  <button class="clear-search-button" type="button" @click="eventSearch = ''">
                    Clear search
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="publish-info">
            <p>Long-form posts publish to the Forum feed and stay separate from event comments.</p>
          </div>

          <button
            class="publish-button"
            type="button"
            :disabled="!canPublish || isPublishing"
            @click="publishPost"
          >
            {{ isPublishing ? 'Publishing...' : 'Publish Experience' }}
          </button>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Fuse from 'fuse.js';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createEventExperiencePost } from '../api/forums';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';
import { formatEventSchedule, type Event as UWEvent } from '../types/event';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const userStore = useUserStore();

const title = ref('');
const subtitle = ref('');
const selectedEventId = ref('');
const bodyText = ref('');
const bodyHtml = ref('');
const linkUrl = ref('');
const editorRef = ref<HTMLElement | null>(null);
const eventSelectorRef = ref<HTMLElement | null>(null);
const eventSearchRef = ref<HTMLInputElement | null>(null);
const eventResultListRef = ref<HTMLElement | null>(null);
const isPublishing = ref(false);
const isEventSelectorOpen = ref(false);
const errorMessage = ref('');
const eventSearch = ref('');
const visibleEventCount = ref(12);
const bodyPlaceholder = 'Share your experience, thoughts, highlights, or advice...';
const EVENT_BATCH_SIZE = 12;

const toDate = (value: unknown): Date => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  return new Date(value as string | number | Date);
};

const events = computed(() => eventStore.events);
const upcomingEvents = computed(() => {
  const now = Date.now();
  return events.value.filter((event) => toDate(event.endtime).getTime() > now);
});
const selectedEvent = computed(() => upcomingEvents.value.find((event) => event.id === selectedEventId.value) ?? null);
const sortedEvents = computed(() => upcomingEvents.value);
const searchedEvents = computed<UWEvent[]>(() => {
  const query = eventSearch.value.trim();
  if (!query) return sortedEvents.value;

  return eventFuse.value
    .search(query)
    .map((result) => result.item);
});
const eventFuse = computed(() => new Fuse(events.value, {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'location', weight: 0.22 },
    { name: 'category', weight: 0.14 },
    { name: 'tags', weight: 0.14 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 2,
}));
const eventResults = computed<UWEvent[]>(() => {
  return searchedEvents.value.slice(0, visibleEventCount.value);
});
const canPublish = computed(() =>
  title.value.trim().length > 0 &&
  selectedEventId.value.length > 0 &&
  bodyText.value.trim().length > 0
);

const focusEditor = async () => {
  await nextTick();
  editorRef.value?.focus();
};

const syncBody = () => {
  const editor = editorRef.value;
  bodyText.value = editor?.innerText.trim() ?? '';
  bodyHtml.value = editor?.innerHTML ?? '';
};

const formatText = (command: string, value?: string) => {
  focusEditor();
  document.execCommand(command, false, value);
  syncBody();
};

const setFontSize = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  if (!value) return;
  formatText('fontSize', value);
  (event.target as HTMLSelectElement).value = '';
};

const setBlock = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  if (!value) return;
  formatText('formatBlock', value);
  (event.target as HTMLSelectElement).value = '';
};

const insertLink = () => {
  const url = linkUrl.value.trim();
  if (!url) return;
  focusEditor();
  document.execCommand('createLink', false, url);
  linkUrl.value = '';
  syncBody();
};

const openEventSelector = async () => {
  isEventSelectorOpen.value = true;
  visibleEventCount.value = EVENT_BATCH_SIZE;
  await nextTick();
  eventSearchRef.value?.focus();
};

const closeEventSelector = () => {
  isEventSelectorOpen.value = false;
};

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (!isEventSelectorOpen.value) return;
  const selector = eventSelectorRef.value;
  if (selector && event.target instanceof Node && selector.contains(event.target)) return;
  closeEventSelector();
};

const selectEvent = (eventId: string) => {
  selectedEventId.value = eventId;
  eventSearch.value = '';
  closeEventSelector();
};

const loadMoreEvents = () => {
  if (visibleEventCount.value >= searchedEvents.value.length) return;
  visibleEventCount.value += EVENT_BATCH_SIZE;
};

const handleEventListScroll = () => {
  const list = eventResultListRef.value;
  if (!list) return;

  const remainingScroll = list.scrollHeight - list.scrollTop - list.clientHeight;
  if (remainingScroll <= 24) {
    loadMoreEvents();
  }
};

const goToLogin = () => {
  router.push({
    path: '/login',
    query: {
      redirect: route.fullPath,
      prompt: 'Please log in to share your experience.'
    }
  });
};

const publishPost = async () => {
  if (!userStore.userProfile?.email || !canPublish.value) return;

  isPublishing.value = true;
  errorMessage.value = '';
  syncBody();

  try {
    await createEventExperiencePost(
      selectedEventId.value,
      {
        uid: userStore.userProfile.uid,
        email: userStore.userProfile.email,
        displayName: userStore.userProfile.displayName,
      },
      {
        title: title.value.trim(),
        subtitle: subtitle.value.trim(),
        body: bodyText.value.trim(),
        bodyHtml: bodyHtml.value,
        mediaUrls: [],
      }
    );

    router.push('/forum');
  } catch (error) {
    console.error('Failed to publish experience:', error);
    errorMessage.value = 'Failed to publish your experience. Please try again.';
  } finally {
    isPublishing.value = false;
  }
};

onMounted(async () => {
  document.addEventListener('pointerdown', handleDocumentPointerDown);

  if (eventStore.events.length === 0) {
    await eventStore.fetchEvents();
  }

  const eventId = route.query.eventId;
  if (typeof eventId === 'string' && upcomingEvents.value.some((event) => event.id === eventId)) {
    selectedEventId.value = eventId;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
});

watch(eventSearch, async () => {
  visibleEventCount.value = EVENT_BATCH_SIZE;
  await nextTick();
  const list = eventResultListRef.value;
  if (list) list.scrollTop = 0;
});
</script>

<style scoped>
.editor-page {
  min-height: calc(100vh - var(--navbar-height));
  padding: 42px var(--spacing-3xl) var(--spacing-4xl);
  background-color: var(--color-white);
  box-shadow: 0 calc(-1 * var(--navbar-height)) 0 var(--color-white);
}

.editor-shell {
  max-width: 1180px;
  margin: 0 auto;
}

.editor-header {
  max-width: 760px;
  margin: 0 auto 32px;
  text-align: center;
}

.editor-header h1 {
  margin: 0;
  color: var(--color-gray-900);
  font-size: clamp(1.9rem, 3.3vw, 2.95rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--color-gray-900) 0%, var(--color-gray-600) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-copy {
  margin: 10px 0 0;
  color: #5f6781;
  font-size: 1.05rem;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
}

.editor-card,
.publish-panel,
.login-card {
  border-radius: 24px;
  border: 1px solid rgba(108, 99, 255, 0.1);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 48px rgba(31, 39, 64, 0.08);
}

.editor-card {
  padding: 32px;
}

.publish-panel {
  position: sticky;
  top: calc(var(--navbar-height) + 24px);
  padding: 24px;
}

.login-card {
  padding: 36px;
  max-width: 620px;
}

.login-card h2 {
  margin: 0 0 8px;
  color: #172033;
}

.login-card p {
  margin: 0 0 18px;
  color: #5f6781;
}

.field-label {
  display: block;
  margin: 0 0 8px;
  color: #24304a;
  font-weight: 800;
}

.form-field {
  margin-bottom: 24px;
}

.form-field:last-of-type {
  margin-bottom: 0;
}

.required-marker {
  color: #d92d20;
}

.title-input,
.subtitle-input,
.link-row input {
  width: 100%;
  border: 1px solid rgba(99, 102, 241, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  color: #172033;
  font: inherit;
  min-height: 50px;
}

.title-input {
  padding: 14px 16px;
  font-size: 1rem;
  font-weight: 800;
}

.subtitle-input,
.link-row input {
  padding: 14px 16px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 12px;
}

.tool-button,
.tool-select,
.secondary-button,
.publish-button,
.login-button {
  border: none;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.tool-button,
.tool-select {
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.14);
  background: #fff;
  color: #24304a;
}

.tool-button {
  width: 42px;
}

.tool-button.italic {
  font-style: italic;
}

.tool-button.underline {
  text-decoration: underline;
}

.tool-button.highlight {
  background: #fff8c7;
}

.tool-select {
  padding: 0 10px;
}

.link-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.body-editor {
  min-height: 420px;
  border: 1px solid rgba(99, 102, 241, 0.14);
  border-radius: 20px;
  padding: 20px;
  color: #20263a;
  background: rgba(255, 255, 255, 0.94);
  line-height: 1.75;
  outline: none;
  white-space: pre-wrap;
}

.body-editor:focus {
  border-color: rgba(99, 102, 241, 0.36);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

.body-editor:empty::before {
  content: attr(data-placeholder);
  color: #9aa3b8;
}

.media-placeholder {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px dashed rgba(99, 102, 241, 0.26);
  border-radius: 18px;
  padding: 18px;
  background: rgba(247, 248, 255, 0.82);
}

.media-placeholder h3,
.selected-event-card h2 {
  margin: 0 0 6px;
  color: #172033;
}

.media-placeholder p,
.selected-event-card p,
.publish-info p {
  margin: 0;
  color: #64708b;
  line-height: 1.55;
}

.publish-info {
  margin-top: 16px;
  border-radius: 18px;
  padding: 16px;
  background: rgba(247, 248, 255, 0.86);
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.event-selector {
  position: relative;
}

.selected-event-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-radius: 18px;
  padding: 16px;
  background: rgba(247, 248, 255, 0.9);
  border: 1px solid rgba(99, 102, 241, 0.14);
}

.change-event-button,
.clear-search-button {
  border: none;
  border-radius: 999px;
  background: rgba(31, 39, 64, 0.08);
  color: #20263a;
  padding: 8px 12px;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.event-combobox {
  position: relative;
}

.event-combobox-trigger,
.event-search-input {
  width: 100%;
  border: 1px solid rgba(99, 102, 241, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  color: #172033;
  font: inherit;
}

.event-combobox-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
}

.event-combobox-trigger::after {
  content: "";
  width: 9px;
  height: 9px;
  border-right: 2px solid #64708b;
  border-bottom: 2px solid #64708b;
  transform: rotate(45deg) translateY(-2px);
}

.event-dropdown {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  border: 1px solid rgba(99, 102, 241, 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 42px rgba(31, 39, 64, 0.16);
  padding: 12px;
}

.event-search-input {
  padding: 12px 14px;
  outline: none;
}

.event-search-input:focus {
  border-color: rgba(99, 102, 241, 0.36);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

.event-result-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  max-height: 330px;
  overflow-y: auto;
}

.event-result {
  border: none;
  border-radius: 14px;
  background: transparent;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.event-result:hover,
.event-result:focus {
  background: rgba(99, 102, 241, 0.08);
  outline: none;
}

.event-result-title {
  display: block;
  color: #172033;
  font-weight: 800;
  line-height: 1.35;
}

.event-result-meta {
  display: block;
  margin-top: 4px;
  color: #64708b;
  font-size: 0.9rem;
  line-height: 1.35;
}

.event-empty-state {
  padding: 18px 8px 6px;
  text-align: center;
}

.event-empty-state p {
  margin: 0 0 10px;
  color: #64708b;
}

.event-result-status {
  margin: 2px 0 0;
  padding: 8px 12px 4px;
  color: #7a859e;
  font-size: 0.85rem;
  text-align: center;
}

.publish-button,
.login-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 12px 16px;
}

.publish-button,
.login-button {
  background: #1f2740;
  color: #fff;
}

.publish-button {
  width: 100%;
  margin-top: 18px;
}

.secondary-button {
  background: rgba(31, 39, 64, 0.08);
  color: #20263a;
  white-space: nowrap;
}

.publish-button:disabled,
.secondary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  margin: 16px 0 0;
  color: #b42318;
  font-weight: 700;
}

@media (max-width: 900px) {
  .editor-page {
    padding: 30px 16px 40px;
  }

  .editor-layout {
    grid-template-columns: 1fr;
  }

  .publish-panel {
    position: static;
  }

  .link-row,
  .media-placeholder {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
