const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const FILES = {
  reportUi: path.resolve(__dirname, '..', '..', 'reports', 'report.ui.js'),
  staticReportUi: path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js'),
  reportFilters: path.resolve(__dirname, '..', '..', 'reports', 'report.filters.js'),
  staticReportFilters: path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.filters.js')
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

function createMinimalDocument() {
  return {
    createElement(tag) {
      return {
        tagName: String(tag || '').toUpperCase(),
        style: {},
        dataset: {},
        children: [],
        appendChild(child) {
          this.children.push(child);
          child.parentNode = this;
          return child;
        },
        setAttribute(name, value) {
          this[name] = value;
        },
        addEventListener() {},
        querySelector() {
          return null;
        }
      };
    }
  };
}

function evaluateDefaultState(content) {
  const script = [
    extractFunctionSource(content, 'ensureSharedFilterPanelState'),
    'module.exports = { ensureSharedFilterPanelState };'
  ].join('\n\n');
  const sandbox = {
    module: { exports: {} },
    exports: {},
    uiState: {},
    SHARED_FILTER_PANEL_SECTION_META: [
      { key: 'my-filters' },
      { key: 'roles' },
      { key: 'salary' },
      { key: 'responses' },
      { key: 'top' },
      { key: 'vacancy' },
      { key: 'skills' }
    ]
  };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-state.vm.js' });
  return sandbox.module.exports.ensureSharedFilterPanelState();
}

function evaluateAccordionBehavior(content) {
  const script = [
    extractFunctionSource(content, 'ensureSharedFilterSectionVisibility'),
    extractFunctionSource(content, 'setSharedFilterPanelSectionOpen'),
    'module.exports = { setSharedFilterPanelSectionOpen };'
  ].join('\n\n');
  const headings = {};
  const panelBody = {
    scrollTop: 0,
    getBoundingClientRect() {
      return { top: 100, bottom: 260, height: 160 };
    }
  };
  const groups = ['roles', 'salary', 'responses'].map((key) => {
    headings[key] = {
      attrs: {},
      setAttribute(name, value) {
        this.attrs[name] = value;
      }
    };
    return {
      dataset: { sectionKey: key, sectionOpen: key === 'roles' ? '1' : '0' },
      querySelector(selector) {
        if (selector === '.shared-filter-group-title') return headings[key];
        return null;
      }
    };
  });

  const panel = {
    dataset: {},
    querySelector(selector) {
      if (selector === '.shared-filter-panel-body') return panelBody;
      const match = selector.match(/\.shared-filter-group\[data-section-key="([^"]+)"\]/);
      if (match) return groups.find((group) => group.dataset.sectionKey === match[1]) || null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.shared-filter-group[data-section-key]') return groups;
      return [];
    }
  };

  let syncCalls = 0;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    uiState: {
      shared_filter_panel_state: {
        open: true,
        sections: {
          roles: true,
          salary: false,
          responses: false
        },
        activeSection: 'roles'
      }
    },
    document: {
      getElementById(id) {
        return id === 'global-shared-filter-panel' ? panel : null;
      }
    },
    ensureSharedFilterPanelState() {
      return sandbox.uiState.shared_filter_panel_state;
    },
    persistSharedFilterPanelState() {},
    syncSharedFilterPanelCollapsedUi() {
      syncCalls += 1;
    }
  };
  groups.forEach((group, index) => {
    group.getBoundingClientRect = function() {
      return { top: 120 + (index * 120), bottom: 200 + (index * 120), height: 80 };
    };
  });

  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-accordion.vm.js' });
  sandbox.module.exports.setSharedFilterPanelSectionOpen('salary', true);
  return {
    state: sandbox.uiState.shared_filter_panel_state,
    groups,
    headings,
    syncCalls,
    panelBody
  };
}

function evaluateMenuPositioning(content, options = {}) {
  const script = [
    extractFunctionSource(content, 'resetGlobalFilterMenuPosition'),
    extractFunctionSource(content, 'restoreGlobalFilterMenuHost'),
    extractFunctionSource(content, 'ensureSharedFilterMenuVisibility'),
    extractFunctionSource(content, 'positionGlobalFilterMenu'),
    'module.exports = { positionGlobalFilterMenu };'
  ].join('\n\n');

  const panelRect = options.panelRect || { top: 100, bottom: 360, height: 260 };
  const triggerRect = options.triggerRect || { top: 160, bottom: 200, left: 10, right: 250, width: 240, height: 40 };
  const menuRect = options.menuRect || { top: 202, bottom: 332, height: 130 };
  const menuScrollHeight = options.menuScrollHeight || 130;
  const windowInnerHeight = options.windowInnerHeight || 600;
  const host = {
    style: {},
    appendChild(node) {
      node.parentElement = this;
    }
  };
  const panelBody = {
    scrollTop: options.initialScrollTop || 0,
    clientHeight: 260,
    scrollHeight: options.panelScrollHeight || 800,
    getBoundingClientRect() {
      return panelRect;
    }
  };
  const trigger = {
    offsetWidth: 240,
    offsetTop: options.triggerOffsetTop != null ? options.triggerOffsetTop : triggerRect.top,
    offsetHeight: 40,
    offsetLeft: triggerRect.left,
    getBoundingClientRect() {
      const scrollShift = panelBody.scrollTop - (options.initialScrollTop || 0);
      return {
        top: triggerRect.top - scrollShift,
        bottom: triggerRect.bottom - scrollShift,
        left: triggerRect.left,
        right: triggerRect.right,
        width: triggerRect.width,
        height: triggerRect.height
      };
    },
    closest(selector) {
      if (selector === '.shared-filter-panel-body') return panelBody;
      return null;
    }
  };
  const menu = {
    __host: host,
    parentElement: host,
    style: {
      removed: [],
      set: {},
      removeProperty(name) {
        this.removed.push(name);
      },
      setProperty(name, value) {
        this.set[name] = value;
      }
    },
    clientHeight: options.menuClientHeight != null ? options.menuClientHeight : menuRect.height,
    scrollHeight: menuScrollHeight,
    getBoundingClientRect() {
      return menuRect;
    }
  };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    window: { innerHeight: windowInnerHeight },
    bindGlobalFilterMenuScrollLock() {},
    Math
  };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-menu.vm.js' });
  sandbox.module.exports.positionGlobalFilterMenu(trigger, menu);
  return { panelBody, menu };
}

function evaluateMobileAccordionBehavior(content, targetSection = 'salary') {
  const script = [
    extractFunctionSource(content, 'ensureSharedFilterSectionVisibility'),
    extractFunctionSource(content, 'setSharedFilterPanelSectionOpen'),
    'module.exports = { setSharedFilterPanelSectionOpen };'
  ].join('\n\n');
  const headings = {};
  const panelBody = {
    scrollTop: 0,
    getBoundingClientRect() {
      return { top: 100, bottom: 260, height: 160 };
    }
  };
  const groups = ['roles', 'salary', 'responses'].map((key) => {
    headings[key] = {
      attrs: {},
      setAttribute(name, value) {
        this.attrs[name] = value;
      }
    };
    return {
      dataset: { sectionKey: key, sectionOpen: key === 'roles' ? '1' : '0' },
      querySelector(selector) {
        if (selector === '.shared-filter-group-title') return headings[key];
        return null;
      }
    };
  });

  const panel = {
    dataset: { collapsed: '0' },
    querySelector(selector) {
      if (selector === '.shared-filter-panel-body') return panelBody;
      const match = selector.match(/\.shared-filter-group\[data-section-key="([^"]+)"\]/);
      if (match) return groups.find((group) => group.dataset.sectionKey === match[1]) || null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.shared-filter-group[data-section-key]') return groups;
      return [];
    }
  };

  const sandbox = {
    module: { exports: {} },
    exports: {},
    uiState: {
      shared_filter_panel_state: {
        open: true,
        collapsed: false,
        sections: {
          roles: true,
          salary: false,
          responses: false,
          skills: false
        },
        activeSection: 'roles'
      }
    },
    document: {
      getElementById(id) {
        return id === 'global-shared-filter-panel' ? panel : null;
      }
    },
    ensureSharedFilterPanelState() {
      return sandbox.uiState.shared_filter_panel_state;
    },
    persistSharedFilterPanelState() {},
    syncSharedFilterPanelCollapsedUi() {},
    isMobileFilterViewport() {
      return true;
    }
  };
  groups.push({
    dataset: { sectionKey: 'skills', sectionOpen: '0' },
    querySelector(selector) {
      if (selector === '.shared-filter-group-title') return {
        attrs: {},
        setAttribute() {}
      };
      return null;
    }
  });
  groups.forEach((group, index) => {
    group.getBoundingClientRect = function() {
      return { top: 120 + (index * 120), bottom: 200 + (index * 120), height: 80 };
    };
  });

  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-mobile-accordion.vm.js' });
  sandbox.module.exports.setSharedFilterPanelSectionOpen(targetSection, true);
  return panelBody.scrollTop;
}

function evaluateToggleGlyph(content) {
  const script = [
    extractFunctionSource(content, 'getSharedFilterPanelToggleGlyph'),
    'module.exports = { getSharedFilterPanelToggleGlyph };'
  ].join('\n\n');
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-toggle.vm.js' });
  return {
    expanded: sandbox.module.exports.getSharedFilterPanelToggleGlyph(false),
    collapsed: sandbox.module.exports.getSharedFilterPanelToggleGlyph(true)
  };
}

function evaluateSkillsSectionScroll(content) {
  const script = [
    extractFunctionSource(content, 'ensureSharedFilterSectionVisibility'),
    'module.exports = { ensureSharedFilterSectionVisibility };'
  ].join('\n\n');
  const panelBody = {
    scrollTop: 0,
    getBoundingClientRect() {
      return { top: 100, bottom: 260, height: 160 };
    }
  };
  const panel = {
    querySelector(selector) {
      if (selector === '.shared-filter-panel-body') return panelBody;
      if (selector === '.shared-filter-group[data-section-key="skills"]') {
        return {
          dataset: { sectionKey: 'skills' },
          getBoundingClientRect() {
            return { top: 320, bottom: 460, height: 140 };
          }
        };
      }
      return null;
    }
  };
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-skills-section.vm.js' });
  sandbox.module.exports.ensureSharedFilterSectionVisibility(panel, 'skills');
  return panelBody.scrollTop;
}

function evaluateSkillsMenuScroll(content) {
  const script = [
    extractFunctionSource(content, 'ensureSharedFilterMenuVisibility'),
    'module.exports = { ensureSharedFilterMenuVisibility };'
  ].join('\n\n');
  const panelBody = { scrollTop: 0 };
  let windowScrollByCalls = 0;
  const group = { dataset: { sectionKey: 'skills' } };
  const trigger = {
    closest(selector) {
      if (selector === '.shared-filter-group[data-section-key]') return group;
      if (selector === '.shared-filter-panel-body') return panelBody;
      return null;
    }
  };
  const menu = {
    getBoundingClientRect() {
      return { top: 320, bottom: 620, height: 300 };
    }
  };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    window: {
      innerHeight: 420,
      scrollBy() {
        windowScrollByCalls += 1;
      }
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-skills-menu.vm.js' });
  sandbox.module.exports.ensureSharedFilterMenuVisibility(trigger, menu);
  return { panelBody, windowScrollByCalls };
}

function evaluateSalaryMetricControlStructure(content) {
  const script = [
    extractFunctionSource(content, 'createSalaryMetricFilterControl'),
    'module.exports = { createSalaryMetricFilterControl };'
  ].join('\n\n');

  function createNode(tag) {
    return {
      tagName: String(tag || '').toUpperCase(),
      className: '',
      classList: {
        add() {},
        remove() {},
        toggle() {},
        contains() { return false; }
      },
      textContent: '',
      children: [],
      attrs: {},
      dataset: {},
      appendChild(child) {
        this.children.push(child);
        child.parentNode = this;
        return child;
      },
      setAttribute(name, value) {
        this.attrs[name] = value;
      },
      addEventListener() {}
    };
  }

  const sandbox = {
    module: { exports: {} },
    exports: {},
    uiState: {
      market_trends_salary_metric: 'avg'
    },
    document: {
      createElement(tag) {
        return createNode(tag);
      }
    }
  };

  vm.runInNewContext(script, sandbox, { filename: 'salary-metric-control.vm.js' });
  const activeRole = { dataset: { activeAnalysis: 'salary' } };
  const control = sandbox.module.exports.createSalaryMetricFilterControl(activeRole, 'salary');
  const metricWrap = control && control.children ? control.children[0] : null;
  const label = metricWrap && metricWrap.children ? metricWrap.children[0] : null;
  const chipShell = metricWrap && metricWrap.children ? metricWrap.children[1] : null;
  return { control, metricWrap, label, chipShell };
}

function evaluateDefaultPeriodBehavior(content) {
  const script = [
    extractFunctionSource(content, 'getDefaultGlobalPeriodOptionValue'),
    extractFunctionSource(content, 'ensureDefaultPeriodFilterSelection'),
    'module.exports = { getDefaultGlobalPeriodOptionValue, ensureDefaultPeriodFilterSelection };'
  ].join('\n\n');

  const bucket = { include: [], exclude: [] };
  const options = [
    { value: 'today', label: 'Сегодня' },
    { value: 'last_3', label: 'За 3 дня' },
    { value: 'last_7', label: 'За 7 дней' },
    { value: 'last_14', label: 'За 14 дней' },
    { value: '2026-04', label: '2026-04' },
    { value: '2026-03', label: '2026-03' },
    { value: 'Весь период', label: 'Весь период' }
  ];
  const sandbox = {
    module: { exports: {} },
    exports: {},
    getGlobalFilterOptions() {
      return options.slice();
    },
    normalizeGlobalPeriodValue(value) {
      return String(value || '').trim();
    },
    ensureGlobalFilterBucket() {
      return bucket;
    },
    hasExplicitGlobalFilterSelection() {
      return false;
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-default-period.vm.js' });
  const activeRole = { dataset: { activeAnalysis: 'totals' } };
  const defaultValue = sandbox.module.exports.getDefaultGlobalPeriodOptionValue(activeRole, 'totals');
  const changed = sandbox.module.exports.ensureDefaultPeriodFilterSelection(activeRole, 'totals');
  return { defaultValue, changed, bucket };
}

function evaluateDeferredDefaultPeriodBehavior(content) {
  const script = [
    extractFunctionSource(content, 'getDefaultGlobalPeriodOptionValue'),
    extractFunctionSource(content, 'ensureDefaultPeriodFilterSelection'),
    'module.exports = { getDefaultGlobalPeriodOptionValue, ensureDefaultPeriodFilterSelection };'
  ].join('\n\n');

  const bucket = { include: ['Весь период'], exclude: [], autoDefault: 'Весь период' };
  const options = [
    { value: 'today', label: 'Сегодня' },
    { value: 'last_14', label: 'За 14 дней' },
    { value: '2026-04', label: '2026-04' },
    { value: '2026-03', label: '2026-03' },
    { value: 'Весь период', label: 'Весь период' }
  ];
  const sandbox = {
    module: { exports: {} },
    exports: {},
    getGlobalFilterOptions() {
      return options.slice();
    },
    normalizeGlobalPeriodValue(value) {
      return String(value || '').trim();
    },
    ensureGlobalFilterBucket() {
      return bucket;
    },
    hasExplicitGlobalFilterSelection() {
      return !!((bucket.include && bucket.include.length) || (bucket.exclude && bucket.exclude.length));
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-deferred-default-period.vm.js' });
  const activeRole = { dataset: { activeAnalysis: 'totals' } };
  const changed = sandbox.module.exports.ensureDefaultPeriodFilterSelection(activeRole, 'totals');
  return { changed, bucket };
}

function evaluateDomBackedPeriodOptions(content) {
  const script = [
    extractFunctionSource(content, 'buildPeriodFilterOptionsFromMonths'),
    extractFunctionSource(content, 'collectRolePeriodOptionsFromDom'),
    extractFunctionSource(content, 'buildUnifiedRolePeriodFilterOptions'),
    'module.exports = { buildUnifiedRolePeriodOptions: buildUnifiedRolePeriodFilterOptions };'
  ].join('\n\n');

  const activeRole = {
    querySelectorAll(selector) {
      if (selector === '.month-content.activity-only[data-month], .salary-month-content[data-month]') {
        return [
          { dataset: { month: 'За 3 месяца' }, getAttribute() { return 'За 3 месяца'; } },
          { dataset: { month: '2026-03' }, getAttribute() { return '2026-03'; } },
          { dataset: { month: '2026-04' }, getAttribute() { return '2026-04'; } }
        ];
      }
      if (selector === '.monthly-skills-month-tabs .tab-button, .employer-period-chip[data-month]') {
        return [];
      }
      return [];
    }
  };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    collectScopedVacancies() {
      return [];
    },
    buildPeriodFilterOptionsFromVacancies() {
      return [
        { value: 'today', label: 'Сегодня' },
        { value: 'last_14', label: 'За 14 дней' },
        { value: 'Весь период', label: 'Весь период' }
      ];
    },
    getGlobalFilterScopeRoleContents() {
      return [activeRole];
    },
    getStandardPeriodFilterItems() {
      return [
        { key: 'today', label: 'Сегодня', period: 'today' },
        { key: 'd14', label: 'За 14 дней', period: 'last_14' }
      ];
    },
    dedupeFilterOptions(items) {
      const seen = new Set();
      return items.filter((item) => {
        const key = `${item.value}::${item.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    formatMonthLabel(value) {
      return value;
    },
    formatMonthTitle(count) {
      return count === 3 ? 'За 3 месяца' : `За ${count} месяцев`;
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-dom-period-options.vm.js' });
  return sandbox.module.exports.buildUnifiedRolePeriodOptions(activeRole);
}

function evaluateInitialTotalsFilterPrefetch(content) {
  const script = [
    extractFunctionSource(content, 'shouldPrefetchRoleVacanciesForFilters'),
    'module.exports = { shouldPrefetchRoleVacanciesForFilters };'
  ].join('\n\n');

  const activeRole = {
    id: 'role-1',
    dataset: { activeAnalysis: 'totals' },
    _data: {}
  };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    uiState: {
      shared_filter_panel_state: {
        activeSection: 'roles',
        lastAnalysis: '',
        userActivatedSectionKey: ''
      }
    },
    getRoleVacancies() {
      return [];
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-prefetch.vm.js' });
  return sandbox.module.exports.shouldPrefetchRoleVacanciesForFilters(activeRole, 'totals');
}

function evaluateVacancyFilterOptionLabels(content) {
  const script = [
    extractFunctionSource(content, 'buildCountryFilterOptionsFromVacancies'),
    extractFunctionSource(content, 'buildBooleanFilterOptionsFromVacancies'),
    'module.exports = { buildCountryFilterOptionsFromVacancies, buildBooleanFilterOptionsFromVacancies };'
  ].join('\n\n');

  const sandbox = {
    module: { exports: {} },
    exports: {},
    getGlobalCountryFilterValue(vacancy) {
      const country = String(vacancy && vacancy.country || '').trim();
      if (!country) return 'none';
      return country === 'Россия' ? 'ru' : 'not_ru';
    }
  };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-option-labels.vm.js' });
  return {
    country: sandbox.module.exports.buildCountryFilterOptionsFromVacancies([{ country: null }]).map((item) => item.label),
    accreditation: sandbox.module.exports.buildBooleanFilterOptionsFromVacancies([{ employer_accredited: true }], 'accreditation').map((item) => item.label),
    coverLetter: sandbox.module.exports.buildBooleanFilterOptionsFromVacancies([{ cover_letter_required: true }], 'cover_letter_required').map((item) => item.label),
    hasTest: sandbox.module.exports.buildBooleanFilterOptionsFromVacancies([{ has_test: true }], 'has_test').map((item) => item.label)
  };
}

function evaluateOfferFilterLabels(content) {
  const script = [
    extractFunctionSource(content, 'getGlobalFilterOptions'),
    'module.exports = { getGlobalFilterOptions };'
  ].join('\n\n');

  const vacancies = [{ offer_salary: 1000 }];
  const sandbox = {
    module: { exports: {} },
    exports: {},
    dedupeFilterOptions(items) { return items; },
    getRoleMetaList() { return []; },
    isResponsesCalendarAnalysis() { return false; },
    buildUnifiedRolePeriodFilterOptions() { return []; },
    getAllRoleContents() { return []; },
    sortExperienceFilterOptions(items) { return items; },
    buildCurrencyFilterOptionsFromVacancies() { return []; },
    buildCountryFilterOptionsFromVacancies() { return []; },
    buildEmployerFilterOptionsFromVacancies() { return []; },
    buildBooleanFilterOptionsFromVacancies() { return []; },
    collectScopedVacancies() { return vacancies.slice(); },
    buildResponseStateFilterOptions(_vacancies, _resolver, yesLabel, noLabel) {
      return [{ value: 'no', label: noLabel }, { value: 'yes', label: yesLabel }];
    },
    hasScheduledInterview() { return false; },
    hasResultContent() { return false; },
    hasOfferContent() { return true; },
    getRoleVacancies() { return vacancies.slice(); }
  };
  vm.runInNewContext(script, sandbox, { filename: 'shared-filter-offer-labels.vm.js' });
  return sandbox.module.exports.getGlobalFilterOptions({ id: 'role-1', dataset: { activeAnalysis: 'totals' } }, 'offer', 'totals').map((item) => item.label);
}

runTest('shared filter panel state defaults to roles section only', () => {
  [FILES.reportFilters, FILES.staticReportFilters].forEach((filePath) => {
    const state = evaluateDefaultState(read(filePath));
    assert.equal(state.activeSection, 'roles');
    assert.equal(state.sections.roles, true);
    assert.equal(state.sections.salary, false);
    assert.equal(state.sections.responses, false);
    assert.equal(state.sections.top, false);
    assert.equal(state.sections.vacancy, false);
    assert.equal(state.sections.skills, false);
    assert.equal(state.sections['my-filters'], false);
  });
});

runTest('shared filter accordion keeps only the newly opened section visible', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const result = evaluateAccordionBehavior(read(filePath));
    assert.equal(result.state.sections.roles, false);
    assert.equal(result.state.sections.salary, true);
    assert.equal(result.state.sections.responses, false);
    assert.equal(result.state.activeSection, 'salary');
    assert.equal(result.groups[0].dataset.sectionOpen, '0');
    assert.equal(result.groups[1].dataset.sectionOpen, '1');
    assert.equal(result.groups[2].dataset.sectionOpen, '0');
    assert.equal(result.headings.salary.attrs['aria-expanded'], 'true');
    assert.equal(result.syncCalls, 1);
    assert.ok(result.panelBody.scrollTop > 0);
  });
});

runTest('opening a filter menu keeps shared filter scroll stable and uses menu max-height instead', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const result = evaluateMenuPositioning(read(filePath), {
      panelRect: { top: 100, bottom: 520, height: 420 },
      triggerRect: { top: 180, bottom: 220, left: 10, right: 250, width: 240, height: 40 },
      triggerOffsetTop: 180,
      menuRect: { top: 222, bottom: 352, height: 130 },
      menuScrollHeight: 130,
      windowInnerHeight: 800
    });
    assert.equal(result.panelBody.scrollTop, 0, `${path.basename(filePath)} should not shift panel scroll when menu opens`);
    assert.match(String(result.menu.style.set['max-height'] || ''), /^\d+px$/);
  });
});

runTest('mobile shared filter accordion moves the selected group toward the top of the panel', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    assert.equal(evaluateMobileAccordionBehavior(read(filePath)), 126, `${path.basename(filePath)} should align the selected group near the top on mobile`);
  });
});

runTest('mobile shared filter accordion also aligns the skills group near the top of the panel', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    assert.equal(evaluateMobileAccordionBehavior(read(filePath), 'skills'), 366, `${path.basename(filePath)} should align the skills group near the top on mobile`);
  });
});

runTest('shared filter toggle uses a hamburger glyph for collapsed and expanded states', () => {
  [FILES.reportFilters, FILES.staticReportFilters].forEach((filePath) => {
    const result = evaluateToggleGlyph(read(filePath));
    assert.equal(result.expanded, '\u2630', `${path.basename(filePath)} should use hamburger in expanded state`);
    assert.equal(result.collapsed, '\u2630', `${path.basename(filePath)} should use hamburger in collapsed state`);
  });
});

runTest('opening a lower shared-filter dropdown scrolls panel to fit the full menu height', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const result = evaluateMenuPositioning(read(filePath), {
      panelRect: { top: 100, bottom: 360, height: 260 },
      triggerRect: { top: 320, bottom: 360, left: 10, right: 250, width: 240, height: 40 },
      triggerOffsetTop: 320,
      menuRect: { top: 362, bottom: 522, height: 160 },
      menuScrollHeight: 160,
      windowInnerHeight: 800
    });
    assert.ok(result.panelBody.scrollTop > 0, `${path.basename(filePath)} should scroll panel to make room for lower dropdown`);
    assert.ok(parseInt(result.menu.style.set['max-height'], 10) >= 160, `${path.basename(filePath)} should size menu to full content height after scroll`);
  });
});

runTest('opening a lower shared-filter dropdown flips upward when panel can no longer scroll', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const result = evaluateMenuPositioning(read(filePath), {
      panelRect: { top: 100, bottom: 360, height: 260 },
      panelScrollHeight: 260,
      triggerRect: { top: 320, bottom: 360, left: 10, right: 250, width: 240, height: 40 },
      triggerOffsetTop: 320,
      menuRect: { top: 362, bottom: 522, height: 160 },
      menuScrollHeight: 160,
      windowInnerHeight: 800
    });
    assert.equal(result.panelBody.scrollTop, 0, `${path.basename(filePath)} should not try to scroll a full panel`);
    assert.ok(parseInt(result.menu.style.set['max-height'], 10) >= 160, `${path.basename(filePath)} should preserve full menu height when opening upward`);
    assert.ok(parseInt(result.menu.style.set.top, 10) < 320, `${path.basename(filePath)} should place the menu above the trigger when there is no room below`);
  });
});

runTest('skills section opening does not auto-scroll the shared filter panel', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    assert.equal(evaluateSkillsSectionScroll(read(filePath)), 0, `${path.basename(filePath)} should not auto-scroll skills section`);
  });
});

runTest('skills dropdown opening does not auto-scroll panel or window', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const result = evaluateSkillsMenuScroll(read(filePath));
    assert.equal(result.panelBody.scrollTop, 0, `${path.basename(filePath)} should not move panel scroll for skills menu`);
    assert.equal(result.windowScrollByCalls, 0, `${path.basename(filePath)} should not scroll window for skills menu`);
  });
});

runTest('salary metric filter uses the same field shell structure as shared dropdown filters', () => {
  [FILES.reportFilters, FILES.staticReportFilters].forEach((filePath) => {
    const result = evaluateSalaryMetricControlStructure(read(filePath));
    assert.match(String(result.metricWrap && result.metricWrap.className || ''), /shared-filter-salary-dropdown/);
    assert.equal(String(result.label && result.label.className || ''), 'shared-filter-field-label');
    assert.equal(String(result.chipShell && result.chipShell.className || ''), 'totals-top-filter-chip-row');
  });
});

runTest('shared filter panel uses documented Material icons for section groups', () => {
  [FILES.reportFilters, FILES.staticReportFilters].forEach((filePath) => {
    const source = read(filePath);
    assert.match(source, /\{\s*key:\s*'my-filters',\s*label:\s*'Избранное',\s*icon:\s*'favorite'\s*\}/);
    assert.match(source, /\{\s*key:\s*'roles',\s*label:\s*'Роль',\s*icon:\s*'person'\s*\}/);
    assert.match(source, /\{\s*key:\s*'salary',\s*label:\s*'Зарплата',\s*icon:\s*'payments'\s*\}/);
    assert.match(source, /\{\s*key:\s*'responses',\s*label:\s*'Отклики',\s*icon:\s*'mail'\s*\}/);
    assert.match(source, /\{\s*key:\s*'top',\s*label:\s*'Топ',\s*icon:\s*'text_fields'\s*\}/);
    assert.match(source, /\{\s*key:\s*'vacancy',\s*label:\s*'Вакансия',\s*icon:\s*'work'\s*\}/);
    assert.match(source, /\{\s*key:\s*'skills',\s*label:\s*'Навыки',\s*icon:\s*'local_fire_department'\s*\}/);
    assert.doesNotMatch(source, /\{\s*key:\s*'top',\s*label:\s*'Топ',\s*icon:\s*'format_size'\s*\}/);
  });
});

runTest('shared filter icons render as official material symbol text glyphs', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const source = read(filePath);
    assert.match(
      source,
      /function createSharedFilterMaterialIcon\(iconName,\s*className\)[\s\S]*icon\.className = 'material-symbols-outlined' \+ \(className \? ' ' \+ className : ''\);[\s\S]*icon\.dataset\.icon = name;[\s\S]*icon\.style\.fontFamily = \"'Material Symbols Outlined'\";[\s\S]*icon\.style\.fontFeatureSettings = \"'liga'\";[\s\S]*icon\.textContent = name;/,
      `${path.basename(filePath)} should render shared filter icons as Material Symbols text glyphs`
    );
    assert.doesNotMatch(
      source,
      /api\.iconify\.design|shared-filter-material-icon-glyph|maskImage|webkitMaskImage/,
      `${path.basename(filePath)} should not render shared filter icons through masked Iconify SVGs`
    );
  });
});

runTest('default shared period selects the latest calendar month instead of 14 days', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const result = evaluateDefaultPeriodBehavior(read(filePath));
    assert.equal(result.defaultValue, '2026-04', `${path.basename(filePath)} should default periods to the latest month option`);
    assert.equal(result.changed, true, `${path.basename(filePath)} should apply the default period when no explicit selection exists`);
    assert.deepEqual(Array.from(result.bucket.include), ['2026-04'], `${path.basename(filePath)} should store the latest month as the default period selection`);
    assert.deepEqual(Array.from(result.bucket.exclude), [], `${path.basename(filePath)} should not add default period exclusions`);
  });
});

runTest('auto-applied fallback period upgrades to the latest month when month options appear', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const result = evaluateDeferredDefaultPeriodBehavior(read(filePath));
    assert.equal(result.changed, true, `${path.basename(filePath)} should replace the fallback auto-default when month options appear`);
    assert.deepEqual(Array.from(result.bucket.include), ['2026-04'], `${path.basename(filePath)} should upgrade the stored period to the latest month`);
    assert.deepEqual(Array.from(result.bucket.exclude), [], `${path.basename(filePath)} should keep exclusions empty after upgrading the auto-default`);
    assert.equal(result.bucket.autoDefault, '2026-04', `${path.basename(filePath)} should track the upgraded month as the current auto-default`);
  });
});

runTest('period options fall back to month blocks in the DOM when vacancies are still lazy-loaded', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const options = evaluateDomBackedPeriodOptions(read(filePath));
    assert.ok(options.some((item) => item.value === '2026-04'), `${path.basename(filePath)} should expose the latest month from rendered month blocks`);
    assert.ok(options.some((item) => item.value === '2026-03'), `${path.basename(filePath)} should expose older rendered month blocks`);
    assert.ok(options.some((item) => item.value === 'За 3 месяца'), `${path.basename(filePath)} should preserve the rendered summary option from month blocks`);
  });
});

runTest('totals filter panel prefetches vacancies on initial open when lazy data is still empty', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const shouldPrefetch = evaluateInitialTotalsFilterPrefetch(read(filePath));
    assert.equal(shouldPrefetch, true, `${path.basename(filePath)} should start filter prefetch on the initial totals open`);
  });
});

runTest('vacancy filter option labels match documentation wording', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const result = evaluateVacancyFilterOptionLabels(read(filePath));
    assert.deepEqual(Array.from(result.country), ['Россия', 'не Россия'], `${path.basename(filePath)} should expose documented country options`);
    assert.deepEqual(Array.from(result.accreditation), ['Есть', 'Нет'], `${path.basename(filePath)} should expose documented accreditation labels`);
    assert.deepEqual(Array.from(result.coverLetter), ['Требуется', 'Не требуется'], `${path.basename(filePath)} should expose documented cover-letter labels`);
    assert.deepEqual(Array.from(result.hasTest), ['Есть', 'Нет'], `${path.basename(filePath)} should expose documented test-task labels`);
  });
});

runTest('offer filter labels match documentation wording', () => {
  [FILES.reportUi, FILES.staticReportUi].forEach((filePath) => {
    const labels = evaluateOfferFilterLabels(read(filePath));
    assert.deepEqual(Array.from(labels), ['Не получен', 'Получен'], `${path.basename(filePath)} should expose documented offer labels`);
  });
});
