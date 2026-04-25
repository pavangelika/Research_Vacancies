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

runTest('fetchSkillsSearchVacanciesFromApi preserves explicit experience and currency filters even when they are the only available options', async () => {
  const script = [
    extractFunctionSource('fetchSkillsSearchVacanciesFromApi'),
    'module.exports = { fetchSkillsSearchVacanciesFromApi };'
  ].join('\n\n');

  let captured = null;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getAllRolesAnalyticsCache() { return {}; },
    getSkillsSearchScopeParams() { return { scope: 'single', role_ids: ['156'] }; },
    getSkillsSearchResolvedFilterValues(_role, key) {
      if (key === 'periods') return ['2026-04'];
      if (key === 'experiences') return ['Нет опыта'];
      if (key === 'status') return ['open'];
      if (key === 'country') return [];
      if (key === 'currency') return ['RUR'];
      if (key === 'employer') return [];
      if (key === 'accreditation') return [];
      if (key === 'cover_letter_required') return [];
      if (key === 'has_test') return [];
      return [];
    },
    hasExplicitGlobalFilterSelection(filterKey) {
      return filterKey === 'experiences' || filterKey === 'currency' || filterKey === 'periods';
    },
    buildEmployerApiFilterPayload() { return { employer: [], employer_exclude: [] }; },
    normalizeAnalyticsPeriodForApi(value) { return value; },
    normalizeSkillsSearchStatusForApi(values) { return values[0] || 'all'; },
    normalizeSkillsSearchCountryForApi() { return 'all'; },
    normalizeSkillsSearchCurrencyListForApi(values) { return values.slice(); },
    normalizeSkillsSearchBooleanFilterForApi() { return 'all'; },
    fetchReportApiJson(_url, params) {
      captured = params;
      return Promise.resolve({ items: [], total: 0 });
    },
    adaptVacancyApiItem(item) { return item; }
  };

  vm.runInNewContext(script, sandbox, { filename: 'skills-search-api-filters.vm.js' });
  const { fetchSkillsSearchVacanciesFromApi } = sandbox.module.exports;

  await fetchSkillsSearchVacanciesFromApi({ id: 'role-1' }, null, false);

  assert.deepEqual(Array.from(captured.experience || []), ['Нет опыта']);
  assert.deepEqual(Array.from(captured.currency || []), ['RUR']);
  assert.equal(captured.status, 'open');
});
