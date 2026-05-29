
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
              <button type="button" class="tool-button" title="Bold" @mousedown.prevent="saveSelection" @click="formatText('bold')">B</button>
              <button type="button" class="tool-button italic" title="Italic" @mousedown.prevent="saveSelection" @click="formatText('italic')">I</button>
              <button type="button" class="tool-button underline" title="Underline" @mousedown.prevent="saveSelection" @click="formatText('underline')">U</button>
              <button type="button" class="tool-button color-tool" title="Text color" @mousedown.prevent="saveSelection" @click="openTextColorPicker">
                <span class="color-tool-letter">A</span>
                <span class="color-tool-bar" :style="{ backgroundColor: textColor }"></span>
              </button>
              <input
                ref="textColorInputRef"
                v-model="textColor"
                class="hidden-color-input"
                type="color"
                aria-label="Choose text color"
                @input="setTextColor"
              />

              <select class="tool-select tool-select-heading" title="Heading" @mousedown="saveSelection" @change="setBlock">
                <option value="">Style</option>
                <option value="p">Paragraph</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="h4">Heading 4</option>
                <option value="blockquote">Quote</option>
              </select>

              <button
                type="button"
                class="tool-button list-tool"
                title="Bulleted list"
                aria-label="Bulleted list"
                @mousedown.prevent="saveSelection"
                @click="formatText('insertUnorderedList')"
              >
                <svg class="list-icon" aria-hidden="true" viewBox="0 0 20 20">
                  <circle cx="4" cy="5" r="1.3" />
                  <circle cx="4" cy="10" r="1.3" />
                  <circle cx="4" cy="15" r="1.3" />
                  <rect x="7" y="4" width="9" height="2" rx="1" />
                  <rect x="7" y="9" width="9" height="2" rx="1" />
                  <rect x="7" y="14" width="9" height="2" rx="1" />
                </svg>
              </button>

              <button
                type="button"
                class="tool-button list-tool"
                title="Numbered list"
                aria-label="Numbered list"
                @mousedown.prevent="saveSelection"
                @click="formatText('insertOrderedList')"
              >
                <svg class="list-icon" aria-hidden="true" viewBox="0 0 20 20">
                  <text x="1.6" y="6.8">1</text>
                  <text x="1.3" y="11.8">2</text>
                  <text x="1.3" y="16.8">3</text>
                  <rect x="7" y="4" width="9" height="2" rx="1" />
                  <rect x="7" y="9" width="9" height="2" rx="1" />
                  <rect x="7" y="14" width="9" height="2" rx="1" />
                </svg>
              </button>

              <button
                type="button"
                class="tool-button clear-format-tool"
                :class="{ 'tool-button-active': isFormatPainterActive }"
                title="Format painter"
                aria-label="Format painter"
                @mousedown.prevent="saveSelection"
                @click="toggleFormatPainter"
              >
                <span class="clear-format-icon" aria-hidden="true"></span>
              </button>
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
              @mouseup="handleEditorPointerUp"
              @keyup="saveSelection"
              @focus="saveSelection"
              @blur="syncBody"
            ></div>
          </div>

          <div class="media-placeholder">

          <div>
            <h3>Media and attachments</h3>
            <p v-if="selectedMediaFile">
              Selected: {{ selectedMediaFile.name }}
            </p>
            <p v-else>
              Select an image to attach to your post.
            </p>
          </div>

          <input
            ref="mediaInputRef"
            class="hidden-file-input"
            type="file"
            accept="image/*,video/*"
            @change="handleMediaSelected"
          />

          <button
            type="button"
            class="secondary-button"
            :disabled="isUploadingMedia"
            @click="openMediaPicker"
          >
            {{ isUploadingMedia ? 'Uploading...' : uploadedMediaUrl ? 'Change image' : 'Select image or video' }}
          </button>
          <p v-if="uploadedMediaUrl" class="selected-file-name">
            Uploaded successfully.
          </p>

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
                  @wheel="handleEventListWheel"
                  @touchstart="handleEventListTouchStart"
                  @touchmove="handleEventListTouchMove"
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

                  <p
                    v-if="eventResults.length < searchedEvents.length"
                    class="event-result-status"
                    :class="{ loading: isLoadingMoreEvents }"
                  >
                    <span v-if="isLoadingMoreEvents" class="event-result-spinner" aria-hidden="true"></span>
                    <span>{{ eventLoadStatusText }}</span>
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
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';



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
const textColorInputRef = ref<HTMLInputElement | null>(null);
const savedSelection = ref<Range | null>(null);
const isFormatPainterActive = ref(false);
const isPublishing = ref(false);
const isEventSelectorOpen = ref(false);
const errorMessage = ref('');
const eventSearch = ref('');
const textColor = ref('#24304a');
const visibleEventCount = ref(12);
const isEventLoadArmed = ref(false);
const isLoadingMoreEvents = ref(false);
const eventListTouchStartY = ref<number | null>(null);
const bodyPlaceholder = 'Share your experience, thoughts, highlights, or advice...';
const EVENT_BATCH_SIZE = 12;
const EVENT_LOAD_DELAY_MS = 450;
const mediaInputRef = ref<HTMLInputElement | null>(null);
const selectedMediaFile = ref<File | null>(null);
const uploadedMediaUrl = ref('');
const isUploadingMedia = ref(false);



type PainterStyle = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string | null;
  blockTag: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote' | null;
};

const copiedPainterStyle = ref<PainterStyle | null>(null);

const toDate = (value: unknown): Date => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  return new Date(value as string | number | Date);
};

const getEventTimeMs = (event: UWEvent): number => {
  const startTime = toDate(event.startTime).getTime();
  if (!Number.isNaN(startTime)) return startTime;

  const endTime = toDate(event.endtime).getTime();
  return Number.isNaN(endTime) ? Number.MAX_SAFE_INTEGER : endTime;
};

const getEventEndTimeMs = (event: UWEvent): number => {
  const endTime = toDate(event.endtime).getTime();
  return Number.isNaN(endTime) ? Number.MAX_SAFE_INTEGER : endTime;
};

const getEventDropdownGroup = (event: UWEvent): number => {
  const isSaved = savedEventIds.value.has(event.id);
  const isOutdated = getEventEndTimeMs(event) < Date.now();

  if (isSaved && isOutdated) return 0;
  if (isOutdated) return 1;
  if (isSaved) return 2;
  return 3;
};

const events = computed(() => eventStore.events);
const savedEventIds = computed(() => new Set(userStore.userProfile?.savedEventIds ?? []));
const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => {
    const groupDifference = getEventDropdownGroup(a) - getEventDropdownGroup(b);
    if (groupDifference !== 0) return groupDifference;

    const timeDifference = getEventTimeMs(a) - getEventTimeMs(b);
    if (timeDifference !== 0) return timeDifference;

    return a.title.localeCompare(b.title);
  });
});
const selectedEvent = computed(() => events.value.find((event) => event.id === selectedEventId.value) ?? null);
const searchedEvents = computed<UWEvent[]>(() => {
  const query = eventSearch.value.trim();
  if (!query) return sortedEvents.value;

  return eventFuse.value
    .search(query)
    .map((result) => result.item)
    .sort((a, b) => sortedEvents.value.indexOf(a) - sortedEvents.value.indexOf(b));
});
const eventFuse = computed(() => new Fuse(sortedEvents.value, {
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
const hasMoreEventResults = computed(() => eventResults.value.length < searchedEvents.value.length);
const eventLoadStatusText = computed(() => {
  if (isLoadingMoreEvents.value) return 'Loading more events...';
  if (isEventLoadArmed.value) return 'Pull a little more to load';
  return 'Scroll to the bottom for more events';
});
const canPublish = computed(() =>
  title.value.trim().length > 0 &&
  selectedEventId.value.length > 0 &&
  bodyText.value.trim().length > 0 &&
  !isUploadingMedia.value
);

const isSelectionInsideEditor = (selection: Selection | null) => {
  const editor = editorRef.value;
  if (!editor || !selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  return editor.contains(range.startContainer) && editor.contains(range.endContainer);
};

const saveSelection = () => {
  const selection = window.getSelection();
  if (!isSelectionInsideEditor(selection)) return;
  savedSelection.value = selection?.getRangeAt(0).cloneRange() ?? null;
};

const restoreSelection = () => {
  const selection = window.getSelection();
  if (!selection || !savedSelection.value) return false;

  selection.removeAllRanges();
  selection.addRange(savedSelection.value);
  return true;
};

const focusEditor = () => {
  editorRef.value?.focus({ preventScroll: true });
};

const runEditorCommand = (command: string, value?: string) => {
  focusEditor();
  restoreSelection();
  document.execCommand(command, false, value);
  saveSelection();
  syncBody();
};

const syncBody = () => {
  const editor = editorRef.value;
  bodyText.value = editor?.innerText.trim() ?? '';
  bodyHtml.value = editor?.innerHTML ?? '';
};

const getCurrentPainterStyle = (): PainterStyle | null => {
  const selection = window.getSelection();
  const editor = editorRef.value;
  if (!editor || !selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer)) return null;

  let node: Node | null = range.startContainer;
  let blockTag: PainterStyle['blockTag'] = null;
  while (node && node !== editor) {
    if (node instanceof HTMLElement) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'blockquote') {
        blockTag = tag;
        break;
      }
    }
    node = node.parentNode;
  }

  const colorValue = document.queryCommandValue('foreColor');

  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    color: typeof colorValue === 'string' && colorValue ? colorValue : null,
    blockTag,
  };
};

const applyPainterStyle = (style: PainterStyle) => {
  if (style.blockTag) {
    runEditorCommand('formatBlock', `<${style.blockTag}>`);
  }

  document.execCommand('styleWithCSS', false, 'true');
  const syncToggle = (command: 'bold' | 'italic' | 'underline', enabled: boolean) => {
    const currentState = document.queryCommandState(command);
    if (currentState !== enabled) {
      document.execCommand(command, false, null);
    }
  };

  syncToggle('bold', style.bold);
  syncToggle('italic', style.italic);
  syncToggle('underline', style.underline);

  if (style.color) {
    document.execCommand('foreColor', false, style.color);
    textColor.value = style.color;
  }

  saveSelection();
  syncBody();
};

const formatText = (command: string, value?: string) => {
  runEditorCommand(command, value);
};

const setBlock = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  if (!value) return;
  runEditorCommand('formatBlock', `<${value}>`);
  (event.target as HTMLSelectElement).value = '';
};

const openTextColorPicker = () => {
  textColorInputRef.value?.click();
};

const setTextColor = () => {
  runEditorCommand('styleWithCSS', 'true');
  runEditorCommand('foreColor', textColor.value);
};

const toggleFormatPainter = () => {
  if (isFormatPainterActive.value) {
    isFormatPainterActive.value = false;
    copiedPainterStyle.value = null;
    return;
  }

  const style = getCurrentPainterStyle();
  if (!style) return;

  copiedPainterStyle.value = style;
  isFormatPainterActive.value = true;
};

const handleEditorPointerUp = () => {
  saveSelection();
  const selection = window.getSelection();
  if (!isFormatPainterActive.value || !copiedPainterStyle.value || !selection || selection.isCollapsed) return;

  applyPainterStyle(copiedPainterStyle.value);
  isFormatPainterActive.value = false;
  copiedPainterStyle.value = null;
};

const insertLink = () => {
  const url = linkUrl.value.trim();
  if (!url) return;
  runEditorCommand('createLink', url);
  linkUrl.value = '';
};

const openMediaPicker = () => {
  mediaInputRef.value?.click();
};

const handleMediaSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;

  selectedMediaFile.value = file;
  uploadedMediaUrl.value = '';

  console.log('Selected file:', file);

  if (file) {
    await uploadSelectedMedia(file);
  }
};
const uploadSelectedMedia = async (fileToUpload = selectedMediaFile.value) => {
  if (!fileToUpload || !userStore.userProfile?.uid) return;

  isUploadingMedia.value = true;

  try {
    const path = `forum-media/${userStore.userProfile.uid}/${Date.now()}-${fileToUpload.name}`;
    const fileRef = storageRef(storage, path);

    await uploadBytes(fileRef, fileToUpload);

    uploadedMediaUrl.value = await getDownloadURL(fileRef);

    console.log('Uploaded media URL:', uploadedMediaUrl.value);
  } catch (error) {
    console.error('Failed to upload media:', error);
  } finally {
    isUploadingMedia.value = false;
  }
};



const openEventSelector = async () => {
  isEventSelectorOpen.value = true;
  visibleEventCount.value = EVENT_BATCH_SIZE;
  isEventLoadArmed.value = false;
  isLoadingMoreEvents.value = false;
  await nextTick();
  eventSearchRef.value?.focus();
};

const closeEventSelector = () => {
  isEventSelectorOpen.value = false;
  isEventLoadArmed.value = false;
  isLoadingMoreEvents.value = false;
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
  if (!hasMoreEventResults.value) return;
  visibleEventCount.value += EVENT_BATCH_SIZE;
};

const triggerEventLoadMore = () => {
  if (!isEventLoadArmed.value || isLoadingMoreEvents.value || !hasMoreEventResults.value) return;

  isLoadingMoreEvents.value = true;
  window.setTimeout(() => {
    loadMoreEvents();
    isEventLoadArmed.value = false;
    isLoadingMoreEvents.value = false;
  }, EVENT_LOAD_DELAY_MS);
};

const handleEventListScroll = () => {
  const list = eventResultListRef.value;
  if (!list) return;

  const remainingScroll = list.scrollHeight - list.scrollTop - list.clientHeight;
  isEventLoadArmed.value = hasMoreEventResults.value && remainingScroll <= 8;
};

const handleEventListWheel = (event: WheelEvent) => {
  if (event.deltaY <= 0) return;
  triggerEventLoadMore();
};

const handleEventListTouchStart = (event: TouchEvent) => {
  eventListTouchStartY.value = event.touches[0]?.clientY ?? null;
};

const handleEventListTouchMove = (event: TouchEvent) => {
  if (eventListTouchStartY.value === null) return;

  const currentY = event.touches[0]?.clientY ?? eventListTouchStartY.value;
  const isPullingPastBottom = eventListTouchStartY.value - currentY > 18;
  if (isPullingPastBottom) {
    triggerEventLoadMore();
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
    const postId = await createEventExperiencePost(
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
        mediaUrls: uploadedMediaUrl.value ? [uploadedMediaUrl.value] : [],
      }
    );

    console.log('Created forum experience post:', {
      eventId: selectedEventId.value,
      postId,
      firestorePath: `events/${selectedEventId.value}/forumPosts/${postId}`,
      mediaUrls: uploadedMediaUrl.value ? [uploadedMediaUrl.value] : [],
    });

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
  if (typeof eventId === 'string' && events.value.some((event) => event.id === eventId)) {
    selectedEventId.value = eventId;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
});

watch(eventSearch, async () => {
  visibleEventCount.value = EVENT_BATCH_SIZE;
  isEventLoadArmed.value = false;
  isLoadingMoreEvents.value = false;
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
  align-items: center;
  padding: 8px 10px;
  border: 1px solid #d9e0ec;
  border-radius: 18px;
  background: #edf2fa;
}

.hidden-color-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.tool-button,
.tool-select,
.secondary-button,
.publish-button,
.login-button {
  border: none;
  font: inherit;
  cursor: pointer;
}

.tool-button,
.tool-select {
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: #445063;
  font-family: "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-weight: 600;
}

.tool-button {
  width: 42px;
  font-size: 1.05rem;
}

.tool-button:hover,
.tool-select:hover {
  background: rgba(255, 255, 255, 0.55);
}

.tool-button-active {
  background: rgba(66, 133, 244, 0.18);
  color: #1a73e8;
}

.color-tool,
.clear-format-tool {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tool-button.italic {
  font-style: italic;
}

.tool-button.underline {
  text-decoration: underline;
}

.tool-select {
  padding: 0 14px;
  min-width: 112px;
  cursor: pointer;
  appearance: none;
  font-size: 0.98rem;
  background-image:
    linear-gradient(45deg, transparent 50%, #5c677a 50%),
    linear-gradient(135deg, #5c677a 50%, transparent 50%);
  background-position:
    calc(100% - 18px) calc(50% - 2px),
    calc(100% - 13px) calc(50% - 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 28px;
}

.tool-select-heading {
  min-width: 176px;
  background-color: rgba(255, 255, 255, 0.42);
  border-left: 1px solid #c9d2e0;
  border-right: 1px solid #c9d2e0;
  border-radius: 0;
  padding-left: 18px;
  font-size: 1rem;
}

.color-tool-letter {
  font-size: 1.55rem;
  line-height: 1;
  font-weight: 500;
}

.color-tool-bar {
  position: absolute;
  bottom: 8px;
  width: 20px;
  height: 4px;
  border-radius: 999px;
  background: #24304a;
}

.clear-format-icon {
  position: relative;
  width: 18px;
  height: 18px;
  border: 2px solid #4b5563;
  border-radius: 4px 4px 6px 6px;
  transform: rotate(-18deg);
}

.clear-format-icon::before {
  content: "";
  position: absolute;
  top: 4px;
  left: -4px;
  width: 10px;
  height: 4px;
  border: 2px solid #4b5563;
  border-radius: 3px;
  background: #fff;
}

.clear-format-icon::after {
  content: "";
  position: absolute;
  right: 1px;
  bottom: -7px;
  width: 4px;
  height: 8px;
  border-radius: 999px;
  background: #4b5563;
}

.list-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.list-icon {
  width: 20px;
  height: 20px;
  fill: #4f5b6d;
}

.list-icon text {
  fill: #4f5b6d;
  font-size: 6.8px;
  font-weight: 700;
  font-family: "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
  font-family: "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: 0.01em;
  outline: none;
  white-space: pre-wrap;
}

.body-editor :deep(h2) {
  margin: 0.5em 0 0.3em;
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.2;
}

.body-editor :deep(h1) {
  margin: 0.55em 0 0.35em;
  font-size: 1.9rem;
  font-weight: 750;
  line-height: 1.15;
}

.body-editor :deep(h3) {
  margin: 0.45em 0 0.25em;
  font-size: 1.25rem;
  font-weight: 650;
  line-height: 1.25;
}

.body-editor :deep(h4) {
  margin: 0.4em 0 0.2em;
  font-size: 1.08rem;
  font-weight: 650;
  line-height: 1.3;
}

.body-editor :deep(blockquote) {
  margin: 0 0 0.9em;
  padding: 0.2em 0 0.2em 1em;
  border-left: 3px solid rgba(99, 102, 241, 0.28);
  color: #4f5d78;
  font-style: italic;
}

.body-editor :deep(p) {
  margin: 0 0 0.75em;
}

.body-editor :deep(ul),
.body-editor :deep(ol) {
  margin: 0 0 0.9em 1.3em;
  padding-left: 1.1em;
}

.body-editor :deep(ul) {
  list-style: disc;
}

.body-editor :deep(ol) {
  list-style: decimal;
}

.body-editor :deep(li) {
  display: list-item;
  margin-bottom: 0.35em;
}

.body-editor:focus {
  border-color: rgba(99, 102, 241, 0.36);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

.body-editor:empty::before {
  content: attr(data-placeholder);
  color: #9aa3b8;
  font-weight: 400;
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

.hidden-file-input {
  display: none;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 4px 0 0;
  min-height: 42px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.08);
  color: #4f5f85;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
  transition: background 0.2s ease, color 0.2s ease;
}

.event-result-status.loading {
  background: rgba(66, 133, 244, 0.14);
  color: #1a57b8;
}

.event-result-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(26, 87, 184, 0.22);
  border-top-color: #1a57b8;
  border-radius: 50%;
  animation: event-result-spin 0.7s linear infinite;
}

@keyframes event-result-spin {
  to {
    transform: rotate(360deg);
  }
}

.publish-button,
.login-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 12px 16px;
  font-weight: 800;
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
