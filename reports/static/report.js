// Цветовая палитра графиков (исходная)
const CHART_COLORS = {
    light: '#B0BEC5',   // светло-серый для активных, публикаций, открытых
    medium: '#90A4AE',  // средне-серый для навыков
    dark: '#607D8B'     // тёмно-серый для архивных, архиваций
};

// Состояние интерфейса
let uiState = {
    global_analysis_type: null,
    global_activity_month: null,
    global_skills_month: null,
    global_skills_experience: null,
    global_salary_month: null,
    global_salary_experience: null,
    // Режимы отображения для разных типов анализа
    activity_view_mode: 'together',    // по умолчанию вместе
    weekday_view_mode: 'together',
    skills_monthly_view_mode: 'together',
    salary_view_mode: 'table'           // по умолчанию таблица
};

function getStateKey(roleId, analysisType) {
    return roleId + '_' + analysisType;
}

// ---------- Переключение ролей ----------
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

    if (uiState.global_analysis_type) {
        var targetId = uiState.global_analysis_type + '-' + roleId.split('-')[1];
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

    var analysisType;
    if (analysisId.includes('activity')) analysisType = 'activity';
    else if (analysisId.includes('weekday')) analysisType = 'weekday';
    else if (analysisId.includes('skills-monthly')) analysisType = 'skills-monthly';
    else if (analysisId.includes('salary')) analysisType = 'salary';

    uiState.global_analysis_type = analysisType;

    activityBlocks.forEach(block => block.style.display = 'none');
    if (weekdayBlock) weekdayBlock.style.display = 'none';
    if (skillsMonthlyBlock) skillsMonthlyBlock.style.display = 'none';
    if (salaryBlock) salaryBlock.style.display = 'none';

    if (analysisType === 'activity') {
        activityBlocks.forEach(block => block.style.display = 'block');
        restoreActivityState(parentRole, roleId);
    } else if (analysisType === 'weekday') {
        weekdayBlock.style.display = 'block';
        var viewBtns = weekdayBlock.querySelectorAll('.view-mode-btn');
        setActiveViewButton(viewBtns, uiState.weekday_view_mode);
        applyViewMode(weekdayBlock.querySelector('.view-mode-container'), uiState.weekday_view_mode);
        buildWeekdayBarChart(analysisId.split('-')[1], weekdayBlock);
    } else if (analysisType === 'skills-monthly') {
        skillsMonthlyBlock.style.display = 'block';
        restoreSkillsMonthlyState(parentRole, roleId);
    } else if (analysisType === 'salary') {
        salaryBlock.style.display = 'block';
        restoreSalaryState(parentRole, roleId);
    }
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

function buildActivityBarChart(graphId, entries) {
    var filteredEntries = entries.filter(e => e.experience !== 'Всего');
    var experiences = filteredEntries.map(e => e.experience);
    var activeData = filteredEntries.map(e => e.active);
    var archivedData = filteredEntries.map(e => e.archived);

    var traceActive = {
        x: experiences,
        y: activeData,
        name: 'Активные',
        type: 'bar',
        marker: { color: CHART_COLORS.light }
    };
    var traceArchived = {
        x: experiences,
        y: archivedData,
        name: 'Архивные',
        type: 'bar',
        marker: { color: CHART_COLORS.dark }
    };

    var layout = {
        barmode: 'group',
        title: 'Количество вакансий по опыту',
        margin: { t: 50, b: 80, l: 50, r: 120 },
        height: 340,
        legend: { x: 1, y: 1, xanchor: 'left' }
    };
    Plotly.newPlot(graphId, [traceActive, traceArchived], layout);
}

// ---------- Анализ по дням недели ----------
function buildWeekdayBarChart(roleId, weekdayBlock) {
    var weekdaysData = parseJsonDataset(weekdayBlock, 'weekdays', []);
    if (!weekdaysData || weekdaysData.length === 0) return;

    var days = weekdaysData.map(d => d.weekday);
    var pubs = weekdaysData.map(d => d.publications);
    var archs = weekdaysData.map(d => d.archives);

    var tracePubs = {
        x: days,
        y: pubs,
        name: 'Публикации',
        type: 'bar',
        marker: { color: CHART_COLORS.light }
    };
    var traceArchs = {
        x: days,
        y: archs,
        name: 'Архивации',
        type: 'bar',
        marker: { color: CHART_COLORS.dark }
    };

    var layout = {
        barmode: 'group',
        title: 'Распределение по дням недели',
        margin: { t: 50, b: 80, l: 50, r: 120 },
        height: 400,
        legend: { x: 1, y: 1, xanchor: 'left' }
    };
    Plotly.newPlot('weekday-graph-' + roleId, [tracePubs, traceArchs], layout);
}

// ---------- Навыки по месяцам ----------
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

function buildHorizontalBarChart(graphId, skills, experience, barColor = CHART_COLORS.medium) {
    var skillNames = skills.map(s => s.skill).reverse();
    var counts = skills.map(s => s.count).reverse();
    var coverages = skills.map(s => s.coverage).reverse();
    var text = skills.map(s => s.count + ' (' + s.coverage + '%)').reverse();

    var trace = {
        x: counts,
        y: skillNames,
        name: 'Упоминания',
        type: 'bar',
        orientation: 'h',
        marker: { color: barColor },
        text: text,
        textposition: 'outside',
        hoverinfo: 'x+text'
    };

    var layout = {
        title: 'Топ-15 навыков · ' + experience,
        xaxis: { title: 'Количество упоминаний' },
        margin: { l: 200, r: 50, t: 50, b: 50 },
        height: 400,
        bargap: 0.15,
        legend: { x: 1, y: 1, xanchor: 'left' }
    };
    Plotly.newPlot(graphId, [trace], layout);
}

// ---------- Анализ зарплат ----------
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
    var monthData = JSON.parse(monthDiv.dataset.month);
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

function buildSalaryBarChart(graphId, entries) {
    var container = document.getElementById(graphId);
    if (!container) return;

    var currencies = ['RUR', 'USD', '%USD'];
    container.innerHTML = '<div class="salary-graphs-3">' +
        currencies.map(c => '<div class="salary-graph-item"><div class="plotly-graph" id="' + graphId + '-' + c.replace('%', 'p') + '"></div></div>').join('') +
    '</div>';

    var statuses = ['Открытая', 'Архивная'];
    for (var curr of currencies) {
        var graphElId = graphId + '-' + curr.replace('%', 'p');
        var y = [];
        for (var status of statuses) {
            var entry = entries.find(e => e.currency === curr && e.status === status);
            y.push(entry ? entry.avg_salary : 0);
        }

        var data = [{
            x: statuses,
            y: y,
            name: curr,
            type: 'bar',
            marker: { color: [CHART_COLORS.light, CHART_COLORS.dark] }
        }];

        var layout = {
            title: 'Средняя зарплата · ' + curr,
            xaxis: { title: 'Статус' },
            yaxis: { title: 'Средняя зарплата' },
            margin: { t: 40, b: 50, l: 50, r: 20 },
            height: 300,
            showlegend: false
        };
        Plotly.newPlot(graphElId, data, layout);
    }
}

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

function buildVacancyTableHtml(vacancies) {
    if (!vacancies || vacancies.length === 0) {
        return '<div class="vacancy-empty">Нет вакансий</div>';
    }

    var rows = vacancies.map(v => {
        var linkUrl = v.id ? 'https://surgut.hh.ru/vacancy/' + encodeURIComponent(v.id) : '';
        var idCell = linkUrl
            ? '<a href="' + escapeHtml(linkUrl) + '" target="_blank" rel="noopener">' + formatCell(v.id) + '</a>'
            : formatCell(v.id);
        var replyCell = v.apply_alternate_url
            ? '<a href="' + escapeHtml(v.apply_alternate_url) + '" target="_blank" rel="noopener">отклик</a>'
            : '—';
        return '<tr>' +
            '<td>' + idCell + '</td>' +
            '<td>' + formatCell(v.name) + '</td>' +
            '<td>' + formatCell(v.employer) + '</td>' +
            '<td>' + formatCell(v.city) + '</td>' +
            '<td>' + formatCell(v.salary_from) + '</td>' +
            '<td>' + formatCell(v.salary_to) + '</td>' +
            '<td>' + formatCell(v.skills) + '</td>' +
            '<td>' + formatCell(v.requirement) + '</td>' +
            '<td>' + formatCell(v.responsibility) + '</td>' +
            '<td>' + replyCell + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="vacancy-table-wrap">' +
        '<table class="vacancy-table">' +
            '<thead>' +
                '<tr>' +
                    '<th>ID</th>' +
                    '<th>Название</th>' +
                    '<th>Работодатель</th>' +
                    '<th>Город</th>' +
                    '<th>ЗП от</th>' +
                    '<th>ЗП до</th>' +
                    '<th>Навыки</th>' +
                    '<th>Требования</th>' +
                    '<th>Обязанности</th>' +
                    '<th>Отклик</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' + rows + '</tbody>' +
        '</table>' +
    '</div>';
}

function renderVacancyDetails(container, withList, withoutList) {
    var withCount = (withList || []).length;
    var withoutCount = (withoutList || []).length;
    var defaultTab = withCount > 0 ? 'with' : 'without';

    container.dataset.with = JSON.stringify(withList || []);
    container.dataset.without = JSON.stringify(withoutList || []);

    var filterHtml = '<div class="vacancy-filter">' +
        '<button class="vacancy-filter-btn' + (defaultTab === 'with' ? ' active' : '') + '" data-filter="with">' +
            'С з/п (' + withCount + ')' +
        '</button>' +
        '<button class="vacancy-filter-btn' + (defaultTab === 'without' ? ' active' : '') + '" data-filter="without">' +
            'Без з/п (' + withoutCount + ')' +
        '</button>' +
    '</div>';

    var initialList = defaultTab === 'with' ? withList : withoutList;
    container.innerHTML = filterHtml + buildVacancyTableHtml(initialList);
}

function getExperienceOrder() {
    return {
        'Нет опыта': 1,
        'От 1 года до 3 лет': 2,
        'От 3 до 6 лет': 3,
        'Более 6 лет': 4
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
        return fallback;
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

function computePublicationPeriod(vacancies) {
    var min = null;
    var max = null;
    (vacancies || []).forEach(v => {
        if (!v || !v.published_at) return;
        var d = new Date(v.published_at);
        if (isNaN(d)) return;
        if (!min || d < min) min = d;
        if (!max || d > max) max = d;
    });
    if (!min || !max) return null;
    var fmt = (dt) => {
        var d = String(dt.getDate()).padStart(2, '0');
        var m = String(dt.getMonth() + 1).padStart(2, '0');
        var y = dt.getFullYear();
        return d + '.' + m + '.' + y;
    };
    return fmt(min) + ' - ' + fmt(max);
}

function collectVacanciesFromSalaryMonths(salaryMonths) {
    var all = [];
    (salaryMonths || []).forEach(m => {
        if (!m.experiences) return;
        m.experiences.forEach(exp => {
            (exp.entries || []).forEach(entry => {
                all = all.concat(entry.vacancies_with_salary_list || []);
                all = all.concat(entry.vacancies_without_salary_list || []);
            });
        });
    });
    return all;
}

function getRoleContentByIndex(idx) {
    return document.getElementById('role-' + idx);
}

function getRoleSalaryData(roleContent) {
    var salaryBlock = roleContent.querySelector('.salary-content');
    if (!salaryBlock) return [];
    return parseJsonDataset(salaryBlock, 'salary', []);
}

function getRoleWeekdayData(roleContent) {
    var weekdayBlock = roleContent.querySelector('.weekday-content');
    if (!weekdayBlock) return [];
    return parseJsonDataset(weekdayBlock, 'weekdays', []);
}

function getRoleSkillsMonthlyData(roleContent) {
    var block = roleContent.querySelector('.skills-monthly-content');
    if (!block) return [];
    return parseJsonDataset(block, 'skillsMonthly', []);
}

function getRoleActivityMonths(roleContent) {
    var monthBlocks = roleContent.querySelectorAll('.month-content');
    var months = [];
    monthBlocks.forEach(block => {
        var month = block.dataset.month;
        var entries = parseJsonDataset(block, 'entries', []);
        months.push({ month: month, entries: entries });
    });
    return months;
}

function aggregateActivity(roleContents) {
    var expOrder = getExperienceOrder();
    var byMonth = {};
    roleContents.forEach(roleContent => {
        var months = getRoleActivityMonths(roleContent);
        months.forEach(m => {
            if (isSummaryMonth(m.month)) return;
            byMonth[m.month] = byMonth[m.month] || {};
            m.entries.forEach(e => {
                if (e.experience === 'Всего') return;
                var bucket = byMonth[m.month][e.experience] || { total: 0, archived: 0, active: 0, ageSum: 0 };
                bucket.total += e.total || 0;
                bucket.archived += e.archived || 0;
                bucket.active += e.active || 0;
                bucket.ageSum += (e.avg_age || 0) * (e.total || 0);
                byMonth[m.month][e.experience] = bucket;
            });
        });
    });

    var monthsList = Object.keys(byMonth).sort().map(month => {
        var entries = [];
        var maxArchived = 0;
        var maxAge = 0;
        Object.keys(byMonth[month]).forEach(exp => {
            var vals = byMonth[month][exp];
            var avgAge = vals.total ? (vals.ageSum / vals.total) : 0;
            maxArchived = Math.max(maxArchived, vals.archived);
            maxAge = Math.max(maxAge, avgAge);
            entries.push({
                experience: exp,
                total: vals.total,
                archived: vals.archived,
                active: vals.active,
                avg_age: avgAge
            });
        });
        entries.sort((a, b) => (expOrder[a.experience] || 99) - (expOrder[b.experience] || 99));
        entries.forEach(e => {
            e.is_max_archived = e.archived === maxArchived;
            e.is_max_age = e.avg_age === maxAge;
        });
        var totalEntry = {
            experience: 'Всего',
            total: entries.reduce((s, e) => s + e.total, 0),
            archived: entries.reduce((s, e) => s + e.archived, 0),
            active: entries.reduce((s, e) => s + e.active, 0),
            avg_age: entries.reduce((s, e) => s + e.avg_age, 0) / (entries.length || 1),
            is_max_archived: false,
            is_max_age: false
        };
        entries.push(totalEntry);
        return { month: month, entries: entries };
    });

    var numMonths = monthsList.length;
    if (numMonths > 0) {
        var agg = {};
        monthsList.forEach(m => {
            m.entries.forEach(e => {
                if (e.experience === 'Всего') return;
                var bucket = agg[e.experience] || { total: 0, archived: 0, active: 0, ageSum: 0 };
                bucket.total += e.total;
                bucket.archived += e.archived;
                bucket.active += e.active;
                bucket.ageSum += (e.avg_age || 0) * (e.total || 0);
                agg[e.experience] = bucket;
            });
        });
        var summaryEntries = Object.keys(agg).map(exp => {
            var vals = agg[exp];
            return {
                experience: exp,
                total: vals.total,
                archived: vals.archived,
                active: vals.active,
                avg_age: vals.total ? (vals.ageSum / vals.total) : 0
            };
        });
        summaryEntries.sort((a, b) => (expOrder[a.experience] || 99) - (expOrder[b.experience] || 99));
        summaryEntries.push({
            experience: 'Всего',
            total: summaryEntries.reduce((s, e) => s + e.total, 0),
            archived: summaryEntries.reduce((s, e) => s + e.archived, 0),
            active: summaryEntries.reduce((s, e) => s + e.active, 0),
            avg_age: summaryEntries.reduce((s, e) => s + e.avg_age, 0) / (summaryEntries.length || 1),
            is_max_archived: false,
            is_max_age: false
        });
        monthsList.unshift({ month: formatMonthTitle(numMonths), entries: summaryEntries });
    }

    return monthsList;
}

function aggregateWeekdays(roleContents) {
    var weekdaysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var map = {};
    roleContents.forEach(roleContent => {
        var days = getRoleWeekdayData(roleContent);
        days.forEach(d => {
            var key = d.weekday;
            map[key] = map[key] || { weekday: key, publications: 0, archives: 0, pubHourSum: 0, pubHourCount: 0, archHourSum: 0, archHourCount: 0 };
            map[key].publications += d.publications || 0;
            map[key].archives += d.archives || 0;
            var pubHour = parseInt((d.avg_pub_hour || '').split(':')[0], 10);
            if (!isNaN(pubHour)) {
                map[key].pubHourSum += pubHour * (d.publications || 0);
                map[key].pubHourCount += (d.publications || 0);
            }
            var archHour = parseInt((d.avg_arch_hour || '').split(':')[0], 10);
            if (!isNaN(archHour)) {
                map[key].archHourSum += archHour * (d.archives || 0);
                map[key].archHourCount += (d.archives || 0);
            }
        });
    });
    var list = Object.values(map);
    list.forEach(d => {
        var pubAvg = d.pubHourCount ? Math.round(d.pubHourSum / d.pubHourCount) : 0;
        var archAvg = d.archHourCount ? Math.round(d.archHourSum / d.archHourCount) : 0;
        d.avg_pub_hour = d.pubHourCount ? (pubAvg + ':00') : '—';
        d.avg_arch_hour = d.archHourCount ? (archAvg + ':00') : '—';
        delete d.pubHourSum;
        delete d.pubHourCount;
        delete d.archHourSum;
        delete d.archHourCount;
    });
    list.sort((a, b) => weekdaysOrder.indexOf(a.weekday) - weekdaysOrder.indexOf(b.weekday));
    return list;
}

function aggregateSkillsMonthly(roleContents) {
    var expOrder = getExperienceOrder();
    var byMonth = {};
    roleContents.forEach(roleContent => {
        var months = getRoleSkillsMonthlyData(roleContent);
        months.forEach(m => {
            if (isSummaryMonth(m.month)) return;
            byMonth[m.month] = byMonth[m.month] || {};
            (m.experiences || []).forEach(exp => {
                var bucket = byMonth[m.month][exp.experience] || { total: 0, skills: new Map() };
                bucket.total += exp.total_vacancies || 0;
                (exp.skills || []).forEach(s => {
                    bucket.skills.set(s.skill, (bucket.skills.get(s.skill) || 0) + (s.count || 0));
                });
                byMonth[m.month][exp.experience] = bucket;
            });
        });
    });

    function buildExpList(expMap) {
        var expList = Object.keys(expMap).map(expName => {
            var bucket = expMap[expName];
            var skills = Array.from(bucket.skills.entries()).map(([skill, count]) => {
                return {
                    skill: skill,
                    count: count,
                    coverage: bucket.total ? Math.round((count * 10000) / bucket.total) / 100 : 0,
                    rank: 0
                };
            });
            skills.sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
            skills = skills.slice(0, 15);
            return { experience: expName, total_vacancies: bucket.total, skills: skills };
        });
        expList.sort((a, b) => (expOrder[a.experience] || 99) - (expOrder[b.experience] || 99));
        return expList;
    }

    var monthsList = Object.keys(byMonth).sort().map(month => {
        return { month: month, experiences: buildExpList(byMonth[month]) };
    });

    if (monthsList.length > 0) {
        var agg = {};
        monthsList.forEach(m => {
            m.experiences.forEach(exp => {
                var bucket = agg[exp.experience] || { total: 0, skills: new Map() };
                bucket.total += exp.total_vacancies || 0;
                exp.skills.forEach(s => {
                    bucket.skills.set(s.skill, (bucket.skills.get(s.skill) || 0) + (s.count || 0));
                });
                agg[exp.experience] = bucket;
            });
        });
        monthsList.unshift({ month: formatMonthTitle(monthsList.length), experiences: buildExpList(agg) });
    }

    return monthsList;
}

function computeSalaryValue(v, currency) {
    if (currency === '%USD') {
        if (v.converted_salary !== null && v.converted_salary !== undefined) return Number(v.converted_salary);
    }
    if (v.calculated_salary !== null && v.calculated_salary !== undefined) return Number(v.calculated_salary);
    if (v.salary_from !== null && v.salary_to !== null) return (Number(v.salary_from) + Number(v.salary_to)) / 2;
    if (v.salary_from !== null) return Number(v.salary_from);
    if (v.salary_to !== null) return Number(v.salary_to);
    return null;
}

function buildTopSkills(vacancies) {
    var counts = new Map();
    vacancies.forEach(v => {
        if (!v.skills) return;
        String(v.skills).split(',').map(s => s.trim()).filter(Boolean).forEach(skill => {
            counts.set(skill, (counts.get(skill) || 0) + 1);
        });
    });
    if (counts.size === 0) return 'Нет данных о навыках';
    var sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return sorted.slice(0, 10).map(([skill, count]) => skill + ' (' + count + ')').join(', ');
}

function buildSalaryEntriesFromBuckets(bucketsByKey) {
    var entries = Object.values(bucketsByKey).map(b => {
        var values = [];
        b.with.forEach(v => {
            var val = computeSalaryValue(v, b.currency);
            if (val !== null && !isNaN(val)) values.push(val);
        });
        var total = b.with.length + b.without.length;
        var avg = values.length ? values.reduce((s, x) => s + x, 0) / values.length : 0;
        var min = values.length ? Math.min(...values) : 0;
        var max = values.length ? Math.max(...values) : 0;
        var median = values.length ? computeMedian(values) : 0;
        var mode = values.length ? computeMode(values) : 0;
        return {
            status: b.status,
            currency: b.currency,
            total_vacancies: total,
            vacancies_with_salary: b.with.length,
            salary_percentage: total ? Math.round((b.with.length * 10000) / total) / 100 : 0,
            avg_salary: avg,
            median_salary: median,
            mode_salary: mode,
            min_salary: min,
            max_salary: max,
            top_skills: buildTopSkills(b.with),
            vacancy_ids: [],
            vacancies_with_salary_list: b.with,
            vacancies_without_salary_list: b.without
        };
    });
    entries.sort((a, b) => (a.status !== 'Открытая') - (b.status !== 'Открытая') || a.status.localeCompare(b.status));
    return entries;
}

function aggregateSalary(roleContents) {
    var expOrder = getExperienceOrder();
    var byMonth = {};
    var allMonths = new Set();
    roleContents.forEach(roleContent => {
        var months = getRoleSalaryData(roleContent);
        months.forEach(m => {
            if (isSummaryMonth(m.month)) return;
            allMonths.add(m.month);
            byMonth[m.month] = byMonth[m.month] || {};
            (m.experiences || []).forEach(exp => {
                byMonth[m.month][exp.experience] = byMonth[m.month][exp.experience] || {};
                (exp.entries || []).forEach(entry => {
                    var key = entry.status + '|' + entry.currency;
                    var bucket = byMonth[m.month][exp.experience][key] || {
                        status: entry.status,
                        currency: entry.currency,
                        with: [],
                        without: []
                    };
                    bucket.with = bucket.with.concat(entry.vacancies_with_salary_list || []);
                    bucket.without = bucket.without.concat(entry.vacancies_without_salary_list || []);
                    byMonth[m.month][exp.experience][key] = bucket;
                });
            });
        });
    });

    function buildEntryList(bucketsByKey) {
        return buildSalaryEntriesFromBuckets(bucketsByKey);
    }

    var monthsList = Array.from(allMonths).sort().map(month => {
        var expMap = byMonth[month] || {};
        var experiences = Object.keys(expMap).map(expName => {
            return { experience: expName, entries: buildEntryList(expMap[expName]) };
        });
        experiences.sort((a, b) => (expOrder[a.experience] || 99) - (expOrder[b.experience] || 99));
        return { month: month, experiences: experiences };
    });

    if (monthsList.length > 0) {
        var agg = {};
        monthsList.forEach(m => {
            m.experiences.forEach(exp => {
                agg[exp.experience] = agg[exp.experience] || {};
                exp.entries.forEach(entry => {
                    var key = entry.status + '|' + entry.currency;
                    var bucket = agg[exp.experience][key] || { status: entry.status, currency: entry.currency, with: [], without: [] };
                    bucket.with = bucket.with.concat(entry.vacancies_with_salary_list || []);
                    bucket.without = bucket.without.concat(entry.vacancies_without_salary_list || []);
                    agg[exp.experience][key] = bucket;
                });
            });
        });
        var expList = Object.keys(agg).map(expName => {
            return { experience: expName, entries: buildEntryList(agg[expName]) };
        });
        expList.sort((a, b) => (expOrder[a.experience] || 99) - (expOrder[b.experience] || 99));
        monthsList.unshift({ month: formatMonthTitle(monthsList.length), experiences: expList });
    }

    return monthsList;
}

function buildSkillsSummaryExp(monthData) {
    var agg = { total: 0, skills: new Map() };
    (monthData.experiences || []).forEach(exp => {
        agg.total += exp.total_vacancies || 0;
        (exp.skills || []).forEach(s => {
            agg.skills.set(s.skill, (agg.skills.get(s.skill) || 0) + (s.count || 0));
        });
    });
    var skills = Array.from(agg.skills.entries()).map(([skill, count]) => {
        return {
            skill: skill,
            count: count,
            coverage: agg.total ? Math.round((count * 10000) / agg.total) / 100 : 0,
            rank: 0
        };
    });
    skills.sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
    skills = skills.slice(0, 15);
    return {
        experience: 'Суммарно',
        total_vacancies: agg.total,
        skills: skills
    };
}

function buildSalarySummaryExp(monthData) {
    var buckets = {};
    (monthData.experiences || []).forEach(exp => {
        (exp.entries || []).forEach(entry => {
            var key = entry.status + '|' + entry.currency;
            var bucket = buckets[key] || { status: entry.status, currency: entry.currency, with: [], without: [] };
            bucket.with = bucket.with.concat(entry.vacancies_with_salary_list || []);
            bucket.without = bucket.without.concat(entry.vacancies_without_salary_list || []);
            buckets[key] = bucket;
        });
    });
    return {
        experience: 'Суммарно',
        entries: buildSalaryEntriesFromBuckets(buckets)
    };
}

function addSummaryTabs(root) {
    var skillsMonths = root.querySelectorAll('.monthly-skills-month-content');
    skillsMonths.forEach(monthDiv => {
        if (monthDiv.querySelector('.monthly-skills-exp-button[data-summary="1"]')) return;
        var monthData = (monthDiv._data && monthDiv._data.month) ? monthDiv._data.month : parseJsonDataset(monthDiv, 'month', {});
        if (!monthData || !monthData.experiences) return;
        var expTabs = monthDiv.querySelector('.monthly-skills-exp-tabs');
        if (!expTabs) return;
        var expIndex = (monthData.experiences.length || 0) + 1;
        var expId = monthDiv.id.replace('ms-month-', 'ms-exp-') + '-' + expIndex;
        var btn = document.createElement('button');
        btn.className = 'tab-button monthly-skills-exp-button';
        btn.dataset.summary = '1';
        btn.textContent = 'Суммарно';
        btn.setAttribute('onclick', "openMonthlySkillsExpTab(event, '" + expId + "')");
        expTabs.appendChild(btn);

        var expDiv = document.createElement('div');
        expDiv.id = expId;
        expDiv.className = 'monthly-skills-exp-content';
        expDiv.style.display = 'none';
        var summaryExp = buildSkillsSummaryExp(monthData);
        expDiv.dataset.exp = JSON.stringify(summaryExp);
        expDiv._data = { exp: summaryExp };
        expDiv.innerHTML =
            '<div class="view-toggle-horizontal">' +
                '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">⊕</button>' +
                '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">☷</button>' +
                '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                '<div class="table-container">' +
                    '<table>' +
                        '<thead><tr><th>Навык</th><th>Упоминаний</th><th>% покрытия</th></tr></thead>' +
                        '<tbody>' +
                            summaryExp.skills.map(s => (
                                '<tr><td>' + s.skill + '</td><td>' + s.count + '</td><td>' + s.coverage + '%</td></tr>'
                            )).join('') +
                        '</tbody>' +
                    '</table>' +
                    '<p style="margin-top: 10px; color: var(--text-secondary);">Всего вакансий с навыками: ' + summaryExp.total_vacancies + '</p>' +
                '</div>' +
                '<div class="plotly-graph" id="skills-monthly-graph-' + expId.replace('ms-exp-', '') + '"></div>' +
            '</div>';
        monthDiv.appendChild(expDiv);
    });

    var salaryMonths = root.querySelectorAll('.salary-month-content');
    salaryMonths.forEach(monthDiv => {
        if (monthDiv.querySelector('.salary-exp-button[data-summary="1"]')) return;
        var monthData = (monthDiv._data && monthDiv._data.month) ? monthDiv._data.month : parseJsonDataset(monthDiv, 'month', {});
        if (!monthData || !monthData.experiences) return;
        var expTabs = monthDiv.querySelector('.salary-exp-tabs');
        if (!expTabs) return;
        var expIndex = (monthData.experiences.length || 0) + 1;
        var expId = monthDiv.id.replace('sal-month-', 'sal-exp-') + '-' + expIndex;
        var btn = document.createElement('button');
        btn.className = 'tab-button salary-exp-button';
        btn.dataset.summary = '1';
        btn.textContent = 'Суммарно';
        btn.setAttribute('onclick', "openSalaryExpTab(event, '" + expId + "')");
        expTabs.appendChild(btn);

        var expDiv = document.createElement('div');
        expDiv.id = expId;
        expDiv.className = 'salary-exp-content';
        expDiv.style.display = 'none';
        var summaryExp = buildSalarySummaryExp(monthData);
        expDiv.dataset.exp = JSON.stringify(summaryExp);
        expDiv._data = { exp: summaryExp };
        expDiv.innerHTML =
            '<div class="salary-display-flex" data-exp-index="' + expIndex + '">' +
                '<div class="salary-main-content">' +
                    '<div class="salary-table-container">' +
                        '<div style="overflow-x: auto;">' +
                            '<table>' +
                                '<thead><tr><th>Статус</th><th>Валюта</th><th>Всего</th><th>С з/п</th><th>% с з/п</th><th>Средняя</th><th>Медианная</th><th>Модальная</th><th>Мин</th><th>Макс</th><th>Топ-10 навыков</th></tr></thead>' +
                                '<tbody>' +
                                    summaryExp.entries.map(entry => (
                                        '<tr class="salary-row" data-vacancies-with="" data-vacancies-without="">' +
                                            '<td>' + entry.status + '</td>' +
                                            '<td>' + entry.currency + '</td>' +
                                            '<td>' + entry.total_vacancies + '</td>' +
                                            '<td>' + entry.vacancies_with_salary + '</td>' +
                                            '<td>' + entry.salary_percentage + '%</td>' +
                                            '<td>' + Math.round(entry.avg_salary) + '</td>' +
                                            '<td>' + (entry.median_salary ? Math.round(entry.median_salary) : '—') + '</td>' +
                                            '<td>' + (entry.mode_salary ? Math.round(entry.mode_salary) : '—') + '</td>' +
                                            '<td>' + Math.round(entry.min_salary) + '</td>' +
                                            '<td>' + Math.round(entry.max_salary) + '</td>' +
                                            '<td>' + entry.top_skills + '</td>' +
                                        '</tr>'
                                    )).join('') +
                                '</tbody>' +
                            '</table>' +
                        '</div>' +
                    '</div>' +
                    '<div class="salary-graph-container">' +
                        '<div class="plotly-graph" id="salary-graph-' + expId.replace('sal-exp-', '') + '"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="salary-view-toggle">' +
                    '<button class="view-mode-btn active" data-view="table" title="Таблица">☷</button>' +
                    '<button class="view-mode-btn" data-view="graph" title="График">📊</button>' +
                '</div>' +
            '</div>';
        monthDiv.appendChild(expDiv);

        var rows = expDiv.querySelectorAll('.salary-row');
        rows.forEach((row, k) => {
            var entry = (summaryExp.entries || [])[k] || {};
            row._data = {
                withList: entry.vacancies_with_salary_list || [],
                withoutList: entry.vacancies_without_salary_list || []
            };
        });
    });
}

function renderCombinedContainer(container, roleContents) {
    var activityMonths = aggregateActivity(roleContents);
    var weekdays = aggregateWeekdays(roleContents);
    var skillsMonthly = aggregateSkillsMonthly(roleContents);
    var salaryMonths = aggregateSalary(roleContents);

    var ids = roleContents.map(rc => rc.dataset.roleId).filter(Boolean);
    var allVacancies = collectVacanciesFromSalaryMonths(salaryMonths);
    var period = computePublicationPeriod(allVacancies) || '—';
    var roleTitle = '[ID: ' + ids.join(', ') + '] период сбора вакансий ' + period;

    var activityTabs = activityMonths.map((m, i) => (
        '<button class="tab-button month-button" onclick="openMonthTab(event, \'month-combined-' + (i + 1) + '\')">' + m.month + '</button>'
    )).join('');

    var activityBlocks = activityMonths.map((m, i) => (
        '<div id="month-combined-' + (i + 1) + '" class="month-content activity-only" data-entries="" data-month="' + m.month + '">' +
            '<div class="view-toggle-horizontal">' +
                '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">⊕</button>' +
                '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">☷</button>' +
                '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="activity">' +
                '<div class="table-container">' +
                    '<table>' +
                        '<thead><tr><th>Опыт</th><th>Всего</th><th>Архивных</th><th>Активных</th><th>Ср. возраст (дни)</th></tr></thead>' +
                        '<tbody>' +
                            m.entries.map(e => (
                                '<tr' + (e.is_max_archived ? ' class="max-archived"' : '') + '>' +
                                    '<td>' + e.experience + '</td>' +
                                    '<td>' + e.total + '</td>' +
                                    '<td>' + e.archived + '</td>' +
                                    '<td>' + e.active + '</td>' +
                                    '<td>' + (Number(e.avg_age).toFixed(1)) + '</td>' +
                                '</tr>'
                            )).join('') +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="plotly-graph" id="activity-graph-combined-' + (i + 1) + '"></div>' +
            '</div>' +
        '</div>'
    )).join('');

    var weekdayBlock = (
        '<div class="weekday-content" data-analysis="weekday-combined" style="display: none;" data-weekdays="">' +
            (weekdays.length ? (
                '<div class="view-toggle-horizontal">' +
                    '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">⊕</button>' +
                    '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">☷</button>' +
                    '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
                '</div>' +
                '<div class="analysis-flex view-mode-container" data-analysis="weekday">' +
                    '<div class="table-container">' +
                        '<table>' +
                            '<thead><tr><th>День недели</th><th>Публикаций</th><th>Архиваций</th><th>Ср. время публикации</th><th>Ср. время архивации</th></tr></thead>' +
                            '<tbody>' +
                                weekdays.map(d => (
                                    '<tr><td>' + d.weekday + '</td><td>' + d.publications + '</td><td>' + d.archives + '</td><td>' + d.avg_pub_hour + '</td><td>' + d.avg_arch_hour + '</td></tr>'
                                )).join('') +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div class="plotly-graph" id="weekday-graph-combined"></div>' +
                '</div>'
            ) : '<p>Нет данных по дням недели</p>') +
        '</div>'
    );

    var skillsBlock = (
        '<div class="skills-monthly-content" data-analysis="skills-monthly-combined" style="display: none;" data-skills-monthly="">' +
            (skillsMonthly.length ? (
                '<div class="tabs monthly-skills-month-tabs" style="justify-content: center; margin-top: 10px;">' +
                    skillsMonthly.map((m, i) => (
                        '<button class="tab-button monthly-skills-month-button" onclick="openMonthlySkillsMonthTab(event, \'ms-month-combined-' + (i + 1) + '\')">' + m.month + '</button>'
                    )).join('') +
                '</div>' +
                skillsMonthly.map((m, i) => (
                    '<div id="ms-month-combined-' + (i + 1) + '" class="monthly-skills-month-content" data-month="" style="display: none;">' +
                        '<div class="tabs monthly-skills-exp-tabs" style="justify-content: center; margin-top: 5px;">' +
                            m.experiences.map((exp, j) => (
                                '<button class="tab-button monthly-skills-exp-button" onclick="openMonthlySkillsExpTab(event, \'ms-exp-combined-' + (i + 1) + '-' + (j + 1) + '\')">' + exp.experience + '</button>'
                            )).join('') +
                        '</div>' +
                        m.experiences.map((exp, j) => (
                            '<div id="ms-exp-combined-' + (i + 1) + '-' + (j + 1) + '" class="monthly-skills-exp-content" data-exp="" style="display: none;">' +
                                '<div class="view-toggle-horizontal">' +
                                    '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">⊕</button>' +
                                    '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">☷</button>' +
                                    '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
                                '</div>' +
                                '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                                    '<div class="table-container">' +
                                        '<table>' +
                                            '<thead><tr><th>Навык</th><th>Упоминаний</th><th>% покрытия</th></tr></thead>' +
                                            '<tbody>' +
                                                exp.skills.map(s => (
                                                    '<tr><td>' + s.skill + '</td><td>' + s.count + '</td><td>' + s.coverage + '%</td></tr>'
                                                )).join('') +
                                            '</tbody>' +
                                        '</table>' +
                                        '<p style="margin-top: 10px; color: var(--text-secondary);">Всего вакансий с навыками: ' + exp.total_vacancies + '</p>' +
                                    '</div>' +
                                    '<div class="plotly-graph" id="skills-monthly-graph-combined-' + (i + 1) + '-' + (j + 1) + '"></div>' +
                                '</div>' +
                            '</div>'
                        )).join('') +
                    '</div>'
                )).join('')
            ) : '<p>Нет данных по навыкам</p>') +
        '</div>'
    );

    var salaryBlock = (
        '<div class="salary-content" data-analysis="salary-combined" style="display: none;" data-salary="">' +
            (salaryMonths.length ? (
                '<div class="tabs salary-month-tabs" style="justify-content: center; margin-top: 10px;">' +
                    salaryMonths.map((m, i) => (
                        '<button class="tab-button salary-month-button" onclick="openSalaryMonthTab(event, \'sal-month-combined-' + (i + 1) + '\')">' + m.month + '</button>'
                    )).join('') +
                '</div>' +
                salaryMonths.map((m, i) => (
                    '<div id="sal-month-combined-' + (i + 1) + '" class="salary-month-content" data-month="" style="display: none;">' +
                        '<div class="tabs salary-exp-tabs" style="justify-content: center; margin-top: 5px;">' +
                            m.experiences.map((exp, j) => (
                                '<button class="tab-button salary-exp-button" onclick="openSalaryExpTab(event, \'sal-exp-combined-' + (i + 1) + '-' + (j + 1) + '\')">' + exp.experience + '</button>'
                            )).join('') +
                        '</div>' +
                        m.experiences.map((exp, j) => (
                            '<div id="sal-exp-combined-' + (i + 1) + '-' + (j + 1) + '" class="salary-exp-content" data-exp="" style="display: none;">' +
                                '<div class="salary-display-flex" data-exp-index="' + (j + 1) + '">' +
                                    '<div class="salary-main-content">' +
                                        '<div class="salary-table-container">' +
                                            '<div style="overflow-x: auto;">' +
                                                '<table>' +
                                                    '<thead><tr><th>Статус</th><th>Валюта</th><th>Всего</th><th>С з/п</th><th>% с з/п</th><th>Средняя</th><th>Медианная</th><th>Модальная</th><th>Мин</th><th>Макс</th><th>Топ-10 навыков</th></tr></thead>' +
                                                    '<tbody>' +
                                                        exp.entries.map(entry => (
                                                            '<tr class="salary-row" data-vacancies-with="" data-vacancies-without="">' +
                                                                '<td>' + entry.status + '</td>' +
                                                                '<td>' + entry.currency + '</td>' +
                                                                '<td>' + entry.total_vacancies + '</td>' +
                                                                '<td>' + entry.vacancies_with_salary + '</td>' +
                                                                '<td>' + entry.salary_percentage + '%</td>' +
                                                                '<td>' + Math.round(entry.avg_salary) + '</td>' +
                                                                '<td>' + (entry.median_salary ? Math.round(entry.median_salary) : '—') + '</td>' +
                                                                '<td>' + (entry.mode_salary ? Math.round(entry.mode_salary) : '—') + '</td>' +
                                                                '<td>' + Math.round(entry.min_salary) + '</td>' +
                                                                '<td>' + Math.round(entry.max_salary) + '</td>' +
                                                                '<td>' + entry.top_skills + '</td>' +
                                                            '</tr>'
                                                        )).join('') +
                                                    '</tbody>' +
                                                '</table>' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="salary-graph-container">' +
                                            '<div class="plotly-graph" id="salary-graph-combined-' + (i + 1) + '-' + (j + 1) + '"></div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="salary-view-toggle">' +
                                        '<button class="view-mode-btn active" data-view="table" title="Таблица">☷</button>' +
                                        '<button class="view-mode-btn" data-view="graph" title="График">📊</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>'
                        )).join('') +
                    '</div>'
                )).join('')
            ) : '<p>Нет данных по зарплатам</p>') +
        '</div>'
    );

    container.innerHTML =
        '<h2>' + roleTitle + '</h2>' +
        '<div class="tabs analysis-tabs">' +
            '<button class="tab-button analysis-button active" data-analysis-id="activity-combined" onclick="switchAnalysis(event, \'activity-combined\')">Анализ активности</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="weekday-combined" onclick="switchAnalysis(event, \'weekday-combined\')">Анализ по дням недели</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="skills-monthly-combined" onclick="switchAnalysis(event, \'skills-monthly-combined\')">Навыки по месяцам</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="salary-combined" onclick="switchAnalysis(event, \'salary-combined\')">Анализ зарплат</button>' +
        '</div>' +
        '<div class="tabs month-tabs activity-only" style="justify-content: center;">' +
            activityTabs +
        '</div>' +
        activityBlocks +
        weekdayBlock +
        skillsBlock +
        salaryBlock;

    var monthBlocks = container.querySelectorAll('.month-content');
    monthBlocks.forEach((block, i) => {
        block._data = { entries: activityMonths[i] ? activityMonths[i].entries : [], month: activityMonths[i] ? activityMonths[i].month : '' };
    });

    var weekdayContent = container.querySelector('.weekday-content');
    if (weekdayContent) {
        weekdayContent._data = { weekdays: weekdays };
    }

    var skillsRoot = container.querySelector('.skills-monthly-content');
    if (skillsRoot) {
        skillsRoot._data = { skillsMonthly: skillsMonthly };
    }
    var skillsMonthBlocks = container.querySelectorAll('.monthly-skills-month-content');
    skillsMonthBlocks.forEach((block, i) => {
        block._data = { month: skillsMonthly[i] || {} };
        var expBlocks = block.querySelectorAll('.monthly-skills-exp-content');
        expBlocks.forEach((expBlock, j) => {
            var expData = (skillsMonthly[i] && skillsMonthly[i].experiences) ? skillsMonthly[i].experiences[j] : {};
            expBlock._data = { exp: expData };
        });
    });

    var salaryRoot = container.querySelector('.salary-content');
    if (salaryRoot) {
        salaryRoot._data = { salary: salaryMonths };
    }
    var salaryMonthBlocks = container.querySelectorAll('.salary-month-content');
    salaryMonthBlocks.forEach((block, i) => {
        block._data = { month: salaryMonths[i] || {} };
        var expBlocks = block.querySelectorAll('.salary-exp-content');
        expBlocks.forEach((expBlock, j) => {
            var expData = (salaryMonths[i] && salaryMonths[i].experiences) ? salaryMonths[i].experiences[j] : {};
            expBlock._data = { exp: expData };
            var rows = expBlock.querySelectorAll('.salary-row');
            rows.forEach((row, k) => {
                var entry = (expData.entries || [])[k] || {};
                row._data = {
                    withList: entry.vacancies_with_salary_list || [],
                    withoutList: entry.vacancies_without_salary_list || []
                };
            });
        });
    });

    var analysisButton = container.querySelector('.analysis-button');
    if (analysisButton) analysisButton.click();
    addSummaryTabs(container);
}

function updateRoleSelectionUI(selectedIndices) {
    var buttons = document.querySelectorAll('.role-button');
    var chipsContainer = document.getElementById('role-selected-chips');
    buttons.forEach(btn => {
        var idx = btn.dataset.roleIndex;
        if (selectedIndices.has(idx)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    if (chipsContainer) {
        var chips = Array.from(selectedIndices).map(idx => {
            var btn = document.querySelector('.role-button[data-role-index="' + idx + '"]');
            var name = btn ? btn.dataset.roleName : idx;
            return '<span class="role-chip">' + escapeHtml(name) + '</span>';
        });
        chipsContainer.innerHTML = chips.join('');
    }
}

function showSingleRole(idx) {
    var btn = document.querySelector('.role-button[data-role-index="' + idx + '"]');
    if (!btn) return;
    openRoleTab({ currentTarget: btn }, 'role-' + idx);
    updateRoleSelectionUI(new Set([String(idx)]));
}

function updateRoleView(selectedIndices) {
    var combined = document.getElementById('role-combined');
    var roleContents = Array.from(document.querySelectorAll('.role-content')).filter(c => c.id !== 'role-combined');

    if (selectedIndices.size <= 1) {
        if (combined) combined.style.display = 'none';
        var idx = selectedIndices.size === 1 ? Array.from(selectedIndices)[0] : '1';
        var roleContent = getRoleContentByIndex(idx);
        if (roleContent) {
            var salaryMonths = getRoleSalaryData(roleContent);
            var allVacancies = collectVacanciesFromSalaryMonths(salaryMonths);
            var period = computePublicationPeriod(allVacancies) || '—';
            var id = roleContent.dataset.roleId || '';
            var title = '[ID: ' + id + '] период сбора вакансий ' + period;
            var h2 = roleContent.querySelector('h2');
            if (h2) h2.textContent = title;
        }
        showSingleRole(idx);
        return;
    }

    roleContents.forEach(c => c.style.display = 'none');
    if (combined) {
        var selectedContents = Array.from(selectedIndices).map(i => getRoleContentByIndex(i)).filter(Boolean);
        combined.style.display = 'block';
        renderCombinedContainer(combined, selectedContents);
    }
}

function buildRowContext(row) {
    var headerCells = Array.from(row.closest('table').querySelectorAll('thead th'))
        .map(th => '<th>' + escapeHtml(th.textContent.trim()) + '</th>')
        .join('');
    var valueCells = Array.from(row.querySelectorAll('td'))
        .map(td => '<td>' + escapeHtml(td.textContent.trim() || '—') + '</td>')
        .join('');

    return '<div class="context-table-wrap">' +
        '<table class="context-table">' +
            '<thead><tr>' + headerCells + '</tr></thead>' +
            '<tbody><tr>' + valueCells + '</tr></tbody>' +
        '</table>' +
    '</div>';
}

function openVacancyModal(withList, withoutList, contextHtml) {
    var backdrop = document.getElementById('vacancy-modal-backdrop');
    var body = document.getElementById('vacancy-modal-body');
    var context = document.getElementById('vacancy-modal-context');
    if (!backdrop || !body || !context) return;

    context.innerHTML = contextHtml || '';
    body.innerHTML = '<div class="vacancy-details-container"></div>';
    var container = body.querySelector('.vacancy-details-container');
    renderVacancyDetails(container, withList, withoutList);

    backdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVacancyModal() {
    var backdrop = document.getElementById('vacancy-modal-backdrop');
    if (!backdrop) return;
    backdrop.style.display = 'none';
    document.body.style.overflow = '';
}

document.addEventListener('click', function(e) {
    var row = e.target.closest('.salary-row');
    if (!row) return;

    e.preventDefault();
    var contextHtml = buildRowContext(row);
    var withList = [];
    var withoutList = [];
    if (row._data && row._data.withList) {
        withList = row._data.withList;
    } else {
        try {
            withList = JSON.parse(row.dataset.vacanciesWith || '[]');
        } catch (_e) {
            withList = [];
        }
    }
    if (row._data && row._data.withoutList) {
        withoutList = row._data.withoutList;
    } else {
        try {
            withoutList = JSON.parse(row.dataset.vacanciesWithout || '[]');
        } catch (_e) {
            withoutList = [];
        }
    }

    openVacancyModal(withList, withoutList, contextHtml);
});

document.addEventListener('click', function(e) {
    if (e.target.closest('.vacancy-modal-close')) {
        closeVacancyModal();
        return;
    }

    var backdrop = e.target.classList.contains('vacancy-modal-backdrop');
    if (backdrop) {
        closeVacancyModal();
        return;
    }

    var btn = e.target.closest('.vacancy-filter-btn');
    if (!btn) return;

    var container = btn.closest('.vacancy-details-container');
    if (!container) return;

    var filter = btn.dataset.filter;
    var withList = [];
    var withoutList = [];
    try {
        withList = JSON.parse(container.dataset.with || '[]');
    } catch (_e) {
        withList = [];
    }
    try {
        withoutList = JSON.parse(container.dataset.without || '[]');
    } catch (_e) {
        withoutList = [];
    }

    var allBtns = container.querySelectorAll('.vacancy-filter-btn');
    allBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    var list = filter === 'with' ? withList : withoutList;
    var replaceTarget = container.querySelector('.vacancy-table-wrap, .vacancy-empty');
    if (replaceTarget) {
        replaceTarget.outerHTML = buildVacancyTableHtml(list);
    } else {
        container.innerHTML = container.innerHTML + buildVacancyTableHtml(list);
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeVacancyModal();
    }
});

// ---------- Обработчик кликов по иконкам режимов ----------
document.addEventListener('click', function(e) {
    var btn = e.target.closest('.view-mode-btn, .view-mode-button');
    if (!btn) return;

    var container = btn.closest('.month-content, .weekday-content, .monthly-skills-exp-content, .salary-exp-content');
    if (!container) return;

    var analysisType = null;
    if (container.classList.contains('month-content')) analysisType = 'activity';
    else if (container.classList.contains('weekday-content')) analysisType = 'weekday';
    else if (container.classList.contains('monthly-skills-exp-content')) analysisType = 'skills-monthly';
    else if (container.classList.contains('salary-exp-content')) analysisType = 'salary';

    if (!analysisType) return;

    var mode = btn.dataset.view;
    // Сохраняем режим в uiState
    if (analysisType === 'activity') uiState.activity_view_mode = mode;
    else if (analysisType === 'weekday') uiState.weekday_view_mode = mode;
    else if (analysisType === 'skills-monthly') uiState.skills_monthly_view_mode = mode;
    else if (analysisType === 'salary') uiState.salary_view_mode = mode;

    // Обновляем активный класс у всех кнопок в этом контейнере
    var allBtns = container.querySelectorAll('.view-mode-btn, .view-mode-button');
    setActiveViewButton(allBtns, mode);

    // Применяем режим
    if (analysisType === 'salary') {
        // Для зарплат данные берутся из dataset.exp
        var expData = (container._data && container._data.exp) ? container._data.exp : parseJsonDataset(container, 'exp', {});
        applySalaryViewMode(container, expData.entries);
    } else {
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
    }
});

// ---------- Инициализация ----------
document.addEventListener("DOMContentLoaded", function() {
    var buttons = Array.from(document.getElementsByClassName("role-button"));
    var multiToggle = document.getElementById('multi-role-toggle');
    var selector = document.getElementById('role-selector');
    var selectorToggle = document.getElementById('role-selector-toggle');
    var clearBtn = document.getElementById('role-selection-clear');
    if (buttons.length === 0) return;

    var selected = new Set([buttons[0].dataset.roleIndex]);
    updateRoleSelectionUI(selected);
    updateRoleView(selected);

    function enforceSingle(idx) {
        selected = new Set([idx]);
        updateRoleSelectionUI(selected);
        updateRoleView(selected);
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var idx = btn.dataset.roleIndex;
            if (multiToggle && multiToggle.checked) {
                var next = new Set(selected);
                if (next.has(idx)) next.delete(idx);
                else next.add(idx);
                if (next.size === 0) next.add(idx);
                selected = next;
                updateRoleSelectionUI(selected);
                updateRoleView(selected);
            } else {
                enforceSingle(idx);
            }
        });
    });

    if (multiToggle) {
        multiToggle.addEventListener('change', function() {
            if (!multiToggle.checked) {
                enforceSingle(Array.from(selected)[0] || buttons[0].dataset.roleIndex);
            } else {
                updateRoleSelectionUI(selected);
                updateRoleView(selected);
            }
        });
    }

    if (selectorToggle && selector) {
        selectorToggle.addEventListener('click', function() {
            selector.classList.toggle('collapsed');
            var expanded = !selector.classList.contains('collapsed');
            selectorToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            selected = new Set([buttons[0].dataset.roleIndex]);
            updateRoleSelectionUI(selected);
            updateRoleView(selected);
        });
    }

    addSummaryTabs(document);
});
