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

runTest('adaptSingleRoleSalaryMonthFromApi groups rows by experience and appends summary experience', () => {
  const script = [
    extractFunctionSource('adaptSingleRoleSalaryMonthFromApi')
  ].join('\n\n') + '\nmodule.exports = { adaptSingleRoleSalaryMonthFromApi };';

  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'single-role-salary-api.vm.js' });
  const { adaptSingleRoleSalaryMonthFromApi } = sandbox.module.exports;

  const month = adaptSingleRoleSalaryMonthFromApi({
    items: [
      {
        month: '2026-04',
        experience: 'Нет опыта',
        status: 'Открытая',
        currency: 'RUR',
        total_vacancies: 2,
        avg_salary: 240000,
        median_salary: 230000,
        mode_salary: 220000,
        min_salary: 180000,
        max_salary: 300000,
        top_skills: 'Python (2)'
      },
      {
        month: '2026-04',
        experience: 'От 1 года до 3 лет',
        status: 'Архивная',
        currency: 'RUR',
        total_vacancies: 1,
        avg_salary: 260000,
        median_salary: 260000,
        mode_salary: 260000,
        min_salary: 260000,
        max_salary: 260000,
        top_skills: 'SQL (1)'
      }
    ]
  }, 'За 14 дней');

  assert.equal(month.month, 'За 14 дней');
  assert.equal(month.experiences.length, 3);
  assert.equal(month.experiences[0].experience, 'Нет опыта');
  assert.equal(month.experiences[0].entries[0].status, 'Открытая');
  assert.equal(month.experiences[2].experience, 'Все');
  assert.equal(month.experiences[2].entries.length, 2);
});
