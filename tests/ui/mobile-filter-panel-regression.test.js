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

runTest('mobile collapsed shared filter rail is not clipped by the sidebar container', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.report-dashboard\.shared-filters-collapsed\s+\.dashboard-sidebar\s*\{[\s\S]*width:\s*100(?:vw|%)\s*!important;[\s\S]*min-width:\s*100(?:vw|%)\s*!important;[\s\S]*max-width:\s*100(?:vw|%)\s*!important;[\s\S]*overflow:\s*visible\s*!important;/,
      `${path.basename(filePath)} should let the collapsed mobile shared filter rail extend across the viewport instead of clipping inside the sidebar`
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

runTest('mobile expanded shared filter sidebar rises above the dashboard topbar', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.report-dashboard\.shared-filters-expanded\s+\.dashboard-sidebar\s*\{[\s\S]*z-index:\s*(?:12[1-9]|1[3-9]\d{2,}|\d{4,})\s*!important;/,
      `${path.basename(filePath)} should raise the mobile expanded shared filter sidebar above the dashboard topbar`
    );
  });
});

runTest('mobile expanded shared filter panel opens fullscreen from viewport top', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /body\.report-dashboard\.shared-filters-expanded\s+#global-shared-filter-panel\[data-panel-open="1"\]\s*\{[^}]*top:\s*0\s*!important;[^}]*bottom:\s*0\s*!important;[^}]*height:\s*100dvh\s*!important;[^}]*min-height:\s*100dvh\s*!important;[^}]*max-height:\s*100dvh\s*!important;[^}]*background:\s*linear-gradient\(/,
      `${path.basename(filePath)} should open the mobile expanded shared filter panel fullscreen from the top of the viewport`
    );
    assert.doesNotMatch(
      source,
      /--mobile-shared-filter-top-offset/,
      `${path.basename(filePath)} should not keep a mobile top offset for the expanded shared filter panel`
    );
  });
});

runTest('mobile expanded shared filter panel inherits desktop spacing instead of compact mobile overrides', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /body\.report-dashboard\s+#global-shared-filter-panel\s+\.shared-filter-panel-body\s*\{[\s\S]*padding:\s*0\.4rem\s*!important;[\s\S]*gap:\s*calc\(var\(--filters-panel-gap\)\s*\*\s*1\.25\)\s*!important;/,
      `${path.basename(filePath)} should keep the desktop shared filter body spacing definition available`
    );
    assert.doesNotMatch(
      source,
      /body\.report-dashboard\s+#global-shared-filter-panel\s+\.shared-filter-panel-body\s*\{[\s\S]*padding:\s*0\.25rem\s+0\.4rem\s+0\.3rem\s+0\.3rem\s*!important;/,
      `${path.basename(filePath)} should not override the shared filter body padding with a compact mobile value`
    );
    assert.doesNotMatch(
      source,
      /body\.report-dashboard\.shared-filters-expanded\s+#global-shared-filter-panel\[data-panel-open="1"\]\s+\.shared-filter-panel-body\s*\{[\s\S]*gap:\s*0\s*!important;/,
      `${path.basename(filePath)} should not zero out the expanded mobile shared filter body gap`
    );
    assert.doesNotMatch(
      source,
      /body\.report-dashboard\.shared-filters-expanded\s+#role-selector\s+\.shared-filter-group\s*\+\s*\.shared-filter-group\s*\{[\s\S]*margin-top:\s*-4px\s*!important;/,
      `${path.basename(filePath)} should not use the compact negative margin between mobile expanded shared filter groups`
    );
    assert.doesNotMatch(
      source,
      /body\.report-dashboard\.shared-filters-expanded\s+#role-selector\s+\.shared-filter-group\s*\{[\s\S]*padding-bottom:\s*0\s*!important;/,
      `${path.basename(filePath)} should not flatten shared filter group padding in the expanded mobile panel`
    );
  });
});

runTest('mobile expanded role dropdown keeps its own scrollable menu container', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.report-dashboard\.shared-filters-expanded\s+#role-selector\s+\.global-filter-menu\s*\{[\s\S]*max-height:\s*min\(52dvh,\s*34rem\)\s*!important;[\s\S]*overflow-y:\s*auto\s*!important;[\s\S]*overscroll-behavior:\s*contain\s*!important;/,
      `${path.basename(filePath)} should keep long role dropdown lists scrollable inside the mobile expanded shared filter panel`
    );
  });
});

runTest('mobile expanded shared filter panel adds desktop-like separation after the open group', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /@media\s*\(max-width:\s*960px\)\s*\{[\s\S]*body\.report-dashboard\.shared-filters-expanded\s+#role-selector\s+\.shared-filter-group\[data-section-open="1"\]\s*\+\s*\.shared-filter-group\s*\{[\s\S]*margin-top:\s*var\(--filters-panel-open-group-separation\)\s*!important;/,
      `${path.basename(filePath)} should define the mobile open-group separation through an adaptive token`
    );
  });
});

runTest('adaptive filter panel scale defines shell and open-group spacing through clamp-based variables', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /--filters-panel-shell-gap:\s*clamp\(/,
      `${path.basename(filePath)} should define an adaptive shell gap token`
    );
    assert.match(
      source,
      /--filters-panel-group-stack-gap:\s*clamp\(/,
      `${path.basename(filePath)} should define an adaptive group stack gap token`
    );
    assert.match(
      source,
      /--filters-panel-open-group-separation:\s*clamp\(/,
      `${path.basename(filePath)} should define an adaptive open-group separation token`
    );
  });
});

runTest('adaptive filter panel scale removes targeted rigid px sizing from shared filter groups', () => {
  FILES.forEach((filePath) => {
    const source = read(filePath);
    [
      /body\.report-dashboard\s+#role-selector\s+\.shared-filter-group\s*\{[\s\S]*margin-top:\s*8px;/,
      /body\.report-dashboard\s+#role-selector\s+\.shared-filter-group-title\s*\{[\s\S]*min-height:\s*32px;/,
      /body\.report-dashboard\s+#role-selector\s+\.shared-filter-group-body\s*\{[\s\S]*padding:\s*2px 10px 6px !important;/
    ].forEach((pattern) => {
      assert.doesNotMatch(source, pattern, `${path.basename(filePath)} should remove rigid shared filter group sizing`);
    });
  });
});
