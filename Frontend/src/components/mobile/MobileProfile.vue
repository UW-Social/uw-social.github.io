<template>
  <div class="mobile-profile">
    <!-- 背景图 -->
    <div class="background-container">
      <img src="/svg/background6.svg" alt="Background" class="background-svg" />
    </div>

    <!-- 用户信息 -->
    <div class="profile-header">
      <img :src="userProfile.photoURL || '/images/default-avatar.jpg'" alt="User Avatar" class="user-avatar" />
      <h2 class="user-name">{{ userProfile.displayName || 'Guest' }}</h2>
      <p class="user-email">{{ userProfile.email || 'No email available' }}</p>
      <div class="user-tags">
        <span v-for="tag in userProfile.tags || []" :key="tag" class="tag">#{{ tag }}</span>
      </div>
      <router-link to="/profile/edit" class="edit-profile-link">Edit Profile</router-link>
    </div>

    <!-- Major -->
    <div class="info-card">
      <div class="info-title">Your major</div>
      <div class="info-content">{{ userProfile.major || 'No major specified' }}</div>
    </div>

    <!-- Forum Notes -->
    <div class="info-card">
      <div class="info-title">Your Forum Notes</div>
      <div class="info-content">{{ forumNotes.length }}</div>
    </div>

    <section v-if="forumNotes.length > 0" class="forum-notes-list">
      <article
        v-for="note in forumNotes"
        :key="note.id"
        class="forum-note-card"
        @click="openForumNote(note)"
      >
        <div>
          <p class="forum-note-label">Forum note</p>
          <h3>{{ note.eventTitle }}</h3>
        </div>
        <p class="forum-note-body">{{ note.text }}</p>
        <div class="forum-note-meta">
          <span>{{ note.eventSchedule }}</span>
          <span v-if="note.eventLocation">{{ note.eventLocation }}</span>
        </div>
      </article>
    </section>
    <p v-else class="forum-notes-empty">No forum notes yet.</p>

    <!-- User Events -->
    <div class="info-card">
      <router-link to="/profile" class="info-title">Your Events</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import { useUserStore } from '../../stores/user';
import { formatEventSchedule, type Event as FullEvent } from '../../types/event';
import type { UserProfile } from '../../types/user';
import 'element-plus/es/components/collapse/style/css';
import 'element-plus/es/components/collapse-item/style/css';

interface ForumNoteCard {
  id: string;
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  eventSchedule: string;
  text: string;
  createdAt: unknown;
}

const userStore = useUserStore();
const router = useRouter();
const db = getFirestore();
const userProfile = ref<Partial<UserProfile>>({});
const forumNotes = ref<ForumNoteCard[]>([]);

function getTimestampMs(value: unknown) {
  if (!value) return 0;

  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }

  const parsed = new Date(value as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function fetchForumNotes(userId: string) {
  const eventsSnapshot = await getDocs(collection(db, 'events'));
  const noteGroups = await Promise.all(
    eventsSnapshot.docs.map(async (eventDoc) => {
      const eventId = eventDoc.id;
      const eventData = eventDoc.data() as Record<string, any>;
      const eventForSchedule = { ...eventData, id: eventId } as FullEvent;
      const postsSnapshot = await getDocs(
        query(collection(db, 'events', eventId, 'forumPosts'), where('userId', '==', userId)),
      );

      return postsSnapshot.docs.map((postDoc) => {
        const post = postDoc.data() as {
          content?: string;
          body?: string;
          text?: string;
          createdAt?: unknown;
        };
        const text = post.content || post.body || post.text || '';

        return {
          id: postDoc.id,
          eventId,
          eventTitle: eventData.title || 'Deleted Event',
          eventLocation: eventData.location || '',
          eventSchedule: formatEventSchedule(eventForSchedule),
          text: text.trim() || '(Empty note)',
          createdAt: post.createdAt,
        } satisfies ForumNoteCard;
      });
    }),
  );

  forumNotes.value = noteGroups
    .flat()
    .sort((left, right) => getTimestampMs(right.createdAt) - getTimestampMs(left.createdAt));
}

function openForumNote(note: ForumNoteCard) {
  router.push(`/forum/posts/${note.eventId}/${note.id}`);
}

// 从 Firebase 获取用户信息
onMounted(async () => {
  try {
    const user = await userStore.fetchUserProfile();
    userProfile.value = user || {};
    if (user?.uid) {
      await fetchForumNotes(user.uid);
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
});
</script>

<style scoped>
.mobile-profile {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
}

.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.background-svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
}

.user-name {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

.user-email {
  font-size: 1rem;
  color: #555;
  margin-bottom: 1rem;
}

.user-tags {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background-color: #f0f0f0;
  border-radius: 12px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #555;
}

.edit-profile-link {
  color: #6c63ff;
  text-decoration: underline;
  font-size: 0.9rem;
}

.info-card {
  display: flex; /* 使用 flex 布局 */
  justify-content: space-between; /* 两侧内容分布 */
  align-items: center; /* 垂直居中 */
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  border-color: black;
  color: black;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
width: 100%;
max-width: 100%; /* 确保卡片不超出屏幕宽度 */
  box-sizing: border-box;
}

.info-title {
  color: black;
  font-size: 1.2rem;
  margin: 0;
}

.info-content {
  font-size: 1rem;
  color: black;
  text-align: right; /* 内容靠右对齐 */
}
</style>
