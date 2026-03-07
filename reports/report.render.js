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
            ? '<a class="vacancy-apply-link" href="' + escapeHtml(v.apply_alternate_url) + '" target="_blank" rel="noopener" data-vacancy-id="' + escapeHtml(v.id || '') + '" data-apply-url="' + escapeHtml(v.apply_alternate_url) + '">отклик</a>'
            : '—';
        var roleCell = showRole ? escapeHtml(v.role_name || 'Роль') : '';
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
        var salaryFromNum = Number(v.salary_from);
        var salaryToNum = Number(v.salary_to);
        var salaryFromSort = isFinite(salaryFromNum) ? String(salaryFromNum) : '';
        var salaryToSort = isFinite(salaryToNum) ? String(salaryToNum) : '';
        return '<tr>' +
            '<td>' + idCell + '</td>' +
            (showRole ? '<td>' + roleCell + '</td>' : '') +
            '<td>' + formatCell(v.name) + '</td>' +
            '<td>' + employerCell + '</td>' +
            '<td>' + formatCell(v.city) + '</td>' +
            '<td data-sort-num="' + salaryFromSort + '">' + formatCell(v.salary_from) + '</td>' +
            '<td data-sort-num="' + salaryToSort + '">' + formatCell(v.salary_to) + '</td>' +
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
                    '<th class="salary-sortable">ЗП от</th>' +
                    '<th class="salary-sortable">ЗП до</th>' +
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
        var displayCurrency = entry.currency === 'Не заполнена' ? '—' : entry.currency;
        return '<tr class="salary-row" data-vacancies-with="" data-vacancies-without="">' +
            '<td class="status-icon-cell">' + renderStatusIcon(entry.status) + '</td>' +
            '<td>' + displayCurrency + '</td>' +
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
        '<div class="vacancy-table-wrap" style="overflow-x: auto; margin-bottom: 16px;">' +
            '<h4 style="margin: 0 0 8px;">Сводка вакансий по валютам</h4>' +
            '<table class="vacancy-table salary-table">' +
                '<thead><tr><th>Всего вакансий</th><th>RUR</th><th>USD</th><th>EUR</th><th>Другая</th><th>—</th></tr></thead>' +
                '<tbody>' + coverageRows + '</tbody>' +
            '</table>' +
        '</div>' +
        '<div class="vacancy-table-wrap" style="overflow-x: auto;">' +
            '<h4 style="margin: 0 0 8px;">Статистика зарплат</h4>' +
            '<table class="vacancy-table salary-table">' +
                '<thead><tr><th>Статус</th><th>Валюта</th><th>Найдено</th><th>Средняя</th><th>Медианная</th><th>Модальная</th><th>Мин</th><th>Макс</th><th>Топ-10 навыков</th></tr></thead>' +
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
function buildAllRolesSkillsTableHtml(rows, currency) {
    var curr = String(currency || '').trim().toUpperCase();
    return '<table class="skills-all-table">' +
        '<thead><tr><th>Навык</th><th>Упоминаний</th><th>Средняя з/п' + (curr ? ' (' + curr + ')' : '') + '</th><th>Медианная з/п' + (curr ? ' (' + curr + ')' : '') + '</th><th>Роли</th></tr></thead>' +
        '<tbody>' +
            (rows.length ? rows.map(r => (
                '<tr>' +
                    '<td>' + escapeHtml(r.skill) + '</td>' +
                    '<td>' + r.mention_count + '</td>' +
                    '<td>' + (r.avg_skill_cost !== null && r.avg_skill_cost !== undefined ? r.avg_skill_cost.toFixed(2) : '—') + '</td>' +
                    '<td>' + (r.median_skill_cost !== null && r.median_skill_cost !== undefined ? r.median_skill_cost.toFixed(2) : '—') + '</td>' +
                    '<td>' + (r.roles ? escapeHtml(r.roles) : '—') + '</td>' +
                '</tr>'
            )).join('') : '<tr><td colspan="5">—</td></tr>') +
        '</tbody>' +
    '</table>';
}
function buildAllRolesSalaryTableHtml(rows, currency) {
    var curr = String(currency || '').trim().toUpperCase();
    var list = Array.isArray(rows) ? rows : [];
    return '<table class="skills-all-table salary-all-table">' +
        '<thead><tr><th>Роль</th><th>Кол-во вакансий</th><th>Средняя зарплата' + (curr ? ' (' + curr + ')' : '') + '</th><th>Медианная</th><th>Мода</th><th>Минимальная</th><th>Максимальная</th></tr></thead>' +
        '<tbody>' +
            (list.length ? list.map(function(row) {
                return '<tr>' +
                    '<td>' + escapeHtml(row.name || '') + '</td>' +
                    '<td>' + (row.count || 0) + '</td>' +
                    '<td>' + (row.avg_salary !== null && row.avg_salary !== undefined ? Number(row.avg_salary).toFixed(2) : '—') + '</td>' +
                    '<td>' + (row.median_salary !== null && row.median_salary !== undefined ? Number(row.median_salary).toFixed(2) : '—') + '</td>' +
                    '<td>' + (row.mode_salary !== null && row.mode_salary !== undefined ? Number(row.mode_salary).toFixed(2) : '—') + '</td>' +
                    '<td>' + (row.min_salary !== null && row.min_salary !== undefined ? Number(row.min_salary).toFixed(2) : '—') + '</td>' +
                    '<td>' + (row.max_salary !== null && row.max_salary !== undefined ? Number(row.max_salary).toFixed(2) : '—') + '</td>' +
                '</tr>';
            }).join('') : '<tr><td colspan="7">—</td></tr>') +
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
    var baseRoleVacanciesCache = new Map();
    var rolePeriodVacanciesCache = new Map();

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
        { key: 'today', label: 'Сегодня', period: 'today' },
        { key: 'd3', label: 'За 3 дня', period: 'last_3' },
        { key: 'd7', label: 'За 7 дней', period: 'last_7' },
        { key: 'd14', label: 'За 14 дней', period: 'last_14' }
    ].concat(periods.map(function(month, index) {
        return { key: 'm' + (index + 1), label: month, period: month };
    })).concat([
        { key: 'all', label: allLabel, period: null }
    ]);
    var defaultAllRolesPeriodIndex = Math.max(0, periodItems.length - 1);

    function getRoleFilteredVacancies(roleContent, periodValue) {
        var roleKey = roleContent && (roleContent.dataset.roleId || roleContent.id || roleContent.dataset.roleName) || 'role';
        var baseVacancies = baseRoleVacanciesCache.get(roleKey);
        if (!baseVacancies) {
            baseVacancies = dedupeVacanciesById((getRoleVacancies(roleContent) || []).slice());
            if (selectedPeriods.length && typeof filterVacanciesBySelectedPeriods === 'function') {
                baseVacancies = filterVacanciesBySelectedPeriods(baseVacancies, selectedPeriods);
            }
            if (normalizedSelectedExperiences.length) {
                baseVacancies = baseVacancies.filter(function(vacancy) {
                    var exp = normalizeExperience(vacancy && (vacancy._experience || vacancy.experience) || '');
                    return normalizedSelectedExperiences.indexOf(exp) >= 0;
                });
            }
            baseRoleVacanciesCache.set(roleKey, baseVacancies);
        }

        if (!periodValue || typeof filterVacanciesBySelectedPeriods !== 'function') {
            return baseVacancies;
        }

        var cacheKey = roleKey + '::' + periodValue;
        var periodVacancies = rolePeriodVacanciesCache.get(cacheKey);
        if (!periodVacancies) {
            periodVacancies = filterVacanciesBySelectedPeriods(baseVacancies, [periodValue]);
            rolePeriodVacanciesCache.set(cacheKey, periodVacancies);
        }
        return periodVacancies;
    }

    function computeAllRolesSkillCostSummaryFromVacancies(periodValue) {
        var currencyBuckets = {
            RUR: { totals: new Map(), roleCounts: new Map() },
            USD: { totals: new Map(), roleCounts: new Map() },
            EUR: { totals: new Map(), roleCounts: new Map() }
        };
        var displayNames = new Map();
        function normalizeCurrency(value) {
            var curr = String(value || '').trim().toUpperCase();
            if (curr === 'EURO') return 'EUR';
            if (curr === 'RUR' || curr === 'USD' || curr === 'EUR') return curr;
            return '';
        }

        filteredRoleContents.forEach(function(roleContent) {
            var roleName = roleContent.dataset.roleName || roleContent.dataset.roleId || 'UNKNOWN_ROLE';
            var vacancies = getRoleFilteredVacancies(roleContent, periodValue);
            vacancies.forEach(function(vacancy) {
                if (!vacancy || !vacancy.skills) return;
                var avg = null;
                var from = vacancy.salary_from;
                var to = vacancy.salary_to;
                if (from === null || from === undefined) from = null;
                if (to === null || to === undefined) to = null;
                if (!(from === null && to === null)) {
                    var a = from !== null ? Number(from) : Number(to);
                    var b = to !== null ? Number(to) : Number(from);
                    if (!isNaN(a) && !isNaN(b)) avg = (a + b) / 2.0;
                }
                // Fallback for records where only normalized salary is available.
                if (avg === null) {
                    var normalized = vacancy.converted_salary;
                    if (normalized === null || normalized === undefined || normalized === '') normalized = vacancy.calculated_salary;
                    var normalizedNum = Number(normalized);
                    if (!isNaN(normalizedNum) && isFinite(normalizedNum)) avg = normalizedNum;
                }
                var currency = normalizeCurrency(vacancy.currency);
                String(vacancy.skills).split(',').forEach(function(rawSkill) {
                    var label = String(rawSkill || '')
                        .replace(/\u200e/g, '')
                        .trim()
                        .replace(/\s+/g, ' ');
                    var skill = normalizeSkillName(rawSkill);
                    if (!skill) return;
                    var savedLabel = displayNames.get(skill);
                    if (!savedLabel || (savedLabel === savedLabel.toLowerCase() && label !== label.toLowerCase())) {
                        displayNames.set(skill, label || skill);
                    }
                    if (currency && currencyBuckets[currency]) {
                        var bucket = currencyBuckets[currency];
                        var entry = bucket.totals.get(skill) || { count: 0, sum: 0, salaryCount: 0, salaryValues: [] };
                        entry.count += 1;
                        if (avg !== null) {
                            entry.sum += avg;
                            entry.salaryCount += 1;
                            entry.salaryValues.push(avg);
                        }
                        bucket.totals.set(skill, entry);
                        var roleKey = skill + '||' + roleName;
                        bucket.roleCounts.set(roleKey, (bucket.roleCounts.get(roleKey) || 0) + 1);
                    }
                });
            });
        });

        function buildRows(currency) {
            var bucket = currencyBuckets[currency];
            if (!bucket) return [];
            var rows = Array.from(bucket.totals.entries()).map(function(pair) {
                var skillKey = pair[0];
                var entry = pair[1] || { count: 0, sum: 0, salaryCount: 0, salaryValues: [] };
                return {
                    skill: displayNames.get(skillKey) || skillKey,
                    _skill_key: skillKey,
                    mention_count: entry.count,
                    avg_skill_cost: entry.salaryCount ? Math.round((entry.sum / entry.salaryCount) * 100) / 100 : null,
                    median_skill_cost: entry.salaryValues.length ? Math.round(computeMedian(entry.salaryValues) * 100) / 100 : null,
                    currency: currency
                };
            });
            rows.sort(function(a, b) {
                return (b.mention_count - a.mention_count) || a.skill.localeCompare(b.skill);
            });
            var roleMapBySkill = new Map();
            bucket.roleCounts.forEach(function(count, key) {
                var parts = key.split('||');
                var skill = parts[0];
                var role = parts[1];
                var list = roleMapBySkill.get(skill) || [];
                list.push({ role: role, count: count });
                roleMapBySkill.set(skill, list);
            });
            rows.forEach(function(row) {
                var list = roleMapBySkill.get(row._skill_key) || [];
                list.sort(function(a, b) {
                    return (b.count - a.count) || a.role.localeCompare(b.role);
                });
                row.roles = list.map(function(item) {
                    var pct = row.mention_count ? (item.count * 100.0 / row.mention_count) : 0;
                    return item.role + ' (' + pct.toFixed(2) + '%)';
                }).join(', ');
                delete row._skill_key;
            });
            return rows;
        }

        var rowsByCurrency = {
            RUR: buildRows('RUR'),
            USD: buildRows('USD'),
            EUR: buildRows('EUR')
        };
        var currencies = ['RUR', 'USD', 'EUR'].filter(function(curr) {
            return (rowsByCurrency[curr] || []).length > 0;
        });
        var defaultCurrency = rowsByCurrency.RUR.length ? 'RUR' : (currencies[0] || 'RUR');
        return {
            rows: rowsByCurrency[defaultCurrency] || [],
            rows_by_currency: rowsByCurrency,
            currencies: currencies
        };
    }

    function computeAllRolesSalarySummaryFromVacancies(periodValue) {
        var roleMeta = filteredRoleContents.map(function(roleContent) {
            return {
                id: String(roleContent.dataset.roleId || ''),
                name: String(roleContent.dataset.roleName || ''),
                vacancies: getRoleFilteredVacancies(roleContent, periodValue) || []
            };
        });
        var currencyBuckets = { RUR: [], USD: [], EUR: [] };

        function normalizeCurrency(value) {
            var curr = String(value || '').trim().toUpperCase();
            if (curr === 'EURO') return 'EUR';
            if (curr === 'RUR' || curr === 'USD' || curr === 'EUR') return curr;
            return '';
        }
        function resolveSalaryValue(vacancy) {
            if (!vacancy) return null;
            var from = vacancy.salary_from;
            var to = vacancy.salary_to;
            if (from === null || from === undefined) from = null;
            if (to === null || to === undefined) to = null;
            if (!(from === null && to === null)) {
                var a = from !== null ? Number(from) : Number(to);
                var b = to !== null ? Number(to) : Number(from);
                if (!isNaN(a) && !isNaN(b)) return (a + b) / 2.0;
            }
            var normalized = vacancy.converted_salary;
            if (normalized === null || normalized === undefined || normalized === '') normalized = vacancy.calculated_salary;
            var normalizedNum = Number(normalized);
            if (!isNaN(normalizedNum) && isFinite(normalizedNum)) return normalizedNum;
            return null;
        }
        function round2(value) {
            return Math.round(Number(value || 0) * 100) / 100;
        }
        function computeMode(values) {
            if (!values.length) return null;
            var counts = new Map();
            values.forEach(function(v) {
                var key = Number(v);
                counts.set(key, (counts.get(key) || 0) + 1);
            });
            var bestVal = values[0];
            var bestCount = 0;
            counts.forEach(function(count, val) {
                if (count > bestCount || (count === bestCount && val < bestVal)) {
                    bestCount = count;
                    bestVal = val;
                }
            });
            return bestVal;
        }

        roleMeta.forEach(function(role) {
            var byCurrency = { RUR: [], USD: [], EUR: [] };
            (role.vacancies || []).forEach(function(vacancy) {
                var currency = normalizeCurrency(vacancy && vacancy.currency);
                if (!currency || !byCurrency[currency]) return;
                var salary = resolveSalaryValue(vacancy);
                if (salary === null || !isFinite(salary)) return;
                byCurrency[currency].push(Number(salary));
            });

            Object.keys(byCurrency).forEach(function(currency) {
                var values = byCurrency[currency];
                if (!values.length) return;
                values.sort(function(a, b) { return a - b; });
                var avg = values.reduce(function(sum, value) { return sum + value; }, 0) / values.length;
                currencyBuckets[currency].push({
                    id: role.id,
                    name: role.name,
                    currency: currency,
                    count: values.length,
                    avg_salary: round2(avg),
                    median_salary: round2(computeMedian(values)),
                    mode_salary: round2(computeMode(values)),
                    min_salary: round2(values[0]),
                    max_salary: round2(values[values.length - 1])
                });
            });
        });

        Object.keys(currencyBuckets).forEach(function(currency) {
            currencyBuckets[currency].sort(function(a, b) {
                return (b.avg_salary - a.avg_salary) || String(a.name || '').localeCompare(String(b.name || ''));
            });
        });

        var currencies = ['RUR', 'USD', 'EUR'].filter(function(currency) {
            return (currencyBuckets[currency] || []).length > 0;
        });
        var defaultCurrency = currencyBuckets.RUR.length ? 'RUR' : (currencies[0] || 'RUR');
        return {
            rows: currencyBuckets[defaultCurrency] || [],
            rows_by_currency: currencyBuckets,
            currencies: currencies
        };
    }

    function buildPeriodTabs(prefix, analysisType) {
        return '<div class="tabs month-tabs all-roles-period-tabs">' +
            periodItems.map((p, i) => (
                '<button class="tab-button month-button all-roles-period-button' + (i === defaultAllRolesPeriodIndex ? ' active' : '') + '" ' +
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
                            '<td>' + escapeHtml(r.name) + '</td>' +
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
                'style="display: ' + (i === defaultAllRolesPeriodIndex ? 'block' : 'none') + ';">' +
                '<div class="view-toggle-horizontal">' +
                    buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.activity_view_mode || 'together') +
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
                'style="display: ' + (i === defaultAllRolesPeriodIndex ? 'block' : 'none') + ';">' +
            '<div class="view-toggle-horizontal">' +
                buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.weekday_view_mode || 'together') +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="weekday">' +
                '<div class="table-container">' +
                    '<table>' +
                        '<thead><tr><th>Роль</th><th>Ср. публикаций/день</th><th>Ср. архив/день</th></tr></thead>' +
                        '<tbody>' +
                            rows.map(r => (
                                '<tr><td>' + escapeHtml(r.name) + '</td><td>' + r.avg_pub.toFixed(1) + '</td><td>' + r.avg_arch.toFixed(1) + '</td></tr>'
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
        var rowsByCurrency = summary.rows_by_currency || {};
        var currencies = ['RUR', 'USD', 'EUR'];
        var defaultCurrency = 'RUR';
        var rows = rowsByCurrency[defaultCurrency] || summary.rows || [];
        var graphId = 'skills-graph-all-' + i;
        return '<div id="skills-all-period-' + i + '" class="all-roles-period-content" data-analysis="skills-monthly-all" data-period="' + (p.period || 'all') + '" ' +
                'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" data-currency-entries="' + encodeURIComponent(JSON.stringify(rowsByCurrency)) + '" data-currencies="' + encodeURIComponent(JSON.stringify(currencies)) + '" data-active-currency="' + escapeHtml(defaultCurrency) + '" data-graph-id="' + graphId + '" ' +
                'style="display: ' + (i === defaultAllRolesPeriodIndex ? 'block' : 'none') + ';">' +
            '<div class="view-toggle-horizontal">' +
                buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.skills_monthly_view_mode || 'together') +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                '<div class="table-container">' +
                    buildAllRolesSkillsTableHtml(rows, defaultCurrency) +
                '</div>' +
                '<div class="all-roles-graph skills-all-graph-panel">' +
                    '<div class="stacked-chart-switch chart-switch skills-currency-switch">' +
                        currencies.map(function(curr) {
                            return '<button type="button" class="tab-button stacked-chart-switch-btn skills-currency-switch-btn' + (curr === defaultCurrency ? ' active' : '') + '" data-currency="' + escapeHtml(curr) + '">' + escapeHtml(curr) + '</button>';
                        }).join('') +
                    '</div>' +
                    '<div class="plotly-graph" id="' + graphId + '"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    var skillsHtml = '<div class="skills-monthly-content all-roles-period-wrapper skills-all-summary" data-analysis="skills-monthly-all" style="display: none;">' +
        buildPeriodTabs('skills-all-period', 'skills') +
        skillsPeriodBlocks +
    '</div>';

    var salaryPeriodBlocks = periodItems.map((p, i) => {
        var summary = computeAllRolesSalarySummaryFromVacancies(p.period);
        var rowsByCurrency = summary.rows_by_currency || {};
        var currencies = (summary.currencies && summary.currencies.length) ? summary.currencies : ['RUR'];
        var defaultCurrency = currencies.indexOf('RUR') >= 0 ? 'RUR' : currencies[0];
        var rows = rowsByCurrency[defaultCurrency] || summary.rows || [];
        var graphId = 'salary-graph-all-' + i;
        return '<div id="salary-all-period-' + i + '" class="all-roles-period-content" data-analysis="salary-all" data-period="' + (p.period || 'all') + '" ' +
                'data-entries="' + encodeURIComponent(JSON.stringify(rows)) + '" data-currency-entries="' + encodeURIComponent(JSON.stringify(rowsByCurrency)) + '" data-currencies="' + encodeURIComponent(JSON.stringify(currencies)) + '" data-active-currency="' + escapeHtml(defaultCurrency) + '" data-graph-id="' + graphId + '" ' +
                'style="display: ' + (i === defaultAllRolesPeriodIndex ? 'block' : 'none') + ';">' +
            '<div class="analysis-flex view-mode-container" data-analysis="salary">' +
                '<div class="table-container">' +
                    buildAllRolesSalaryTableHtml(rows, defaultCurrency) +
                '</div>' +
                '<div class="plotly-graph all-roles-graph salary-all-graph-panel">' +
                    '<div class="stacked-chart-switch chart-switch salary-currency-switch">' +
                        currencies.map(function(curr) {
                            return '<button type="button" class="tab-button stacked-chart-switch-btn salary-currency-switch-btn' + (curr === defaultCurrency ? ' active' : '') + '" data-currency="' + escapeHtml(curr) + '">' + escapeHtml(curr) + '</button>';
                        }).join('') +
                    '</div>' +
                    '<div class="stacked-chart-switch chart-switch salary-metric-switch">' +
                        '<button type="button" class="tab-button stacked-chart-switch-btn salary-metric-switch-btn active" data-metric="avg_salary">Средняя</button>' +
                        '<button type="button" class="tab-button stacked-chart-switch-btn salary-metric-switch-btn" data-metric="median_salary">Медианная</button>' +
                        '<button type="button" class="tab-button stacked-chart-switch-btn salary-metric-switch-btn" data-metric="mode_salary">Мода</button>' +
                        '<button type="button" class="tab-button stacked-chart-switch-btn salary-metric-switch-btn" data-metric="min_salary">Минимальная</button>' +
                        '<button type="button" class="tab-button stacked-chart-switch-btn salary-metric-switch-btn" data-metric="max_salary">Максимальная</button>' +
                    '</div>' +
                    '<div class="salary-all-plot-host" id="' + graphId + '"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    var salaryHtml = '<div class="salary-content all-roles-period-wrapper" data-analysis="salary-all" style="display: none;">' +
        buildPeriodTabs('salary-all-period', 'salary') +
        salaryPeriodBlocks +
    '</div>';
    var allRolesFilteredVacancies = [];
    filteredRoleContents.forEach(function(roleContent) {
        allRolesFilteredVacancies = allRolesFilteredVacancies.concat(getRoleFilteredVacancies(roleContent, null) || []);
    });
    allRolesFilteredVacancies = dedupeVacanciesById(allRolesFilteredVacancies);
    var allRolesEmployerMonths = Array.from(new Set(allRolesFilteredVacancies.map(function(vacancy) {
        var d = parsePublishedAtDate(vacancy && vacancy.published_at);
        if (!d) return '';
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }).filter(Boolean))).sort();
    var allRolesEmployerRows = [];
    if (typeof buildEmployerAnalysisRowsFromVacancies === 'function') {
        allRolesEmployerMonths.forEach(function(month) {
            var monthVacancies = filterVacanciesBySelectedPeriods(allRolesFilteredVacancies, [month]);
            allRolesEmployerRows = allRolesEmployerRows.concat(buildEmployerAnalysisRowsFromVacancies(monthVacancies, month));
        });
    }
    var allRolesEmployerAllLabel = allRolesEmployerMonths.length && typeof formatMonthTitle === 'function'
        ? formatMonthTitle(allRolesEmployerMonths.length)
        : 'За период';
    var skillsSearchHtml = '<div class="skills-search-content" data-analysis="skills-search-all" style="display: none;">' +
        '<div class="skills-search-panel">' +
            '<div class="skills-search-panel-header">' +
                '<div class="skills-search-summary-line"></div>' +
                '<button class="skills-search-toggle" type="button" aria-expanded="true">\u25B2</button>' +
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
                '<button class="skills-search-clear" type="button">\u2715</button>' +
            '</div>' +
            '<div class="skills-search-buttons"></div>' +
        '</div>' +
        '<div class="skills-search-results"><div class="skills-search-hint">Выберите навыки, чтобы увидеть вакансии</div></div>' +
    '</div>';
    var employerHtml = '<div class="employer-analysis-content" data-analysis="employer-analysis-all" style="display: none;">' +
        (allRolesEmployerRows.length ? (
            '<div class="employer-topbar">' +
                '<div class="tabs month-tabs employer-period-chips" style="justify-content: center; margin: 8px 0;">' +
                    '<button type="button" class="tab-button month-button employer-period-chip active" data-month="all">' + allRolesEmployerAllLabel + '</button>' +
                '</div>' +
                '<div class="employer-view-toggle employer-side-toggle">' +
                    '<button class="view-mode-btn together-btn employer-view-btn active" data-view="together" title="Вместе">◫</button>' +
                    '<button class="view-mode-btn table-btn employer-view-btn" data-view="table" title="Таблица">▤</button>' +
                    '<button class="view-mode-btn graph-btn employer-view-btn" data-view="graph" title="График">◔</button>' +
                '</div>' +
            '</div>' +
            '<div class="analysis-flex employer-analysis-view" style="justify-content: center; align-items: flex-start;">' +
                '<div class="employer-analysis-main">' +
                    '<div class="table-container employer-analysis-table-container" style="margin: 0 auto;">' +
                        '<table>' +
                            '<thead>' +
                                '<tr>' +
                                    '<th>Месяц</th><th>Фактор</th><th>Значение фактора</th><th>Количество</th>' +
                                    '<th>Средняя зарплата, RUR</th><th>Средняя зарплата, USD</th><th>Средняя зарплата, EUR</th><th>Средняя зарплата, Другая валюта</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' + buildCombinedEmployerRawRowsHtml(allRolesEmployerRows) + '</tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div class="plotly-graph employer-analysis-graph" id="employer-analysis-graph-all" style="display: none;"></div>' +
                '</div>' +
            '</div>'
        ) : '<p>Нет данных анализа работодателей для выбранных ролей</p>') +
    '</div>';

    var summaryReturnTabs = Array.isArray(uiState.summary_return_tabs) ? uiState.summary_return_tabs.slice() : [];
    if (!summaryReturnTabs.length) {
        summaryReturnTabs = [
            { type: 'totals', label: 'Дашборд' },
            { type: 'detail', label: 'Детальный анализ' },
            { type: 'summary', label: 'Сравнительный анализ' },
            { type: 'skills-search', label: 'Поиск по навыкам' },
            { type: 'my-responses', label: 'Мои отклики' }
        ];
    }
    var allRolesPeriod = computePublicationPeriod(allVacancies) || '—';
    var summaryReturnTabsHtml = '<div class="tabs summary-return-tabs">' +
        summaryReturnTabs.map(function(item) {
            var type = String((item && item.type) || '').trim();
            var label = String((item && item.label) || '').trim();
            if (!type || !label) return '';
            if (type === 'summary') {
                return '<button type="button" class="tab-button summary-return-tab active" data-preserve-label="1">' + escapeHtml(label) + '</button>';
            }
            return '<button type="button" class="tab-button analysis-button summary-return-tab" data-preserve-label="1" onclick="switchFromSummaryToAnalysis(\'' + type + '\')">' + escapeHtml(label) + '</button>';
        }).join('') +
    '</div>';

    container.innerHTML =
        '<div class="role-period-label">Период публикации: ' + allRolesPeriod + '</div>' +
        summaryReturnTabsHtml +
        '<div class="tabs analysis-tabs">' +
            '<button class="tab-button analysis-button active" data-analysis-id="activity-all" onclick="switchAnalysis(event, \'activity-all\')">Динамика по ролям</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="weekday-all" onclick="switchAnalysis(event, \'weekday-all\')">Лидер публикаций</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="skills-monthly-all" onclick="switchAnalysis(event, \'skills-monthly-all\')">Топ-навыки</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="salary-all" onclick="switchAnalysis(event, \'salary-all\')">Вилка по ролям</button>' +
        '</div>' +
        buildSharedPeriodTabs() +
        activityHtml +
        weekdayHtml +
        skillsHtml +
        skillsSearchHtml +
        salaryHtml +
        employerHtml;
    container._data = container._data || {};
    container._data.vacancies = allRolesFilteredVacancies;

    var allRolesPeriodBlocks = container.querySelectorAll('.all-roles-period-content');
    allRolesPeriodBlocks.forEach(function(block) {
        block._data = block._data || {};
        block._data.entries = parseJsonDataset(block, 'entries', []);
        block._data.currencyEntries = parseJsonDataset(block, 'currencyEntries', {});
    });

    var preferred = uiState.global_analysis_type || 'activity';
    var preferredButton = container.querySelector('.analysis-button[data-analysis-id="' + preferred + '-all"]');
    if (preferredButton) preferredButton.click();
    else {
        var analysisButton = container.querySelector('.analysis-tabs .analysis-button');
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
        btn.textContent = 'Все';
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
                                '<thead><tr><th>Статус</th><th>Валюта</th><th>Всего</th><th>С з/п</th><th>% с з/п</th><th>Средняя</th><th>Медианная</th><th>Модальная</th><th>Мин</th><th>Макс</th><th>Топ-10 навыков</th></tr></thead>' +
                                '<tbody>' +
                                    summaryExp.entries.map(entry => (
                                        '<tr class="salary-row" data-vacancies-with="" data-vacancies-without="">' +
                                            '<td class="status-icon-cell">' + renderStatusIcon(entry.status) + '</td>' +
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
    var combinedVacanciesRaw = [];

    roleContents.forEach(function(roleContent) {
        combinedVacanciesRaw = combinedVacanciesRaw.concat(getRoleVacancies(roleContent) || []);
    });
    var combinedVacancies = combinedVacanciesRaw.slice();
    combinedVacancies = dedupeVacanciesById(combinedVacancies);
    var combinedMonths = Array.from(new Set(combinedVacancies.map(function(vacancy) {
        var published = typeof parsePublishedAtDate === 'function' ? parsePublishedAtDate(vacancy && vacancy.published_at) : null;
        if (!published) return '';
        return published.getFullYear() + '-' + String(published.getMonth() + 1).padStart(2, '0');
    }).filter(Boolean))).sort().reverse();
    var combinedEmployerPeriods = combinedMonths.slice();
    var combinedEmployerAllLabel = combinedEmployerPeriods.length && typeof formatMonthTitle === 'function'
        ? formatMonthTitle(combinedEmployerPeriods.length)
        : 'За период';

    var period = computePublicationPeriod(combinedVacancies) || '—';
    var combinedSummaryLabel = combinedMonths.length && typeof formatMonthTitle === 'function'
        ? formatMonthTitle(combinedMonths.length)
        : 'За период';
    var combinedActivity = {
        month: combinedSummaryLabel,
        entries: typeof computeActivityEntriesFromVacancies === 'function' ? computeActivityEntriesFromVacancies(combinedVacancies) : []
    };
    var weekdays = typeof computeWeekdayStatsFromVacancies === 'function' ? computeWeekdayStatsFromVacancies(combinedVacancies) : [];
    var skillsMonthly = [];
    function toCombinedSkillsMonth(entry, label) {
        if (!entry) return null;
        if (Array.isArray(entry.experiences)) return entry;
        var skills = Array.isArray(entry.skills) ? entry.skills : [];
        var total = Number(entry.total_vacancies || 0);
        if (!skills.length && !total) return null;
        return {
            month: label || entry.month || 'За период',
            experiences: [{
                experience: 'Все',
                total_vacancies: total,
                skills: skills
            }]
        };
    }
    if (typeof buildSkillsExpDataFromVacancies === 'function') {
        var combinedSkillsSummary = buildSkillsExpDataFromVacancies(combinedVacanciesRaw, combinedSummaryLabel);
        var normalizedSummary = toCombinedSkillsMonth(combinedSkillsSummary, combinedSummaryLabel);
        if (normalizedSummary && normalizedSummary.experiences && normalizedSummary.experiences.length) skillsMonthly.push(normalizedSummary);
        combinedMonths.forEach(function(month) {
            var monthVacancies = filterVacanciesBySelectedPeriods(combinedVacanciesRaw, [month]);
            var monthSkills = buildSkillsExpDataFromVacancies(monthVacancies, month);
            var normalizedMonth = toCombinedSkillsMonth(monthSkills, month);
            if (normalizedMonth && normalizedMonth.experiences && normalizedMonth.experiences.length) skillsMonthly.push(normalizedMonth);
        });
    } else {
        skillsMonthly = aggregateSkillsMonthly(roleContents);
    }
    var salaryMonths = [];
    if (typeof buildSalaryMonthFromVacancies === 'function') {
        var combinedSalarySummary = buildSalaryMonthFromVacancies(combinedVacancies, combinedSummaryLabel);
        if (combinedSalarySummary && combinedSalarySummary.experiences && combinedSalarySummary.experiences.length) {
            salaryMonths.push(combinedSalarySummary);
        }
        combinedMonths.forEach(function(month) {
            var monthVacancies = filterVacanciesBySelectedPeriods(combinedVacancies, [month]);
            var monthSalary = buildSalaryMonthFromVacancies(monthVacancies, month);
            if (monthSalary && monthSalary.experiences && monthSalary.experiences.length) {
                salaryMonths.push(monthSalary);
            }
        });
    } else {
        salaryMonths = aggregateSalary(roleContents);
    }
    var combinedEmployerRows = [];
    if (typeof buildEmployerAnalysisRowsFromVacancies === 'function') {
        combinedMonths.forEach(function(month) {
            var monthVacancies = filterVacanciesBySelectedPeriods(combinedVacancies, [month]);
            combinedEmployerRows = combinedEmployerRows.concat(buildEmployerAnalysisRowsFromVacancies(monthVacancies, month));
        });
    }
    var activityBlocks =
        '<div id="month-combined-summary" class="month-content activity-only" data-entries="' + encodeURIComponent(JSON.stringify(combinedActivity.entries || [])) + '" data-month="' + combinedActivity.month + '">' +
            '<div class="view-toggle-horizontal">' +
                buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.activity_view_mode || 'together') +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="activity">' +
                '<div class="table-container">' +
                    '<table>' +
                        '<thead><tr><th>Опыт</th><th>Всего</th><th>Архивных</th><th>Активных</th><th>Ср. возраст (дни)</th></tr></thead>' +
                        '<tbody>' +
                            combinedActivity.entries.map(e => (
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
                '<div class="plotly-graph" id="activity-graph-combined-summary"></div>' +
            '</div>' +
        '</div>';

    var weekdayBlock = (
        '<div class="weekday-content" data-analysis="weekday-combined" style="display: none;" data-weekdays="">' +
            (weekdays.length ? (
                '<div class="view-toggle-horizontal">' +
                    buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.weekday_view_mode || 'together') +
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
                                    buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.skills_monthly_view_mode || 'together') +
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

    var skillsSearchBlock = (
        '<div class="skills-search-content" data-analysis="skills-search-combined" style="display: none;">' +
            '<div class="skills-search-panel">' +
                '<div class="skills-search-panel-header">' +
                    '<div class="skills-search-summary-line"></div>' +
                    '<button class="skills-search-save-favorite skills-search-icon-btn" type="button" title="Сохранить набор" aria-label="Сохранить набор">⤓</button>' +
                    '<div class="skills-search-dropdown skills-search-favorite-inline" data-filter="favorite">' +
                        '<button class="skills-search-dropdown-btn skills-search-icon-btn" type="button" data-value="" title="Избранное" aria-label="Избранное">❤</button>' +
                        '<div class="skills-search-dropdown-menu"></div>' +
                    '</div>' +
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
                                                    '<thead><tr><th>Статус</th><th>Валюта</th><th>Всего</th><th>С з/п</th><th>% с з/п</th><th>Средняя</th><th>Медианная</th><th>Модальная</th><th>Мин</th><th>Макс</th><th>Топ-10 навыков</th></tr></thead>' +
                                                    '<tbody>' +
                                                        exp.entries.map(entry => (
                                                            '<tr class="salary-row" data-vacancies-with="" data-vacancies-without="">' +
                                                                '<td class="status-icon-cell">' + renderStatusIcon(entry.status) + '</td>' +
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
                                        buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.salary_view_mode || 'together') +
                                    '</div>' +
                                '</div>' +
                            '</div>'
                        )).join('') +
                    '</div>'
                )).join('')
            ) : '<p>Нет данных по зарплатам</p>') +
        '</div>'
    );

    var employerBlock = (
        '<div class="employer-analysis-content" data-analysis="employer-analysis-combined" style="display: none;">' +
            (combinedEmployerRows.length ? (
                '<div class="employer-topbar">' +
                    '<div class="tabs month-tabs employer-period-chips" style="justify-content: center; margin: 8px 0;">' +
                        '<button type="button" class="tab-button month-button employer-period-chip" data-month="today">Сегодня</button>' +
                        '<button type="button" class="tab-button month-button employer-period-chip" data-month="last_3">За 3 дня</button>' +
                        '<button type="button" class="tab-button month-button employer-period-chip" data-month="last_7">За 7 дней</button>' +
                        '<button type="button" class="tab-button month-button employer-period-chip" data-month="last_14">За 14 дней</button>' +
                        '<button type="button" class="tab-button month-button employer-period-chip active" data-month="all">' + combinedEmployerAllLabel + '</button>' +
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
                        '<div class="employer-analysis-graph" style="display: none;"></div>' +
                    '</div>' +
                '</div>'
            ) : '<p>Нет данных по работодателям</p>') +
        '</div>'
    );

    container.innerHTML =
        '<div class="role-period-label">Период публикации: ' + period + '</div>' +
        '<div class="tabs analysis-tabs">' +
            '<button class="tab-button analysis-button active" data-analysis-id="activity-combined" onclick="switchAnalysis(event, \'activity-combined\')">Динамика вакансий</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="weekday-combined" onclick="switchAnalysis(event, \'weekday-combined\')">Дни активности</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="skills-monthly-combined" onclick="switchAnalysis(event, \'skills-monthly-combined\')">Топ-навыки</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="skills-search-combined" onclick="switchAnalysis(event, \'skills-search-combined\')">Поиск по навыкам</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="salary-combined" onclick="switchAnalysis(event, \'salary-combined\')">Вилка зарплат</button>' +
            '<button class="tab-button analysis-button" data-analysis-id="employer-analysis-combined" onclick="switchAnalysis(event, \'employer-analysis-combined\')">Анализ компаний</button>' +
        '</div>' +
        activityBlocks +
        weekdayBlock +
        skillsBlock +
        skillsSearchBlock +
        salaryBlock +
        employerBlock;

    container._data = container._data || {};
    container._data.vacancies = combinedVacancies;
    container._data.skillsVacancies = combinedVacanciesRaw;

    var monthBlocks = container.querySelectorAll('.month-content');
    monthBlocks.forEach(function(block) {
        block._data = { entries: combinedActivity.entries || [], month: combinedActivity.month || '' };
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

    var savedType = uiState[getAnalysisStateKey(container.id)] || uiState.global_analysis_type || 'totals';
    var targetButton = container.querySelector(".analysis-button[data-analysis-id='" + savedType + "-combined']");
    if (targetButton) targetButton.click();
    else {
        var analysisButton = container.querySelector('.analysis-tabs .analysis-button');
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
    var allVacancies = dedupeVacanciesById((getRoleVacancies(roleContent) || []).slice());
    if (!allVacancies.length) {
        var salaryMonths = getRoleSalaryData(roleContent);
        allVacancies = collectVacanciesFromSalaryMonths(salaryMonths);
    }
    var period = computePublicationPeriod(allVacancies) || '';
    var h2 = roleContent.querySelector('h2');
    var periodNode = roleContent.querySelector('.role-period-label');
    if (period) {
        if (!periodNode) {
            periodNode = document.createElement('div');
            periodNode.className = 'role-period-label';
            if (h2) h2.insertAdjacentElement('afterend', periodNode);
            else roleContent.insertAdjacentElement('afterbegin', periodNode);
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
function getSelectedRoleContents(selectedIndices) {
    return Array.from(selectedIndices || []).map(function(idx) {
        return getRoleContentByIndex(idx);
    }).filter(Boolean);
}
function resolveRoleViewMode(selectedIndices) {
    if (uiState.all_roles_active) return 'all';
    if (!selectedIndices || !selectedIndices.size) return 'empty';
    if (selectedIndices.size === 1) return 'single';
    return 'combined';
}
function buildUnifiedTabsDataContract(selectedIndices) {
    var normalizedSelected = selectedIndices instanceof Set ? selectedIndices : new Set(Array.from(selectedIndices || []));
    var selectedRoleContents = getSelectedRoleContents(normalizedSelected);
    return {
        version: 1,
        mode: resolveRoleViewMode(normalizedSelected),
        selected_indices: Array.from(normalizedSelected),
        selected_role_ids: selectedRoleContents.map(function(roleContent) {
            return String(roleContent.dataset.roleId || roleContent.id || '');
        }),
        selected_role_names: selectedRoleContents.map(function(roleContent) {
            return String(roleContent.dataset.roleName || roleContent.dataset.roleId || roleContent.id || '');
        }),
        active_analysis: uiState.global_analysis_type || 'totals',
        tabs: {
            activity: { key: 'activity', enabled: true },
            weekday: { key: 'weekday', enabled: true },
            salary: { key: 'salary', enabled: true },
            skills_monthly: { key: 'skills-monthly', enabled: true },
            employer_analysis: { key: 'employer-analysis', enabled: true }
        },
        all_roles_active: !!uiState.all_roles_active,
        global_filters: uiState.global_filters || {}
    };
}
function findAnalysisButtonByType(container, analysisType) {
    if (!container) return null;
    var targetType = String(analysisType || '').trim();
    if (!targetType) return null;
    return Array.from(container.querySelectorAll('.analysis-button[data-analysis-id]')).find(function(btn) {
        var id = String((btn.dataset && btn.dataset.analysisId) || '');
        return id.indexOf(targetType + '-') === 0;
    }) || null;
}
function getActiveRoleContainerForContext(context) {
    if (!context) return null;
    if (context.mode === 'all') return context.allRoles || null;
    if (context.mode === 'combined' || context.mode === 'empty') return context.combined || null;
    if (context.mode === 'single' && context.selectedIndices && context.selectedIndices.size === 1) {
        return getRoleContentByIndex(Array.from(context.selectedIndices)[0]);
    }
    return null;
}
function buildAllRolesRenderSignature(selectedIndices) {
    var roleIds = Array.from(selectedIndices || []).map(function(idx) {
        var roleContent = getRoleContentByIndex(idx);
        return roleContent && (roleContent.dataset.roleId || roleContent.id || String(idx)) || String(idx);
    }).sort();
    var filters = uiState.global_filters || {};
    return JSON.stringify({
        roles: roleIds,
        periods: filters.periods || null,
        experiences: filters.experiences || null
    });
}
function getUnifiedRoleStrategies() {
    return {
        all: function(context) {
            context.roleContents.forEach(function(content) {
                content.style.display = 'none';
            });
            if (context.combined) context.combined.style.display = 'none';
            if (!context.allRoles) return;
            context.allRoles.style.display = 'block';
            var selectedContents = context.selectedRoleContents.length ? context.selectedRoleContents : getAllRoleContents();
            var renderSignature = buildAllRolesRenderSignature(context.selectedIndices);
            if (context.allRoles.dataset.renderSignature !== renderSignature) {
                renderAllRolesContainer(context.allRoles, selectedContents);
                context.allRoles.dataset.renderSignature = renderSignature;
                return;
            }
            var preferred = uiState.global_analysis_type || 'totals';
            var targetButton = context.allRoles.querySelector('.analysis-button[data-analysis-id="' + preferred + '-all"]');
            if (!targetButton) targetButton = context.allRoles.querySelector('.analysis-button[data-analysis-id="activity-all"]');
            if (targetButton) targetButton.click();
        },
        empty: function(context) {
            context.roleContents.forEach(function(content) {
                content.style.display = 'none';
            });
            if (context.allRoles) context.allRoles.style.display = 'none';
            if (!context.combined) return;
            context.combined.style.display = 'block';
            context.combined.innerHTML = '<div style="padding:16px 12px;color:var(--text-secondary, #52606d);text-align:center;">Нет выбранных ролей</div>';
        },
        single: function(context) {
            if (context.combined) context.combined.style.display = 'none';
            var idx = context.selectedIndices.size === 1 ? Array.from(context.selectedIndices)[0] : '1';
            showSingleRole(idx);
        },
        combined: function(context) {
            context.roleContents.forEach(function(content) {
                content.style.display = 'none';
            });
            if (!context.combined) return;
            context.combined.style.display = 'block';
            renderCombinedContainer(context.combined, context.selectedRoleContents);
        }
    };
}
function renderRoleViewWithStrategy(context) {
    var strategies = getUnifiedRoleStrategies();
    var strategy = strategies[context.mode];
    if (!strategy) strategy = strategies.single;
    strategy(context);
}
function renderRoleViewUnifiedV2(context) {
    renderRoleViewWithStrategy(context);
    var activeContainer = getActiveRoleContainerForContext(context);
    if (!activeContainer) return;
    activeContainer.__unifiedTabsDataContract = context.contract;
    var activeAnalysis = context.contract ? context.contract.active_analysis : '';
    if (activeAnalysis === 'activity' || activeAnalysis === 'weekday' || activeAnalysis === 'salary' || activeAnalysis === 'skills-monthly' || activeAnalysis === 'employer-analysis') {
        var targetBtn = findAnalysisButtonByType(activeContainer, activeAnalysis);
        if (targetBtn && !targetBtn.classList.contains('active')) targetBtn.click();
    }
}
function updateRoleView(selectedIndices) {
    var normalizedSelected = selectedIndices instanceof Set ? selectedIndices : new Set(Array.from(selectedIndices || []));
    var combined = document.getElementById('role-combined');
    var allRoles = document.getElementById('role-all');
    var roleContents = Array.from(document.querySelectorAll('.role-content')).filter(c => c.id !== 'role-combined');
    var contract = buildUnifiedTabsDataContract(normalizedSelected);
    var context = {
        mode: contract.mode,
        contract: contract,
        selectedIndices: normalizedSelected,
        selectedRoleContents: getSelectedRoleContents(normalizedSelected),
        combined: combined,
        allRoles: allRoles,
        roleContents: roleContents
    };
    renderRoleViewUnifiedV2(context);
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
function openEmployerModal(data) {
    var backdrop = document.getElementById('employer-modal-backdrop');
    var body = document.getElementById('employer-modal-body');
    if (!backdrop || !body) return;

    var name = data.name || '—';
    var accredited = String(data.accredited || '').toLowerCase() === 'true' ? 'Да' : 'Нет';
    var trusted = String(data.trusted || '').toLowerCase() === 'true' ? 'Да' : 'Нет';
    var rawRating = String(data.rating || '').trim();
    var rating = rawRating && rawRating.toLowerCase() !== 'unknown' ? escapeHtml(rawRating) : 'нет рейтинга';
    var url = data.url ? escapeHtml(String(data.url)) : '';

    var linkHtml = url ? ('<a href=\"' + url + '\" target=\"_blank\" rel=\"noopener\">Открыть страницу компании</a>') : '—';

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



