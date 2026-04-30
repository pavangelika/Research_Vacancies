const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RENDER_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.render.js');

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('report renderers use vacancy collection period label across tabs', () => {
  const source = fs.readFileSync(RENDER_SOURCE_PATH, 'utf8');
  assert.match(
    source,
    /Период сбора вакансий:/,
    `${path.basename(RENDER_SOURCE_PATH)} should use the vacancy collection period label`
  );
  assert.doesNotMatch(
    source,
    /Период публикации:/,
    `${path.basename(RENDER_SOURCE_PATH)} should not keep the old publication period label`
  );
});
