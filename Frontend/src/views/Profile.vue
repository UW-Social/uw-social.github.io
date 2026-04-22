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
            <span>My Posts</span>
          </button>
          <button
            type="button"
            class="sidebar-link"
            :class="{ active: currentSection === 'participated' }"
            @click="showSection('participated')"
          >
            <span>Network</span>
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

        <section v-if="currentEvents.length > 0" class="events-bento" :class="bentoClass">
          <article
            v-if="featuredEvent"
            class="featured-event"
            @click="openEvent(featuredEvent.id)"
          >
            <button
              type="button"
              class="card-save-button"
              :class="{ saved: isEventSaved(featuredEvent.id) }"
              @click.stop="toggleSavedEvent(featuredEvent.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <img
              class="featured-event-image"
              :src="featuredEvent.imageUrl || '/images/wavingdog.jpg'"
              :alt="featuredEvent.title"
            />
            <div class="featured-event-body">
              <div class="badge-row">
                <span class="event-chip warm">{{ featuredEvent.category || 'Campus' }}</span>
                <span v-if="currentSection === 'saved'" class="event-chip cool">Closest Event</span>
              </div>
              <h2>{{ featuredEvent.title }}</h2>
              <p>{{ featuredEvent.description || 'Discover one of your highlighted campus picks.' }}</p>
              <div class="event-detail-row">
                <span class="detail-item">
                  <span class="detail-icon">Time:</span>
                  <span>{{ featuredEvent.date }}</span>
                </span>
                <span class="detail-item">
                  <span class="detail-icon">Place:</span>
                  <span>{{ featuredEvent.location || 'Location TBD' }}</span>
                </span>
              </div>
            </div>
          </article>

          <article
            v-for="event in secondaryEvents"
            :key="event.id"
            class="compact-event-card"
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
        </section>

        <section v-else-if="!hasPassedSavedOnly" class="empty-panel">
          <h2>No events here yet</h2>
          <p>{{ emptyMessage }}</p>
        </section>

        <section
          v-if="currentSection === 'saved' && passedSavedEvents.length > 0"
          class="passed-events-section"
        >
          <div class="passed-events-divider">
            <span></span>
            <h2>Passed Saved Events</h2>
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collection, documentId, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { useUserStore } from '../stores/user';
import { formatEventSchedule, type Event as FullEvent } from '../types/event';

type SectionKey = 'saved' | 'published' | 'participated';

interface ProfileEventCard {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  imageUrl: string;
  description: string;
  startsAtMs: number | null;
  endsAtMs: number | null;
  savedOrder: number;
}

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const db = getFirestore();
const isSavingEvent = ref(false);

const currentSection = ref<SectionKey>('saved');
const savedEvents = ref<ProfileEventCard[]>([]);
const publishedEvents = ref<ProfileEventCard[]>([]);
const participatedEvents = ref<ProfileEventCard[]>([]);

const savedUpcomingEvents = computed(() => savedEvents.value.filter((event) => !isPassedEvent(event)));
const passedSavedEvents = computed(() => savedEvents.value.filter((event) => isPassedEvent(event)));

const currentEvents = computed(() => {
  if (currentSection.value === 'published') return publishedEvents.value;
  if (currentSection.value === 'participated') return participatedEvents.value;
  return savedUpcomingEvents.value;
});

const featuredEvent = computed(() => currentEvents.value[0] ?? null);
const secondaryEvents = computed(() => currentEvents.value.slice(1));
const bentoClass = computed(() => `count-${Math.min(currentEvents.value.length, 6)}`);
const hasPassedSavedOnly = computed(() => (
  currentSection.value === 'saved'
  && currentEvents.value.length === 0
  && passedSavedEvents.value.length > 0
));

const sectionTitle = computed(() => {
  if (currentSection.value === 'published') return 'Published Events';
  if (currentSection.value === 'participated') return 'Joined Events';
  return 'Saved Events';
});

const sectionSubtitle = computed(() => {
  if (currentSection.value === 'published') {
    return `You have published ${publishedEvents.value.length} events so far.`;
  }
  if (currentSection.value === 'participated') {
    return `You are participating in ${participatedEvents.value.length} events.`;
  }
  return `You have ${savedUpcomingEvents.value.length} upcoming saved events in your collection.`;
});

const emptyMessage = computed(() => {
  if (currentSection.value === 'published') return 'Create an event and it will appear here.';
  if (currentSection.value === 'participated') return 'Join an event to populate this section.';
  return 'Save an upcoming event from its detail page and it will show up here.';
});

function showSection(section: SectionKey) {
  currentSection.value = section;
}

function goToEditProfile() {
  router.push('/profile/edit');
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

function getEventStartDate(data: Record<string, any>): Date | null {
  const schedule = data.schedule;

  if (schedule?.startDatetime) return toDate(schedule.startDatetime);
  if (schedule?.startDate) return toDate(schedule.startDate);
  return toDate(data.startTime);
}

function getEventEndDate(data: Record<string, any>): Date | null {
  const schedule = data.schedule;

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
  const now = Date.now();
  if (event.endsAtMs !== null) return event.endsAtMs < now;
  if (event.startsAtMs !== null) return event.startsAtMs < now;
  return false;
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

async function fetchPublishedEvents(userId: string) {
  const snapshot = await getDocs(
    query(collection(db, 'events'), where('organizerId', '==', userId)),
  );

  publishedEvents.value = sortByClosestToNow(snapshot.docs.map((doc, index) =>
    mapEventDoc(doc.id, doc.data() as Record<string, any>, index),
  ));
}

async function fetchParticipatedEvents(userId: string) {
  const snapshot = await getDocs(
    query(collection(db, 'events'), where('participants', 'array-contains', userId)),
  );

  participatedEvents.value = sortByClosestToNow(snapshot.docs.map((doc, index) =>
    mapEventDoc(doc.id, doc.data() as Record<string, any>, index),
  ));
}

onMounted(async () => {
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
      fetchPublishedEvents(userId),
      fetchParticipatedEvents(userId),
    ]);
  } catch (error) {
    console.error('Failed to load profile events:', error);
  }
});
</script>

<style scoped src="../assets/profile.css"></style>
