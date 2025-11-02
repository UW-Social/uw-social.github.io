<template>
  <div class="events-page">
    <div class="overlapping-page">
      <div class="events-page-with-search">
        <!-- Sidebar with Search and Sort -->
        <EventSidebar
          :search="searchQuery"
          :sort="sortType"
          @update:search="handleSearchUpdate"
          @update:sort="handleSortUpdate"
        />

        <!-- Main Event List -->
        <div class="events-main-content">
          <EventList
            :category="categoryFilter"
            :search="searchQuery"
            :sort="sortType"
            @open-card="handleEventClick"
          />
        </div>
      </div>
    </div>

    <!-- Back to Top Button -->
    <BackToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EventList from '../components/EventList.vue';
import EventSidebar from '../components/EventSidebar.vue';
import BackToTop from '../components/BackToTop.vue';
import '../assets/sidebar.css';
import type { Event } from '../types/event';

const route = useRoute();
const router = useRouter();

const categoryFilter = ref('');
const searchQuery = ref('');
const sortType = ref('recommended'); // 默认为推荐排序
const isUpdatingFromUrl = ref(false); // 标记是否正在从 URL 更新

// 监听路由查询参数变化
watch(() => route.query.q, (newQuery) => {
  isUpdatingFromUrl.value = true;
  if (newQuery) {
    searchQuery.value = newQuery as string;
  } else {
    searchQuery.value = ''; // 清空搜索
  }
  isUpdatingFromUrl.value = false;
}, { immediate: true });

// 监听搜索框变化（用户手动输入/清空）
watch(searchQuery, (newVal) => {
  // 如果是从 URL 更新的，不要再更新 URL（避免循环）
  if (isUpdatingFromUrl.value) return;

  if (!newVal || newVal.trim() === '') {
    // 如果搜索框为空，清除 URL 参数
    if (route.query.q) {
      router.replace({ path: route.path, query: {} });
    }
  }
});

// Sidebar event handlers
const handleSearchUpdate = (value: string) => {
  searchQuery.value = value;
};

const handleSortUpdate = (value: string) => {
  sortType.value = value;
};

// Event click handler - navigate to detail page
const handleEventClick = (event: Event) => {
  router.push(`/events/${event.id}`);
};

// Keep layout simple; no additional watchers for select font sizing
</script>

<style scoped>
/**
 * Events Page - Flat, Clean Layout
 */

.events-page {
  min-height: 100vh;
  background-color: var(--color-white);
}

.overlapping-page {
  position: relative;
  padding-top: calc(var(--navbar-height) - var(--spacing-2xl));
}

.events-page-with-search {
  min-height: calc(100vh - var(--navbar-height));
  display: flex;
}

/* Main Content Area */
.events-main-content {
  padding: 0 var(--spacing-3xl);
  flex: 1;
  box-sizing: border-box;
}

/* Responsive Design */
@media (max-width: 768px) {
  .events-main-content {
    margin-left: 0;
    width: 100%;
    padding: var(--spacing-md);
  }
}
</style>