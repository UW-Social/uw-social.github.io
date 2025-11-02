<template>
  <div v-if="isVisible" class="filter-overlay" @click.self="$emit('close')">
    <div class="filter-modal">
      <!-- Header -->
      <div class="filter-header">
        <button class="close-button" @click="$emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <button class="menu-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Category Section -->
      <div class="filter-section">
        <div class="section-header">
          <div class="section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ad8ae6" stroke-width="2">
              <path d="M7 7H17V17H7z"></path>
              <path d="M3 3H21V21H3z"></path>
            </svg>
          </div>
          <h3 class="section-title">Category</h3>
        </div>

        <div class="categories-grid">
          <button
            v-for="category in categories"
            :key="category.key"
            :class="['category-button', { active: selectedCategories.includes(category.key) }]"
            @click="toggleCategory(category.key)"
          >
            #{{ category.label.toLowerCase() }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Category {
  key: string;
  label: string;
}

const props = defineProps<{
  isVisible: boolean;
  selectedCategories: string[];
}>();

const emit = defineEmits<{
  close: [];
  updateCategories: [categories: string[]];
}>();

const categories: Category[] = [
  { key: "academic", label: "Academic" },
  { key: "club", label: "Club" },
  { key: "sports", label: "Sports" },
  { key: "games", label: "Games" },
  { key: "culture", label: "Culture" },
  { key: "interest", label: "Interest" },
  { key: "HFS", label: "HFS" },
];

const selectedCategories = ref<string[]>([...props.selectedCategories]);

const toggleCategory = (categoryKey: string) => {
  const index = selectedCategories.value.indexOf(categoryKey);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(categoryKey);
  }
  
  // Emit the updated categories immediately
  emit('updateCategories', [...selectedCategories.value]);
};

// Watch for prop changes
watch(() => props.selectedCategories, (newCategories) => {
  selectedCategories.value = [...newCategories];
});
</script>

<style scoped>
.filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  overflow-y: auto;
}

.filter-modal {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  margin-top: 80px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
}

.close-button,
.menu-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.close-button:hover,
.menu-button:hover {
  background-color: #f5f5f5;
}

.filter-section {
  padding: 0 24px 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-title {
  font-size: 18px;
  font-weight: 300;
  color: #333;
  margin: 0;
}

.categories-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.category-button {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 300;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.category-button:hover {
  background: #e9ecef;
  border-color: #ad8ae6;
}

.category-button.active {
  background: rgba(173, 138, 230, 0.1);
  border-color: #ad8ae6;
  color: #ad8ae6;
}

.category-button.active:first-child {
  background: rgba(173, 138, 230, 0.95);
  color: white;
  border-color: #ad8ae6;
}

/* Mobile responsive adjustments */
@media (max-width: 480px) {
  .filter-overlay {
    padding: 10px;
  }
  
  .filter-modal {
    margin-top: 60px;
    max-width: none;
  }
  
  .filter-header {
    padding: 16px 20px 12px;
  }
  
  .filter-section {
    padding: 0 20px 20px;
  }
  
  .categories-grid {
    gap: 8px;
  }
  
  .category-button {
    font-size: 13px;
    padding: 6px 12px;
  }
}
</style>