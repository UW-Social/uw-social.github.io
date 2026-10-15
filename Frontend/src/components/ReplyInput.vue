<template>
  <div v-if="isLoggedIn" :class="['reply-input', { compact }]">
    <textarea
      v-model="draft"
      :rows="rows"
      class="reply-textarea"
      :placeholder="placeholder"
      :disabled="loading"
      @keydown.enter.exact="handleEnter"
    ></textarea>
    <button class="reply-submit" type="button" :disabled="!canSubmit" @click="handleSubmit">
      {{ submitLabel }}
    </button>
  </div>

  <div v-else :class="['reply-login-prompt', { compact }]">
    <h3>{{ loginHeading }}</h3>
    <p>{{ loginText }}</p>
    <button class="reply-login-button" type="button" @click="$emit('login')">
      {{ loginButtonLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  isLoggedIn: boolean;
  loading?: boolean;
  rows?: number;
  placeholder?: string;
  submitLabel?: string;
  compact?: boolean;
  loginHeading?: string;
  loginText?: string;
  loginButtonLabel?: string;
  submitOnEnter?: boolean;
}>(), {
  loading: false,
  rows: 3,
  placeholder: 'Share your thoughts...',
  submitLabel: 'Post',
  compact: false,
  loginHeading: 'Join the discussion',
  loginText: 'Log in to share your thoughts about this event.',
  loginButtonLabel: 'Log in to post',
  submitOnEnter: false,
});

const emit = defineEmits<{
  submit: [text: string];
  login: [];
}>();

const draft = ref('');
const canSubmit = computed(() => !props.loading && draft.value.trim().length > 0);

const handleSubmit = () => {
  const text = draft.value.trim();
  if (!text) return;
  emit('submit', text);
  draft.value = '';
};

const handleEnter = (event: KeyboardEvent) => {
  if (!props.submitOnEnter) return;
  event.preventDefault();
  handleSubmit();
};

watch(() => props.isLoggedIn, (isLoggedIn) => {
  if (!isLoggedIn) {
    draft.value = '';
  }
});
</script>

<style scoped>
.reply-input {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.reply-input.compact {
  gap: 10px;
}

.reply-textarea {
  flex: 1;
  resize: vertical;
  min-height: 96px;
  border: 1px solid rgba(99, 102, 241, 0.16);
  border-radius: 14px;
  padding: 12px 14px;
  font-family: inherit;
  font-size: var(--reply-textarea-font-size, inherit);
  line-height: var(--reply-textarea-line-height, normal);
  color: #20263a;
  background: rgba(255, 255, 255, 0.92);
}

.reply-input.compact .reply-textarea {
  min-height: 74px;
}

.reply-submit,
.reply-login-button {
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #5b61f6 0%, #7c73ff 100%);
  color: #fff;
  padding: 11px 14px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.reply-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reply-login-prompt {
  padding: 16px;
  border-radius: 16px;
  background: rgba(247, 248, 255, 0.92);
  border: 1px solid rgba(99, 102, 241, 0.12);
}

.reply-login-prompt.compact {
  padding: 14px;
}

.reply-login-prompt h3 {
  margin: 0 0 6px;
  color: #20263a;
  font-size: 1rem;
}

.reply-login-prompt p {
  margin: 0 0 12px;
  color: #5f6781;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .reply-input {
    flex-direction: column;
  }

  .reply-submit,
  .reply-login-button {
    width: 100%;
  }
}
</style>
