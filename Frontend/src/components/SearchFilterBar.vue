<template>
  <form class="search-filter-bar" @submit.prevent="handleSubmit">
    <input
      v-model="searchValue"
      type="text"
      class="search-input"
      placeholder="Search events, clubs, or communities"
    />

    <button type="submit" class="search-action" aria-label="Search events">
      <svg viewBox="0 0 24 24" fill="none" class="search-icon" aria-hidden="true">
        <path
          d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm9 3-4.35-4.35"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchValue = ref('');

function handleSubmit() {
  const query = searchValue.value.trim();

  router.push({
    path: '/events',
    query: query ? { q: query } : {},
  });
}
</script>

<style scoped>
.search-filter-bar {
  width: min(100%, 700px);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem 0.65rem 1.2rem;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-gray-700);
  font-size: 1rem;
  outline: none;
}

.search-input::placeholder {
  color: var(--color-gray-400);
}

.search-action {
  width: 50px;
  height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #7c73ff 100%);
  color: var(--color-white);
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.3);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.search-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(99, 102, 241, 0.35);
}

.search-icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 576px) {
  .search-filter-bar {
    gap: 0.5rem;
    padding: 0.55rem 0.55rem 0.55rem 0.9rem;
  }

  .search-input {
    font-size: 0.95rem;
  }

  .search-action {
    width: 44px;
    height: 44px;
  }
}
</style>
