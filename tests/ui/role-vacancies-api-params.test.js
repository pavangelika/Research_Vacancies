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

runTest('buildRoleVacanciesApiParams builds single-role all-period request', () => {
  const names = [
    'buildRoleVacanciesApiParams'
  ];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'role-vacancies-api-params.vm.js' });
  const { buildRoleVacanciesApiParams } = sandbox.module.exports;

  const params = buildRoleVacanciesApiParams({
    dataset: {
      roleId: '96'
    }
  });

  assert.equal(params.scope, 'single');
  assert.deepEqual(Array.from(params.role_ids), ['96']);
  assert.deepEqual(Array.from(params.periods), []);
  assert.equal(params.page, 1);
  assert.equal(params.per_page, 1000);
  assert.equal(params.sort, 'published_desc');
});
