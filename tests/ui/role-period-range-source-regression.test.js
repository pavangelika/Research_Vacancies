const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RENDER_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.render.js');
const UI_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js');
const TEMPLATE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'templates', 'report_template.html');

const RENDER_SOURCE = fs.readFileSync(RENDER_SOURCE_PATH, 'utf8');
const UI_SOURCE = fs.readFileSync(UI_SOURCE_PATH, 'utf8');
const TEMPLATE = fs.readFileSync(TEMPLATE_PATH, 'utf8');

function extractFunctionSource(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Function ${name} not found`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
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

runTest('report template exposes period range attribute for each role', () => {
  assert.match(
    TEMPLATE,
    /data-period-range="{{ role\.period_range or '' }}"/,
    'role template should expose server-calculated full period range'
  );
});

runTest('showSingleRole prefers server period range when available', () => {
  const source = extractFunctionSource(RENDER_SOURCE, 'showSingleRole');
  assert.match(
    source,
    /dataset\.periodRange/,
    'single-role period should use server-provided full period range before local vacancy subset'
  );
});

runTest('renderGlobalTotalsFiltered uses role period range attribute for single-role dashboard', () => {
  const source = extractFunctionSource(UI_SOURCE, 'renderGlobalTotalsFiltered');
  assert.match(
    source,
    /dataset\.periodRange/,
    'single-role dashboard period should use server-provided full period range'
  );
});
