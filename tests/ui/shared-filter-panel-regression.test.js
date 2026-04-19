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
