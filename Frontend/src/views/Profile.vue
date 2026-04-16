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
          <button type="button" class="sidebar-link" @click="goToEditProfile">
            <span>Profile & Edit</span>
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
                <span v-if="currentSection === 'saved'" class="event-chip cool">Favorite</span>
              </div>
              <h2>{{ featuredEvent.title }}</h2>
              <p>{{ featuredEvent.description || 'Discover one of your highlighted campus picks.' }}</p>
              <div class="event-detail-row">
                <span>{{ featuredEvent.date }}</span>
                <span>{{ featuredEvent.location || 'Location TBD' }}</span>
              </div>
            </div>
          </article>

          <div v-if="secondaryEvents.length > 0" class="side-stack">
            <article
              v-for="event in secondaryEvents"
              :key="event.id"
              class="stack-card"
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
                class="stack-card-image"
                :src="event.imageUrl || '/images/wavingdog.jpg'"
                :alt="event.title"
              />
              <div class="stack-card-body">
                <span class="event-chip soft">{{ event.category || 'Campus' }}</span>
                <h3>{{ event.title }}</h3>
                <div class="stack-meta">
                  <span>{{ event.date }}</span>
                  <span>{{ event.location || 'Location TBD' }}</span>
                </div>
              </div>
            </article>
          </div>

          <div v-if="galleryEvents.length > 0" class="bottom-gallery">
            <article
              v-for="event in galleryEvents"
              :key="event.id"
              class="gallery-card"
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
                class="gallery-card-image"
                :src="event.imageUrl || '/images/wavingdog.jpg'"
                :alt="event.title"
              />
              <div class="gallery-card-body">
                <span class="event-chip soft">{{ event.category || 'Campus' }}</span>
                <h3>{{ event.title }}</h3>
                <div class="stack-meta">
                  <span>{{ event.date }}</span>
                  <span>{{ event.location || 'Location TBD' }}</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section v-else class="empty-panel">
          <h2>No events here yet</h2>
          <p>{{ emptyMessage }}</p>
        </section>

        <section v-if="(userStore.userProfile?.tags ?? []).length > 0" class="interest-strip">
          <span class="interest-label">Interests</span>
          <div class="interest-tags">
            <span v-for="tag in userStore.userProfile?.tags || []" :key="tag" class="interest-tag">
              {{ tag }}
            </span>
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

const currentEvents = computed(() => {
  if (currentSection.value === 'published') return publishedEvents.value;
  if (currentSection.value === 'participated') return participatedEvents.value;
  return savedEvents.value;
});

const featuredEvent = computed(() => currentEvents.value[0] ?? null);
const secondaryEvents = computed(() => currentEvents.value.slice(1, 3));
const galleryEvents = computed(() => currentEvents.value.slice(3));
const bentoClass = computed(() => `count-${Math.min(currentEvents.value.length, 4)}`);

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
  return `You have ${savedEvents.value.length} saved events in your collection.`;
});

const emptyMessage = computed(() => {
  if (currentSection.value === 'published') return 'Create an event and it will appear here.';
  if (currentSection.value === 'participated') return 'Join an event to populate this section.';
  return 'Save an event from its detail page and it will show up here.';
});

function showSection(section: SectionKey) {
  currentSection.value = section;
}

function goToEditProfile() {
  router.push('/profile/edit');
}

function openEvent(eventId: string) {
  router.push(`/events/${eventId}`);
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

function mapEventDoc(id: string, data: Record<string, any>): ProfileEventCard {
  const eventForSchedule = {
    ...data,
    id,
  } as FullEvent;

  return {
    id,
    title: data.title || 'Untitled event',
    date: data.schedule || data.startTime ? formatEventSchedule(eventForSchedule) : 'Schedule TBD',
    location: data.location || '',
    category: data.category || '',
    imageUrl: data.imageUrl || '',
    description: data.description || '',
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
      ...snapshot.docs.map((doc) => mapEventDoc(doc.id, doc.data() as Record<string, any>)),
    );
  }

  const orderMap = new Map(savedEventIds.map((id, index) => [id, index]));
  savedEvents.value = results.sort(
    (left, right) => (orderMap.get(left.id) ?? 0) - (orderMap.get(right.id) ?? 0),
  );
}

async function fetchPublishedEvents(userId: string) {
  const snapshot = await getDocs(
    query(collection(db, 'events'), where('organizerId', '==', userId)),
  );

  publishedEvents.value = snapshot.docs.map((doc) =>
    mapEventDoc(doc.id, doc.data() as Record<string, any>),
  );
}

async function fetchParticipatedEvents(userId: string) {
  const snapshot = await getDocs(
    query(collection(db, 'events'), where('participants', 'array-contains', userId)),
  );

  participatedEvents.value = snapshot.docs.map((doc) =>
    mapEventDoc(doc.id, doc.data() as Record<string, any>),
  );
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
