<template>
  <div class="card event-card" @click="$emit('open-card', event)">
    <img :src="event.imageUrl || '/images/wavingdog.jpg'" alt="Event Image" />
    <div class="event-card-content">
      <!-- 左侧内容 -->
      <div class="event-card-left">
        <div>
          <h3 class="event-title">{{ event.title }}</h3>
          <p class="description">{{ event.description }}</p>
        </div>

        <!-- Tags at the bottom -->
        <div v-if="event.tags && event.tags.length > 0" class="event-tags">
          <span v-for="tag in event.tags.slice(0, 5)" :key="tag" class="tag-badge">
            {{ tag }}
          </span>
        </div>
      </div>
      <!-- 右侧内容 -->
      <div class="event-card-right">
        <div class="event-meta">
          <p class="meta-item">
            <span class="meta-label">Time:</span>
            <span class="meta-value">{{ formatEventSchedule(event) }}</span>
          </p>
          <p class="meta-item">
            <span class="meta-label">Location:</span>
            <span class="meta-value">{{ event.location }}</span>
          </p>
          <p class="meta-item" v-if="event.tags && event.tags.some(tag => tag.toLowerCase().includes('year') || tag.toLowerCase().includes('student'))">
            <span class="meta-label">Audience:</span>
            <span class="meta-value">{{ getAudienceFromTags(event.tags) }}</span>
          </p>
          <p class="meta-item">
            <span class="meta-label">Organizer:</span>
            <span class="meta-value">{{ event.organizerName }}</span>
          </p>
        </div>
        <el-button
          v-if="String(event.organizerId) === String(currentUserId)"
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
import { useEventStore } from '../stores/event';
// import { useEventDialogStore } from '../stores/eventDialog';
import { formatEventSchedule, type Event } from '../types/event';
import '../assets/eventcard.css';
import { ElButton } from 'element-plus';
import 'element-plus/es/components/button/style/css';

const props = defineProps<{
  event: Event;
  currentUserId?: string | number;
}>();

const { event } = toRefs(props);
const eventStore = useEventStore();

// Helper function to extract audience from tags
const getAudienceFromTags = (tags: string[]): string => {
  const audienceTags = tags.filter(tag =>
    tag.toLowerCase().includes('year') ||
    tag.toLowerCase().includes('student')
  );
  return audienceTags.length > 0 ? audienceTags.join(', ') : 'All students';
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
</script>

<style scoped>
/* eventcard.css handles all styling including delete button */
</style>
