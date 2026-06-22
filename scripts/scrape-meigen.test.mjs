import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapModel, GRADIENTS, gradientForId, aspectRatio, makeIdSequencer, maxPromptNum,
} from './scrape-meigen.mjs';

test('mapModel: known models', () => {
  assert.deepEqual(mapModel('GPT Image'), { model: 'ChatGPT', tab: 'ChatGPT', category: 'ChatGPT', unmapped: false });
  assert.deepEqual(mapModel('Nanobanana Pro'), { model: 'Nanobanana Pro', tab: 'Nanobanana', category: 'Nanobanana', unmapped: false });
  assert.deepEqual(mapModel('Nanobanana 2'), { model: 'Nanobanana Pro', tab: 'Nanobanana', category: 'Nanobanana', unmapped: false });
  assert.deepEqual(mapModel('Midjourney V8.1'), { model: 'Midjourney', tab: 'Midjourney', category: 'Midjourney', unmapped: false });
  assert.deepEqual(mapModel('Seedance 2.0'), { model: 'Seedance 2.0', tab: 'Seedance', category: 'Seedance', unmapped: false });
  assert.deepEqual(mapModel('Flux'), { model: 'Flux', tab: 'Flux', category: 'Flux', unmapped: false });
  assert.deepEqual(mapModel('Gemini Omni'), { model: 'Gemini', tab: 'Gemini', category: 'Gemini', unmapped: false });
});

test('mapModel: unknown falls back to ChatGPT and flags unmapped', () => {
  assert.deepEqual(mapModel('Happy Horse 1.0'), { model: 'ChatGPT', tab: 'ChatGPT', category: 'ChatGPT', unmapped: true });
  assert.deepEqual(mapModel(''), { model: 'ChatGPT', tab: 'ChatGPT', category: 'ChatGPT', unmapped: true });
  assert.deepEqual(mapModel(undefined), { model: 'ChatGPT', tab: 'ChatGPT', category: 'ChatGPT', unmapped: true });
});

test('gradientForId: deterministic and within palette', () => {
  const g1 = gradientForId('2068539170935738802');
  const g2 = gradientForId('2068539170935738802');
  assert.deepEqual(g1, g2);
  assert.ok(GRADIENTS.some(([f, t]) => f === g1.gradientFrom && t === g1.gradientTo));
  assert.equal(GRADIENTS.length, 12);
});

test('aspectRatio', () => {
  assert.equal(aspectRatio(676, 1200), '676/1200');
  assert.equal(aspectRatio(undefined, 1200), '4/3');
  assert.equal(aspectRatio(676, 0), '4/3');
});

test('maxPromptNum + makeIdSequencer', () => {
  assert.equal(maxPromptNum(['p0001', 'p1977', 'pXYZ', 'p0500']), 1977);
  assert.equal(maxPromptNum([]), 0);
  const next = makeIdSequencer(1977);
  assert.equal(next(), 'p1978');
  assert.equal(next(), 'p1979');
});
