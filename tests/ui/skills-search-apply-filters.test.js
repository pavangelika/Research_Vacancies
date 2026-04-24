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

runTest('applyGlobalFiltersToSkillsSearch delegates to initSkillsSearch without double refresh', () => {
  const script = [
    extractFunctionSource('getSkillsSearchContentBlock'),
    extractFunctionSource('applyGlobalFiltersToSkillsSearch'),
    'module.exports = { applyGlobalFiltersToSkillsSearch };'
  ].join('\n\n');
  let initCalls = 0;
  let updateCalls = 0;
  const block = { marker: 'skills-search-block' };
  const parentRole = {
    id: 'role-1',
    querySelector(selector) {
      if (selector === '.skills-search-content[data-analysis="skills-search"]') return null;
      if (selector === '.skills-search-content[data-analysis="skills-search-1"]') return block;
      if (selector === '.skills-search-content[data-analysis="skills-search-all"]') return null;
      if (selector === '.skills-search-content[data-analysis="skills-search-combined"]') return null;
      if (selector === '.skills-search-content[data-analysis^="skills-search-"]') return block;
      if (selector === '.skills-search-content[data-analysis^="skills-search"]') return block;
      if (selector === '.skills-search-content') return { marker: 'wrong-block' };
      throw new Error(`Unexpected selector ${selector}`);
    }
  };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    initSkillsSearch(role) {
      assert.equal(role, parentRole);
      initCalls += 1;
    },
    updateSkillsSearchData() {
      updateCalls += 1;
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'skills-search-apply-filters.vm.js' });
  const { applyGlobalFiltersToSkillsSearch } = sandbox.module.exports;

  applyGlobalFiltersToSkillsSearch(parentRole);

  assert.equal(initCalls, 1);
  assert.equal(updateCalls, 0);
});
