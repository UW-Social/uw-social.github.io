<template>
  <div class="login-modal">
    <el-button type="primary" @click="handleGoogleLogin" class="google-btn">
      Login with Google
    </el-button>
    <el-button @click="$emit('close')" class="close-btn">Close</el-button>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '../stores/user';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

const handleGoogleLogin = async () => {
  try {
    console.log('Attempting to log in...');
    const loginResult = await userStore.loginWithGoogle({ redirectPath: '/' });
    console.log('Login successful');
    router.push(loginResult.nextPath);
  } catch (error) {
    console.error('Login failed:', error);
  }
}
</script>
