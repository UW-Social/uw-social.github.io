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

test('server-calculated review feeds the public card with the same category, range, and evidence', async () => {
  const { calculateReview, framework } = await import('../../Cloudflare/src/event-scoring.mjs');
  const category = framework.categories.find(item => item.id === 'social');
  const review = calculateReview({
    evaluationCategory: 'social', classificationReason: 'The agenda is recreational.',
    categoryEvaluations: [{ category: 'social', dimensions: Object.fromEntries(category.dimensions.map((dimension, index) => [dimension.code, {
      criteria: Object.fromEntries(dimension.criteria.map(criterion => [criterion.id, {
        rating: index === 0 ? 3 : null, evidence: index === 0 ? 'Facilitated group activities.' : 'Recreation arrangements are unspecified.',
      }])),
    }])) }],
    sentence: 'A social gathering with some details still unknown.', confidence: 'medium',
    confidenceExplanation: 'The social program is described; recreation arrangements are not.',
    bestFor: 'Students seeking friendships.', scoringBasis: 'Facilitated group activities.',
    limitations: 'Comfort and recreation arrangements are unspecified.',
  });
  const display = getEventValueDisplay(review);
  assert.equal(display.assessments[0].category, 'Social');
  assert.equal(display.assessments[0].score, '48–84/100');
  assert.equal(display.assessments[0].coverage, '64% information coverage');
  assert.deepEqual(display.assessments[0].dimensions.map(d => d.score), ['75', '0–100']);
  assert.equal(display.scoringBasis, 'Facilitated group activities.');
  assert.equal(display.bestFor, 'Students seeking friendships.');
});

test('Growth evaluation uses percentage scores and the supplied audience, evidence, and limits', () => {
  const display = getEventValueDisplay({
    evaluationCategory: 'growth', score100: 78, confidence: 'high',
    dimensions: {
      opportunitiesDirection: { score: 83, evidence: 'Detailed agenda.' },
      meaningfulConnections: { score: 67, evidence: 'Small-group discussions.' },
      knowledgeInsight: { score: 83, evidence: 'Follow-up project opportunities.' },
    },
    bestFor: 'Undergraduates exploring research directions',
    limitations: 'Limited time for individual conversations',
  });
  assert.equal(display.assessments[0].category, 'Growth');
  assert.equal(display.assessments[0].score, '78/100');
  assert.deepEqual(display.assessments[0].dimensions.map(d => d.score), ['83', '67', '83']);
  assert.equal(display.confidence, 'High');
  assert.equal(display.bestFor, 'Undergraduates exploring research directions');
  assert.match(display.scoringBasis, /Small-group discussions/);
  assert.equal(display.limitations, 'Limited time for individual conversations');
});

test('unknown ratings show a range and weighted coverage, preserving zero and Unknown', () => {
  const assessment = getEventValueDisplay({
    evaluationCategory: 'social', score100: 99, scoreRange: { lower: 48, upper: 84 },
    informationCoverage: 0.64,
    dimensions: {
      socialConnection: { score: 0, evidence: 'No interaction.' },
      relaxationWellbeing: { score: null, evidence: '' },
    },
  }).assessments[0];
  assert.equal(assessment.score, '48–84/100');
  assert.equal(assessment.coverage, '64% information coverage');
  assert.deepEqual(assessment.dimensions.map(d => d.score), ['0', 'Unknown']);
});

test('Hybrid assessments remain separate and missing fields do not inherit sample content', () => {
  const display = getEventValueDisplay({ categoryEvaluations: [
    { category: 'growth', score100: 78 }, { category: 'social', score100: 64 },
  ] });
  assert.deepEqual(display.assessments.map(a => [a.category, a.score]), [['Growth', '78/100'], ['Social', '64/100']]);
  assert.equal(display.bestFor, 'Not specified');
  assert.equal(display.limitations, 'Not specified');
  assert.equal(getEventValueDisplay(null).assessments[0].score, 'Score pending');
  assert.deepEqual(getEventValueDisplay({ evaluationCategory: 'hybrid', score100: 90 }).assessments.map(a => a.score), ['Score pending', 'Score pending']);
  assert.equal(getEventValueDisplay({ score100: 90, dimensions: { socialConnection: { score: null, evidence: '' } } }).assessments[0].score, 'Score pending');
});

test('existing scores retain their value and dimension meanings without an invented category', () => {
  const display = getEventValueDisplay({ frameworkVersion: 'tech-event-v1', score100: 86,
    dimensions: { K: { score: 8.5, evidence: 'Detailed content.' } },
  });
  assert.equal(display.assessments[0].score, '86/100');
  assert.equal(display.assessments[0].category, 'Category pending');
  assert.deepEqual(display.assessments[0].dimensions[0], { label: 'Knowledge and Skill Growth', score: '85' });
});
