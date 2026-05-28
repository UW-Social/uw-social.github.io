<template>
  <div v-if="replies.length > 0" :class="['reply-list', { 'comment-style': commentStyle }]">
    <article v-for="reply in replies" :key="reply.id" class="reply-card">
      <div v-if="commentStyle" class="reply-avatar" :style="{ fontSize: '11px' }">
        {{ getInitials(reply.authorName || reply.userEmail || 'Anonymous User') }}
      </div>
      <div class="reply-content">
        <div class="reply-header">
          <span
            class="reply-author"
            :style="commentStyle ? { fontSize: '12px' } : undefined"
          >
            {{ reply.authorName || reply.userEmail || 'Anonymous User' }}
          </span>
          <span v-if="!commentStyle" class="reply-time">{{ formatTimestamp(reply.createdAt) }}</span>
        </div>
        <p class="reply-text" :style="commentStyle ? { fontSize: '12px' } : undefined">{{ reply.content }}</p>
        <div v-if="!commentStyle" class="reply-actions">
          <button class="reply-action-button" type="button" @click="handleToggleLike(reply.id)">
            <span :class="['reply-like-dot', { active: reply.hasLiked }]"></span>
            Like
          </button>
          <span>{{ reply.likeCount }} likes</span>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { DiscussionReply } from '../types/forum';

const props = defineProps<{
  replies: DiscussionReply[];
  isLoggedIn: boolean;
  commentStyle?: boolean;
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

const getInitials = (value: string) => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || 'U').toUpperCase();
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

.reply-list.comment-style {
  gap: 8px;
  margin-top: 10px;
  margin-left: 22px;
  padding-left: 18px;
  border-left: 1px solid #f1f3f7;
}

.reply-list.comment-style .reply-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-left: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.reply-avatar {
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  background: #ffedd5;
  border-radius: 999px;
  font-size: 11px !important;
  font-weight: 500;
}

.reply-content {
  min-width: 0;
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

.reply-list.comment-style .reply-header {
  justify-content: flex-start;
  margin-bottom: 1px;
}

.reply-list.comment-style .reply-author {
  color: #111827;
  font-size: 12px !important;
  font-weight: 700;
}

.reply-list.comment-style .reply-text {
  color: #6b7280;
  font-size: 12px !important;
  line-height: 1.4;
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
