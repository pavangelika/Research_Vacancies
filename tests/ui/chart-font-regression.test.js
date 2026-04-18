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
  assert.match(
    source,
    /\.salary-overview-legend-label\s*\{[\s\S]*font-family:\s*inherit;/
  );
});

runTest('static salary overview legend inherits donut legend font stack', () => {
  const source = read(FILES.staticReportStyles);
  assert.match(
    source,
    /\.salary-overview-legend-label\s*\{[\s\S]*font-family:\s*inherit;/
  );
});

runTest('report stylesheet defines shared chart typography tokens', () => {
  const source = read(FILES.reportStyles);
  assert.match(source, /--chart-font-family:\s*-apple-system,\s*BlinkMacSystemFont,\s*'Segoe UI',\s*Roboto,\s*sans-serif;/);
  assert.match(source, /--chart-secondary-font-size:\s*0\.8rem;/);
  assert.match(source, /--chart-secondary-line-height:\s*1\.5;/);
  assert.match(source, /--chart-secondary-font-weight:\s*400;/);
  assert.match(
    source,
    /shared-filter-panel-rail-button\s*\{[\s\S]*font:\s*inherit;/
  );
  assert.match(
    source,
    /\.shared-filter-field-label\s*\{[\s\S]*font-size:\s*var\(--chart-secondary-font-size\);[\s\S]*font-weight:\s*var\(--chart-secondary-font-weight\);[\s\S]*line-height:\s*var\(--chart-secondary-line-height\);/
  );
});

runTest('static stylesheet defines shared chart typography tokens', () => {
  const source = read(FILES.staticReportStyles);
  assert.match(source, /--chart-font-family:\s*-apple-system,\s*BlinkMacSystemFont,\s*'Segoe UI',\s*Roboto,\s*sans-serif;/);
  assert.match(source, /--chart-secondary-font-size:\s*0\.8rem;/);
  assert.match(source, /--chart-secondary-line-height:\s*1\.5;/);
  assert.match(source, /--chart-secondary-font-weight:\s*400;/);
  assert.match(
    source,
    /shared-filter-panel-rail-button\s*\{[\s\S]*font:\s*inherit;/
  );
  assert.match(
    source,
    /\.shared-filter-field-label\s*\{[\s\S]*font-size:\s*var\(--chart-secondary-font-size\);[\s\S]*font-weight:\s*var\(--chart-secondary-font-weight\);[\s\S]*line-height:\s*var\(--chart-secondary-line-height\);/
  );
});

function assertEmployerAnalysisGradientConfig(label, source) {
  assert.match(
    source,
    /composeChartTitle\('Анализ работодателей · ' \+ metricLabel \+ ' зарплата \(' \+ currencyLabel \+ '\)', chartContext\)/
  );
  assert.match(
    source,
    /xaxis:\s*\{\s*title:\s*'Зарплата, ' \+ currencyLabel,\s*automargin:\s*true,\s*showgrid:\s*false,\s*zeroline:\s*false\s*\}/
  );
  assert.match(
    source,
    /yaxis:\s*\{\s*title:\s*'',\s*automargin:\s*true,\s*autorange:\s*'reversed',\s*showgrid:\s*false,\s*zeroline:\s*false\s*\}/
  );
  assert.match(source, /margin:\s*\{\s*t:\s*28,\s*r:\s*16,\s*b:\s*40,\s*l:\s*220\s*\}/);
  assert.match(source, /function getEmployerAnalysisGradientStops\(factorKey\)/);
  assert.match(source, /function getEmployerAnalysisGradientFallbackColor\(factorKey\)/);
  assert.match(source, /function applyEmployerAnalysisBarGradients\(host,\s*factorKeys\)/);
  assert.match(source, /if \(factorKey === 'accreditation'\)/);
  assert.match(source, /if \(factorKey === 'cover_letter_required'\)/);
  assert.match(source, /if \(factorKey === 'has_test'\)/);
  assert.match(source, /if \(factorKey === 'rating_bucket'\)/);
  assert.match(source, /applyEmployerAnalysisBarGradients\(graph\.__chartHostEl,\s*factorKeys\)/);
}

runTest('report employer analysis uses donut-style gradient chart config', () => {
  const source = read(FILES.reportUi);
  assertEmployerAnalysisGradientConfig('reports/report.ui.js', source);
});

runTest('static employer analysis uses donut-style gradient chart config', () => {
  const source = read(FILES.staticReportUi);
  assertEmployerAnalysisGradientConfig('reports/static/report.ui.js', source);
});
