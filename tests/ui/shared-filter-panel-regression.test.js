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

function evaluateMenuPositioning(content) {
  const script = [
    extractFunctionSource(content, 'resetGlobalFilterMenuPosition'),
    extractFunctionSource(content, 'restoreGlobalFilterMenuHost'),
    extractFunctionSource(content, 'ensureSharedFilterMenuVisibility'),
    extractFunctionSource(content, 'positionGlobalFilterMenu'),
    'module.exports = { positionGlobalFilterMenu };'
  ].join('\n\n');

  const host = {
    style: {},
    appendChild(node) {
      node.parentElement = this;
    }
  };
  const panelBody = {
    scrollTop: 0,
    clientHeight: 260,
    getBoundingClientRect() {
      return { top: 100, bottom: 360, height: 260 };
    }
  };
  const trigger = {
    offsetWidth: 240,
    offsetTop: 320,
    offsetHeight: 40,
    offsetLeft: 10,
    getBoundingClientRect() {
      return { top: 320, bottom: 360, left: 10, right: 250, width: 240, height: 40 };
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
    getBoundingClientRect() {
      return { top: 362, bottom: 612, height: 250 };
    }
  };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    window: { innerHeight: 420 },
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
    const result = evaluateMenuPositioning(read(filePath));
    assert.equal(result.panelBody.scrollTop, 0, `${path.basename(filePath)} should not shift panel scroll when menu opens`);
    assert.match(String(result.menu.style.set['max-height'] || ''), /^\d+px$/);
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
