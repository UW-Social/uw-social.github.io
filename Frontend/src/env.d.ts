/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_GEMINI_MODEL?: string
  readonly VITE_CHATBOT_ENABLED?: string
  readonly VITE_CHATBOT_TIMEOUT_MS?: string
  readonly VITE_CHATBOT_COOLDOWN_MS?: string
  readonly VITE_CHATBOT_MAX_REQUESTS_PER_SESSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 