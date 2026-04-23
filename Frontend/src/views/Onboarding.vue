<template>
  <main class="onboarding-page">
    <section class="onboarding-shell" aria-live="polite">
      <header class="onboarding-topbar">
        <router-link to="/" class="brand-link">UW Social</router-link>
        <button v-if="canSkipCurrentStep" class="skip-link" type="button" @click="skipCurrentStep">
          Skip for now
        </button>
      </header>

      <div class="progress-wrap" aria-hidden="true">
        <div
          v-for="(_, index) in flowSteps"
          :key="index"
          class="progress-dot"
          :class="{ active: index <= activeProgressIndex }"
        ></div>
      </div>

      <Transition name="step" mode="out-in">
        <section v-if="currentStep === 0" key="welcome" class="step-panel welcome-panel">
          <span class="eyebrow">Personalized events</span>
          <h1>Let's build your feed</h1>
          <p>
            Pick a few things you like and UW Social will tune your campus event recommendations in under a minute.
          </p>
          <div class="preview-row">
            <span>Tech talks</span>
            <span>Free food</span>
            <span>Meet people</span>
          </div>
          <button class="primary-action" type="button" @click="goNext">
            Let's customize your feed
          </button>
        </section>

        <section v-else-if="currentStep === 1" key="interests" class="step-panel">
          <span class="eyebrow">Step 1 of 3</span>
          <h1>What are you into?</h1>
          <p>Choose a few event types you'd want to see first.</p>

          <div class="interest-grid">
            <button
              v-for="interest in interestOptions"
              :key="interest.value"
              class="choice-card"
              :class="{ selected: selectedTags.includes(interest.value) }"
              type="button"
              @click="toggleSelection(selectedTags, interest.value)"
            >
              <span class="choice-icon">{{ interest.icon }}</span>
              <span>{{ interest.label }}</span>
            </button>
          </div>

          <footer class="step-actions">
            <button class="secondary-action" type="button" @click="goBack">Back</button>
            <button class="primary-action" type="button" :disabled="selectedTags.length === 0" @click="goNext">
              Keep going
            </button>
          </footer>
        </section>

        <section v-else-if="currentStep === 2" key="context" class="step-panel">
          <span class="eyebrow">Step 2 of 3</span>
          <h1>Tell us a little about campus life</h1>
          <p>This helps us surface events that fit where you are in school.</p>

          <div class="field-block">
            <label>Year at UW</label>
            <div class="pill-row">
              <button
                v-for="gradeOption in gradeOptions"
                :key="gradeOption.value"
                class="pill-choice"
                :class="{ selected: grade === gradeOption.value }"
                type="button"
                @click="grade = gradeOption.value"
              >
                {{ gradeOption.label }}
              </button>
            </div>
          </div>

          <div class="field-block">
            <label>Academic area</label>
            <select v-model="major" class="soft-select" aria-label="Academic area">
              <option value="">Pick one</option>
              <option v-for="majorOption in majorOptions" :key="majorOption" :value="majorOption">
                {{ majorOption }}
              </option>
            </select>
          </div>

          <footer class="step-actions">
            <button class="secondary-action" type="button" @click="goBack">Back</button>
            <button class="primary-action" type="button" @click="goNext">Next</button>
          </footer>
        </section>

        <section v-else-if="currentStep === 3" key="goals" class="step-panel">
          <span class="eyebrow">Step 3 of 3</span>
          <h1>What are you hoping to get out of this semester?</h1>
          <p>Optional, but it makes your recommendations feel more like you.</p>

          <div class="goal-grid">
            <button
              v-for="goalOption in goalOptions"
              :key="goalOption.value"
              class="goal-chip"
              :class="{ selected: selectedGoals.includes(goalOption.value) }"
              type="button"
              @click="toggleSelection(selectedGoals, goalOption.value)"
            >
              {{ goalOption.label }}
            </button>
          </div>

          <footer class="step-actions">
            <button class="secondary-action" type="button" @click="goBack">Back</button>
            <button class="primary-action" type="button" :disabled="isSaving" @click="finishOnboarding">
              {{ isSaving ? 'Getting your feed ready...' : 'See my events' }}
            </button>
          </footer>
        </section>

        <section v-else key="complete" class="step-panel complete-panel">
          <div class="ready-mark">OK</div>
          <span class="eyebrow">Your feed is ready</span>
          <h1>We found events that match your interests</h1>
          <p>Taking you to your recommendations now.</p>
        </section>
      </Transition>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const flowSteps = ['welcome', 'interests', 'context', 'goals'];
const currentStep = ref(0);
const selectedTags = ref<string[]>([]);
const selectedGoals = ref<string[]>([]);
const grade = ref('');
const major = ref('');
const isSaving = ref(false);
const hasHydratedProfile = ref(false);

const interestOptions = [
  { label: 'Tech / AI', value: 'Tech / AI', icon: 'AI' },
  { label: 'Career / Networking', value: 'Career / Networking', icon: 'CN' },
  { label: 'Music', value: 'Music', icon: 'MU' },
  { label: 'Food', value: 'Food', icon: 'FD' },
  { label: 'Arts / Creative', value: 'Arts / Creative', icon: 'AR' },
  { label: 'Sports / Fitness', value: 'Sports / Fitness', icon: 'SF' },
  { label: 'Cultural Events', value: 'Cultural Events', icon: 'CU' },
  { label: 'Social / Meet People', value: 'Social / Meet People', icon: 'SO' },
  { label: 'Volunteering', value: 'Volunteering', icon: 'VO' },
  { label: 'Entrepreneurship', value: 'Entrepreneurship', icon: 'EN' },
];

const gradeOptions = [
  { label: 'First year', value: 'freshman' },
  { label: 'Sophomore', value: 'sophomore' },
  { label: 'Junior', value: 'junior' },
  { label: 'Senior', value: 'senior' },
  { label: 'Grad student', value: 'graduate' },
];

const majorOptions = [
  'Arts & Design',
  'Business',
  'Computer Science / Engineering',
  'Education',
  'Environment',
  'Health & Medicine',
  'Humanities',
  'Natural Sciences',
  'Social Sciences',
  'Undecided / Exploring',
];

const goalOptions = [
  { label: 'Make friends', value: 'Make friends' },
  { label: 'Explore campus', value: 'Explore campus' },
  { label: 'Build career', value: 'Build career' },
  { label: 'Learn something new', value: 'Learn something new' },
  { label: 'Relax and have fun', value: 'Relax and have fun' },
];

const activeProgressIndex = computed(() => Math.min(currentStep.value, flowSteps.length - 1));
const canSkipCurrentStep = computed(() => currentStep.value === 2 || currentStep.value === 3);

watchEffect(() => {
  const profile = userStore.userProfile;
  if (!profile || hasHydratedProfile.value) return;

  if (selectedTags.value.length === 0 && Array.isArray(profile.tags)) {
    selectedTags.value = [...profile.tags];
  }

  if (selectedGoals.value.length === 0 && Array.isArray(profile.goals)) {
    selectedGoals.value = [...profile.goals];
  }

  grade.value = grade.value || profile.grade || '';
  major.value = major.value || profile.major || '';
  hasHydratedProfile.value = true;
});

function toggleSelection(collection: string[], value: string): void {
  const index = collection.indexOf(value);
  if (index >= 0) {
    collection.splice(index, 1);
    return;
  }

  collection.push(value);
}

function goNext(): void {
  currentStep.value = Math.min(currentStep.value + 1, flowSteps.length - 1);
}

function goBack(): void {
  currentStep.value = Math.max(currentStep.value - 1, 0);
}

function skipCurrentStep(): void {
  if (currentStep.value === 3) {
    void finishOnboarding();
    return;
  }

  goNext();
}

async function finishOnboarding(): Promise<void> {
  if (isSaving.value) return;

  if (selectedTags.value.length === 0) {
    currentStep.value = 1;
    ElMessage.warning('Choose at least one interest so we can tune your feed.');
    return;
  }

  isSaving.value = true;

  try {
    await userStore.updateUserProfile({
      grade: grade.value || null,
      major: major.value || null,
      tags: selectedTags.value,
      goals: selectedGoals.value,
      onboardingCompleted: true,
    });

    currentStep.value = 4;
    window.setTimeout(() => {
      void router.push({
        path: '/',
        query: { onboarding: 'complete' },
        hash: '#recommendations',
      });
    }, 900);
  } catch (error) {
    console.error('Failed to save onboarding preferences:', error);
    ElMessage.error('We could not save your preferences. Please try again.');
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  padding: calc(var(--navbar-height) + 1.5rem) 1rem 2rem;
  background:
    radial-gradient(circle at 16% 16%, rgba(99, 102, 241, 0.13), transparent 28%),
    radial-gradient(circle at 84% 10%, rgba(16, 185, 129, 0.1), transparent 24%),
    linear-gradient(180deg, #fbfcff 0%, #f3f6fb 100%);
}

.onboarding-shell {
  width: min(760px, 100%);
  min-height: 620px;
  margin: 0 auto;
  padding: 1.1rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
}

.onboarding-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.25rem;
  margin-bottom: 1rem;
}

.brand-link {
  color: var(--color-gray-900);
  font-weight: 700;
}

.skip-link {
  color: var(--color-gray-500);
  font-size: 0.92rem;
  font-weight: 600;
}

.skip-link:hover {
  color: var(--color-primary);
}

.progress-wrap {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.45rem;
  margin-bottom: 1.1rem;
}

.progress-dot {
  height: 0.32rem;
  border-radius: 999px;
  background: var(--color-gray-200);
  transition: background var(--transition-base), transform var(--transition-base);
}

.progress-dot.active {
  background: var(--color-primary);
}

.step-panel {
  min-height: 505px;
  display: flex;
  flex-direction: column;
  padding: clamp(1.2rem, 4vw, 2.3rem);
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.welcome-panel,
.complete-panel {
  justify-content: center;
  align-items: flex-start;
}

.eyebrow {
  width: fit-content;
  margin-bottom: 0.75rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0;
}

.step-panel h1 {
  max-width: 620px;
  margin: 0;
  color: #111827;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.06;
}

.step-panel p {
  max-width: 560px;
  margin: 0.85rem 0 1.5rem;
  color: var(--color-gray-600);
  font-size: 1.04rem;
  line-height: 1.55;
}

.preview-row,
.goal-grid,
.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.preview-row {
  margin-bottom: 2rem;
}

.preview-row span,
.goal-chip,
.pill-choice {
  border-radius: 999px;
  border: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  color: var(--color-gray-700);
  font-weight: 650;
}

.preview-row span {
  padding: 0.58rem 0.85rem;
}

.interest-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.choice-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 4.25rem;
  padding: 0.9rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 16px;
  background: #fbfdff;
  color: var(--color-gray-800);
  font-size: 0.98rem;
  font-weight: 700;
  text-align: left;
  transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
}

.choice-card:hover,
.goal-chip:hover,
.pill-choice:hover {
  transform: translateY(-1px);
  border-color: rgba(99, 102, 241, 0.42);
}

.choice-card.selected,
.goal-chip.selected,
.pill-choice.selected {
  border-color: rgba(99, 102, 241, 0.6);
  background: var(--color-primary-bg);
  color: #3730a3;
}

.choice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.35rem;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 12px;
  background: #ffffff;
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 800;
  border: 1px solid rgba(99, 102, 241, 0.14);
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.4rem;
}

.field-block label {
  color: var(--color-gray-700);
  font-weight: 700;
}

.pill-choice,
.goal-chip {
  padding: 0.72rem 0.95rem;
  font-size: 0.95rem;
  transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
}

.soft-select {
  width: 100%;
  min-height: 3.15rem;
  padding: 0 1rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 14px;
  background: #fbfdff;
  color: var(--color-gray-800);
  font: inherit;
  font-weight: 650;
}

.soft-select:focus {
  outline: 2px solid var(--color-primary-bg);
  border-color: var(--color-primary);
}

.goal-grid {
  margin-top: 0.35rem;
}

.step-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  margin-top: auto;
  padding-top: 1.5rem;
}

.primary-action,
.secondary-action {
  min-height: 3rem;
  border-radius: 999px;
  padding: 0 1.25rem;
  font-weight: 750;
  font-size: 0.98rem;
  transition: transform var(--transition-fast), opacity var(--transition-fast), background var(--transition-fast);
}

.primary-action {
  background: var(--color-primary);
  color: #ffffff;
}

.primary-action:hover:not(:disabled),
.secondary-action:hover {
  transform: translateY(-1px);
}

.primary-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.secondary-action {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.ready-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.6rem;
  height: 3.6rem;
  margin-bottom: 1rem;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  font-size: 1.8rem;
  font-weight: 800;
}

.step-enter-active,
.step-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.step-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@media (max-width: 640px) {
  .onboarding-page {
    padding: calc(var(--navbar-height) + 0.6rem) 0.75rem 1rem;
  }

  .onboarding-shell {
    min-height: calc(100vh - var(--navbar-height) - 1.6rem);
    padding: 0.75rem;
    border-radius: 18px;
  }

  .step-panel {
    min-height: calc(100vh - var(--navbar-height) - 7rem);
    padding: 1.05rem;
    border-radius: 14px;
  }

  .interest-grid {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }

  .choice-card {
    min-height: 3.8rem;
    border-radius: 14px;
  }

  .step-actions {
    position: sticky;
    bottom: 0;
    margin-inline: -1.05rem;
    padding: 1rem 1.05rem 0.35rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), #ffffff 32%);
  }

  .primary-action,
  .secondary-action {
    flex: 1;
    padding-inline: 0.75rem;
  }
}
</style>
