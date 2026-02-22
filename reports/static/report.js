// Цветовая палитра графиков в стиле Material Design (монохромные серые)
const CHART_COLORS = {
    light: '#B0BEC5',   // gray 500 – для светлых столбцов (активные, публикации)
    medium: '#90A4AE',  // gray 600 – для средних столбцов (навыки, зарплаты)
    dark: '#607D8B'     // gray 800 – для тёмных столбцов (архивные, архивации)
};

// Состояние интерфейса
let uiState = {
    global_analysis_type: null,           // последний выбранный тип анализа
    global_activity_month: null,          // последний месяц для активности
    global_skills_month: null,            // последний месяц для навыков
    global_skills_experience: null,       // последний опыт для навыков
    global_salary_month: null,             // последний месяц для зарплат
    global_salary_experience: null,        // последний опыт для зарплат
    global_salary_view_mode: 'together'    // режим отображения зарплат (together/table/graph)
};

// Вспомогательная функция для получения ключа состояния (для внутренних вкладок, специфичных для роли)
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

    // Восстанавливаем глобальный тип анализа
    if (uiState.global_analysis_type) {
        var targetId = uiState.global_analysis_type + '-' + roleId.split('-')[1];
        var targetButton = document.querySelector("#" + roleId + " .analysis-button[data-analysis-id='" + targetId + "']");
        if (targetButton) {
            targetButton.click();
            return;
        }
    }

    // Если нет глобального типа, активируем первую вкладку
    var firstButton = document.querySelector("#" + roleId + " .analysis-button");
    if (firstButton) {
        firstButton.click();
    }
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

    // Сохраняем глобальный тип анализа
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
        var roleNum = analysisId.split('-')[1];
        buildWeekdayBarChart(roleNum, weekdayBlock);
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
    var monthStr = monthDiv.dataset.month;

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

    var entries = JSON.parse(monthDiv.dataset.entries);
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
        legend: { orientation: 'h', y: -0.1, x: 0.5, xanchor: 'center' },
        margin: { t: 50, b: 80, l: 50, r: 20 },
        height: 340,
        title: ''
    };
    Plotly.newPlot(graphId, [traceActive, traceArchived], layout);
}

// ---------- Анализ по дням недели ----------
function buildWeekdayBarChart(roleId, weekdayBlock) {
    var weekdaysData = JSON.parse(weekdayBlock.dataset.weekdays);
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
        legend: { orientation: 'h', y: -0.1, x: 0.5, xanchor: 'center' },
        margin: { t: 50, b: 80, l: 50, r: 20 },
        height: 400,
        title: ''
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
    var monthData = JSON.parse(monthDiv.dataset.month);
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
    var expData = JSON.parse(expDiv.dataset.exp);
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
        bargap: 0.15
    };
    Plotly.newPlot(graphId, [trace], layout);
}

// ---------- Анализ зарплат (обновлённый) ----------
function restoreSalaryState(parentRole, roleId) {
    // Восстанавливаем режим отображения (кнопки переключателя)
    var viewButtons = parentRole.querySelectorAll('.view-mode-button');
    for (var btn of viewButtons) {
        if (btn.dataset.view === uiState.global_salary_view_mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

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
    var expData = JSON.parse(expDiv.dataset.exp);
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

    // Применяем текущий режим отображения
    applySalaryViewMode(expDiv, expData.entries);
}

// Обработчик переключения режимов отображения (вертикальные иконки)
function switchSalaryViewMode(evt) {
    var parentExp = evt.currentTarget.closest('.salary-exp-content');
    var viewButtons = parentExp.querySelectorAll('.view-mode-button');
    for (var btn of viewButtons) {
        btn.classList.remove('active');
    }
    evt.currentTarget.classList.add('active');
    var mode = evt.currentTarget.dataset.view;
    uiState.global_salary_view_mode = mode;

    var expData = JSON.parse(parentExp.dataset.exp);
    applySalaryViewMode(parentExp, expData.entries);
}

function applySalaryViewMode(expDiv, entries) {
    var mode = uiState.global_salary_view_mode;
    var mainContent = expDiv.querySelector('.salary-main-content');
    var tableContainer = expDiv.querySelector('.salary-table-container');
    var graphContainer = expDiv.querySelector('.salary-graph-container');
    var graphId = expDiv.querySelector('.plotly-graph').id;

    // Сначала сбрасываем inline-стили
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
        // Проверяем, помещаются ли рядом
        var availableWidth = mainContent.offsetWidth;
        var tableWidth = tableContainer.offsetWidth;
        var graphWidth = graphContainer.offsetWidth;
        if (tableWidth + graphWidth > availableWidth) {
            // Не помещаются – ставим вертикально
            mainContent.style.flexDirection = 'column';
            tableContainer.style.width = '100%';
            graphContainer.style.width = '100%';
        } else {
            // Помещаются – рядом
            mainContent.style.flexDirection = 'row';
            tableContainer.style.width = '50%';
            graphContainer.style.width = '50%';
        }
        buildSalaryBarChart(graphId, entries);
    }
}

function buildSalaryBarChart(graphId, entries) {
    // Группируем по валютам и статусам (статусы уже отсортированы: Открытая, Архивная)
    var currencies = [...new Set(entries.map(e => e.currency))];
    var statuses = ['Открытая', 'Архивная'];
    var data = [];
    for (var status of statuses) {
        var y = [];
        for (var curr of currencies) {
            var entry = entries.find(e => e.currency === curr && e.status === status);
            y.push(entry ? entry.avg_salary : 0);
        }
        data.push({
            x: currencies,
            y: y,
            name: status,
            type: 'bar',
            marker: { color: status === 'Открытая' ? CHART_COLORS.light : CHART_COLORS.dark }
        });
    }

    var layout = {
        barmode: 'group',
        title: 'Средняя зарплата по валютам и статусу',
        xaxis: { title: 'Валюта' },
        yaxis: { title: 'Средняя зарплата' },
        margin: { t: 50, b: 80, l: 50, r: 20 },
        height: 400,
        legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' }
    };
    Plotly.newPlot(graphId, data, layout);
}

// Инициализация переключателей режимов (делегирование событий)
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('view-mode-button')) {
        switchSalaryViewMode(e);
    }
});

// ---------- Инициализация ----------
document.addEventListener("DOMContentLoaded", function() {
    var firstRoleButton = document.getElementsByClassName("role-button")[0];
    if (firstRoleButton) firstRoleButton.click();
});