const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FILES = {
  reportUi: path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js'),
  staticReportUi: path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js'),
  reportStyles: path.resolve(__dirname, '..', '..', 'reports', 'styles.css'),
  staticReportStyles: path.resolve(__dirname, '..', '..', 'reports', 'static', 'styles.css')
};

const DONUT_FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

runTest('report Plotly defaults use donut legend font stack', () => {
  const source = read(FILES.reportUi);
  assert.match(source, /function getDashboardChartFontFamily\(\)/);
  assert.match(source, new RegExp(`getDashboardCssVar\\('--chart-font-family', "${escapeRegex(DONUT_FONT_STACK)}"\\)`));
  assert.match(source, /axis\.tickfont\.size = axis\.tickfont\.size \|\| secondaryTextSize;/);
  assert.match(source, /axis\.tickfont\.color = axis\.tickfont\.color \|\| secondaryTextColor;/);
});

runTest('static Plotly defaults use donut legend font stack', () => {
  const source = read(FILES.staticReportUi);
  assert.match(source, /function getDashboardChartFontFamily\(\)/);
  assert.match(source, new RegExp(`getDashboardCssVar\\('--chart-font-family', "${escapeRegex(DONUT_FONT_STACK)}"\\)`));
  assert.match(source, /axis\.tickfont\.size = axis\.tickfont\.size \|\| secondaryTextSize;/);
  assert.match(source, /axis\.tickfont\.color = axis\.tickfont\.color \|\| secondaryTextColor;/);
});

runTest('report salary overview legend inherits donut legend font stack', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /\.salary-overview-legend-label\s*\{[\s\S]*font-family:\s*inherit;/);
});

runTest('static salary overview legend inherits donut legend font stack', () => {
  const source = read(FILES.staticReportStyles);
  assert.match(source, /\.salary-overview-legend-label\s*\{[\s\S]*font-family:\s*inherit;/);
});

runTest('report stylesheet defines shared chart typography tokens', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /--chart-font-family:\s*-apple-system,\s*BlinkMacSystemFont,\s*'Segoe UI',\s*Roboto,\s*sans-serif;/);
  assert.match(source, /--chart-secondary-font-size:\s*0\.8rem;/);
  assert.match(source, /--chart-secondary-line-height:\s*1\.5;/);
  assert.match(source, /--chart-secondary-font-weight:\s*400;/);
  assert.match(source, /shared-filter-panel-rail-button\s*\{[\s\S]*font:\s*inherit;/);
  assert.match(source, /\.shared-filter-field-label\s*\{[\s\S]*font-size:\s*var\(--chart-secondary-font-size\);[\s\S]*font-weight:\s*var\(--chart-secondary-font-weight\);[\s\S]*line-height:\s*var\(--chart-secondary-line-height\);/);
});

runTest('static stylesheet defines shared chart typography tokens', () => {
  const source = read(FILES.staticReportStyles);
  assert.match(source, /--chart-font-family:\s*-apple-system,\s*BlinkMacSystemFont,\s*'Segoe UI',\s*Roboto,\s*sans-serif;/);
  assert.match(source, /--chart-secondary-font-size:\s*0\.8rem;/);
  assert.match(source, /--chart-secondary-line-height:\s*1\.5;/);
  assert.match(source, /--chart-secondary-font-weight:\s*400;/);
  assert.match(source, /shared-filter-panel-rail-button\s*\{[\s\S]*font:\s*inherit;/);
  assert.match(source, /\.shared-filter-field-label\s*\{[\s\S]*font-size:\s*var\(--chart-secondary-font-size\);[\s\S]*font-weight:\s*var\(--chart-secondary-font-weight\);[\s\S]*line-height:\s*var\(--chart-secondary-line-height\);/);
});

runTest('report stylesheet highlights only shared filter icons, not labels', () => {
  const source = read(FILES.reportStyles);
  assert.doesNotMatch(
    source,
    /shared-filter-panel-rail-button\.active\s+\.shared-filter-panel-rail-text|shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-text|shared-filter-panel-rail-button\[data-section-filled="1"\]\s+\.shared-filter-panel-rail-text/,
    'report stylesheet should not color the collapsed shared filter text when a section is active or filled'
  );
  assert.doesNotMatch(
    source,
    /shared-filter-group\[data-section-filled="1"\]\s+\.shared-filter-group-title\s*\{|shared-filter-group\s+\.shared-filter-group-title\[data-section-filled="1"\]\s*\{|shared-filter-group\[data-section-active="1"\]\s+\.shared-filter-group-title\s*\{|shared-filter-group\s+\.shared-filter-group-title\[data-section-active="1"\]\s*\{|shared-filter-group\s+\.shared-filter-group-title\.active\s*\{/,
    'report stylesheet should not recolor the expanded shared filter group title text when a section is active or filled'
  );
  assert.match(
    source,
    /shared-filter-panel-rail-button\.active\s+\.shared-filter-panel-rail-icon[\s\S]*shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-icon[\s\S]*shared-filter-panel-rail-button\[data-section-filled="1"\]\s+\.shared-filter-panel-rail-icon/,
    'report stylesheet should keep icon-only highlight rules for collapsed shared filters'
  );
});

runTest('static stylesheet highlights only shared filter icons, not labels', () => {
  const source = read(FILES.staticReportStyles);
  assert.doesNotMatch(
    source,
    /shared-filter-panel-rail-button\.active\s+\.shared-filter-panel-rail-text|shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-text|shared-filter-panel-rail-button\[data-section-filled="1"\]\s+\.shared-filter-panel-rail-text/,
    'static stylesheet should not color the collapsed shared filter text when a section is active or filled'
  );
  assert.doesNotMatch(
    source,
    /shared-filter-group\[data-section-filled="1"\]\s+\.shared-filter-group-title\s*\{|shared-filter-group\s+\.shared-filter-group-title\[data-section-filled="1"\]\s*\{|shared-filter-group\[data-section-active="1"\]\s+\.shared-filter-group-title\s*\{|shared-filter-group\s+\.shared-filter-group-title\[data-section-active="1"\]\s*\{|shared-filter-group\s+\.shared-filter-group-title\.active\s*\{/,
    'static stylesheet should not recolor the expanded shared filter group title text when a section is active or filled'
  );
  assert.match(
    source,
    /shared-filter-panel-rail-button\.active\s+\.shared-filter-panel-rail-icon[\s\S]*shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-icon[\s\S]*shared-filter-panel-rail-button\[data-section-filled="1"\]\s+\.shared-filter-panel-rail-icon/,
    'static stylesheet should keep icon-only highlight rules for collapsed shared filters'
  );
});

function assertEmployerAnalysisGradientConfig(source) {
  assert.match(source, /function buildEmployerAnalysisDonutChartHtml\(labels,\s*values,\s*factorKeys,\s*metricLabel,\s*currencyLabel,\s*chartContext,\s*signature\)/);
  assert.match(source, /graph\.__chartHostEl\.innerHTML = buildEmployerAnalysisDonutChartHtml\(labels,\s*values,\s*factorKeys,\s*metricLabel,\s*currencyLabel,\s*chartContext,\s*signature\);/);
  assert.match(source, /function getEmployerAnalysisDonutGradientMeta\(factorKey\)/);
  assert.match(source, /composeChartTitle\('Анализ работодателей · ' \+ metricLabel \+ ' зарплата \(' \+ currencyLabel \+ '\)', chartContext\)/);
  assert.match(source, /segmentClass: 'donut-segment donut-chart-segment donut-chart-segment-outer donut-chart-segment-active'/);
  assert.match(source, /segmentClass: 'donut-segment donut-chart-segment donut-chart-segment-inner donut-chart-segment-new'/);
  assert.match(source, /segmentClass: 'donut-segment donut-chart-segment donut-chart-segment-outer donut-chart-segment-archived'/);
  assert.match(source, /segmentClass: 'donut-segment donut-chart-segment donut-chart-segment-inner donut-chart-segment-published-archived'/);
  assert.match(source, /trackClass: 'donut-chart-track donut-chart-track-outer'/);
  assert.match(source, /trackClass: 'donut-chart-track donut-chart-track-inner'/);
  assert.match(source, /function getEmployerAnalysisGradientStops\(factorKey\)/);
  assert.match(source, /function getEmployerAnalysisGradientFallbackColor\(factorKey\)/);
  assert.match(source, /return getDonutGradientStopsByKey\('active'\);/);
  assert.match(source, /return getDonutGradientStopsByKey\('new'\);/);
  assert.match(source, /return getDonutGradientStopsByKey\('archived'\);/);
  assert.match(source, /return getDonutGradientStopsByKey\('published-archived'\);/);
  assert.match(source, /<linearGradient id="/);
  assert.match(source, /x2="100%" y2="100%"/);
  assert.match(source, /var offset = stopIndex === 0 \? '0%' : stopIndex === stops\.length - 1 \? '100%' : '55%';/);
  assert.match(source, /stroke-linecap="round"/);
  assert.doesNotMatch(source, /return \['#00C3D3', '#007AD8'\];/);
  assert.doesNotMatch(source, /return \['#8fe9f7', '#5f95ff'\];/);
  assert.doesNotMatch(source, /return \['#efc3ff', '#b58cff'\];/);
}

runTest('report employer analysis fully reuses donut svg styling', () => {
  const source = read(FILES.reportUi);
  assertEmployerAnalysisGradientConfig(source);
});

runTest('static employer analysis fully reuses donut svg styling', () => {
  const source = read(FILES.staticReportUi);
  assertEmployerAnalysisGradientConfig(source);
});

runTest('report stylesheet defines employer analysis donut chart styles', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /\.employer-analysis-donut-chart\s*\{/);
  assert.match(source, /\.employer-analysis-donut-chart-title\s*\{/);
  assert.match(source, /\.employer-analysis-donut-axis-line,\s*[\s\S]*\.employer-analysis-donut-axis-tick line\s*\{/);
});

runTest('static stylesheet defines employer analysis donut chart styles', () => {
  const source = read(FILES.staticReportStyles);
  assert.match(source, /\.employer-analysis-donut-chart\s*\{/);
  assert.match(source, /\.employer-analysis-donut-chart-title\s*\{/);
  assert.match(source, /\.employer-analysis-donut-axis-line,\s*[\s\S]*\.employer-analysis-donut-axis-tick line\s*\{/);
});
