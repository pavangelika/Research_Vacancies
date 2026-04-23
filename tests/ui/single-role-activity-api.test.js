const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DATA_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.data.js');
const DATA_SOURCE = fs.readFileSync(DATA_SOURCE_PATH, 'utf8');

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = DATA_SOURCE.indexOf(marker);
  if (start === -1) {
    throw new Error(`Function ${name} not found`);
  }
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

runTest('adaptSingleRoleActivityEntriesFromApi adds UI-compatible total row', () => {
  const script = [
    extractFunctionSource('adaptSingleRoleActivityEntriesFromApi')
  ].join('\n\n') + '\nmodule.exports = { adaptSingleRoleActivityEntriesFromApi };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console
  };
  vm.runInNewContext(script, sandbox, { filename: 'single-role-activity-api.vm.js' });
  const { adaptSingleRoleActivityEntriesFromApi } = sandbox.module.exports;

  const rows = adaptSingleRoleActivityEntriesFromApi({
    months: [
      {
        month: 'last_7',
        entries: [
          { experience: 'Нет опыта', total: 2, active: 1, archived: 1, avg_age_days: 2.5 },
          { experience: 'От 1 года до 3 лет', total: 1, active: 1, archived: 0, avg_age_days: null }
        ]
      }
    ]
  });

  assert.equal(rows.length, 3);
  assert.equal(rows[0].experience, 'Нет опыта');
  assert.equal(rows[0].avg_age, 2.5);
  assert.equal(rows[2].experience, 'Всего');
  assert.equal(rows[2].total, 3);
  assert.equal(rows[2].active, 2);
  assert.equal(rows[2].archived, 1);
});
