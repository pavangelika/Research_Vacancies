const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const UI_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js');
const UI_SOURCE = fs.readFileSync(UI_SOURCE_PATH, 'utf8');

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = UI_SOURCE.indexOf(marker);
  if (start === -1) throw new Error(`Function ${name} not found`);
  const bodyStart = UI_SOURCE.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < UI_SOURCE.length; i += 1) {
    const ch = UI_SOURCE[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return UI_SOURCE.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract function ${name}`);
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('renderGlobalTotalsFiltered renders vacancy collection period label from vacancy dates for dashboard modes', () => {
  const source = extractFunctionSource('renderGlobalTotalsFiltered');
  assert.match(
    source,
    /role-period-label/,
    'totals dashboard should render a shared period label container'
  );
  assert.match(
    source,
    /Период сбора вакансий:/,
    'totals dashboard should show the vacancy collection period label'
  );
  assert.match(
    source,
    /computePublicationPeriod\(/,
    'totals dashboard should derive the period label from vacancy dates so it matches other tabs'
  );
});
