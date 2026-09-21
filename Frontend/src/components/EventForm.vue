<template>
  <div class="event-form">
    <div class="quick-import paste-import">
      <label for="eventPasteText">Paste an event brief for quick input</label>
      <textarea
        id="eventPasteText"
        v-model="pastedEventText"
        rows="8"
        placeholder="Paste the event text here"
      ></textarea>
      <div class="quick-import-actions">
        <p v-if="pasteImportStatus" class="import-status">{{ pasteImportStatus }}</p>
        <button type="button" @click="handlePasteImport" :disabled="isParsingPaste || !pastedEventText.trim()">
          {{ isParsingPaste ? 'Parsing...' : 'Parse & Fill Form' }}
        </button>
      </div>
    </div>

    <div class="quick-import">
        <label for="link">Enter the link to the event for quick input (Optinal)</label>
        <input
          id="link"
          v-model="importLink"
          type="url"
          placeholder="Paste event link"
          @keydown.enter.prevent="handleImport"
        />
        <button type="button" @click="handleImport" :disabled="isImporting">
          {{ isImporting ? 'Importing...' : 'Import' }}
        </button>
      </div>
    
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
        
        <!-- Step 1: Basic Information -->
        <div v-show="currentStep === 1" class="step-content">
          <div class="bento-grid">
            <div class="bento-card large">
              <div class="card-header">
                <h3>Basic Information</h3>
                <p>Let's start with the essentials</p>
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
                  type="text"
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
                  <option value="Career">Career</option>
                  <option value="HFS">HFS</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="step-navigation">
            <button type="button" class="nav-btn next" @click="currentStep = 2">Next Step →</button>
          </div>
        </div>
        
        <!-- Step 2: Schedule -->
        <div v-show="currentStep === 2" class="step-content">
          <div class="bento-grid">
            <div class="bento-card large">
              <div class="card-header">
                <h3>Schedule Details</h3>
                <p>When should people join?</p>
              </div>
              <div class="form-group">
                <label for="recurrenceType">Recurrence Type</label>
                <select id="recurrenceType" v-model="formData.recurrenceType" required>
                  <option :value="RecurrenceType.ONE_TIME">One-time</option>
                  <option :value="RecurrenceType.DAILY">Daily</option>
                  <option :value="RecurrenceType.WEEKLY">Weekly recurring</option>
                </select>
              </div>

              <!-- One-time event fields -->
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

              <!-- Daily recurring event fields -->
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

              <!-- Weekly recurring event fields -->
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

            </div>
          </div>
          
          <div class="step-navigation">
            <button type="button" class="nav-btn prev" @click="currentStep = 1">← Previous</button>
            <button type="button" class="nav-btn next" @click="currentStep = 3">Next Step →</button>
          </div>
        </div>
        
        <!-- Step 3: Additional Details -->
        <div v-show="currentStep === 3" class="step-content">
          <div class="bento-grid">
            <div class="bento-card medium">
              <div class="card-header">
                <h3>👥 Participation</h3>
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
                <!-- 实时显示已输入的tags -->
                <div v-if="formData.tags.length" class="tags-preview">
                  <span v-for="tag in formData.tags" :key="tag" class="tag-preview-chip">#{{ tag }}</span>
                </div>
              </div>
            </div>
            
            <div class="bento-card large">
              <div class="card-header">
                <h3>📸 Media & Links</h3>
              </div>
              <div class="form-group">
                <label for="image">Event Image (Optional)</label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  @change="handleImageSelection"
                  class="file-input"
                >
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

        <!-- Step 4: Review -->
        <div v-show="currentStep === 4" class="step-content">
          <div class="bento-grid">
            <div class="bento-card large">
              <div class="card-header">
                <h3>Review</h3>
                <p>Set the rating shown on this event detail page</p>
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
        
        <!-- Step 5: Preview & Submit -->
        <div v-show="currentStep === 5" class="step-content">
          <div class="preview-card">
            <div class="card-header">
              <h3>🎉 Ready to Publish?</h3>
              <p>Review your event details</p>
            </div>
            
            <div class="preview-content">
              <div class="preview-item">
                <strong>{{ formData.title }}</strong>
              </div>
              <div class="preview-item description-preview" v-html="formatPreviewDescription()">
              </div>
              <div class="preview-details">
                <span class="detail-chip">{{ formData.location }}</span>
                <span class="detail-chip">{{ formData.category }}</span>
                <span v-if="formData.maxParticipants" class="detail-chip">👥 Max {{ formData.maxParticipants }}</span>
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
              {{ isSubmitting ? 'Publishing...' : '🚀 Publish Event!' }}
            </button>
            <p v-if="submitStatus" class="submit-status">{{ submitStatus }}</p>
          </div>
        </div>
        
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useEventStore } from '../stores/event';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Event as EventModel, EventSchedule } from '../types/event';
import { RecurrenceType } from '../types/event';
import '@/assets/eventform.css';

const router = useRouter();
const userStore = useUserStore();
const eventStore = useEventStore();
const isSubmitting = ref(false);
const submitStatus = ref('');
const db = getFirestore();
const storage = getStorage();
const currentStep = ref(1);
const importLink = ref('');
const isImporting = ref(false);
const pastedEventText = ref('');
const isParsingPaste = ref(false);
const pasteImportStatus = ref('');

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.1-flash-lite';

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
  reviewStars: null as number | null,
  reviewScore: null as number | null,
  reviewSentence: '',
});

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ImportedEventData = Partial<{
  title: string;
  description: string;
  location: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  imageUrl: string;
  link: string;
  recurrenceType: RecurrenceType;
  tags: string[];
  daysOfWeek: number[];
  daysOfMonthInput: string;
  maxParticipants: number | null;
  reviewStars: number | null;
  reviewScore: number | null;
  reviewSentence: string;
}>;

const clampNumber = (value: number, min: number, max: number) => (
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
);

const formatErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error && 'code' in error) {
    const firebaseError = error as { code?: unknown; message?: unknown };
    const code = firebaseError.code ? String(firebaseError.code) : 'unknown';
    const message = firebaseError.message ? String(firebaseError.message) : 'No details';
    return `${code}: ${message}`;
  }

  if (error instanceof Error) return error.message;
  return String(error);
};

const runPublishStep = async <T,>(label: string, task: () => Promise<T>) => {
  submitStatus.value = label;
  console.log(`[EventForm] ${label}`);
  try {
    const result = await task();
    console.log(`[EventForm] ${label} done`);
    return result;
  } catch (error) {
    console.error(`[EventForm] ${label} failed`, error);
    throw new Error(`${label} failed: ${formatErrorMessage(error)}`);
  }
};

const logFormSnapshot = (source: string) => {
  console.log(`[EventForm] ${source}`, {
    title: formData.value.title,
    startDate: formData.value.startDate,
    startTime: formData.value.startTime,
    endDate: formData.value.endDate,
    endTime: formData.value.endTime,
    location: formData.value.location,
    category: formData.value.category,
    tags: formData.value.tags,
    link: formData.value.link,
    reviewStars: formData.value.reviewStars,
    reviewScore: formData.value.reviewScore,
  });
};

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

// 使用简单的ref来避免computed双向绑定的问题
const tagsInputValue = ref('');

// 解析tags的函数
const parseTagsFromInput = (value: string) => {
  return value.split(/[,，\s]+/).map(tag => tag.trim()).filter(Boolean);
};

const normalizeTagList = (tags: unknown): string[] => {
  if (typeof tags === 'string') {
    return [...new Set(
      tags
        .replace(/`/g, '')
        .split(/[,，\s]+/)
        .map(tag => tag.trim())
        .filter(Boolean)
    )];
  }

  if (!Array.isArray(tags)) return [];

  return [...new Set(
    tags
      .map(tag => String(tag).replace(/^#+/, '').trim())
      .filter(Boolean)
  )];
};

const toText = (value: unknown, fallback = '') => (
  typeof value === 'string' ? value : value == null ? fallback : String(value)
);

const toNullableNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;

  const parsed = Number(value.match(/\d+(?:\.\d+)?/)?.[0] ?? NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTime = (value: unknown) => {
  const trimmed = toText(value).trim().toUpperCase().replace(/\s+/g, ' ');
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return '';

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? '0');
  const meridiem = match[3];

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return '';

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const normalizeDateInput = (value: unknown) => {
  const trimmed = toText(value).trim();
  if (!trimmed) return '';

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  const chineseMatch = trimmed.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (chineseMatch) {
    return `${chineseMatch[1]}-${chineseMatch[2].padStart(2, '0')}-${chineseMatch[3].padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeCategoryValue = (value: unknown, tags: string[]) => {
  const normalized = toText(value).trim().toLowerCase();
  if (normalized === 'academic') return 'Academic';
  if (normalized === 'club') return 'Club';
  if (normalized === 'sports') return 'Sports';
  if (normalized === 'games') return 'Games';
  if (normalized === 'culture') return 'Culture';
  if (normalized === 'interest') return 'Interest';
  if (normalized === 'career') return 'Career';
  if (normalized === 'hfs') return 'HFS';
  return inferCategory(tags);
};

const normalizeRecurrenceType = (value: unknown) => {
  const normalized = toText(value).trim().toUpperCase();
  if (normalized === RecurrenceType.DAILY) return RecurrenceType.DAILY;
  if (normalized === RecurrenceType.WEEKLY) return RecurrenceType.WEEKLY;
  if (normalized === RecurrenceType.MONTHLY) return RecurrenceType.MONTHLY;
  return RecurrenceType.ONE_TIME;
};

const inferCategory = (tags: string[], fallback = '') => {
  if (fallback) return fallback;

  const joined = tags.join(' ').toLowerCase();
  if (joined.includes('career') || joined.includes('internship') || joined.includes('networking') || joined.includes('job')) {
    return 'Career';
  }
  if (joined.includes('academic') || joined.includes('engineering') || joined.includes('student')) {
    return 'Academic';
  }

  return 'Interest';
};

const applyImportedEventData = (data: ImportedEventData) => {
  if (!data || typeof data !== 'object') return;
  const tags = normalizeTagList(data.tags);
  const startDate = normalizeDateInput(data.startDate ?? formData.value.startDate);
  const endDate = normalizeDateInput(data.endDate ?? formData.value.endDate) || startDate;

  formData.value.title = toText(data.title, formData.value.title);
  formData.value.description = toText(data.description, formData.value.description);
  formData.value.location = toText(data.location, formData.value.location);
  formData.value.category = normalizeCategoryValue(data.category ?? formData.value.category, tags);

  formData.value.startDate = startDate;
  formData.value.startTime = normalizeTime(data.startTime ?? formData.value.startTime);
  formData.value.endDate = endDate;
  formData.value.endTime = normalizeTime(data.endTime ?? formData.value.endTime);
  formData.value.imageUrl = toText(data.imageUrl, formData.value.imageUrl);

  formData.value.recurrenceType = normalizeRecurrenceType(data.recurrenceType ?? formData.value.recurrenceType);

  if (tags.length) {
    formData.value.tags = tags;
    tagsInputValue.value = tags.join(', ');
  }

  if (Array.isArray(data.daysOfWeek)) {
    formData.value.daysOfWeek = data.daysOfWeek.filter((d: number) => d >= 0 && d <= 6);
  }

  if (data.daysOfMonthInput != null) {
    formData.value.daysOfMonthInput = toText(data.daysOfMonthInput);
  }

  const maxParticipants = toNullableNumber(data.maxParticipants);
  if (maxParticipants !== null) {
    formData.value.maxParticipants = maxParticipants;
  }

  if (data.link) {
    formData.value.link = toText(data.link);
  }

  const reviewStars = toNullableNumber(data.reviewStars);
  if (reviewStars !== null) {
    formData.value.reviewStars = reviewStars;
  }

  const reviewScore = toNullableNumber(data.reviewScore);
  if (reviewScore !== null) {
    formData.value.reviewScore = reviewScore;
  }

  if (data.reviewSentence != null) {
    formData.value.reviewSentence = toText(data.reviewSentence);
  }
};

const createLocalDateFromInput = (
  value: string,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0
) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
};

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

const willShowInEventList = (end: Date) => (
  isValidDate(end) && end.getTime() >= Date.now()
);

// 处理input事件
const handleTagsInput = (event: globalThis.Event) => {
  const target = event.target as HTMLInputElement;
  tagsInputValue.value = target.value;
  
  // 实时更新tags数组
  formData.value.tags = parseTagsFromInput(target.value);
};

const descriptionPlaceholder = computed(() =>
  formData.value.title
    ? `Come and enjoy ${formData.value.title}!`
    : 'Describe your event here...'
);

// Format description for preview - simple line break to <br> conversion
const formatPreviewDescription = () => {
  const desc = formData.value.description.trim();
  if (!desc) {
    return `Come and enjoy ${formData.value.title}!`;
  }
  
  // Simply convert all line breaks to <br> tags
  return desc.replace(/\n/g, '<br>');
};

// 处理tags输入的键盘事件
const handleTagsKeydown = (event: KeyboardEvent) => {
  // 只处理回车键，避免干扰正常输入
  if (event.key === 'Enter') {
    event.preventDefault();
    const target = event.target as HTMLInputElement;
    const currentValue = target.value;
    
    // 在当前光标位置插入逗号和空格
    const cursorPos = target.selectionStart || 0;
    const newValue = currentValue.slice(0, cursorPos) + ', ' + currentValue.slice(cursorPos);
    
    // 更新值
    tagsInputValue.value = newValue;
    formData.value.tags = parseTagsFromInput(newValue);
    
    // 设置新的光标位置
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = cursorPos + 2;
    }, 0);
  }
};

const selectedImageFile = ref<File | null>(null);

const handleImageSelection = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedImageFile.value = target.files?.[0] || null;
};

const handlePasteImport = async () => {
  const document = pastedEventText.value.trim();
  if (!document) return;

  isParsingPaste.value = true;
  pasteImportStatus.value = '';

  try {
    const data = await parsePastedEventWithGemini(document);
    applyImportedEventData(data);
    logFormSnapshot('AI paste import applied');
    pasteImportStatus.value = 'Form filled from pasted text.';
    currentStep.value = 1;
  } catch (err) {
    console.error(err);
    const fallback = parsePastedEventLocally(document);
    applyImportedEventData(fallback);
    logFormSnapshot('Local paste import applied');
    pasteImportStatus.value = 'Used local parsing because AI parsing was unavailable.';
    currentStep.value = 1;
  } finally {
    isParsingPaste.value = false;
  }
};

const handleImport = async () => {
  if (!importLink.value) return;

  isImporting.value = true;

  try {
    const data = await scraper(importLink.value);

    if (!data || typeof data !== 'object') alert('Failed to import event. (could be scraper or gemini)');
    console.log(data);

    applyImportedEventData(data);
    logFormSnapshot('Link import applied');

    currentStep.value = 1;
  } catch (err) {
    console.error(err);
    alert('Failed to import event. (check console for reason)');
  } finally {
    isImporting.value = false;
  }
};

const parsePastedEventLocally = (document: string): ImportedEventData => {
  const title = document.match(/^##\s+(.+)$/m)?.[1]?.trim() ?? '';
  const timeText = document.match(/-\s*\*\*时间[:：]\*\*\s*([^\n]+)/)?.[1]?.replace(/\u00a0/g, ' ').trim() ?? '';
  const location = document.match(/-\s*\*\*地点[:：]\*\*\s*([^\n]+)/)?.[1]?.replace(/\u00a0/g, ' ').trim() ?? '';
  const link = document.match(/-\s*\*\*链接[:：]\*\*\s*\[[^\]]+\]\(([^)]+)\)/)?.[1]?.trim() ?? '';
  const ratingText = document.match(/-\s*\*\*评分[:：]\*\*\s*([^\n]+)/)?.[1] ?? '';
  const tagLine = document.match(/-\s*\*\*Tags[:：]\*\*\s*([^\n]+)/i)?.[1] ?? '';
  const english = document.match(/\*\*English:\*\*\\?\s*\n([\s\S]*?)(?=\n\s*\*\*亮点[:：]\*\*)/)?.[1]?.trim() ?? '';
  const highlightsChinese = document.match(/\*\*亮点[:：]\*\*\s*([^\n\\]+)/)?.[1]?.trim() ?? '';

  const dateMatch = timeText.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  const timeRangeMatch = timeText.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i);
  const date = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
    : '';

  const startTime = timeRangeMatch ? normalizeTime(timeRangeMatch[1]) : '';
  const endTime = timeRangeMatch ? normalizeTime(timeRangeMatch[2]) : '';
  const tags = normalizeTagList([...tagLine.matchAll(/`([^`]+)`/g)].map(match => match[1]));
  const score = Number(ratingText.match(/(\d+(?:\.\d+)?)\s*\/\s*5/)?.[1] ?? NaN);
  const stars = ratingText.match(/⭐/g)?.length || (Number.isFinite(score) ? Math.round(score) : null);
  const translatedHighlights = translateKnownHighlights(highlightsChinese);
  const description = [
    english,
    translatedHighlights ? `Highlights: ${translatedHighlights}` : '',
  ].filter(Boolean).join('\n\n');

  return {
    title,
    description,
    location,
    category: inferCategory(tags),
    startDate: date,
    startTime,
    endDate: date,
    endTime,
    link,
    recurrenceType: RecurrenceType.ONE_TIME,
    tags,
    reviewStars: stars,
    reviewScore: Number.isFinite(score) ? score : stars,
    reviewSentence: Number.isFinite(score) ? `${score}/5` : '',
  };
};

const translateKnownHighlights = (value: string) => {
  if (!value) return '';

  const parts = value
    .split(/[;；]/)
    .map(part => part.trim())
    .filter(Boolean);

  const dictionary: Record<string, string> = {
    '直接接触招聘方': 'Direct access to recruiters',
    '适合寻找 2027 实习': 'Useful for students seeking 2027 internships',
    '可以练习 elevator pitch。': 'A good chance to practice your elevator pitch',
    '可以练习 elevator pitch': 'A good chance to practice your elevator pitch',
  };

  return parts.map(part => dictionary[part] ?? part).join('; ');
};

const parsePastedEventWithGemini = async (document: string): Promise<ImportedEventData> => {
  const prompt = `
You extract UW event publishing fields from pasted Markdown or plain text.

Return ONLY valid JSON with this schema:

{
  "title": "",
  "description": "",
  "location": "",
  "category": "",
  "startDate": "",
  "startTime": "",
  "endDate": "",
  "endTime": "",
  "link": "",
  "recurrenceType": "ONE_TIME",
  "tags": [],
  "reviewStars": null,
  "reviewScore": null,
  "reviewSentence": ""
}

Rules:
- Extract the event title.
- Convert the time/date into English-compatible form fields: startDate/endDate as YYYY-MM-DD and startTime/endTime as 24-hour HH:MM.
- Extract location, link, rating, score, and tags exactly from the pasted content.
- Put the English event introduction and the English translation of highlights into "description".
- Description format: English intro, blank line, then "Highlights: ..." in English.
- Choose category from "Academic", "Interest", or "Career".
- Use "ONE_TIME" unless the source explicitly says it repeats.
- Use "" for missing strings, [] for missing arrays, null for unknown numbers.
- DO NOT hallucinate facts not present in the source.
- Output ONLY raw JSON.

PASTED EVENT:
${document}
  `.trim();

  return gemini(prompt);
};



const scraper = async (url: string) => {
  try {
    const response = await fetch(url);
    const html = await response.text();

    console.log(html);

    if (!html) {
      alert('Failed to import event (empty HTML)');
      return;
    }

    const form = await extractEventFromDocumentWithGemini(html);

    if (!form) {
      alert('Failed to import event (Gemini issue)');
      return;
    }

    return form;
  } catch (err) {
    console.error(err);
    alert('Failed to import event (network error)');
  }
};

const extractEventFromDocumentWithGemini = async (document: string) => {
  const prompt = `
You are an information extraction system.

Extract event details from the document.

If there are multiple events choose the first one.

dont touch the title.

Return ONLY valid JSON with this schema:

{
  "title": "",
  "description": "",
  "location": "",
  "category": "",
  "startDate": "",
  "startTime": "",
  "endDate": "",
  "endTime": "",
  "imageUrl": "",
  "link": "",
  "recurrenceType": "",
  "tags": [],
  "daysOfWeek": [],
  "daysOfMonthInput": "",
  "maxParticipants": null
}

Rules:
- Use "" for missing strings 
- Use [] for missing arrays
- Use null for unknown numbers
- DO NOT guess
- DO NOT hallucinate data not explicitly present
- Output ONLY raw JSON (no markdown, no explanation)

DOCUMENT:
${document}
    `.trim();

  return gemini(prompt);
};

const gemini = async (prompt: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY to enable event import.');
  }

  const response = await fetch(`${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    alert(`Gemini request failed (${response.status}): ${errorText}`);
    throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini response did not include text content.');
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Gemini returned invalid JSON:\n" + text);
  }
};



const handleSubmit = async () => {
  if (!userStore.userProfile) {
    alert('Please log in to publish an event!');
    return;
  }

  isSubmitting.value = true;
  submitStatus.value = 'Preparing event...';
  logFormSnapshot('Submitting event form');
  try {
    const reviewSentence = formData.value.reviewSentence.trim();

    let schedule: EventSchedule | null = null;
    const recurrenceType = formData.value.recurrenceType;
    if (recurrenceType === RecurrenceType.ONE_TIME) {
      // Use provided times or null if not provided
      const startTime = formData.value.startTime || null;
      const endTime = formData.value.endTime || null;
      
      let start, end;
      if (startTime) {
        start = new Date(`${formData.value.startDate}T${startTime}`);
      } else {
        // Create date without time component - will be handled in display
        start = createLocalDateFromInput(formData.value.startDate);
      }
      
      if (endTime) {
        end = new Date(`${formData.value.endDate}T${endTime}`);
      } else {
        // Create date without time component - will be handled in display  
        end = createLocalDateFromInput(formData.value.endDate, 23, 59, 59, 999);
      }

      if (!isValidDate(start) || !isValidDate(end)) {
        alert('Please check the event date and time. The pasted content may not have been parsed into a valid schedule.');
        isSubmitting.value = false;
        submitStatus.value = '';
        return;
      }
      
      // Store whether times were provided for display purposes
      (start as any)._hasTime = !!startTime;
      (end as any)._hasTime = !!endTime;
      
      if (start.toDateString() !== end.toDateString()) {
        alert('Start and end must be on the same day for a one-time event.');
        isSubmitting.value = false;
        return;
      }
      
      // Only validate time order if both times are provided
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
        submitStatus.value = '';
        return;
      }
      if (formData.value.endDate && createLocalDateFromInput(formData.value.endDate) < createLocalDateFromInput(formData.value.startDate)) {
        alert('End date must be after start date.');
        isSubmitting.value = false;
        submitStatus.value = '';
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
        submitStatus.value = '';
        return;
      }
      if (formData.value.endDate && createLocalDateFromInput(formData.value.endDate) < createLocalDateFromInput(formData.value.startDate)) {
        alert('End date must be after start date.');
        isSubmitting.value = false;
        submitStatus.value = '';
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
    } else if (recurrenceType === RecurrenceType.MONTHLY) {
      if (!formData.value.startDate || !formData.value.daysOfMonthInput) {
        alert('Please fill in the start date and enter days of month.');
        isSubmitting.value = false;
        submitStatus.value = '';
        return;
      }
      if (formData.value.endDate && createLocalDateFromInput(formData.value.endDate) < createLocalDateFromInput(formData.value.startDate)) {
        alert('End date must be after start date.');
        isSubmitting.value = false;
        submitStatus.value = '';
        return;
      }
      const daysOfMonth = formData.value.daysOfMonthInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= 31);
      if (daysOfMonth.length === 0) {
        alert('Please enter valid days of month (1-31).');
        isSubmitting.value = false;
        submitStatus.value = '';
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

    if (!schedule) {
      alert('Invalid schedule.');
      isSubmitting.value = false;
      submitStatus.value = '';
      return;
    }

    // Calculate startTime and endtime for compatibility with existing EventList filtering
    let startTime: Date;
    let endtime: Date;
    if (schedule.type === RecurrenceType.ONE_TIME) {
      startTime = schedule.startDatetime;
      endtime = schedule.endDatetime;
    } else {
      // For recurring events, use the start date with start time
      const startDate = createLocalDateFromInput(formData.value.startDate);
      const endDate = formData.value.endDate ? createLocalDateFromInput(formData.value.endDate) : createLocalDateFromInput('2099-12-31');
      
      if (formData.value.startTime) {
        const [hours, minutes] = formData.value.startTime.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes));
      } else {
        startDate.setHours(0, 0, 0, 0); // Set to beginning of day if no time
      }
      
      if (formData.value.endTime) {
        const [hours, minutes] = formData.value.endTime.split(':');
        endDate.setHours(parseInt(hours), parseInt(minutes));
      } else {
        endDate.setHours(23, 59, 59, 999); // Set to end of day if no time
      }
      
      startTime = startDate;
      endtime = endDate;
    }
    // 上传图片
    if (selectedImageFile.value) {
      const storagePath = `events/${Date.now()}_${selectedImageFile.value.name}`;
      const storageReference = storageRef(storage, storagePath);

      console.log('开始上传图片到:', storagePath);

      const snapshot = await runPublishStep('Uploading image...', () => uploadBytes(storageReference, selectedImageFile.value!));
      const downloadURL = await runPublishStep('Getting image URL...', () => getDownloadURL(snapshot.ref));
      console.log('图片上传成功，下载URL:', downloadURL);
      formData.value.imageUrl = downloadURL;
    }

    const eventData: Omit<EventModel, 'id'> = {
      title: formData.value.title,
      description: formData.value.description.trim() || `Come and enjoy ${formData.value.title}!`,
      location: formData.value.location,
      category: formData.value.category,
      tags: formData.value.tags,
      schedule: schedule,
      maxParticipants: formData.value.maxParticipants,
      organizerId: userStore.userProfile.uid,
      organizerName: userStore.userProfile.displayName || 'Anonymous',
      organizerAvatar: userStore.userProfile.photoURL || '',
      createdAt: new Date().toISOString(),
      participants: [],
      link: formData.value.link,
      imageUrl: formData.value.imageUrl,
      review: hasReviewInput.value
        ? {
            stars: normalizedReviewStars.value,
            score: normalizedReviewScore.value,
            sentence: reviewSentence,
          }
        : null,
      startTime: startTime,
      endtime: endtime,
      // Store original time info for display
      _hasStartTime: !!formData.value.startTime,
      _hasEndTime: !!formData.value.endTime,
    } as any;

    console.log('[EventForm] Event payload visibility check', {
      title: eventData.title,
      category: eventData.category,
      startTime,
      endtime,
      willShowInEventList: willShowInEventList(endtime),
      now: new Date(),
    });

    const docRef = await runPublishStep('Saving event...', () => addDoc(collection(db, 'events'), eventData));
    console.log('[EventForm] Event written to Firestore', {
      id: docRef.id,
      projectId: db.app.options.projectId,
      title: eventData.title,
      startTime,
      endtime,
    });
    alert('Successfully published!');

    await runPublishStep('Refreshing events...', () => eventStore.fetchEvents());
    router.push(`/events/${docRef.id}`);
  } catch (error) {
    console.error('Failed to publish event:', error);
    const message = formatErrorMessage(error);
    submitStatus.value = message;
    alert(`Failed to publish event: ${message}`);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
</style>
