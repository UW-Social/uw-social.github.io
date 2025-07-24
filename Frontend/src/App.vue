
<template>
  <div
    class="app-container"
    :style="isMobile && route.path === '/login' ? { paddingTop: '0' } : { paddingTop: '70px' }"
  >
    <MobileNav v-if="isMobile" />
    <Navbar v-else />
    <div class="content">
      <router-view></router-view>
    </div>
    <!-- 全局弹窗 -->
    <ElDialog v-if="!hasQuery" v-model="eventDialogStore.isDialogOpen" title="Event Details" class="custom-dialog">
      <DetailCard v-if="eventDialogStore.selectedEvent" :event="eventDialogStore.selectedEvent" />
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue';
import MobileNav from '@/components/mobile/MobileNav.vue';
import { useEventDialogStore } from './stores/eventDialog.ts';
import DetailCard from '@/components/DetailCard.vue';
import { onMounted, ref, onUnmounted } from 'vue';
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const eventDialogStore = useEventDialogStore();
const route = useRoute()
const hasQuery = computed(() => !!route.query.q)
const isMobile = ref(window.innerWidth <= 576);

function updateIsMobile() {
  isMobile.value = window.innerWidth <= 576;
}

onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);

  // 动态设置视口高度，解决移动端 100vh 问题
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  setVh();
  window.addEventListener('resize', setVh);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
  window.removeEventListener('resize', setVh);
});

</script>

=======
const eventDialogStore = useEventDialogStore();

const route = useRoute()
const hasQuery = computed(() => !!route.query.q)
</script>

<template>
  <div class="app-container">
    <MobileNav v-if="isMobile" />
    <Navbar v-else />
    <div class="content">
      <router-view></router-view>
    </div>

    <!-- 全局弹窗 -->
    <ElDialog
    v-if="!hasQuery"
    v-model="eventDialogStore.isDialogOpen"
    title="Event Details"
    class="custom-dialog"
  >
    <DetailCard
      v-if="eventDialogStore.selectedEvent"
      :event="eventDialogStore.selectedEvent"
    />
  </ElDialog>
  </div>
</template>

<style scoped>
.custom-dialog {
  max-width: 600px;
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  /* box-sizing: border-box; */
}

body {
  margin: 0;
  font-family: 'Helvetica Neue', sans-serif;
  background-color: #ffffff;
  min-height: 100vh;
}

.app-container {
  padding-top: 70px; /* 让出导航栏的空间 */
  min-height: calc(var(--vh, 1vh) * 100); /* 保持全屏 */
  box-sizing: border-box;
}

.content {
  /* padding: 10px; 正文和边缘的距离 */
}

@media (max-width: 576px) {
  /* 方法1：通过覆盖CSS变量 */
  .el-dialog {
    --el-dialog-width: 95vw !important;
    --el-dialog-margin-top: 2vh !important;
  }
  
  /* 方法2：直接覆盖对话框样式 */
  ::v-deep .el-dialog.custom-dialog {
    width: 95vw !important;
    max-width: 95vw !important;
    min-width: 0 !important;
    margin: 2vh auto !important;
    left: 0 !important;
    right: 0 !important;
    border-radius: 0 !important;
    padding: 0 !important;
  }
  
  /* 对话框内容区域 */
  ::v-deep .el-dialog__body {
    padding: 10px !important;
  }
}

</style>