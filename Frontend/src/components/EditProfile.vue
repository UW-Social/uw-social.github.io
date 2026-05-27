<template>
  <div class="edit-profile-container">
    <div class="edit-profile-card">
      <div class="profile-header">
        <div class="header-background"></div>
        <div class="profile-avatar-section">
          <AvatarUpload />
          <h2>{{ userStore.userProfile?.displayName || (isOnboardingFlow ? 'Set Up Your Profile' : 'Edit Your Profile') }}</h2>
          <p>{{ headerDescription }}</p>
        </div>
      </div>

      <div class="profile-form">
        <div v-if="isOnboardingFlow" class="onboarding-intro">
          <span class="onboarding-badge">Personalization</span>
          <p>Pick your interests and add the basics so we can tailor the homepage recommendations for you.</p>
        </div>

        <!-- Basic Information Section -->
        <div class="form-section">
          <div class="section-header">
            <h3>📄 Basic Information</h3>
            <p>Tell us about yourself</p>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="name">Full Name</label>
              <input 
                id="name"
                v-model="name" 
                placeholder="Enter your full name" 
                class="form-input"
                type="text"
              />
            </div>
            
            <div class="form-group">
              <label for="grade">Grade Level</label>
              <select id="grade" v-model="grade" class="form-select">
                <option value="" disabled>Select your grade</option>
                <option value="freshman">Freshman</option>
                <option value="sophomore">Sophomore</option>
                <option value="junior">Junior</option>
                <option value="senior">Senior</option>
                <option value="graduate">Graduate Student</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="major">Major</label>
              <div class="select-wrapper">
                <select id="major" v-model="major" class="form-select">
                  <option value="" disabled>Select your major</option>
                  <option v-for="majorOption in academicTags" :key="majorOption" :value="majorOption">
                    {{ majorOption }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="contact">Contact Information</label>
              <input 
                id="contact"
                v-model="contact" 
                placeholder="Email or preferred contact method" 
                class="form-input"
                type="text"
              />
            </div>
          </div>
        </div>

        <!-- Personal Tags Section -->
        <div class="form-section">
          <div class="section-header">
            <h3>🏷️ Personal Tags</h3>
            <p>Add tags that represent your interests, dorm, activities, and more</p>
          </div>
          
          <!-- Tag Search and Add -->
          <div class="tag-search-section">
            <div class="search-input-wrapper">
              <input
                v-model="tagSearchQuery"
                @input="handleTagSearch"
                @keyup.enter="addCustomTag"
                placeholder="Search for tags or add custom ones..."
                class="tag-search-input"
                type="text"
              />
              <button @click="addCustomTag" class="add-custom-btn" :disabled="!tagSearchQuery.trim()">
                <span>+</span>
              </button>
              <img
                src="/svg/help.svg"
                class="tag-help-icon"
                title="You can search for tags like major, dorm, sports, hobbies, etc."
                alt="Help"
              />
            </div>
            
            <!-- Search Results -->
            <div v-if="filteredTags.length > 0 && tagSearchQuery" class="tag-suggestions">
              <div class="suggestions-header">
                <span>Suggested tags:</span>
              </div>
              <div class="tag-grid">
                <button
                  v-for="tag in filteredTags.slice(0, 12)"
                  :key="tag"
                  @click="addTag(tag)"
                  :disabled="selectedTags.includes(tag)"
                  class="tag-suggestion"
                  :class="{ 'tag-disabled': selectedTags.includes(tag) }"
                >
                  {{ tag }}
                  <span v-if="selectedTags.includes(tag)" class="tag-check">✓</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Category Tags -->
          <!-- <div class="tag-categories">
            <div class="tag-category">
              <h4>🏠 Dorm & Housing</h4>
              <div class="tag-grid">
                <button
                  v-for="tag in dormTags.slice(0, 8)"
                  :key="tag"
                  @click="toggleTag(tag)"
                  class="tag-option"
                  :class="{ 'tag-selected': selectedTags.includes(tag) }"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <div class="tag-category">
              <h4>🎯 Interests & Hobbies</h4>
              <div class="tag-grid">
                <button
                  v-for="tag in interestTags.slice(0, 8)"
                  :key="tag"
                  @click="toggleTag(tag)"
                  class="tag-option"
                  :class="{ 'tag-selected': selectedTags.includes(tag) }"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <div class="tag-category">
              <h4>🏃‍♂️ Sports & Activities</h4>
              <div class="tag-grid">
                <button
                  v-for="tag in sportsTags.slice(0, 8)"
                  :key="tag"
                  @click="toggleTag(tag)"
                  class="tag-option"
                  :class="{ 'tag-selected': selectedTags.includes(tag) }"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <div class="tag-category">
              <h4>Self Development</h4>
              <div class="tag-grid">
                <button
                  v-for="tag in csTags.slice(0, 8)"
                  :key="tag"
                  @click="toggleTag(tag)"
                  class="tag-option"
                  :class="{ 'tag-selected': selectedTags.includes(tag) }"
                >
                  {{ tag }}
                </button>
              </div>
            </div>
          </div> -->

          <!-- Selected Tags Display -->
          <div v-if="selectedTags.length > 0" class="selected-tags-section">
            <h4>Your Tags ({{ selectedTags.length }})</h4>
            <div class="selected-tags">
              <div
                v-for="tag in selectedTags"
                :key="tag"
                class="selected-tag"
              >
                {{ tag }}
                <button @click="removeTag(tag)" class="remove-tag-btn">×</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button @click="saveProfile" class="save-btn" :disabled="isSaving">
            <span v-if="!isSaving">{{ isOnboardingFlow ? 'Save and See Recommendations' : '💾 Save Profile' }}</span>
            <span v-else>Saving...</span>
          </button>
          <button @click="cancelEdit" class="cancel-btn">
            {{ isOnboardingFlow ? 'Back to Home' : 'Cancel' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { academicTags, allTags } from '../stores/tags';
import { useUserStore } from '../stores/user';
import AvatarUpload from './AvatarUpload.vue';
import '../assets/editprofile.css';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isOnboardingFlow = computed(() => route.query.onboarding === '1');
const headerDescription = computed(() =>
  isOnboardingFlow.value
    ? 'Add your interests and basic info to unlock personalized event picks'
    : 'Customize your profile to connect with like-minded people',
);

// Form data
const name = ref('');
const contact = ref('');
const grade = ref('');
const major = ref('');
const selectedTags = ref<string[]>([]);
const isSaving = ref(false);

// Tag search functionality
const tagSearchQuery = ref('');
const filteredTags = ref<string[]>([]);

if (!userStore.isLoggedIn) {
  void router.replace({
    path: '/login',
    query: {
      redirect: '/profile/edit',
      prompt: 'Please sign in to finish your profile setup.',
    },
  });
} else if (isOnboardingFlow.value) {
  void router.replace('/onboarding');
}

// Auto-fill user information
watchEffect(() => {
  if (userStore.userProfile) {
    name.value = userStore.userProfile.displayName || '';
    contact.value = userStore.userProfile.email || '';
    grade.value = userStore.userProfile.grade || '';
    major.value = userStore.userProfile.major || '';
    selectedTags.value = userStore.userProfile.tags || [];
  }
});

// Tag search handler
const handleTagSearch = () => {
  const query = tagSearchQuery.value.toLowerCase().trim();
  if (!query) {
    filteredTags.value = [];
    return;
  }
  
  filteredTags.value = allTags.filter(tag => 
    tag.toLowerCase().includes(query) && !selectedTags.value.includes(tag)
  );
};

// Add tag from search or suggestions
const addTag = (tag: string) => {
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag);
    tagSearchQuery.value = '';
    filteredTags.value = [];
  }
};

// Add custom tag
const addCustomTag = () => {
  const customTag = tagSearchQuery.value.trim();
  if (customTag && !selectedTags.value.includes(customTag)) {
    selectedTags.value.push(customTag);
    tagSearchQuery.value = '';
    filteredTags.value = [];
  }
};



// Remove tag
const removeTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  }
}



// Save profile
const saveProfile = async () => {
  const normalizedName = name.value.trim();
  const normalizedContact = contact.value.trim();

  if (!normalizedName || !grade.value || !major.value || selectedTags.value.length === 0) {
    ElMessage.warning('Please complete your basic info and choose at least one tag.');
    return;
  }

  isSaving.value = true;
  try {
    await userStore.updateUserProfile({
      displayName: normalizedName,
      grade: grade.value,
      major: major.value,
      email: normalizedContact || userStore.userProfile?.email || null,
      tags: selectedTags.value,
    });

    if (isOnboardingFlow.value) {
      ElMessage.success('Recommendation is updated, go and check!');
      await router.push({
        path: '/',
        query: { onboarding: 'complete' },
        hash: '#recommendations',
      });
      return;
    }

    ElMessage.success('Profile updated successfully!');
    await router.push('/profile');
  } catch (error) {
    console.error('Failed to save profile:', error);
    ElMessage.error('Failed to save profile. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

// Cancel editing
const cancelEdit = () => {
  void router.push(isOnboardingFlow.value ? '/' : '/profile');
};
</script>

<style scoped>
.onboarding-intro {
  margin-bottom: 2rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.06));
  border: 1px solid rgba(102, 126, 234, 0.16);
}

.onboarding-intro p {
  margin: 0.45rem 0 0;
  color: #4a5568;
  line-height: 1.5;
}

.onboarding-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  background: rgba(102, 126, 234, 0.14);
  color: #5563d6;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
