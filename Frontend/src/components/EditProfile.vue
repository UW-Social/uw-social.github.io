<template>
  <div class="edit-profile-container">
    <div class="edit-profile-card">
      <div class="profile-header">
        <div class="header-background"></div>
        <div class="profile-avatar-section">
          <AvatarUpload />
          <h2>{{ userStore.userProfile?.displayName || 'Edit Your Profile' }}</h2>
          <p>Customize your profile to connect with like-minded people</p>
        </div>
      </div>

      <div class="profile-form">
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
          <div class="tag-categories">
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
          </div>

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
            <span v-if="!isSaving">💾 Save Profile</span>
            <span v-else>Saving...</span>
          </button>
          <button @click="cancelEdit" class="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { allTags, academicTags, dormTags, interestTags, sportsTags, csTags } from '../stores/tags';
import { useUserStore } from '../stores/user';
import AvatarUpload from './AvatarUpload.vue';
import '../assets/editprofile.css';

const router = useRouter();
const userStore = useUserStore();

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

// Toggle tag selection
const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tag);
  }
};

// Remove tag
const removeTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  }
};

// Save profile
const saveProfile = async () => {
  isSaving.value = true;
  try {
    await userStore.updateUserProfile({
      displayName: name.value,
      grade: grade.value,
      major: major.value,
      email: contact.value,
      tags: selectedTags.value,
    });
    alert('Profile updated successfully!');
    router.push('/profile');
  } catch (error) {
    console.error('Failed to save profile:', error);
    alert('Failed to save profile. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

// Cancel editing
const cancelEdit = () => {
  router.push('/profile');
};
</script>

<style scoped>
</style>