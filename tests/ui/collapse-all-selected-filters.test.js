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

runTest('collapseResolvedFilterValuesWhenAllSelected drops all-selected currency values', () => {
  const script = extractFunctionSource('collapseResolvedFilterValuesWhenAllSelected') + '\nmodule.exports = { collapseResolvedFilterValuesWhenAllSelected };';
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'collapse-all-selected-currency.vm.js' });
  const { collapseResolvedFilterValuesWhenAllSelected } = sandbox.module.exports;

  const result = collapseResolvedFilterValuesWhenAllSelected(
    ['rur', 'usd', 'eur'],
    [{ value: 'rur' }, { value: 'usd' }, { value: 'eur' }]
  );

  assert.deepEqual(Array.from(result), []);
});

runTest('collapseResolvedFilterValuesWhenAllSelected drops all-selected country values', () => {
  const script = extractFunctionSource('collapseResolvedFilterValuesWhenAllSelected') + '\nmodule.exports = { collapseResolvedFilterValuesWhenAllSelected };';
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'collapse-all-selected-country.vm.js' });
  const { collapseResolvedFilterValuesWhenAllSelected } = sandbox.module.exports;

  const result = collapseResolvedFilterValuesWhenAllSelected(
    ['ru', 'not_ru', 'none'],
    [{ value: 'ru' }, { value: 'not_ru' }, { value: 'none' }]
  );

  assert.deepEqual(Array.from(result), []);
});
