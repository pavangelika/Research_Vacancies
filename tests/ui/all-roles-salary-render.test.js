const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js');
const UI_SOURCE = fs.readFileSync(UI_SOURCE_PATH, 'utf8');

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = UI_SOURCE.indexOf(marker);
  if (start === -1) {
    throw new Error(`Function ${name} not found`);
  }
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

runTest('restoreAllRolesPeriodState renders salary-all graph when wrapper has no month buttons', () => {
  const script = [
    extractFunctionSource('restoreAllRolesPeriodState')
  ].join('\n\n') + '\nmodule.exports = { restoreAllRolesPeriodState };';

  const target = {
    style: { display: 'none' },
    dataset: { period: 'all' }
  };
  const wrapper = {
    querySelector(selector) {
      if (selector === '.all-roles-period-content') return target;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.month-button') return [];
      if (selector === '.all-roles-period-content') return [target];
      return [];
    }
  };
  const parentRole = {
    querySelector(selector) {
      if (selector === '.all-roles-period-wrapper[data-analysis="salary-all"]') return wrapper;
      return null;
    }
  };

  const calls = [];
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: { all_roles_periods: { salary: 'all' } },
    renderAllRolesSalaryPeriodContent(node, periodLabel) {
      calls.push({ node, periodLabel });
    },
    findAllPeriodButton() {
      return null;
    },
    findSummaryPeriodButton() {
      return null;
    },
    Array
  };
  vm.runInNewContext(script, sandbox, { filename: 'all-roles-salary-render.vm.js' });
  const { restoreAllRolesPeriodState } = sandbox.module.exports;

  restoreAllRolesPeriodState(parentRole, 'salary');

  assert.equal(target.style.display, 'block');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].node, target);
  assert.equal(calls[0].periodLabel, 'all');
});
