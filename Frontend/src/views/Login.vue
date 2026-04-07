
<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-card">
        <div class="login-header">
          <h1>UW Social</h1>
          <p>Connect with your campus community</p>
        </div>
        
        <div class="login-form">
          <button @click="handleGoogleLogin()" class="google-login-btn" :disabled="isLoading">
            <div class="google-icon">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <span v-if="!isLoading">Continue with Google</span>
            <span v-else>Signing in...</span>
          </button>
          
          <div class="login-divider">
            <span>or</span>
          </div>
          
          <div class="guest-option">
            <p>Just browsing? <router-link to="/" class="guest-link">Continue as guest</router-link></p>
          </div>
        </div>
        
        <div class="login-footer">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "../stores/user";
import { useRouter, useRoute } from "vue-router";
import "../assets/login.css";

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const isLoading = ref(false);

function track(event: string, params: Record<string, any> = {}) {
  console.log("[TRACK FIRED]", event, params);
  const gtag = (window as any)?.gtag;
  if (gtag) gtag("event", event, params);
  else console.warn("[GTAG MISSING] window.gtag is undefined");
}

async function trackFirstLoginOnce(uid: string) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : null;

  const alreadyTracked = !!data?.analytics?.firstLoginTrackedAt;
  const retentionTracked = !!data?.analytics?.retentionTrackedAt;
  if (alreadyTracked) {
    if (retentionTracked) {
      
      return;
    }

    track("retention_user", { method: "google" });

    await setDoc(
      userRef,
      { analytics: { retentionTrackedAt: serverTimestamp() } },
      { merge: true }
    );

    console.log("[ANALYTICS] retention_user tracked ONCE for uid:", uid);
    return;
  }

  
  track("first_login_success", { method: "google" });

  await setDoc(
    userRef,
    { analytics: { firstLoginTrackedAt: serverTimestamp() } },
    { merge: true }
  );

  console.log("[ANALYTICS] first_login_success tracked ONCE for uid:", uid);
}
const handleGoogleLogin = async () => {
  if (isLoading.value) return;

  // 每次点击都记（用于漏斗：click -> success）
  track("login_click_google", { source: "login_page" });

  isLoading.value = true;
  try {
    const user = await userStore.loginWithGoogle(); // first_login_success（只一次）

    // 设置 user_id
    const uid = user?.uid;
    const gtag = (window as any)?.gtag;
    if (gtag && uid) gtag("set", { user_id: uid });

    //  每次登录成功都记
    track("login_success", { method: "google" });

    const redirect = (route.query.redirect as string) || "/profile";
    router.push(redirect);
  } catch (error: any) {
    track("login_fail", {
      method: "google",
      error: error?.code || error?.message || "unknown",
    });
    console.error("Login failed:", error);
  } finally {
    isLoading.value = false;
  }
};
</script>


<style scoped>
/* Ensure consistent border-radius across all elements */
:deep(.login-card) {
  border-radius: var(--radius-md) !important;
  box-shadow: none !important;
}

:deep(.google-login-btn) {
  border-radius: var(--radius-md) !important;
  box-shadow: none !important;
  outline: none !important;
}

:deep(.google-login-btn:hover) {
  box-shadow: none !important;
}

:deep(.google-login-btn:focus) {
  box-shadow: none !important;
  outline: none !important;
}

:deep(.google-login-btn:active) {
  box-shadow: none !important;
}

:deep(.google-login-btn:focus-visible) {
  box-shadow: none !important;
  outline: 2px solid var(--color-primary) !important;
  outline-offset: 2px !important;
}
</style>
