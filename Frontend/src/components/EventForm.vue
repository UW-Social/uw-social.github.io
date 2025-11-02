<template>
  <div class="event-form">
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
                  <option :value="RecurrenceType.WEEKLY">Weekly</option>
                  <option :value="RecurrenceType.MONTHLY">Monthly</option>
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

              <!-- Monthly recurring event fields -->
              <div v-if="formData.recurrenceType === RecurrenceType.MONTHLY" class="schedule-fields">
                <div class="form-row">
                  <div class="form-group">
                    <label for="monthlyStartDate">Start Date</label>
                    <input id="monthlyStartDate" v-model="formData.startDate" type="date" required>
                  </div>
                  <div class="form-group">
                    <label for="monthlyEndDate">End Date (optional)</label>
                    <input id="monthlyEndDate" v-model="formData.endDate" type="date">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="monthlyStartTime">Start Time</label>
                    <input id="monthlyStartTime" v-model="formData.startTime" type="time" placeholder="Optional - leave empty if TBD">
                  </div>
                  <div class="form-group">
                    <label for="monthlyEndTime">End Time</label>
                    <input id="monthlyEndTime" v-model="formData.endTime" type="time" placeholder="Optional - leave empty if TBD">
                  </div>
                </div>
                <div class="form-group">
                  <label>Days of Month</label>
                  <input type="text" v-model="formData.daysOfMonthInput" placeholder="e.g., 1, 15, 31">
                  <small>Enter days separated by commas (1-31)</small>
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
            <button type="button" class="nav-btn next" @click="currentStep = 4">Preview →</button>
          </div>
        </div>
        
        <!-- Step 4: Preview & Submit -->
        <div v-show="currentStep === 4" class="step-content">
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
            </div>
          </div>
          
          <div class="step-navigation">
            <button type="button" class="nav-btn prev" @click="currentStep = 3">← Edit Details</button>
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
import type { Event } from '../types/event';
import { RecurrenceType } from '../types/event';
import '@/assets/eventform.css';

const router = useRouter();
const userStore = useUserStore();
const eventStore = useEventStore();
const isSubmitting = ref(false);
const db = getFirestore();
const storage = getStorage();
const currentStep = ref(1);

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
});

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 使用简单的ref来避免computed双向绑定的问题
const tagsInputValue = ref('');

// 解析tags的函数
const parseTagsFromInput = (value: string) => {
  return value.split(/[,，\s]+/).map(tag => tag.trim()).filter(Boolean);
};

// 处理input事件
const handleTagsInput = (event: Event) => {
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

const handleSubmit = async () => {
  if (!userStore.userProfile) {
    alert('Please log in to publish an event!');
    return;
  }

  isSubmitting.value = true;
  try {
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
        start = new Date(formData.value.startDate);
        start.setHours(0, 0, 0, 0);
      }
      
      if (endTime) {
        end = new Date(`${formData.value.endDate}T${endTime}`);
      } else {
        // Create date without time component - will be handled in display  
        end = new Date(formData.value.endDate);
        end.setHours(23, 59, 59, 999);
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
      if (formData.value.endDate && new Date(formData.value.endDate) < new Date(formData.value.startDate)) {
        alert('End date must be after start date.');
        isSubmitting.value = false;
        return;
      }
      schedule = {
        type: RecurrenceType.DAILY as const,
        startDate: new Date(formData.value.startDate),
        endDate: formData.value.endDate ? new Date(formData.value.endDate) : undefined,
        startTimeOfDay: formData.value.startTime || undefined,
        endTimeOfDay: formData.value.endTime || undefined,
      };
    } else if (recurrenceType === RecurrenceType.WEEKLY) {
      if (!formData.value.startDate || formData.value.daysOfWeek.length === 0) {
        alert('Please fill in the start date and select at least one day of week.');
        isSubmitting.value = false;
        return;
      }
      if (formData.value.endDate && new Date(formData.value.endDate) < new Date(formData.value.startDate)) {
        alert('End date must be after start date.');
        isSubmitting.value = false;
        return;
      }
      schedule = {
        type: RecurrenceType.WEEKLY as const,
        startDate: new Date(formData.value.startDate),
        endDate: formData.value.endDate ? new Date(formData.value.endDate) : undefined,
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
      if (formData.value.endDate && new Date(formData.value.endDate) < new Date(formData.value.startDate)) {
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
        startDate: new Date(formData.value.startDate),
        endDate: formData.value.endDate ? new Date(formData.value.endDate) : undefined,
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
      const startDate = new Date(formData.value.startDate);
      const endDate = formData.value.endDate ? new Date(formData.value.endDate) : new Date('2099-12-31');
      
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

      const eventData: Omit<Event, 'id'> = {
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