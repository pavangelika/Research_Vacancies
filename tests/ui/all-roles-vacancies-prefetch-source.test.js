const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RENDER_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.render.js');
const RENDER_SOURCE = fs.readFileSync(RENDER_SOURCE_PATH, 'utf8');

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('renderAllRolesContainer prefetches selected role vacancies before summary render', () => {
  assert.match(RENDER_SOURCE, /function renderAllRolesContainer\(container, roleContents\)/);
  assert.match(RENDER_SOURCE, /ensureRoleVacanciesLoaded/);
  assert.match(RENDER_SOURCE, /allRolesVacanciesPrefetchStarted/);
  assert.match(RENDER_SOURCE, /allRolesVacanciesPrefetchDone/);
  assert.match(RENDER_SOURCE, /Загрузка сводного отчета/);
});
