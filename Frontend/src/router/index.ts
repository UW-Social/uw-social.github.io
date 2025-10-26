import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
// import { isMobile } from '@/App.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: isMobile()
      ? () => import('@/views/Login.vue')
      : () => import('@/views/Login.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: isMobile() 
      ? () => import('@/components/mobile/MobileProfile.vue') 
      : () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    component: () => import('@/components/EditProfile.vue'),
  },
  {
    path: '/events',
    name: 'Events',
    component: isMobile()
      ? () => import('@/components/mobile/MobileEvent.vue')
      : () => import('../views/Events.vue')
  },
  {
    path: '/events/:id',
    name: 'EventDetail',
    component: () => import('@/components/mobile/MobileEventDetail.vue'),
    props: true
  },
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('../views/Publish.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/clubs',
    name: 'Club',
    component: () => import('../views/Club.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  // Cool, better than createWebHistory.
  routes
})

export function isMobile() {
  return window.innerWidth <= 576;
}

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router 