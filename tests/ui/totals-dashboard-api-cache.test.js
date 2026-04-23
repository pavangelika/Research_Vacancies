const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DATA_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.data.js');
const DATA_SOURCE = fs.readFileSync(DATA_SOURCE_PATH, 'utf8');

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = DATA_SOURCE.indexOf(marker);
  if (start === -1) throw new Error(`Function ${name} not found`);
  const bodyStart = DATA_SOURCE.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < DATA_SOURCE.length; i += 1) {
    const ch = DATA_SOURCE[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return DATA_SOURCE.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract function ${name}`);
}

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('fetchTotalsDashboardFromApi reuses inflight request and normalizes default period payload', async () => {
  const names = ['fetchTotalsDashboardFromApi'];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  let fetchCalls = 0;
  const cache = {};
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {},
    getAllRolesAnalyticsCache() { return cache; },
    getSkillsSearchScopeParams() { return { scope: 'single', role_ids: ['96'] }; },
    getGlobalFilterOptions() { return [{ value: 'last_14' }]; },
    getResolvedGlobalFilterValues(_filterKey, options) {
      return Array.isArray(options) ? options.map((item) => item.value) : [];
    },
    buildEmployerApiFilterPayload() { return { employer: [], employer_exclude: [] }; },
    collapseResolvedFilterValuesWhenAllSelected(values) { return Array.isArray(values) ? values.slice() : []; },
    normalizeSkillsSearchBooleanFilterForApi() { return 'all'; },
    normalizeSkillsSearchStatusForApi(values) {
      return Array.isArray(values) && values.length === 1 ? String(values[0]) : 'all';
    },
    normalizeSkillsSearchCountryForApi() { return 'all'; },
    normalizeSkillsSearchCurrencyListForApi() { return []; },
    normalizeAnalyticsPeriodForApi(value) { return value; },
    normalizeTotalsCurrency(value) { return String(value || 'RUR').trim().toUpperCase(); },
    normalizeTotalsTopLimit(value) { return Number(value) || 15; },
    normalizeTotalsTopOrder(value, _allowed, fallback) { return String(value || fallback || '').trim() || fallback; },
    normalizeTotalsClosingWindow(value) { return String(value || 'lte_7').trim() || 'lte_7'; },
    fetchReportApiJson(_path, params) {
      fetchCalls += 1;
      assert.equal(params.scope, 'single');
      assert.deepEqual(Array.from(params.role_ids), ['96']);
      assert.equal(params.period, 'last_14');
      return new Promise((resolve) => setTimeout(() => resolve({
        scope: 'single',
        role_ids: ['96'],
        period_label: 'last_14',
        metrics: []
      }), 10));
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'totals-dashboard-api-cache.vm.js' });
  const { fetchTotalsDashboardFromApi } = sandbox.module.exports;

  const [left, right] = await Promise.all([
    fetchTotalsDashboardFromApi({}),
    fetchTotalsDashboardFromApi({})
  ]);

  assert.equal(fetchCalls, 1);
  assert.equal(left.period_label, 'last_14');
  assert.equal(right.scope, 'single');
});

runTest('fetchTotalsDashboardFromApi includes non-default top params in dashboard request', async () => {
  const names = ['fetchTotalsDashboardFromApi'];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const cache = {};
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {
      totals_dashboard_mode: 'top',
      totals_top_currency: 'USD',
      totals_top_limit: 25,
      totals_vacancy_order: 'low',
      totals_skills_order: 'least',
      totals_company_order: 'low',
      totals_closing_window: 'lte_14'
    },
    getAllRolesAnalyticsCache() { return cache; },
    getSkillsSearchScopeParams() { return { scope: 'single', role_ids: ['96'] }; },
    getGlobalFilterOptions() { return [{ value: 'last_14' }]; },
    getResolvedGlobalFilterValues(_filterKey, options) {
      return Array.isArray(options) ? options.map((item) => item.value) : [];
    },
    buildEmployerApiFilterPayload() { return { employer: [], employer_exclude: [] }; },
    collapseResolvedFilterValuesWhenAllSelected(values) { return Array.isArray(values) ? values.slice() : []; },
    normalizeSkillsSearchBooleanFilterForApi() { return 'all'; },
    normalizeSkillsSearchStatusForApi(values) {
      return Array.isArray(values) && values.length === 1 ? String(values[0]) : 'all';
    },
    normalizeSkillsSearchCountryForApi() { return 'all'; },
    normalizeSkillsSearchCurrencyListForApi() { return []; },
    normalizeAnalyticsPeriodForApi(value) { return value; },
    normalizeTotalsCurrency(value) { return String(value || 'RUR').trim().toUpperCase(); },
    normalizeTotalsTopLimit(value) { return Number(value) || 15; },
    normalizeTotalsTopOrder(value, _allowed, fallback) { return String(value || fallback || '').trim() || fallback; },
    normalizeTotalsClosingWindow(value) { return String(value || 'lte_7').trim() || 'lte_7'; },
    fetchReportApiJson(_path, params) {
      assert.equal(params.top_currency, 'USD');
      assert.equal(params.top_limit, 25);
      assert.equal(params.vacancy_order, 'low');
      assert.equal(params.skills_order, 'least');
      assert.equal(params.company_order, 'low');
      assert.equal(params.closing_window, 'lte_14');
      return Promise.resolve({
        scope: 'single',
        role_ids: ['96'],
        period_label: 'last_14',
        metrics: []
      });
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'totals-dashboard-api-cache-top.vm.js' });
  const { fetchTotalsDashboardFromApi } = sandbox.module.exports;

  const payload = await fetchTotalsDashboardFromApi({});
  assert.equal(payload.scope, 'single');
});

runTest('fetchTotalsDashboardFromApi includes non-default market trends params in dashboard request', async () => {
  const names = ['fetchTotalsDashboardFromApi'];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const cache = {};
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {
      totals_dashboard_mode: 'market-trends',
      market_trends_currency: 'USD',
      market_trends_salary_metric: 'max',
      market_trends_excluded_roles: ['96', '113']
    },
    getAllRolesAnalyticsCache() { return cache; },
    getSkillsSearchScopeParams() { return { scope: 'single', role_ids: ['96'] }; },
    getGlobalFilterOptions(_parentRole, filterKey) {
      if (filterKey === 'periods') return [{ value: 'last_14' }];
      if (filterKey === 'experiences') return [{ value: 'Нет опыта' }];
      if (filterKey === 'status') return [{ value: 'open' }, { value: 'archived' }];
      return [];
    },
    getResolvedGlobalFilterValues(filterKey, options) {
      if (filterKey === 'experiences') return ['Нет опыта'];
      if (filterKey === 'status') return ['open'];
      return Array.isArray(options) ? options.map((item) => item.value) : [];
    },
    buildEmployerApiFilterPayload() { return { employer: [], employer_exclude: [] }; },
    collapseResolvedFilterValuesWhenAllSelected(values) { return Array.isArray(values) ? values.slice() : []; },
    normalizeSkillsSearchBooleanFilterForApi() { return 'all'; },
    normalizeSkillsSearchStatusForApi(values) {
      return Array.isArray(values) && values.length === 1 ? String(values[0]) : 'all';
    },
    normalizeSkillsSearchCountryForApi() { return 'all'; },
    normalizeSkillsSearchCurrencyListForApi() { return []; },
    normalizeAnalyticsPeriodForApi(value) { return value; },
    normalizeTotalsCurrency(value) { return String(value || 'RUR').trim().toUpperCase(); },
    normalizeTotalsTopLimit(value) { return Number(value) || 15; },
    normalizeTotalsTopOrder(value, _allowed, fallback) { return String(value || fallback || '').trim() || fallback; },
    normalizeTotalsClosingWindow(value) { return String(value || 'lte_7').trim() || 'lte_7'; },
    fetchReportApiJson(_path, params) {
      assert.equal(params.market_trends_currency, 'USD');
      assert.equal(params.market_trends_salary_metric, 'max');
      assert.deepEqual(Array.from(params.market_trends_excluded_roles), ['96', '113']);
      assert.deepEqual(Array.from(params.experience), ['Нет опыта']);
      assert.equal(params.status, 'open');
      return Promise.resolve({
        scope: 'single',
        role_ids: ['96'],
        period_label: 'last_14',
        metrics: []
      });
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'totals-dashboard-api-cache-market-trends.vm.js' });
  const { fetchTotalsDashboardFromApi } = sandbox.module.exports;

  const payload = await fetchTotalsDashboardFromApi({});
  assert.equal(payload.scope, 'single');
});

runTest('fetchTotalsDashboardFromApi includes overview filter params in dashboard request', async () => {
  const names = ['fetchTotalsDashboardFromApi'];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const cache = {};
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: { totals_dashboard_mode: 'overview' },
    getAllRolesAnalyticsCache() { return cache; },
    getSkillsSearchScopeParams() { return { scope: 'single', role_ids: ['96'] }; },
    getGlobalFilterOptions(_parentRole, filterKey) {
      if (filterKey === 'periods') return [{ value: 'last_14' }];
      if (filterKey === 'experiences') return [{ value: 'Нет опыта' }];
      if (filterKey === 'country') return [{ value: 'ru' }, { value: 'not_ru' }];
      if (filterKey === 'currency') return [{ value: 'usd' }, { value: 'rur' }];
      if (filterKey === 'employer') return [{ value: 'Acme' }, { value: 'Beta' }];
      if (filterKey === 'interview') return [{ value: 'yes' }, { value: 'no' }];
      if (filterKey === 'result') return [{ value: 'yes' }, { value: 'no' }];
      if (filterKey === 'offer') return [{ value: 'yes' }, { value: 'no' }];
      return [];
    },
    getResolvedGlobalFilterValues(filterKey, options) {
      if (filterKey === 'periods') return ['last_14'];
      if (filterKey === 'experiences') return ['Нет опыта'];
      if (filterKey === 'country') return ['ru'];
      if (filterKey === 'currency') return ['usd'];
      if (filterKey === 'employer') return ['Acme'];
      if (filterKey === 'interview') return ['yes'];
      if (filterKey === 'result') return ['no'];
      if (filterKey === 'offer') return ['yes'];
      if (filterKey === 'accreditation') return ['true'];
      if (filterKey === 'cover_letter_required') return ['false'];
      if (filterKey === 'has_test') return ['true'];
      if (filterKey === 'status') return ['open'];
      return Array.isArray(options) ? options.map((item) => item.value) : [];
    },
    getGlobalSkillsFilterSelections() {
      return { includeSkills: ['SQL'], excludeSkills: ['Java'], logic: 'and' };
    },
    collapseResolvedFilterValuesWhenAllSelected(values) { return Array.isArray(values) ? values.slice() : []; },
    normalizeAnalyticsPeriodForApi(value) { return value; },
    normalizeTotalsCurrency(value) { return String(value || 'RUR').trim().toUpperCase(); },
    normalizeTotalsTopLimit(value) { return Number(value) || 15; },
    normalizeTotalsTopOrder(value, _allowed, fallback) { return String(value || fallback || '').trim() || fallback; },
    normalizeTotalsClosingWindow(value) { return String(value || 'lte_7').trim() || 'lte_7'; },
    buildEmployerApiFilterPayload() {
      return { employer: ['Acme'], employer_exclude: ['Beta'] };
    },
    normalizeSkillsSearchBooleanFilterForApi(values) {
      return Array.isArray(values) && values.length === 1 ? String(values[0]) : 'all';
    },
    normalizeSkillsSearchStatusForApi(values) {
      return Array.isArray(values) && values.length === 1 ? String(values[0]) : 'all';
    },
    normalizeSkillsSearchCountryForApi(values) {
      return Array.isArray(values) && values.length === 1 ? String(values[0]) : 'all';
    },
    fetchReportApiJson(_path, params) {
      assert.deepEqual(Array.from(params.experience), ['Нет опыта']);
      assert.equal(params.status, 'open');
      assert.equal(params.country, 'ru');
      assert.deepEqual(Array.from(params.currency), ['USD']);
      assert.deepEqual(Array.from(params.employer), ['Acme']);
      assert.deepEqual(Array.from(params.employer_exclude), ['Beta']);
      assert.deepEqual(Array.from(params.interview), ['yes']);
      assert.deepEqual(Array.from(params.result), ['no']);
      assert.deepEqual(Array.from(params.offer), ['yes']);
      assert.deepEqual(Array.from(params.skills_include), ['SQL']);
      assert.deepEqual(Array.from(params.skills_exclude), ['Java']);
      assert.equal(params.skills_logic, 'and');
      assert.equal(params.accreditation, 'true');
      assert.equal(params.cover_letter_required, 'false');
      assert.equal(params.has_test, 'true');
      return Promise.resolve({
        scope: 'single',
        role_ids: ['96'],
        period_label: 'last_14',
        metrics: []
      });
    },
    normalizeSkillsSearchCurrencyListForApi(values) {
      return (Array.isArray(values) ? values : []).map((value) => String(value || '').trim().toUpperCase()).filter(Boolean);
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'totals-dashboard-api-cache-overview.vm.js' });
  const { fetchTotalsDashboardFromApi } = sandbox.module.exports;

  const payload = await fetchTotalsDashboardFromApi({});
  assert.equal(payload.scope, 'single');
});
