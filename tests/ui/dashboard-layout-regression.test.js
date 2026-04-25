const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FILES = {
  reportUi: path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js'),
  staticReportUi: path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js'),
  reportStyles: path.resolve(__dirname, '..', '..', 'reports', 'styles.css'),
  staticReportStyles: path.resolve(__dirname, '..', '..', 'reports', 'static', 'styles.css')
};

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

function assertUiContracts(source, label) {
  assert.match(source, /dashboard-overview-column/, `${label} should render explicit dashboard columns`);
  assert.match(source, /dashboard-card dashboard-card-primary/, `${label} should mark the primary vacancies card`);
  assert.match(source, /dashboard-card dashboard-card-salary/, `${label} should mark the salary module card`);
}

function assertStyleContracts(source, label) {
  assert.match(source, /\.dashboard-overview\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, `${label} should use two natural-height columns`);
  assert.match(source, /\.dashboard-overview-columns\s*\{[\s\S]*display:\s*contents;/, `${label} should let explicit columns participate in the parent grid`);
  assert.match(source, /\.dashboard-overview-column\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;/, `${label} should stack cards naturally inside each column`);
  assert.match(source, /\.dashboard-overview-column\s*\{[\s\S]*gap:\s*24px;/, `${label} should keep natural card spacing`);
  assert.match(source, /\.dashboard-card-body\s*\{[\s\S]*padding:\s*18px 20px 20px;/, `${label} should tighten chart card body spacing`);
  assert.match(source, /\.donut-chart-shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(240px,\s*1\.15fr\)\s*minmax\(220px,\s*0\.85fr\);/, `${label} should give more width to the donut chart area on desktop`);
  assert.match(source, /\.donut-chart\s*\{[\s\S]*width:\s*clamp\(220px,\s*28vw,\s*320px\);[\s\S]*aspect-ratio:\s*1\s*\/\s*1;/, `${label} should size the donut against the ring area instead of free shell space`);
  assert.match(source, /\.donut-center-label\s*\{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*50%\s+auto\s+auto\s+50%;[\s\S]*transform:\s*translate\(-50%,\s*-50%\);/, `${label} should anchor the donut total label to the donut ring center`);
  assert.match(source, /\.employer-analysis-ranked-chart\s*\{[\s\S]*gap:\s*10px;/, `${label} should tighten ranked chart spacing`);
  assert.match(source, /@media[\s\S]*?\.donut-chart-shell\s*\{[\s\S]*grid-template-columns:\s*1fr;[\s\S]*justify-items:\s*center;/, `${label} should keep the mobile shell centered around the donut ring`);
  assert.doesNotMatch(source, /grid-auto-rows:\s*1fr/, `${label} should not force equal-height dashboard rows`);
}

runTest('dashboard runtime renderer keeps explicit natural-height column structure', () => {
  assertUiContracts(read(FILES.reportUi), 'reports/report.ui.js');
});

runTest('dashboard static renderer keeps explicit natural-height column structure', () => {
  assertUiContracts(read(FILES.staticReportUi), 'reports/static/report.ui.js');
});

runTest('dashboard runtime stylesheet uses natural-height dashboard columns', () => {
  assertStyleContracts(read(FILES.reportStyles), 'reports/styles.css');
});

runTest('dashboard static stylesheet uses natural-height dashboard columns', () => {
  assertStyleContracts(read(FILES.staticReportStyles), 'reports/static/styles.css');
});
