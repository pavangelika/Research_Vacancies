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

runTest('applyGlobalRoleFilter keeps summary mode when one role remains on comparative analysis', () => {
  const script = [
    extractFunctionSource('applyGlobalRoleFilter'),
    'module.exports = { applyGlobalRoleFilter };'
  ].join('\n\n');

  let exitedSummary = false;
  let appliedSelection = false;
  const activeRole = { dataset: { activeAnalysis: 'activity' } };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {
      global_analysis_type: 'totals',
      roleSelectionContext: {
        exitAllRolesMode() {
          exitedSummary = true;
        },
        applySelection(nextSelected) {
          appliedSelection = Array.from(nextSelected);
        }
      }
    },
    getActiveRoleContent() {
      return activeRole;
    },
    getGlobalFilterOptions() {
      return [{ value: '1' }, { value: '2' }, { value: '3' }];
    },
    ensureGlobalFilterBucket() {
      return { include: ['1'], exclude: [] };
    },
    isSummaryModeActive() {
      return true;
    },
    isGlobalFilterMultiEnabled() {
      return false;
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'single-role-detail-tab-regression.vm.js' });
  const { applyGlobalRoleFilter } = sandbox.module.exports;

  applyGlobalRoleFilter();

  assert.equal(exitedSummary, false, 'comparative tab should not force exit from summary mode when one role remains selected');
  assert.deepEqual(appliedSelection, ['1'], 'the selected single role should still be applied inside summary mode');
  assert.equal(sandbox.uiState.global_analysis_type, 'activity');
});
