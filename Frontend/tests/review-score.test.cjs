const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/reviewScore.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const mod = { exports: {} };
new Function('exports', outputText)(mod.exports);
const { normalizeReviewScore, parseReviewScore } = mod.exports;

test('percentage and legacy scores convert proportionally rather than becoming 5', () => {
  assert.equal(normalizeReviewScore(86), 4.3);
  assert.equal(normalizeReviewScore(100), 5);
  assert.equal(normalizeReviewScore(40), 2);
  assert.equal(normalizeReviewScore(0), 0);
  assert.equal(normalizeReviewScore(4.3), 4.3);
  assert.equal(normalizeReviewScore(4.36), 4.4);
});

test('pasted ratings respect explicit denominators, including low percentage scores', () => {
  assert.equal(parseReviewScore('⭐ 86/100'), 4.3);
  assert.equal(parseReviewScore('86%'), 4.3);
  assert.equal(parseReviewScore('4/100'), 0.2);
  assert.equal(parseReviewScore('4.3 / 5.0'), 4.3);
  assert.equal(parseReviewScore('0/5'), 0);
  assert.equal(parseReviewScore('4/50'), null);
  assert.equal(parseReviewScore('No rating'), null);
});


test('AI and legacy reviews display out of five, including zero and missing ratings', () => {
  const { getReviewScore } = mod.exports;
  assert.equal(getReviewScore({ score100: 86, score: 4.3 }), 4.3);
  assert.equal(getReviewScore({ score100: 4 }), 0.2);
  assert.equal(getReviewScore({ score: 4.3 }), 4.3);
  assert.equal(getReviewScore({ score: 86 }), 4.3);
  assert.equal(getReviewScore({ score100: 0 }), 0);
  assert.equal(getReviewScore({ score: 0 }), 0);
  assert.equal(getReviewScore(null), null);
  assert.equal(getReviewScore({ score: NaN }), null);
});
