const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CSS_PATHS = [
  path.resolve(__dirname, '..', '..', 'reports', 'styles.css'),
  path.resolve(__dirname, '..', '..', 'reports', 'static', 'styles.css')
];

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

CSS_PATHS.forEach((filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');

  runTest(`${path.basename(filePath)} keeps dashboard topbar above the shared filter sidebar`, () => {
    assert.match(
      source,
      /body\.report-dashboard \.dashboard-topbar\s*\{[\s\S]*z-index:\s*(?:1\d{2,}|[4-9]\d)\s*;[\s\S]*isolation:\s*isolate\s*;/,
      `${path.basename(filePath)} should keep the sticky topbar in its own stacking context above the sidebar`
    );
    assert.match(
      source,
      /body\.report-dashboard \.dashboard-sidebar\s*\{[\s\S]*z-index:\s*\d+\s*;/,
      `${path.basename(filePath)} should set an explicit sidebar z-index below the topbar`
    );
  });
});
