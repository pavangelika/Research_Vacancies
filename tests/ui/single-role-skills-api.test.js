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

runTest('adaptSingleRoleSkillsMonthFromApi keeps backend month payload in UI-ready format', () => {
  const script = [
    extractFunctionSource('adaptSingleRoleSkillsMonthFromApi')
  ].join('\n\n') + '\nmodule.exports = { adaptSingleRoleSkillsMonthFromApi };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    normalizeExperience: (value) => String(value || '').trim(),
    getExperienceOrder: () => ({
      'Нет опыта': 1,
      'От 1 года до 3 лет': 2,
      'От 3 до 6 лет': 3,
      'Более 6 лет': 4
    })
  };
  vm.runInNewContext(script, sandbox, { filename: 'single-role-skills-api.vm.js' });
  const { adaptSingleRoleSkillsMonthFromApi } = sandbox.module.exports;

  const month = adaptSingleRoleSkillsMonthFromApi({
    months: [
      {
        month: 'last_7',
        experiences: [
          {
            experience: 'От 1 года до 3 лет',
            total_vacancies: 1,
            skills: [
              { skill: 'SQL', count: 1, coverage: 100, rank: 1 }
            ]
          },
          {
            experience: 'Нет опыта',
            total_vacancies: 2,
            skills: [
              { skill: 'Python', count: 2, coverage: 100, rank: 1 },
              { skill: 'FastAPI', count: 1, coverage: 50, rank: 2 }
            ]
          }
        ]
      }
    ]
  }, 'За 7 дней');

  assert.equal(month.month, 'За 7 дней');
  assert.equal(month.experiences.length, 2);
  assert.equal(month.experiences[0].experience, 'Нет опыта');
  assert.equal(month.experiences[0].skills[0].skill, 'Python');
  assert.equal(month.experiences[0].skills[0].coverage, 100);
});
