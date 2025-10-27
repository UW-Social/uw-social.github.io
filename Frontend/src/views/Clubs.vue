<template>
  <div class="clubs-page">
    <div class="clubs-container">
      <!-- Sidebar -->
      <div class="clubs-sidebar">
        <!-- Search -->
        <div class="sidebar-search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search clubs..."
            class="sidebar-search-input"
            @input="handleSearch"
          />
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>

        <!-- Sort -->
        <div class="sidebar-sort">
          <label class="sidebar-label">Sort by</label>
          <select ref="sortSelectRef" v-model="sortType" @change="handleSort" class="sidebar-select">
            <option value="recommended">Recommended</option>
            <option value="members">Members</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      <!-- Main Content -->
      <div class="clubs-main">
        <ClubList :search="searchQuery" :sort="sortType" @open-card="setSelectedClub" />
      </div>
    </div>

    <!-- Back to Top Button -->
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ClubList from '../components/ClubList.vue';
import BackToTop from '../components/BackToTop.vue';
import { type Club } from '../types/club';

const router = useRouter();
const route = useRoute();

const searchQuery = ref('');
const sortType = ref('recommended');
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

// Watch route query
watch(() => route.query.q, (newQuery) => {
  if (newQuery) {
    searchQuery.value = newQuery as string;
  }
}, { immediate: true });

const handleSearch = () => {
  // Search logic handled by ClubList component
};

const handleSort = () => {
  // Sort logic handled by ClubList component
};

const setSelectedClub = (club: Club) => {
  router.push(`/clubs/${club.id}`);
};

watch(sortType, () => {
  if (isMounted) nextTick(scheduleFit);
});

watch(() => route.path, (newPath) => {
  if (newPath === '/clubs') {
    if (isMounted) nextTick(scheduleFit);
  }
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
.clubs-page {
  min-height: 100vh;
  background-color: var(--color-white);
  padding-top: calc(var(--navbar-height) - var(--spacing-2xl));
}

.clubs-container {
  display: flex;
  min-height: calc(100vh - var(--navbar-height));
}

/* Sidebar */
.clubs-sidebar {
  width: var(--sidebar-width);
  background: var(--color-white);
  border-right: none;
  /* Match Events page: remove right padding so the gap to cards equals the main content's right padding */
  padding: var(--spacing-lg) 0 var(--spacing-md) var(--spacing-3xl);
  flex-shrink: 0;
  box-shadow: none;
}

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

/* Main Content */
.clubs-main {
  padding: 0 var(--spacing-3xl);
  flex: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .clubs-sidebar {
    display: none;
  }

  .clubs-main {
    margin-left: 0;
    padding: var(--spacing-md);
  }
}
</style>
