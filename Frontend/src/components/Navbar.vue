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
        <router-link
          to="/ai-consultant"
          :class="['chat-toggle-btn', { active: route.path === '/ai-consultant' }]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3l1.55 4.45L18 9l-4.45 1.55L12 15l-1.55-4.45L6 9l4.45-1.55L12 3Z"></path>
            <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"></path>
            <path d="M5 13l.95 2.55L8.5 16.5l-2.55.95L5 20l-.95-2.55L1.5 16.5l2.55-.95L5 13Z"></path>
          </svg>
          AI Consultant
        </router-link>
      </div>

      <div class="nav-right">
        <div v-if="userStore.isLoggedIn && userStore.userProfile?.displayName" class="user-actions">
          <router-link
            to="/mailbox"
            class="mailbox-nav-button"
            :class="{ active: route.path === '/mailbox' }"
            aria-label="Open mailbox"
            title="Mailbox"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"></path>
              <path d="m5 7 7 5 7-5"></path>
            </svg>
            <span v-if="unreadMailboxCount > 0" class="mailbox-badge">
              {{ unreadMailboxCount > 99 ? '99+' : unreadMailboxCount }}
            </span>
          </router-link>

          <div class="avatar-menu">
            <button class="avatar-button" type="button" aria-haspopup="menu" aria-label="Open user menu">
              <img
                :src="userStore.userProfile.photoURL || '/images/default-avatar.png'"
                alt="User Avatar"
                class="user-avatar"
              />
            </button>
            <div class="avatar-dropdown" role="menu">
              <button type="button" role="menuitem" @click="navigateToProfile">View my homepage</button>
              <button type="button" role="menuitem" @click="handleLogout">Logout</button>
            </div>
          </div>
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
import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';
import { onUnmounted, ref, watch } from 'vue';
import { db } from '../firebase/config';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const unreadMailboxCount = ref(0);
let unsubscribeMailboxCount: Unsubscribe | null = null;

const stopMailboxCountSubscription = () => {
  if (unsubscribeMailboxCount) {
    unsubscribeMailboxCount();
    unsubscribeMailboxCount = null;
  }
};

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

watch(
  () => userStore.userProfile?.uid,
  (userId) => {
    stopMailboxCountSubscription();
    unreadMailboxCount.value = 0;

    if (!userId) return;

    const unreadQuery = query(
      collection(db, 'users', userId, 'notifications'),
      where('read', '==', false),
    );

    unsubscribeMailboxCount = onSnapshot(
      unreadQuery,
      (snapshot) => {
        unreadMailboxCount.value = snapshot.size;
      },
      (error) => {
        console.error('Failed to subscribe to unread mailbox count:', error);
        unreadMailboxCount.value = 0;
      },
    );
  },
  { immediate: true },
);

onUnmounted(stopMailboxCountSubscription);
</script>

<style>
</style>
