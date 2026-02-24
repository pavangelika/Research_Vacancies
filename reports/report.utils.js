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
function formatMonthTitle(numMonths) {
    if (numMonths === 1) return 'За 1 месяц';
    if (numMonths >= 2 && numMonths <= 4) return 'За ' + numMonths + ' месяца';
    return 'За ' + numMonths + ' месяцев';
}
function isSummaryMonth(monthStr) {
    return monthStr && monthStr.startsWith('За ');
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
function formatNumber(value, digits) {
    if (value === null || value === undefined || isNaN(Number(value))) return '—';
    var d = (digits === undefined || digits === null) ? 0 : digits;
    return Number(value).toLocaleString('ru-RU', {
        minimumFractionDigits: d,
        maximumFractionDigits: d
    });
}
function getInfluenceFactorLabel(factor) {
    if (factor === 'rating_bucket') return 'Рейтинг работодателя';
    if (factor === 'accreditation') return 'Аккредитация IT';
    if (factor === 'has_test') return 'Тестовое';
    if (factor === 'cover_letter_required') return 'Сопроводительное';
    return factor || 'Фактор';
}
