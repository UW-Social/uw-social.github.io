<template>
  <div v-if="route.path === '/'" class="box">
    <div class="top-part">
      <div class="search-bar-flex">
        <div class="search">
          <input
            class="label"
            type="text"
            v-model="mobileSearch"
            @keyup.enter="handleMobileSearch"
            placeholder="Search events..."
          />
        </div>
        <button class="profile-log-in" @click="handleProfileClick">
          <img
            :src="userAvatar"
            alt="avatar"
            class="avatar-img"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../../stores/user";

const userStore = useUserStore();
const defaultAvatar = "/images/mob-default-avatar.jpg";
const userAvatar = computed(() => userStore.userProfile?.photoURL || defaultAvatar);

const mobileSearch = ref("");
const router = useRouter();
const route = useRoute(); // 新增

function handleMobileSearch() {
  if (mobileSearch.value.trim()) {
    router.push({ path: "/", query: { q: mobileSearch.value.trim() } });
    mobileSearch.value = "";
  }
}

function handleProfileClick() {
  // 跳转到登录或个人中心
  if (userStore.isLoggedIn) {
    router.push("/profile");
  } else {
    router.push("/login");
  }
}
</script>

<style>
.box {
  width: 100vw;
  max-width: 576px;
  min-width: 320px;
  background: #ad8ae6;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.top-part {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px;
  width: 100%;
  box-sizing: border-box;
}

.search-bar-flex {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.search {
  flex: 1;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  height: 34px;
  padding: 4px 10px 4px 8px;
  min-width: 0;
}

.search .label {
  background: transparent;
  border: none;
  color: #828282;
  flex: 1;
  font-size: 14px;
  line-height: 20px;
  outline: none;
  padding: 0;
  margin: 0;
  display: block;
}

.profile-log-in {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #fcec61;
  border: none;
  padding: 0;
  margin-left: 8px;
  cursor: pointer;
  display: block;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

@media (max-width: 576px) {
  .top-part {
    padding-right: 16px; /* 保证右侧有间距 */
    padding-left: 8px;   /* 可适当缩小左侧 */
  }
}
</style>