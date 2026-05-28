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
    meta: { requiresAuth: true }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/Onboarding.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('../views/Events.vue')
  },
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('@/views/Forum.vue')
  },
  {
    path: '/forum/new',
    name: 'ForumNewPost',
    component: () => import('@/views/ForumNewPost.vue')
  },
  {
    path: '/forum/posts/:eventId/:postId',
    name: 'ExperiencePostDetail',
    component: () => import('@/views/ExperiencePostDetail.vue'),
    props: true
  },
  {
    path: '/score-framework',
    name: 'ScoreFramework',
    component: () => import('@/views/ScoreFramework.vue')
  },
  {
    path: '/events/:id/edit',
    name: 'EditEvent',
    component: () => import('@/views/EditEvent.vue'),
    meta: {
      requiresAuth: true,
      authPrompt: 'Please log in to edit your event.'
    },
    props: true
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
    path: '/forums',
    name: 'Forums',
    component: () => import('@/views/Forums.vue')
  },
  {
    path: '/forums/:id',
    name: 'ForumDetail',
    component: () => import('@/views/ForumDetail.vue'),
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
    meta: {
      requiresAuth: true,
      authPrompt: 'Please log in to publish an event or club.'
    }
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
    const authPrompt = typeof to.meta.authPrompt === 'string' ? to.meta.authPrompt : ''
    // 保存原始目标路径，登录后可以返回
    next({
      path: '/login',
      query: {
        redirect: to.fullPath,
        prompt: authPrompt || undefined
      }
    })
  } else {
    next()
  }
})

export default router 
