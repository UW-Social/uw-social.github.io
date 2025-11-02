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
            <div :class="{ active: $route.path === '/clubs' }">
              <li><router-link to="/clubs">Clubs</router-link></li>
            </div>
            <div v-if="isWeb" :class="{ active: $route.path === '/publish' }">
              <li><router-link to="/publish">Publish</router-link></li>
            </div>
            <div v-if="isWeb && userStore.isLoggedIn && userStore.userProfile?.displayName" :class="{ active: $route.path === '/profile' }">
              <li><router-link to="/profile">Profile</router-link></li>
            </div>
          </div>
        </div>

        <div class="right-link">
          <!-- 搜索框：仅在 Home 和 Publish 页面显示 -->
          <div v-if="isWeb && shouldShowSearch" class="navbar-search">
            <select v-model="searchType" class="search-type-select">
              <option value="events">Events</option>
              <option value="clubs">Clubs</option>
            </select>
            <input
              v-model="navbarSearch"
              @keyup.enter="handleNavbarSearch"
              type="text"
              :placeholder="`Search ${searchType}...`"
              class="navbar-search-input"
              :title="`Search for ${searchType} by name, tags, or description`"
            />
          </div>
          <div class="user-profile">
            <div v-if="userStore.isLoggedIn && userStore.userProfile?.displayName" class="avatar-logout">
              <img 
                :src="userStore.userProfile.photoURL || '/images/default-avatar.png'"
                alt="User Avatar"
                class="user-avatar"
                @click="navigateToProfile"
              />
              <a v-if="isWeb" href="#" @click.prevent="handleLogout" class="logout-link">Logout</a>
            </div>
            <div v-else>
              <router-link to="/login" class="login-btn">Login</router-link>
            </div>
          </div>
        </div>
      </div>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import '../assets/navbar.css';
import { useUserStore } from '../stores/user'
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const navbarSearch = ref('');
const searchType = ref<'events' | 'clubs'>('events');
const isWeb = ref(window.innerWidth > 576);

// 只在非 events 和非 clubs 页面显示搜索框
const shouldShowSearch = computed(() => {
  return route.path !== '/events' && route.path !== '/clubs';
});

const navigateToProfile = () => {
  router.push('/profile');
}

const handleLogout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

function handleNavbarSearch() {
  if (navbarSearch.value.trim()) {
    const path = searchType.value === 'events' ? '/events' : '/clubs';
    router.push({ path, query: { q: navbarSearch.value.trim() } });
    navbarSearch.value = '';
  }
}
</script>

<style>
</style>