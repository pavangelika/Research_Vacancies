const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js');
const SOURCE = fs.readFileSync(SOURCE_PATH, 'utf8');

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = SOURCE.indexOf(marker);
  if (start === -1) {
    throw new Error(`Function ${name} not found in report.ui.js`);
  }
  const bodyStart = SOURCE.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < SOURCE.length; i += 1) {
    const ch = SOURCE[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return SOURCE.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract function ${name}`);
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
  assert.equal(stats.avgLifetimeDays, 5.3);
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
