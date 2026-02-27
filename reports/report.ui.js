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

var VIEW_ICON_TABLE = '▦';
var VIEW_ICON_GRAPH = '📊';
var VIEW_ICON_TOGETHER = '⊞';

function updateViewToggleIcons(root) {
    if (!root) return;
    var buttons = root.querySelectorAll('.view-mode-btn');
    buttons.forEach(function(btn) {
        var view = btn.dataset.view || '';
        if (view === 'table') {
            btn.textContent = VIEW_ICON_TABLE;
            btn.title = 'Таблица';
        } else if (view === 'graph') {
            btn.textContent = VIEW_ICON_GRAPH;
            btn.title = 'График';
        } else if (view === 'together') {
            btn.textContent = VIEW_ICON_TOGETHER;
            btn.title = 'Вместе';
        }
    });
}
function registerSkillDisplayName(rawSkill) {
    var raw = String(rawSkill || '').trim();
    if (!raw) return '';
    var key = normalizeSkillName(raw);
    if (!key) return raw;
    if (!uiState.global_skill_case_map) uiState.global_skill_case_map = {};
    if (!uiState.global_skill_case_map[key]) uiState.global_skill_case_map[key] = raw;
    return uiState.global_skill_case_map[key];
}
function getSkillDisplayName(rawSkill) {
    var raw = String(rawSkill || '').trim();
    if (!raw) return '';
    var key = normalizeSkillName(raw);
    if (!key) return raw;
    if (uiState.global_skill_case_map && uiState.global_skill_case_map[key]) return uiState.global_skill_case_map[key];
    return raw;
}
function applySalaryStatusIcons(root) {
    var scope = root || document;
    var rows = scope.querySelectorAll('.salary-content .salary-row');
    rows.forEach(function(row) {
        var cell = row.cells && row.cells[0];
        if (!cell || cell.querySelector('.status-icon')) return;

        var raw = (cell.textContent || '').trim();
        if (!raw) return;
        var normalized = raw.toLowerCase();
        var isArchived = normalized.indexOf('archiv') !== -1 || normalized.indexOf('архив') !== -1;
        var isOpen = normalized.indexOf('open') !== -1 || normalized.indexOf('откры') !== -1 || normalized.indexOf('active') !== -1 || normalized.indexOf('актив') !== -1;

        var iconClass = isArchived ? 'status-icon-archived' : (isOpen ? 'status-icon-open' : null);
        if (!iconClass) return;

        cell.classList.add('status-icon-cell');
        cell.innerHTML = '<span class="status-icon ' + iconClass + '" title="' + escapeHtml(raw) + '" aria-label="' + escapeHtml(raw) + '"></span>';
    });
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
    var skillsSearchBlock = parentRole.querySelector('.skills-search-content');
    var salaryBlock = parentRole.querySelector('.salary-content');
    var employerAnalysisBlock = parentRole.querySelector('.employer-analysis-content');

    var analysisType;
    if (analysisId.includes('activity')) analysisType = 'activity';
    else if (analysisId.includes('weekday')) analysisType = 'weekday';
    else if (analysisId.includes('skills-monthly')) analysisType = 'skills-monthly';
    else if (analysisId.includes('skills-search')) analysisType = 'skills-search';
    else if (analysisId.includes('salary')) analysisType = 'salary';
    else if (analysisId.includes('employer-analysis')) analysisType = 'employer-analysis';

    uiState.global_analysis_type = analysisType;
    uiState[getAnalysisStateKey(roleId)] = analysisType;

    activityBlocks.forEach(block => block.style.display = 'none');
    if (weekdayBlock) weekdayBlock.style.display = 'none';
    if (skillsMonthlyBlock) skillsMonthlyBlock.style.display = 'none';
    if (skillsSearchBlock) skillsSearchBlock.style.display = 'none';
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
        normalizeSkillsMonthlyControls(parentRole);
        if (roleId === 'role-all') restoreAllRolesPeriodState(parentRole, 'skills');
        else restoreSkillsMonthlyState(parentRole, roleId);
    } else if (analysisType === 'skills-search') {
        if (skillsSearchBlock) {
            skillsSearchBlock.style.display = 'block';
            initSkillsSearch(parentRole);
        }
    } else if (analysisType === 'salary') {
        salaryBlock.style.display = 'block';
        normalizeSalaryControls(parentRole);
        if (roleId === 'role-all') restoreAllRolesPeriodState(parentRole, 'salary');
        else restoreSalaryState(parentRole, roleId);
        applySalaryStatusIcons(parentRole);
    } else if (analysisType === 'employer-analysis') {
        if (employerAnalysisBlock) {
            employerAnalysisBlock.style.display = 'block';
            initEmployerAnalysisFilter(employerAnalysisBlock);
        }
    }
    updateViewToggleIcons(parentRole);
}

function normalizeSalaryControls(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.salary-content');
    if (!block) return;
    rebuildSalaryFromVacancies(parentRole, block);
    if (uiState.salary_view_mode === 'together') uiState.salary_view_mode = 'table';
    var monthTabs = block.querySelector('.salary-month-tabs');
    if (!monthTabs) {
        updateViewToggleIcons(block);
        return;
    }

    var controlRow = block.querySelector('.salary-control-row');
    if (!controlRow) {
        controlRow = document.createElement('div');
        controlRow.className = 'salary-control-row';
        block.insertBefore(controlRow, monthTabs);
    }
    if (monthTabs.parentElement !== controlRow) controlRow.appendChild(monthTabs);

    ensureSalaryQuickFilters(parentRole, block, monthTabs);
    sortSalaryMonths(monthTabs);

    var inlineToggle = controlRow.querySelector('.salary-mode-toggle-inline');
    if (!inlineToggle) {
        inlineToggle = document.createElement('div');
        inlineToggle.className = 'view-toggle-horizontal salary-mode-toggle-inline';
        inlineToggle.innerHTML =
            '<button class="view-mode-btn salary-inline-mode-btn" data-view="table" title="Таблица">▦</button>' +
            '<button class="view-mode-btn salary-inline-mode-btn" data-view="graph" title="График">📊</button>';
        controlRow.appendChild(inlineToggle);
    }

    if (!inlineToggle.dataset.bound) {
        inlineToggle.addEventListener('click', function(e) {
            var btn = e.target.closest('.salary-inline-mode-btn');
            if (!btn) return;
            var view = btn.dataset.view || 'table';
            uiState.salary_view_mode = view;
            setActiveViewButton(inlineToggle.querySelectorAll('.salary-inline-mode-btn'), view);

            var visibleMonth = block.querySelector('.salary-month-content[style*="display: block"]');
            if (!visibleMonth) return;
            var visibleExp = visibleMonth.querySelector('.salary-exp-content[style*="display: block"]');
            if (!visibleExp) return;
            var expData = (visibleExp._data && visibleExp._data.exp) ? visibleExp._data.exp : parseJsonDataset(visibleExp, 'exp', {});
            applySalaryViewMode(visibleExp, expData.entries || []);
        });
        inlineToggle.dataset.bound = '1';
    }

    setActiveViewButton(inlineToggle.querySelectorAll('.salary-inline-mode-btn'), uiState.salary_view_mode || 'table');
    updateViewToggleIcons(block);
}

function buildSalaryMonthFromVacancies(vacancies, label) {
    var expOrder = getExperienceOrder();
    var expMap = {};
    (vacancies || []).forEach(function(v) {
        if (!v) return;
        var exp = normalizeExperience(v._experience || v.experience || '') || 'Не указан';
        var status = v._status || (v.archived_at ? 'Архивная' : 'Открытая');
        var currency = normalizeSalaryCurrencyBucket(v.currency);
        var key = status + '|' + currency;
        var bucketMap = expMap[exp] || {};
        var bucket = bucketMap[key] || { status: status, currency: currency, with: [], without: [] };
        var hasSalary = v.salary_from !== null && v.salary_from !== undefined;
        if (!hasSalary && v.salary_to !== null && v.salary_to !== undefined) hasSalary = true;
        if (hasSalary) bucket.with.push(v);
        else bucket.without.push(v);
        bucketMap[key] = bucket;
        expMap[exp] = bucketMap;
    });

    var experiences = Object.keys(expMap).map(function(expName) {
        return { experience: expName, entries: buildSalaryEntriesFromBuckets(expMap[expName]) };
    });
    experiences.sort((a, b) => (expOrder[normalizeExperience(a.experience)] || 99) - (expOrder[normalizeExperience(b.experience)] || 99));
    var monthData = { month: label, experiences: experiences };
    if (experiences.length) monthData.experiences = experiences.concat([buildSalarySummaryExp(monthData)]);
    return monthData;
}

function normalizeSalaryCurrencyBucket(rawCurrency) {
    var curr = String(rawCurrency || '').trim().toUpperCase();
    if (!curr || curr === '—' || curr === '-') return '\u041d\u0435 \u0437\u0430\u043f\u043e\u043b\u043d\u0435\u043d\u0430';
    if (curr === 'RUR' || curr === 'RUB') return 'RUR';
    if (curr === 'USD') return 'USD';
    if (curr === 'EUR') return 'EUR';
    return '\u0414\u0440\u0443\u0433\u0430\u044f';
}

function buildSalaryMonthsFromVacancies(vacancies) {
    var monthMap = {};
    (vacancies || []).forEach(function(v) {
        if (!v || !v.published_at) return;
        var d = new Date(v.published_at);
        if (isNaN(d)) return;
        var month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        if (!monthMap[month]) monthMap[month] = [];
        monthMap[month].push(v);
    });

    var months = Object.keys(monthMap).sort();
    if (!months.length) return [];

    var result = months.map(function(month) {
        return buildSalaryMonthFromVacancies(monthMap[month], month);
    });
    result.unshift(buildSalaryMonthFromVacancies(vacancies, formatMonthTitle(months.length)));
    return result;
}

function rebuildSalaryFromVacancies(parentRole, block) {
    if (!parentRole || !block || block.dataset.salaryBuiltFromVacancies === '1') return;
    var vacancies = getRoleVacancies(parentRole);
    if (!vacancies || !vacancies.length) return;

    var salaryMonths = buildSalaryMonthsFromVacancies(vacancies);
    if (!salaryMonths.length) return;

    var monthTabs = block.querySelector('.salary-month-tabs');
    if (!monthTabs) {
        monthTabs = document.createElement('div');
        monthTabs.className = 'tabs salary-month-tabs';
        monthTabs.style.justifyContent = 'center';
        monthTabs.style.marginTop = '10px';
        block.insertBefore(monthTabs, block.firstChild);
    }

    block.querySelectorAll('.salary-month-content').forEach(function(node) { node.remove(); });
    monthTabs.innerHTML = '';

    salaryMonths.forEach(function(monthData, idx) {
        var suffix = 'vac-' + (idx + 1);
        var monthId = buildSalaryMonthBlock(block, monthData, suffix, parentRole.id);
        var btn = document.createElement('button');
        btn.className = 'tab-button salary-month-button';
        btn.textContent = monthData.month;
        btn.addEventListener('click', function(e) { openSalaryMonthTab(e, monthId); });
        monthTabs.appendChild(btn);
    });

    block._data = block._data || {};
    block._data.salary = salaryMonths;
    block.dataset.salaryBuiltFromVacancies = '1';
    block.dataset.salaryFiltersReady = '0';
}

function buildSalaryTablesHtml(entries) {
    var coverageMap = { 'RUR': 0, 'USD': 0, 'EUR': 0, 'Другая': 0, 'Не заполнена': 0 };
    var coverageTotal = 0;
    (entries || []).forEach(function(entry) {
        if (!entry) return;
        var count = Number(entry.total_vacancies) || 0;
        var currency = coverageMap.hasOwnProperty(entry.currency) ? entry.currency : 'Другая';
        coverageMap[currency] += count;
        coverageTotal += count;
    });
    function pct(value) {
        return coverageTotal ? (Math.round((value * 10000) / coverageTotal) / 100) + '%' : '0%';
    }
    var coverageRows = '<tr>' +
        '<td>' + coverageTotal + '</td>' +
        '<td>' + coverageMap['RUR'] + ' (' + pct(coverageMap['RUR']) + ')</td>' +
        '<td>' + coverageMap['USD'] + ' (' + pct(coverageMap['USD']) + ')</td>' +
        '<td>' + coverageMap['EUR'] + ' (' + pct(coverageMap['EUR']) + ')</td>' +
        '<td>' + coverageMap['Другая'] + ' (' + pct(coverageMap['Другая']) + ')</td>' +
        '<td>' + coverageMap['Не заполнена'] + ' (' + pct(coverageMap['Не заполнена']) + ')</td>' +
    '</tr>';
    var statsRows = (entries || []).map(function(entry) {
        return '<tr class="salary-row" data-vacancies-with="" data-vacancies-without="">' +
            '<td class="status-icon-cell">' + renderStatusIcon(entry.status) + '</td>' +
            '<td>' + entry.currency + '</td>' +
            '<td>' + entry.total_vacancies + '</td>' +
            '<td>' + Math.round(entry.avg_salary) + '</td>' +
            '<td>' + (entry.median_salary ? Math.round(entry.median_salary) : '—') + '</td>' +
            '<td>' + (entry.mode_salary ? Math.round(entry.mode_salary) : '—') + '</td>' +
            '<td>' + Math.round(entry.min_salary) + '</td>' +
            '<td>' + Math.round(entry.max_salary) + '</td>' +
            '<td>' + entry.top_skills + '</td>' +
        '</tr>';
    }).join('');
    return '<div class="salary-split-tables">' +
        '<div style="overflow-x: auto; margin-bottom: 16px;">' +
            '<h4 style="margin: 0 0 8px;">Сводка вакансий по валютам</h4>' +
            '<table>' +
                '<thead><tr><th>Всего вакансий</th><th>RUR</th><th>USD</th><th>EUR</th><th>Другая</th><th>Не заполнена</th></tr></thead>' +
                '<tbody>' + coverageRows + '</tbody>' +
            '</table>' +
        '</div>' +
        '<div style="overflow-x: auto;">' +
            '<h4 style="margin: 0 0 8px;">Статистика зарплат</h4>' +
            '<table>' +
                '<thead><tr><th>Статус</th><th>Валюта</th><th>Найдено</th><th>Средняя</th><th>Медианная</th><th>Модальная</th><th>Мин</th><th>Макс</th><th>Топ-10 навыков</th></tr></thead>' +
                '<tbody>' + statsRows + '</tbody>' +
            '</table>' +
        '</div>' +
    '</div>';
}

function buildSalaryMonthBlock(block, monthData, suffix, roleId) {
    var monthId = 'sal-month-' + roleId + '-filter-' + suffix;
    if (document.getElementById(monthId)) return monthId;
    var monthDiv = document.createElement('div');
    monthDiv.id = monthId;
    monthDiv.className = 'salary-month-content';
    monthDiv.style.display = 'none';
    monthDiv.dataset.month = JSON.stringify(monthData);
    monthDiv._data = { month: monthData };

    var expTabs = document.createElement('div');
    expTabs.className = 'tabs salary-exp-tabs';
    expTabs.style.justifyContent = 'center';
    expTabs.style.marginTop = '5px';
    monthDiv.appendChild(expTabs);

    (monthData.experiences || []).forEach(function(exp, idx) {
        var expId = 'sal-exp-' + roleId + '-filter-' + suffix + '-' + (idx + 1);
        var btn = document.createElement('button');
        btn.className = 'tab-button salary-exp-button';
        btn.textContent = exp.experience;
        btn.addEventListener('click', function(e) { openSalaryExpTab(e, expId); });
        expTabs.appendChild(btn);

        var expDiv = document.createElement('div');
        expDiv.id = expId;
        expDiv.className = 'salary-exp-content';
        expDiv.style.display = 'none';
        expDiv.dataset.exp = JSON.stringify(exp);
        expDiv._data = { exp: exp };

        expDiv.innerHTML =
            '<div class="salary-display-flex" data-exp-index="' + (idx + 1) + '">' +
                '<div class="salary-main-content">' +
                    '<div class="salary-table-container">' +
                        buildSalaryTablesHtml(exp.entries || []) +
                    '</div>' +
                    '<div class="salary-graph-container">' +
                        '<div class="plotly-graph" id="salary-graph-' + expId.replace('sal-exp-', '') + '"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="salary-view-toggle">' +
                    '<button class="view-mode-btn active" data-view="table" title="Таблица">▦</button>' +
                    '<button class="view-mode-btn" data-view="graph" title="График">📊</button>' +
                '</div>' +
            '</div>';

        var rows = expDiv.querySelectorAll('.salary-row');
        rows.forEach((row, k) => {
            var entry = (exp.entries || [])[k] || {};
            row._data = {
                withList: entry.vacancies_with_salary_list || [],
                withoutList: entry.vacancies_without_salary_list || []
            };
        });

        monthDiv.appendChild(expDiv);
    });

    block.appendChild(monthDiv);
    return monthId;
}

function ensureSalaryQuickFilters(parentRole, block, monthTabs) {
    if (!parentRole || !block || !monthTabs || block.dataset.salaryFiltersReady === '1') return;

    var vacancies = getRoleVacancies(parentRole);
    if (!vacancies || !vacancies.length) {
        var salaryMonths = getRoleSalaryData(parentRole);
        vacancies = collectVacanciesFromSalaryMonths(salaryMonths);
    }

    function filterVacanciesByDays(days) {
        var now = new Date();
        var since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return (vacancies || []).filter(function(v) {
            if (!v || !v.published_at) return false;
            var d = new Date(v.published_at);
            return !isNaN(d) && d >= since;
        });
    }

    function addQuickButton(label, suffix, list) {
        var monthData = buildSalaryMonthFromVacancies(list, label);
        var monthId = buildSalaryMonthBlock(block, monthData, suffix, parentRole.id);
        var btn = document.createElement('button');
        btn.className = 'tab-button salary-month-button salary-quick-filter';
        btn.textContent = label;
        btn.addEventListener('click', function(e) { openSalaryMonthTab(e, monthId); });
        monthTabs.insertBefore(btn, monthTabs.firstChild);
    }

    addQuickButton('За 14 дней', '14d', filterVacanciesByDays(14));
    addQuickButton('За 7 дней', '7d', filterVacanciesByDays(7));
    addQuickButton('За 3 дня', '3d', filterVacanciesByDays(3));

    block.dataset.salaryFiltersReady = '1';
}

function sortSalaryMonths(monthTabs) {
    if (!monthTabs) return;
    var buttons = Array.from(monthTabs.querySelectorAll('.salary-month-button'));
    if (!buttons.length) return;
    var quickOrder = { 'За 3 дня': 1, 'За 7 дней': 2, 'За 14 дней': 3 };
    var quick = buttons.filter(b => b.classList.contains('salary-quick-filter'))
        .sort((a, b) => (quickOrder[(a.textContent || '').trim()] || 99) - (quickOrder[(b.textContent || '').trim()] || 99));
    var months = buttons.filter(b => /^\d{4}-\d{2}$/.test((b.textContent || '').trim()))
        .sort((a, b) => (b.textContent || '').trim().localeCompare((a.textContent || '').trim()));
    var summary = buttons.filter(b => /^За\s+\d+\s+месяц/.test((b.textContent || '').trim()));
    var other = buttons.filter(b => quick.indexOf(b) < 0 && months.indexOf(b) < 0 && summary.indexOf(b) < 0);
    var ordered = quick.concat(months, summary, other);
    ordered.forEach(btn => monthTabs.appendChild(btn));
}

function initSkillsSearch(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.skills-search-content');
    if (!block) return;

    if (!block._data) {
        var salaryMonths = getRoleSalaryData(parentRole);
        var fullVacancies = getRoleVacancies(parentRole);
        var vacanciesSource = (fullVacancies && fullVacancies.length) ? fullVacancies : collectVacanciesFromSalaryMonths(salaryMonths);
        vacanciesSource = dedupeVacanciesById(vacanciesSource);
        vacanciesSource.forEach(v => {
            if (!v) return;
            if (!v._experience && v.experience) v._experience = v.experience;
            if (!v._status) v._status = v.archived_at ? 'Архивная' : 'Открытая';
        });
        var skills = computeSalarySkillsFromVacancies(vacanciesSource, 50);
        if (!block.dataset.skillsCountLogged) {
            var allSkills = computeSalarySkillsFromVacancies(vacanciesSource, 0);
            block.dataset.skillsCountLogged = '1';
        }
        var months = [];
        if (fullVacancies && fullVacancies.length) {
            fullVacancies.forEach(v => {
                if (!v || !v.published_at) return;
                var d = new Date(v.published_at);
                if (isNaN(d)) return;
                var m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                months.push(m);
            });
        } else {
            months = (salaryMonths || []).map(m => m.month).filter(m => m && !isSummaryMonth(m));
        }
        months = Array.from(new Set(months)).sort();
        var totalMonths = months.length;
        var periodAllLabel = totalMonths ? formatMonthTitle(totalMonths) : 'За все время';
        var monthsDesc = months.slice().sort().reverse();
        var lastMonth = monthsDesc.length ? monthsDesc[0] : null;
        var prevMonths = monthsDesc.length > 1 ? monthsDesc.slice(1) : [];
        var periodItems = [
            { key: 'd3', label: 'За 3 дня', month: 'last_3' },
            { key: 'd7', label: 'За 7 дней', month: 'last_7' },
            { key: 'd14', label: 'За 14 дней', month: 'last_14' }
        ];
        if (lastMonth) periodItems.push({ key: 'm_last', label: lastMonth, month: lastMonth });
        prevMonths.forEach((m, i) => periodItems.push({ key: 'm_prev_' + (i + 1), label: m, month: m }));
        periodItems.push({ key: 'all', label: periodAllLabel, month: null });
        block._data = {
            vacancies: vacanciesSource,
            skills: skills,
            salaryMonths: salaryMonths,
            periodItems: periodItems,
            fullVacancies: (fullVacancies && fullVacancies.length) ? true : false
        };
    }

    var periodDropdown = block.querySelector('.skills-search-dropdown[data-filter="period"]');
    if (periodDropdown && !periodDropdown.dataset.ready) {
        var items = (block._data && block._data.periodItems) ? block._data.periodItems : [];
        var monthItems = items.filter(p => p.month).map(p => ({ value: p.month, label: p.label }));
        renderSkillsSearchDropdown(periodDropdown, monthItems, 'Период', periodAllLabel, true, true);
        periodDropdown.dataset.ready = '1';
        block.dataset.period = 'all';
    }

    var expDropdown = block.querySelector('.skills-search-dropdown[data-filter="exp"]');
    if (expDropdown && !expDropdown.dataset.ready) {
        var expSet = new Set();
        if (block._data && block._data.fullVacancies) {
            (block._data.vacancies || []).forEach(v => {
                var expName = v && (v._experience || v.experience);
                if (expName) expSet.add(expName);
            });
        } else {
            (block._data && block._data.salaryMonths || []).forEach(m => {
                if (!m || !m.month || isSummaryMonth(m.month)) return;
                (m.experiences || []).forEach(exp => {
                    if (exp && exp.experience) expSet.add(exp.experience);
                });
            });
        }
        var expOrder = getExperienceOrder();
        var expList = Array.from(expSet);
        expList.sort((a, b) => (expOrder[normalizeExperience(a)] || 99) - (expOrder[normalizeExperience(b)] || 99));
        renderSkillsSearchDropdown(expDropdown, expList.map(x => ({ value: x, label: x })), 'Опыт', 'Все', false, true);
        expDropdown.dataset.ready = '1';
        block.dataset.exp = 'all';
    }

    var statusDropdown = block.querySelector('.skills-search-dropdown[data-filter="status"]');
    if (statusDropdown && !statusDropdown.dataset.ready) {
        var statusItems = [
            { value: 'Открытая', label: 'Открытая' },
            { value: 'Архивная', label: 'Архивная' }
        ];
        renderSkillsSearchDropdown(statusDropdown, statusItems, 'Статус', 'Все', false, true);
        statusDropdown.dataset.ready = '1';
        block.dataset.status = '\u041e\u0442\u043a\u0440\u044b\u0442\u0430\u044f';
    }

    var currencyDropdown = block.querySelector('.skills-search-dropdown[data-filter="currency"]');
    if (currencyDropdown && !currencyDropdown.dataset.ready) {
        var currItems = [
            { value: 'rur', label: 'RUR' },
            { value: 'usd', label: 'USD' },
            { value: 'eur', label: 'EUR' },
            { value: 'other', label: 'Другая' },
            { value: 'none', label: 'Не заполнена' }
        ];
        renderSkillsSearchDropdown(currencyDropdown, currItems, 'Валюта', 'Все', false, true);
        currencyDropdown.dataset.ready = '1';
        block.dataset.currency = 'all';
        setSkillsSearchDropdownValue(currencyDropdown, 'all');
    }

    var countryDropdown = block.querySelector('.skills-search-dropdown[data-filter="country"]');
    if (countryDropdown && !countryDropdown.dataset.ready) {
        var countryItems = [
            { value: 'none', label: '\u041d\u0435 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0430' },
            { value: 'ru', label: '\u0420\u043e\u0441\u0441\u0438\u044f' },
            { value: 'not_ru', label: '\u041d\u0435 \u0420\u043e\u0441\u0441\u0438\u044f' }
        ];
        renderSkillsSearchDropdown(countryDropdown, countryItems, '\u0421\u0442\u0440\u0430\u043d\u0430', '\u0412\u0441\u0435', false, true);
        countryDropdown.dataset.ready = '1';
        block.dataset.country = 'all';
        setSkillsSearchDropdownValue(countryDropdown, 'all');
    }

    var sortDropdown = block.querySelector('.skills-search-dropdown[data-filter="sort"]');
    if (sortDropdown && !sortDropdown.dataset.ready) {
        var sortItems = [
            { value: 'count', label: 'По частоте' },
            { value: 'alpha', label: 'По алфавиту' }
        ];
        renderSkillsSearchDropdown(sortDropdown, sortItems, 'Сортировка', 'По частоте', false, false);
        sortDropdown.dataset.ready = '1';
        block.dataset.sort = 'count';
    }

    var logicDropdown = block.querySelector('.skills-search-dropdown[data-filter="logic"]');
    if (logicDropdown && !logicDropdown.dataset.ready) {
        var logicItems = [
            { value: 'or', label: 'OR' },
            { value: 'and', label: 'AND' }
        ];
        renderSkillsSearchDropdown(logicDropdown, logicItems, 'Логика', 'OR', false, false);
        logicDropdown.dataset.ready = '1';
        block.dataset.logic = 'or';
    }

    var buttonsWrap = block.querySelector('.skills-search-buttons');
    if (buttonsWrap && !buttonsWrap.dataset.ready) {
        renderSkillsSearchButtons(block, (block._data && block._data.skills) ? block._data.skills : []);
        buttonsWrap.dataset.ready = '1';
    }

    var saved = getSkillsSearchState(block);
    if (saved) {
        applySkillsSearchState(block, saved);
    } else {
        var labels = getExperienceLabels();
        if (periodDropdown) {
            setSkillsSearchDropdownValue(periodDropdown, 'last_3');
            block.dataset.period = 'last_3';
        }
        if (statusDropdown) {
            setSkillsSearchDropdownValue(statusDropdown, 'Открытая');
            block.dataset.status = 'Открытая';
        }
        if (expDropdown) {
            var wantedExp = [labels.threeToSix, labels.sixPlus];
            var availableExp = wantedExp.filter(function(v) {
                return !!expDropdown.querySelector('.skills-search-dropdown-item[data-value="' + v + '"]');
            });
            setSkillsSearchDropdownMulti(expDropdown, availableExp);
        }
    }

    var currentPeriod = block.dataset.period || 'all';
    applySkillsSearchPeriod(block, currentPeriod);
}

function renderSkillsSearchButtons(block, skillsList) {
    var buttonsWrap = block.querySelector('.skills-search-buttons');
    if (!buttonsWrap) return;
    var sortMode = getSkillsSearchFilterValue(block, 'sort');
    var list = (skillsList || []).slice().map(function(s) {
        var displaySkill = registerSkillDisplayName(s.skill);
        return Object.assign({}, s, { skill: displaySkill });
    });
    if (sortMode === 'alpha') {
        list.sort((a, b) => a.skill.localeCompare(b.skill));
    }
    if (!list.length) {
        buttonsWrap.innerHTML = '<div class="skills-search-empty">Нет навыков для роли</div>';
        return;
    }
    buttonsWrap.innerHTML = list.map(s => (
        '<button class="skills-search-skill" type="button" data-skill="' + escapeHtml(s.skill) + '">' +
            escapeHtml(s.skill) +
            '<span class="skills-search-count">' + s.count + '</span>' +
        '</button>'
    )).join('');
}
function renderSkillsSearchDropdown(dropdown, items, label, allLabel, allAtEnd, includeAll) {
    if (!dropdown) return;
    var list = (items || []).slice();
    var allItem = { value: 'all', label: allLabel || 'Все' };
    if (includeAll !== false) {
        list = allAtEnd ? list.concat([allItem]) : [allItem].concat(list);
    }
    var menu = dropdown.querySelector('.skills-search-dropdown-menu');
    if (!menu) return;
    menu.innerHTML = list.map(item => (
        '<button class="skills-search-dropdown-item" type="button" data-value="' + escapeHtml(item.value) + '">' +
            escapeHtml(item.label) +
        '</button>'
    )).join('');
    var btn = dropdown.querySelector('.skills-search-dropdown-btn');
    if (btn) {
        var firstLabel = allLabel || (list[0] ? list[0].label : 'Все');
        btn.dataset.value = includeAll === false ? (list[0] ? list[0].value : '') : 'all';
        btn.textContent = label ? (label + ': ' + firstLabel) : firstLabel;
    }
    dropdown.dataset.label = label || '';
    if (dropdown.dataset.multi === '1') {
        dropdown.dataset.values = '[]';
        var itemsEls = dropdown.querySelectorAll('.skills-search-dropdown-item');
        itemsEls.forEach(it => {
            it.classList.toggle('active', (it.dataset.value || 'all') === 'all');
        });
    }
}
function getSkillsSearchFilterValue(block, filterName) {
    var dropdown = block.querySelector('.skills-search-dropdown[data-filter="' + filterName + '"]');
    if (!dropdown) return 'all';
    var btn = dropdown.querySelector('.skills-search-dropdown-btn');
    return btn ? (btn.dataset.value || 'all') : 'all';
}

function applySkillsSearchPeriod(block, period) {
    if (!block) return;
    var target = period || 'all';
    block.dataset.period = target;
    var periodTabs = block.querySelectorAll('.skills-search-period-button');
    periodTabs.forEach(btn => {
        var isActive = (btn.dataset.period || 'all') === target;
        if (isActive) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    updateSkillsSearchData(block);
}

function updateSkillsSearchData(block) {
    if (!block || !block._data) return;
    var period = block.dataset.period || 'all';
    var months = block._data.salaryMonths || [];
    var baseVacancies;
    if (block._data.fullVacancies) {
        baseVacancies = (block._data.vacancies || []).slice();
        if (period && period.indexOf('last_') === 0) {
            var days = Number(period.replace('last_', '')) || 0;
            if (days > 0) {
                var maxDate = null;
                baseVacancies.forEach(v => {
                    if (!v || !v.published_at) return;
                    var d = new Date(v.published_at);
                    if (isNaN(d)) return;
                    if (!maxDate || d > maxDate) maxDate = d;
                });
                if (maxDate) {
                    var cutoff = new Date(maxDate.getTime() - days * 24 * 60 * 60 * 1000);
                    baseVacancies = baseVacancies.filter(v => {
                        if (!v || !v.published_at) return false;
                        var d = new Date(v.published_at);
                        return !isNaN(d) && d >= cutoff;
                    });
                }
            }
        } else if (period && period !== 'all') {
            baseVacancies = baseVacancies.filter(v => {
                if (!v || !v.published_at) return false;
                var d = new Date(v.published_at);
                if (isNaN(d)) return false;
                var m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                return m === period;
            });
        }
    } else if (period && period.indexOf('last_') === 0) {
        baseVacancies = collectVacanciesWithMetaFromSalaryMonths(months, null);
        var days = Number(period.replace('last_', '')) || 0;
        if (days > 0) {
            var maxDate = null;
            baseVacancies.forEach(v => {
                if (!v || !v.published_at) return;
                var d = new Date(v.published_at);
                if (isNaN(d)) return;
                if (!maxDate || d > maxDate) maxDate = d;
            });
            if (maxDate) {
                var cutoff = new Date(maxDate.getTime() - days * 24 * 60 * 60 * 1000);
                baseVacancies = baseVacancies.filter(v => {
                    if (!v || !v.published_at) return false;
                    var d = new Date(v.published_at);
                    return !isNaN(d) && d >= cutoff;
                });
            }
        }
    } else {
        baseVacancies = collectVacanciesWithMetaFromSalaryMonths(months, period === 'all' ? null : period);
    }
    baseVacancies = dedupeVacanciesById(baseVacancies);

    var expVal = getSkillsSearchFilterValue(block, 'exp');
    var expVals = [];
    var expDd = block.querySelector('.skills-search-dropdown[data-filter="exp"]');
    if (expDd && expDd.dataset.multi === '1') {
        try {
            expVals = JSON.parse(expDd.dataset.values || '[]');
        } catch (_e) {
            expVals = [];
        }
    }
    var statusVal = getSkillsSearchFilterValue(block, 'status');
    var countryVal = getSkillsSearchFilterValue(block, 'country');
    var currencyVal = getSkillsSearchFilterValue(block, 'currency');
    var currencyDd = block.querySelector('.skills-search-dropdown[data-filter="currency"]');
    var currencyVals = [];
    if (currencyDd && currencyDd.dataset.multi === '1') {
        try {
            currencyVals = JSON.parse(currencyDd.dataset.values || '[]');
        } catch (_e) {
            currencyVals = [];
        }
    }
    var logicVal = getSkillsSearchFilterValue(block, 'logic') || 'or';

    var filteredBase = baseVacancies.filter(v => {
        if (!v) return false;
        if (expVal !== 'all') {
            var vExp = normalizeExperience(v._experience || '');
            if (expVals && expVals.length) {
                var expOk = expVals.some(x => normalizeExperience(x) === vExp);
                if (!expOk) return false;
            } else {
                var expNorm = normalizeExperience(expVal);
                if (vExp !== expNorm) return false;
            }
        }
        if (statusVal !== 'all') {
            var status = v._status || (v.archived_at ? '????????' : '????????');
            if (status !== statusVal) return false;
        }
        if (countryVal !== 'all') {
            var country = (v.country || '').trim();
            if (countryVal === 'none') {
                if (country) return false;
            } else if (countryVal === 'ru') {
                if (country !== '\u0420\u043e\u0441\u0441\u0438\u044f') return false;
            } else if (countryVal === 'not_ru') {
                if (!country || country === '\u0420\u043e\u0441\u0441\u0438\u044f') return false;
            } else if (country !== countryVal) {
                return false;
            }
        }
          var selectedCurrencies = (currencyVals && currencyVals.length) ? currencyVals : null;
          if (selectedCurrencies && selectedCurrencies.length) {
              var currRaw = v.currency;
              var currNorm = String(currRaw || '').trim().toUpperCase();
              var isCurrencyEmpty = !currNorm || currNorm === '—' || currNorm === '-';
              var match = false;
              selectedCurrencies.forEach(sel => {
                  var selNorm = String(sel || '').trim().toLowerCase();
                  if (selNorm === 'rur' && (currNorm === 'RUR' || currNorm === 'RUB')) match = true;
                  else if (selNorm === 'usd' && currNorm === 'USD') match = true;
                  else if (selNorm === 'eur' && currNorm === 'EUR') match = true;
                  else if (selNorm === 'other') {
                      if (!isCurrencyEmpty && currNorm !== 'RUR' && currNorm !== 'RUB' && currNorm !== 'USD' && currNorm !== 'EUR') match = true;
                  } else if (selNorm === 'none' && isCurrencyEmpty) match = true;
              });
              if (!match) return false;
          } else if (currencyVal !== 'all') {
              var currRaw2 = v.currency;
              if (currRaw2 !== currencyVal) return false;
          }
          return true;
      });

    block._data.currentVacancies = filteredBase;
    var skills = computeSalarySkillsFromVacancies(filteredBase, 50);
    block._data.skills = skills;

    var selected = Array.from(block.querySelectorAll('.skills-search-skill.active'))
        .map(btn => normalizeSkillName(btn.dataset.skill || btn.textContent));
    var excluded = Array.from(block.querySelectorAll('.skills-search-skill.excluded'))
        .map(btn => normalizeSkillName(btn.dataset.skill || btn.textContent));
    renderSkillsSearchButtons(block, skills);
    if (selected.length) {
        var btns = block.querySelectorAll('.skills-search-skill');
        btns.forEach(btn => {
            var key = normalizeSkillName(btn.dataset.skill || btn.textContent);
            if (selected.indexOf(key) >= 0) btn.classList.add('active');
        });
    }
    if (excluded.length) {
        var btns2 = block.querySelectorAll('.skills-search-skill');
        btns2.forEach(btn => {
            var key = normalizeSkillName(btn.dataset.skill || btn.textContent);
            if (excluded.indexOf(key) >= 0) btn.classList.add('excluded');
        });
    }

    updateSkillsSearchResults(block);
}

function updateSkillsSearchResults(block) {
    if (!block) return;
    var results = block.querySelector('.skills-search-results');
    if (!results) return;

    var allVacancies = (block._data && block._data.vacancies) ? block._data.vacancies : [];

    var selected = Array.from(block.querySelectorAll('.skills-search-skill.active'))
        .map(btn => normalizeSkillName(btn.dataset.skill || btn.textContent));
    var excluded = Array.from(block.querySelectorAll('.skills-search-skill.excluded'))
        .map(btn => normalizeSkillName(btn.dataset.skill || btn.textContent));

    if (!selected.length && !excluded.length) {
        var baseList = (block._data && block._data.currentVacancies) ? block._data.currentVacancies : allVacancies;
        var summary = '<div class="skills-search-summary">Найдено вакансий: ' + baseList.length + '</div>';
        results.innerHTML = summary + buildVacancyTableHtml(baseList);
        updateSkillsSearchSummaryLine(block);
        saveSkillsSearchState(block);
        return;
    }

    var vacancies = (block._data && block._data.currentVacancies) ? block._data.currentVacancies : allVacancies;
    var logicVal = getSkillsSearchFilterValue(block, 'logic') || 'or';
    var filtered = filterVacanciesBySkills(vacancies, selected, excluded, logicVal);
    var summary = '<div class="skills-search-summary">Найдено вакансий: ' + filtered.length + '</div>';
    results.innerHTML = summary + buildVacancyTableHtml(filtered);
    updateSkillsSearchSummaryLine(block);
    saveSkillsSearchState(block);
}

function updateSkillsSearchSummaryLine(block) {
    var summary = block.querySelector('.skills-search-summary-line');
    if (!summary) return;
    var selected = Array.from(block.querySelectorAll('.skills-search-skill.active'))
        .map(b => (b.dataset.skill || b.textContent || '').trim());
    var excluded = Array.from(block.querySelectorAll('.skills-search-skill.excluded'))
        .map(b => (b.dataset.skill || b.textContent || '').trim());
    if (!selected.length && !excluded.length) {
        summary.textContent = 'Навыки не выбраны';
        return;
    }
    function buildGroup(label, items, mode) {
        var buttons = items.map(s => (
            '<button class="skills-search-summary-skill ' + mode + '" type="button" data-mode="' + mode + '" data-skill="' + escapeHtml(s) + '">' +
                '<span class="skills-search-summary-skill-label">' + escapeHtml(s) + '</span>' +
                '<span class="skills-search-summary-remove" aria-hidden="true">×</span>' +
            '</button>'
        )).join('');
        return '<span class="skills-search-summary-group">' +
            '<span class="skills-search-summary-label">' + escapeHtml(label) + ':</span>' +
            buttons +
        '</span>';
    }
    var html = '';
    if (selected.length) html += buildGroup('Включено', selected, 'include');
    if (selected.length && excluded.length) html += '<span class="skills-search-summary-sep">·</span>';
    if (excluded.length) html += buildGroup('Исключено', excluded, 'exclude');
    summary.innerHTML = html;
}

function getSkillsSearchState(block) {
    return uiState.skills_search_global || null;
}
function saveSkillsSearchState(block) {
    var expVals = getSkillsSearchFilterValue(block, 'exp');
    var currencyVals = [];
    var currencyDd = block.querySelector('.skills-search-dropdown[data-filter="currency"]');
    if (currencyDd && currencyDd.dataset.multi === '1') {
        try {
            currencyVals = JSON.parse(currencyDd.dataset.values || '[]');
        } catch (_e) {
            currencyVals = [];
        }
    }
    var state = {
        period: block.dataset.period || 'all',
        exp: (!expVals || expVals === 'all') ? [] : (Array.isArray(expVals) ? expVals.filter(v => v && v !== 'all') : [expVals]),
        status: getSkillsSearchFilterValue(block, 'status') || 'all',
        country: getSkillsSearchFilterValue(block, 'country') || 'all',
        currency: (currencyVals && currencyVals.length) ? currencyVals : 'all',
        sort: getSkillsSearchFilterValue(block, 'sort') || 'count',
        logic: getSkillsSearchFilterValue(block, 'logic') || 'or',
        includeSkills: Array.from(block.querySelectorAll('.skills-search-skill.active')).map(b => b.dataset.skill || b.textContent.trim()),
        excludeSkills: Array.from(block.querySelectorAll('.skills-search-skill.excluded')).map(b => b.dataset.skill || b.textContent.trim()),
        collapsed: block.querySelector('.skills-search-panel') ? block.querySelector('.skills-search-panel').classList.contains('collapsed') : false
    };
    uiState.skills_search_global = state;
}
function applySkillsSearchState(block, state) {
    if (!state) return;
    var periodDd = block.querySelector('.skills-search-dropdown[data-filter="period"]');
    var expDd = block.querySelector('.skills-search-dropdown[data-filter="exp"]');
    var statusDd = block.querySelector('.skills-search-dropdown[data-filter="status"]');
    var countryDd = block.querySelector('.skills-search-dropdown[data-filter="country"]');
    var currencyDd = block.querySelector('.skills-search-dropdown[data-filter="currency"]');
    var sortDd = block.querySelector('.skills-search-dropdown[data-filter="sort"]');
    var logicDd = block.querySelector('.skills-search-dropdown[data-filter="logic"]');

    if (periodDd) setSkillsSearchDropdownValue(periodDd, state.period || 'all');
    if (statusDd) setSkillsSearchDropdownValue(statusDd, state.status || '\u041e\u0442\u043a\u0440\u044b\u0442\u0430\u044f');
    if (countryDd) setSkillsSearchDropdownValue(countryDd, state.country || 'all');
    if (currencyDd) {
        if (Array.isArray(state.currency)) setSkillsSearchDropdownMulti(currencyDd, state.currency);
        else setSkillsSearchDropdownValue(currencyDd, state.currency || 'all');
    }
    if (sortDd) setSkillsSearchDropdownValue(sortDd, state.sort || 'count');
    if (logicDd) setSkillsSearchDropdownValue(logicDd, state.logic || 'or');
    if (expDd && Array.isArray(state.exp)) {
        if (!state.exp.length || (state.exp.length === 1 && state.exp[0] === 'all')) setSkillsSearchDropdownMulti(expDd, []);
        else setSkillsSearchDropdownMulti(expDd, state.exp.filter(v => v && v !== 'all'));
    }

    if (state.collapsed) {
        var panel = block.querySelector('.skills-search-panel');
        var toggle = block.querySelector('.skills-search-toggle');
        if (panel && toggle) {
            panel.classList.add('collapsed');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '&#9660;';
        }
    }

        var include = (state.includeSkills || []).map(normalizeSkillName);
        var exclude = (state.excludeSkills || []).map(normalizeSkillName);
        var btns = block.querySelectorAll('.skills-search-skill');
        btns.forEach(btn => {
            var key = normalizeSkillName(btn.dataset.skill || btn.textContent);
            if (include.indexOf(key) >= 0) btn.classList.add('active');
            if (exclude.indexOf(key) >= 0) btn.classList.add('excluded');
        });
    block.dataset.period = state.period || 'all';
}
function setSkillsSearchDropdownValue(dropdown, value) {
    var btn = dropdown.querySelector('.skills-search-dropdown-btn');
    if (!btn) return;
    var label = dropdown.dataset.label || '';
    var item = dropdown.querySelector('.skills-search-dropdown-item[data-value="' + value + '"]');
    var text = item ? item.textContent : 'Все';
    btn.dataset.value = value;
    btn.textContent = label ? (label + ': ' + text) : text;
}
function setSkillsSearchDropdownMulti(dropdown, values) {
    var vals = (values || []).slice();
    dropdown.dataset.values = JSON.stringify(vals);
    var items = dropdown.querySelectorAll('.skills-search-dropdown-item');
    items.forEach(it => {
        var v = it.dataset.value || 'all';
        if (v === 'all') it.classList.toggle('active', vals.length === 0);
        else it.classList.toggle('active', vals.indexOf(v) >= 0);
    });
    var btn = dropdown.querySelector('.skills-search-dropdown-btn');
    var label = dropdown.dataset.label || '';
    if (btn) {
        if (!vals.length) {
            btn.dataset.value = 'all';
            btn.textContent = label ? (label + ': Все') : 'Все';
        } else if (vals.length <= 2) {
            btn.dataset.value = vals.join(',');
            btn.textContent = label ? (label + ': ' + vals.join(', ')) : vals.join(', ');
        } else {
            btn.dataset.value = vals.join(',');
            btn.textContent = label ? (label + ': ' + vals.length) : String(vals.length);
        }
    }
}

function buildActivityTableHtml(entries) {
    var rows = (entries || []).map(function(e) {
        var cls = e.is_max_archived ? ' class="max-archived"' : '';
        var avg = (e.avg_age !== null && e.avg_age !== undefined) ? Number(e.avg_age).toFixed(1) : '—';
        return '<tr' + cls + '>' +
            '<td>' + escapeHtml(e.experience) + '</td>' +
            '<td>' + (e.total || 0) + '</td>' +
            '<td>' + (e.archived || 0) + '</td>' +
            '<td>' + (e.active || 0) + '</td>' +
            '<td>' + avg + '</td>' +
        '</tr>';
    }).join('');
    return '<table>' +
        '<thead><tr><th>Опыт</th><th>Всего</th><th>Архивных</th><th>Активных</th><th>Ср. возраст (дни)</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
    '</table>';
}

function buildActivityBlock(parentRole, blockId, label, entries) {
    var block = document.createElement('div');
    block.id = blockId;
    block.className = 'month-content activity-only';
    block.dataset.month = label;
    block.dataset.entries = JSON.stringify(entries || []);
    block._data = { entries: entries || [], month: label };
    block.innerHTML =
        '<div class="view-toggle-horizontal">' +
            '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">⊞</button>' +
            '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">☷</button>' +
            '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
        '</div>' +
        '<div class="analysis-flex view-mode-container" data-analysis="activity">' +
            '<div class="table-container">' +
                buildActivityTableHtml(entries || []) +
            '</div>' +
            '<div class="plotly-graph" id="activity-graph-' + blockId.replace('month-', '') + '"></div>' +
        '</div>';

    var firstMonth = parentRole.querySelector('.month-content.activity-only');
    if (firstMonth) parentRole.insertBefore(block, firstMonth);
    else parentRole.appendChild(block);
    return block;
}

function aggregateActivityEntries(entries) {
    var expOrder = getExperienceOrder();
    var labels = getExperienceLabels();
    var expMap = {};
    (entries || []).forEach(function(e) {
        var expNorm = normalizeExperience(e.experience);
        if (!expNorm || expNorm === labels.total) return;
        var bucket = expMap[expNorm] || { experience: expNorm, total: 0, archived: 0, active: 0, ageSum: 0, ageWeight: 0 };
        bucket.total += e.total || 0;
        bucket.archived += e.archived || 0;
        bucket.active += e.active || 0;
        if (e.avg_age !== null && e.avg_age !== undefined) {
            var weight = e.total || 0;
            bucket.ageSum += Number(e.avg_age) * weight;
            bucket.ageWeight += weight;
        }
        expMap[expNorm] = bucket;
    });

    var rows = Object.values(expMap).map(function(b) {
        return {
            experience: b.experience,
            total: b.total,
            archived: b.archived,
            active: b.active,
            avg_age: b.ageWeight ? (b.ageSum / b.ageWeight) : null
        };
    });
    rows.sort(function(a, b) { return (expOrder[a.experience] || 99) - (expOrder[b.experience] || 99); });

    var maxArchived = 0;
    var maxAge = null;
    rows.forEach(function(e) {
        if (e.archived > maxArchived) maxArchived = e.archived;
        if (e.avg_age !== null && e.avg_age !== undefined) {
            if (maxAge === null || e.avg_age > maxAge) maxAge = e.avg_age;
        }
    });
    rows.forEach(function(e) {
        e.is_max_archived = e.archived === maxArchived;
        e.is_max_age = (maxAge !== null && e.avg_age === maxAge);
    });

    var totalEntry = {
        experience: labels.total,
        total: rows.reduce((s, e) => s + (e.total || 0), 0),
        archived: rows.reduce((s, e) => s + (e.archived || 0), 0),
        active: rows.reduce((s, e) => s + (e.active || 0), 0),
        avg_age: null,
        is_max_archived: false,
        is_max_age: false
    };
    var ageVals = rows.map(e => e.avg_age).filter(v => v !== null && v !== undefined);
    if (ageVals.length) {
        totalEntry.avg_age = ageVals.reduce((s, v) => s + v, 0) / ageVals.length;
    }
    rows.push(totalEntry);

    if (!rows.length) {
        return [totalEntry];
    }
    return rows;
}

function computeActivityEntriesFromVacancies(vacancies) {
    var expOrder = getExperienceOrder();
    var labels = getExperienceLabels();
    var expMap = {};
    (vacancies || []).forEach(function(v) {
        if (!v) return;
        var exp = normalizeExperience(v._experience || v.experience || '');
        if (!exp) exp = 'Не указан';
        var bucket = expMap[exp] || { experience: exp, total: 0, archived: 0, active: 0, ageSum: 0, ageCount: 0 };
        bucket.total += 1;

        var status = String(v._status || '').toLowerCase();
        var isArchived = status.indexOf('архив') >= 0 || !!v.archived_at;
        if (isArchived) bucket.archived += 1;
        else bucket.active += 1;

        if (isArchived && v.published_at && v.archived_at) {
            var pub = new Date(v.published_at);
            var arch = new Date(v.archived_at);
            if (!isNaN(pub) && !isNaN(arch)) {
                var diffMs = arch - pub;
                if (diffMs >= 0) {
                    bucket.ageSum += diffMs / (1000 * 60 * 60 * 24);
                    bucket.ageCount += 1;
                }
            }
        }
        expMap[exp] = bucket;
    });

    var rows = Object.values(expMap).map(function(b) {
        return {
            experience: b.experience,
            total: b.total,
            archived: b.archived,
            active: b.active,
            avg_age: b.ageCount ? (b.ageSum / b.ageCount) : null
        };
    });
    rows.sort(function(a, b) { return (expOrder[a.experience] || 99) - (expOrder[b.experience] || 99); });

    var maxArchived = 0;
    var maxAge = null;
    rows.forEach(function(e) {
        if (e.archived > maxArchived) maxArchived = e.archived;
        if (e.avg_age !== null && e.avg_age !== undefined) {
            if (maxAge === null || e.avg_age > maxAge) maxAge = e.avg_age;
        }
    });
    rows.forEach(function(e) {
        e.is_max_archived = e.archived === maxArchived;
        e.is_max_age = (maxAge !== null && e.avg_age === maxAge);
    });

    var totalEntry = {
        experience: labels.total,
        total: rows.reduce((s, e) => s + (e.total || 0), 0),
        archived: rows.reduce((s, e) => s + (e.archived || 0), 0),
        active: rows.reduce((s, e) => s + (e.active || 0), 0),
        avg_age: null,
        is_max_archived: false,
        is_max_age: false
    };
    var ageVals = rows.map(e => e.avg_age).filter(v => v !== null && v !== undefined);
    if (ageVals.length) {
        totalEntry.avg_age = ageVals.reduce((s, v) => s + v, 0) / ageVals.length;
    }
    rows.push(totalEntry);

    if (!rows.length) {
        return [totalEntry];
    }
    return rows;
}

function ensureActivityQuickFilters(parentRole, controlRow) {
    if (!parentRole || parentRole.dataset.activityFiltersReady === '1') return;
    var monthTabs = parentRole.querySelector('.tabs.month-tabs.activity-only.activity-month-tabs')
        || parentRole.querySelector('.tabs.month-tabs.activity-only:not(.activity-filter-tabs)');
    if (!monthTabs) return;
    monthTabs.classList.add('activity-month-tabs');
    var filterTabs = parentRole.querySelector('.activity-filter-tabs');
    if (filterTabs && filterTabs.parentElement) {
        filterTabs.remove();
    }

    var monthBlocks = Array.from(parentRole.querySelectorAll('.month-content.activity-only'));
    var monthByLabel = {};
    monthBlocks.forEach(function(b) {
        if (b.dataset.month) monthByLabel[b.dataset.month] = b;
    });

    var realMonthBlocks = monthBlocks.filter(function(b) {
        return b.dataset.month && /^\d{4}-\d{2}$/.test(b.dataset.month);
    }).sort(function(a, b) {
        return a.dataset.month.localeCompare(b.dataset.month);
    });

    var summaryBlock = monthBlocks.find(function(b) {
        return isSummaryMonth(b.dataset.month);
    }) || null;

    function addFilter(label, block, suffix, entries) {
        var target = block;
        if (!target) {
            target = buildActivityBlock(parentRole, 'month-' + parentRole.id + '-filter-' + suffix, label, entries || []);
            monthByLabel[label] = target;
        }
        var btn = document.createElement('button');
        btn.className = 'tab-button month-button activity-filter-button activity-quick-filter';
        btn.textContent = label;
        btn.addEventListener('click', function(e) {
            openMonthTab(e, target.id);
        });
        monthTabs.insertBefore(btn, monthTabs.firstChild);
    }

    var vacancies = getRoleVacancies(parentRole);
    function filterVacanciesByDays(days) {
        var now = new Date();
        var since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return (vacancies || []).filter(function(v) {
            if (!v || !v.published_at) return false;
            var d = new Date(v.published_at);
            return !isNaN(d) && d >= since;
        });
    }

    var entries3 = computeActivityEntriesFromVacancies(filterVacanciesByDays(3));
    var entries7 = computeActivityEntriesFromVacancies(filterVacanciesByDays(7));
    var entries14 = computeActivityEntriesFromVacancies(filterVacanciesByDays(14));
    addFilter('За 14 дней', monthByLabel['За 14 дней'], '14d', entries14);
    addFilter('За 7 дней', monthByLabel['За 7 дней'], '7d', entries7);
    addFilter('За 3 дня', monthByLabel['За 3 дня'], '3d', entries3);

    var emptyEntries = computeActivityEntriesFromVacancies([]);
    var summaryLabel = null;
    var summaryTarget = summaryBlock;
    var summaryEntries = summaryBlock ? parseJsonDataset(summaryBlock, 'entries', []) : null;
    if (!summaryTarget) {
        var allEntriesRaw = [];
        realMonthBlocks.forEach(function(b) {
            allEntriesRaw = allEntriesRaw.concat(parseJsonDataset(b, 'entries', []));
        });
        summaryEntries = allEntriesRaw.length ? aggregateActivityEntries(allEntriesRaw) : emptyEntries;
        summaryLabel = formatMonthTitle(realMonthBlocks.length);
        summaryTarget = buildActivityBlock(parentRole, 'month-' + parentRole.id + '-filter-summary', summaryLabel, summaryEntries);
    } else {
        summaryLabel = summaryTarget.dataset.month;
    }

    var summaryBtn = Array.from(monthTabs.querySelectorAll('.month-button')).find(function(btn) {
        return isSummaryMonth((btn.textContent || '').trim());
    });
    if (!summaryBtn) {
        summaryBtn = document.createElement('button');
        summaryBtn.className = 'tab-button month-button';
        summaryBtn.textContent = summaryLabel;
        summaryBtn.addEventListener('click', function(e) {
            openMonthTab(e, summaryTarget.id);
        });
        monthTabs.appendChild(summaryBtn);
    } else {
        monthTabs.appendChild(summaryBtn);
    }

    parentRole.dataset.activityFiltersReady = '1';
}

function normalizeActivityControls(parentRole) {
    if (!parentRole) return;
    var monthTabs = parentRole.querySelector('.tabs.month-tabs.activity-only');
    if (!monthTabs) return;

    if (!monthTabs.classList.contains('activity-month-tabs') && !monthTabs.classList.contains('activity-filter-tabs')) {
        monthTabs.classList.add('activity-month-tabs');
    }

    var controlRow = parentRole.querySelector('.activity-control-row');
    if (!controlRow) {
        controlRow = document.createElement('div');
        controlRow.className = 'activity-control-row activity-only';
        monthTabs.parentElement.insertBefore(controlRow, monthTabs);
    }
    controlRow.classList.add('skills-control-row');
    if (monthTabs.parentElement !== controlRow) controlRow.appendChild(monthTabs);

    ensureActivityQuickFilters(parentRole, controlRow);

    sortActivityMonthsNewestFirst(parentRole, monthTabs);

    var inlineToggle = controlRow.querySelector('.activity-mode-toggle-inline');
    if (!inlineToggle) {
        inlineToggle = document.createElement('div');
        inlineToggle.className = 'view-toggle-horizontal activity-mode-toggle-inline';
        inlineToggle.innerHTML =
            '<button class="view-mode-btn activity-inline-mode-btn" data-view="together" title="Вместе">⊞</button>' +
            '<button class="view-mode-btn activity-inline-mode-btn" data-view="table" title="Таблица">▦</button>' +
            '<button class="view-mode-btn activity-inline-mode-btn" data-view="graph" title="График">📊</button>';
        controlRow.appendChild(inlineToggle);
    }
    inlineToggle.classList.add('skills-mode-toggle-inline');
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
    updateViewToggleIcons(parentRole);
}

function sortActivityMonthsNewestFirst(parentRole, monthTabs) {
    if (!parentRole || !monthTabs || monthTabs.dataset.sorted === '1') return;
    var buttons = Array.from(monthTabs.querySelectorAll('.month-button'));
    if (!buttons.length) return;
    var quick = buttons.filter(b => b.classList.contains('activity-quick-filter'));
    var summary = buttons.filter(b => /^За\s+\d+\s+месяц/.test((b.textContent || '').trim()));
    var months = buttons.filter(b => /^\d{4}-\d{2}$/.test((b.textContent || '').trim()));
    var other = buttons.filter(b => quick.indexOf(b) < 0 && summary.indexOf(b) < 0 && months.indexOf(b) < 0);

    var quickOrder = { 'За 3 дня': 1, 'За 7 дней': 2, 'За 14 дней': 3 };
    quick.sort(function(a, b) {
        var am = (a.textContent || '').trim();
        var bm = (b.textContent || '').trim();
        return (quickOrder[am] || 99) - (quickOrder[bm] || 99);
    });

    months.sort(function(a, b) {
        var am = (a.textContent || '').trim();
        var bm = (b.textContent || '').trim();
        return bm.localeCompare(am);
    });

    var ordered = quick.concat(months, summary, other);
    ordered.forEach(function(btn) { monthTabs.appendChild(btn); });
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

        updateViewToggleIcons(section);
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

function normalizeSkillsMonthlyControls(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.skills-monthly-content');
    if (!block) return;
    var monthTabs = block.querySelector('.monthly-skills-month-tabs');
    if (!monthTabs) {
        updateViewToggleIcons(block);
        return;
    }

    var controlRow = block.querySelector('.skills-control-row');
    if (!controlRow) {
        controlRow = document.createElement('div');
        controlRow.className = 'skills-control-row';
        block.insertBefore(controlRow, monthTabs);
    }
    if (monthTabs.parentElement !== controlRow) controlRow.appendChild(monthTabs);

    ensureSkillsMonthlyQuickFilters(parentRole, block, monthTabs);
    sortSkillsMonthlyMonths(monthTabs);

    var expTabs = null;
    var monthBlocks = Array.from(block.querySelectorAll('.monthly-skills-month-content'));
    var visibleMonth = monthBlocks.find(m => (m.style.display || '') === 'block');
    if (visibleMonth) expTabs = visibleMonth.querySelector('.monthly-skills-exp-tabs');
    if (!expTabs) expTabs = block.querySelector('.monthly-skills-exp-tabs');
    if (expTabs) {
        var multiToggle = expTabs.querySelector('.skills-multi-toggle');
        if (!multiToggle) {
            multiToggle = document.createElement('label');
            multiToggle.className = 'skills-multi-toggle';
            multiToggle.innerHTML = '<input type="checkbox" class="skills-multi-toggle-input"> Мультивыбор';
            expTabs.appendChild(multiToggle);
        } else if (multiToggle.parentElement !== expTabs) {
            expTabs.appendChild(multiToggle);
        }
        var multiInput = multiToggle.querySelector('.skills-multi-toggle-input');
        if (!block.dataset.skillsMultiEnabled) block.dataset.skillsMultiEnabled = '0';
        multiInput.checked = block.dataset.skillsMultiEnabled === '1';
        if (!multiInput.dataset.bound) {
            multiInput.addEventListener('change', function() {
                block.dataset.skillsMultiEnabled = multiInput.checked ? '1' : '0';
                uiState.global_skills_multi_enabled = multiInput.checked;
                if (!multiInput.checked) {
                    var visibleMonth = block.querySelector('.monthly-skills-month-content[style*="display: block"]');
                    if (!visibleMonth) return;
                    var role = block.closest('.role-content');
                    if (role) {
                        var stateKey = getStateKey(role.id, 'skills-monthly');
                        var savedState = uiState[stateKey] || {};
                        delete savedState.exp_list;
                        if (savedState.exp_by_month) {
                            Object.keys(savedState.exp_by_month).forEach(function(k) {
                                var bucket = savedState.exp_by_month[k];
                                if (bucket) delete bucket.exp_list;
                            });
                        }
                        uiState[stateKey] = savedState;
                    }
                    uiState.global_skills_exp_list = [];
                    var expButtons = visibleMonth.querySelectorAll('.monthly-skills-exp-button');
                    var active = Array.from(expButtons).filter(b => b.classList.contains('active'));
                    if (active.length > 1) {
                        active.slice(1).forEach(b => b.classList.remove('active'));
                        active[0].click();
                    }
                }
            });
            multiInput.dataset.bound = '1';
        }
    }

    var inlineToggle = controlRow.querySelector('.skills-mode-toggle-inline');
    if (!inlineToggle) {
        inlineToggle = document.createElement('div');
        inlineToggle.className = 'view-toggle-horizontal skills-mode-toggle-inline';
        inlineToggle.innerHTML =
            '<button class="view-mode-btn skills-inline-mode-btn" data-view="together" title="Вместе">⊞</button>' +
            '<button class="view-mode-btn skills-inline-mode-btn" data-view="table" title="Таблица">▦</button>' +
            '<button class="view-mode-btn skills-inline-mode-btn" data-view="graph" title="График">📊</button>';
        controlRow.appendChild(inlineToggle);
    }

    if (!inlineToggle.dataset.bound) {
        inlineToggle.addEventListener('click', function(e) {
            var btn = e.target.closest('.skills-inline-mode-btn');
            if (!btn) return;
            var view = btn.dataset.view || 'together';
            uiState.skills_monthly_view_mode = view;
            setActiveViewButton(inlineToggle.querySelectorAll('.skills-inline-mode-btn'), view);

            var visibleMonth = block.querySelector('.monthly-skills-month-content[style*="display: block"]');
            if (!visibleMonth) return;
            var visibleExp = visibleMonth.querySelector('.monthly-skills-exp-content[style*="display: block"]');
            if (!visibleExp) return;

            var monthBtns = visibleExp.querySelectorAll('.view-mode-btn');
            setActiveViewButton(monthBtns, view);
            var container = visibleExp.querySelector('.view-mode-container');
            applyViewMode(container, view);

            var expData = parseJsonDataset(visibleExp, 'exp', null);
            if (view !== 'table' && expData) {
                var graphId = 'skills-monthly-graph-' + visibleExp.id.replace('ms-exp-', '');
                buildHorizontalBarChart(graphId, expData.skills, expData.experience);
            }
            applySkillsModeSizing(container, view);
        });
        inlineToggle.dataset.bound = '1';
    }

    setActiveViewButton(inlineToggle.querySelectorAll('.skills-inline-mode-btn'), uiState.skills_monthly_view_mode || 'together');
    updateViewToggleIcons(block);
}

function aggregateSkillsExpData(expDivs, label) {
    var totalVac = 0;
    var skillMap = new Map();
    expDivs.forEach(function(div) {
        var expData = parseJsonDataset(div, 'exp', null) || (div._data && div._data.exp);
        if (!expData) return;
        totalVac += expData.total_vacancies || 0;
        (expData.skills || []).forEach(function(s) {
            registerSkillDisplayName(s.skill);
            var key = normalizeSkillName(s.skill);
            if (!key) return;
            skillMap.set(key, (skillMap.get(key) || 0) + (s.count || 0));
        });
    });
    var skills = Array.from(skillMap.entries()).map(function(pair) {
        var count = pair[1] || 0;
        return {
            skill: getSkillDisplayName(pair[0]),
            count: count,
            coverage: totalVac ? Math.round((count * 10000) / totalVac) / 100 : 0,
            rank: 0
        };
    });
    skills.sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
    skills = skills.slice(0, 15).map(function(s, i) { s.rank = i + 1; return s; });
    return { experience: label || 'Выбрано', total_vacancies: totalVac, skills: skills };
}

function renderSkillsExpContent(expDiv, expData) {
    if (!expDiv || !expData) return;
    expDiv.dataset.exp = JSON.stringify(expData);
    expDiv._data = { exp: expData };
    var tableWrap = expDiv.querySelector('.table-container');
    if (tableWrap) {
        var rows = (expData.skills || []).map(function(s) {
            var displaySkill = registerSkillDisplayName(s.skill);
            return '<tr><td>' + escapeHtml(displaySkill) + '</td><td>' + s.count + '</td><td>' + s.coverage + '%</td></tr>';
        }).join('');
        tableWrap.innerHTML =
            '<table>' +
                '<thead><tr><th>Навык</th><th>Упоминаний</th><th>% покрытия</th></tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
            '</table>' +
            '<p style="margin-top: 10px; color: var(--text-secondary);">Всего вакансий с навыками: ' + expData.total_vacancies + '</p>';
    }
}

function ensureSkillsMonthlyQuickFilters(parentRole, block, monthTabs) {
    if (!parentRole || !block || !monthTabs || block.dataset.skillsFiltersReady === '1') return;

    var vacancies = getRoleVacancies(parentRole);
    if (!vacancies || !vacancies.length) {
        var salaryMonths = getRoleSalaryData(parentRole);
        vacancies = collectVacanciesFromSalaryMonths(salaryMonths);
    }
    block.querySelectorAll('.monthly-skills-exp-content').forEach(function(expDiv) {
        var expData = (expDiv._data && expDiv._data.exp) ? expDiv._data.exp : parseJsonDataset(expDiv, 'exp', null);
        if (!expData || !Array.isArray(expData.skills)) return;
        expData.skills.forEach(function(s) {
            registerSkillDisplayName(s && s.skill ? s.skill : '');
        });
    });

    function filterVacanciesByDays(days) {
        var now = new Date();
        var since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        return (vacancies || []).filter(function(v) {
            if (!v || !v.published_at) return false;
            var d = new Date(v.published_at);
            return !isNaN(d) && d >= since;
        });
    }

    function buildSkillsMonthFromVacancies(list, label) {
        var labels = getExperienceLabels();
        var expMap = {};
        (list || []).forEach(function(v) {
            if (!v || !v.skills) return;
            var exp = normalizeExperience(v._experience || v.experience || '') || 'Не указан';
            var bucket = expMap[exp] || { experience: exp, total_vacancies: 0, skills: new Map() };
            bucket.total_vacancies += 1;
            String(v.skills).split(',').map(s => s.trim()).filter(Boolean).forEach(raw => {
                var key = normalizeSkillName(raw);
                if (!key) return;
                bucket.skills.set(key, (bucket.skills.get(key) || 0) + 1);
            });
            expMap[exp] = bucket;
        });

        var expOrder = getExperienceOrder();
        var exps = Object.values(expMap).map(function(b) {
            var skills = Array.from(b.skills.entries()).map(function(pair) {
                return { skill: getSkillDisplayName(pair[0]), count: pair[1], coverage: b.total_vacancies ? Math.round((pair[1] * 10000) / b.total_vacancies) / 100 : 0, rank: 0 };
            });
            skills.sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
            skills = skills.slice(0, 15).map(function(s, i) { s.rank = i + 1; return s; });
            return { experience: b.experience, total_vacancies: b.total_vacancies, skills: skills };
        });
        exps.sort((a, b) => (expOrder[normalizeExperience(a.experience)] || 99) - (expOrder[normalizeExperience(b.experience)] || 99));
        return { month: label, experiences: exps };
    }

    function buildSkillsMonthBlock(monthData, suffix) {
        var monthId = 'ms-month-' + parentRole.id + '-filter-' + suffix;
        if (document.getElementById(monthId)) return monthId;
        var monthDiv = document.createElement('div');
        monthDiv.id = monthId;
        monthDiv.className = 'monthly-skills-month-content';
        monthDiv.style.display = 'none';
        monthDiv.dataset.month = monthData.month;
        monthDiv.dataset.monthData = JSON.stringify(monthData);
        monthDiv._data = { month: monthData };

        var expTabs = document.createElement('div');
        expTabs.className = 'tabs monthly-skills-exp-tabs';
        expTabs.style.justifyContent = 'center';
        expTabs.style.marginTop = '5px';
        monthDiv.appendChild(expTabs);

        (monthData.experiences || []).forEach(function(exp, idx) {
            var expId = 'ms-exp-' + parentRole.id + '-filter-' + suffix + '-' + (idx + 1);
            var btn = document.createElement('button');
            btn.className = 'tab-button monthly-skills-exp-button';
            btn.textContent = exp.experience;
            btn.addEventListener('click', function(e) { openMonthlySkillsExpTab(e, expId); });
            expTabs.appendChild(btn);

            var expDiv = document.createElement('div');
            expDiv.id = expId;
            expDiv.className = 'monthly-skills-exp-content';
            expDiv.style.display = 'none';
            expDiv.dataset.exp = JSON.stringify(exp);
            expDiv._data = { exp: exp };

            expDiv.innerHTML =
                '<div class="view-toggle-horizontal">' +
                    '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">⊞</button>' +
                    '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">☷</button>' +
                    '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
                '</div>' +
                '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                    '<div class="table-container">' +
                        '<table>' +
                            '<thead><tr><th>Навык</th><th>Упоминаний</th><th>% покрытия</th></tr></thead>' +
                            '<tbody>' +
                                (exp.skills || []).map(s => (
                                    '<tr><td>' + escapeHtml(s.skill) + '</td><td>' + s.count + '</td><td>' + s.coverage + '%</td></tr>'
                                )).join('') +
                            '</tbody>' +
                        '</table>' +
                        '<p style="margin-top: 10px; color: var(--text-secondary);">Всего вакансий с навыками: ' + exp.total_vacancies + '</p>' +
                    '</div>' +
                    '<div class="plotly-graph" id="skills-monthly-graph-' + expId.replace('ms-exp-', '') + '"></div>' +
                '</div>';

            monthDiv.appendChild(expDiv);
        });

        block.appendChild(monthDiv);
        return monthId;
    }

    function addQuickButton(label, suffix, list) {
        var monthData = buildSkillsMonthFromVacancies(list, label);
        var monthId = buildSkillsMonthBlock(monthData, suffix);
        var btn = document.createElement('button');
        btn.className = 'tab-button monthly-skills-month-button skills-quick-filter';
        btn.textContent = label;
        btn.addEventListener('click', function(e) { openMonthlySkillsMonthTab(e, monthId); });
        monthTabs.insertBefore(btn, monthTabs.firstChild);
    }

    addQuickButton('За 14 дней', '14d', filterVacanciesByDays(14));
    addQuickButton('За 7 дней', '7d', filterVacanciesByDays(7));
    addQuickButton('За 3 дня', '3d', filterVacanciesByDays(3));

    block.dataset.skillsFiltersReady = '1';
}

function sortSkillsMonthlyMonths(monthTabs) {
    if (!monthTabs) return;
    var buttons = Array.from(monthTabs.querySelectorAll('.monthly-skills-month-button'));
    if (!buttons.length) return;
    var quickOrder = { 'За 3 дня': 1, 'За 7 дней': 2, 'За 14 дней': 3 };
    var quick = buttons.filter(b => b.classList.contains('skills-quick-filter'))
        .sort((a, b) => (quickOrder[(a.textContent || '').trim()] || 99) - (quickOrder[(b.textContent || '').trim()] || 99));
    var months = buttons.filter(b => /^\d{4}-\d{2}$/.test((b.textContent || '').trim()))
        .sort((a, b) => (b.textContent || '').trim().localeCompare((a.textContent || '').trim()));
    var summary = buttons.filter(b => /^За\s+\d+\s+месяц/.test((b.textContent || '').trim()));
    var other = buttons.filter(b => quick.indexOf(b) < 0 && months.indexOf(b) < 0 && summary.indexOf(b) < 0);
    var ordered = quick.concat(months, summary, other);
    ordered.forEach(btn => monthTabs.appendChild(btn));
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
        if (graph.__avgRurChartEl) Plotly.purge(graph.__avgRurChartEl);
        if (graph.__avgUsdChartEl) Plotly.purge(graph.__avgUsdChartEl);
        if (graph.__avgEurChartEl) Plotly.purge(graph.__avgEurChartEl);
        if (graph.__avgOtherChartEl) Plotly.purge(graph.__avgOtherChartEl);
        graph.__avgRurChartEl = null;
        graph.__avgUsdChartEl = null;
        graph.__avgEurChartEl = null;
        graph.__avgOtherChartEl = null;
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
        buckets[c.key] = {
            wRur: 0,
            sumRur: 0,
            wUsd: 0,
            sumUsd: 0,
            wEur: 0,
            sumEur: 0,
            wOther: 0,
            sumOther: 0
        };
    });

    function normalizeVal(v) {
        return String(v || '').trim().toLowerCase();
    }
    function toNum(v) {
        var s = String(v || '').trim();
        if (!s) return NaN;
        var n = parseFloat(s.replace(/\s/g, '').replace(',', '.'));
        return isFinite(n) ? n : NaN;
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
    function updateWeighted(bucket, value, weight, sumKey, weightKey) {
        if (!isFinite(value)) return;
        bucket[sumKey] += value * weight;
        bucket[weightKey] += weight;
    }

    rows.forEach(function(row) {
        var factorKey = normalizeVal(row.dataset.factor);
        var valueKey = normalizeVal(row.dataset.valueKey || row.dataset.valueLabel || (row.cells && row.cells[2] ? row.cells[2].textContent : ''));
        var bucketKey = resolveBucket(factorKey, valueKey);
        if (!bucketKey) return;
        var avgRur = toNum(row.dataset.avgRur || (row.cells && row.cells[4] ? row.cells[4].textContent : ''));
        var avgRurN = toInt(row.dataset.avgRurN || row.dataset.groupN || (row.cells && row.cells[3] ? row.cells[3].textContent : '0'));
        var avgUsd = toNum(row.dataset.avgUsd || (row.cells && row.cells[5] ? row.cells[5].textContent : ''));
        var avgUsdN = toInt(row.dataset.avgUsdN || row.dataset.groupN || (row.cells && row.cells[3] ? row.cells[3].textContent : '0'));
        var avgEur = toNum(row.dataset.avgEur || (row.cells && row.cells[6] ? row.cells[6].textContent : ''));
        var avgEurN = toInt(row.dataset.avgEurN || row.dataset.groupN || (row.cells && row.cells[3] ? row.cells[3].textContent : '0'));
        var avgOther = toNum(row.dataset.avgOther || (row.cells && row.cells[7] ? row.cells[7].textContent : ''));
        var avgOtherN = toInt(row.dataset.avgOtherN || row.dataset.groupN || (row.cells && row.cells[3] ? row.cells[3].textContent : '0'));
        updateWeighted(buckets[bucketKey], avgRur, avgRurN, 'sumRur', 'wRur');
        updateWeighted(buckets[bucketKey], avgUsd, avgUsdN, 'sumUsd', 'wUsd');
        updateWeighted(buckets[bucketKey], avgEur, avgEurN, 'sumEur', 'wEur');
        updateWeighted(buckets[bucketKey], avgOther, avgOtherN, 'sumOther', 'wOther');
    });

    var labels = categories.map(function(c) { return c.label; });
    var avgRur = categories.map(function(c) {
        var b = buckets[c.key];
        return b.wRur ? (b.sumRur / b.wRur) : null;
    });
    var avgUsd = categories.map(function(c) {
        var b = buckets[c.key];
        return b.wUsd ? (b.sumUsd / b.wUsd) : null;
    });
    var avgEur = categories.map(function(c) {
        var b = buckets[c.key];
        return b.wEur ? (b.sumEur / b.wEur) : null;
    });
    var avgOther = categories.map(function(c) {
        var b = buckets[c.key];
        return b.wOther ? (b.sumOther / b.wOther) : null;
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
    if (!graph.__avgRurChartEl || !graph.__avgUsdChartEl || !graph.__avgEurChartEl || !graph.__avgOtherChartEl) {
        graph.innerHTML =
            '<div class="employer-analysis-subgraph employer-analysis-avg-rur-graph"></div>' +
            '<div class="employer-analysis-subgraph employer-analysis-avg-usd-graph"></div>' +
            '<div class="employer-analysis-subgraph employer-analysis-avg-eur-graph"></div>' +
            '<div class="employer-analysis-subgraph employer-analysis-avg-other-graph"></div>';
        graph.__avgRurChartEl = graph.querySelector('.employer-analysis-avg-rur-graph');
        graph.__avgUsdChartEl = graph.querySelector('.employer-analysis-avg-usd-graph');
        graph.__avgEurChartEl = graph.querySelector('.employer-analysis-avg-eur-graph');
        graph.__avgOtherChartEl = graph.querySelector('.employer-analysis-avg-other-graph');
    }

    Plotly.newPlot(graph.__avgRurChartEl, [{
        type: 'bar',
        name: 'Средняя (RUR)',
        x: labels,
        y: avgRur,
        marker: { color: colorByCategory, line: { color: borderByCategory, width: 1 } }
    }], {
        title: { text: 'Средняя зарплата по параметрам (RUR)', x: 0.5, xanchor: 'center' },
        xaxis: { automargin: true, tickangle: -25 },
        yaxis: { title: 'Зарплата, RUR' },
        margin: { t: 60, r: 20, b: 120, l: 80 },
        height: 420
    }, { responsive: true, displayModeBar: false });

    Plotly.newPlot(graph.__avgUsdChartEl, [{
        type: 'bar',
        name: 'Средняя (USD)',
        x: labels,
        y: avgUsd,
        marker: { color: colorByCategory, line: { color: borderByCategory, width: 1 } }
    }], {
        title: { text: 'Средняя зарплата по параметрам (USD)', x: 0.5, xanchor: 'center' },
        xaxis: { automargin: true, tickangle: -25 },
        yaxis: { title: 'Зарплата, USD' },
        margin: { t: 60, r: 20, b: 120, l: 80 },
        height: 420
    }, { responsive: true, displayModeBar: false });

    Plotly.newPlot(graph.__avgEurChartEl, [{
        type: 'bar',
        name: 'Средняя (EUR)',
        x: labels,
        y: avgEur,
        marker: { color: colorByCategory, line: { color: borderByCategory, width: 1 } }
    }], {
        title: { text: 'Средняя зарплата по параметрам (EUR)', x: 0.5, xanchor: 'center' },
        xaxis: { automargin: true, tickangle: -25 },
        yaxis: { title: 'Зарплата, EUR' },
        margin: { t: 60, r: 20, b: 120, l: 80 },
        height: 420
    }, { responsive: true, displayModeBar: false });

    Plotly.newPlot(graph.__avgOtherChartEl, [{
        type: 'bar',
        name: 'Средняя (Другая валюта)',
        x: labels,
        y: avgOther,
        marker: { color: colorByCategory, line: { color: borderByCategory, width: 1 } }
    }], {
        title: { text: 'Средняя зарплата по параметрам (Другая валюта)', x: 0.5, xanchor: 'center' },
        xaxis: { automargin: true, tickangle: -25 },
        yaxis: { title: 'Зарплата, Другая валюта' },
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
        if (!row || !row.cells || row.cells.length < 8) return;
        var month = (row.dataset.month || row.cells[0].textContent || '').trim();
        if (!/^\d{4}-\d{2}$/.test(month)) return;
        var factorKey = normalizeEmployerFactor(row.dataset.factor || row.cells[1].textContent);
        var rawValue = (row.dataset.factorValue || row.dataset.rawValue || row.cells[2].dataset.rawValue || row.cells[2].textContent || '').trim();
        var valueKey = normalizeEmployerValueKey(rawValue);
        var groupN = parseInt((row.dataset.groupN || row.cells[3].textContent || '0').replace(/\s/g, ''), 10) || 0;
        var avgRurNRaw = parseInt((row.dataset.avgRurN || '').replace(/\s/g, ''), 10);
        var avgRur = parseFloat((row.dataset.avgRur || row.cells[4].textContent || '').replace(/\s/g, '').replace(',', '.'));
        var avgUsdNRaw = parseInt((row.dataset.avgUsdN || '').replace(/\s/g, ''), 10);
        var avgUsd = parseFloat((row.dataset.avgUsd || row.cells[5].textContent || '').replace(/\s/g, '').replace(',', '.'));
        var avgEurNRaw = parseInt((row.dataset.avgEurN || '').replace(/\s/g, ''), 10);
        var avgEur = parseFloat((row.dataset.avgEur || row.cells[6].textContent || '').replace(/\s/g, '').replace(',', '.'));
        var avgOtherNRaw = parseInt((row.dataset.avgOtherN || '').replace(/\s/g, ''), 10);
        var avgOther = parseFloat((row.dataset.avgOther || row.cells[7].textContent || '').replace(/\s/g, '').replace(',', '.'));
        var avgRurN = isFinite(avgRur) ? (isFinite(avgRurNRaw) ? avgRurNRaw : groupN) : 0;
        var avgUsdN = isFinite(avgUsd) ? (isFinite(avgUsdNRaw) ? avgUsdNRaw : groupN) : 0;
        var avgEurN = isFinite(avgEur) ? (isFinite(avgEurNRaw) ? avgEurNRaw : groupN) : 0;
        var avgOtherN = isFinite(avgOther) ? (isFinite(avgOtherNRaw) ? avgOtherNRaw : groupN) : 0;
        parsed.push({
            month: month,
            factorKey: factorKey,
            factorLabel: getEmployerFactorLabel(factorKey),
            valueKey: valueKey,
            valueLabel: getEmployerValueLabel(factorKey, valueKey),
            groupN: groupN,
            avgRurN: avgRurN,
            avgRur: isFinite(avgRur) ? avgRur : null,
            avgUsdN: avgUsdN,
            avgUsd: isFinite(avgUsd) ? avgUsd : null,
            avgEurN: avgEurN,
            avgEur: isFinite(avgEur) ? avgEur : null,
            avgOtherN: avgOtherN,
            avgOther: isFinite(avgOther) ? avgOther : null
        });
    });
    return parsed;
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
        var avgRurNumerator = 0;
        var avgUsdNumerator = 0;
        var avgEurNumerator = 0;
        var avgOtherNumerator = 0;
        var avgRurWeight = 0;
        var avgUsdWeight = 0;
        var avgEurWeight = 0;
        var avgOtherWeight = 0;
        grouped.forEach(function(row) {
            if (isFinite(row.avgRur)) {
                avgRurNumerator += row.avgRur * (row.avgRurN || 0);
                avgRurWeight += (row.avgRurN || 0);
            }
            if (isFinite(row.avgUsd)) {
                avgUsdNumerator += row.avgUsd * (row.avgUsdN || 0);
                avgUsdWeight += (row.avgUsdN || 0);
            }
            if (isFinite(row.avgEur)) {
                avgEurNumerator += row.avgEur * (row.avgEurN || 0);
                avgEurWeight += (row.avgEurN || 0);
            }
            if (isFinite(row.avgOther)) {
                avgOtherNumerator += row.avgOther * (row.avgOtherN || 0);
                avgOtherWeight += (row.avgOtherN || 0);
            }
        });
        return {
            month: 'all',
            factorKey: head.factorKey,
            factorLabel: head.factorLabel,
            valueKey: head.valueKey,
            valueLabel: head.valueLabel,
            groupN: groupN,
            avgRurN: avgRurWeight,
            avgRur: avgRurWeight ? (avgRurNumerator / avgRurWeight) : null,
            avgUsdN: avgUsdWeight,
            avgUsd: avgUsdWeight ? (avgUsdNumerator / avgUsdWeight) : null,
            avgEurN: avgEurWeight,
            avgEur: avgEurWeight ? (avgEurNumerator / avgEurWeight) : null,
            avgOtherN: avgOtherWeight,
            avgOther: avgOtherWeight ? (avgOtherNumerator / avgOtherWeight) : null
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
            'data-avg-rur-n="' + (row.avgRurN || 0) + '" ' +
            'data-avg-rur="' + (row.avgRur || '') + '" ' +
            'data-avg-usd-n="' + (row.avgUsdN || 0) + '" ' +
            'data-avg-usd="' + (row.avgUsd || '') + '" ' +
            'data-avg-eur-n="' + (row.avgEurN || 0) + '" ' +
            'data-avg-eur="' + (row.avgEur || '') + '" ' +
            'data-avg-other-n="' + (row.avgOtherN || 0) + '" ' +
            'data-avg-other="' + (row.avgOther || '') + '">' +
            '<td>' + monthLabel + '</td>' +
            '<td>' + row.factorLabel + '</td>' +
            '<td class="employer-factor-value-cell">' + getEmployerValueHtml(row.valueKey) + '</td>' +
            '<td>' + row.groupN + '</td>' +
            '<td>' + formatEmployerNumber(row.avgRur) + '</td>' +
            '<td>' + formatEmployerNumber(row.avgUsd) + '</td>' +
            '<td>' + formatEmployerNumber(row.avgEur) + '</td>' +
            '<td>' + formatEmployerNumber(row.avgOther) + '</td>' +
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
        viewToggle.innerHTML = '<button class="view-mode-btn employer-view-btn active" data-view="table" title="Таблица">▦</button>' +
            '<button class="view-mode-btn employer-view-btn" data-view="graph" title="График">📊</button>';
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
        block.insertBefore(chipsWrap, analysisView || tableContainer);
    }
    chipsWrap.style.justifyContent = '';
    chipsWrap.style.margin = '';
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
    updateViewToggleIcons(block);
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
    normalizeSkillsMonthlyControls(parentRole);
}
function restoreExpInMonth(parentRole, roleId) {
    var visibleMonth = parentRole.querySelector('.monthly-skills-month-content[style*="display: block"]');
    if (!visibleMonth) return;
    var expButtons = visibleMonth.querySelectorAll('.monthly-skills-exp-button');
    if (expButtons.length === 0) return;
    var monthData = (visibleMonth._data && visibleMonth._data.month) ? visibleMonth._data.month : parseJsonDataset(visibleMonth, 'month', {});
    var monthStr = monthData && monthData.month ? monthData.month : null;
    var stateKey = getStateKey(roleId, 'skills-monthly');
    var saved = uiState[stateKey];
    var savedByMonth = (saved && saved.exp_by_month && monthStr) ? saved.exp_by_month[monthStr] : null;
    var block = parentRole.querySelector('.skills-monthly-content');
    var multiEnabled = block && block.dataset.skillsMultiEnabled === '1';
    var globalMultiEnabled = uiState.global_skills_multi_enabled === true;
    if (block && globalMultiEnabled) block.dataset.skillsMultiEnabled = '1';
    if (block && !globalMultiEnabled) block.dataset.skillsMultiEnabled = '0';
    multiEnabled = block && block.dataset.skillsMultiEnabled === '1';
    var byMonthExpList = (savedByMonth && Array.isArray(savedByMonth.exp_list)) ? savedByMonth.exp_list.slice() : null;
    var roleExpList = (saved && Array.isArray(saved.exp_list)) ? saved.exp_list.slice() : null;
    var globalExpList = Array.isArray(uiState.global_skills_exp_list) ? uiState.global_skills_exp_list.slice() : [];
    var effectiveExpList = (multiEnabled && globalExpList.length) ? globalExpList : (multiEnabled ? roleExpList : []);
    var expContents = visibleMonth.querySelectorAll('.monthly-skills-exp-content');
    var prevVisibility = visibleMonth.style.visibility;
    visibleMonth.style.visibility = 'hidden';

    expContents.forEach(function(content) { content.style.display = 'none'; });
    expButtons.forEach(function(btn) { btn.classList.remove('active'); });
    var multiDiv = document.getElementById(visibleMonth.id + '-exp-multi');
    if (multiDiv) multiDiv.style.display = 'none';

    if (effectiveExpList && effectiveExpList.length > 1) {
        if (!multiEnabled) {
            block.dataset.skillsMultiEnabled = '1';
            multiEnabled = true;
            var multiInput = parentRole.querySelector('.skills-multi-toggle-input');
            if (multiInput) multiInput.checked = true;
        }
    }
    if (block) block.dataset.skillsRestoreInProgress = '1';
    try {
        if (multiEnabled && effectiveExpList && effectiveExpList.length) {
            var clickedByMonth = false;
            for (var btn of expButtons) {
                if (effectiveExpList.indexOf(btn.textContent.trim()) >= 0) {
                    btn.click();
                    clickedByMonth = true;
                }
            }
            if (clickedByMonth) return;
        }
        if (uiState.global_skills_experience) {
            for (var btn of expButtons) {
                if (btn.textContent.trim() === uiState.global_skills_experience) {
                    btn.click();
                    return;
                }
            }
        }
        if (multiEnabled && saved && saved.experience) {
            for (var btn of expButtons) {
                if (btn.textContent.trim() === saved.experience) {
                    btn.click();
                    return;
                }
            }
        }
        if (savedByMonth && savedByMonth.experience) {
            for (var btn of expButtons) {
                if (btn.textContent.trim() === savedByMonth.experience) {
                    btn.click();
                    return;
                }
            }
        }
        if (multiEnabled && byMonthExpList && byMonthExpList.length) {
            var clicked = false;
            for (var btn of expButtons) {
                if (byMonthExpList.indexOf(btn.textContent.trim()) >= 0) {
                    btn.click();
                    clicked = true;
                }
            }
            if (clicked) return;
        }
        if (saved && saved.experience) {
            for (var btn of expButtons) {
                if (btn.textContent.trim() === saved.experience) {
                    btn.click();
                    return;
                }
            }
        }
        expButtons[0].click();
    } finally {
        if (block && block.dataset.skillsRestoreInProgress === '1') delete block.dataset.skillsRestoreInProgress;
        visibleMonth.style.visibility = prevVisibility;
    }
}
function openMonthlySkillsExpTab(evt, expId) {
    var parentMonth = evt.currentTarget.closest('.monthly-skills-month-content');
    var parentRole = parentMonth.closest('.role-content');
    var roleId = parentRole.id;
    var block = parentRole.querySelector('.skills-monthly-content');
    var expDiv = document.getElementById(expId);
    var expData = (expDiv._data && expDiv._data.exp) ? expDiv._data.exp : parseJsonDataset(expDiv, 'exp', {});
    var experience = expData.experience;
    var monthData = (parentMonth._data && parentMonth._data.month) ? parentMonth._data.month : parseJsonDataset(parentMonth, 'month', {});
    var monthStr = monthData && monthData.month ? monthData.month : null;

    var stateKey = getStateKey(roleId, 'skills-monthly');
    var saved = uiState[stateKey] || {};
    var isRestoring = block && block.dataset.skillsRestoreInProgress === '1';

    var expContents = parentMonth.getElementsByClassName("monthly-skills-exp-content");
    for (var i = 0; i < expContents.length; i++) {
        expContents[i].style.display = "none";
    }
    var expButtons = parentMonth.getElementsByClassName("monthly-skills-exp-button");
    var multiEnabled = block && block.dataset.skillsMultiEnabled === '1';
    if (!multiEnabled) {
        for (var i = 0; i < expButtons.length; i++) {
            expButtons[i].classList.remove('active');
        }
    }
    if (!evt.currentTarget.dataset.expId) evt.currentTarget.dataset.expId = expId;
    var wasActive = evt.currentTarget.classList.contains('active');
    if (wasActive && expButtons.length > 1) {
        evt.currentTarget.classList.remove('active');
    } else {
        evt.currentTarget.classList.add('active');
    }

    var selectedBtns = Array.from(expButtons).filter(b => b.classList.contains('active'));
    if (selectedBtns.length === 0) {
        evt.currentTarget.classList.add('active');
        selectedBtns = [evt.currentTarget];
    }
    var selectedExp = selectedBtns.map(b => (b.textContent || '').trim());
    uiState.global_skills_multi_enabled = multiEnabled;
    uiState.global_skills_experience = selectedExp[0] || experience;
    uiState.global_skills_exp_list = (multiEnabled && selectedExp.length > 1) ? selectedExp.slice() : [];
    saved.experience = selectedExp[0] || experience;
    if (selectedExp.length > 1 && multiEnabled) saved.exp_list = selectedExp.slice();
    else if (!(isRestoring && multiEnabled)) delete saved.exp_list;
    if (monthStr) {
        if (!saved.exp_by_month) saved.exp_by_month = {};
        saved.exp_by_month[monthStr] = { experience: selectedExp[0] || experience };
        if (selectedExp.length > 1 && multiEnabled) saved.exp_by_month[monthStr].exp_list = selectedExp.slice();
        else if (!(isRestoring && multiEnabled)) delete saved.exp_by_month[monthStr].exp_list;
    }
    uiState[stateKey] = saved;

    if (!multiEnabled || selectedBtns.length === 1) {
        expDiv.style.display = "block";
    } else {
        var selectedDivs = selectedBtns.map(b => document.getElementById(b.dataset.expId || '')).filter(Boolean);
        var label = selectedBtns.map(b => (b.textContent || '').trim()).join(' + ');
        var agg = aggregateSkillsExpData(selectedDivs, label);
        var multiId = parentMonth.id + '-exp-multi';
        var multiDiv = document.getElementById(multiId);
        if (!multiDiv) {
            multiDiv = document.createElement('div');
            multiDiv.id = multiId;
            multiDiv.className = 'monthly-skills-exp-content';
            multiDiv.style.display = 'none';
            multiDiv.innerHTML =
                '<div class="view-toggle-horizontal">' +
                    '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">⊞</button>' +
                    '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">☷</button>' +
                    '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
                '</div>' +
                '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                    '<div class="table-container"></div>' +
                    '<div class="plotly-graph" id="skills-monthly-graph-' + multiId.replace('ms-exp-', '') + '"></div>' +
                '</div>';
            parentMonth.appendChild(multiDiv);
        }
        renderSkillsExpContent(multiDiv, agg);
        multiDiv.style.display = 'block';
        expDiv = multiDiv;
    }

    // Восстанавливаем режим для навыков
    var viewBtns = expDiv.querySelectorAll('.view-mode-btn');
    setActiveViewButton(viewBtns, uiState.skills_monthly_view_mode);
    var container = expDiv.querySelector('.view-mode-container');
    applyViewMode(container, uiState.skills_monthly_view_mode);

    var graphId = 'skills-monthly-graph-' + expId.replace('ms-exp-', '');
    var liveExp = parseJsonDataset(expDiv, 'exp', expData) || expData;
    var finalGraphId = graphId;
    if (expDiv.id.indexOf('-exp-multi') >= 0) {
        finalGraphId = 'skills-monthly-graph-' + expDiv.id.replace('ms-exp-', '');
    }
    buildHorizontalBarChart(finalGraphId, liveExp.skills || [], liveExp.experience || experience);
    applySkillsModeSizing(container, uiState.skills_monthly_view_mode);
    normalizeSkillsMonthlyControls(parentRole);
}
function restoreSalaryState(parentRole, roleId) {
    if (uiState.salary_view_mode === 'together') uiState.salary_view_mode = 'table';
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
    normalizeSalaryControls(parentRole);
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
    normalizeSalaryControls(parentRole);
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
    } else if ((container.dataset.analysis || '') === 'skills-monthly') {
        applySkillsModeSizing(container, mode);
    }
}

function applySkillsModeSizing(container, mode) {
    if (!container) return;
    var table = container.querySelector('.table-container');
    var graph = container.querySelector('.plotly-graph');
    if (!table || !graph) return;

    container.style.minHeight = '';
    graph.style.height = '';

    if (mode === 'table') return;

    requestAnimationFrame(function() {
        var th = Math.round(table.getBoundingClientRect().height || 0);
        var gh = Math.round(graph.getBoundingClientRect().height || 0);
        var maxh = Math.max(th, gh);
        if (maxh > 0) {
            container.style.minHeight = maxh + 'px';
            if (gh < maxh) graph.style.height = maxh + 'px';
        }
    });
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
    var mode = uiState.salary_view_mode === 'together' ? 'table' : uiState.salary_view_mode;
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
    } else {
        graphContainer.style.display = 'none';
        tableContainer.style.width = '100%';
    }
}
