function buildVacancyTableHtml(vacancies) {
    if (!vacancies || vacancies.length === 0) {
        return '<div class="vacancy-empty">Нет вакансий</div>';
    }

    var showRole = vacancies.some(v => v && (v.role_name || v.role_id));
    var rows = vacancies.map(v => {
        var linkUrl = v.id ? 'https://surgut.hh.ru/vacancy/' + encodeURIComponent(v.id) : '';
        var idCell = linkUrl
            ? '<a href="' + escapeHtml(linkUrl) + '" target="_blank" rel="noopener">' + formatCell(v.id) + '</a>'
            : formatCell(v.id);
        var replyCell = v.apply_alternate_url
            ? '<a href="' + escapeHtml(v.apply_alternate_url) + '" target="_blank" rel="noopener">отклик</a>'
            : '—';
        var roleCell = showRole ? (escapeHtml((v.role_name || 'Роль') + (v.role_id ? ' [ID: ' + v.role_id + ']' : ''))) : '';
        return '<tr>' +
            '<td>' + idCell + '</td>' +
            (showRole ? '<td>' + roleCell + '</td>' : '') +
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
                    (showRole ? '<th>Роль</th>' : '') +
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
function renderAllRolesContainer(container, roleContents) {
    var periods = getAllRolesPeriods(roleContents);
    var periodItems = [{ key: 'all', label: 'За все время', month: null }].concat(
        periods.map((m, i) => ({ key: 'm' + (i + 1), label: m, month: m }))
    );

    function buildPeriodTabs(prefix, analysisType) {
        return '<div class="tabs month-tabs all-roles-period-tabs">' +
            periodItems.map((p, i) => (
                '<button class="tab-button month-button all-roles-period-button' + (i === 0 ? ' active' : '') + '" ' +
                        'data-period="' + (p.month || 'all') + '" ' +
                        'onclick="openAllRolesPeriodTab(event, \'' + prefix + '-' + i + '\', \'' + analysisType + '\')">' +
                    p.label +
                '</button>'
            )).join('') +
        '</div>';
    }

    function buildActivityAllTable(rows) {
        var maxActive = Math.max(...rows.map(r => r.active || 0), 0);
        var maxRatio = Math.max(...rows.map(r => (r.active ? (r.archived / r.active) : 0)), 0);
        return '<div class="table-container activity-all-table-container">' +
            '<table class="activity-all-table">' +
                '<colgroup><col><col><col><col><col><col></colgroup>' +
                '<thead><tr><th>Роль</th><th>Активные</th><th>Архив</th><th>Всего</th><th>Ср. возраст</th><th>Арх/акт</th></tr></thead>' +
                '<tbody>' +
                    rows.map(r => {
                        var ratio = r.active ? (r.archived / r.active) : 0;
                        var leadActive = r.active === maxActive && maxActive > 0 ? ' class="leader"' : '';
                        var leadRatio = ratio === maxRatio && maxRatio > 0 ? ' class="leader"' : '';
                        var details = (r.exp_breakdown && r.exp_breakdown.length) ? (
                            '<tr class="activity-all-details" style="display: none;">' +
                                '<td colspan="6">' +
                                    '<div class="table-container activity-all-table-container">' +
                                        '<table class="details-table align-activity">' +
                                            '<colgroup><col><col><col><col><col><col></colgroup>' +
                                            '<thead><tr><th>Роль</th><th>Активные</th><th>Архив</th><th>Всего</th><th>Ср. возраст</th><th>Арх/акт</th></tr></thead>' +
                                            '<tbody>' +
                                                r.exp_breakdown.map(e => (
                                                    '<tr><td>' + e.experience + '</td><td>' + e.active + '</td><td>' + e.archived + '</td><td>' + e.total + '</td><td>' + (e.avg_age !== null && e.avg_age !== undefined ? Number(e.avg_age).toFixed(1) : '?') + '</td><td>' + (e.active ? (e.archived / e.active).toFixed(2) : '?') + '</td></tr>'
                                                )).join('') +
                                            '</tbody>' +
                                        '</table>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>'
                        ) : '';
                        return '<tr class="activity-all-row">' +
                            '<td>' + escapeHtml(r.name) + ' [ID: ' + escapeHtml(r.id) + ']</td>' +
                            '<td' + leadActive + '>' + r.active + '</td>' +
                            '<td>' + r.archived + '</td>' +
                            '<td>' + r.total + '</td>' +
                            '<td>' + (r.avg_age !== null && r.avg_age !== undefined ? r.avg_age.toFixed(1) : '?') + '</td>' +
                            '<td' + leadRatio + '>' + (ratio ? ratio.toFixed(2) : '?') + '</td>' +
                        '</tr>' + details;
                    }).join('') +
                '</tbody>' +
            '</table>' +
                '</div>';
    }

    function buildActivityRows(period) {
        var rows = roleContents.map(rc => {
            var s = computeRoleActivitySummaryForMonth(rc, period);
            return { name: rc.dataset.roleName || '', id: rc.dataset.roleId || '', ...s };
        });
        rows.sort((a, b) => {
            var ra = a.active ? (a.archived / a.active) : 0;
            var rb = b.active ? (b.archived / b.active) : 0;
            return rb - ra;
        });
        return rows;
    }

    var activityPeriodBlocks = periodItems.map((p, i) => {
        var rows = buildActivityRows(p.month);
        var graphMainId = 'activity-graph-all-' + i;
        var graphAgeId = 'activity-age-graph-all-' + i;
        return '<div id="activity-all-period-' + i + '" class="all-roles-period-content" data-analysis="activity-all" data-period="' + (p.month || 'all') + '" ' +
                    'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" ' +
                    'data-graph-main="' + graphMainId + '" data-graph-age="' + graphAgeId + '" ' +
                    'style="display: ' + (i === 0 ? 'block' : 'none') + ';">' +
                '<div class="view-toggle-horizontal">' +
                    '<button class="view-mode-btn table-btn active" data-view="table" title="Таблица">☷</button>' +
                    '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
                '</div>' +
                '<div class="analysis-flex view-mode-container" data-analysis="activity">' +
                    buildActivityAllTable(rows) +
                    '<div class="plotly-graph activity-graph-wrap all-roles-graph all-roles-graph-stack"><div class="activity-graph-item"><div id="' + graphMainId + '"></div></div><div class="activity-graph-item"><div id="' + graphAgeId + '"></div></div></div>' +
                '</div>' +
            '</div>';
    }).join('');

    var activityHtml = '<div class="month-content activity-only all-roles-period-wrapper" data-analysis="activity-all">' +
        buildPeriodTabs('activity-all-period', 'activity') +
        activityPeriodBlocks +
    '</div>';

    var weekdayPeriodBlocks = periodItems.map((p, i) => {
        var rows = roleContents.map(rc => {
            var s = computeRoleWeekdaySummaryForMonth(rc, p.month);
            return { name: rc.dataset.roleName || '', id: rc.dataset.roleId || '', ...s };
        });
        rows.sort((a, b) => (b.avg_pub || 0) - (a.avg_pub || 0));
        var graphId = 'weekday-graph-all-' + i;
        return '<div id="weekday-all-period-' + i + '" class="all-roles-period-content" data-analysis="weekday-all" data-period="' + (p.month || 'all') + '" ' +
                'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" data-graph-id="' + graphId + '" ' +
                'style="display: ' + (i === 0 ? 'block' : 'none') + ';">' +
            '<div class="view-toggle-horizontal">' +
                '<button class="view-mode-btn table-btn active" data-view="table" title="Таблица">☷</button>' +
                '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="weekday">' +
                '<div class="table-container">' +
                    '<table>' +
                        '<thead><tr><th>Роль</th><th>Ср. публикаций/день</th><th>Ср. архив/день</th></tr></thead>' +
                        '<tbody>' +
                            rows.map(r => (
                                '<tr><td>' + escapeHtml(r.name) + ' [ID: ' + escapeHtml(r.id) + ']</td><td>' + r.avg_pub.toFixed(1) + '</td><td>' + r.avg_arch.toFixed(1) + '</td></tr>'
                            )).join('') +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="plotly-graph all-roles-graph" id="' + graphId + '"></div>' +
            '</div>' +
        '</div>';
    }).join('');

    var weekdayHtml = '<div class="weekday-content all-roles-period-wrapper" data-analysis="weekday-all" style="display: none;">' +
        buildPeriodTabs('weekday-all-period', 'weekday') +
        weekdayPeriodBlocks +
    '</div>';

    var skillsPeriodBlocks = periodItems.map((p, i) => {
        var rows = computeAllRolesSkillCostSummaryForMonth(roleContents, p.month);
        var graphId = 'skills-graph-all-' + i;
        return '<div id="skills-all-period-' + i + '" class="all-roles-period-content" data-analysis="skills-monthly-all" data-period="' + (p.month || 'all') + '" ' +
                'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" data-graph-id="' + graphId + '" ' +
                'style="display: ' + (i === 0 ? 'block' : 'none') + ';">' +
            '<div class="view-toggle-horizontal">' +
                '<button class="view-mode-btn table-btn active" data-view="table" title="Таблица">☷</button>' +
                '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                '<div class="table-container full-width-table">' +
                    '<table>' +
                        '<thead><tr><th>Навык</th><th>Упоминаний</th><th>Средняя зп</th><th>Медианная зп</th><th>Роли</th></tr></thead>' +
                        '<tbody>' +
                            (rows.length ? rows.map(r => (
                                '<tr>' +
                                    '<td>' + escapeHtml(r.skill) + '</td>' +
                                    '<td>' + r.mention_count + '</td>' +
                                    '<td>' + (r.avg_skill_cost_rur !== null && r.avg_skill_cost_rur !== undefined ? r.avg_skill_cost_rur.toFixed(2) : '—') + '</td>' +
                                    '<td>' + (r.median_skill_cost_rur !== null && r.median_skill_cost_rur !== undefined ? r.median_skill_cost_rur.toFixed(2) : '—') + '</td>' +
                                    '<td>' + (r.roles ? escapeHtml(r.roles) : '—') + '</td>' +
                                '</tr>'
                            )).join('') : '<tr><td colspan="5">—</td></tr>') +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="plotly-graph all-roles-graph" id="' + graphId + '"></div>' +
            '</div>' +
        '</div>';
    }).join('');

    var skillsHtml = '<div class="skills-monthly-content all-roles-period-wrapper skills-all-summary" data-analysis="skills-monthly-all" style="display: none;">' +
        buildPeriodTabs('skills-all-period', 'skills') +
        skillsPeriodBlocks +
    '</div>';

    var salaryPeriodBlocks = periodItems.map((p, i) => {
        var rows = roleContents.map(rc => {
            var s = computeRoleSalarySkillsForMonth(rc, p.month);
            return { name: rc.dataset.roleName || '', id: rc.dataset.roleId || '', skills: s };
        });
        var graphId = 'salary-graph-all-' + i;
        return '<div id="salary-all-period-' + i + '" class="all-roles-period-content" data-analysis="salary-all" data-period="' + (p.month || 'all') + '" ' +
                'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" data-graph-id="' + graphId + '" ' +
                'style="display: ' + (i === 0 ? 'block' : 'none') + ';">' +
            '<div class="view-toggle-horizontal">' +
                '<button class="view-mode-btn table-btn active" data-view="table" title="Таблица">☷</button>' +
                '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="salary">' +
                '<div class="table-container">' +
                    '<table>' +
                        '<thead><tr><th>Роль</th><th>Навык</th><th>Упоминаний</th><th>Средняя зп</th></tr></thead>' +
                        '<tbody>' +
                            rows.map(r => {
                                if (!r.skills.length) {
                                    return '<tr><td>' + escapeHtml(r.name) + ' [ID: ' + escapeHtml(r.id) + ']</td><td colspan="3">?</td></tr>';
                                }
                                return r.skills.map((s, i) => (
                                    '<tr>' +
                                        (i === 0 ? '<td rowspan="' + r.skills.length + '">' + escapeHtml(r.name) + ' [ID: ' + escapeHtml(r.id) + ']</td>' : '') +
                                        '<td>' + escapeHtml(s.skill) + '</td>' +
                                        '<td>' + s.count + '</td>' +
                                        '<td>' + (s.avg ? Math.round(s.avg) : '?') + '</td>' +
                                    '</tr>'
                                )).join('');
                            }).join('') +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="plotly-graph all-roles-graph" id="' + graphId + '"></div>' +
            '</div>' +
        '</div>';
    }).join('');

    var salaryHtml = '<div class="salary-content all-roles-period-wrapper" data-analysis="salary-all" style="display: none;">' +
        buildPeriodTabs('salary-all-period', 'salary') +
        salaryPeriodBlocks +
    '</div>';

    container.innerHTML =
        '<h2>Сводно по всем ролям</h2>' +
        '<div class="tabs analysis-tabs">' +
            '<button class="tab-button analysis-button active" data-analysis-id="activity-all" onclick="switchAnalysis(event, \'activity-all\')">Анализ активности</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="weekday-all" onclick="switchAnalysis(event, \'weekday-all\')">Анализ по дням недели</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="skills-monthly-all" onclick="switchAnalysis(event, \'skills-monthly-all\')">Навыки по месяцам</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="salary-all" onclick="switchAnalysis(event, \'salary-all\')">Анализ зарплат</button>' +
        '</div>' +
        activityHtml +
        weekdayHtml +
        skillsHtml +
        salaryHtml;

    var analysisButton = container.querySelector('.analysis-button');
    if (analysisButton) analysisButton.click();
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

    var lifetimeMaps = buildLifetimeMapsFromSalaryMonths(salaryMonths);
    applyLifetimeToActivityMonths(activityMonths, lifetimeMaps);

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
                                    '<td>' + (e.avg_age !== null && e.avg_age !== undefined ? Number(e.avg_age).toFixed(1) : '—') + '</td>' +
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

    addSummaryTabs(container);

    var savedType = uiState[getAnalysisStateKey(container.id)] || uiState.global_analysis_type || 'activity';
    var targetButton = container.querySelector(".analysis-button[data-analysis-id='" + savedType + "-combined']");
    if (targetButton) targetButton.click();
    else {
        var analysisButton = container.querySelector('.analysis-button');
        if (analysisButton) analysisButton.click();
    }
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
    var allRoles = document.getElementById('role-all');
    var roleContents = Array.from(document.querySelectorAll('.role-content')).filter(c => c.id !== 'role-combined');
    if (uiState.all_roles_active) {
        roleContents.forEach(c => c.style.display = 'none');
        if (combined) combined.style.display = 'none';
        if (allRoles) {
            allRoles.style.display = 'block';
            renderAllRolesContainer(allRoles, getAllRoleContents());
        }
        return;
    }

    if (selectedIndices.size <= 1) {
        if (combined) combined.style.display = 'none';
        var idx = selectedIndices.size === 1 ? Array.from(selectedIndices)[0] : '1';
        var roleContent = getRoleContentByIndex(idx);
        if (roleContent) {
            var salaryMonths = getRoleSalaryData(roleContent);
            var allVacancies = collectVacanciesFromSalaryMonths(salaryMonths);
            var period = computePublicationPeriod(allVacancies) || '—';
            var id = roleContent.dataset.roleId || '';
            var title = '[ID: ' + id + '] период публикации ' + period;
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
