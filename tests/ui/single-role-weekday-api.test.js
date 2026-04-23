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

runTest('adaptSingleRoleWeekdayItemsFromApi normalizes backend payload for UI', () => {
  const script = [
    extractFunctionSource('adaptSingleRoleWeekdayItemsFromApi')
  ].join('\n\n') + '\nmodule.exports = { adaptSingleRoleWeekdayItemsFromApi };';

  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'single-role-weekday-api.vm.js' });
  const { adaptSingleRoleWeekdayItemsFromApi } = sandbox.module.exports;

  const rows = adaptSingleRoleWeekdayItemsFromApi({
    items: [
      { weekday: 'Monday', publications: 2, archives: 1, avg_pub_hour: '10:00', avg_arch_hour: '15:00' }
    ]
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].weekday, 'Monday');
  assert.equal(rows[0].publications, 2);
  assert.equal(rows[0].avg_pub_hour, '10:00');
});
