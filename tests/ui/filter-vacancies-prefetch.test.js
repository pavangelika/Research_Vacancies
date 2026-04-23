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

runTest('shouldPrefetchRoleVacanciesForFilters requests prefetch for single-role summary analysis', () => {
  const script = [
    extractFunctionSource('shouldPrefetchRoleVacanciesForFilters')
  ].join('\n\n') + '\nmodule.exports = { shouldPrefetchRoleVacanciesForFilters };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getRoleVacancies: () => []
  };
  vm.runInNewContext(script, sandbox, { filename: 'filter-vacancies-prefetch.vm.js' });
  const { shouldPrefetchRoleVacanciesForFilters } = sandbox.module.exports;

  const result = shouldPrefetchRoleVacanciesForFilters({
    id: 'role-96',
    dataset: { activeAnalysis: 'salary' }
  }, 'salary');

  assert.equal(result, true);
});

runTest('shouldPrefetchRoleVacanciesForFilters skips skills-search because the screen is API-driven', () => {
  const script = [
    extractFunctionSource('shouldPrefetchRoleVacanciesForFilters')
  ].join('\n\n') + '\nmodule.exports = { shouldPrefetchRoleVacanciesForFilters };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getRoleVacancies: () => []
  };
  vm.runInNewContext(script, sandbox, { filename: 'filter-vacancies-prefetch-skills-search.vm.js' });
  const { shouldPrefetchRoleVacanciesForFilters } = sandbox.module.exports;

  const result = shouldPrefetchRoleVacanciesForFilters({
    id: 'role-96',
    dataset: { activeAnalysis: 'skills-search' }
  }, 'skills-search');

  assert.equal(result, false);
});

runTest('shouldPrefetchRoleVacanciesForFilters skips totals startup when only top section is active', () => {
  const script = [
    extractFunctionSource('shouldPrefetchRoleVacanciesForFilters')
  ].join('\n\n') + '\nmodule.exports = { shouldPrefetchRoleVacanciesForFilters };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {
      shared_filter_panel_state: {
        lastAnalysis: '',
        activeSection: 'top'
      }
    },
    getRoleVacancies: () => []
  };
  vm.runInNewContext(script, sandbox, { filename: 'filter-vacancies-prefetch-totals.vm.js' });
  const { shouldPrefetchRoleVacanciesForFilters } = sandbox.module.exports;

  const result = shouldPrefetchRoleVacanciesForFilters({
    id: 'role-96',
    dataset: { activeAnalysis: 'totals' }
  }, 'totals');

  assert.equal(result, false);
});

runTest('shouldPrefetchRoleVacanciesForFilters allows totals vacancy-driven sections to lazy load role vacancies', () => {
  const script = [
    extractFunctionSource('shouldPrefetchRoleVacanciesForFilters')
  ].join('\n\n') + '\nmodule.exports = { shouldPrefetchRoleVacanciesForFilters };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {
      shared_filter_panel_state: {
        lastAnalysis: 'totals',
        activeSection: 'vacancy',
        userActivatedSectionKey: 'vacancy'
      }
    },
    getRoleVacancies: () => []
  };
  vm.runInNewContext(script, sandbox, { filename: 'filter-vacancies-prefetch-totals-vacancy.vm.js' });
  const { shouldPrefetchRoleVacanciesForFilters } = sandbox.module.exports;

  const result = shouldPrefetchRoleVacanciesForFilters({
    id: 'role-96',
    dataset: { activeAnalysis: 'totals' }
  }, 'totals');

  assert.equal(result, true);
});

runTest('shouldPrefetchRoleVacanciesForFilters skips prefetch after one completed attempt', () => {
  const script = [
    extractFunctionSource('shouldPrefetchRoleVacanciesForFilters')
  ].join('\n\n') + '\nmodule.exports = { shouldPrefetchRoleVacanciesForFilters };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getRoleVacancies: () => []
  };
  vm.runInNewContext(script, sandbox, { filename: 'filter-vacancies-prefetch-done.vm.js' });
  const { shouldPrefetchRoleVacanciesForFilters } = sandbox.module.exports;

  const result = shouldPrefetchRoleVacanciesForFilters({
    id: 'role-96',
    dataset: { activeAnalysis: 'salary' },
    _data: { filterVacanciesPrefetchDone: true }
  }, 'salary');

  assert.equal(result, false);
});
