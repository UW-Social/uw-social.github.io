<template>
  <div class="publish-page">
    <div class="page-header">
      <h1>{{ publishType === 'event' ? 'Create Event' : 'Create Club' }}</h1>

      <!-- Toggle buttons -->
      <div class="type-selector">
        <button
          :class="{ active: publishType === 'event' }"
          @click="publishType = 'event'"
        >
          Event
        </button>
        <button
          :class="{ active: publishType === 'club' }"
          @click="publishType = 'club'"
        >
          Club
        </button>
      </div>
    </div>

    <EventForm v-if="publishType === 'event'" />
    <ClubForm v-else @cancel="handleCancel" @success="handleSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import EventForm from '../components/EventForm.vue';
import ClubForm from '../components/ClubForm.vue';

const router = useRouter();
const publishType = ref<'event' | 'club'>('event');

const handleCancel = () => {
  router.push('/clubs');
};

const handleSuccess = () => {
  router.push('/clubs');
};
</script>

<style scoped>
.publish-page {
  min-height: 100vh;
  background-color: var(--color-white);
  padding-top: calc(var(--navbar-height) - var(--spacing-2xl));
  padding-bottom: var(--spacing-3xl);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-xl) var(--spacing-3xl);
  animation: slideUp 0.6s ease-out;
}

.page-header h1 {
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-lg);
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--color-gray-900) 0%, var(--color-gray-600) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.type-selector {
  display: inline-flex;
  gap: var(--spacing-xs);
  justify-content: center;
  margin-top: var(--spacing-xl);
  background: var(--color-gray-100);
  padding: 4px;
  border-radius: 99px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.type-selector button {
  padding: 10px 32px;
  border: none;
  background: transparent;
  border-radius: 99px !important;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-gray-500);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.type-selector button:hover {
  color: var(--color-gray-700);
}

.type-selector button.active {
  background: var(--color-white);
  color: var(--color-primary);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .publish-page {
    padding-top: calc(var(--navbar-height) - var(--spacing-xl));
  }

  .page-header {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .page-header h1 {
    font-size: 2.5rem;
  }

  .type-selector {
    display: flex; /* pill shape might break on very small screens, but flex row is fine */
    width: 100%;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
  }

  .type-selector button {
    flex: 1;
  }
}
</style> 