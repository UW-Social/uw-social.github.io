<template>
  <div class="mobile-event-card" @click="$emit('click')">
    <!-- Left Side Container -->
    <div class="left-container">
      <!-- Event Image (top left) -->
      <div class="image-section">
        <img 
          :src="event.imageUrl || '/images/wavingdog.jpg'" 
          :alt="event.title"
          class="event-image"
          @error="handleImageError"
        />
        <!-- Favorite/Action Button (on image) -->
        <button class="action-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
          </svg>
        </button>
      </div>
      
      <!-- Tags (below image) -->
      <div class="tags-container">
        <div class="tags-wrapper">
          <span 
            v-for="tag in displayTags" 
            :key="tag" 
            class="tag"
          >
            #{{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- Right Side - Event Info Section -->
    <div class="info-section">
      <!-- Event Title (2 lines) -->
      <h3 class="event-title">{{ event.title }}</h3>
      
      <!-- Event Description (3 lines) -->
      <p class="event-description">{{ event.description }}</p>
      
      <!-- Time and Location at bottom right -->
      <div class="event-meta">
        <div class="time-info">
          <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
          <span>{{ formattedTime }}</span>
        </div>
        <div class="location-info">
          <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m3 11 18-9v18l-18-9z"></path>
            <path d="m11 11 7-4v8l-7-4z"></path>
          </svg>
          <span>{{ truncatedLocation }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatEventSchedule } from '../../types/event';
import type { Event } from '../../types/event';

const props = defineProps<{
  event: Event;
}>();

const emit = defineEmits<{
  click: [];
}>();

// Handle image loading errors
const handleImageError = (event: any) => {
  const target = event.target as HTMLImageElement;
  target.src = '/images/wavingdog.jpg';
};

// Display limited number of tags with fade effect
const displayTags = computed(() => {
  if (!props.event.tags || props.event.tags.length === 0) return [];
  return props.event.tags.slice(0, 6); // Show up to 6 tags
});


// Format time using existing utility
const formattedTime = computed(() => {
  try {
    return formatEventSchedule(props.event);
  } catch (error) {
    // Fallback to simple date formatting
    const startDate = typeof props.event.startTime?.toDate === 'function' 
      ? props.event.startTime.toDate() 
      : new Date(props.event.startTime);
    
    return startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
});

// Truncate location if too long
const truncatedLocation = computed(() => {
  if (!props.event.location) return 'Location TBD';
  const maxLength = 30;
  return props.event.location.length > maxLength 
    ? props.event.location.substring(0, maxLength) + '...'
    : props.event.location;
});
</script>

<style scoped>
.mobile-event-card {
  background: #F5F5F5;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 4px;
  border: 1px solid #E0E0E0; /* 添加边框 */
  border-color: black;
}

.mobile-event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.mobile-event-card {
  display: flex;
  min-height: 210px;
  max-height: 210px;
}

.left-container {
  display: flex;
  flex-direction: column;
  width: 160px;
  flex-shrink: 0;
}

.image-section {
  position: relative;
  width: 100%;
  height: 110px;
  margin-bottom: 8px;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.tags-container {
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding: 0 8px;
}

.tags-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 100px;
  overflow: hidden;
}

.tag {
  background: #f0f0f0;
  color: #666;
  font-size: 9px;
  font-weight: 300;
  padding: 3px 6px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

.tag:first-child {
  background: rgba(173, 138, 230, 0.95);
  color: white;
}


.info-section {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0; /* Allow text to shrink */
}

.event-title {
  font-size: 16px;
  font-weight: 300;
  color: #333;
  margin: 0 0 6px 0;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 限制标题最多显示 2 行 */
  -webkit-box-orient: vertical;
}

.event-description {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
}

.time-info,
.location-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #777;
}

.icon {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  stroke-width: 2;
}

.time-info span,
.location-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-button {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.action-button:hover {
  background: rgba(173, 138, 230, 0.9);
  color: white;
}

.action-button svg {
  width: 12px;
  height: 12px;
}

@media (max-width: 360px) {
  .left-container {
    width: 120px;
  }
  
  .image-section {
    height: 90px;
    margin-bottom: 6px;
  }
  
  .mobile-event-card {
    min-height: 140px;
    max-height: 160px;
  }
  
  .info-section {
    padding: 8px;
  }
  
  .event-title {
    font-size: 14px;
  }
  
  .event-description {
    font-size: 12px;
  }
  
  .tags-wrapper {
    max-height: 40px;
  }
  
  .tag {
    font-size: 8px;
    padding: 2px 4px;
  }
}
</style>