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
  assert.match(source, /function buildDashboardCompensationAvailabilityHtml\(summary\)/, `${label} should define the compensation KPI helper`);
  assert.match(source, /compensation_availability/, `${label} should consume the dashboard compensation payload`);
  assert.match(source, /dashboard-work-format-card/, `${label} should render one shared work-format card`);
  assert.match(source, /dashboard-work-format-matrix/, `${label} should render a shared comparison matrix`);
  assert.match(source, /dashboard-work-format-section-heading/, `${label} should expose grouped work-format section headings`);
  assert.match(source, /dashboard-work-format-row/, `${label} should render matrix rows`);
  assert.match(source, /dashboard-work-format-row-label/, `${label} should render row labels`);
  assert.match(source, /dashboard-work-format-cell/, `${label} should render value cells`);
  assert.match(source, /ONLINE/, `${label} should render the ONLINE column title`);
  assert.match(source, /OFFLINE \/ HYBRID/, `${label} should render the OFFLINE \/ HYBRID column title`);
  assert.match(source, /summary\.remote/, `${label} should read the explicit REMOTE bucket`);
  assert.match(source, /summary\.non_remote/, `${label} should read the explicit non-REMOTE bucket`);
  assert.match(source, /with_salary_currencies/, `${label} should read salary currencies for each bucket`);
  assert.match(source, /RUR/, `${label} should expose the RUR split`);
  assert.match(source, /USD/, `${label} should expose the USD split`);
  assert.match(source, /EUR/, `${label} should expose the EUR split`);
  assert.match(source, /Другая|Р”СЂСѓРіР°СЏ/, `${label} should expose the OTHER split`);
  assert.match(source, /Объём|РћР±СЉС‘Рј/, `${label} should group volume metrics`);
  assert.match(source, /Валюты|Р’Р°Р»СЋС‚С‹/, `${label} should group currency metrics`);
  assert.doesNotMatch(source, /dashboard-work-format-tile/, `${label} should remove the tile-heavy work-format markup`);
}

function assertStyleContracts(source, label) {
  assert.match(source, /\.dashboard-work-format-card\s*\{/, `${label} should style the shared work-format card`);
  assert.match(source, /\.dashboard-work-format-matrix\s*\{[\s\S]*grid-template-columns:\s*minmax\(110px,\s*0\.86fr\)\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, `${label} should use one calm comparison matrix`);
  assert.match(source, /\.dashboard-work-format-section-heading\s*\{/, `${label} should style grouped work-format section headings`);
  assert.match(source, /\.dashboard-work-format-row\s*\{[\s\S]*display:\s*contents;/, `${label} should flatten work-format rows into the matrix`);
  assert.match(source, /\.dashboard-work-format-row-label\s*\{/, `${label} should style matrix row labels`);
  assert.match(source, /\.dashboard-work-format-cell\s*\{/, `${label} should style matrix value cells`);
  assert.doesNotMatch(source, /\.dashboard-work-format-tile\s*\{/, `${label} should remove the old tile styles`);
}

runTest('dashboard runtime renderer uses shared work-format KPI card', () => {
  assertUiContracts(read(FILES.reportUi), 'reports/report.ui.js');
});

runTest('dashboard static renderer uses shared work-format KPI card', () => {
  assertUiContracts(read(FILES.staticReportUi), 'reports/static/report.ui.js');
});

runTest('dashboard runtime stylesheet defines shared work-format card styles', () => {
  assertStyleContracts(read(FILES.reportStyles), 'reports/styles.css');
});

runTest('dashboard static stylesheet defines shared work-format card styles', () => {
  assertStyleContracts(read(FILES.staticReportStyles), 'reports/static/styles.css');
});
