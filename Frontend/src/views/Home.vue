<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Discover Campus Life</h1>
        <p class="hero-subtitle">Connect with events, clubs, and communities at UW</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" @click="navigateToEvents">
            Explore Events
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="btn btn-outline btn-lg" @click="router.push('/clubs')">
            Browse Clubs
          </button>
        </div>
      </div>
      <div class="hero-illustration">
        <div class="illustration-card card-1"></div>
        <div class="illustration-card card-2"></div>
        <div class="illustration-card card-3"></div>
      </div>
    </section>

    <!-- Featured Section -->
    <section class="featured-section">
      <div class="section-header">
        <h2 class="section-title">Recommended for You</h2>
        <p class="section-subtitle">Personalized events based on your interests</p>
      </div>
      <div class="events-container">
        <EventList @open-card="setSelectedEvent" />
      </div>
    </section>

    <!-- Detail Card Modal -->
    <div v-if="selectedEvent" class="detail-card-overlay" @click.self="clearSelectedEvent">
      <DetailCard :event="selectedEvent" :currentUserId="userStore.userProfile?.uid" @close="clearSelectedEvent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import EventList from '../components/EventList.vue';
import DetailCard from '../components/DetailCard.vue';
import { setSelectedEvent, clearSelectedEvent, useSelectedEvent, mountKeyDownListener, unmountKeyDownListener } from '../utils/eventUtils';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const selectedEvent = useSelectedEvent();

function navigateToEvents() {
  router.push('/events');
}

onMounted(() => {
  mountKeyDownListener();
});

onUnmounted(() => {
  unmountKeyDownListener();
});
</script>

<style scoped>
/**
 * Home Page - Flat, Modern Design
 */

.home-page {
  min-height: 100vh;
  background-color: var(--color-white);
  padding-top: calc(var(--navbar-height) - var(--spacing-2xl));
}

/* Hero Section */
.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3xl);
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-3xl) var(--spacing-xl);
  min-height: calc(100vh - var(--navbar-height));
  align-items: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  line-height: var(--line-height-tight);
  letter-spacing: -0.02em;
  margin: 0;
}

.hero-subtitle {
  font-size: var(--font-size-xl);
  color: var(--color-gray-600);
  line-height: var(--line-height-normal);
  margin: 0;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.btn-lg {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-base);
}

.btn-icon {
  margin-left: var(--spacing-xs);
  transition: transform var(--transition-fast);
}

.btn-primary:hover .btn-icon {
  transform: translateX(4px);
}

/* Hero Illustration */
.hero-illustration {
  position: relative;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration-card {
  position: absolute;
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: var(--border-width) solid var(--border-color);
}

.card-1 {
  width: 280px;
  height: 350px;
  background: linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-white) 100%);
  transform: rotate(-5deg);
  z-index: 1;
}

.card-2 {
  width: 300px;
  height: 380px;
  background: linear-gradient(135deg, var(--color-white) 0%, var(--color-gray-50) 100%);
  z-index: 2;
}

.card-3 {
  width: 260px;
  height: 320px;
  background: linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-primary-bg) 100%);
  transform: rotate(5deg);
  right: 0;
  z-index: 1;
}

/* Featured Section */
.featured-section {
  background-color: var(--color-gray-50);
  padding: var(--spacing-3xl) var(--spacing-xl);
}

.section-header {
  max-width: var(--container-max-width);
  margin: 0 auto var(--spacing-2xl);
  text-align: center;
}

.section-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin: 0 0 var(--spacing-sm);
}

.section-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
  margin: 0;
}

.events-container {
  max-width: var(--container-max-width);
  margin: 0 auto;
}

/* Detail Card Modal */
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

/* Responsive Design */
@media (max-width: 968px) {
  .hero-section {
    grid-template-columns: 1fr;
    padding: var(--spacing-2xl) var(--spacing-lg);
    min-height: auto;
  }

  .hero-illustration {
    height: 400px;
    order: -1;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: var(--font-size-lg);
  }

  .hero-actions {
    flex-direction: column;
  }

  .section-title {
    font-size: var(--font-size-2xl);
  }
}

@media (max-width: 576px) {
  .home-page {
    padding-top: calc(var(--navbar-height) - var(--spacing-2xl));
  }

  .hero-section {
    padding: var(--spacing-xl) var(--spacing-md);
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: var(--font-size-base);
  }

  .hero-illustration {
    height: 300px;
  }

  .card-1, .card-2, .card-3 {
    width: 200px;
    height: 250px;
  }

  .featured-section {
    padding: var(--spacing-2xl) var(--spacing-md);
  }

  .detail-card-overlay {
    padding: var(--spacing-md);
  }
}
</style>
