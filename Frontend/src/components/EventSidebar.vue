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

    <!-- Sort By Dropdown -->
    <div class="sidebar-sort">
      <label class="sidebar-label">Sort by</label>
      <select
        ref="sortSelectRef"
        v-model="localSort"
        @change="handleSortChange"
        class="sidebar-select"
      >
        <option value="recommended">Recommended</option>
        <option value="nearest">Nearest</option>
        <option value="farthest">Farthest</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

// Props
const props = defineProps<{
  search?: string;
  sort?: string;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:sort', value: string): void;
}>();

// Local state
const localSearch = ref(props.search || '');
const localSort = ref(props.sort || 'recommended');
const sortSelectRef = ref<HTMLSelectElement | null>(null);

let isMounted = false;

let measureCtx: CanvasRenderingContext2D | null = null;
let rafId = 0;

const ensureContext = () => {
  if (measureCtx) return measureCtx;
  const canvas = document.createElement('canvas');
  measureCtx = canvas.getContext('2d');
  return measureCtx;
};

const fitSelectFont = () => {
  const el = sortSelectRef.value;
  const ctx = ensureContext();
  if (!el || !ctx) return;

  el.style.fontSize = '';

  const computedStyle = getComputedStyle(el);
  const baseFontSize = parseFloat(computedStyle.fontSize) || 16;
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
  const availableWidth = el.clientWidth - paddingLeft - paddingRight;
  if (availableWidth <= 0) return;

  let size = baseFontSize;
  const minSize = 12;
  const step = 0.25;
  const selectedOption = el.options[el.selectedIndex];
  const text = selectedOption?.text || '';

  while (size > minSize) {
    ctx.font = `${computedStyle.fontWeight} ${size}px ${computedStyle.fontFamily}`;
    if (ctx.measureText(text).width <= availableWidth) {
      break;
    }
    size -= step;
  }

  el.style.fontSize = `${size}px`;
};

const scheduleFit = () => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    fitSelectFont();
    rafId = 0;
  });
};

// Watch for prop changes
watch(() => props.search, (newVal) => {
  localSearch.value = newVal || '';
});

watch(() => props.sort, (newVal) => {
  localSort.value = newVal || 'recommended';
  if (isMounted) nextTick(scheduleFit);
});

// Event handlers
const handleSearchChange = () => {
  emit('update:search', localSearch.value);
};

const handleSortChange = () => {
  emit('update:sort', localSort.value);
};

watch(localSort, () => {
  if (isMounted) nextTick(scheduleFit);
});

onMounted(() => {
  isMounted = true;
  nextTick(scheduleFit);
  window.addEventListener('resize', scheduleFit);
});

onBeforeUnmount(() => {
  isMounted = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  window.removeEventListener('resize', scheduleFit);
});
</script>

<style scoped>
/**
 * EventSidebar - Premium Design
 */

.event-sidebar {
  width: var(--sidebar-width);
  background: transparent;
  padding: var(--spacing-lg) 0 var(--spacing-md) var(--spacing-3xl);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Search Box */
.sidebar-search {
  position: relative;
}

.sidebar-search-input {
  width: 100%;
  padding: 12px 42px 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 99px;
  font-size: 0.95rem;
  color: var(--color-gray-900);
  background: var(--color-white);
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.03);
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
  transition: color 0.2s;
}

.sidebar-search-input::placeholder {
  color: var(--color-gray-400);
}

.sidebar-search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.15);
}

.sidebar-search-input:focus + .search-icon {
  color: var(--color-primary);
}

/* Sort Dropdown */
.sidebar-sort {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 4px;
}

.sidebar-select {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-lg);
  background-color: var(--color-white);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-gray-900);
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 10px;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.sidebar-select:hover {
  border-color: var(--color-gray-300);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.sidebar-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .event-sidebar {
    display: none;
  }
}
</style>
