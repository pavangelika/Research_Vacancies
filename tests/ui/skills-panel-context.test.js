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

runTest('getSkillsSearchPanelContext does not init hidden skills-search for totals analysis', () => {
  const script = [
    extractFunctionSource('getSkillsSearchPanelVacancies'),
    extractFunctionSource('getSkillsSearchPanelContext')
  ].join('\n\n') + '\nmodule.exports = { getSkillsSearchPanelContext };';

  let initCalls = 0;
  let computeCalls = 0;
  const block = {
    _data: null
  };
  const parentRole = {
    id: 'role-1',
    dataset: { activeAnalysis: 'totals' },
    querySelector(selector) {
      if (selector === '.skills-search-content[data-analysis="skills-search-1"]') return block;
      if (selector === '.skills-search-content[data-analysis="skills-search-all"]') return null;
      if (selector === '.skills-search-content[data-analysis="skills-search-combined"]') return null;
      if (selector === '.skills-search-content[data-analysis^="skills-search-"]') return block;
      if (selector === '.skills-search-content[data-analysis^="skills-search"]') return block;
      if (selector === '.skills-search-content') return { _data: { skills: [{ skill: 'wrong', count: 99 }] } };
      throw new Error(`Unexpected selector ${selector}`);
    }
  };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    getSkillsSearchContentBlock(role, analysisType) {
      assert.equal(role, parentRole);
      assert.equal(analysisType, 'totals');
      return block;
    },
    initSkillsSearch() {
      initCalls += 1;
    },
    collectScopedVacancies(role) {
      assert.equal(role, parentRole);
      return [{ id: '1', skills: 'SQL' }];
    },
    getFilteredVacanciesForAnalysis() {
      throw new Error('should not fall back to generic analysis source when scoped vacancies exist');
    },
    computeSalarySkillsFromVacancies(vacancies, limit) {
      computeCalls += 1;
      assert.deepEqual(vacancies, [{ id: '1', skills: 'SQL' }]);
      assert.equal(limit, 200);
      return [{ skill: 'SQL', count: 1 }];
    },
    getSkillsSearchSelections(targetBlock) {
      assert.equal(targetBlock, block);
      return { includeSkills: [], excludeSkills: [], logic: 'or' };
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'skills-panel-context.vm.js' });
  const { getSkillsSearchPanelContext } = sandbox.module.exports;

  const result = getSkillsSearchPanelContext(parentRole, 'totals');

  assert.equal(initCalls, 0);
  assert.equal(computeCalls, 1);
  assert.deepEqual(result.skills, [{ skill: 'SQL', count: 1 }]);
  assert.equal(result.block, block);
});
