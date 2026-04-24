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
                <h2>{{ note.eventTitle }}</h2>
              </div>
              <button
                type="button"
                class="note-link-button"
                @click="openEvent(note.eventId)"
              >
                Open event
              </button>
            </div>
            <p class="note-body">{{ note.text }}</p>
            <div class="note-meta">
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
  collectionGroup,
  documentId,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import { useUserStore } from '../stores/user';
import { formatEventSchedule, RecurrenceType, type Event as FullEvent } from '../types/event';

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
  text: string;
  createdAt: unknown;
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
    date: data.schedule || data.startTime ? formatEventSchedule(eventForSchedule) : 'Schedule TBD',
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
  const snapshot = await getDocs(
    query(collectionGroup(db, 'posts'), where('userId', '==', userId)),
  );

  if (snapshot.empty) {
    forumNotes.value = [];
    return;
  }

  const eventIds = Array.from(new Set(
    snapshot.docs
      .map((doc) => doc.ref.parent.parent?.id)
      .filter((id): id is string => Boolean(id)),
  ));

  const eventMap = new Map<string, Record<string, any>>();
  for (let index = 0; index < eventIds.length; index += 10) {
    const chunk = eventIds.slice(index, index + 10);
    const eventSnapshot = await getDocs(
      query(collection(db, 'events'), where(documentId(), 'in', chunk)),
    );

    eventSnapshot.docs.forEach((doc) => {
      eventMap.set(doc.id, doc.data() as Record<string, any>);
    });
  }

  forumNotes.value = snapshot.docs
    .map((doc) => {
      const post = doc.data() as { text?: string; createdAt?: unknown };
      const eventId = doc.ref.parent.parent?.id ?? '';
      const eventData = eventMap.get(eventId);
      const eventForSchedule = eventData ? ({ ...eventData, id: eventId } as FullEvent) : null;

      return {
        id: doc.id,
        eventId,
        eventTitle: eventData?.title || 'Deleted Event',
        eventLocation: eventData?.location || '',
        eventSchedule: eventForSchedule ? formatEventSchedule(eventForSchedule) : 'Schedule TBD',
        text: post.text?.trim() || '(Empty note)',
        createdAt: post.createdAt,
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
