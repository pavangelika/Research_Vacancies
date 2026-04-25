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
  assert.match(source, /dashboard-work-format-columns/, `${label} should render two work-format columns inside one card`);
  assert.match(source, /dashboard-work-format-column-title/, `${label} should render work-format column titles`);
  assert.match(source, /dashboard-work-format-grid/, `${label} should render KPI tile grids`);
  assert.match(source, /dashboard-work-format-tile/, `${label} should render compact KPI tiles`);
  assert.match(source, /ONLINE/, `${label} should render the ONLINE column title`);
  assert.match(source, /OFFLINE or HYBRID/, `${label} should render the OFFLINE or HYBRID column title`);
  assert.match(source, /summary\.remote/, `${label} should read the explicit REMOTE bucket`);
  assert.match(source, /summary\.non_remote/, `${label} should read the explicit non-REMOTE bucket`);
  assert.match(source, /with_salary_currencies/, `${label} should read salary currencies for each bucket`);
  assert.match(source, /RUR/, `${label} should expose the RUR split`);
  assert.match(source, /USD/, `${label} should expose the USD split`);
  assert.match(source, /EUR/, `${label} should expose the EUR split`);
  assert.match(source, /Другая|Р”СЂСѓРіР°СЏ/, `${label} should expose the OTHER split`);
  assert.doesNotMatch(source, /card\('ONLINE',\s*remote,/, `${label} should remove the standalone ONLINE card helper`);
  assert.doesNotMatch(source, /card\('OFFLINE or HYBRID',\s*nonRemote,/, `${label} should remove the standalone OFFLINE or HYBRID card helper`);
  assert.doesNotMatch(source, /dashboard-remote-section/, `${label} should remove the old standalone REMOTE section markup`);
  assert.doesNotMatch(source, /РЇРІРЅС‹Р№ С„РѕСЂРјР°С‚/, `${label} should remove the explicit-format helper label`);
  assert.doesNotMatch(source, /РћСЃС‚Р°Р»СЊРЅС‹Рµ РІР°РєР°РЅСЃРёРё/, `${label} should remove the non-remote helper label`);
  assert.doesNotMatch(source, /dashboard-kpi-stack/, `${label} should remove the old nested REMOTE stack`);
  assert.doesNotMatch(source, /РџРѕРєСЂС‹С‚РёРµ Р·Р°СЂРїР»Р°С‚/, `${label} should not keep the old card title`);
}

function assertStyleContracts(source, label) {
  assert.match(source, /\.dashboard-work-format-card\s*\{/, `${label} should style the shared work-format card`);
  assert.match(source, /\.dashboard-work-format-columns\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, `${label} should use two work-format columns`);
  assert.match(source, /\.dashboard-work-format-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, `${label} should use a 2x3 KPI grid`);
  assert.match(source, /\.dashboard-work-format-tile\s*\{/, `${label} should style compact KPI tiles`);
  assert.doesNotMatch(source, /\.dashboard-remote-section\s*\{/, `${label} should remove the old standalone remote section styles`);
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
