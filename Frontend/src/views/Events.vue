<template>
  <div class="events-page">
    <!-- 背景容器 -->
    <div class="background-container">
      <img src="/svg/eventsbg.svg" alt="Events Background" class="background-svg" />
    </div>

    <div class="overlapping-page">
      <div class="events-page-with-search" v-if="!selectedEvent">
        <div class="events-content">
          <!-- 搜索框 -->
          <div class="search-bar-container">
            <input
            v-model="searchQuery"
            type="text"
            placeholder="Search events..."
            class="search-bar"
            @keyup.enter="handleSearch"
            />
          </div>

          <!-- 事件列表 -->
          <el-main class="event-list-container">
            <EventList :category="categoryFilter" :search="searchQuery" @open-card="setSelectedEvent" />
          </el-main>
        </div>
      </div>
      
      <!-- Detail Card -->
      <div v-if="selectedEvent" class="detail-card-overlay" @click.self="clearSelectedEvent">
        <DetailCard :event="selectedEvent" :currentUserId="currentUserId" @close="clearSelectedEvent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import EventList from '../components/EventList.vue';
import DetailCard from '../components/DetailCard.vue';
import '../assets/sidebar.css';
import { useUserStore } from '../stores/user';
import { setSelectedEvent, clearSelectedEvent, useSelectedEvent, mountKeyDownListener, unmountKeyDownListener } from '../utils/eventUtils';

const userStore = useUserStore();
const currentUserId = computed(() => userStore.userProfile?.uid);

// 获取选中的活动的 ref
const selectedEvent = useSelectedEvent();

// 挂载和卸载事件监听器
onMounted(() => {
  mountKeyDownListener();
});

onUnmounted(() => {
  unmountKeyDownListener();
});

const categoryFilter = ref('');
const searchQuery = ref('');

const handleSearch = () => {
  console.log('Search initiated for:', searchQuery.value);
};

const openCard = (event: any) => {
  if (!userStore.userProfile || !userStore.userProfile.uid) {
    alert('Please log in first.');
    return;
  }
  setSelectedEvent(event); // 设置选中的活动
};
</script>

<style scoped>
.events-page {
  position: relative;
  overflow: hidden;
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.background-svg {
  width: 100%;
  height: auto;
}

.overlapping-page {
  position: relative;
  z-index: 1;
}

.events-page-with-search {
  min-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.events-content {
  display: flex; /* 使用 flex 布局 */
  flex: 1; /* 占据剩余空间 */
  gap: 1rem; /* 搜索框和事件列表之间的间距 */
}

.search-bar-container {
  display: flex;
  flex-direction: column; /* 垂直排列搜索框和按钮 */
  justify-content: flex-start; /* 搜索框靠顶部对齐 */
  align-items: flex-start; /* 搜索框靠左对齐 */
  padding: 3rem 0 1rem 2.5rem; /* 上下边距为3rem，左右边距为1rem */
  border-radius: 8px;
  width: 250px; /* 搜索框容器宽度 */
}

.search-bar {
  color: #828282;
  width: 100%; /* 搜索框宽度占满容器 */
  padding: 0.8rem;
  border: 1px solid #000000;
  border-radius: 10px;
  box-shadow: 0 rgba(0, 0, 0, 0.1)  2px 4px;
  font-size: 1rem;
}

.search-btn {
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.8rem 1.2rem;
  margin-top: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-btn:hover {
  background-color: #5753d6;
}

.events-page-with-search .el-main {
  margin: 0; /* Reset margin */
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-list-container {
  flex: 1; /* 事件列表占据剩余空间 */
  display: flex;
  flex-direction: column;
}

.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 保证按钮和标题垂直居中 */
  margin-bottom: 0rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.events-header h2 {
  color: #6c63ff;
  font-weight: bold;
  letter-spacing: 1px;
}

h1 {
  color: #333;
  margin: 0;
  font-size: 2rem;
}

.publish-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(90deg, #b388eb 0%, #6c63ff 100%);
  color: #fff;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;
  margin-right: 0; /* 去掉原来的 margin-right: 50px; */
  border: none;
  box-shadow: 0 2px 8px rgba(108, 99, 255, 0.08);
}

.publish-btn:hover {
  background: linear-gradient(90deg, #9c6ad6 0%, #6c63ff 100%);
}

.icon {
  font-size: 1.2rem;
}

.detail-card-container {
  margin-top: 100px;
  border: none;
}

.detail-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px 0;
}

@media (max-width: 576px) {
  
}
</style>