const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const RENDER_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.render.js');
const RENDER_SOURCE = fs.readFileSync(RENDER_SOURCE_PATH, 'utf8');

function extractFunctionSource(content, name) {
  const marker = `function ${name}(`;
  const start = content.indexOf(marker);
  if (start === -1) throw new Error(`Function ${name} not found`);
  const bodyStart = content.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return content.slice(start, i + 1);
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

runTest('summary top navigation keeps comparative analysis lookup on activity tabs', () => {
  const script = [
    extractFunctionSource(RENDER_SOURCE, 'normalizeAnalysisTypeForButtonLookup'),
    extractFunctionSource(RENDER_SOURCE, 'findAnalysisButtonByType'),
    'module.exports = { normalizeAnalysisTypeForButtonLookup, findAnalysisButtonByType };'
  ].join('\n\n');

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console
  };

  vm.runInNewContext(script, sandbox, { filename: 'top-navigation-summary-regression.vm.js' });
  const { normalizeAnalysisTypeForButtonLookup, findAnalysisButtonByType } = sandbox.module.exports;

  assert.equal(
    normalizeAnalysisTypeForButtonLookup('activity'),
    'activity',
    'activity lookup should stay on comparative activity analysis instead of redirecting to skills-search'
  );

  const buttons = [
    { dataset: { analysisId: 'skills-search-all' } },
    { dataset: { analysisId: 'activity-all' } },
    { dataset: { analysisId: 'weekday-all' } }
  ];
  const container = {
    querySelectorAll(selector) {
      assert.equal(selector, '.analysis-button[data-analysis-id]');
      return buttons;
    }
  };

  assert.equal(
    findAnalysisButtonByType(container, 'activity'),
    buttons[1],
    'activity lookup should target activity-all button in comparative mode'
  );
  assert.equal(
    findAnalysisButtonByType(container, 'weekday'),
    buttons[2],
    'weekday lookup should target weekday-all button in comparative mode'
  );
});

runTest('summary top navigation exits comparative mode before opening flat sections', () => {
  const uiSourcePath = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js');
  const uiSource = fs.readFileSync(uiSourcePath, 'utf8');
  const script = [
    extractFunctionSource(uiSource, 'scheduleTopNavigationAction'),
    extractFunctionSource(uiSource, 'handleTopNavigationClick'),
    'module.exports = { handleTopNavigationClick };'
  ].join('\n\n');

  let redirectedTo = null;
  let clicked = false;
  let synced = false;
  const activeRole = { id: 'role-all', dataset: { activeAnalysis: 'activity' } };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    window: {},
    uiState: {
      all_roles_active: true,
      global_analysis_type: 'activity',
      roleSelectionContext: {
        setSummaryActive() {}
      }
    },
    getActiveRoleContent() {
      return activeRole;
    },
    normalizeTopNavigationItem() {
      return 'activity';
    },
    clickAnalysisButtonByType() {
      clicked = true;
      return false;
    },
    syncDashboardTopbarMeta() {
      synced = true;
    },
    switchFromSummaryToAnalysis(type) {
      redirectedTo = type;
    },
    setTimeout(fn) {
      fn();
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'top-navigation-summary-exit.vm.js' });
  const { handleTopNavigationClick } = sandbox.module.exports;

  handleTopNavigationClick('my-responses', null);

  assert.equal(
    redirectedTo,
    'my-responses',
    'summary top navigation should exit comparative mode before opening my-responses'
  );
  assert.equal(clicked, false, 'summary top navigation should not try to click a flat section inside role-all');
  assert.equal(synced, false, 'summary top navigation should not only resync topbar without leaving comparative mode');
});
