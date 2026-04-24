const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const EVENTS_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.events.js');
const EVENTS_SOURCE = fs.readFileSync(EVENTS_SOURCE_PATH, 'utf8');

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('syncRoleFilterState preserves roles.exclude when committing role selection', () => {
  const start = EVENTS_SOURCE.indexOf('function syncRoleFilterState()');
  const end = EVENTS_SOURCE.indexOf('function commitSelection', start);
  assert.notEqual(start, -1, 'syncRoleFilterState should exist');
  assert.notEqual(end, -1, 'commitSelection marker should exist');
  const snippet = EVENTS_SOURCE.slice(start, end);

  assert.match(snippet, /roles\.include = selectedList/);
  assert.match(snippet, /roles\.exclude = Array\.isArray\(uiState\.global_filters\.roles\.exclude\)/);
  assert.match(snippet, /allowedRoleIndices/);
});
