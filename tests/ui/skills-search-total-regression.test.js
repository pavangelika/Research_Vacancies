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
  Promise.resolve()
    .then(fn)
    .then(() => console.log(`ok - ${name}`))
    .catch((error) => {
      console.error(`not ok - ${name}`);
      throw error;
    });
}

runTest('fetchSkillsSearchVacanciesFromApi preserves backend total instead of page size', async () => {
  const script = [
    extractFunctionSource('fetchSkillsSearchVacanciesFromApi'),
    'module.exports = { fetchSkillsSearchVacanciesFromApi };'
  ].join('\n');

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getAllRolesAnalyticsCache() {
      return {};
    },
    getSkillsSearchScopeParams() {
      return { scope: 'selection', role_ids: ['1', '2'] };
    },
    getSkillsSearchResolvedFilterValues() {
      return [];
    },
    normalizeAnalyticsPeriodForApi(value) {
      return value;
    },
    getGlobalFilterOptions() {
      return [];
    },
    buildEmployerApiFilterPayload() {
      return { employer: [], employer_exclude: [] };
    },
    normalizeSkillsSearchStatusForApi(value) {
      return value;
    },
    normalizeSkillsSearchCountryForApi(value) {
      return value;
    },
    normalizeSkillsSearchCurrencyListForApi(value) {
      return value;
    },
    normalizeSkillsSearchBooleanFilterForApi(value) {
      return value;
    },
    adaptVacancyApiItem(item) {
      return item;
    },
    fetchReportApiJson() {
      return Promise.resolve({
        items: [{ id: 'a' }, { id: 'b' }],
        total: 7486
      });
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'skills-search-total-regression.vm.js' });
  const { fetchSkillsSearchVacanciesFromApi } = sandbox.module.exports;

  const payload = await fetchSkillsSearchVacanciesFromApi({ id: 'role-combined' }, null, false);

  assert.equal(payload.items.length, 2);
  assert.equal(payload.total, 7486);
  assert.equal(payload.source_total, 7486);
});

runTest('fetchSkillsSearchVacanciesFromApi does not send implicit experience and currency filters', async () => {
  const script = [
    extractFunctionSource('fetchSkillsSearchVacanciesFromApi'),
    'module.exports = { fetchSkillsSearchVacanciesFromApi };'
  ].join('\n');

  const captured = [];
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getAllRolesAnalyticsCache() {
      return {};
    },
    getSkillsSearchScopeParams() {
      return { scope: 'selection', role_ids: ['1', '2'] };
    },
    getSkillsSearchResolvedFilterValues(parentRole, filterKey) {
      if (filterKey === 'experiences') return ['Нет опыта', 'От 1 года до 3 лет', 'От 3 до 6 лет', 'Более 6 лет'];
      if (filterKey === 'currency') return ['RUR', 'USD', 'EUR'];
      if (filterKey === 'periods') return ['2026-04'];
      return [];
    },
    hasExplicitGlobalFilterSelection(filterKey) {
      return filterKey === 'periods';
    },
    normalizeAnalyticsPeriodForApi(value) {
      return value;
    },
    getGlobalFilterOptions() {
      return [];
    },
    buildEmployerApiFilterPayload() {
      return { employer: [], employer_exclude: [] };
    },
    normalizeSkillsSearchStatusForApi(value) {
      return value;
    },
    normalizeSkillsSearchCountryForApi(value) {
      return value;
    },
    normalizeSkillsSearchCurrencyListForApi(value) {
      return value;
    },
    normalizeSkillsSearchBooleanFilterForApi(value) {
      return value;
    },
    adaptVacancyApiItem(item) {
      return item;
    },
    fetchReportApiJson(path, params) {
      captured.push({ path, params });
      return Promise.resolve({ items: [], total: 0 });
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'skills-search-implicit-filters.vm.js' });
  const { fetchSkillsSearchVacanciesFromApi } = sandbox.module.exports;

  await fetchSkillsSearchVacanciesFromApi({ id: 'role-combined' }, null, false);

  assert.equal(captured.length, 1);
  assert.deepEqual(Array.from(captured[0].params.experience || []), []);
  assert.deepEqual(Array.from(captured[0].params.currency || []), []);
  assert.deepEqual(Array.from(captured[0].params.periods || []), ['2026-04']);
});
