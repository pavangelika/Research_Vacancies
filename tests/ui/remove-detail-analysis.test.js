const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js');
const RENDER_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.render.js');

const UI_SOURCE = fs.readFileSync(UI_SOURCE_PATH, 'utf8');
const RENDER_SOURCE = fs.readFileSync(RENDER_SOURCE_PATH, 'utf8');

function extractVariableSource(content, name) {
  const marker = `var ${name} =`;
  const start = content.indexOf(marker);
  if (start === -1) throw new Error(`Variable ${name} not found`);
  const end = content.indexOf('];', start);
  if (end === -1) throw new Error(`Variable ${name} terminator not found`);
  return content.slice(start, end + 2);
}

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

runTest('dashboard top navigation does not expose detail section or route activity into detail', () => {
  const script = [
    extractVariableSource(UI_SOURCE, 'DASHBOARD_TOP_NAV_SECTIONS'),
    extractFunctionSource(UI_SOURCE, 'getTopNavigationSection'),
    extractFunctionSource(UI_SOURCE, 'normalizeTopNavigationSection'),
    'module.exports = { DASHBOARD_TOP_NAV_SECTIONS, getTopNavigationSection, normalizeTopNavigationSection };'
  ].join('\n\n');

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {
      global_analysis_type: '',
      all_roles_active: false
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'remove-detail-analysis-ui.vm.js' });
  const { DASHBOARD_TOP_NAV_SECTIONS, normalizeTopNavigationSection } = sandbox.module.exports;

  assert.equal(
    DASHBOARD_TOP_NAV_SECTIONS.some((section) => section.key === 'detail'),
    false,
    'top navigation should not contain detail section'
  );
  assert.equal(
    normalizeTopNavigationSection('activity', { id: 'role-python', dataset: {} }),
    'dashboard',
    'activity fallback should route to dashboard after detail section removal'
  );
});

runTest('combined report renderer does not build detail-analysis tabs', () => {
  const forbiddenMarkers = [
    'Детальный анализ',
    'activity-combined',
    'weekday-combined',
    'skills-monthly-combined',
    'salary-combined',
    'employer-analysis-combined',
    'Динамика вакансий',
    'Дни активности',
    'Вилка зарплат',
    'Анализ компаний'
  ];

  forbiddenMarkers.forEach((marker) => {
    assert.equal(
      RENDER_SOURCE.includes(marker),
      false,
      `report.render.js should not contain marker: ${marker}`
    );
  });
});
