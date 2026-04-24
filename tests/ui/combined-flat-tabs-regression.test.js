const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RENDER_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.render.js');
const RENDER_SOURCE = fs.readFileSync(RENDER_SOURCE_PATH, 'utf8');

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = RENDER_SOURCE.indexOf(marker);
  if (start === -1) throw new Error(`Function ${name} not found`);
  const bodyStart = RENDER_SOURCE.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < RENDER_SOURCE.length; i += 1) {
    const ch = RENDER_SOURCE[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return RENDER_SOURCE.slice(start, i + 1);
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

runTest('renderCombinedContainer exposes flat tabs for my responses and calendar', () => {
  const combinedSource = extractFunctionSource('renderCombinedContainer');
  assert.match(
    combinedSource,
    /buildUpperTextTabButtonHtml\('Дашборд', 'analysis-button', 'data-analysis-id="totals-all"/,
    'combined container should expose a top tab for dashboard totals'
  );
  assert.match(
    combinedSource,
    /<div class="totals-content" data-analysis="totals-all" style="display: none;">/,
    'combined container should render a dedicated totals block so dashboard stays active after choosing all or several roles'
  );
  assert.match(
    combinedSource,
    /buildUpperTextTabButtonHtml\('Мои отклики', 'analysis-button', 'data-analysis-id="my-responses-all"/,
    'combined container should expose a top tab for my responses'
  );
  assert.match(
    combinedSource,
    /buildUpperTextTabButtonHtml\('Календарь', 'analysis-button', 'data-analysis-id="responses-calendar-all"/,
    'combined container should expose a top tab for calendar'
  );
  assert.match(
    combinedSource,
    /<div class="my-responses-content[^"]*" data-analysis="my-responses-all" style="display: none;">/,
    'combined container should render a dedicated my-responses block instead of leaving previous comparative content visible'
  );
  assert.match(
    combinedSource,
    /<div class="response-calendar-content" data-analysis="responses-calendar-all" style="display: none;">/,
    'combined container should render a dedicated calendar block instead of leaving previous comparative content visible'
  );
});
