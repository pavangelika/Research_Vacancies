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

runTest('single-role filtered analytics no longer falls back to local vacancy recompute', () => {
  const targets = [
    'renderGlobalSkillsFiltered',
    'renderGlobalSalaryFiltered',
    'renderGlobalActivityFiltered',
    'renderGlobalWeekdayFiltered',
    'renderGlobalEmployerFiltered'
  ];

  targets.forEach((name) => {
    const source = extractFunctionSource(name);
    assert.equal(source.includes('getFilteredVacanciesForAnalysis('), false, `${name} should not use local filtered fallback`);
  });
});
