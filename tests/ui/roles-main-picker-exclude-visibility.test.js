const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js');
const UI_SOURCE = fs.readFileSync(UI_SOURCE_PATH, 'utf8');

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = UI_SOURCE.indexOf(marker);
  if (start === -1) throw new Error(`Function ${name} not found`);
  const bodyStart = UI_SOURCE.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < UI_SOURCE.length; i += 1) {
    const ch = UI_SOURCE[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return UI_SOURCE.slice(start, i + 1);
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

runTest('getVisibleRoleOptionsForPrimarySelector hides globally excluded roles from the main role picker', () => {
  const script = [
    extractFunctionSource('isRoleFilterOptionExcluded'),
    extractFunctionSource('getVisibleRoleOptionsForPrimarySelector'),
    'module.exports = { getVisibleRoleOptionsForPrimarySelector };'
  ].join('\n');

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {
      market_trends_excluded_roles: ['1', '3']
    },
    isSameGlobalFilterValue(filterKey, left, right) {
      return String(left || '').trim() === String(right || '').trim();
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'roles-main-picker-exclude-visibility.vm.js' });
  const { getVisibleRoleOptionsForPrimarySelector } = sandbox.module.exports;

  const visible = getVisibleRoleOptionsForPrimarySelector(
    [
      { value: '1', label: 'Аналитик' },
      { value: '2', label: 'BI-аналитик' },
      { value: '3', label: 'Data Scientist' }
    ],
    { include: ['1', '2', '3'], exclude: [] }
  );

  assert.deepEqual(visible, [
    { value: '2', label: 'BI-аналитик' }
  ]);
});
