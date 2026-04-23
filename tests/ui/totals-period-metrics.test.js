const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js');
const DATA_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.data.js');
const RENDER_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.render.js');
const SOURCE = fs.readFileSync(SOURCE_PATH, 'utf8');
const DATA_SOURCE = fs.readFileSync(DATA_SOURCE_PATH, 'utf8');
const RENDER_SOURCE = fs.readFileSync(RENDER_SOURCE_PATH, 'utf8');

function extractFunctionSourceFrom(content, name) {
  const marker = `function ${name}(`;
  const start = content.indexOf(marker);
  if (start === -1) {
    throw new Error(`Function ${name} not found`);
  }
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

function extractFunctionSource(name) {
  return extractFunctionSourceFrom(SOURCE, name);
}

function loadHelpers() {
  const names = [
    'parsePublishedAtDate',
    'totalsFormatDayMonthLabel',
    'totalsStartOfDay',
    'totalsEndOfDay',
    'totalsAddDays',
    'totalsMonthNameToIndex',
    'totalsParsePeriodWindow',
    'normalizeTotalsPeriodWindows',
    'totalsClassifyVacancyForPeriod',
    'totalsComputePeriodVacancyStats',
    'totalsBuildBurnupSeries'
  ];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Date,
    Math,
    isFinite,
    normalizeExperience(value) {
      return String(value || '').trim() || 'Не указан';
    },
    isSummaryMonth(value) {
      return /^\\d{2}\\.\\d{2}\\.\\d{4}$/.test(String(value || '').trim());
    },
    parsePeriodFilterValue(value) {
      const text = String(value || '').trim();
      if (text === 'Сегодня') return { start: new Date('2026-04-16T00:00:00Z'), end: new Date('2026-04-16T23:59:59Z') };
      if (text === '3 дня') return { start: new Date('2026-04-13T00:00:00Z'), end: new Date('2026-04-16T23:59:59Z') };
      if (text === '7 дней') return { start: new Date('2026-04-09T00:00:00Z'), end: new Date('2026-04-16T23:59:59Z') };
      if (text === '14 дней') return { start: new Date('2026-04-02T00:00:00Z'), end: new Date('2026-04-16T23:59:59Z') };
      if (text === 'Январь 2026') return { start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-01-31T23:59:59Z') };
      if (text === 'Февраль 2026') return { start: new Date('2026-02-01T00:00:00Z'), end: new Date('2026-02-28T23:59:59Z') };
      if (text === 'Март 2026') return { start: new Date('2026-03-01T00:00:00Z'), end: new Date('2026-03-31T23:59:59Z') };
      if (text === 'Апрель 2026') return { start: new Date('2026-04-01T00:00:00Z'), end: new Date('2026-04-30T23:59:59Z') };
      return null;
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'totals-period-metrics.vm.js' });
  return sandbox.module.exports;
}

function vacancy(overrides) {
  return Object.assign({
    id: 'v-default',
    published_at: null,
    archived_at: null,
    archived: false,
    experience: 'От 1 года до 3 лет'
  }, overrides);
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

runTest('totalsComputePeriodVacancyStats computes period-aware overview KPI', () => {
  const { totalsComputePeriodVacancyStats } = loadHelpers();
  const rows = [
    vacancy({ id: 'v1', published_at: '2026-04-10T09:00:00Z', archived_at: null, archived: false }),
    vacancy({ id: 'v2', published_at: '2026-04-03T09:00:00Z', archived_at: '2026-04-12T09:00:00Z', archived: true }),
    vacancy({ id: 'v3', published_at: '2026-03-30T09:00:00Z', archived_at: '2026-04-05T09:00:00Z', archived: true }),
    vacancy({ id: 'v4', published_at: '2026-03-29T09:00:00Z', archived_at: null, archived: false }),
    vacancy({ id: 'v5', published_at: '2026-04-13T09:00:00Z', archived_at: '2026-04-15T09:00:00Z', archived: true })
  ];

  const stats = totalsComputePeriodVacancyStats(rows, {
    label: '14 дней',
    start: new Date(2026, 3, 2, 0, 0, 0),
    end: new Date(2026, 3, 16, 23, 59, 59)
  });

  assert.equal(stats.total, 5);
  assert.equal(stats.active, 2);
  assert.equal(stats.archived, 3);
  assert.equal(stats.newPublished, 3);
  assert.equal(stats.publishedAndArchived, 2);
  assert.equal(stats.activeNewPublished, 1);
  assert.equal(stats.avgLifetimeDays, 5.7);
});

runTest('totalsBuildBurnupSeries returns adaptive daily period series', () => {
  const { totalsBuildBurnupSeries } = loadHelpers();
  const rows = [
    vacancy({ id: 'a1', published_at: '2026-04-13T09:00:00Z', archived_at: null, archived: false }),
    vacancy({ id: 'a2', published_at: '2026-04-13T11:00:00Z', archived_at: '2026-04-15T09:00:00Z', archived: true }),
    vacancy({ id: 'a3', published_at: '2026-04-14T09:00:00Z', archived_at: '2026-04-14T21:00:00Z', archived: true }),
    vacancy({ id: 'a4', published_at: '2026-04-10T09:00:00Z', archived_at: null, archived: false })
  ];

  const series = totalsBuildBurnupSeries(rows, [{
    label: '3 дня',
    start: new Date(2026, 3, 13, 0, 0, 0),
    end: new Date(2026, 3, 16, 23, 59, 59)
  }]);

  assert.deepEqual(Array.from(series.labels), ['13.04', '14.04', '15.04', '16.04']);
  assert.deepEqual(Array.from(series.newPublished), [2, 1, 0, 0]);
  assert.deepEqual(Array.from(series.archived), [0, 1, 1, 0]);
  assert.deepEqual(Array.from(series.publishedAndArchived), [0, 1, 0, 0]);
  assert.deepEqual(Array.from(series.active), [3, 3, 2, 2]);
});

runTest('totalsComputeSalaryCoverage summarizes salary presence and currency buckets', () => {
  const names = [
    'normalizeTotalsCurrency',
    'totalsComputeSalaryCoverage'
  ];
  const script = [
    extractFunctionSourceFrom(DATA_SOURCE, 'computeSalaryValue'),
    ...names.map(extractFunctionSource)
  ].join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Date,
    Math,
    isFinite
  };
  vm.runInNewContext(script, sandbox, { filename: 'totals-salary-coverage.vm.js' });
  const { totalsComputeSalaryCoverage } = sandbox.module.exports;

  const stats = totalsComputeSalaryCoverage([
    { currency: 'RUR', salary_from: 100000, salary_to: null },
    { currency: 'USD', salary_from: 1000, salary_to: null },
    { currency: 'EUR', salary_from: 900, salary_to: null },
    { currency: 'KZT', salary_from: 200000, salary_to: null },
    { currency: 'RUR', salary_from: null, salary_to: null, calculated_salary: null, converted_salary: null },
    { currency: '', salary_from: null, salary_to: null, calculated_salary: null, converted_salary: null }
  ]);

  assert.equal(stats.total, 6);
  assert.equal(stats.withSalary, 4);
  assert.equal(stats.withoutSalary, 2);
  assert.equal(stats.withSalaryShare, 66.67);
  assert.equal(stats.withoutSalaryShare, 33.33);
  assert.equal(stats.currencies.RUR.count, 1);
  assert.equal(stats.currencies.USD.count, 1);
  assert.equal(stats.currencies.EUR.count, 1);
  assert.equal(stats.currencies.other.count, 1);
  assert.equal(stats.currencies.other.share, 25);
});

runTest('buildEmployerOverviewChartModel aggregates employer buckets by selected currency and metric', () => {
  const names = [
    'normalizeEmployerOverviewCurrency',
    'normalizeEmployerOverviewMetric',
    'buildEmployerOverviewChartModel'
  ];
  const script = [
    extractFunctionSourceFrom(DATA_SOURCE, 'computeSalaryValue'),
    ...names.map(extractFunctionSource)
  ].join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Date,
    Math,
    isFinite,
    dedupeVacanciesById(list) {
      return Array.isArray(list) ? list.slice() : [];
    },
    getSkillsSearchVacancyBooleanValue(vacancy, key) {
      if (key === 'accreditation') return !!vacancy.employer_accredited;
      if (key === 'cover_letter_required') return !!vacancy.response_letter_required;
      if (key === 'has_test') return !!vacancy.has_test;
      return false;
    },
    getEmployerRatingBucketFromVacancy(vacancy) {
      const value = Number(vacancy.employer_rating);
      if (!Number.isFinite(value)) return 'unknown';
      if (value < 3.5) return '<3.5';
      if (value < 4.0) return '3.5-3.99';
      if (value < 4.5) return '4.0-4.49';
      return '>=4.5';
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'employer-overview-model.vm.js' });
  const { buildEmployerOverviewChartModel } = sandbox.module.exports;

  const model = buildEmployerOverviewChartModel([
    { id: '1', currency: 'RUR', salary_from: 100, salary_to: 200, employer_accredited: true, has_test: true, response_letter_required: false, employer_rating: '4.6' },
    { id: '2', currency: 'RUR', salary_from: 300, salary_to: 500, employer_accredited: true, has_test: false, response_letter_required: false, employer_rating: '4.3' },
    { id: '3', currency: 'RUR', salary_from: 90, salary_to: 110, employer_accredited: false, has_test: false, response_letter_required: true, employer_rating: '3.2' },
    { id: '4', currency: 'USD', salary_from: 1000, salary_to: 1400, employer_accredited: true, has_test: false, response_letter_required: true, employer_rating: null }
  ], 'RUR', 'max');

  assert.equal(model.currency, 'RUR');
  assert.equal(model.metric, 'max');
  assert.deepEqual(Array.from(model.labels), [
    'ИТ-аккредитация: Нет',
    'ИТ-аккредитация: Да',
    'Тестовое задание: Нет',
    'Тестовое задание: Да',
    'Сопроводительное письмо: Нет',
    'Сопроводительное письмо: Да',
    'Рейтинг: нет рейтинга',
    'Рейтинг: <3.5',
    'Рейтинг: 3.5-3.99',
    'Рейтинг: 4.0-4.49',
    'Рейтинг: >=4.5'
  ]);
  assert.deepEqual(Array.from(model.values), [
    100,
    400,
    400,
    150,
    400,
    100,
    null,
    100,
    null,
    400,
    150
  ]);
});

runTest('resolveEmployerOverviewFilters uses salary group currency and metric state', () => {
  const names = [
    'normalizeEmployerOverviewCurrency',
    'normalizeEmployerOverviewMetric',
    'resolveEmployerOverviewFilters'
  ];
  const script = names.map(extractFunctionSource).join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    uiState: {
      market_trends_salary_metric: 'median'
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'employer-overview-filters.vm.js' });
  const { resolveEmployerOverviewFilters } = sandbox.module.exports;

  const resolved = resolveEmployerOverviewFilters(['USD'], sandbox.uiState.market_trends_salary_metric);
  assert.deepEqual(JSON.parse(JSON.stringify(resolved)), {
    currency: 'USD',
    metric: 'median'
  });

  const fallback = resolveEmployerOverviewFilters([], 'invalid');
  assert.deepEqual(JSON.parse(JSON.stringify(fallback)), {
    currency: 'RUR',
    metric: 'avg'
  });
});

runTest('buildEmployerAnalysisRowsFromVacancies recalculates selected metric for selected currency', () => {
  const names = [
    'normalizeEmployerFactor',
    'getEmployerFactorLabel',
    'getEmployerValueLabel',
    'getEmployerRatingBucketFromVacancy',
    'normalizeEmployerOverviewCurrency',
    'normalizeEmployerOverviewMetric',
    'normalizeEmployerAnalysisVacancyCurrency',
    'computeEmployerAnalysisMetricValue',
    'totalsMetricLabel',
    'buildEmployerAnalysisRowsFromVacancies'
  ];
  const script = [
    extractFunctionSourceFrom(DATA_SOURCE, 'computeSalaryValue'),
    extractFunctionSourceFrom(DATA_SOURCE, 'computeMedian'),
    extractFunctionSourceFrom(RENDER_SOURCE, 'computeMode'),
    ...names.map(extractFunctionSource)
  ].join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Date,
    Math,
    isFinite,
    dedupeVacanciesById(list) {
      return Array.isArray(list) ? list.slice() : [];
    },
    getSkillsSearchVacancyBooleanValue(vacancy, key) {
      if (key === 'accreditation') return !!vacancy.employer_accredited;
      if (key === 'cover_letter_required') return !!vacancy.response_letter_required;
      if (key === 'has_test') return !!vacancy.has_test;
      return false;
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'employer-analysis-rows.vm.js' });
  const { buildEmployerAnalysisRowsFromVacancies } = sandbox.module.exports;

  const rows = buildEmployerAnalysisRowsFromVacancies([
    { id: '1', currency: 'RUR', salary_from: 100, salary_to: 100, employer_accredited: true, has_test: false, response_letter_required: false, employer_rating: '4.6' },
    { id: '2', currency: 'RUR', salary_from: 200, salary_to: 200, employer_accredited: true, has_test: true, response_letter_required: false, employer_rating: '4.3' },
    { id: '3', currency: 'RUR', salary_from: 400, salary_to: 400, employer_accredited: true, has_test: false, response_letter_required: true, employer_rating: '4.6' },
    { id: '4', currency: 'USD', salary_from: 1000, salary_to: 1200, employer_accredited: true, has_test: false, response_letter_required: false, employer_rating: '4.6' }
  ], 'all', {
    currency: 'RUR',
    metric: 'median'
  });

  const accreditationTrue = rows.find((row) => row.factorKey === 'accreditation' && row.valueKey === 'true');
  assert.ok(accreditationTrue);
  assert.equal(accreditationTrue.salaryCurrency, 'RUR');
  assert.equal(accreditationTrue.salaryMetric, 'median');
  assert.equal(accreditationTrue.salaryValue, 200);
  assert.equal(accreditationTrue.salaryCount, 3);
});

runTest('buildEmployerAnalysisRowsFromVacancies supports other currency bucket and mode metric', () => {
  const names = [
    'normalizeEmployerFactor',
    'getEmployerFactorLabel',
    'getEmployerValueLabel',
    'getEmployerRatingBucketFromVacancy',
    'normalizeEmployerOverviewCurrency',
    'normalizeEmployerOverviewMetric',
    'normalizeEmployerAnalysisVacancyCurrency',
    'computeEmployerAnalysisMetricValue',
    'totalsMetricLabel',
    'buildEmployerAnalysisRowsFromVacancies'
  ];
  const script = [
    extractFunctionSourceFrom(DATA_SOURCE, 'computeSalaryValue'),
    extractFunctionSourceFrom(DATA_SOURCE, 'computeMedian'),
    extractFunctionSourceFrom(RENDER_SOURCE, 'computeMode'),
    ...names.map(extractFunctionSource)
  ].join('\n\n') + `\nmodule.exports = { ${names.join(', ')} };`;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Date,
    Math,
    isFinite,
    dedupeVacanciesById(list) {
      return Array.isArray(list) ? list.slice() : [];
    },
    getSkillsSearchVacancyBooleanValue(vacancy, key) {
      if (key === 'accreditation') return !!vacancy.employer_accredited;
      if (key === 'cover_letter_required') return !!vacancy.response_letter_required;
      if (key === 'has_test') return !!vacancy.has_test;
      return false;
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'employer-analysis-other.vm.js' });
  const { buildEmployerAnalysisRowsFromVacancies } = sandbox.module.exports;

  const rows = buildEmployerAnalysisRowsFromVacancies([
    { id: '1', currency: 'KZT', converted_salary: 500, employer_accredited: false, has_test: false, response_letter_required: false, employer_rating: null },
    { id: '2', currency: 'KZT', converted_salary: 500, employer_accredited: false, has_test: true, response_letter_required: false, employer_rating: null },
    { id: '3', currency: 'BYR', converted_salary: 900, employer_accredited: false, has_test: false, response_letter_required: true, employer_rating: null }
  ], 'all', {
    currency: 'OTHER',
    metric: 'mode'
  });

  const accreditationFalse = rows.find((row) => row.factorKey === 'accreditation' && row.valueKey === 'false');
  assert.ok(accreditationFalse);
  assert.equal(accreditationFalse.salaryCurrency, 'OTHER');
  assert.equal(accreditationFalse.salaryMetric, 'mode');
  assert.equal(accreditationFalse.salaryValue, 500);
  assert.equal(accreditationFalse.salaryCount, 3);
});
