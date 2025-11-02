<template>
  <div class="event-list">
    <div v-if="filteredEvents.length === 0" class="loading">Loading events...</div>
    <div v-else class="events-grid">
      <EventCard
        v-for="event in filteredEvents"
        :key="event.id"
        :event="event"
        :currentUserId="userStore.userProfile?.uid"
        @click="$emit('open-card', event); console.log('[EventList.vue] open-card emitted with event:', event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch} from 'vue';
import Fuse from 'fuse.js';
import { useEventStore } from '../stores/event';
import EventCard from './EventCard.vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';
import { getPhraseVec, getPhraseVecBatch } from './models/embedding_distance';
import { formatEventSchedule, type Event } from '../types/event';

const props = defineProps<{
  category?: string;
  search?: string;
  sort?: string;
}>();
const eventStore = useEventStore();
const userStore = useUserStore(); 
const route = useRoute();

function sortEventsByStartTimeDesc(events: any[]) {
  return events.slice().sort((a, b) => {
    const toDate = (val: any) =>
      typeof val?.toDate === 'function' ? val.toDate() : new Date(val);
    return toDate(b.startTime).getTime() - toDate(a.startTime).getTime();
  });
}

function sortEventsByStartTimeAsc(events: any[]) {
  return events.slice().sort((a, b) => {
    const toDate = (val: any) =>
      typeof val?.toDate === 'function' ? val.toDate() : new Date(val);
    return toDate(a.startTime).getTime() - toDate(b.startTime).getTime();
  });
}

/**
 * Compute cosine similarity between two Float32Array vectors.
 * Returns a value between -1 and 1.
 */
function cosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }

  console.log('cosine similarity computed')

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compute cosine similarity between two phrases using getPhraseVec.
 * Returns similarity score (1 = identical, -1 = opposite).
 */
async function phraseCosineSimilarity(
  phrase1: string,
  phrase2: string
): Promise<number> {
  // Get embeddings
  const [vec1, vec2] = await Promise.all([getPhraseVec(phrase1), getPhraseVec(phrase2)]);

  // Compute and return cosine similarity
  return cosineSimilarity(vec1, vec2);
}

// Import your phraseCosineSimilarity or getPhraseVec accordingly
// import { getPhraseVec, phraseCosineSimilarity } from './your-embedding-module';

async function makeInterestTagEventsFirstSemantic(events: any[]){
  const userTags = (userStore.userProfile?.tags ?? []).map(t => t.toLowerCase());

  if (!userTags.length) return events;

  // Precompute embeddings for user tags
  const userTagEmbeddings = await Promise.all(
    userTags.map(tag => getPhraseVec(tag))
  );

  // For each event, find max similarity to any user tag
  async function maxSimilarityToUserTags(eventTags: string[]): Promise<number> {
    if (!Array.isArray(eventTags) || eventTags.length === 0) return -1;

    // Compute embeddings of event tags
    const eventTagEmbeddings = await Promise.all(
      eventTags.map(tag => getPhraseVec(tag.toLowerCase()))
    );

    let maxSim = -Infinity;

    for (const eVec of eventTagEmbeddings) {
      for (const uVec of userTagEmbeddings) {
        const sim = cosineSimilarity(eVec, uVec);
        if (sim > maxSim) maxSim = sim;
      }
    }

    return maxSim;
  }

  // Compute similarity scores for all events in parallel
  const eventScores = await Promise.all(
    events.map(async (event) => {
      const maxSim = await maxSimilarityToUserTags(event.tags ?? []);
      return { event, score: maxSim };
    })
  );

  // Sort by descending similarity (higher means more related)
  eventScores.sort((a, b) => b.score - a.score);

  // Return sorted events
  return eventScores.map(es => es.event);
}

const eventsAfterSemantic = ref<any[]>([]);

async function refreshEvents() {
  console.log('[EventList.vue] refreshEvents called');
  let events = !props.category
    ? eventStore.events
    : eventStore.events.filter(e => e.category.toUpperCase() === props.category?.toUpperCase());

  // Only show upcoming events
  const now = new Date();
  events = events.filter(e => {
    const end = typeof e.endtime?.toDate === 'function'
      ? e.endtime.toDate()
      : new Date(e.endtime);
    return end > now;
  });

  // Phase 1: default sorting based on sort type
  if (props.sort === 'farthest') {
    // 最远：按开始时间降序（最晚的活动在前）
    events = sortEventsByStartTimeDesc(events);
  } else if (props.sort === 'nearest') {
    // 最近：按开始时间升序（最近的活动在前）
    events = sortEventsByStartTimeAsc(events);
  } else {
    // recommended 或默认：保持原始顺序（数据库上传顺序）
    // events 保持不变
  }
  eventsAfterSemantic.value = events; // immediately display to the user
  console.log('Initial events sorted:', events.length, 'sort type:', props.sort);

  // 获取搜索关键词（优先使用 props.search，其次使用 URL query）
  const q = (props.search || route.query.q as string || '').trim();
  
  // 如果有搜索词，立即应用搜索
  if (q) {
    const fuse = new Fuse(events, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'tags', weight: 1.5 },
        { name: 'organizerName', weight: 1.2 },
        { name: 'description', weight: 1 },
        { name: 'location', weight: 0.8 },
      ],
      threshold: 0.3,
      distance: 80,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true,
      shouldSort: true,              // 自动按相关度排序（分数越低越相关）
    });
    const searchResults = fuse.search(q);
    
    // 打印前5个结果的分数，便于调试
    console.log('[EventList] Search results:', searchResults.length, 'for query:', q);
    searchResults.slice(0, 5).forEach((result, index) => {
      console.log(`  ${index + 1}. "${result.item.title}" - score: ${result.score?.toFixed(3)}`);
    });
    
    // 搜索结果根据排序类型进行排序
    let sortedResults = searchResults.map(r => r.item);
    if (props.sort === 'recommended') {
      // recommended: 保持 Fuse.js 的搜索权重排序
      // sortedResults 已经按搜索相关度排序，不需要额外处理
    } else if (props.sort === 'farthest') {
      sortedResults = sortEventsByStartTimeDesc(sortedResults);
    } else if (props.sort === 'nearest') {
      sortedResults = sortEventsByStartTimeAsc(sortedResults);
    }
    
    eventsAfterSemantic.value = sortedResults;
    return; // 有搜索时直接返回
  }
  
  // 没有搜索词时，events 已经根据 sort type 排序好了，直接使用
}


watch([() => props.category, () => props.search, () => props.sort, () => userStore.isLoggedIn], refreshEvents, { immediate: true });

const filteredEvents = computed(() => {
  // Just return the pre-filtered async data (sync now)
  return eventsAfterSemantic.value;
});

// onMounted(() => {
//     if (eventStore.events.length === 0) {
//         eventStore.fetchEvents();
//     } 
// });

onMounted(async () => {
  if (eventStore.events.length === 0) {
    await eventStore.fetchEvents();
  }
  refreshEvents(); // now events are loaded
});

const isVisible = ref(false); // 控制 DetailCard 的显示状态

const showDetailCard = () => {
  isVisible.value = true; // 显示 DetailCard
};

const hideDetailCard = () => {
  isVisible.value = false; // 隐藏 DetailCard
};
</script>

<style scoped>
.event-list {
    padding: 0;
    margin: 0;
}

.loading,
.no-events {
    text-align: center;
    padding: var(--spacing-3xl);
    color: var(--color-gray-600);
    font-size: var(--font-size-lg);
}

.events-grid {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
}

@media (max-width: 576px) {
    .events-grid {
        padding: 0;
        margin: 0;
    }
}
</style>
