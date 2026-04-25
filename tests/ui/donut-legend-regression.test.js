const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPORT_UI_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js');
const STATIC_REPORT_UI_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js');
const REPORT_STYLES_PATH = path.resolve(__dirname, '..', '..', 'reports', 'styles.css');
const STATIC_REPORT_STYLES_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'styles.css');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
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

function extractSection(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  if (start === -1) throw new Error(`Marker not found: ${startMarker}`);
  const end = content.indexOf(endMarker, start);
  if (end === -1) throw new Error(`Marker not found: ${endMarker}`);
  return content.slice(start, end);
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

function assertUiSourceContracts(source, label) {
  const donutFn = extractFunctionSource(source, 'buildDonutChartHtml');
  const interactivitySection = extractSection(source, 'function syncDonutSelection', 'function applyGlobalFiltersToActiveAnalysis');
  const drilldownFn = extractFunctionSource(source, 'buildTotalsExperienceDrilldownHtml');
  const salarySection = extractSection(source, 'function buildTotalsSalaryProgressSource', 'function buildTotalsSalaryOverviewSectionHtml');

  assert.match(donutFn, /var donutNewLabel = 'РќРѕРІС‹Рµ';|var donutNewLabel = 'Новые';/);
  assert.match(donutFn, /var donutPublishedArchivedLabel = 'РћРїСѓР±Р»\. Рё Р°СЂС…РёРІРёСЂ\.';|var donutPublishedArchivedLabel = 'Опубл\. и архивир\.';/);
  assert.match(donutFn, /donut-chart-segment-inner donut-chart-segment-published-archived/);
  assert.match(donutFn, /donut-legend-action-published-archived/);
  assert.match(donutFn, /donut-legend-item donut-legend-kpi donut-legend-item-passive/);
  assert.match(donutFn, /vacancy-donut-shell/);
  assert.match(donutFn, /vacancy-donut-chart-area/);
  assert.match(donutFn, /vacancy-donut-status-area/);
  assert.match(donutFn, /vacancy-donut-status-list/);
  assert.match(donutFn, /data-selection-key="active"/);
  assert.match(donutFn, /data-selection-key="new"/);
  assert.match(donutFn, /data-selection-key="archived"/);
  assert.match(donutFn, /data-selection-key="published-archived"/);
  assert.match(donutFn, /<div class="donut-drilldown" hidden><\/div>/);

  assert.match(drilldownFn, /metricRow\(donutNewLabel,/);
  assert.match(drilldownFn, /renderDistributionSection\(donutNewLabel,/);
  assert.match(drilldownFn, /metricRow\(donutPublishedArchivedLabel,/);
  assert.match(drilldownFn, /renderDistributionSection\(donutPublishedArchivedLabel,/);

  assert.match(interactivitySection, /String\(node\.dataset\.selectionKey \|\| ''\) === String\(selectionKey \|\| ''\)/);
  assert.match(interactivitySection, /var selectionKey = String\(node\.dataset\.selectionKey \|\| ''\)\.trim\(\);/);
  assert.match(interactivitySection, /var statusKey = String\(node\.dataset\.status \|\| ''\)\.trim\(\);/);
  assert.match(interactivitySection, /toggleDonutDrilldown\(selectionKey, statusKey\);/);
  assert.match(interactivitySection, /node\.classList\.toggle\('is-active', isSelected\);/);
  assert.match(interactivitySection, /node\.classList\.toggle\('is-muted', !!selectionKey && !isSelected\);/);
  assert.doesNotMatch(interactivitySection, /node\.classList\.toggle\('is-selected', isSelected\);/);

  assert.doesNotMatch(salarySection, /Новые за период|РќРѕРІС‹Рµ Р·Р° РїРµСЂРёРѕРґ/);
  assert.doesNotMatch(salarySection, /Опубл\. и архив\. за период|РћРїСѓР±Р»\. Рё Р°СЂС…РёРІ\. Р·Р° РїРµСЂРёРѕРґ/);
  assert.match(salarySection, /'Новые'|'РќРѕРІС‹Рµ'/);
  assert.match(salarySection, /'Опубл\. и архивир\.'|'РћРїСѓР±Р»\. Рё Р°СЂС…РёРІРёСЂ\.'/);

  assert.ok(
    donutFn.indexOf('donut-chart-segment-outer donut-chart-segment-archived') <
      donutFn.indexOf('donut-chart-segment-inner donut-chart-segment-published-archived'),
    `${label} should render archived outer ring before inner published-archived ring`
  );
}

function assertStyleContracts(source, label) {
  const donutCss = extractSection(source, '.donut-chart-container {', '.donut-drilldown[hidden] {');
  const donutMedia = extractSection(source, '@media (max-width: 600px) {', '.dashboard-overview {');

  assert.match(donutCss, /\.donut-chart-container\s*\{[\s\S]*flex-direction:\s*column;/);
  assert.match(donutCss, /\.donut-chart-container\s*\{[\s\S]*gap:\s*18px;/);
  assert.match(donutCss, /\.vacancy-donut-shell\s*\{[\s\S]*display:\s*grid;/);
  assert.match(donutCss, /\.vacancy-donut-shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(208px,\s*1\.02fr\)\s*minmax\(196px,\s*0\.98fr\);/);
  assert.match(donutCss, /\.vacancy-donut-status-area\s*\{[\s\S]*min-width:\s*196px;/);
  assert.match(donutCss, /\.donut-chart\s*\{[\s\S]*width:\s*clamp\(208px,\s*23vw,\s*248px\);[\s\S]*aspect-ratio:\s*1\s*\/\s*1;/);
  assert.match(donutCss, /\.donut-center-label\s*\{[\s\S]*inset:\s*50%\s+auto\s+auto\s+50%;/);
  assert.match(donutCss, /\.donut-legend-item\s*\{[\s\S]*width:\s*100%;/);
  assert.match(donutCss, /\.donut-legend-item\s*\{[\s\S]*min-width:\s*0;/);
  assert.match(donutCss, /\.donut-legend-item-passive\s*\{/);
  assert.match(donutCss, /\.donut-legend-kpi\s*\{[\s\S]*background:\s*var\(--surface-variant\);/);
  assert.match(donutCss, /\.donut-legend-action\s*\{[\s\S]*font:\s*inherit;/);
  assert.match(donutCss, /\.donut-chart-segment\s*\{[\s\S]*transform:\s*none;/);
  assert.match(donutCss, /\.donut-chart-segment\.is-active\s*\{/);
  assert.match(donutCss, /\.donut-chart-segment\.is-muted\s*\{/);
  assert.doesNotMatch(donutCss, /translateY\(-1px\)/);

  assert.match(donutMedia, /\.vacancy-donut-shell\s*\{[\s\S]*grid-template-columns:\s*1fr;[\s\S]*justify-items:\s*center;/);
  assert.match(donutMedia, /\.vacancy-donut-status-area\s*\{[\s\S]*min-width:\s*0;/);
  assert.match(donutMedia, /\.donut-legend-item\s*\{[\s\S]*min-width:\s*0;/);

  assert.ok(
    donutCss.indexOf('.donut-chart-track-outer') < donutCss.indexOf('.donut-chart-track-inner'),
    `${label} should keep outer ring styles before inner ring styles`
  );
}

runTest('donut legend UI source keeps labels, classes, and ring ordering in report bundle', () => {
  assertUiSourceContracts(read(REPORT_UI_PATH), 'reports/report.ui.js');
});

runTest('donut legend UI source keeps labels, classes, and ring ordering in static bundle', () => {
  assertUiSourceContracts(read(STATIC_REPORT_UI_PATH), 'reports/static/report.ui.js');
});

runTest('donut legend styles stay unified in report stylesheet', () => {
  assertStyleContracts(read(REPORT_STYLES_PATH), 'reports/styles.css');
});

runTest('donut legend styles stay unified in static stylesheet', () => {
  assertStyleContracts(read(STATIC_REPORT_STYLES_PATH), 'reports/static/styles.css');
});
