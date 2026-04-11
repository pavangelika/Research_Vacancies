function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function formatCell(value) {
    if (value === null || value === undefined || value === '') return '—';
    return escapeHtml(value);
}
function getExperienceLabels() {
    return {
        none: '\u041d\u0435\u0442 \u043e\u043f\u044b\u0442\u0430',
        oneToThree: '\u041e\u0442 1 \u0433\u043e\u0434\u0430 \u0434\u043e 3 \u043b\u0435\u0442',
        threeToSix: '\u041e\u0442 3 \u0434\u043e 6 \u043b\u0435\u0442',
        sixPlus: '\u0411\u043e\u043b\u0435\u0435 6 \u043b\u0435\u0442',
        total: '\u0412\u0441\u0435\u0433\u043e'
    };
}
function normalizeExperience(exp) {
    if (!exp) return null;
    var e = String(exp).trim();
    var labels = getExperienceLabels();
    if (e === labels.total) return labels.total;
    if (e === labels.none) return labels.none;
    if (e === labels.oneToThree) return labels.oneToThree;
    if (e === labels.threeToSix) return labels.threeToSix;
    if (e === labels.sixPlus) return labels.sixPlus;
    // digit-based fallback
    if (e.indexOf('1') >= 0 && e.indexOf('3') >= 0) return labels.oneToThree;
    if (e.indexOf('3') >= 0 && e.indexOf('6') >= 0) return labels.threeToSix;
    if (e.indexOf('6') >= 0 && (e.indexOf('лет') >= 0 || e.indexOf('+') >= 0)) return labels.sixPlus;
    return e;
}
function getExperienceOrder() {
    var labels = getExperienceLabels();
    return {
        [labels.none]: 1,
        [labels.oneToThree]: 2,
        [labels.threeToSix]: 3,
        [labels.sixPlus]: 4
    };
}
function getStandardPeriodFilterItems() {
    return [
        { key: 'today', label: 'Сегодня', period: 'today' },
        { key: 'd3', label: 'За 3 дня', period: 'last_3' },
        { key: 'd7', label: 'За 7 дней', period: 'last_7' },
        { key: 'd14', label: 'За 14 дней', period: 'last_14' }
    ];
}
function formatMonthTitle(numMonths) {
    if (numMonths === 1) return 'За 1 месяц';
    if (numMonths >= 2 && numMonths <= 4) return 'За ' + numMonths + ' месяца';
    return 'За ' + numMonths + ' месяцев';
}
function formatMonthLabel(monthKey) {
    return String(monthKey || '').trim();
}
function isSummaryMonth(monthStr) {
    return String(monthStr || '').trim().startsWith('За ');
}
function parseJsonDataset(el, key, fallback) {
    if (el && el._data && el._data[key] !== undefined) return el._data[key];
    try {
        return JSON.parse(el.dataset[key] || JSON.stringify(fallback));
    } catch (_e) {
        try {
            return JSON.parse(decodeURIComponent(el.dataset[key] || ''));
        } catch (_e2) {
            return fallback;
        }
    }
}
function getReportApiBaseUrl() {
    if (typeof window === 'undefined' || !window.location) return 'http://localhost:9000';
    if (window.__REPORT_API_BASE_URL__) {
        return String(window.__REPORT_API_BASE_URL__).replace(/\/+$/, '');
    }
    if (window.location.protocol === 'file:') return 'http://localhost:9000';
    var origin = String(window.location.origin || '').trim().replace(/\/+$/, '');
    if (!origin) return 'http://localhost:9000';
    if (/^https?:\/\/(?:localhost|127\.0\.0\.1):63342$/i.test(origin)) return 'http://localhost:9000';
    return origin;
}
function buildReportAssetUrl(path) {
    var cleanPath = String(path || '').replace(/^\/+/, '');
    var base = getReportApiBaseUrl();
    var version = '';
    if (typeof window !== 'undefined' && window.__REPORT_ASSET_VERSION__) {
        version = String(window.__REPORT_ASSET_VERSION__).trim();
    }
    var url = base + '/' + cleanPath;
    if (version) {
        url += (url.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(version);
    }
    return url;
}
function ensureReportRuntimeCache() {
    if (typeof window === 'undefined') return null;
    if (!window.__REPORT_RUNTIME_CACHE__) {
        window.__REPORT_RUNTIME_CACHE__ = {
            json: {},
            vacancyPayloads: {},
            plotlyPromise: null
        };
    }
    return window.__REPORT_RUNTIME_CACHE__;
}
function loadJsonSync(url, fallback) {
    var cache = ensureReportRuntimeCache();
    if (cache && Object.prototype.hasOwnProperty.call(cache.json, url)) {
        return cache.json[url];
    }
    var result = fallback;
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
            result = JSON.parse(xhr.responseText || 'null');
            if (cache) cache.json[url] = result;
            return result;
        }
    } catch (_e) {
    }
    if (cache) cache.json[url] = fallback;
    return fallback;
}
function ensurePlotlyLoaded() {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (typeof Plotly !== 'undefined') return Promise.resolve(Plotly);
    var cache = ensureReportRuntimeCache();
    if (cache && cache.plotlyPromise) return cache.plotlyPromise;
    var promise = new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.src = buildReportAssetUrl('static/plotly-2.27.0.min.js');
        script.charset = 'utf-8';
        script.onload = function() {
            if (typeof Plotly !== 'undefined') {
                resolve(Plotly);
                return;
            }
            reject(new Error('plotly_not_available'));
        };
        script.onerror = function() {
            if (script.parentNode) script.parentNode.removeChild(script);
            var fallback = document.createElement('script');
            fallback.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
            fallback.charset = 'utf-8';
            fallback.onload = function() {
                if (typeof Plotly !== 'undefined') resolve(Plotly);
                else reject(new Error('plotly_not_available'));
            };
            fallback.onerror = function() {
                reject(new Error('plotly_load_failed'));
            };
            document.head.appendChild(fallback);
        };
        document.head.appendChild(script);
    });
    if (cache) cache.plotlyPromise = promise;
    return promise;
}
function computeMedian(values) {
    if (!values.length) return 0;
    var sorted = values.slice().sort((a, b) => a - b);
    var mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
}
function computeMode(values) {
    if (!values.length) return 0;
    var counts = new Map();
    for (var v of values) counts.set(v, (counts.get(v) || 0) + 1);
    var bestVal = values[0];
    var bestCount = 0;
    counts.forEach((count, val) => {
        if (count > bestCount || (count === bestCount && val < bestVal)) {
            bestCount = count;
            bestVal = val;
        }
    });
    return bestVal;
}
