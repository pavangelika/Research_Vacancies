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
function getRoleContentByIndex(idx) {
    return document.getElementById('role-' + idx);
}
function getAllRoleContents() {
    return Array.from(document.querySelectorAll('.role-content'))
        .filter(c => c.id !== 'role-combined' && c.id !== 'role-all');
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
    var avgAge = rows.length ? rows.reduce((s, e) => s + (e.avg_age || 0), 0) / rows.length : 0;
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
function computeSalarySkillsFromVacancies(vacancies) {
    if (!vacancies.length) return [];
    var map = new Map();
    vacancies.forEach(v => {
        if (!v || !v.skills) return;
        var val = computeSalaryValue(v, v.currency || null);
        String(v.skills).split(',').map(s => s.trim()).filter(Boolean).forEach(skill => {
            var entry = map.get(skill) || { count: 0, sum: 0, withSalary: 0 };
            entry.count += 1;
            if (val !== null && !isNaN(val)) {
                entry.sum += val;
                entry.withSalary += 1;
            }
            map.set(skill, entry);
        });
    });
    var list = Array.from(map.entries()).map(([skill, vals]) => {
        return { skill: skill, count: vals.count, avg: vals.withSalary ? (vals.sum / vals.withSalary) : 0 };
    });
    list.sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
    return list.slice(0, 10);
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
