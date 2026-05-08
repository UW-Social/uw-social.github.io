<template>
  <div class="card event-card" @click="emit('open-card', event)">
    <div class="event-card-image-wrap">
      <img :src="event.imageUrl || '/images/wavingdog.jpg'" alt="Event Image" />
      <button
        type="button"
        class="save-icon-button"
        :class="{ saved: isSavedEvent }"
        :disabled="isSavingEvent"
        @click.stop="toggleSavedEvent"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    </div>
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
            <span class="meta-value">{{ formatEventCardSchedule(event) }}</span>
          </p>
          <p class="meta-item">
            <span class="meta-label">Location:</span>
            <span class="meta-value">{{ event.location }}</span>
          </p>
          <p class="meta-item" v-if="event.tags && event.tags.some(tag => tag.toLowerCase().includes('year') || tag.toLowerCase().includes('student'))">
            <span class="meta-label">Audience:</span>
            <span class="meta-value">{{ getAudienceFromTags(event.tags) }}</span>
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
import { computed, ref, toRefs } from 'vue';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';
import { useRoute, useRouter } from 'vue-router';
// import { useEventDialogStore } from '../stores/eventDialog';
import { formatEventCardSchedule, type Event } from '../types/event';
import '../assets/eventcard.css';
import { ElButton } from 'element-plus';
import 'element-plus/es/components/button/style/css';

const props = defineProps<{
  event: Event;
  currentUserId?: string | number;
}>();

const emit = defineEmits<{
  (event: 'open-card', payload: Event): void;
}>();

const { event } = toRefs(props);
const eventStore = useEventStore();
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const isSavingEvent = ref(false);

const isSavedEvent = computed(() => {
  return (userStore.userProfile?.savedEventIds ?? []).includes(props.event.id);
});

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

const toggleSavedEvent = async () => {
  if (!userStore.isLoggedIn) {
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
        prompt: 'Please log in to save events.',
      },
    });
    return;
  }

  if (!userStore.userProfile || isSavingEvent.value) {
    return;
  }

  isSavingEvent.value = true;

  try {
    const currentSaved = userStore.userProfile.savedEventIds ?? [];
    const nextSaved = isSavedEvent.value
      ? currentSaved.filter((id) => id !== props.event.id)
      : [...new Set([...currentSaved, props.event.id])];

    await userStore.updateUserProfile({ savedEventIds: nextSaved });
  } catch (error) {
    console.error('Failed to update saved events from card:', error);
  } finally {
    isSavingEvent.value = false;
  }
};
</script>

<style scoped>
/* eventcard.css handles all styling including delete button */
</style>
