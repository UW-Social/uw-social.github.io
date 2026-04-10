<template>
  <nav>
    <ul class="navbar">
      <div class="nav-items">
        <div class="left-link">
          <div class="nav-left">
            <li class="logo-container">
              <router-link to="/" class="logo-link">
                <span class="logo-text-brand">UW Social</span>
              </router-link>
            </li>
            <div :class="{ active: $route.path === '/' }">
              <li><router-link to="/">Home</router-link></li>
            </div>
            <div :class="{ active: $route.path === '/events' }">
              <li><router-link to="/events">Events</router-link></li>
            </div>
            <div :class="{ active: $route.path === '/forum' }">
              <li><router-link to="/forum">Forum</router-link></li>
            </div>
            <div v-if="isWeb" :class="{ active: $route.path === '/publish' }">
              <li><router-link to="/publish">Publish</router-link></li>
            </div>
            <div v-if="isWeb && userStore.isLoggedIn && userStore.userProfile?.displayName" :class="{ active: $route.path === '/profile' }">
              <li><router-link to="/profile">Profile</router-link></li>
            </div>
          </div>
        </div>

      <div class="nav-right">
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

const userStore = useUserStore();
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

