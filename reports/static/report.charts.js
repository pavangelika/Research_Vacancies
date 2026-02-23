function plotIfChangedById(graphId, signature, data, layout) {
    var el = document.getElementById(graphId);
    if (!el) return;
    if (el.dataset.plotSignature === signature && el.dataset.plotReady === '1') return;
    el.dataset.plotSignature = signature;
    el.dataset.plotReady = '1';
    Plotly.newPlot(graphId, data, layout);
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
function buildAllRolesActivityChart(rows) {
    var labels = rows.map(r => (r.name || 'Роль') + ' [' + (r.id || '') + ']');
    var activeVals = rows.map(r => r.active || 0);
    var archivedVals = rows.map(r => r.archived || 0);
    var ageVals = rows.map(r => (r.avg_age !== null && r.avg_age !== undefined ? r.avg_age : null));
    var signatureMain = rows.map(r => (r.name || '') + ':' + (r.id || '') + ':' + (r.active || 0) + ':' + (r.archived || 0)).join('|');
    var signatureAge = rows.map(r => (r.name || '') + ':' + (r.id || '') + ':' + (r.avg_age !== null && r.avg_age !== undefined ? r.avg_age : '')).join('|');
    var traceActive = {
        x: labels,
        y: activeVals,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Открытые',
        line: { color: CHART_COLORS.light }
    };
    var traceArchived = {
        x: labels,
        y: archivedVals,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Архивные',
        line: { color: CHART_COLORS.dark }
    };
    var traceAge = {
        x: labels,
        y: ageVals,
        type: 'bar',
        name: 'Ср. возраст (дни)',
        marker: { color: CHART_COLORS.medium }
    };
    var layoutMain = {
        title: 'Открытые и архивные вакансии по ролям',
        xaxis: { tickangle: -35, title: '' },
        yaxis: { title: 'Количество вакансий' },
        margin: { t: 50, b: 120, l: 50, r: 60 },
        height: 420
    };
    var layoutAge = {
        title: 'Ср. возраст (дни) по ролям',
        xaxis: { tickangle: -35, title: '' },
        yaxis: { title: 'Ср. возраст (дни)' },
        margin: { t: 50, b: 120, l: 50, r: 30 },
        height: 420
    };
    plotIfChangedById('activity-graph-all', signatureMain, [traceActive, traceArchived], layoutMain);
    plotIfChangedById('activity-age-graph-all', signatureAge, [traceAge], layoutAge);
}
