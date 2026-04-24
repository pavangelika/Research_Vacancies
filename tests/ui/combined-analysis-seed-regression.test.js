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

function sliceFunction(name) {
  const marker = `function ${name}(`;
  const start = RENDER_SOURCE.indexOf(marker);
  assert.notEqual(start, -1, `expected ${name} in report.render.js`);
  const nextFunction = RENDER_SOURCE.indexOf('\nfunction ', start + marker.length);
  return RENDER_SOURCE.slice(start, nextFunction === -1 ? RENDER_SOURCE.length : nextFunction);
}

runTest('combined render defines a helper to seed current analysis html', () => {
  assert.match(RENDER_SOURCE, /function getCombinedSeedAnalysisHtml\(analysisType\)/);
});

runTest('renderCombinedContainer seeds totals and calendar blocks instead of hardcoded loading placeholders', () => {
  const source = sliceFunction('renderCombinedContainer');
  assert.match(source, /getCombinedSeedAnalysisHtml\('totals'\)/);
  assert.match(source, /getCombinedSeedAnalysisHtml\('responses-calendar'\)/);
  assert.doesNotMatch(
    source,
    /<div class="skills-search-hint">Загрузка итогов\.\.\.<\/div>/,
    'combined totals block should not start from a hardcoded loading placeholder'
  );
  assert.doesNotMatch(
    source,
    /<div class="skills-search-hint">Загрузка календаря\.\.\.<\/div>/,
    'combined calendar block should not start from a hardcoded loading placeholder'
  );
});
