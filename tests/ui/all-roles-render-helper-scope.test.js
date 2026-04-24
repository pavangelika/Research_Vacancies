const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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

runTest('renderAllRolesContainer can render analysis tabs without local helper scope', () => {
  const script = [
    extractFunctionSource('buildUpperTextTabButtonHtml'),
    extractFunctionSource('renderAllRolesContainer'),
    'module.exports = { renderAllRolesContainer };'
  ].join('\n\n');

  let preferredClicked = false;
  const preferredButton = { click() { preferredClicked = true; } };
  const container = {
    dataset: { activeAnalysis: 'activity' },
    _data: {},
    isConnected: true,
    querySelector(selector) {
      if (selector === '.analysis-button[data-analysis-id="activity-all"]') return preferredButton;
      if (selector === '.analysis-tabs .analysis-button') return preferredButton;
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {},
    escapeHtml(value) { return String(value || ''); },
    dedupeVacanciesById(list) { return Array.isArray(list) ? list.slice() : []; },
    getRoleVacancies() { return []; },
    getFilteredVacanciesForAnalysis() { return []; },
    normalizeGlobalPeriodValue(value) { return value || ''; },
    normalizeAnalysisTypeForButtonLookup(value) { return value || 'activity'; },
    computePublicationPeriod() { return '—'; },
    getStandardPeriodFilterItems() { return []; },
    buildViewModeButtonsHtml() { return ''; },
    buildAllRolesSkillsTableHtml() { return ''; },
    buildAllRolesSalaryTableHtml() { return ''; },
    buildCombinedEmployerRawRowsHtml() { return ''; },
    computeActivityEntriesFromVacancies() { return []; },
    computeWeekdayStatsFromVacancies() { return []; },
    computeMedian() { return 0; }
  };

  vm.runInNewContext(script, sandbox, { filename: 'all-roles-render-helper-scope.vm.js' });
  const { renderAllRolesContainer } = sandbox.module.exports;

  renderAllRolesContainer(container, []);

  assert.equal(typeof container.innerHTML, 'string');
  assert.match(container.innerHTML, /Динамика по ролям/);
  assert.equal(preferredClicked, true);
});
