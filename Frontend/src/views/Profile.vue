we are building events collection app. add features so that user can put links to their projects, other files related to them, and think of other stuff they migh want to add and add it to the Code. Write the 4 files fully


<template>
  <div class="profile-page">
    <div class="profile-shell">
      <aside class="profile-sidebar">
        <div class="sidebar-profile">
          <img
            class="sidebar-avatar"
            :src="userStore.userProfile?.photoURL || '/images/default-avatar.png'"
            alt="User avatar"
          />
          <div class="sidebar-profile-copy">
            <h2>{{ userStore.userProfile?.displayName || 'User' }}</h2>
            <p>{{ userStore.userProfile?.grade || 'UW Student' }}</p>
            <p class="sidebar-major">{{ userStore.userProfile?.major || 'Major not set' }}</p>
          </div>
        </div>

        <nav class="sidebar-nav" aria-label="Profile sections">
          <button
            type="button"
            class="sidebar-link"
            :class="{ active: currentSection === 'saved' }"
            @click="showSection('saved')"
          >
            <span>Saved Events</span>
          </button>
          <button
            type="button"
            class="sidebar-link"
            :class="{ active: currentSection === 'published' }"
            @click="showSection('published')"
          >
            <span>Your Forum Notes</span>
          </button>
          <button
            type="button"
            class="sidebar-link"
            :class="{ active: currentSection === 'participated' }"
            @click="showSection('participated')"
          >
            <span>Your Events</span>
          </button>
        </nav>

        <button type="button" class="sidebar-cta" @click="goToEditProfile">
          <span>＋</span>
          <span>Edit Profile</span>
        </button>
      </aside>

      <main class="profile-main">
        <header class="content-header">
          <h1>{{ sectionTitle }}</h1>
          <p>{{ sectionSubtitle }}</p>
        </header>

        <section
          v-if="currentSection === 'published' && forumNotes.length > 0"
          class="notes-grid"
        >
          <article
            v-for="note in forumNotes"
            :key="note.id"
            class="note-card"
          >
            <div class="note-card-header">
              <div>
                <p class="note-label">Forum note</p>
                <h2>{{ note.title || note.eventTitle }}</h2>
              </div>
              <div class="note-actions">
                <button
                  type="button"
                  class="note-link-button"
                  @click="openForumNote(note)"
                >
                  Open
                </button>
                <button
                  type="button"
                  class="note-link-button"
                  @click="startEditingNote(note)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="note-link-button danger"
                  :disabled="deletingNoteId === note.id"
                  @click="deleteForumNote(note)"
                >
                  {{ deletingNoteId === note.id ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
            <template v-if="editingNoteId === note.id">
              <input
                v-model="editNoteTitle"
                class="note-edit-title"
                type="text"
                maxlength="120"
                placeholder="Title"
              />
              <textarea
                v-model="editNoteText"
                class="note-edit-text"
                rows="6"
                placeholder="Share your note"
              ></textarea>
              <div class="note-edit-actions">
                <button
                  type="button"
                  class="note-link-button"
                  :disabled="savingNoteId === note.id || !editNoteText.trim()"
                  @click="saveForumNote(note)"
                >
                  {{ savingNoteId === note.id ? 'Saving...' : 'Save' }}
                </button>
                <button
                  type="button"
                  class="note-link-button secondary"
                  :disabled="savingNoteId === note.id"
                  @click="cancelEditingNote"
                >
                  Cancel
                </button>
              </div>
            </template>
            <p v-else class="note-body">{{ note.text }}</p>
            <div class="note-meta">
              <span>{{ note.eventTitle }}</span>
              <span>{{ note.eventSchedule }}</span>
              <span v-if="note.eventLocation">{{ note.eventLocation }}</span>
              <span>{{ formatPostTimestamp(note.createdAt) }}</span>
            </div>
          </article>
        </section>

        <section v-else-if="currentEvents.length > 0" class="uniform-events-grid">
          <article
            v-for="event in currentEvents"
            :key="event.id"
            class="featured-event"
            @click="openEvent(event.id)"
          >
            <div
              v-if="currentSection !== 'participated'"
              class="image-countdown-badge"
            >
              {{ isUpcomingEvent(event) ? formatCountdown(event) : 'Started' }}
            </div>
            <button
              v-if="currentSection === 'participated'"
              type="button"
              class="card-edit-button"
              @click.stop="goToEditEvent(event.id)"
            >
              Edit
            </button>
            <button
              type="button"
              class="card-save-button"
              :class="{ saved: isEventSaved(event.id) }"
              @click.stop="toggleSavedEvent(event.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <img
              class="featured-event-image"
              :src="event.imageUrl || '/images/wavingdog.jpg'"
              :alt="event.title"
            />
            <div class="featured-event-body">
              <div class="badge-row">
                <span class="event-chip warm">{{ event.category || 'Campus' }}</span>
              </div>
              <h2>{{ event.title }}</h2>
              <p>{{ event.description || 'Discover one of your highlighted campus picks.' }}</p>
              <div class="event-detail-row">
                <span class="detail-item">
                  <span class="detail-icon">Time:</span>
                  <span>{{ event.date }}</span>
                </span>
                <span class="detail-item">
                  <span class="detail-icon">Place:</span>
                  <span>{{ event.location || 'Location TBD' }}</span>
                </span>
              </div>
            </div>
          </article>
        </section>

        <section v-else-if="!hasPassedSavedOnly" class="empty-panel">
          <h2>{{ emptyTitle }}</h2>
          <p>{{ emptyMessage }}</p>
        </section>

        <section
          v-if="currentSection === 'saved' && passedSavedEvents.length > 0"
          class="passed-events-section"
        >
          <div class="passed-events-divider">
            <span></span>
            <h2>Outdated Saved Event</h2>
            <span></span>
          </div>

          <div class="passed-events-grid">
            <article
              v-for="event in passedSavedEvents"
              :key="event.id"
              class="compact-event-card passed-event-card"
              @click="openEvent(event.id)"
            >
              <button
                type="button"
                class="card-save-button"
                :class="{ saved: isEventSaved(event.id) }"
                @click.stop="toggleSavedEvent(event.id)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
              <img
                class="compact-event-image"
                :src="event.imageUrl || '/images/wavingdog.jpg'"
                :alt="event.title"
              />
              <div class="compact-event-body">
                <h3>{{ event.title }}</h3>
                <div class="stack-meta">
                  <span class="compact-meta-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9"></circle>
                      <path d="M12 7v5l3 2"></path>
                    </svg>
                    <span>{{ event.date }}</span>
                  </span>
                  <span class="compact-meta-item">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11z"></path>
                      <circle cx="12" cy="10" r="2.5"></circle>
                    </svg>
                    <span>{{ event.location || 'Location TBD' }}</span>
                  </span>
                </div>
              </div>
            </article>
          </div>
        </section>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  collection,
  deleteDoc,
  deleteField,
  doc as firestoreDoc,
  documentId,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth } from '../firebase/config';
import { useUserStore } from '../stores/user';
import { formatEventCardSchedule, formatEventSchedule, RecurrenceType, type Event as FullEvent } from '../types/event';

type SectionKey = 'saved' | 'published' | 'participated';

interface ProfileEventCard {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  imageUrl: string;
  description: string;
  scheduleType: string | null;
  startsAtMs: number | null;
  endsAtMs: number | null;
  savedOrder: number;
}

interface ForumNoteCard {
  id: string;
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  eventSchedule: string;
  title: string;
  text: string;
  createdAt: unknown;
  userId: string;
}

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const db = getFirestore();
const isSavingEvent = ref(false);
const nowMs = ref(Date.now());
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const currentSection = ref<SectionKey>('saved');
const savedEvents = ref<ProfileEventCard[]>([]);
const forumNotes = ref<ForumNoteCard[]>([]);
const userEvents = ref<ProfileEventCard[]>([]);
const editingNoteId = ref<string | null>(null);
const editNoteTitle = ref('');
const editNoteText = ref('');
const savingNoteId = ref<string | null>(null);
const deletingNoteId = ref<string | null>(null);

const savedUpcomingEvents = computed(() => savedEvents.value.filter((event) => !isPassedEvent(event)));
const passedSavedEvents = computed(() => savedEvents.value.filter((event) => isPassedEvent(event)));

const currentEvents = computed(() => {
  if (currentSection.value === 'published') return [];
  if (currentSection.value === 'participated') return userEvents.value;
  return savedUpcomingEvents.value;
});

const hasPassedSavedOnly = computed(() => (
  currentSection.value === 'saved'
  && currentEvents.value.length === 0
  && passedSavedEvents.value.length > 0
));

const sectionTitle = computed(() => {
  if (currentSection.value === 'published') return 'Your Forum Notes';
  if (currentSection.value === 'participated') return 'Your Events';
  return 'Saved Events';
});

const sectionSubtitle = computed(() => {
  if (currentSection.value === 'published') {
    return `You have shared ${forumNotes.value.length} forum notes across your event discussions.`;
  }
  if (currentSection.value === 'participated') {
    return `You have published ${userEvents.value.length} events so far.`;
  }
  return `You have ${savedUpcomingEvents.value.length} upcoming saved events in your collection.`;
});

const emptyMessage = computed(() => {
  if (currentSection.value === 'published') return 'Post a note inside an event forum and it will show up here.';
  if (currentSection.value === 'participated') return 'Create an event and it will appear here.';
  return 'Save an upcoming event from its detail page and it will show up here.';
});

const emptyTitle = computed(() => {
  if (currentSection.value === 'published') return 'No notes here yet';
  if (currentSection.value === 'participated') return 'No events here yet';
  return 'No events here yet';
});

function showSection(section: SectionKey) {
  currentSection.value = section;
}

function goToEditProfile() {
  router.push('/profile/edit');
}

function goToEditEvent(eventId: string) {
  router.push(`/events/${eventId}/edit`);
}

function openEvent(eventId: string) {
  router.push({
    path: `/events/${eventId}`,
    query: {
      returnTo: route.fullPath,
    },
  });
}

function openForumNote(note: ForumNoteCard) {
  router.push(`/forum/posts/${note.eventId}/${note.id}`);
}

function startEditingNote(note: ForumNoteCard) {
  editingNoteId.value = note.id;
  editNoteTitle.value = note.title;
  editNoteText.value = note.text === '(Empty note)' ? '' : note.text;
}

function cancelEditingNote() {
  editingNoteId.value = null;
  editNoteTitle.value = '';
  editNoteText.value = '';
}

function getForumNoteRef(note: ForumNoteCard) {
  return firestoreDoc(db, 'events', note.eventId, 'forumPosts', note.id);
}

function getFirebaseErrorMessage(error: unknown) {
  const firebaseError = error as { code?: string; message?: string };
  return firebaseError.code
    ? `${firebaseError.code}: ${firebaseError.message ?? 'No details'}`
    : firebaseError.message ?? 'Unknown error';
}

function canModifyForumNote(note: ForumNoteCard) {
  const currentUserId = auth.currentUser?.uid;

  if (currentUserId && currentUserId === note.userId) return true;

  console.warn('Forum note ownership mismatch:', {
    currentUserId,
    noteUserId: note.userId,
    eventId: note.eventId,
    noteId: note.id,
  });
  alert('You can only edit or delete forum notes posted by your current login account.');
  return false;
}

async function saveForumNote(note: ForumNoteCard) {
  const nextText = editNoteText.value.trim();
  if (!nextText || savingNoteId.value) return;
  if (!canModifyForumNote(note)) return;

  savingNoteId.value = note.id;

  try {
    const nextTitle = editNoteTitle.value.trim();
    const updates: Record<string, unknown> = {
      content: nextText,
      text: nextText,
      updatedAt: serverTimestamp(),
    };

    updates.title = nextTitle || nextText.slice(0, 90);
    updates.bodyHtml = deleteField();

    await updateDoc(getForumNoteRef(note), updates);

    forumNotes.value = forumNotes.value.map((item) => (
      item.id === note.id
        ? {
            ...item,
            title: typeof updates.title === 'string' ? updates.title : item.title,
            text: nextText,
          }
        : item
    ));
    cancelEditingNote();
  } catch (error) {
    console.error('Failed to update forum note:', error);
    alert(`Failed to update this forum note. ${getFirebaseErrorMessage(error)}`);
  } finally {
    savingNoteId.value = null;
  }
}

async function deleteForumNote(note: ForumNoteCard) {
  if (deletingNoteId.value) return;
  if (!canModifyForumNote(note)) return;
  if (!confirm('Delete this forum note?')) return;

  deletingNoteId.value = note.id;

  try {
    await deleteDoc(getForumNoteRef(note));
    forumNotes.value = forumNotes.value.filter((item) => item.id !== note.id);
    if (editingNoteId.value === note.id) cancelEditingNote();
  } catch (error) {
    console.error('Failed to delete forum note:', error);
    alert(`Failed to delete this forum note. ${getFirebaseErrorMessage(error)}`);
  } finally {
    deletingNoteId.value = null;
  }z
}

function isEventSaved(eventId: string) {
  return (userStore.userProfile?.savedEventIds ?? []).includes(eventId);
}

async function toggleSavedEvent(eventId: string) {
  if (!userStore.isLoggedIn) {
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
        prompt: 'Please log in to save events.',
      },
    });
    return;
  }

  if (!userStore.userProfile || isSavingEvent.value) return;

  isSavingEvent.value = true;

  try {
    const currentSaved = userStore.userProfile.savedEventIds ?? [];
    const nextSaved = currentSaved.includes(eventId)
      ? currentSaved.filter((id) => id !== eventId)
      : [...new Set([...currentSaved, eventId])];

    await userStore.updateUserProfile({ savedEventIds: nextSaved });

    if (currentSection.value === 'saved') {
      await fetchSavedEvents(nextSaved);
    }
  } catch (error) {
    console.error('Failed to toggle saved event from profile cards:', error);
  } finally {
    isSavingEvent.value = false;
  }
}

function toDate(value: any): Date | null {
  if (!value) return null;

  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value.seconds === 'number') {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTimestampMs(value: unknown) {
  const raw = value as any;

  if (!raw) return 0;
  if (typeof raw.toDate === 'function') return raw.toDate().getTime();
  if (typeof raw.seconds === 'number') return raw.seconds * 1000;

  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatPostTimestamp(value: unknown) {
  const timestamp = getTimestampMs(value);
  if (!timestamp) return 'Just now';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function getEventStartDate(data: Record<string, any>): Date | null {
  const schedule = data.schedule;

  if (schedule?.startDatetime) return toDate(schedule.startDatetime);
  if (schedule?.startDate) return toDate(schedule.startDate);
  return toDate(data.startTime);
}

function getEventEndDate(data: Record<string, any>): Date | null {
  const schedule = data.schedule;

  if (schedule?.type === RecurrenceType.ONE_TIME && schedule?.startDatetime) {
    const startDate = toDate(schedule.startDatetime);
    const rawEndDate = toDate(schedule.endDatetime) ?? toDate(data.endtime) ?? startDate;

    if (!startDate || !rawEndDate) return null;

    // One-time events in this app are expected to start and end on the same day.
    // If malformed data drifts onto another date, normalize the end timestamp
    // back onto the start day so passed/upcoming sections stay accurate.
    const normalizedEndDate = new Date(startDate);
    normalizedEndDate.setHours(
      rawEndDate.getHours(),
      rawEndDate.getMinutes(),
      rawEndDate.getSeconds(),
      rawEndDate.getMilliseconds(),
    );

    return normalizedEndDate;
  }

  if (schedule?.endDatetime) return toDate(schedule.endDatetime);
  if (schedule?.endDate) return toDate(schedule.endDate);
  return toDate(data.endtime);
}

function sortByClosestToNow(events: ProfileEventCard[]) {
  const now = Date.now();

  return events.slice().sort((left, right) => {
    const leftRelevantTime = left.endsAtMs !== null && left.endsAtMs >= now
      ? left.startsAtMs ?? left.endsAtMs
      : left.startsAtMs;
    const rightRelevantTime = right.endsAtMs !== null && right.endsAtMs >= now
      ? right.startsAtMs ?? right.endsAtMs
      : right.startsAtMs;

    const leftIsUpcoming = leftRelevantTime !== null && (
      leftRelevantTime >= now || (left.endsAtMs !== null && left.endsAtMs >= now)
    );
    const rightIsUpcoming = rightRelevantTime !== null && (
      rightRelevantTime >= now || (right.endsAtMs !== null && right.endsAtMs >= now)
    );

    if (leftIsUpcoming !== rightIsUpcoming) return leftIsUpcoming ? -1 : 1;

    if (leftRelevantTime !== null && rightRelevantTime !== null) {
      if (leftIsUpcoming && rightIsUpcoming) {
        return leftRelevantTime - rightRelevantTime;
      }

      return rightRelevantTime - leftRelevantTime;
    }

    if (leftRelevantTime !== null) return -1;
    if (rightRelevantTime !== null) return 1;
    return left.savedOrder - right.savedOrder;
  });
}

function isPassedEvent(event: ProfileEventCard) {
  const now = nowMs.value;

  if (event.scheduleType === RecurrenceType.ONE_TIME && event.startsAtMs !== null) {
    const startDate = new Date(event.startsAtMs);
    const today = new Date(now);

    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    if (startDay < todayDay) {
      return true;
    }
  }

  if (event.endsAtMs !== null) return event.endsAtMs < now;
  if (event.startsAtMs !== null) return event.startsAtMs < now;
  return false;
}

function isUpcomingEvent(event: ProfileEventCard) {
  return event.startsAtMs !== null && event.startsAtMs > nowMs.value;
}

function formatCountdown(event: ProfileEventCard) {
  if (event.startsAtMs === null) return 'Time TBD';

  const diff = event.startsAtMs - nowMs.value;
  if (diff <= 0) return 'Started';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(minutes, 0)}m left`;
}

function mapEventDoc(id: string, data: Record<string, any>, savedOrder = 0): ProfileEventCard {
  const eventForSchedule = {
    ...data,
    id,
  } as FullEvent;
  const startsAtMs = getEventStartDate(data)?.getTime() ?? null;
  const endsAtMs = getEventEndDate(data)?.getTime() ?? null;

  return {
    id,
    title: data.title || 'Untitled event',
    date: data.schedule || data.startTime ? formatEventCardSchedule(eventForSchedule) : 'Schedule TBD',
    location: data.location || '',
    category: data.category || '',
    imageUrl: data.imageUrl || '',
    description: data.description || '',
    scheduleType: data.schedule?.type ?? null,
    startsAtMs,
    endsAtMs,
    savedOrder,
  };
}

async function fetchSavedEvents(savedEventIds: string[]) {
  if (savedEventIds.length === 0) {
    savedEvents.value = [];
    return;
  }

  const chunks: string[][] = [];
  for (let index = 0; index < savedEventIds.length; index += 10) {
    chunks.push(savedEventIds.slice(index, index + 10));
  }

  const results: ProfileEventCard[] = [];

  for (const chunk of chunks) {
    const snapshot = await getDocs(
      query(collection(db, 'events'), where(documentId(), 'in', chunk)),
    );

    results.push(
      ...snapshot.docs.map((doc) => {
        const savedOrder = savedEventIds.indexOf(doc.id);
        return mapEventDoc(doc.id, doc.data() as Record<string, any>, savedOrder);
      }),
    );
  }

  savedEvents.value = sortByClosestToNow(results);
}

async function fetchUserEvents(userId: string) {
  const snapshot = await getDocs(
    query(collection(db, 'events'), where('organizerId', '==', userId)),
  );

  userEvents.value = sortByClosestToNow(snapshot.docs.map((doc, index) =>
    mapEventDoc(doc.id, doc.data() as Record<string, any>, index),
  ));
}

async function fetchForumNotes(userId: string) {
  const eventMap = new Map<string, Record<string, any>>();
  const allEventsSnapshot = await getDocs(collection(db, 'events'));

  allEventsSnapshot.docs.forEach((doc) => {
    eventMap.set(doc.id, doc.data() as Record<string, any>);
  });

  const noteQueryResults = await Promise.allSettled(
    allEventsSnapshot.docs.map((eventDoc) =>
      getDocs(query(collection(db, 'events', eventDoc.id, 'forumPosts'), where('userId', '==', userId))),
    ),
  );

  const noteDocs = noteQueryResults.flatMap((result) => {
    if (result.status === 'fulfilled') return result.value.docs;

    console.warn('Failed to load forum notes for an event:', result.reason);
    return [];
  });

  if (noteDocs.length === 0) {
    forumNotes.value = [];
    return;
  }

  forumNotes.value = noteDocs
    .map((doc) => {
      const post = doc.data() as {
        title?: string;
        content?: string;
        text?: string;
        createdAt?: unknown;
        userId?: string;
      };
      const eventId = doc.ref.parent.parent?.id ?? '';
      const eventData = eventMap.get(eventId);
      const eventForSchedule = eventData ? ({ ...eventData, id: eventId } as FullEvent) : null;
      const text = (post.content || post.text || '').trim();

      return {
        id: doc.id,
        eventId,
        eventTitle: eventData?.title || 'Deleted Event',
        eventLocation: eventData?.location || '',
        eventSchedule: eventForSchedule ? formatEventSchedule(eventForSchedule) : 'Schedule TBD',
        title: post.title?.trim() || '',
        text: text || '(Empty note)',
        createdAt: post.createdAt,
        userId: post.userId ?? '',
      };
    })
    .sort((left, right) => getTimestampMs(right.createdAt) - getTimestampMs(left.createdAt));
}

onMounted(async () => {
  countdownTimer = setInterval(() => {
    nowMs.value = Date.now();
  }, 60000);

  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  const profile = await userStore.fetchUserProfile();
  const userId = profile?.uid;

  if (!userId) return;

  try {
    await Promise.all([
      fetchSavedEvents(profile?.savedEventIds ?? []),
      fetchForumNotes(userId),
      fetchUserEvents(userId),
    ]);
  } catch (error) {
    console.error('Failed to load profile events:', error);
  }
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<style scoped src="../assets/profile.css"></style>
