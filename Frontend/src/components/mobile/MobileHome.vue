<template>
  <div class="mobile-home-page">
    <!-- 事件列表 -->
    <EventList :category="selectedCategory" />
  </div>
</template>

<script setup lang="ts">
import EventList from "@/components/EventList.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const selectedCategory = computed(() => route.query.category?.toString() || "");
</script>

<style scoped>
.mobile-home-page {
  padding-top: 1.4rem; /* 留出顶部导航栏空间 */
  background: #f5f5f5;
  min-height: 100vh;
}
</style>