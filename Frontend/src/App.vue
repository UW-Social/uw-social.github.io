<template>
  <div
    class="app-container"
    :style="isMobile && route.path === '/login' ? { paddingTop: '0' } : { paddingTop: '70px' }"
  >
    <Navbar />
    <div class="content">
      <router-view></router-view>
    </div>
    <router-link
      v-if="showFloatingPublishButton"
      to="/publish"
      class="floating-publish-button"
      aria-label="Publish your own events and clubs"
    >
      <span class="floating-publish-tooltip">Publish your own events & clubs</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
      </svg>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue';
import '@/assets/global.css';
import { computed, onMounted, ref, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isMobile = ref(window.innerWidth <= 576);
const showFloatingPublishButton = computed(() => (
  route.path === '/' || route.path === '/events'
));

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

.floating-publish-button {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 1100;
  width: 54px;
  height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #5b61f6 0%, #7c73ff 100%);
  color: #fff;
  text-decoration: none;
  box-shadow: 0 18px 34px rgba(91, 97, 246, 0.3);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.floating-publish-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 44px rgba(91, 97, 246, 0.36);
}

.floating-publish-button svg {
  width: 25px;
  height: 25px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
}

.floating-publish-tooltip {
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translate(8px, -50%);
  width: max-content;
  max-width: min(260px, calc(100vw - 100px));
  padding: 9px 12px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.94);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
  white-space: nowrap;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.2);
}

.floating-publish-button:hover .floating-publish-tooltip,
.floating-publish-button:focus-visible .floating-publish-tooltip {
  opacity: 1;
  transform: translate(0, -50%);
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
  .floating-publish-button {
    right: 18px;
    bottom: 18px;
    width: 48px;
    height: 48px;
  }

  .floating-publish-button svg {
    width: 22px;
    height: 22px;
  }
}

</style>
