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

runTest('getSharedFilterMaterialGlyph maps known icon names to local glyphs', () => {
  const script = extractFunctionSource('getSharedFilterMaterialGlyph') + '\nmodule.exports = { getSharedFilterMaterialGlyph };';
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-material-glyph.vm.js' });
  const { getSharedFilterMaterialGlyph } = sandbox.module.exports;

  assert.equal(getSharedFilterMaterialGlyph('favorite'), '♥');
  assert.equal(getSharedFilterMaterialGlyph('mail'), '✉');
  assert.equal(getSharedFilterMaterialGlyph('local_fire_department'), '✦');
  assert.equal(getSharedFilterMaterialGlyph('unknown_icon'), '•');
});
