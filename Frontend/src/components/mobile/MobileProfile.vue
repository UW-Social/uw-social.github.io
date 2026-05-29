<template>
  <div class="mobile-profile">
    <!-- 背景图 -->
    <div class="background-container">
      <img src="/svg/background6.svg" alt="Background" class="background-svg" />
    </div>

    <!-- 用户信息 -->
    <div class="profile-header">
      <img :src="userProfile.photoURL || '/images/default-avatar.jpg'" alt="User Avatar" class="user-avatar" />
      <h2 class="user-name">{{ userProfile.displayName || 'Guest' }}</h2>
      <p class="user-email">{{ userProfile.email || 'No email available' }}</p>
      <div class="user-tags">
        <span v-for="tag in userProfile.tags || []" :key="tag" class="tag">#{{ tag }}</span>
      </div>
      <router-link to="/profile/edit" class="edit-profile-link">Edit Profile</router-link>
    </div>

    <!-- Major -->
    <div class="info-card">
      <div class="info-title">Your major</div>
      <div class="info-content">{{ userProfile.major || 'No major specified' }}</div>
    </div>

    <!-- Forum Notes -->
    <div class="info-card">
      <router-link to="/profile" class="info-title">Your Forum Notes</router-link>
    </div>

    <!-- User Events -->
    <div class="info-card">
      <router-link to="/profile" class="info-title">Your Events</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../stores/user';
import type { UserProfile } from '../../types/user';
import 'element-plus/es/components/collapse/style/css';
import 'element-plus/es/components/collapse-item/style/css';

const userStore = useUserStore();
const userProfile = ref<Partial<UserProfile>>({});
// 从 Firebase 获取用户信息
onMounted(async () => {
  try {
    const user = await userStore.fetchUserProfile();
    userProfile.value = user || {};
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
});
</script>

<style scoped>
.mobile-profile {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
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

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
}

.user-name {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

.user-email {
  font-size: 1rem;
  color: #555;
  margin-bottom: 1rem;
}

.user-tags {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background-color: #f0f0f0;
  border-radius: 12px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #555;
}

.edit-profile-link {
  color: #6c63ff;
  text-decoration: underline;
  font-size: 0.9rem;
}

.info-card {
  display: flex; /* 使用 flex 布局 */
  justify-content: space-between; /* 两侧内容分布 */
  align-items: center; /* 垂直居中 */
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  border-color: black;
  color: black;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
width: 100%;
max-width: 100%; /* 确保卡片不超出屏幕宽度 */
  box-sizing: border-box;
}

.info-title {
  color: black;
  font-size: 1.2rem;
  margin: 0;
}

.info-content {
  font-size: 1rem;
  color: black;
  text-align: right; /* 内容靠右对齐 */
}
</style>
