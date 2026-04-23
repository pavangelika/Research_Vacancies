const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RENDER_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.render.js'),
  'utf8'
);

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('report.render no longer keeps dead helper guards for required render helpers', () => {
  assert.equal(RENDER_SOURCE.includes("typeof getFilteredVacanciesForAnalysis === 'function'"), false);
  assert.equal(RENDER_SOURCE.includes("typeof computeActivityEntriesFromVacancies === 'function'"), false);
  assert.equal(RENDER_SOURCE.includes("typeof computeWeekdayStatsFromVacancies === 'function'"), false);
  assert.equal(RENDER_SOURCE.includes("typeof buildSkillsExpDataFromVacancies === 'function'"), false);
  assert.equal(RENDER_SOURCE.includes("typeof buildSalaryMonthFromVacancies === 'function'"), false);
  assert.equal(RENDER_SOURCE.includes("typeof buildEmployerAnalysisRowsFromVacancies === 'function'"), false);
});
