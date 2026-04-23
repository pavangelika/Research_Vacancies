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

function runTest(name, fn) {
  try {
    fn().then(() => {
      console.log(`ok - ${name}`);
    }).catch((error) => {
      console.error(`not ok - ${name}`);
      throw error;
    });
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('fetchSkillsSearchVacanciesFromApi reuses inflight request for identical params', async () => {
  const names = [
    'fetchSkillsSearchVacanciesFromApi'
  ];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  let fetchCalls = 0;
  const cache = {};
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getAllRolesAnalyticsCache() { return cache; },
    getSkillsSearchScopeParams() { return { scope: 'single', role_ids: ['156'] }; },
    getSkillsSearchResolvedFilterValues(_parentRole, filterKey) {
      const map = {
        periods: ['last_14'],
        experiences: ['exp'],
        status: ['all'],
        country: ['all'],
        currency: ['rur'],
        employer: [],
        accreditation: [],
        cover_letter_required: [],
        has_test: []
      };
      return map[filterKey] || [];
    },
    normalizeAnalyticsPeriodForApi(value) { return value; },
    getGlobalFilterOptions() { return []; },
    buildEmployerApiFilterPayload() { return { employer: [], employer_exclude: [] }; },
    normalizeSkillsSearchStatusForApi() { return 'all'; },
    normalizeSkillsSearchCountryForApi() { return 'all'; },
    normalizeSkillsSearchCurrencyListForApi() { return ['RUR']; },
    normalizeSkillsSearchBooleanFilterForApi() { return 'all'; },
    getSkillsSearchSelections() { return { includeSkills: [], excludeSkills: [], logic: 'or' }; },
    adaptVacancyApiItem(item) { return item; },
    fetchReportApiJson() {
      fetchCalls += 1;
      return new Promise((resolve) => setTimeout(() => resolve({ items: [{ id: '1' }], total: 1 }), 10));
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'skills-search-api-cache.vm.js' });
  const { fetchSkillsSearchVacanciesFromApi } = sandbox.module.exports;
  const parentRole = {};
  const block = {};

  const [left, right] = await Promise.all([
    fetchSkillsSearchVacanciesFromApi(parentRole, block, false),
    fetchSkillsSearchVacanciesFromApi(parentRole, block, false)
  ]);

  assert.equal(fetchCalls, 1);
  assert.deepEqual(left.items, [{ id: '1' }]);
  assert.deepEqual(right.items, [{ id: '1' }]);
});

runTest('fetchSkillsSearchSuggestionsFromApi reuses inflight request for identical params', async () => {
  const names = ['fetchSkillsSearchSuggestionsFromApi'];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  let fetchCalls = 0;
  const cache = {};
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getAllRolesAnalyticsCache() { return cache; },
    getSkillsSearchScopeParams() { return { scope: 'single', role_ids: ['156'] }; },
    getSkillsSearchResolvedFilterValues(_parentRole, filterKey) {
      const map = {
        periods: ['last_14'],
        experiences: ['exp'],
        status: ['all'],
        country: ['all'],
        currency: ['rur'],
        employer: [],
        accreditation: [],
        cover_letter_required: [],
        has_test: []
      };
      return map[filterKey] || [];
    },
    normalizeAnalyticsPeriodForApi(value) { return value; },
    getGlobalFilterOptions() { return []; },
    buildEmployerApiFilterPayload() { return { employer: [], employer_exclude: [] }; },
    normalizeSkillsSearchStatusForApi() { return 'all'; },
    normalizeSkillsSearchCountryForApi() { return 'all'; },
    normalizeSkillsSearchCurrencyListForApi() { return ['RUR']; },
    normalizeSkillsSearchBooleanFilterForApi() { return 'all'; },
    fetchReportApiJson() {
      fetchCalls += 1;
      return new Promise((resolve) => setTimeout(() => resolve({ items: [{ skill: 'Python', count: 1 }] }), 10));
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'skills-search-suggestions-cache.vm.js' });
  const { fetchSkillsSearchSuggestionsFromApi } = sandbox.module.exports;
  const parentRole = {};

  const [left, right] = await Promise.all([
    fetchSkillsSearchSuggestionsFromApi(parentRole),
    fetchSkillsSearchSuggestionsFromApi(parentRole)
  ]);

  assert.equal(fetchCalls, 1);
  assert.deepEqual(left.items, [{ skill: 'Python', count: 1 }]);
  assert.deepEqual(right.items, [{ skill: 'Python', count: 1 }]);
});
