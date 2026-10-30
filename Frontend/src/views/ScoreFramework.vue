<template>
  <main class="score-framework-page">
    <section class="framework-hero">
      <router-link class="back-link" to="/events">← Events</router-link>
      <p class="eyebrow">Evaluation Framework</p>
      <h1>How We Assign This Score</h1>
      <p>
        Our event score is designed to measure whether a tech event creates real value for builders,
        engineers, researchers, and curious thinkers.
      </p>
    </section>

    <section class="framework-card">
      <div class="section-header">
        <h2>Scoring Logic</h2>
        <span>Total = 100%</span>
      </div>

      <div class="framework-table">
        <div class="table-row table-head">
          <span>Dimension</span>
          <span>Weight</span>
          <span>Why</span>
        </div>
        <div v-for="item in dimensions" :key="item.title" class="table-row">
          <strong>{{ item.title }}</strong>
          <span>{{ item.weight }}</span>
          <p>{{ item.why }}</p>
        </div>
      </div>
    </section>

    <section class="dimension-list">
      <article v-for="item in dimensions" :key="item.title" class="dimension-card">
        <div class="dimension-title-row">
          <h2>{{ item.title }} — {{ item.weight }}</h2>
          <span>{{ item.code }}</span>
        </div>
        <div class="question-block">
          <h3>Core Question</h3>
          <p>“{{ item.question }}”</p>
        </div>
        <div class="why-block">
          <h3>Why</h3>
          <p>{{ item.detailWhy }}</p>
        </div>
        <div class="score-columns">
          <div>
            <h3>High Score (8–10)</h3>
            <ul>
              <li v-for="point in item.high" :key="point">{{ point }}</li>
            </ul>
          </div>
          <div>
            <h3>Low Score (1–4)</h3>
            <ul>
              <li v-for="point in item.low" :key="point">{{ point }}</li>
            </ul>
          </div>
        </div>
      </article>
    </section>

    <section class="framework-card">
      <div class="section-header">
        <h2>Formula</h2>
      </div>
      <p class="formula">
        Final Score = ((K × 0.35) + (N × 0.25) + (T × 0.25) + (C × 0.15)) ÷ 2
      </p>
      <div class="legend-grid">
        <span>K = Knowledge and Skill Growth</span>
        <span>N = Networking Quality</span>
        <span>T = Time-to-Value Efficiency</span>
        <span>C = Organizer Credibility</span>
      </div>
      <p class="formula-note">
        Each dimension is scored out of 10. Divide the weighted average by 2 for a final score out of 5.0, displayed to one decimal place.
      </p>
    </section>

    <section class="framework-card">
      <div class="section-header">
        <h2>Star Conversion</h2>
      </div>
      <div class="star-table">
        <div v-for="row in starRows" :key="row.score" class="star-row">
          <span>{{ row.score }}</span>
          <strong>{{ row.rating }}</strong>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import framework from '../../../shared/event-evaluation.json';

const dimensions = framework.dimensions.map(item => ({ ...item, weight: `${Math.round(item.weight * 100)}%` }));
const starRows = framework.starThresholds.map((row, index, rows) => ({
  score: index === 0
    ? `${(row.minimum / 20).toFixed(1)}–5.0`
    : `${row.minimum / 20}–<${rows[index - 1].minimum / 20}`,
  rating: '★'.repeat(row.stars),
}));
</script>

<style scoped>
.score-framework-page {
  min-height: 100vh;
  padding: calc(var(--navbar-height) + 34px) 30px 72px;
  background: #f8fafc;
  color: #111827;
}

.framework-hero,
.framework-card,
.dimension-card {
  max-width: 1040px;
  margin: 0 auto 24px;
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 24px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.framework-hero {
  padding: 42px;
}

.back-link {
  display: inline-flex;
  margin-bottom: 24px;
  color: #6c48d1;
  font-weight: 800;
  text-decoration: none;
}

.eyebrow {
  margin: 0 0 10px;
  color: #6c48d1;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.framework-hero h1 {
  margin: 0;
  font-size: 44px;
  line-height: 1.04;
  letter-spacing: 0;
}

.framework-hero > p:last-child {
  max-width: 760px;
  margin: 18px 0 0;
  color: #4b5563;
  font-size: 18px;
  line-height: 1.55;
}

.framework-card,
.dimension-card {
  padding: 30px;
}

.section-header,
.dimension-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

h2,
h3,
p {
  margin-top: 0;
}

h2 {
  margin-bottom: 0;
  font-size: 24px;
}

h3 {
  margin-bottom: 8px;
  font-size: 14px;
  color: #6c48d1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.section-header span,
.dimension-title-row span {
  padding: 8px 12px;
  border-radius: 999px;
  color: #6c48d1;
  background: rgba(108, 72, 209, 0.1);
  font-weight: 800;
  white-space: nowrap;
}

.framework-table {
  border: 1px solid #e8eaf0;
  border-radius: 18px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.1fr) 110px minmax(0, 1.6fr);
  gap: 18px;
  padding: 16px 18px;
  border-top: 1px solid #eef2f7;
  align-items: center;
}

.table-row:first-child {
  border-top: 0;
}

.table-head {
  color: #6c48d1;
  background: rgba(108, 72, 209, 0.06);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.table-row p {
  margin: 0;
  color: #4b5563;
  line-height: 1.45;
}

.dimension-list {
  max-width: 1040px;
  margin: 0 auto;
}

.question-block p,
.why-block p,
.formula-note {
  color: #4b5563;
  line-height: 1.6;
}

.score-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 20px;
}

.score-columns > div {
  padding: 18px;
  border: 1px solid #e8eaf0;
  border-radius: 18px;
  background: #f8fafc;
}

ul {
  margin: 0;
  padding-left: 18px;
  color: #374151;
  line-height: 1.65;
}

.formula {
  margin: 0 0 16px;
  padding: 18px;
  border-radius: 16px;
  color: #111827;
  background: rgba(108, 72, 209, 0.07);
  font-size: 18px;
  font-weight: 800;
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  color: #4b5563;
}

.star-table {
  display: grid;
  gap: 10px;
}

.star-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
}

.star-row strong {
  color: #facc15;
  letter-spacing: 0.08em;
}

@media (max-width: 720px) {
  .score-framework-page {
    padding: calc(var(--navbar-height) + 20px) 16px 48px;
  }

  .framework-hero,
  .framework-card,
  .dimension-card {
    padding: 22px;
    border-radius: 20px;
  }

  .framework-hero h1 {
    font-size: 32px;
  }

  .table-row,
  .score-columns,
  .legend-grid {
    grid-template-columns: 1fr;
  }
}
</style>
