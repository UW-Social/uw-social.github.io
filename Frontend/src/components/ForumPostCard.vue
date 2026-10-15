<template>
  <article :class="['discussion-card', { compact, highlighted, 'comment-style': commentStyle }]">
    <div class="discussion-top">
      <div
        v-if="commentStyle"
        class="discussion-avatar"
        :style="{ fontSize: '14px' }"
      >
        {{ authorInitials }}
      </div>
      <div class="discussion-main">
        <span v-if="!commentStyle" class="discussion-tag">{{ tagLabel }}</span>
        <p class="discussion-meta" :style="commentStyle ? { fontSize: '12px' } : undefined">
          <span
            class="discussion-author"
            :style="commentStyle ? { fontSize: '13px' } : undefined"
          >
            {{ post.authorName || post.userEmail || 'Anonymous User' }}
          </span>
          <span>{{ formatTimestamp(post.createdAt) }}</span>
        </p>
        <h3 v-if="!commentStyle && derivedTitle" class="discussion-title">{{ derivedTitle }}</h3>
        <p class="discussion-text" :style="commentStyle ? { fontSize: '13px' } : undefined">{{ post.content }}</p>
      </div>

      <div v-if="showEventContext" class="event-context">
        <p class="context-label">Event</p>
        <router-link
          :to="{ path: `/events/${post.eventId}`, query: { section: 'forum', postId: post.id } }"
          class="context-link"
        >
          {{ post.eventTitle }}
        </router-link>
        <p v-if="post.eventSchedule" class="context-value">{{ post.eventSchedule }}</p>
        <p v-if="post.eventLocation" class="context-value">{{ post.eventLocation }}</p>
      </div>
    </div>

    <div class="discussion-actions" :style="commentStyle ? { fontSize: '12px' } : undefined">
      <button class="discussion-action-button" type="button" @click="handleTogglePostLike">
        <span v-if="!commentStyle" :class="['like-indicator', { active: post.hasLiked }]"></span>
        Like
      </button>
      <span v-if="!commentStyle">{{ post.likeCount }} likes</span>
      <button class="discussion-action-button" type="button" @click="isReplying = !isReplying">
        Reply
      </button>
      <span v-if="!commentStyle">{{ post.replyCount }} replies</span>
      <button
        v-if="canDelete"
        class="discussion-action-button delete-action"
        type="button"
        @click="handleDeletePost"
      >
        Delete
      </button>
    </div>

    <ReplyInput
      v-if="isReplying"
      :is-logged-in="isLoggedIn"
      :loading="replySubmitting"
      :rows="2"
      :compact="true"
      :submit-on-enter="commentStyle"
      placeholder="Write a reply..."
      submit-label="Reply"
      login-heading="Join the discussion"
      login-text="Log in to reply to this discussion."
      login-button-label="Log in to reply"
      @submit="handleSubmitReply"
      @login="onLogin"
    />

    <ForumReplyList
      v-if="post.replies.length > 0"
      :replies="displayedReplies"
      :is-logged-in="isLoggedIn"
      :comment-style="commentStyle"
      :on-toggle-like="handleToggleReplyLike"
      :on-login="onLogin"
    />

    <div v-if="showEventContext" class="discussion-footer">
      <router-link
        :to="{ path: `/events/${post.eventId}`, query: { section: 'forum', postId: post.id } }"
        class="view-event-button"
      >
        View Event Discussion
      </router-link>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AggregatedDiscussionPost, DiscussionPost } from '../types/forum';
import ForumReplyList from './ForumReplyList.vue';
import ReplyInput from './ReplyInput.vue';

const props = withDefaults(defineProps<{
  post: DiscussionPost | AggregatedDiscussionPost;
  isLoggedIn: boolean;
  showEventContext?: boolean;
  replyPreviewCount?: number;
  compact?: boolean;
  highlighted?: boolean;
  tagLabel?: string;
  commentStyle?: boolean;
  onLogin: () => void;
  onTogglePostLike: (postId: string) => Promise<void> | void;
  onToggleReplyLike: (postId: string, replyId: string) => Promise<void> | void;
  onSubmitReply: (postId: string, text: string) => Promise<void> | void;
  canDelete?: boolean;
  onDeletePost?: (postId: string) => Promise<void> | void;
}>(), {
  showEventContext: false,
  replyPreviewCount: undefined,
  compact: false,
  highlighted: false,
  tagLabel: 'Discussion',
  commentStyle: false,
  canDelete: false,
});

const isReplying = ref(false);
const replySubmitting = ref(false);

const derivedTitle = computed(() => {
  if (props.post.title?.trim()) return props.post.title.trim();
  const compactText = props.post.content.replace(/\s+/g, ' ').trim();
  if (compactText.length <= 52) return compactText;
  return `${compactText.slice(0, 52).trimEnd()}...`;
});

const displayedReplies = computed(() => {
  if (!props.replyPreviewCount || props.post.replies.length <= props.replyPreviewCount) {
    return props.post.replies;
  }

  return props.post.replies.slice(-props.replyPreviewCount);
});

const authorInitials = computed(() => {
  const value = props.post.authorName || props.post.userEmail || 'Anonymous User';
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || 'U').toUpperCase();
});

const handleSubmitReply = async (text: string) => {
  replySubmitting.value = true;
  try {
    await props.onSubmitReply(props.post.id, text);
    isReplying.value = false;
  } finally {
    replySubmitting.value = false;
  }
};

const handleTogglePostLike = async () => {
  if (!props.isLoggedIn) {
    props.onLogin();
    return;
  }

  await props.onTogglePostLike(props.post.id);
};

const handleToggleReplyLike = async (replyId: string) => {
  await props.onToggleReplyLike(props.post.id, replyId);
};

const handleDeletePost = async () => {
  await props.onDeletePost?.(props.post.id);
};

const formatTimestamp = (value: DiscussionPost['createdAt']) => {
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
.discussion-card {
  border-radius: 24px;
  border: 1px solid rgba(91, 97, 246, 0.1);
  background: rgba(255, 255, 255, 0.94);
  padding: 20px;
  box-shadow: 0 12px 30px rgba(31, 39, 64, 0.06);
}

.discussion-card.compact {
  padding: 16px;
}

.discussion-card.comment-style {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.discussion-card.highlighted {
  border-color: rgba(91, 97, 246, 0.28);
  box-shadow: 0 16px 36px rgba(91, 97, 246, 0.12);
}

.discussion-top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.discussion-card.comment-style .discussion-top {
  justify-content: flex-start;
  gap: 12px;
}

.discussion-avatar {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5b61f6;
  background: #eef0ff;
  border: 1px solid #dfe2ff;
  border-radius: 999px;
  font-size: 14px !important;
  font-weight: 700;
}

.discussion-card.comment-style:nth-child(3n + 1) .discussion-avatar {
  color: #ea580c;
  background: #ffedd5;
  border-color: transparent;
}

.discussion-card.comment-style:nth-child(3n + 2) .discussion-avatar {
  color: #2563eb;
  background: #dbeafe;
  border-color: transparent;
}

.discussion-main {
  min-width: 0;
  flex: 1;
}

.discussion-tag {
  display: inline-flex;
  margin-bottom: 10px;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(91, 97, 246, 0.1);
  color: #5b61f6;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.discussion-meta {
  margin: 0 0 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: #667089;
  font-size: 0.9rem;
}

.discussion-card.comment-style .discussion-meta {
  align-items: baseline;
  gap: 7px;
  margin: 1px 0 4px;
  color: #9ca3af;
  font-size: 12px !important;
}

.discussion-card.comment-style .discussion-author {
  color: #111827;
  font-size: 13px !important;
  font-weight: 800;
}

.discussion-author {
  font-weight: 700;
  color: #24304a;
}

.discussion-title {
  margin: 0;
  font-size: 1.35rem;
  color: #20263a;
  line-height: 1.2;
}

.discussion-text {
  margin: 10px 0 0;
  color: #44506a;
  line-height: 1.7;
  white-space: pre-wrap;
}

.discussion-card.comment-style .discussion-text {
  margin-top: 0;
  color: #374151;
  font-size: 13px !important;
  line-height: 1.35;
}

.event-context {
  min-width: 220px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(248, 249, 255, 0.92);
  border: 1px solid rgba(91, 97, 246, 0.1);
}

.context-label {
  margin: 0 0 4px;
  color: #5b61f6;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.context-link {
  display: inline-block;
  color: #20263a;
  font-weight: 700;
  text-decoration: none;
  line-height: 1.4;
}

.context-value {
  margin: 8px 0 0;
  color: #63708a;
  line-height: 1.5;
}

.discussion-actions {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
  color: #667089;
  font-size: 0.92rem;
}

.discussion-card.comment-style .discussion-actions {
  margin-top: 8px;
  gap: 16px;
  color: #9ca3af;
  font-size: 12px !important;
}

.discussion-card.comment-style .discussion-action-button {
  font-weight: 800;
}

.discussion-card.comment-style :deep(.reply-input) {
  display: block;
  width: 50%;
  margin-top: 10px;
  margin-left: 50px;
}

.discussion-card.comment-style :deep(.reply-textarea) {
  width: 100%;
  min-height: 34px;
  height: 34px;
  resize: none;
  overflow: hidden;
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 13px !important;
  line-height: 18px;
}

.discussion-card.comment-style :deep(.reply-submit) {
  display: none;
}

.discussion-action-button {
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

.delete-action {
  color: #b42318;
}

.delete-action:hover {
  color: #7a271a;
}

.like-indicator {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #c3c9d9;
}

.like-indicator.active {
  background: #5b61f6;
}

.discussion-footer {
  margin-top: 16px;
}

.view-event-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 12px 18px;
  background: rgba(91, 97, 246, 0.1);
  color: #20263a;
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 900px) {
  .discussion-top {
    flex-direction: column;
  }

  .event-context {
    min-width: 0;
  }
}
</style>
