const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const UI_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js');
const UI_SOURCE = fs.readFileSync(UI_SOURCE_PATH, 'utf8');
const ANALYSIS_SWITCH_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.analysis-switch.js');
const ANALYSIS_SWITCH_SOURCE = fs.readFileSync(ANALYSIS_SWITCH_SOURCE_PATH, 'utf8');

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function sliceFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `expected ${name} in source`);
  const nextFunction = source.indexOf('\nfunction ', start + marker.length);
  return source.slice(start, nextFunction === -1 ? source.length : nextFunction);
}

runTest('loading helpers exist for non-destructive analysis refreshes', () => {
  assert.match(UI_SOURCE, /function ensureAnalysisLoadingOverlay\(container,\s*message\)/);
  assert.match(UI_SOURCE, /function clearAnalysisLoadingOverlay\(container\)/);
});

runTest('renderMyResponsesContent keeps existing content and uses loading overlay instead of replacing html', () => {
  const source = sliceFunction(UI_SOURCE, 'renderMyResponsesContent');
  assert.match(source, /ensureAnalysisLoadingOverlay\(block,\s*'/);
  assert.doesNotMatch(
    source,
    /responsesWrap\.innerHTML\s*=\s*'<div class="skills-search-summary">/,
    'my-responses loading should not wipe existing content with a temporary loading message'
  );
});

runTest('renderMyResponsesCalendarContent uses loading overlay instead of replacing html', () => {
  const source = sliceFunction(UI_SOURCE, 'renderMyResponsesCalendarContent');
  assert.match(source, /ensureAnalysisLoadingOverlay\(block,\s*'/);
  assert.doesNotMatch(
    source,
    /block\.innerHTML\s*=\s*'<div class="skills-search-summary">/,
    'calendar loading should not wipe existing content with a temporary loading message'
  );
});

runTest('renderGlobalTotalsFiltered uses loading overlay instead of replacing html during dashboard api fetch', () => {
  const source = sliceFunction(UI_SOURCE, 'renderGlobalTotalsFiltered');
  assert.match(source, /ensureAnalysisLoadingOverlay\(block,\s*'/);
  assert.doesNotMatch(
    source,
    /block\.innerHTML\s*=\s*'<div class="skills-search-hint">[^']*<\/div>';\s*return;/,
    'totals loading should not wipe existing content with a temporary loading message'
  );
});

runTest('analysis switch seeds previous totals content instead of wiping it with a loading placeholder', () => {
  assert.match(ANALYSIS_SWITCH_SOURCE, /function seedAnalysisBlockFromSibling\(targetBlock,\s*selector,\s*placeholderPattern\)/);
  const source = sliceFunction(ANALYSIS_SWITCH_SOURCE, 'handleTotalsAnalysisSwitch');
  assert.match(source, /seedAnalysisBlockFromSibling\(totalsBlock,\s*'.totals-content\[data-analysis\^="totals-"\]'/);
  assert.doesNotMatch(
    source,
    /totalsBlock\.innerHTML\s*=\s*'<div class="skills-search-hint">[^']*Загрузка[^']*<\/div>'/,
    'analysis switch should not wipe totals content before renderGlobalTotalsFiltered runs'
  );
});
