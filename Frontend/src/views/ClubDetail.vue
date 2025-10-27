<template>
  <div class="club-detail-page">
    <button @click="goBack" class="back-button">
      <span class="arrow">←</span>
    </button>

    <div v-if="!club" class="loading-state">
      <p>Loading club details...</p>
    </div>

  <div v-else class="club-content">
      <div class="club-header-section">
        <div class="club-image-card">
          <img :src="club.imageUrl || '/images/wavingdog.jpg'" alt="Club Logo" class="club-image" />
        </div>

        <div class="club-info-card">
          <div class="club-info-header">
            <h1 class="club-name">{{ club.name }}</h1>
            <p v-if="clubSummary" class="club-summary">{{ clubSummary }}</p>
          </div>

          <div class="club-tags" v-if="club.tags && club.tags.length">
            <span v-for="tag in club.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>

          <div class="club-meta-grid">
            <div class="meta-item" v-if="displayCategory">
              <span class="meta-label">Category</span>
              <span class="meta-value">{{ displayCategory }}</span>
            </div>
            <div class="meta-item" v-if="club.meetingSchedule">
              <span class="meta-label">Meeting</span>
              <span class="meta-value">{{ club.meetingSchedule }}</span>
            </div>
            <div class="meta-item" v-if="club.location">
              <span class="meta-label">Location</span>
              <span class="meta-value">{{ club.location }}</span>
            </div>
            <div class="meta-item" v-if="memberCountDisplay">
              <span class="meta-label">Members</span>
              <span class="meta-value">{{ memberCountDisplay }}</span>
            </div>
          </div>

          <a
            v-if="club.link"
            :href="club.link"
            target="_blank"
            rel="noopener noreferrer"
            class="club-link-btn"
          >
            Visit Club Site
          </a>
        </div>
      </div>

      <div class="club-events-section">
        <h2 class="section-title">Upcoming events</h2>
        <div v-if="clubEvents.length" class="events-list">
          <div
            v-for="event in clubEvents"
            :key="event.id"
            class="event-item"
            @click="goToEvent(event.id)"
          >
            <img :src="event.imageUrl || '/images/wavingdog.jpg'" alt="Event cover" class="event-image" />
            <div class="event-details">
              <h3 class="event-item-title">{{ event.title }}</h3>
              <p class="event-item-description">{{ getEventSummary(event) }}</p>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No events available yet.</p>
        </div>
      </div>

      <div class="relevant-clubs-section" v-if="relevantClubs.length">
        <h2 class="section-title">Similar clubs</h2>
        <div class="clubs-grid">
          <div
            v-for="relatedClub in relevantClubs"
            :key="relatedClub.id"
            class="club-card"
            @click="goToClub(relatedClub.id)"
          >
            <img :src="relatedClub.imageUrl || '/images/wavingdog.jpg'" alt="Club cover" class="club-thumbnail" />
            <div class="club-card-name">{{ relatedClub.name }}</div>
          </div>
        </div>
      </div>

      <div class="contact-info-section">
        <h2 class="section-title">Contact</h2>
        <div class="contact-grid">
          <div class="contact-column">
            <div class="contact-item">
              <span class="contact-label">Address</span>
              <p class="contact-value">{{ club.address || '4800 Union Bay Place NE' }}</p>
              <p class="contact-value">{{ club.city || 'Seattle, WA 98105' }}</p>
            </div>
            <div class="contact-item">
              <span class="contact-label">Email</span>
              <p class="contact-value">{{ club.contactEmail || 'casa@uw.edu' }}</p>
            </div>
            <div class="contact-item">
              <span class="contact-label">Phone</span>
              <p class="contact-value">{{ club.phone || '206-468-5924' }}</p>
            </div>
          </div>

          <div class="contact-column">
            <div class="contact-item" v-if="club.campusOffice">
              <span class="contact-label">Campus Office</span>
              <p class="contact-value">{{ club.campusOffice }}</p>
            </div>
            <div class="contact-item" v-if="club.uwEmail">
              <span class="contact-label">UW Email</span>
              <p class="contact-value">{{ club.uwEmail }}</p>
            </div>
            <div class="contact-item" v-if="club.organizerName">
              <span class="contact-label">Organizer</span>
              <p class="contact-value">{{ club.organizerName }}</p>
            </div>
          </div>

          <div class="contact-column">
            <div class="contact-item" v-if="club.departmentAdvisor">
              <span class="contact-label">Department Advisor</span>
              <p class="contact-value">{{ club.departmentAdvisor }}</p>
            </div>
            <div class="contact-item" v-if="club.offCampusAdvisor">
              <span class="contact-label">Off-Campus Advisor</span>
              <p class="contact-value">{{ club.offCampusAdvisor }}</p>
            </div>
            <div class="contact-item" v-if="club.affiliation">
              <span class="contact-label">Affiliation</span>
              <p class="contact-value">{{ club.affiliation }}</p>
            </div>
            <div class="contact-item" v-if="club.socialMedia">
              <span class="contact-label">Other Social</span>
              <p class="contact-value">{{ club.socialMedia }}</p>
            </div>
            <div class="social-links">
              <a v-if="club.discord" :href="club.discord" target="_blank" rel="noopener noreferrer">Discord</a>
              <a v-if="club.instagram" :href="club.instagram" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a v-if="club.wechat" :href="club.wechat" target="_blank" rel="noopener noreferrer">WeChat</a>
              <a v-if="club.linkedin" :href="club.linkedin" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClubStore } from '../stores/club';
import { useEventStore } from '../stores/event';
import { formatClubCategory, type Club } from '../types/club';
import type { Event } from '../types/event';

const route = useRoute();
const router = useRouter();
const clubStore = useClubStore();
const eventStore = useEventStore();

const clubId = computed(() => route.params.id as string);
const club = ref<Club | null>(null);
const clubEvents = ref<Event[]>([]);
const relevantClubs = ref<Club[]>([]);

const clubSummary = computed(() => {
  const raw = club.value?.description?.trim();
  if (!raw) return '';
  const plain = raw.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, ' ');
  const firstLine = plain.split(/\n+/).find(line => line.trim().length > 0);
  return (firstLine ?? plain).replace(/\s+/g, ' ').trim();
});

const displayCategory = computed(() => {
  if (!club.value?.category) return '';
  return formatClubCategory(club.value.category);
});

const memberCountDisplay = computed(() => {
  if (!club.value) return '';
  const count = club.value.memberCount ?? club.value.members?.length;
  return typeof count === 'number' ? `${count} members` : '';
});

const getEventSummary = (event: Event) => {
  const raw = event.description?.trim();
  if (!raw) return event.title;
  const plain = raw.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const normalized = plain.replace(/\s+/g, ' ').trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}…` : normalized;
};

const goBack = () => {
  router.push('/clubs');
};

const goToEvent = (eventId: string) => {
  router.push(`/events/${eventId}`);
};

const goToClub = (clubId: string) => {
  router.push(`/clubs/${clubId}`);
};

const loadClubData = async () => {
  // 加载社团数据
  if (clubStore.clubs.length === 0) {
    await clubStore.fetchClubs();
  }
  
  club.value = clubStore.clubs.find(c => c.id === clubId.value) || null;

  if (!club.value) {
    clubEvents.value = [];
    relevantClubs.value = [];
    return;
  }

  // 加载社团相关的活动
  if (eventStore.events.length === 0) {
    await eventStore.fetchEvents();
  }
  
  // 筛选出该社团的活动
  clubEvents.value = eventStore.events
    .filter(e => e.organizerId === club.value?.organizerId || e.organizerName === club.value?.name)
    .slice(0, 5);
  
  // 加载相关社团（基于标签相似度）
  if (club.value.tags && club.value.tags.length > 0) {
    relevantClubs.value = clubStore.clubs
      .filter(c => c.id !== clubId.value)
      .filter(c => {
        if (!c.tags || c.tags.length === 0) return false;
        return c.tags.some(tag => club.value?.tags?.includes(tag));
      })
      .slice(0, 8);
  } else {
    relevantClubs.value = [];
  }
};

onMounted(() => {
  loadClubData();
});

watch(clubId, () => {
  loadClubData();
});
</script>

<style scoped>
.club-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-3xl);
  padding-top: calc(var(--navbar-height) + var(--spacing-2xl));
  position: relative;
  min-height: 100vh;
}

.back-button {
  position: fixed;
  top: calc(var(--navbar-height) + var(--spacing-2xl));
  /* Keep the back button offset symmetric with the page padding */
  left: calc(
    (100vw - min(100vw, calc(1200px + 2 * var(--spacing-3xl)))) / 2 +
    var(--spacing-xl)
  );
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 1.5rem;
  z-index: 10;
}

.back-button:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
  transform: translateX(-3px);
}

.arrow {
  color: var(--color-gray-900);
  font-weight: bold;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
}

.club-header-section {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: var(--spacing-xl);
  /* micro-align the top edge with the back button baseline */
  margin-top: -68px;
  margin-bottom: var(--spacing-2xl);
  align-items: stretch;
}

.club-image-card {
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  height: 100%;
}

.club-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.club-info-card {
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl) var(--spacing-3xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  height: 100%;
  min-height: 380px;
}

.club-info-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.club-name {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin: 0;
}

.club-summary {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  color: var(--color-gray-700);
  margin: 0;
}

.club-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag {
  background: var(--color-gray-100);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  border: var(--border-width) solid var(--border-color);
}

.club-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-lg);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs);
  padding: var(--spacing-md) var(--spacing-lg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--color-gray-25, #f7f7fb);
  min-height: 96px;
}

.meta-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-gray-600);
}

.meta-value {
  font-size: var(--font-size-base);
  color: var(--color-gray-900);
  line-height: var(--line-height-normal);
}

.club-link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: background var(--transition-fast);
}

.club-link-btn:hover {
  background: var(--color-primary-hover);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
  color: var(--color-gray-900);
}

.club-events-section,
.relevant-clubs-section,
.contact-info-section {
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.event-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.event-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.event-image {
  width: 160px;
  height: 110px;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  justify-content: center;
}

.event-item-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin: 0;
}

.event-item-description {
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.empty-state {
  text-align: center;
  color: var(--color-gray-600);
  padding: var(--spacing-2xl) 0;
}

.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-xl);
}

.club-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.club-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.club-thumbnail {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
}

.club-card-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xl);
}

.contact-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs);
}

.contact-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-gray-600);
}

.contact-value {
  font-size: var(--font-size-sm);
  color: var(--color-gray-800);
  margin: 0;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.social-links a {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-gray-900);
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background var(--transition-fast);
}

.social-links a:hover {
  background: var(--color-primary);
}

@media (max-width: 1024px) {
  .club-header-section {
    grid-template-columns: 1fr;
  }

  .club-image-card {
    min-height: 260px;
  }

  .contact-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .club-detail-page {
    padding: var(--spacing-xl);
    padding-top: calc(var(--navbar-height) + var(--spacing-xl));
  }

  .back-button {
    left: var(--spacing-xl);
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .club-header-section {
    margin-top: -52px;
  }

  .event-item {
    grid-template-columns: 1fr;
  }

  .event-image {
    width: 100%;
    height: 180px;
  }

  .clubs-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
