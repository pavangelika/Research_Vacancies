function openRoleTab(evt, roleId) {
    var i, roleContent;
    roleContent = document.getElementsByClassName("role-content");
    for (i = 0; i < roleContent.length; i++) {
        roleContent[i].classList.remove('role-switch-enter');
        roleContent[i].style.display = "none";
    }
    var targetRole = document.getElementById(roleId);
    if (typeof ensureMyResponsesTab === 'function') ensureMyResponsesTab(targetRole);
    targetRole.style.display = "block";
    targetRole.classList.remove('role-switch-enter');
    targetRole.offsetWidth;
    targetRole.classList.add('role-switch-enter');
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

var VIEW_ICON_TABLE = '\u25A4';
var VIEW_ICON_GRAPH = '\u25D4';
var VIEW_ICON_TOGETHER = '\u25EB';

function getViewModeMeta(mode) {
    if (mode === 'table') return { title: 'Таблица', icon: VIEW_ICON_TABLE, className: 'table-btn' };
    if (mode === 'graph') return { title: 'График', icon: VIEW_ICON_GRAPH, className: 'graph-btn' };
    return { title: 'Вместе', icon: VIEW_ICON_TOGETHER, className: 'together-btn' };
}

function buildViewModeButtonsHtml(modes, buttonClass, activeMode) {
    var list = Array.isArray(modes) && modes.length ? modes : ['together', 'table', 'graph'];
    var extraClass = buttonClass ? (' ' + buttonClass) : '';
    var selected = normalizeResponsiveViewMode(activeMode || list[0]);
    return list.map(function(mode) {
        var meta = getViewModeMeta(mode);
        var className = 'view-mode-btn ' + meta.className + extraClass + (mode === selected ? ' active' : '');
        return '<button class="' + className + '" data-view="' + mode + '" title="' + meta.title + '">' + meta.icon + '</button>';
    }).join('');
}

function updateViewToggleIcons(root) {
    if (!root) return;
    var buttons = root.querySelectorAll('.view-mode-btn');
    buttons.forEach(function(btn) {
        var meta = getViewModeMeta(btn.dataset.view || '');
        btn.textContent = meta.icon;
        btn.title = meta.title;
    });
    syncResponsiveViewModeButtons(root);
}
function stripChartTitleText(value) {
    return String(value || '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function getDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (var i = 0; i < parent.children.length; i++) {
        var child = parent.children[i];
        if (child.classList && child.classList.contains(className)) return child;
    }
    return null;
}
function resolvePlotlyContainer(target) {
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return { outer: null, host: null };
    if (el.classList && el.classList.contains('js-plotly-plot')) return { outer: el, host: el };
    if (el.classList && el.classList.contains('employer-analysis-subgraph')) return { outer: el, host: el };
    if (el.classList && el.classList.contains('employer-analysis-subgraph-host')) return { outer: el, host: el };
    if (el.classList && el.classList.contains('skills-all-plotly-host')) {
        var skillsOuter = el.closest('.skills-all-html-chart');
        return { outer: skillsOuter || el, host: el };
    }
    if (el.classList && el.classList.contains('unified-chart-host')) {
        var unifiedOuter = el.closest('.unified-chart-frame');
        return { outer: unifiedOuter || el, host: el };
    }

    var shell = getDirectChildByClass(el, 'unified-chart-shell');
    if (!shell) {
        el.classList.add('unified-chart-frame');
        shell = document.createElement('div');
        shell.className = 'unified-chart-shell';

        var heading = document.createElement('div');
        heading.className = 'unified-chart-heading';
        heading.style.display = 'none';

        var title = document.createElement('div');
        title.className = 'unified-chart-title';

        var subtitle = document.createElement('div');
        subtitle.className = 'unified-chart-subtitle';

        var host = document.createElement('div');
        host.className = 'unified-chart-host';
        if (el.id) host.id = el.id + '-plot-host';

        heading.appendChild(title);
        heading.appendChild(subtitle);
        shell.appendChild(heading);
        shell.appendChild(host);
        el.appendChild(shell);
    }

    var hostNode = shell.querySelector('.unified-chart-host');
    return { outer: el, host: hostNode || el };
}
function setUnifiedChartHeader(target, baseTitle, contextText) {
    var container = resolvePlotlyContainer(target);
    var outer = container.outer;
    if (!outer || !outer.classList || outer.classList.contains('skills-all-html-chart') || outer.classList.contains('employer-analysis-subgraph-host')) return container;
    var shell = getDirectChildByClass(outer, 'unified-chart-shell');
    if (!shell) return container;
    var heading = shell.querySelector('.unified-chart-heading');
    var title = shell.querySelector('.unified-chart-title');
    var subtitle = shell.querySelector('.unified-chart-subtitle');
    if (!heading || !title || !subtitle) return container;

    var base = stripChartTitleText(baseTitle);
    var context = resolveUnifiedChartContext(target, contextText);
    if (!base && !context) {
        heading.style.display = 'none';
        title.textContent = '';
        subtitle.textContent = '';
        return container;
    }

    heading.style.display = 'block';
    title.textContent = base;
    subtitle.textContent = context;
    subtitle.style.display = context ? 'block' : 'none';
    return container;
}
function extractLayoutTitleParts(layout) {
    if (!layout) return { base: '', context: '' };
    var title = layout.title;
    var text = '';
    if (typeof title === 'string') text = title;
    else if (title && typeof title.text !== 'undefined') text = title.text;
    text = String(text || '');
    if (!text) return { base: '', context: '' };
    var parts = text.split(/<br\s*\/?>/i);
    return {
        base: stripChartTitleText(parts[0] || ''),
        context: stripChartTitleText(parts.slice(1).join(' '))
    };
}
function isHorizontalBarChartData(data) {
    if (!Array.isArray(data) || !data.length) return false;
    return data.every(function(trace) {
        return trace && trace.type === 'bar' && trace.orientation === 'h';
    });
}
function getTracePointCount(trace) {
    if (!trace || typeof trace !== 'object') return 0;
    var counts = [];
    if (Array.isArray(trace.x)) counts.push(trace.x.length);
    if (Array.isArray(trace.y)) counts.push(trace.y.length);
    if (Array.isArray(trace.labels)) counts.push(trace.labels.length);
    if (Array.isArray(trace.values)) counts.push(trace.values.length);
    if (Array.isArray(trace.text)) counts.push(trace.text.length);
    return counts.length ? Math.max.apply(Math, counts) : 0;
}
function resolveUnifiedChartHeight(data) {
    var traces = Array.isArray(data) ? data.filter(Boolean) : [];
    if (!traces.length) return 320;
    var maxItems = traces.reduce(function(max, trace) {
        return Math.max(max, getTracePointCount(trace));
    }, 0);
    var allHorizontalBars = traces.every(function(trace) {
        return trace.type === 'bar' && trace.orientation === 'h';
    });
    var allBars = traces.every(function(trace) {
        return trace.type === 'bar';
    });
    if (allHorizontalBars) {
        var horizontalTraceCount = Math.max(1, traces.length);
        var categoryBand = horizontalTraceCount * 28 + 20;
        var chartPadding = 36;
        return Math.max(240, chartPadding + maxItems * categoryBand);
    }
    if (allBars) {
        var barTraceCount = Math.max(1, traces.length);
        return Math.max(320, Math.min(1100, 260 + Math.max(0, maxItems - 4) * (10 + barTraceCount * 6)));
    }
    return Math.max(320, Math.min(760, 320 + Math.max(0, maxItems - 6) * 8));
}
function normalizeUnifiedTraceStyles(data) {
    var traces = Array.isArray(data) ? data : [];
    traces.forEach(function(trace) {
        if (!trace || typeof trace !== 'object') return;
        if (trace.type === 'scatter' && String(trace.mode || '').indexOf('lines') !== -1) {
            trace.line = trace.line || {};
            trace.line.width = 3;
            if (String(trace.mode || '').indexOf('markers') !== -1) {
                trace.marker = trace.marker || {};
                if (!isFinite(Number(trace.marker.size))) trace.marker.size = 7;
            }
        }
    });
}
function normalizeUnifiedChartLayout(data, layout) {
    if (!layout || typeof layout !== 'object') return;
    var traces = Array.isArray(data) ? data.filter(Boolean) : [];
    var isHorizontal = isHorizontalBarChartData(traces);
    layout.height = resolveUnifiedChartHeight(traces);
    layout.autosize = true;
    layout.margin = layout.margin || {};
    layout.margin.t = 8;
    layout.margin.b = isHorizontal ? 28 : Math.max(Number(layout.margin.b) || 0, 20);
    layout.margin.l = Math.max(Number(layout.margin.l) || 0, isHorizontal ? 170 : 56);
    layout.margin.r = Math.max(Number(layout.margin.r) || 0, 20);
    if (isHorizontal) {
        layout.bargap = 0.28;
        layout.bargroupgap = 0.04;
    }
    Object.keys(layout).forEach(function(key) {
        if (!/^(x|y)axis\d*$/.test(key)) return;
        var axis = layout[key];
        if (!axis || typeof axis !== 'object') return;
        axis.automargin = true;
    });
    layout.xaxis = layout.xaxis || {};
    layout.yaxis = layout.yaxis || {};
    layout.xaxis.automargin = true;
    layout.yaxis.automargin = true;
    if (isHorizontal) layout.yaxis.autorange = 'reversed';
}
function stripAxisTitles(layout) {
    if (!layout || typeof layout !== 'object') return;
    Object.keys(layout).forEach(function(key) {
        if (!/^(x|y)axis\d*$/.test(key)) return;
        var axis = layout[key];
        if (!axis || typeof axis !== 'object') return;
        if (typeof axis.title === 'string') {
            axis.title = '';
            return;
        }
        if (axis.title && typeof axis.title === 'object') {
            axis.title.text = '';
        }
    });
}
function detectChartAnalysisType(target) {
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el || !el.closest) return '';
    var vm = el.closest('.view-mode-container');
    var vmType = vm && vm.dataset ? String(vm.dataset.analysis || '').trim() : '';
    if (vmType) return vmType;
    var periodBlock = el.closest('.all-roles-period-content');
    var blockType = periodBlock && periodBlock.dataset ? String(periodBlock.dataset.analysis || '').trim() : '';
    if (blockType) {
        if (blockType.indexOf('activity') === 0) return 'activity';
        if (blockType.indexOf('weekday') === 0) return 'weekday';
        if (blockType.indexOf('skills') === 0) return 'skills-monthly';
        if (blockType.indexOf('salary') === 0) return 'salary';
    }
    if (el.closest('.employer-analysis-content')) return 'employer-analysis';
    return '';
}
function normalizeUnifiedPeriodLabel(label) {
    var text = String(label || '').trim();
    if (!text) return '';
    if (text === 'Все' || text === 'По выбранному периоду' || text === 'За все время') return 'Весь период';
    return text;
}
function getResolvedAnalysisExperienceLabel(activeRole, analysisType) {
    if (!activeRole || !analysisType) return 'все категории';
    var expOptions = getGlobalFilterOptions(activeRole, 'experiences', analysisType);
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var experienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    if (String(experienceLabel || '').trim() === 'Все') experienceLabel = 'все категории';
    return String(experienceLabel || '').trim() || 'все категории';
}
function getResolvedAnalysisExperienceValues(activeRole, analysisType) {
    if (!activeRole || !analysisType) return [];
    var expOptions = getGlobalFilterOptions(activeRole, 'experiences', analysisType);
    return getResolvedGlobalFilterValues('experiences', expOptions);
}
function resolveUnifiedChartContext(target, fallbackContext) {
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    var activeRole = el && el.closest ? el.closest('.role-content') : null;
    var analysisType = detectChartAnalysisType(el);
    var explicitHost = el && el.closest ? el.closest('[data-chart-context]') : null;
    var explicitContext = explicitHost && explicitHost.dataset
        ? stripChartTitleText(explicitHost.dataset.chartContext || '')
        : '';
    if (explicitContext) {
        var explicitExperience = getResolvedAnalysisExperienceLabel(activeRole, analysisType);
        if (explicitContext.indexOf('Период:') !== -1 && explicitContext.indexOf('Опыт:') !== -1) return explicitContext;
        if (explicitContext.indexOf('Период:') === 0) return explicitContext + ' · Опыт: ' + explicitExperience;
        return 'Период: ' + explicitContext + ' · Опыт: ' + explicitExperience;
    }
    if (activeRole && analysisType) {
        var periodOptions = getGlobalFilterOptions(activeRole, 'periods', analysisType);
        var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
        var periodLabel = normalizeUnifiedPeriodLabel(resolveChartPeriodLabel(selectedPeriods)) || normalizeUnifiedPeriodLabel(summarizeSelectedPeriodsLabel(selectedPeriods));
        var experienceLabel = getResolvedAnalysisExperienceLabel(activeRole, analysisType);
        var built = buildChartContextLabel(periodLabel, experienceLabel);
        if (built) return built;
    }
    var fallback = stripChartTitleText(fallbackContext);
    if (!fallback) return 'Период: Весь период · Опыт: все категории';
    if (fallback.indexOf('Период:') !== -1 && fallback.indexOf('Опыт:') !== -1) return fallback;
    if (fallback.indexOf('Период:') === 0) return fallback + ' · Опыт: все категории';
    return 'Период: ' + fallback + ' · Опыт: все категории';
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

function bindSalaryRowData(container, entries) {
    if (!container) return;
    var rows = container.querySelectorAll('.salary-row');
    rows.forEach(function(row, idx) {
        var entry = (entries || [])[idx] || {};
        row._data = {
            withList: entry.vacancies_with_salary_list || [],
            withoutList: entry.vacancies_without_salary_list || []
        };
    });
}
if (typeof window !== 'undefined' && typeof plotIfChangedById === 'function' && typeof Plotly !== 'undefined' && !window.__plotlyResponsivePatchApplied) {
    window.__plotlyResponsivePatchApplied = true;
    var __origPlotlyNewPlot = typeof Plotly.newPlot === 'function' ? Plotly.newPlot.bind(Plotly) : null;
    var __origPlotlyReact = typeof Plotly.react === 'function' ? Plotly.react.bind(Plotly) : null;
    if (__origPlotlyNewPlot) {
        Plotly.newPlot = function(target, data, layout, config) {
            var container = resolvePlotlyContainer(target);
            var parts = extractLayoutTitleParts(layout);
            setUnifiedChartHeader(container.outer || target, parts.base, parts.context);
            normalizeUnifiedTraceStyles(data);
            if (layout) {
                normalizeUnifiedChartLayout(data, layout);
                stripAxisTitles(layout);
                layout.paper_bgcolor = 'rgba(0,0,0,0)';
                layout.plot_bgcolor = 'rgba(0,0,0,0)';
                layout.showlegend = false;
                if (layout.legend) layout.legend = undefined;
                if (typeof layout.title === 'string') layout.title = '';
                else if (layout.title && typeof layout.title === 'object') layout.title.text = '';
            }
            return __origPlotlyNewPlot(container.host || target, data, layout, config);
        };
    }
    if (__origPlotlyReact) {
        Plotly.react = function(target, data, layout, config) {
            var container = resolvePlotlyContainer(target);
            var parts = extractLayoutTitleParts(layout);
            setUnifiedChartHeader(container.outer || target, parts.base, parts.context);
            normalizeUnifiedTraceStyles(data);
            if (layout) {
                normalizeUnifiedChartLayout(data, layout);
                stripAxisTitles(layout);
                layout.paper_bgcolor = 'rgba(0,0,0,0)';
                layout.plot_bgcolor = 'rgba(0,0,0,0)';
                layout.showlegend = false;
                if (layout.legend) layout.legend = undefined;
                if (typeof layout.title === 'string') layout.title = '';
                else if (layout.title && typeof layout.title === 'object') layout.title.text = '';
            }
            return __origPlotlyReact(container.host || target, data, layout, config);
        };
    }
    plotIfChangedById = function(graphId, signature, data, layout) {
        var container = resolvePlotlyContainer(graphId);
        var el = container.outer;
        var host = container.host;
        if (!el || !host) return;
        if (el.dataset.plotSignature === signature && el.dataset.plotReady === '1') return;
        el.dataset.plotSignature = signature;
        if (host.dataset.plotReady === '1' && typeof Plotly.react === 'function') {
            Plotly.react(host, data, layout, {
                responsive: true,
                displayModeBar: false
            });
        } else {
            Plotly.newPlot(host, data, layout, {
                responsive: true,
                displayModeBar: false
            });
        }
        el.dataset.plotReady = '1';
        host.dataset.plotReady = '1';
    };
}
if (typeof window !== 'undefined' && typeof plotIfChangedById === 'function') {
    buildHorizontalBarChart = function(graphId, skills, experience, barColor) {
        var list = (Array.isArray(skills) ? skills : []).slice().sort(function(a, b) {
            return (Number(b && b.count) || 0) - (Number(a && a.count) || 0) || String(a && a.skill || '').localeCompare(String(b && b.skill || ''));
        });
        var color = barColor || CHART_COLORS.medium;
        var skillNames = list.map(function(s) { return s.skill; });
        var counts = list.map(function(s) { return s.count; });
        var coverages = list.map(function(s) { return s.coverage; });
        var signature = String(experience || '') + '|' + list.map(function(s) {
            return (s.skill || '') + ':' + (s.count || 0) + ':' + (s.coverage || 0);
        }).join('|');

        plotIfChangedById(graphId, signature, [{
            x: counts,
            y: skillNames,
            customdata: coverages,
            name: 'Упоминания',
            type: 'bar',
            orientation: 'h',
            marker: { color: color },
            hovertemplate: '%{y}<br>Упоминаний: %{x}<br>Доля: %{customdata}%<extra></extra>'
        }], {
            title: 'Топ-30 навыков · ' + experience,
            xaxis: { title: 'Количество упоминаний', automargin: true },
            yaxis: { title: '', automargin: true, autorange: 'reversed' },
            margin: { l: 200, r: 50, t: 50, b: 50 },
            height: 400,
            bargap: 0.15,
            showlegend: false
        });
    };
    buildActivityBarChart = function(graphId, entries) {
        var filteredEntries = (entries || []).filter(function(e) { return e.experience !== 'Всего'; });
        var experiences = filteredEntries.map(function(e) { return e.experience; });
        var activeData = filteredEntries.map(function(e) { return e.active; });
        var archivedData = filteredEntries.map(function(e) { return e.archived; });
        var signature = filteredEntries.map(function(e) { return e.experience + ':' + e.active + ':' + e.archived; }).join('|');
        plotIfChangedById(graphId, signature, [
            { x: activeData, y: experiences, name: 'Активные', type: 'bar', orientation: 'h', marker: { color: CHART_COLORS.light } },
            { x: archivedData, y: experiences, name: 'Архивные', type: 'bar', orientation: 'h', marker: { color: CHART_COLORS.dark } }
        ], {
            barmode: 'group',
            title: 'Количество вакансий по опыту',
            xaxis: { title: 'Количество вакансий', automargin: true },
            yaxis: { title: '', automargin: true, autorange: 'reversed' },
            margin: { t: 50, b: 40, l: 150, r: 40 },
            height: 340,
            showlegend: false
        });
    };
    buildWeekdayBarChart = function(roleId, weekdayBlock) {
        var weekdaysData = parseJsonDataset(weekdayBlock, 'weekdays', []);
        if (!weekdaysData || !weekdaysData.length) return;
        var days = weekdaysData.map(function(d) { return d.weekday; });
        var pubs = weekdaysData.map(function(d) { return d.publications; });
        var archs = weekdaysData.map(function(d) { return d.archives; });
        var signature = weekdaysData.map(function(d) { return d.weekday + ':' + d.publications + ':' + d.archives; }).join('|');
        plotIfChangedById('weekday-graph-' + roleId, signature, [
            { x: pubs, y: days, name: 'Публикации', type: 'bar', orientation: 'h', marker: { color: CHART_COLORS.light } },
            { x: archs, y: days, name: 'Архивации', type: 'bar', orientation: 'h', marker: { color: CHART_COLORS.dark } }
        ], {
            barmode: 'group',
            title: 'Распределение по дням недели',
            xaxis: { title: 'Количество', automargin: true },
            yaxis: { title: '', automargin: true, autorange: 'reversed' },
            margin: { t: 50, b: 40, l: 130, r: 40 },
            height: 400,
            showlegend: false
        });
    };
    buildSalaryBarChart = function(graphId, entries) {
        var container = document.getElementById(graphId);
        if (!container) return;
        var signature = (entries || []).map(function(e) {
            return [e.status, e.currency, e.avg_salary, e.median_salary, e.mode_salary, e.min_salary, e.max_salary].join(':');
        }).sort().join('|');
        if (container.dataset.plotSignature === signature && container.dataset.plotReady === '1') return;
        container.dataset.plotSignature = signature;
        container.dataset.plotReady = '1';
        var currencies = ['RUR', 'USD', '%USD'];
        container.innerHTML = '<div class="salary-graphs-3">' +
            currencies.map(function(c) { return '<div class="salary-graph-item"><div class="plotly-graph" id="' + graphId + '-' + c.replace('%', 'p') + '"></div></div>'; }).join('') +
        '</div>';
        var statuses = ['Открытая', 'Архивная'];
        currencies.forEach(function(curr) {
            var graphElId = graphId + '-' + curr.replace('%', 'p');
            var values = statuses.map(function(status) {
                var entry = (entries || []).find(function(e) { return e.currency === curr && e.status === status; });
                return entry ? entry.avg_salary : 0;
            });
            plotIfChangedById(graphElId, curr + '|' + values.join(','), [{
                x: values,
                y: statuses,
                name: curr,
                type: 'bar',
                orientation: 'h',
                marker: { color: [CHART_COLORS.light, CHART_COLORS.dark] }
            }], {
                title: 'Средняя зарплата · ' + curr,
                xaxis: { title: 'Средняя зарплата', automargin: true },
                yaxis: { title: '', automargin: true, autorange: 'reversed' },
                margin: { t: 40, b: 40, l: 110, r: 20 },
                height: 300,
                showlegend: false
            });
        });
    };
    buildAllRolesActivityChart = function(rows, graphIdMain, graphIdAge) {
        graphIdMain = graphIdMain || 'activity-graph-all';
        graphIdAge = graphIdAge || 'activity-age-graph-all';
        var labels = (rows || []).map(function(r) { return buildRoleAxisTick(r.id); });
        var fullLabels = (rows || []).map(buildRoleFullLabel);
        var activeVals = (rows || []).map(function(r) { return r.active || 0; });
        var archivedVals = (rows || []).map(function(r) { return r.archived || 0; });
        var ageVals = (rows || []).map(function(r) { return (r.avg_age !== null && r.avg_age !== undefined ? r.avg_age : null); });
        var signatureMain = (rows || []).map(function(r) { return (r.name || '') + ':' + (r.id || '') + ':' + (r.active || 0) + ':' + (r.archived || 0); }).join('|');
        var signatureAge = (rows || []).map(function(r) { return (r.name || '') + ':' + (r.id || '') + ':' + (r.avg_age !== null && r.avg_age !== undefined ? r.avg_age : ''); }).join('|');
        plotIfChangedById(graphIdMain, signatureMain, [
            { x: labels, y: activeVals, customdata: fullLabels, type: 'scatter', mode: 'lines+markers', name: 'Открытые', line: { color: CHART_COLORS.light }, hovertemplate: '%{customdata}<br>%{fullData.name}: %{y}<extra></extra>' },
            { x: labels, y: archivedVals, customdata: fullLabels, type: 'scatter', mode: 'lines+markers', name: 'Архивные', line: { color: CHART_COLORS.dark }, hovertemplate: '%{customdata}<br>%{fullData.name}: %{y}<extra></extra>' }
        ], {
            title: 'Открытые и архивные вакансии по ролям',
            xaxis: { tickangle: -35, title: '' },
            yaxis: { title: 'Количество вакансий' },
            margin: { t: 50, b: 120, l: 50, r: 60 },
            height: 420
        });
        plotIfChangedById(graphIdAge, signatureAge, [{
            x: ageVals,
            y: labels,
            customdata: fullLabels,
            type: 'bar',
            orientation: 'h',
            name: 'Ср. возраст (дни)',
            marker: { color: CHART_COLORS.medium },
            hovertemplate: '%{customdata}<br>%{fullData.name}: %{x}<extra></extra>'
        }], {
            title: 'Ср. возраст (дни) по ролям',
            xaxis: { title: 'Ср. возраст (дни)', automargin: true },
            yaxis: { title: '', automargin: true, autorange: 'reversed' },
            margin: { t: 50, b: 40, l: 110, r: 30 },
            height: 420
        });
        var mainGraph = document.getElementById(graphIdMain);
        var ageGraph = document.getElementById(graphIdAge);
        var activityStack = mainGraph ? mainGraph.closest('.all-roles-graph-stack') : null;
        ensureStackedChartSwitch(activityStack, [
            { key: 'main', label: 'Вакансии', el: mainGraph ? mainGraph.parentElement : null },
            { key: 'age', label: 'Ср. возраст', el: ageGraph ? ageGraph.parentElement : null }
        ]);
    };
    buildAllRolesWeekdayChart = function(rows, graphId) {
        var labels = (rows || []).map(function(r) { return buildRoleAxisTick(r.id); });
        var fullLabels = (rows || []).map(buildRoleFullLabel);
        var pubVals = (rows || []).map(function(r) { return r.avg_pub || 0; });
        var archVals = (rows || []).map(function(r) { return r.avg_arch || 0; });
        var signature = (rows || []).map(function(r) { return (r.name || '') + ':' + (r.id || '') + ':' + (r.avg_pub || 0) + ':' + (r.avg_arch || 0); }).join('|');
        plotIfChangedById(graphId, signature, [
            { x: pubVals, y: labels, customdata: fullLabels, type: 'bar', orientation: 'h', name: 'Публикации/день', marker: { color: CHART_COLORS.light }, hovertemplate: '%{customdata}<br>%{fullData.name}: %{x}<extra></extra>' },
            { x: archVals, y: labels, customdata: fullLabels, type: 'bar', orientation: 'h', name: 'Архивы/день', marker: { color: CHART_COLORS.dark }, hovertemplate: '%{customdata}<br>%{fullData.name}: %{x}<extra></extra>' }
        ], {
            barmode: 'group',
            title: 'Публикации и архивы по ролям',
            xaxis: { title: 'Среднее в день', automargin: true },
            yaxis: { title: '', automargin: true, autorange: 'reversed' },
            margin: { t: 50, b: 40, l: 110, r: 60 },
            height: 420
        });
    };
    buildAllRolesSkillsChart = function(rows, graphId) {
        var sorted = (rows || []).slice().sort(function(a, b) {
            return (b.mention_count || 0) - (a.mention_count || 0) || String(a.skill || '').localeCompare(String(b.skill || ''));
        });
        var top = sorted.slice(0, 30);
        var graphEl = document.getElementById(graphId);
        var signature = top.map(function(r) { return (r.skill || '') + ':' + (r.mention_count || 0); }).join('|');
        if (!top.length) {
            if (graphEl) {
                graphEl.dataset.plotSignature = signature;
                graphEl.dataset.plotReady = '';
                graphEl.innerHTML = '<div style="padding:12px;color:var(--text-secondary);text-align:center;">Нет данных для графика</div>';
            }
            return;
        }
        plotIfChangedById(graphId, signature, [{
            x: top.map(function(r) { return r.mention_count || 0; }),
            y: top.map(function(r) { return r.skill || '—'; }),
            type: 'bar',
            orientation: 'h',
            name: 'Упоминания',
            marker: { color: CHART_COLORS.medium }
        }], {
            title: 'Топ навыков по упоминаниям',
            xaxis: { title: 'Упоминаний', automargin: true },
            yaxis: { title: '', automargin: true, autorange: 'reversed' },
            margin: { t: 50, b: 40, l: 200, r: 40 },
            height: 520
        });
    };
    buildAllRolesSalaryChart = function(rows, graphId, metricKey) {
        var list = Array.isArray(rows) ? rows : [];
        var labels = list.map(function(r) { return buildRoleAxisTick(r.id); });
        var fullLabels = list.map(buildRoleFullLabel);
        var metricDefs = [
            { key: 'avg_salary', label: 'Средняя', color: CHART_COLORS.dark },
            { key: 'median_salary', label: 'Медианная', color: CHART_COLORS.medium },
            { key: 'mode_salary', label: 'Мода', color: CHART_COLORS.light },
            { key: 'min_salary', label: 'Минимальная', color: '#8fbcd4' },
            { key: 'max_salary', label: 'Максимальная', color: '#4f7f9d' }
        ];
        var activeMetric = metricDefs.find(function(item) { return item.key === metricKey; }) || metricDefs[0];
        var signature = list.map(function(r) {
            return [r.name || '', r.id || '', r.avg_salary || '', r.median_salary || '', r.mode_salary || '', r.min_salary || '', r.max_salary || ''].join(':');
        }).join('|') + '|' + activeMetric.key;
        if (!list.length) {
            var graphEl = document.getElementById(graphId);
            if (graphEl) {
                graphEl.dataset.plotSignature = signature;
                graphEl.dataset.plotReady = '';
                graphEl.innerHTML = '<div style="padding:12px;color:var(--text-secondary);text-align:center;">Нет данных для графика</div>';
            }
            return;
        }
        var trace = {
            x: list.map(function(row) {
                var value = Number(row && row[activeMetric.key]);
                return isFinite(value) ? value : 0;
            }),
            y: labels,
            customdata: fullLabels,
            type: 'bar',
            orientation: 'h',
            name: activeMetric.label,
            marker: { color: activeMetric.color },
            hovertemplate: '%{customdata}<br>' + activeMetric.label + ': %{x}<extra></extra>'
        };
        plotIfChangedById(graphId, signature, [trace], {
            title: activeMetric.label + ' зарплата по ролям',
            xaxis: { title: '', automargin: true },
            yaxis: { title: '', automargin: true, autorange: 'reversed' },
            margin: { t: 50, b: 40, l: 110, r: 60 },
            height: 500,
            showlegend: false
        });
    };
}

function normalizeSendResumeValue(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    var normalized = String(value === null || value === undefined ? '' : value).trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'да';
}

function collectMyResponsesVacancies() {
    var roleContents = [];
    if (typeof getSelectableRoleContents === 'function') {
        roleContents = getSelectableRoleContents();
    } else {
        roleContents = Array.from(document.querySelectorAll('.role-content')).filter(function(node) {
            return /^role-\d+$/.test(String(node.id || ''));
        });
    }
    var combined = [];
    roleContents.forEach(function(roleContent) {
        combined = combined.concat((typeof getRoleVacancies === 'function' ? getRoleVacancies(roleContent) : []) || []);
    });
    combined = typeof dedupeVacanciesById === 'function' ? dedupeVacanciesById(combined) : combined;
    var filtered = combined.filter(function(vacancy) {
        return vacancy && normalizeSendResumeValue(vacancy.send_resume);
    });
    filtered.sort(function(a, b) {
        var aTs = Date.parse(a && a.resume_at ? a.resume_at : '') || 0;
        var bTs = Date.parse(b && b.resume_at ? b.resume_at : '') || 0;
        return bTs - aTs;
    });
    return filtered;
}

function fetchMyResponsesVacancies() {
    var nonce = Date.now();
    var endpoint = '/api/vacancies/responses?_ts=' + nonce;
    var fallbackEndpoint = 'http://localhost:8000/api/vacancies/responses?_ts=' + nonce;
    function doGet(url) {
        return fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        }).then(function(resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.json();
        }).then(function(payload) {
            var items = payload && Array.isArray(payload.items) ? payload.items : [];
            return items;
        });
    }
    if (window.location && window.location.protocol === 'file:') {
        return doGet(fallbackEndpoint);
    }
    return doGet(endpoint).catch(function() {
        if (String(window.location && window.location.origin || '').indexOf('localhost:8000') >= 0) throw new Error('responses_api_failed');
        return doGet(fallbackEndpoint);
    });
}

function formatResumeAtValue(value) {
    var text = String(value || '').trim();
    if (!text) return '—';
    var date = new Date(text);
    if (isNaN(date.getTime())) return escapeHtml(text);
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    var yyyy = date.getFullYear();
    var hh = String(date.getHours()).padStart(2, '0');
    var min = String(date.getMinutes()).padStart(2, '0');
    return dd + '.' + mm + '.' + yyyy + ' ' + hh + ':' + min;
}
function hasInterviewContent(item) {
    if (!item || typeof item !== 'object') return false;
    var keys = ['hr_name', 'interview_date', 'interview_stages', 'company_type', 'result', 'feedback', 'offer_salary', 'pros', 'cons'];
    return keys.some(function(key) {
        var value = item[key];
        return value !== null && value !== undefined && String(value).trim() !== '';
    });
}
function findVacancySourceById(vacancyId) {
    var id = String(vacancyId || '').trim();
    if (!id) return null;
    var roleContents = document.querySelectorAll('.role-content[data-vacancies]');
    for (var i = 0; i < roleContents.length; i++) {
        var roleEl = roleContents[i];
        var vacancies = parseJsonDataset(roleEl, 'vacancies', []);
        if (!Array.isArray(vacancies) || !vacancies.length) continue;
        for (var j = 0; j < vacancies.length; j++) {
            var v = vacancies[j];
            if (!v) continue;
            if (String(v.id || '').trim() === id) return v;
        }
    }
    return null;
}
function resolveRoleDisplayName(roleId, roleName) {
    var explicit = String(roleName || '').trim();
    if (explicit && explicit !== 'Роль' && explicit !== String(roleId || '').trim()) return explicit;
    var id = String(roleId || '').trim();
    if (!id) return explicit || 'Роль';
    var roleEl = document.querySelector('.role-content[data-role-id="' + id + '"]');
    if (roleEl && roleEl.dataset) {
        var mapped = String(roleEl.dataset.roleName || '').trim();
        if (mapped) return mapped;
    }
    return explicit || id;
}

function buildMyResponsesTableHtml(vacancies) {
    if (!vacancies || !vacancies.length) {
        return '<div class="vacancy-empty">Нет откликов</div>';
    }
    var showRole = vacancies.some(function(v) { return v && (v.role_name || v.role_id); });
    var asArchiveIcon = function(v) {
        var archivedRaw = v && v.archived;
        var isArchived = archivedRaw === true || archivedRaw === 1 || archivedRaw === '1' || archivedRaw === 'true' ||
            (!!(v && v.archived_at));
        var cls = isArchived ? 'status-icon-archived' : 'status-icon-open';
        var title = isArchived ? 'Архивная' : 'Открытая';
        return '<span class="status-icon ' + cls + '" title="' + title + '" aria-label="' + title + '"></span>';
    };
    var rows = vacancies.map(function(v) {
        var source = findVacancySourceById(v && v.id);
        var linkUrl = v.id ? 'https://surgut.hh.ru/vacancy/' + encodeURIComponent(v.id) : '';
        var idCell = linkUrl
            ? '<a href="' + escapeHtml(linkUrl) + '" target="_blank" rel="noopener">' + formatCell(v.id) + '</a>'
            : formatCell(v.id);
        var roleCell = showRole ? escapeHtml(resolveRoleDisplayName(v.role_id, v.role_name)) : '';
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
        var interviewUrl = linkUrl || (v.apply_alternate_url || '');
        var isInterviewFilled = !!(v && (v.interview_filled === true || v.interview_filled === 1 || v.interview_filled === 'true' || hasInterviewContent(v)));
        var interviewIcon = '🖉';
        var interviewTitle = isInterviewFilled ? 'Заполнено' : 'Заполнить';
        var interviewCell = interviewUrl
            ? '<button type="button" class="my-responses-details-link ' + (isInterviewFilled ? 'is-details' : 'is-fill') + '" data-vacancy-id="' + escapeHtml(v.id || '') + '" title="' + interviewTitle + '" aria-label="' + interviewTitle + '">' + interviewIcon + '</button>'
            : '—';
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
            '<td class="my-responses-checkbox-cell"><input type="checkbox" class="my-responses-checkbox" ' + (normalizeSendResumeValue(v.send_resume) ? 'checked ' : '') + 'disabled></td>' +
            '<td>' + formatResumeAtValue(v.resume_at) + '</td>' +
            '<td>' + formatResumeAtValue(v.published_at || (source && (source.published_at || source.created_at))) + '</td>' +
            '<td class="status-icon-cell">' + asArchiveIcon(v && (v.archived !== undefined || v.archived_at) ? v : (source || {})) + '</td>' +
            '<td>' + formatResumeAtValue(v.archived_at || (source && source.archived_at)) + '</td>' +
            '<td>' + interviewCell + '</td>' +
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
                    '<th>Отклик</th>' +
                    '<th>Дата отклика</th>' +
                    '<th>Дата публикации</th>' +
                    '<th>Статус</th>' +
                    '<th>Дата архивации</th>' +
                    '<th class="my-responses-interview-head" title="Заполнить" aria-label="Заполнить">🖉</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' + rows + '</tbody>' +
        '</table>' +
    '</div>';
}

function renderMyResponsesContent(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.my-responses-content');
    if (!block) return;
    var results = block.querySelector('.skills-search-results');
    if (!results) return;
    results.innerHTML = '<div class="skills-search-summary">Загрузка откликов...</div>';
    fetchMyResponsesVacancies().then(function(vacancies) {
        var list = Array.isArray(vacancies) ? vacancies : [];
        var summary = '<div class="skills-search-summary">Найдено откликов: ' + list.length + '</div>';
        results.innerHTML = summary + buildMyResponsesTableHtml(list);
    }).catch(function() {
        var local = collectMyResponsesVacancies();
        var summary = '<div class="skills-search-summary">Найдено откликов: ' + local.length + '</div>';
        results.innerHTML = summary + buildMyResponsesTableHtml(local);
    });
}

function fetchMyResponseDetails(vacancyId) {
    var id = String(vacancyId || '').trim();
    if (!id) return Promise.reject(new Error('vacancy_id_required'));
    var endpoint = '/api/vacancies/details?vacancy_id=' + encodeURIComponent(id);
    var fallbackEndpoint = 'http://localhost:8000/api/vacancies/details?vacancy_id=' + encodeURIComponent(id);
    function doGet(url) {
        return fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        }).then(function(resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.json();
        }).then(function(payload) {
            if (!payload || payload.ok !== true || !payload.item) throw new Error('invalid_payload');
            return payload.item;
        });
    }
    if (window.location && window.location.protocol === 'file:') return doGet(fallbackEndpoint);
    return doGet(endpoint).catch(function() {
        if (String(window.location && window.location.origin || '').indexOf('localhost:8000') >= 0) throw new Error('details_api_failed');
        return doGet(fallbackEndpoint);
    });
}

function saveMyResponseDetails(vacancyId, fields, forceOverwrite) {
    var id = String(vacancyId || '').trim();
    if (!id) return Promise.reject(new Error('vacancy_id_required'));
    var endpoint = '/api/vacancies/details';
    var fallbackEndpoint = 'http://localhost:8000/api/vacancies/details';
    var payload = JSON.stringify({
        vacancy_id: id,
        fields: fields || {},
        force_overwrite: !!forceOverwrite
    });
    function doPost(url) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        }).then(function(resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.json();
        });
    }
    if (window.location && window.location.protocol === 'file:') return doPost(fallbackEndpoint);
    return doPost(endpoint).catch(function() {
        if (String(window.location && window.location.origin || '').indexOf('localhost:8000') >= 0) throw new Error('save_details_api_failed');
        return doPost(fallbackEndpoint);
    });
}

function toDatetimeLocalValue(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    var date = new Date(text);
    if (isNaN(date.getTime())) return '';
    var yyyy = date.getFullYear();
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    var dd = String(date.getDate()).padStart(2, '0');
    var hh = String(date.getHours()).padStart(2, '0');
    var min = String(date.getMinutes()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + min;
}

function getMyResponseDetailsFieldsFromModal(backdrop) {
    var fieldKeys = ['hr_name', 'interview_date', 'interview_stages', 'company_type', 'result', 'feedback', 'offer_salary', 'pros', 'cons'];
    var values = {};
    fieldKeys.forEach(function(key) {
        var el = backdrop.querySelector('[data-field="' + key + '"]');
        if (!el) return;
        var val = String(el.value || '').trim();
        values[key] = val || null;
    });
    return values;
}

function ensureMyResponseDetailsModal() {
    var backdrop = document.getElementById('my-response-details-modal-backdrop');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.id = 'my-response-details-modal-backdrop';
    backdrop.className = 'skills-favorite-modal-backdrop my-response-details-backdrop';
    backdrop.style.display = 'none';
    backdrop.innerHTML =
        '<div class="skills-favorite-modal my-response-details-modal" role="dialog" aria-modal="true" aria-label="Детали отклика">' +
            '<div class="skills-favorite-modal-title">Детали отклика</div>' +
            '<div class="my-response-details-body">' +
                '<div class="my-response-details-readonly"></div>' +
                '<div class="my-response-details-form">' +
                    '<label>ФИО HR<input type="text" data-field="hr_name"></label>' +
                    '<label>Дата и время собеседования<input type="datetime-local" data-field="interview_date"></label>' +
                    '<label>Этапы собеседования<textarea data-field="interview_stages" rows="2"></textarea></label>' +
                    '<label>Тип компании<input type="text" data-field="company_type"></label>' +
                    '<label>Результат собеседования<textarea data-field="result" rows="2"></textarea></label>' +
                    '<label>Обратная связь<textarea data-field="feedback" rows="2"></textarea></label>' +
                    '<label>Сумма оффера<input type="text" data-field="offer_salary"></label>' +
                    '<label>Плюсы<textarea data-field="pros" rows="2"></textarea></label>' +
                    '<label>Минусы<textarea data-field="cons" rows="2"></textarea></label>' +
                '</div>' +
            '</div>' +
            '<div class="skills-favorite-modal-actions">' +
                '<button type="button" class="skills-favorite-modal-btn cancel my-response-details-close">Закрыть</button>' +
                '<button type="button" class="skills-favorite-modal-btn submit my-response-details-save">Сохранить</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(backdrop);
    return backdrop;
}

function openMyResponseDetailsModal(vacancyId) {
    var id = String(vacancyId || '').trim();
    if (!id) return;
    var backdrop = ensureMyResponseDetailsModal();
    backdrop.dataset.vacancyId = id;
    var readonlyWrap = backdrop.querySelector('.my-response-details-readonly');
    if (readonlyWrap) readonlyWrap.innerHTML = '<div class="skills-search-summary">Загрузка...</div>';
    backdrop.style.display = 'flex';

    fetchMyResponseDetails(id).then(function(item) {
        if (!backdrop || backdrop.dataset.vacancyId !== id) return;
        var source = findVacancySourceById(id) || {};
        if ((item.skills === null || item.skills === undefined || item.skills === '') && source.skills) {
            item.skills = source.skills;
        }
        var asValue = function(value) {
            return '<div class="my-response-details-value">' + formatCell(value) + '</div>';
        };
        var readonlyHtml =
            '<table class="vacancy-table my-response-details-table"><tbody>' +
                '<tr><th>Навыки</th><td>' + asValue(item.skills) + '</td></tr>' +
                '<tr><th>Требования</th><td>' + asValue(item.requirement) + '</td></tr>' +
                '<tr><th>Обязанности</th><td>' + asValue(item.responsibility) + '</td></tr>' +
                '<tr><th>Описание</th><td>' + asValue(item.description) + '</td></tr>' +
            '</tbody></table>';
        if (readonlyWrap) readonlyWrap.innerHTML = readonlyHtml;

        var setVal = function(field, value) {
            var el = backdrop.querySelector('[data-field="' + field + '"]');
            if (!el) return;
            if (field === 'interview_date') el.value = toDatetimeLocalValue(value);
            else el.value = String(value || '');
        };
        setVal('hr_name', item.hr_name);
        setVal('interview_date', item.interview_date);
        setVal('interview_stages', item.interview_stages);
        setVal('company_type', item.company_type);
        setVal('result', item.result);
        setVal('feedback', item.feedback);
        setVal('offer_salary', item.offer_salary);
        setVal('pros', item.pros);
        setVal('cons', item.cons);
    }).catch(function() {
        if (readonlyWrap) readonlyWrap.innerHTML = '<div class="skills-search-summary">Не удалось загрузить данные</div>';
    });
}

function closeMyResponseDetailsModal() {
    var backdrop = document.getElementById('my-response-details-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
}

function submitMyResponseDetailsModal() {
    var backdrop = document.getElementById('my-response-details-modal-backdrop');
    if (!backdrop) return;
    var vacancyId = String(backdrop.dataset.vacancyId || '').trim();
    if (!vacancyId) return;
    var fields = getMyResponseDetailsFieldsFromModal(backdrop);
    var localFilled = hasInterviewContent(fields);
    saveMyResponseDetails(vacancyId, fields, false).then(function(resp) {
        if (resp && resp.requires_overwrite) {
            var allow = window.confirm('По этой вакансии уже есть сохраненные данные. Перезаписать?');
            if (!allow) return;
            return saveMyResponseDetails(vacancyId, fields, true);
        }
        return resp;
    }).then(function(resp) {
        if (!resp) return;
        if (resp.ok === true && resp.updated === true) {
            var activeRole = (typeof getActiveRoleContent === 'function') ? getActiveRoleContent() : null;
            if (activeRole) {
                var button = activeRole.querySelector('.my-responses-details-link[data-vacancy-id="' + vacancyId + '"]');
                if (button) {
                    button.classList.remove('is-fill', 'is-details');
                    button.classList.add(localFilled ? 'is-details' : 'is-fill');
                    button.textContent = '🖉';
                    button.title = localFilled ? 'Заполнено' : 'Заполнить';
                    button.setAttribute('aria-label', button.title);
                }
            }
            closeMyResponseDetailsModal();
            if (activeRole) renderMyResponsesContent(activeRole);
        }
    }).catch(function() {
        window.alert('Не удалось сохранить данные собеседования');
    });
}

function ensureMyResponsesTab(parentRole) {
    if (!parentRole || parentRole.id === 'role-all') return;
    var tabs = parentRole.querySelector('.tabs.analysis-tabs');
    if (!tabs) return;
    var roleSuffix = String(parentRole.id || '').replace(/^role-/, '');
    if (!roleSuffix) return;
    var analysisId = 'my-responses-' + roleSuffix;

    var tab = tabs.querySelector('.analysis-button[data-analysis-id="' + analysisId + '"]');
    if (!tab) {
        tab = document.createElement('button');
        tab.className = 'tab-button analysis-button';
        tab.setAttribute('data-analysis-id', analysisId);
        tab.setAttribute('onclick', "switchAnalysis(event, '" + analysisId + "')");
        tab.textContent = 'Мои отклики';
        var skillsSearchTab = tabs.querySelector('.analysis-button[data-analysis-id^="skills-search-"]');
        if (skillsSearchTab && skillsSearchTab.nextSibling) tabs.insertBefore(tab, skillsSearchTab.nextSibling);
        else if (skillsSearchTab) tabs.appendChild(tab);
        else {
            var summaryBtn = tabs.querySelector('.summary-report-btn');
            if (summaryBtn) tabs.insertBefore(tab, summaryBtn);
            else tabs.appendChild(tab);
        }
    }

    var block = parentRole.querySelector('.my-responses-content[data-analysis="' + analysisId + '"]');
    if (!block) {
        block = document.createElement('div');
        block.className = 'my-responses-content skills-search-content';
        block.setAttribute('data-analysis', analysisId);
        block.style.display = 'none';
        block.innerHTML =
            '<div class="skills-search-results my-responses-results">' +
                '<div class="skills-search-hint">Нет откликов</div>' +
            '</div>';
        parentRole.appendChild(block);
    }
}

function ensureMyResponsesTabs(scope) {
    var root = scope || document;
    root.querySelectorAll('.role-content').forEach(function(roleContent) {
        ensureMyResponsesTab(roleContent);
    });
}

function applyAnalysisTabNaming(root) {
    var scope = root || document;
    if (typeof ensureMyResponsesTabs === 'function') ensureMyResponsesTabs(scope);
    var mapDefault = {
        activity: 'Динамика вакансий',
        weekday: 'Дни активности',
        salary: 'Вилка зарплат',
        employer: 'Анализ компаний'
    };
    var mapSummary = {
        activity: 'Динамика по ролям',
        weekday: 'Лидер публикаций',
        skills: 'Стоимость навыков',
        salary: 'Вилка по ролям',
        employer: 'Анализ компаний'
    };
    scope.querySelectorAll('.analysis-button[data-analysis-id]').forEach(function(btn) {
        var id = String(btn.dataset.analysisId || '');
        var tabsHost = btn.closest('.tabs');
        var hasSummaryTab = !!(tabsHost && Array.from(tabsHost.querySelectorAll('button')).some(function(node) {
            return String(node.textContent || '').trim() === 'Сводный отчет';
        }));
        if (hasSummaryTab) {
            if (id.indexOf('activity-') === 0) btn.textContent = mapDefault.activity;
            else if (id.indexOf('weekday-') === 0) btn.textContent = mapDefault.weekday;
            else if (id.indexOf('salary-') === 0) btn.textContent = mapDefault.salary;
            else if (id.indexOf('employer-analysis-') === 0) btn.textContent = mapDefault.employer;
            return;
        }
        var isSummary = /-all$/.test(id);
        if (id.indexOf('activity-') === 0) btn.textContent = isSummary ? mapSummary.activity : mapDefault.activity;
        else if (id.indexOf('weekday-') === 0) btn.textContent = isSummary ? mapSummary.weekday : mapDefault.weekday;
        else if (id.indexOf('skills-monthly-') === 0 && isSummary) btn.textContent = mapSummary.skills;
        else if (id.indexOf('salary-') === 0) btn.textContent = isSummary ? mapSummary.salary : mapDefault.salary;
        else if (id.indexOf('employer-analysis-') === 0) btn.textContent = isSummary ? mapSummary.employer : mapDefault.employer;
    });
    scope.querySelectorAll('.summary-return-tab[onclick]').forEach(function(btn) {
        var onClick = String(btn.getAttribute('onclick') || '');
        if (onClick.indexOf("switchFromSummaryToAnalysis('activity')") >= 0) btn.textContent = mapDefault.activity;
        else if (onClick.indexOf("switchFromSummaryToAnalysis('weekday')") >= 0) btn.textContent = mapDefault.weekday;
        else if (onClick.indexOf("switchFromSummaryToAnalysis('skills-search')") >= 0) btn.textContent = 'Поиск по навыкам';
        else if (onClick.indexOf("switchFromSummaryToAnalysis('salary')") >= 0) btn.textContent = mapDefault.salary;
        else if (onClick.indexOf("switchFromSummaryToAnalysis('employer-analysis')") >= 0) btn.textContent = mapDefault.employer;
    });
}

// ---------- Переключение типов анализа ----------
function switchAnalysis(evt, analysisId) {
    applyAnalysisTabNaming(document);
    var parentRole = evt.currentTarget.closest('.role-content');
    ensureMyResponsesTab(parentRole);
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
    var myResponsesBlock = parentRole.querySelector('.my-responses-content');
    var salaryBlock = parentRole.querySelector('.salary-content');
    var employerAnalysisBlock = parentRole.querySelector('.employer-analysis-content');

    var analysisType;
    if (analysisId.includes('activity')) analysisType = 'activity';
    else if (analysisId.includes('weekday')) analysisType = 'weekday';
    else if (analysisId.includes('skills-monthly')) analysisType = 'skills-monthly';
    else if (analysisId.includes('skills-search')) analysisType = 'skills-search';
    else if (analysisId.includes('my-responses')) analysisType = 'my-responses';
    else if (analysisId.includes('salary')) analysisType = 'salary';
    else if (analysisId.includes('employer-analysis')) analysisType = 'employer-analysis';

    uiState.global_analysis_type = analysisType;
    uiState[getAnalysisStateKey(roleId)] = analysisType;

    activityBlocks.forEach(block => block.style.display = 'none');
    if (weekdayBlock) weekdayBlock.style.display = 'none';
    if (skillsMonthlyBlock) skillsMonthlyBlock.style.display = 'none';
    if (skillsSearchBlock) skillsSearchBlock.style.display = 'none';
    if (myResponsesBlock) myResponsesBlock.style.display = 'none';
    if (salaryBlock) salaryBlock.style.display = 'none';
    if (employerAnalysisBlock) employerAnalysisBlock.style.display = 'none';

    if (analysisType === 'activity') {
        activityBlocks.forEach(block => block.style.display = 'block');
        normalizeActivityControls(parentRole);
        if (roleId === 'role-all') restoreAllRolesPeriodState(parentRole, 'activity');
        else if (roleId === 'role-combined' && !parentRole.querySelector('.activity-month-tabs .month-button, .tabs.month-tabs.activity-only .month-button')) {
            var combinedBlock = activityBlocks[0];
            if (combinedBlock) {
                var viewBtns = combinedBlock.querySelectorAll('.view-mode-btn');
                setActiveViewButton(viewBtns, uiState.activity_view_mode);
                var combinedContainer = combinedBlock.querySelector('.view-mode-container');
                applyViewMode(combinedContainer, uiState.activity_view_mode);
                var combinedEntries = (combinedBlock._data && combinedBlock._data.entries) ? combinedBlock._data.entries : parseJsonDataset(combinedBlock, 'entries', []);
                var combinedTableWrap = combinedBlock.querySelector('.table-container');
                if (combinedTableWrap) combinedTableWrap.innerHTML = buildActivityTableHtml(combinedEntries || []);
                var combinedGraph = combinedBlock.querySelector('.plotly-graph');
                if (combinedGraph && combinedGraph.id) {
                    buildActivityBarChart(combinedGraph.id, combinedEntries);
                    applyChartTitleContext(combinedGraph.id, 'Количество вакансий по опыту', buildChartContextLabel((combinedBlock.dataset.month || '').trim(), null));
                }
                applyActivityModeSizing(combinedContainer, uiState.activity_view_mode);
            }
        }
        else restoreActivityState(parentRole, roleId);
    } else if (analysisType === 'weekday') {
        weekdayBlock.style.display = 'block';
        normalizeWeekdayControls(parentRole);
        if (roleId === 'role-all') {
            restoreAllRolesPeriodState(parentRole, 'weekday');
        } else {
            var weekdays = parseJsonDataset(weekdayBlock, 'weekdays', []);
            var tableWrap = weekdayBlock.querySelector('.table-container');
            if (tableWrap) tableWrap.innerHTML = buildWeekdayTableHtml(weekdays || []);
            var viewBtns = weekdayBlock.querySelectorAll('.view-mode-btn');
            setActiveViewButton(viewBtns, uiState.weekday_view_mode);
            applyViewMode(weekdayBlock.querySelector('.view-mode-container'), uiState.weekday_view_mode);
            var weekdayPeriods = getResolvedGlobalFilterValues('periods', getGlobalFilterOptions(parentRole, 'periods', 'weekday'));
            var weekdayGraphId = 'weekday-graph-' + analysisId.split('-')[1];
            buildWeekdayBarChart(analysisId.split('-')[1], weekdayBlock);
            applyChartTitleContext(weekdayGraphId, 'Распределение по дням недели', buildChartContextLabel(resolveChartPeriodLabel(weekdayPeriods), null));
            applyWeekdayModeSizing(weekdayBlock.querySelector('.view-mode-container'), uiState.weekday_view_mode);
        }
    } else if (analysisType === 'skills-monthly') {
        skillsMonthlyBlock.style.display = 'block';
        normalizeSkillsMonthlyControls(parentRole);
        if (roleId === 'role-all') {
            uiState.skills_monthly_view_mode = uiState.skills_monthly_view_mode || 'together';
            restoreAllRolesPeriodState(parentRole, 'skills');
            var forceAllRolesSkillsRender = function() {
                var visibleSkillsPeriod = Array.from(parentRole.querySelectorAll('.all-roles-period-content[data-analysis="skills-monthly-all"]')).find(function(node) {
                    return (node.style.display || '') === 'block';
                }) || parentRole.querySelector('.all-roles-period-content[data-analysis="skills-monthly-all"]');
                if (!visibleSkillsPeriod || (uiState.skills_monthly_view_mode || 'together') === 'table') return;
                var forcedGraphId = visibleSkillsPeriod.dataset.graphId;
                if (!forcedGraphId) return;
                var forcedContext = buildChartContextLabel(
                    ((parentRole.querySelector('.all-roles-period-button.active') || {}).textContent || '').trim(),
                    null
                );
                var viewContainer = visibleSkillsPeriod.querySelector('.view-mode-container');
                if (viewContainer) {
                    viewContainer.style.display = 'flex';
                    var forcedTable = viewContainer.querySelector('.table-container');
                    var forcedGraph = document.getElementById(forcedGraphId);
                    if (forcedTable && (uiState.skills_monthly_view_mode || 'together') !== 'graph') forcedTable.style.display = 'block';
                    if (forcedGraph) forcedGraph.style.display = 'block';
                }
                renderAllRolesSkillsChartFromTable(visibleSkillsPeriod, forcedGraphId, forcedContext);
            };
            forceAllRolesSkillsRender();
            requestAnimationFrame(forceAllRolesSkillsRender);
            setTimeout(forceAllRolesSkillsRender, 60);
            setTimeout(forceAllRolesSkillsRender, 180);
        } else restoreSkillsMonthlyState(parentRole, roleId);
    } else if (analysisType === 'skills-search') {
        if (skillsSearchBlock) {
            skillsSearchBlock.style.display = 'block';
            initSkillsSearch(parentRole);
        }
    } else if (analysisType === 'my-responses') {
        if (myResponsesBlock) {
            myResponsesBlock.style.display = 'block';
            renderMyResponsesContent(parentRole);
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
    parentRole.dataset.activeAnalysis = analysisType || '';
    syncSharedFilterPanel(parentRole, analysisType, true);
    updateViewToggleIcons(parentRole);
}

function switchFromSummaryToAnalysis(analysisType) {
    var ctx = uiState.roleSelectionContext;

    function findTargetButton(roleContent) {
        if (!roleContent) return null;
        return Array.from(roleContent.querySelectorAll('.analysis-button')).find(function(btn) {
            var id = btn.dataset.analysisId || '';
            return id.indexOf(analysisType + '-') === 0;
        }) || null;
    }

    var targetRole = null;
    var targetButton = null;
    if (ctx && typeof ctx.getOrder === 'function') {
        var order = ctx.getOrder();
        var selected = typeof ctx.getSelected === 'function' ? Array.from(ctx.getSelected()) : [];
        var preferredOrder = order.length ? order.slice() : selected.slice();
        var first = preferredOrder[0];
        if (first !== undefined && first !== null) {
            if (typeof ctx.exitAllRolesMode === 'function') {
                ctx.exitAllRolesMode(new Set(selected), preferredOrder);
            } else {
                if (typeof ctx.applySelection === 'function') {
                    ctx.applySelection(new Set(selected), preferredOrder);
                }
                setSummaryModeActive(false);
            }
            targetRole = getActiveRoleContent();
            targetButton = findTargetButton(targetRole);
        }
    }

    if (!targetButton) {
        setSummaryModeActive(false);
        targetRole = getActiveRoleContent();
        targetButton = findTargetButton(targetRole);
    }

    if (targetButton) targetButton.click();
}

function getActiveRoleContent(preferredRole) {
    if (preferredRole && preferredRole.classList && preferredRole.classList.contains('role-content')) return preferredRole;
    var visible = Array.from(document.querySelectorAll('.role-content')).find(function(node) {
        return (node.style.display || '') === 'block';
    });
    return visible || null;
}

function ensureSharedFilterPanel() {
    var host = document.getElementById('role-selector');
    if (!host) return null;
    var panel = document.getElementById('global-shared-filter-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'global-shared-filter-panel';
        panel.className = 'shared-filter-panel';
        panel.style.display = 'none';
        panel.style.margin = '6px 0 10px';
        panel.style.padding = '8px 10px';
        panel.style.border = '1px solid rgba(148, 163, 184, 0.28)';
        panel.style.borderRadius = '18px';
        panel.style.background = 'rgba(255, 255, 255, 0.9)';
        panel.style.boxShadow = '0 10px 30px rgba(15, 23, 42, 0.05)';
        panel.style.backdropFilter = 'blur(14px)';
        panel.style.position = 'relative';
        panel.style.zIndex = '50';
        panel.style.overflow = 'visible';

        var title = document.createElement('div');
        title.className = 'shared-filter-panel-title';
        title.textContent = '';
        title.style.fontWeight = '600';
        title.style.marginBottom = '0';

        var hint = document.createElement('div');
        hint.className = 'shared-filter-panel-hint';
        hint.textContent = '';
        hint.style.fontSize = '10px';
        hint.style.color = '#94a3b8';
        hint.style.marginBottom = '0';

        var body = document.createElement('div');
        body.className = 'shared-filter-panel-body';
        body.style.display = 'flex';
        body.style.flexWrap = 'nowrap';
        body.style.alignItems = 'flex-start';
        body.style.gap = '6px';
        body.style.overflowX = 'auto';
        body.style.overflowY = 'visible';

        var chips = document.createElement('div');
        chips.className = 'shared-filter-active-chips';
        chips.style.display = 'flex';
        chips.style.flexWrap = 'wrap';
        chips.style.gap = '8px';
        chips.style.marginTop = '10px';

        panel.appendChild(title);
        panel.appendChild(hint);
        panel.appendChild(body);
        panel.appendChild(chips);
        host.appendChild(panel);

        if (!document.body.dataset.globalFilterMenusBound) {
            document.addEventListener('click', function(e) {
                var target = e.target;
                if (target && target.closest && target.closest('.global-filter-dropdown')) return;
                document.querySelectorAll('.global-filter-menu').forEach(function(menu) {
                    menu.style.display = 'none';
                    if (typeof restoreGlobalFilterMenuHost === 'function') restoreGlobalFilterMenuHost(menu);
                });
                document.querySelectorAll('.global-filter-trigger-arrow').forEach(function(arrow) {
                    arrow.textContent = '\u25BE';
                });
                document.querySelectorAll('.summary-filter-trigger-arrow').forEach(function(arrow) {
                    arrow.textContent = '\u25BE';
                });
            });
            document.body.dataset.globalFilterMenusBound = '1';
        }
    }
    return panel;
}

function hideSharedFilterSources(parentRole) {
    if (!parentRole) return;
    [
        '.activity-month-tabs',
        '.tabs.month-tabs.activity-only',
        '.monthly-skills-month-tabs',
        '.monthly-skills-exp-tabs',
        '.salary-month-tabs',
        '.salary-exp-tabs',
        '.employer-period-chips',
        '.summary-analysis-menu-legacy',
        '.all-roles-period-tabs'
    ].forEach(function(selector) {
        parentRole.querySelectorAll(selector).forEach(function(node) {
            node.style.display = 'none';
        });
    });
    parentRole.querySelectorAll('.all-roles-shared-period-tabs').forEach(function(node) {
        node.style.display = '';
    });
}

function getSummaryAnalysisButtons(activeRole) {
    if (!activeRole || activeRole.id !== 'role-all') return [];
    return Array.from(activeRole.querySelectorAll('.analysis-tabs .analysis-button'));
}

function getAllRolesPeriodButtons(activeRole) {
    if (!activeRole || activeRole.id !== 'role-all') return [];
    var current = activeRole.dataset.activeAnalysis || 'activity';
    var content = activeRole.querySelector('.all-roles-period-content[data-analysis="' + current + '-all"]');
    if (!content) {
        var visibleBlock = Array.from(activeRole.querySelectorAll('.all-roles-period-content')).find(function(node) {
            return (node.style.display || '') === 'block';
        });
        if (visibleBlock) {
            current = String(visibleBlock.dataset.analysis || '').replace(/-all$/, '');
        }
    }
    var host = activeRole.querySelector('.' + (current === 'activity' ? 'activity-only' : current === 'weekday' ? 'weekday-content' : current === 'skills-monthly' ? 'skills-monthly-content' : 'salary-content'));
    if (!host) return [];
    return Array.from(host.querySelectorAll('.all-roles-period-tabs .all-roles-period-button'));
}

function syncAllRolesSharedFilterButtons(activeRole, analysisType) {
    if (!activeRole || activeRole.id !== 'role-all') return;
    var host = activeRole.querySelector('.all-roles-shared-filter-buttons');
    if (!host) return;

    var current = String(analysisType || activeRole.dataset.activeAnalysis || 'activity').replace(/-all$/, '');
    host.innerHTML = '';
    host.appendChild(createGlobalFilterDropdown('periods', 'Период', getGlobalFilterOptions(activeRole, 'periods', current), false));
    host.appendChild(createGlobalFilterDropdown('experiences', 'Опыт', getGlobalFilterOptions(activeRole, 'experiences', current), false));
}

function syncAllRolesSharedPeriodTabs(activeRole, periodValue) {
    if (!activeRole || activeRole.id !== 'role-all') return;
    var sharedButtons = Array.from(activeRole.querySelectorAll('.all-roles-shared-period-tabs .all-roles-period-button'));
    if (!sharedButtons.length) return;

    var targetPeriod = periodValue;
    if (!targetPeriod) {
        var current = activeRole.dataset.activeAnalysis || 'activity';
        var visibleContent = activeRole.querySelector('.all-roles-period-content[data-analysis="' + current + '-all"][style*="display: block"]');
        if (visibleContent) targetPeriod = visibleContent.dataset.period || 'all';
    }
    if (!targetPeriod) targetPeriod = 'all';

    sharedButtons.forEach(function(btn) {
        btn.classList.toggle('active', (btn.dataset.period || 'all') === targetPeriod);
    });
}

function openAllRolesSharedPeriodTab(evt, periodValue) {
    var parentRole = evt.currentTarget.closest('.role-content');
    if (!parentRole || parentRole.id !== 'role-all') return;
    var buttons = getAllRolesPeriodButtons(parentRole);
    if (!buttons.length) return;

    var target = null;
    buttons.forEach(function(btn) {
        if ((btn.dataset.period || 'all') === String(periodValue || 'all')) {
            target = btn;
        }
    });
    if (!target) target = buttons[0];
    if (target) target.click();
}

function createAllRolesPeriodControl(activeRole) {
    var buttons = getAllRolesPeriodButtons(activeRole);
    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown all-roles-period-dropdown';
    wrap.dataset.filterKey = 'periods';
    wrap.style.marginTop = '4px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = '220px';
    wrap.style.width = '220px';

    var caption = document.createElement('div');
    caption.textContent = 'Период';
    caption.style.fontSize = '10px';
    caption.style.fontWeight = '600';
    caption.style.marginBottom = '4px';
    caption.style.color = '#94a3b8';
    wrap.appendChild(caption);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tab-button global-filter-trigger skills-search-dropdown-btn';
    trigger.style.width = '100%';
    trigger.style.borderRadius = '999px';
    trigger.style.padding = '5px 10px';
    trigger.style.minHeight = '34px';
    trigger.style.border = '1px solid rgba(148, 163, 184, 0.22)';
    trigger.style.background = 'rgba(248, 250, 252, 0.92)';
    trigger.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.8)';
    trigger.style.display = 'flex';
    trigger.style.alignItems = 'center';
    trigger.style.justifyContent = 'space-between';
    if (!buttons.length) {
        trigger.textContent = 'Недоступно';
        trigger.disabled = true;
        wrap.appendChild(trigger);
        return wrap;
    }

    var activeBtn = buttons.find(function(btn) { return btn.classList.contains('active'); }) || buttons[0];
    var label = document.createElement('span');
    label.className = 'global-filter-trigger-label';
    label.textContent = ((activeBtn && activeBtn.textContent) || '').trim() || 'Выбрать период';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    label.style.whiteSpace = 'nowrap';
    label.style.maxWidth = 'calc(100% - 18px)';
    trigger.appendChild(label);

    var arrow = document.createElement('span');
    arrow.className = 'summary-filter-trigger-arrow';
    arrow.textContent = '\u25BE';
    arrow.style.fontSize = '12px';
    arrow.style.opacity = '0.8';
    trigger.appendChild(arrow);
    wrap.appendChild(trigger);

    var menu = document.createElement('div');
    menu.className = 'global-filter-menu all-roles-period-menu';
    menu.style.display = 'none';
    menu.style.marginTop = '0';
    menu.style.padding = '6px';
    menu.style.border = '1px solid var(--border-color, #d9e2ec)';
    menu.style.borderRadius = '12px';
    menu.style.background = 'var(--card-background, #fff)';
    menu.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.08)';
    menu.style.width = '220px';
    menu.style.maxWidth = 'calc(100vw - 48px)';

    buttons.forEach(function(sourceBtn, idx) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'tab-button summary-filter-item global-filter-option-row';
        item.textContent = (sourceBtn.textContent || '').trim();
        item.style.display = 'block';
        item.style.width = '100%';
        item.style.boxSizing = 'border-box';
        item.style.margin = idx < buttons.length - 1 ? '0 0 2px' : '0';
        item.style.textAlign = 'left';
        item.style.borderRadius = '8px';
        item.style.padding = '5px 8px';
        if (sourceBtn.classList.contains('active')) {
            item.classList.add('active');
            item.style.fontWeight = '600';
        }
        item.addEventListener('click', function() {
            sourceBtn.click();
            menu.style.display = 'none';
            arrow.textContent = '\u25BE';
            syncSharedFilterPanel(getActiveRoleContent(activeRole), activeRole.dataset.activeAnalysis || '');
        });
        menu.appendChild(item);
    });

    trigger.addEventListener('click', function() {
        document.querySelectorAll('#global-shared-filter-panel .global-filter-menu').forEach(function(other) {
            if (other !== menu) other.style.display = 'none';
        });
        document.querySelectorAll('#global-shared-filter-panel .summary-filter-trigger-arrow').forEach(function(otherArrow) {
            if (otherArrow !== arrow) otherArrow.textContent = '\u25BE';
        });
        var nextState = menu.style.display === 'none' ? 'block' : 'none';
        menu.style.display = nextState;
        if (nextState === 'block') positionGlobalFilterMenu(trigger, menu);
        arrow.textContent = nextState === 'block' ? '\u25B4' : '\u25BE';
    });

    wrap.appendChild(menu);
    return wrap;
}

function createSummaryAnalysisControl(activeRole) {
    var buttons = getSummaryAnalysisButtons(activeRole);
    if (!buttons.length) return null;

    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown summary-filter-dropdown';
    wrap.style.marginTop = '4px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = '220px';
    wrap.style.width = '220px';

    var caption = document.createElement('div');
    caption.textContent = 'Раздел';
    caption.style.fontSize = '10px';
    caption.style.fontWeight = '600';
    caption.style.marginBottom = '4px';
    caption.style.color = '#94a3b8';
    wrap.appendChild(caption);

    var activeBtn = buttons.find(function(btn) { return btn.classList.contains('active'); }) || buttons[0];

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tab-button global-filter-trigger summary-filter-trigger skills-search-dropdown-btn';
    trigger.style.width = '100%';
    trigger.style.borderRadius = '999px';
    trigger.style.padding = '5px 10px';
    trigger.style.minHeight = '34px';
    trigger.style.border = '1px solid rgba(148, 163, 184, 0.22)';
    trigger.style.background = 'rgba(248, 250, 252, 0.92)';
    trigger.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.8)';
    trigger.style.display = 'flex';
    trigger.style.alignItems = 'center';
    trigger.style.justifyContent = 'space-between';

    var triggerLabel = document.createElement('span');
    triggerLabel.textContent = ((activeBtn && activeBtn.textContent) || '').trim() || 'Выбрать раздел';
    triggerLabel.style.overflow = 'hidden';
    triggerLabel.style.textOverflow = 'ellipsis';
    triggerLabel.style.whiteSpace = 'nowrap';
    triggerLabel.style.maxWidth = 'calc(100% - 18px)';
    trigger.appendChild(triggerLabel);

    var triggerArrow = document.createElement('span');
    triggerArrow.className = 'summary-filter-trigger-arrow';
    triggerArrow.textContent = '\u25BE';
    triggerArrow.style.fontSize = '12px';
    triggerArrow.style.opacity = '0.8';
    trigger.appendChild(triggerArrow);

    wrap.appendChild(trigger);

    var menu = document.createElement('div');
    menu.className = 'global-filter-menu summary-filter-menu';
    menu.style.display = 'none';
    menu.style.marginTop = '0';
    menu.style.padding = '6px';
    menu.style.border = '1px solid var(--border-color, #d9e2ec)';
    menu.style.borderRadius = '12px';
    menu.style.background = 'var(--card-background, #fff)';
    menu.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.08)';
    menu.style.width = '220px';
    menu.style.maxWidth = 'calc(100vw - 48px)';

    buttons.forEach(function(sourceBtn, idx) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'tab-button summary-filter-item global-filter-option-row';
        item.textContent = (sourceBtn.textContent || '').trim();
        item.style.display = 'block';
        item.style.width = '100%';
        item.style.boxSizing = 'border-box';
        item.style.margin = idx < buttons.length - 1 ? '0 0 2px' : '0';
        item.style.textAlign = 'left';
        item.style.borderRadius = '8px';
        item.style.padding = '5px 8px';
        if (sourceBtn.classList.contains('active')) {
            item.classList.add('active');
            item.style.fontWeight = '600';
        }
        item.addEventListener('click', function() {
            sourceBtn.click();
            menu.style.display = 'none';
            triggerArrow.textContent = '\u25BE';
            syncSharedFilterPanel(getActiveRoleContent(activeRole), activeRole.dataset.activeAnalysis || '');
        });
        menu.appendChild(item);
    });

    trigger.addEventListener('click', function() {
        document.querySelectorAll('#global-shared-filter-panel .global-filter-menu').forEach(function(other) {
            if (other !== menu) other.style.display = 'none';
        });
        document.querySelectorAll('#global-shared-filter-panel .summary-filter-trigger-arrow').forEach(function(arrow) {
            if (arrow !== triggerArrow) arrow.textContent = '\u25BE';
        });
        var nextState = menu.style.display === 'none' ? 'block' : 'none';
        menu.style.display = nextState;
        if (nextState === 'block') positionGlobalFilterMenu(trigger, menu);
        triggerArrow.textContent = nextState === 'block' ? '\u25B4' : '\u25BE';
    });

    wrap.appendChild(menu);
    return wrap;
}

function buildSharedFilterGroup(parentRole, analysisType, label, buttons, extraBuilder) {
    var group = document.createElement('div');
    group.className = 'shared-filter-group';
    group.style.marginTop = '8px';

    var caption = document.createElement('div');
    caption.textContent = label;
    caption.style.fontSize = '12px';
    caption.style.fontWeight = '600';
    caption.style.marginBottom = '6px';
    caption.style.color = 'var(--text-secondary, #52606d)';
    group.appendChild(caption);

    var tabs = document.createElement('div');
    tabs.className = 'tabs shared-filter-tabs';
    tabs.style.justifyContent = 'flex-start';
    if (!buttons || !buttons.length) {
        var emptyBtn = document.createElement('button');
        emptyBtn.type = 'button';
        emptyBtn.className = 'tab-button shared-filter-proxy-button';
        emptyBtn.textContent = 'Недоступно';
        emptyBtn.disabled = true;
        emptyBtn.style.opacity = '0.6';
        tabs.appendChild(emptyBtn);
        group.appendChild(tabs);
        if (typeof extraBuilder === 'function') {
            var emptyExtra = extraBuilder();
            if (emptyExtra) group.appendChild(emptyExtra);
        }
        return group;
    }
    buttons.forEach(function(sourceBtn) {
        if (!sourceBtn) return;
        var proxy = document.createElement('button');
        proxy.type = 'button';
        proxy.className = 'tab-button shared-filter-proxy-button';
        var isPressed = sourceBtn.getAttribute && sourceBtn.getAttribute('aria-pressed') === 'true';
        if ((sourceBtn.classList && sourceBtn.classList.contains('active')) || isPressed) proxy.classList.add('active');
        proxy.textContent = (sourceBtn.dataset && sourceBtn.dataset.proxyLabel) ? sourceBtn.dataset.proxyLabel : (sourceBtn.textContent || '').trim();
        proxy.addEventListener('click', function() {
            sourceBtn.click();
            syncSharedFilterPanel(getActiveRoleContent(parentRole), analysisType);
        });
        tabs.appendChild(proxy);
    });
    group.appendChild(tabs);

    if (typeof extraBuilder === 'function') {
        var extra = extraBuilder();
        if (extra) group.appendChild(extra);
    }
    return group;
}

function dedupeFilterOptions(options) {
    var seen = new Set();
    return (options || []).filter(function(item) {
        if (!item || !item.value) return false;
        var key = String(item.value);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function normalizePeriodOptionValue(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    if (text === 'Сегодня' || /^today$/i.test(text)) return 'today';
    var quick = text.match(/^За\s+(\d+)\s+д/i) || text.match(/^last_(\d+)$/i) || text.match(/^(\d+)d$/i);
    if (quick) return 'last_' + String(Number(quick[1]) || 0);
    return text;
}

function formatPeriodSelectionValue(value) {
    var text = normalizePeriodOptionValue(value);
    if (!text) return '';
    if (text === 'today') return 'Сегодня';
    var quick = text.match(/^last_(\d+)$/i) || text.match(/^(\d+)d$/i);
    if (quick) return 'За ' + String(Number(quick[1]) || 0) + ' дня';
    return text;
}

function summarizeSelectedPeriodsLabel(selectedPeriods) {
    var labels = Array.isArray(selectedPeriods) ? selectedPeriods.filter(Boolean).map(function(v) { return formatPeriodSelectionValue(v); }).filter(Boolean) : [];
    if (!labels.length) return 'За все время';
    var specificLabels = labels.filter(function(label) {
        return !(isSummaryMonth(label) || label === 'За период' || label === 'Весь период' || label === 'За все время');
    });
    if (!specificLabels.length) return 'За все время';
    if (specificLabels.length === 1) return specificLabels[0];
    return 'По выбранному периоду';
}

function summarizeChartPeriodLabel(selectedPeriods) {
    var bucket = ensureGlobalFilterBucket('periods');
    var explicit = (bucket.include || []).map(function(value) {
        return normalizePeriodOptionValue(value);
    }).filter(Boolean);
    var quickOnly = explicit.filter(function(value) {
        return /^last_\d+$/i.test(String(value || '').trim());
    });
    if (quickOnly.length) return summarizeSelectedPeriodsLabel(quickOnly);
    var panelLabel = '';
    var panelNode = document.querySelector('#global-shared-filter-panel .global-filter-dropdown[data-filter-key="periods"] .global-filter-trigger-label');
    if (panelNode) panelLabel = String(panelNode.textContent || '').trim();
    if (panelLabel && panelLabel !== 'Все' && panelLabel !== 'Недоступно' && panelLabel !== 'Выбрать') {
        return panelLabel;
    }
    return summarizeSelectedPeriodsLabel(selectedPeriods);
}

function getCurrentGlobalPeriodDisplayLabel() {
    var panelNode = document.querySelector('#global-shared-filter-panel .global-filter-dropdown[data-filter-key="periods"] .global-filter-trigger-label');
    var label = panelNode ? String(panelNode.textContent || '').trim() : '';
    if (!label || label === 'Все' || label === 'Недоступно' || label === 'Выбрать') return '';
    return label;
}

function resolveChartPeriodLabel(selectedPeriods) {
    return getCurrentGlobalPeriodDisplayLabel() || summarizeChartPeriodLabel(selectedPeriods);
}

function resolveChartExperienceLabel(selectedExps, expOptions) {
    var selected = Array.isArray(selectedExps) ? selectedExps.filter(Boolean) : [];
    if (!selected.length) return null;
    var allowed = Array.isArray(expOptions) ? expOptions.map(function(item) {
        return normalizeExperience(item && item.value);
    }).filter(Boolean) : [];
    var selectedNorm = Array.from(new Set(selected.map(function(item) {
        return normalizeExperience(item);
    }).filter(Boolean)));
    if (allowed.length) {
        var allowedNorm = Array.from(new Set(allowed));
        var allSelected = allowedNorm.length === selectedNorm.length && allowedNorm.every(function(item) {
            return selectedNorm.indexOf(item) !== -1;
        });
        if (allSelected) return 'Все';
    }
    return selected.join(', ');
}

function ensureGlobalFilterBucket(filterKey) {
    if (!uiState.global_filters) uiState.global_filters = {};
    if (!uiState.global_filters[filterKey]) uiState.global_filters[filterKey] = { include: [], exclude: [] };
    if (!Array.isArray(uiState.global_filters[filterKey].include)) uiState.global_filters[filterKey].include = [];
    if (!Array.isArray(uiState.global_filters[filterKey].exclude)) uiState.global_filters[filterKey].exclude = [];
    return uiState.global_filters[filterKey];
}

function ensureGlobalFilterModeState() {
    if (!uiState.global_filter_modes) uiState.global_filter_modes = {};
    ['roles', 'periods', 'experiences'].forEach(function(key) {
        if (typeof uiState.global_filter_modes[key] !== 'boolean') uiState.global_filter_modes[key] = false;
    });
    return uiState.global_filter_modes;
}

function isGlobalFilterMultiEnabled(filterKey) {
    return !!ensureGlobalFilterModeState()[filterKey];
}

function setGlobalFilterMultiEnabled(filterKey, enabled) {
    ensureGlobalFilterModeState()[filterKey] = !!enabled;
    if (!enabled) {
        var bucket = ensureGlobalFilterBucket(filterKey);
        var singleInclude = bucket.include.length ? [bucket.include[0]] : [];
        var singleExclude = singleInclude.length ? [] : (bucket.exclude.length ? [bucket.exclude[0]] : []);
        bucket.include = singleInclude;
        bucket.exclude = singleExclude;
    }
}

function applyGlobalFilterIconButtonStyle(button, isActive) {
    if (!button) return;
    button.style.borderRadius = '999px';
    button.style.padding = '0';
    button.style.width = '28px';
    button.style.height = '28px';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.border = '1px solid ' + (isActive ? 'rgba(59, 130, 246, 0.26)' : 'rgba(148, 163, 184, 0.22)');
    button.style.background = isActive ? 'rgba(239, 246, 255, 0.92)' : 'rgba(248, 250, 252, 0.92)';
    button.style.color = isActive ? '#2563eb' : '#475569';
    button.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.8)';
}

function sortExperienceFilterOptions(options) {
    var rank = {
        'Нет опыта': 0,
        'От 1 года до 3 лет': 1,
        'От 3 до 6 лет': 2,
        'Более 6 лет': 3
    };
    return (options || []).slice().sort(function(a, b) {
        var aLabel = String((a && a.label) || '').trim();
        var bLabel = String((b && b.label) || '').trim();
        var aRank = Object.prototype.hasOwnProperty.call(rank, aLabel) ? rank[aLabel] : 999;
        var bRank = Object.prototype.hasOwnProperty.call(rank, bLabel) ? rank[bLabel] : 999;
        if (aRank !== bRank) return aRank - bRank;
        return aLabel.localeCompare(bLabel, 'ru');
    });
}

function getGlobalFilterOptions(activeRole, filterKey, analysisType) {
    if (filterKey === 'roles') {
        return dedupeFilterOptions(getRoleMetaList().map(function(item) {
            return { value: item.index, label: (item.name || '').trim() };
        }));
    }
    if (!activeRole) return [];
    if (activeRole.id === 'role-all') {
        var summaryRoleContents = Array.isArray(activeRole.__selectedRoleContents) && activeRole.__selectedRoleContents.length
            ? activeRole.__selectedRoleContents.slice()
            : getAllRoleContents();
        if (filterKey === 'periods') {
            var vacancies = [];
            summaryRoleContents.forEach(function(roleContent) {
                vacancies = vacancies.concat(getRoleVacancies(roleContent) || []);
            });
            vacancies = dedupeVacanciesById(vacancies);
            var months = Array.from(new Set(vacancies.map(function(v) {
                var d = parsePublishedAtDate(v && v.published_at);
                if (!d) return '';
                return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            }).filter(Boolean))).sort().reverse();
            var totalLabel = months.length
                ? (typeof formatMonthTitle === 'function' ? formatMonthTitle(months.length) : 'За период')
                : 'За период';
            return dedupeFilterOptions([
                { value: 'Сегодня', label: 'Сегодня' },
                { value: 'За 3 дня', label: 'За 3 дня' },
                { value: 'За 7 дней', label: 'За 7 дней' },
                { value: 'За 14 дней', label: 'За 14 дней' }
            ].concat(months.map(function(month) {
                return { value: month, label: month };
            })).concat([
                { value: totalLabel, label: totalLabel }
            ]));
        }
        if (filterKey === 'experiences') {
            var summaryVacancies = [];
            summaryRoleContents.forEach(function(roleContent) {
                summaryVacancies = summaryVacancies.concat(getRoleVacancies(roleContent) || []);
            });
            return sortExperienceFilterOptions(dedupeFilterOptions(summaryVacancies.map(function(vacancy) {
                var value = String(vacancy && (vacancy._experience || vacancy.experience) || '').trim();
                if (!value) return null;
                return { value: value, label: value };
            }).filter(Boolean)));
        }
    }
    var current = analysisType || activeRole.dataset.activeAnalysis || '';
    if (filterKey === 'periods') {
        var selectors = [];
        if (current === 'activity' || current === 'weekday') selectors = ['.activity-month-tabs .month-button', '.tabs.month-tabs.activity-only .month-button'];
        else if (current === 'skills-monthly') selectors = ['.monthly-skills-month-tabs .monthly-skills-month-button'];
        else if (current === 'salary') selectors = ['.salary-month-tabs .salary-month-button'];
        else if (current === 'employer-analysis') selectors = ['.employer-period-chips .employer-period-chip'];
        for (var i = 0; i < selectors.length; i++) {
            var found = Array.from(activeRole.querySelectorAll(selectors[i])).map(function(btn) {
                var label = (btn.textContent || '').trim();
                return { value: normalizePeriodOptionValue(label), label: label };
            }).filter(function(item) { return !!item.value; });
            if (found.length) return dedupeFilterOptions(found);
        }
        if (current === 'skills-search') {
            var searchBlock = activeRole.querySelector('.skills-search-content');
            var items = (searchBlock && searchBlock._data && Array.isArray(searchBlock._data.periodItems)) ? searchBlock._data.periodItems : [];
            return dedupeFilterOptions(items.map(function(item) {
                if (!item || !item.month) return null;
                return { value: item.month, label: item.label || item.month };
            }).filter(Boolean));
        }
        return [];
    }
    if (filterKey === 'experiences') {
        if (current === 'skills-monthly') {
            var skillsButtons = Array.from(activeRole.querySelectorAll('.monthly-skills-exp-button'));
            return sortExperienceFilterOptions(dedupeFilterOptions(skillsButtons.map(function(btn) { return { value: (btn.textContent || '').trim(), label: (btn.textContent || '').trim() }; }).filter(function(item) { return !!item.value; })));
        }
        if (current === 'salary') {
            var salaryButtons = Array.from(activeRole.querySelectorAll('.salary-exp-button'));
            return sortExperienceFilterOptions(dedupeFilterOptions(salaryButtons.map(function(btn) { return { value: (btn.textContent || '').trim(), label: (btn.textContent || '').trim() }; }).filter(function(item) { return !!item.value; })));
        }
        if (current === 'skills-search') {
            var searchBlock2 = activeRole.querySelector('.skills-search-content');
            var searchVacancies = (searchBlock2 && searchBlock2._data && Array.isArray(searchBlock2._data.vacancies)) ? searchBlock2._data.vacancies : [];
            return sortExperienceFilterOptions(dedupeFilterOptions(searchVacancies.map(function(vacancy) {
                var value = String(vacancy && (vacancy._experience || vacancy.experience) || '').trim();
                if (!value) return null;
                return { value: value, label: value };
            }).filter(Boolean)));
        }
        var vacancyExperiences = sortExperienceFilterOptions(dedupeFilterOptions(getRoleVacancies(activeRole).map(function(vacancy) {
            var value = String(vacancy && (vacancy.experience || vacancy._experience) || '').trim();
            if (!value) return null;
            return { value: value, label: value };
        }).filter(Boolean)));
        return vacancyExperiences;
    }
    return [];
}

function isGlobalFilterDisabled(filterKey, analysisType) {
    return false;
}

function summarizeGlobalFilterSelection(filterKey, options, disabled) {
    if (disabled) return 'Недоступно';
    var bucket = ensureGlobalFilterBucket(filterKey);
    var includeCount = bucket.include.length;
    var excludeCount = bucket.exclude.length;
    if (!includeCount && !excludeCount) return filterKey === 'roles' ? 'Выбрать роль' : 'Все';
    if (filterKey === 'roles' && isGlobalFilterMultiEnabled(filterKey)) {
        return includeCount + ' выбрано';
    }
    var optionMap = {};
    (options || []).forEach(function(item) { optionMap[item.value] = item.label; });
    if (filterKey !== 'roles') {
        var mapValueToLabel = function(value) {
            if (filterKey === 'periods') {
                var formatted = formatPeriodSelectionValue(value);
                if (formatted) return optionMap[formatted] || optionMap[value] || formatted;
            }
            return optionMap[value] || value;
        };
        var includeLabels = bucket.include.map(mapValueToLabel).filter(Boolean);
        var excludeLabels = bucket.exclude.map(mapValueToLabel).filter(Boolean);
        if (includeLabels.length && !excludeLabels.length) return includeLabels.join(', ');
        if (!includeLabels.length && excludeLabels.length) return 'Все, кроме ' + excludeLabels.join(', ');
        if (includeLabels.length && excludeLabels.length) return includeLabels.join(', ');
    }
    if (includeCount === 1 && !excludeCount) return optionMap[bucket.include[0]] || '1 выбрано';
    if (!includeCount && excludeCount === 1) return 'Все, кроме 1';
    if (includeCount && !excludeCount) return includeCount + ' выбрано';
    if (!includeCount && excludeCount) return 'Все, кроме ' + excludeCount;
    return '+' + includeCount + ' / -' + excludeCount;
}

function closeGlobalFilterMenus(exceptMenu, exceptArrow) {
    document.querySelectorAll('.global-filter-menu').forEach(function(other) {
        if (other !== exceptMenu) {
            other.style.display = 'none';
            restoreGlobalFilterMenuHost(other);
        }
    });
    document.querySelectorAll('.global-filter-trigger-arrow').forEach(function(arrow) {
        if (arrow !== exceptArrow) arrow.textContent = '\u25BE';
    });
}

function bindGlobalFilterMenuScrollLock(menu) {
    if (!menu || menu.dataset.scrollLockBound === '1') return;
    menu.addEventListener('wheel', function(e) {
        var maxScroll = Math.max(0, menu.scrollHeight - menu.clientHeight);
        if (maxScroll <= 0) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        var atTop = menu.scrollTop <= 0;
        var atBottom = menu.scrollTop >= maxScroll - 1;
        if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
            e.preventDefault();
        }
        e.stopPropagation();
    }, { passive: false });
    menu.dataset.scrollLockBound = '1';
}

function restoreGlobalFilterMenuHost(menu) {
    if (!menu || !menu.__host) return;
    if (menu.parentElement !== menu.__host) {
        menu.__host.appendChild(menu);
    }
}

function positionGlobalFilterMenu(trigger, menu) {
    if (!trigger || !menu) return;
    restoreGlobalFilterMenuHost(menu);
    var host = menu.__host || menu.parentElement;
    var isSharedPanelMenu = !!(host && host.closest && host.closest('#global-shared-filter-panel'));
    if (host && !isSharedPanelMenu) {
        host.style.position = 'relative';
        host.style.overflow = 'visible';
    }
    var rect = trigger.getBoundingClientRect();
    var width = Math.max(220, Math.round((isSharedPanelMenu ? rect.width : (trigger.offsetWidth || 0))));
    var viewportBottomSpace = window.innerHeight - Math.round(rect.bottom) - 12;
    var maxHeight = Math.max(240, Math.min(viewportBottomSpace, Math.round(window.innerHeight * 0.72)));
    if (isSharedPanelMenu) {
        var left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
        menu.style.setProperty('position', 'fixed', 'important');
        menu.style.setProperty('top', Math.round(rect.bottom + 2) + 'px', 'important');
        menu.style.setProperty('left', Math.round(left) + 'px', 'important');
    } else {
        menu.style.setProperty('position', 'absolute', 'important');
        menu.style.setProperty('top', Math.round((trigger.offsetTop || 0) + (trigger.offsetHeight || 0) + 2) + 'px', 'important');
        menu.style.setProperty('left', Math.round(trigger.offsetLeft || 0) + 'px', 'important');
    }
    menu.style.setProperty('right', 'auto', 'important');
    menu.style.setProperty('bottom', 'auto', 'important');
    menu.style.setProperty('box-sizing', 'border-box', 'important');
    menu.style.setProperty('width', Math.round(width) + 'px', 'important');
    menu.style.setProperty('max-height', maxHeight + 'px', 'important');
    menu.style.setProperty('overflow-y', 'auto', 'important');
    menu.style.setProperty('overscroll-behavior', 'contain', 'important');
    menu.style.setProperty('-ms-scroll-chaining', 'none', 'important');
    menu.style.setProperty('margin', '0', 'important');
    menu.style.setProperty('transform', 'none', 'important');
    menu.style.setProperty('inset', 'auto auto auto auto', 'important');
    menu.style.setProperty('z-index', '5000', 'important');
    bindGlobalFilterMenuScrollLock(menu);
}

function ensureGlobalFilterTooltip() {
    var tooltip = document.getElementById('global-filter-tooltip');
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = 'global-filter-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.display = 'none';
    tooltip.style.padding = '6px 10px';
    tooltip.style.border = '1px solid rgba(148, 163, 184, 0.18)';
    tooltip.style.borderRadius = '12px';
    tooltip.style.background = 'rgba(255, 255, 255, 0.94)';
    tooltip.style.color = '#334155';
    tooltip.style.fontSize = '12px';
    tooltip.style.lineHeight = '1.2';
    tooltip.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';
    tooltip.style.backdropFilter = 'blur(12px)';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1100';
    document.body.appendChild(tooltip);
    return tooltip;
}

function showGlobalFilterTooltip(target, text) {
    if (!target || !text) return;
    var tooltip = ensureGlobalFilterTooltip();
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    var rect = target.getBoundingClientRect();
    var tooltipWidth = tooltip.offsetWidth || 120;
    var left = Math.min(Math.max(8, rect.left + Math.round((rect.width - tooltipWidth) / 2)), Math.max(8, window.innerWidth - tooltipWidth - 8));
    var top = Math.max(8, rect.top - (tooltip.offsetHeight || 32) - 8);
    tooltip.style.left = Math.round(left) + 'px';
    tooltip.style.top = Math.round(top) + 'px';
}

function hideGlobalFilterTooltip() {
    var tooltip = document.getElementById('global-filter-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

function bindGlobalFilterTooltip(target, text) {
    if (!target || !text) return;
    target.setAttribute('aria-label', text);
    target.addEventListener('mouseenter', function() { showGlobalFilterTooltip(target, text); });
    target.addEventListener('mouseleave', hideGlobalFilterTooltip);
    target.addEventListener('focus', function() { showGlobalFilterTooltip(target, text); });
    target.addEventListener('blur', hideGlobalFilterTooltip);
}

function composeChartTitle(baseTitle, contextText) {
    var base = String(baseTitle || '').trim();
    var context = String(contextText || '').trim();
    if (!context) return base;
    return base + '<br><span style="font-size:12px;color:#64748b;font-weight:400;">' + context + '</span>';
}

function buildChartContextLabel(periodValue, experienceValue) {
    var parts = [];
    var period = String(formatPeriodSelectionValue(periodValue) || '').trim();
    var experience = String(experienceValue || '').trim();
    var allExperienceValues = [
        'Нет опыта',
        'От 1 года до 3 лет',
        'От 3 до 6 лет',
        'Более 6 лет'
    ].map(function(item) { return normalizeExperience(item); }).filter(Boolean);
    function isAllExperienceSelection(value) {
        var text = String(value || '').trim();
        if (!text) return false;
        if (text === 'Все' || text === 'Все категории') return true;
        var values = Array.from(new Set(text.split(',').map(function(item) {
            return normalizeExperience(item);
        }).filter(Boolean)));
        if (values.length !== allExperienceValues.length) return false;
        return allExperienceValues.every(function(item) { return values.indexOf(item) !== -1; });
    }
    if (period) parts.push('Период: ' + period);
    if (isAllExperienceSelection(experience)) {
        parts.push('Опыт: все категории');
    } else if (experience) {
        parts.push('Опыт: ' + experience);
    }
    return parts.join(' · ');
}

function applyChartTitleContext(graphId, baseTitle, contextText) {
    if (!graphId || typeof Plotly === 'undefined') return;
    var container = setUnifiedChartHeader(graphId, baseTitle, contextText);
    var el = container.host || (typeof graphId === 'string' ? document.getElementById(graphId) : graphId);
    if (!el) return;
    var layoutUpdate = {
        'title.text': '',
        'title.x': 0.5,
        'title.xanchor': 'center',
        'paper_bgcolor': 'rgba(0,0,0,0)',
        'plot_bgcolor': 'rgba(0,0,0,0)',
        'showlegend': false
    };
    var apply = function() {
        if (!el || !el.isConnected) return;
        Plotly.relayout(el, layoutUpdate);
    };
    apply();
    requestAnimationFrame(apply);
    setTimeout(apply, 60);
}

function refreshExistingGlobalFilterUi(parentRole, analysisType) {
    var activeRole = getActiveRoleContent(parentRole);
    var panel = document.getElementById('global-shared-filter-panel');
    if (!activeRole) return;

    var current = analysisType || activeRole.dataset.activeAnalysis || '';
    var isAllRolesView = activeRole.id === 'role-all';
    if (isAllRolesView) syncAllRolesPeriodStateFromGlobalFilter(activeRole, current);
    if (isAllRolesView) syncAllRolesSharedFilterButtons(activeRole, current);
    if (!panel) {
        applyGlobalFiltersToActiveAnalysis(activeRole, current);
        return;
    }

    panel.querySelectorAll('.global-filter-dropdown[data-filter-key]').forEach(function(wrap) {
        var key = wrap.dataset.filterKey || '';
        var labelNode = wrap.querySelector('.global-filter-trigger-label');
        if (!labelNode) return;

        if (key === 'periods' && isAllRolesView) {
            var periodOptions = getGlobalFilterOptions(activeRole, key, current);
            labelNode.textContent = summarizeGlobalFilterSelection(key, periodOptions, false);
            return;
        }

        var disabled = false;
        var options = getGlobalFilterOptions(activeRole, key, current);
        labelNode.textContent = summarizeGlobalFilterSelection(key, options, disabled);
    });

    var rolesWrap = panel.querySelector('.global-filter-dropdown[data-filter-key="roles"]');
    if (rolesWrap) {
        var rolesBucket = ensureGlobalFilterBucket('roles');
        var selectedRoles = rolesBucket.include || [];
        rolesWrap.querySelectorAll('.skills-search-dropdown-item[data-role-value]').forEach(function(row) {
            var roleValue = row.dataset.roleValue || '';
            var selected = selectedRoles.indexOf(roleValue) >= 0;
            row.style.background = selected ? '#eef2f6' : 'transparent';
            var label = row.querySelector('div');
            if (label) label.style.fontWeight = selected ? '600' : '400';
        });
        if (uiState.keep_roles_filter_open) {
            var rolesMenu = rolesWrap.querySelector('.global-filter-menu');
            var rolesTrigger = rolesWrap.querySelector('.global-filter-trigger');
            var rolesArrow = rolesWrap.querySelector('.global-filter-trigger-arrow');
            if (rolesMenu) {
                rolesMenu.style.display = 'block';
                if (rolesTrigger) positionGlobalFilterMenu(rolesTrigger, rolesMenu);
            }
            if (rolesArrow) rolesArrow.textContent = '\u25B4';
        }
    }

    renderActiveGlobalFilterChips(panel, activeRole, current);
    applyGlobalFiltersToActiveAnalysis(activeRole, current);
}

function isSummaryModeActive() {
    var ctx = uiState.roleSelectionContext;
    return !!(ctx && typeof ctx.isSummaryActive === 'function' && ctx.isSummaryActive());
}

function setSummaryModeActive(isActive) {
    var ctx = uiState.roleSelectionContext;
    if (ctx && typeof ctx.setSummaryActive === 'function') {
        ctx.setSummaryActive(!!isActive);
        return;
    }
    uiState.all_roles_active = !!isActive;
}
function syncAllRolesPeriodStateFromGlobalFilter(activeRole, analysisType) {
    if (!activeRole || activeRole.id !== 'role-all' || !uiState.all_roles_periods) return;
    var current = String(analysisType || activeRole.dataset.activeAnalysis || '').replace(/-all$/, '');
    if (!current) return;
    var options = getGlobalFilterOptions(activeRole, 'periods', current);
    var selected = getResolvedGlobalFilterValues('periods', options);
    if (!selected.length || selected.length === (options || []).length) {
        uiState.all_roles_periods[current] = 'all';
        return;
    }
    if (selected.length !== 1) return;
    var normalized = normalizeGlobalPeriodValue(selected[0]);
    if (!normalized) return;
    uiState.all_roles_periods[current] = normalized === 'summary' ? 'all' : normalized;
}

function applyGlobalRoleFilter() {
    var ctx = uiState.roleSelectionContext;
    if (!ctx) return;
    var allOptions = getGlobalFilterOptions(null, 'roles', null);
    var allIds = allOptions.map(function(item) { return item.value; });
    var bucket = ensureGlobalFilterBucket('roles');
    var include = bucket.include.filter(function(v) { return allIds.indexOf(v) >= 0; });
    var exclude = bucket.exclude.filter(function(v) { return allIds.indexOf(v) >= 0; });
    var next;
    if (include.length) next = include.filter(function(v) { return exclude.indexOf(v) < 0; });
    else if (exclude.length) next = allIds.filter(function(v) { return exclude.indexOf(v) < 0; });
    else next = [];
    if (isSummaryModeActive() && !isGlobalFilterMultiEnabled('roles') && next.length <= 1 && typeof ctx.exitAllRolesMode === 'function') {
        ctx.exitAllRolesMode(new Set(next), next);
        return;
    }
    ctx.applySelection(new Set(next), next);
}

function updateGlobalFilterSelection(filterKey, value, action) {
    var bucket = ensureGlobalFilterBucket(filterKey);
    var previousInclude = bucket.include.slice();
    if (filterKey === 'roles') bucket.exclude = [];
    if (action === 'reset') {
        bucket.include = bucket.include.filter(function(v) { return v !== value; });
        bucket.exclude = bucket.exclude.filter(function(v) { return v !== value; });
    } else if (action === 'include') {
        if (isGlobalFilterMultiEnabled(filterKey)) {
            if (bucket.include.indexOf(value) < 0) bucket.include.push(value);
            bucket.exclude = bucket.exclude.filter(function(v) { return v !== value; });
        } else {
            bucket.include = value ? [value] : [];
            bucket.exclude = [];
        }
    } else if (action === 'exclude') {
        if (filterKey === 'roles') return;
        if (isGlobalFilterMultiEnabled(filterKey)) {
            if (bucket.exclude.indexOf(value) < 0) bucket.exclude.push(value);
            bucket.include = bucket.include.filter(function(v) { return v !== value; });
        } else {
            bucket.exclude = value ? [value] : [];
            bucket.include = [];
        }
    } else if (action === 'all') {
        if (filterKey === 'roles') {
            bucket.include = getGlobalFilterOptions(null, 'roles', null).map(function(item) { return item.value; });
            bucket.exclude = [];
        } else {
            bucket.include = [];
            bucket.exclude = [];
        }
    } else if (action === 'clear') {
        if (filterKey === 'roles') {
            bucket.include = previousInclude.length ? [previousInclude[0]] : [];
        } else {
            bucket.include = [];
        }
        bucket.exclude = [];
    } else if (action === 'clear_excluded') {
        if (filterKey === 'roles') return;
        bucket.exclude = [];
    }
    if (filterKey === 'roles') {
        if (uiState.keep_roles_filter_open && isGlobalFilterMultiEnabled('roles')) {
            uiState.pending_roles_filter_apply = true;
            return;
        }
        if (action === 'clear' && isSummaryModeActive()) {
            var ctx = uiState.roleSelectionContext;
            if (ctx && typeof ctx.applySelection === 'function') {
                ctx.applySelection(new Set(bucket.include), bucket.include.slice());
                return;
            }
        }
        applyGlobalRoleFilter();
        return;
    }
    refreshExistingGlobalFilterUi();
}

function renderActiveGlobalFilterChips(panel, activeRole, analysisType) {
    if (!panel) return;
    var host = panel.querySelector('.shared-filter-active-chips');
    if (!host) return;
    host.innerHTML = '';

    var defs = [
        { key: 'roles', title: 'Роль', options: getGlobalFilterOptions(activeRole, 'roles', analysisType), disabled: false }
    ];

    defs.forEach(function(def) {
        if (def.disabled) return;
        var bucket = ensureGlobalFilterBucket(def.key);
        var labels = {};
        (def.options || []).forEach(function(item) { labels[item.value] = item.label; });
        (bucket.include || []).forEach(function(value) {
            if (!labels[value]) return;
            host.appendChild(createActiveRoleFilterChip(def.key, value, labels[value], 'include'));
        });
    });
}

function createActiveRoleFilterChip(filterKey, value, labelText, state) {
    var chip = document.createElement('div');
    var isExcluded = state === 'exclude';
    chip.className = 'active-role-filter-chip';
    chip.title = '';
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';
    chip.style.gap = '6px';
    chip.style.border = '0';
    chip.style.borderRadius = '999px';
    chip.style.padding = '4px 10px';
    chip.style.cursor = 'pointer';
    chip.style.userSelect = 'none';
    chip.style.background = isExcluded ? '#fee2e2' : '#eef2f6';
    chip.style.color = isExcluded ? '#991b1b' : 'inherit';
    chip.style.transform = 'translateY(0)';
    chip.style.boxShadow = 'none';
    chip.style.transition = 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease';

    var label = document.createElement('span');
    label.textContent = labelText;
    label.style.fontSize = '12px';
    chip.appendChild(label);

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '\u00D7';
    removeBtn.title = 'Удалить роль из выбранных';
    removeBtn.style.padding = '0';
    removeBtn.style.border = '0';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.background = 'transparent';
    removeBtn.style.color = 'inherit';
    removeBtn.style.fontSize = '14px';
    removeBtn.style.lineHeight = '1';
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        updateGlobalFilterSelection(filterKey, value, 'reset');
    });
    chip.appendChild(removeBtn);

    chip.addEventListener('click', function(e) {
        if (e.target === removeBtn) return;
        updateGlobalFilterSelection(filterKey, value, 'include');
    });
    chip.addEventListener('mouseenter', function() {
        chip.style.transform = 'translateY(-1px)';
        chip.style.boxShadow = '0 6px 14px rgba(148, 163, 184, 0.14)';
    });
    chip.addEventListener('mouseleave', function() {
        chip.style.transform = 'translateY(0)';
        chip.style.boxShadow = 'none';
    });
    return chip;
}

function createUnifiedRolesControl(activeRole, analysisType) {
    var options = getGlobalFilterOptions(activeRole, 'roles', analysisType);
    var bucket = ensureGlobalFilterBucket('roles');
    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown skills-search-dropdown';
    wrap.dataset.filterKey = 'roles';
    wrap.style.marginTop = '4px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = '280px';
    wrap.style.width = '280px';

    var caption = document.createElement('div');
    caption.textContent = 'Роли';
    caption.style.fontSize = '10px';
    caption.style.fontWeight = '600';
    caption.style.marginBottom = '4px';
    caption.style.color = '#94a3b8';
    wrap.appendChild(caption);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tab-button global-filter-trigger skills-search-dropdown-btn';
    trigger.style.width = '100%';
    trigger.style.borderRadius = '999px';
    trigger.style.padding = '5px 10px';
    trigger.style.minHeight = '34px';
    trigger.style.border = '1px solid rgba(148, 163, 184, 0.22)';
    trigger.style.background = 'rgba(248, 250, 252, 0.92)';
    trigger.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.8)';
    trigger.style.display = 'flex';
    trigger.style.alignItems = 'center';
    trigger.style.justifyContent = 'space-between';

    var triggerLabel = document.createElement('span');
    triggerLabel.className = 'global-filter-trigger-label';
    triggerLabel.textContent = summarizeGlobalFilterSelection('roles', options, false);
    triggerLabel.style.overflow = 'hidden';
    triggerLabel.style.textOverflow = 'ellipsis';
    triggerLabel.style.whiteSpace = 'nowrap';
    triggerLabel.style.maxWidth = 'calc(100% - 18px)';
    trigger.appendChild(triggerLabel);

    var triggerArrow = document.createElement('span');
    triggerArrow.className = 'global-filter-trigger-arrow';
    triggerArrow.textContent = '\u25BE';
    triggerArrow.style.fontSize = '12px';
    triggerArrow.style.opacity = '0.8';
    trigger.appendChild(triggerArrow);
    wrap.appendChild(trigger);

    var menu = document.createElement('div');
    menu.className = 'global-filter-menu skills-search-dropdown-menu';
    menu.style.display = 'none';
    menu.style.marginTop = '0';
    menu.style.padding = '6px';
    menu.style.border = '1px solid var(--border-color, #d9e2ec)';
    menu.style.borderRadius = '12px';
    menu.style.background = 'var(--card-background, #fff)';
    menu.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.08)';
    menu.style.width = '240px';
    menu.style.maxWidth = 'calc(100vw - 48px)';
    menu.style.maxHeight = '260px';
    menu.style.overflowY = 'auto';

    var controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '4px';
    controls.style.flexWrap = 'wrap';
    controls.style.marginBottom = '0';
    controls.style.padding = '2px';

    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'tab-button skills-search-dropdown-item';
    allBtn.textContent = '\u2713';
    bindGlobalFilterTooltip(allBtn, 'Выбрать все');
    applyGlobalFilterIconButtonStyle(allBtn, false);
    allBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (isGlobalFilterMultiEnabled('roles')) uiState.keep_roles_filter_open = true;
        updateGlobalFilterSelection('roles', '', 'all');
        syncRolesControlVisualState();
    });
    controls.appendChild(allBtn);

    var multiBtn = document.createElement('button');
    multiBtn.type = 'button';
    multiBtn.className = 'tab-button skills-search-dropdown-item';
    multiBtn.textContent = '\u2611';
    bindGlobalFilterTooltip(multiBtn, 'Мультивыбор');
    applyGlobalFilterIconButtonStyle(multiBtn, isGlobalFilterMultiEnabled('roles'));
    multiBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        uiState.keep_roles_filter_open = true;
        var next = !isGlobalFilterMultiEnabled('roles');
        setGlobalFilterMultiEnabled('roles', next);
        applyGlobalFilterIconButtonStyle(multiBtn, next);
        if (next) {
            uiState.pending_roles_filter_apply = true;
            syncRolesControlVisualState();
        } else {
            applyGlobalRoleFilter();
        }
    });
    controls.appendChild(multiBtn);

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'tab-button skills-search-dropdown-item';
    clearBtn.textContent = '\u21BA';
    bindGlobalFilterTooltip(clearBtn, 'Сбросить все');
    applyGlobalFilterIconButtonStyle(clearBtn, false);
    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (isGlobalFilterMultiEnabled('roles')) uiState.keep_roles_filter_open = true;
        updateGlobalFilterSelection('roles', '', 'clear');
        syncRolesControlVisualState();
    });
    controls.appendChild(clearBtn);
    menu.appendChild(controls);

    var search = document.createElement('input');
    search.type = 'text';
    search.className = 'global-filter-search';
    search.placeholder = 'Поиск роли';
    search.style.width = '100%';
    search.style.boxSizing = 'border-box';
    search.style.marginBottom = '2px';
    search.style.marginLeft = '2px';
    search.style.marginRight = '2px';
    search.style.padding = '7px 10px';
    search.style.fontSize = '12px';
    search.style.border = '1px solid var(--border-color, #d9e2ec)';
    search.style.borderRadius = '8px';
    menu.appendChild(search);

    function syncRolesControlVisualState() {
        triggerLabel.textContent = summarizeGlobalFilterSelection('roles', options, false);
        var selectedRoles = bucket.include || [];
        menu.querySelectorAll('.skills-search-dropdown-item[data-role-value]').forEach(function(node) {
            var roleValue = node.dataset.roleValue || '';
            var selected = selectedRoles.indexOf(roleValue) >= 0;
            node.style.background = selected ? '#eef2f6' : 'transparent';
            var labelNode = node.querySelector('div');
            if (labelNode) labelNode.style.fontWeight = selected ? '600' : '400';
        });
    }

    options.forEach(function(option) {
        var row = document.createElement('div');
        row.className = 'skills-search-dropdown-item';
        row.dataset.roleValue = option.value;
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '1fr';
        row.style.gap = '4px';
        row.style.alignItems = 'center';
        row.style.marginBottom = '2px';
        row.style.padding = '5px 8px';
        row.style.borderRadius = '8px';
        row.style.cursor = 'pointer';
        row.title = '';
        row.addEventListener('click', function(e) {
            e.stopPropagation();
            if (isGlobalFilterMultiEnabled('roles')) uiState.keep_roles_filter_open = true;
            if (isSummaryModeActive() && !isGlobalFilterMultiEnabled('roles')) setSummaryModeActive(false);
            var isIncluded = bucket.include.indexOf(option.value) >= 0;
            updateGlobalFilterSelection('roles', option.value, isIncluded ? 'reset' : 'include');
            syncRolesControlVisualState();
        });
        var label = document.createElement('div');
        var isIncludedNow = bucket.include.indexOf(option.value) >= 0;
        label.textContent = option.label;
        label.style.fontWeight = isIncludedNow ? '600' : '400';
        label.style.fontSize = '12px';
        row.style.background = isIncludedNow ? '#eef2f6' : 'transparent';
        row.appendChild(label);
        menu.appendChild(row);
    });

    search.addEventListener('input', function() {
        var q = String(search.value || '').trim().toLowerCase();
        Array.from(menu.children).forEach(function(node) {
            if (node === controls || node === search) return;
            var text = (node.textContent || '').trim().toLowerCase();
            node.style.display = !q || text.indexOf(q) >= 0 ? '' : 'none';
        });
    });

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var nextState = menu.style.display === 'none' ? 'block' : 'none';
        closeGlobalFilterMenus(menu, nextState === 'block' ? triggerArrow : null);
        menu.style.display = nextState;
        if (nextState === 'block') positionGlobalFilterMenu(trigger, menu);
        triggerArrow.textContent = nextState === 'block' ? '\u25B4' : '\u25BE';
    });

    wrap.appendChild(menu);
    menu.addEventListener('mouseleave', function() {
        if (!uiState.keep_roles_filter_open) return;
        uiState.keep_roles_filter_open = false;
        menu.style.display = 'none';
        if (typeof restoreGlobalFilterMenuHost === 'function') restoreGlobalFilterMenuHost(menu);
        triggerArrow.textContent = '\u25BE';
        if (uiState.pending_roles_filter_apply) {
            uiState.pending_roles_filter_apply = false;
            applyGlobalRoleFilter();
        }
    });
    if (uiState.keep_roles_filter_open) {
        menu.style.display = 'block';
        positionGlobalFilterMenu(trigger, menu);
        triggerArrow.textContent = '\u25B4';
    }
    return wrap;
}

function createGlobalFilterDropdown(filterKey, title, options, disabled) {
    var bucket = ensureGlobalFilterBucket(filterKey);
    var isRolesFilter = filterKey === 'roles';
    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown skills-search-dropdown';
    wrap.dataset.filterKey = filterKey;
    wrap.style.marginTop = '4px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = isRolesFilter ? '280px' : '220px';
    wrap.style.width = isRolesFilter ? '280px' : '220px';

    var caption = document.createElement('div');
    caption.textContent = title;
    caption.style.fontSize = '10px';
    caption.style.fontWeight = '600';
    caption.style.marginBottom = '4px';
    caption.style.color = '#94a3b8';
    wrap.appendChild(caption);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tab-button global-filter-trigger skills-search-dropdown-btn';
    trigger.style.width = '100%';
    trigger.style.borderRadius = '999px';
    trigger.style.padding = isRolesFilter ? '5px 10px' : '5px 10px';
    trigger.style.minHeight = '34px';
    trigger.style.border = '1px solid rgba(148, 163, 184, 0.22)';
    trigger.style.background = 'rgba(248, 250, 252, 0.92)';
    trigger.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.8)';
    trigger.style.display = 'flex';
    trigger.style.alignItems = 'center';
    trigger.style.justifyContent = 'space-between';
    if (disabled) trigger.disabled = true;

    var triggerLabel = document.createElement('span');
    triggerLabel.className = 'global-filter-trigger-label';
    triggerLabel.textContent = summarizeGlobalFilterSelection(filterKey, options, disabled);
    triggerLabel.style.overflow = 'hidden';
    triggerLabel.style.textOverflow = 'ellipsis';
    triggerLabel.style.whiteSpace = 'nowrap';
    triggerLabel.style.maxWidth = 'calc(100% - 18px)';
    trigger.appendChild(triggerLabel);

    var triggerArrow = document.createElement('span');
    triggerArrow.className = 'global-filter-trigger-arrow';
    triggerArrow.textContent = '\u25BE';
    triggerArrow.style.fontSize = '12px';
    triggerArrow.style.opacity = '0.8';
    if (disabled) triggerArrow.style.opacity = '0.35';
    trigger.appendChild(triggerArrow);
    wrap.appendChild(trigger);

    var menu = document.createElement('div');
    menu.className = 'global-filter-menu skills-search-dropdown-menu';
    menu.style.display = 'none';
    menu.style.marginTop = '0';
    menu.style.padding = isRolesFilter ? '6px' : '6px';
    menu.style.border = '1px solid var(--border-color, #d9e2ec)';
    menu.style.borderRadius = '12px';
    menu.style.background = 'var(--card-background, #fff)';
    menu.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.08)';
    menu.style.width = isRolesFilter ? '240px' : '220px';
    menu.style.maxWidth = 'calc(100vw - 48px)';
    menu.style.maxHeight = '260px';
    menu.style.overflowY = 'auto';
    menu.style.overscrollBehavior = 'contain';
    bindGlobalFilterMenuScrollLock(menu);

    var controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '4px';
    controls.style.flexWrap = 'wrap';
    controls.style.marginBottom = '0';
    controls.style.padding = '2px';
    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'tab-button skills-search-dropdown-item';
    allBtn.textContent = '\u2713';
    bindGlobalFilterTooltip(allBtn, 'Выбрать все');
    applyGlobalFilterIconButtonStyle(allBtn, false);
    allBtn.addEventListener('click', function() { updateGlobalFilterSelection(filterKey, '', 'all'); });
    controls.appendChild(allBtn);

    var multiBtn = document.createElement('button');
    multiBtn.type = 'button';
    multiBtn.className = 'tab-button skills-search-dropdown-item';
    multiBtn.textContent = '\u2611';
    bindGlobalFilterTooltip(multiBtn, 'Мультивыбор');
    applyGlobalFilterIconButtonStyle(multiBtn, isGlobalFilterMultiEnabled(filterKey));
    multiBtn.addEventListener('click', function() {
        var next = !isGlobalFilterMultiEnabled(filterKey);
        setGlobalFilterMultiEnabled(filterKey, next);
        applyGlobalFilterIconButtonStyle(multiBtn, next);
        refreshExistingGlobalFilterUi();
    });
    controls.appendChild(multiBtn);

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'tab-button skills-search-dropdown-item';
    clearBtn.textContent = '\u21BA';
    bindGlobalFilterTooltip(clearBtn, 'Сбросить все');
    applyGlobalFilterIconButtonStyle(clearBtn, false);
    clearBtn.addEventListener('click', function() { updateGlobalFilterSelection(filterKey, '', 'clear'); });
    controls.appendChild(clearBtn);
    menu.appendChild(controls);

    if (filterKey === 'roles' && !disabled) {
        var search = document.createElement('input');
        search.type = 'text';
        search.className = 'global-filter-search';
        search.placeholder = 'Поиск роли';
        search.style.width = '100%';
        search.style.boxSizing = 'border-box';
        search.style.marginBottom = '2px';
        search.style.marginLeft = '2px';
        search.style.marginRight = '2px';
        search.style.padding = '7px 10px';
        search.style.fontSize = '12px';
        search.style.border = '1px solid var(--border-color, #d9e2ec)';
        search.style.borderRadius = '8px';
        menu.appendChild(search);
    }

    if (!options.length) {
        var empty = document.createElement('div');
        empty.textContent = disabled ? 'Фильтр недоступен на этой вкладке' : 'Нет значений';
        empty.style.color = 'var(--text-secondary, #52606d)';
        empty.style.fontSize = '12px';
        empty.style.padding = '5px 8px';
        menu.appendChild(empty);
    } else {
        var searchInput = menu.querySelector('.global-filter-search');
        options.forEach(function(option) {
            var row = document.createElement('div');
            row.className = 'skills-search-dropdown-item global-filter-option-row';
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '1fr';
            row.style.gap = '4px';
            row.style.width = '100%';
            row.style.boxSizing = 'border-box';
            row.style.alignItems = 'center';
            row.style.marginBottom = '2px';
            row.style.padding = '5px 8px';
            row.style.borderRadius = '8px';
            row.style.cursor = 'pointer';
            row.style.transition = 'transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease';
            row.title = '';
            row.addEventListener('click', function() {
                var isIncluded = bucket.include.indexOf(option.value) >= 0;
                updateGlobalFilterSelection(filterKey, option.value, isIncluded ? 'reset' : 'include');
            });
            var label = document.createElement('div');
            var isIncludedNow = bucket.include.indexOf(option.value) >= 0;
            label.textContent = option.label;
            label.style.fontWeight = isIncludedNow ? '600' : '400';
            label.style.fontSize = '12px';
            row.style.background = isIncludedNow ? '#eef2f6' : 'transparent';
            row.addEventListener('mouseenter', function() {
                row.style.transform = 'translateX(4px) translateY(-1px)';
                row.style.boxShadow = '0 6px 14px rgba(148, 163, 184, 0.12)';
                if (!isIncludedNow) {
                    row.style.background = 'rgba(248, 250, 252, 0.98)';
                }
            });
            row.addEventListener('mouseleave', function() {
                row.style.transform = 'translateX(0) translateY(0)';
                row.style.boxShadow = 'none';
                row.style.background = isIncludedNow ? '#eef2f6' : 'transparent';
            });
            row.appendChild(label);
            menu.appendChild(row);
        });
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                var q = String(searchInput.value || '').trim().toLowerCase();
                Array.from(menu.children).forEach(function(node) {
                    if (node === controls || node === searchInput) return;
                    var text = (node.textContent || '').trim().toLowerCase();
                    node.style.display = !q || text.indexOf(q) >= 0 ? '' : 'none';
                });
            });
        }
    }

    if (!disabled) {
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            var nextState = menu.style.display === 'none' ? 'block' : 'none';
            closeGlobalFilterMenus(menu, nextState === 'block' ? triggerArrow : null);
            menu.style.display = nextState;
            if (nextState === 'block') {
                positionGlobalFilterMenu(trigger, menu);
                triggerArrow.textContent = '\u25B4';
            } else {
                restoreGlobalFilterMenuHost(menu);
                triggerArrow.textContent = '\u25BE';
            }
        });
    }
    wrap.appendChild(menu);
    menu.__host = wrap;
    return wrap;
}

function getResolvedGlobalFilterValues(filterKey, options) {
    if (filterKey === 'periods') {
        var periodBucket = ensureGlobalFilterBucket(filterKey);
        var normalizedAllowed = (options || []).map(function(item) {
            return { raw: item.value, norm: normalizeGlobalPeriodValue(item.value) };
        });
        var includeNorm = (periodBucket.include || []).map(normalizeGlobalPeriodValue).filter(Boolean);
        var excludeNorm = (periodBucket.exclude || []).map(normalizeGlobalPeriodValue).filter(Boolean);
        if (includeNorm.indexOf('summary') >= 0) {
            return normalizedAllowed.filter(function(item) {
                return item.norm === 'summary';
            }).map(function(item) { return item.raw; });
        }
        if (includeNorm.length) {
            return normalizedAllowed.filter(function(item) {
                return includeNorm.indexOf(item.norm) >= 0 && excludeNorm.indexOf(item.norm) < 0;
            }).map(function(item) { return item.raw; });
        }
        return normalizedAllowed.filter(function(item) {
            return excludeNorm.indexOf(item.norm) < 0;
        }).map(function(item) { return item.raw; });
    }
    var bucket = ensureGlobalFilterBucket(filterKey);
    var allowed = (options || []).map(function(item) { return item.value; });
    var include = (bucket.include || []).filter(function(v) { return allowed.indexOf(v) >= 0; });
    var exclude = (bucket.exclude || []).filter(function(v) { return allowed.indexOf(v) >= 0; });
    if (include.length) return include.filter(function(v) { return exclude.indexOf(v) < 0; });
    return allowed.filter(function(v) { return exclude.indexOf(v) < 0; });
}

function normalizeGlobalPeriodValue(value) {
    var text = normalizePeriodOptionValue(value);
    if (!text) return '';
    if (text === 'today') return 'today';
    var quick = text.match(/^За\s+(\d+)\s+д/i) || text.match(/^last_(\d+)$/i) || text.match(/^(\d+)d$/i);
    if (quick) return 'last_' + String(Number(quick[1]) || 0);
    if (/^\d{4}-\d{2}$/.test(text)) return text;
    if (text === 'За период' || text === 'Весь период' || text === 'За все время' || isSummaryMonth(text)) return 'summary';
    return text;
}

function parsePublishedAtDate(value) {
    if (!value) return null;
    var text = String(value).trim();
    if (!text) return null;
    var match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (match) {
        var manual = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            Number(match[4] || 0),
            Number(match[5] || 0),
            Number(match[6] || 0)
        );
        return isNaN(manual) ? null : manual;
    }
    var parsed = new Date(text);
    return isNaN(parsed) ? null : parsed;
}

function getLatestPublishedAtDate(vacancies) {
    var list = Array.isArray(vacancies) ? vacancies : [];
    var maxDate = null;
    list.forEach(function(vacancy) {
        var published = parsePublishedAtDate(vacancy && vacancy.published_at);
        if (!published) return;
        if (!maxDate || published > maxDate) maxDate = published;
    });
    return maxDate;
}

function isSameCalendarDay(left, right) {
    if (!left || !right) return false;
    return left.getFullYear() === right.getFullYear()
        && left.getMonth() === right.getMonth()
        && left.getDate() === right.getDate();
}

function filterVacanciesByLatestDay(vacancies) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var maxDate = getLatestPublishedAtDate(list);
    if (!maxDate) return [];
    return list.filter(function(vacancy) {
        var published = parsePublishedAtDate(vacancy && vacancy.published_at);
        return published && isSameCalendarDay(published, maxDate);
    });
}

function filterVacanciesBySelectedPeriods(vacancies, selectedPeriods) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var labels = Array.isArray(selectedPeriods) ? selectedPeriods.filter(Boolean) : [];
    if (!labels.length) return list;
    var effectiveLabels = labels.filter(function(label) {
        var text = String(label || '').trim();
        return !isSummaryMonth(text) && text !== 'За период' && text !== 'Весь период' && text !== 'За все время';
    });
    if (!effectiveLabels.length) return list;

    var monthSet = new Set();
    var maxQuickDays = 0;
    var useToday = false;
    effectiveLabels.forEach(function(label) {
        var text = String(label || '').trim();
        if (text === 'Сегодня' || /^today$/i.test(text)) {
            useToday = true;
            return;
        }
        if (/^\d{4}-\d{2}$/.test(text)) {
            monthSet.add(text);
            return;
        }
        var match = text.match(/^За\s+(\d+)\s+д/i) || text.match(/^last_(\d+)$/i) || text.match(/^(\d+)d$/i);
        if (match) {
            var days = Number(match[1]) || 0;
            if (days > maxQuickDays) maxQuickDays = days;
        }
    });

    var quickCutoff = null;
    var maxDate = null;
    if (maxQuickDays > 0 || useToday) {
        maxDate = getLatestPublishedAtDate(list);
        if (maxDate && maxQuickDays > 0) quickCutoff = new Date(maxDate.getTime() - maxQuickDays * 24 * 60 * 60 * 1000);
    }

    if (!monthSet.size && !quickCutoff && !useToday) return list;

    return list.filter(function(v) {
        if (!v || !v.published_at) return false;
        var d = parsePublishedAtDate(v.published_at);
        if (!d) return false;
        var month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        if (monthSet.has(month)) return true;
        if (useToday && maxDate && isSameCalendarDay(d, maxDate)) return true;
        if (quickCutoff && d >= quickCutoff) return true;
        return false;
    });
}

function filterVacanciesBySelectedExperiences(vacancies, selectedExps) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var values = Array.isArray(selectedExps) ? selectedExps.filter(Boolean) : [];
    if (!values.length) return list;
    var allowed = new Set(values.map(function(exp) { return normalizeExperience(exp); }).filter(Boolean));
    if (!allowed.size) return list;
    return list.filter(function(v) {
        var exp = normalizeExperience(v && (v._experience || v.experience || ''));
        return !!exp && allowed.has(exp);
    });
}

function buildWeekdayTableHtml(days) {
    var rows = (days || []).map(function(day) {
        return '<tr>' +
            '<td>' + escapeHtml(day.weekday || '') + '</td>' +
            '<td>' + (day.publications || 0) + '</td>' +
            '<td>' + (day.archives || 0) + '</td>' +
            '<td>' + escapeHtml(day.avg_pub_hour || '—') + '</td>' +
            '<td>' + escapeHtml(day.avg_arch_hour || '—') + '</td>' +
        '</tr>';
    }).join('');
    return '<table>' +
        '<thead><tr><th>День недели</th><th>Публикаций</th><th>Архиваций</th><th>Ср. время публикации</th><th>Ср. время архивации</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
    '</table>';
}

function buildSkillsExpDataFromVacancies(vacancies, label) {
    var filtered = (vacancies || []).filter(function(v) { return !!(v && v.skills); });
    var totalVacancies = filtered.length;
    var skills = computeSalarySkillsFromVacancies(filtered, 30).map(function(item, idx) {
        return {
            skill: item.skill,
            count: item.count || 0,
            coverage: totalVacancies ? Math.round(((item.count || 0) * 10000) / totalVacancies) / 100 : 0,
            rank: idx + 1
        };
    });
    return {
        experience: label || 'По выбранному периоду',
        total_vacancies: totalVacancies,
        skills: skills
    };
}

function renderGlobalSkillsFiltered(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.skills-monthly-content');
    if (!block) return;

    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'skills-monthly');
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'skills-monthly');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var chartExperienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    var vacancies = getRoleVacancies(parentRole);
    vacancies = filterVacanciesBySelectedPeriods(vacancies, selectedPeriods);
    vacancies = filterVacanciesBySelectedExperiences(vacancies, selectedExps);

    Array.from(block.querySelectorAll('.monthly-skills-month-content')).forEach(function(monthDiv) {
        monthDiv.style.display = 'none';
    });

    var host = block.querySelector('.monthly-skills-month-content.global-filtered-month');
    if (!host) {
        host = document.createElement('div');
        host.className = 'monthly-skills-month-content global-filtered-month';
        host.style.display = 'none';
        var expDiv = document.createElement('div');
        expDiv.className = 'monthly-skills-exp-content';
        expDiv.style.display = 'block';
        expDiv.id = 'ms-exp-global-' + parentRole.id;
        expDiv.innerHTML =
            '<div class="view-toggle-horizontal">' +
                buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.skills_monthly_view_mode || 'together') +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                '<div class="table-container"></div>' +
                '<div class="plotly-graph" id="skills-monthly-graph-global-' + parentRole.id + '"></div>' +
            '</div>';
        host.appendChild(expDiv);
        block.appendChild(host);
    }

    var hostExp = host.querySelector('.monthly-skills-exp-content');
    if (hostExp && !hostExp.querySelector('.view-mode-container')) {
        hostExp.innerHTML =
            '<div class="view-toggle-horizontal">' +
                buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.skills_monthly_view_mode || 'together') +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                '<div class="table-container"></div>' +
                '<div class="plotly-graph" id="skills-monthly-graph-global-' + parentRole.id + '"></div>' +
            '</div>';
    } else if (hostExp && !hostExp.querySelector('.plotly-graph')) {
        var hostContainer = hostExp.querySelector('.view-mode-container');
        if (hostContainer) {
            hostContainer.insertAdjacentHTML('beforeend', '<div class="plotly-graph" id="skills-monthly-graph-global-' + parentRole.id + '"></div>');
        }
    }
    var agg = buildSkillsExpDataFromVacancies(vacancies, periodLabel);
    renderSkillsExpContent(hostExp, agg);
    host.style.display = 'block';
    var skillsMode = uiState.skills_monthly_view_mode || 'together';
    setActiveViewButton(hostExp.querySelectorAll('.view-mode-btn'), skillsMode);
    var container = hostExp.querySelector('.view-mode-container');
    applyViewMode(container, skillsMode);
    var globalSkillsGraphId = 'skills-monthly-graph-global-' + parentRole.id;
    if (skillsMode !== 'table') {
        buildHorizontalBarChart(globalSkillsGraphId, agg.skills || [], agg.experience || periodLabel);
        applyChartTitleContext(globalSkillsGraphId, 'Топ-30 навыков', buildChartContextLabel(chartPeriodLabel, chartExperienceLabel));
        resizePlotlyScope(document.getElementById(globalSkillsGraphId));
    }
    applySkillsModeSizing(container, skillsMode);
}

function renderGlobalSalaryFiltered(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.salary-content');
    if (!block) return;
    rebuildSalaryFromVacancies(parentRole, block);

    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'salary');
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'salary');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var chartExperienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    var vacancies = getRoleVacancies(parentRole);
    vacancies = filterVacanciesBySelectedPeriods(vacancies, selectedPeriods);
    vacancies = filterVacanciesBySelectedExperiences(vacancies, selectedExps);
    var monthData = buildSalaryMonthFromVacancies(vacancies, periodLabel);
    var summaryExp = (monthData.experiences || []).find(function(exp) { return exp && exp.experience === 'Все'; });
    var entries = summaryExp ? (summaryExp.entries || []) : [];

    Array.from(block.querySelectorAll('.salary-month-content')).forEach(function(monthDiv) {
        monthDiv.style.display = 'none';
    });

    var host = block.querySelector('.salary-month-content.global-filtered-month');
    if (!host) {
        host = document.createElement('div');
        host.className = 'salary-month-content global-filtered-month';
        host.style.display = 'none';
        var expDiv = document.createElement('div');
        expDiv.className = 'salary-exp-content';
        expDiv.style.display = 'block';
        expDiv.id = 'sal-exp-global-' + parentRole.id;
        expDiv.innerHTML =
            '<div class="salary-display-flex">' +
                '<div class="salary-main-content">' +
                    '<div class="salary-table-container"></div>' +
                    '<div class="salary-graph-container">' +
                        '<div class="plotly-graph" id="salary-graph-global-' + parentRole.id + '"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        host.appendChild(expDiv);
        block.appendChild(host);
    }

    var hostExp = host.querySelector('.salary-exp-content');
    hostExp._data = { exp: { experience: periodLabel, entries: entries } };
    hostExp.dataset.chartContext = buildChartContextLabel(chartPeriodLabel, chartExperienceLabel);
    var tableContainer = hostExp.querySelector('.salary-table-container');
    if (tableContainer) {
        tableContainer.innerHTML = buildSalaryTablesHtml(entries);
        bindSalaryRowData(tableContainer, entries);
    }
    applySalaryStatusIcons(hostExp);
    host.style.display = 'block';
    applySalaryViewMode(hostExp, entries);
}

function renderGlobalActivityFiltered(parentRole) {
    if (!parentRole) return;
    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'activity');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'activity');
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    var chartExperienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    var vacancies = filterVacanciesBySelectedPeriods(getRoleVacancies(parentRole), selectedPeriods);
    vacancies = filterVacanciesBySelectedExperiences(vacancies, selectedExps);
    var entries = computeActivityEntriesFromVacancies(vacancies);

    Array.from(parentRole.querySelectorAll('.month-content.activity-only')).forEach(function(monthDiv) {
        monthDiv.style.display = 'none';
    });

    var host = parentRole.querySelector('.month-content.activity-only.global-filtered-month');
    if (!host) {
        host = buildActivityBlock(parentRole, 'month-' + parentRole.id + '-global-filtered', periodLabel, []);
        host.classList.add('global-filtered-month');
    }

    host.dataset.month = periodLabel;
    host.dataset.entries = JSON.stringify(entries || []);
    host._data = { entries: entries || [], month: periodLabel };
    var tableWrap = host.querySelector('.table-container');
    if (tableWrap) tableWrap.innerHTML = buildActivityTableHtml(entries || []);
    host.style.display = 'block';

    var mode = uiState.activity_view_mode || 'together';
    setActiveViewButton(host.querySelectorAll('.view-mode-btn'), mode);
    var container = host.querySelector('.view-mode-container');
    applyViewMode(container, mode);
    var globalActivityGraphId = 'activity-graph-' + host.id.replace('month-', '');
    buildActivityBarChart(globalActivityGraphId, entries || []);
    applyChartTitleContext(globalActivityGraphId, 'Количество вакансий по опыту', buildChartContextLabel(chartPeriodLabel, chartExperienceLabel));
    applyActivityModeSizing(container, mode);
}

function renderGlobalWeekdayFiltered(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.weekday-content');
    if (!block) return;

    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'weekday');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'weekday');
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var chartExperienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    var vacancies = filterVacanciesBySelectedPeriods(getRoleVacancies(parentRole), selectedPeriods);
    vacancies = filterVacanciesBySelectedExperiences(vacancies, selectedExps);
    var weekdays = computeWeekdayStatsFromVacancies(vacancies);

    block.dataset.weekdays = JSON.stringify(weekdays || []);
    var tableWrap = block.querySelector('.table-container');
    if (tableWrap) tableWrap.innerHTML = buildWeekdayTableHtml(weekdays || []);

    var roleMatch = String(parentRole.id || '').match(/^role-(.+)$/);
    var roleSuffix = roleMatch ? roleMatch[1] : '';
    var mode = uiState.weekday_view_mode || 'together';
    var container = block.querySelector('.view-mode-container');
    if (container) {
        setActiveViewButton(block.querySelectorAll('.view-mode-btn'), mode);
        applyViewMode(container, mode);
        if (roleSuffix) {
            var weekdayGraphId = 'weekday-graph-' + roleSuffix;
            buildWeekdayBarChart(roleSuffix, block);
            applyChartTitleContext(weekdayGraphId, 'Распределение по дням недели', buildChartContextLabel(resolveChartPeriodLabel(selectedPeriods), chartExperienceLabel));
        }
        applyWeekdayModeSizing(container, mode);
    }
}

function applyGlobalFiltersToSkillsSearch(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.skills-search-content');
    if (!block) return;
    initSkillsSearch(parentRole);
    updateSkillsSearchData(block);
}

function renderGlobalEmployerFiltered(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.employer-analysis-content');
    if (!block) return;
    if (block.dataset.employerInited !== '1') initEmployerAnalysisFilter(block);
    if (!block.__employerData || !block.__employerData.length) return;

    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'employer-analysis');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var selectedExps = getResolvedAnalysisExperienceValues(parentRole, 'employer-analysis');
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    block.dataset.chartContext = buildChartContextLabel(chartPeriodLabel, getResolvedAnalysisExperienceLabel(parentRole, 'employer-analysis'));
    var baseVacancies = filterVacanciesBySelectedExperiences(dedupeVacanciesById(getRoleVacancies(parentRole) || []), selectedExps);
    var rows;
    var effectivePeriods = selectedPeriods.filter(function(label) {
        var text = String(label || '').trim();
        return !isSummaryMonth(text) && text !== 'За период' && text !== 'Весь период' && text !== 'За все время';
    });
    var allPeriod = !selectedPeriods.length || !effectivePeriods.length;
    if (allPeriod) {
        rows = buildEmployerAnalysisRowsFromVacancies(baseVacancies, 'filtered');
    } else {
        rows = buildEmployerAnalysisRowsFromVacancies(filterVacanciesBySelectedPeriods(baseVacancies, selectedPeriods), 'filtered');
    }

    renderEmployerAnalysisTable(block, rows, periodLabel);
    block.dataset.employerActiveMonth = 'global';
    renderEmployerAnalysisChart(block);
}

function applyGlobalFiltersToActiveAnalysis(parentRole, analysisType) {
    if (!parentRole) return;
    if (parentRole.id === 'role-all') {
        if (parentRole.__renderingAllRoles) return;
        renderAllRolesContainer(parentRole, parentRole.__selectedRoleContents || getAllRoleContents());
        return;
    }
    var current = analysisType || parentRole.dataset.activeAnalysis || '';
    if (current === 'skills-monthly') renderGlobalSkillsFiltered(parentRole);
    else if (current === 'salary') renderGlobalSalaryFiltered(parentRole);
    else if (current === 'activity') renderGlobalActivityFiltered(parentRole);
    else if (current === 'weekday') renderGlobalWeekdayFiltered(parentRole);
    else if (current === 'skills-search') applyGlobalFiltersToSkillsSearch(parentRole);
    else if (current === 'employer-analysis') renderGlobalEmployerFiltered(parentRole);
}

function syncSharedFilterPanel(parentRole, analysisType, skipActiveApply) {
    var activeRole = getActiveRoleContent(parentRole);
    hideSharedFilterSources(activeRole);
    var panel = ensureSharedFilterPanel();
    if (!panel) return;
    if (uiState.keep_roles_filter_open) {
        refreshExistingGlobalFilterUi(parentRole, analysisType);
        return;
    }
    var body = panel.querySelector('.shared-filter-panel-body');
    if (!body) return;
    body.innerHTML = '';

    var current = analysisType || (activeRole ? (activeRole.dataset.activeAnalysis || '') : '');
    if (activeRole && activeRole.id === 'role-all') syncAllRolesSharedFilterButtons(activeRole, current);
    if (activeRole && activeRole.id === 'role-all') syncAllRolesPeriodStateFromGlobalFilter(activeRole, current);
    body.appendChild(createUnifiedRolesControl(activeRole, current));
    body.appendChild(createGlobalFilterDropdown('periods', 'Период', getGlobalFilterOptions(activeRole, 'periods', current), false));
    body.appendChild(createGlobalFilterDropdown('experiences', 'Опыт', getGlobalFilterOptions(activeRole, 'experiences', current), false));
    panel.style.display = body.children.length ? 'block' : 'none';
    renderActiveGlobalFilterChips(panel, activeRole, current);
    if (!skipActiveApply) applyGlobalFiltersToActiveAnalysis(activeRole, current);
}

function normalizeSalaryControls(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.salary-content');
    if (!block) return;
    rebuildSalaryFromVacancies(parentRole, block);
    var monthTabs = block.querySelector('.salary-month-tabs');
    if (!monthTabs) {
        updateViewToggleIcons(block);
        return;
    }
    if (monthTabs.classList.contains('all-roles-period-tabs')) {
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
        inlineToggle.innerHTML = buildViewModeButtonsHtml(['together', 'table', 'graph'], 'salary-inline-mode-btn', uiState.salary_view_mode || 'together');
        controlRow.appendChild(inlineToggle);
    }

    if (!inlineToggle.dataset.bound) {
        inlineToggle.addEventListener('click', function(e) {
            var btn = e.target.closest('.salary-inline-mode-btn');
            if (!btn) return;
            var view = btn.dataset.view || 'together';
            if (typeof syncAllViewModes === 'function') syncAllViewModes(view);
            else uiState.salary_view_mode = view;
            if (typeof persistViewModes === 'function') persistViewModes();
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

    setActiveViewButton(inlineToggle.querySelectorAll('.salary-inline-mode-btn'), uiState.salary_view_mode || 'together');
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
        '<div class="salary-table-block">' +
            '<h4 class="salary-table-title">Сводка вакансий по валютам</h4>' +
            '<div class="vacancy-table-wrap" style="margin-bottom: 16px;">' +
            '<table class="vacancy-table salary-table salary-summary-table">' +
                '<thead><tr><th>Всего вакансий</th><th>RUR</th><th>USD</th><th>EUR</th><th>Другая</th><th>—</th></tr></thead>' +
                '<tbody>' + coverageRows + '</tbody>' +
            '</table>' +
            '</div>' +
        '</div>' +
        '<div class="salary-table-block">' +
            '<h4 class="salary-table-title">Статистика зарплат</h4>' +
            '<div class="vacancy-table-wrap">' +
            '<table class="vacancy-table salary-table salary-stats-table">' +
                '<thead><tr><th>Статус</th><th>Валюта</th><th>Найдено</th><th>Средняя</th><th>Медианная</th><th>Модальная</th><th>Мин</th><th>Макс</th><th>Топ-10 навыков</th></tr></thead>' +
                '<tbody>' + statsRows + '</tbody>' +
            '</table>' +
            '</div>' +
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
                    buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.salary_view_mode || 'together') +
                '</div>' +
            '</div>';

        bindSalaryRowData(expDiv, exp.entries || []);

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
        return filterVacanciesByRecentDays(vacancies || [], days);
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
    addQuickButton('Сегодня', 'today', filterVacanciesByLatestDay(vacancies || []));

    block.dataset.salaryFiltersReady = '1';
}

function sortSalaryMonths(monthTabs) {
    if (!monthTabs) return;
    var buttons = Array.from(monthTabs.querySelectorAll('.salary-month-button'));
    if (!buttons.length) return;
    var quickOrder = { 'Сегодня': 1, 'За 3 дня': 2, 'За 7 дней': 3, 'За 14 дней': 4 };
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
            { key: 'today', label: 'Сегодня', month: 'today' },
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

    block.querySelectorAll('.skills-search-dropdown[data-filter="period"], .skills-search-dropdown[data-filter="exp"]').forEach(function(node) {
        if (node && node.parentElement) node.parentElement.removeChild(node);
    });
    ensureSkillsSearchBooleanFilters(block);

    ensureSkillsSearchFavoritesControls(block);

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
    renderSkillsSearchFavoritesDropdown(block);

    var buttonsWrap = block.querySelector('.skills-search-buttons');
    if (buttonsWrap && !buttonsWrap.dataset.ready) {
        renderSkillsSearchButtons(block, (block._data && block._data.skills) ? block._data.skills : []);
        buttonsWrap.dataset.ready = '1';
    }

    var favorite = getActiveSkillsSearchFavorite();
    if (favorite && favorite.state) {
        applySkillsSearchState(block, favorite.state);
        renderSkillsSearchFavoritesDropdown(block);
    } else {
        var saved = getSkillsSearchState(block);
        if (saved) {
            applySkillsSearchState(block, saved);
        } else {
            if (statusDropdown) {
                setSkillsSearchDropdownValue(statusDropdown, 'Открытая');
                block.dataset.status = 'Открытая';
            }
        }
    }
    if (!favorite || !favorite.state) {
        if (statusDropdown) {
            var statusValue = getSkillsSearchFilterValue(block, 'status');
            if (!statusValue || statusValue === 'all') {
                setSkillsSearchDropdownValue(statusDropdown, 'Открытая');
                block.dataset.status = 'Открытая';
            }
        }
    }
    updateSkillsSearchData(block);
}

function ensureSkillsSearchFavoritesControls(block) {
    if (!block) return;
    var header = block.querySelector('.skills-search-panel-header');
    if (!header) return;

    var saveBtn = header.querySelector('.skills-search-save-favorite');
    if (!saveBtn) {
        saveBtn = document.createElement('button');
        saveBtn.className = 'skills-search-save-favorite skills-search-icon-btn';
        saveBtn.type = 'button';
        header.appendChild(saveBtn);
    }
    saveBtn.classList.add('skills-search-icon-btn');
    saveBtn.textContent = '⤓';
    saveBtn.title = 'Сохранить набор';
    saveBtn.setAttribute('aria-label', 'Сохранить набор');

    var legacyRemoveBtn = header.querySelector('.skills-search-remove-favorite');
    if (legacyRemoveBtn && legacyRemoveBtn.parentElement) {
        legacyRemoveBtn.parentElement.removeChild(legacyRemoveBtn);
    }

    var favoriteWrap = header.querySelector('.skills-search-dropdown[data-filter="favorite"]');
    if (!favoriteWrap) {
        var favoriteWrap = document.createElement('div');
        favoriteWrap.className = 'skills-search-dropdown skills-search-favorite-inline';
        favoriteWrap.setAttribute('data-filter', 'favorite');
        favoriteWrap.innerHTML =
            '<button class="skills-search-dropdown-btn skills-search-icon-btn" type="button" data-value="" title="Избранное" aria-label="Избранное">❤</button>' +
            '<div class="skills-search-dropdown-menu"></div>';
        header.appendChild(favoriteWrap);
    }
    var favoriteBtn = favoriteWrap.querySelector('.skills-search-dropdown-btn');
    if (favoriteBtn) {
        favoriteBtn.classList.add('skills-search-icon-btn');
        favoriteBtn.textContent = '❤';
        favoriteBtn.title = favoriteBtn.title || 'Избранное';
        favoriteBtn.setAttribute('aria-label', 'Избранное');
    }

    var toggleBtn = header.querySelector('.skills-search-toggle');
    if (toggleBtn) {
        header.insertBefore(favoriteWrap, toggleBtn);
        header.insertBefore(saveBtn, favoriteWrap);
    } else {
        header.appendChild(saveBtn);
        header.appendChild(favoriteWrap);
    }
}
function setSkillsSearchFavoriteTrigger(dropdown, favoriteName, favoriteId) {
    if (!dropdown) return;
    var btn = dropdown.querySelector('.skills-search-dropdown-btn');
    if (!btn) return;
    btn.classList.add('skills-search-icon-btn');
    btn.dataset.value = favoriteId || 'all';
    btn.textContent = '❤';
    var title = favoriteName ? ('Избранное: ' + favoriteName) : 'Избранное';
    btn.title = title;
    btn.setAttribute('aria-label', title);
}
function promptSkillsSearchFavoriteName(defaultName) {
    return new Promise(function(resolve) {
        var existing = document.querySelector('.skills-favorite-modal-backdrop');
        if (existing && existing.parentElement) existing.parentElement.removeChild(existing);

        var backdrop = document.createElement('div');
        backdrop.className = 'skills-favorite-modal-backdrop';
        backdrop.innerHTML =
            '<div class="skills-favorite-modal" role="dialog" aria-modal="true" aria-label="Название набора">' +
                '<div class="skills-favorite-modal-title">Название набора</div>' +
                '<input type="text" class="skills-favorite-modal-input" maxlength="80" placeholder="Введите название">' +
                '<div class="skills-favorite-modal-actions">' +
                    '<button type="button" class="skills-favorite-modal-btn cancel">Отмена</button>' +
                    '<button type="button" class="skills-favorite-modal-btn submit">Сохранить</button>' +
                '</div>' +
            '</div>';

        var settled = false;
        var finish = function(value) {
            if (settled) return;
            settled = true;
            if (backdrop && backdrop.parentElement) backdrop.parentElement.removeChild(backdrop);
            document.removeEventListener('keydown', onKeydown, true);
            resolve(value);
        };
        var onKeydown = function(ev) {
            if (ev.key === 'Escape') {
                ev.preventDefault();
                finish(null);
            } else if (ev.key === 'Enter') {
                ev.preventDefault();
                var submitBtn = backdrop.querySelector('.skills-favorite-modal-btn.submit');
                if (submitBtn) submitBtn.click();
            }
        };

        document.body.appendChild(backdrop);
        var input = backdrop.querySelector('.skills-favorite-modal-input');
        var cancelBtn = backdrop.querySelector('.skills-favorite-modal-btn.cancel');
        var submitBtn = backdrop.querySelector('.skills-favorite-modal-btn.submit');
        if (input) {
            input.value = String(defaultName || '');
            input.focus();
            input.select();
        }
        if (cancelBtn) cancelBtn.addEventListener('click', function() { finish(null); });
        if (submitBtn) submitBtn.addEventListener('click', function() {
            var value = input ? String(input.value || '').trim() : '';
            if (!value) {
                if (input) input.focus();
                return;
            }
            finish(value);
        });
        backdrop.addEventListener('click', function(ev) {
            if (ev.target === backdrop) finish(null);
        });
        document.addEventListener('keydown', onKeydown, true);
    });
}
function confirmSkillsSearchFavoriteDelete() {
    return new Promise(function(resolve) {
        var existing = document.querySelector('.skills-favorite-modal-backdrop');
        if (existing && existing.parentElement) existing.parentElement.removeChild(existing);

        var backdrop = document.createElement('div');
        backdrop.className = 'skills-favorite-modal-backdrop';
        backdrop.innerHTML =
            '<div class="skills-favorite-modal" role="dialog" aria-modal="true" aria-label="Удаление набора">' +
                '<div class="skills-favorite-modal-title">Удалить набор фильтров?</div>' +
                '<div class="skills-favorite-modal-actions">' +
                    '<button type="button" class="skills-favorite-modal-btn cancel">Отмена</button>' +
                    '<button type="button" class="skills-favorite-modal-btn danger submit">Удалить</button>' +
                '</div>' +
            '</div>';

        var settled = false;
        var finish = function(value) {
            if (settled) return;
            settled = true;
            if (backdrop && backdrop.parentElement) backdrop.parentElement.removeChild(backdrop);
            document.removeEventListener('keydown', onKeydown, true);
            resolve(!!value);
        };
        var onKeydown = function(ev) {
            if (ev.key === 'Escape') {
                ev.preventDefault();
                finish(false);
            } else if (ev.key === 'Enter') {
                ev.preventDefault();
                finish(true);
            }
        };

        document.body.appendChild(backdrop);
        var cancelBtn = backdrop.querySelector('.skills-favorite-modal-btn.cancel');
        var submitBtn = backdrop.querySelector('.skills-favorite-modal-btn.submit');
        if (cancelBtn) cancelBtn.addEventListener('click', function() { finish(false); });
        if (submitBtn) {
            submitBtn.focus();
            submitBtn.addEventListener('click', function() { finish(true); });
        }
        backdrop.addEventListener('click', function(ev) {
            if (ev.target === backdrop) finish(false);
        });
        document.addEventListener('keydown', onKeydown, true);
    });
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

function getSkillsSearchBooleanFilterDefs() {
    return [
        { key: 'accreditation', label: getEmployerFactorLabel('accreditation') },
        { key: 'cover_letter_required', label: getEmployerFactorLabel('cover_letter_required') },
        { key: 'has_test', label: getEmployerFactorLabel('has_test') }
    ];
}

function ensureSkillsSearchBooleanFilters(block) {
    if (!block) return;
    var header = block.querySelector('.skills-search-panel-header');
    if (!header) return;

    var wrap = header.querySelector('.skills-search-bool-filters');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'skills-search-bool-filters';
        var clearBtn = header.querySelector('.skills-search-clear');
        if (clearBtn) header.insertBefore(wrap, clearBtn);
        else header.appendChild(wrap);
    }

    if (!wrap.dataset.ready) {
        var defs = getSkillsSearchBooleanFilterDefs();
        wrap.innerHTML =
            '<span class="skills-search-bool-title">Опции:</span>' +
            defs.map(function(item) {
                return '<label class="skills-search-bool-option">' +
                    '<input class="skills-search-bool-checkbox" type="checkbox" data-factor="' + escapeHtml(item.key) + '">' +
                    '<span>' + escapeHtml(item.label) + '</span>' +
                '</label>';
            }).join('');
        wrap.dataset.ready = '1';
    }

    if (!wrap.dataset.bound) {
        wrap.addEventListener('change', function(e) {
            var checkbox = e.target && e.target.closest ? e.target.closest('.skills-search-bool-checkbox') : null;
            if (!checkbox) return;
            updateSkillsSearchData(block);
        });
        wrap.dataset.bound = '1';
    }
}

function getSkillsSearchBooleanFilterValues(block) {
    if (!block) return [];
    return Array.from(block.querySelectorAll('.skills-search-bool-checkbox:checked'))
        .map(function(input) { return (input.dataset.factor || '').trim(); })
        .filter(Boolean);
}

function setSkillsSearchBooleanFilterValues(block, values) {
    if (!block) return;
    var selected = new Set((values || []).map(function(value) {
        return String(value || '').trim();
    }).filter(Boolean));
    block.querySelectorAll('.skills-search-bool-checkbox').forEach(function(input) {
        input.checked = selected.has((input.dataset.factor || '').trim());
    });
}

function getSkillsSearchVacancyBooleanValue(vacancy, factorKey) {
    if (!vacancy) return false;
    var rawValue = null;
    if (factorKey === 'accreditation') rawValue = vacancy.employer_accredited;
    else if (factorKey === 'cover_letter_required') rawValue = vacancy.response_letter_required !== undefined ? vacancy.response_letter_required : vacancy.cover_letter_required;
    else if (factorKey === 'has_test') rawValue = vacancy.has_test;

    if (typeof rawValue === 'boolean') return rawValue;
    if (typeof rawValue === 'number') return rawValue > 0;
    var text = String(rawValue || '').trim().toLowerCase();
    return text === 'true' || text === '1' || text === 'да' || text === 'yes';
}

function updateSkillsSearchData(block) {
    if (!block || !block._data) return;
    var parentRole = block.closest('.role-content');
    var globalPeriodOptions = getGlobalFilterOptions(parentRole, 'periods', 'skills-search');
    var globalExpOptions = getGlobalFilterOptions(parentRole, 'experiences', 'skills-search');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', globalPeriodOptions);
    var selectedExps = getResolvedGlobalFilterValues('experiences', globalExpOptions);
    var baseVacancies = (block._data.vacancies || []).slice();
    if (selectedPeriods.length) {
        baseVacancies = filterVacanciesBySelectedPeriods(baseVacancies, selectedPeriods);
    }
    baseVacancies = dedupeVacanciesById(baseVacancies);

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
    var selectedBooleanFactors = getSkillsSearchBooleanFilterValues(block);

    var filteredBase = baseVacancies.filter(v => {
        if (!v) return false;
        var vExpGlobal = normalizeExperience(v._experience || v.experience || '');
        var allowedGlobal = selectedExps.map(function(x) { return normalizeExperience(x); }).filter(Boolean);
        if (allowedGlobal.length && allowedGlobal.indexOf(vExpGlobal) < 0) return false;
        if (globalExpOptions.length && selectedExps.length && allowedGlobal.length === 0) {
            return false;
        }
        if (selectedBooleanFactors.length) {
            for (var i = 0; i < selectedBooleanFactors.length; i += 1) {
                if (!getSkillsSearchVacancyBooleanValue(v, selectedBooleanFactors[i])) return false;
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
                '<span class="skills-search-summary-remove" aria-hidden="true">&times;</span>' +
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
var SKILLS_SEARCH_FAVORITES_STORAGE_KEY = 'research_vacancies_skills_search_favorites_v1';
function ensureSkillsSearchFavoritesState() {
    if (uiState.skills_search_favorites && Array.isArray(uiState.skills_search_favorites.items)) return uiState.skills_search_favorites;
    var fallback = { activeId: '', items: [] };
    if (typeof window === 'undefined' || !window.localStorage) {
        uiState.skills_search_favorites = fallback;
        return uiState.skills_search_favorites;
    }
    try {
        var raw = window.localStorage.getItem(SKILLS_SEARCH_FAVORITES_STORAGE_KEY);
        if (!raw) {
            uiState.skills_search_favorites = fallback;
            return uiState.skills_search_favorites;
        }
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            uiState.skills_search_favorites = fallback;
            return uiState.skills_search_favorites;
        }
        var items = Array.isArray(parsed.items) ? parsed.items.filter(function(item) {
            return item && item.id && item.name && item.state && typeof item.state === 'object';
        }).map(function(item) {
            return { id: String(item.id), name: String(item.name), state: item.state };
        }) : [];
        uiState.skills_search_favorites = {
            activeId: String(parsed.activeId || ''),
            items: items
        };
    } catch (_e) {
        uiState.skills_search_favorites = fallback;
    }
    return uiState.skills_search_favorites;
}
function persistSkillsSearchFavoritesState() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    var state = ensureSkillsSearchFavoritesState();
    try {
        window.localStorage.setItem(SKILLS_SEARCH_FAVORITES_STORAGE_KEY, JSON.stringify({
            activeId: state.activeId || '',
            items: Array.isArray(state.items) ? state.items : []
        }));
    } catch (_e) {
        // ignore storage failures
    }
}
function getSkillsSearchStateSnapshot(block) {
    var currencyVals = [];
    var currencyDd = block.querySelector('.skills-search-dropdown[data-filter="currency"]');
    if (currencyDd && currencyDd.dataset.multi === '1') {
        try {
            currencyVals = JSON.parse(currencyDd.dataset.values || '[]');
        } catch (_e) {
            currencyVals = [];
        }
    }
    return {
        status: getSkillsSearchFilterValue(block, 'status') || 'all',
        country: getSkillsSearchFilterValue(block, 'country') || 'all',
        currency: (currencyVals && currencyVals.length) ? currencyVals : 'all',
        sort: getSkillsSearchFilterValue(block, 'sort') || 'count',
        logic: getSkillsSearchFilterValue(block, 'logic') || 'or',
        employerFlags: getSkillsSearchBooleanFilterValues(block),
        includeSkills: Array.from(block.querySelectorAll('.skills-search-skill.active')).map(function(b) { return b.dataset.skill || b.textContent.trim(); }),
        excludeSkills: Array.from(block.querySelectorAll('.skills-search-skill.excluded')).map(function(b) { return b.dataset.skill || b.textContent.trim(); }),
        collapsed: block.querySelector('.skills-search-panel') ? block.querySelector('.skills-search-panel').classList.contains('collapsed') : false
    };
}
function renderSkillsSearchFavoritesDropdown(block) {
    if (!block) return;
    var favoritesDd = block.querySelector('.skills-search-dropdown[data-filter="favorite"]');
    if (!favoritesDd) return;
    var state = ensureSkillsSearchFavoritesState();
    var items = (state.items || []).map(function(item) {
        return { value: item.id, label: item.name };
    });
    renderSkillsSearchDropdown(favoritesDd, items, 'Избранное', 'Не выбрано', false, true);
    var menu = favoritesDd.querySelector('.skills-search-dropdown-menu');
    if (menu) {
        var favRows = (state.items || []).map(function(item) {
            return '<button class="skills-search-dropdown-item skills-search-favorite-item" type="button" data-value="' + escapeHtml(item.id) + '">' +
                '<span class="skills-search-favorite-name">' + escapeHtml(item.name) + '</span>' +
                '<span class="skills-search-favorite-remove" data-remove-favorite="' + escapeHtml(item.id) + '" title="Удалить набор" aria-label="Удалить набор">&times;</span>' +
            '</button>';
        }).join('');
        menu.innerHTML =
            '<button class="skills-search-dropdown-item" type="button" data-value="all">Не выбрано</button>' +
            favRows;
    }
    if (state.activeId && items.some(function(item) { return item.value === state.activeId; })) {
        setSkillsSearchDropdownValue(favoritesDd, state.activeId);
        var activeItem = items.find(function(item) { return item.value === state.activeId; });
        setSkillsSearchFavoriteTrigger(favoritesDd, activeItem ? activeItem.label : '', state.activeId);
    } else {
        setSkillsSearchDropdownValue(favoritesDd, 'all');
        setSkillsSearchFavoriteTrigger(favoritesDd, '', 'all');
    }
}
function getActiveSkillsSearchFavorite() {
    var state = ensureSkillsSearchFavoritesState();
    var activeId = String(state.activeId || '');
    if (!activeId) return null;
    return (state.items || []).find(function(item) { return item.id === activeId; }) || null;
}
function applySkillsSearchFavorite(block, favoriteId) {
    if (!block) return false;
    var state = ensureSkillsSearchFavoritesState();
    var favorite = (state.items || []).find(function(item) { return item.id === favoriteId; });
    if (!favorite) return false;
    applySkillsSearchState(block, favorite.state || {});
    state.activeId = favorite.id;
    persistSkillsSearchFavoritesState();
    renderSkillsSearchFavoritesDropdown(block);
    updateSkillsSearchData(block);
    return true;
}
function saveCurrentSkillsSearchFavorite(block, name) {
    if (!block) return false;
    var trimmed = String(name || '').trim();
    if (!trimmed) return false;
    var state = ensureSkillsSearchFavoritesState();
    var snapshot = getSkillsSearchStateSnapshot(block);
    var existing = (state.items || []).find(function(item) { return item.name.toLowerCase() === trimmed.toLowerCase(); });
    if (existing) {
        existing.state = snapshot;
        state.activeId = existing.id;
    } else {
        var nextId = 'fav_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        state.items = state.items || [];
        state.items.push({ id: nextId, name: trimmed, state: snapshot });
        state.activeId = nextId;
    }
    persistSkillsSearchFavoritesState();
    renderSkillsSearchFavoritesDropdown(block);
    return true;
}
function removeCurrentSkillsSearchFavorite(block, favoriteId) {
    if (!block) return false;
    var favoritesDd = block.querySelector('.skills-search-dropdown[data-filter="favorite"]');
    var selectedId = favoriteId ? String(favoriteId) : (favoritesDd ? String(getSkillsSearchFilterValue(block, 'favorite') || '') : '');
    if (!selectedId || selectedId === 'all') return false;
    var state = ensureSkillsSearchFavoritesState();
    var before = (state.items || []).length;
    state.items = (state.items || []).filter(function(item) { return item.id !== selectedId; });
    if (state.activeId === selectedId) state.activeId = '';
    if (state.items.length === before) return false;
    persistSkillsSearchFavoritesState();
    renderSkillsSearchFavoritesDropdown(block);
    return true;
}
function saveSkillsSearchState(block) {
    uiState.skills_search_global = getSkillsSearchStateSnapshot(block);
}
function applySkillsSearchState(block, state) {
    if (!state) return;
    var statusDd = block.querySelector('.skills-search-dropdown[data-filter="status"]');
    var countryDd = block.querySelector('.skills-search-dropdown[data-filter="country"]');
    var currencyDd = block.querySelector('.skills-search-dropdown[data-filter="currency"]');
    var sortDd = block.querySelector('.skills-search-dropdown[data-filter="sort"]');
    var logicDd = block.querySelector('.skills-search-dropdown[data-filter="logic"]');

    if (statusDd) setSkillsSearchDropdownValue(statusDd, state.status || '\u041e\u0442\u043a\u0440\u044b\u0442\u0430\u044f');
    if (countryDd) setSkillsSearchDropdownValue(countryDd, state.country || 'all');
    if (currencyDd) {
        if (Array.isArray(state.currency)) setSkillsSearchDropdownMulti(currencyDd, state.currency);
        else setSkillsSearchDropdownValue(currencyDd, state.currency || 'all');
    }
    if (sortDd) setSkillsSearchDropdownValue(sortDd, state.sort || 'count');
    if (logicDd) setSkillsSearchDropdownValue(logicDd, state.logic || 'or');
    setSkillsSearchBooleanFilterValues(block, state.employerFlags || []);

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
            buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.activity_view_mode || 'together') +
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
    var totalWeight = rows.reduce(function(sum, e) { return sum + (e.total || 0); }, 0);
    if (totalWeight) {
        totalEntry.avg_age = rows.reduce(function(sum, e) { return sum + ((e.avg_age || 0) * (e.total || 0)); }, 0) / totalWeight;
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
    var totalWeight = rows.reduce(function(sum, e) { return sum + (e.total || 0); }, 0);
    if (totalWeight) {
        totalEntry.avg_age = rows.reduce(function(sum, e) { return sum + ((e.avg_age || 0) * (e.total || 0)); }, 0) / totalWeight;
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
        return filterVacanciesByRecentDays(vacancies || [], days);
    }

    var entriesToday = computeActivityEntriesFromVacancies(filterVacanciesByLatestDay(vacancies || []));
    var entries3 = computeActivityEntriesFromVacancies(filterVacanciesByDays(3));
    var entries7 = computeActivityEntriesFromVacancies(filterVacanciesByDays(7));
    var entries14 = computeActivityEntriesFromVacancies(filterVacanciesByDays(14));
    addFilter('Сегодня', monthByLabel['Сегодня'], 'today', entriesToday);
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
    if (monthTabs.classList.contains('all-roles-period-tabs')) {
        updateViewToggleIcons(parentRole);
        return;
    }

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
        inlineToggle.innerHTML = buildViewModeButtonsHtml(['together', 'table', 'graph'], 'activity-inline-mode-btn', uiState.activity_view_mode || 'together');
        controlRow.appendChild(inlineToggle);
    }
    inlineToggle.classList.add('skills-mode-toggle-inline');
    if (!inlineToggle.dataset.bound) {
        inlineToggle.addEventListener('click', function(e) {
            var btn = e.target.closest('.activity-inline-mode-btn');
            if (!btn) return;
            var view = btn.dataset.view || 'together';
            if (typeof syncAllViewModes === 'function') syncAllViewModes(view);
            else uiState.activity_view_mode = view;
            if (typeof persistViewModes === 'function') persistViewModes();
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
            var visibleMonthLabel = (visibleMonth._data && visibleMonth._data.month) ? visibleMonth._data.month : (visibleMonth.dataset.month || '');
            buildActivityBarChart(graphId, entries);
            applyChartTitleContext(graphId, 'Количество вакансий по опыту', buildChartContextLabel(visibleMonthLabel, null));
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

    var quickOrder = { 'Сегодня': 1, 'За 3 дня': 2, 'За 7 дней': 3, 'За 14 дней': 4 };
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
    if (parentRole.id === 'role-all') {
        parentRole.querySelectorAll(
            '.weekday-content, .all-roles-period-content[data-analysis="weekday-all"]'
        ).forEach(function(section) {
            updateViewToggleIcons(section);
        });
        var allRolesCells = parentRole.querySelectorAll(
            '.weekday-content td, .all-roles-period-content[data-analysis="weekday-all"] td'
        );
        allRolesCells.forEach(function(cell) {
            if ((cell.textContent || '').trim() === 'None') {
                cell.textContent = 'нет архивных';
            }
        });
        return;
    }
    var sections = parentRole.querySelectorAll(
        '.weekday-content'
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
        '.weekday-content td'
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
    if (monthTabs.classList.contains('all-roles-period-tabs')) {
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
            multiToggle.innerHTML = '<input type="checkbox" class="skills-multi-toggle-input"><span class="skills-multi-toggle-label">Мультивыбор</span>';
            expTabs.appendChild(multiToggle);
        } else if (multiToggle.parentElement !== expTabs) {
            expTabs.appendChild(multiToggle);
        }
        if (!multiToggle.querySelector('.skills-multi-toggle-label')) {
            multiToggle.innerHTML = '<input type="checkbox" class="skills-multi-toggle-input"><span class="skills-multi-toggle-label">Мультивыбор</span>';
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
        inlineToggle.innerHTML = buildViewModeButtonsHtml(['together', 'table', 'graph'], 'skills-inline-mode-btn', uiState.skills_monthly_view_mode || 'together');
        controlRow.appendChild(inlineToggle);
    }

    if (!inlineToggle.dataset.bound) {
        inlineToggle.addEventListener('click', function(e) {
            var btn = e.target.closest('.skills-inline-mode-btn');
            if (!btn) return;
            var view = btn.dataset.view || 'together';
            if (typeof syncAllViewModes === 'function') syncAllViewModes(view);
            else uiState.skills_monthly_view_mode = view;
            if (typeof persistViewModes === 'function') persistViewModes();
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
                var visibleMonthData = (visibleMonth._data && visibleMonth._data.month) ? visibleMonth._data.month : parseJsonDataset(visibleMonth, 'month', {});
                var visibleMonthLabel = visibleMonthData && visibleMonthData.month ? visibleMonthData.month : '';
                buildHorizontalBarChart(graphId, expData.skills, expData.experience);
                applyChartTitleContext(graphId, 'Топ-30 навыков', buildChartContextLabel(visibleMonthLabel, expData.experience));
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
    skills = skills.slice(0, 30).map(function(s, i) { s.rank = i + 1; return s; });
    return { experience: label || 'По выбранному периоду', total_vacancies: totalVac, skills: skills };
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
        return filterVacanciesByRecentDays(vacancies || [], days);
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
            skills = skills.slice(0, 30).map(function(s, i) { s.rank = i + 1; return s; });
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
                    buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.skills_monthly_view_mode || 'together') +
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
    addQuickButton('Сегодня', 'today', filterVacanciesByLatestDay(vacancies || []));

    block.dataset.skillsFiltersReady = '1';
}

function sortSkillsMonthlyMonths(monthTabs) {
    if (!monthTabs) return;
    var buttons = Array.from(monthTabs.querySelectorAll('.monthly-skills-month-button'));
    if (!buttons.length) return;
    var quickOrder = { 'Сегодня': 1, 'За 3 дня': 2, 'За 7 дней': 3, 'За 14 дней': 4 };
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
    if (month === 'global') {
        renderGlobalEmployerFiltered(block.closest('.role-content'));
        return;
    }
    if (block.dataset.employerActiveMonth === month) return;
    var parentRole = block.closest('.role-content');
    var baseVacancies = filterVacanciesBySelectedExperiences(
        dedupeVacanciesById((parentRole ? getRoleVacancies(parentRole) : []) || []),
        getResolvedAnalysisExperienceValues(parentRole, 'employer-analysis')
    );
    var periodLabel = block.dataset.employerAllLabel || '';
    var rows = [];
    var explicitLabel = '';
    if (month === 'all') {
        rows = buildEmployerAnalysisRowsFromVacancies(baseVacancies, 'all');
        explicitLabel = periodLabel;
    } else if (block.__employerRowsByPeriod && block.__employerRowsByPeriod[month]) {
        var periodKey = String(month || '').trim();
        var daysMatch = periodKey.match(/^last_(\d+)$/);
        if (periodKey === 'today') rows = buildEmployerAnalysisRowsFromVacancies(filterVacanciesByLatestDay(baseVacancies), month);
        else rows = buildEmployerAnalysisRowsFromVacancies(filterVacanciesByRecentDays(baseVacancies, daysMatch ? Number(daysMatch[1]) : 0), month);
        explicitLabel = (block.__employerLabelsByPeriod && block.__employerLabelsByPeriod[month]) || '';
    } else {
        rows = buildEmployerAnalysisRowsFromVacancies(filterVacanciesBySelectedPeriods(baseVacancies, [month]), month);
        explicitLabel = month;
    }
    block.dataset.chartContext = buildChartContextLabel(
        normalizeUnifiedPeriodLabel(explicitLabel || month),
        getResolvedAnalysisExperienceLabel(block.closest('.role-content'), 'employer-analysis')
    );
    renderEmployerAnalysisTable(block, rows, explicitLabel || null);
    var chips = block.querySelectorAll('.employer-period-chip');
    chips.forEach(function(chip) {
        var isActive = (chip.dataset.month || '') === month;
        chip.classList.toggle('active', isActive);
    });
    block.dataset.employerActiveMonth = month;
    renderEmployerAnalysisChart(block);
    syncSharedFilterPanel(block.closest('.role-content'), 'employer-analysis');
}

function applyEmployerAnalysisViewMode(block, mode) {
    if (!block) return;
    mode = normalizeResponsiveViewMode(mode || uiState.employer_analysis_view_mode || 'together');
    var table = block.querySelector('.employer-analysis-table-container') || block.querySelector('.table-container');
    var graph = block.querySelector('.employer-analysis-graph');
    var layoutRoot = block.querySelector('.employer-analysis-main') || block.querySelector('.employer-analysis-view');
    if (!table || !graph) return;

    if (typeof syncAllViewModes === 'function') syncAllViewModes(mode);
    else uiState.employer_analysis_view_mode = mode;
    block.dataset.employerViewMode = mode;
    if (typeof persistViewModes === 'function') persistViewModes();
    var btns = block.querySelectorAll('.employer-view-btn');
    btns.forEach(function(btn) {
        btn.classList.toggle('active', (btn.dataset.view || '') === mode);
    });

    if (layoutRoot) {
        applyCompositeViewMode(layoutRoot, table, graph, mode, {
            layoutWidth: UNIFIED_ANALYSIS_LAYOUT_WIDTH,
            tableOnlyWidth: UNIFIED_ANALYSIS_SINGLE_WIDTH,
            splitTableWidth: UNIFIED_ANALYSIS_TABLE_WIDTH,
            splitGraphWidth: UNIFIED_ANALYSIS_GRAPH_WIDTH,
            splitMinWidth: UNIFIED_ANALYSIS_SPLIT_MIN_WIDTH
        });
    }

    if (mode !== 'table') {
        renderEmployerAnalysisChart(block);
    }
}

function renderEmployerAnalysisChart(block) {
    if (!block || typeof Plotly === 'undefined') return;
    var graph = block.querySelector('.employer-analysis-graph');
    if (!graph) return;
    var chartContext = block.dataset.chartContext || '';
    var mode = block.dataset.employerViewMode || uiState.employer_analysis_view_mode || 'together';
    if (mode === 'table') return;

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
        graph.dataset.plotSignature = '';
        graph.dataset.plotReady = '';
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
    var signature = chartContext + '|' + categories.map(function(c, idx) {
        return [
            c.key,
            avgRur[idx] == null ? '' : avgRur[idx],
            avgUsd[idx] == null ? '' : avgUsd[idx],
            avgEur[idx] == null ? '' : avgEur[idx],
            avgOther[idx] == null ? '' : avgOther[idx]
        ].join(':');
    }).join('|');

    var palette = (typeof CHART_COLORS !== 'undefined')
        ? CHART_COLORS
        : { light: '#B0BEC5', medium: '#90A4AE', dark: '#607D8B' };
    var colorByCategory = categories.map(function(c) {
        if (c.key.indexOf('_true') !== -1) return palette.light;
        if (c.key.indexOf('_false') !== -1) return palette.dark;
        return palette.medium;
    });

    graph.style.width = '100%';
    graph.style.maxWidth = '100%';
    graph.style.minWidth = '0';
    graph.style.margin = '0 auto';
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
    if (graph.dataset.plotSignature === signature && graph.dataset.plotReady === '1') return;

    function renderEmployerSubplot(target, data, layout) {
        if (!target) return;
        var plotHeight = Number(layout && layout.height) || 0;
        var parts = extractLayoutTitleParts(layout);
        var titleText = parts.base;
        var subtitleText = resolveUnifiedChartContext(target, parts.context);
        var header = target.querySelector('.employer-analysis-subgraph-heading');
        var titleEl = target.querySelector('.employer-analysis-subgraph-title');
        var subtitleEl = target.querySelector('.employer-analysis-subgraph-subtitle');
        var plotHost = target.querySelector('.employer-analysis-subgraph-host');
        if (!header || !titleEl || !subtitleEl || !plotHost) {
            target.innerHTML =
                '<div class="employer-analysis-subgraph-heading">' +
                    '<div class="unified-chart-title employer-analysis-subgraph-title"></div>' +
                    '<div class="unified-chart-subtitle employer-analysis-subgraph-subtitle"></div>' +
                '</div>' +
                '<div class="employer-analysis-subgraph-host"></div>';
            header = target.querySelector('.employer-analysis-subgraph-heading');
            titleEl = target.querySelector('.employer-analysis-subgraph-title');
            subtitleEl = target.querySelector('.employer-analysis-subgraph-subtitle');
            plotHost = target.querySelector('.employer-analysis-subgraph-host');
        }
        if (header && titleEl && subtitleEl) {
            header.style.display = (titleText || subtitleText) ? 'block' : 'none';
            titleEl.textContent = titleText || '';
            subtitleEl.textContent = subtitleText || '';
            subtitleEl.style.display = subtitleText ? 'block' : 'none';
        }
        target.style.width = '100%';
        target.style.maxWidth = '100%';
        target.style.minWidth = '0';
        target.style.display = 'flex';
        target.style.flexDirection = 'column';
        target.style.alignItems = 'stretch';
        target.style.height = 'auto';
        target.style.minHeight = '0';
        target.style.flex = '0 0 auto';
        target.style.position = 'relative';
        target.style.overflow = 'visible';
        if (plotHost) {
            plotHost.className = 'employer-analysis-subgraph-host';
            plotHost.style.height = plotHeight + 'px';
            plotHost.style.minHeight = plotHeight + 'px';
            plotHost.style.flex = '0 0 auto';
        }
        if (layout) {
            if (typeof layout.title === 'string') layout.title = '';
            else if (layout.title && typeof layout.title === 'object') layout.title.text = '';
        }
        if (plotHost && plotHost.dataset.plotReady === '1' && typeof Plotly.react === 'function') {
            Plotly.react(plotHost, data, layout, { responsive: true, displayModeBar: false });
        } else {
            Plotly.newPlot(plotHost || target, data, layout, { responsive: true, displayModeBar: false });
        }
        target.dataset.plotReady = '1';
        if (plotHost) plotHost.dataset.plotReady = '1';
        resizePlotlyScope(plotHost || target);
    }

    renderEmployerSubplot(graph.__avgRurChartEl, [{
        type: 'bar',
        name: 'Средняя (RUR)',
        x: avgRur,
        y: labels,
        orientation: 'h',
        marker: { color: colorByCategory, line: { width: 0 } }
    }], {
        title: { text: composeChartTitle('Средняя зарплата по параметрам (RUR)', chartContext), x: 0.5, xanchor: 'center' },
        xaxis: { title: 'Зарплата, RUR', automargin: true },
        yaxis: { title: '', automargin: true, autorange: 'reversed' },
        margin: { t: 56, r: 16, b: 40, l: 160 },
        height: 420
    });

    renderEmployerSubplot(graph.__avgUsdChartEl, [{
        type: 'bar',
        name: 'Средняя (USD)',
        x: avgUsd,
        y: labels,
        orientation: 'h',
        marker: { color: colorByCategory, line: { width: 0 } }
    }], {
        title: { text: composeChartTitle('Средняя зарплата по параметрам (USD)', chartContext), x: 0.5, xanchor: 'center' },
        xaxis: { title: 'Зарплата, USD', automargin: true },
        yaxis: { title: '', automargin: true, autorange: 'reversed' },
        margin: { t: 56, r: 16, b: 40, l: 160 },
        height: 420
    });

    renderEmployerSubplot(graph.__avgEurChartEl, [{
        type: 'bar',
        name: 'Средняя (EUR)',
        x: avgEur,
        y: labels,
        orientation: 'h',
        marker: { color: colorByCategory, line: { width: 0 } }
    }], {
        title: { text: composeChartTitle('Средняя зарплата по параметрам (EUR)', chartContext), x: 0.5, xanchor: 'center' },
        xaxis: { title: 'Зарплата, EUR', automargin: true },
        yaxis: { title: '', automargin: true, autorange: 'reversed' },
        margin: { t: 56, r: 16, b: 40, l: 160 },
        height: 420
    });

    renderEmployerSubplot(graph.__avgOtherChartEl, [{
        type: 'bar',
        name: 'Средняя (Другая валюта)',
        x: avgOther,
        y: labels,
        orientation: 'h',
        marker: { color: colorByCategory, line: { width: 0 } }
    }], {
        title: { text: composeChartTitle('Средняя зарплата по параметрам (Другая валюта)', chartContext), x: 0.5, xanchor: 'center' },
        xaxis: { title: 'Зарплата, Другая валюта', automargin: true },
        yaxis: { title: '', automargin: true, autorange: 'reversed' },
        margin: { t: 56, r: 16, b: 40, l: 160 },
        height: 420
    });
    ensureStackedChartSwitch(graph, [
        { key: 'rur', label: 'RUR', el: graph.__avgRurChartEl || null },
        { key: 'usd', label: 'USD', el: graph.__avgUsdChartEl || null },
        { key: 'eur', label: 'EUR', el: graph.__avgEurChartEl || null },
        { key: 'other', label: 'Другая валюта', el: graph.__avgOtherChartEl || null }
    ]);
    graph.dataset.plotSignature = signature;
    graph.dataset.plotReady = '1';
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
    if (valueKey === 'unknown') return 'нет рейтинга';
    if (valueKey === 'true' || valueKey === 'false') return valueKey;
    return valueKey;
}

function getEmployerValueHtml(valueKey) {
    if (valueKey === 'true') return '<span class="bool-check bool-true" aria-label="Да"></span>';
    if (valueKey === 'false') return '<span class="bool-check bool-false" aria-label="Нет"></span>';
    if (valueKey === 'unknown') return 'нет рейтинга';
    return valueKey;
}

function filterVacanciesByRecentDays(vacancies, days) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var totalDays = Number(days) || 0;
    if (!totalDays || totalDays < 1) return list;
    var maxDate = null;
    list.forEach(function(vacancy) {
        var published = parsePublishedAtDate(vacancy && vacancy.published_at);
        if (!published) return;
        if (!maxDate || published > maxDate) maxDate = published;
    });
    if (!maxDate) return [];
    var cutoff = new Date(maxDate.getTime() - totalDays * 24 * 60 * 60 * 1000);
    return list.filter(function(vacancy) {
        var published = parsePublishedAtDate(vacancy && vacancy.published_at);
        return published && published >= cutoff;
    });
}

function getEmployerRatingBucketFromVacancy(vacancy) {
    if (!vacancy) return 'unknown';
    var raw = vacancy.employer_rating;
    if (raw === null || raw === undefined || raw === '') raw = vacancy.rating;
    if (raw === null || raw === undefined || raw === '') raw = vacancy.employer_reviews_rating;
    if (raw === null || raw === undefined || raw === '') raw = vacancy.reviews_rating;
    if (raw === null || raw === undefined || raw === '') return 'unknown';
    var rating = Number(String(raw).replace(',', '.'));
    if (!isFinite(rating)) return 'unknown';
    if (rating < 3.5) return '<3.5';
    if (rating < 4.0) return '3.5-3.99';
    if (rating < 4.5) return '4.0-4.49';
    return '>=4.5';
}

function buildEmployerAnalysisRowsFromVacancies(vacancies, periodKey) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var buckets = {};

    function ensureBucket(factorKey, valueKey) {
        var key = factorKey + '||' + valueKey;
        if (!buckets[key]) {
            buckets[key] = {
                month: periodKey || 'all',
                factorKey: factorKey,
                factorLabel: getEmployerFactorLabel(factorKey),
                valueKey: valueKey,
                valueLabel: getEmployerValueLabel(factorKey, valueKey),
                groupN: 0,
                avgRurN: 0,
                avgRurSum: 0,
                avgUsdN: 0,
                avgUsdSum: 0,
                avgEurN: 0,
                avgEurSum: 0,
                avgOtherN: 0,
                avgOtherSum: 0
            };
        }
        return buckets[key];
    }

    function appendSalary(bucket, vacancy) {
        var currency = String(vacancy && (vacancy.salary_currency || vacancy.currency) || '').trim().toUpperCase();
        var salary = null;
        if (currency === 'RUR') {
            salary = computeSalaryValue(vacancy, 'RUR');
            if (salary !== null && isFinite(salary)) {
                bucket.avgRurSum += salary;
                bucket.avgRurN += 1;
            }
            return;
        }
        if (currency === 'USD') {
            salary = computeSalaryValue(vacancy, 'USD');
            if (salary !== null && isFinite(salary)) {
                bucket.avgUsdSum += salary;
                bucket.avgUsdN += 1;
            }
            return;
        }
        if (currency === 'EUR') {
            salary = computeSalaryValue(vacancy, 'EUR');
            if (salary !== null && isFinite(salary)) {
                bucket.avgEurSum += salary;
                bucket.avgEurN += 1;
            }
            return;
        }
        if (!currency) return;
        salary = computeSalaryValue(vacancy, 'Другая');
        if (salary !== null && isFinite(salary)) {
            bucket.avgOtherSum += salary;
            bucket.avgOtherN += 1;
        }
    }

    function addVacancy(factorKey, valueKey, vacancy) {
        var bucket = ensureBucket(factorKey, valueKey);
        bucket.groupN += 1;
        appendSalary(bucket, vacancy);
    }

    list.forEach(function(vacancy) {
        addVacancy('accreditation', getSkillsSearchVacancyBooleanValue(vacancy, 'accreditation') ? 'true' : 'false', vacancy);
        addVacancy('has_test', getSkillsSearchVacancyBooleanValue(vacancy, 'has_test') ? 'true' : 'false', vacancy);
        addVacancy('cover_letter_required', getSkillsSearchVacancyBooleanValue(vacancy, 'cover_letter_required') ? 'true' : 'false', vacancy);
        addVacancy('rating_bucket', getEmployerRatingBucketFromVacancy(vacancy), vacancy);
    });

    return Object.keys(buckets).map(function(key) {
        var bucket = buckets[key];
        return {
            month: bucket.month,
            factorKey: bucket.factorKey,
            factorLabel: bucket.factorLabel,
            valueKey: bucket.valueKey,
            valueLabel: bucket.valueLabel,
            groupN: bucket.groupN,
            avgRurN: bucket.avgRurN,
            avgRur: bucket.avgRurN ? (bucket.avgRurSum / bucket.avgRurN) : null,
            avgUsdN: bucket.avgUsdN,
            avgUsd: bucket.avgUsdN ? (bucket.avgUsdSum / bucket.avgUsdN) : null,
            avgEurN: bucket.avgEurN,
            avgEur: bucket.avgEurN ? (bucket.avgEurSum / bucket.avgEurN) : null,
            avgOtherN: bucket.avgOtherN,
            avgOther: bucket.avgOtherN ? (bucket.avgOtherSum / bucket.avgOtherN) : null
        };
    });
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
        if ((block.dataset.employerActiveMonth || '') === 'global') {
            renderGlobalEmployerFiltered(block.closest('.role-content'));
        } else {
            applyEmployerAnalysisMonthFilter(block, block.dataset.employerActiveMonth || 'all');
        }
        applyEmployerAnalysisViewMode(block, uiState.employer_analysis_view_mode || block.dataset.employerViewMode || 'together');
        return;
    }
    var tableContainer = block.querySelector('.table-container');
    if (!tableContainer) return;
    tableContainer.classList.add('employer-analysis-table-container');
    tableContainer.style.margin = '0 auto';
    tableContainer.style.width = '';
    tableContainer.style.maxWidth = '';

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
    }
    viewToggle.className = 'employer-view-toggle employer-side-toggle';
    if (viewToggle.querySelectorAll('.employer-view-btn').length !== 3) {
        viewToggle.innerHTML = buildViewModeButtonsHtml(['together', 'table', 'graph'], 'employer-view-btn', uiState.employer_analysis_view_mode || 'together');
    }

    var graph = block.querySelector('.employer-analysis-graph');
    if (!graph) {
        graph = document.createElement('div');
        graph.className = 'employer-analysis-graph';
        graph.style.display = 'none';
    }
    if (graph.parentElement !== mainWrap) {
        mainWrap.appendChild(graph);
    }

    if (!viewToggle.dataset.bound) viewToggle.dataset.bound = '1';

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
    var allLabel = months.length && typeof formatMonthTitle === 'function'
        ? formatMonthTitle(months.length)
        : 'За период';
    block.dataset.employerAllLabel = allLabel;
    block.__employerRowsByPeriod = {};
    block.__employerLabelsByPeriod = {};
    var parentRole = block.closest('.role-content');
    var baseVacancies = parentRole ? dedupeVacanciesById(getRoleVacancies(parentRole) || []) : [];
    var quickPeriods = [
        { key: 'today', label: 'Сегодня' },
        { key: 'last_3', label: 'За 3 дня', days: 3 },
        { key: 'last_7', label: 'За 7 дней', days: 7 },
        { key: 'last_14', label: 'За 14 дней', days: 14 }
    ];
    quickPeriods.forEach(function(item) {
        var quickVacancies = item.key === 'today'
            ? filterVacanciesByLatestDay(baseVacancies)
            : filterVacanciesByRecentDays(baseVacancies, item.days);
        block.__employerRowsByPeriod[item.key] = buildEmployerAnalysisRowsFromVacancies(quickVacancies, item.key);
        block.__employerLabelsByPeriod[item.key] = item.label;
    });

    chipsWrap.innerHTML =
        quickPeriods.map(function(item) {
            return '<button type="button" class="tab-button month-button employer-period-chip" data-month="' + item.key + '">' + item.label + '</button>';
        }).join('') +
        months.map(function(m) {
            return '<button type="button" class="tab-button month-button employer-period-chip" data-month="' + m + '">' + m + '</button>';
        }).join('') +
        '<button type="button" class="tab-button month-button employer-period-chip active" data-month="all">' + allLabel + '</button>';

    if (!chipsWrap.dataset.bound) {
        chipsWrap.addEventListener('click', function(e) {
            var chip = e.target.closest('.employer-period-chip');
            if (!chip) return;
            applyEmployerAnalysisMonthFilter(block, chip.dataset.month || 'all');
        });
        chipsWrap.dataset.bound = '1';
    }

    applyEmployerAnalysisMonthFilter(block, 'all');
    applyEmployerAnalysisViewMode(block, uiState.employer_analysis_view_mode || block.dataset.employerViewMode || 'together');
    updateViewToggleIcons(block);
    block.dataset.employerInited = '1';
}

function getAllRolesViewMode(analysisType) {
    if (analysisType === 'activity') return uiState.activity_view_mode || 'together';
    if (analysisType === 'weekday') return uiState.weekday_view_mode || 'together';
    if (analysisType === 'skills') return uiState.skills_monthly_view_mode || 'together';
    if (analysisType === 'salary') return uiState.salary_view_mode || 'together';
    return 'together';
}

function applyAllRolesViewMode(target, analysisType) {
    if (!target) return 'together';
    var mode = getAllRolesViewMode(analysisType);
    setActiveViewButton(target.querySelectorAll('.view-mode-btn'), mode);
    applyViewMode(target.querySelector('.view-mode-container'), mode);
    return mode;
}

function getAllRolesSkillsRowsByCurrency(target) {
    if (!target) return {};
    if (target._data && target._data.currencyEntries) return target._data.currencyEntries;
    var parsed = parseJsonDataset(target, 'currencyEntries', {});
    target._data = target._data || {};
    target._data.currencyEntries = parsed || {};
    return target._data.currencyEntries;
}

function applyAllRolesSkillsCurrency(target, currency, contextText) {
    if (!target) return;
    var normalizedCurrency = String(currency || 'RUR').trim().toUpperCase();
    var rowsByCurrency = getAllRolesSkillsRowsByCurrency(target);
    var rows = rowsByCurrency[normalizedCurrency] || [];
    if (!rows.length) {
        var fallbackCurrency = Object.keys(rowsByCurrency).find(function(curr) {
            return Array.isArray(rowsByCurrency[curr]) && rowsByCurrency[curr].length;
        }) || normalizedCurrency;
        normalizedCurrency = String(fallbackCurrency || normalizedCurrency).trim().toUpperCase();
        rows = rowsByCurrency[normalizedCurrency] || [];
    }
    target.dataset.activeCurrency = normalizedCurrency;
    uiState.all_roles_skills_currency = normalizedCurrency;
    target._data = target._data || {};
    target._data.entries = rows;
    target.dataset.entries = encodeURIComponent(JSON.stringify(rows));

    var tableContainer = target.querySelector('.table-container');
    if (tableContainer && typeof buildAllRolesSkillsTableHtml === 'function') {
        tableContainer.innerHTML = buildAllRolesSkillsTableHtml(rows, normalizedCurrency);
    }

    var switchButtons = target.querySelectorAll('.skills-currency-switch-btn');
    switchButtons.forEach(function(btn) {
        btn.classList.toggle('active', String(btn.dataset.currency || '').toUpperCase() === normalizedCurrency);
    });

    var mode = getAllRolesViewMode('skills');
    if (mode !== 'table') {
        var graphId = target.dataset.graphId;
        if (graphId) renderAllRolesSkillsChartFromTable(target, graphId, contextText);
    }
}

function ensureAllRolesSkillsCurrencyControls(target, contextText) {
    if (!target) return;
    var switchWrap = target.querySelector('.skills-currency-switch');
    var defaultCurrency = String(
        uiState.all_roles_skills_currency ||
        target.dataset.activeCurrency ||
        'RUR'
    ).trim().toUpperCase();
    if (switchWrap && switchWrap.dataset.bound !== '1') {
        switchWrap.addEventListener('click', function(e) {
            var btn = e.target.closest('.skills-currency-switch-btn');
            if (!btn) return;
            applyAllRolesSkillsCurrency(target, btn.dataset.currency || defaultCurrency, contextText);
        });
        switchWrap.dataset.bound = '1';
    }
    applyAllRolesSkillsCurrency(target, defaultCurrency, contextText);
}

function getAllRolesSalaryRowsByCurrency(target) {
    if (!target) return {};
    if (target._data && target._data.currencyEntries) return target._data.currencyEntries;
    var parsed = parseJsonDataset(target, 'currencyEntries', {});
    target._data = target._data || {};
    target._data.currencyEntries = parsed || {};
    return target._data.currencyEntries;
}

function applyAllRolesSalaryCurrency(target, currency, contextText) {
    if (!target) return;
    var normalizedCurrency = String(currency || 'RUR').trim().toUpperCase();
    var rowsByCurrency = getAllRolesSalaryRowsByCurrency(target);
    var rows = rowsByCurrency[normalizedCurrency] || [];
    if (!rows.length) {
        var fallbackCurrency = Object.keys(rowsByCurrency).find(function(curr) {
            return Array.isArray(rowsByCurrency[curr]) && rowsByCurrency[curr].length;
        }) || normalizedCurrency;
        normalizedCurrency = String(fallbackCurrency || normalizedCurrency).trim().toUpperCase();
        rows = rowsByCurrency[normalizedCurrency] || [];
    }
    target.dataset.activeCurrency = normalizedCurrency;
    uiState.all_roles_salary_currency = normalizedCurrency;
    target._data = target._data || {};
    target._data.entries = rows;
    target.dataset.entries = encodeURIComponent(JSON.stringify(rows));

    var tableContainer = target.querySelector('.table-container');
    if (tableContainer && typeof buildAllRolesSalaryTableHtml === 'function') {
        tableContainer.innerHTML = buildAllRolesSalaryTableHtml(rows, normalizedCurrency);
    }

    target.querySelectorAll('.salary-currency-switch-btn').forEach(function(btn) {
        btn.classList.toggle('active', String(btn.dataset.currency || '').toUpperCase() === normalizedCurrency);
    });

    var mode = getAllRolesViewMode('salary');
    if (mode !== 'table') {
        var graphId = target.dataset.graphId;
        var metricKey = String(target.dataset.activeSalaryMetric || uiState.all_roles_salary_metric || 'avg_salary');
        if (graphId) {
            buildAllRolesSalaryChart(rows, graphId, metricKey);
            var metricTitleMap = {
                avg_salary: 'Средняя зарплата по ролям',
                median_salary: 'Медианная зарплата по ролям',
                mode_salary: 'Модальная зарплата по ролям',
                min_salary: 'Минимальная зарплата по ролям',
                max_salary: 'Максимальная зарплата по ролям'
            };
            applyChartTitleContext(graphId, metricTitleMap[metricKey] || 'Сравнение зарплат по ролям', contextText);
        }
    }
}

function ensureAllRolesSalaryCurrencyControls(target, contextText) {
    if (!target) return;
    var switchWrap = target.querySelector('.salary-currency-switch');
    var defaultCurrency = String(
        uiState.all_roles_salary_currency ||
        target.dataset.activeCurrency ||
        'RUR'
    ).trim().toUpperCase();
    if (switchWrap && switchWrap.dataset.bound !== '1') {
        switchWrap.addEventListener('click', function(e) {
            var btn = e.target.closest('.salary-currency-switch-btn');
            if (!btn) return;
            applyAllRolesSalaryCurrency(target, btn.dataset.currency || defaultCurrency, contextText);
        });
        switchWrap.dataset.bound = '1';
    }
    var metricWrap = target.querySelector('.salary-metric-switch');
    if (metricWrap && metricWrap.dataset.bound !== '1') {
        metricWrap.addEventListener('click', function(e) {
            var btn = e.target.closest('.salary-metric-switch-btn');
            if (!btn) return;
            target.dataset.activeSalaryMetric = String(btn.dataset.metric || 'avg_salary');
            uiState.all_roles_salary_metric = target.dataset.activeSalaryMetric;
            metricWrap.querySelectorAll('.salary-metric-switch-btn').forEach(function(node) {
                node.classList.toggle('active', node === btn);
            });
            applyAllRolesSalaryCurrency(target, target.dataset.activeCurrency || defaultCurrency, contextText);
        });
        metricWrap.dataset.bound = '1';
    }
    if (!target.dataset.activeSalaryMetric) target.dataset.activeSalaryMetric = String(uiState.all_roles_salary_metric || 'avg_salary');
    if (metricWrap) {
        var currentMetric = String(target.dataset.activeSalaryMetric || 'avg_salary');
        metricWrap.querySelectorAll('.salary-metric-switch-btn').forEach(function(node) {
            node.classList.toggle('active', String(node.dataset.metric || '') === currentMetric);
        });
    }
    applyAllRolesSalaryCurrency(target, defaultCurrency, contextText);
}

function renderAllRolesSkillsChartFromTable(target, graphId, contextText, attempt) {
    if (!target || !graphId) return;
    attempt = attempt || 0;
    var graphEl = document.getElementById(graphId);
    if (!graphEl) return;
    target.style.display = 'block';
    var layoutWrap = target.querySelector('.view-mode-container');
    if (layoutWrap) layoutWrap.style.display = 'flex';
    graphEl.style.display = 'block';

    var rows = Array.from(target.querySelectorAll('.skills-all-table tbody tr')).map(function(row) {
        var cells = row.querySelectorAll('td');
        if (!cells || cells.length < 3) return null;
        var skill = (cells[0].textContent || '').trim();
        var count = parseInt((cells[1].textContent || '0').replace(/\s/g, ''), 10);
        var avgText = (cells[2].textContent || '').trim().replace(/\s/g, '').replace(',', '.');
        var avgValue = avgText && avgText !== '—' ? Number(avgText) : null;
        if (!skill) return null;
        return {
            skill: skill,
            mention_count: isFinite(count) ? count : 0,
            avg_skill_cost: isFinite(avgValue) ? avgValue : null
        };
    }).filter(Boolean);

    if (!rows.length) {
        graphEl.dataset.plotSignature = '';
        graphEl.dataset.plotReady = '';
        graphEl.innerHTML = '<div style="padding:12px;color:var(--text-secondary);text-align:center;">Нет данных для графика</div>';
        return;
    }

    var top = rows.slice().sort(function(a, b) {
        return (b.mention_count || 0) - (a.mention_count || 0) || String(a.skill || '').localeCompare(String(b.skill || ''));
    }).slice(0, 100);
    var topByAvgSalary = rows.filter(function(item) {
        return item.avg_skill_cost !== null && item.avg_skill_cost !== undefined;
    }).sort(function(a, b) {
        return (b.avg_skill_cost || 0) - (a.avg_skill_cost || 0) || String(a.skill || '').localeCompare(String(b.skill || ''));
    }).slice(0, 100);
    var activeCurrency = String(target.dataset.activeCurrency || 'RUR').trim().toUpperCase();
    var hasAvgSalaryChart = !!topByAvgSalary.length;
    var preferredChartKey = String(
        graphEl.dataset.activeSkillsChart ||
        uiState.all_roles_skills_chart ||
        'mentions'
    ).trim().toLowerCase();
    var activeChartKey = (preferredChartKey === 'avg' && hasAvgSalaryChart) ? 'avg' : 'mentions';
    var buildChartSwitchHtml = function(activeKey) {
        if (!hasAvgSalaryChart) return '';
        return '' +
            '<div class="skills-all-chart-switch chart-switch">' +
                '<button type="button" class="tab-button skills-all-chart-switch-btn' + (activeKey === 'mentions' ? ' active' : '') + '" data-chart="mentions">По упоминаниям</button>' +
                '<button type="button" class="tab-button skills-all-chart-switch-btn' + (activeKey === 'avg' ? ' active' : '') + '" data-chart="avg">По средней з/п</button>' +
            '</div>';
    };
    var subtitleText = '';
    var activeRole = target.closest('.role-content');
    if (activeRole) {
        var periodOptions = getGlobalFilterOptions(activeRole, 'periods', 'skills-monthly');
        var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
        var expOptions = getGlobalFilterOptions(activeRole, 'experiences', 'skills-monthly');
        var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
        var periodLabel = resolveChartPeriodLabel(selectedPeriods);
        var normalizedPeriodLabel = String(periodLabel || '').trim();
        if (normalizedPeriodLabel === 'Все' || normalizedPeriodLabel === 'По выбранному периоду' || normalizedPeriodLabel === 'За все время') {
            periodLabel = 'Весь период';
        }
        var experienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
        subtitleText = buildChartContextLabel(periodLabel, experienceLabel);
    }
    if (!subtitleText) {
        subtitleText = String(contextText || '').trim();
    }
    if (!subtitleText) {
        var periodSource = target.dataset.period || '';
        subtitleText = 'Период: ' + String(formatPeriodSelectionValue(periodSource) || periodSource || 'За весь период').trim();
    } else if (subtitleText.indexOf('Период:') !== 0) {
        subtitleText = 'Период: ' + subtitleText;
    }
    var renderHtmlFallback = function() {
        var maxCount = top.reduce(function(max, item) {
            return Math.max(max, item.mention_count || 0);
        }, 0) || 1;
        var maxAvg = topByAvgSalary.reduce(function(max, item) {
            return Math.max(max, item.avg_skill_cost || 0);
        }, 0) || 1;
        graphEl.classList.add('skills-all-html-chart');
        graphEl.dataset.plotSignature = top.map(function(item) {
            return (item.skill || '') + ':' + (item.mention_count || 0);
        }).join('|') + '|' + topByAvgSalary.map(function(item) {
            return (item.skill || '') + ':' + (item.avg_skill_cost || 0);
        }).join('|') + '|' + (contextText || '') + '|html';
        graphEl.dataset.plotReady = '';
        graphEl.style.minHeight = '480px';
        graphEl.innerHTML =
            '<div class="skills-all-html-card">' +
                buildChartSwitchHtml(activeChartKey) +
                '<div class="skills-all-chart-section chart-switch-target' + (activeChartKey === 'mentions' ? ' active' : '') + '" data-chart-section="mentions">' +
                    '<div class="skills-all-html-title">Топ-100 навыков по упоминаниям</div>' +
                    '<div class="skills-all-html-subtitle">' + escapeHtml(subtitleText) + '</div>' +
                    top.map(function(item) {
                        var width = Math.max(4, Math.round(((item.mention_count || 0) / maxCount) * 100));
                        return '' +
                            '<div class="skills-all-html-row">' +
                                '<div class="skills-all-html-label">' + escapeHtml(item.skill || '—') + '</div>' +
                                '<div class="skills-all-html-track">' +
                                    '<div class="skills-all-html-fill" style="width:' + width + '%;background:' + escapeHtml(typeof CHART_COLORS !== 'undefined' ? CHART_COLORS.medium : '#90A4AE') + ';"></div>' +
                                '</div>' +
                                '<div class="skills-all-html-value">' + (item.mention_count || 0) + '</div>' +
                            '</div>';
                    }).join('') +
                '</div>' +
                '<div class="skills-all-chart-section chart-switch-target' + (activeChartKey === 'avg' ? ' active' : '') + '" data-chart-section="avg"' + (hasAvgSalaryChart ? '' : ' style="display:none;"') + '>' +
                    '<div class="skills-all-html-title">Топ-100 навыков по средней зарплате (' + escapeHtml(activeCurrency) + ')</div>' +
                    '<div class="skills-all-html-subtitle">' + escapeHtml(subtitleText) + '</div>' +
                    (topByAvgSalary.length ? topByAvgSalary.map(function(item) {
                        var width = Math.max(4, Math.round(((item.avg_skill_cost || 0) / maxAvg) * 100));
                        return '' +
                            '<div class="skills-all-html-row">' +
                                '<div class="skills-all-html-label">' + escapeHtml(item.skill || '—') + '</div>' +
                                '<div class="skills-all-html-track">' +
                                    '<div class="skills-all-html-fill" style="width:' + width + '%;background:' + escapeHtml(typeof CHART_COLORS !== 'undefined' ? CHART_COLORS.dark : '#546E7A') + ';"></div>' +
                                '</div>' +
                                '<div class="skills-all-html-value">' + (item.avg_skill_cost !== null && item.avg_skill_cost !== undefined ? item.avg_skill_cost.toFixed(2) : '—') + '</div>' +
                            '</div>';
                    }).join('') : '<div style="padding:12px;color:var(--text-secondary);text-align:center;">Нет данных по средней зарплате</div>') +
                '</div>' +
            '</div>';
        bindSkillsAllChartSwitch(graphEl);
    };

    var graphWidth = Math.max(
        graphEl.clientWidth || 0,
        Math.round((graphEl.getBoundingClientRect ? graphEl.getBoundingClientRect().width : 0) || 0)
    );
    var targetVisible = target.offsetParent !== null;
    var graphVisible = graphEl.offsetParent !== null || graphEl.style.display === 'block';
    if ((!targetVisible || !graphVisible || graphWidth === 0) && attempt < 4) {
        var retry = function() {
            renderAllRolesSkillsChartFromTable(target, graphId, contextText, attempt + 1);
        };
        requestAnimationFrame(retry);
        setTimeout(retry, 80 * (attempt + 1));
        return;
    }
    if (!targetVisible || !graphVisible || graphWidth === 0) {
        renderHtmlFallback();
        return;
    }
    if (typeof Plotly === 'undefined') {
        renderHtmlFallback();
        return;
    }
    var signature = top.map(function(item) {
        return (item.skill || '') + ':' + (item.mention_count || 0);
    }).join('|') + '|' + topByAvgSalary.map(function(item) {
        return (item.skill || '') + ':' + (item.avg_skill_cost || 0);
    }).join('|') + '|' + (contextText || '');
    graphEl.classList.add('skills-all-html-chart');
    graphEl.dataset.plotReady = '';
    graphEl.innerHTML =
        '<div class="skills-all-html-card">' +
            buildChartSwitchHtml(activeChartKey) +
            '<div class="skills-all-chart-section chart-switch-target' + (activeChartKey === 'mentions' ? ' active' : '') + '" data-chart-section="mentions">' +
                '<div class="skills-all-html-title">Топ-100 навыков по упоминаниям</div>' +
                '<div class="skills-all-html-subtitle">' + escapeHtml(subtitleText) + '</div>' +
                '<div class="skills-all-plotly-host" id="' + graphId + '-plotly-host"></div>' +
            '</div>' +
            '<div class="skills-all-chart-section chart-switch-target' + (activeChartKey === 'avg' ? ' active' : '') + '" data-chart-section="avg"' + (hasAvgSalaryChart ? '' : ' style="display:none;"') + '>' +
                '<div class="skills-all-html-title">Топ-100 навыков по средней зарплате (' + escapeHtml(activeCurrency) + ')</div>' +
                '<div class="skills-all-html-subtitle">' + escapeHtml(subtitleText) + '</div>' +
                '<div class="skills-all-plotly-host" id="' + graphId + '-avg-plotly-host"></div>' +
            '</div>' +
        '</div>';
    var plotHost = document.getElementById(graphId + '-plotly-host');
    var avgPlotHost = document.getElementById(graphId + '-avg-plotly-host');
    if (!plotHost || !avgPlotHost) {
        renderHtmlFallback();
        return;
    }
    var data = [{
        x: top.map(function(item) { return item.mention_count || 0; }),
        y: top.map(function(item) { return item.skill || '—'; }),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: (typeof CHART_COLORS !== 'undefined' ? CHART_COLORS.medium : '#90A4AE'),
            line: { width: 0 }
        },
        hovertemplate: '<b>%{y}</b><br>Упоминаний: %{x}<extra></extra>'
    }];
    var avgData = [{
        x: topByAvgSalary.map(function(item) { return item.avg_skill_cost || 0; }),
        y: topByAvgSalary.map(function(item) { return item.skill || '—'; }),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: (typeof CHART_COLORS !== 'undefined' ? CHART_COLORS.dark : '#546E7A'),
            line: { width: 0 }
        },
        hovertemplate: '<b>%{y}</b><br>Средняя з/п (' + escapeHtml(activeCurrency) + '): %{x:.2f}<extra></extra>'
    }];
    var layout = {
        margin: { t: 2, b: 8, l: 8, r: 8 },
        height: resolveUnifiedChartHeight(data),
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        showlegend: false
    };
    var avgLayout = {
        margin: { t: 2, b: 8, l: 8, r: 8 },
        height: resolveUnifiedChartHeight(avgData),
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        showlegend: false
    };
    layout.xaxis = {
        visible: false,
        showgrid: false,
        zeroline: false,
        fixedrange: true
    };
    layout.yaxis = {
        automargin: true,
        autorange: 'reversed',
        tickfont: { size: 12, color: '#0f172a' },
        fixedrange: true
    };
    avgLayout.xaxis = {
        visible: false,
        showgrid: false,
        zeroline: false,
        fixedrange: true
    };
    avgLayout.yaxis = {
        automargin: true,
        autorange: 'reversed',
        tickfont: { size: 12, color: '#0f172a' },
        fixedrange: true
    };
    plotHost.style.minHeight = '0';
    avgPlotHost.style.minHeight = '0';
    graphEl.style.minHeight = '0';

    try {
        if (plotHost.dataset.plotReady === '1' && typeof Plotly.react === 'function') {
            Plotly.react(plotHost, data, layout, { responsive: true, displayModeBar: false });
        } else {
            Plotly.newPlot(plotHost, data, layout, { responsive: true, displayModeBar: false });
        }
        if (hasAvgSalaryChart) {
            if (avgPlotHost.dataset.plotReady === '1' && typeof Plotly.react === 'function') {
                Plotly.react(avgPlotHost, avgData, avgLayout, { responsive: true, displayModeBar: false });
            } else {
                Plotly.newPlot(avgPlotHost, avgData, avgLayout, { responsive: true, displayModeBar: false });
            }
        } else {
            avgPlotHost.innerHTML = '<div style="padding:12px;color:var(--text-secondary);text-align:center;">Нет данных по средней зарплате</div>';
            avgPlotHost.dataset.plotReady = '';
        }
    } catch (err) {
        renderHtmlFallback();
        return;
    }
    graphEl.dataset.plotSignature = signature;
    graphEl.dataset.plotReady = '1';
    plotHost.dataset.plotReady = '1';
    if (hasAvgSalaryChart) avgPlotHost.dataset.plotReady = '1';
    graphEl.dataset.activeSkillsChart = activeChartKey;
    bindSkillsAllChartSwitch(graphEl);
    resizePlotlyScope(plotHost);
    if (hasAvgSalaryChart) resizePlotlyScope(avgPlotHost);
}

function bindSkillsAllChartSwitch(graphEl) {
    if (!graphEl) return;
    var buttons = Array.from(graphEl.querySelectorAll('.skills-all-chart-switch-btn'));
    var sections = Array.from(graphEl.querySelectorAll('.skills-all-chart-section[data-chart-section]'));
    if (!buttons.length || !sections.length) return;
    var activateChart = function(chartKey) {
        var normalized = chartKey === 'avg' ? 'avg' : 'mentions';
        graphEl.dataset.activeSkillsChart = normalized;
        uiState.all_roles_skills_chart = normalized;
        buttons.forEach(function(btn) {
            btn.classList.toggle('active', (btn.dataset.chart || 'mentions') === normalized);
        });
        sections.forEach(function(section) {
            var match = (section.dataset.chartSection || 'mentions') === normalized;
            section.classList.toggle('active', match);
            section.style.display = match ? 'block' : 'none';
        });
        var activeHosts = graphEl.querySelectorAll('.skills-all-chart-section.active .skills-all-plotly-host');
        activeHosts.forEach(function(host) {
            resizePlotlyScope(host);
        });
    };
    buttons.forEach(function(btn) {
        if (btn.dataset.bound === '1') return;
        btn.addEventListener('click', function() {
            activateChart(btn.dataset.chart || 'mentions');
        });
        btn.dataset.bound = '1';
    });
    activateChart(graphEl.dataset.activeSkillsChart || uiState.all_roles_skills_chart || 'mentions');
}

function ensureStackedChartSwitch(container, items, preferredKey) {
    if (!container) return;
    var visibleItems = (Array.isArray(items) ? items : []).filter(function(item) {
        return item && item.el;
    });
    visibleItems.forEach(function(item) {
        item.el.classList.add('stacked-chart-switchable');
        item.el.classList.add('chart-switch-target');
        item.el.dataset.chartSection = item.key || '';
    });
    var switchWrap = getDirectChildByClass(container, 'stacked-chart-switch');
    if (visibleItems.length <= 1) {
        if (switchWrap && switchWrap.parentElement) switchWrap.parentElement.removeChild(switchWrap);
        visibleItems.forEach(function(item) {
            item.el.classList.add('active');
            item.el.style.display = '';
        });
        return;
    }
    if (!switchWrap) {
        switchWrap = document.createElement('div');
        switchWrap.className = 'stacked-chart-switch chart-switch';
        container.insertBefore(switchWrap, container.firstChild);
    }
    switchWrap.innerHTML = visibleItems.map(function(item) {
        var isActive = String(item.key || '') === String(preferredKey || container.dataset.activeChartKey || visibleItems[0].key || '');
        return '<button type="button" class="tab-button stacked-chart-switch-btn' + (isActive ? ' active' : '') + '" data-chart="' + escapeHtml(item.key || '') + '">' + escapeHtml(item.label || '') + '</button>';
    }).join('');
    var activate = function(chartKey) {
        var nextKey = visibleItems.some(function(item) { return item.key === chartKey; }) ? chartKey : (visibleItems[0].key || '');
        container.dataset.activeChartKey = nextKey;
        Array.from(switchWrap.querySelectorAll('.stacked-chart-switch-btn')).forEach(function(btn) {
            btn.classList.toggle('active', (btn.dataset.chart || '') === nextKey);
        });
        visibleItems.forEach(function(item) {
            var isMatch = item.key === nextKey;
            item.el.classList.toggle('active', isMatch);
            item.el.style.display = isMatch ? '' : 'none';
            if (!isMatch) return;
            var resizeTargets = item.el.querySelectorAll('.plotly-graph, .employer-analysis-subgraph-host, .unified-chart-host, .js-plotly-plot');
            if (!resizeTargets.length) {
                resizePlotlyScope(item.el);
                return;
            }
            resizeTargets.forEach(function(node) {
                resizePlotlyScope(node);
            });
        });
    };
    Array.from(switchWrap.querySelectorAll('.stacked-chart-switch-btn')).forEach(function(btn) {
        btn.addEventListener('click', function() {
            activate(btn.dataset.chart || '');
        });
    });
    activate(preferredKey || container.dataset.activeChartKey || visibleItems[0].key || '');
}

function openAllRolesPeriodTab(evt, contentId, analysisType) {
    var wrapper = evt.currentTarget.closest('.all-roles-period-wrapper');
    if (!wrapper) return;
    var parentRole = wrapper.closest('.role-content');
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
    syncAllRolesSharedPeriodTabs(parentRole, evt.currentTarget.dataset.period || 'all');

    if (analysisType === 'activity' && target) {
        var mode = applyAllRolesViewMode(target, analysisType);
        var rows = parseJsonDataset(target, 'entries', []);
        var mainId = target.dataset.graphMain;
        var ageId = target.dataset.graphAge;
        var allRolesContext = buildChartContextLabel((evt.currentTarget.textContent || '').trim(), null);
        if (mainId && ageId) {
            buildAllRolesActivityChart(rows, mainId, ageId);
            applyChartTitleContext(mainId, 'Открытые и архивные вакансии по ролям', allRolesContext);
            applyChartTitleContext(ageId, 'Ср. возраст (дни) по ролям', allRolesContext);
        }
    } else if (analysisType === 'weekday' && target) {
        normalizeWeekdayControls(target.closest('.role-content'));
        var mode = applyAllRolesViewMode(target, analysisType);
        var rows = parseJsonDataset(target, 'entries', []);
        var graphId = target.dataset.graphId;
        var allRolesWeekdayContext = buildChartContextLabel((evt.currentTarget.textContent || '').trim(), null);
        if (mode !== 'table' && graphId) {
            buildAllRolesWeekdayChart(rows, graphId);
            applyChartTitleContext(graphId, 'Публикации и архивы по ролям', allRolesWeekdayContext);
        }
    } else if (analysisType === 'skills' && target) {
        var mode = applyAllRolesViewMode(target, analysisType);
        var allRolesSkillsContext = buildChartContextLabel((evt.currentTarget.textContent || '').trim(), null);
        ensureAllRolesSkillsCurrencyControls(target, allRolesSkillsContext);
    } else if (analysisType === 'salary' && target) {
        var mode = applyAllRolesViewMode(target, analysisType);
        var allRolesSalaryContext = buildChartContextLabel((evt.currentTarget.textContent || '').trim(), null);
        ensureAllRolesSalaryCurrencyControls(target, allRolesSalaryContext);
    }
}

function restoreAllRolesPeriodState(parentRole, analysisType) {
    var analysisId = analysisType === 'skills' ? 'skills-monthly-all' : (analysisType + '-all');
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
    var allBtn = Array.from(buttons).find(function(btn) {
        return String(btn.dataset.period || '').trim() === 'all';
    });
    if (allBtn) {
        allBtn.click();
        return;
    }
    var activeBtn = Array.from(buttons).find(function(btn) {
        return btn.classList.contains('active');
    });
    (activeBtn || buttons[0]).click();
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
    var tableWrap = monthDiv.querySelector('.table-container');
    if (tableWrap) tableWrap.innerHTML = buildActivityTableHtml(entries || []);
    var graphId = 'activity-graph-' + monthId.replace('month-', '');
    buildActivityBarChart(graphId, entries);
    applyChartTitleContext(graphId, 'Количество вакансий по опыту', buildChartContextLabel(monthStr, null));
    applyActivityModeSizing(container, uiState.activity_view_mode);
    normalizeActivityControls(parentRole);
    syncSharedFilterPanel(parentRole, 'activity');
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
    syncSharedFilterPanel(parentRole, 'skills-monthly');
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
        renderSkillsExpContent(expDiv, expData);
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
                    buildViewModeButtonsHtml(['together', 'table', 'graph'], '', uiState.skills_monthly_view_mode || 'together') +
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
    applyChartTitleContext(finalGraphId, 'Топ-30 навыков', buildChartContextLabel(monthStr, liveExp.experience || experience));
    applySkillsModeSizing(container, uiState.skills_monthly_view_mode);
    normalizeSkillsMonthlyControls(parentRole);
    syncSharedFilterPanel(parentRole, 'skills-monthly');
}
function restoreSalaryState(parentRole, roleId) {
    var salaryBlock = parentRole.querySelector('.salary-content');
    var viewBtns = salaryBlock ? salaryBlock.querySelectorAll('.view-mode-btn') : [];
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
    syncSharedFilterPanel(parentRole, 'salary');
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
    var monthData = (parentMonth._data && parentMonth._data.month) ? parentMonth._data.month : parseJsonDataset(parentMonth, 'month', {});
    var monthStr = monthData && monthData.month ? monthData.month : '';

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
    expDiv.dataset.chartContext = buildChartContextLabel(monthStr, experience);

    bindSalaryRowData(expDiv, expData.entries || []);
    applySalaryTablesMarkup(expDiv, expData.entries || []);
    bindSalaryRowData(expDiv, expData.entries || []);
    applySalaryViewMode(expDiv, expData.entries);
    normalizeSalaryControls(parentRole);
    syncSharedFilterPanel(parentRole, 'salary');
}

// ---------- Общие функции для переключения режимов ----------
function setActiveViewButton(buttons, mode) {
    mode = normalizeResponsiveViewMode(mode);
    for (var btn of buttons) {
        if (btn.dataset.view === mode) btn.classList.add('active');
        else btn.classList.remove('active');
    }
}
function normalizeResponsiveViewMode(mode) {
    return mode || 'table';
}
function isCompactViewport() {
    return false;
}
function syncResponsiveViewModeButtons(root) {
    var scope = root || document;
    var buttons = scope.querySelectorAll('.view-mode-btn[data-view="together"], .view-mode-button[data-view="together"]');
    buttons.forEach(function(btn) {
        btn.disabled = false;
        btn.classList.remove('is-disabled');
        btn.removeAttribute('aria-disabled');
        btn.removeAttribute('tabindex');
    });
}
function refreshResponsiveViewModes(root) {
    var scope = root || document;
    syncResponsiveViewModeButtons(scope);

    scope.querySelectorAll('.view-mode-container').forEach(function(container) {
        var analysis = container.dataset.analysis || '';
        var mode = null;
        if (analysis === 'activity') mode = uiState.activity_view_mode || 'together';
        else if (analysis === 'weekday') mode = uiState.weekday_view_mode || 'together';
        else if (analysis === 'skills-monthly') mode = uiState.skills_monthly_view_mode || 'together';
        if (!mode) return;

        var controls = container.parentElement ? container.parentElement.querySelectorAll('.view-mode-btn, .view-mode-button') : [];
        setActiveViewButton(controls, mode);
        applyViewMode(container, mode);
    });

    scope.querySelectorAll('.salary-exp-content').forEach(function(expDiv) {
        var expData = (expDiv._data && expDiv._data.exp) ? expDiv._data.exp : parseJsonDataset(expDiv, 'exp', {});
        setActiveViewButton(expDiv.querySelectorAll('.salary-inline-mode-btn'), uiState.salary_view_mode || 'together');
        applySalaryViewMode(expDiv, expData.entries || []);
    });

    scope.querySelectorAll('.employer-analysis-content').forEach(function(block) {
        applyEmployerAnalysisViewMode(block, uiState.employer_analysis_view_mode || block.dataset.employerViewMode || 'together');
    });
}
if (typeof window !== 'undefined' && !window.__responsiveViewModesResizeBound) {
    window.__responsiveViewModesResizeBound = true;
    window.addEventListener('resize', function() {
        refreshResponsiveViewModes(document);
    });
}
function resizePlotlyScope(root) {
    if (!root || typeof Plotly === 'undefined' || !Plotly.Plots || typeof Plotly.Plots.resize !== 'function') return;
    var targets = [];
    if (root.classList && root.classList.contains('js-plotly-plot')) targets.push(root);
    root.querySelectorAll('.js-plotly-plot').forEach(function(node) {
        if (targets.indexOf(node) === -1) targets.push(node);
    });
    if (!targets.length) return;
    var run = function() {
        targets.forEach(function(node) {
            try {
                Plotly.Plots.resize(node);
            } catch (err) {
            }
        });
    };
    requestAnimationFrame(run);
    setTimeout(run, 90);
}
function applyViewMode(container, mode) {
    if (!container) return;
    mode = normalizeResponsiveViewMode(mode);
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
    } else if ((container.dataset.analysis || '') === 'salary') {
        applySalaryModeSizing(container, mode);
    }
    if (mode !== 'table') resizePlotlyScope(graph);
}

function resetCompositeViewStyles(layoutRoot, table, graph) {
    if (!layoutRoot || !table || !graph) return;
    layoutRoot.style.display = 'flex';
    layoutRoot.style.flexDirection = 'row';
    layoutRoot.style.flexWrap = 'wrap';
    layoutRoot.style.alignItems = 'stretch';
    layoutRoot.style.justifyContent = 'center';
    layoutRoot.style.overflow = '';
    layoutRoot.style.overflowX = '';
    layoutRoot.style.minHeight = '';
    layoutRoot.style.height = '';

    table.style.display = 'block';
    table.style.flex = '';
    table.style.width = '';
    table.style.maxWidth = '';
    table.style.margin = '';
    table.style.minWidth = '';
    table.style.height = '';
    table.style.maxHeight = '';
    table.style.overflow = '';
    table.style.removeProperty('width');
    table.style.removeProperty('max-width');
    table.style.removeProperty('min-width');

    graph.style.display = 'block';
    graph.style.flex = '';
    graph.style.width = '';
    graph.style.maxWidth = '';
    graph.style.margin = '';
    graph.style.minWidth = '';
    graph.style.height = '';
    graph.style.removeProperty('width');
    graph.style.removeProperty('max-width');
    graph.style.removeProperty('min-width');
}

var UNIFIED_ANALYSIS_LAYOUT_WIDTH = '100%';
var UNIFIED_ANALYSIS_SINGLE_WIDTH = '100%';
var UNIFIED_ANALYSIS_TABLE_WIDTH = 'calc(50% - (var(--analysis-gap) / 2))';
var UNIFIED_ANALYSIS_GRAPH_WIDTH = 'calc(50% - (var(--analysis-gap) / 2))';
var UNIFIED_ANALYSIS_SPLIT_MIN_WIDTH = '0';

function applyCompositeViewMode(layoutRoot, table, graph, mode, options) {
    if (!layoutRoot || !table || !graph) return;
    var opts = options || {};
    var compact = isCompactViewport();
    var normalizedMode = normalizeResponsiveViewMode(mode || 'together');
    var layoutWidth = opts.layoutWidth || UNIFIED_ANALYSIS_LAYOUT_WIDTH;
    var tableOnlyWidth = opts.tableOnlyWidth || UNIFIED_ANALYSIS_SINGLE_WIDTH;
    var splitTableWidth = opts.splitTableWidth || UNIFIED_ANALYSIS_TABLE_WIDTH;
    var splitGraphWidth = opts.splitGraphWidth || UNIFIED_ANALYSIS_GRAPH_WIDTH;
    var splitMinWidth = opts.splitMinWidth || UNIFIED_ANALYSIS_SPLIT_MIN_WIDTH;
    var compactTableMinWidth = opts.compactTableMinWidth || '0';

    resetCompositeViewStyles(layoutRoot, table, graph);
    layoutRoot.style.width = '100%';
    layoutRoot.style.maxWidth = layoutWidth;
    layoutRoot.style.margin = '0 auto';

    if (normalizedMode === 'table') {
        graph.style.display = 'none';
        if (compact) {
            layoutRoot.style.overflowX = 'auto';
            table.style.setProperty('width', '100%', 'important');
            table.style.setProperty('max-width', 'none', 'important');
            table.style.setProperty('min-width', compactTableMinWidth, 'important');
        } else {
            table.style.setProperty('width', tableOnlyWidth, 'important');
            table.style.setProperty('max-width', tableOnlyWidth, 'important');
            table.style.setProperty('min-width', '0', 'important');
            table.style.margin = '0 auto';
        }
        return normalizedMode;
    }

    if (normalizedMode === 'graph') {
        table.style.display = 'none';
        graph.style.setProperty('width', '100%', 'important');
        graph.style.setProperty('max-width', '100%', 'important');
        graph.style.setProperty('min-width', '0', 'important');
        graph.style.flex = '1 1 100%';
        graph.style.margin = '0 auto';
        return normalizedMode;
    }

    if (compact) {
        layoutRoot.style.flexDirection = 'column';
        table.style.setProperty('width', '100%', 'important');
        table.style.setProperty('max-width', '100%', 'important');
        table.style.setProperty('min-width', '0', 'important');
        graph.style.setProperty('width', '100%', 'important');
        graph.style.setProperty('max-width', '100%', 'important');
        graph.style.setProperty('min-width', '0', 'important');
        table.style.margin = '0 auto';
        graph.style.margin = '0 auto';
        return normalizedMode;
    }

    table.style.flex = '1 1 ' + splitTableWidth;
    table.style.width = '';
    table.style.maxWidth = '';
    table.style.minWidth = splitMinWidth;
    table.style.margin = '0 auto';
    graph.style.flex = '1 1 ' + splitGraphWidth;
    graph.style.width = '';
    graph.style.maxWidth = '';
    graph.style.minWidth = splitMinWidth;
    graph.style.margin = '0 auto';
    return normalizedMode;
}

function resolveSummaryTableWidth(container, defaultWidth) {
    if (!container || !container.closest) return defaultWidth;
    if (container.closest('#role-combined')) return '100%';
    if (container.closest('.all-roles-period-content')) return 'min(100%, 1180px)';
    return defaultWidth;
}

function applyStandardTableModeWidth(table, container, defaultWidth) {
    if (!table) return;
    var width = resolveSummaryTableWidth(container, defaultWidth || UNIFIED_ANALYSIS_LAYOUT_WIDTH);
    table.style.flex = '0 1 ' + width;
    table.style.width = width;
    table.style.maxWidth = width;
    table.style.margin = '0 auto';
}

function applySkillsModeSizing(container, mode) {
    if (!container) return;
    mode = normalizeResponsiveViewMode(mode);
    var table = container.querySelector('.table-container');
    var graph = container.querySelector('.plotly-graph');
    if (!table || !graph) return;
    applyCompositeViewMode(container, table, graph, mode, {
        layoutWidth: UNIFIED_ANALYSIS_LAYOUT_WIDTH,
        tableOnlyWidth: UNIFIED_ANALYSIS_SINGLE_WIDTH,
        splitTableWidth: UNIFIED_ANALYSIS_TABLE_WIDTH,
        splitGraphWidth: UNIFIED_ANALYSIS_GRAPH_WIDTH,
        splitMinWidth: UNIFIED_ANALYSIS_SPLIT_MIN_WIDTH
    });
}
function applyActivityModeSizing(container, mode) {
    var table = container.querySelector('.table-container');
    var graph = container.querySelector('.plotly-graph');
    if (!table || !graph) return;
    mode = normalizeResponsiveViewMode(mode);
    applyCompositeViewMode(container, table, graph, mode, {
        layoutWidth: UNIFIED_ANALYSIS_LAYOUT_WIDTH,
        tableOnlyWidth: UNIFIED_ANALYSIS_SINGLE_WIDTH,
        splitTableWidth: UNIFIED_ANALYSIS_TABLE_WIDTH,
        splitGraphWidth: UNIFIED_ANALYSIS_GRAPH_WIDTH,
        splitMinWidth: UNIFIED_ANALYSIS_SPLIT_MIN_WIDTH
    });
}

function applyWeekdayModeSizing(container, mode) {
    var table = container.querySelector('.table-container');
    var graph = container.querySelector('.plotly-graph');
    if (!table || !graph) return;
    mode = normalizeResponsiveViewMode(mode);
    applyCompositeViewMode(container, table, graph, mode, {
        layoutWidth: UNIFIED_ANALYSIS_LAYOUT_WIDTH,
        tableOnlyWidth: UNIFIED_ANALYSIS_SINGLE_WIDTH,
        splitTableWidth: UNIFIED_ANALYSIS_TABLE_WIDTH,
        splitGraphWidth: UNIFIED_ANALYSIS_GRAPH_WIDTH,
        splitMinWidth: UNIFIED_ANALYSIS_SPLIT_MIN_WIDTH
    });
}

function applySalaryModeSizing(container, mode) {
    if (!container) return;
    mode = normalizeResponsiveViewMode(mode);
    var table = container.querySelector('.table-container');
    var graph = container.querySelector('.plotly-graph');
    if (!table || !graph) return;
    applyCompositeViewMode(container, table, graph, mode, {
        layoutWidth: UNIFIED_ANALYSIS_LAYOUT_WIDTH,
        tableOnlyWidth: UNIFIED_ANALYSIS_SINGLE_WIDTH,
        splitTableWidth: UNIFIED_ANALYSIS_TABLE_WIDTH,
        splitGraphWidth: UNIFIED_ANALYSIS_GRAPH_WIDTH,
        splitMinWidth: UNIFIED_ANALYSIS_SPLIT_MIN_WIDTH
    });
}

function renderSalaryChartsFromEntries(containerId, entries, contextLabel) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var list = Array.isArray(entries) ? entries : [];
    var metricDefs = [
        { key: 'avg_salary', label: 'Средняя' },
        { key: 'median_salary', label: 'Медиана' },
        { key: 'mode_salary', label: 'Мода' },
        { key: 'min_salary', label: 'Минимум' },
        { key: 'max_salary', label: 'Максимум' }
    ];
    var preferredCurrencies = ['RUR', 'USD', 'EUR', '%USD'];
    var currencies = [];
    var statuses = [];

    list.forEach(function(entry) {
        if (!entry) return;
        var currency = entry.currency ? String(entry.currency) : '';
        var status = entry.status ? String(entry.status) : '';
        if (currency && currencies.indexOf(currency) === -1) currencies.push(currency);
        if (status && statuses.indexOf(status) === -1) statuses.push(status);
    });

    currencies.sort(function(a, b) {
        var ai = preferredCurrencies.indexOf(a);
        var bi = preferredCurrencies.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });

    if (!currencies.length) currencies = ['RUR'];
    if (!statuses.length) statuses = ['Open', 'Archived'];
    if (statuses.length > 2) statuses = statuses.slice(0, 2);
    var viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    var chartHeight = viewportWidth <= 720
        ? Math.max(300, Math.min(360, Math.round(viewportWidth * 0.76)))
        : 380;

    var signature = list.map(function(entry) {
        return [
            entry && entry.status || '',
            entry && entry.currency || '',
            entry && entry.avg_salary || '',
            entry && entry.median_salary || '',
            entry && entry.mode_salary || '',
            entry && entry.min_salary || '',
            entry && entry.max_salary || ''
        ].join(':');
    }).sort().join('|') + '|' + (contextLabel || '');
    if (container.dataset.plotSignature === signature && container.dataset.plotReady === '1') return;
    container.dataset.plotSignature = signature;
    container.dataset.plotReady = '1';

    container.innerHTML = '<div class="salary-graphs-3">' +
        currencies.map(function(currency) {
            return '<div class="salary-graph-item"><div class="plotly-graph" id="' + containerId + '-' + currency.replace('%', 'p') + '"></div></div>';
        }).join('') +
    '</div>';

    currencies.forEach(function(currency, currencyIdx) {
        var graphElId = containerId + '-' + currency.replace('%', 'p');
        var rowsByStatus = {};
        list.forEach(function(entry) {
            if (!entry || entry.currency !== currency) return;
            rowsByStatus[String(entry.status || '')] = entry;
        });

        var traces = statuses.map(function(status, statusIdx) {
            var row = rowsByStatus[status] || null;
            return {
                x: metricDefs.map(function(metric) {
                    var value = row ? Number(row[metric.key]) : 0;
                    return isFinite(value) ? value : 0;
                }),
                y: metricDefs.map(function(metric) { return metric.label; }),
                name: status || ('Status ' + (statusIdx + 1)),
                type: 'bar',
                orientation: 'h',
                marker: { color: statusIdx === 0 ? CHART_COLORS.light : CHART_COLORS.dark }
            };
        });

        var title = composeChartTitle('Зарплаты · ' + currency, contextLabel);
        var layout = {
            title: {
                text: title,
                x: 0.5,
                xanchor: 'center'
            },
            xaxis: {
                title: 'Значение',
                automargin: true
            },
            yaxis: {
                title: '',
                automargin: true,
                autorange: 'reversed'
            },
            margin: { t: 64, b: 40, l: 150, r: 24 },
            height: chartHeight,
            barmode: 'group',
            showlegend: false,
        };
        var traceSignature = currency + '|' + traces.map(function(trace) {
            return trace.name + ':' + trace.y.join(',');
        }).join('|') + '|' + (contextLabel || '');
        plotIfChangedById(graphElId, traceSignature, traces, layout);
    });
    var salaryStack = container.querySelector('.salary-graphs-3');
    if (salaryStack) {
        ensureStackedChartSwitch(salaryStack, currencies.map(function(currency) {
            var graphNode = document.getElementById(containerId + '-' + currency.replace('%', 'p'));
            return {
                key: currency,
                label: currency,
                el: graphNode ? graphNode.closest('.salary-graph-item') : null
            };
        }));
    }
}
function applySalaryViewMode(expDiv, entries) {
    var mode = normalizeResponsiveViewMode(uiState.salary_view_mode || 'together');
    var mainContent = expDiv.querySelector('.salary-main-content');
    var tableContainer = expDiv.querySelector('.salary-table-container');
    var graphContainer = expDiv.querySelector('.salary-graph-container');
    var graphId = expDiv.querySelector('.plotly-graph').id;
    if (!mainContent || !tableContainer || !graphContainer) return;

    applyCompositeViewMode(mainContent, tableContainer, graphContainer, mode, {
        layoutWidth: UNIFIED_ANALYSIS_LAYOUT_WIDTH,
        tableOnlyWidth: UNIFIED_ANALYSIS_SINGLE_WIDTH,
        splitTableWidth: UNIFIED_ANALYSIS_TABLE_WIDTH,
        splitGraphWidth: UNIFIED_ANALYSIS_GRAPH_WIDTH,
        splitMinWidth: UNIFIED_ANALYSIS_SPLIT_MIN_WIDTH
    });

    if (mode !== 'table') {
        renderSalaryChartsFromEntries(graphId, entries, expDiv.dataset.chartContext || '');
    }

}










