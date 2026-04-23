const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UTILS_SOURCE_PATH = path.resolve(__dirname, '..', '..', 'reports', 'static', 'report.utils.js');
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

function createGetReportApiBaseUrl(windowValue) {
  const script = [
    extractFunctionSourceFrom(UTILS_SOURCE, 'getReportApiBaseUrl')
  ].join('\n\n') + '\nmodule.exports = { getReportApiBaseUrl };';

  const sandbox = {
    module: { exports: {} },
    exports: {},
    window: windowValue
  };
  vm.runInNewContext(script, sandbox, { filename: 'report-api-base-url.vm.js' });
  return sandbox.module.exports.getReportApiBaseUrl;
}

runTest('getReportApiBaseUrl prefers explicit override', () => {
  const getReportApiBaseUrl = createGetReportApiBaseUrl({
    __REPORT_API_BASE_URL__: 'http://localhost:8100/',
    location: {
      protocol: 'http:',
      origin: 'http://localhost:9000'
    }
  });

  assert.equal(getReportApiBaseUrl(), 'http://localhost:8100');
});

runTest('getReportApiBaseUrl routes localhost report server traffic to backend port 8000', () => {
  const getReportApiBaseUrl = createGetReportApiBaseUrl({
    location: {
      protocol: 'http:',
      origin: 'http://localhost:9000'
    }
  });

  assert.equal(getReportApiBaseUrl(), 'http://localhost:8000');
});

runTest('getReportApiBaseUrl routes IDE local preview traffic to backend port 8000', () => {
  const getReportApiBaseUrl = createGetReportApiBaseUrl({
    location: {
      protocol: 'http:',
      origin: 'http://localhost:63342'
    }
  });

  assert.equal(getReportApiBaseUrl(), 'http://localhost:8000');
});

runTest('getReportApiBaseUrl keeps non-local origins unchanged', () => {
  const getReportApiBaseUrl = createGetReportApiBaseUrl({
    location: {
      protocol: 'https:',
      origin: 'https://example.com'
    }
  });

  assert.equal(getReportApiBaseUrl(), 'https://example.com');
});
