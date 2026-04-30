const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FILES = {
  reportUi: path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js'),
  reportStyles: path.resolve(__dirname, '..', '..', 'reports', 'static', 'styles.css')
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
  const source = read(FILES.reportUi);
  assert.match(source, /function getDashboardChartFontFamily\(\)/);
  assert.match(source, new RegExp(`getDashboardCssVar\\('--chart-font-family', "${escapeRegex(DONUT_FONT_STACK)}"\\)`));
  assert.match(source, /axis\.tickfont\.size = axis\.tickfont\.size \|\| secondaryTextSize;/);
  assert.match(source, /axis\.tickfont\.color = axis\.tickfont\.color \|\| secondaryTextColor;/);
});

runTest('report salary module legend directly reuses donut legend classes', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /\.salary-module-legend\s*\{/);
  assert.doesNotMatch(source, /\.salary-module-legend-item\s*\{/);
  assert.doesNotMatch(source, /\.salary-module-legend-label\s*\{/);
});

runTest('static salary module legend directly reuses donut legend classes', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /\.salary-module-legend\s*\{/);
  assert.doesNotMatch(source, /\.salary-module-legend-item\s*\{/);
  assert.doesNotMatch(source, /\.salary-module-legend-label\s*\{/);
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
  const source = read(FILES.reportStyles);
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
    /shared-filter-panel-rail-button\.active\s+\.shared-filter-panel-rail-text|shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-text|shared-filter-panel-rail-button\[data-section-filled="1"\]\s+\.shared-filter-panel-rail-text/
  );
  assert.doesNotMatch(
    source,
    /shared-filter-group\[data-section-filled="1"\]\s+\.shared-filter-group-title\s*\{|shared-filter-group\s+\.shared-filter-group-title\[data-section-filled="1"\]\s*\{|shared-filter-group\[data-section-active="1"\]\s+\.shared-filter-group-title\s*\{|shared-filter-group\s+\.shared-filter-group-title\[data-section-active="1"\]\s*\{|shared-filter-group\s+\.shared-filter-group-title\.active\s*\{/
  );
  assert.match(
    source,
    /shared-filter-panel-rail-button\.active\s+\.shared-filter-panel-rail-icon[\s\S]*shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-icon[\s\S]*shared-filter-panel-rail-button\[data-section-filled="1"\]\s+\.shared-filter-panel-rail-icon/
  );
  assert.match(
    source,
    /body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="0"\]\s+\.shared-filter-panel-rail-button\.filled[\s\S]*?\{[\s\S]*?background:\s*#36474f|body\.report-dashboard\s+#global-shared-filter-panel\.is-collapsed\s+\.shared-filter-panel-rail-button\.filled[\s\S]*?\{[\s\S]*?background:\s*#36474f/
  );
  assert.match(
    source,
    /body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="0"\]\s+\.shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-icon[\s\S]*?background-image:\s*linear-gradient[\s\S]*?-webkit-text-fill-color:\s*transparent|body\.report-dashboard\s+#global-shared-filter-panel\.is-collapsed\s+\.shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-icon[\s\S]*?background-image:\s*linear-gradient[\s\S]*?-webkit-text-fill-color:\s*transparent/
  );
});

runTest('static stylesheet highlights only shared filter icons, not labels', () => {
  const source = read(FILES.reportStyles);
  assert.doesNotMatch(
    source,
    /shared-filter-panel-rail-button\.active\s+\.shared-filter-panel-rail-text|shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-text|shared-filter-panel-rail-button\[data-section-filled="1"\]\s+\.shared-filter-panel-rail-text/
  );
  assert.doesNotMatch(
    source,
    /shared-filter-group\[data-section-filled="1"\]\s+\.shared-filter-group-title\s*\{|shared-filter-group\s+\.shared-filter-group-title\[data-section-filled="1"\]\s*\{|shared-filter-group\[data-section-active="1"\]\s+\.shared-filter-group-title\s*\{|shared-filter-group\s+\.shared-filter-group-title\[data-section-active="1"\]\s*\{|shared-filter-group\s+\.shared-filter-group-title\.active\s*\{/
  );
  assert.match(
    source,
    /shared-filter-panel-rail-button\.active\s+\.shared-filter-panel-rail-icon[\s\S]*shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-icon[\s\S]*shared-filter-panel-rail-button\[data-section-filled="1"\]\s+\.shared-filter-panel-rail-icon/
  );
  assert.match(
    source,
    /body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="0"\]\s+\.shared-filter-panel-rail-button\.filled[\s\S]*?\{[\s\S]*?background:\s*#36474f|body\.report-dashboard\s+#global-shared-filter-panel\.is-collapsed\s+\.shared-filter-panel-rail-button\.filled[\s\S]*?\{[\s\S]*?background:\s*#36474f/
  );
  assert.match(
    source,
    /body\.report-dashboard\s+#global-shared-filter-panel\[data-panel-open="0"\]\s+\.shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-icon[\s\S]*?background-image:\s*linear-gradient[\s\S]*?-webkit-text-fill-color:\s*transparent|body\.report-dashboard\s+#global-shared-filter-panel\.is-collapsed\s+\.shared-filter-panel-rail-button\.filled\s+\.shared-filter-panel-rail-icon[\s\S]*?background-image:\s*linear-gradient[\s\S]*?-webkit-text-fill-color:\s*transparent/
  );
});

function assertEmployerAnalysisRankedBarConfig(source) {
  assert.match(source, /function buildEmployerAnalysisRankedChartHtml\(labels,\s*values,\s*factorKeys,\s*metricLabel,\s*currencyLabel,\s*chartContext,\s*signature\)/);
  assert.match(source, /graph\.__chartHostEl\.innerHTML = buildEmployerAnalysisRankedChartHtml\(labels,\s*values,\s*factorKeys,\s*metricLabel,\s*currencyLabel,\s*chartContext,\s*signature\);/);
  assert.match(source, /function getDashboardPaletteColor\(paletteKey\)/);
  assert.match(source, /function getEmployerAnalysisColor\(factorKey\)/);
  assert.match(source, /palette-cyan-strong/);
  assert.match(source, /palette-blue-strong/);
  assert.match(source, /palette-violet-strong/);
  assert.match(source, /palette-orange-strong/);
  assert.match(source, /employer-funnel-stack/);
  assert.match(source, /employer-funnel-bar/);
  assert.match(source, /employer-funnel-label/);
  assert.match(source, /employer-funnel-value/);
  assert.match(source, /background:' \+ escapeHtml\(row\.color\)/);
  assert.match(source, /var factorOrderDelta = getEmployerFactorOrder\(a\.key\) - getEmployerFactorOrder\(b\.key\);/);
  assert.doesNotMatch(source, /function getEmployerAnalysisDonutGradientMeta\(factorKey\)/);
  assert.doesNotMatch(source, /getDonutGradientCssByKey\(meta\.key\)/);
  assert.doesNotMatch(source, /employer-analysis-donut-axis-line/);
  assert.doesNotMatch(source, /employer-analysis-donut-axis-tick/);
}

runTest('report employer analysis uses flat ranked bars', () => {
  const source = read(FILES.reportUi);
  assertEmployerAnalysisRankedBarConfig(source);
  assert.match(source, /<div class="totals-employer-overview-graph" id="/);
  assert.doesNotMatch(source, /<div class="dashboard-chart-host">[\s\S]*totals-employer-overview-graph/);
});

runTest('static employer analysis uses flat ranked bars', () => {
  const source = read(FILES.reportUi);
  assertEmployerAnalysisRankedBarConfig(source);
  assert.match(source, /<div class="totals-employer-overview-graph" id="/);
  assert.doesNotMatch(source, /<div class="dashboard-chart-host">[\s\S]*totals-employer-overview-graph/);
});

runTest('report burnup chart renders directly inside the card', () => {
  const source = read(FILES.reportUi);
  assert.match(source, /function buildBurnupChartHtml\(graphId\)/);
  assert.match(source, /<div class="plotly-graph totals-burnup-graph" id="/);
  assert.doesNotMatch(source, /<div class="dashboard-chart-host">[\s\S]*totals-burnup-graph/);
});

runTest('static burnup chart renders directly inside the card', () => {
  const source = read(FILES.reportUi);
  assert.match(source, /function buildBurnupChartHtml\(graphId\)/);
  assert.match(source, /<div class="plotly-graph totals-burnup-graph" id="/);
  assert.doesNotMatch(source, /<div class="dashboard-chart-host">[\s\S]*totals-burnup-graph/);
});

runTest('report stylesheet defines employer analysis funnel-bar styles', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /\.employer-funnel-stack\s*\{/);
  assert.match(source, /\.employer-funnel-bar\s*\{/);
  assert.match(source, /\.employer-funnel-label\s*\{/);
  assert.doesNotMatch(source, /\.employer-analysis-donut-axis-line,\s*[\s\S]*\.employer-analysis-donut-axis-tick line\s*\{/);
});

runTest('static stylesheet defines employer analysis funnel-bar styles', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /\.employer-funnel-stack\s*\{/);
  assert.match(source, /\.employer-funnel-bar\s*\{/);
  assert.match(source, /\.employer-funnel-label\s*\{/);
  assert.doesNotMatch(source, /\.employer-analysis-donut-axis-line,\s*[\s\S]*\.employer-analysis-donut-axis-tick line\s*\{/);
});

runTest('report stylesheet defines unified dashboard chart tokens', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /--dashboard-chart-grid-color:\s*rgba\(148,\s*163,\s*184,\s*0\.16\);/);
  assert.match(source, /--dashboard-chart-axis-color:\s*#64748b;/);
  assert.match(source, /--dashboard-chart-title-color:\s*#334155;/);
  assert.match(source, /\.totals-burnup-graph\s*\{/);
  assert.match(source, /\.totals-employer-overview-graph\s*\{/);
  assert.doesNotMatch(source, /\.dashboard-chart-host\s*\{/);
});

runTest('static stylesheet defines unified dashboard chart tokens', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /--dashboard-chart-grid-color:\s*rgba\(148,\s*163,\s*184,\s*0\.16\);/);
  assert.match(source, /--dashboard-chart-axis-color:\s*#64748b;/);
  assert.match(source, /--dashboard-chart-title-color:\s*#334155;/);
  assert.match(source, /\.totals-burnup-graph\s*\{/);
  assert.match(source, /\.totals-employer-overview-graph\s*\{/);
  assert.doesNotMatch(source, /\.dashboard-chart-host\s*\{/);
});

