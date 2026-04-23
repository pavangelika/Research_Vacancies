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

runTest('renderMyResponsesCalendarContent prefers loaded responses cache before fetchResponsesListFromApi fallback', () => {
  const marker = 'function renderMyResponsesCalendarContent(parentRole, options) {';
  const start = UI_SOURCE.indexOf(marker);
  assert.notEqual(start, -1, 'renderMyResponsesCalendarContent not found');

  const cacheCheck = UI_SOURCE.indexOf('Array.isArray(uiState.my_responses_cache) && uiState.my_responses_cache.length', start);
  const listFetch = UI_SOURCE.indexOf('fetchResponsesListFromApi(parentRole)', start);

  assert.notEqual(listFetch, -1, 'expected responses list fetch in calendar flow');
  assert.notEqual(cacheCheck, -1, 'expected cache guard in calendar flow');
  assert.ok(cacheCheck < listFetch, 'calendar flow should consult loaded cache before fetching list again');
});
