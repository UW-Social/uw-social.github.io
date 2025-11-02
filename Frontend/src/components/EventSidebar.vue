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
 * Event Sidebar - Simplified, Minimal Design
 */

.event-sidebar {
  width: var(--sidebar-width);
  background: var(--color-white);
  border-right: none;
  /* Keep internal left padding for nice inset; set right padding to 0 so
     the gap between sidebar and event list equals the main content's right padding. */
  padding: var(--spacing-lg) 0 var(--spacing-md) var(--spacing-3xl);
  flex-shrink: 0;
  box-shadow: none;
}

/* Search Box */
.sidebar-search {
  margin-bottom: var(--spacing-lg); /* move Sort row closer to search */
  position: relative;
}

.sidebar-search-input {
  width: 100%;
  padding: var(--spacing-md) calc(var(--spacing-lg) + 28px) var(--spacing-md) var(--spacing-lg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  color: var(--color-gray-900);
  background-color: var(--color-white);
  outline: none;
  transition: all var(--transition-fast);
}

.search-icon {
  position: absolute;
  right: var(--spacing-lg);
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--color-gray-400);
  pointer-events: none;
}

.sidebar-search-input::placeholder {
  color: var(--color-gray-400);
}

.sidebar-search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}

/* Sort Dropdown */
.sidebar-sort {
  margin-bottom: var(--spacing-lg);
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  gap: var(--spacing-sm);
}

.sidebar-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-700);
  margin: 0;
  white-space: nowrap;
}

.sidebar-select {
  width: 100%;
  padding: var(--spacing-sm) 40px var(--spacing-sm) var(--spacing-lg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--color-white);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-900);
  cursor: pointer;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--spacing-lg) center;
  background-size: 12px;
}

.sidebar-select:hover {
  border-color: var(--color-gray-300);
}

.sidebar-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}

/* Scrollbar Styling */
.event-sidebar::-webkit-scrollbar {
  width: 6px;
}

.event-sidebar::-webkit-scrollbar-track {
  background: var(--color-gray-100);
  border-radius: 3px;
}

.event-sidebar::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: 3px;
}

.event-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-400);
}

/* Responsive */
@media (max-width: 768px) {
  .event-sidebar {
    display: none;
  }
}
</style>
