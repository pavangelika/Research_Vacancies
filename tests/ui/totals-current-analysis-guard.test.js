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

runTest('renderGlobalTotalsFiltered defines current analysis before preload branch uses it', () => {
  const marker = 'function renderGlobalTotalsFiltered(parentRole) {';
  const start = UI_SOURCE.indexOf(marker);
  assert.notEqual(start, -1, 'renderGlobalTotalsFiltered not found');

  const currentDecl = UI_SOURCE.indexOf('var current =', start);
  const currentUse = UI_SOURCE.indexOf("String(current || '')", start);

  assert.notEqual(currentUse, -1, 'expected preload branch to reference current analysis');
  assert.notEqual(currentDecl, -1, 'expected current analysis declaration');
  assert.ok(currentDecl < currentUse, 'current analysis must be declared before usage');
});
