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
      <el-card class="detail-card-map">
        <div class="google-map" ref="mapContainer">
          <p>Google Map</p>
          <!-- 嵌入 Google Map 的 API -->
        </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue';
import { formatEventSchedule, type Event } from '../types/event';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useEventStore } from '../stores/event';

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

// 滚动事件处理
const onScroll = (event: Event) => {
  const element = event.target as HTMLElement;
  const scrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;
  
  // 如果滚动超过20px或接近底部，隐藏提示
  if (scrollTop > 20 || scrollTop + clientHeight >= scrollHeight - 10) {
    showScrollHint.value = false;
  }
};

// 组件挂载后检查是否需要显示滚动提示
onMounted(() => {
  checkScrollable();

  if (mapContainer.value) {
    const location = props.event.location || 'University of Washington';
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: location }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const map = new google.maps.Map(mapContainer.value, {
          center: results[0].geometry.location,
          zoom: 15,
        });

        new google.maps.Marker({
          position: results[0].geometry.location,
          map: map,
        });
      } else {
        console.error('Geocode was not successful for the following reason:', status);
      }
    });
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

.scrollable-content {
  max-height: 400px; /* 限制描述区域最大高度 */
  overflow-y: auto; /* 描述内容过长时可滚动 */
  padding-right: 8px; /* 为滚动条留出空间 */
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

.google-map {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.event-details {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-description {
  padding: 0 0.5rem;
  font-size: 1.1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
  color: #374151;
  line-height: 1.7;
  letter-spacing: 0.01em;
  margin-bottom: 1rem;
}

.event-tags {
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 1rem;
}

.event-link a {
  color: #1c6fc1;
  text-decoration: underline;
}

.event-link a:hover {
  color: #0a4fa3;
}
</style>