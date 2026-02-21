// Цветовая палитра графиков в стиле Material Design (монохромные серые)
const CHART_COLORS = {
    light: '#9E9E9E',   // gray 500 – для светлых столбцов (активные, публикации)
    medium: '#757575',  // gray 600 – для средних столбцов (навыки)
    dark: '#424242'     // gray 800 – для тёмных столбцов (архивные, архивации)
};

// Состояние интерфейса: для каждой роли и типа анализа храним последние активные внутренние вкладки
let uiState = {};

// Вспомогательная функция для получения ключа состояния
function getStateKey(roleId, analysisType) {
    return roleId + '_' + analysisType;
}

// Функции переключения вкладок
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

    // При смене роли активируем первый анализ и восстанавливаем его состояние
    var firstAnalysisButton = document.querySelector("#" + roleId + " .analysis-button");
    if (firstAnalysisButton) {
        // Определяем тип анализа по data-атрибуту или по тексту? Лучше по onclick, но сложно.
        // Вместо этого эмулируем клик, но чтобы сохранить состояние, нам нужно знать тип.
        // Просто вызовем switchAnalysis с правильным analysisId.
        var analysisId = firstAnalysisButton.getAttribute('onclick').match(/'([^']+)'/)[1];
        switchAnalysis({ currentTarget: firstAnalysisButton }, analysisId);
    }
}

function openMonthTab(evt, monthId) {
    var parentRole = evt.currentTarget.closest('.role-content');
    var roleId = parentRole.id; // например "role-1"
    var monthDiv = document.getElementById(monthId);
    var monthStr = monthDiv.dataset.month; // нужно добавить data-month в HTML

    // Сохраняем состояние
    var stateKey = getStateKey(roleId, 'activity');
    uiState[stateKey] = { month: monthStr };

    // Скрываем другие месяцы
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
    var skillsBlock = parentRole.querySelector('.skills-content');
    var skillsMonthlyBlock = parentRole.querySelector('.skills-monthly-content');

    // Определяем тип анализа из analysisId
    var analysisType;
    if (analysisId.includes('activity')) analysisType = 'activity';
    else if (analysisId.includes('weekday')) analysisType = 'weekday';
    else if (analysisId.includes('skills-') && !analysisId.includes('monthly')) analysisType = 'skills';
    else if (analysisId.includes('skills-monthly')) analysisType = 'skills-monthly';

    // Скрываем все блоки
    activityBlocks.forEach(block => block.style.display = 'none');
    if (weekdayBlock) weekdayBlock.style.display = 'none';
    if (skillsBlock) skillsBlock.style.display = 'none';
    if (skillsMonthlyBlock) skillsMonthlyBlock.style.display = 'none';

    // Показываем нужный блок
    if (analysisType === 'activity') {
        activityBlocks.forEach(block => block.style.display = 'block');
        restoreActivityState(parentRole, roleId);
    } else if (analysisType === 'weekday') {
        weekdayBlock.style.display = 'block';
        var roleNum = analysisId.split('-')[1];
        buildWeekdayBarChart(roleNum, weekdayBlock);
    } else if (analysisType === 'skills') {
        skillsBlock.style.display = 'block';
        restoreSkillsState(parentRole, roleId);
    } else if (analysisType === 'skills-monthly') {
        skillsMonthlyBlock.style.display = 'block';
        restoreSkillsMonthlyState(parentRole, roleId);
    }
}

// Функции восстановления состояния
function restoreActivityState(parentRole, roleId) {
    var stateKey = getStateKey(roleId, 'activity');
    var saved = uiState[stateKey];
    var monthButtons = parentRole.querySelectorAll('.month-button');
    if (monthButtons.length === 0) return;

    if (saved && saved.month) {
        // Ищем кнопку с нужным месяцем (по тексту или data-атрибуту)
        for (var btn of monthButtons) {
            if (btn.textContent.trim() === saved.month) {
                btn.click();
                return;
            }
        }
    }
    // Если не нашли или нет сохранения, кликаем первый
    monthButtons[0].click();
}

function restoreSkillsState(parentRole, roleId) {
    var stateKey = getStateKey(roleId, 'skills');
    var saved = uiState[stateKey];
    var expButtons = parentRole.querySelectorAll('.experience-button');
    if (expButtons.length === 0) return;

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

function restoreSkillsMonthlyState(parentRole, roleId) {
    var stateKey = getStateKey(roleId, 'skills-monthly');
    var saved = uiState[stateKey];
    var monthButtons = parentRole.querySelectorAll('.monthly-skills-month-button');
    if (monthButtons.length === 0) return;

    if (saved && saved.month) {
        for (var btn of monthButtons) {
            if (btn.textContent.trim() === saved.month) {
                // После клика на месяц восстановится опыт через обработчик
                btn.click();
                // Но нужно также восстановить опыт после загрузки месяца
                // Для этого добавим вызов restoreExpAfterMonth
                setTimeout(function() {
                    restoreExpAfterMonth(parentRole, saved.experience);
                }, 0);
                return;
            }
        }
    }
    // Если нет сохранения, кликаем первый месяц и первый опыт
    monthButtons[0].click();
}

function restoreExpAfterMonth(parentRole, savedExp) {
    var expButtons = parentRole.querySelectorAll('.monthly-skills-exp-button');
    if (expButtons.length === 0) return;
    if (savedExp) {
        for (var btn of expButtons) {
            if (btn.textContent.trim() === savedExp) {
                btn.click();
                return;
            }
        }
    }
    expButtons[0].click();
}

// Обновлённые обработчики вкладок с сохранением состояния
function openExperienceTab(evt, expId) {
    var parentRole = evt.currentTarget.closest('.role-content');
    var roleId = parentRole.id;
    var expDiv = document.getElementById(expId);
    var expData = JSON.parse(expDiv.dataset.exp);
    var experience = expData.experience;

    // Сохраняем состояние
    var stateKey = getStateKey(roleId, 'skills');
    uiState[stateKey] = { experience: experience };

    var expContents = parentRole.getElementsByClassName("experience-content");
    for (var i = 0; i < expContents.length; i++) {
        expContents[i].style.display = "none";
    }
    var expButtons = parentRole.getElementsByClassName("experience-button");
    for (var i = 0; i < expButtons.length; i++) {
        expButtons[i].className = expButtons[i].className.replace(" active", "");
    }
    expDiv.style.display = "block";
    evt.currentTarget.className += " active";

    var graphId = 'skills-graph-' + expId.replace('exp-', '');
    buildHorizontalBarChart(graphId, expData.skills, expData.experience);
}

function openMonthlySkillsMonthTab(evt, monthId) {
    var parentRole = evt.currentTarget.closest('.role-content');
    var roleId = parentRole.id;
    var monthDiv = document.getElementById(monthId);
    var monthData = JSON.parse(monthDiv.dataset.month);
    var monthStr = monthData.month;

    // Сохраняем месяц, но опыт пока не знаем
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

    // Восстанавливаем опыт для этого месяца, если сохранён
    setTimeout(function() {
        restoreExpAfterMonth(parentRole, saved.experience);
    }, 0);
}

function openMonthlySkillsExpTab(evt, expId) {
    var parentMonth = evt.currentTarget.closest('.monthly-skills-month-content');
    var parentRole = parentMonth.closest('.role-content');
    var roleId = parentRole.id;
    var expDiv = document.getElementById(expId);
    var expData = JSON.parse(expDiv.dataset.exp);
    var experience = expData.experience;

    // Сохраняем опыт
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

// --- Функции построения графиков (без изменений) ---
function buildActivityBarChart(graphId, entries) {
    var experiences = entries.map(e => e.experience);
    var activeData = entries.map(e => e.active);
    var archivedData = entries.map(e => e.archived);

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

function buildHorizontalBarChart(graphId, skills, experience, barColor = CHART_COLORS.medium) {
    var skillNames = skills.map(s => s.skill);
    var counts = skills.map(s => s.count);
    var coverages = skills.map(s => s.coverage);
    var text = skills.map(s => s.count + ' (' + s.coverage + '%)');

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
        title: 'Топ-10 навыков · ' + experience,
        xaxis: { title: 'Количество упоминаний' },
        margin: { l: 200, r: 50, t: 50, b: 50 },
        height: 400,
        bargap: 0.15
    };
    Plotly.newPlot(graphId, [trace], layout);
}

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", function() {
    var firstRoleButton = document.getElementsByClassName("role-button")[0];
    if (firstRoleButton) firstRoleButton.click();
});