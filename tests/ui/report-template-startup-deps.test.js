const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('report template does not depend on Google Fonts for startup rendering', () => {
  const templatePath = path.resolve(__dirname, '..', '..', 'reports', 'templates', 'report_template.html');
  const template = fs.readFileSync(templatePath, 'utf8');

  assert.equal(template.includes('fonts.googleapis.com'), false);
  assert.equal(template.includes('fonts.gstatic.com'), false);
});
