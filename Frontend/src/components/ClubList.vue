<template>
  <div class="event-list">
    <div v-if="filteredClubs.length === 0" class="loading">Loading clubs...</div>
    <div v-else class="events-grid">
      <ClubCard
        v-for="club in filteredClubs"
        :key="club.id"
        :club="club"
        :currentUserId="userStore.userProfile?.uid"
        @click="$emit('open-card', club); console.log('[ClubList.vue] open-card emitted with club:', club)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Fuse from 'fuse.js';
import { useClubStore } from '../stores/club';
import ClubCard from './ClubCard.vue';
import { useUserStore } from '../stores/user';
import { getPhraseVec } from './models/embedding_distance';
import type { Club } from '../types/club';

const props = defineProps<{ 
  category?: string;
  search?: string;
  sort?: string;
}>();

const clubStore = useClubStore();
const userStore = useUserStore();

/**
 * Compute cosine similarity between two Float32Array vectors.
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

  console.log('cosine similarity computed');
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Sort clubs by user interest tags using semantic similarity
 */
async function makeInterestTagClubsFirstSemantic(clubs: any[]) {
  const userTags = (userStore.userProfile?.tags ?? []).map(t => t.toLowerCase());

  if (!userTags.length) return clubs;

  // Precompute embeddings for user tags
  const userTagEmbeddings = await Promise.all(
    userTags.map(tag => getPhraseVec(tag))
  );

  // For each club, find max similarity to any user tag
  async function maxSimilarityToUserTags(clubTags: string[]): Promise<number> {
    if (!Array.isArray(clubTags) || clubTags.length === 0) return -1;

    const clubTagEmbeddings = await Promise.all(
      clubTags.map(tag => getPhraseVec(tag.toLowerCase()))
    );

    let maxSim = -Infinity;

    for (const cVec of clubTagEmbeddings) {
      for (const uVec of userTagEmbeddings) {
        const sim = cosineSimilarity(cVec, uVec);
        if (sim > maxSim) maxSim = sim;
      }
    }

    return maxSim;
  }

  // Compute similarity scores for all clubs
  const clubScores = await Promise.all(
    clubs.map(async (club) => {
      const maxSim = await maxSimilarityToUserTags(club.tags ?? []);
      return { club, score: maxSim };
    })
  );

  // Sort by descending similarity
  clubScores.sort((a, b) => b.score - a.score);

  return clubScores.map(cs => cs.club);
}

const clubsAfterSemantic = ref<any[]>([]);

async function refreshClubs() {
  console.log('[ClubList.vue] refreshClubs called');
  let clubs = !props.category
    ? clubStore.clubs
    : clubStore.clubs.filter(c => c.category.toUpperCase() === props.category?.toUpperCase());

  // Phase 1: default sorting
  clubsAfterSemantic.value = clubs;
  console.log('Initial clubs loaded:', clubs.length);

  const q = (props.search || '').trim();
  
  // 没有搜索词时，根据排序类型决定排序方式
  if (!q) {
    if (props.sort === 'members') {
      // 按人数排序（人数多的在前）
      const sortedByMembers = clubs.slice().sort((a, b) => {
        const membersA = a.memberCount || 0;
        const membersB = b.memberCount || 0;
        return membersB - membersA;
      });
      clubsAfterSemantic.value = sortedByMembers;
      return;
    }
    
    // 如果是推荐排序且用户已登录，执行 ML 排序
    if (props.sort === 'recommended' && userStore.isLoggedIn && userStore.userProfile?.tags?.length) {
      makeInterestTagClubsFirstSemantic(clubs).then((mlSortedClubs) => {
        clubsAfterSemantic.value = mlSortedClubs;
        console.log('Clubs sorted by semantic similarity:', mlSortedClubs.length);
      });
    }
    return;
  }
  
  // 如果有搜索词但用户未登录或没有标签，直接返回（搜索在 computed 中处理）
}

onMounted(async () => {
  await clubStore.fetchClubs();
  await refreshClubs();
});

watch(() => clubStore.clubs, refreshClubs);
watch(() => props.category, refreshClubs);
watch(() => props.search, refreshClubs);
watch(() => props.sort, refreshClubs);

// Fuzzy search with improved configuration
const filteredClubs = computed(() => {
  if (!props.search || props.search.trim() === '') {
    return clubsAfterSemantic.value;
  }

  const fuse = new Fuse(clubsAfterSemantic.value, {
    keys: [
      { name: 'name', weight: 2 },        // 名称权重最高
      { name: 'tags', weight: 1.5 },      // 标签次之
      { name: 'description', weight: 1 }, // 描述权重正常
      { name: 'category', weight: 0.8 },  // 分类权重较低
    ],
    threshold: 0.3,              // 从 0.4 降低到 0.3（更严格）
    distance: 80,                // 从 100 降低到 80（字符距离更近）
    ignoreLocation: true,        // 不考虑匹配位置
    minMatchCharLength: 2,       // 至少匹配2个字符
    useExtendedSearch: false,    // 不使用扩展搜索
    includeScore: true,          // 包含匹配分数
    shouldSort: true,            // 按相关度排序（分数越低越相关）
  });

  const results = fuse.search(props.search);
  
  // 打印前5个结果的分数，便于调试
  console.log('[ClubList] Search results:', results.length, 'for query:', props.search);
  results.slice(0, 5).forEach((result, index) => {
    console.log(`  ${index + 1}. "${result.item.name}" - score: ${result.score?.toFixed(3)}`);
  });
  
  // 搜索结果根据排序类型进行排序
  let sortedResults = results.map((result) => result.item);
  if (props.sort === 'members') {
    // 按人数排序
    sortedResults = sortedResults.slice().sort((a, b) => {
      const membersA = a.memberCount || 0;
      const membersB = b.memberCount || 0;
      return membersB - membersA;
    });
  }
  // 如果是 'recommended' 则保持 Fuse.js 的相关度排序
  
  return sortedResults;
});
</script>

<style scoped>
.event-list {
  padding: 0;
  margin: 0;
}

.loading {
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
