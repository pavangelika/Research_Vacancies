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

runTest('single-role quick periods no longer log local API fallback branches', () => {
  assert.equal(UI_SOURCE.includes('fetchSingleRoleSalaryMonthFromApi failed'), true);
  assert.equal(UI_SOURCE.includes('fetchSingleRoleSkillsMonthFromApi failed'), true);
  assert.equal(UI_SOURCE.includes('Skills quick period API fallback'), false);
  assert.equal(UI_SOURCE.includes('var fallbackMonthData = buildSalaryMonthFromVacancies'), false);
});

runTest('single-role activity quick periods no longer build local recent-day entries', () => {
  const start = UI_SOURCE.indexOf('function ensureActivityQuickFilters(parentRole, controlRow) {');
  assert.notEqual(start, -1, 'ensureActivityQuickFilters not found');
  const segment = UI_SOURCE.slice(start, start + 4000);
  assert.equal(segment.includes('var entriesToday = computeActivityEntriesFromVacancies'), false);
  assert.equal(segment.includes('filterVacanciesByDays('), false);
});
