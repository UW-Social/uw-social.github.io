<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="text-gradient">Discover</span>
          Campus Life
        </h1>
        <p class="hero-subtitle">Connect with events, clubs, and communities at UW</p>

        <SearchFilterBar class="hero-search" />
      </div>
    </section>

    <section class="featured-section">
      <div class="section-header">
        <h2 class="section-title">Recommended for You</h2>
        <p class="section-subtitle">Personalized events based on your interests</p>
      </div>

      <div class="events-container">
        <EventList @open-card="setSelectedEvent" />
      </div>
    </section>

    <div v-if="selectedEvent" class="detail-card-overlay" @click.self="clearSelectedEvent">
      <DetailCard :event="selectedEvent" :currentUserId="userStore.userProfile?.uid" @close="clearSelectedEvent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import DetailCard from '../components/DetailCard.vue';
import EventList from '../components/EventList.vue';
import SearchFilterBar from '../components/SearchFilterBar.vue';
import { useUserStore } from '../stores/user';
import {
  clearSelectedEvent,
  mountKeyDownListener,
  setSelectedEvent,
  unmountKeyDownListener,
  useSelectedEvent,
} from '../utils/eventUtils';

const userStore = useUserStore();
const selectedEvent = useSelectedEvent();

onMounted(() => {
  mountKeyDownListener();
});

onUnmounted(() => {
  unmountKeyDownListener();
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 8% 18%, rgba(129, 140, 248, 0.1), transparent 24%),
    radial-gradient(circle at 92% 12%, rgba(129, 140, 248, 0.14), transparent 22%),
    radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.72), transparent 30%),
    linear-gradient(180deg, #f7f8ff 0%, #fbfcff 42%, #f3f6fb 100%);
  padding-top: calc(var(--navbar-height) - 0.15rem);
}

.hero-section {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0.1rem var(--spacing-xl) 0;
  background: transparent;
  position: relative;
  overflow: visible;
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  text-align: center;
  padding: 0 0 2rem;
}

.hero-title {
  font-size: clamp(2.3rem, 4.8vw, 3.7rem);
  font-weight: 700;
  color: var(--color-gray-900);
  line-height: 1.02;
  letter-spacing: -0.03em;
  margin: 0;
  max-width: 720px;
}

.text-gradient {
  background: linear-gradient(135deg, #5b61f6 0%, #8a7dff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: clamp(1rem, 1.8vw, 1.22rem);
  color: #666f7a;
  line-height: 1.45;
  margin: 0;
  max-width: 560px;
}

.hero-search {
  margin-top: 5vh;
}

.featured-section {
  max-width: 1240px;
  margin: 4vh auto 0;
  padding: 0 var(--spacing-xl) var(--spacing-2xl);
}

.section-header {
  margin: 0 auto 0.9rem;
  text-align: center;
  padding: 0.85rem 1.5rem 0;
}

.section-title {
  font-size: clamp(1.8rem, 3.6vw, 2.35rem);
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.35rem;
}

.section-subtitle {
  font-size: 1.05rem;
  color: var(--color-gray-600);
  margin: 0;
}

.events-container {
  background: rgba(248, 250, 252, 0.76);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 28px;
  padding: 0.85rem;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.05);
}

.detail-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: var(--z-modal);
  overflow-y: auto;
  padding: var(--spacing-2xl) var(--spacing-md);
  backdrop-filter: blur(4px);
}

@media (max-width: 968px) {
  .hero-section {
    padding: 0 var(--spacing-lg) 0;
  }

  .featured-section {
    margin-top: 3vh;
    padding: 0 var(--spacing-lg) var(--spacing-2xl);
  }
}

@media (max-width: 576px) {
  .home-page {
    padding-top: calc(var(--navbar-height) - 0.35rem);
  }

  .hero-title {
    font-size: 2.1rem;
  }

  .hero-subtitle {
    font-size: 0.95rem;
  }

  .hero-search {
    margin-top: 3vh;
  }

  .featured-section {
    margin-top: 2vh;
    padding: 0 var(--spacing-md) var(--spacing-xl);
  }

  .section-header {
    padding-top: 1.2rem;
  }

  .detail-card-overlay {
    padding: var(--spacing-md);
  }
}
</style>
