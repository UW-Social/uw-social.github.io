<template>
  <div class="home-page">
    <!-- 背景 SVG -->
    <div class="background-container">
      <img v-if="isMobile" src="../../public/svg/background5.svg" class="background-svg" :style="{ opacity: backgroundOpacity }" />
      <img v-else src="../../public/svg/background4.svg" class="background-svg" :style="{ opacity: backgroundOpacity }" />
    </div>

    <!-- 新增标题和短句子 -->
    <div class="page-title">
      <h1>UW Social</h1>
      <p>Your social gateway<br />to everything happening at UW</p>
      <!-- 新增按钮 -->
      <el-row class="page-button">
        <el-button round type="primary" @click="navigateToEvents">
          Explore Now
          <img src="../../public/svg/rightarrow1.svg" alt="arrow" class="button-arrow" />
        </el-button>
      </el-row>
    </div>

    <div class="events-section">
      <h2>Recommend for you</h2>
      <EventList @open-card="setSelectedEvent" />
      <div v-if="selectedEvent" class="detail-card-overlay" @click.self="clearSelectedEvent">
        <DetailCard :event="selectedEvent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EventList from '../components/EventList.vue';
import DetailCard from '../components/DetailCard.vue';
import { setSelectedEvent, clearSelectedEvent, useSelectedEvent, mountKeyDownListener, unmountKeyDownListener } from '../utils/eventUtils';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEventStore } from '../stores/event';

const homeSearch = ref('');
const router = useRouter();
const backgroundOpacity = ref(1); // 背景透明度
const eventStore = useEventStore();

const isMobile = ref(window.innerWidth <= 576);

const selectedEvent = useSelectedEvent();

function handleHomeSearch() {
  if (homeSearch.value.trim()) {
    router.push({ path: '/events', query: { q: homeSearch.value.trim() } });
    homeSearch.value = '';
  }
}

// 新增 navigateToEvents 方法
function navigateToEvents() {
  router.push('/events'); // 跳转到 events 页面
}

// 监听滚动事件，动态调整背景透明度
function handleScroll() {
  const maxScroll = 550; // 滚动多少像素后完全透明
  const scrollTop = window.scrollY;

  backgroundOpacity.value = Math.max(1 - scrollTop / maxScroll, 0.1);
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  mountKeyDownListener();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  unmountKeyDownListener();
});
</script>

<style scoped>
.home-page {
  position: relative;
  min-height: calc(100vh - 100px);
  overflow: hidden;
  z-index: 1; /* 确保内容在背景之上 */
}

.background-container {
  position: fixed;
  top: 0px; /* 留出导航栏的高度，假设导航栏高度为 80px */
  left: 0;
  width: 100vw; /* 背景宽度覆盖整个视口 */
  height: 160vh; /* 背景高度覆盖整个视口 */
  z-index: -1; /* 确保背景在内容后面 */
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  pointer-events: none; /* 防止背景影响内容交互 */
}

.background-svg {
  width: 100%; /* 宽度自动调整 */
  height: 100%; /* 高度覆盖容器 */
  object-fit: cover; /* 确保背景图像适应容器 */
  opacity: 1;
  transition: opacity 0.2s ease-out; /* 平滑过渡 */
}

.page-title {
  position: absolute;
  top: calc(80px + 3rem); /* 导航栏高度 + 3rem */
  left: 5rem; /* 距离左侧 5rem */
  color: #8358D8; /* 标题颜色 */
  font-family: 'Poppins', sans-serif; /* 使用 Poppins 字体 */
  z-index: 2; /* 确保标题在背景之上 */
}

.page-title h1 {
  font-size: 3.4rem; /* 主标题字体大小 */
  font-weight: 1000; /* 主标题字体粗细 */
  margin: 0;
}

.page-title p {
  font-size: 2.1rem; /* 副标题字体大小 */
  font-weight: 500; /* 副标题字体粗细 */
  margin: 0.5rem 0 0 0; /* 副标题与主标题的间距 */
  line-height: 1.5; /* 行高 */
}

.page-button {
  margin-top: 3rem; /* 按钮距离标题的间距 */
  z-index: 4; /* 确保按钮在其他元素之上 */
  position: relative;
}

.page-button .el-button { /*explore now button */
  background-color: #8c66d8; /* 按钮背景颜色 */
  color: #F4EBD1; /* 按钮文字颜色 */
  font-size: 1.4rem; /* 按钮文字大小 */
  font-family: 'Poppins', sans-serif; /* 按钮文字字体 */
  border-radius: 40px; /* 按钮圆角 */
  padding: 2rem 2.3rem; /* 按钮内边距 */
  transition: background-color 0.3s ease;
}

.page-button .el-button:hover {
  background-color: #b196e5; /* 按钮悬停时的背景颜色 */
}

.events-section {
  margin: 30rem 0;
  padding: 9rem 4rem 1rem;
  z-index: 2; /* 确保 EventList 在背景之上 */
  position: relative; /* 确保 z-index 生效 */
}

.events-section h2 {
  text-align: left;
  color: #8358D8;
  padding: 0 0 0 2rem;
  font-size: 1.5rem;
  font-family: 'Poppins', sans-serif; /* 设置字体为 Poppins */
  font-weight: 500;
}

.button-arrow {
  width: 2.5rem;
  height: 2.5rem;
  vertical-align: middle;
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
  .page-title {
    top: calc(80px + 2rem); /* 导航栏高度 + 2rem */
    left: 2rem; /* 距离左侧 2rem */
  }

  .page-title h1 {
    font-size: 2.6rem; /* 主标题字体大小 */
  }

  .page-title p {
    font-size: 1.8rem; /* 副标题字体大小 */
  }

  .page-button {
    margin-top: 6rem; /* 按钮距离标题的间距 */
  }

  .events-section {
    margin: 30rem 0;
    padding: 6rem 0;
  }
}
</style>