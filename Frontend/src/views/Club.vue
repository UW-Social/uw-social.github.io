<template>
  <div class="club-page">
    <!-- Background container -->
    <div class="background-container">
      <img src="/svg/clubsbg.svg" alt="Club Background" class="background-svg" />
    </div>

    <div class="overlapping-page">
      <div class="club-container">
        <!-- Club Header Image -->
        <div class="club-header-image">
          <img
            :src="clubData.imageUrl"
            :alt="clubData.title"
            class="header-image"
          />
        </div>

        <!-- Club Content -->
        <div class="club-content-wrapper">
          <!-- Club Title and Description -->
          <div class="club-info-section">
            <h1 class="club-title">{{ clubData.title }}</h1>
            <p class="club-description">{{ clubData.description }}</p>
          </div>

          <!-- Comment Sections -->
          <div class="comment-sections">
            <div
              v-for="(section, index) in commentSections"
              :key="index"
              :class="['comment-section', { active: activeSection === index }]"
              @click="selectSection(index)"
            >
              <div class="section-header">
                <h3 class="section-title">{{ section.title }}</h3>
                <span class="section-count">{{ section.comments.length }}</span>
              </div>

              <!-- Expanded Comments -->
              <div v-if="activeSection === index" class="section-comments">
                <div
                  v-for="(comment, commentIndex) in section.comments"
                  :key="commentIndex"
                  class="comment-item"
                >
                  <div class="comment-header">
                    <img
                      :src="comment.userAvatar"
                      :alt="comment.userName"
                      class="comment-avatar"
                    />
                    <div class="comment-user-info">
                      <span class="comment-user-name">{{ comment.userName }}</span>
                      <span class="comment-time">{{ formatTime(comment.timestamp) }}</span>
                    </div>
                  </div>
                  <p class="comment-text">{{ comment.text }}</p>
                </div>

                <!-- Add Comment Form -->
                <div class="add-comment-form">
                  <textarea
                    v-model="newComment"
                    placeholder="Add a comment..."
                    class="comment-input"
                    rows="3"
                  ></textarea>
                  <button
                    @click="addComment(index)"
                    class="submit-comment-btn"
                    :disabled="!newComment.trim()"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '../stores/user';
import '../assets/club.css';

const userStore = useUserStore();

// Club data (in a real app, this would come from an API/store)
const clubData = ref({
  title: 'UW Social Club',
  description: 'Welcome to the UW Social Club! This is a community for students to connect, share experiences, and build meaningful relationships. Join us for exciting events, discussions, and networking opportunities throughout the academic year.',
  imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=400&fit=crop',
});

// Comment sections
const commentSections = ref([
  {
    title: 'General Discussion',
    comments: [
      {
        userName: 'Alice Johnson',
        userAvatar: 'https://i.pravatar.cc/150?img=1',
        text: 'Really excited to be part of this club! Looking forward to meeting everyone.',
        timestamp: new Date('2025-10-20T10:30:00')
      },
      {
        userName: 'Bob Smith',
        userAvatar: 'https://i.pravatar.cc/150?img=2',
        text: 'Had a great time at the last meetup. When is the next one?',
        timestamp: new Date('2025-10-21T14:15:00')
      }
    ]
  },
  {
    title: 'Events & Announcements',
    comments: [
      {
        userName: 'Carol Martinez',
        userAvatar: 'https://i.pravatar.cc/150?img=3',
        text: 'Don\'t forget about our networking event this Friday at 6 PM!',
        timestamp: new Date('2025-10-22T09:00:00')
      }
    ]
  },
  {
    title: 'Questions & Help',
    comments: [
      {
        userName: 'David Lee',
        userAvatar: 'https://i.pravatar.cc/150?img=4',
        text: 'How do I RSVP for upcoming events?',
        timestamp: new Date('2025-10-23T11:45:00')
      },
      {
        userName: 'Emma Wilson',
        userAvatar: 'https://i.pravatar.cc/150?img=5',
        text: 'You can RSVP through the events page or contact the organizers directly!',
        timestamp: new Date('2025-10-23T12:30:00')
      }
    ]
  }
]);

const activeSection = ref<number | null>(0); // First section open by default
const newComment = ref('');

const selectSection = (index: number) => {
  activeSection.value = activeSection.value === index ? null : index;
};

const addComment = (sectionIndex: number) => {
  if (!newComment.value.trim()) return;

  if (!userStore.isLoggedIn || !userStore.userProfile) {
    alert('Please log in to post a comment.');
    return;
  }

  const comment = {
    userName: userStore.userProfile.displayName || 'Anonymous',
    userAvatar: userStore.userProfile.photoURL || 'https://i.pravatar.cc/150?img=0',
    text: newComment.value,
    timestamp: new Date()
  };

  commentSections.value[sectionIndex].comments.push(comment);
  newComment.value = '';
};

const formatTime = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};
</script>

<style scoped>
.club-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
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

.overlapping-page {
  position: relative;
  z-index: 1;
  padding: 2rem 1rem;
}

.club-container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.club-header-image {
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-content-wrapper {
  padding: 2rem;
}

.club-info-section {
  margin-bottom: 2rem;
}

.club-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
}

.club-description {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
}

.comment-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-section {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.comment-section:hover {
  border-color: #6c63ff;
  box-shadow: 0 2px 8px rgba(108, 99, 255, 0.15);
}

.comment-section.active {
  border-color: #6c63ff;
  background-color: #f9f8ff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.section-count {
  background-color: #6c63ff;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.section-comments {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.comment-item {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-user-info {
  display: flex;
  flex-direction: column;
}

.comment-user-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.comment-time {
  font-size: 0.85rem;
  color: #999;
}

.comment-text {
  color: #555;
  line-height: 1.5;
  margin: 0;
}

.add-comment-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.comment-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.comment-input:focus {
  outline: none;
  border-color: #6c63ff;
}

.submit-comment-btn {
  align-self: flex-end;
  background: linear-gradient(90deg, #b388eb 0%, #6c63ff 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-comment-btn:hover:not(:disabled) {
  background: linear-gradient(90deg, #9c6ad6 0%, #5753d6 100%);
  box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
}

.submit-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 576px) {
  .club-header-image {
    height: 250px;
  }

  .club-content-wrapper {
    padding: 1.5rem;
  }

  .club-title {
    font-size: 1.8rem;
  }

  .club-description {
    font-size: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .comment-section {
    padding: 1rem;
  }
}
</style>
