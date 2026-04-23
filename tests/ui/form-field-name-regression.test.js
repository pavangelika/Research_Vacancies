const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const STATIC_UI_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.ui.js'),
  'utf8'
);
const STATIC_FILTERS_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.filters.js'),
  'utf8'
);
const STATIC_RENDER_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.render.js'),
  'utf8'
);
const TEMPLATE_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '..', '..', 'reports', 'templates', 'report_template.html'),
  'utf8'
);

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('ui source installs form-field name normalizer for static and dynamic markup', () => {
  assert.match(STATIC_UI_SOURCE, /function ensureFormFieldNames\(root\)/);
  assert.match(STATIC_UI_SOURCE, /new MutationObserver\(function\(mutations\)/);
  assert.match(STATIC_UI_SOURCE, /'skills-multi-toggle-input':\s*'skills_multi_toggle'/);
  assert.match(STATIC_UI_SOURCE, /'totals-ios-checkbox':\s*'boolean_toggle'/);
});

runTest('filter controls set stable field names at creation time', () => {
  assert.match(STATIC_FILTERS_SOURCE, /searchInput\.name = 'skills_search_query';/);
  assert.match(STATIC_FILTERS_SOURCE, /input\.name = 'skills_search_favorite_name';/);
  assert.match(STATIC_FILTERS_SOURCE, /switchInput\.name = 'skills_search_logic';/);
  assert.match(STATIC_FILTERS_SOURCE, /range\.name = 'totals_top_limit_range';/);
  assert.match(STATIC_FILTERS_SOURCE, /numberInput\.name = 'totals_top_limit_number';/);
});

runTest('rendered checkbox controls keep explicit name attributes', () => {
  assert.match(STATIC_UI_SOURCE, /name="vacancy_response_status"/);
  assert.match(STATIC_UI_SOURCE, /name="skills_multi_toggle"/);
  assert.match(STATIC_RENDER_SOURCE, /name="vacancy_apply_toggle"/);
  assert.match(TEMPLATE_SOURCE, /name="skills_multi_toggle"/);
});
