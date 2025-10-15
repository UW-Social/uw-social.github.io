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
import { computed, onMounted, ref, nextTick } from 'vue';
import { loadGoogleMaps } from '../utils/googleMaps';
import { formatEventSchedule, type Event } from '../types/event';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useEventStore } from '../stores/event';
import { isMobile } from '../router';

const props = defineProps<{
  event: Event;
  currentUserId?: string | number;
}>();

const eventStore = useEventStore();

// 地图容器
const mapContainer = ref<HTMLElement | null>(null);

// 滚动相关状态
const scrollableContent = ref<HTMLElement>();
const showScrollHint = ref(true);

// 计算属性判断是否显示删除按钮
const showDeleteButton = computed(() => {
  console.log('[DetailCard] props:', props);
  return String(props.event.organizerId) === String(props.currentUserId);
});

// 检查内容是否可滚动
const checkScrollable = () => {
  nextTick(() => {
    if (scrollableContent.value) {
      const element = scrollableContent.value;
      showScrollHint.value = element.scrollHeight > element.clientHeight;
    }
  });
};

// 滚动事件处理：使用 UIEvent，避免与自定义 Event 类型冲突
const onScroll = (e: UIEvent) => {
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

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this event?')) return;
  try {
    await deleteDoc(doc(db, 'events', props.event.id));
    alert('Event deleted.');
    await eventStore.fetchEvents();
  } catch (e) {
    alert('Failed to delete event.');
  }
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
  width: min(1400px, 95vw); /* 响应式宽度，最大1400px，但不超过视口宽度的95% */
  max-height: calc(100vh - 40px); /* 最大高度为视口高度减去padding */
  margin: 20px auto;
  overflow-y: auto; /* 允许垂直滚动 */

  /* 只作为兜底，避免页面出现横向滚动条 */
  overflow-x: hidden;
}

/* 去掉地图卡片的内边距，避免容器被压缩 */
.detail-card-map :deep(.el-card__body) {
  padding: 0;
}

/* Flex 子项可收缩，避免横向被长内容撑开 */
.detail-card-map,
.detail-card-description {
  min-width: 0;
}

.detail-card-header {
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.map-and-description {
  display: flex; /* 设置为水平布局 */
  gap: 1.5rem; /* map 和 description 之间的间距 */
  margin-top: 1.5rem; /* 与标题部分的间距 */
}

.detail-card-map {
  flex: 0.3; /* 缩短 map 的宽度 */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-card-description {
  flex: 0.7; /* 增大 description 的宽度 */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.google-map {
  width: 100%;          /* 关键：明确宽度 */
  height: 260px;        /* 关键：明确高度 */
  background-color: #fff;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
}

/* 只纵向滚动，已 OK */
.scrollable-content {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  word-break: break-word;
  overflow-wrap: anywhere;
}

/* 富文本里的图片不超出容器 */
.event-description img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 链接在窄容器中也能断行 */
.event-link a {
  word-break: break-word;
  overflow-wrap: anywhere;
}

/* 滚动条样式 */
.scrollable-content::-webkit-scrollbar {
  width: 8px;
}

.scrollable-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
  transition: background 0.3s;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 滚动提示 */
.scroll-hint {
  position: absolute;
  bottom: 10px;
  right: 20px;
  z-index: 10;
  pointer-events: none;
}

.scroll-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(108, 99, 255, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: bounce 2s infinite;
}

.scroll-arrow {
  font-size: 1.2rem;
  margin-top: 2px;
  animation: bounce-arrow 1.5s infinite;
}

/* 底部渐变遮罩 */
.scroll-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.9));
  pointer-events: none;
  border-radius: 0 0 8px 8px;
}

/* 动画 */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-5px);
  }
  60% {
    transform: translateY(-3px);
  }
}

@keyframes bounce-arrow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(3px);
  }
}

.detail-header {
  display: flex;
  gap: 1.5rem; /* 图片和信息之间的间距 */
  align-items: center;
}

.event-image {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.event-info {
  flex: 1;
}

.event-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.event-location,
.event-time {
  font-size: 1rem;
  color: #555;
  margin-bottom: 0.5rem;
}
</style>