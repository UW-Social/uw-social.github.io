<template>
  <div class="edit-event-page">
    <div class="page-header">
      <h1>Edit Event</h1>
      <p v-if="eventLoaded">Update your published event details.</p>
      <p v-else>Loading your event...</p>
    </div>

    <div v-if="eventLoaded" class="event-form">
      <div class="form-container">
        <div class="step-indicator">
          <div class="step" :class="{ active: currentStep >= 1 }" @click="currentStep = 1">
            <span class="step-number">1</span>
            <span class="step-title">Basic Info</span>
          </div>
          <div class="step" :class="{ active: currentStep >= 2 }" @click="currentStep = 2">
            <span class="step-number">2</span>
            <span class="step-title">Schedule</span>
          </div>
          <div class="step" :class="{ active: currentStep >= 3 }" @click="currentStep = 3">
            <span class="step-number">3</span>
            <span class="step-title">Details</span>
          </div>
          <div class="step" :class="{ active: currentStep >= 4 }" @click="currentStep = 4">
            <span class="step-number">4</span>
            <span class="step-title">Review</span>
          </div>
          <div class="step" :class="{ active: currentStep >= 5 }" @click="currentStep = 5">
            <span class="step-number">5</span>
            <span class="step-title">Preview</span>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="form-content">
          <div v-show="currentStep === 1" class="step-content">
            <div class="bento-grid">
              <div class="bento-card large">
                <div class="card-header">
                  <h3>Basic Information</h3>
                  <p>Refresh the essentials</p>
                </div>
                <div class="form-group">
                  <label for="title">Event Title</label>
                  <input
                    id="title"
                    v-model="formData.title"
                    type="text"
                    required
                    placeholder="Enter event title"
                  >
                </div>

                <div class="form-group">
                  <label for="description">Description (Optional)</label>
                  <textarea
                    id="description"
                    v-model="formData.description"
                    :placeholder="descriptionPlaceholder"
                    rows="5"
                  ></textarea>
                </div>
              </div>

              <div class="bento-card small">
                <div class="card-header">
                  <h3>Location</h3>
                </div>
                <div class="form-group">
                  <input
                    id="location"
                    v-model="formData.location"
                    type="text"
                    required
                    placeholder="Where will it happen?"
                  >
                </div>
              </div>

              <div class="bento-card small">
                <div class="card-header">
                  <h3>Category</h3>
                </div>
                <div class="form-group">
                  <select id="category" v-model="formData.category" required>
                    <option value="">Select category</option>
                    <option value="Academic">Academic</option>
                    <option value="Club">Club</option>
                    <option value="Sports">Sports</option>
                    <option value="Games">Games</option>
                    <option value="Culture">Culture</option>
                    <option value="Interest">Interest</option>
                    <option value="HFS">HFS</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="step-navigation">
              <button type="button" class="nav-btn next" @click="currentStep = 2">Next Step →</button>
            </div>
          </div>

          <div v-show="currentStep === 2" class="step-content">
            <div class="bento-grid">
              <div class="bento-card large">
                <div class="card-header">
                  <h3>Schedule Details</h3>
                  <p>Update timing and recurrence</p>
                </div>
                <div class="form-group">
                  <label for="recurrenceType">Recurrence Type</label>
                  <select id="recurrenceType" v-model="formData.recurrenceType" required>
                    <option :value="RecurrenceType.ONE_TIME">One-time</option>
                    <option :value="RecurrenceType.DAILY">Daily</option>
                    <option :value="RecurrenceType.WEEKLY">Weekly recurring</option>
                    <option v-if="formData.recurrenceType === RecurrenceType.MONTHLY" :value="RecurrenceType.MONTHLY">
                      Monthly (legacy)
                    </option>
                  </select>
                </div>

                <div v-if="formData.recurrenceType === RecurrenceType.ONE_TIME" class="schedule-fields">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="startDate">Start Date</label>
                      <input id="startDate" v-model="formData.startDate" type="date" required>
                    </div>
                    <div class="form-group">
                      <label for="startTime">Start Time</label>
                      <input id="startTime" v-model="formData.startTime" type="time" placeholder="Optional - leave empty if TBD">
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="endDate">End Date</label>
                      <input id="endDate" v-model="formData.endDate" type="date" required>
                    </div>
                    <div class="form-group">
                      <label for="endTime">End Time</label>
                      <input id="endTime" v-model="formData.endTime" type="time" placeholder="Optional - leave empty if TBD">
                    </div>
                  </div>
                </div>

                <div v-if="formData.recurrenceType === RecurrenceType.DAILY" class="schedule-fields">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="dailyStartDate">Start Date</label>
                      <input id="dailyStartDate" v-model="formData.startDate" type="date" required>
                    </div>
                    <div class="form-group">
                      <label for="dailyEndDate">End Date (optional)</label>
                      <input id="dailyEndDate" v-model="formData.endDate" type="date">
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="dailyStartTime">Start Time</label>
                      <input id="dailyStartTime" v-model="formData.startTime" type="time" placeholder="Optional - leave empty if TBD">
                    </div>
                    <div class="form-group">
                      <label for="dailyEndTime">End Time</label>
                      <input id="dailyEndTime" v-model="formData.endTime" type="time" placeholder="Optional - leave empty if TBD">
                    </div>
                  </div>
                </div>

                <div v-if="formData.recurrenceType === RecurrenceType.WEEKLY" class="schedule-fields">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="weeklyStartDate">Start Date</label>
                      <input id="weeklyStartDate" v-model="formData.startDate" type="date" required>
                    </div>
                    <div class="form-group">
                      <label for="weeklyEndDate">End Date (optional)</label>
                      <input id="weeklyEndDate" v-model="formData.endDate" type="date">
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="weeklyStartTime">Start Time</label>
                      <input id="weeklyStartTime" v-model="formData.startTime" type="time" placeholder="Optional - leave empty if TBD">
                    </div>
                    <div class="form-group">
                      <label for="weeklyEndTime">End Time</label>
                      <input id="weeklyEndTime" v-model="formData.endTime" type="time" placeholder="Optional - leave empty if TBD">
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Days of Week</label>
                    <div class="checkbox-group">
                      <label v-for="(day, idx) in weekDays" :key="idx" class="day-checkbox">
                        <input type="checkbox" :value="idx" v-model="formData.daysOfWeek">
                        <span>{{ day }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div v-if="formData.recurrenceType === RecurrenceType.MONTHLY" class="schedule-fields">
                  <p class="legacy-schedule-note">
                    This event uses the old monthly schedule format. Switch to Weekly recurring to choose weekdays.
                  </p>
                </div>
              </div>
            </div>

            <div class="step-navigation">
              <button type="button" class="nav-btn prev" @click="currentStep = 1">← Previous</button>
              <button type="button" class="nav-btn next" @click="currentStep = 3">Next Step →</button>
            </div>
          </div>

          <div v-show="currentStep === 3" class="step-content">
            <div class="bento-grid">
              <div class="bento-card medium">
                <div class="card-header">
                  <h3>Participation</h3>
                </div>
                <div class="form-group">
                  <label for="maxParticipants">Max Participants (Optional)</label>
                  <input
                    id="maxParticipants"
                    v-model="formData.maxParticipants"
                    type="number"
                    min="1"
                    placeholder="No limit if not set"
                  >
                </div>
              </div>

              <div class="bento-card medium">
                <div class="card-header">
                  <h3>Tags</h3>
                  <p>Separate with commas or spaces</p>
                </div>
                <div class="form-group">
                  <input
                    id="tags"
                    v-model="tagsInputValue"
                    type="text"
                    placeholder="e.g., study, social, sports"
                    @input="handleTagsInput"
                    @keydown="handleTagsKeydown"
                  >
                  <div v-if="formData.tags.length" class="tags-preview">
                    <span v-for="tag in formData.tags" :key="tag" class="tag-preview-chip">#{{ tag }}</span>
                  </div>
                </div>
              </div>

              <div class="bento-card large">
                <div class="card-header">
                  <h3>Media & Links</h3>
                </div>
                <div class="form-group">
                  <label for="image">Replace Event Image (Optional)</label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    @change="handleImageSelection"
                    class="file-input"
                  >
                  <small v-if="formData.imageUrl">Current image will be kept if you do not upload a new one.</small>
                </div>

                <div class="form-group">
                  <label for="link">Event Link (Optional)</label>
                  <input
                    id="link"
                    v-model="formData.link"
                    type="url"
                    placeholder="e.g., https://meeting.com/your-event"
                  >
                </div>
              </div>
            </div>

            <div class="step-navigation">
              <button type="button" class="nav-btn prev" @click="currentStep = 2">← Previous</button>
              <button type="button" class="nav-btn next" @click="currentStep = 4">Review →</button>
            </div>
          </div>

          <div v-show="currentStep === 4" class="step-content">
            <div class="bento-grid">
              <div class="bento-card large">
                <div class="card-header">
                  <h3>Review</h3>
                  <p>Update the rating shown on this event detail page</p>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="reviewStars">Stars</label>
                    <input
                      id="reviewStars"
                      v-model.number="formData.reviewStars"
                      type="number"
                      min="1"
                      max="5"
                      step="1"
                      placeholder="e.g., 4"
                    >
                  </div>

                  <div class="form-group">
                    <label for="reviewScore">Score</label>
                    <input
                      id="reviewScore"
                      v-model.number="formData.reviewScore"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      placeholder="e.g., 4.8"
                    >
                  </div>
                </div>

                <div class="form-group">
                  <label for="reviewSentence">Short sentence of review</label>
                  <input
                    id="reviewSentence"
                    v-model="formData.reviewSentence"
                    type="text"
                    maxlength="80"
                    placeholder="e.g., Helpful for networking"
                  >
                </div>
              </div>
            </div>

            <div class="step-navigation">
              <button type="button" class="nav-btn prev" @click="currentStep = 3">← Previous</button>
              <button type="button" class="nav-btn next" @click="currentStep = 5">Preview →</button>
            </div>
          </div>

          <div v-show="currentStep === 5" class="step-content">
            <div class="preview-card">
              <div class="card-header">
                <h3>Ready to Save?</h3>
                <p>Review your updated event details</p>
              </div>

              <div class="preview-content">
                <div class="preview-item">
                  <strong>{{ formData.title }}</strong>
                </div>
                <div class="preview-item description-preview" v-html="formatPreviewDescription()"></div>
                <div class="preview-details">
                  <span class="detail-chip">{{ formData.location }}</span>
                  <span class="detail-chip">{{ formData.category }}</span>
                  <span v-if="formData.maxParticipants" class="detail-chip">Max {{ formData.maxParticipants }}</span>
                </div>
                <div v-if="formData.tags.length" class="preview-tags">
                  <span v-for="tag in formData.tags" :key="tag" class="tag-chip">#{{ tag }}</span>
                </div>
                <div class="preview-details">
                  <template v-if="hasReviewInput">
                    <span class="detail-chip">★ {{ normalizedReviewStars }} / 5</span>
                    <span class="detail-chip">{{ normalizedReviewScore }} / 5 score</span>
                    <span v-if="formData.reviewSentence.trim()" class="detail-chip">{{ formData.reviewSentence }}</span>
                  </template>
                </div>
              </div>
            </div>

            <div class="step-navigation">
              <button type="button" class="nav-btn prev" @click="currentStep = 4">← Edit Review</button>
              <button type="submit" class="submit-btn" :disabled="isSubmitting">
                {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserStore } from '../stores/user';
import { useEventStore } from '../stores/event';
import type { Event as SocialEvent } from '../types/event';
import { RecurrenceType } from '../types/event';
import '@/assets/eventform.css';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const eventStore = useEventStore();
const db = getFirestore();
const storage = getStorage();

const isSubmitting = ref(false);
const eventLoaded = ref(false);
const currentStep = ref(1);
const selectedImageFile = ref<File | null>(null);
const originalEvent = ref<SocialEvent | null>(null);

const formData = ref({
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  location: '',
  category: '',
  maxParticipants: null as number | null,
  tags: [] as string[],
  link: '',
  recurrenceType: RecurrenceType.ONE_TIME,
  daysOfWeek: [] as number[],
  daysOfMonthInput: '',
  imageUrl: '',
  organizerId: '',
  organizerName: '',
  organizerAvatar: '',
  participants: [] as string[],
  createdAt: '',
  hasStartTime: false,
  hasEndTime: false,
  reviewStars: null as number | null,
  reviewScore: null as number | null,
  reviewSentence: '',
});

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const tagsInputValue = ref('');

const clampNumber = (value: number, min: number, max: number) => (
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
);

const normalizedReviewStars = computed(() => (
  Math.round(clampNumber(Number(formData.value.reviewStars ?? 4), 1, 5))
));

const normalizedReviewScore = computed(() => (
  Math.round(clampNumber(Number(formData.value.reviewScore ?? 4.8), 0, 5) * 10) / 10
));

const hasNumberInput = (value: number | null) => (
  value !== null && Number.isFinite(Number(value))
);

const hasReviewInput = computed(() => (
  formData.value.reviewSentence.trim().length > 0
  || hasNumberInput(formData.value.reviewStars)
  || hasNumberInput(formData.value.reviewScore)
));

const descriptionPlaceholder = computed(() =>
  formData.value.title
    ? `Come and enjoy ${formData.value.title}!`
    : 'Describe your event here...'
);

const eventId = computed(() => String(route.params.id || ''));

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value.seconds === 'number') {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateInput(value: any): string {
  const date = toDate(value);
  if (!date) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function toTimeInput(value: any, hasTime?: boolean): string {
  if (hasTime === false) return '';
  const date = toDate(value);
  if (!date) return '';
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  if (hasTime === undefined && hours === '00' && minutes === '00') return '';
  return `${hours}:${minutes}`;
}

function parseTagsFromInput(value: string) {
  return value.split(/[,，\s]+/).map(tag => tag.trim()).filter(Boolean);
}

function createLocalDateFromInput(
  value: string,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0
) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
}

function handleTagsInput(event: Event) {
  const target = event.target as HTMLInputElement;
  tagsInputValue.value = target.value;
  formData.value.tags = parseTagsFromInput(target.value);
}

function handleTagsKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return;
  event.preventDefault();

  const target = event.target as HTMLInputElement;
  const cursorPos = target.selectionStart || 0;
  const newValue = `${target.value.slice(0, cursorPos)}, ${target.value.slice(cursorPos)}`;

  tagsInputValue.value = newValue;
  formData.value.tags = parseTagsFromInput(newValue);

  setTimeout(() => {
    target.selectionStart = target.selectionEnd = cursorPos + 2;
  }, 0);
}

function handleImageSelection(event: InputEvent) {
  const target = event.target as HTMLInputElement;
  selectedImageFile.value = target.files?.[0] || null;
}

function formatPreviewDescription() {
  const desc = formData.value.description.trim();
  if (!desc) return `Come and enjoy ${formData.value.title}!`;
  return desc.replace(/\n/g, '<br>');
}

function hydrateFormFromEvent(event: SocialEvent) {
  const schedule = event.schedule;

  formData.value.title = event.title || '';
  formData.value.description = event.description || '';
  formData.value.location = event.location || '';
  formData.value.category = event.category || '';
  formData.value.maxParticipants = event.maxParticipants ?? null;
  formData.value.tags = Array.isArray(event.tags) ? [...event.tags] : [];
  formData.value.link = event.link || '';
  formData.value.imageUrl = event.imageUrl || '';
  formData.value.organizerId = event.organizerId || '';
  formData.value.organizerName = event.organizerName || '';
  formData.value.organizerAvatar = event.organizerAvatar || '';
  formData.value.participants = Array.isArray(event.participants) ? [...event.participants] : [];
  formData.value.createdAt = event.createdAt || '';
  formData.value.hasStartTime = Boolean(event._hasStartTime);
  formData.value.hasEndTime = Boolean(event._hasEndTime);
  formData.value.reviewStars = typeof event.review?.stars === 'number'
    ? Math.round(clampNumber(event.review.stars, 1, 5))
    : null;
  formData.value.reviewScore = typeof event.review?.score === 'number'
    ? Math.round(clampNumber(event.review.score, 0, 5) * 10) / 10
    : null;
  formData.value.reviewSentence = event.review?.sentence?.trim() || '';

  if (!schedule || schedule.type === RecurrenceType.ONE_TIME) {
    const startValue = schedule?.type === RecurrenceType.ONE_TIME ? schedule.startDatetime : event.startTime;
    const endValue = schedule?.type === RecurrenceType.ONE_TIME ? schedule.endDatetime : event.endtime;

    formData.value.recurrenceType = RecurrenceType.ONE_TIME;
    formData.value.startDate = toDateInput(startValue);
    formData.value.endDate = toDateInput(endValue);
    formData.value.startTime = toTimeInput(startValue, event._hasStartTime);
    formData.value.endTime = toTimeInput(endValue, event._hasEndTime);
    formData.value.daysOfWeek = [];
    formData.value.daysOfMonthInput = '';
  } else if (schedule.type === RecurrenceType.DAILY) {
    formData.value.recurrenceType = RecurrenceType.DAILY;
    formData.value.startDate = toDateInput(schedule.startDate);
    formData.value.endDate = toDateInput(schedule.endDate);
    formData.value.startTime = schedule.startTimeOfDay || '';
    formData.value.endTime = schedule.endTimeOfDay || '';
    formData.value.daysOfWeek = [];
    formData.value.daysOfMonthInput = '';
  } else if (schedule.type === RecurrenceType.WEEKLY) {
    formData.value.recurrenceType = RecurrenceType.WEEKLY;
    formData.value.startDate = toDateInput(schedule.startDate);
    formData.value.endDate = toDateInput(schedule.endDate);
    formData.value.startTime = schedule.startTimeOfDay || '';
    formData.value.endTime = schedule.endTimeOfDay || '';
    formData.value.daysOfWeek = Array.isArray(schedule.daysOfWeek) ? schedule.daysOfWeek.map(Number) : [];
    formData.value.daysOfMonthInput = '';
  } else {
    formData.value.recurrenceType = RecurrenceType.MONTHLY;
    formData.value.startDate = toDateInput(schedule.startDate);
    formData.value.endDate = toDateInput(schedule.endDate);
    formData.value.startTime = schedule.startTimeOfDay || '';
    formData.value.endTime = schedule.endTimeOfDay || '';
    formData.value.daysOfWeek = [];
    formData.value.daysOfMonthInput = Array.isArray(schedule.daysOfMonth)
      ? schedule.daysOfMonth.join(', ')
      : '';
  }

  tagsInputValue.value = formData.value.tags.join(', ');
}

async function loadEvent() {
  if (!userStore.isLoggedIn || !userStore.userProfile?.uid || !eventId.value) {
    router.push('/login');
    return;
  }

  const snapshot = await getDoc(doc(db, 'events', eventId.value));
  if (!snapshot.exists()) {
    alert('Event not found.');
    router.push('/profile');
    return;
  }

  const event = {
    id: snapshot.id,
    ...(snapshot.data() as Omit<SocialEvent, 'id'>),
  } as SocialEvent;

  if (String(event.organizerId) !== String(userStore.userProfile.uid)) {
    alert('You can only edit your own events.');
    router.push(`/events/${event.id}`);
    return;
  }

  originalEvent.value = event;
  hydrateFormFromEvent(event);
  eventLoaded.value = true;
}

async function handleSubmit() {
  if (!userStore.userProfile || !originalEvent.value) {
    alert('Please log in to edit an event.');
    return;
  }

  isSubmitting.value = true;

  try {
    const reviewSentence = formData.value.reviewSentence.trim();

    let schedule;
    const recurrenceType = formData.value.recurrenceType;

    if (recurrenceType === RecurrenceType.ONE_TIME) {
      const startTime = formData.value.startTime || null;
      const endTime = formData.value.endTime || null;

      const start = startTime
        ? new Date(`${formData.value.startDate}T${startTime}`)
        : new Date(`${formData.value.startDate}T00:00:00`);
      const end = endTime
        ? new Date(`${formData.value.endDate}T${endTime}`)
        : new Date(`${formData.value.endDate}T23:59:59`);

      if (start.toDateString() !== end.toDateString()) {
        alert('Start and end must be on the same day for a one-time event.');
        isSubmitting.value = false;
        return;
      }

      if (startTime && endTime && start >= end) {
        alert('End time must be after start time.');
        isSubmitting.value = false;
        return;
      }

      schedule = {
        type: RecurrenceType.ONE_TIME as const,
        startDatetime: start,
        endDatetime: end,
      };
    } else if (recurrenceType === RecurrenceType.DAILY) {
      if (!formData.value.startDate) {
        alert('Please fill in the start date.');
        isSubmitting.value = false;
        return;
      }
      if (formData.value.endDate && createLocalDateFromInput(formData.value.endDate) < createLocalDateFromInput(formData.value.startDate)) {
        alert('End date must be after start date.');
        isSubmitting.value = false;
        return;
      }
      schedule = {
        type: RecurrenceType.DAILY as const,
        startDate: createLocalDateFromInput(formData.value.startDate),
        endDate: formData.value.endDate ? createLocalDateFromInput(formData.value.endDate) : undefined,
        startTimeOfDay: formData.value.startTime || undefined,
        endTimeOfDay: formData.value.endTime || undefined,
      };
    } else if (recurrenceType === RecurrenceType.WEEKLY) {
      if (!formData.value.startDate || formData.value.daysOfWeek.length === 0) {
        alert('Please fill in the start date and select at least one day of week.');
        isSubmitting.value = false;
        return;
      }
      if (formData.value.endDate && createLocalDateFromInput(formData.value.endDate) < createLocalDateFromInput(formData.value.startDate)) {
        alert('End date must be after start date.');
        isSubmitting.value = false;
        return;
      }
      schedule = {
        type: RecurrenceType.WEEKLY as const,
        startDate: createLocalDateFromInput(formData.value.startDate),
        endDate: formData.value.endDate ? createLocalDateFromInput(formData.value.endDate) : undefined,
        startTimeOfDay: formData.value.startTime || undefined,
        endTimeOfDay: formData.value.endTime || undefined,
        daysOfWeek: formData.value.daysOfWeek.map(Number),
      };
    } else {
      if (!formData.value.startDate || !formData.value.daysOfMonthInput) {
        alert('Please fill in the start date and enter days of month.');
        isSubmitting.value = false;
        return;
      }
      if (formData.value.endDate && createLocalDateFromInput(formData.value.endDate) < createLocalDateFromInput(formData.value.startDate)) {
        alert('End date must be after start date.');
        isSubmitting.value = false;
        return;
      }

      const daysOfMonth = formData.value.daysOfMonthInput
        .split(',')
        .map((value) => parseInt(value.trim(), 10))
        .filter((value) => !Number.isNaN(value) && value >= 1 && value <= 31);

      if (daysOfMonth.length === 0) {
        alert('Please enter valid days of month (1-31).');
        isSubmitting.value = false;
        return;
      }

      schedule = {
        type: RecurrenceType.MONTHLY as const,
        startDate: createLocalDateFromInput(formData.value.startDate),
        endDate: formData.value.endDate ? createLocalDateFromInput(formData.value.endDate) : undefined,
        startTimeOfDay: formData.value.startTime || undefined,
        endTimeOfDay: formData.value.endTime || undefined,
        daysOfMonth,
      };
    }

    let startTime;
    let endtime;

    if (recurrenceType === RecurrenceType.ONE_TIME) {
      startTime = schedule.startDatetime;
      endtime = schedule.endDatetime;
    } else {
      const startDate = createLocalDateFromInput(formData.value.startDate);
      const endDate = formData.value.endDate ? createLocalDateFromInput(formData.value.endDate) : createLocalDateFromInput('2099-12-31');

      if (formData.value.startTime) {
        const [hours, minutes] = formData.value.startTime.split(':');
        startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      } else {
        startDate.setHours(0, 0, 0, 0);
      }

      if (formData.value.endTime) {
        const [hours, minutes] = formData.value.endTime.split(':');
        endDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      } else {
        endDate.setHours(23, 59, 59, 999);
      }

      startTime = startDate;
      endtime = endDate;
    }

    let imageUrl = formData.value.imageUrl;
    if (selectedImageFile.value) {
      const storagePath = `events/${Date.now()}_${selectedImageFile.value.name}`;
      const storageReference = storageRef(storage, storagePath);
      const snapshot = await uploadBytes(storageReference, selectedImageFile.value);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    await updateDoc(doc(db, 'events', eventId.value), {
      title: formData.value.title,
      description: formData.value.description.trim() || `Come and enjoy ${formData.value.title}!`,
      location: formData.value.location,
      category: formData.value.category,
      tags: formData.value.tags,
      schedule,
      maxParticipants: formData.value.maxParticipants,
      organizerId: formData.value.organizerId,
      organizerName: formData.value.organizerName || userStore.userProfile.displayName || 'Anonymous',
      organizerAvatar: formData.value.organizerAvatar || userStore.userProfile.photoURL || '',
      createdAt: formData.value.createdAt || originalEvent.value.createdAt,
      participants: formData.value.participants,
      link: formData.value.link,
      imageUrl,
      review: hasReviewInput.value
        ? {
            stars: normalizedReviewStars.value,
            score: normalizedReviewScore.value,
            sentence: reviewSentence,
          }
        : null,
      startTime,
      endtime,
      _hasStartTime: !!formData.value.startTime,
      _hasEndTime: !!formData.value.endTime,
    });

    await eventStore.fetchEvents();
    alert('Event updated.');
    router.push(`/events/${eventId.value}`);
  } catch (error) {
    console.error('Failed to update event:', error);
    alert('Failed to update event.');
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(async () => {
  await loadEvent();
});
</script>

<style scoped>
.edit-event-page {
  min-height: 100vh;
  background-color: var(--color-white);
  padding-top: calc(var(--navbar-height) - var(--spacing-2xl));
  padding-bottom: var(--spacing-3xl);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-xl) var(--spacing-3xl);
}

.page-header h1 {
  margin: 0;
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-gray-900);
  letter-spacing: -0.03em;
}

.page-header p {
  margin: 0.85rem 0 0;
  color: var(--color-gray-600);
  font-size: 1rem;
}

@media (max-width: 768px) {
  .edit-event-page {
    padding-top: calc(var(--navbar-height) - var(--spacing-xl));
  }

  .page-header {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .page-header h1 {
    font-size: 2.4rem;
  }
}
</style>
