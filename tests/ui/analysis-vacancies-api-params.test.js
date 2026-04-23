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
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('buildAnalysisVacanciesApiParams normalizes shared analysis filters for vacancies endpoint', () => {
  const names = [
    'collapseResolvedFilterValuesWhenAllSelected',
    'normalizeSkillsSearchStatusForApi',
    'normalizeSkillsSearchCountryForApi',
    'normalizeSkillsSearchCurrencyListForApi',
    'normalizeSkillsSearchBooleanFilterForApi',
    'buildEmployerApiFilterPayload',
    'buildAnalysisVacanciesApiParams'
  ];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'analysis-vacancies-api-params.vm.js' });
  const { buildAnalysisVacanciesApiParams } = sandbox.module.exports;

  const params = buildAnalysisVacanciesApiParams(
    { scope: 'single', role_ids: ['96'] },
    {
      periods: ['РЎРµРіРѕРґРЅСЏ', '2026-04'],
      experiences: ['РќРµС‚ РѕРїС‹С‚Р°'],
      status: ['open'],
      country: ['ru'],
      currency: ['rur', 'usd'],
      employer: ['Acme'],
      employer_exclude: [],
      accreditation: ['true'],
      cover_letter_required: ['false'],
      has_test: ['true']
    },
    function normalizeAnalyticsPeriodForApi(value) {
      if (value === 'РЎРµРіРѕРґРЅСЏ') return 'today';
      return value;
    }
  );

  assert.equal(params.scope, 'single');
  assert.deepEqual(Array.from(params.role_ids), ['96']);
  assert.deepEqual(Array.from(params.periods), ['today', '2026-04']);
  assert.deepEqual(Array.from(params.experience), ['РќРµС‚ РѕРїС‹С‚Р°']);
  assert.equal(params.status, 'open');
  assert.equal(params.country, 'ru');
  assert.deepEqual(Array.from(params.currency), ['RUR', 'USD']);
  assert.deepEqual(Array.from(params.employer), ['Acme']);
  assert.deepEqual(Array.from(params.employer_exclude), []);
  assert.equal(params.accreditation, 'true');
  assert.equal(params.cover_letter_required, 'false');
  assert.equal(params.has_test, 'true');
  assert.deepEqual(Array.from(params.skills_include), []);
  assert.deepEqual(Array.from(params.skills_exclude), []);
  assert.equal(params.skills_logic, 'or');
  assert.equal(params.page, 1);
  assert.equal(params.per_page, 1000);
  assert.equal(params.sort, 'published_desc');
});

runTest('buildAnalysisVacanciesApiParams includes global skill filters when requested', () => {
  const names = [
    'collapseResolvedFilterValuesWhenAllSelected',
    'normalizeSkillsSearchStatusForApi',
    'normalizeSkillsSearchCountryForApi',
    'normalizeSkillsSearchCurrencyListForApi',
    'normalizeSkillsSearchBooleanFilterForApi',
    'buildEmployerApiFilterPayload',
    'buildAnalysisVacanciesApiParams'
  ];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'analysis-vacancies-api-params-skills.vm.js' });
  const { buildAnalysisVacanciesApiParams } = sandbox.module.exports;

  const params = buildAnalysisVacanciesApiParams(
    { scope: 'single', role_ids: ['96'] },
    {
      periods: ['РЎРµРіРѕРґРЅСЏ'],
      experiences: [],
      status: [],
      country: [],
      currency: [],
      employer: [],
      employer_exclude: [],
      accreditation: [],
      cover_letter_required: [],
      has_test: [],
      skills_include: ['Python'],
      skills_exclude: ['PHP'],
      skills_logic: 'and'
    },
    function normalizeAnalyticsPeriodForApi(value) {
      return value === 'РЎРµРіРѕРґРЅСЏ' ? 'today' : value;
    },
    { includeSkillFilters: true }
  );

  assert.deepEqual(Array.from(params.skills_include), ['Python']);
  assert.deepEqual(Array.from(params.skills_exclude), ['PHP']);
  assert.equal(params.skills_logic, 'and');
});

runTest('buildAnalysisVacanciesApiParams can omit periods for period-agnostic analysis source', () => {
  const names = [
    'collapseResolvedFilterValuesWhenAllSelected',
    'normalizeSkillsSearchStatusForApi',
    'normalizeSkillsSearchCountryForApi',
    'normalizeSkillsSearchCurrencyListForApi',
    'normalizeSkillsSearchBooleanFilterForApi',
    'buildEmployerApiFilterPayload',
    'buildAnalysisVacanciesApiParams'
  ];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'analysis-vacancies-api-params-skip-periods.vm.js' });
  const { buildAnalysisVacanciesApiParams } = sandbox.module.exports;

  const params = buildAnalysisVacanciesApiParams(
    { scope: 'single', role_ids: ['96'] },
    {
      periods: ['РЎРµРіРѕРґРЅСЏ', '2026-04'],
      experiences: ['РќРµС‚ РѕРїС‹С‚Р°'],
      status: ['open'],
      country: ['ru'],
      currency: ['rur'],
      employer: [],
      employer_exclude: []
    },
    function normalizeAnalyticsPeriodForApi(value) {
      return value === 'РЎРµРіРѕРґРЅСЏ' ? 'today' : value;
    },
    { skipPeriods: true }
  );

  assert.deepEqual(Array.from(params.periods), []);
  assert.deepEqual(Array.from(params.experience), ['РќРµС‚ РѕРїС‹С‚Р°']);
  assert.equal(params.status, 'open');
});

runTest('buildEmployerApiFilterPayload omits implicit all-employers selection and preserves explicit excludes', () => {
  const names = ['buildEmployerApiFilterPayload'];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    ensureGlobalFilterBucket() {
      return { include: [], exclude: ['Beta'] };
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'analysis-employer-api-payload.vm.js' });
  const { buildEmployerApiFilterPayload } = sandbox.module.exports;

  const payload = buildEmployerApiFilterPayload(
    'employer',
    [{ value: 'Acme' }, { value: 'Beta' }, { value: 'Gamma' }],
    ['Acme', 'Gamma']
  );

  assert.deepEqual(Array.from(payload.employer), []);
  assert.deepEqual(Array.from(payload.employer_exclude), ['Beta']);
});

runTest('collapseResolvedFilterValuesWhenAllSelected drops all-selected currency values', () => {
  const names = ['collapseResolvedFilterValuesWhenAllSelected'];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'analysis-collapse-all-selected.vm.js' });
  const { collapseResolvedFilterValuesWhenAllSelected } = sandbox.module.exports;

  const result = collapseResolvedFilterValuesWhenAllSelected(
    ['rur', 'usd', 'eur'],
    [{ value: 'rur' }, { value: 'usd' }, { value: 'eur' }]
  );

  assert.deepEqual(Array.from(result), []);
});
