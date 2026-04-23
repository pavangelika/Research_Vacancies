const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const UI_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js');
const UI_SOURCE = fs.readFileSync(UI_SOURCE_PATH, 'utf8');

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('renderMyResponsesContent prefers loaded responses cache before fetchResponsesListFromApi fallback', () => {
  const marker = 'function renderMyResponsesContent(parentRole) {';
  const start = UI_SOURCE.indexOf(marker);
  assert.notEqual(start, -1, 'renderMyResponsesContent not found');

  const cacheCheck = UI_SOURCE.indexOf('Array.isArray(uiState.my_responses_cache) && uiState.my_responses_cache.length', start);
  const listFetch = UI_SOURCE.indexOf('fetchResponsesListFromApi(parentRole)', start);

  assert.notEqual(listFetch, -1, 'expected responses list fetch in my-responses flow');
  assert.notEqual(cacheCheck, -1, 'expected cache guard in my-responses flow');
  assert.ok(cacheCheck < listFetch, 'my-responses flow should consult loaded cache before fetching list again');
});

runTest('renderMyResponsesContent reuses inflight responses request instead of starting a duplicate fetch', () => {
  const marker = 'function renderMyResponsesContent(parentRole) {';
  const start = UI_SOURCE.indexOf(marker);
  assert.notEqual(start, -1, 'renderMyResponsesContent not found');

  const inflightCheck = UI_SOURCE.indexOf('block._responsesRequestPromise', start);
  const listFetch = UI_SOURCE.indexOf('fetchResponsesListFromApi(parentRole)', start);

  assert.notEqual(inflightCheck, -1, 'expected inflight request guard in my-responses flow');
  assert.notEqual(listFetch, -1, 'expected responses list fetch in my-responses flow');
  assert.ok(inflightCheck < listFetch, 'my-responses flow should guard duplicate inflight fetches before requesting responses again');
});
