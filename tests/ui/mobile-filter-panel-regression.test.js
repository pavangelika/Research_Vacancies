const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FILES = [
  path.resolve(__dirname, '..', '..', 'reports', 'styles.css'),
  path.resolve(__dirname, '..', '..', 'reports', 'static', 'styles.css')
];
const UI_FILES = [
  path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js'),
  path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js')
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
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

runTest('mobile filter overlay keeps dashboard topbar meta visible', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /body\.report-dashboard\.shared-filters-expanded\s+\.dashboard-topbar-meta\s*\{[\s\S]*display:\s*(flex|grid|block)\s*!important;/,
      `${path.basename(filePath)} should explicitly show dashboard topbar meta when mobile shared filters are expanded`
    );
  });
});

runTest('mobile collapsed shared filter rail stays horizontal', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="0"\]\s+\.shared-filter-panel-rail,\s*[\r\n]+\s*body\.report-dashboard\s+#global-shared-filter-panel\.is-collapsed\s+\.shared-filter-panel-rail\s*\{[\s\S]*flex-direction:\s*row\s*!important;[\s\S]*overflow-x:\s*auto\s*!important;/,
      `${path.basename(filePath)} should keep collapsed shared filter rail horizontal on mobile`
    );
  });
});

runTest('mobile collapsed shared filter rail does not depend on overlay open state', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="0"\],\s*[\r\n]+\s*body\.report-dashboard\s+#global-shared-filter-panel\.is-collapsed\s*\{[\s\S]*width:\s*100%\s*!important;[\s\S]*body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="0"\]\s+\.shared-filter-panel-rail,\s*[\r\n]+\s*body\.report-dashboard\s+#global-shared-filter-panel\.is-collapsed\s+\.shared-filter-panel-rail\s*\{[\s\S]*flex-direction:\s*row\s*!important;[\s\S]*overflow-x:\s*auto\s*!important;/,
      `${path.basename(filePath)} should keep collapsed shared filter rail horizontal for mobile viewport even without mobile-filters-open`
    );
  });
});

runTest('mobile shared filter panel no longer references floating mobile toggle controls', () => {
  FILES.concat(UI_FILES).forEach((filePath) => {
    const source = read(filePath);
    assert.doesNotMatch(
      source,
      /mobile-filter-toggle|mobile-filter-backdrop/,
      `${path.basename(filePath)} should not reference legacy floating mobile filter controls`
    );
  });
});

runTest('mobile expanded shared filter panel is driven by shared panel state selectors', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /body\.report-dashboard\.shared-filters-expanded\s+#global-shared-filter-panel\[data-panel-open="1"\]\s*\{[\s\S]*position:\s*fixed\s*!important;/,
      `${path.basename(filePath)} should drive mobile expanded overlay from shared panel state`
    );
  });
});
