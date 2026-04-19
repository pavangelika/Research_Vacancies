const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TEMPLATE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'templates', 'report_template.html');

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

runTest('report template redirects file protocol loads to local report server before static assets initialize', () => {
  const source = read(TEMPLATE_PATH);

  assert.match(source, /window\.location\.protocol !== 'file:'/);
  assert.match(source, /http:\/\/localhost:9000\/report\.html/);
  assert.match(source, /window\.location\.search \|\| ''/);
  assert.match(source, /window\.location\.hash \|\| ''/);
  assert.match(source, /window\.location\.replace\(targetUrl\)/);
  assert.match(source, /document\.write\('/);
});
