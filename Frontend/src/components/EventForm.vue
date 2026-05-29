<template>
  <div class="event-form">
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
import type { Event as EventModel } from '../types/event';
import { RecurrenceType } from '../types/event';
import '@/assets/eventform.css';

const router = useRouter();
const userStore = useUserStore();
const eventStore = useEventStore();
const isSubmitting = ref(false);
const db = getFirestore();
const storage = getStorage();
const currentStep = ref(1);
const importLink = ref('');
const isImporting = ref(false);

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

// 使用简单的ref来避免computed双向绑定的问题
const tagsInputValue = ref('');

// 解析tags的函数
const parseTagsFromInput = (value: string) => {
  return value.split(/[,，\s]+/).map(tag => tag.trim()).filter(Boolean);
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

const handleImageSelection = (event: InputEvent) => {
  const target = event.target as HTMLInputElement;
  selectedImageFile.value = target.files?.[0] || null;
};

const handleImport = async () => {
  if (!importLink.value) return;

  isImporting.value = true;

  try {
    const data = await scraper(importLink.value);

    if (!data || typeof data !== 'object') alert('Failed to import event. (could be scraper or gemini)');
    console.log(data);

    formData.value.title = data.title ?? formData.value.title;
    formData.value.description = data.description ?? formData.value.description;
    formData.value.location = data.location ?? formData.value.location;
    formData.value.category = data.category ?? formData.value.category;

    formData.value.startDate = data.startDate ?? formData.value.startDate;
    formData.value.startTime = data.startTime ?? formData.value.startTime;
    formData.value.endDate = data.endDate ?? formData.value.endDate;
    formData.value.endTime = data.endTime ?? formData.value.endTime;

    formData.value.imageUrl = data.imageUrl ?? formData.value.imageUrl;

    if (data.recurrenceType) {
      formData.value.recurrenceType = data.recurrenceType;
    }

    if (Array.isArray(data.tags)) {
      formData.value.tags = data.tags.map((t: string) => t.trim()).filter(Boolean);
      tagsInputValue.value = formData.value.tags.join(', ');
    }

    if (Array.isArray(data.daysOfWeek)) {
      formData.value.daysOfWeek = data.daysOfWeek.filter((d: number) => d >= 0 && d <= 6);
    }

    if (data.daysOfMonthInput) {
      formData.value.daysOfMonthInput = String(data.daysOfMonthInput);
    }

    if (typeof data.maxParticipants === 'number') {
      formData.value.maxParticipants = data.maxParticipants;
    }

    if (data.link) {
      formData.value.link = data.link;
    }

    currentStep.value = 1;
  } catch (err) {
    console.error(err);
    alert('Failed to import event.');
  } finally {
    isImporting.value = false;
  }
};



const scraper = async (url: string) => {
  const response = await fetch(url);
  if (!response) {
    alert('Failed to import event. (scraper braught empty html. not gemini issue)');
  }
  const htmlDocument = await response.text();
  const form = await gemini(htmlDocument);
  if (!form) {
    alert('Failed to import event. (Gemini issue)');
  }
  return form;
};

const gemini = async (document: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY to enable event import.');
  }

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
  try {
    const reviewSentence = formData.value.reviewSentence.trim();

    let schedule;
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
    } else if (recurrenceType === RecurrenceType.MONTHLY) {
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
      const daysOfMonth = formData.value.daysOfMonthInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= 31);
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

    if (!schedule) {
      alert('Invalid schedule.');
      isSubmitting.value = false;
      return;
    }

    // Calculate startTime and endtime for compatibility with existing EventList filtering
    let startTime, endtime;
    if (recurrenceType === RecurrenceType.ONE_TIME) {
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



  try {
    let imageUrl = ''; // 先初始化

    // 上传图片
    if (selectedImageFile.value) {
      const storagePath = `events/${Date.now()}_${selectedImageFile.value.name}`;
      const storageReference = storageRef(storage, storagePath);

      console.log('开始上传图片到:', storagePath);

      const snapshot = await uploadBytes(storageReference, selectedImageFile.value);
      const downloadURL = await getDownloadURL(snapshot.ref);
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

    await addDoc(collection(db, 'events'), eventData);
    alert('Successfully published!');

    await eventStore.fetchEvents();
    router.push('/events');
  } catch (error) {
    console.error('Failed to publish event:', error);
    alert('Failed to publish event.');
  } finally {
    isSubmitting.value = false;
  }
} catch (error) {
    console.error('Failed to submit event:', error);
    alert('Failed to submit event. Please try again.');
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
</style>
