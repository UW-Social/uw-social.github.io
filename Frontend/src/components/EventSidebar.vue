<template>
  <div class="event-sidebar">
    <!-- Search Box -->
    <div class="sidebar-search">
      <input
        v-model="localSearch"
        type="text"
        placeholder="Search events..."
        class="sidebar-search-input"
        @input="handleSearchChange"
      />

      <svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
        <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </div>

    <!-- Sort -->
    <div class="sidebar-sort">
      <label class="sidebar-label">Sort by</label>

      <select
        v-model="localSort"
        class="sidebar-select"
        @change="handleSortChange"
      >
        <option value="newest">Latest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

type SortType = 'newest' | 'oldest';

const props = defineProps<{
  search?: string;
  sort?: SortType;
}>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:sort', value: SortType): void;
}>();

const localSearch = ref(props.search ?? '');
const localSort = ref<SortType>(props.sort ?? 'newest');

/* Sync props → local state */
watch(() => props.search, (v) => {
  localSearch.value = v ?? '';
});

watch(() => props.sort, (v) => {
  if (v) localSort.value = v;
});

/* Emits */
const handleSearchChange = () => {
  emit('update:search', localSearch.value);
};

const handleSortChange = () => {
  emit('update:sort', localSort.value);
};
</script>

<style scoped>
.event-sidebar {
  width: var(--sidebar-width);
  padding: var(--spacing-lg) 0 var(--spacing-md) var(--spacing-3xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.sidebar-search {
  position: relative;
}

.sidebar-search-input {
  width: 100%;
  padding: 12px 42px 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 999px;
  font-size: 0.95rem;
  background: var(--color-white);
  outline: none;
}

.search-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: var(--color-gray-400);
  pointer-events: none;
}

.sidebar-sort {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-gray-500);
  text-transform: uppercase;
}

.sidebar-select {
  padding: 10px 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-lg);
  background: var(--color-white);
  font-size: 0.95rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .event-sidebar {
    width: 100%;
    box-sizing: border-box;
    padding: var(--spacing-md);
    flex-direction: row;
    align-items: flex-end;
    gap: var(--spacing-md);
  }

  .sidebar-search {
    flex: 1 1 220px;
    min-width: 0;
  }

  .sidebar-sort {
    flex: 0 0 136px;
  }
}

@media (max-width: 480px) {
  .event-sidebar {
    flex-direction: column;
    align-items: stretch;
  }

  .sidebar-sort {
    flex: none;
  }
}
</style>
