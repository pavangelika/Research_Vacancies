function plotIfChangedById(graphId, signature, data, layout) {
    var el = document.getElementById(graphId);
    if (!el) return;
    if (el.dataset.plotSignature === signature && el.dataset.plotReady === '1') return;
    el.dataset.plotSignature = signature;
    el.dataset.plotReady = '1';
    Plotly.newPlot(graphId, data, layout);
}
function buildRoleAxisTick(roleId) {
    var id = String(roleId || '').trim();
    return id ? ('ID: ' + id) : 'ID: -';
}
function buildRoleFullLabel(role) {
    var name = String((role && role.name) || '\u0420\u043e\u043b\u044c').trim();
    var id = String((role && role.id) || '').trim();
    return id ? (name + ' [ID: ' + id + ']') : name;
}
function buildActivityBarChart(graphId, entries) {
    var filteredEntries = entries.filter(e => e.experience !== 'Всего');
    var experiences = filteredEntries.map(e => e.experience);
    var activeData = filteredEntries.map(e => e.active);
    var archivedData = filteredEntries.map(e => e.archived);
    var signature = filteredEntries.map(e => e.experience + ':' + e.active + ':' + e.archived).join('|');

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
    plotIfChangedById(graphId, signature, [traceActive, traceArchived], layout);
}

// ---------- Анализ по дням недели ----------
function buildWeekdayBarChart(roleId, weekdayBlock) {
    var weekdaysData = parseJsonDataset(weekdayBlock, 'weekdays', []);
    if (!weekdaysData || weekdaysData.length === 0) return;

    var days = weekdaysData.map(d => d.weekday);
    var pubs = weekdaysData.map(d => d.publications);
    var archs = weekdaysData.map(d => d.archives);
    var signature = weekdaysData.map(d => d.weekday + ':' + d.publications + ':' + d.archives).join('|');

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
    plotIfChangedById('weekday-graph-' + roleId, signature, [tracePubs, traceArchs], layout);
}

// ---------- Навыки по месяцам ----------
function buildHorizontalBarChart(graphId, skills, experience, barColor = CHART_COLORS.medium) {
    var skillNames = skills.map(s => s.skill).reverse();
    var counts = skills.map(s => s.count).reverse();
    var coverages = skills.map(s => s.coverage).reverse();
    var text = skills.map(s => s.count + ' (' + s.coverage + '%)').reverse();
    var signature = experience + '|' + skills.map(s => s.skill + ':' + s.count + ':' + s.coverage).join('|');

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
    plotIfChangedById(graphId, signature, [trace], layout);
}

// ---------- Анализ зарплат ----------
function buildSalaryBarChart(graphId, entries) {
    var container = document.getElementById(graphId);
    if (!container) return;
    var signature = entries.map(e => [e.status, e.currency, e.avg_salary, e.median_salary, e.mode_salary, e.min_salary, e.max_salary].join(':')).sort().join('|');
    if (container.dataset.plotSignature === signature && container.dataset.plotReady === '1') return;
    container.dataset.plotSignature = signature;
    container.dataset.plotReady = '1';

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
        var plotSignature = curr + '|' + y.join(',');
        plotIfChangedById(graphElId, plotSignature, data, layout);
    }
}
function buildAllRolesActivityChart(rows, graphIdMain = 'activity-graph-all', graphIdAge = 'activity-age-graph-all') {
    var labels = rows.map(r => buildRoleAxisTick(r.id));
    var fullLabels = rows.map(buildRoleFullLabel);
    var activeVals = rows.map(r => r.active || 0);
    var archivedVals = rows.map(r => r.archived || 0);
    var ageVals = rows.map(r => (r.avg_age !== null && r.avg_age !== undefined ? r.avg_age : null));
    var signatureMain = rows.map(r => (r.name || '') + ':' + (r.id || '') + ':' + (r.active || 0) + ':' + (r.archived || 0)).join('|');
    var signatureAge = rows.map(r => (r.name || '') + ':' + (r.id || '') + ':' + (r.avg_age !== null && r.avg_age !== undefined ? r.avg_age : '')).join('|');
    var traceActive = {
        x: labels,
        y: activeVals,
        customdata: fullLabels,
        type: 'scatter',
        mode: 'lines+markers',
        name: '\u041e\u0442\u043a\u0440\u044b\u0442\u044b\u0435',
        line: { color: CHART_COLORS.light },
        hovertemplate: '%{customdata}<br>%{fullData.name}: %{y}<extra></extra>'
    };
    var traceArchived = {
        x: labels,
        y: archivedVals,
        customdata: fullLabels,
        type: 'scatter',
        mode: 'lines+markers',
        name: '\u041e\u0442\u043a\u0440\u044b\u0442\u044b\u0435',
        line: { color: CHART_COLORS.dark },
        hovertemplate: '%{customdata}<br>%{fullData.name}: %{y}<extra></extra>'
    };
    var traceAge = {
        x: labels,
        y: ageVals,
        customdata: fullLabels,
        type: 'bar',
        name: '\u0421\u0440. \u0432\u043e\u0437\u0440\u0430\u0441\u0442 (\u0434\u043d\u0438)',
        marker: { color: CHART_COLORS.medium },
        hovertemplate: '%{customdata}<br>%{fullData.name}: %{y}<extra></extra>'
    };
    var layoutMain = {
        title: '\u041e\u0442\u043a\u0440\u044b\u0442\u044b\u0435 \u0438 \u0430\u0440\u0445\u0438\u0432\u043d\u044b\u0435 \u0432\u0430\u043a\u0430\u043d\u0441\u0438\u0438 \u043f\u043e \u0440\u043e\u043b\u044f\u043c',
        xaxis: { tickangle: -35, title: '' },
        yaxis: { title: '\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0432\u0430\u043a\u0430\u043d\u0441\u0438\u0439' },
        margin: { t: 50, b: 120, l: 50, r: 60 },
        height: 420
    };
    var layoutAge = {
        title: '\u0421\u0440. \u0432\u043e\u0437\u0440\u0430\u0441\u0442 (\u0434\u043d\u0438) \u043f\u043e \u0440\u043e\u043b\u044f\u043c',
        xaxis: { tickangle: -35, title: '' },
        yaxis: { title: '\u0421\u0440. \u0432\u043e\u0437\u0440\u0430\u0441\u0442 (\u0434\u043d\u0438)' },
        margin: { t: 50, b: 120, l: 50, r: 30 },
        height: 420
    };
    plotIfChangedById(graphIdMain, signatureMain, [traceActive, traceArchived], layoutMain);
    plotIfChangedById(graphIdAge, signatureAge, [traceAge], layoutAge);
}

function buildAllRolesWeekdayChart(rows, graphId) {
    var labels = rows.map(r => buildRoleAxisTick(r.id));
    var fullLabels = rows.map(buildRoleFullLabel);
    var pubVals = rows.map(r => r.avg_pub || 0);
    var archVals = rows.map(r => r.avg_arch || 0);
    var signature = rows.map(r => (r.name || '') + ':' + (r.id || '') + ':' + (r.avg_pub || 0) + ':' + (r.avg_arch || 0)).join('|');
    var tracePub = {
        x: labels,
        y: pubVals,
        customdata: fullLabels,
        type: 'bar',
        name: '\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438/\u0434\u0435\u043d\u044c',
        marker: { color: CHART_COLORS.light },
        hovertemplate: '%{customdata}<br>%{fullData.name}: %{y}<extra></extra>'
    };
    var traceArch = {
        x: labels,
        y: archVals,
        customdata: fullLabels,
        type: 'bar',
        name: '\u0410\u0440\u0445\u0438\u0432\u044b/\u0434\u0435\u043d\u044c',
        marker: { color: CHART_COLORS.dark },
        hovertemplate: '%{customdata}<br>%{fullData.name}: %{y}<extra></extra>'
    };
    var layout = {
        barmode: 'group',
        title: '\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438 \u0438 \u0430\u0440\u0445\u0438\u0432\u044b \u043f\u043e \u0440\u043e\u043b\u044f\u043c',
        xaxis: { tickangle: -35, title: '' },
        yaxis: { title: '\u0421\u0440\u0435\u0434\u043d\u0435\u0435 \u0432 \u0434\u0435\u043d\u044c' },
        margin: { t: 50, b: 120, l: 50, r: 60 },
        height: 420
    };
    plotIfChangedById(graphId, signature, [tracePub, traceArch], layout);
}

function buildAllRolesSkillsChart(rows, graphId) {
    var sorted = (rows || []).slice().sort((a, b) => (b.mention_count || 0) - (a.mention_count || 0) || String(a.skill || '').localeCompare(String(b.skill || '')));
    var top = sorted.slice(0, 15);
    var labels = top.map(r => r.skill || '�');
    var vals = top.map(r => r.mention_count || 0);
    var signature = top.map(r => (r.skill || '') + ':' + (r.mention_count || 0)).join('|');
    var trace = {
        x: labels,
        y: vals,
        type: 'bar',
        name: '����������',
        marker: { color: CHART_COLORS.medium }
    };
    var layout = {
        title: '��� ������� �� �����������',
        xaxis: { tickangle: -35, title: '', automargin: true },
        yaxis: { title: '����������', automargin: true },
        margin: { t: 50, b: 180, l: 60, r: 40 },
        height: 480
    };
    plotIfChangedById(graphId, signature, [trace], layout);
}

function buildAllRolesSalaryChart(rows, graphId) {
    var labels = rows.map(r => buildRoleAxisTick(r.id));
    var fullLabels = rows.map(buildRoleFullLabel);
    var vals = rows.map(r => (r.skills || []).reduce((s, x) => s + (x.count || 0), 0));
    var signature = rows.map(r => (r.name || '') + ':' + (r.id || '') + ':' + (r.skills || []).length + ':' + (r.skills || []).reduce((s, x) => s + (x.count || 0), 0)).join('|');
    var trace = {
        x: labels,
        y: vals,
        customdata: fullLabels,
        type: 'bar',
        name: '\u0427\u0430\u0441\u0442\u043e\u0442\u0430 \u043d\u0430\u0432\u044b\u043a\u043e\u0432',
        marker: { color: CHART_COLORS.dark },
        hovertemplate: '%{customdata}<br>%{fullData.name}: %{y}<extra></extra>'
    };
    var layout = {
        title: '\u0421\u0443\u043c\u043c\u0430\u0440\u043d\u0430\u044f \u0447\u0430\u0441\u0442\u043e\u0442\u0430 \u043d\u0430\u0432\u044b\u043a\u043e\u0432 \u043f\u043e \u0440\u043e\u043b\u044f\u043c',
        xaxis: { tickangle: -35, title: '' },
        yaxis: { title: '\u0427\u0430\u0441\u0442\u043e\u0442\u0430' },
        margin: { t: 50, b: 120, l: 50, r: 60 },
        height: 420
    };
    plotIfChangedById(graphId, signature, [trace], layout);
}



