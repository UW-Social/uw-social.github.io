<template>
  <div class="card event-card" @click="$emit('open-card', club)">
    <img :src="club.imageUrl || '/images/wavingdog.jpg'" alt="Club Image" />
    <div class="event-card-content">
      <!-- 左侧内容 -->
      <div class="event-card-left">
        <div>
          <h3 class="event-title">{{ club.name }}</h3>
          <p class="description">{{ club.description }}</p>
        </div>

        <!-- Tags -->
        <div v-if="club.tags && club.tags.length > 0" class="event-tags">
          <span v-for="tag in club.tags.slice(0, 5)" :key="tag" class="tag-badge">
            {{ tag }}
          </span>
        </div>
      </div>
      <!-- 右侧内容 -->
      <div class="event-card-right">
        <div class="event-meta">
          <p class="meta-item" v-if="club.meetingSchedule">
            <span class="meta-label">Meeting:</span>
            <span class="meta-value">{{ club.meetingSchedule }}</span>
          </p>
          <p class="meta-item">
            <span class="meta-label">Location:</span>
            <span class="meta-value">{{ club.location || 'TBD' }}</span>
          </p>
          <p class="meta-item">
            <span class="meta-label">Category:</span>
            <span class="meta-value">{{ formatClubCategory(club.category) }}</span>
          </p>
          <p class="meta-item" v-if="club.memberCount">
            <span class="meta-label">Members:</span>
            <span class="meta-value">{{ club.memberCount }}</span>
          </p>
        </div>
        <el-button
          v-if="String(club.organizerId) === String(currentUserId)"
          @click.stop="handleDelete"
          type="primary"
          round
          size="small"
          class="delete-btn"
        >
          Delete
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, toRefs } from 'vue';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useClubStore } from '../stores/club';
import { formatClubCategory, type Club } from '../types/club';
import '../assets/eventcard.css';
import { ElButton } from 'element-plus';
import 'element-plus/es/components/button/style/css';

const props = defineProps<{
  club: Club;
  currentUserId?: string | number;
}>();

const { club } = toRefs(props);
const clubStore = useClubStore();

// Clicking the whole card emits to open detail; store selection not strictly needed here

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this club?')) return;
  try {
    await deleteDoc(doc(db, 'clubs', props.club.id));
    alert('Club deleted.');
    await clubStore.fetchClubs();
  } catch (e) {
    alert('Failed to delete club.');
  }
};
</script>

<style scoped>
/* Club card - tighter spacing for more info to fit */
.event-card-right .event-meta {
  gap: var(--spacing-xs);
}

.event-card-right .meta-item {
  gap: 2px;
}

.event-card-right .meta-label {
  font-size: var(--font-size-xs);
}

.event-card-right .meta-value {
  font-size: var(--font-size-xs);
  line-height: 1.4;
}
</style>
