<template>
  <div
    class="app-container"
    :style="isMobile && route.path === '/login' ? { paddingTop: '0' } : { paddingTop: '70px' }"
  >
    <Navbar />
    <div class="content">
      <router-view></router-view>
    </div>
    <EventChatbot />
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue';
import EventChatbot from './components/EventChatbot.vue';
import '@/assets/global.css';
import { onMounted, ref, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isMobile = ref(window.innerWidth <= 576);

function updateIsMobile() {
  isMobile.value = window.innerWidth <= 576;
}

const setVh = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);

  // 动态设置视口高度，解决移动端 100vh 问题
  setVh();
  window.addEventListener('resize', setVh);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
  window.removeEventListener('resize', setVh);
});
</script>

<style scoped>
.app-container {
  padding-top: 70px; /* 让出导航栏的空间 */
  min-height: calc(var(--vh, 1vh) * 100); /* 保持全屏 */
  box-sizing: border-box;
}

.content {
}

.global-detail-card {
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

@media (max-width: 576px) {

}

</style>
