<template>
  <nav>
    <ul class="navbar">
      <div class="nav-items">
        <div class="left-link">
          <div class="nav-left">
            <li>
              <router-link to="/">
                <img src="/svg/uw-social-logo1.svg" alt="UW Social Logo" class="logo">
                <img src="/svg/UW-SOCIAL.svg" alt="UW SOCIAL" class="logo-text">
              </router-link>
            </li>
            <div :class="{ active: $route.path === '/' }">
              <li><router-link to="/">HOME</router-link></li>
            </div>
            <div :class="{ active: $route.path === '/events' }">
              <li><router-link to="/events">EVENTS</router-link></li>
            </div>
            <div :class="{ active: $route.path === '/clubs' }">
              <li>
                <el-popover
                  width="200"
                  trigger="click"
                  v-model="isPopConfirmVisible"
                  popper-class="custom-popover"
                >
                  <template #reference>
                    <div @click.prevent="showPopover">
                      <router-link to="#">CLUBS</router-link>
                    </div>
                  </template>
                  <template #default>
                    <div class="popover-content">
                      <p class="popover-text">This feature is under development</p>
                      <button class="popover-button" @click="isPopConfirmVisible = false">OK</button>
                    </div>
                  </template>
                </el-popover>
              </li>
            </div>
            <div v-if="isWeb" :class="{ active: $route.path === '/publish' }">
              <li><router-link to="/publish">PUBLISH</router-link></li>
            </div>
            <div v-if="isWeb && userStore.isLoggedIn && userStore.userProfile?.displayName" :class="{ active: $route.path === '/profile' }">
              <li><router-link to="/profile">PROFILE</router-link></li>
            </div>
          </div>
        </div>

        <div class="right-link">
          <!-- 搜索框放在右侧导航项前面 -->
          <div v-if="isWeb" class="navbar-search">
            <input
              v-model="navbarSearch"
              @keyup.enter="handleNavbarSearch"
              type="text"
              placeholder="Search events..."
              class="navbar-search-input"
              title="type in event title, tag, or organizer's name"
            />
          </div>
          <div class="user-profile">
            <div v-if="userStore.isLoggedIn && userStore.userProfile?.displayName" class="avatar-logout">
              <img 
                :src="userStore.userProfile.photoURL"
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
import { el, fa } from 'element-plus/es/locales.mjs';
import '../assets/navbar.css';
import { useUserStore } from '../stores/user'
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const userStore = useUserStore()
const router = useRouter()
const navbarSearch = ref('');
const isWeb = ref(window.innerWidth > 576);
const isPopConfirmVisible = ref(false);

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
    router.push({ path: '/events', query: { q: navbarSearch.value.trim() } });
    navbarSearch.value = '';
  }
}

function showPopover() {
  isPopConfirmVisible.value = true;
   // Google Analytics 事件追踪
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'click', {
      'event_category': 'Navigation',
      'event_label': 'CLUBS',
      'value': 1
    });
  } else {
    console.warn('Google Analytics gtag is not defined.');
  }
}
</script>

<style>
.popover-content {
  display: flex;
  flex-direction: column;
  /* align-items: center; */
  justify-content: center;
  padding: 0 1rem;
  text-align: center;
}

.popover-icon {
  font-size: 2rem;
  color: #f56c6c;
  margin-bottom: 0.5rem;
}

.popover-text {
  font-size: 1rem;
  color: #333;
  margin-bottom: 1rem;
}

.popover-button {
  background-color: #6c63ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.popover-button:hover {
  background-color: #9c6ad6;
}
</style>