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
    component: isMobile()
      ? () => import('@/components/mobile/MobileEventDetail.vue')
      : () => import('@/views/EventDetail.vue'),
    props: true
  },
  {
    path: '/clubs',
    name: 'Clubs',
    component: isMobile()
      ? () => import('../views/Clubs.vue')
      : () => import('../views/Clubs.vue')
  },
  {
    path: '/clubs/:id',
    name: 'ClubDetail',
    component: () => import('../views/ClubDetail.vue'),
    props: true
  },
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('../views/Publish.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*', 
    redirect: '/'
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export function isMobile() {
  return window.innerWidth <= 576;
}

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 保存原始目标路径，登录后可以返回
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router 