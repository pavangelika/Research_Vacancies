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

runTest('shouldPrefetchRoleVacanciesForAnalysis requests prefetch for single-role salary analysis', () => {
  const script = [
    extractFunctionSource('shouldPrefetchRoleVacanciesForAnalysis')
  ].join('\n\n') + '\nmodule.exports = { shouldPrefetchRoleVacanciesForAnalysis };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getRoleVacancies: () => []
  };
  vm.runInNewContext(script, sandbox, { filename: 'analysis-vacancies-prefetch.vm.js' });
  const { shouldPrefetchRoleVacanciesForAnalysis } = sandbox.module.exports;

  const result = shouldPrefetchRoleVacanciesForAnalysis({
    id: 'role-96',
    dataset: { activeAnalysis: 'salary' }
  }, 'salary');

  assert.equal(result, true);
});

runTest('shouldPrefetchRoleVacanciesForAnalysis skips once prefetch has completed', () => {
  const script = [
    extractFunctionSource('shouldPrefetchRoleVacanciesForAnalysis')
  ].join('\n\n') + '\nmodule.exports = { shouldPrefetchRoleVacanciesForAnalysis };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getRoleVacancies: () => []
  };
  vm.runInNewContext(script, sandbox, { filename: 'analysis-vacancies-prefetch-done.vm.js' });
  const { shouldPrefetchRoleVacanciesForAnalysis } = sandbox.module.exports;

  const result = shouldPrefetchRoleVacanciesForAnalysis({
    id: 'role-96',
    dataset: { activeAnalysis: 'totals' },
    _data: { analysisVacanciesPrefetchDone: true }
  }, 'totals');

  assert.equal(result, false);
});

runTest('shouldPrefetchRoleVacanciesForAnalysis skips skills-search because it uses direct API fetches', () => {
  const script = [
    extractFunctionSource('shouldPrefetchRoleVacanciesForAnalysis')
  ].join('\n\n') + '\nmodule.exports = { shouldPrefetchRoleVacanciesForAnalysis };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getRoleVacancies: () => []
  };
  vm.runInNewContext(script, sandbox, { filename: 'analysis-vacancies-prefetch-skills-search.vm.js' });
  const { shouldPrefetchRoleVacanciesForAnalysis } = sandbox.module.exports;

  const result = shouldPrefetchRoleVacanciesForAnalysis({
    id: 'role-96',
    dataset: { activeAnalysis: 'skills-search' }
  }, 'skills-search');

  assert.equal(result, false);
});

runTest('shouldPrefetchRoleVacanciesForAnalysis skips totals because the screen already has dedicated API sources', () => {
  const script = [
    extractFunctionSource('shouldPrefetchRoleVacanciesForAnalysis')
  ].join('\n\n') + '\nmodule.exports = { shouldPrefetchRoleVacanciesForAnalysis };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getRoleVacancies: () => []
  };
  vm.runInNewContext(script, sandbox, { filename: 'analysis-vacancies-prefetch-totals.vm.js' });
  const { shouldPrefetchRoleVacanciesForAnalysis } = sandbox.module.exports;

  const result = shouldPrefetchRoleVacanciesForAnalysis({
    id: 'role-96',
    dataset: { activeAnalysis: 'totals' }
  }, 'totals');

  assert.equal(result, false);
});
