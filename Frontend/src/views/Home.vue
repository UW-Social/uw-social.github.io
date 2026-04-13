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

    <section id="recommendations" class="featured-section">
      <div class="section-header">
        <h2 class="section-title">{{ recommendationHeading }}</h2>
        <p class="section-subtitle">{{ recommendationSubtitle }}</p>
      </div>

      <div class="events-container">
        <div v-if="showRecommendationUpdateNotice" class="recommendation-notice">
          Recommendation is updated, go and check!
        </div>

        <div v-if="!userStore.isLoggedIn" class="recommendation-cta">
          <div class="cta-copy">
            <span class="cta-eyebrow">New here?</span>
            <h3>Want personalized event recommendations?</h3>
            <p>Sign up to get picks tailored to your interests, clubs, and campus life.</p>
          </div>

          <button class="cta-button" type="button" :disabled="isSigningUp" @click="handleSignupClick">
            {{ isSigningUp ? 'Connecting to Google...' : 'Sign up with Google' }}
          </button>
        </div>

        <EventList
          :limit="userStore.isLoggedIn ? undefined : 3"
          :recommendation-mode="userStore.isLoggedIn ? 'personalized' : 'latest'"
          @open-card="setSelectedEvent"
        />
      </div>
    </section>

    <div v-if="selectedEvent" class="detail-card-overlay" @click.self="clearSelectedEvent">
      <DetailCard :event="selectedEvent" :currentUserId="userStore.userProfile?.uid" @close="clearSelectedEvent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const selectedEvent = useSelectedEvent();
const isSigningUp = ref(false);

const showRecommendationUpdateNotice = computed(() => route.query.onboarding === 'complete');
const hasPersonalizedRecommendations = computed(() => userStore.isLoggedIn && userStore.profileIsComplete);

const recommendationHeading = computed(() => {
  if (!userStore.isLoggedIn) return 'Latest Campus Events';
  if (!hasPersonalizedRecommendations.value) return 'Finish Your Personalization';
  return 'Recommended for You';
});

const recommendationSubtitle = computed(() => {
  if (!userStore.isLoggedIn) return 'See the latest events on campus and sign up for tailored picks.';
  if (!hasPersonalizedRecommendations.value) return 'Complete your profile to unlock recommendations matched to your interests.';
  return 'Personalized events based on your interests';
});

async function handleSignupClick(): Promise<void> {
  if (isSigningUp.value) return;

  isSigningUp.value = true;

  try {
    const loginResult = await userStore.loginWithGoogle({ redirectPath: '/' });
    await router.push(loginResult.nextPath);
  } catch (error) {
    console.error('Google sign-up failed from homepage CTA:', error);
  } finally {
    isSigningUp.value = false;
  }
}

async function scrollToRecommendations(): Promise<void> {
  await nextTick();
  document.getElementById('recommendations')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

onMounted(() => {
  mountKeyDownListener();

  if (showRecommendationUpdateNotice.value) {
    void scrollToRecommendations();
  }
});

watch(showRecommendationUpdateNotice, (shouldScroll) => {
  if (shouldScroll) {
    void scrollToRecommendations();
  }
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

.recommendation-notice {
  margin: 0.4rem 0.4rem 1rem;
  padding: 0.95rem 1.1rem;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(73, 159, 112, 0.14), rgba(73, 159, 112, 0.05));
  border: 1px solid rgba(73, 159, 112, 0.2);
  color: #245c43;
  font-weight: 600;
  text-align: center;
}

.recommendation-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.4rem 0.4rem 1rem;
  padding: 1.15rem 1.25rem;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(91, 97, 246, 0.16), transparent 36%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(238, 244, 255, 0.88));
  border: 1px solid rgba(91, 97, 246, 0.12);
}

.cta-copy {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cta-eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #5b61f6;
}

.cta-copy h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #132238;
}

.cta-copy p {
  margin: 0;
  color: #526172;
  line-height: 1.5;
}

.cta-button {
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1.35rem;
  background: linear-gradient(135deg, #5b61f6 0%, #6f8cff 100%);
  color: #fff;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(91, 97, 246, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.cta-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 36px rgba(91, 97, 246, 0.28);
}

.cta-button:disabled {
  opacity: 0.7;
  cursor: wait;
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

  .recommendation-cta {
    flex-direction: column;
    align-items: flex-start;
  }

  .cta-button {
    width: 100%;
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

  .recommendation-cta {
    margin-inline: 0;
    border-radius: 20px;
  }

  .recommendation-notice {
    margin-inline: 0;
  }

  .detail-card-overlay {
    padding: var(--spacing-md);
  }
}
</style>
