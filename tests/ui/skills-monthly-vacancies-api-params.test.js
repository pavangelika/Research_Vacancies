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

runTest('buildSkillsMonthlyVacanciesApiParams normalizes skills-monthly filters for vacancies endpoint', () => {
  const names = [
    'normalizeSkillsSearchStatusForApi',
    'normalizeSkillsSearchCountryForApi',
    'normalizeSkillsSearchCurrencyListForApi',
    'normalizeSkillsSearchBooleanFilterForApi',
    'buildAnalysisVacanciesApiParams',
    'buildSkillsMonthlyVacanciesApiParams'
  ];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'skills-monthly-vacancies-api-params.vm.js' });
  const { buildSkillsMonthlyVacanciesApiParams } = sandbox.module.exports;

  const params = buildSkillsMonthlyVacanciesApiParams(
    { scope: 'single', role_ids: ['96'] },
    {
      periods: ['Сегодня', '2026-04'],
      experiences: ['Нет опыта'],
      status: ['open'],
      country: ['ru'],
      currency: ['rur', 'usd'],
      employer: ['Acme'],
      accreditation: ['true'],
      cover_letter_required: ['false'],
      has_test: ['true'],
      skills_include: ['Python'],
      skills_exclude: ['PHP'],
      skills_logic: 'and'
    },
    function normalizeAnalyticsPeriodForApi(value) {
      if (value === 'Сегодня') return 'today';
      return value;
    }
  );

  assert.equal(params.scope, 'single');
  assert.deepEqual(Array.from(params.role_ids), ['96']);
  assert.deepEqual(Array.from(params.periods), ['today', '2026-04']);
  assert.deepEqual(Array.from(params.experience), ['Нет опыта']);
  assert.equal(params.status, 'open');
  assert.equal(params.country, 'ru');
  assert.deepEqual(Array.from(params.currency), ['RUR', 'USD']);
  assert.deepEqual(Array.from(params.employer), ['Acme']);
  assert.equal(params.accreditation, 'true');
  assert.equal(params.cover_letter_required, 'false');
  assert.equal(params.has_test, 'true');
  assert.deepEqual(Array.from(params.skills_include), ['Python']);
  assert.deepEqual(Array.from(params.skills_exclude), ['PHP']);
  assert.equal(params.skills_logic, 'and');
  assert.equal(params.page, 1);
  assert.equal(params.per_page, 1000);
  assert.equal(params.sort, 'published_desc');
});
