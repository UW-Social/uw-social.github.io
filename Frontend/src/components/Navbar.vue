<template>
  <nav class="site-nav">
    <div class="navbar">
      <router-link to="/" class="brand-link">
        <span class="logo-text-brand">UW SOCIAL</span>
      </router-link>

      <div class="nav-center">
        <router-link to="/" :class="['nav-link', { active: route.path === '/' }]">Home</router-link>
        <router-link to="/events" :class="['nav-link', { active: route.path.startsWith('/events') }]">Events</router-link>
        <router-link to="/forum" :class="['nav-link', { active: route.path.startsWith('/forum') }]">Forum</router-link>
      </div>

      <div class="nav-right">
        <button
          v-if="chatbotStore.isEnabled"
          type="button"
          class="chat-toggle-btn"
          @click="chatbotStore.toggle"
        >
          Ask
        </button>

        <router-link to="/publish" class="publish-btn">Publish</router-link>

        <div v-if="userStore.isLoggedIn && userStore.userProfile?.displayName" class="user-actions">
          <button class="avatar-button" type="button" @click="navigateToProfile">
            <img
              :src="userStore.userProfile.photoURL || '/images/default-avatar.png'"
              alt="User Avatar"
              class="user-avatar"
            />
          </button>
          <button class="logout-btn" type="button" @click="handleLogout">Logout</button>
        </div>

        <router-link v-else to="/login" class="login-btn">Login</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import '../assets/navbar.css';
import { useUserStore } from '../stores/user';
import { useChatbotStore } from '../stores/chatbot';

const userStore = useUserStore();
const chatbotStore = useChatbotStore();
const router = useRouter();
const route = useRoute();

const navigateToProfile = () => {
  router.push('/profile');
};

const handleLogout = async () => {
  try {
    await userStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
</script>

<style>
</style>

