<template>
  <div class="detail-card-container" @click.self="$emit('close')">
    <el-card class="detail-card-header">
      <!-- 第一部分：图片和标题 -->
      <div class="detail-header">
        <img :src="event.imageUrl || '/images/wavingdog.jpg'" alt="Event Image" class="event-image" />
        <div class="event-info">
          <h2 class="event-title">{{ event.title }}</h2>
          <p class="event-location">📍 {{ event.location }}</p>
          <p class="event-time">⏰ {{ formatEventSchedule(event) }}</p>
        </div>
      </div>
    </el-card>

    <!-- 第二部分：Google Map 和描述 -->
    <div class="map-and-description">
      <el-card v-if="!isMobile()" class="detail-card-map">
        <!-- 地图容器：不要放文字，占满容器 -->
        <div class="google-map" ref="mapContainer"></div>
      </el-card>

      <el-card class="detail-card-description">
        <div class="scrollable-content" ref="scrollableContent" @scroll="onScroll">
          <p class="event-description" v-html="formatDescription(event.description)"></p>
          <p v-if="event.tags && event.tags.length" class="event-tags">🏷️ {{ event.tags.join(', ') }}</p>
          <p v-if="event.link" class="event-link">
            <a :href="event.link" target="_blank" rel="noopener noreferrer">{{ event.link }}</a>
          </p>
        </div>
        <!-- 底部渐变遮罩 -->
        <div v-if="showScrollHint" class="scroll-gradient"></div>
      </el-card>

      <el-card v-if="isMobile()" class="detail-card-map-mobile">
        <!-- 地图容器：不要放文字，占满容器 -->
        <div class="google-map" ref="mapContainer"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { loadGoogleMaps } from '../utils/googleMaps';
import { formatEventSchedule, type Event as SocialEvent } from '../types/event';
import { isMobile } from '../router';

const props = defineProps<{
  event: SocialEvent;
  currentUserId?: string | number;
}>();

// 地图容器
const mapContainer = ref<HTMLElement | null>(null);

// 滚动相关状态
const scrollableContent = ref<HTMLElement>();
const showScrollHint = ref(true);

// 检查内容是否可滚动
const checkScrollable = () => {
  nextTick(() => {
    if (scrollableContent.value) {
      const element = scrollableContent.value;
      showScrollHint.value = element.scrollHeight > element.clientHeight;
    }
  });
};

// 滚动事件处理
const onScroll = (e: Event) => {
  const element = e.target as HTMLElement;
  const scrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;
  if (scrollTop > 20 || scrollTop + clientHeight >= scrollHeight - 10) {
    showScrollHint.value = false;
  }
};

// 组件挂载后初始化地图
onMounted(async () => {
  checkScrollable();

  await nextTick(); // 确保卡片和容器已完成布局
  const el = mapContainer.value;
  if (!el) return;

  try {
    const g = await loadGoogleMaps();
    const fallback = { lat: 47.6553, lng: -122.3035 }; // UW

    const map = new g.maps.Map(el, {
      center: fallback,
      zoom: 15,
    });

    const location = props.event.location || 'University of Washington';
    const geocoder = new g.maps.Geocoder();

    geocoder.geocode({ address: location }, (results: any, status: any) => {
      if (status === 'OK' && results?.[0]) {
        const pos = results[0].geometry.location;
        map.setCenter(pos);
        new g.maps.Marker({ position: pos, map });
      } else {
        // 兜底 Marker，便于可视验证
        new g.maps.Marker({ position: fallback, map });
        console.warn('Geocode failed:', status, 'using fallback center');
      }
    });
  } catch (err) {
    console.error('Failed to load Google Maps:', err);
  }
});

const formatDescription = (desc: string) => {
  if (!desc) return '';
  return desc.replace(/\n/g, '<br>');
};

console.log('[DetailCard.vue] props.event:', props.event);

// 监听内容变化
nextTick(() => {
  checkScrollable();
});
</script>

<style scoped>
.detail-card-container {
  position: relative;
  width: min(1200px, 95vw);
  max-height: calc(100vh - 40px);
  margin: 20px auto;
  overflow-y: auto;
  overflow-x: hidden;
  animation: modalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Override Element Plus Card Styles if needed, or just style the container */
:deep(.el-card) {
  border: none;
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.detail-card-map :deep(.el-card__body) {
  padding: 0;
}

.detail-card-map,
.detail-card-description {
  min-width: 0;
}

.detail-card-header {
  margin-bottom: 1.5rem;
  border-radius: var(--radius-xl);
  background: var(--color-white);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.map-and-description {
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.detail-card-map {
  flex: 0.35;
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-card-description {
  flex: 0.65;
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: var(--color-white);
}

.google-map {
  width: 100%;
  height: 300px;
  background-color: #f3f4f6;
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.scrollable-content {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  word-break: break-word;
  padding: var(--spacing-lg);
}

.event-description {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-gray-700);
}

.event-description img {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-lg);
  margin: 1rem 0;
}

.event-tags {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--color-gray-600);
  font-weight: 500;
}

.event-link {
  margin-top: 1rem;
}

.event-link a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  word-break: break-word;
}

.event-link a:hover {
  text-decoration: underline;
}

/* Scrollbar */
.scrollable-content::-webkit-scrollbar {
  width: 6px;
}
.scrollable-content::-webkit-scrollbar-track {
  background: transparent;
}
.scrollable-content::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: 3px;
}
.scrollable-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-400);
}

/* Scroll Gradient */
.scroll-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to top, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
  pointer-events: none;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

/* Header */
.detail-header {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.event-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.event-info {
  flex: 1;
}

.event-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  color: var(--color-gray-900);
  line-height: 1.2;
}

.event-location,
.event-time {
  font-size: 1.05rem;
  color: var(--color-gray-600);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .map-and-description {
    flex-direction: column;
  }
  
  .detail-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .event-title {
    font-size: 1.5rem;
  }
}
</style>