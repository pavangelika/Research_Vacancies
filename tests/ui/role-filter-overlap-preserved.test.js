const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const FILTERS_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.filters.js');
const FILTERS_SOURCE = fs.readFileSync(FILTERS_SOURCE_PATH, 'utf8');

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = FILTERS_SOURCE.indexOf(marker);
  if (start === -1) throw new Error(`Function ${name} not found`);
  const bodyStart = FILTERS_SOURCE.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < FILTERS_SOURCE.length; i += 1) {
    const ch = FILTERS_SOURCE[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return FILTERS_SOURCE.slice(start, i + 1);
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

runTest('ensureGlobalFilterBucket keeps overlapping roles include/exclude values for subtraction logic', () => {
  const script = extractFunctionSource('ensureGlobalFilterBucket') + '\nmodule.exports = { ensureGlobalFilterBucket };';
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {
      global_filters: {
        roles: {
          include: ['1', '2', '2', '3'],
          exclude: ['2', '3', '3'],
          autoDefault: ''
        }
      }
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'role-filter-overlap-preserved.vm.js' });
  const { ensureGlobalFilterBucket } = sandbox.module.exports;

  const bucket = ensureGlobalFilterBucket('roles');

  assert.deepEqual(bucket.include, ['1', '2', '3']);
  assert.deepEqual(bucket.exclude, ['2', '3']);
});
