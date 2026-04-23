const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const UI_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js');
const EVENTS_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.events.js');
const UI_SOURCE = fs.readFileSync(UI_SOURCE_PATH, 'utf8');
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

runTest('responses UI no longer references legacy /api/vacancies response endpoints', () => {
  assert.equal(UI_SOURCE.includes('/api/vacancies/responses'), false);
  assert.equal(UI_SOURCE.includes('/api/vacancies/details'), false);
});

runTest('responses preload no longer falls back to fetchMyResponsesVacancies', () => {
  assert.equal(EVENTS_SOURCE.includes('fetchMyResponsesVacancies'), false);
  assert.equal(UI_SOURCE.includes('fetchMyResponsesVacancies'), false);
});
