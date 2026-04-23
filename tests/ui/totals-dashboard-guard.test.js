const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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

runTest('canUseTotalsDashboardApi allows clean overview state and blocks filled sections', () => {
  const names = ['canUseTotalsDashboardApi'];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const activeSections = new Set();
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: { totals_dashboard_mode: 'overview' },
    isSharedFilterSectionFilled(sectionKey) {
      return activeSections.has(sectionKey);
    },
    normalizeTotalsTopLimit(value) { return Number(value) || 15; },
    normalizeTotalsCurrency(value) { return String(value || 'RUR').trim().toUpperCase() || 'RUR'; },
    normalizeTotalsTopOrder(value, _allowed, fallback) { return String(value || fallback || '').trim() || fallback; },
    normalizeTotalsClosingWindow(value) { return String(value || 'lte_7').trim() || 'lte_7'; },
    hasExplicitGlobalFilterSelection() { return false; },
    getResolvedGlobalFilterValues() {
      return ['last_14'];
    },
    getGlobalFilterOptions() {
      return [{ value: 'last_14' }];
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'totals-dashboard-guard.vm.js' });
  const { canUseTotalsDashboardApi } = sandbox.module.exports;

  assert.equal(canUseTotalsDashboardApi({}), true);

  activeSections.add('salary');
  assert.equal(canUseTotalsDashboardApi({}), true);

  activeSections.add('vacancy');
  assert.equal(canUseTotalsDashboardApi({}), true);

  activeSections.add('my-filters');
  assert.equal(canUseTotalsDashboardApi({}), true);

  activeSections.clear();
  activeSections.add('responses');
  assert.equal(canUseTotalsDashboardApi({}), true);

  activeSections.clear();
  activeSections.add('skills');
  assert.equal(canUseTotalsDashboardApi({}), true);

  activeSections.clear();
  sandbox.uiState.totals_dashboard_mode = 'top';
  assert.equal(canUseTotalsDashboardApi({}), true);

  sandbox.uiState.totals_top_currency = 'USD';
  assert.equal(canUseTotalsDashboardApi({}), true);

  sandbox.uiState.totals_top_limit = 25;
  assert.equal(canUseTotalsDashboardApi({}), true);

  sandbox.uiState = { totals_dashboard_mode: 'market-trends', market_trends_currency: 'RUR', market_trends_salary_metric: 'avg', market_trends_excluded_roles: [] };
  assert.equal(canUseTotalsDashboardApi({}), true);

  sandbox.hasExplicitGlobalFilterSelection = function(filterKey) {
    return filterKey === 'experiences';
  };
  assert.equal(canUseTotalsDashboardApi({}), true);

  sandbox.hasExplicitGlobalFilterSelection = function(filterKey) {
    return filterKey === 'status';
  };
  assert.equal(canUseTotalsDashboardApi({}), true);

  sandbox.hasExplicitGlobalFilterSelection = function() { return false; };
  sandbox.uiState.market_trends_currency = 'USD';
  assert.equal(canUseTotalsDashboardApi({}), true);

  sandbox.uiState.market_trends_salary_metric = 'max';
  assert.equal(canUseTotalsDashboardApi({}), true);

  sandbox.uiState.market_trends_excluded_roles = ['96'];
  assert.equal(canUseTotalsDashboardApi({}), true);
});
