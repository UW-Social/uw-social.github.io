<template>
  <div class="profile-layout">
    <!-- 左侧：个人信息 + 侧边菜单 -->
    <aside class="profile-sidebar">
      <div class="profile-card">
        <AvatarUpload />
        <h2>{{ userStore.userProfile?.displayName || 'User' }}</h2>
      </div>

      <div class="profile-menu">
        <ul>
          <li>
            <a href="#" @click.prevent="showSection('default')" :class="{ active: currentSection === 'default' }">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Profile Home
            </a>
          </li>
          <li>
            <a href="#" @click.prevent="showSection('published')" :class="{ active: currentSection === 'published' }">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Published Events
            </a>
          </li>
          <li>
            <a href="#" @click.prevent="showSection('participated')" :class="{ active: currentSection === 'participated' }">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Participated Events
            </a>
          </li>
          <li>
            <a href="#" @click.prevent="showSection('achievements')" :class="{ active: currentSection === 'achievements' }">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
              Your Achievements
            </a>
          </li>
        </ul>
      </div>
    </aside>

    <!-- 右侧：个人信息和社交动态 -->
    <main class="profile-main">
      <!-- 默认页面（基本信息 & 社交动态） -->
      <div v-show="currentSection === 'default'" id="default-content">

        <!-- 个人信息 -->
        <div class="profile-info">
          <h3>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Basic Information
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Name:</span>
              <span class="info-value">{{ userStore.userProfile?.displayName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Grade:</span>
              <span class="info-value">{{ userStore.userProfile?.grade }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Major:</span>
              <span class="info-value">{{ userStore.userProfile?.major }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Contact:</span>
              <span class="info-value">{{ userStore.userProfile?.email }}</span>
            </div>
          </div>
        </div>

        <!-- 个人标签 -->
        <div class="profile-tags">
          <h3>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            Personal Tags
          </h3>
          <ul>
            <li v-for="tag in userStore.userProfile?.tags || []" :key="tag">{{ tag }}</li>
          </ul>
        </div>

        <!-- 编辑 -->
        <div class="edit-profile">
          <button class="edit-btn" @click="goToEditProfile">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Profile
          </button>
        </div>

        <div class="achievements">
          <h3>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
            Your Achievements
          </h3>
          <div class="achievement-badge">
            <img src="/images/logo1.png" alt="UW Social Badge">
            <p>You have published {{ publishedEvents.length }} events!</p>
          </div>
          <!-- <div class="achievement-badge">
            <img src="/images/logo1.png" alt="UW Social Badge">
            <p>You have made 5 new friends!</p>
          </div> -->
        </div>
      </div>

      <div v-show="currentSection === 'published'" class="profile-section">
        <h3>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Published Events
        </h3>
        <div class="event-list-horizontal" v-if="publishedEvents.length > 0">
          <div v-for="event in publishedEvents" :key="event.id" class="event-card-horizontal">
            <h4>{{ event.title }}</h4>
            <div class="event-meta">
              <span>
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {{ event.date }}
              </span>
              <span>
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {{ event.location }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No published events yet</p>
        </div>
      </div>

      <div v-show="currentSection === 'participated'" class="profile-section">
        <h3>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Participated Events
        </h3>
        <div v-if="participatedEvents.length > 0">
          <div v-for="event in participatedEvents" :key="event.id" class="event-card">
            <h4>{{ event.title }}</h4>
            <p>
              <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {{ event.date }}
            </p>
            <p>
              <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {{ event.location }}
            </p>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No participated events yet</p>
        </div>
      </div>

      <div v-show="currentSection === 'achievements'" class="profile-section">
        <h3>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
          Your Achievements
        </h3>
        <div class="achievement-badge">
          <img src="/images/logo.png" alt="UW Social Badge">
          <p>You have published {{ publishedEvents.length }} events!</p>
        </div>
        <!-- <div class="achievement-badge">
          <img src="/images/logo1.png" alt="UW Social Badge">
          <p>You have made 5 new friends!</p>
        </div> -->
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import AvatarUpload from '../components/AvatarUpload.vue'
import { formatEventSchedule } from '../types/event';

interface Event {
  id: string
  title: string
  date: string
  location: string
}

const userStore = useUserStore()
const router = useRouter()
const currentSection = ref('default')
const db = getFirestore()

const publishedEvents = ref<Event[]>([])
const participatedEvents = ref<Event[]>([])

const showSection = (section: string) => {
  currentSection.value = section
}

function goToEditProfile() {
  router.push('/profile/edit');
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  try {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('organizerId', '==', userStore.userProfile?.uid));
    const querySnapshot = await getDocs(q);
    publishedEvents.value = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const dateStr = data.schedule ? formatEventSchedule(data.schedule) : 'Schedule not available';
      return {
        id: doc.id,
        title: data.title || '',
        date: dateStr,
        location: data.location || ''
      };
    });
  } catch (error) {
    console.error('Failed to fetch published events:', error);
  }
});
</script>

<style scoped src="../assets/profile.css"></style>
