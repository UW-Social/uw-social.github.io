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
}

.page-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-lg);
}

.type-selector {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-xl);
}

.type-selector button {
  padding: var(--spacing-md) var(--spacing-2xl);
  border: var(--border-width) solid var(--border-color);
  background: var(--color-white);
  border-radius: var(--radius-md) !important;
  box-shadow: none !important;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-700);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.type-selector button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--color-primary-bg);
  box-shadow: none !important;
}

.type-selector button.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
  box-shadow: none !important;
}

@media (max-width: 768px) {
  .publish-page {
    padding-top: calc(var(--navbar-height) - var(--spacing-xl));
  }

  .page-header {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .page-header h1 {
    font-size: var(--font-size-2xl);
  }

  .type-selector {
    flex-direction: column;
    align-items: stretch;
    padding: 0 var(--spacing-md);
  }

  .type-selector button {
    width: 100%;
  }
}
</style> 