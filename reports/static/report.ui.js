function openRoleTab(evt, roleId) {
    var i, roleContent, roleButtons;
    roleContent = document.getElementsByClassName("role-content");
    for (i = 0; i < roleContent.length; i++) {
        roleContent[i].style.display = "none";
    }
    roleButtons = document.getElementsByClassName("role-button");
    for (i = 0; i < roleButtons.length; i++) {
        roleButtons[i].className = roleButtons[i].className.replace(" active", "");
    }
    document.getElementById(roleId).style.display = "block";
    evt.currentTarget.className += " active";

    var savedType = uiState.global_analysis_type || uiState[getAnalysisStateKey(roleId)];
    if (savedType) {
        var targetId = savedType + '-' + roleId.split('-')[1];
        var targetButton = document.querySelector("#" + roleId + " .analysis-button[data-analysis-id='" + targetId + "']");
        if (targetButton) {
            targetButton.click();
            return;
        }
    }
    var firstButton = document.querySelector("#" + roleId + " .analysis-button");
    if (firstButton) firstButton.click();
}

// ---------- Переключение типов анализа ----------
function switchAnalysis(evt, analysisId) {
    var parentRole = evt.currentTarget.closest('.role-content');
    var roleId = parentRole.id;
    var analysisButtons = parentRole.getElementsByClassName("analysis-button");
    for (var i = 0; i < analysisButtons.length; i++) {
        analysisButtons[i].className = analysisButtons[i].className.replace(" active", "");
    }
    evt.currentTarget.className += " active";

    var activityBlocks = parentRole.querySelectorAll('.activity-only');
    var weekdayBlock = parentRole.querySelector('.weekday-content');
    var skillsMonthlyBlock = parentRole.querySelector('.skills-monthly-content');
    var salaryBlock = parentRole.querySelector('.salary-content');
    var employerAnalysisBlock = parentRole.querySelector('.employer-analysis-content');

    var analysisType;
    if (analysisId.includes('activity')) analysisType = 'activity';
    else if (analysisId.includes('weekday')) analysisType = 'weekday';
    else if (analysisId.includes('skills-monthly')) analysisType = 'skills-monthly';
    else if (analysisId.includes('salary')) analysisType = 'salary';
    else if (analysisId.includes('employer-analysis')) analysisType = 'employer-analysis';

    uiState.global_analysis_type = analysisType;
    uiState[getAnalysisStateKey(roleId)] = analysisType;

    activityBlocks.forEach(block => block.style.display = 'none');
    if (weekdayBlock) weekdayBlock.style.display = 'none';
    if (skillsMonthlyBlock) skillsMonthlyBlock.style.display = 'none';
    if (salaryBlock) salaryBlock.style.display = 'none';
    if (employerAnalysisBlock) employerAnalysisBlock.style.display = 'none';

    if (analysisType === 'activity') {
        activityBlocks.forEach(block => block.style.display = 'block');
        normalizeActivityControls(parentRole);
        if (roleId === 'role-all') restoreAllRolesPeriodState(parentRole, 'activity');
        else restoreActivityState(parentRole, roleId);
    } else if (analysisType === 'weekday') {
        weekdayBlock.style.display = 'block';
        normalizeWeekdayControls(parentRole);
        if (roleId === 'role-all') {
            restoreAllRolesPeriodState(parentRole, 'weekday');
        } else {
            var viewBtns = weekdayBlock.querySelectorAll('.view-mode-btn');
            setActiveViewButton(viewBtns, uiState.weekday_view_mode);
            applyViewMode(weekdayBlock.querySelector('.view-mode-container'), uiState.weekday_view_mode);
            buildWeekdayBarChart(analysisId.split('-')[1], weekdayBlock);
            applyWeekdayModeSizing(weekdayBlock.querySelector('.view-mode-container'), uiState.weekday_view_mode);
        }
    } else if (analysisType === 'skills-monthly') {
        skillsMonthlyBlock.style.display = 'block';
        if (roleId === 'role-all') restoreAllRolesPeriodState(parentRole, 'skills');
        else restoreSkillsMonthlyState(parentRole, roleId);
    } else if (analysisType === 'salary') {
        salaryBlock.style.display = 'block';
        if (roleId === 'role-all') restoreAllRolesPeriodState(parentRole, 'salary');
        else restoreSalaryState(parentRole, roleId);
    } else if (analysisType === 'employer-analysis') {
        if (employerAnalysisBlock) {
            employerAnalysisBlock.style.display = 'block';
            initEmployerAnalysisFilter(employerAnalysisBlock);
        }
    }
}

function normalizeActivityControls(parentRole) {
    if (!parentRole) return;
    var monthTabs = parentRole.querySelector('.tabs.month-tabs.activity-only');
    if (!monthTabs) return;

    sortActivityMonthsNewestFirst(parentRole, monthTabs);

    var controlRow = parentRole.querySelector('.activity-control-row');
    if (!controlRow) {
        controlRow = document.createElement('div');
        controlRow.className = 'activity-control-row activity-only';
        monthTabs.parentElement.insertBefore(controlRow, monthTabs);
    }
    if (monthTabs.parentElement !== controlRow) controlRow.appendChild(monthTabs);

    var inlineToggle = controlRow.querySelector('.activity-mode-toggle-inline');
    if (!inlineToggle) {
        inlineToggle = document.createElement('div');
        inlineToggle.className = 'view-toggle-horizontal activity-mode-toggle-inline';
        inlineToggle.innerHTML =
            '<button class="view-mode-btn activity-inline-mode-btn" data-view="together" title="Вместе">⊞</button>' +
            '<button class="view-mode-btn activity-inline-mode-btn" data-view="table" title="Таблица">☷</button>' +
            '<button class="view-mode-btn activity-inline-mode-btn" data-view="graph" title="График">📈</button>';
        controlRow.appendChild(inlineToggle);
    }
    if (!inlineToggle.dataset.bound) {
        inlineToggle.addEventListener('click', function(e) {
            var btn = e.target.closest('.activity-inline-mode-btn');
            if (!btn) return;
            var view = btn.dataset.view || 'together';
            uiState.activity_view_mode = view;
            setActiveViewButton(inlineToggle.querySelectorAll('.activity-inline-mode-btn'), view);

            var visibleMonth = parentRole.querySelector('.month-content.activity-only[style*="display: block"]');
            if (!visibleMonth) return;
            var monthBtns = visibleMonth.querySelectorAll('.view-mode-btn');
            setActiveViewButton(monthBtns, view);
            var container = visibleMonth.querySelector('.view-mode-container');
            applyViewMode(container, view);
            var monthId = visibleMonth.id || '';
            var graphId = 'activity-graph-' + monthId.replace('month-', '');
            var entries = parseJsonDataset(visibleMonth, 'entries', []);
            buildActivityBarChart(graphId, entries);
            applyActivityModeSizing(container, view);
        });
        inlineToggle.dataset.bound = '1';
    }

    setActiveViewButton(inlineToggle.querySelectorAll('.activity-inline-mode-btn'), uiState.activity_view_mode || 'together');

    var graphBtns = parentRole.querySelectorAll('.activity-only .view-toggle-horizontal .graph-btn, .month-content.activity-only .graph-btn');
    graphBtns.forEach(function(btn) {
        btn.textContent = '📈';
        btn.title = 'График';
    });
}

function sortActivityMonthsNewestFirst(parentRole, monthTabs) {
    if (!parentRole || !monthTabs || monthTabs.dataset.sorted === '1') return;
    var buttons = Array.from(monthTabs.querySelectorAll('.month-button'));
    if (!buttons.length) return;
    buttons.sort(function(a, b) {
        var am = (a.textContent || '').trim();
        var bm = (b.textContent || '').trim();
        return bm.localeCompare(am);
    });
    buttons.forEach(function(btn) { monthTabs.appendChild(btn); });
    monthTabs.dataset.sorted = '1';
}

function normalizeWeekdayControls(parentRole) {
    if (!parentRole) return;
    var sections = parentRole.querySelectorAll(
        '.weekday-content, .all-roles-period-content[data-analysis="weekday-all"]'
    );
    sections.forEach(function(section) {
        var toggle = section.querySelector('.view-toggle-horizontal');
        if (!toggle) return;
        var row = section.querySelector('.weekday-control-row');
        if (!row) {
            row = document.createElement('div');
            row.className = 'weekday-control-row';
            section.insertBefore(row, toggle);
        }
        if (toggle.parentElement !== row) row.appendChild(toggle);
        toggle.classList.add('weekday-mode-toggle-inline');

        var graphBtn = toggle.querySelector('.graph-btn');
        if (graphBtn) {
            graphBtn.textContent = '📈';
            graphBtn.title = 'График';
        }
    });
    var noneCells = parentRole.querySelectorAll(
        '.weekday-content td, .all-roles-period-content[data-analysis="weekday-all"] td'
    );
    noneCells.forEach(function(cell) {
        if ((cell.textContent || '').trim() === 'None') {
            cell.textContent = 'нет архивных';
        }
    });
}

function applyEmployerAnalysisMonthFilter(block, month) {
    if (!block) return;
    if (!block.__employerData || !block.__employerData.length) return;
    if (block.dataset.employerActiveMonth === month) return;
    var periodLabel = block.dataset.employerAllLabel || '';
    var rows = [];
    if (month === 'all') {
        rows = block.__employerAllRows || aggregateEmployerAnalysisRows(block.__employerData);
    } else {
        rows = (block.__employerRowsByMonth && block.__employerRowsByMonth[month])
            ? block.__employerRowsByMonth[month]
            : block.__employerData.filter(function(row) { return row.month === month; });
    }
    renderEmployerAnalysisTable(block, rows, month === 'all' ? periodLabel : null);
    var chips = block.querySelectorAll('.employer-period-chip');
    chips.forEach(function(chip) {
        var isActive = (chip.dataset.month || '') === month;
        chip.classList.toggle('active', isActive);
    });
    block.dataset.employerActiveMonth = month;
    renderEmployerAnalysisChart(block);
}

function applyEmployerAnalysisViewMode(block, mode) {
    if (!block) return;
    var table = block.querySelector('.employer-analysis-table-container') || block.querySelector('.table-container');
    var graph = block.querySelector('.employer-analysis-graph');
    if (!table || !graph) return;

    block.dataset.employerViewMode = mode;
    var btns = block.querySelectorAll('.employer-view-btn');
    btns.forEach(function(btn) {
        btn.classList.toggle('active', (btn.dataset.view || '') === mode);
    });

    if (mode === 'graph') {
        table.style.display = 'none';
        graph.style.display = 'block';
        renderEmployerAnalysisChart(block);
    } else {
        table.style.display = 'block';
        graph.style.display = 'none';
    }
}

function renderEmployerAnalysisChart(block) {
    if (!block || typeof Plotly === 'undefined') return;
    var graph = block.querySelector('.employer-analysis-graph');
    if (!graph) return;
    var mode = block.dataset.employerViewMode || 'table';
    if (mode !== 'graph') return;

    var rows = Array.from(block.querySelectorAll('.table-container tbody tr')).filter(function(row) {
        return row.style.display !== 'none';
    });
    if (!rows.length) {
        if (graph.__medianChartEl) Plotly.purge(graph.__medianChartEl);
        if (graph.__avgChartEl) Plotly.purge(graph.__avgChartEl);
        graph.__medianChartEl = null;
        graph.__avgChartEl = null;
        graph.innerHTML = '<div style="padding:12px;color:var(--text-secondary);text-align:center;">Нет данных для выбранного периода</div>';
        return;
    }

    var categories = [
        { key: 'accr_false', label: 'ИТ-аккредитация false' },
        { key: 'accr_true', label: 'ИТ-аккредитация true' },
        { key: 'test_false', label: 'Тестовое задание false' },
        { key: 'test_true', label: 'Тестовое задание true' },
        { key: 'cover_false', label: 'Сопроводительное письмо false' },
        { key: 'cover_true', label: 'Сопроводительное письмо true' },
        { key: 'rating_unknown', label: 'без рейтинга' },
        { key: 'rating_lt_35', label: 'рейтинг <3.5' },
        { key: 'rating_35_399', label: 'рейтинг 3.5-3.99' },
        { key: 'rating_40_449', label: 'рейтинг 4.0-4.49' },
        { key: 'rating_ge_45', label: 'рейтинг >=4.5' }
    ];
    var buckets = {};
    categories.forEach(function(c) {
        buckets[c.key] = { n: 0, avgWeighted: 0, medianPairs: [] };
    });

    function normalizeVal(v) {
        return String(v || '').trim().toLowerCase();
    }
    function toNum(v) {
        var n = parseFloat(String(v || '0').replace(/\s/g, '').replace(',', '.'));
        return isFinite(n) ? n : 0;
    }
    function toInt(v) {
        var n = parseInt(String(v || '0').replace(/\s/g, ''), 10);
        return isFinite(n) ? n : 0;
    }
    function resolveBucket(factorKey, valueKey) {
        if (factorKey === 'rating_bucket') {
            if (valueKey === 'unknown' || valueKey === 'нет рейтинга') return 'rating_unknown';
            if (valueKey === '<3.5') return 'rating_lt_35';
            if (valueKey === '3.5-3.99') return 'rating_35_399';
            if (valueKey === '4.0-4.49') return 'rating_40_449';
            if (valueKey === '>=4.5') return 'rating_ge_45';
            return null;
        }
        if (factorKey === 'accreditation') {
            if (valueKey === 'true') return 'accr_true';
            if (valueKey === 'false') return 'accr_false';
            return null;
        }
        if (factorKey === 'has_test') {
            if (valueKey === 'true') return 'test_true';
            if (valueKey === 'false') return 'test_false';
            return null;
        }
        if (factorKey === 'cover_letter_required') {
            if (valueKey === 'true') return 'cover_true';
            if (valueKey === 'false') return 'cover_false';
        }
        return null;
    }
    function weightedMedian(pairs) {
        if (!pairs.length) return null;
        var sorted = pairs.slice().sort(function(a, b) { return a.value - b.value; });
        var total = sorted.reduce(function(sum, p) { return sum + p.w; }, 0);
        if (!total) return null;
        var threshold = total / 2;
        var acc = 0;
        for (var i = 0; i < sorted.length; i += 1) {
            acc += sorted[i].w;
            if (acc >= threshold) return sorted[i].value;
        }
        return sorted[sorted.length - 1].value;
    }

    rows.forEach(function(row) {
        var factorKey = normalizeVal(row.dataset.factor);
        var valueKey = normalizeVal(row.dataset.valueKey || row.dataset.valueLabel || (row.cells && row.cells[2] ? row.cells[2].textContent : ''));
        var bucketKey = resolveBucket(factorKey, valueKey);
        if (!bucketKey) return;
        var n = toInt(row.dataset.groupN || (row.cells && row.cells[3] ? row.cells[3].textContent : '0'));
        var avgVal = toNum(row.dataset.avg || (row.cells && row.cells[4] ? row.cells[4].textContent : '0'));
        var medianVal = toNum(row.dataset.median || (row.cells && row.cells[5] ? row.cells[5].textContent : '0'));
        buckets[bucketKey].n += n;
        buckets[bucketKey].avgWeighted += avgVal * n;
        buckets[bucketKey].medianPairs.push({ value: medianVal, w: n });
    });

    var labels = categories.map(function(c) { return c.label; });
    var avg = categories.map(function(c) {
        var b = buckets[c.key];
        return b.n ? (b.avgWeighted / b.n) : null;
    });
    var median = categories.map(function(c) {
        return weightedMedian(buckets[c.key].medianPairs);
    });

    var palette = (typeof CHART_COLORS !== 'undefined')
        ? CHART_COLORS
        : { light: '#B0BEC5', medium: '#90A4AE', dark: '#607D8B' };
    var colorByCategory = categories.map(function(c) {
        if (c.key.indexOf('_true') !== -1) return palette.light;
        if (c.key.indexOf('_false') !== -1) return palette.dark;
        return palette.medium;
    });
    var borderByCategory = categories.map(function() { return palette.dark; });

    graph.style.width = '100%';
    graph.style.maxWidth = '100%';
    graph.style.height = 'auto';
    graph.style.display = 'block';
    graph.style.overflow = 'visible';
    if (!graph.__medianChartEl || !graph.__avgChartEl) {
        graph.innerHTML = '<div class="employer-analysis-subgraph employer-analysis-median-graph"></div>' +
            '<div class="employer-analysis-subgraph employer-analysis-avg-graph"></div>';
        graph.__medianChartEl = graph.querySelector('.employer-analysis-median-graph');
        graph.__avgChartEl = graph.querySelector('.employer-analysis-avg-graph');
    }

    Plotly.newPlot(graph.__medianChartEl, [{
        type: 'bar',
        name: 'Медианная',
        x: labels,
        y: median,
        marker: { color: colorByCategory, line: { color: borderByCategory, width: 1 } }
    }], {
        title: { text: 'Медианная зарплата по параметрам', x: 0.5, xanchor: 'center' },
        xaxis: { automargin: true, tickangle: -25 },
        yaxis: { title: 'Зарплата, RUR' },
        margin: { t: 60, r: 20, b: 120, l: 80 },
        height: 420
    }, { responsive: true, displayModeBar: false });

    Plotly.newPlot(graph.__avgChartEl, [{
        type: 'bar',
        name: 'Средняя',
        x: labels,
        y: avg,
        marker: { color: colorByCategory, line: { color: borderByCategory, width: 1 } }
    }], {
        title: { text: 'Средняя зарплата по параметрам', x: 0.5, xanchor: 'center' },
        xaxis: { automargin: true, tickangle: -25 },
        yaxis: { title: 'Зарплата, RUR' },
        margin: { t: 60, r: 20, b: 120, l: 80 },
        height: 420
    }, { responsive: true, displayModeBar: false });
}

function getEmployerFactorOrder(factorKey) {
    var order = {
        'rating_bucket': 1,
        'accreditation': 2,
        'has_test': 3,
        'cover_letter_required': 4
    };
    return order[factorKey] || 99;
}

function getEmployerRatingOrder(valueKey) {
    var order = {
        'unknown': 0,
        'нет рейтинга': 0,
        '<3.5': 1,
        '3.5-3.99': 2,
        '4.0-4.49': 3,
        '>=4.5': 4
    };
    return (order[valueKey] !== undefined) ? order[valueKey] : 99;
}

function normalizeEmployerFactor(rawFactor) {
    var factor = (rawFactor || '').trim().toLowerCase();
    if (!factor) return 'accreditation';
    if (factor === 'accreditation' || factor === 'ит-аккредитация') return 'accreditation';
    if (factor === 'cover_letter_required' || factor === 'сопроводительное письмо') return 'cover_letter_required';
    if (factor === 'has_test' || factor === 'тестовое задание') return 'has_test';
    if (factor === 'rating_bucket' || factor === 'рейтинг фирмы') return 'rating_bucket';
    return factor;
}

function getEmployerFactorLabel(factorKey) {
    if (factorKey === 'accreditation') return 'ИТ-аккредитация';
    if (factorKey === 'cover_letter_required') return 'Сопроводительное письмо';
    if (factorKey === 'has_test') return 'Тестовое задание';
    if (factorKey === 'rating_bucket') return 'Рейтинг фирмы';
    return factorKey;
}

function normalizeEmployerValueKey(rawValue) {
    var value = (rawValue || '').trim().toLowerCase();
    if (value === 'true' || value === 'да') return 'true';
    if (value === 'false' || value === 'нет') return 'false';
    if (value === 'unknown' || value === 'нет рейтинга') return 'unknown';
    return value;
}

function getEmployerValueLabel(factorKey, valueKey) {
    if (valueKey === 'true' || valueKey === 'false') return valueKey;
    return valueKey;
}

function getEmployerValueHtml(valueKey) {
    if (valueKey === 'true') return '<span class="bool-check bool-true" aria-label="Да"></span>';
    if (valueKey === 'false') return '<span class="bool-check bool-false" aria-label="Нет"></span>';
    return valueKey;
}

function parseEmployerAnalysisData(block) {
    var parsed = [];
    var rows = Array.from(block.querySelectorAll('.table-container tbody tr'));
    rows.forEach(function(row) {
        if (!row || !row.cells || row.cells.length < 6) return;
        var month = (row.dataset.month || row.cells[0].textContent || '').trim();
        if (!/^\d{4}-\d{2}$/.test(month)) return;
        var factorKey = normalizeEmployerFactor(row.dataset.factor || row.cells[1].textContent);
        var rawValue = (row.dataset.factorValue || row.dataset.rawValue || row.cells[2].dataset.rawValue || row.cells[2].textContent || '').trim();
        var valueKey = normalizeEmployerValueKey(rawValue);
        var groupN = parseInt((row.dataset.groupN || row.cells[3].textContent || '0').replace(/\s/g, ''), 10) || 0;
        var avg = parseFloat((row.dataset.avg || row.cells[4].textContent || '0').replace(/\s/g, '').replace(',', '.')) || 0;
        var median = parseFloat((row.dataset.median || row.cells[5].textContent || '0').replace(/\s/g, '').replace(',', '.')) || 0;
        parsed.push({
            month: month,
            factorKey: factorKey,
            factorLabel: getEmployerFactorLabel(factorKey),
            valueKey: valueKey,
            valueLabel: getEmployerValueLabel(factorKey, valueKey),
            groupN: groupN,
            avg: avg,
            median: median
        });
    });
    return parsed;
}

function weightedMedianByRows(rows) {
    if (!rows || !rows.length) return 0;
    var sorted = rows
        .filter(function(row) { return isFinite(row.median) && row.groupN > 0; })
        .sort(function(a, b) { return a.median - b.median; });
    if (!sorted.length) return 0;
    var total = sorted.reduce(function(sum, row) { return sum + row.groupN; }, 0);
    var threshold = total / 2;
    var acc = 0;
    for (var i = 0; i < sorted.length; i += 1) {
        acc += sorted[i].groupN;
        if (acc >= threshold) return sorted[i].median;
    }
    return sorted[sorted.length - 1].median;
}

function aggregateEmployerAnalysisRows(rows) {
    var buckets = {};
    rows.forEach(function(row) {
        var key = row.factorKey + '||' + row.valueKey;
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(row);
    });
    return Object.keys(buckets).map(function(key) {
        var grouped = buckets[key];
        var head = grouped[0];
        var groupN = grouped.reduce(function(sum, row) { return sum + row.groupN; }, 0);
        var avgNumerator = grouped.reduce(function(sum, row) { return sum + (row.avg * row.groupN); }, 0);
        return {
            month: 'all',
            factorKey: head.factorKey,
            factorLabel: head.factorLabel,
            valueKey: head.valueKey,
            valueLabel: head.valueLabel,
            groupN: groupN,
            avg: groupN ? (avgNumerator / groupN) : 0,
            median: weightedMedianByRows(grouped)
        };
    });
}

function sortEmployerAnalysisData(rows) {
    rows.sort(function(a, b) {
        if (a.month !== b.month) return a.month.localeCompare(b.month);
        var afo = getEmployerFactorOrder(a.factorKey);
        var bfo = getEmployerFactorOrder(b.factorKey);
        if (afo !== bfo) return afo - bfo;
        if (a.factorKey === 'rating_bucket' && b.factorKey === 'rating_bucket') {
            var aro = getEmployerRatingOrder(a.valueKey);
            var bro = getEmployerRatingOrder(b.valueKey);
            if (aro !== bro) return aro - bro;
        }
        return (b.groupN || 0) - (a.groupN || 0);
    });
    return rows;
}

function formatEmployerNumber(value) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    return Number(value).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function renderEmployerAnalysisTable(block, rows, allPeriodLabel) {
    var tbody = block.querySelector('.table-container tbody');
    if (!tbody) return;
    var sortedRows = sortEmployerAnalysisData(rows.slice());
    block.classList.toggle('employer-aggregated-mode', !!allPeriodLabel);
    tbody.innerHTML = sortedRows.map(function(row) {
        var monthLabel = allPeriodLabel ? '' : row.month;
        return '<tr class="employer-analysis-row" ' +
            'data-month="' + row.month + '" ' +
            'data-factor="' + row.factorKey + '" ' +
            'data-factor-label="' + row.factorLabel + '" ' +
            'data-value-key="' + row.valueKey + '" ' +
            'data-value-label="' + row.valueLabel + '" ' +
            'data-group-n="' + row.groupN + '" ' +
            'data-avg="' + (row.avg || 0) + '" ' +
            'data-median="' + (row.median || 0) + '">' +
            '<td>' + monthLabel + '</td>' +
            '<td>' + row.factorLabel + '</td>' +
            '<td class="employer-factor-value-cell">' + getEmployerValueHtml(row.valueKey) + '</td>' +
            '<td>' + row.groupN + '</td>' +
            '<td>' + formatEmployerNumber(row.avg) + '</td>' +
            '<td>' + formatEmployerNumber(row.median) + '</td>' +
            '</tr>';
    }).join('');
    toggleEmployerMonthColumn(block, !allPeriodLabel);
}

function toggleEmployerMonthColumn(block, showColumn) {
    if (!block) return;
    var table = block.querySelector('.table-container table');
    if (!table) return;
    var headCell = table.querySelector('thead tr th:first-child');
    if (headCell) headCell.style.display = showColumn ? '' : 'none';
    var rows = table.querySelectorAll('tbody tr');
    rows.forEach(function(row) {
        if (!row.cells || !row.cells[0]) return;
        row.cells[0].style.display = showColumn ? '' : 'none';
    });
}

function initEmployerAnalysisFilter(block) {
    if (!block) return;
    if (block.dataset.employerInited === '1') {
        applyEmployerAnalysisMonthFilter(block, block.dataset.employerActiveMonth || 'all');
        applyEmployerAnalysisViewMode(block, block.dataset.employerViewMode || 'table');
        return;
    }
    var tableContainer = block.querySelector('.table-container');
    if (!tableContainer) return;
    tableContainer.classList.add('employer-analysis-table-container');
    tableContainer.style.margin = '0 auto';
    tableContainer.style.width = 'auto';

    var analysisView = block.querySelector('.employer-analysis-view');
    if (!analysisView) {
        analysisView = document.createElement('div');
        analysisView.className = 'analysis-flex employer-analysis-view';
        tableContainer.insertAdjacentElement('beforebegin', analysisView);
        analysisView.appendChild(tableContainer);
    }

    var mainWrap = analysisView.querySelector('.employer-analysis-main');
    if (!mainWrap) {
        mainWrap = document.createElement('div');
        mainWrap.className = 'employer-analysis-main';
        analysisView.insertBefore(mainWrap, analysisView.firstChild);
    }
    if (tableContainer.parentElement !== mainWrap) mainWrap.appendChild(tableContainer);

    var viewToggle = block.querySelector('.employer-view-toggle');
    if (!viewToggle) {
        viewToggle = document.createElement('div');
        viewToggle.className = 'employer-view-toggle employer-side-toggle';
        viewToggle.innerHTML = '<button class="view-mode-btn employer-view-btn active" data-view="table" title="Таблица">☷</button>' +
            '<button class="view-mode-btn employer-view-btn" data-view="graph" title="График">📈</button>';
    }

    var graph = block.querySelector('.employer-analysis-graph');
    if (!graph) {
        graph = document.createElement('div');
        graph.className = 'plotly-graph employer-analysis-graph';
        graph.style.display = 'none';
    }
    if (graph.parentElement !== mainWrap) {
        mainWrap.appendChild(graph);
    }

    if (!viewToggle.dataset.bound) {
        viewToggle.addEventListener('click', function(e) {
            var btn = e.target.closest('.employer-view-btn');
            if (!btn) return;
            applyEmployerAnalysisViewMode(block, btn.dataset.view || 'table');
        });
        viewToggle.dataset.bound = '1';
    }

    var parsedRows = parseEmployerAnalysisData(block);
    if (!parsedRows.length) return;
    block.__employerData = parsedRows;
    block.__employerRowsByMonth = parsedRows.reduce(function(acc, row) {
        if (!acc[row.month]) acc[row.month] = [];
        acc[row.month].push(row);
        return acc;
    }, {});
    block.__employerAllRows = aggregateEmployerAnalysisRows(parsedRows);

    var chipsWrap = block.querySelector('.employer-period-chips');
    if (!chipsWrap) {
        chipsWrap = document.createElement('div');
        chipsWrap.className = 'tabs month-tabs employer-period-chips';
        chipsWrap.style.justifyContent = 'center';
        chipsWrap.style.margin = '8px 0';
        block.insertBefore(chipsWrap, analysisView || tableContainer);
    }
    var topBar = block.querySelector('.employer-topbar');
    if (!topBar) {
        topBar = document.createElement('div');
        topBar.className = 'employer-topbar';
        block.insertBefore(topBar, analysisView || tableContainer);
    }
    if (chipsWrap.parentElement !== topBar) topBar.appendChild(chipsWrap);
    if (viewToggle.parentElement !== topBar) topBar.appendChild(viewToggle);

    var months = Array.from(new Set(parsedRows.map(function(row) { return row.month; }).filter(Boolean))).sort();
    months.reverse();
    var allLabel = 'За ' + months.length + ' ' + getMonthWordForm(months.length);
    block.dataset.employerAllLabel = allLabel;

    chipsWrap.innerHTML = '<button type="button" class="tab-button month-button employer-period-chip active" data-month="all">' + allLabel + '</button>' +
        months.map(function(m) {
            return '<button type="button" class="tab-button month-button employer-period-chip" data-month="' + m + '">' + m + '</button>';
        }).join('');

    if (!chipsWrap.dataset.bound) {
        chipsWrap.addEventListener('click', function(e) {
            var chip = e.target.closest('.employer-period-chip');
            if (!chip) return;
            applyEmployerAnalysisMonthFilter(block, chip.dataset.month || 'all');
        });
        chipsWrap.dataset.bound = '1';
    }

    applyEmployerAnalysisMonthFilter(block, 'all');
    applyEmployerAnalysisViewMode(block, block.dataset.employerViewMode || 'table');
    block.dataset.employerInited = '1';
}

function getMonthWordForm(count) {
    var n = Math.abs(count) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return 'месяцев';
    if (n1 > 1 && n1 < 5) return 'месяца';
    if (n1 === 1) return 'месяц';
    return 'месяцев';
}

function openAllRolesPeriodTab(evt, contentId, analysisType) {
    var wrapper = evt.currentTarget.closest('.all-roles-period-wrapper');
    if (!wrapper) return;
    var contents = wrapper.querySelectorAll('.all-roles-period-content');
    contents.forEach(c => c.style.display = 'none');
    var buttons = wrapper.querySelectorAll('.all-roles-period-button');
    buttons.forEach(b => b.classList.remove('active'));
    var target = document.getElementById(contentId);
    if (target) target.style.display = 'block';
    evt.currentTarget.classList.add('active');
    if (uiState.all_roles_periods) {
        uiState.all_roles_periods[analysisType] = evt.currentTarget.dataset.period || null;
    }

    if (analysisType === 'activity' && target) {
        var mode = uiState.activity_view_mode || 'together';
        var viewBtns = target.querySelectorAll('.view-mode-btn');
        setActiveViewButton(viewBtns, mode);
        var viewContainer = target.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        var rows = parseJsonDataset(target, 'entries', []);
        var mainId = target.dataset.graphMain;
        var ageId = target.dataset.graphAge;
        if (mainId && ageId) buildAllRolesActivityChart(rows, mainId, ageId);
        applyActivityModeSizing(viewContainer, mode);
    } else if (analysisType === 'weekday' && target) {
        normalizeWeekdayControls(target.closest('.role-content'));
        var mode = uiState.weekday_view_mode || 'together';
        var viewBtns = target.querySelectorAll('.view-mode-btn');
        setActiveViewButton(viewBtns, mode);
        var viewContainer = target.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        var rows = parseJsonDataset(target, 'entries', []);
        var graphId = target.dataset.graphId;
        if (mode !== 'table' && graphId) buildAllRolesWeekdayChart(rows, graphId);
        applyWeekdayModeSizing(viewContainer, mode);
    } else if (analysisType === 'skills' && target) {
        var mode = uiState.skills_monthly_view_mode === 'together' ? 'table' : uiState.skills_monthly_view_mode;
        var viewBtns = target.querySelectorAll('.view-mode-btn');
        setActiveViewButton(viewBtns, mode);
        var viewContainer = target.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        var rows = parseJsonDataset(target, 'entries', []);
        var graphId = target.dataset.graphId;
        if (mode === 'graph' && graphId) buildAllRolesSkillsChart(rows, graphId);
    } else if (analysisType === 'salary' && target) {
        var mode = uiState.salary_view_mode === 'together' ? 'table' : uiState.salary_view_mode;
        var viewBtns = target.querySelectorAll('.view-mode-btn');
        setActiveViewButton(viewBtns, mode);
        var viewContainer = target.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        var rows = parseJsonDataset(target, 'entries', []);
        var graphId = target.dataset.graphId;
        if (mode === 'graph' && graphId) buildAllRolesSalaryChart(rows, graphId);
    }
}

function restoreAllRolesPeriodState(parentRole, analysisType) {
    var analysisId = analysisType + '-all';
    var wrapper = parentRole.querySelector('.all-roles-period-wrapper[data-analysis="' + analysisId + '"]');
    if (!wrapper) return;
    var buttons = wrapper.querySelectorAll('.all-roles-period-button');
    if (!buttons.length) return;
    var saved = uiState.all_roles_periods ? uiState.all_roles_periods[analysisType] : null;
    if (saved) {
        for (var btn of buttons) {
            if (btn.dataset.period === saved) {
                btn.click();
                return;
            }
        }
    }
    buttons[0].click();
}

// ---------- Анализ активности ----------
function openMonthTab(evt, monthId) {
    var parentRole = evt.currentTarget.closest('.role-content');
    var roleId = parentRole.id;
    var monthDiv = document.getElementById(monthId);
    var monthStr = (monthDiv._data && monthDiv._data.month) ? monthDiv._data.month : monthDiv.dataset.month;

    uiState.global_activity_month = monthStr;
    var stateKey = getStateKey(roleId, 'activity');
    uiState[stateKey] = { month: monthStr };

    var monthContent = parentRole.getElementsByClassName("month-content");
    for (var i = 0; i < monthContent.length; i++) {
        monthContent[i].style.display = "none";
    }
    var monthButtons = parentRole.getElementsByClassName("month-button");
    for (var i = 0; i < monthButtons.length; i++) {
        monthButtons[i].className = monthButtons[i].className.replace(" active", "");
    }
    monthDiv.style.display = "block";
    evt.currentTarget.className += " active";

    // Восстанавливаем режим для этого месяца
    var viewBtns = monthDiv.querySelectorAll('.view-mode-btn');
    setActiveViewButton(viewBtns, uiState.activity_view_mode);
    var container = monthDiv.querySelector('.view-mode-container');
    applyViewMode(container, uiState.activity_view_mode);

    var entries = parseJsonDataset(monthDiv, 'entries', []);
    var graphId = 'activity-graph-' + monthId.replace('month-', '');
    buildActivityBarChart(graphId, entries);
    applyActivityModeSizing(container, uiState.activity_view_mode);
    normalizeActivityControls(parentRole);
}
function restoreActivityState(parentRole, roleId) {
    var monthButtons = parentRole.querySelectorAll('.month-button');
    if (monthButtons.length === 0) return;

    if (uiState.global_activity_month) {
        for (var btn of monthButtons) {
            if (btn.textContent.trim() === uiState.global_activity_month) {
                btn.click();
                return;
            }
        }
    }
    var stateKey = getStateKey(roleId, 'activity');
    var saved = uiState[stateKey];
    if (saved && saved.month) {
        for (var btn of monthButtons) {
            if (btn.textContent.trim() === saved.month) {
                btn.click();
                return;
            }
        }
    }
    monthButtons[0].click();
}
function restoreSkillsMonthlyState(parentRole, roleId) {
    var monthButtons = parentRole.querySelectorAll('.monthly-skills-month-button');
    if (monthButtons.length === 0) return;

    if (uiState.global_skills_month) {
        for (var btn of monthButtons) {
            if (btn.textContent.trim() === uiState.global_skills_month) {
                btn.click();
                return;
            }
        }
    }
    var stateKey = getStateKey(roleId, 'skills-monthly');
    var saved = uiState[stateKey];
    if (saved && saved.month) {
        for (var btn of monthButtons) {
            if (btn.textContent.trim() === saved.month) {
                btn.click();
                return;
            }
        }
    }
    monthButtons[0].click();
}
function openMonthlySkillsMonthTab(evt, monthId) {
    var parentRole = evt.currentTarget.closest('.role-content');
    var roleId = parentRole.id;
    var monthDiv = document.getElementById(monthId);
    var monthData = (monthDiv._data && monthDiv._data.month) ? monthDiv._data.month : parseJsonDataset(monthDiv, 'month', {});
    var monthStr = monthData.month;

    uiState.global_skills_month = monthStr;
    var stateKey = getStateKey(roleId, 'skills-monthly');
    var saved = uiState[stateKey] || {};
    saved.month = monthStr;
    uiState[stateKey] = saved;

    var monthContents = parentRole.getElementsByClassName("monthly-skills-month-content");
    for (var i = 0; i < monthContents.length; i++) {
        monthContents[i].style.display = "none";
    }
    var monthButtons = parentRole.getElementsByClassName("monthly-skills-month-button");
    for (var i = 0; i < monthButtons.length; i++) {
        monthButtons[i].className = monthButtons[i].className.replace(" active", "");
    }
    monthDiv.style.display = "block";
    evt.currentTarget.className += " active";

    restoreExpInMonth(parentRole, roleId);
}
function restoreExpInMonth(parentRole, roleId) {
    var visibleMonth = parentRole.querySelector('.monthly-skills-month-content[style*="display: block"]');
    if (!visibleMonth) return;
    var expButtons = visibleMonth.querySelectorAll('.monthly-skills-exp-button');
    if (expButtons.length === 0) return;

    if (uiState.global_skills_experience) {
        for (var btn of expButtons) {
            if (btn.textContent.trim() === uiState.global_skills_experience) {
                btn.click();
                return;
            }
        }
    }
    var stateKey = getStateKey(roleId, 'skills-monthly');
    var saved = uiState[stateKey];
    if (saved && saved.experience) {
        for (var btn of expButtons) {
            if (btn.textContent.trim() === saved.experience) {
                btn.click();
                return;
            }
        }
    }
    expButtons[0].click();
}
function openMonthlySkillsExpTab(evt, expId) {
    var parentMonth = evt.currentTarget.closest('.monthly-skills-month-content');
    var parentRole = parentMonth.closest('.role-content');
    var roleId = parentRole.id;
    var expDiv = document.getElementById(expId);
    var expData = (expDiv._data && expDiv._data.exp) ? expDiv._data.exp : parseJsonDataset(expDiv, 'exp', {});
    var experience = expData.experience;

    uiState.global_skills_experience = experience;
    var stateKey = getStateKey(roleId, 'skills-monthly');
    var saved = uiState[stateKey] || {};
    saved.experience = experience;
    uiState[stateKey] = saved;

    var expContents = parentMonth.getElementsByClassName("monthly-skills-exp-content");
    for (var i = 0; i < expContents.length; i++) {
        expContents[i].style.display = "none";
    }
    var expButtons = parentMonth.getElementsByClassName("monthly-skills-exp-button");
    for (var i = 0; i < expButtons.length; i++) {
        expButtons[i].className = expButtons[i].className.replace(" active", "");
    }
    expDiv.style.display = "block";
    evt.currentTarget.className += " active";

    // Восстанавливаем режим для навыков
    var viewBtns = expDiv.querySelectorAll('.view-mode-btn');
    setActiveViewButton(viewBtns, uiState.skills_monthly_view_mode);
    var container = expDiv.querySelector('.view-mode-container');
    applyViewMode(container, uiState.skills_monthly_view_mode);

    var graphId = 'skills-monthly-graph-' + expId.replace('ms-exp-', '');
    buildHorizontalBarChart(graphId, expData.skills, expData.experience);
}
function restoreSalaryState(parentRole, roleId) {
    var viewBtns = parentRole.querySelectorAll('.view-mode-btn');
    setActiveViewButton(viewBtns, uiState.salary_view_mode);

    var monthButtons = parentRole.querySelectorAll('.salary-month-button');
    if (monthButtons.length === 0) return;

    if (uiState.global_salary_month) {
        for (var btn of monthButtons) {
            if (btn.textContent.trim() === uiState.global_salary_month) {
                btn.click();
                return;
            }
        }
    }
    var stateKey = getStateKey(roleId, 'salary');
    var saved = uiState[stateKey];
    if (saved && saved.month) {
        for (var btn of monthButtons) {
            if (btn.textContent.trim() === saved.month) {
                btn.click();
                return;
            }
        }
    }
    monthButtons[0].click();
}
function openSalaryMonthTab(evt, monthId) {
    var parentRole = evt.currentTarget.closest('.role-content');
    var roleId = parentRole.id;
    var monthDiv = document.getElementById(monthId);
    var monthData = (monthDiv._data && monthDiv._data.month) ? monthDiv._data.month : parseJsonDataset(monthDiv, 'month', {});
    var monthStr = monthData.month;

    uiState.global_salary_month = monthStr;
    var stateKey = getStateKey(roleId, 'salary');
    var saved = uiState[stateKey] || {};
    saved.month = monthStr;
    uiState[stateKey] = saved;

    var monthContents = parentRole.getElementsByClassName("salary-month-content");
    for (var i = 0; i < monthContents.length; i++) {
        monthContents[i].style.display = "none";
    }
    var monthButtons = parentRole.getElementsByClassName("salary-month-button");
    for (var i = 0; i < monthButtons.length; i++) {
        monthButtons[i].className = monthButtons[i].className.replace(" active", "");
    }
    monthDiv.style.display = "block";
    evt.currentTarget.className += " active";

    restoreExpInSalaryMonth(parentRole, roleId);
}
function restoreExpInSalaryMonth(parentRole, roleId) {
    var visibleMonth = parentRole.querySelector('.salary-month-content[style*="display: block"]');
    if (!visibleMonth) return;
    var expButtons = visibleMonth.querySelectorAll('.salary-exp-button');
    if (expButtons.length === 0) return;

    if (uiState.global_salary_experience) {
        for (var btn of expButtons) {
            if (btn.textContent.trim() === uiState.global_salary_experience) {
                btn.click();
                return;
            }
        }
    }
    var stateKey = getStateKey(roleId, 'salary');
    var saved = uiState[stateKey];
    if (saved && saved.experience) {
        for (var btn of expButtons) {
            if (btn.textContent.trim() === saved.experience) {
                btn.click();
                return;
            }
        }
    }
    expButtons[0].click();
}
function openSalaryExpTab(evt, expId) {
    var parentMonth = evt.currentTarget.closest('.salary-month-content');
    var parentRole = parentMonth.closest('.role-content');
    var roleId = parentRole.id;
    var expDiv = document.getElementById(expId);
    var expData = (expDiv._data && expDiv._data.exp) ? expDiv._data.exp : parseJsonDataset(expDiv, 'exp', {});
    var experience = expData.experience;

    uiState.global_salary_experience = experience;
    var stateKey = getStateKey(roleId, 'salary');
    var saved = uiState[stateKey] || {};
    saved.experience = experience;
    uiState[stateKey] = saved;

    var expContents = parentMonth.getElementsByClassName("salary-exp-content");
    for (var i = 0; i < expContents.length; i++) {
        expContents[i].style.display = "none";
    }
    var expButtons = parentMonth.getElementsByClassName("salary-exp-button");
    for (var i = 0; i < expButtons.length; i++) {
        expButtons[i].className = expButtons[i].className.replace(" active", "");
    }
    expDiv.style.display = "block";
    evt.currentTarget.className += " active";

    applySalaryViewMode(expDiv, expData.entries);
}

// ---------- Общие функции для переключения режимов ----------
function setActiveViewButton(buttons, mode) {
    for (var btn of buttons) {
        if (btn.dataset.view === mode) btn.classList.add('active');
        else btn.classList.remove('active');
    }
}
function applyViewMode(container, mode) {
    if (!container) return;
    var table = container.querySelector('.table-container');
    var graph = container.querySelector('.plotly-graph');
    if (!table || !graph) return;

    if (mode === 'table') {
        table.style.display = 'block';
        graph.style.display = 'none';
    } else if (mode === 'graph') {
        table.style.display = 'none';
        graph.style.display = 'block';
    } else { // together
        table.style.display = 'block';
        graph.style.display = 'block';
    }
    if ((container.dataset.analysis || '') === 'activity') {
        applyActivityModeSizing(container, mode);
    } else if ((container.dataset.analysis || '') === 'weekday') {
        applyWeekdayModeSizing(container, mode);
    }
}

function applyActivityModeSizing(container, mode) {
    var table = container.querySelector('.table-container');
    var graph = container.querySelector('.plotly-graph');
    if (!table || !graph) return;

    container.style.justifyContent = 'center';
    container.style.alignItems = 'stretch';
    container.style.minHeight = '';

    table.style.flex = '';
    table.style.width = '';
    table.style.maxWidth = '';
    table.style.margin = '';
    table.style.height = '';
    table.style.maxHeight = '';
    table.style.overflow = '';

    graph.style.flex = '';
    graph.style.width = '';
    graph.style.maxWidth = '';
    graph.style.margin = '';
    graph.style.height = '';

    if (mode === 'table') {
        container.style.alignItems = 'center';
        table.style.flex = '0 0 50%';
        table.style.width = '50%';
        table.style.maxWidth = '50%';
        table.style.margin = '0 auto';
    } else if (mode === 'graph') {
        container.style.alignItems = 'center';
        graph.style.flex = '0 0 80%';
        graph.style.width = '80%';
        graph.style.maxWidth = '80%';
        graph.style.margin = '0 auto';
        requestAnimationFrame(function() {
            var gh = Math.round(graph.getBoundingClientRect().height || 0);
            if (gh > 0) container.style.minHeight = gh + 'px';
        });
    } else {
        table.style.flex = '0 0 50%';
        table.style.width = '50%';
        table.style.maxWidth = '50%';
        graph.style.flex = '0 0 50%';
        graph.style.width = '50%';
        graph.style.maxWidth = '50%';
        requestAnimationFrame(function() {
            var gh = Math.round(graph.getBoundingClientRect().height || 0);
            if (gh > 0) {
                table.style.height = gh + 'px';
                table.style.maxHeight = gh + 'px';
                table.style.overflow = 'auto';
                container.style.minHeight = gh + 'px';
            }
        });
    }
}

function applyWeekdayModeSizing(container, mode) {
    var table = container.querySelector('.table-container');
    var graph = container.querySelector('.plotly-graph');
    if (!table || !graph) return;

    container.style.justifyContent = 'center';
    container.style.alignItems = 'stretch';
    container.style.height = 'auto';
    container.style.minHeight = '0';
    container.style.overflow = 'visible';

    table.style.flex = '';
    table.style.width = '';
    table.style.maxWidth = '';
    table.style.margin = '';
    table.style.height = '';
    table.style.maxHeight = '';
    table.style.overflow = '';

    graph.style.flex = '';
    graph.style.width = '';
    graph.style.maxWidth = '';
    graph.style.margin = '';
    graph.style.height = '';

    if (mode === 'table') {
        container.style.alignItems = 'center';
        container.style.height = 'auto';
        table.style.flex = '0 0 50%';
        table.style.width = '50%';
        table.style.maxWidth = '50%';
        table.style.margin = '0 auto';
    } else if (mode === 'graph') {
        container.style.alignItems = 'center';
        graph.style.flex = '0 0 80%';
        graph.style.width = '80%';
        graph.style.maxWidth = '80%';
        graph.style.margin = '0 auto';
        syncContainerToGraphHeight(container, graph);
    } else {
        table.style.flex = '0 0 50%';
        table.style.width = '50%';
        table.style.maxWidth = '50%';
        graph.style.flex = '0 0 50%';
        graph.style.width = '50%';
        graph.style.maxWidth = '50%';
        requestAnimationFrame(function() {
            var gh = Math.max(
                Math.round(graph.getBoundingClientRect().height || 0),
                Math.round(graph.scrollHeight || 0)
            );
            if (gh > 0) {
                table.style.height = gh + 'px';
                table.style.maxHeight = gh + 'px';
                table.style.overflow = 'auto';
            }
            syncContainerToGraphHeight(container, graph);
        });
    }
}

function syncContainerToGraphHeight(container, graph) {
    if (!container || !graph) return;
    var apply = function() {
        var gh = Math.max(
            Math.round(graph.getBoundingClientRect().height || 0),
            Math.round(graph.scrollHeight || 0)
        );
        if (gh > 0) {
            container.style.height = gh + 'px';
            container.style.minHeight = gh + 'px';
        }
    };
    requestAnimationFrame(apply);
    setTimeout(apply, 120);
}
function applySalaryViewMode(expDiv, entries) {
    var mode = uiState.salary_view_mode;
    var mainContent = expDiv.querySelector('.salary-main-content');
    var tableContainer = expDiv.querySelector('.salary-table-container');
    var graphContainer = expDiv.querySelector('.salary-graph-container');
    var graphId = expDiv.querySelector('.plotly-graph').id;

    // Сброс стилей
    mainContent.style.display = 'flex';
    mainContent.style.flexDirection = 'row';
    mainContent.style.flexWrap = 'wrap';
    tableContainer.style.display = 'block';
    graphContainer.style.display = 'block';
    tableContainer.style.width = '';
    graphContainer.style.width = '';

    if (mode === 'table') {
        graphContainer.style.display = 'none';
        tableContainer.style.width = '100%';
    } else if (mode === 'graph') {
        tableContainer.style.display = 'none';
        graphContainer.style.width = '100%';
        buildSalaryBarChart(graphId, entries);
    } else { // together
        var availableWidth = mainContent.offsetWidth;
        var tableWidth = tableContainer.offsetWidth;
        var graphWidth = graphContainer.offsetWidth;
        if (tableWidth + graphWidth > availableWidth) {
            mainContent.style.flexDirection = 'column';
            tableContainer.style.width = '100%';
            graphContainer.style.width = '100%';
        } else {
            mainContent.style.flexDirection = 'row';
            tableContainer.style.width = '50%';
            graphContainer.style.width = '50%';
        }
        buildSalaryBarChart(graphId, entries);
    }
}
