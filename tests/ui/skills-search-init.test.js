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

runTest('initSkillsSearch applies default period before the first API-driven refresh', () => {
  const script = [
    extractFunctionSource('getSkillsSearchContentBlock'),
    extractFunctionSource('initSkillsSearch'),
    'module.exports = { initSkillsSearch };'
  ].join('\n\n');
  const events = [];
  const block = {
    _data: null,
    dataset: {},
    isConnected: true
  };
  const wrongBlock = { marker: 'wrong-block', _data: { fullVacancies: true } };
  const parentRole = {
    id: 'role-1',
    querySelector(selector) {
      if (selector === '.skills-search-content[data-analysis="skills-search"]') return null;
      if (selector === '.skills-search-content[data-analysis="skills-search-1"]') return block;
      if (selector === '.skills-search-content[data-analysis="skills-search-all"]') return null;
      if (selector === '.skills-search-content[data-analysis="skills-search-combined"]') return null;
      if (selector === '.skills-search-content[data-analysis^="skills-search-"]') return block;
      if (selector === '.skills-search-content[data-analysis^="skills-search"]') return block;
      if (selector === '.skills-search-content') return wrongBlock;
      throw new Error(`Unexpected selector ${selector}`);
    }
  };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    ensureDefaultPeriodFilterSelection(role, analysisType) {
      assert.equal(role, parentRole);
      assert.equal(analysisType, 'skills-search');
      events.push('default-period');
      return true;
    },
    getRoleSalaryData() {
      events.push('salary-data');
      return [{ month: '2026-04' }];
    },
    getRoleVacancies() {
      events.push('role-vacancies');
      return [];
    },
    collectVacanciesFromSalaryMonths() {
      events.push('salary-month-vacancies');
      return [];
    },
    dedupeVacanciesById(items) {
      return Array.isArray(items) ? items.slice() : [];
    },
    computeSalarySkillsFromVacancies() {
      return [];
    },
    isSummaryMonth() {
      return false;
    },
    formatMonthTitle(count) {
      return `За ${count} месяц`;
    },
    updateSkillsSearchData(targetBlock) {
      assert.equal(targetBlock, block);
      events.push('refresh');
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'skills-search-init.vm.js' });
  const { initSkillsSearch } = sandbox.module.exports;

  initSkillsSearch(parentRole);

  assert.deepEqual(events.slice(0, 2), ['default-period', 'salary-data']);
  assert.equal(events.includes('refresh'), true);
  assert.equal(block._data.fullVacancies, false);
});
