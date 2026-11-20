<template>
  <section class="evaluation-card" aria-labelledby="event-value-title">
    <h2 id="event-value-title">Expected Event Value</h2>
    <div v-for="assessment in display.assessments" :key="assessment.category" class="assessment">
      <p class="value-score">{{ assessment.category }} · {{ assessment.score }}</p>
      <ul v-if="assessment.dimensions.length" class="dimension-scores" aria-label="Dimension scores out of 100">
        <li v-for="dimension in assessment.dimensions" :key="dimension.label">
          {{ dimension.label }} <strong>{{ dimension.score }}</strong>
        </li>
      </ul>
      <p v-if="assessment.coverage" class="coverage">{{ assessment.coverage }}</p>
    </div>
    <p v-if="display.classificationReason" class="classification-reason">{{ display.classificationReason }}</p>
    <dl>
      <div>
        <dt>Confidence</dt>
        <dd>{{ display.confidence }}<template v-if="display.confidenceExplanation"> — {{ display.confidenceExplanation }}</template></dd>
        <p class="confidence-help">How well the available evidence supports this assessment.</p>
      </div>
      <div><dt>Best for</dt><dd>{{ display.bestFor }}</dd></div>
      <div><dt>Scoring basis</dt><dd>{{ display.scoringBasis }}</dd></div>
      <div><dt>Main limitations</dt><dd>{{ display.limitations }}</dd></div>
    </dl>
    <router-link class="scheme-link" :to="{ name: 'ScoreFramework', query: { event: eventId } }">Evaluation Scheme →</router-link>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EventReviewSummary } from '../types/event';
import { getEventValueDisplay } from '../utils/eventEvaluation';

const props = defineProps<{ review?: EventReviewSummary | null; eventId: string }>();
const display = computed(() => getEventValueDisplay(props.review));
</script>

<style scoped>
.evaluation-card {
  padding: 24px;
  color: #fff;
  background: #6841c9;
  border-radius: 24px;
  box-shadow: 0 18px 34px rgba(108, 72, 209, 0.22);
  overflow-wrap: anywhere;
}
h2 { margin: 0 0 20px; color: inherit; font-size: 20px; font-weight: 800; line-height: 1.3; }
.assessment + .assessment { margin-top: 18px; }
.value-score { margin: 0 0 12px; font-size: 24px; font-weight: 800; line-height: 1.35; }
.dimension-scores { display: flex; flex-wrap: wrap; gap: 8px 0; margin: 0; padding: 0; list-style: none; font-size: 13px; line-height: 1.6; }
.dimension-scores li { padding-right: 10px; }
.dimension-scores li + li { padding-left: 10px; border-left: 1px solid rgba(255, 255, 255, 0.35); }
.dimension-scores strong { white-space: nowrap; }
.classification-reason { margin: 14px 0 0; font-size: 13px; line-height: 1.6; }
.coverage { margin: 10px 0 0; font-size: 13px; }
dl { margin: 20px 0 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.22); font-size: 14px; line-height: 1.65; }
dl > div + div { margin-top: 14px; }
dt { display: inline; font-weight: 800; }
dt::after { content: ': '; }
dd { display: inline; margin: 0; }
.confidence-help { margin: 4px 0 0; font-size: 12px; color: #e6ddfa; }
.scheme-link { min-height: 38px; margin-top: 22px; display: flex; align-items: center; justify-content: center; padding: 0 14px; border-radius: 999px; color: #6c48d1; background: #fff; font-size: 13px; font-weight: 800; text-decoration: none; }
.scheme-link:hover { background: #f3edff; }
.scheme-link:focus-visible { outline: 3px solid #fff; outline-offset: 4px; }
@media (max-width: 576px) { .evaluation-card { padding: 20px; } }
</style>
