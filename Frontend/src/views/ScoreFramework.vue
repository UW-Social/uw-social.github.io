<template>
  <main class="score-framework-page">
    <section class="framework-hero">
      <router-link class="back-link" :to="backTarget">← {{ eventId ? 'Back to event' : 'Events' }}</router-link>
      <p class="eyebrow">Evaluation Scheme</p>
      <h1>How We Evaluate Events</h1>
      <p class="hero-description">Understand the value an event may offer its intended audience, using consistent criteria and verifiable information.</p>
      <p class="muted">Scores estimate potential value before you attend. They do not guarantee the actual experience.</p>
      <nav class="section-nav" aria-label="Evaluation guide sections">
        <a v-for="section in sections" :key="section.id" :href="`#${section.id}`" @click.prevent="scrollToSection(section.id)">{{ section.label }}</a>
      </nav>
    </section>

    <section id="categories" class="framework-card">
      <div class="section-header"><h2>1. Start with the event’s purpose</h2></div>
      <p class="section-intro">Classify by purpose and agenda, rather than organizer or subject. A CS club’s game night is a Social event.</p>
      <div class="category-grid">
        <article v-for="category in categories" :key="category.title" class="inset-card">
          <h3>{{ category.title }}</h3>
          <p>{{ category.purpose }}</p>
          <p class="muted">{{ category.examples }}</p>
        </article>
      </div>
      <p class="note">For Hybrid events, calculate both category scores separately. If the purpose is unclear, mark the event as <strong>Needs clarification</strong>.</p>
    </section>

    <section id="dimensions" class="framework-card">
      <div class="section-header"><h2>2. Evaluate the relevant dimensions</h2><span>100% per category</span></div>
      <p class="section-intro">Each dimension has three equally weighted criteria. Rate each criterion separately using the evidence standards below.</p>
      <article v-for="matrix in matrices" :key="matrix.title" class="matrix-block">
        <h3 class="matrix-title">{{ matrix.title }}</h3>
        <div class="dimension-list">
          <div v-for="dimension in matrix.dimensions" :key="dimension.title" class="dimension-row">
            <div class="dimension-heading"><h4>{{ dimension.title }}</h4><span class="weight">{{ dimension.weight }}%</span></div>
            <ol><li v-for="criterion in dimension.criteria" :key="criterion">{{ criterion }}</li></ol>
          </div>
        </div>
      </article>
      <p class="note">These initial weights reflect priorities expressed in seven survey responses. They are provisional: selection frequency is not an exact measure of importance.</p>
    </section>

    <section id="evidence" class="framework-card">
      <div class="section-header"><h2>3. Rate each criterion with evidence</h2><span>0–4 or Unknown</span></div>
      <p class="section-intro">Every rating needs a brief explanation and supporting evidence.</p>
      <div class="rating-list">
        <div v-for="rating in ratings" :key="rating.value" class="rating-row"><strong>{{ rating.value }}</strong><p>{{ rating.meaning }}</p></div>
      </div>
      <details class="example-details">
        <summary>Example: what counts as meaningful interaction?</summary>
        <ul>
          <li><strong>0:</strong> Explicitly one-way viewing with no interaction.</li>
          <li><strong>2:</strong> A scheduled Q&amp;A or discussion.</li>
          <li><strong>4:</strong> Structured interaction with enough time, facilitation, or group arrangements for deeper exchanges.</li>
          <li><strong>Unknown:</strong> Only a promotional claim such as “excellent networking.”</li>
        </ul>
      </details>
      <p class="note">This guide summarizes the framework. Consistent operational scoring also requires the criterion-specific anchors in the full matrix.</p>
    </section>

    <section id="calculation" class="framework-card">
      <div class="section-header"><h2>4. Calculate and read the score</h2><span>Out of 100</span></div>
      <p class="formula">Dimension score = (Average criterion rating ÷ 4) × 100</p>
      <p class="formula">Overall score = Sum of (Dimension score × Dimension weight)</p>
      <p class="section-intro">Use weights as decimals, such as 0.40 for 40%. Calculate at full precision, then round the displayed total to the nearest integer.</p>
      <div class="inset-card worked-example">
        <h3>Example · Learning &amp; Growth</h3>
        <p>Dimension scores of 80 for Opportunities &amp; Direction, 60 for Meaningful Connections, and 100 for Knowledge &amp; Insight give:</p>
        <p class="example-result">(80 × 0.40) + (60 × 0.33) + (100 × 0.27) = 78.8 → <strong>79 / 100</strong></p>
      </div>
      <h3 class="subheading">When information is missing</h3>
      <p class="section-intro">If any criterion is Unknown, show a <strong>possible score range and information coverage</strong> instead of a definitive total. Missing information must not automatically receive zero.</p>
      <ul>
        <li><strong>Lower bound:</strong> use 0 for each unknown criterion.</li>
        <li><strong>Upper bound:</strong> use 4 for each unknown criterion.</li>
        <li><strong>Information coverage:</strong> the proportion of total scoring weight supported by known ratings.</li>
      </ul>
      <div class="inset-card worked-example">
        <h3>Example · An incomplete Social evaluation</h3>
        <p>If all Social Connection criteria score 3 and all Relaxation &amp; Well-being criteria are unknown, show <strong>48–84 / 100 · 64% information coverage</strong>.</p>
      </div>
      <p class="note">The range gives mathematical bounds. It is not an estimate of missing ratings or a statistical confidence interval.</p>
    </section>

    <section id="fairness" class="framework-card">
      <div class="section-header"><h2>5. Keep comparisons fair</h2></div>
      <ul class="fairness-list">
        <li><strong>Compare within the same category.</strong> Growth and Social scores measure different benefits. Show dimension scores alongside the total.</li>
        <li><strong>Apply the same criteria across subjects.</strong> CS and Business events can earn the same score for comparable value to their respective audiences.</li>
        <li><strong>Reward evidence of value.</strong> Prestige, celebrity speakers, popularity, technical difficulty, price, and size do not earn points on their own.</li>
        <li><strong>Consider diversity where it contributes.</strong> It should meaningfully support relevant perspectives, interaction, or inclusion.</li>
        <li><strong>Keep personal fit separate.</strong> Personal relevance, cost, travel, scheduling, and eligibility sit outside the core value score.</li>
      </ul>
      <p class="note">Use the score to understand both how much value an event may offer and whether that value matches what you are looking for.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import framework from '../../../shared/event-evaluation.json';
import { useRoute } from 'vue-router';

const route = useRoute();
const eventId = computed(() => typeof route.query.event === 'string' ? route.query.event : '');
const backTarget = computed(() => eventId.value ? { name: 'EventDetail', params: { id: eventId.value } } : '/events');
const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ block: 'start' });
const sections = [
  { id: 'categories', label: 'Event categories' },
  { id: 'dimensions', label: 'Dimensions & weights' },
  { id: 'evidence', label: 'Rating standards' },
  { id: 'calculation', label: 'Score calculation' },
  { id: 'fairness', label: 'Fair comparisons' },
];
const categories = [
  { title: 'Learning & Growth', purpose: 'Develop knowledge, skills, direction, or professional and academic connections.', examples: 'Research talks, business workshops, career events.' },
  { title: 'Social & Recreation', purpose: 'Build friendships, enjoy shared experiences, or recharge.', examples: 'Picnics, movie nights, board games, hikes.' },
  { title: 'Hybrid', purpose: 'Provide substantial, distinct experiences in both categories.', examples: 'A workshop followed by an equally substantial social program.' },
];
const matrices = framework.categories.map(category => ({
  title: category.title,
  dimensions: category.dimensions.map(dimension => ({
    title: dimension.title,
    weight: Math.round(dimension.weight * 100),
    criteria: dimension.criteria.map(criterion => criterion.description),
  })),
}));
const ratings = framework.ratingStandards.map(standard => ({
  value: standard.rating === null ? 'Unknown' : String(standard.rating),
  meaning: standard.meaning,
}));
</script>

<style scoped>
.score-framework-page {
  min-height: 100vh;
  padding: calc(var(--navbar-height) + 34px) 30px 72px;
  background: #f8fafc;
  color: #111827;
  line-height: 1.65;
}
.framework-hero, .framework-card {
  max-width: 1040px;
  box-sizing: border-box;
  margin: 0 auto 24px;
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 24px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.framework-hero { padding: 42px; }
.framework-card { padding: 30px; scroll-margin-top: calc(var(--navbar-height) + 20px); }
.back-link { display: inline-flex; margin-bottom: 24px; color: #6c48d1; font-weight: 800; text-decoration: none; }
.eyebrow { margin: 0 0 10px; color: #6c48d1; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
h1 { margin: 0; font-size: 44px; line-height: 1.15; }
h2 { margin: 0; font-size: 24px; line-height: 1.35; }
h3, h4 { margin: 0; }
p { margin: 0 0 12px; }
p:last-child { margin-bottom: 0; }
.hero-description { max-width: 760px; margin-top: 18px; font-size: 18px; color: #4b5563; }
.muted, .section-intro { color: #4b5563; }
.section-intro { margin-bottom: 20px; }
.section-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 20px; }
.section-header > span, .weight { padding: 6px 12px; border-radius: 999px; color: #6c48d1; background: rgba(108, 72, 209, 0.1); font-size: 14px; font-weight: 800; white-space: nowrap; }
.section-nav { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.section-nav a { padding: 8px 14px; border: 1px solid #e8eaf0; border-radius: 999px; color: #6c48d1; text-decoration: none; font-size: 14px; font-weight: 600; }
.section-nav a:hover { background: rgba(108, 72, 209, 0.07); }
a:focus-visible, summary:focus-visible { outline: 3px solid #6c48d1; outline-offset: 4px; }
.category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.inset-card { padding: 20px; border: 1px solid #e8eaf0; border-radius: 18px; background: #f8fafc; }
.inset-card h3 { color: #6c48d1; font-size: 16px; margin-bottom: 10px; }
.note { margin: 20px 0 0; padding-left: 16px; border-left: 3px solid #d6caef; color: #4b5563; font-size: 14px; }
.matrix-block + .matrix-block { margin-top: 28px; }
.matrix-title { margin-bottom: 14px; color: #6c48d1; font-size: 18px; }
.dimension-list, .rating-list { overflow: hidden; border: 1px solid #e8eaf0; border-radius: 18px; }
.dimension-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.8fr); gap: 24px; padding: 20px; }
.dimension-row + .dimension-row, .rating-row + .rating-row { border-top: 1px solid #eef2f7; }
.dimension-heading { display: flex; align-items: flex-start; gap: 12px; justify-content: space-between; }
h4 { font-size: 16px; }
ol, ul { margin: 0; padding-left: 22px; color: #374151; }
li + li { margin-top: 6px; }
.rating-row { display: grid; grid-template-columns: 90px minmax(0, 1fr); gap: 18px; padding: 14px 20px; align-items: baseline; }
.rating-row strong { color: #6c48d1; }
.rating-row p { margin: 0; color: #4b5563; }
.example-details { margin-top: 20px; padding: 18px; border-radius: 16px; background: #f8fafc; }
summary { cursor: pointer; color: #6c48d1; font-weight: 700; }
.example-details ul { margin-top: 14px; }
.formula { padding: 18px; border-radius: 16px; background: rgba(108, 72, 209, 0.07); font-size: 17px; font-weight: 700; overflow-wrap: anywhere; }
.worked-example { margin-top: 20px; }
.example-result { color: #6c48d1; }
.subheading { margin: 26px 0 12px; font-size: 18px; }
.fairness-list li + li { margin-top: 14px; }
@media (max-width: 720px) {
  .score-framework-page { padding: calc(var(--navbar-height) + 20px) 16px 48px; }
  .framework-hero, .framework-card { padding: 22px; border-radius: 20px; }
  h1 { font-size: 32px; }
  h2 { font-size: 22px; }
  .category-grid, .dimension-row { grid-template-columns: 1fr; }
  .dimension-row { gap: 12px; padding: 18px; }
  .section-header { align-items: flex-start; flex-direction: column; gap: 12px; }
  .rating-row { grid-template-columns: 70px minmax(0, 1fr); gap: 10px; padding: 14px; }
}
</style>
