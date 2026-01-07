<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg-glow"></div>
      <div class="hero-content animate-slide-up">
        <h1 class="hero-title"><span class="text-gradient">Discover Campus Life</span></h1>
        <p class="hero-subtitle animate-slide-up-delay-1">Connect with events, clubs, and communities at UW</p>
        <div class="hero-actions animate-slide-up-delay-2">
          <button class="btn btn-primary btn-lg shadow-glow" @click="navigateToEvents">
            Explore Events
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="btn btn-outline btn-lg glass" @click="router.push('/clubs')">
            Browse Clubs
          </button>
        </div>
      </div>
      <div class="hero-illustration animate-fade-in">
        <div class="illustration-card card-1 glass"></div>
        <div class="illustration-card card-2 glass"></div>
        <div class="illustration-card card-3 glass"></div>
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
import { onMounted, onUnmounted } from 'vue';
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
  position: relative;
  overflow: hidden;
}

.hero-bg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0) 70%);
  z-index: 0;
  pointer-events: none;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  z-index: 1;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  color: var(--color-gray-900);
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-gray-600);
  line-height: 1.6;
  margin: 0;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  border-radius: 99px; /* Pill shape */
}

.btn-icon {
  margin-left: var(--spacing-sm);
  transition: transform var(--transition-fast);
}

.btn-primary:hover .btn-icon {
  transform: translateX(4px);
}

/* Hero Illustration */
.hero-illustration {
  position: relative;
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
  z-index: 1;
}

.illustration-card {
  position: absolute;
  border-radius: var(--radius-2xl);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); /* Premium shadow */
  transition: transform 0.5s ease;
}

.illustration-card:hover {
  transform: translateY(-10px) rotate(var(--rotation));
}

.card-1 {
  width: 280px;
  height: 380px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(165, 180, 252, 0.9) 100%);
  transform: rotate(-12deg) translate(-40px, 20px);
  --rotation: -12deg;
  z-index: 1;
}

.card-2 {
  width: 320px;
  height: 420px;
  background: linear-gradient(135deg, #fff 0%, #f3f4f6 100%);
  z-index: 2;
  transform: rotate(0deg);
  --rotation: 0deg;
}

.card-3 {
  width: 260px;
  height: 340px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(199, 210, 254, 0.8) 100%);
  transform: rotate(12deg) translate(40px, 20px);
  --rotation: 12deg;
  right: auto;
  left: 60%;
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
