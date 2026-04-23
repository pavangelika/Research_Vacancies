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

runTest('createSharedFilterMaterialIcon uses ligature text and does not configure external mask image', () => {
  const script = [
    extractFunctionSource('getSharedFilterMaterialGlyph'),
    extractFunctionSource('createSharedFilterMaterialIcon')
  ].join('\n\n') + '\nmodule.exports = { createSharedFilterMaterialIcon };';

  function createElement(tagName) {
    return {
      tagName,
      className: '',
      dataset: {},
      style: {},
      attributes: {},
      children: [],
      textContent: '',
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      appendChild(child) {
        this.children.push(child);
        return child;
      }
    };
  }

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    document: { createElement }
  };

  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-material-icon.vm.js' });
  const { createSharedFilterMaterialIcon } = sandbox.module.exports;
  const icon = createSharedFilterMaterialIcon('local_fire_department', 'rail-icon');

  assert.equal(icon.className, 'rail-icon shared-filter-local-icon');
  assert.equal(icon.dataset.icon, 'local_fire_department');
  assert.equal(icon.textContent, '✦');
  assert.equal(icon.style.webkitMaskImage, undefined);
  assert.equal(icon.style.maskImage, undefined);
  assert.deepEqual(icon.children, []);
});
