<template>
  <div class="mobile-login-container">
    <!-- 顶部栏 -->
    <div class="login-header">
      <button class="back-btn" @click="$router.back()">
        <img src="/svg/rightarrow.svg" alt="Back" style="transform: rotate(180deg); width: 24px; height: 24px;" />
      </button>
      <span class="login-title">Sign in</span>
    </div>
    <!-- logo -->
    <div class="logo-section">
      <img src="/svg/uw-social-logo1.svg" alt="UW Social Logo" class="main-logo" />
    </div>
    <!-- 登录方式按钮 -->
    <div class="login-btns">
      <button class="login-btn google-btn" @click="handleGoogleLogin">
        <img :src="google" alt="Google" class="login-icon" />
        <span>Google</span>
        <img src="/svg/rightarrow.svg" alt="Go" class="login-arrow" />
      </button>
      <button class="login-btn email-btn">
        <img :src="email" alt="Email" class="login-icon" />
        <span>Email</span>
        <img src="/svg/rightarrow.svg" alt="Go" class="login-arrow" />
      </button>
      <button class="login-btn phone-btn">
        <img :src="phone" alt="Phone" class="login-icon" />
        <span>Phone</span>
        <img src="/svg/rightarrow.svg" alt="Go" class="login-arrow" />
      </button>
    </div>
    <!-- 海报图片 -->
    <div class="poster-section">
      <img :src="poster" alt="Poster" class="poster-img" />
    </div>
  </div>
</template>

<script setup lang="ts">
import poster from "../../../public/svg/poster.svg";
import google from "../../../public/svg/google.svg";
import email from "../../../public/svg/email.svg";
import phone from "../../../public/svg/phone.svg";
import { useUserStore } from "../../stores/user";
const userStore = useUserStore();

function handleGoogleLogin() {
  userStore.loginWithGoogle();
}
</script>

<style scoped>
.mobile-login-container {
  max-width: 25rem; /* 400px ≈ 25rem */
  margin: 0 0rem;
  background: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  width: 100%;
  background: #ad8ae6;
  display: flex;
  align-items: center;
  height: 3rem; /* 48px ≈ 3rem */
  position: relative;
  justify-content: center;
}

.back-btn {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.login-title {
  font-size: 1.2rem;
  font-weight: 300;
  color: #222;
  letter-spacing: 1px;
  line-height: 3rem; /* 与 .login-header 高度一致 */
  height: 3rem;
  display: flex;
  align-items: center;
}

.logo-section {
  margin: 1.5rem 0 1rem 0;
  display: flex;
  justify-content: center;
  width: 100%;
}
.main-logo {
  width: 7.5rem; /* 120px ≈ 7.5rem */
  height: 7.5rem;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.login-btns {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.login-btn {
  width: 85%;
  max-width: 21.25rem; /* 340px ≈ 21.25rem */
  height: 3rem;
  background: #ddd5eb;
  border: none;
  border-radius: 1.125rem; /* 18px ≈ 1.125rem */
  box-shadow: 0 0.25rem 0.5rem #00000010;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  font-weight: 300;
  color: #222;
  padding: 0 1.125rem;
  cursor: pointer;
  transition: background 0.2s;
}
.login-btn:hover {
  background: #c2b2e6;
}
.login-icon,
.login-arrow {
  width: 1.375rem; /* 22px ≈ 1.375rem */
  height: 1.375rem;
  margin: 0 0.625rem;
}

.poster-section {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-bottom: 1.5rem;
}
.poster-img {
  width: 90%;
  max-width: 21.25rem;
  height: auto;
  object-fit: contain;
}
</style>