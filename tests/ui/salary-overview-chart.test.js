const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DATA_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.data.js');
const UI_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js');
const UTILS_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'report.utils.js');
const DATA_SOURCE = fs.readFileSync(DATA_SOURCE_PATH, 'utf8');
const UI_SOURCE = fs.readFileSync(UI_SOURCE_PATH, 'utf8');
const UTILS_SOURCE = fs.readFileSync(UTILS_SOURCE_PATH, 'utf8');

function extractFunctionSourceFrom(content, name) {
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

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('buildSalaryOverviewChartModel builds experience legend, filters empty statuses and opens first currency by default', () => {
  const script = [
    extractFunctionSourceFrom(DATA_SOURCE, 'buildSalaryOverviewChartModel')
  ].join('\n\n') + '\nmodule.exports = { buildSalaryOverviewChartModel };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Math,
    isFinite,
    normalizeExperience(value) {
      return String(value || '').trim() || 'Не указан';
    },
    isSalarySummaryExperience(value) {
      return String(value || '').trim() === 'Все';
    },
    getExperienceOrder() {
      return {
        'Нет опыта': 0,
        'От 1 года до 3 лет': 1,
        'От 3 до 6 лет': 2,
        'Более 6 лет': 3,
        'Не указан': 4,
        'Все': 99
      };
    },
    formatCompactThousandsValue(value) {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? `${Math.round(numeric / 1000)}K` : String(value);
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'salary-overview-model-all.vm.js' });
  const { buildSalaryOverviewChartModel } = sandbox.module.exports;

  const model = buildSalaryOverviewChartModel({
    month: 'За 14 дней',
    selectedExperience: '',
    selectedCurrency: '',
    experiences: [
      {
        experience: 'Нет опыта',
        entries: [
          { status: 'Открытая', currency: 'RUR', avg_salary: 50000, vacancies_with_salary: 2 },
          { status: 'Архивная', currency: 'RUR', avg_salary: 33000, vacancies_with_salary: 1 },
          { status: 'Открытая', currency: 'USD', avg_salary: 1000, vacancies_with_salary: 1 }
        ]
      },
      {
        experience: 'От 1 года до 3 лет',
        entries: [
          { status: 'Открытая', currency: 'RUR', avg_salary: 96000, vacancies_with_salary: 2 },
          { status: 'Опубл. и архив. за период', currency: 'RUR', avg_salary: 88000, vacancies_with_salary: 1 },
          { status: 'Открытая', currency: 'EUR', avg_salary: 2200, vacancies_with_salary: 1 }
        ]
      },
      {
        experience: 'Все',
        entries: [
          { status: 'Открытая', currency: 'RUR', avg_salary: 777777, vacancies_with_salary: 10 }
        ]
      }
    ]
  });

  assert.equal(model.mode, 'all-experiences');
  assert.equal(model.subtitle, 'По группам опыта');
  assert.deepEqual(Array.from(model.legend.map((item) => item.label)), ['Нет опыта', 'От 1 года до 3 лет']);
  assert.deepEqual(Array.from(model.currencies.map((item) => item.currency)), ['RUR', 'USD', 'EUR']);
  assert.equal(model.currencies[0].expanded, true);
  assert.equal(model.currencies[1].expanded, false);
  assert.deepEqual(Array.from(model.currencies[0].statuses.map((item) => item.statusKey)), ['open', 'archived', 'period_archived']);
  assert.deepEqual(Array.from(model.currencies[0].statuses[0].points.map((point) => point.label)), ['Нет опыта', 'От 1 года до 3 лет']);
  assert.equal(model.currencies[1].statuses.length, 1);
});

runTest('buildSalaryOverviewChartModel switches to metric mode for selected experience and keeps requested currency expanded', () => {
  const script = [
    extractFunctionSourceFrom(DATA_SOURCE, 'buildSalaryOverviewChartModel')
  ].join('\n\n') + '\nmodule.exports = { buildSalaryOverviewChartModel };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Math,
    isFinite,
    normalizeExperience(value) {
      return String(value || '').trim() || 'Не указан';
    },
    isSalarySummaryExperience() {
      return false;
    },
    getExperienceOrder() {
      return { 'Нет опыта': 0 };
    },
    formatCompactThousandsValue(value) {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? `${Math.round(numeric / 1000)}K` : String(value);
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'salary-overview-model-single.vm.js' });
  const { buildSalaryOverviewChartModel } = sandbox.module.exports;

  const model = buildSalaryOverviewChartModel({
    month: 'За 14 дней',
    selectedExperience: 'Нет опыта',
    selectedCurrency: 'USD',
    experiences: [
      {
        experience: 'Нет опыта',
        entries: [
          {
            status: 'Открытая',
            currency: 'RUR',
            vacancies_with_salary: 2,
            min_salary: 40000,
            mode_salary: 47000,
            median_salary: 47000,
            avg_salary: 50000,
            max_salary: 80000
          },
          {
            status: 'Открытая',
            currency: 'USD',
            vacancies_with_salary: 2,
            min_salary: 1000,
            mode_salary: 1000,
            median_salary: 1200,
            avg_salary: 1400,
            max_salary: 2000
          }
        ]
      }
    ]
  });

  assert.equal(model.mode, 'single-experience');
  assert.equal(model.subtitle, 'По зарплатным метрикам');
  assert.deepEqual(Array.from(model.legend.map((item) => item.label)), ['Мин', 'Мода', 'Медиана', 'Среднее', 'Макс']);
  assert.equal(model.currencies[0].currency, 'RUR');
  assert.equal(model.currencies[1].currency, 'USD');
  assert.equal(model.currencies[0].expanded, false);
  assert.equal(model.currencies[1].expanded, true);
  assert.deepEqual(Array.from(model.currencies[1].statuses[0].points.map((point) => point.label)), ['Мин, Мода', 'Медиана', 'Среднее', 'Макс']);
});

runTest('buildSalaryOverviewChartHtml renders compact rows without duplicated point labels on tracks', () => {
  const script = [
    extractFunctionSourceFrom(UI_SOURCE, 'buildSalaryOverviewChartHtml')
  ].join('\n\n') + '\nmodule.exports = { buildSalaryOverviewChartHtml };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Math,
    isFinite,
    escapeHtml(value) {
      return String(value);
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'salary-overview-html.vm.js' });
  const { buildSalaryOverviewChartHtml } = sandbox.module.exports;

  const html = buildSalaryOverviewChartHtml({
    title: 'Зарплаты',
    subtitle: 'По группам опыта',
    legend: [
      { label: 'Нет опыта', color: '#00C3D3' },
      { label: 'От 1 года до 3 лет', color: '#00AADF' }
    ],
    currencies: [
      {
        currency: 'RUR',
        expanded: true,
        statuses: [
          {
            statusKey: 'open',
            statusLabel: 'Активные',
            points: [
              { label: 'Нет опыта', color: '#00C3D3', valueLabel: '50K', leftPct: 0, pointRow: 0 },
              { label: 'От 1 года до 3 лет', color: '#00AADF', valueLabel: '96K', leftPct: 100, pointRow: 0 }
            ]
          }
        ]
      },
      {
        currency: 'USD',
        expanded: false,
        statuses: [
          {
            statusKey: 'open',
            statusLabel: 'Активные',
            points: [
              { label: 'Нет опыта', color: '#00C3D3', valueLabel: '1K', leftPct: 50, pointRow: 0 }
            ]
          }
        ]
      }
    ]
  });

  assert.match(html, /salary-overview-chart/);
  assert.match(html, /salary-overview-currency-button/);
  assert.match(html, /salary-overview-currency-panel/);
  assert.match(html, /salary-overview-status-row/);
  assert.match(html, /salary-overview-track-point/);
  assert.match(html, /salary-overview-track-point-value/);
  assert.match(html, /salary-overview-legend-label/);
  assert.match(html, /data-currency="RUR"/);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /salary-progress-panels/);
  assert.doesNotMatch(html, /salary-summary-chart/);
  assert.doesNotMatch(html, /salary-overview-chart-title/);
  assert.doesNotMatch(html, /salary-overview-chart-subtitle/);
  assert.doesNotMatch(html, /salary-overview-chart-context/);
  assert.doesNotMatch(html, /salary-overview-track-point-label/);
  assert.doesNotMatch(html, /salary-overview-legend-dot/);
  assert.doesNotMatch(html, /salary-overview-legend-item/);
  assert.match(html, /salary-overview-track-point-value" style="color:#00C3D3;/);
  assert.doesNotMatch(html, /2 стат\./);
});

runTest('buildTotalsSalaryOverviewSectionHtml renders only the new overview chart root', () => {
  const script = [
    extractFunctionSourceFrom(UI_SOURCE, 'buildTotalsSalaryOverviewSectionHtml')
  ].join('\n\n') + '\nmodule.exports = { buildTotalsSalaryOverviewSectionHtml };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Math,
    isFinite,
    buildSalaryOverviewChartHtml() {
      return '<div class="salary-overview-chart">chart</div>';
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'salary-overview-section.vm.js' });
  const { buildTotalsSalaryOverviewSectionHtml } = sandbox.module.exports;

  const html = buildTotalsSalaryOverviewSectionHtml({ currencies: [] });
  assert.match(html, /salary-overview-stack/);
  assert.match(html, /salary-overview-chart/);
  assert.doesNotMatch(html, /salary-progress-panels/);
  assert.doesNotMatch(html, /salary-summary-chart/);
});
