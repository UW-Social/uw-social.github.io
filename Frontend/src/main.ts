import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import { ElDialog } from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import './firebase'; // 确保 Firebase 初始化
import './assets/design-system.css'; // Design system
import './assets/form.css';


import { useUserStore } from './stores/user';

async function loadGoogleMapsApi() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // 从 .env 文件中获取 API Key
  if (!apiKey) {
    console.error('Google API Key is missing!');
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
  script.async = true;
  script.defer = true;

  document.head.appendChild(script);

  script.onload = () => {
    console.log('Google Maps API loaded successfully');
  };

  script.onerror = () => {
    console.error('Failed to load Google Maps API');
  };
}

async function bootstrap() {
  const app = createApp(App);

  app.use(createPinia());
  app.use(router);
  app.use(ElementPlus);

  app.component(ElDialog.name || 'ElDialog', ElDialog);

  const userStore = useUserStore();
  await userStore.loadUser();

  router.beforeEach((to, from, next) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        'page_path': location.pathname + location.hash,
        'page_title': to.name || 'Unknown Page',
      });
    }
    next();
  });

  await loadGoogleMapsApi(); // 动态加载 Google Maps API

  app.mount('#app');
}

bootstrap(); // ✅ no top-level await, production-safe
