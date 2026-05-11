<template>
  <div v-if="replies.length > 0" class="reply-list">
    <article v-for="reply in replies" :key="reply.id" class="reply-card">
      <div class="reply-header">
        <span class="reply-author">{{ reply.authorName || reply.userEmail || 'Anonymous User' }}</span>
        <span class="reply-time">{{ formatTimestamp(reply.createdAt) }}</span>
      </div>
      <p class="reply-text">{{ reply.content }}</p>
      <div class="reply-actions">
        <button class="reply-action-button" type="button" @click="handleToggleLike(reply.id)">
          <span :class="['reply-like-dot', { active: reply.hasLiked }]"></span>
          Like
        </button>
        <span>{{ reply.likeCount }} likes</span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { DiscussionReply } from '../types/forum';

const props = defineProps<{
  replies: DiscussionReply[];
  isLoggedIn: boolean;
  onToggleLike: (replyId: string) => Promise<void> | void;
  onLogin: () => void;
}>();

const handleToggleLike = async (replyId: string) => {
  if (!props.isLoggedIn) {
    props.onLogin();
    return;
  }

  await props.onToggleLike(replyId);
};

const formatTimestamp = (value: DiscussionReply['createdAt']) => {
  if (!value) return 'Just now';

  try {
    const date = typeof (value as { toDate?: () => Date }).toDate === 'function'
      ? (value as { toDate: () => Date }).toDate()
      : typeof (value as { seconds?: number }).seconds === 'number'
        ? new Date((value as { seconds: number }).seconds * 1000)
        : new Date(value as string);

    if (Number.isNaN(date.getTime())) return 'Just now';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Just now';
  }
};
</script>

<style scoped>
.reply-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.reply-card {
  margin-left: 14px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.1);
  background: rgba(248, 249, 255, 0.9);
}

.reply-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.reply-author {
  font-size: 0.92rem;
  font-weight: 700;
  color: #25304a;
}

.reply-time {
  font-size: 0.78rem;
  color: #7a84a0;
}

.reply-text {
  margin: 0;
  color: #39445d;
  line-height: 1.6;
  white-space: pre-wrap;
}

.reply-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #667089;
  font-size: 0.85rem;
}

.reply-action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.reply-like-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #c3c9d9;
}

.reply-like-dot.active {
  background: #6c63ff;
}

@media (max-width: 768px) {
  .reply-card {
    margin-left: 8px;
  }

  .reply-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
