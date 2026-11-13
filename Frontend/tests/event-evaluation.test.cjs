const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function loadUtility(name) {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils', `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('require', 'exports', outputText)(name => loadUtility(path.basename(name)), mod.exports);
  return mod.exports;
}
const { getEventValueDisplay } = loadUtility('eventEvaluation');

test('server-calculated review feeds the public card with the same category, curved total, confidence, and evidence', async () => {
  const { calculateReview, framework } = await import('../../Cloudflare/src/event-scoring.mjs');
  const category = framework.categories.find(item => item.id === 'social');
  const review = calculateReview({
    evaluationCategory: 'social', classificationReason: 'The agenda is recreational.',
    categoryEvaluations: [{ category: 'social', dimensions: Object.fromEntries(category.dimensions.map((dimension, index) => [dimension.code, {
      criteria: Object.fromEntries(dimension.criteria.map(criterion => [criterion.id, {
        rating: index === 0 ? 3 : 1, evidence: index === 0 ? 'Facilitated group activities.' : 'Recreation arrangements are unspecified.',
      }])),
    }])) }],
    sentence: 'A social gathering with some details still unknown.', confidence: 'medium',
    confidenceExplanation: 'The social program is described; recreation arrangements are not.',
    bestFor: 'Students seeking friendships.', scoringBasis: 'Facilitated group activities.',
    limitations: 'Comfort and recreation arrangements are unspecified.',
  });
  const display = getEventValueDisplay(review);
  assert.equal(display.assessments[0].category, 'Social');
  assert.equal(display.assessments[0].score, '4.2/5');
  assert.equal(display.assessments[0].coverage, '');
  assert.deepEqual(display.assessments[0].dimensions.map(d => d.score), ['4.5/5', '3.5/5']);
  assert.equal(display.scoringBasis, 'Facilitated group activities.');
  assert.equal(display.bestFor, 'Students seeking friendships.');
});

test('Growth evaluation displays five-point scores and the supplied audience, evidence, and limits', () => {
  const display = getEventValueDisplay({
    frameworkVersion: 'event-value-v2', evaluationCategory: 'growth', score100: 78, confidence: 'high',
    dimensions: {
      opportunitiesDirection: { score: 83, evidence: 'Detailed agenda.' },
      meaningfulConnections: { score: 67, evidence: 'Small-group discussions.' },
      knowledgeInsight: { score: 83, evidence: 'Follow-up project opportunities.' },
    },
    bestFor: 'Undergraduates exploring research directions',
    limitations: 'Limited time for individual conversations',
  });
  assert.equal(display.assessments[0].category, 'Growth');
  assert.equal(display.assessments[0].score, '4.6/5');
  assert.deepEqual(display.assessments[0].dimensions.map(d => d.score), ['4.7/5', '4.3/5', '4.7/5']);
  assert.equal(display.confidence, 'High');
  assert.equal(display.bestFor, 'Undergraduates exploring research directions');
  assert.match(display.scoringBasis, /Small-group discussions/);
  assert.equal(display.limitations, 'Limited time for individual conversations');
});

test('saved ranges require reassessment instead of a fabricated midpoint total', () => {
  const assessment = getEventValueDisplay({
    evaluationCategory: 'social', score100: 99, scoreRange: { lower: 48, upper: 84 },
    informationCoverage: 0.64,
    dimensions: {
      socialConnection: { score: 0, evidence: 'No interaction.' },
      relaxationWellbeing: { score: null, evidence: '' },
    },
  }).assessments[0];
  assert.equal(assessment.score, 'Score pending');
  assert.equal(assessment.coverage, '64% information coverage');
  assert.deepEqual(assessment.dimensions.map(d => d.score), ['3.0/5', 'Unknown']);
});

test('Hybrid assessments remain separate and missing fields do not inherit sample content', () => {
  const display = getEventValueDisplay({ categoryEvaluations: [
    { category: 'growth', score100: 78 }, { category: 'social', score100: 64 },
  ] });
  assert.deepEqual(display.assessments.map(a => [a.category, a.score]), [['Growth', '3.9/5'], ['Social', '3.2/5']]);
  assert.equal(display.bestFor, 'Not specified');
  assert.equal(display.limitations, 'Not specified');
  assert.equal(getEventValueDisplay(null).assessments[0].score, 'Score pending');
  assert.deepEqual(getEventValueDisplay({ evaluationCategory: 'hybrid', score100: 90 }).assessments.map(a => a.score), ['Score pending', 'Score pending']);
  assert.equal(getEventValueDisplay({ frameworkVersion: 'event-value-v4', score100: 90, dimensions: { socialConnection: { score: null, evidence: '' } } }).assessments[0].score, '4.5/5');
});

test('existing scores retain their value and dimension meanings without an invented category', () => {
  const display = getEventValueDisplay({ frameworkVersion: 'tech-event-v1', score100: 86,
    dimensions: { K: { score: 8.5, evidence: 'Detailed content.' } },
  });
  assert.equal(display.assessments[0].score, '4.3/5');
  assert.equal(display.assessments[0].category, 'Category pending');
  assert.deepEqual(display.assessments[0].dimensions[0], { label: 'Knowledge and Skill Growth', score: '4.3/5' });
});

test('complete saved scores curve once; incomplete saved scores require reassessment', () => {
  for (const [version, score, expected] of [
    ['event-value-v2', 0, '3.0/5'], ['event-value-v2', 50, '4.0/5'],
    ['event-value-v2', 100, '5.0/5'], ['event-value-v4', 80, '4.0/5'],
  ]) assert.equal(getEventValueDisplay({ frameworkVersion: version, evaluationCategory: 'growth', score100: score }).assessments[0].score, expected);
  assert.equal(getEventValueDisplay({ frameworkVersion: 'event-value-v2', scoreRange: { lower: 0, upper: 100 }, informationCoverage: 0 }).assessments[0].score, 'Score pending');
  assert.equal(getEventValueDisplay({ frameworkVersion: 'event-value-v2', scoreRange: { lower: 19, upper: 81 }, informationCoverage: 0.38, confidence: 'low' }).assessments[0].score, 'Score pending');
});

test('old neutral-filled scores do not remain displayed as 80', () => {
  assert.equal(getEventValueDisplay({ frameworkVersion: 'event-value-v3', evaluationCategory: 'growth', score100: 80, informationCoverage: 0.38 }).assessments[0].score, 'Score pending');
});

test('the requested card maps total and dimensions to five points without changing confidence', () => {
  const review = { frameworkVersion: 'event-value-v4', evaluationCategory: 'social', score100: 89, confidence: 'medium', dimensions: {
    socialConnection: { score: 67, evidence: 'Shared activities.' },
    relaxationWellbeing: { score: 83, evidence: 'Recreational program.' },
  } };
  const display = getEventValueDisplay(review);
  assert.equal(display.assessments[0].score, '4.5/5');
  assert.deepEqual(display.assessments[0].dimensions.map(d => d.score), ['4.3/5', '4.7/5']);
  assert.equal(display.confidence, 'Medium');
  assert.equal(review.score100, 89);
});

test('the total and dimensions share the same curve and agree with Social weights', () => {
  const display = getEventValueDisplay({ frameworkVersion: 'event-value-v4', evaluationCategory: 'social', score100: 86, dimensions: {
    relaxationWellbeing: { score: 75, evidence: 'Recreational activities.' },
    socialConnection: { score: 58, evidence: 'Some opportunities for social interaction.' },
  } }).assessments[0];
  assert.equal(display.score, '4.3/5');
  assert.deepEqual(display.dimensions.map(d => d.score), ['4.5/5', '4.2/5']);
  const weighted = 4.5 * 0.36 + 4.2 * 0.64;
  assert.equal(Math.round(weighted * 10) / 10, parseFloat(display.score));
});
