function buildVacancyTableHtml(vacancies) {
    if (!vacancies || vacancies.length === 0) {
        return '<div class="vacancy-empty">РќРµС‚ РІР°РєР°РЅСЃРёР№</div>';
    }

    var showRole = vacancies.some(v => v && (v.role_name || v.role_id));
    var rows = vacancies.map(v => {
        var linkUrl = v.id ? 'https://surgut.hh.ru/vacancy/' + encodeURIComponent(v.id) : '';
        var idCell = linkUrl
            ? '<a href="' + escapeHtml(linkUrl) + '" target="_blank" rel="noopener">' + formatCell(v.id) + '</a>'
            : formatCell(v.id);
        var replyCell = v.apply_alternate_url
            ? '<a href="' + escapeHtml(v.apply_alternate_url) + '" target="_blank" rel="noopener">отклик</a>'
            : 'вЂ”';
        var roleCell = showRole ? (escapeHtml((v.role_name || 'Р РѕР»СЊ') + (v.role_id ? ' [ID: ' + v.role_id + ']' : ''))) : '';
        var employerCell = formatCell(v.employer);
        if (v.employer) {
            employerCell = '<button class="employer-link" type="button" ' +
                'data-employer="' + escapeHtml(v.employer) + '" ' +
                'data-accredited="' + escapeHtml(v.employer_accredited) + '" ' +
                'data-rating="' + escapeHtml(v.employer_rating) + '" ' +
                'data-trusted="' + escapeHtml(v.employer_trusted) + '" ' +
                'data-url="' + escapeHtml(v.employer_url) + '">' +
                escapeHtml(v.employer) +
            '</button>';
        }
        return '<tr>' +
            '<td>' + idCell + '</td>' +
            (showRole ? '<td>' + roleCell + '</td>' : '') +
            '<td>' + formatCell(v.name) + '</td>' +
            '<td>' + employerCell + '</td>' +
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
function buildSalaryTablesHtml(entries) {
    var coverageMap = { 'RUR': 0, 'USD': 0, 'EUR': 0, 'Р”СЂСѓРіР°СЏ': 0, 'РќРµ Р·Р°РїРѕР»РЅРµРЅР°': 0 };
    var coverageTotal = 0;
    (entries || []).forEach(function(entry) {
        if (!entry) return;
        var count = Number(entry.total_vacancies) || 0;
        var currency = coverageMap.hasOwnProperty(entry.currency) ? entry.currency : 'Р”СЂСѓРіР°СЏ';
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
        '<td>' + coverageMap['Р”СЂСѓРіР°СЏ'] + ' (' + pct(coverageMap['Р”СЂСѓРіР°СЏ']) + ')</td>' +
        '<td>' + coverageMap['РќРµ Р·Р°РїРѕР»РЅРµРЅР°'] + ' (' + pct(coverageMap['РќРµ Р·Р°РїРѕР»РЅРµРЅР°']) + ')</td>' +
    '</tr>';
    var statsRows = (entries || []).map(function(entry) {
        return '<tr class="salary-row" data-vacancies-with="" data-vacancies-without="">' +
            '<td class="status-icon-cell">' + renderStatusIcon(entry.status) + '</td>' +
            '<td>' + entry.currency + '</td>' +
            '<td>' + entry.total_vacancies + '</td>' +
            '<td>' + Math.round(entry.avg_salary) + '</td>' +
            '<td>' + (entry.median_salary ? Math.round(entry.median_salary) : 'вЂ”') + '</td>' +
            '<td>' + (entry.mode_salary ? Math.round(entry.mode_salary) : 'вЂ”') + '</td>' +
            '<td>' + Math.round(entry.min_salary) + '</td>' +
            '<td>' + Math.round(entry.max_salary) + '</td>' +
            '<td>' + entry.top_skills + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="salary-split-tables">' +
        '<div class="vacancy-table-wrap" style="overflow-x: auto; margin-bottom: 16px;">' +
            '<h4 style="margin: 0 0 8px;">РЎРІРѕРґРєР° РІР°РєР°РЅСЃРёР№ РїРѕ РІР°Р»СЋС‚Р°Рј</h4>' +
            '<table class="vacancy-table salary-table">' +
                '<thead><tr><th>Р’СЃРµРіРѕ РІР°РєР°РЅСЃРёР№</th><th>RUR</th><th>USD</th><th>EUR</th><th>Р”СЂСѓРіР°СЏ</th><th>РќРµ Р·Р°РїРѕР»РЅРµРЅР°</th></tr></thead>' +
                '<tbody>' + coverageRows + '</tbody>' +
            '</table>' +
        '</div>' +
        '<div class="vacancy-table-wrap" style="overflow-x: auto;">' +
            '<h4 style="margin: 0 0 8px;">РЎС‚Р°С‚РёСЃС‚РёРєР° Р·Р°СЂРїР»Р°С‚</h4>' +
            '<table class="vacancy-table salary-table">' +
                '<thead><tr><th>РЎС‚Р°С‚СѓСЃ</th><th>Р’Р°Р»СЋС‚Р°</th><th>РќР°Р№РґРµРЅРѕ</th><th>РЎСЂРµРґРЅСЏСЏ</th><th>РњРµРґРёР°РЅРЅР°СЏ</th><th>РњРѕРґР°Р»СЊРЅР°СЏ</th><th>РњРёРЅ</th><th>РњР°РєСЃ</th><th>РўРѕРї-10 РЅР°РІС‹РєРѕРІ</th></tr></thead>' +
                '<tbody>' + statsRows + '</tbody>' +
            '</table>' +
        '</div>' +
    '</div>';
}
function applySalaryTablesMarkup(expDiv, entries) {
    if (!expDiv) return;
    var tableContainer = expDiv.querySelector('.salary-table-container');
    if (!tableContainer) return;
    tableContainer.innerHTML = buildSalaryTablesHtml(entries || []);
}
function renderVacancyDetails(container, withList, withoutList) {
    var combinedList = (withList || []).concat(withoutList || []);
    container.innerHTML = buildVacancyTableHtml(combinedList);
}
function renderStatusIcon(status) {
    var raw = status === null || status === undefined ? '' : String(status);
    var normalized = raw.trim().toLowerCase();
    var isArchived = normalized.indexOf('archiv') !== -1 || normalized.indexOf('\u0430\u0440\u0445\u0438\u0432') !== -1;
    var isOpen = normalized.indexOf('open') !== -1 || normalized.indexOf('\u043e\u0442\u043a\u0440\u044b') !== -1 || normalized.indexOf('active') !== -1 || normalized.indexOf('\u0430\u043a\u0442\u0438\u0432') !== -1;

    if (isArchived) {
        return '<span class="status-icon status-icon-archived" title="\u0410\u0440\u0445\u0438\u0432\u043d\u0430\u044f" aria-label="\u0410\u0440\u0445\u0438\u0432\u043d\u0430\u044f"></span>';
    }
    if (isOpen) {
        return '<span class="status-icon status-icon-open" title="\u041e\u0442\u043a\u0440\u044b\u0442\u0430\u044f" aria-label="\u041e\u0442\u043a\u0440\u044b\u0442\u0430\u044f"></span>';
    }
    return '<span class="status-icon" title="' + escapeHtml(raw || '\u2014') + '" aria-label="' + escapeHtml(raw || '\u2014') + '">' + escapeHtml(raw || '\u2014') + '</span>';
}
function buildAllRolesSkillsTableHtml(rows) {
    return '<table class="skills-all-table">' +
        '<thead><tr><th>Навык</th><th>Упоминаний</th><th>Средняя з/п</th><th>Медианная з/п</th><th>Роли</th></tr></thead>' +
        '<tbody>' +
            (rows.length ? rows.map(r => (
                '<tr>' +
                    '<td>' + escapeHtml(r.skill) + '</td>' +
                    '<td>' + r.mention_count + '</td>' +
                    '<td>' + (r.avg_skill_cost_rur !== null && r.avg_skill_cost_rur !== undefined ? r.avg_skill_cost_rur.toFixed(2) : 'вЂ”') + '</td>' +
                    '<td>' + (r.median_skill_cost_rur !== null && r.median_skill_cost_rur !== undefined ? r.median_skill_cost_rur.toFixed(2) : 'вЂ”') + '</td>' +
                    '<td>' + (r.roles ? escapeHtml(r.roles) : 'вЂ”') + '</td>' +
                '</tr>'
            )).join('') : '<tr><td colspan="5">вЂ”</td></tr>') +
        '</tbody>' +
    '</table>';
}
function buildCombinedEmployerRawRowsHtml(rows) {
    var items = Array.isArray(rows) ? rows.slice() : [];
    if (typeof sortEmployerAnalysisData === 'function') {
        items = sortEmployerAnalysisData(items);
    }
    if (!items.length) {
        return '<tr><td colspan="8">Нет данных по работодателям</td></tr>';
    }

    function asNumber(value) {
        return (value !== null && value !== undefined && isFinite(value)) ? value : '';
    }

    return items.map(function(row) {
        var factorLabel = row.factorLabel || (typeof getEmployerFactorLabel === 'function' ? getEmployerFactorLabel(row.factorKey || '') : (row.factorKey || ''));
        var valueKey = row.valueKey || '';
        var valueLabel = row.valueLabel || valueKey;
        var valueHtml = typeof getEmployerValueHtml === 'function'
            ? getEmployerValueHtml(valueKey)
            : escapeHtml(valueLabel);
        return '<tr class="employer-analysis-row" ' +
            'data-month="' + escapeHtml(row.month || '') + '" ' +
            'data-factor="' + escapeHtml(row.factorKey || '') + '" ' +
            'data-factor-value="' + escapeHtml(valueKey) + '" ' +
            'data-group-n="' + escapeHtml(row.groupN || 0) + '" ' +
            'data-avg-rur-n="' + escapeHtml(row.avgRurN || 0) + '" ' +
            'data-avg-rur="' + escapeHtml(asNumber(row.avgRur)) + '" ' +
            'data-avg-usd-n="' + escapeHtml(row.avgUsdN || 0) + '" ' +
            'data-avg-usd="' + escapeHtml(asNumber(row.avgUsd)) + '" ' +
            'data-avg-eur-n="' + escapeHtml(row.avgEurN || 0) + '" ' +
            'data-avg-eur="' + escapeHtml(asNumber(row.avgEur)) + '" ' +
            'data-avg-other-n="' + escapeHtml(row.avgOtherN || 0) + '" ' +
            'data-avg-other="' + escapeHtml(asNumber(row.avgOther)) + '">' +
            '<td>' + escapeHtml(row.month || '') + '</td>' +
            '<td>' + escapeHtml(factorLabel) + '</td>' +
            '<td class="employer-factor-value-cell" data-raw-value="' + escapeHtml(valueKey) + '">' + valueHtml + '</td>' +
            '<td>' + (row.groupN || 0) + '</td>' +
            '<td>' + (typeof formatEmployerNumber === 'function' ? formatEmployerNumber(row.avgRur) : (row.avgRur || '—')) + '</td>' +
            '<td>' + (typeof formatEmployerNumber === 'function' ? formatEmployerNumber(row.avgUsd) : (row.avgUsd || '—')) + '</td>' +
            '<td>' + (typeof formatEmployerNumber === 'function' ? formatEmployerNumber(row.avgEur) : (row.avgEur || '—')) + '</td>' +
            '<td>' + (typeof formatEmployerNumber === 'function' ? formatEmployerNumber(row.avgOther) : (row.avgOther || '—')) + '</td>' +
        '</tr>';
    }).join('');
}
function renderAllRolesContainer(container, roleContents) {
    if (!container) return;
    if (container.__renderingAllRoles) return;
    container.__renderingAllRoles = true;
    try {
    var excludedRoles = [];
    var filteredRoleContents = (roleContents || []).slice();
    container.__selectedRoleContents = filteredRoleContents.slice();

    var currentAnalysis = String(container.dataset.activeAnalysis || 'activity').replace(/-all$/, '');
    var selectedPeriods = [];
    var selectedExperiences = [];
    if (typeof getGlobalFilterOptions === 'function' && typeof getResolvedGlobalFilterValues === 'function') {
        selectedPeriods = getResolvedGlobalFilterValues('periods', getGlobalFilterOptions(container, 'periods', currentAnalysis));
        selectedExperiences = getResolvedGlobalFilterValues('experiences', getGlobalFilterOptions(container, 'experiences', currentAnalysis));
    }
    var normalizedSelectedExperiences = selectedExperiences.map(function(value) {
        return normalizeExperience(value);
    }).filter(Boolean);

    var allVacancies = [];
    filteredRoleContents.forEach(function(roleContent) {
        allVacancies = allVacancies.concat(getRoleVacancies(roleContent) || []);
    });
    allVacancies = dedupeVacanciesById(allVacancies);
    var periods = Array.from(new Set(allVacancies.map(function(vacancy) {
        var published = typeof parsePublishedAtDate === 'function' ? parsePublishedAtDate(vacancy && vacancy.published_at) : null;
        if (!published) return '';
        return published.getFullYear() + '-' + String(published.getMonth() + 1).padStart(2, '0');
    }).filter(Boolean))).sort().reverse();
    var allLabel = periods.length && typeof formatMonthTitle === 'function' ? formatMonthTitle(periods.length) : 'За период';
    var periodItems = [
        { key: 'd3', label: 'За 3 дня', period: 'last_3' },
        { key: 'd7', label: 'За 7 дней', period: 'last_7' },
        { key: 'd14', label: 'За 14 дней', period: 'last_14' }
    ].concat(periods.map(function(month, index) {
        return { key: 'm' + (index + 1), label: month, period: month };
    })).concat([
        { key: 'all', label: allLabel, period: null }
    ]);

    function getRoleFilteredVacancies(roleContent, periodValue) {
        var vacancies = dedupeVacanciesById((getRoleVacancies(roleContent) || []).slice());
        if (selectedPeriods.length && typeof filterVacanciesBySelectedPeriods === 'function') {
            vacancies = filterVacanciesBySelectedPeriods(vacancies, selectedPeriods);
        }
        if (periodValue && typeof filterVacanciesBySelectedPeriods === 'function') {
            vacancies = filterVacanciesBySelectedPeriods(vacancies, [periodValue]);
        }
        if (normalizedSelectedExperiences.length) {
            vacancies = vacancies.filter(function(vacancy) {
                var exp = normalizeExperience(vacancy && (vacancy._experience || vacancy.experience) || '');
                return normalizedSelectedExperiences.indexOf(exp) >= 0;
            });
        }
        return vacancies;
    }

    function computeAllRolesSkillCostSummaryFromVacancies(periodValue) {
        var roleCounts = new Map();
        var totals = new Map();

        filteredRoleContents.forEach(function(roleContent) {
            var roleName = roleContent.dataset.roleName || roleContent.dataset.roleId || 'UNKNOWN_ROLE';
            var vacancies = getRoleFilteredVacancies(roleContent, periodValue);
            vacancies.forEach(function(vacancy) {
                if (!vacancy || !vacancy.skills) return;
                if (vacancy.currency !== 'RUR') return;
                var from = vacancy.salary_from;
                var to = vacancy.salary_to;
                if (from === null || from === undefined) from = null;
                if (to === null || to === undefined) to = null;
                if (from === null && to === null) return;
                var a = from !== null ? Number(from) : Number(to);
                var b = to !== null ? Number(to) : Number(from);
                if (isNaN(a) || isNaN(b)) return;
                var avg = (a + b) / 2.0;
                String(vacancy.skills).split(',').map(function(skill) { return normalizeSkillName(skill); }).filter(Boolean).forEach(function(skill) {
                    var entry = totals.get(skill) || { count: 0, sum: 0 };
                    entry.count += 1;
                    entry.sum += avg;
                    totals.set(skill, entry);
                    var roleKey = skill + '||' + roleName;
                    roleCounts.set(roleKey, (roleCounts.get(roleKey) || 0) + 1);
                });
            });
        });

        var rows = Array.from(totals.entries()).map(function(pair) {
            var skill = pair[0];
            var entry = pair[1] || { count: 0, sum: 0 };
            return {
                skill: skill,
                mention_count: entry.count,
                avg_skill_cost_rur: entry.count ? Math.round((entry.sum / entry.count) * 100) / 100 : 0,
                median_skill_cost_rur: 0
            };
        });
        rows.sort(function(a, b) {
            return (b.mention_count - a.mention_count) || a.skill.localeCompare(b.skill);
        });

        var roleMapBySkill = new Map();
        roleCounts.forEach(function(count, key) {
            var parts = key.split('||');
            var skill = parts[0];
            var role = parts[1];
            var list = roleMapBySkill.get(skill) || [];
            list.push({ role: role, count: count });
            roleMapBySkill.set(skill, list);
        });
        rows.forEach(function(row) {
            var list = roleMapBySkill.get(row.skill) || [];
            list.sort(function(a, b) {
                return (b.count - a.count) || a.role.localeCompare(b.role);
            });
            row.roles = list.map(function(item) {
                var pct = row.mention_count ? (item.count * 100.0 / row.mention_count) : 0;
                return item.role + ' (' + pct.toFixed(2) + '%)';
            }).join(', ');
        });
        return { rows: rows };
    }

    function buildPeriodTabs(prefix, analysisType) {
        return '<div class="tabs month-tabs all-roles-period-tabs">' +
            periodItems.map((p, i) => (
                '<button class="tab-button month-button all-roles-period-button' + (i === 0 ? ' active' : '') + '" ' +
                        'data-period="' + (p.period || 'all') + '" ' +
                        'onclick="openAllRolesPeriodTab(event, \'' + prefix + '-' + i + '\', \'' + analysisType + '\')">' +
                    p.label +
                '</button>'
            )).join('') +
        '</div>';
    }

    function buildSharedPeriodTabs() {
        return '<div class="all-roles-shared-period-panel" style="display:flex;align-items:flex-start;justify-content:center;gap:4px;flex-wrap:wrap;margin-top:4px;">' +
            '<div class="all-roles-shared-filter-buttons" style="display:flex;align-items:flex-start;justify-content:center;gap:6px;flex-wrap:wrap;"></div>' +
        '</div>';
    }

    function buildActivityAllTable(rows) {
        var maxActive = Math.max(...rows.map(r => r.active || 0), 0);
        var maxRatio = Math.max(...rows.map(r => (r.active ? (r.archived / r.active) : 0)), 0);
        return '<div class="table-container">' +
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
                                    '<div class="table-container">' +
                                        '<table class="details-table align-activity">' +
                                            '<colgroup><col><col><col><col><col><col></colgroup>' +
                                            '<thead><tr><th>Опыт</th><th>Активные</th><th>Архив</th><th>Всего</th><th>Ср. возраст</th><th>Арх/акт</th></tr></thead>' +
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
        var rows = filteredRoleContents.map(rc => {
            var s = computeActivitySummaryFromEntries(computeActivityEntriesFromVacancies(getRoleFilteredVacancies(rc, period)));
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
        var rows = buildActivityRows(p.period);
        var graphMainId = 'activity-graph-all-' + i;
        var graphAgeId = 'activity-age-graph-all-' + i;
        return '<div id="activity-all-period-' + i + '" class="all-roles-period-content" data-analysis="activity-all" data-period="' + (p.period || 'all') + '" ' +
                    'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" ' +
                    'data-graph-main="' + graphMainId + '" data-graph-age="' + graphAgeId + '" ' +
                    'style="display: ' + (i === 0 ? 'block' : 'none') + ';">' +
                '<div class="view-toggle-horizontal">' +
                    '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">&#9707;</button>' +
                    '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">&#9636;</button>' +
                    '<button class="view-mode-btn graph-btn" data-view="graph" title="График">&#9684;</button>' +
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
        var rows = filteredRoleContents.map(rc => {
            var days = computeWeekdayStatsFromVacancies(getRoleFilteredVacancies(rc, p.period));
            var totalPub = days.reduce(function(sum, day) { return sum + (day.publications || 0); }, 0);
            var totalArch = days.reduce(function(sum, day) { return sum + (day.archives || 0); }, 0);
            var count = days.length || 1;
            var s = { avg_pub: totalPub / count, avg_arch: totalArch / count };
            return { name: rc.dataset.roleName || '', id: rc.dataset.roleId || '', ...s };
        });
        rows.sort((a, b) => (b.avg_pub || 0) - (a.avg_pub || 0));
        var graphId = 'weekday-graph-all-' + i;
        return '<div id="weekday-all-period-' + i + '" class="all-roles-period-content" data-analysis="weekday-all" data-period="' + (p.period || 'all') + '" ' +
                'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" data-graph-id="' + graphId + '" ' +
                'style="display: ' + (i === 0 ? 'block' : 'none') + ';">' +
            '<div class="view-toggle-horizontal">' +
                buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.weekday_view_mode || 'together') +
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
        var summary = computeAllRolesSkillCostSummaryFromVacancies(p.period);
        var rows = summary.rows || [];
        var graphId = 'skills-graph-all-' + i;
        return '<div id="skills-all-period-' + i + '" class="all-roles-period-content" data-analysis="skills-monthly-all" data-period="' + (p.period || 'all') + '" ' +
                'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" data-graph-id="' + graphId + '" ' +
                'style="display: ' + (i === 0 ? 'block' : 'none') + ';">' +
            '<div class="view-toggle-horizontal">' +
                buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.skills_monthly_view_mode || 'together') +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                '<div class="table-container full-width-table">' +
                    '<div class="skills-all-table-wrap">' +
                        buildAllRolesSkillsTableHtml(rows) +
                    '</div>' +
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
        var rows = filteredRoleContents.map(rc => {
            var s = computeSalarySkillsFromVacancies(getRoleFilteredVacancies(rc, p.period));
            return { name: rc.dataset.roleName || '', id: rc.dataset.roleId || '', skills: s };
        });
        var graphId = 'salary-graph-all-' + i;
        return '<div id="salary-all-period-' + i + '" class="all-roles-period-content" data-analysis="salary-all" data-period="' + (p.period || 'all') + '" ' +
                'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" data-graph-id="' + graphId + '" ' +
                'style="display: ' + (i === 0 ? 'block' : 'none') + ';">' +
            '<div class="view-toggle-horizontal">' +
                buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.salary_view_mode || 'together') +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="salary">' +
                '<div class="table-container">' +
                    '<table>' +
                        '<thead><tr><th>Роль</th><th>Навык</th><th>Упоминаний</th><th>Средняя з/п</th></tr></thead>' +
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
        '<div class="role-period-label">Период публикации: 19.01.2026 - 03.03.2026</div>' +
        '<div class="tabs summary-return-tabs">' +
            '<button type="button" class="tab-button analysis-button summary-return-tab" onclick="switchFromSummaryToAnalysis(\'activity\')">Анализ активности</button>' +
            '<button type="button" class="tab-button analysis-button summary-return-tab" onclick="switchFromSummaryToAnalysis(\'weekday\')">Анализ по дням недели</button>' +
            '<button type="button" class="tab-button analysis-button summary-return-tab" onclick="switchFromSummaryToAnalysis(\'skills-monthly\')">Топ-навыки</button>' +
            '<button type="button" class="tab-button analysis-button summary-return-tab" onclick="switchFromSummaryToAnalysis(\'skills-search\')">Поиск вакансий</button>' +
            '<button type="button" class="tab-button analysis-button summary-return-tab" onclick="switchFromSummaryToAnalysis(\'salary\')">Анализ зарплат</button>' +
            '<button type="button" class="tab-button analysis-button summary-return-tab" onclick="switchFromSummaryToAnalysis(\'employer-analysis\')">Анализ работодателей</button>' +
            '<button type="button" class="tab-button summary-return-tab active">Сводный отчет</button>' +
        '</div>' +
        '<div class="tabs analysis-tabs">' +
            '<button class="tab-button analysis-button active" data-analysis-id="activity-all" onclick="switchAnalysis(event, \'activity-all\')">Анализ активности</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="weekday-all" onclick="switchAnalysis(event, \'weekday-all\')">Анализ по дням недели</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="skills-monthly-all" onclick="switchAnalysis(event, \'skills-monthly-all\')">Навыки по месяцам</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="salary-all" onclick="switchAnalysis(event, \'salary-all\')">Анализ зарплат</button>' +
        '</div>' +
        buildSharedPeriodTabs() +
        activityHtml +
        weekdayHtml +
        skillsHtml +
        salaryHtml;

    var preferred = uiState.global_analysis_type || 'activity';
    var preferredButton = container.querySelector('.analysis-button[data-analysis-id="' + preferred + '-all"]');
    if (preferredButton) preferredButton.click();
    else {
        var analysisButton = container.querySelector('.analysis-button');
        if (analysisButton) analysisButton.click();
    }
    } finally {
        container.__renderingAllRoles = false;
    }
}
function addSummaryTabs(root) {
    var skillsMonths = root.querySelectorAll('.monthly-skills-month-content');
    skillsMonths.forEach(monthDiv => {
        monthDiv.querySelectorAll('.monthly-skills-exp-button[data-summary="1"]').forEach(btn => btn.remove());
    });

    var salaryMonths = root.querySelectorAll('.salary-month-content');
    salaryMonths.forEach(monthDiv => {
        if (monthDiv.querySelector('.salary-exp-button[data-summary="1"]')) return;
        var monthData = (monthDiv._data && monthDiv._data.month) ? monthDiv._data.month : parseJsonDataset(monthDiv, 'month', {});
        if (!monthData || !monthData.experiences) return;
        if ((monthData.experiences || []).some(function(exp) { return isSalarySummaryExperience(exp && exp.experience); })) return;
        var expTabs = monthDiv.querySelector('.salary-exp-tabs');
        if (!expTabs) return;
        var expIndex = (monthData.experiences.length || 0) + 1;
        var expId = monthDiv.id.replace('sal-month-', 'sal-exp-') + '-' + expIndex;
        var btn = document.createElement('button');
        btn.className = 'tab-button salary-exp-button';
        btn.dataset.summary = '1';
        btn.textContent = 'Р’СЃРµ';
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
                        '<div class="vacancy-table-wrap" style="overflow-x: auto;">' +
                            '<table class="vacancy-table salary-table">' +
                                '<thead><tr><th>РЎС‚Р°С‚СѓСЃ</th><th>Р’Р°Р»СЋС‚Р°</th><th>Р’СЃРµРіРѕ</th><th>С з/п</th><th>% СЃ Р·/Рї</th><th>РЎСЂРµРґРЅСЏСЏ</th><th>РњРµРґРёР°РЅРЅР°СЏ</th><th>РњРѕРґР°Р»СЊРЅР°СЏ</th><th>РњРёРЅ</th><th>РњР°РєСЃ</th><th>РўРѕРї-10 РЅР°РІС‹РєРѕРІ</th></tr></thead>' +
                                '<tbody>' +
                                    summaryExp.entries.map(entry => (
                                        '<tr class="salary-row" data-vacancies-with="" data-vacancies-without="">' +
                                            '<td class="status-icon-cell">' + renderStatusIcon(entry.status) + '</td>' +
                                            '<td>' + entry.currency + '</td>' +
                                            '<td>' + entry.total_vacancies + '</td>' +
                                            '<td>' + entry.vacancies_with_salary + '</td>' +
                                            '<td>' + entry.salary_percentage + '%</td>' +
                                            '<td>' + Math.round(entry.avg_salary) + '</td>' +
                                            '<td>' + (entry.median_salary ? Math.round(entry.median_salary) : 'вЂ”') + '</td>' +
                                            '<td>' + (entry.mode_salary ? Math.round(entry.mode_salary) : 'вЂ”') + '</td>' +
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
                    buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.salary_view_mode || 'together') +
                '</div>' +
            '</div>';
        applySalaryTablesMarkup(expDiv, summaryExp.entries || []);
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
    var combinedVacancies = [];
    var combinedEmployerRows = [];

    roleContents.forEach(function(roleContent) {
        combinedVacancies = combinedVacancies.concat(getRoleVacancies(roleContent) || []);
        var employerBlock = roleContent.querySelector('.employer-analysis-content');
        if (!employerBlock) return;
        if (employerBlock.__employerData && employerBlock.__employerData.length) {
            combinedEmployerRows = combinedEmployerRows.concat(employerBlock.__employerData);
            return;
        }
        if (typeof parseEmployerAnalysisData === 'function') {
            combinedEmployerRows = combinedEmployerRows.concat(parseEmployerAnalysisData(employerBlock) || []);
        }
    });
    combinedVacancies = dedupeVacanciesById(combinedVacancies);

    var lifetimeMaps = buildLifetimeMapsFromSalaryMonths(salaryMonths);
    applyLifetimeToActivityMonths(activityMonths, lifetimeMaps);

    var ids = roleContents.map(rc => rc.dataset.roleId).filter(Boolean);
    if (!combinedVacancies.length) {
        combinedVacancies = collectVacanciesFromSalaryMonths(salaryMonths);
    }
    combinedVacancies = dedupeVacanciesById(combinedVacancies);
    var period = computePublicationPeriod(combinedVacancies) || 'вЂ”';
    var roleTitle = '[ID: ' + ids.join(', ') + ']';

    var activityTabs = activityMonths.map((m, i) => (
        '<button class="tab-button month-button all-roles-period-button" onclick="openMonthTab(event, \'month-combined-' + (i + 1) + '\')">' + m.month + '</button>'
    )).join('');

    var activityBlocks = activityMonths.map((m, i) => (
        '<div id="month-combined-' + (i + 1) + '" class="month-content activity-only" data-entries="" data-month="' + m.month + '">' +
            '<div class="view-toggle-horizontal">' +
                '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">&#9707;</button>' +
                '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">&#9636;</button>' +
                '<button class="view-mode-btn graph-btn" data-view="graph" title="График">&#9684;</button>' +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="activity">' +
                '<div class="table-container">' +
                    '<table>' +
                        '<thead><tr><th>РћРїС‹С‚</th><th>Р’СЃРµРіРѕ</th><th>РђСЂС…РёРІРЅС‹С…</th><th>РђРєС‚РёРІРЅС‹С…</th><th>РЎСЂ. РІРѕР·СЂР°СЃС‚ (РґРЅРё)</th></tr></thead>' +
                        '<tbody>' +
                            m.entries.map(e => (
                                '<tr' + (e.is_max_archived ? ' class="max-archived"' : '') + '>' +
                                    '<td>' + e.experience + '</td>' +
                                    '<td>' + e.total + '</td>' +
                                    '<td>' + e.archived + '</td>' +
                                    '<td>' + e.active + '</td>' +
                                    '<td>' + (e.avg_age !== null && e.avg_age !== undefined ? Number(e.avg_age).toFixed(1) : 'вЂ”') + '</td>' +
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
                    '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">&#9707;</button>' +
                    '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">&#9636;</button>' +
                    '<button class="view-mode-btn graph-btn" data-view="graph" title="График">&#9684;</button>' +
                '</div>' +
                '<div class="analysis-flex view-mode-container" data-analysis="weekday">' +
                    '<div class="table-container">' +
                        '<table>' +
                            '<thead><tr><th>Р”РµРЅСЊ РЅРµРґРµР»Рё</th><th>РџСѓР±Р»РёРєР°С†РёР№</th><th>РђСЂС…РёРІР°С†РёР№</th><th>РЎСЂ. РІСЂРµРјСЏ РїСѓР±Р»РёРєР°С†РёРё</th><th>РЎСЂ. РІСЂРµРјСЏ Р°СЂС…РёРІР°С†РёРё</th></tr></thead>' +
                            '<tbody>' +
                                weekdays.map(d => (
                                    '<tr><td>' + d.weekday + '</td><td>' + d.publications + '</td><td>' + d.archives + '</td><td>' + d.avg_pub_hour + '</td><td>' + d.avg_arch_hour + '</td></tr>'
                                )).join('') +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div class="plotly-graph" id="weekday-graph-combined"></div>' +
                '</div>'
            ) : '<p>РќРµС‚ РґР°РЅРЅС‹С… РїРѕ РґРЅСЏРј РЅРµРґРµР»Рё</p>') +
        '</div>'
    );

    var skillsBlock = (
        '<div class="skills-monthly-content" data-analysis="skills-monthly-combined" style="display: none;" data-skills-monthly="">' +
            (skillsMonthly.length ? (
                '<div class="tabs month-tabs monthly-skills-month-tabs all-roles-period-tabs" style="justify-content: center; margin-top: 10px;">' +
                    skillsMonthly.map((m, i) => (
                        '<button class="tab-button month-button monthly-skills-month-button all-roles-period-button" onclick="openMonthlySkillsMonthTab(event, \'ms-month-combined-' + (i + 1) + '\')">' + m.month + '</button>'
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
                                    '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">&#9707;</button>' +
                                    '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">&#9636;</button>' +
                                    '<button class="view-mode-btn graph-btn" data-view="graph" title="График">&#9684;</button>' +
                                '</div>' +
                                '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                                    '<div class="table-container">' +
                                        '<table>' +
                                            '<thead><tr><th>РќР°РІС‹Рє</th><th>РЈРїРѕРјРёРЅР°РЅРёР№</th><th>% РїРѕРєСЂС‹С‚РёСЏ</th></tr></thead>' +
                                            '<tbody>' +
                                                exp.skills.map(s => (
                                                    '<tr><td>' + s.skill + '</td><td>' + s.count + '</td><td>' + s.coverage + '%</td></tr>'
                                                )).join('') +
                                            '</tbody>' +
                                        '</table>' +
                                        '<p style="margin-top: 10px; color: var(--text-secondary);">Р’СЃРµРіРѕ РІР°РєР°РЅСЃРёР№ СЃ РЅР°РІС‹РєР°РјРё: ' + exp.total_vacancies + '</p>' +
                                    '</div>' +
                                    '<div class="plotly-graph" id="skills-monthly-graph-combined-' + (i + 1) + '-' + (j + 1) + '"></div>' +
                                '</div>' +
                            '</div>'
                        )).join('') +
                    '</div>'
                )).join('')
            ) : '<p>РќРµС‚ РґР°РЅРЅС‹С… РїРѕ РЅР°РІС‹РєР°Рј</p>') +
        '</div>'
    );

    var skillsSearchBlock = (
        '<div class="skills-search-content" data-analysis="skills-search-combined" style="display: none;">' +
            '<div class="skills-search-panel">' +
                '<div class="skills-search-panel-header">' +
                    '<div class="skills-search-summary-line"></div>' +
                    '<button class="skills-search-toggle" type="button" aria-expanded="true">&#9650;</button>' +
                    '<button class="skills-search-select-all" type="button">Выбрать все</button>' +
                    '<button class="skills-search-reset-skills" type="button">Сбросить навыки</button>' +
                    '<div class="skills-search-dropdown skills-search-logic-inline" data-filter="logic">' +
                        '<button class="skills-search-dropdown-btn" type="button" data-value="or">Логика</button>' +
                        '<div class="skills-search-dropdown-menu"></div>' +
                    '</div>' +
                    '<div class="skills-search-dropdown skills-search-sort-inline" data-filter="sort">' +
                        '<button class="skills-search-dropdown-btn" type="button" data-value="count">Сортировка</button>' +
                        '<div class="skills-search-dropdown-menu"></div>' +
                    '</div>' +
                    '<div class="skills-search-dropdown" data-filter="status">' +
                        '<button class="skills-search-dropdown-btn" type="button" data-value="all">Статус</button>' +
                        '<div class="skills-search-dropdown-menu"></div>' +
                    '</div>' +
                    '<div class="skills-search-dropdown" data-filter="currency" data-multi="1">' +
                        '<button class="skills-search-dropdown-btn" type="button" data-value="all">Валюта</button>' +
                        '<div class="skills-search-dropdown-menu"></div>' +
                    '</div>' +
                    '<div class="skills-search-dropdown" data-filter="country">' +
                        '<button class="skills-search-dropdown-btn" type="button" data-value="all">Страна</button>' +
                        '<div class="skills-search-dropdown-menu"></div>' +
                    '</div>' +
                    '<button class="skills-search-clear" type="button">&#10005;</button>' +
                '</div>' +
                '<div class="skills-search-buttons"></div>' +
            '</div>' +
            '<div class="skills-search-results">' +
                '<div class="skills-search-hint">Выберите навыки, чтобы увидеть вакансии</div>' +
            '</div>' +
        '</div>'
    );

    var salaryBlock = (
        '<div class="salary-content" data-analysis="salary-combined" style="display: none;" data-salary="">' +
            (salaryMonths.length ? (
                '<div class="tabs month-tabs salary-month-tabs all-roles-period-tabs" style="justify-content: center; margin-top: 10px;">' +
                    salaryMonths.map((m, i) => (
                        '<button class="tab-button month-button salary-month-button all-roles-period-button" onclick="openSalaryMonthTab(event, \'sal-month-combined-' + (i + 1) + '\')">' + m.month + '</button>'
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
                                            '<div class="vacancy-table-wrap" style="overflow-x: auto;">' +
                                                '<table class="vacancy-table salary-table">' +
                                                    '<thead><tr><th>РЎС‚Р°С‚СѓСЃ</th><th>Р’Р°Р»СЋС‚Р°</th><th>Р’СЃРµРіРѕ</th><th>С з/п</th><th>% СЃ Р·/Рї</th><th>РЎСЂРµРґРЅСЏСЏ</th><th>РњРµРґРёР°РЅРЅР°СЏ</th><th>РњРѕРґР°Р»СЊРЅР°СЏ</th><th>РњРёРЅ</th><th>РњР°РєСЃ</th><th>РўРѕРї-10 РЅР°РІС‹РєРѕРІ</th></tr></thead>' +
                                                    '<tbody>' +
                                                        exp.entries.map(entry => (
                                                            '<tr class="salary-row" data-vacancies-with="" data-vacancies-without="">' +
                                                                '<td class="status-icon-cell">' + renderStatusIcon(entry.status) + '</td>' +
                                                                '<td>' + entry.currency + '</td>' +
                                                                '<td>' + entry.total_vacancies + '</td>' +
                                                                '<td>' + entry.vacancies_with_salary + '</td>' +
                                                                '<td>' + entry.salary_percentage + '%</td>' +
                                                                '<td>' + Math.round(entry.avg_salary) + '</td>' +
                                                                '<td>' + (entry.median_salary ? Math.round(entry.median_salary) : 'вЂ”') + '</td>' +
                                                                '<td>' + (entry.mode_salary ? Math.round(entry.mode_salary) : 'вЂ”') + '</td>' +
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
                                        buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.salary_view_mode || 'together') +
                                    '</div>' +
                                '</div>' +
                            '</div>'
                        )).join('') +
                    '</div>'
                )).join('')
            ) : '<p>РќРµС‚ РґР°РЅРЅС‹С… РїРѕ Р·Р°СЂРїР»Р°С‚Р°Рј</p>') +
        '</div>'
    );

    var employerBlock = (
        '<div class="employer-analysis-content" data-analysis="employer-analysis-combined" style="display: none;">' +
            (combinedEmployerRows.length ? (
                '<div class="employer-topbar">' +
                    '<div class="tabs month-tabs employer-period-chips" style="justify-content: center; margin: 8px 0;">' +
                        '<button type="button" class="tab-button month-button employer-period-chip active" data-month="all">За период</button>' +
                    '</div>' +
                    '<div class="employer-view-toggle employer-side-toggle">' +
                        buildViewModeButtonsHtml(['together', 'table', 'graph'], 'employer-view-btn', uiState.employer_analysis_view_mode || 'together') +
                    '</div>' +
                '</div>' +
                '<div class="analysis-flex employer-analysis-view" style="justify-content: center; align-items: flex-start;">' +
                    '<div class="employer-analysis-main">' +
                        '<div class="table-container employer-analysis-table-container" style="margin: 0 auto;">' +
                            '<table>' +
                                '<thead>' +
                                    '<tr>' +
                                        '<th>Месяц</th>' +
                                        '<th>Фактор</th>' +
                                        '<th>Значение фактора</th>' +
                                        '<th>Количество</th>' +
                                        '<th>Средняя зарплата, RUR</th>' +
                                        '<th>Средняя зарплата, USD</th>' +
                                        '<th>Средняя зарплата, EUR</th>' +
                                        '<th>Средняя зарплата, Другая валюта</th>' +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody>' + buildCombinedEmployerRawRowsHtml(combinedEmployerRows) + '</tbody>' +
                            '</table>' +
                        '</div>' +
                        '<div class="plotly-graph employer-analysis-graph" style="display: none;"></div>' +
                    '</div>' +
                '</div>'
            ) : '<p>Нет данных по работодателям</p>') +
        '</div>'
    );

    container.innerHTML =
        '<h2>' + roleTitle + '</h2>' +
        '<div class="role-period-label">Период публикации: ' + period + '</div>' +
        '<div class="tabs analysis-tabs">' +
            '<button class="tab-button analysis-button active" data-analysis-id="activity-combined" onclick="switchAnalysis(event, \'activity-combined\')">Анализ активности</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="weekday-combined" onclick="switchAnalysis(event, \'weekday-combined\')">Анализ по дням недели</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="skills-monthly-combined" onclick="switchAnalysis(event, \'skills-monthly-combined\')">Топ-навыки</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="skills-search-combined" onclick="switchAnalysis(event, \'skills-search-combined\')">Поиск по навыкам</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="salary-combined" onclick="switchAnalysis(event, \'salary-combined\')">Анализ зарплат</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="employer-analysis-combined" onclick="switchAnalysis(event, \'employer-analysis-combined\')">Анализ работодателей</button>' +
        '</div>' +
        '<div class="tabs month-tabs activity-only all-roles-period-tabs" style="justify-content: center;">' +
            activityTabs +
        '</div>' +
        activityBlocks +
        weekdayBlock +
        skillsBlock +
        skillsSearchBlock +
        salaryBlock +
        employerBlock;

    container._data = container._data || {};
    container._data.vacancies = combinedVacancies;

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
            applySalaryTablesMarkup(expBlock, expData.entries || []);
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
    var summaryBtns = document.querySelectorAll('.summary-report-btn');
    summaryBtns.forEach(function(btn) {
        btn.classList.toggle('active', !!uiState.all_roles_active);
    });
}
function showSingleRole(idx) {
    var targetId = 'role-' + idx;
    var roleContent = document.getElementById(targetId);
    if (!roleContent) return;
    var salaryMonths = getRoleSalaryData(roleContent);
    var allVacancies = collectVacanciesFromSalaryMonths(salaryMonths);
    var period = computePublicationPeriod(allVacancies) || '';
    var h2 = roleContent.querySelector('h2');
    var periodNode = roleContent.querySelector('.role-period-label');
    if (period) {
        if (!periodNode && h2) {
            periodNode = document.createElement('div');
            periodNode.className = 'role-period-label';
            h2.insertAdjacentElement('afterend', periodNode);
        }
        if (periodNode) periodNode.textContent = 'Период публикации: ' + period;
    } else if (periodNode && periodNode.parentElement) {
        periodNode.parentElement.removeChild(periodNode);
    }
    Array.from(document.getElementsByClassName("role-content")).forEach(function(node) {
        node.style.display = 'none';
    });
    roleContent.style.display = 'block';
    var savedType = uiState.global_analysis_type || uiState[getAnalysisStateKey(targetId)];
    if (savedType) {
        var targetButton = roleContent.querySelector(".analysis-button[data-analysis-id='" + savedType + '-' + idx + "']");
        if (targetButton) {
            targetButton.click();
            updateRoleSelectionUI(new Set([String(idx)]));
            return;
        }
    }
    var firstButton = roleContent.querySelector('.analysis-button');
    if (firstButton) firstButton.click();
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
            var selectedContents = Array.from(selectedIndices || []).map(i => getRoleContentByIndex(i)).filter(Boolean);
            renderAllRolesContainer(allRoles, selectedContents.length ? selectedContents : getAllRoleContents());
        }
        return;
    }

    if (!selectedIndices || !selectedIndices.size) {
        roleContents.forEach(c => c.style.display = 'none');
        if (allRoles) allRoles.style.display = 'none';
        if (combined) {
            combined.style.display = 'block';
            combined.innerHTML = '<div style="padding:16px 12px;color:var(--text-secondary, #52606d);text-align:center;">Нет выбранных ролей</div>';
        }
        return;
    }

    if (selectedIndices.size <= 1) {
        if (combined) combined.style.display = 'none';
        var idx = selectedIndices.size === 1 ? Array.from(selectedIndices)[0] : '1';
        var roleContent = getRoleContentByIndex(idx);
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
        .map(td => '<td>' + escapeHtml(td.textContent.trim() || 'вЂ”') + '</td>')
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
function openEmployerModal(data) {
    var backdrop = document.getElementById('employer-modal-backdrop');
    var body = document.getElementById('employer-modal-body');
    if (!backdrop || !body) return;

    var name = data.name || 'вЂ”';
    var accredited = String(data.accredited || '').toLowerCase() === 'true' ? 'Да' : 'Нет';
    var trusted = String(data.trusted || '').toLowerCase() === 'true' ? 'Да' : 'Нет';
    var rawRating = String(data.rating || '').trim();
    var rating = rawRating && rawRating.toLowerCase() !== 'unknown' ? escapeHtml(rawRating) : 'нет рейтинга';
    var url = data.url ? escapeHtml(String(data.url)) : '';

    var linkHtml = url ? ('<a href=\"' + url + '\" target=\"_blank\" rel=\"noopener\">Открыть страницу компании</a>') : 'вЂ”';

    body.innerHTML =
        '<div class=\"employer-modal-grid\">' +
            '<div class=\"employer-modal-row\"><span>Компания</span><strong>' + escapeHtml(name) + '</strong></div>' +
            '<div class=\"employer-modal-row\"><span>Аккредитация</span><strong>' + accredited + '</strong></div>' +
            '<div class=\"employer-modal-row\"><span>Рейтинг</span><strong>' + rating + '</strong></div>' +
            '<div class=\"employer-modal-row\"><span>Доверие</span><strong>' + trusted + '</strong></div>' +
            '<div class=\"employer-modal-row\"><span>Ссылка</span><strong>' + linkHtml + '</strong></div>' +
        '</div>';

    backdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeEmployerModal() {
    var backdrop = document.getElementById('employer-modal-backdrop');
    if (!backdrop) return;
    backdrop.style.display = 'none';
    document.body.style.overflow = '';
}


