import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractProvidedEnglishCopy } from '../src/event-copy.mjs';

const document = await readFile(new URL('./fixtures/aws-kickoff.md', import.meta.url), 'utf8');

test('bilingual event preserves complete English copy without importing human ratings', () => {
  const copy = extractProvidedEnglishCopy(document);
  const intro = document.split('**English introduction (150–200 words):**\\\n')[1].split('\n\n**')[0];
  assert.ok(intro.length > 1200);
  assert.ok(copy.description.startsWith(`${intro}\n\nHighlights: `));
  assert.match(copy.description, /Best For: UW students interested in AWS/);
  assert.match(copy.description, /Notes: The event is primarily social/);
  assert.doesNotMatch(copy.description, /Rating:|efficient way to meet aligned students/);
  assert.doesNotMatch(copy.description, /[\u3400-\u9fff]|Come and join|\\\n/);
  assert.equal(copy.reviewSentence, undefined);
});

test('unlabelled documents leave AI extraction intact', () => {
  assert.deepEqual(extractProvidedEnglishCopy('Workshop at UW. Join us.'), {});
});

test('Markdown hard breaks are removed and human review sections are ignored', () => {
  const copy = extractProvidedEnglishCopy('**English introduction:**\\\nFirst paragraph.\\\nSecond line.\n\n**综合评分 / Rating：**\n中文：中文评价。\\\nEnglish: Helpful for networking.');
  assert.match(copy.description, /^First paragraph.\nSecond line./);
  assert.equal(copy.reviewSentence, undefined);
  assert.doesNotMatch(copy.description, /Helpful for networking/);
});
