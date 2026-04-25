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
function computeAvgLifetimeDays(vacancies) {
    var totalDays = 0;
    var count = 0;
    (vacancies || []).forEach(v => {
        if (!v || !v.published_at || !v.archived_at) return;
        var pub = new Date(v.published_at);
        var arch = new Date(v.archived_at);
        if (isNaN(pub) || isNaN(arch)) return;
        var diffMs = arch - pub;
        if (diffMs < 0) return;
        totalDays += diffMs / (1000 * 60 * 60 * 24);
        count += 1;
    });
    return count ? (totalDays / count) : null;
}
function buildLifetimeMapsFromSalaryMonths(salaryMonths) {
    var byMonth = {};
    var byMonthTotal = {};
    var overallByExp = {};
    var overallTotal = null;

    (salaryMonths || []).forEach(m => {
        if (!m || !m.month || isSummaryMonth(m.month)) return;
        byMonth[m.month] = byMonth[m.month] || {};
        var monthAll = [];
        (m.experiences || []).forEach(exp => {
            var expAll = [];
            (exp.entries || []).forEach(entry => {
                expAll = expAll.concat(entry.vacancies_with_salary_list || []);
                expAll = expAll.concat(entry.vacancies_without_salary_list || []);
            });
            if (expAll.length) {
                byMonth[m.month][exp.experience] = computeAvgLifetimeDays(expAll);
                monthAll = monthAll.concat(expAll);
            }
            if (expAll.length) {
                overallByExp[exp.experience] = overallByExp[exp.experience] || [];
                overallByExp[exp.experience] = overallByExp[exp.experience].concat(expAll);
            }
        });
        if (monthAll.length) {
            byMonthTotal[m.month] = computeAvgLifetimeDays(monthAll);
        }
    });

    var allVacs = [];
    Object.keys(overallByExp).forEach(exp => {
        allVacs = allVacs.concat(overallByExp[exp]);
        overallByExp[exp] = computeAvgLifetimeDays(overallByExp[exp]);
    });
    if (allVacs.length) overallTotal = computeAvgLifetimeDays(allVacs);

    return { byMonth: byMonth, byMonthTotal: byMonthTotal, overallByExp: overallByExp, overallTotal: overallTotal };
}
function applyLifetimeToActivityMonths(activityMonths, lifetimeMaps) {
    if (!activityMonths || !activityMonths.length) return;
    activityMonths.forEach(m => {
        if (isSummaryMonth(m.month)) {
            (m.entries || []).forEach(e => {
                if (e.experience === 'Всего') {
                    e.avg_age = lifetimeMaps.overallTotal;
                } else {
                    e.avg_age = lifetimeMaps.overallByExp[e.experience];
                }
            });
        } else {
            var monthMap = lifetimeMaps.byMonth[m.month] || {};
            (m.entries || []).forEach(e => {
                if (e.experience === 'Всего') {
                    e.avg_age = lifetimeMaps.byMonthTotal[m.month];
                } else {
                    e.avg_age = monthMap[e.experience];
                }
            });
        }

        // пересчитать максимум возраста
        var maxAge = null;
        (m.entries || []).forEach(e => {
            if (e.experience === 'Всего') return;
            if (e.avg_age === null || e.avg_age === undefined) return;
            if (maxAge === null || e.avg_age > maxAge) maxAge = e.avg_age;
        });
        (m.entries || []).forEach(e => {
            e.is_max_age = (maxAge !== null && e.avg_age === maxAge);
        });
    });
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
function collectVacanciesFromSalaryMonthsByMonth(salaryMonths, month) {
    var all = [];
    (salaryMonths || []).forEach(m => {
        if (!m || !m.month) return;
        if (month) {
            if (m.month !== month) return;
        } else {
            if (isSummaryMonth(m.month)) return;
        }
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
function collectVacanciesWithMetaFromSalaryMonths(salaryMonths, month) {
    var all = [];
    (salaryMonths || []).forEach(m => {
        if (!m || !m.month || isSummaryMonth(m.month)) return;
        if (month && m.month !== month) return;
        if (!m.experiences) return;
        m.experiences.forEach(exp => {
            (exp.entries || []).forEach(entry => {
                var status = entry.status || '';
                var displayCurrency = entry.currency || '';
                var withList = entry.vacancies_with_salary_list || [];
                var withoutList = entry.vacancies_without_salary_list || [];
                function push(list) {
                    list.forEach(v => {
                        if (!v) return;
                        var copy = Object.assign({}, v);
                        copy._experience = exp.experience;
                        copy._status = status;
                        copy._currency = displayCurrency;
                        all.push(copy);
                    });
                }
                push(withList);
                push(withoutList);
            });
        });
    });
    return all;
}
function getRoleContentByIndex(idx) {
    return document.getElementById('role-' + idx);
}
function getSelectableRoleContents() {
    return Array.from(document.querySelectorAll('.role-content'))
        .filter(c => /^role-\d+$/.test(c.id));
}
function getRoleMetaList() {
    return getSelectableRoleContents().map(function(c) {
        var idxMatch = String(c.id || '').match(/^role-(\d+)$/);
        var index = idxMatch ? idxMatch[1] : '';
        return {
            index: index,
            id: c.dataset.roleId || '',
            name: c.dataset.roleName || ''
        };
    }).filter(function(item) { return !!item.index; });
}
function getRoleMetaByIndex(idx) {
    var key = String(idx || '');
    return getRoleMetaList().find(function(item) { return item.index === key; }) || null;
}
function getAllRoleContents() {
    return Array.from(document.querySelectorAll('.role-content'))
        .filter(c => c.id !== 'role-combined' && c.id !== 'role-all');
}
function getRoleSalaryData(roleContent) {
    var salaryBlock = roleContent.querySelector('.salary-content');
    if (!salaryBlock) return [];
    salaryBlock._data = salaryBlock._data || {};
    if (salaryBlock._data.salary !== undefined) return salaryBlock._data.salary;
    var embedded = parseJsonDataset(salaryBlock, 'salary', []);
    if (embedded && embedded.length) {
        salaryBlock._data.salary = embedded;
        return embedded;
    }
    if (typeof buildSalaryMonthsFromVacancies === 'function') {
        var vacancies = getRoleVacancies(roleContent);
        salaryBlock._data.salary = buildSalaryMonthsFromVacancies(vacancies || []);
        return salaryBlock._data.salary;
    }
    salaryBlock._data.salary = [];
    return salaryBlock._data.salary;
}
function isSalarySummaryExperience(expName) {
    return String(expName || '').trim().toLowerCase() === 'все';
}
function getRoleVacancies(roleContent) {
    if (!roleContent) return [];
    if (!roleContent._data) roleContent._data = {};
    if (roleContent._data.vacancies !== undefined) return roleContent._data.vacancies;
    roleContent._data.vacancies = parseJsonDataset(roleContent, 'vacancies', []);
    return roleContent._data.vacancies;
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
            avg_age: entries.reduce((s, e) => s + ((e.avg_age || 0) * (e.total || 0)), 0) / (entries.reduce((s, e) => s + (e.total || 0), 0) || 1),
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
            avg_age: summaryEntries.reduce((s, e) => s + ((e.avg_age || 0) * (e.total || 0)), 0) / (summaryEntries.reduce((s, e) => s + (e.total || 0), 0) || 1),
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
    var byTotal = {};
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

                var totalBucket = byTotal[exp.experience] || { total: 0, skills: new Map() };
                totalBucket.total += exp.total_vacancies || 0;
                (exp.skills || []).forEach(s => {
                    totalBucket.skills.set(s.skill, (totalBucket.skills.get(s.skill) || 0) + (s.count || 0));
                });
                byTotal[exp.experience] = totalBucket;
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

    if (monthsList.length > 0) monthsList.unshift({ month: formatMonthTitle(monthsList.length), experiences: buildExpList(byTotal) });

    return monthsList;
}
function computeSalaryValue(v, currency) {
    if (currency === '%USD' || currency === '\u0414\u0440\u0443\u0433\u0430\u044f') {
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
            top_skills: buildTopSkills((b.with || []).concat(b.without || [])),
            vacancy_ids: [],
            vacancies_with_salary_list: b.with,
            vacancies_without_salary_list: b.without
        };
    });
    entries.sort((a, b) => (a.status !== 'Открытая') - (b.status !== 'Открытая') || a.status.localeCompare(b.status));
    return entries;
}
function buildSalaryExperienceProgressPanelsModel(payload) {
    var data = payload || {};
    var experiences = Array.isArray(data.experiences) ? data.experiences.slice() : [];
    var selectedExperience = String(data.selectedExperience || '').trim();
    var preferredCurrencies = ['RUR', 'USD', 'EUR'];
    var metricOrder = [
        { key: 'min_salary', label: 'Мин' },
        { key: 'mode_salary', label: 'Мода' },
        { key: 'median_salary', label: 'Медиана' },
        { key: 'avg_salary', label: 'Среднее' },
        { key: 'max_salary', label: 'Макс' }
    ];
    var extraStatusOrder = ['new', 'period_archived'];

    function normalizeCurrency(value) {
        var current = String(value || '').trim().toUpperCase();
        if (!current) return 'Не заполнена';
        if (current === 'RUB') return 'RUR';
        if (current === 'EURO') return 'EUR';
        if (current === 'ДРУГАЯ') return 'Другая';
        return current;
    }
    function normalizeStatusMeta(statusLabel) {
        var label = String(statusLabel || '').trim();
        var normalized = label.toLowerCase();
        if (normalized === 'открытая' || normalized === 'открытые') {
            return { key: 'open', label: 'Открытая' };
        }
        if (normalized === 'архивная' || normalized === 'архивные') {
            return { key: 'archived', label: 'Архивная' };
        }
        if (normalized === 'новые за период' || normalized === 'новые') {
            return { key: 'new', label: 'Новые за период' };
        }
        if (normalized === 'опубл. и архив. за период' || normalized === 'опубл. и архивир.' || normalized === 'опубликована и архивирована') {
            return { key: 'period_archived', label: 'Опубл. и архив. за период' };
        }
        return { key: normalized || 'other', label: label || 'Не указано' };
    }
    function computeEntryMetric(entry, metricKey, currency) {
        var directValue = Number(entry && entry[metricKey]);
        if (entry && entry[metricKey] !== null && entry[metricKey] !== undefined && isFinite(directValue)) return directValue;
        var withSalary = entry && Array.isArray(entry.vacancies_with_salary_list) ? entry.vacancies_with_salary_list : [];
        var values = withSalary.map(function(vacancy) {
            return computeSalaryValue(vacancy || {}, currency);
        }).filter(function(value) {
            return value !== null && value !== undefined && isFinite(value);
        }).map(function(value) {
            return Number(value);
        });
        if (!values.length) return null;
        if (metricKey === 'min_salary') return Math.min.apply(Math, values);
        if (metricKey === 'max_salary') return Math.max.apply(Math, values);
        if (metricKey === 'median_salary') return computeMedian(values);
        if (metricKey === 'mode_salary') return computeMode(values);
        if (metricKey === 'avg_salary') {
            return values.reduce(function(sum, value) { return sum + value; }, 0) / values.length;
        }
        return null;
    }
    function buildPositions(count) {
        if (!count) return [];
        if (count === 1) return [50];
        if (count === 2) return [0, 100];
        if (count === 3) return [0, 50, 100];
        if (count === 4) return [0, 38, 64, 100];
        return [0, 24, 50, 76, 100];
    }
    function assignPointRows(points) {
        var minHorizontalGap = 12;
        var maxRows = 3;
        var lastLeftByRow = [];
        return (points || []).map(function(point) {
            var clone = Object.assign({}, point);
            var left = Number(clone.positionPct);
            var assignedRow = maxRows - 1;
            for (var rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
                var lastLeft = lastLeftByRow[rowIndex];
                if (!isFinite(lastLeft) || left - lastLeft >= minHorizontalGap) {
                    assignedRow = rowIndex;
                    break;
                }
            }
            clone.pointRow = assignedRow;
            lastLeftByRow[assignedRow] = left;
            return clone;
        });
    }
    function buildMetricPoints(entry, currency) {
        var directWithSalary = Number(entry && entry.vacancies_with_salary);
        var directSalaryList = entry && Array.isArray(entry.vacancies_with_salary_list) ? entry.vacancies_with_salary_list : [];
        if (!(directWithSalary > 0) && !directSalaryList.length) return [];
        var rawPoints = [];
        metricOrder.forEach(function(metric) {
            var value = computeEntryMetric(entry, metric.key, currency);
            if (value === null || value === undefined || !isFinite(value)) return;
            rawPoints.push({ value: Number(value), label: metric.label });
        });
        rawPoints.sort(function(a, b) {
            return a.value - b.value;
        });
        var grouped = [];
        rawPoints.forEach(function(point) {
            var last = grouped.length ? grouped[grouped.length - 1] : null;
            if (last && last.value === point.value) {
                last.labels.push(point.label);
            } else {
                grouped.push({ value: point.value, labels: [point.label] });
            }
        });
        var positions = buildPositions(grouped.length);
        return assignPointRows(grouped.map(function(point, index) {
            return {
                value: point.value,
                labels: point.labels.join(', '),
                positionPct: positions[index]
            };
        }));
    }
    function sortCurrencies(values) {
        return values.slice().sort(function(a, b) {
            var left = preferredCurrencies.indexOf(a);
            var right = preferredCurrencies.indexOf(b);
            if (left === -1 && right === -1) return String(a).localeCompare(String(b), 'ru');
            if (left === -1) return 1;
            if (right === -1) return -1;
            return left - right;
        });
    }
    function buildTracksForEntries(entries, currency) {
        var list = Array.isArray(entries) ? entries : [];
        var mapped = {};
        var extras = [];
        list.forEach(function(entry) {
            var meta = normalizeStatusMeta(entry && entry.status);
            mapped[meta.key] = {
                statusKey: meta.key,
                statusLabel: meta.label,
                points: buildMetricPoints(entry, currency)
            };
            if (extraStatusOrder.indexOf(meta.key) >= 0 && extras.indexOf(meta.key) === -1) extras.push(meta.key);
        });
        var trackKeys = ['open', 'archived'].concat(extraStatusOrder.filter(function(key) {
            return extras.indexOf(key) >= 0;
        }));
        return trackKeys.map(function(key) {
            if (mapped[key]) {
                var existing = mapped[key];
                return Object.assign({}, existing, {
                    maxValue: existing.points.length
                        ? Math.max.apply(Math, existing.points.map(function(point) { return point.value; }))
                        : 0,
                    empty: !existing.points.length
                });
            }
            var fallbackMeta = normalizeStatusMeta(
                key === 'open' ? 'Открытая'
                    : (key === 'archived' ? 'Архивная'
                        : (key === 'new' ? 'Новые за период' : 'Опубл. и архив. за период'))
            );
            return {
                statusKey: key,
                statusLabel: fallbackMeta.label,
                points: [],
                maxValue: 0,
                empty: true
            };
        });
    }

    var filteredExperiences = experiences.filter(function(item) {
        if (!item) return false;
        if (typeof isSalarySummaryExperience === 'function' && isSalarySummaryExperience(item.experience)) return false;
        return true;
    }).map(function(item) {
        return {
            experience: normalizeExperience(item.experience),
            entries: Array.isArray(item.entries) ? item.entries.slice() : []
        };
    });

    if (selectedExperience) {
        filteredExperiences = filteredExperiences.filter(function(item) {
            return normalizeExperience(item.experience) === normalizeExperience(selectedExperience);
        });
    }

    var currencyMap = {};
    filteredExperiences.forEach(function(experienceRow) {
        var experienceName = normalizeExperience(experienceRow.experience);
        var entryGroups = {};
        (experienceRow.entries || []).forEach(function(entry) {
            var currency = normalizeCurrency(entry && entry.currency);
            entryGroups[currency] = entryGroups[currency] || [];
            entryGroups[currency].push(entry);
        });
        Object.keys(entryGroups).forEach(function(currency) {
            currencyMap[currency] = currencyMap[currency] || [];
            currencyMap[currency].push({
                experience: experienceName,
                tracks: buildTracksForEntries(entryGroups[currency], currency)
            });
        });
    });

    var currencies = Object.keys(currencyMap);
    currencies = sortCurrencies(currencies).filter(function(currency) {
        return !!(currencyMap[currency] && currencyMap[currency].some(function(experienceRow) {
            return Array.isArray(experienceRow.tracks) && experienceRow.tracks.some(function(track) {
                return Array.isArray(track.points) && track.points.length;
            });
        }));
    });

    return {
        mode: selectedExperience ? 'single-experience' : 'all-experiences',
        selectedExperience: selectedExperience,
        currencies: currencies.map(function(currency) {
            var experienceRows = (currencyMap[currency] || []).slice();
            experienceRows.sort(function(a, b) {
                var expOrder = typeof getExperienceOrder === 'function' ? getExperienceOrder() : {};
                return (expOrder[normalizeExperience(a.experience)] || 99) - (expOrder[normalizeExperience(b.experience)] || 99);
            });
            return {
                currency: currency,
                experiences: selectedExperience
                    ? (experienceRows.length ? experienceRows : [{
                        experience: normalizeExperience(selectedExperience),
                        tracks: buildTracksForEntries([], currency)
                    }])
                    : experienceRows
            };
        })
    };
}
function buildSalaryOverviewChartModel(payload) {
    var data = payload || {};
    var selectedExperience = String(data.selectedExperience || '').trim();
    var selectedCurrency = String(data.selectedCurrency || '').trim().toUpperCase();
    var experiences = Array.isArray(data.experiences) ? data.experiences.slice() : [];
    var preferredCurrencies = ['RUR', 'USD', 'EUR'];
    var experiencePalette = ['#49c8f2', '#007AD8', '#d79cfb', '#8b5cf6', '#00C3D3'];
    var metricDefs = [
        { key: 'min_salary', label: 'Мин', color: experiencePalette[0] },
        { key: 'mode_salary', label: 'Мода', color: experiencePalette[1] },
        { key: 'median_salary', label: 'Медиана', color: experiencePalette[2] },
        { key: 'avg_salary', label: 'Среднее', color: experiencePalette[3] },
        { key: 'max_salary', label: 'Макс', color: experiencePalette[4] }
    ];
    metricDefs = metricDefs.map(function(item, index) {
        var metricPalette = ['#00C3D3', '#007AD8', '#49c8f2', '#d79cfb', '#8b5cf6'];
        return Object.assign({}, item, {
            color: metricPalette[index] || item.color
        });
    });
    experiencePalette = [
        { color: '#49c8f2', gradient: 'linear-gradient(135deg, #8fe9f7 0%, #49c8f2 55%, #5f95ff 100%)', textColor: '#49c8f2' },
        { color: '#007AD8', gradient: 'linear-gradient(135deg, #00C3D3 0%, #007AD8 55%, #D149EF 100%)', textColor: '#007AD8' },
        { color: '#d79cfb', gradient: 'linear-gradient(135deg, #efc3ff 0%, #d79cfb 55%, #b58cff 100%)', textColor: '#d79cfb' },
        { color: '#8b5cf6', gradient: 'linear-gradient(135deg, #f38bff 0%, #8b5cf6 100%)', textColor: '#8b5cf6' },
        { color: '#49c8f2', gradient: 'linear-gradient(135deg, #8fe9f7 0%, #49c8f2 55%, #5f95ff 100%)', textColor: '#49c8f2' }
    ];
    metricDefs = [
        { key: 'min_salary', label: metricDefs[0].label, color: '#49c8f2', gradient: 'linear-gradient(135deg, #8fe9f7 0%, #49c8f2 55%, #5f95ff 100%)', textColor: '#49c8f2' },
        { key: 'mode_salary', label: metricDefs[1].label, color: '#007AD8', gradient: 'linear-gradient(135deg, #00C3D3 0%, #007AD8 55%, #D149EF 100%)', textColor: '#007AD8' },
        { key: 'median_salary', label: metricDefs[2].label, color: '#d79cfb', gradient: 'linear-gradient(135deg, #efc3ff 0%, #d79cfb 55%, #b58cff 100%)', textColor: '#d79cfb' },
        { key: 'avg_salary', label: metricDefs[3].label, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #f38bff 0%, #8b5cf6 100%)', textColor: '#8b5cf6' },
        { key: 'max_salary', label: metricDefs[4].label, color: '#007AD8', gradient: 'linear-gradient(135deg, #00C3D3 0%, #007AD8 55%, #D149EF 100%)', textColor: '#007AD8' }
    ];
    var statusDefs = [
        { key: 'open', label: 'Активные' },
        { key: 'archived', label: 'Архивные' },
        { key: 'new', label: 'Новые' },
        { key: 'period_archived', label: 'Опубл. и архив.' }
    ];

    function normalizeCurrency(value) {
        var current = String(value || '').trim();
        var upper = current.toUpperCase();
        if (!upper) return 'Не заполнена';
        if (upper === 'RUB') return 'RUR';
        if (upper === 'EURO') return 'EUR';
        if (upper === 'OTHER' || upper === 'ДРУГАЯ') return 'Другая';
        return upper;
    }
    function normalizeStatusKey(statusLabel) {
        var normalized = String(statusLabel || '').trim().toLowerCase();
        if (normalized === 'открытая' || normalized === 'открытые' || normalized === 'активные') return 'open';
        if (normalized === 'архивная' || normalized === 'архивные') return 'archived';
        if (normalized === 'новые за период' || normalized === 'новые') return 'new';
        if (normalized === 'опубл. и архив. за период' || normalized === 'опубл. и архив.' || normalized === 'опубл. и архивир.' || normalized === 'опубликована и архивирована') return 'period_archived';
        return normalized || 'other';
    }
    function isSupportedSalaryCurrency(currency) {
        return preferredCurrencies.indexOf(String(currency || '').trim()) >= 0;
    }
    function isSupportedSalaryExperience(experience) {
        return String(experience || '').trim() !== 'Не указан';
    }
    function hasSalaryData(entry) {
        if (!entry) return false;
        if (Number(entry.vacancies_with_salary) > 0) return true;
        return Array.isArray(entry.vacancies_with_salary_list) && entry.vacancies_with_salary_list.length > 0;
    }
    function formatValueLabel(value) {
        if (typeof formatCompactThousandsValue === 'function') return formatCompactThousandsValue(value);
        return String(value);
    }
    function sortCurrencies(values) {
        return values.slice().sort(function(a, b) {
            var left = preferredCurrencies.indexOf(a);
            var right = preferredCurrencies.indexOf(b);
            if (left === -1 && right === -1) return String(a).localeCompare(String(b), 'ru');
            if (left === -1) return 1;
            if (right === -1) return -1;
            return left - right;
        });
    }
    function getExperienceLegend() {
        var order = typeof getExperienceOrder === 'function' ? getExperienceOrder() : {};
        return experiences.filter(function(item) {
            return item && !(typeof isSalarySummaryExperience === 'function' && isSalarySummaryExperience(item.experience));
        }).map(function(item) {
            return normalizeExperience(item.experience);
        }).filter(function(value, index, list) {
            return value && isSupportedSalaryExperience(value) && list.indexOf(value) === index;
        }).sort(function(a, b) {
            return (Object.prototype.hasOwnProperty.call(order, a) ? Number(order[a]) : 999)
                - (Object.prototype.hasOwnProperty.call(order, b) ? Number(order[b]) : 999);
        }).map(function(label, index) {
            var paletteItem = experiencePalette[index % experiencePalette.length] || experiencePalette[0];
            return {
                key: label,
                label: label,
                color: paletteItem.color,
                gradient: paletteItem.gradient,
                textColor: paletteItem.textColor
            };
        });
    }
    function buildActualPositions(items) {
        var list = Array.isArray(items) ? items.slice() : [];
        if (!list.length) return [];
        if (list.length === 1) return [50];
        var values = list.map(function(item) { return Number(item.value); });
        var minValue = Math.min.apply(Math, values);
        var maxValue = Math.max.apply(Math, values);
        if (!(maxValue > minValue)) {
            return list.map(function(_, index) {
                if (list.length === 2) return index === 0 ? 35 : 65;
                return Math.round((index / Math.max(1, list.length - 1)) * 100);
            });
        }
        var minGap = list.length >= 5 ? 12 : 16;
        var actual = values.map(function(value) {
            if (value <= minValue) return 0;
            if (value >= maxValue) return 100;
            return ((value - minValue) / (maxValue - minValue)) * 100;
        });
        var result = [0];
        for (var index = 1; index < list.length - 1; index += 1) {
            var slot = (index / (list.length - 1)) * 100;
            var desired = (actual[index] * 0.72) + (slot * 0.28);
            var minAllowed = result[index - 1] + minGap;
            var maxAllowed = 100 - (minGap * (list.length - 1 - index));
            result[index] = Math.max(minAllowed, Math.min(maxAllowed, desired));
        }
        result.push(100);
        return result.map(function(value) { return Math.round(value * 10) / 10; });
    }
    function assignPointRows(points) {
        var lastLeftByRow = [];
        var maxRows = 3;
        var minHorizontalGap = 14;
        return (points || []).map(function(point) {
            var clone = Object.assign({}, point);
            var left = Number(clone.leftPct);
            var assignedRow = 0;
            for (var rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
                var lastLeft = lastLeftByRow[rowIndex];
                if (!isFinite(lastLeft) || left - lastLeft >= minHorizontalGap) {
                    assignedRow = rowIndex;
                    break;
                }
                assignedRow = rowIndex + 1;
            }
            if (assignedRow >= maxRows) assignedRow = maxRows - 1;
            clone.pointRow = assignedRow;
            lastLeftByRow[assignedRow] = left;
            return clone;
        });
    }
    function mergePoints(rawPoints) {
        var list = (rawPoints || []).filter(function(point) {
            return point && point.value !== null && point.value !== undefined && isFinite(Number(point.value));
        }).map(function(point) {
            return Object.assign({}, point, { value: Number(point.value) });
        }).sort(function(a, b) {
            return a.value - b.value;
        });
        if (!list.length) return [];
        var grouped = [];
        list.forEach(function(point) {
            var last = grouped.length ? grouped[grouped.length - 1] : null;
            if (last && last.value === point.value) {
                last.labels.push(point.label);
            } else {
                grouped.push({
                    value: point.value,
                    color: point.color,
                    gradient: point.gradient,
                    textColor: point.textColor,
                    labels: [point.label]
                });
            }
        });
        var positions = buildActualPositions(grouped);
        return assignPointRows(grouped.map(function(group, index) {
            return {
                key: group.labels.join('|'),
                label: group.labels.join(', '),
                mergedLabels: group.labels.slice(),
                color: group.color,
                gradient: group.gradient,
                textColor: group.textColor || group.color,
                value: group.value,
                valueLabel: formatValueLabel(group.value),
                leftPct: positions[index]
            };
        }));
    }

    var legend = selectedExperience
        ? metricDefs.map(function(item) {
            return { key: item.key, label: item.label, color: item.color, gradient: item.gradient, textColor: item.textColor };
        })
        : getExperienceLegend();
    var statusMapByCurrency = {};
    var filteredExperiences = experiences.filter(function(item) {
        if (!item) return false;
        if (typeof isSalarySummaryExperience === 'function' && isSalarySummaryExperience(item.experience)) return false;
        if (!isSupportedSalaryExperience(normalizeExperience(item.experience))) return false;
        return true;
    });
    if (selectedExperience) {
        filteredExperiences = filteredExperiences.filter(function(item) {
            return normalizeExperience(item.experience) === normalizeExperience(selectedExperience);
        });
    }

    filteredExperiences.forEach(function(experienceRow) {
        var experienceLabel = normalizeExperience(experienceRow.experience);
        (experienceRow.entries || []).forEach(function(entry) {
            if (!hasSalaryData(entry)) return;
            var currency = normalizeCurrency(entry.currency);
            if (!isSupportedSalaryCurrency(currency)) return;
            var statusKey = normalizeStatusKey(entry.status);
            if (statusDefs.map(function(item) { return item.key; }).indexOf(statusKey) === -1) return;
            statusMapByCurrency[currency] = statusMapByCurrency[currency] || {};
            statusMapByCurrency[currency][statusKey] = statusMapByCurrency[currency][statusKey] || [];
            if (selectedExperience) {
                metricDefs.forEach(function(metric) {
                    var value = Number(entry && entry[metric.key]);
                    if (entry && entry[metric.key] !== null && entry[metric.key] !== undefined && isFinite(value)) {
                        statusMapByCurrency[currency][statusKey].push({
                            label: metric.label,
                            color: metric.color,
                            gradient: metric.gradient,
                            textColor: metric.textColor,
                            value: value
                        });
                    }
                });
            } else {
                var avgValue = Number(entry && entry.avg_salary);
                if (entry && entry.avg_salary !== null && entry.avg_salary !== undefined && isFinite(avgValue)) {
                    var legendItem = legend.find(function(item) { return item.label === experienceLabel; });
                    statusMapByCurrency[currency][statusKey].push({
                        label: experienceLabel,
                        color: legendItem ? legendItem.color : experiencePalette[0].color,
                        gradient: legendItem ? legendItem.gradient : experiencePalette[0].gradient,
                        textColor: legendItem ? legendItem.textColor : experiencePalette[0].textColor,
                        value: avgValue
                    });
                }
            }
        });
    });

    var currencies = sortCurrencies(Object.keys(statusMapByCurrency)).map(function(currency) {
        var statuses = statusDefs.map(function(statusDef) {
            return {
                statusKey: statusDef.key,
                statusLabel: statusDef.label,
                points: mergePoints(statusMapByCurrency[currency][statusDef.key] || [])
            };
        });
        return {
            currency: currency,
            statuses: statuses
        };
    }).filter(function(currencyRow) {
        return Array.isArray(currencyRow.statuses) && currencyRow.statuses.length > 0;
    });

    var expandedCurrency = selectedCurrency && currencies.some(function(item) { return item.currency === selectedCurrency; })
        ? selectedCurrency
        : (currencies[0] ? currencies[0].currency : '');

    currencies = currencies.map(function(currencyRow) {
        return Object.assign({}, currencyRow, {
            expanded: currencyRow.currency === expandedCurrency
        });
    });

    return {
        title: 'Зарплаты',
        mode: selectedExperience ? 'single-experience' : 'all-experiences',
        subtitle: selectedExperience ? 'По зарплатным метрикам' : 'По группам опыта',
        contextLabel: String(data.month || '').trim(),
        legend: legend,
        currencies: currencies
    };
}
function aggregateSalary(roleContents) {
    var expOrder = getExperienceOrder();
    var byMonth = {};
    var allMonths = new Set();
    var expSetByMonth = {};
    roleContents.forEach(roleContent => {
        var months = getRoleSalaryData(roleContent);
        months.forEach(m => {
            if (isSummaryMonth(m.month)) return;
            allMonths.add(m.month);
            byMonth[m.month] = byMonth[m.month] || {};
            expSetByMonth[m.month] = expSetByMonth[m.month] || new Set();
            (m.experiences || []).forEach(exp => {
                expSetByMonth[m.month].add(exp.experience);
                byMonth[m.month][exp.experience] = byMonth[m.month][exp.experience] || {};
                (exp.entries || []).forEach(entry => {
                    var key = entry.status + '|' + entry.currency;
                    var bucket = byMonth[m.month][exp.experience][key] || {
                        status: entry.status,
                        currency: entry.currency,
                        with: [],
                        without: [],
                        raw_total: 0,
                        raw_with: 0,
                        raw_avg: 0,
                        raw_median: 0,
                        raw_mode: 0,
                        raw_min: 0,
                        raw_max: 0
                    };
                    if (entry.vacancies_with_salary_list || entry.vacancies_without_salary_list) {
                        bucket.with = bucket.with.concat(entry.vacancies_with_salary_list || []);
                        bucket.without = bucket.without.concat(entry.vacancies_without_salary_list || []);
                    } else {
                        bucket.raw_total += entry.total_vacancies || 0;
                        bucket.raw_with += entry.vacancies_with_salary || 0;
                        bucket.raw_avg += entry.avg_salary || 0;
                        bucket.raw_median += entry.median_salary || 0;
                        bucket.raw_mode += entry.mode_salary || 0;
                        bucket.raw_min += entry.min_salary || 0;
                        bucket.raw_max += entry.max_salary || 0;
                    }
                    byMonth[m.month][exp.experience][key] = bucket;
                });
            });
        });
    });

    function buildEntryList(bucketsByKey) {
        var entries = buildSalaryEntriesFromBuckets(bucketsByKey);
        if (entries.some(e => e.total_vacancies > 0)) return entries;

        // fallback: если нет списков вакансий, используем суммированные значения
        entries = Object.values(bucketsByKey).map(b => {
            var total = b.raw_total || 0;
            var withCount = b.raw_with || 0;
            return {
                status: b.status,
                currency: b.currency,
                total_vacancies: total,
                vacancies_with_salary: withCount,
                salary_percentage: total ? Math.round((withCount * 10000) / total) / 100 : 0,
                avg_salary: b.raw_avg || 0,
                median_salary: b.raw_median || 0,
                mode_salary: b.raw_mode || 0,
                min_salary: b.raw_min || 0,
                max_salary: b.raw_max || 0,
                top_skills: b.top_skills || '—',
                vacancy_ids: [],
                vacancies_with_salary_list: [],
                vacancies_without_salary_list: []
            };
        });
        entries.sort((a, b) => (a.status !== 'Открытая') - (b.status !== 'Открытая') || a.status.localeCompare(b.status));
        return entries;
    }

    var monthsList = Array.from(allMonths).sort().map(month => {
        var expMap = byMonth[month] || {};
        var expNames = expSetByMonth[month] ? Array.from(expSetByMonth[month]) : Object.keys(expMap);
        var experiences = expNames.map(expName => {
            return { experience: expName, entries: buildEntryList(expMap[expName] || {}) };
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
                    var bucket = agg[exp.experience][key] || {
                        status: entry.status,
                        currency: entry.currency,
                        with: [],
                        without: [],
                        raw_total: 0,
                        raw_with: 0,
                        raw_avg: 0,
                        raw_median: 0,
                        raw_mode: 0,
                        raw_min: 0,
                        raw_max: 0
                    };
                    if (entry.vacancies_with_salary_list || entry.vacancies_without_salary_list) {
                        bucket.with = bucket.with.concat(entry.vacancies_with_salary_list || []);
                        bucket.without = bucket.without.concat(entry.vacancies_without_salary_list || []);
                    } else {
                        bucket.raw_total += entry.total_vacancies || 0;
                        bucket.raw_with += entry.vacancies_with_salary || 0;
                        bucket.raw_avg += entry.avg_salary || 0;
                        bucket.raw_median += entry.median_salary || 0;
                        bucket.raw_mode += entry.mode_salary || 0;
                        bucket.raw_min += entry.min_salary || 0;
                        bucket.raw_max += entry.max_salary || 0;
                    }
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
function getAllRolesPeriods(roleContents) {
    var months = new Set();
    roleContents.forEach(roleContent => {
        var list = getRoleActivityMonths(roleContent);
        list.forEach(m => {
            if (!m || !m.month) return;
            if (isSummaryMonth(m.month)) return;
            months.add(m.month);
        });
    });
    return Array.from(months).sort();
}
function computeActivitySummaryFromEntries(entries) {
    var expOrder = getExperienceOrder();
    var labels = getExperienceLabels();
    var expMap = {};
    (entries || []).forEach(e => {
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
    var rows = Object.values(expMap).map(b => {
        return {
            experience: b.experience,
            total: b.total,
            archived: b.archived,
            active: b.active,
            avg_age: b.ageWeight ? (b.ageSum / b.ageWeight) : null
        };
    });
    var total = rows.reduce((s, e) => s + (e.total || 0), 0);
    var archived = rows.reduce((s, e) => s + (e.archived || 0), 0);
    var active = rows.reduce((s, e) => s + (e.active || 0), 0);
    var avgAge = total ? rows.reduce((s, e) => s + ((e.avg_age || 0) * (e.total || 0)), 0) / total : 0;
    rows.sort((a, b) => (expOrder[a.experience] || 99) - (expOrder[b.experience] || 99));
    return { total: total, archived: archived, active: active, avg_age: avgAge, exp_breakdown: rows };
}
function computeRoleActivitySummaryForMonth(roleContent, month) {
    var months = getRoleActivityMonths(roleContent);
    if (month) {
        var m = months.find(x => x.month === month);
        if (!m) return { total: 0, archived: 0, active: 0, avg_age: 0, exp_breakdown: [] };
        return computeActivitySummaryFromEntries(m.entries || []);
    }
    var merged = [];
    months.forEach(m => {
        if (!m || !m.month || isSummaryMonth(m.month)) return;
        merged = merged.concat(m.entries || []);
    });
    return computeActivitySummaryFromEntries(merged);
}
function computeWeekdayStatsFromVacancies(vacancies) {
    var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var map = {};
    (vacancies || []).forEach(v => {
        if (!v || !v.published_at) return;
        var pub = new Date(v.published_at);
        if (isNaN(pub)) return;
        var day = weekdays[pub.getDay()];
        map[day] = map[day] || { weekday: day, publications: 0, archives: 0, pubHourSum: 0, pubHourCount: 0, archHourSum: 0, archHourCount: 0 };
        map[day].publications += 1;
        map[day].pubHourSum += pub.getHours();
        map[day].pubHourCount += 1;
        if (v.archived_at) {
            var arch = new Date(v.archived_at);
            if (!isNaN(arch)) {
                map[day].archives += 1;
                map[day].archHourSum += arch.getHours();
                map[day].archHourCount += 1;
            }
        }
    });
    var order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
    list.sort((a, b) => order.indexOf(a.weekday) - order.indexOf(b.weekday));
    return list;
}
function computeRoleActivitySummary(roleContent) {
    var months = getRoleActivityMonths(roleContent);
    var salaryMonths = getRoleSalaryData(roleContent);
    var allVacancies = collectVacanciesFromSalaryMonths(salaryMonths);
    var total = 0;
    var archived = 0;
    var active = 0;
    var expMap = {};
    months.forEach(m => {
        if (isSummaryMonth(m.month)) return;
        var labels = getExperienceLabels();
        var summary = (m.entries || []).find(e => normalizeExperience(e.experience) === labels.total);
        if (summary) {
            total += summary.total || 0;
            archived += summary.archived || 0;
            active += summary.active || 0;
        } else {
            (m.entries || []).forEach(e => {
                var expNorm = normalizeExperience(e.experience);
                if (!expNorm || expNorm === labels.total) return;
                total += e.total || 0;
                archived += e.archived || 0;
                active += e.active || 0;
            });
        }
        (m.entries || []).forEach(e => {
            var expNorm = normalizeExperience(e.experience);
            if (!expNorm || expNorm === labels.total) return;
            var bucket = expMap[expNorm] || {
                experience: expNorm,
                total: 0,
                archived: 0,
                active: 0,
                avg_age_sum: 0,
                avg_age_count: 0
            };
            bucket.total += e.total || 0;
            bucket.archived += e.archived || 0;
            bucket.active += e.active || 0;
            if (e.avg_age !== null && e.avg_age !== undefined) {
                bucket.avg_age_sum += Number(e.avg_age);
                bucket.avg_age_count += 1;
            }
            expMap[expNorm] = bucket;
        });
    });
    var avgAge = computeAvgLifetimeDays(allVacancies);
    var expOrder = getExperienceOrder();
    var expBreakdown = [];
    var labels = getExperienceLabels();
    [labels.none, labels.oneToThree, labels.threeToSix, labels.sixPlus].forEach(expName => {
        if (!expMap[expName]) {
            expMap[expName] = {
                experience: expName,
                total: 0,
                archived: 0,
                active: 0,
                avg_age_sum: 0,
                avg_age_count: 0
            };
        }
        var b = expMap[expName];
        var avg = b.avg_age_count ? (b.avg_age_sum / b.avg_age_count) : null;
        expBreakdown.push({
            experience: b.experience,
            total: b.total,
            archived: b.archived,
            active: b.active,
            avg_age: avg
        });
    });
    expBreakdown.sort((a, b) => (expOrder[a.experience] || 99) - (expOrder[b.experience] || 99));
    return { total: total, archived: archived, active: active, avg_age: avgAge, exp_breakdown: expBreakdown };
}
function computeRoleWeekdaySummary(roleContent) {
    var days = getRoleWeekdayData(roleContent);
    if (!days || !days.length) return { avg_pub: 0, avg_arch: 0 };
    var totalPub = days.reduce((s, d) => s + (d.publications || 0), 0);
    var totalArch = days.reduce((s, d) => s + (d.archives || 0), 0);
    var count = days.length || 1;
    return { avg_pub: totalPub / count, avg_arch: totalArch / count };
}
function computeRoleWeekdaySummaryForMonth(roleContent, month) {
    var salaryMonths = getRoleSalaryData(roleContent);
    var vacancies = collectVacanciesFromSalaryMonthsByMonth(salaryMonths, month);
    if (!vacancies.length) return { avg_pub: 0, avg_arch: 0 };
    var days = computeWeekdayStatsFromVacancies(vacancies);
    if (!days.length) return { avg_pub: 0, avg_arch: 0 };
    var totalPub = days.reduce((s, d) => s + (d.publications || 0), 0);
    var totalArch = days.reduce((s, d) => s + (d.archives || 0), 0);
    var count = days.length || 1;
    return { avg_pub: totalPub / count, avg_arch: totalArch / count };
}
function computeRoleSkillsSummary(roleContent) {
    var months = getRoleSkillsMonthlyData(roleContent);
    var skillCounts = new Map();
    var totalVac = 0;
    months.forEach(m => {
        if (isSummaryMonth(m.month)) return;
        (m.experiences || []).forEach(exp => {
            totalVac += exp.total_vacancies || 0;
            (exp.skills || []).forEach(s => {
                skillCounts.set(s.skill, (skillCounts.get(s.skill) || 0) + (s.count || 0));
            });
        });
    });
    var skills = Array.from(skillCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { total_vacancies: totalVac, skills: skills.slice(0, 10) };
}
function computeRoleSkillsSummaryForMonth(roleContent, month) {
    if (!month) return computeRoleSkillsSummary(roleContent);
    var months = getRoleSkillsMonthlyData(roleContent);
    var target = months.find(m => m.month === month);
    if (!target) return { total_vacancies: 0, skills: [] };
    var skillCounts = new Map();
    var totalVac = 0;
    (target.experiences || []).forEach(exp => {
        totalVac += exp.total_vacancies || 0;
        (exp.skills || []).forEach(s => {
            skillCounts.set(s.skill, (skillCounts.get(s.skill) || 0) + (s.count || 0));
        });
    });
    var skills = Array.from(skillCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return { total_vacancies: totalVac, skills: skills.slice(0, 10) };
}
function computeAllRolesSkillCostSummaryForMonth(roleContents, month, excludedRoles) {
    var roleMap = {};
    (roleContents || []).forEach(rc => {
        if (!rc) return;
        var roleId = rc.dataset.roleId || '';
        var roleName = rc.dataset.roleName || '';
        if (roleId) roleMap[roleId] = roleName || roleId;
    });

    function normalizeSkillName(raw) {
        return String(raw || '')
            .replace(/\u200e/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();
    }
    function getRoleName(vacancy) {
        if (!vacancy) return 'UNKNOWN_ROLE';
        return vacancy.role_name ||
            vacancy.professional_role ||
            roleMap[vacancy.role_id] ||
            roleMap[vacancy.role] ||
            vacancy.role ||
            'UNKNOWN_ROLE';
    }
    function normalizeCurrency(value) {
        var curr = String(value || '').trim().toUpperCase();
        if (curr === 'EURO') return 'EUR';
        if (curr === 'RUR' || curr === 'USD' || curr === 'EUR') return curr;
        return '';
    }
    function computeSalaryMid(vacancy) {
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
    function computeMedian(values) {
        if (!values.length) return 0;
        var sorted = values.slice().sort((a, b) => a - b);
        var mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2) return sorted[mid];
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    var currencyBuckets = {
        RUR: { totals: new Map(), roleCounts: new Map() },
        USD: { totals: new Map(), roleCounts: new Map() },
        EUR: { totals: new Map(), roleCounts: new Map() }
    };
    var roleSet = new Set();
    var excludedSet = new Set((excludedRoles || []).map(r => String(r)));
    (roleContents || []).forEach(rc => {
        var months = getRoleSalaryData(rc);
        var vacancies = collectVacanciesFromSalaryMonthsByMonth(months, month);
        vacancies.forEach(v => {
            var currency = normalizeCurrency(v && v.currency);
            if (!currency || !currencyBuckets[currency]) return;
            var avg = computeSalaryMid(v);
            if (avg === null || !isFinite(avg)) return;
            if (!v || !v.skills) return;
            var roleName = getRoleName(v);
            if (!roleName) roleName = 'UNKNOWN_ROLE';
            roleSet.add(roleName);
            if (excludedSet.has(roleName)) return;
            var bucket = currencyBuckets[currency];
            String(v.skills).split(',').map(normalizeSkillName).filter(Boolean).forEach(skill => {
                var entry = bucket.totals.get(skill) || { count: 0, sum: 0, values: [] };
                entry.count += 1;
                entry.sum += avg;
                entry.values.push(avg);
                bucket.totals.set(skill, entry);

                var roleKey = skill + '||' + roleName;
                bucket.roleCounts.set(roleKey, (bucket.roleCounts.get(roleKey) || 0) + 1);
            });
        });
    });

    function buildRowsForCurrency(currency) {
        var bucket = currencyBuckets[currency];
        if (!bucket) return [];
        var rows = Array.from(bucket.totals.entries()).map(function(entryPair) {
            var skill = entryPair[0];
            var entry = entryPair[1];
            var avg = entry.count ? (entry.sum / entry.count) : 0;
            var median = computeMedian(entry.values);
            return {
                skill: skill,
                mention_count: entry.count,
                avg_skill_cost: Math.round(avg * 100) / 100,
                median_skill_cost: Math.round(median * 100) / 100,
                currency: currency
            };
        });
        rows.sort(function(a, b) {
            return (b.mention_count || 0) - (a.mention_count || 0) || String(a.skill || '').localeCompare(String(b.skill || ''));
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
            var list = roleMapBySkill.get(row.skill) || [];
            list.sort(function(a, b) { return b.count - a.count || a.role.localeCompare(b.role); });
            row.roles = list.map(function(r) {
                var pct = row.mention_count ? (r.count * 100.0 / row.mention_count) : 0;
                return r.role + ' (' + pct.toFixed(2) + '%)';
            }).join(', ');
        });
        return rows;
    }

    var rowsByCurrency = {
        RUR: buildRowsForCurrency('RUR'),
        USD: buildRowsForCurrency('USD'),
        EUR: buildRowsForCurrency('EUR')
    };
    var currencies = ['RUR', 'USD', 'EUR'].filter(function(curr) {
        return (rowsByCurrency[curr] || []).length > 0;
    });
    var defaultCurrency = rowsByCurrency.RUR.length ? 'RUR' : (currencies[0] || 'RUR');
    return {
        rows: rowsByCurrency[defaultCurrency] || [],
        rows_by_currency: rowsByCurrency,
        currencies: currencies,
        roles: Array.from(roleSet).sort(function(a, b) { return a.localeCompare(b); })
    };
}
function normalizeSkillName(raw) {
    return String(raw || '')
        .replace(/\u200e/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}
function dedupeVacanciesById(vacancies) {
    if (!vacancies || !vacancies.length) return [];
    var seen = new Set();
    var out = [];
    vacancies.forEach(v => {
        if (!v) return;
        var id = v.id !== undefined && v.id !== null ? String(v.id) : null;
        if (id) {
            if (seen.has(id)) return;
            seen.add(id);
        }
        out.push(v);
    });
    return out;
}
function filterVacanciesBySkills(vacancies, includeSkills, excludeSkills, matchMode) {
    if (!vacancies || !vacancies.length) return [];
    var includes = (includeSkills || []).map(normalizeSkillName).filter(Boolean);
    var excludes = (excludeSkills || []).map(normalizeSkillName).filter(Boolean);
    if (!includes.length && !excludes.length) return vacancies;
    return vacancies.filter(v => {
        if (!v || !v.skills) return false;
        var skillSet = new Set(
            String(v.skills).split(',').map(normalizeSkillName).filter(Boolean)
        );
        for (var j = 0; j < excludes.length; j++) {
            if (skillSet.has(excludes[j])) return false;
        }
        if (!includes.length) return true;
        if (matchMode === 'and') {
            for (var k = 0; k < includes.length; k++) {
                if (!skillSet.has(includes[k])) return false;
            }
            return true;
        }
        for (var i = 0; i < includes.length; i++) {
            if (skillSet.has(includes[i])) return true;
        }
        return false;
    });
}
function computeSalarySkillsFromVacancies(vacancies) {
    var limit = arguments.length > 1 ? arguments[1] : 10;
    if (!vacancies.length) return [];
    var map = new Map();
    var nameMap = new Map();
    vacancies.forEach(v => {
        if (!v || !v.skills) return;
        var val = computeSalaryValue(v, v.currency || null);
        String(v.skills).split(',').map(s => s.trim()).filter(Boolean).forEach(rawSkill => {
            var key = normalizeSkillName(rawSkill);
            if (!key) return;
            var entry = map.get(key) || { count: 0, sum: 0, withSalary: 0 };
            entry.count += 1;
            if (val !== null && !isNaN(val)) {
                entry.sum += val;
                entry.withSalary += 1;
            }
            map.set(key, entry);
            if (!nameMap.has(key)) nameMap.set(key, rawSkill.trim());
        });
    });
    var list = Array.from(map.entries()).map(([key, vals]) => {
        return { skill: nameMap.get(key) || key, count: vals.count, avg: vals.withSalary ? (vals.sum / vals.withSalary) : 0 };
    });
    list.sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
    if (!limit || limit <= 0) return list;
    return list.slice(0, limit);
}
function computeRoleSalarySkills(roleContent) {
    var months = getRoleSalaryData(roleContent);
    var allVacancies = collectVacanciesFromSalaryMonths(months);
    return computeSalarySkillsFromVacancies(allVacancies);
}
function computeRoleSalarySkillsForMonth(roleContent, month) {
    var months = getRoleSalaryData(roleContent);
    var vacancies = collectVacanciesFromSalaryMonthsByMonth(months, month);
    return computeSalarySkillsFromVacancies(vacancies);
}
function aggregateSalarySum(roleContents) {
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
                        total_vacancies: 0,
                        vacancies_with_salary: 0,
                        avg_salary: 0,
                        median_salary: 0,
                        mode_salary: 0,
                        min_salary: 0,
                        max_salary: 0,
                        top_skills: entry.top_skills || '—',
                        with: [],
                        without: []
                    };
                    bucket.total_vacancies += entry.total_vacancies || 0;
                    bucket.vacancies_with_salary += entry.vacancies_with_salary || 0;
                    bucket.avg_salary += entry.avg_salary || 0;
                    bucket.median_salary += entry.median_salary || 0;
                    bucket.mode_salary += entry.mode_salary || 0;
                    bucket.min_salary += entry.min_salary || 0;
                    bucket.max_salary += entry.max_salary || 0;
                    bucket.with = bucket.with.concat(entry.vacancies_with_salary_list || []);
                    bucket.without = bucket.without.concat(entry.vacancies_without_salary_list || []);
                    byMonth[m.month][exp.experience][key] = bucket;
                });
            });
        });
    });

    function toEntries(bucketsByKey) {
        var entries = Object.values(bucketsByKey).map(b => {
            var total = b.total_vacancies || 0;
            var withCount = b.vacancies_with_salary || 0;
            return {
                status: b.status,
                currency: b.currency,
                total_vacancies: total,
                vacancies_with_salary: withCount,
                salary_percentage: total ? Math.round((withCount * 10000) / total) / 100 : 0,
                avg_salary: b.avg_salary || 0,
                median_salary: b.median_salary || 0,
                mode_salary: b.mode_salary || 0,
                min_salary: b.min_salary || 0,
                max_salary: b.max_salary || 0,
                top_skills: b.top_skills || '—',
                vacancy_ids: [],
                vacancies_with_salary_list: b.with || [],
                vacancies_without_salary_list: b.without || []
            };
        });
        entries.sort((a, b) => (a.status !== 'Открытая') - (b.status !== 'Открытая') || a.status.localeCompare(b.status));
        return entries;
    }

    var monthsList = Array.from(allMonths).sort().map(month => {
        var expMap = byMonth[month] || {};
        var experiences = Object.keys(expMap).map(expName => {
            return { experience: expName, entries: toEntries(expMap[expName]) };
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
                    var bucket = agg[exp.experience][key] || {
                        status: entry.status,
                        currency: entry.currency,
                        total_vacancies: 0,
                        vacancies_with_salary: 0,
                        avg_salary: 0,
                        median_salary: 0,
                        mode_salary: 0,
                        min_salary: 0,
                        max_salary: 0,
                        top_skills: entry.top_skills || '—',
                        with: [],
                        without: []
                    };
                    bucket.total_vacancies += entry.total_vacancies || 0;
                    bucket.vacancies_with_salary += entry.vacancies_with_salary || 0;
                    bucket.avg_salary += entry.avg_salary || 0;
                    bucket.median_salary += entry.median_salary || 0;
                    bucket.mode_salary += entry.mode_salary || 0;
                    bucket.min_salary += entry.min_salary || 0;
                    bucket.max_salary += entry.max_salary || 0;
                    bucket.with = bucket.with.concat(entry.vacancies_with_salary_list || []);
                    bucket.without = bucket.without.concat(entry.vacancies_without_salary_list || []);
                    agg[exp.experience][key] = bucket;
                });
            });
        });
        var expList = Object.keys(agg).map(expName => {
            return { experience: expName, entries: toEntries(agg[expName]) };
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
        experience: 'Все',
        total_vacancies: agg.total,
        skills: skills
    };
}
function buildSalarySummaryExp(monthData) {
    var sourceExperiences = monthData && monthData.experiences ? monthData.experiences : [];
    var experiences = sourceExperiences.filter(function(exp) {
        return !isSalarySummaryExperience(exp && exp.experience);
    });
    if (!experiences.length) experiences = sourceExperiences;
    var buckets = {};
    experiences.forEach(exp => {
        (exp.entries || []).forEach(entry => {
            var key = entry.status + '|' + entry.currency;
            var bucket = buckets[key] || { status: entry.status, currency: entry.currency, with: [], without: [] };
            bucket.with = bucket.with.concat(entry.vacancies_with_salary_list || []);
            bucket.without = bucket.without.concat(entry.vacancies_without_salary_list || []);
            buckets[key] = bucket;
        });
    });
    Object.keys(buckets).forEach(function(key) {
        buckets[key].with = dedupeVacanciesById(buckets[key].with);
        buckets[key].without = dedupeVacanciesById(buckets[key].without);
    });
    return {
        experience: 'Все',
        entries: buildSalaryEntriesFromBuckets(buckets)
    };
}
