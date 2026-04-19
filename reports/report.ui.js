function openRoleTab(evt, roleId) {
    var i, roleContent;
    roleContent = document.getElementsByClassName("role-content");
    for (i = 0; i < roleContent.length; i++) {
        roleContent[i].classList.remove('role-switch-enter');
        roleContent[i].style.display = "none";
    }
    var targetRole = document.getElementById(roleId);
    if (typeof ensureMyResponsesTab === 'function') ensureMyResponsesTab(targetRole);
    if (typeof ensureResponseCalendarTab === 'function') ensureResponseCalendarTab(targetRole);
    if (typeof ensureTotalsTab === 'function') ensureTotalsTab(targetRole);
    targetRole.style.display = "block";
    targetRole.classList.remove('role-switch-enter');
    targetRole.offsetWidth;
    targetRole.classList.add('role-switch-enter');
    evt.currentTarget.className += " active";
    if (typeof syncDashboardTopbarMeta === 'function') {
        syncDashboardTopbarMeta(targetRole, uiState.global_analysis_type || uiState[getAnalysisStateKey(roleId)] || '');
    }

    var savedType = uiState.global_analysis_type || uiState[getAnalysisStateKey(roleId)] || 'totals';
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

function updateReportLayoutScrollZones() {
    var layout = document.querySelector('.report-layout');
    if (!layout) return;
    layout.classList.remove('report-layout-scroll-ready');
    layout.style.removeProperty('--report-layout-scroll-height');
}

var VIEW_ICON_TABLE = '\u25A4';
var VIEW_ICON_GRAPH = '\u25D4';
var VIEW_ICON_TOGETHER = '\u25EB';

function getViewModeMeta(mode) {
    if (mode === 'table') return { title: 'Таблица', icon: VIEW_ICON_TABLE, className: 'table-btn' };
    if (mode === 'graph') return { title: 'График', icon: VIEW_ICON_GRAPH, className: 'graph-btn' };
    return { title: 'Вместе', icon: VIEW_ICON_TOGETHER, className: 'together-btn' };
}

function getSharedFilterGroupIcon(sectionKey) {
    var key = String(sectionKey || '').trim();
    if (!key) return '';
    var meta = typeof getSharedFilterPanelSectionMeta === 'function'
        ? getSharedFilterPanelSectionMeta(key)
        : null;
    if (meta && meta.icon) return meta.icon;
    var fallbackIcons = {
        'my-filters': 'favorite',
        'roles': 'person',
        'salary': 'payments',
        'responses': 'mail',
        'top': 'format_size',
        'employer': 'business',
        'vacancy': 'work',
        'skills': 'local_fire_department'
    };
    return fallbackIcons[key] || '';
}

function createSharedFilterMaterialIcon(iconName, className) {
    var icon = document.createElement('span');
    icon.className = 'material-symbols-outlined' + (className ? ' ' + className : '');
    icon.setAttribute('aria-hidden', 'true');
    var name = String(iconName || '').trim();
    var svgName = name.replace(/_/g, '-');
    var svgUrl = 'https://api.iconify.design/material-symbols:' + encodeURIComponent(svgName) + '.svg';
    var glyph = document.createElement('span');
    glyph.className = 'shared-filter-material-icon-glyph';
    icon.dataset.icon = name;
    icon.style.display = 'inline-flex';
    icon.style.flex = '0 0 auto';
    icon.style.alignItems = 'center';
    icon.style.justifyContent = 'center';
    icon.style.width = '24px';
    icon.style.height = '24px';
    glyph.style.display = 'inline-block';
    glyph.style.color = 'inherit';
    glyph.style.width = '100%';
    glyph.style.height = '100%';
    glyph.style.backgroundColor = 'currentColor';
    glyph.style.webkitMaskImage = 'url("' + svgUrl + '")';
    glyph.style.maskImage = 'url("' + svgUrl + '")';
    glyph.style.webkitMaskRepeat = 'no-repeat';
    glyph.style.maskRepeat = 'no-repeat';
    glyph.style.webkitMaskPosition = 'center';
    glyph.style.maskPosition = 'center';
    glyph.style.webkitMaskSize = '100% 100%';
    glyph.style.maskSize = '100% 100%';
    icon.textContent = '';
    icon.appendChild(glyph);
    return icon;
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
var DASHBOARD_TOP_NAV_SECTIONS = [
    {
        key: 'dashboard',
        label: 'Дашборд',
        items: [
            { key: 'overview', label: 'Общее' },
            { key: 'top', label: 'Топ' },
            { key: 'market-trends', label: 'Тренды рынка' }
        ]
    },
    {
        key: 'summary',
        label: 'Сравнительный анализ',
        items: [
            { key: 'activity', label: 'Динамика по ролям' },
            { key: 'weekday', label: 'Лидер публикаций' },
            { key: 'skills-monthly', label: 'Стоимость навыков' },
            { key: 'salary', label: 'Вилка по ролям' }
        ]
    },
    { key: 'skills-search', label: 'Поиск вакансий', items: [] },
    { key: 'my-responses', label: 'Мои отклики', items: [] },
    { key: 'responses-calendar', label: 'Календарь', items: [] }
];

function getDashboardTopbarMetaHost() {
    return document.getElementById('dashboard-topbar-meta') || document.querySelector('.dashboard-topbar-meta');
}

function getTopNavigationSection(sectionKey) {
    var key = String(sectionKey || '').trim();
    return DASHBOARD_TOP_NAV_SECTIONS.find(function(section) {
        return section.key === key;
    }) || null;
}

function normalizeTopNavigationSection(analysisType, activeRole) {
    var current = String(analysisType || (activeRole && activeRole.dataset && activeRole.dataset.activeAnalysis) || uiState.global_analysis_type || '').trim();
    if (current === 'skills-search') return 'skills-search';
    if (current === 'my-responses') return 'my-responses';
    if (current === 'responses-calendar') return 'responses-calendar';
    if (uiState.all_roles_active || (activeRole && activeRole.id === 'role-all')) return 'summary';
    if (current === 'totals') return 'dashboard';
    return 'dashboard';
}

function normalizeTopNavigationItem(sectionKey, activeRole, analysisType) {
    var section = getTopNavigationSection(sectionKey);
    if (!section) return '';
    if (!section.items || !section.items.length) return section.key;

    var current = String(analysisType || (activeRole && activeRole.dataset && activeRole.dataset.activeAnalysis) || uiState.global_analysis_type || '').trim();
    if (section.key === 'dashboard') {
        var dashboardMode = String(uiState.totals_dashboard_mode || 'overview').trim();
        return getTopNavigationSection(section.key).items.some(function(item) { return item.key === dashboardMode; }) ? dashboardMode : 'overview';
    }
    if (section.key === 'summary') {
        if (section.items.some(function(item) { return item.key === current; })) return current;
        return 'activity';
    }
    return section.items[0] ? section.items[0].key : section.key;
}

function buildDashboardTopbarButtonHtml(sectionKey, label, isActive, itemKey, extraClass, level) {
    var classes = ['dashboard-topbar-button', 'dashboard-topbar-text-button'];
    if (extraClass) classes.push(extraClass);
    if (isActive) classes.push('active');
    if (level) classes.push('dashboard-topbar-' + level + '-button');
    var attrs = [
        'type="button"',
        'class="' + classes.join(' ') + '"',
        'data-topnav-section="' + escapeHtml(sectionKey) + '"'
    ];
    if (itemKey) attrs.push('data-topnav-item="' + escapeHtml(itemKey) + '"');
    attrs.push('onclick="handleTopNavigationClick(\'' + escapeHtml(sectionKey) + '\'' + (itemKey ? ', \'' + escapeHtml(itemKey) + '\'' : ', null') + ')"');
    return '<button ' + attrs.join(' ') + '><span class="shared-filter-group-title-label">' + escapeHtml(label) + '</span></button>';
}

function clickAnalysisButtonByType(root, analysisType) {
    var container = getActiveRoleContent(root) || root || document;
    var btn = findAnalysisButtonByType(container, analysisType);
    if (btn) {
        btn.click();
        return true;
    }
    return false;
}

function scheduleTopNavigationAction(callback) {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(function() {
            window.requestAnimationFrame(function() {
                callback();
            });
        });
        return;
    }
    setTimeout(callback, 0);
}

function handleTopNavigationClick(sectionKey, itemKey) {
    var section = String(sectionKey || '').trim();
    if (!section) return;
    var targetItem = String(itemKey || '').trim();
    var activeRole = getActiveRoleContent();
    var isFlatAllRolesSection = function(sectionName) {
        return activeRole && activeRole.id === 'role-all' && (
            sectionName === 'skills-search' ||
            sectionName === 'my-responses' ||
            sectionName === 'responses-calendar'
        );
    };

    function exitSummaryIfNeeded(callback) {
        if (isFlatAllRolesSection(section)) {
            callback();
            return;
        }
        if (!uiState.all_roles_active || !uiState.roleSelectionContext || typeof uiState.roleSelectionContext.setSummaryActive !== 'function') {
            callback();
            return;
        }
        uiState.roleSelectionContext.setSummaryActive(false);
        scheduleTopNavigationAction(callback);
    }

    function activateSummary(targetType) {
        var type = targetType || 'activity';
        uiState.global_analysis_type = type;
        if (uiState.roleSelectionContext && typeof uiState.roleSelectionContext.setSummaryActive === 'function') {
            uiState.roleSelectionContext.setSummaryActive(true);
        }
        scheduleTopNavigationAction(function() {
            var summaryRoot = getActiveRoleContent() || document.getElementById('role-all');
            if (!clickAnalysisButtonByType(summaryRoot, type)) {
                syncDashboardTopbarMeta(summaryRoot, type);
            }
        });
    }

    if (section === 'summary') {
        activateSummary(targetItem || normalizeTopNavigationItem('summary', activeRole, uiState.global_analysis_type || 'activity'));
        return;
    }

    if (isFlatAllRolesSection(section)) {
        uiState.global_analysis_type = section;
        scheduleTopNavigationAction(function() {
            var role = getActiveRoleContent() || document.getElementById('role-all');
            if (!role) return;
            if (!clickAnalysisButtonByType(role, section)) {
                syncDashboardTopbarMeta(role, section);
            }
        });
        return;
    }

    exitSummaryIfNeeded(function() {
        var role = getActiveRoleContent();
        if (!role) return;
        if (section === 'dashboard') {
            var dashboardMode = targetItem || normalizeTopNavigationItem('dashboard', role, 'totals');
            uiState.global_analysis_type = 'totals';
            uiState.totals_dashboard_mode = dashboardMode || 'overview';
            if (String(role.dataset && role.dataset.activeAnalysis || '') === 'totals') {
                if (typeof renderGlobalTotalsFiltered === 'function') {
                    renderGlobalTotalsFiltered(role);
                }
            } else if (!clickAnalysisButtonByType(role, 'totals') && typeof renderGlobalTotalsFiltered === 'function') {
                renderGlobalTotalsFiltered(role);
            }
            syncDashboardTopbarMeta(role, 'totals');
            return;
        }
        var targetAnalysis = section;
        if (!clickAnalysisButtonByType(role, targetAnalysis)) {
            if (targetAnalysis === 'totals' && typeof renderGlobalTotalsFiltered === 'function') {
                renderGlobalTotalsFiltered(role);
            }
        }
    });
}

function syncDashboardTopbarMeta(parentRole, analysisType) {
    var host = getDashboardTopbarMetaHost();
    if (!host) return;
    var activeRole = getActiveRoleContent(parentRole);
    if (!activeRole) {
        host.innerHTML = '';
        host.dataset.activeRoleId = '';
        host.dataset.activeAnalysis = '';
        host.dataset.activeTopnavSection = '';
        host.dataset.activeTopnavItem = '';
        return;
    }

    var currentAnalysis = String(analysisType || activeRole.dataset.activeAnalysis || uiState.global_analysis_type || '').trim();
    var sectionKey = normalizeTopNavigationSection(currentAnalysis, activeRole);
    var section = getTopNavigationSection(sectionKey) || getTopNavigationSection('dashboard');
    var activeItem = normalizeTopNavigationItem(sectionKey, activeRole, currentAnalysis);
    var separatorHtml = '<span class="dashboard-topbar-separator" aria-hidden="true">|</span>';
    var hasSecondary = !!(section && section.items && section.items.length);
    var topRows = [];

    topRows.push(
        '<div class="dashboard-topbar-meta-group dashboard-topbar-meta-primary" data-topnav-row="primary">' +
            DASHBOARD_TOP_NAV_SECTIONS.map(function(item) {
                return buildDashboardTopbarButtonHtml(
                    item.key,
                    item.label,
                    item.key === sectionKey,
                    null,
                    'dashboard-topbar-nav-button',
                    'nav'
                );
            }).join(separatorHtml) +
        '</div>'
    );

    topRows.push(
        '<div class="dashboard-topbar-meta-group dashboard-topbar-meta-secondary' + (hasSecondary ? '' : ' is-empty') + '" data-topnav-row="secondary" data-topnav-section="' + escapeHtml(section.key) + '">' +
            (hasSecondary
                ? section.items.map(function(item) {
                    return buildDashboardTopbarButtonHtml(
                        section.key,
                        item.label,
                        item.key === activeItem,
                        item.key,
                        'dashboard-topbar-subnav-button',
                        'subnav'
                    );
                }).join(separatorHtml)
                : '<span class="dashboard-topbar-placeholder" aria-hidden="true">&nbsp;</span>') +
        '</div>'
    );

    host.innerHTML = topRows.join('');
    host.dataset.activeRoleId = activeRole.id || '';
    host.dataset.activeAnalysis = currentAnalysis;
    host.dataset.activeTopnavSection = sectionKey;
    host.dataset.activeTopnavItem = activeItem;
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
            trace.line.shape = trace.line.shape || 'spline';
            if (String(trace.mode || '').indexOf('markers') !== -1) {
                trace.marker = trace.marker || {};
                if (!isFinite(Number(trace.marker.size))) trace.marker.size = 7;
            }
        } else if (trace.type === 'bar') {
            trace.marker = trace.marker || {};
            trace.marker.line = trace.marker.line || {};
            if (!isFinite(Number(trace.marker.line.width))) trace.marker.line.width = 0;
            if (!isFinite(Number(trace.opacity))) trace.opacity = 0.94;
        }
    });
}
function normalizeUnifiedChartLayout(data, layout) {
    if (!layout || typeof layout !== 'object') return;
    var traces = Array.isArray(data) ? data.filter(Boolean) : [];
    var isHorizontal = isHorizontalBarChartData(traces);
    layout.height = resolveUnifiedChartHeight(traces);
    layout.autosize = true;
    applyIosChartDefaults(layout, traces);
    layout.margin.t = Math.max(Number(layout.margin.t) || 0, 8);
    layout.margin.b = isHorizontal ? Math.max(Number(layout.margin.b) || 0, 28) : Math.max(Number(layout.margin.b) || 0, 20);
    Object.keys(layout).forEach(function(key) {
        if (!/^(x|y)axis\d*$/.test(key)) return;
        var axis = layout[key];
        if (!axis || typeof axis !== 'object') return;
        axis.tickfont = axis.tickfont || {};
        axis.tickfont.family = layout.font && layout.font.family ? layout.font.family : axis.tickfont.family;
    });
    layout.xaxis.automargin = true;
    layout.yaxis.automargin = true;
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
function getDashboardCssVar(name, fallback) {
    if (typeof window === 'undefined' || !window.getComputedStyle || !document || !document.documentElement) {
        return fallback;
    }
    var value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
    value = String(value || '').trim();
    return value || fallback;
}
function getDashboardChartFontFamily() {
    return getDashboardCssVar('--chart-font-family', "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
}
function getDashboardChartSecondaryTextColor() {
    return getDashboardCssVar('--text-secondary', '#6c7680');
}
function getDashboardChartSecondaryTextSize() {
    var raw = getDashboardCssVar('--chart-secondary-font-size', '0.8rem');
    if (/px$/i.test(raw)) return parseFloat(raw);
    if (/rem$/i.test(raw)) {
        var rootSize = 16;
        if (typeof window !== 'undefined' && window.getComputedStyle && document && document.documentElement) {
            rootSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || rootSize;
        }
        return parseFloat(raw) * rootSize;
    }
    return parseFloat(raw) || 12.8;
}
function getDonutGradientStopsByKey(gradientKey) {
    if (gradientKey === 'active') {
        return [CHART_COLORS.selectedStart, CHART_COLORS.selectedMid, CHART_COLORS.selectedEnd];
    }
    if (gradientKey === 'new') {
        return ['#8fe9f7', '#49c8f2', '#5f95ff'];
    }
    if (gradientKey === 'archived') {
        return ['#f38bff', '#8b5cf6'];
    }
    if (gradientKey === 'published-archived') {
        return ['#efc3ff', '#d79cfb', '#b58cff'];
    }
    return [CHART_COLORS.selectedStart, CHART_COLORS.selectedMid, CHART_COLORS.selectedEnd];
}
function applyIosChartDefaults(layout, traces) {
    if (!layout || typeof layout !== 'object') return;
    var fontFamily = getDashboardChartFontFamily();
    var secondaryTextColor = getDashboardChartSecondaryTextColor();
    var secondaryTextSize = getDashboardChartSecondaryTextSize();
    var isHorizontal = isHorizontalBarChartData(traces);
    layout.font = layout.font || {};
    layout.font.family = fontFamily;
    layout.font.color = layout.font.color || '#334155';
    layout.paper_bgcolor = 'rgba(0,0,0,0)';
    layout.plot_bgcolor = 'rgba(0,0,0,0)';
    layout.colorway = layout.colorway || [
        CHART_COLORS.selectedStart,
        CHART_COLORS.selectedMid,
        CHART_COLORS.selectedEnd,
        CHART_COLORS.excludedStart,
        CHART_COLORS.excludedEnd,
        CHART_COLORS.selectedMid
    ];
    layout.hoverlabel = layout.hoverlabel || {};
    layout.hoverlabel.bgcolor = 'rgba(15, 23, 42, 0.96)';
    layout.hoverlabel.bordercolor = 'rgba(148, 163, 184, 0.24)';
    layout.hoverlabel.font = layout.hoverlabel.font || {};
    layout.hoverlabel.font.family = fontFamily;
    layout.hoverlabel.font.color = '#f8fafc';
    layout.margin = layout.margin || {};
    layout.margin.t = Math.max(12, Number(layout.margin.t) || 0);
    layout.margin.b = Math.max(Number(layout.margin.b) || 0, 18);
    layout.margin.l = Math.max(Number(layout.margin.l) || 0, isHorizontal ? 170 : 52);
    layout.margin.r = Math.max(Number(layout.margin.r) || 0, 18);
    layout.xaxis = layout.xaxis || {};
    layout.yaxis = layout.yaxis || {};
    [layout.xaxis, layout.yaxis].forEach(function(axis) {
        if (!axis || typeof axis !== 'object') return;
        axis.automargin = true;
        axis.showgrid = axis.showgrid !== false;
        axis.gridcolor = axis.gridcolor || 'rgba(148, 163, 184, 0.16)';
        axis.zeroline = false;
        axis.linecolor = axis.linecolor || 'rgba(148, 163, 184, 0.22)';
        axis.tickfont = axis.tickfont || {};
        axis.tickfont.family = fontFamily;
        axis.tickfont.size = axis.tickfont.size || secondaryTextSize;
        axis.tickfont.color = axis.tickfont.color || secondaryTextColor;
    });
    if (isHorizontal) {
        layout.yaxis.autorange = 'reversed';
        layout.bargap = layout.bargap !== undefined ? layout.bargap : 0.28;
        layout.bargroupgap = layout.bargroupgap !== undefined ? layout.bargroupgap : 0.04;
    }
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
    if (text === 'Все' || text === 'По выбранному периоду' || text === 'За все время' || text === 'За период') return 'Весь период';
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
        var normalizedExplicitContext = explicitContext.replace(/^Период:\s*/i, '');
        if (normalizedExplicitContext.indexOf('Опыт:') !== -1) return normalizedExplicitContext;
        return normalizedExplicitContext + ' · Опыт: ' + explicitExperience;
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
    if (!fallback) return 'Весь период · Опыт: все категории';
    var normalizedFallback = fallback.replace(/^Период:\s*/i, '');
    if (normalizedFallback.indexOf('Опыт:') !== -1) return normalizedFallback;
    return normalizedFallback + ' · Опыт: все категории';
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
            { x: archivedData, y: experiences, name: 'Архивные', type: 'bar', orientation: 'h', marker: { color: CHART_COLORS.negative } }
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
            { x: archs, y: days, name: 'Архивации', type: 'bar', orientation: 'h', marker: { color: CHART_COLORS.negative } }
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
        var salaryStatusColors = [CHART_COLORS.selectedStart, CHART_COLORS.excludedEnd];
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
                marker: { color: salaryStatusColors }
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
            { x: labels, y: archivedVals, customdata: fullLabels, type: 'scatter', mode: 'lines+markers', name: 'Архивные', line: { color: CHART_COLORS.negative }, hovertemplate: '%{customdata}<br>%{fullData.name}: %{y}<extra></extra>' }
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
        ensureStackedChartLayout(activityStack, [
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
            { x: archVals, y: labels, customdata: fullLabels, type: 'bar', orientation: 'h', name: 'Архивы/день', marker: { color: CHART_COLORS.negative }, hovertemplate: '%{customdata}<br>%{fullData.name}: %{x}<extra></extra>' }
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
            { key: 'avg_salary', label: 'Средняя', color: '#7B61E8' },
            { key: 'median_salary', label: 'Медианная', color: CHART_COLORS.selectedMid },
            { key: 'mode_salary', label: 'Мода', color: '#00AADF' },
            { key: 'min_salary', label: 'Минимальная', color: CHART_COLORS.selectedStart },
            { key: 'max_salary', label: 'Максимальная', color: CHART_COLORS.selectedEnd }
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

function isRespondedVacancy(vacancy) {
    return !!(vacancy && (normalizeSendResumeValue(vacancy.send_resume) || vacancy.__is_response_item === true));
}

function syncLocalVacanciesWithResponses(responseItems) {
    var responseMap = new Map();
    (responseItems || []).forEach(function(item) {
        getMyResponseIdCandidates(item).forEach(function(id) {
            if (!responseMap.has(id)) responseMap.set(id, item || {});
        });
    });
    var roleContents = [];
    if (typeof getSelectableRoleContents === 'function') {
        roleContents = getSelectableRoleContents();
    } else {
        roleContents = Array.from(document.querySelectorAll('.role-content')).filter(function(node) {
            return /^role-\d+$/.test(String(node.id || ''));
        });
    }
    roleContents.forEach(function(roleContent) {
        var vacancies = (typeof getRoleVacancies === 'function') ? getRoleVacancies(roleContent) : [];
        (vacancies || []).forEach(function(vacancy) {
            if (!vacancy) return;
            var matchedResponse = null;
            getMyResponseIdCandidates(vacancy).some(function(id) {
                if (!responseMap.has(id)) return false;
                matchedResponse = responseMap.get(id);
                return true;
            });
            if (matchedResponse) {
                vacancy.send_resume = true;
                vacancy.resume_at = matchedResponse.resume_at || null;
                vacancy.updated_at = matchedResponse.updated_at || vacancy.updated_at || null;
                vacancy.__is_response_item = true;
                return;
            }
            vacancy.send_resume = false;
            vacancy.resume_at = null;
            vacancy.__is_response_item = false;
        });
    });
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
        return isRespondedVacancy(vacancy);
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
    var apiBaseUrl = typeof getReportApiBaseUrl === 'function' ? getReportApiBaseUrl() : '';
    var endpoint = apiBaseUrl + '/api/vacancies/responses?_ts=' + nonce;
    var fallbackEndpoint = 'http://localhost:9000/api/vacancies/responses?_ts=' + nonce;
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
            var normalizedItems = items.map(function(item) {
                var row = Object.assign({}, item || {});
                var sendResumeRaw = row.send_resume;
                var sendResumeEmpty = sendResumeRaw === null || sendResumeRaw === undefined || String(sendResumeRaw).trim() === '';
                if (sendResumeEmpty) row.send_resume = true;
                row.__is_response_item = true;
                return row;
            });
            syncLocalVacanciesWithResponses(normalizedItems);
            uiState.my_responses_cache = normalizedItems.slice();
            uiState.my_responses_cache_loaded = true;
            return normalizedItems;
        });
    }
    if (window.location && window.location.protocol === 'file:') {
        return doGet(fallbackEndpoint);
    }
    return doGet(endpoint).catch(function() {
        if (String(window.location && window.location.origin || '').indexOf('localhost:9000') >= 0) throw new Error('responses_api_failed');
        return doGet(fallbackEndpoint);
    });
}

function getMyResponseIdCandidates(item) {
    if (!item || typeof item !== 'object') return [];
    var values = [item.id, item.vacancy_id, item.vacancyId, item.hh_id, item.hhId];
    var seen = new Set();
    var out = [];
    values.forEach(function(value) {
        var normalized = String(value === null || value === undefined ? '' : value).trim();
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        out.push(normalized);
    });
    return out;
}

function parseMyResponsePeriodDate(item) {
    if (!item || typeof item !== 'object') return null;
    return parsePublishedAtDate(item.resume_at)
        || parsePublishedAtDate(item.published_at)
        || parsePublishedAtDate(item.created_at)
        || parsePublishedAtDate(item.updated_at)
        || null;
}

function getLatestDateFromItems(vacancies, dateGetter) {
    var list = Array.isArray(vacancies) ? vacancies : [];
    var maxDate = null;
    list.forEach(function(vacancy) {
        var d = typeof dateGetter === 'function' ? dateGetter(vacancy) : null;
        if (!d) return;
        if (!maxDate || d > maxDate) maxDate = d;
    });
    return maxDate;
}

function getLatestMyResponseDate(vacancies) {
    return getLatestDateFromItems(vacancies, parseMyResponsePeriodDate);
}

function getLatestResponseCalendarDate(vacancies) {
    return getLatestDateFromItems(vacancies, function(item) {
        return parseInterviewDateValue(item && item.interview_date);
    });
}

function filterMyResponsesBySelectedPeriods(vacancies, selectedPeriods) {
    return filterItemsBySelectedPeriods(vacancies, selectedPeriods, parseMyResponsePeriodDate, getLatestMyResponseDate);
}

function filterResponseCalendarBySelectedPeriods(vacancies, selectedPeriods) {
    return filterItemsBySelectedPeriods(vacancies, selectedPeriods, function(item) {
        return parseInterviewDateValue(item && item.interview_date);
    }, getLatestResponseCalendarDate);
}

function filterItemsBySelectedPeriods(vacancies, selectedPeriods, dateGetter, getLatestDate) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var labels = Array.isArray(selectedPeriods) ? selectedPeriods.filter(Boolean) : [];
    if (!labels.length) return list;
    var hasSummarySelection = labels.some(function(label) {
        var text = String(label || '').trim();
        return text === 'За период' || text === 'Весь период' || text === 'За все время' || isSummaryMonth(text);
    });
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
    var availableMonths = [];
    var seenMonths = new Set();
    list.forEach(function(v) {
        var d = typeof dateGetter === 'function' ? dateGetter(v) : null;
        if (!d) return;
        var month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        if (seenMonths.has(month)) return;
        seenMonths.add(month);
        availableMonths.push(month);
    });
    if (maxQuickDays > 0 || useToday) {
        maxDate = typeof getLatestDate === 'function' ? getLatestDate(list) : null;
        if (maxDate && maxQuickDays > 0) quickCutoff = new Date(maxDate.getTime() - maxQuickDays * 24 * 60 * 60 * 1000);
    }
    if (hasSummarySelection && !monthSet.size && !quickCutoff && !useToday && availableMonths.length === 1) {
        monthSet.add(availableMonths[0]);
    }
    if (!monthSet.size && !quickCutoff && !useToday) return list;

    var hasAnyPeriodDate = list.some(function(v) { return !!(typeof dateGetter === 'function' ? dateGetter(v) : null); });
    if (!hasAnyPeriodDate) return list;

    return list.filter(function(v) {
        var d = typeof dateGetter === 'function' ? dateGetter(v) : null;
        if (!d) return false;
        var month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        if (monthSet.has(month)) return true;
        if (useToday && maxDate && isSameCalendarDay(d, maxDate)) return true;
        if (quickCutoff && d >= quickCutoff) return true;
        return false;
    });
}

function applyMyResponsesGlobalFilters(parentRole, vacancies) {
    var source = Array.isArray(vacancies)
        ? vacancies.slice()
        : getMergedMyResponseFilterSource(parentRole);
    var analysisType = (parentRole && parentRole.dataset && parentRole.dataset.activeAnalysis) || 'my-responses';
    var list = getFilteredVacanciesForAnalysis(parentRole, analysisType, {
        sourceVacancies: source,
        respondedOnly: true,
        useResponsePeriods: analysisType !== 'responses-calendar',
        useCalendarPeriods: analysisType === 'responses-calendar'
    });
    list.sort(function(a, b) {
        var aTs = Date.parse(a && (a.resume_at || a.published_at) ? (a.resume_at || a.published_at) : '') || 0;
        var bTs = Date.parse(b && (b.resume_at || b.published_at) ? (b.resume_at || b.published_at) : '') || 0;
        return bTs - aTs;
    });
    return list;
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
function isArchivedResponseVacancy(item) {
    return !!(item && (item.archived === true || item.archived === 1 || item.archived === '1' || item.archived === 'true' || item.archived_at));
}
function getMyResponseStatusLabel(item) {
    return isArchivedResponseVacancy(item) ? 'Архивная' : 'Открытая';
}
function getMyResponsesCountryFilterValue(item) {
    var country = String(item && item.country || '').trim();
    if (!country) return 'none';
    return country === 'Россия' ? 'ru' : 'not_ru';
}
function normalizeMyResponsesCurrencyFilter(value) {
    var normalized = normalizeTotalsCurrency(value || '');
    return ['RUR', 'USD', 'EUR'].indexOf(normalized) >= 0 ? normalized : 'all';
}
function normalizeMyResponsesOfferFilter(value) {
    var normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'yes' || normalized === 'true' || normalized === 'with') return 'yes';
    if (normalized === 'no' || normalized === 'false' || normalized === 'without') return 'no';
    return 'all';
}
function isResponsesCalendarAnalysis(analysisType) {
    return analysisType === 'my-responses' || analysisType === 'responses-calendar';
}
function findMyResponseItemById(vacancyId) {
    var id = String(vacancyId || '').trim();
    if (!id) return null;
    var cache = Array.isArray(uiState.my_responses_cache) ? uiState.my_responses_cache : [];
    for (var i = 0; i < cache.length; i++) {
        var item = cache[i];
        var ids = getMyResponseIdCandidates(item);
        if (ids.indexOf(id) >= 0) return item;
    }
    return null;
}
function getResponseCalendarMonthStateKey(parentRole) {
    return 'responses_calendar_month_' + String((parentRole && parentRole.id) || '');
}
function getResponseCalendarSelectedDayStateKey(parentRole) {
    return 'responses_calendar_selected_day_' + String((parentRole && parentRole.id) || '');
}
function formatCalendarMonthKey(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}
function parseCalendarMonthKey(value) {
    var text = String(value || '').trim();
    var match = text.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    if (!isFinite(year) || !isFinite(month) || month < 1 || month > 12) return null;
    return new Date(year, month - 1, 1);
}
function shiftCalendarMonthKey(monthKey, delta) {
    var base = parseCalendarMonthKey(monthKey) || new Date();
    base = new Date(base.getFullYear(), base.getMonth() + Number(delta || 0), 1);
    return formatCalendarMonthKey(base);
}
function parseInterviewDateValue(value) {
    var text = String(value || '').trim();
    if (!text) return null;
    var date = new Date(text);
    if (isNaN(date.getTime())) return null;
    return date;
}
function getResponseCalendarNowTimestamp() {
    return Date.now();
}
function hasInterviewDetailsBeyondSchedule(item) {
    if (!item || typeof item !== 'object') return false;
    var keys = ['hr_name', 'interview_stages', 'company_type', 'result', 'feedback', 'offer_salary', 'pros', 'cons'];
    return keys.some(function(key) {
        var value = item[key];
        return value !== null && value !== undefined && String(value).trim() !== '';
    });
}
function isResponseCalendarPendingResultItem(item) {
    var interviewDate = parseInterviewDateValue(item && item.interview_date);
    if (!interviewDate) return false;
    if (interviewDate.getTime() >= getResponseCalendarNowTimestamp()) return false;
    var updatedAt = parseInterviewDateValue(item && item.updated_at);
    if (!updatedAt) return true;
    return updatedAt.getTime() < interviewDate.getTime();
}
function formatInterviewTimeLabel(value) {
    var date = parseInterviewDateValue(value);
    if (!date) return 'Без времени';
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}
function formatCalendarDayKey(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}
function formatCalendarDayLabel(dayKey) {
    var date = parseInterviewDateValue(dayKey);
    if (!date) return 'Выберите дату';
    var weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return weekdays[date.getDay()] + ', ' + date.getDate() + ' ' + months[date.getMonth()];
}
function formatCalendarMonthLabel(monthKey) {
    var date = parseCalendarMonthKey(monthKey);
    if (!date) return 'Календарь';
    var months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
    return months[date.getMonth()] + ' ' + date.getFullYear();
}
function getResponseCalendarMonthPickerOpenStateKey(parentRole) {
    return 'responses_calendar_month_picker_open_' + String((parentRole && parentRole.id) || '');
}
function getResponseCalendarMonthPickerYearStateKey(parentRole) {
    return 'responses_calendar_month_picker_year_' + String((parentRole && parentRole.id) || '');
}
function buildResponseCalendarMonthPickerHtml(parentRole, monthKey) {
    var selectedDate = parseCalendarMonthKey(monthKey) || new Date();
    var openKey = getResponseCalendarMonthPickerOpenStateKey(parentRole);
    var yearKey = getResponseCalendarMonthPickerYearStateKey(parentRole);
    var pickerOpen = uiState[openKey] === true;
    var pickerYear = Number(uiState[yearKey]);
    if (!isFinite(pickerYear)) pickerYear = selectedDate.getFullYear();
    var monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return '' +
        '<div class="response-calendar-month-picker-wrap' + (pickerOpen ? ' is-open' : '') + '">' +
            '<button type="button" class="response-calendar-month-picker-shell" aria-label="Выбрать месяц" aria-expanded="' + (pickerOpen ? 'true' : 'false') + '">' +
                '<span class="response-calendar-month-picker-value">' + escapeHtml(formatCalendarMonthLabel(monthKey)) + '</span>' +
                '<span class="response-calendar-month-picker-icon" aria-hidden="true">▾</span>' +
            '</button>' +
            (pickerOpen ? (
                '<div class="response-calendar-month-popover">' +
                    '<div class="response-calendar-month-popover-head">' +
                        '<button type="button" class="response-calendar-month-year-btn" data-shift="-1" aria-label="Предыдущий год">‹</button>' +
                        '<div class="response-calendar-month-year-label">' + pickerYear + '</div>' +
                        '<button type="button" class="response-calendar-month-year-btn" data-shift="1" aria-label="Следующий год">›</button>' +
                    '</div>' +
                    '<div class="response-calendar-month-grid">' +
                        monthNames.map(function(label, index) {
                            var optionKey = pickerYear + '-' + String(index + 1).padStart(2, '0');
                            var isActive = optionKey === monthKey;
                            return '<button type="button" class="response-calendar-month-option' + (isActive ? ' active' : '') + '" data-month-key="' + optionKey + '">' + label + '</button>';
                        }).join('') +
                    '</div>' +
                '</div>'
            ) : '') +
        '</div>';
}
function buildMyResponseSummaryRows(vacancyId, item, source) {
    var merged = Object.assign({}, source || {}, item || {});
    var responseIds = getMyResponseIdCandidates(merged);
    var resolvedId = String(vacancyId || responseIds[0] || (source && source.id) || '').trim();
    return [
        { label: 'ID', value: resolvedId },
        { label: 'Название', value: merged.name },
        { label: 'Работодатель', value: merged.employer },
        { label: 'Город', value: merged.city },
        { label: 'Страна', value: merged.country || '—' },
        { label: 'ЗП от', value: formatCompactThousandsValue(merged.salary_from) },
        { label: 'ЗП до', value: formatCompactThousandsValue(merged.salary_to) },
        { label: 'Валюта', value: merged.currency || merged.salary_currency || '—' },
        { label: 'Оффер', value: formatMyResponseOfferValue(merged) },
        { label: 'Дата отклика', value: formatResumeAtValue(merged.resume_at) },
        { label: 'Дата изменения', value: formatResumeAtValue(merged.updated_at) },
        { label: 'Дата публикации', value: formatResumeAtValue(merged.published_at || merged.created_at) },
        { label: 'Статус', value: getMyResponseStatusLabel(merged) },
        { label: 'Дата архивации', value: formatResumeAtValue(merged.archived_at) }
    ];
}
function buildMyResponseEmployerRows(item, source) {
    var merged = Object.assign({}, source || {}, item || {});
    function formatBool(value) {
        var text = String(value === null || value === undefined ? '' : value).trim().toLowerCase();
        if (!text) return '—';
        if (text === 'true' || text === '1' || text === 'да' || text === 'yes') return 'Да';
        if (text === 'false' || text === '0' || text === 'нет' || text === 'no') return 'Нет';
        return String(value);
    }
    var employerUrl = String(merged.employer_url || '').trim();
    return [
        { label: 'Название', value: merged.employer },
        { label: 'ИТ-аккредитация', value: formatBool(merged.employer_accredited) },
        { label: 'Надёжный работодатель', value: formatBool(merged.employer_trusted) },
        { label: 'Рейтинг', value: merged.employer_rating },
        {
            label: 'Ссылка',
            html: employerUrl
                ? '<a class="my-responses-title-link" href="' + escapeHtml(employerUrl) + '" target="_blank" rel="noopener">' + escapeHtml(employerUrl) + '</a>'
                : ''
        }
    ].filter(function(row) {
        var value = row.html !== undefined ? row.html : row.value;
        return value !== null && value !== undefined && String(value).trim() !== '' && String(value).trim() !== '—';
    });
}
function buildMyResponseReadonlyHtml(vacancyId, item, source, details) {
    var merged = Object.assign({}, source || {}, item || {}, details || {});
    var summaryRows = buildMyResponseSummaryRows(vacancyId, merged, source).filter(function(row) {
        return row.value !== null && row.value !== undefined && String(row.value).trim() !== '';
    });
    var employerRows = buildMyResponseEmployerRows(merged, source);
    var detailsRows = [
        { label: 'Навыки', value: merged.skills },
        { label: 'Требования', value: merged.requirement },
        { label: 'Обязанности', value: merged.responsibility },
        { label: 'Описание', value: merged.description }
    ].filter(function(row) {
        return row.value !== null && row.value !== undefined && String(row.value).trim() !== '';
    });

    if (!summaryRows.length && !detailsRows.length) {
        return '<div class="skills-search-summary">Подробности по вакансии не заполнены</div>';
    }

    var sections = [];
    if (summaryRows.length) {
        sections.push(
            '<section class="my-response-details-readonly-section">' +
                '<div class="my-response-details-section-title">Сводка отклика</div>' +
                '<div class="my-response-details-summary-grid">' +
                    summaryRows.map(function(row) {
                        return '<div class="my-response-details-summary-card">' +
                            '<div class="my-response-details-readonly-title">' + escapeHtml(row.label) + '</div>' +
                            '<div class="my-response-details-value">' + (row.html !== undefined ? row.html : formatCell(row.value)) + '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' +
            '</section>'
        );
    }
    if (employerRows.length) {
        sections.push(
            '<section class="my-response-details-readonly-section">' +
                '<div class="my-response-details-section-title">Работодатель</div>' +
                '<div class="my-response-details-summary-grid">' +
                    employerRows.map(function(row) {
                        return '<div class="my-response-details-summary-card">' +
                            '<div class="my-response-details-readonly-title">' + escapeHtml(row.label) + '</div>' +
                            '<div class="my-response-details-value">' + (row.html !== undefined ? row.html : formatCell(row.value)) + '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' +
            '</section>'
        );
    }
    if (detailsRows.length) {
        sections.push(
            '<section class="my-response-details-readonly-section">' +
                '<div class="my-response-details-section-title">Детали отклика</div>' +
                '<div class="my-response-details-readonly-grid">' +
                    detailsRows.map(function(row) {
                        return '<section class="my-response-details-readonly-block">' +
                            '<div class="my-response-details-readonly-title">' + escapeHtml(row.label) + '</div>' +
                            '<div class="my-response-details-value">' + formatCell(row.value) + '</div>' +
                        '</section>';
                    }).join('') +
                '</div>' +
            '</section>'
        );
    }
    return sections.join('');
}
function buildMyResponseTitleCell(vacancy) {
    var responseIds = getMyResponseIdCandidates(vacancy);
    var id = responseIds.length ? responseIds[0] : '';
    var title = String(vacancy && vacancy.name || '').trim() || '—';
    var linkUrl = id ? 'https://surgut.hh.ru/vacancy/' + encodeURIComponent(id) : '';
    var inner = '<span class="my-responses-title-main">' + escapeHtml(title) + '</span>';
    return linkUrl
        ? '<a class="my-responses-title-link" href="' + escapeHtml(linkUrl) + '" target="_blank" rel="noopener">' + inner + '</a>'
        : '<span class="my-responses-title-link">' + inner + '</span>';
}
function formatCompactThousandsValue(value) {
    var text = String(value === null || value === undefined ? '' : value).trim();
    if (!text) return '—';
    var normalized = text.replace(/\s+/g, '').replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) return escapeHtml(text);
    var numberValue = Number(normalized);
    if (!isFinite(numberValue)) return escapeHtml(text);
    if (Math.abs(numberValue) >= 1000) return escapeHtml(String(Math.round(numberValue / 1000)) + 'К');
    return escapeHtml(String(Math.round(numberValue)));
}
function formatMyResponseOfferValue(item) {
    if (!item || typeof item !== 'object') return '—';
    var raw = item.offer_salary;
    if ((raw === null || raw === undefined || String(raw).trim() === '') && Object.prototype.hasOwnProperty.call(item, 'offer')) {
        raw = item.offer;
    }
    var text = String(raw || '').trim();
    if (text) return formatCompactThousandsValue(text);
    var resultText = String(item.result || '').trim().toLowerCase();
    if (resultText.indexOf('оффер') >= 0 || resultText.indexOf('offer') >= 0) return 'Да';
    return '—';
}
function hasInterviewContent(item) {
    return hasInterviewDetailsBeyondSchedule(item);
}
function hasScheduledInterview(item) {
    return !!parseInterviewDateValue(item && item.interview_date);
}
function hasResultContent(item) {
    return !!String((item && item.result) || '').trim();
}
function hasOfferContent(item) {
    if (!item || typeof item !== 'object') return false;
    var value = item.offer_salary;
    if ((value === null || value === undefined || String(value).trim() === '') && Object.prototype.hasOwnProperty.call(item, 'offer')) {
        value = item.offer;
    }
    return value !== null && value !== undefined && String(value).trim() !== '';
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
            var sourceIds = getMyResponseIdCandidates(v);
            if (sourceIds.indexOf(id) >= 0) return v;
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
    var asArchiveIcon = function(v) {
        var isArchived = isArchivedResponseVacancy(v);
        var cls = isArchived ? 'status-icon-archived' : 'status-icon-open';
        var title = isArchived ? 'Архивная' : 'Открытая';
        return '<span class="status-icon ' + cls + '" title="' + title + '" aria-label="' + title + '"></span>';
    };
    var rows = vacancies.map(function(v) {
        var responseIds = getMyResponseIdCandidates(v);
        var vacancyId = responseIds.length ? responseIds[0] : '';
        var source = null;
        for (var i = 0; i < responseIds.length; i++) {
            source = findVacancySourceById(responseIds[i]);
            if (source) break;
        }
        var linkUrl = vacancyId ? 'https://surgut.hh.ru/vacancy/' + encodeURIComponent(vacancyId) : '';
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
        var isInterviewFilled = !!(v && (v.interview_filled === true || v.interview_filled === 1 || v.interview_filled === 'true' || hasInterviewContent(v)));
        var interviewIcon = '🖉';
        var interviewTitle = isInterviewFilled ? 'Заполнено' : 'Заполнить';
        var interviewCell = vacancyId
            ? '<button type="button" class="my-responses-details-link ' + (isInterviewFilled ? 'is-details' : 'is-fill') + '" data-vacancy-id="' + escapeHtml(vacancyId) + '" title="' + interviewTitle + '" aria-label="' + interviewTitle + '" onclick="openMyResponseDetailsModal(this.dataset.vacancyId); return false;">' + interviewIcon + '</button>'
            : '—';
        var offerCell = formatMyResponseOfferValue(v);
        var salaryFromNum = Number(v.salary_from);
        var salaryToNum = Number(v.salary_to);
        var salaryFromSort = isFinite(salaryFromNum) ? String(salaryFromNum) : '';
        var salaryToSort = isFinite(salaryToNum) ? String(salaryToNum) : '';
        return '<tr>' +
            '<td>' + buildMyResponseTitleCell(v) + '</td>' +
            '<td>' + employerCell + '</td>' +
            '<td>' + formatCell(v.city) + '</td>' +
            '<td data-sort-num="' + salaryFromSort + '">' + formatCompactThousandsValue(v.salary_from) + '</td>' +
            '<td data-sort-num="' + salaryToSort + '">' + formatCompactThousandsValue(v.salary_to) + '</td>' +
            '<td>' + offerCell + '</td>' +
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
                    '<th>Название</th>' +
                    '<th>Работодатель</th>' +
                    '<th>Город</th>' +
                    '<th class="salary-sortable">ЗП от</th>' +
                    '<th class="salary-sortable">ЗП до</th>' +
                    '<th>Оффер</th>' +
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

function renderMyResponsesPanels(block, parentRole, list) {
    if (!block) return;
    var responsesWrap = block.querySelector('.skills-search-results');
    if (!responsesWrap) return;
    responsesWrap.style.display = 'block';
    responsesWrap.innerHTML = '<div class="skills-search-summary">Найдено откликов: ' + list.length + '</div>' + buildMyResponsesTableHtml(list);
}
function renderMyResponsesContent(parentRole) {
    if (!parentRole) return;
    if (typeof ensureMyResponsesTab === 'function') ensureMyResponsesTab(parentRole);
    var block = parentRole.querySelector('.my-responses-content');
    if (!block) return;
    block.querySelectorAll('.my-responses-mode-tabs, .my-responses-efficiency').forEach(function(node) {
        node.remove();
    });
    var responsesWrap = block.querySelector('.skills-search-results');
    if (!responsesWrap) {
        block.insertAdjacentHTML('beforeend',
            '<div class="skills-search-results my-responses-results"><div class="skills-search-hint">Нет откликов</div></div>');
        responsesWrap = block.querySelector('.skills-search-results');
    }
    if (!responsesWrap) return;
    responsesWrap.innerHTML = '<div class="skills-search-summary">Загрузка откликов...</div>';
    fetchMyResponsesVacancies().then(function(vacancies) {
        var list = Array.isArray(vacancies) ? vacancies : [];
        list = applyMyResponsesGlobalFilters(parentRole, list);
        block._data = block._data || {};
        block._data.responses = list;
        renderMyResponsesPanels(block, parentRole, list);
    }).catch(function() {
        var local = collectMyResponsesVacancies();
        local = applyMyResponsesGlobalFilters(parentRole, local);
        block._data = block._data || {};
        block._data.responses = local;
        renderMyResponsesPanels(block, parentRole, local);
    });
}

function fetchMyResponseDetails(vacancyId) {
    var id = String(vacancyId || '').trim();
    if (!id) return Promise.reject(new Error('vacancy_id_required'));
    var apiBaseUrl = typeof getReportApiBaseUrl === 'function' ? getReportApiBaseUrl() : '';
    var endpoint = apiBaseUrl + '/api/vacancies/details?vacancy_id=' + encodeURIComponent(id);
    var fallbackEndpoint = 'http://localhost:9000/api/vacancies/details?vacancy_id=' + encodeURIComponent(id);
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
        if (String(window.location && window.location.origin || '').indexOf('localhost:9000') >= 0) throw new Error('details_api_failed');
        return doGet(fallbackEndpoint);
    });
}

function saveMyResponseDetails(vacancyId, fields, forceOverwrite) {
    var id = String(vacancyId || '').trim();
    if (!id) return Promise.reject(new Error('vacancy_id_required'));
    var apiBaseUrl = typeof getReportApiBaseUrl === 'function' ? getReportApiBaseUrl() : '';
    var endpoint = apiBaseUrl + '/api/vacancies/details';
    var fallbackEndpoint = 'http://localhost:9000/api/vacancies/details';
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
        if (String(window.location && window.location.origin || '').indexOf('localhost:9000') >= 0) throw new Error('save_details_api_failed');
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

function formatCalendarEventTime(item) {
    return formatInterviewTimeLabel(item && item.interview_date);
}

function getResponseCalendarGridRange(monthKey) {
    var monthDate = parseCalendarMonthKey(monthKey) || new Date();
    var monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    var monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    var mondayOffset = (monthStart.getDay() + 6) % 7;
    var gridStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() - mondayOffset);
    var sundayOffset = 6 - ((monthEnd.getDay() + 6) % 7);
    var gridEnd = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + sundayOffset);
    return {
        monthDate: monthDate,
        monthStart: monthStart,
        gridStart: gridStart,
        gridEnd: gridEnd
    };
}

function resolveResponseCalendarInitialMonthKey(items) {
    var futureDates = [];
    var pastDates = [];
    var nowTs = Date.now();
    (items || []).forEach(function(item) {
        var date = parseInterviewDateValue(item && item.interview_date);
        if (!date) return;
        if (date.getTime() >= nowTs) futureDates.push(date);
        else pastDates.push(date);
    });
    futureDates.sort(function(left, right) { return left.getTime() - right.getTime(); });
    pastDates.sort(function(left, right) { return right.getTime() - left.getTime(); });
    return formatCalendarMonthKey(futureDates[0] || pastDates[0] || new Date());
}

function resolveResponseCalendarItemTimestamp(item) {
    return Date.parse(item && item.interview_date ? item.interview_date : '') || 0;
}

function resolveResponseCalendarItemTitle(item) {
    var text = String(item && item.name || '').trim();
    return text || 'Событие';
}

function resolveResponseCalendarItemVacancyId(item) {
    if (!item || typeof item !== 'object') return '';
    var ids = getMyResponseIdCandidates(item);
    return ids.length ? ids[0] : '';
}

function resolveResponseCalendarItemMeta(item) {
    var employer = String(item && item.employer || '').trim();
    return employer || 'Работодатель не указан';
}

function buildResponseCalendarDayItems(items) {
    var ordered = (items || []).map(function(item) {
        return Object.assign({}, item || {});
    });
    ordered.sort(function(left, right) {
        return resolveResponseCalendarItemTimestamp(left) - resolveResponseCalendarItemTimestamp(right);
    });
    return ordered;
}

function buildResponseCalendarEventMap(responses) {
    var eventsByDay = {};
    (responses || []).forEach(function(item) {
        var interviewDate = parseInterviewDateValue(item && item.interview_date);
        if (!interviewDate) return;
        var dayKey = formatCalendarDayKey(interviewDate);
        if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
        eventsByDay[dayKey].push(Object.assign({}, item || {}, {
            dayKey: dayKey
        }));
    });

    Object.keys(eventsByDay).forEach(function(dayKey) {
        eventsByDay[dayKey] = buildResponseCalendarDayItems(eventsByDay[dayKey]);
    });
    return eventsByDay;
}

function resolveResponseCalendarSelectedDay(parentRole, monthKey, selectedDayKey, eventsByDay) {
    var selected = String(selectedDayKey || '').trim();
    var monthRange = getResponseCalendarGridRange(monthKey);
    var todayKey = formatCalendarDayKey(new Date());
    if (selected) {
        var selectedDate = parseInterviewDateValue(selected);
        if (selectedDate && selectedDate.getTime() >= monthRange.gridStart.getTime() && selectedDate.getTime() <= monthRange.gridEnd.getTime()) {
            return selected;
        }
    }
    if (todayKey.indexOf(monthKey + '-') === 0) return todayKey;
    var monthEventKey = Object.keys(eventsByDay).sort().find(function(key) {
        return key.indexOf(monthKey + '-') === 0;
    });
    if (monthEventKey) return monthEventKey;
    return formatCalendarDayKey(monthRange.monthStart);
}

function summarizeResponseCalendarMonth(monthKey, responses, eventsByDay) {
    var todayDate = new Date();
    var todayKey = formatCalendarDayKey(todayDate);
    var todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    var upcomingStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() + 1);
    var upcomingEnd = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() + 7);
    var nowTs = getResponseCalendarNowTimestamp();
    var total = 0;
    var daysWithEvents = 0;
    var todayCount = 0;
    var upcomingWeek = 0;
    var overdue = 0;
    var unscheduled = 0;
    var scheduledItems = [];

    Object.keys(eventsByDay).forEach(function(dayKey) {
        var dayEvents = eventsByDay[dayKey] || [];
        if (dayKey.indexOf(monthKey + '-') === 0) {
            total += dayEvents.length;
            if (dayEvents.length) daysWithEvents += 1;
        }
        if (dayKey === todayKey) todayCount += dayEvents.length;
    });

    (responses || []).forEach(function(item) {
        var interviewDate = parseInterviewDateValue(item && item.interview_date);
        if (!interviewDate) {
            unscheduled += 1;
            return;
        }
        if (formatCalendarDayKey(interviewDate) < todayKey) overdue += 1;
        if (interviewDate.getTime() >= upcomingStart.getTime() && interviewDate.getTime() < upcomingEnd.getTime()) upcomingWeek += 1;
        scheduledItems.push(Object.assign({}, item || {}, {
            dayKey: formatCalendarDayKey(interviewDate)
        }));
    });

    scheduledItems.sort(function(left, right) {
        return resolveResponseCalendarItemTimestamp(left) - resolveResponseCalendarItemTimestamp(right);
    });

    var nearestItem = null;
    for (var i = 0; i < scheduledItems.length; i++) {
        if (resolveResponseCalendarItemTimestamp(scheduledItems[i]) >= nowTs) {
            nearestItem = scheduledItems[i];
            break;
        }
    }
    if (!nearestItem && scheduledItems.length) nearestItem = scheduledItems[scheduledItems.length - 1];

    return {
        total: total,
        daysWithEvents: daysWithEvents,
        todayCount: todayCount,
        upcomingWeek: upcomingWeek,
        overdue: overdue,
        unscheduled: unscheduled,
        nearestItem: nearestItem
    };
}

function formatResponseCalendarRelativeDayLabel(dayKey) {
    var date = parseInterviewDateValue(dayKey);
    if (!date) return '';
    var today = new Date();
    var todayKey = formatCalendarDayKey(today);
    if (dayKey === todayKey) return 'Сегодня';
    var tomorrowKey = formatCalendarDayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
    if (dayKey === tomorrowKey) return 'Завтра';
    var weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    var months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return weekdays[date.getDay()] + ', ' + date.getDate() + ' ' + months[date.getMonth()];
}

function buildResponseCalendarFilterSummary(options, values) {
    var selectedValues = Array.isArray(values) ? values.slice() : [];
    if (!selectedValues.length) return '';
    var labels = selectedValues.map(function(value) {
        var match = (options || []).find(function(option) {
            return String(option && option.value || '') === String(value || '');
        });
        return String((match && match.label) || value || '').trim();
    }).filter(Boolean);
    if (!labels.length) return '';
    if (labels.length <= 2) return labels.join(', ');
    return labels.slice(0, 2).join(', ') + ' +' + (labels.length - 2);
}

function buildResponseCalendarActiveFiltersHtml(parentRole) {
    return '';
}

function buildResponseCalendarLegendHtml() {
    return '' +
        '<div class="response-calendar-legend" aria-label="Подсказка по состояниям календаря">' +
            '<span class="response-calendar-legend-chip is-local">Есть событие</span>' +
            '<span class="response-calendar-legend-chip is-today">Сегодня</span>' +
            '<span class="response-calendar-legend-chip is-selected">Выбранный день</span>' +
            '<span class="response-calendar-legend-chip is-overdue">Не внесен результат собеса</span>' +
        '</div>';
}

function buildResponseCalendarDayPreviewHtml(item) {
    var itemId = resolveResponseCalendarItemVacancyId(item);
    return '' +
        '<span class="response-calendar-event-pill is-local" data-vacancy-id="' + escapeHtml(itemId) + '">' +
            '<span class="response-calendar-event-dot" aria-hidden="true"></span>' +
            '<span class="response-calendar-event-copy">' +
                '<span class="response-calendar-event-time">' + escapeHtml(formatCalendarEventTime(item)) + '</span>' +
                '<span class="response-calendar-event-title">' + escapeHtml(resolveResponseCalendarItemTitle(item)) + '</span>' +
            '</span>' +
        '</span>';
}

function isResponseCalendarTodayKey(dayKey) {
    return String(dayKey || '').trim() === formatCalendarDayKey(new Date());
}

function isResponseCalendarItemToday(item) {
    var dayKey = String(item && item.dayKey || '').trim();
    if (!dayKey) {
        dayKey = formatCalendarDayKey(parseInterviewDateValue(item && item.interview_date));
    }
    return isResponseCalendarTodayKey(dayKey);
}

function buildResponseCalendarMetaHtml(text, isToday) {
    var parts = [];
    if (isToday) {
        parts.push('<span class="response-calendar-meta-today">Сегодня</span>');
    }
    var metaText = String(text || '').trim();
    if (metaText) {
        parts.push('<span class="response-calendar-meta-text">' + escapeHtml(metaText) + '</span>');
    }
    return parts.join('<span class="response-calendar-meta-sep">•</span>');
}

function buildResponseCalendarActionButtonHtml(text, action, attrs) {
    if (!action) return '';
    var parts = ['type="button"', 'class="response-calendar-action-btn"'];
    parts.push('data-action="' + escapeHtml(action) + '"');
    Object.keys(attrs || {}).forEach(function(key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === '') return;
        parts.push('data-' + escapeHtml(key) + '="' + escapeHtml(value) + '"');
    });
    return '<button ' + parts.join(' ') + '>' + escapeHtml(text) + '</button>';
}

function buildResponseCalendarEmptyHtml(text, actionText, action, attrs, options) {
    options = options || {};
    var className = 'response-calendar-empty' + (options.compact ? ' is-compact' : '');
    return '' +
        '<div class="' + className + '">' +
            '<div class="response-calendar-empty-text">' + escapeHtml(text) + '</div>' +
            (actionText && action ? '<div class="response-calendar-empty-actions">' + buildResponseCalendarActionButtonHtml(actionText, action, attrs) + '</div>' : '') +
        '</div>';
}

function buildResponseCalendarAgendaItemHtml(item, metaText, options) {
    options = options || {};
    var itemId = resolveResponseCalendarItemVacancyId(item);
    var isToday = options.isToday === true || isResponseCalendarItemToday(item);
    var timeLabel = String(options.timeLabel || formatCalendarEventTime(item) || 'Без времени').trim();
    var classes = ['response-calendar-agenda-item', 'is-local'];
    var variant = String(options.variant || (item && item.variant) || '').trim();
    if (isToday) classes.push('is-today');
    if (variant) classes.push('is-' + variant);
    return '' +
        '<button type="button" class="' + classes.join(' ') + '" data-vacancy-id="' + escapeHtml(itemId) + '">' +
            '<div class="response-calendar-agenda-time">' + escapeHtml(timeLabel) + '</div>' +
            '<div class="response-calendar-agenda-content">' +
                (options.badgeText ? '<div class="response-calendar-agenda-badge">' + escapeHtml(options.badgeText) + '</div>' : '') +
                '<div class="response-calendar-agenda-title">' + escapeHtml(resolveResponseCalendarItemTitle(item)) + '</div>' +
                '<div class="response-calendar-agenda-meta">' + buildResponseCalendarMetaHtml(metaText, isToday) + '</div>' +
            '</div>' +
        '</button>';
}

function buildResponseCalendarAgendaHtml(items, hasAnyEvents, hasInterviews, nearestItem, unscheduledItems) {
    if (items.length) {
        return items.map(function(item) {
            return buildResponseCalendarAgendaItemHtml(item, resolveResponseCalendarItemMeta(item), {
                isToday: isResponseCalendarItemToday(item)
            });
        }).join('');
    }
    if (hasAnyEvents && nearestItem) {
        return buildResponseCalendarEmptyHtml('На выбранный день событий нет.', '', '', null, { compact: true });
    }
    if (hasInterviews && nearestItem) {
        return buildResponseCalendarEmptyHtml('Событий нет.', '', '', null, { compact: true });
    }
    if (unscheduledItems.length) {
        return buildResponseCalendarEmptyHtml('Пока нет назначенных событий.', '', '', null, { compact: true });
    }
    return buildResponseCalendarEmptyHtml('Пока нет назначенных событий.', '', '', null, { compact: true });
}

function getResponseCalendarUnscheduledItems(responses) {
    return (responses || []).filter(function(item) {
        return !parseInterviewDateValue(item && item.interview_date);
    });
}

function buildResponseCalendarTodayItems(eventsByDay) {
    return buildResponseCalendarDayItems(eventsByDay[formatCalendarDayKey(new Date())] || []);
}

function buildResponseCalendarUpcomingItems(eventsByDay, dayCount, excludedDayKey) {
    var today = new Date();
    var nowTs = getResponseCalendarNowTimestamp();
    var excludedKey = String(excludedDayKey || '').trim();
    var items = [];
    for (var i = 1; i <= dayCount; i++) {
        var currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        var dayKey = formatCalendarDayKey(currentDate);
        if (excludedKey && dayKey === excludedKey) continue;
        (eventsByDay[dayKey] || []).forEach(function(item) {
            var interviewDate = parseInterviewDateValue(item && item.interview_date);
            if (!interviewDate || interviewDate.getTime() < nowTs) return;
            items.push(Object.assign({}, item || {}, {
                week_day_label: formatResponseCalendarRelativeDayLabel(dayKey),
                variant: 'upcoming'
            }));
        });
    }
    return buildResponseCalendarDayItems(items);
}

function buildResponseCalendarPendingResultItems(responses) {
    var items = [];
    (responses || []).forEach(function(item) {
        if (!isResponseCalendarPendingResultItem(item)) return;
        var interviewDate = parseInterviewDateValue(item && item.interview_date);
        var dayKey = formatCalendarDayKey(interviewDate);
        items.push(Object.assign({}, item || {}, {
            dayKey: dayKey,
            week_day_label: formatResponseCalendarRelativeDayLabel(dayKey)
        }));
    });
    items.sort(function(left, right) {
        return resolveResponseCalendarItemTimestamp(right) - resolveResponseCalendarItemTimestamp(left);
    });
    return items;
}

function buildResponseCalendarWeekItems(selectedDayKey, eventsByDay) {
    var startDate = parseInterviewDateValue(selectedDayKey);
    if (!startDate) return [];
    var items = [];
    for (var i = 0; i < 7; i++) {
        var currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
        var dayKey = formatCalendarDayKey(currentDate);
        (eventsByDay[dayKey] || []).forEach(function(item) {
            items.push(Object.assign({}, item || {}, {
                week_day_label: formatCalendarDayLabel(dayKey)
            }));
        });
    }
    return items;
}

function buildResponseCalendarWeekHtml(items) {
    if (!items.length) {
        return buildResponseCalendarEmptyHtml('Событий нет.', '', '', null, { compact: true });
    }
    return items.slice(0, 7).map(function(item) {
        var meta = String(item && item.week_day_label || '').trim();
        var employer = resolveResponseCalendarItemMeta(item);
        if (employer) meta = meta ? (meta + ' • ' + employer) : employer;
        return buildResponseCalendarAgendaItemHtml(item, meta, {
            isToday: isResponseCalendarItemToday(item)
        });
    }).join('');
}

function buildResponseCalendarPendingResultHtml(items) {
    if (!items.length) {
        return buildResponseCalendarEmptyHtml('Все прошедшие собеседования уже обновлены.');
    }
    return items.slice(0, 4).map(function(item) {
        var meta = String(item && item.week_day_label || '').trim();
        var employer = resolveResponseCalendarItemMeta(item);
        if (employer) meta = meta ? (meta + ' • ' + employer) : employer;
        return buildResponseCalendarAgendaItemHtml(item, meta, {
            variant: 'overdue'
        });
    }).join('');
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
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'my-response-details-modal-backdrop';
        backdrop.className = 'my-response-details-backdrop';
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
    }
    if (backdrop.dataset.bound !== '1') {
        backdrop.addEventListener('click', function(e) {
            if (e.target === backdrop || e.target.closest('.my-response-details-close')) {
                closeMyResponseDetailsModal();
                return;
            }
            if (e.target.closest('.my-response-details-save')) {
                submitMyResponseDetailsModal();
            }
        });
        backdrop.dataset.bound = '1';
    }
    return backdrop;
}

function openMyResponseDetailsModal(vacancyId) {
    var id = String(vacancyId || '').trim();
    if (!id) return;
    var backdrop = ensureMyResponseDetailsModal();
    backdrop.dataset.vacancyId = id;
    var cachedItem = findMyResponseItemById(id) || {};
    var sourceInitial = findVacancySourceById(id) || {};
    var readonlyWrap = backdrop.querySelector('.my-response-details-readonly');
    if (readonlyWrap) readonlyWrap.innerHTML = buildMyResponseReadonlyHtml(id, cachedItem, sourceInitial, null);
    backdrop.style.display = 'flex';

    fetchMyResponseDetails(id).then(function(item) {
        if (!backdrop || backdrop.dataset.vacancyId !== id) return;
        var source = findVacancySourceById(id) || {};
        if ((item.skills === null || item.skills === undefined || item.skills === '') && source.skills) {
            item.skills = source.skills;
        }
        if (readonlyWrap) readonlyWrap.innerHTML = buildMyResponseReadonlyHtml(id, cachedItem, source, item);

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
        if (readonlyWrap) readonlyWrap.innerHTML = buildMyResponseReadonlyHtml(id, cachedItem, sourceInitial, null);
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
        if (resp.ok === true && resp.requires_overwrite !== true) {
            if (Array.isArray(uiState.my_responses_cache)) {
                uiState.my_responses_cache = uiState.my_responses_cache.map(function(item) {
                    var ids = getMyResponseIdCandidates(item);
                    if (ids.indexOf(vacancyId) < 0) return item;
                    return Object.assign({}, item, fields, {
                        updated_at: resp.updated_at || item.updated_at || null
                    });
                });
            }
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
            if (activeRole && typeof applyGlobalFiltersToActiveAnalysis === 'function') {
                applyGlobalFiltersToActiveAnalysis(activeRole, activeRole.dataset.activeAnalysis || '');
            } else if (activeRole) {
                renderMyResponsesContent(activeRole);
            }
        }
    }).catch(function() {
        window.alert('Не удалось сохранить данные собеседования');
    });
}

if (typeof window !== 'undefined') {
    window.openMyResponseDetailsModal = openMyResponseDetailsModal;
    window.closeMyResponseDetailsModal = closeMyResponseDetailsModal;
    window.submitMyResponseDetailsModal = submitMyResponseDetailsModal;
}

function buildResponseCalendarHtml(parentRole, responses, monthKey, selectedDayKey) {
    var monthRange = getResponseCalendarGridRange(monthKey);
    var eventsByDay = buildResponseCalendarEventMap(responses);
    var effectiveSelectedDay = resolveResponseCalendarSelectedDay(parentRole, monthKey, selectedDayKey, eventsByDay);
    var monthSummary = summarizeResponseCalendarMonth(monthKey, responses, eventsByDay);
    var todayDate = new Date();
    var todayKey = formatCalendarDayKey(todayDate);
    var todayWeekdayIndex = (todayDate.getDay() + 6) % 7;
    var selectedIsToday = effectiveSelectedDay === todayKey;
    var hasInterviews = (responses || []).some(function(item) {
        return !!parseInterviewDateValue(item && item.interview_date);
    });
    var nearestItem = monthSummary.nearestItem;
    var unscheduledItems = getResponseCalendarUnscheduledItems(responses);
    var todayEvents = buildResponseCalendarTodayItems(eventsByDay);
    var pendingResultItems = buildResponseCalendarPendingResultItems(responses);
    uiState[getResponseCalendarSelectedDayStateKey(parentRole)] = effectiveSelectedDay;

    var weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    var cells = [];
    for (var cellDate = new Date(monthRange.gridStart.getFullYear(), monthRange.gridStart.getMonth(), monthRange.gridStart.getDate()); cellDate <= monthRange.gridEnd; cellDate = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate() + 1)) {
        var dayKey = formatCalendarDayKey(cellDate);
        var isCurrentMonth = cellDate.getMonth() === monthRange.monthStart.getMonth();
        var isSelected = dayKey === effectiveSelectedDay;
        var isToday = dayKey === todayKey;
        var dayEvents = eventsByDay[dayKey] || [];
        var dayLabel = formatCalendarDayLabel(dayKey);
        var ariaLabel = dayLabel + (dayEvents.length ? (', событий: ' + dayEvents.length) : ', без событий') + (isToday ? ', сегодня' : '') + (isSelected ? ', выбрано' : '');
        cells.push(
            '<button type="button" class="response-calendar-day' +
                (isCurrentMonth ? '' : ' is-outside') +
                (isSelected ? ' is-selected' : '') +
                (isToday ? ' is-today' : '') +
                (dayEvents.length ? ' has-events has-local' : '') +
                '" data-day-key="' + escapeHtml(dayKey) + '"' +
                ' tabindex="' + (isSelected ? '0' : '-1') + '"' +
                ' aria-label="' + escapeHtml(ariaLabel) + '"' +
                ' aria-selected="' + (isSelected ? 'true' : 'false') + '">' +
                '<span class="response-calendar-day-head">' +
                    '<span class="response-calendar-day-number">' + cellDate.getDate() + '</span>' +
                    (dayEvents.length ? '<span class="response-calendar-day-count">' + dayEvents.length + '</span>' : '') +
                '</span>' +
            '</button>'
        );
    }

    var selectedEvents = effectiveSelectedDay ? (eventsByDay[effectiveSelectedDay] || []) : [];
    var weekEvents = buildResponseCalendarUpcomingItems(eventsByDay, 7, effectiveSelectedDay);
    var agendaHtml = buildResponseCalendarAgendaHtml(selectedEvents, monthSummary.total > 0, hasInterviews, nearestItem, unscheduledItems);
    var weekHtml = buildResponseCalendarWeekHtml(weekEvents);
    var pendingResultHtml = buildResponseCalendarPendingResultHtml(pendingResultItems);
    return '' +
        '<div class="response-calendar-shell">' +
            '<section class="response-calendar-panel response-calendar-panel--board">' +
                '<div class="response-calendar-topbar">' +
                    '<div class="response-calendar-topbar-actions">' +
                        buildResponseCalendarMonthPickerHtml(parentRole, monthKey) +
                    '</div>' +
                '</div>' +
                buildResponseCalendarActiveFiltersHtml(parentRole) +
                '<div class="response-calendar-weekdays">' +
                    weekdayLabels.map(function(label, index) {
                        return '<div class="response-calendar-weekday' + (index === todayWeekdayIndex ? ' is-today' : '') + '">' + label + '</div>';
                    }).join('') +
                '</div>' +
                '<div class="response-calendar-grid" role="grid" aria-label="Календарь собеседований">' + cells.join('') + '</div>' +
            '</section>' +
            '<aside class="response-calendar-panel response-calendar-panel--agenda">' +
                '<div class="response-calendar-agenda-section">' +
                    '<div class="response-calendar-agenda-head">' +
                        '<div class="response-calendar-agenda-headline">' +
                            '<div class="response-calendar-agenda-title">Фокус на дне</div>' +
                        '</div>' +
                        '<div class="response-calendar-agenda-date' + (selectedIsToday ? ' is-today' : '') + '">' +
                            '<span class="response-calendar-agenda-date-text">' + escapeHtml(formatCalendarDayLabel(effectiveSelectedDay)) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="response-calendar-agenda-list">' + agendaHtml + '</div>' +
                '</div>' +
                '<div class="response-calendar-agenda-section">' +
                    '<div class="response-calendar-agenda-head">' +
                        '<div class="response-calendar-agenda-title">Ближайшие 7 дней</div>' +
                    '</div>' +
                    '<div class="response-calendar-agenda-list">' + weekHtml + '</div>' +
                '</div>' +
                '<div class="response-calendar-agenda-section">' +
                    '<div class="response-calendar-agenda-head">' +
                        '<div class="response-calendar-agenda-title">Не внесен результат собеса</div>' +
                    '</div>' +
                    '<div class="response-calendar-agenda-list">' + pendingResultHtml + '</div>' +
                '</div>' +
            '</aside>' +
        '</div>';
}
function renderMyResponsesCalendarContent(parentRole, options) {
    options = options || {};
    if (!parentRole) return;
    if (typeof ensureResponseCalendarTab === 'function') ensureResponseCalendarTab(parentRole);
    var block = parentRole.querySelector('.response-calendar-content');
    if (!block) return;
    if (!options.suppressLoading) {
        block.innerHTML = '<div class="skills-search-summary">Загрузка календаря...</div>';
    }

    var renderWithList = function(list) {
        block._calendarResponsesList = Array.isArray(list) ? list.slice() : [];
        var filtered = applyMyResponsesGlobalFilters(parentRole, Array.isArray(list) ? list : []);
        var currentMonthKey = uiState[getResponseCalendarMonthStateKey(parentRole)];
        if (!parseCalendarMonthKey(currentMonthKey)) {
            currentMonthKey = resolveResponseCalendarInitialMonthKey(filtered);
            uiState[getResponseCalendarMonthStateKey(parentRole)] = currentMonthKey;
        }
        var selectedDayKey = uiState[getResponseCalendarSelectedDayStateKey(parentRole)] || '';
        block.dataset.calendarMonth = currentMonthKey;
        block.innerHTML = buildResponseCalendarHtml(parentRole, filtered, currentMonthKey, selectedDayKey);

        var rerenderCalendar = function(extraOptions) {
            var nextOptions = Object.assign({
                useBlockCache: true,
                suppressLoading: true
            }, extraOptions || {});
            renderMyResponsesCalendarContent(parentRole, nextOptions);
        };
        var focusCalendarDay = function(dayKey) {
            var nextDayKey = String(dayKey || '').trim();
            if (!nextDayKey) return;
            uiState[getResponseCalendarSelectedDayStateKey(parentRole)] = nextDayKey;
            var nextDate = parseInterviewDateValue(nextDayKey);
            if (nextDate) {
                uiState[getResponseCalendarMonthStateKey(parentRole)] = formatCalendarMonthKey(nextDate);
            }
            rerenderCalendar({ focusDayKey: nextDayKey });
        };
        var firstMissingDateItem = getResponseCalendarUnscheduledItems(filtered)[0] || null;
        var nearestSummary = summarizeResponseCalendarMonth(currentMonthKey, filtered, buildResponseCalendarEventMap(filtered));
        var nearestScheduledItem = nearestSummary.nearestItem;
        var handleCalendarAction = function(action, dataset) {
            if (action === 'today') {
                focusCalendarDay(formatCalendarDayKey(new Date()));
                return;
            }
            if (action === 'nearest' && nearestScheduledItem) {
                focusCalendarDay(nearestScheduledItem.dayKey);
                return;
            }
            if (action === 'jump-day') {
                focusCalendarDay(dataset && dataset.dayKey);
                return;
            }
            if (action === 'open-missing') {
                var vacancyId = String(dataset && dataset.vacancyId || '').trim() || resolveResponseCalendarItemVacancyId(firstMissingDateItem);
                if (vacancyId) openMyResponseDetailsModal(vacancyId);
            }
        };

        block.querySelectorAll('.response-calendar-nav-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var shift = Number(btn.dataset.shift || 0);
                uiState[getResponseCalendarMonthStateKey(parentRole)] = shiftCalendarMonthKey(uiState[getResponseCalendarMonthStateKey(parentRole)] || currentMonthKey, shift);
                rerenderCalendar();
            });
        });
        var monthPickerShell = block.querySelector('.response-calendar-month-picker-shell');
        if (monthPickerShell) {
            monthPickerShell.addEventListener('click', function() {
                var openKey = getResponseCalendarMonthPickerOpenStateKey(parentRole);
                var yearKey = getResponseCalendarMonthPickerYearStateKey(parentRole);
                uiState[openKey] = !uiState[openKey];
                if (uiState[openKey]) {
                    var activeMonth = parseCalendarMonthKey(uiState[getResponseCalendarMonthStateKey(parentRole)] || currentMonthKey) || new Date();
                    uiState[yearKey] = activeMonth.getFullYear();
                }
                rerenderCalendar();
            });
        }
        block.querySelectorAll('.response-calendar-month-year-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var yearKey = getResponseCalendarMonthPickerYearStateKey(parentRole);
                var currentYear = Number(uiState[yearKey]);
                if (!isFinite(currentYear)) {
                    var selectedMonthDate = parseCalendarMonthKey(uiState[getResponseCalendarMonthStateKey(parentRole)] || currentMonthKey) || new Date();
                    currentYear = selectedMonthDate.getFullYear();
                }
                uiState[yearKey] = currentYear + Number(btn.dataset.shift || 0);
                uiState[getResponseCalendarMonthPickerOpenStateKey(parentRole)] = true;
                rerenderCalendar();
            });
        });
        block.querySelectorAll('.response-calendar-month-option').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var nextMonthKey = String(btn.dataset.monthKey || '').trim();
                if (!parseCalendarMonthKey(nextMonthKey)) return;
                uiState[getResponseCalendarMonthStateKey(parentRole)] = nextMonthKey;
                uiState[getResponseCalendarMonthPickerOpenStateKey(parentRole)] = false;
                uiState[getResponseCalendarMonthPickerYearStateKey(parentRole)] = parseCalendarMonthKey(nextMonthKey).getFullYear();
                rerenderCalendar();
            });
        });
        if (block._responseCalendarOutsideHandler) {
            document.removeEventListener('click', block._responseCalendarOutsideHandler, true);
        }
        block._responseCalendarOutsideHandler = function(event) {
            if (!uiState[getResponseCalendarMonthPickerOpenStateKey(parentRole)]) return;
            if (block.contains(event.target)) return;
            uiState[getResponseCalendarMonthPickerOpenStateKey(parentRole)] = false;
            renderMyResponsesCalendarContent(parentRole, { useBlockCache: true, suppressLoading: true });
        };
        document.addEventListener('click', block._responseCalendarOutsideHandler, true);
        block.querySelectorAll('.response-calendar-action-btn').forEach(function(actionBtn) {
            actionBtn.addEventListener('click', function() {
                if (actionBtn.disabled) return;
                handleCalendarAction(String(actionBtn.dataset.action || '').trim(), actionBtn.dataset);
            });
        });
        block.querySelectorAll('.response-calendar-day').forEach(function(dayBtn) {
            dayBtn.addEventListener('click', function(e) {
                var eventNode = e.target.closest('.response-calendar-event-pill');
                if (eventNode) {
                    var previewVacancyId = String(eventNode.dataset.vacancyId || '').trim();
                    if (previewVacancyId) openMyResponseDetailsModal(previewVacancyId);
                    return;
                }
                var nextDayKey = String(dayBtn.dataset.dayKey || '').trim();
                focusCalendarDay(nextDayKey);
            });
            dayBtn.addEventListener('keydown', function(e) {
                var shifts = {
                    ArrowLeft: -1,
                    ArrowRight: 1,
                    ArrowUp: -7,
                    ArrowDown: 7
                };
                if (!Object.prototype.hasOwnProperty.call(shifts, e.key)) return;
                e.preventDefault();
                var currentDate = parseInterviewDateValue(dayBtn.dataset.dayKey);
                if (!currentDate) return;
                var nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + shifts[e.key]);
                var nextDayKey = formatCalendarDayKey(nextDate);
                if (!nextDayKey) return;
                uiState[getResponseCalendarSelectedDayStateKey(parentRole)] = nextDayKey;
                if (nextDayKey.indexOf(currentMonthKey + '-') !== 0) {
                    uiState[getResponseCalendarMonthStateKey(parentRole)] = formatCalendarMonthKey(nextDate);
                }
                rerenderCalendar({ focusDayKey: nextDayKey });
            });
        });
        block.querySelectorAll('.response-calendar-agenda-item').forEach(function(itemBtn) {
            itemBtn.addEventListener('click', function() {
                var vacancyId = String(itemBtn.dataset.vacancyId || '').trim();
                if (vacancyId) openMyResponseDetailsModal(vacancyId);
            });
        });
        var focusDayKey = String(options.focusDayKey || '').trim();
        if (focusDayKey) {
            var focusTarget = block.querySelector('.response-calendar-day[data-day-key="' + focusDayKey + '"]');
            if (focusTarget) focusTarget.focus();
        }
    };

    if (options.useBlockCache && Array.isArray(block._calendarResponsesList)) {
        renderWithList(block._calendarResponsesList);
        return;
    }
    fetchMyResponsesVacancies().then(renderWithList).catch(function() {
        renderWithList(collectMyResponsesVacancies());
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
    block.querySelectorAll('.my-responses-mode-tabs, .my-responses-efficiency').forEach(function(node) {
        node.remove();
    });
    var resultsWrap = block.querySelector('.skills-search-results');
    if (!resultsWrap) {
        block.insertAdjacentHTML('beforeend',
            '<div class="skills-search-results my-responses-results"><div class="skills-search-hint">Нет откликов</div></div>');
    }
    if (!block.dataset.detailsBound) {
        block.addEventListener('click', function(e) {
            var detailsBtn = e.target.closest('.my-responses-details-link');
            if (!detailsBtn) return;
            e.preventDefault();
            var vacancyId = String(detailsBtn.dataset.vacancyId || '').trim();
            if (vacancyId) openMyResponseDetailsModal(vacancyId);
        });
        block.dataset.detailsBound = '1';
    }
}

function ensureMyResponsesTabs(scope) {
    var root = scope || document;
    root.querySelectorAll('.role-content').forEach(function(roleContent) {
        ensureMyResponsesTab(roleContent);
    });
}
function ensureResponseCalendarTab(parentRole) {
    if (!parentRole || parentRole.id === 'role-all') return;
    var tabs = parentRole.querySelector('.tabs.analysis-tabs');
    if (!tabs) return;
    var roleSuffix = String(parentRole.id || '').replace(/^role-/, '');
    if (!roleSuffix) return;
    var analysisId = 'responses-calendar-' + roleSuffix;

    var tab = tabs.querySelector('.analysis-button[data-analysis-id="' + analysisId + '"]');
    if (!tab) {
        tab = document.createElement('button');
        tab.className = 'tab-button analysis-button';
        tab.setAttribute('data-analysis-id', analysisId);
        tab.setAttribute('onclick', "switchAnalysis(event, '" + analysisId + "')");
        tab.textContent = 'Календарь';
        var myResponsesTab = tabs.querySelector('.analysis-button[data-analysis-id^="my-responses-"]');
        if (myResponsesTab && myResponsesTab.nextSibling) tabs.insertBefore(tab, myResponsesTab.nextSibling);
        else tabs.appendChild(tab);
    }

    var block = parentRole.querySelector('.response-calendar-content[data-analysis="' + analysisId + '"]');
    if (!block) {
        block = document.createElement('div');
        block.className = 'response-calendar-content';
        block.setAttribute('data-analysis', analysisId);
        block.style.display = 'none';
        block.innerHTML = '<div class="skills-search-hint">Загрузка календаря...</div>';
        parentRole.appendChild(block);
    }
}
function ensureResponseCalendarTabs(scope) {
    var root = scope || document;
    root.querySelectorAll('.role-content').forEach(function(roleContent) {
        ensureResponseCalendarTab(roleContent);
    });
}

function ensureTotalsTab(parentRole) {
    if (!parentRole || parentRole.id === 'role-all') return;
    var tabs = parentRole.querySelector('.tabs.analysis-tabs');
    if (!tabs) return;
    var roleSuffix = String(parentRole.id || '').replace(/^role-/, '');
    if (!roleSuffix) return;
    var analysisId = 'totals-' + roleSuffix;

    var tab = tabs.querySelector('.analysis-button[data-analysis-id="' + analysisId + '"]');
    if (!tab) {
        tab = document.createElement('button');
        tab.className = 'tab-button analysis-button';
        tab.setAttribute('data-analysis-id', analysisId);
        tab.setAttribute('onclick', "switchAnalysis(event, '" + analysisId + "')");
        tab.textContent = 'Дашборд';
        var summaryBtn = tabs.querySelector('.summary-report-btn');
        if (summaryBtn) tabs.insertBefore(tab, summaryBtn);
        else tabs.appendChild(tab);
    }

    var block = parentRole.querySelector('.totals-content[data-analysis="' + analysisId + '"]');
    if (!block) {
        block = document.createElement('div');
        block.className = 'totals-content';
        block.setAttribute('data-analysis', analysisId);
        block.style.display = 'none';
        block.innerHTML = '<div class="skills-search-hint">Загрузка итогов...</div>';
        parentRole.appendChild(block);
    }
}

function ensureTotalsTabs(scope) {
    var root = scope || document;
    root.querySelectorAll('.role-content').forEach(function(roleContent) {
        ensureTotalsTab(roleContent);
    });
}
function ensureMarketTrendsTab(parentRole) {
    if (!parentRole || parentRole.id === 'role-all') return;
    var tabs = parentRole.querySelector('.tabs.analysis-tabs');
    if (!tabs) return;
    var roleSuffix = String(parentRole.id || '').replace(/^role-/, '');
    if (!roleSuffix) return;
    var analysisId = 'market-trends-' + roleSuffix;

    var tab = tabs.querySelector('.analysis-button[data-analysis-id="' + analysisId + '"]');
    if (!tab) {
        tab = document.createElement('button');
        tab.className = 'tab-button analysis-button';
        tab.setAttribute('data-analysis-id', analysisId);
        tab.setAttribute('onclick', "switchAnalysis(event, '" + analysisId + "')");
        tab.textContent = 'Тренды рынка';
        var summaryBtn = tabs.querySelector('.summary-report-btn');
        if (summaryBtn) tabs.insertBefore(tab, summaryBtn);
        else tabs.appendChild(tab);
    }

    var block = parentRole.querySelector('.market-trends-content[data-analysis="' + analysisId + '"]');
    if (!block) {
        block = document.createElement('div');
        block.className = 'market-trends-content';
        block.setAttribute('data-analysis', analysisId);
        block.style.display = 'none';
        block.innerHTML = '<div class="skills-search-hint">Загрузка трендов...</div>';
        parentRole.appendChild(block);
    }
}
function ensureMarketTrendsTabs(scope) {
    var root = scope || document;
    root.querySelectorAll('.role-content').forEach(function(roleContent) {
        ensureMarketTrendsTab(roleContent);
    });
}

function reorderPrimaryAnalysisTabs(parentRole) {
    if (!parentRole) return;
    if (parentRole.id === 'role-all') return;
    var tabs = parentRole.querySelector('.tabs.analysis-tabs');
    if (!tabs) return;
    var ordered = [];
    function push(node) {
        if (!node) return;
        if (ordered.indexOf(node) >= 0) return;
        ordered.push(node);
    }
    push(tabs.querySelector('.analysis-button[data-analysis-id^="totals-"]'));
    push(tabs.querySelector('.summary-report-btn'));
    push(tabs.querySelector('.analysis-button[data-analysis-id^="skills-search-"]'));
    push(tabs.querySelector('.analysis-button[data-analysis-id^="my-responses-"]'));
    push(tabs.querySelector('.analysis-button[data-analysis-id^="responses-calendar-"]'));

    var allButtons = Array.from(tabs.querySelectorAll('.analysis-button'));
    var rest = allButtons.filter(function(btn) { return ordered.indexOf(btn) < 0; });
    ordered.concat(rest).forEach(function(btn) { tabs.appendChild(btn); });
}

function reorderPrimaryAnalysisTabsAll(scope) {
    var root = scope || document;
    root.querySelectorAll('.role-content').forEach(function(roleContent) {
        reorderPrimaryAnalysisTabs(roleContent);
    });
}

function markAnalysisTabNamingDirty(root) {
    var scope = root || document;
    scope.__analysisTabNamingDirty = true;
}
function applyAnalysisTabNaming(root) {
    var scope = root || document;
    if (scope.__analysisTabNamingApplied && !scope.__analysisTabNamingDirty) return;
    scope.__analysisTabNamingApplied = true;
    scope.__analysisTabNamingDirty = false;
    if (typeof ensureMyResponsesTabs === 'function') ensureMyResponsesTabs(scope);
    if (typeof ensureResponseCalendarTabs === 'function') ensureResponseCalendarTabs(scope);
    if (typeof ensureTotalsTabs === 'function') ensureTotalsTabs(scope);
    if (typeof reorderPrimaryAnalysisTabsAll === 'function') reorderPrimaryAnalysisTabsAll(scope);
    var mapSummary = {
        activity: 'Динамика по ролям',
        weekday: 'Лидер публикаций',
        skills: 'Стоимость навыков',
        salary: 'Вилка по ролям'
    };
    scope.querySelectorAll('.analysis-button[data-analysis-id]').forEach(function(btn) {
        if (btn.dataset && btn.dataset.preserveLabel === '1') return;
        var id = String(btn.dataset.analysisId || '');
        var tabsHost = btn.closest('.tabs');
        var hasSummaryTab = !!(tabsHost && tabsHost.querySelector('.summary-report-btn'));
        if (hasSummaryTab) return;
        var isSummary = /-all$/.test(id);
        if (id.indexOf('activity-') === 0 && isSummary) btn.textContent = mapSummary.activity;
        else if (id.indexOf('weekday-') === 0 && isSummary) btn.textContent = mapSummary.weekday;
        else if (id.indexOf('skills-monthly-') === 0 && isSummary) btn.textContent = mapSummary.skills;
        else if (id.indexOf('salary-') === 0 && isSummary) btn.textContent = mapSummary.salary;
    });
    scope.querySelectorAll('.summary-return-tab[onclick]').forEach(function(btn) {
        if (btn.dataset && btn.dataset.preserveLabel === '1') return;
        var onClick = String(btn.getAttribute('onclick') || '');
        if (onClick.indexOf("switchFromSummaryToAnalysis('skills-search')") >= 0) btn.textContent = 'Поиск вакансий';
        else if (onClick.indexOf("switchFromSummaryToAnalysis('responses-calendar')") >= 0) btn.textContent = 'Календарь';
    });
}

// ---------- Переключение типов анализа вынесено в report.analysis-switch.js ----------
// ---------- Навигация ролей вынесена в report.role-navigation.js ----------

// ---------- Shared filters вынесены в report.filters.js ----------

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

function buildPeriodFilterOptionsFromVacancies(vacancies) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var months = Array.from(new Set(list.map(function(vacancy) {
        var date = parsePublishedAtDate(vacancy && vacancy.published_at);
        if (!date) return '';
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    }).filter(Boolean))).sort().reverse();
    var totalLabel = months.length
        ? (typeof formatMonthTitle === 'function' ? formatMonthTitle(months.length) : 'Весь период')
        : 'Весь период';
    var quickItems = typeof getStandardPeriodFilterItems === 'function'
        ? getStandardPeriodFilterItems()
        : [
            { key: 'today', label: 'Сегодня', period: 'today' },
            { key: 'd3', label: 'За 3 дня', period: 'last_3' },
            { key: 'd7', label: 'За 7 дней', period: 'last_7' },
            { key: 'd14', label: 'За 14 дней', period: 'last_14' }
        ];
    return dedupeFilterOptions(quickItems.map(function(item) {
        return { value: item.period, label: item.label };
    }).concat(months.map(function(month) {
        return { value: month, label: typeof formatMonthLabel === 'function' ? formatMonthLabel(month) : month };
    })).concat([
        { value: totalLabel, label: totalLabel }
    ]));
}
function buildTotalsPeriodFilterOptions(vacancies, dashboardMode) {
    return buildPeriodFilterOptionsFromVacancies(vacancies);
}

function buildUnifiedRolePeriodFilterOptions(activeRole) {
    var scopedVacancies = collectScopedVacancies(activeRole);
    return buildPeriodFilterOptionsFromVacancies(scopedVacancies);
}

function buildPeriodFilterOptionsFromResponseItems(vacancies) {
    return buildPeriodFilterOptionsFromItems(vacancies, parseMyResponsePeriodDate);
}

function buildPeriodFilterOptionsFromCalendarItems(vacancies) {
    return buildPeriodFilterOptionsFromItems(vacancies, function(item) {
        return parseInterviewDateValue(item && item.interview_date);
    });
}

function buildPeriodFilterOptionsFromItems(vacancies, dateGetter) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var months = Array.from(new Set(list.map(function(vacancy) {
        var date = typeof dateGetter === 'function' ? dateGetter(vacancy) : null;
        if (!date) return '';
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    }).filter(Boolean))).sort().reverse();
    var totalLabel = months.length
        ? (typeof formatMonthTitle === 'function' ? formatMonthTitle(months.length) : 'Весь период')
        : 'Весь период';
    var quickItems = typeof getStandardPeriodFilterItems === 'function'
        ? getStandardPeriodFilterItems()
        : [
            { key: 'today', label: 'Сегодня', period: 'today' },
            { key: 'd3', label: 'За 3 дня', period: 'last_3' },
            { key: 'd7', label: 'За 7 дней', period: 'last_7' },
            { key: 'd14', label: 'За 14 дней', period: 'last_14' }
        ];
    return dedupeFilterOptions(quickItems.map(function(item) {
        return { value: item.period, label: item.label };
    }).concat(months.map(function(month) {
        return { value: month, label: typeof formatMonthLabel === 'function' ? formatMonthLabel(month) : month };
    })).concat([
        { value: totalLabel, label: totalLabel }
    ]));
}

function getGlobalFilterScopeRoleContents(activeRole) {
    if (!activeRole) return [];
    if (activeRole.id === 'role-all') {
        if (Array.isArray(activeRole.__selectedRoleContents) && activeRole.__selectedRoleContents.length) {
            return activeRole.__selectedRoleContents.slice();
        }
        return typeof getAllRoleContents === 'function' ? getAllRoleContents() : [];
    }
    return [activeRole];
}

function collectScopedVacancies(activeRole) {
    var combined = [];
    getGlobalFilterScopeRoleContents(activeRole).forEach(function(roleContent) {
        combined = combined.concat((getRoleVacancies(roleContent) || []).slice());
    });
    return dedupeVacanciesById(combined);
}

function normalizeGlobalCurrencyFilterValue(value) {
    var current = normalizeTotalsCurrency(value || '');
    if (!current) return 'none';
    if (current === 'RUR') return 'rur';
    if (current === 'USD') return 'usd';
    if (current === 'EUR') return 'eur';
    return 'other';
}

function getGlobalCountryFilterValue(vacancy) {
    var country = String(vacancy && vacancy.country || '').trim();
    if (!country) return 'none';
    return country === 'Россия' ? 'ru' : 'not_ru';
}

function buildCurrencyFilterOptionsFromVacancies(vacancies) {
    var labels = {
        rur: 'RUR',
        usd: 'USD',
        eur: 'EUR',
        other: 'Другая',
        none: 'Не заполнена'
    };
    var seen = new Set();
    (vacancies || []).forEach(function(vacancy) {
        seen.add(normalizeGlobalCurrencyFilterValue(vacancy && vacancy.currency));
    });
    return ['rur', 'usd', 'eur', 'other', 'none'].filter(function(value) {
        return seen.has(value);
    }).map(function(value) {
        return { value: value, label: labels[value] || value };
    });
}

function buildCountryFilterOptionsFromVacancies(vacancies) {
    var labels = {
        ru: 'Россия',
        not_ru: 'Не Россия',
        none: 'Не определена'
    };
    var seen = new Set();
    (vacancies || []).forEach(function(vacancy) {
        seen.add(getGlobalCountryFilterValue(vacancy));
    });
    return ['ru', 'not_ru', 'none'].filter(function(value) {
        return seen.has(value);
    }).map(function(value) {
        return { value: value, label: labels[value] || value };
    });
}

function buildEmployerFilterOptionsFromVacancies(vacancies) {
    var seen = new Map();
    (vacancies || []).forEach(function(vacancy) {
        var employer = String(vacancy && vacancy.employer || '').trim();
        if (!employer) return;
        var key = employer.toLowerCase();
        if (!seen.has(key)) seen.set(key, employer);
    });
    return Array.from(seen.values()).map(function(value) {
        return { value: value, label: value };
    }).sort(function(a, b) {
        return String(a.label || '').localeCompare(String(b.label || ''), 'ru');
    });
}

function buildBooleanFilterOptionsFromVacancies(vacancies, filterKey) {
    if (!(vacancies || []).length) return [];
    return [
        { value: 'true', label: 'Да' },
        { value: 'false', label: 'Нет' }
    ];
}

function buildResponseStateFilterOptions(vacancies, resolver, yesLabel, noLabel) {
    if (!(vacancies || []).length) return [];
    return [
        { value: 'no', label: noLabel },
        { value: 'yes', label: yesLabel }
    ];
}

function getGlobalFilterOptions(activeRole, filterKey, analysisType) {
    if (filterKey === 'roles') {
        return dedupeFilterOptions(getRoleMetaList().map(function(item) {
            return { value: item.index, label: (item.name || '').trim() };
        }));
    }
    if (!activeRole) return [];
    var current = analysisType || activeRole.dataset.activeAnalysis || '';
    if (activeRole.id === 'role-all') {
        var summaryRoleContents = Array.isArray(activeRole.__selectedRoleContents) && activeRole.__selectedRoleContents.length
            ? activeRole.__selectedRoleContents.slice()
            : getAllRoleContents();
        if (filterKey === 'periods' && current !== 'my-responses') {
            return buildUnifiedRolePeriodFilterOptions(activeRole);
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
    if (filterKey === 'periods') {
        if (isResponsesCalendarAnalysis(current)) {
            var responsesList = Array.isArray(uiState.my_responses_cache) ? uiState.my_responses_cache.slice() : [];
            if (!responsesList.length) {
                var allRoleVacancies = [];
                if (typeof getAllRoleContents === 'function') {
                    getAllRoleContents().forEach(function(roleContent) {
                        allRoleVacancies = allRoleVacancies.concat(getRoleVacancies(roleContent) || []);
                    });
                } else if (activeRole) {
                    allRoleVacancies = (getRoleVacancies(activeRole) || []).slice();
                }
                responsesList = allRoleVacancies.filter(function(v) {
                    return isRespondedVacancy(v);
                });
            }
            return buildPeriodFilterOptionsFromCalendarItems(responsesList);
        }
        return buildUnifiedRolePeriodFilterOptions(activeRole);
    }
    if (filterKey === 'status') {
        if (current === 'skills-search') {
            return [
                { value: 'open', label: 'Открытая' },
                { value: 'archived', label: 'Архивная' }
            ];
        }
        if (!isResponsesCalendarAnalysis(current)) {
            var statusVacancies = [];
            if (activeRole.id === 'role-all') {
                var statusRoleContents = Array.isArray(activeRole.__selectedRoleContents) && activeRole.__selectedRoleContents.length
                    ? activeRole.__selectedRoleContents.slice()
                    : getAllRoleContents();
                statusRoleContents.forEach(function(roleContent) {
                    statusVacancies = statusVacancies.concat(getRoleVacancies(roleContent) || []);
                });
            } else {
                statusVacancies = (getRoleVacancies(activeRole) || []).slice();
            }
            statusVacancies = dedupeVacanciesById(statusVacancies);
            if (!statusVacancies.length) return [];
        }
        return [
            { value: 'open', label: 'Открытая' },
            { value: 'archived', label: 'Архивная' }
        ];
    }
    var scopedVacancies = collectScopedVacancies(activeRole);
    if (filterKey === 'currency') {
        return buildCurrencyFilterOptionsFromVacancies(scopedVacancies);
    }
    if (filterKey === 'country') {
        return buildCountryFilterOptionsFromVacancies(scopedVacancies);
    }
    if (filterKey === 'employer') {
        return buildEmployerFilterOptionsFromVacancies(scopedVacancies);
    }
    if (filterKey === 'accreditation' || filterKey === 'cover_letter_required' || filterKey === 'has_test') {
        return buildBooleanFilterOptionsFromVacancies(scopedVacancies, filterKey);
    }
    if (filterKey === 'interview') {
        return buildResponseStateFilterOptions(scopedVacancies, hasScheduledInterview, 'Назначен', 'Не назначен');
    }
    if (filterKey === 'result') {
        return buildResponseStateFilterOptions(scopedVacancies, hasResultContent, 'Указан', 'Не указан');
    }
    if (filterKey === 'offer') {
        return buildResponseStateFilterOptions(scopedVacancies, hasOfferContent, 'Да', 'Нет');
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
    if (!includeCount && !excludeCount) {
        if (filterKey === 'roles') return 'Все роли';
        if (filterKey === 'currency') return 'Не выбрана';
        if (filterKey === 'country') return 'Не выбрана';
        if (filterKey === 'employer') return 'Не выбрано';
        if (filterKey === 'interview' || filterKey === 'result' || filterKey === 'offer' || filterKey === 'accreditation' || filterKey === 'cover_letter_required' || filterKey === 'has_test') return 'Не выбрано';
        if (filterKey === 'periods') return 'Весь период';
        return 'Все';
    }
    if (filterKey === 'roles' && isGlobalFilterMultiEnabled(filterKey)) {
        return 'Выбрано: ' + includeCount;
    }
    var optionMap = {};
    (options || []).forEach(function(item) { optionMap[item.value] = item.label; });
    if (filterKey !== 'roles') {
        var mapValueToLabel = function(value) {
            if (filterKey === 'periods') {
                var formatted = formatPeriodSelectionValue(value);
                if (formatted) return optionMap[formatted] || optionMap[value] || formatted;
                if (/^\d{4}-\d{2}$/.test(String(value || '').trim())) {
                    return optionMap[value] || (typeof formatMonthLabel === 'function' ? formatMonthLabel(value) : value);
                }
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

function resetGlobalFilterMenuPosition(menu) {
    if (!menu) return;
    [
        'position',
        'top',
        'left',
        'right',
        'bottom',
        'width',
        'max-height',
        'overflow-y',
        'overscroll-behavior',
        '-ms-scroll-chaining',
        'margin',
        'transform',
        'inset',
        'z-index',
        'box-sizing'
    ].forEach(function(prop) {
        menu.style.removeProperty(prop);
    });
}

function restoreGlobalFilterMenuHost(menu) {
    if (!menu || !menu.__host) return;
    if (menu.parentElement !== menu.__host) {
        menu.__host.appendChild(menu);
    }
    resetGlobalFilterMenuPosition(menu);
}

function ensureSharedFilterSectionVisibility(panel, sectionKey) {
    if (!panel || !sectionKey) return;
    if (String(sectionKey || '').trim() === 'skills') return;
    var scrollHost = panel.querySelector('.shared-filter-panel-body');
    var group = panel.querySelector('.shared-filter-group[data-section-key="' + sectionKey + '"]');
    if (!scrollHost || !group || typeof scrollHost.scrollTop !== 'number') return;
    var hostRect = typeof scrollHost.getBoundingClientRect === 'function' ? scrollHost.getBoundingClientRect() : null;
    var groupRect = typeof group.getBoundingClientRect === 'function' ? group.getBoundingClientRect() : null;
    if (!hostRect || !groupRect) return;
    var safeGap = 12;
    var deltaDown = groupRect.bottom - (hostRect.bottom - safeGap);
    if (deltaDown > 0) {
        scrollHost.scrollTop += deltaDown;
        return;
    }
    var deltaUp = groupRect.top - (hostRect.top + safeGap);
    if (deltaUp < 0) {
        scrollHost.scrollTop += deltaUp;
    }
}

function ensureSharedFilterMenuVisibility(trigger, menu) {
    if (!trigger || !menu) return;
    var sectionGroup = trigger.closest ? trigger.closest('.shared-filter-group[data-section-key]') : null;
    if (sectionGroup && String(sectionGroup.dataset.sectionKey || '').trim() === 'skills') return;
    var safeGap = 12;
    var menuRect = typeof menu.getBoundingClientRect === 'function' ? menu.getBoundingClientRect() : null;
    if (menuRect) {
        var viewportOverflow = menuRect.bottom - (window.innerHeight - safeGap);
        if (viewportOverflow > 0 && typeof window.scrollBy === 'function') {
            window.scrollBy({ top: viewportOverflow, behavior: 'instant' });
        }
    }
}

function positionGlobalFilterMenu(trigger, menu) {
    if (!trigger || !menu) return;
    restoreGlobalFilterMenuHost(menu);
    var host = menu.__host || menu.parentElement;
    if (host) {
        host.style.position = 'relative';
        host.style.overflow = 'visible';
    }
    var rect = trigger.getBoundingClientRect();
    var width = Math.max(220, Math.round(trigger.offsetWidth || rect.width || 0));
    var viewportBottomSpace = Math.max(96, window.innerHeight - Math.round(rect.bottom) - 12);
    var scrollHost = trigger.closest ? trigger.closest('.shared-filter-panel-body') : null;
    var hostBottomSpace = viewportBottomSpace;
    if (scrollHost && typeof scrollHost.getBoundingClientRect === 'function') {
        var hostRect = scrollHost.getBoundingClientRect();
        if (hostRect) hostBottomSpace = Math.max(96, Math.round(hostRect.bottom - rect.bottom) - 12);
    }
    var availableBottomSpace = Math.max(96, Math.min(viewportBottomSpace, hostBottomSpace));
    var maxHeight = Math.max(96, Math.min(availableBottomSpace, Math.round(window.innerHeight * 0.72)));
    menu.style.setProperty('position', 'absolute', 'important');
    menu.style.setProperty('top', Math.round((trigger.offsetTop || 0) + (trigger.offsetHeight || 0) + 2) + 'px', 'important');
    menu.style.setProperty('left', Math.round(trigger.offsetLeft || 0) + 'px', 'important');
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
    ensureSharedFilterMenuVisibility(trigger, menu);
}

function ensureGlobalFilterSearchState() {
    if (!uiState.global_filter_search_queries || typeof uiState.global_filter_search_queries !== 'object') {
        uiState.global_filter_search_queries = {};
    }
    return uiState.global_filter_search_queries;
}

function getGlobalFilterSearchValue(filterKey, legacyKey) {
    var store = ensureGlobalFilterSearchState();
    if (Object.prototype.hasOwnProperty.call(store, filterKey)) {
        return String(store[filterKey] || '');
    }
    if (legacyKey && typeof uiState[legacyKey] !== 'undefined') {
        return String(uiState[legacyKey] || '');
    }
    return '';
}

function setGlobalFilterSearchValue(filterKey, value, legacyKey) {
    var nextValue = String(value || '');
    ensureGlobalFilterSearchState()[filterKey] = nextValue;
    if (legacyKey) uiState[legacyKey] = nextValue;
}

function applyGlobalFilterSearch(menu, query, rowSelector) {
    if (!menu) return;
    var normalizedQuery = String(query || '').trim().toLowerCase();
    Array.from(menu.querySelectorAll(rowSelector || '.global-filter-option-row')).forEach(function(node) {
        var searchText = String((node.dataset && node.dataset.searchText) || node.textContent || '').trim().toLowerCase();
        var isVisible = !normalizedQuery || searchText.indexOf(normalizedQuery) >= 0;
        if (isVisible) {
            node.style.removeProperty('display');
        } else {
            node.style.setProperty('display', 'none', 'important');
        }
    });
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
    if (period) parts.push(period);
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
    panel && (panel.dataset.activeAnalysis = current);
    var isAllRolesView = activeRole.id === 'role-all';
    if (isAllRolesView) syncAllRolesPeriodStateFromGlobalFilter(activeRole, current);
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
        rolesWrap.querySelectorAll('.skills-search-dropdown-item[data-role-value]').forEach(function(row) {
            var roleValue = row.dataset.roleValue || '';
            var label = row.querySelector('div');
            applyRoleFilterOptionVisualState(row, label, rolesBucket, roleValue);
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
    if (typeof syncSharedFilterPanelCollapsedUi === 'function') {
        syncSharedFilterPanelCollapsedUi(panel);
    }
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
    var activeRole = getActiveRoleContent();
    var currentAnalysis = activeRole && activeRole.dataset ? String(activeRole.dataset.activeAnalysis || '').trim() : '';
    if (currentAnalysis) {
        uiState.global_analysis_type = currentAnalysis;
    }
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

function isRoleFilterOptionExcluded(bucket, optionValue) {
    var exclude = (bucket && Array.isArray(bucket.exclude)) ? bucket.exclude : [];
    return exclude.some(function(value) {
        return isSameGlobalFilterValue('roles', value, optionValue);
    });
}

function getDashboardFilterBaseTextColor() {
    return document.body && document.body.classList.contains('report-dashboard') ? '#bcc5c9' : '#0f172a';
}

function applyRoleFilterOptionVisualState(row, labelNode, bucket, optionValue) {
    if (!row) return;
    var included = isGlobalFilterOptionIncluded('roles', bucket, optionValue);
    var excluded = isRoleFilterOptionExcluded(bucket, optionValue);
    var baseColor = getDashboardFilterBaseTextColor();
    row.style.background = excluded ? 'linear-gradient(135deg, #ff9a9a 0%, #FF6262 100%)' : 'transparent';
    row.style.color = (included || excluded) ? '#ffffff' : baseColor;
    row.style.border = '1px solid transparent';
    row.style.boxShadow = excluded ? '0 10px 24px rgba(255, 98, 98, 0.18)' : 'none';
    if (labelNode) {
        labelNode.style.fontWeight = (included || excluded) ? '600' : '400';
        labelNode.style.color = (included || excluded) ? '#ffffff' : baseColor;
    }
}

function updateGlobalFilterSelection(filterKey, value, action, skipPanelRefresh) {
    var bucket = ensureGlobalFilterBucket(filterKey);
    var previousInclude = bucket.include.slice();
    if (action === 'reset') {
        bucket.include = bucket.include.filter(function(v) { return !isSameGlobalFilterValue(filterKey, v, value); });
        bucket.exclude = bucket.exclude.filter(function(v) { return !isSameGlobalFilterValue(filterKey, v, value); });
    } else if (action === 'include') {
        if (isGlobalFilterMultiEnabled(filterKey)) {
            if (!isGlobalFilterOptionIncluded(filterKey, bucket, value)) bucket.include.push(value);
            bucket.exclude = bucket.exclude.filter(function(v) { return !isSameGlobalFilterValue(filterKey, v, value); });
        } else {
            bucket.include = value ? [value] : [];
            bucket.exclude = [];
        }
    } else if (action === 'exclude') {
        if (isGlobalFilterMultiEnabled(filterKey)) {
            if (!bucket.exclude.some(function(v) { return isSameGlobalFilterValue(filterKey, v, value); })) bucket.exclude.push(value);
            bucket.include = bucket.include.filter(function(v) { return !isSameGlobalFilterValue(filterKey, v, value); });
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
    if (skipPanelRefresh) {
        var activeRole = getActiveRoleContent();
        if (activeRole) applyGlobalFiltersToActiveAnalysis(activeRole, activeRole.dataset.activeAnalysis || '');
        return;
    }
    refreshExistingGlobalFilterUi();
}

function createActiveRoleFilterChip(filterKey, value, labelText, state) {
    var chip = document.createElement('div');
    var isExcluded = state === 'exclude';
    chip.className = 'active-role-filter-chip';
    chip.title = '';
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';
    chip.style.gap = '0.1875rem';
    chip.style.border = '0';
    chip.style.borderRadius = '999px';
    chip.style.padding = '0.1875rem 0.5rem';
    chip.style.cursor = 'pointer';
    chip.style.userSelect = 'none';
    chip.style.background = isExcluded ? 'linear-gradient(135deg, #f38bff 0%, #D149EF 52%, #8b5cf6 100%)' : 'linear-gradient(135deg, #00C3D3 0%, #007AD8 55%, #D149EF 100%)';
    chip.style.color = '#ffffff';
    chip.style.transform = 'translateY(0)';
    chip.style.boxShadow = isExcluded ? '0 8px 18px rgba(209, 73, 239, 0.24)' : '0 8px 18px rgba(0, 122, 216, 0.20)';
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
    removeBtn.style.margin = '0';
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        updateGlobalFilterSelection(filterKey, value, 'reset');
    });
    chip.appendChild(removeBtn);

    chip.addEventListener('click', function(e) {
        if (e.target === removeBtn) return;
        updateGlobalFilterSelection(filterKey, value, 'reset');
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
    wrap.style.minWidth = SHARED_FILTER_WIDE_FIELD_WIDTH;
    wrap.style.width = SHARED_FILTER_WIDE_FIELD_WIDTH;

    var caption = document.createElement('div');
    caption.className = 'shared-filter-field-label';
    caption.textContent = 'Роли';
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
    menu.style.width = SHARED_FILTER_WIDE_MENU_WIDTH;
    menu.style.maxWidth = 'calc(100vw - 48px)';
    menu.style.maxHeight = '260px';
    menu.style.overflowY = 'auto';

    var controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.flexWrap = 'wrap';
    controls.style.marginBottom = '2px';
    controls.style.padding = '4px 2px';

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
    menu.appendChild(search);

    function reorderRoleRows() {
        var selectedRoles = bucket.include || [];
        var excludedRoles = bucket.exclude || [];
        var selectedRank = {};
        var excludedRank = {};
        selectedRoles.forEach(function(value, idx) {
            selectedRank[String(value)] = idx;
        });
        excludedRoles.forEach(function(value, idx) {
            excludedRank[String(value)] = idx;
        });
        var rows = Array.from(menu.querySelectorAll('.skills-search-dropdown-item[data-role-value]'));
        rows.sort(function(a, b) {
            var aValue = String(a.dataset.roleValue || '');
            var bValue = String(b.dataset.roleValue || '');
            var aSelected = Object.prototype.hasOwnProperty.call(selectedRank, aValue);
            var bSelected = Object.prototype.hasOwnProperty.call(selectedRank, bValue);
            if (aSelected && bSelected) return selectedRank[aValue] - selectedRank[bValue];
            if (aSelected !== bSelected) return aSelected ? -1 : 1;
            var aExcluded = Object.prototype.hasOwnProperty.call(excludedRank, aValue);
            var bExcluded = Object.prototype.hasOwnProperty.call(excludedRank, bValue);
            if (aExcluded && bExcluded) return excludedRank[aValue] - excludedRank[bValue];
            if (aExcluded !== bExcluded) return aExcluded ? -1 : 1;
            var aLabel = String(a.textContent || '').trim();
            var bLabel = String(b.textContent || '').trim();
            return aLabel.localeCompare(bLabel, 'ru');
        });
        rows.forEach(function(row) {
            menu.appendChild(row);
        });
    }

    function syncRolesControlVisualState() {
        triggerLabel.textContent = summarizeGlobalFilterSelection('roles', options, false);
        menu.querySelectorAll('.skills-search-dropdown-item[data-role-value]').forEach(function(node) {
            var roleValue = node.dataset.roleValue || '';
            var labelNode = node.querySelector('div');
            applyRoleFilterOptionVisualState(node, labelNode, bucket, roleValue);
        });
        reorderRoleRows();
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
            var action = isIncluded ? 'reset' : 'include';
            updateGlobalFilterSelection('roles', option.value, action);
            syncRolesControlVisualState();
        });
        var label = document.createElement('div');
        label.textContent = option.label;
        label.style.fontSize = '12px';
        applyRoleFilterOptionVisualState(row, label, bucket, option.value);
        row.appendChild(label);
        menu.appendChild(row);
    });

    search.addEventListener('input', function() {
        var q = String(search.value || '').trim().toLowerCase();
        Array.from(menu.children).forEach(function(node) {
            if (node === controls || node === search) return;
            var text = (node.textContent || '').trim().toLowerCase();
            if (!q || text.indexOf(q) >= 0) {
                node.style.removeProperty('display');
            } else {
                node.style.setProperty('display', 'none', 'important');
            }
        });
    });

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var nextState = menu.style.display === 'none' ? 'block' : 'none';
        closeGlobalFilterMenus(menu, nextState === 'block' ? triggerArrow : null);
        menu.style.display = nextState;
        if (nextState === 'block') {
            reorderRoleRows();
            positionGlobalFilterMenu(trigger, menu);
        }
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
        reorderRoleRows();
        positionGlobalFilterMenu(trigger, menu);
        triggerArrow.textContent = '\u25B4';
    }
    return wrap;
}

function createGlobalFilterDropdown(filterKey, title, options, disabled) {
    var bucket = ensureGlobalFilterBucket(filterKey);
    var isRolesFilter = usesRoleWidthSharedFilter(filterKey);
    var allowMulti = ['status', 'country', 'accreditation', 'cover_letter_required', 'has_test', 'interview', 'result', 'offer'].indexOf(filterKey) < 0;
    var baseTextColor = getDashboardFilterBaseTextColor();
    if (!allowMulti && isGlobalFilterMultiEnabled(filterKey)) {
        setGlobalFilterMultiEnabled(filterKey, false);
    }
    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown skills-search-dropdown';
    wrap.dataset.filterKey = filterKey;
    wrap.style.marginTop = '4px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = isRolesFilter ? SHARED_FILTER_WIDE_FIELD_WIDTH : SHARED_FILTER_FIELD_WIDTH;
    wrap.style.width = isRolesFilter ? SHARED_FILTER_WIDE_FIELD_WIDTH : SHARED_FILTER_FIELD_WIDTH;

    var caption = document.createElement('div');
    caption.className = 'shared-filter-field-label';
    caption.textContent = title;
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
    menu.style.width = isRolesFilter ? SHARED_FILTER_WIDE_MENU_WIDTH : SHARED_FILTER_FIELD_MENU_WIDTH;
    menu.style.maxWidth = 'calc(100vw - 48px)';
    menu.style.maxHeight = '260px';
    menu.style.overflowY = 'auto';
    menu.style.overscrollBehavior = 'contain';
    bindGlobalFilterMenuScrollLock(menu);

    var controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.flexWrap = 'wrap';
    controls.style.marginBottom = '2px';
    controls.style.padding = '4px 2px';
    if (filterKey !== 'periods') {
        var allBtn = document.createElement('button');
        allBtn.type = 'button';
        allBtn.className = 'tab-button skills-search-dropdown-item';
        allBtn.textContent = '\u2713';
        bindGlobalFilterTooltip(allBtn, 'Выбрать все');
        applyGlobalFilterIconButtonStyle(allBtn, false);
        allBtn.addEventListener('click', function() {
            var keepOpen = filterKey !== 'roles' && allowMulti && isGlobalFilterMultiEnabled(filterKey);
            updateGlobalFilterSelection(filterKey, '', 'all', keepOpen);
            triggerLabel.textContent = summarizeGlobalFilterSelection(filterKey, options, disabled);
            syncOptionRowsVisualState();
        });
        controls.appendChild(allBtn);
    }

    if (allowMulti) {
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
    }

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'tab-button skills-search-dropdown-item';
    clearBtn.textContent = '\u21BA';
    bindGlobalFilterTooltip(clearBtn, 'Сбросить все');
    applyGlobalFilterIconButtonStyle(clearBtn, false);
    clearBtn.addEventListener('click', function() {
        var keepOpen = filterKey !== 'roles' && allowMulti && isGlobalFilterMultiEnabled(filterKey);
        updateGlobalFilterSelection(filterKey, '', 'clear', keepOpen);
        triggerLabel.textContent = summarizeGlobalFilterSelection(filterKey, options, disabled);
        syncOptionRowsVisualState();
    });
    controls.appendChild(clearBtn);
    menu.appendChild(controls);

    if ((filterKey === 'roles' || filterKey === 'employer') && !disabled) {
        var search = document.createElement('input');
        search.type = 'text';
        search.className = 'global-filter-search';
        search.placeholder = filterKey === 'employer' ? 'Поиск работодателя' : 'Поиск роли';
        search.style.width = '100%';
        search.style.boxSizing = 'border-box';
        search.style.marginBottom = '2px';
        search.style.marginLeft = '2px';
        search.style.marginRight = '2px';
        search.style.padding = '7px 10px';
        search.style.fontSize = '12px';
        search.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        search.addEventListener('keydown', function(e) {
            e.stopPropagation();
        });
        search.value = getGlobalFilterSearchValue(filterKey);
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
            row.dataset.optionValue = option.value;
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
            row.dataset.searchText = String(option.label || option.value || '');
            row.addEventListener('click', function() {
                var isIncluded = isGlobalFilterOptionIncluded(filterKey, bucket, option.value);
                var keepOpen = filterKey !== 'roles' && allowMulti && isGlobalFilterMultiEnabled(filterKey);
                updateGlobalFilterSelection(filterKey, option.value, isIncluded ? 'reset' : 'include', keepOpen);
                triggerLabel.textContent = summarizeGlobalFilterSelection(filterKey, options, disabled);
                syncOptionRowsVisualState();
            });
            var label = document.createElement('div');
            var isIncludedNow = isGlobalFilterOptionIncluded(filterKey, bucket, option.value);
            label.textContent = option.label;
            label.style.fontWeight = isIncludedNow ? '600' : '400';
            label.style.fontSize = '12px';
            row.style.background = 'transparent';
            row.style.border = '1px solid transparent';
            row.style.color = isIncludedNow ? '#ffffff' : baseTextColor;
            row.style.boxShadow = 'none';
            label.style.color = isIncludedNow ? '#ffffff' : baseTextColor;
            row.addEventListener('mouseenter', function() {
                var isSelected = isGlobalFilterOptionIncluded(filterKey, bucket, option.value);
                row.style.transform = 'translateX(4px) translateY(-1px)';
                row.style.boxShadow = '0 6px 14px rgba(148, 163, 184, 0.12)';
                if (!isSelected) {
                    row.style.background = 'rgba(248, 250, 252, 0.98)';
                }
            });
            row.addEventListener('mouseleave', function() {
                var isSelected = isGlobalFilterOptionIncluded(filterKey, bucket, option.value);
                row.style.transform = 'translateX(0) translateY(0)';
                row.style.boxShadow = 'none';
                row.style.background = 'transparent';
            });
            row.appendChild(label);
            menu.appendChild(row);
        });
        function syncOptionRowsVisualState() {
            Array.from(menu.querySelectorAll('.global-filter-option-row')).forEach(function(node) {
                var nodeLabel = node.querySelector('div');
                var value = node.dataset ? node.dataset.optionValue : '';
                var selected = isGlobalFilterOptionIncluded(filterKey, bucket, value);
                node.style.background = 'transparent';
                node.style.border = '1px solid transparent';
                node.style.boxShadow = 'none';
                node.style.color = selected ? '#ffffff' : baseTextColor;
                if (nodeLabel) nodeLabel.style.fontWeight = selected ? '600' : '400';
                if (nodeLabel) nodeLabel.style.color = selected ? '#ffffff' : baseTextColor;
            });
        }
        syncOptionRowsVisualState();
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                setGlobalFilterSearchValue(filterKey, searchInput.value);
                applyGlobalFilterSearch(menu, searchInput.value, '.global-filter-option-row[data-option-value]');
            });
            searchInput.value = getGlobalFilterSearchValue(filterKey);
            applyGlobalFilterSearch(menu, searchInput.value, '.global-filter-option-row[data-option-value]');
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
    if ((bucket.include || []).length) return [];
    return allowed.filter(function(v) { return exclude.indexOf(v) < 0; });
}

function isMyResponsesPeriodLabel(label) {
    var text = String(label || '').trim().toLowerCase();
    return text === 'мои отклики' || text === 'отклики';
}

function isGlobalFilterOptionIncluded(filterKey, bucket, optionValue) {
    var include = (bucket && Array.isArray(bucket.include)) ? bucket.include : [];
    return include.some(function(value) {
        return isSameGlobalFilterValue(filterKey, value, optionValue);
    });
}

function isSameGlobalFilterValue(filterKey, left, right) {
    if (filterKey === 'periods') {
        return normalizeGlobalPeriodValue(left) === normalizeGlobalPeriodValue(right);
    }
    if (filterKey === 'experiences') {
        return normalizeExperience(left) === normalizeExperience(right);
    }
    return String(left || '') === String(right || '');
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

function totalsFormatDayMonthLabel(date) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) return '';
    return String(date.getDate()).padStart(2, '0') + '.' + String(date.getMonth() + 1).padStart(2, '0');
}

function totalsStartOfDay(date) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function totalsEndOfDay(date) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function totalsAddDays(date, days) {
    if (!(date instanceof Date) || !isFinite(date.getTime())) return null;
    var next = new Date(date.getTime());
    next.setDate(next.getDate() + Number(days || 0));
    return next;
}

function totalsMonthNameToIndex(value) {
    var text = String(value || '').trim().toLowerCase();
    var months = {
        'январь': 0,
        'февраль': 1,
        'март': 2,
        'апрель': 3,
        'май': 4,
        'июнь': 5,
        'июль': 6,
        'август': 7,
        'сентябрь': 8,
        'октябрь': 9,
        'ноябрь': 10,
        'декабрь': 11
    };
    return Object.prototype.hasOwnProperty.call(months, text) ? months[text] : -1;
}

function totalsParsePeriodWindow(value, referenceDate) {
    var text = String(value || '').trim();
    if (!text) return null;
    var monthKey = text.match(/^(\d{4})-(\d{2})$/);
    if (monthKey) {
        var year = Number(monthKey[1]);
        var monthIndex = Number(monthKey[2]) - 1;
        if (monthIndex >= 0 && monthIndex <= 11) {
            return {
                label: text,
                start: new Date(year, monthIndex, 1, 0, 0, 0, 0),
                end: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
            };
        }
    }
    var ruMonth = text.match(/^([А-Яа-яЁё]+)\s+(\d{4})$/);
    if (ruMonth) {
        var ruMonthIndex = totalsMonthNameToIndex(ruMonth[1]);
        var ruYear = Number(ruMonth[2]);
        if (ruMonthIndex >= 0) {
            return {
                label: text,
                start: new Date(ruYear, ruMonthIndex, 1, 0, 0, 0, 0),
                end: new Date(ruYear, ruMonthIndex + 1, 0, 23, 59, 59, 999)
            };
        }
    }
    if (typeof parsePeriodFilterValue === 'function') {
        var parsed = parsePeriodFilterValue(value);
        if (parsed && parsed.start && parsed.end) {
            return {
                label: text,
                start: totalsStartOfDay(new Date(parsed.start)),
                end: totalsEndOfDay(new Date(parsed.end))
            };
        }
    }
    var ref = referenceDate instanceof Date && isFinite(referenceDate.getTime()) ? new Date(referenceDate.getTime()) : new Date();
    ref = totalsEndOfDay(ref);
    if (text === 'Сегодня' || /^today$/i.test(text)) {
        return { label: text, start: totalsStartOfDay(ref), end: totalsEndOfDay(ref) };
    }
    var quick = text.match(/^За\s+(\d+)\s+д/i) || text.match(/^last_(\d+)$/i) || text.match(/^(\d+)d$/i);
    if (quick) {
        var days = Math.max(0, Number(quick[1]) || 0);
        return {
            label: text,
            start: totalsStartOfDay(totalsAddDays(ref, -days)),
            end: totalsEndOfDay(ref)
        };
    }
    return null;
}

function normalizeTotalsPeriodWindows(selectedPeriods, vacancies) {
    var labels = Array.isArray(selectedPeriods) ? selectedPeriods.filter(Boolean) : [];
    var effectiveLabels = labels.filter(function(label) {
        var text = String(label || '').trim();
        return text && text !== 'За период' && text !== 'Весь период' && text !== 'За все время' && !isSummaryMonth(text);
    });
    var list = Array.isArray(vacancies) ? vacancies : [];
    var refDate = null;
    list.forEach(function(vacancy) {
        var candidate = parsePublishedAtDate(vacancy && (vacancy.archived_at || vacancy.published_at));
        if (!candidate) return;
        if (!refDate || candidate > refDate) refDate = candidate;
    });
    if (!refDate) refDate = new Date();
    var windows = effectiveLabels.map(function(label) {
        return totalsParsePeriodWindow(label, refDate);
    }).filter(Boolean).sort(function(a, b) {
        return a.start - b.start;
    });
    if (windows.length) return windows;

    var minDate = null;
    var maxDate = null;
    list.forEach(function(vacancy) {
        var published = parsePublishedAtDate(vacancy && vacancy.published_at);
        var archived = parsePublishedAtDate(vacancy && vacancy.archived_at);
        if (published && (!minDate || published < minDate)) minDate = published;
        if (published && (!maxDate || published > maxDate)) maxDate = published;
        if (archived && (!maxDate || archived > maxDate)) maxDate = archived;
    });
    if (!minDate) minDate = totalsStartOfDay(refDate);
    if (!maxDate) maxDate = totalsEndOfDay(refDate);
    return [{
        label: effectiveLabels[0] || 'За период',
        start: totalsStartOfDay(minDate),
        end: totalsEndOfDay(maxDate)
    }];
}

function totalsClassifyVacancyForPeriod(vacancy, periodWindow) {
    var period = periodWindow || {};
    var start = period.start instanceof Date ? period.start : null;
    var end = period.end instanceof Date ? period.end : null;
    if (!start || !end || !vacancy) {
        return {
            included: false,
            active: false,
            archived: false,
            newPublished: false,
            publishedAndArchived: false,
            aliveAtEnd: false,
            lifetimeDays: null,
            experience: normalizeExperience(vacancy && (vacancy._experience || vacancy.experience || '')) || 'Не указан'
        };
    }
    var published = parsePublishedAtDate(vacancy.published_at);
    var archivedAt = parsePublishedAtDate(vacancy.archived_at);
    var isArchived = !!(vacancy.archived === true || vacancy.archived === 1 || vacancy.archived === '1' || vacancy.archived === 'true' || archivedAt);
    var newPublished = !!(published && published >= start && published <= end);
    var archivedInPeriod = !!(archivedAt && archivedAt >= start && archivedAt <= end);
    var aliveAtEnd = !!(published && published <= end && (!isArchived || !archivedAt || archivedAt > end));
    var included = newPublished || archivedInPeriod || aliveAtEnd;
    var publishedAndArchived = !!(newPublished && archivedInPeriod);
    var effectiveLifetimeEnd = archivedAt;
    if (!effectiveLifetimeEnd) {
        var now = new Date();
        effectiveLifetimeEnd = end < now ? end : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }
    var lifetimeDays = null;
    if (published && newPublished && effectiveLifetimeEnd) {
        lifetimeDays = Math.max(0, Math.floor((effectiveLifetimeEnd.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)));
    }
    return {
        included: included,
        active: aliveAtEnd,
        archived: archivedInPeriod,
        newPublished: newPublished,
        publishedAndArchived: publishedAndArchived,
        aliveAtEnd: aliveAtEnd,
        lifetimeDays: lifetimeDays,
        experience: normalizeExperience(vacancy && (vacancy._experience || vacancy.experience || '')) || 'Не указан'
    };
}

function totalsComputePeriodVacancyStats(vacancies, periodWindow) {
    var list = Array.isArray(vacancies) ? vacancies : [];
    var total = 0;
    var active = 0;
    var archived = 0;
    var newPublished = 0;
    var publishedAndArchived = 0;
    var activeNewPublished = 0;
    var lifetimeSum = 0;
    var lifetimeCount = 0;
    var breakdown = {
        active: { total: 0, items: {}, periodMetrics: {}, subsets: { newPublished: { total: 0, items: {} } } },
        archived: { total: 0, items: {}, periodMetrics: {}, subsets: { publishedAndArchived: { total: 0, items: {} } } }
    };
    list.forEach(function(vacancy) {
        var entry = totalsClassifyVacancyForPeriod(vacancy, periodWindow);
        if (!entry.included) return;
        total += 1;
        if (entry.active) {
            active += 1;
            breakdown.active.total += 1;
            breakdown.active.items[entry.experience] = (breakdown.active.items[entry.experience] || 0) + 1;
            if (entry.newPublished) {
                activeNewPublished += 1;
                breakdown.active.subsets.newPublished.total += 1;
                breakdown.active.subsets.newPublished.items[entry.experience] = (breakdown.active.subsets.newPublished.items[entry.experience] || 0) + 1;
            }
        }
        if (entry.archived) {
            archived += 1;
            breakdown.archived.total += 1;
            breakdown.archived.items[entry.experience] = (breakdown.archived.items[entry.experience] || 0) + 1;
            if (entry.publishedAndArchived) {
                breakdown.archived.subsets.publishedAndArchived.total += 1;
                breakdown.archived.subsets.publishedAndArchived.items[entry.experience] = (breakdown.archived.subsets.publishedAndArchived.items[entry.experience] || 0) + 1;
            }
        }
        if (entry.newPublished) newPublished += 1;
        if (entry.publishedAndArchived) publishedAndArchived += 1;
        if (entry.newPublished && entry.lifetimeDays !== null && isFinite(entry.lifetimeDays)) {
            lifetimeSum += Number(entry.lifetimeDays);
            lifetimeCount += 1;
        }
    });
    breakdown.active.periodMetrics = {
        total: active,
        newPublished: activeNewPublished,
        shareNewPublished: active ? (activeNewPublished * 100 / active) : 0
    };
    breakdown.archived.periodMetrics = {
        total: archived,
        publishedAndArchived: publishedAndArchived,
        sharePublishedAndArchived: archived ? (publishedAndArchived * 100 / archived) : 0
    };
    return {
        label: String(periodWindow && periodWindow.label || '').trim(),
        start: periodWindow && periodWindow.start,
        end: periodWindow && periodWindow.end,
        total: total,
        active: active,
        archived: archived,
        newPublished: newPublished,
        publishedAndArchived: publishedAndArchived,
        activeNewPublished: activeNewPublished,
        avgLifetimeDays: lifetimeCount ? Math.round((lifetimeSum / lifetimeCount) * 10) / 10 : null,
        breakdown: breakdown
    };
}

function totalsBuildBurnupSeries(vacancies, periodWindows) {
    var windows = Array.isArray(periodWindows) ? periodWindows.filter(Boolean) : [];
    if (!windows.length) return { labels: [], newPublished: [], archived: [], publishedAndArchived: [], active: [] };
    var first = windows[0];
    var last = windows[windows.length - 1];
    var spanDays = first && last ? Math.round((last.end - first.start) / (1000 * 60 * 60 * 24)) : 0;
    var useDaily = windows.length === 1 && spanDays <= 31;
    var expanded = [];
    if (useDaily) {
        var cursor = totalsStartOfDay(first.start);
        var end = totalsStartOfDay(last.end);
        while (cursor && end && cursor <= end) {
            expanded.push({
                label: totalsFormatDayMonthLabel(cursor),
                start: totalsStartOfDay(cursor),
                end: totalsEndOfDay(cursor)
            });
            cursor = totalsAddDays(cursor, 1);
        }
    } else {
        expanded = windows.map(function(window) {
            return {
                label: window.label || totalsFormatDayMonthLabel(window.start),
                start: window.start,
                end: window.end
            };
        });
    }
    var stats = expanded.map(function(window) {
        return totalsComputePeriodVacancyStats(vacancies, window);
    });
    return {
        labels: stats.map(function(item) { return item.label; }),
        newPublished: stats.map(function(item) { return item.newPublished; }),
        archived: stats.map(function(item) { return item.archived; }),
        publishedAndArchived: stats.map(function(item) { return item.publishedAndArchived; }),
        active: stats.map(function(item) { return item.active; })
    };
}

function buildTotalsBurnupPeriodWindows(vacancies) {
    var list = Array.isArray(vacancies) ? vacancies : [];
    var minDate = null;
    var maxDate = null;
    list.forEach(function(vacancy) {
        var published = parsePublishedAtDate(vacancy && vacancy.published_at);
        var archived = parsePublishedAtDate(vacancy && vacancy.archived_at);
        if (published && (!minDate || published < minDate)) minDate = published;
        if (published && (!maxDate || published > maxDate)) maxDate = published;
        if (archived && (!maxDate || archived > maxDate)) maxDate = archived;
    });
    if (!minDate || !maxDate) return [];

    var rangeDays = Math.round((totalsEndOfDay(maxDate) - totalsStartOfDay(minDate)) / (1000 * 60 * 60 * 24));
    if (rangeDays <= 31) {
        return [{
            label: totalsFormatDayMonthLabel(minDate),
            start: totalsStartOfDay(minDate),
            end: totalsEndOfDay(maxDate)
        }];
    }

    var cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    var lastMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    var windows = [];
    while (cursor <= lastMonth) {
        var monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        var monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        windows.push({
            label: String(monthStart.getFullYear()) + '-' + String(monthStart.getMonth() + 1).padStart(2, '0'),
            start: totalsStartOfDay(monthStart < minDate ? minDate : monthStart),
            end: totalsEndOfDay(monthEnd > maxDate ? maxDate : monthEnd)
        });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return windows;
}

function buildTotalsBurnupPeriodLabel(periodWindows) {
    var windows = Array.isArray(periodWindows) ? periodWindows.filter(Boolean) : [];
    if (!windows.length) return 'За период';
    if (windows.length === 1) {
        var window = windows[0];
        var spanDays = Math.round((window.end - window.start) / (1000 * 60 * 60 * 24));
        if (spanDays <= 31) {
            return 'Весь период';
        }
    }
    return typeof formatMonthTitle === 'function' ? formatMonthTitle(windows.length) : ('За ' + windows.length + ' мес.');
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
    var labels = typeof getExperienceLabels === 'function' ? getExperienceLabels() : { total: 'Всего' };
    var hasAllSelection = values.some(function(exp) {
        var text = String(exp || '').trim();
        return text === 'Все' || text === 'Все категории' || normalizeExperience(text) === labels.total;
    });
    if (hasAllSelection) return list;
    var allowed = new Set(values.map(function(exp) { return normalizeExperience(exp); }).filter(Boolean));
    if (!allowed.size) return list;
    return list.filter(function(v) {
        var exp = normalizeExperience(v && (v._experience || v.experience || ''));
        return !!exp && allowed.has(exp);
    });
}

function filterVacanciesBySelectedStatuses(vacancies, selectedStatuses) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var values = Array.isArray(selectedStatuses)
        ? selectedStatuses.map(function(status) { return String(status || '').trim().toLowerCase(); }).filter(Boolean)
        : [];
    if (!values.length) return list;
    var allowed = new Set(values.filter(function(status) {
        return status === 'open' || status === 'archived';
    }));
    if (!allowed.size) return list;
    return list.filter(function(vacancy) {
        var statusValue = isArchivedResponseVacancy(vacancy) ? 'archived' : 'open';
        return allowed.has(statusValue);
    });
}

function hasExplicitGlobalFilterSelection(filterKey) {
    var bucket = ensureGlobalFilterBucket(filterKey);
    return !!((bucket.include && bucket.include.length) || (bucket.exclude && bucket.exclude.length));
}

function getGlobalSkillsFilterSelections() {
    var state = (uiState.skills_search_global && typeof uiState.skills_search_global === 'object')
        ? uiState.skills_search_global
        : {};
    return {
        includeSkills: normalizeSkillsSearchSkillList(state.includeSkills || []),
        excludeSkills: normalizeSkillsSearchSkillList(state.excludeSkills || []),
        logic: state.logic === 'and' ? 'and' : 'or'
    };
}

function hasExplicitGlobalSkillsSelection() {
    var selections = getGlobalSkillsFilterSelections();
    return !!(selections.includeSkills.length || selections.excludeSkills.length);
}

var SHARED_FILTER_FIELD_WIDTH = 'calc(220px * 0.98)';
var SHARED_FILTER_FIELD_MENU_WIDTH = 'calc(220px * 0.98)';
var SHARED_FILTER_WIDE_FIELD_WIDTH = 'calc(280px * 0.98)';
var SHARED_FILTER_WIDE_MENU_WIDTH = 'calc(240px * 0.98)';

function usesRoleWidthSharedFilter(filterKey) {
    return ['roles', 'status', 'currency', 'country', 'interview', 'result', 'offer', 'employer'].indexOf(String(filterKey || '').trim()) >= 0;
}

function getDefaultGlobalPeriodOptionValue(activeRole, analysisType) {
    var options = getGlobalFilterOptions(activeRole, 'periods', analysisType);
    if (!Array.isArray(options) || !options.length) return '';
    var defaultOption = options.find(function(option) {
        return normalizeGlobalPeriodValue(option && option.value) === 'last_14';
    });
    if (!defaultOption) {
        defaultOption = options.find(function(option) {
            return normalizeGlobalPeriodValue(option && option.value) === 'summary';
        });
    }
    if (!defaultOption) {
        defaultOption = options.find(function(option) {
            return /^\d{4}-\d{2}$/.test(String(option && option.value || '').trim());
        });
    }
    return defaultOption ? String(defaultOption.value || '').trim() : '';
}

function hasMeaningfulGlobalPeriodSelection(activeRole, analysisType) {
    var bucket = ensureGlobalFilterBucket('periods');
    var include = Array.isArray(bucket.include) ? bucket.include.filter(Boolean) : [];
    var exclude = Array.isArray(bucket.exclude) ? bucket.exclude.filter(Boolean) : [];
    if (exclude.length) return true;
    if (!include.length) return false;
    if (include.length > 1) return true;
    var defaultValue = getDefaultGlobalPeriodOptionValue(activeRole, analysisType);
    if (!defaultValue) return true;
    return !isSameGlobalFilterValue('periods', include[0], defaultValue);
}

function hasActiveSharedFilterPresetSelection(analysisType) {
    if (typeof getSharedFilterPresetState !== 'function') return false;
    var state = getSharedFilterPresetState(analysisType);
    if (!state || !state.activeId) return false;
    return (state.items || []).some(function(item) {
        return item && item.id === state.activeId;
    });
}

function hasMeaningfulSalaryMetricSelection() {
    var metric = String(uiState.market_trends_salary_metric || 'avg').toLowerCase();
    if (['min', 'max', 'avg', 'median', 'mode'].indexOf(metric) < 0) metric = 'avg';
    return metric !== 'avg';
}

function isSharedFilterSectionFilled(sectionKey, activeRole, analysisType) {
    var key = String(sectionKey || '').trim();
    if (!key) return false;
    if (key === 'my-filters') return hasActiveSharedFilterPresetSelection(analysisType);
    if (key === 'roles') {
        return hasExplicitGlobalFilterSelection('roles')
            || hasMeaningfulGlobalPeriodSelection(activeRole, analysisType)
            || hasExplicitGlobalFilterSelection('experiences')
            || hasExplicitGlobalFilterSelection('status')
            || !!(Array.isArray(uiState.market_trends_excluded_roles) && uiState.market_trends_excluded_roles.length);
    }
    if (key === 'salary') {
        return hasExplicitGlobalFilterSelection('currency')
            || hasExplicitGlobalFilterSelection('country')
            || hasMeaningfulSalaryMetricSelection();
    }
    if (key === 'responses') {
        return hasExplicitGlobalFilterSelection('interview')
            || hasExplicitGlobalFilterSelection('result')
            || hasExplicitGlobalFilterSelection('offer');
    }
    if (key === 'top') {
        return normalizeTotalsTopLimit(uiState.totals_top_limit || 15) > 15;
    }
    if (key === 'vacancy') {
        return hasExplicitGlobalFilterSelection('employer')
            || hasExplicitGlobalFilterSelection('accreditation')
            || hasExplicitGlobalFilterSelection('cover_letter_required')
            || hasExplicitGlobalFilterSelection('has_test');
    }
    if (key === 'skills') {
        return hasExplicitGlobalSkillsSelection();
    }
    return false;
}

function filterVacanciesByCurrencySelection(vacancies, selectedCurrencies) {
    var allowed = new Set((selectedCurrencies || []).map(function(value) {
        return String(value || '').trim().toLowerCase();
    }).filter(Boolean));
    if (!allowed.size) return dedupeVacanciesById((vacancies || []).slice());
    return dedupeVacanciesById((vacancies || []).slice()).filter(function(vacancy) {
        return allowed.has(normalizeGlobalCurrencyFilterValue(vacancy && vacancy.currency));
    });
}

function filterVacanciesByCountrySelection(vacancies, selectedCountries) {
    var allowed = new Set((selectedCountries || []).map(function(value) {
        return String(value || '').trim().toLowerCase();
    }).filter(Boolean));
    if (!allowed.size) return dedupeVacanciesById((vacancies || []).slice());
    return dedupeVacanciesById((vacancies || []).slice()).filter(function(vacancy) {
        return allowed.has(getGlobalCountryFilterValue(vacancy));
    });
}

function filterVacanciesByEmployerSelection(vacancies, selectedEmployers) {
    var allowed = new Set((selectedEmployers || []).map(function(value) {
        return String(value || '').trim().toLowerCase();
    }).filter(Boolean));
    if (!allowed.size) return dedupeVacanciesById((vacancies || []).slice());
    return dedupeVacanciesById((vacancies || []).slice()).filter(function(vacancy) {
        return allowed.has(String(vacancy && vacancy.employer || '').trim().toLowerCase());
    });
}

function filterVacanciesByBooleanSelection(vacancies, filterKey, selectedValues) {
    var allowed = new Set((selectedValues || []).map(function(value) {
        return String(value || '').trim().toLowerCase();
    }).filter(Boolean));
    if (!allowed.size) return dedupeVacanciesById((vacancies || []).slice());
    return dedupeVacanciesById((vacancies || []).slice()).filter(function(vacancy) {
        return allowed.has(getSkillsSearchVacancyBooleanValue(vacancy, filterKey) ? 'true' : 'false');
    });
}

function filterVacanciesByResponseSelection(vacancies, selectedValues, resolver) {
    var allowed = new Set((selectedValues || []).map(function(value) {
        return String(value || '').trim().toLowerCase();
    }).filter(Boolean));
    if (!allowed.size) return dedupeVacanciesById((vacancies || []).slice());
    return dedupeVacanciesById((vacancies || []).slice()).filter(function(vacancy) {
        return allowed.has(resolver(vacancy) ? 'yes' : 'no');
    });
}

function getMergedMyResponseFilterSource(parentRole) {
    var list = Array.isArray(uiState.my_responses_cache) && uiState.my_responses_cache.length
        ? uiState.my_responses_cache.slice()
        : collectMyResponsesVacancies();
    var roleVacancies = [];
    if (typeof getAllRoleContents === 'function') {
        getAllRoleContents().forEach(function(roleContent) {
            roleVacancies = roleVacancies.concat((getRoleVacancies(roleContent) || []).slice());
        });
    } else if (parentRole) {
        roleVacancies = (getRoleVacancies(parentRole) || []).slice();
    }
    var roleVacancyMap = new Map();
    roleVacancies.forEach(function(vacancy) {
        getMyResponseIdCandidates(vacancy).forEach(function(id) {
            if (!roleVacancyMap.has(id)) roleVacancyMap.set(id, vacancy);
        });
    });
    if (!roleVacancyMap.size) return list;
    var matchedByRole = [];
    var enriched = [];
    list.forEach(function(item) {
        var source = null;
        getMyResponseIdCandidates(item).some(function(id) {
            if (!roleVacancyMap.has(id)) return false;
            source = roleVacancyMap.get(id);
            return true;
        });
        var merged = source ? Object.assign({}, source, item) : item;
        enriched.push(merged);
        if (source) matchedByRole.push(merged);
    });
    return matchedByRole.length ? matchedByRole : enriched;
}

function getFilteredVacanciesForAnalysis(parentRole, analysisType, options) {
    options = options || {};
    var current = analysisType || (parentRole ? (parentRole.dataset.activeAnalysis || '') : '') || '';
    var list = Array.isArray(options.sourceVacancies)
        ? options.sourceVacancies.slice()
        : collectScopedVacancies(parentRole);
    list = dedupeVacanciesById(list);

    if (!hasExplicitGlobalFilterSelection('periods')) {
        ensureDefaultPeriodFilterSelection(parentRole, current);
    }
    if (options.respondedOnly) {
        list = list.filter(function(vacancy) {
            return isRespondedVacancy(vacancy);
        });
    }

    if (!options.skipPeriods && hasExplicitGlobalFilterSelection('periods')) {
        var periodOptions = getGlobalFilterOptions(parentRole, 'periods', current);
        var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
        list = options.useResponsePeriods
            ? filterMyResponsesBySelectedPeriods(list, selectedPeriods)
            : (options.useCalendarPeriods
                ? filterResponseCalendarBySelectedPeriods(list, selectedPeriods)
                : filterVacanciesBySelectedPeriods(list, selectedPeriods));
    }

    var selectedExps = Array.isArray(options.forcedExperiences)
        ? options.forcedExperiences.slice()
        : (hasExplicitGlobalFilterSelection('experiences')
            ? getResolvedGlobalFilterValues('experiences', getGlobalFilterOptions(parentRole, 'experiences', current))
            : []);
    if (!options.skipExperiences && selectedExps.length) {
        list = filterVacanciesBySelectedExperiences(list, selectedExps);
    }

    if (!options.skipStatuses && hasExplicitGlobalFilterSelection('status')) {
        var selectedStatuses = getResolvedGlobalFilterValues('status', getGlobalFilterOptions(parentRole, 'status', current));
        list = filterVacanciesBySelectedStatuses(list, selectedStatuses);
    }

    if (!options.skipCurrency && hasExplicitGlobalFilterSelection('currency')) {
        var selectedCurrencies = getResolvedGlobalFilterValues('currency', getGlobalFilterOptions(parentRole, 'currency', current));
        list = filterVacanciesByCurrencySelection(list, selectedCurrencies);
    }

    if (!options.skipCountry && hasExplicitGlobalFilterSelection('country')) {
        var selectedCountries = getResolvedGlobalFilterValues('country', getGlobalFilterOptions(parentRole, 'country', current));
        list = filterVacanciesByCountrySelection(list, selectedCountries);
    }

    if (!options.skipEmployer && hasExplicitGlobalFilterSelection('employer')) {
        var selectedEmployers = getResolvedGlobalFilterValues('employer', getGlobalFilterOptions(parentRole, 'employer', current));
        list = filterVacanciesByEmployerSelection(list, selectedEmployers);
    }

    if (!options.skipAccreditation && hasExplicitGlobalFilterSelection('accreditation')) {
        var selectedAccreditation = getResolvedGlobalFilterValues('accreditation', getGlobalFilterOptions(parentRole, 'accreditation', current));
        list = filterVacanciesByBooleanSelection(list, 'accreditation', selectedAccreditation);
    }

    if (!options.skipCoverLetter && hasExplicitGlobalFilterSelection('cover_letter_required')) {
        var selectedCover = getResolvedGlobalFilterValues('cover_letter_required', getGlobalFilterOptions(parentRole, 'cover_letter_required', current));
        list = filterVacanciesByBooleanSelection(list, 'cover_letter_required', selectedCover);
    }

    if (!options.skipHasTest && hasExplicitGlobalFilterSelection('has_test')) {
        var selectedHasTest = getResolvedGlobalFilterValues('has_test', getGlobalFilterOptions(parentRole, 'has_test', current));
        list = filterVacanciesByBooleanSelection(list, 'has_test', selectedHasTest);
    }

    if (!options.skipInterview && hasExplicitGlobalFilterSelection('interview')) {
        var selectedInterview = getResolvedGlobalFilterValues('interview', getGlobalFilterOptions(parentRole, 'interview', current));
        list = filterVacanciesByResponseSelection(list, selectedInterview, hasScheduledInterview);
    }

    if (!options.skipResult && hasExplicitGlobalFilterSelection('result')) {
        var selectedResult = getResolvedGlobalFilterValues('result', getGlobalFilterOptions(parentRole, 'result', current));
        list = filterVacanciesByResponseSelection(list, selectedResult, hasResultContent);
    }

    if (!options.skipOffer && hasExplicitGlobalFilterSelection('offer')) {
        var selectedOffer = getResolvedGlobalFilterValues('offer', getGlobalFilterOptions(parentRole, 'offer', current));
        list = filterVacanciesByResponseSelection(list, selectedOffer, hasOfferContent);
    }

    if (!options.skipSkills && hasExplicitGlobalSkillsSelection()) {
        var skillSelections = getGlobalSkillsFilterSelections();
        list = filterVacanciesBySkills(
            list,
            skillSelections.includeSkills,
            skillSelections.excludeSkills,
            skillSelections.logic
        );
    }

    return dedupeVacanciesById(list);
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

function getSkillsSourceVacancies(parentRole) {
    if (!parentRole) return [];
    if (parentRole.id === 'role-combined' && parentRole._data && Array.isArray(parentRole._data.skillsVacancies)) {
        return parentRole._data.skillsVacancies.slice();
    }
    return (getRoleVacancies(parentRole) || []).slice();
}

function renderGlobalSkillsFiltered(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.skills-monthly-content');
    if (!block) return;

    if (typeof ensureDefaultPeriodFilterSelection === 'function') {
        ensureDefaultPeriodFilterSelection(parentRole, 'skills-monthly');
    }
    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'skills-monthly');
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'skills-monthly');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var chartExperienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    var vacancies = getFilteredVacanciesForAnalysis(parentRole, 'skills-monthly', {
        sourceVacancies: getSkillsSourceVacancies(parentRole)
    });

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

    if (typeof ensureDefaultPeriodFilterSelection === 'function') {
        ensureDefaultPeriodFilterSelection(parentRole, 'salary');
    }
    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'salary');
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'salary');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var chartExperienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    var vacancies = getFilteredVacanciesForAnalysis(parentRole, 'salary');
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
    if (typeof ensureDefaultPeriodFilterSelection === 'function') {
        ensureDefaultPeriodFilterSelection(parentRole, 'activity');
    }
    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'activity');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'activity');
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    var chartExperienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    var vacancies = getFilteredVacanciesForAnalysis(parentRole, 'activity');
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

    if (typeof ensureDefaultPeriodFilterSelection === 'function') {
        ensureDefaultPeriodFilterSelection(parentRole, 'weekday');
    }
    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'weekday');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'weekday');
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var chartExperienceLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    var vacancies = getFilteredVacanciesForAnalysis(parentRole, 'weekday');
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

    if (typeof ensureDefaultPeriodFilterSelection === 'function') {
        ensureDefaultPeriodFilterSelection(parentRole, 'employer-analysis');
    }
    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'employer-analysis');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    block.dataset.chartContext = buildChartContextLabel(chartPeriodLabel, null);
    var employerFilters = getEmployerAnalysisFilters(parentRole);
    var baseVacancies = getFilteredVacanciesForAnalysis(parentRole, 'employer-analysis', {
        skipPeriods: true
    });
    var rows;
    var effectivePeriods = selectedPeriods.filter(function(label) {
        var text = String(label || '').trim();
        return !isSummaryMonth(text) && text !== 'За период' && text !== 'Весь период' && text !== 'За все время';
    });
    var allPeriod = !selectedPeriods.length || !effectivePeriods.length;
    if (allPeriod) {
        rows = buildEmployerAnalysisRowsFromVacancies(baseVacancies, 'filtered', employerFilters);
    } else {
        rows = buildEmployerAnalysisRowsFromVacancies(filterVacanciesBySelectedPeriods(baseVacancies, selectedPeriods), 'filtered', employerFilters);
    }

    renderEmployerAnalysisTable(block, rows, periodLabel);
    block.dataset.employerActiveMonth = 'global';
    applyEmployerAnalysisViewMode(block, block.dataset.employerViewMode || uiState.employer_analysis_view_mode || 'together');
}

function normalizeTotalsCurrency(value) {
    var v = String(value || '').trim().toUpperCase();
    if (v === 'EURO') return 'EUR';
    if (v === 'RUB') return 'RUR';
    return v;
}
function totalsFormatNumber(value) {
    if (value === null || value === undefined || value === '' || !isFinite(value)) return '—';
    return Math.round(Number(value) * 100) / 100;
}
function totalsFormatSalaryPointValue(value, currency) {
    if (value === null || value === undefined || value === '' || !isFinite(value)) return '—';
    var curr = normalizeTotalsCurrency(currency || '');
    var num = Number(value);
    if (curr === 'RUR') {
        if (Math.abs(num) >= 1000) return Math.round(num / 1000) + 'к';
        return String(Math.round(num));
    }
    return String(Math.round(num * 100) / 100);
}
var TOTALS_OVERVIEW_METRICS = [
    { key: 'min', label: 'Минимум', color: '#FF6262' },
    { key: 'avg', label: 'Среднее', color: '#FE9500' },
    { key: 'median', label: 'Медиана', color: '#007AD8' },
    { key: 'mode', label: 'Мода', color: '#00AD00' },
    { key: 'max', label: 'Максимум', color: '#D149EF' }
];
function totalsNormalizeMetricKey(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}
function totalsGetOverviewMetricSpec(label, index) {
    var normalized = totalsNormalizeMetricKey(label);
    var match = TOTALS_OVERVIEW_METRICS.find(function(item) {
        return totalsNormalizeMetricKey(item.key) === normalized || totalsNormalizeMetricKey(item.label) === normalized;
    });
    if (match) return match;
    var fallback = TOTALS_OVERVIEW_METRICS[index] || TOTALS_OVERVIEW_METRICS[0];
    return {
        key: 'metric-' + index,
        label: String(label || fallback.label || 'Значение').trim() || fallback.label || 'Значение',
        color: fallback.color
    };
}
function totalsBuildOverviewLegendHtml(periodLabel, experienceLabel) {
    var items = [];
    var periodText = String(periodLabel || '').trim();
    var experienceText = String(experienceLabel || '').trim();
    if (periodText) {
        items.push('<div class="totals-overview-legend-item"><strong>' + escapeHtml(periodText) + '</strong></div>');
    }
    if (experienceText) {
        items.push('<div class="totals-overview-legend-item"><span class="totals-overview-legend-label">Опыт</span><strong>' + escapeHtml(experienceText) + '</strong></div>');
    }
    return items.length ? '<div class="totals-overview-legend">' + items.join('') + '</div>' : '';
}
function totalsBuildOverviewPointPositions(groups, minValue, maxValue) {
    var count = Array.isArray(groups) ? groups.length : 0;
    if (!count) return [];
    if (count === 1) return [1];
    var range = maxValue - minValue;
    var raw = groups.map(function(group, index) {
        var base = index / (count - 1);
        var valueRatio = range > 0 ? ((group.value - minValue) / range) : 0.5;
        var edgeStrength = Math.abs(valueRatio - 0.5) * 2;
        var pull = 0.12 + (0.22 * edgeStrength);
        return base + ((valueRatio - base) * pull);
    });
    raw[0] = 0;
    raw[count - 1] = 1;
    var minGap = Math.max(0.12, 0.65 / (count - 1));
    for (var i = 1; i < count; i += 1) {
        if (raw[i] < raw[i - 1] + minGap) raw[i] = raw[i - 1] + minGap;
    }
    var lastPos = raw[count - 1];
    if (lastPos > 1) {
        raw = raw.map(function(pos) {
            return pos / lastPos;
        });
    }
    raw[0] = 0;
    raw[count - 1] = 1;
    return raw;
}
function totalsMetricLabel(metric) {
    if (metric === 'min') return 'Минимальная';
    if (metric === 'max') return 'Максимальная';
    if (metric === 'median') return 'Медиана';
    if (metric === 'mode') return 'Мода';
    return 'Средняя';
}
function assignCompactSalaryPointRows(points) {
    var list = Array.isArray(points) ? points.map(function(point) {
        return Object.assign({}, point);
    }) : [];
    var minHorizontalGap = 12;
    var maxRows = 3;
    var lastLeftByRow = [];
    list.forEach(function(point) {
        var left = Number(point && point.leftPct);
        var assignedRow = maxRows - 1;
        for (var rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
            var lastLeft = lastLeftByRow[rowIndex];
            if (!isFinite(lastLeft) || left - lastLeft >= minHorizontalGap) {
                assignedRow = rowIndex;
                break;
            }
        }
        point.pointRow = assignedRow;
        lastLeftByRow[assignedRow] = left;
    });
    return list;
}
function resolveSalaryChartRenderModel(selectedExperiences, monthData, contextLabel) {
    var selectedExperience = Array.isArray(selectedExperiences) && selectedExperiences.length === 1
        ? String(selectedExperiences[0] || '').trim()
        : '';
    return {
        kind: 'progress-panels',
        experienceLabel: selectedExperience || 'все категории опыта',
        contextLabel: String(contextLabel || '').trim(),
        model: buildSalaryExperienceProgressPanelsModel({
            month: monthData && monthData.month ? monthData.month : '',
            selectedExperience: selectedExperience,
            experiences: monthData && Array.isArray(monthData.experiences) ? monthData.experiences : []
        })
    };
}
function buildTotalsSalarySummaryChartModel(payload, preferredCurrency, metric, selectedExperience) {
    var data = payload || {};
    function normalizeCurrency(value) {
        var current = String(value || '').trim().toUpperCase();
        if (current === 'RUB') return 'RUR';
        if (current === 'EURO') return 'EUR';
        return current;
    }
    var selectedCurrency = normalizeCurrency(preferredCurrency || 'RUR');
    var selectedMetric = String(metric || 'avg').trim().toLowerCase();
    var selectedExperienceLabel = String(selectedExperience || '').trim();
    var pointColors = ['#00C3D3', '#00AADF', '#007AD8', '#7B61E8', '#D149EF'];
    var statusDefs = [
        { key: 'open', compactLabel: 'Открытые', singularLabel: 'Открытая' },
        { key: 'archived', compactLabel: 'Архивные', singularLabel: 'Архивная' },
        { key: 'new', compactLabel: 'Новые за период', singularLabel: 'Новые за период' },
        { key: 'period_archived', compactLabel: 'Опубл. и архив. за период', singularLabel: 'Опубл. и архив. за период' }
    ];
    function normalizeStatusMeta(statusLabel) {
        var label = String(statusLabel || '').trim();
        var normalized = label.toLowerCase();
        if (normalized === 'открытая' || normalized === 'открытые') return statusDefs[0];
        if (normalized === 'архивная' || normalized === 'архивные') return statusDefs[1];
        if (normalized === 'новые за период' || normalized === 'новые') return statusDefs[2];
        if (normalized === 'опубл. и архив. за период' || normalized === 'опубл. и архивир.' || normalized === 'опубликована и архивирована') return statusDefs[3];
        return { key: normalized || 'other', compactLabel: label || 'Не указано', singularLabel: label || 'Не указано' };
    }
    function experienceSortIndex(label) {
        var current = String(label || '').trim().toLowerCase();
        if (current === 'нет опыта') return 0;
        if (current === 'от 1 года до 3 лет') return 1;
        if (current === 'от 3 до 6 лет') return 2;
        if (current === 'более 6 лет') return 3;
        if (typeof getExperienceOrder === 'function') {
            var order = getExperienceOrder();
            if (Object.prototype.hasOwnProperty.call(order, label)) return Number(order[label]) || 99;
        }
        return 99;
    }
    function buildPositions(count) {
        if (!count) return [];
        if (count === 1) return [50];
        if (count === 2) return [0, 100];
        if (count === 3) return [0, 50, 100];
        if (count === 4) return [0, 36, 66, 100];
        return [0, 22, 48, 74, 100];
    }
    function formatValueLabel(value) {
        if (typeof formatCompactThousandsValue === 'function') return formatCompactThousandsValue(value);
        return String(value);
    }
    function assignPointRows(points) {
        var list = Array.isArray(points) ? points.map(function(point) {
            return Object.assign({}, point);
        }) : [];
        var minHorizontalGap = 12;
        var maxRows = 3;
        var lastLeftByRow = [];
        list.forEach(function(point) {
            var left = Number(point && point.leftPct);
            var assignedRow = maxRows - 1;
            for (var rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
                var lastLeft = lastLeftByRow[rowIndex];
                if (!isFinite(lastLeft) || left - lastLeft >= minHorizontalGap) {
                    assignedRow = rowIndex;
                    break;
                }
            }
            point.pointRow = assignedRow;
            lastLeftByRow[assignedRow] = left;
        });
        return list;
    }
    function mergePointItems(items) {
        var list = (items || []).filter(function(item) {
            return item && item.value !== null && item.value !== undefined && isFinite(item.value);
        }).map(function(item) {
            return Object.assign({}, item, { value: Number(item.value) });
        }).sort(function(a, b) {
            return a.value - b.value;
        });
        var grouped = [];
        list.forEach(function(item) {
            var last = grouped.length ? grouped[grouped.length - 1] : null;
            if (last && last.value === item.value) {
                last.labels.push(item.label);
            } else {
                grouped.push({ value: item.value, labels: [item.label], color: item.color });
            }
        });
        var positions = buildPositions(grouped.length);
        return assignPointRows(grouped.map(function(group, index) {
            return {
                label: group.labels.join(', '),
                value: group.value,
                valueLabel: formatValueLabel(group.value),
                color: group.color,
                leftPct: positions[index]
            };
        }));
    }
    function hasSalaryData(entry) {
        if (!entry) return false;
        if (Number(entry.vacancies_with_salary) > 0) return true;
        return ['avg_salary', 'median_salary', 'mode_salary', 'min_salary', 'max_salary'].some(function(key) {
            var value = Number(entry[key]);
            return entry[key] !== null && entry[key] !== undefined && isFinite(value) && value > 0;
        });
    }
    function aggregateLegacyStatuses(currencyModel) {
        var experienceRows = Array.isArray(currencyModel && currencyModel.experiences) ? currencyModel.experiences : [];
        var statusMap = {};
        experienceRows.forEach(function(experienceRow) {
            var tracks = Array.isArray(experienceRow && experienceRow.tracks) ? experienceRow.tracks : [];
            tracks.forEach(function(track) {
                if (!track || !Array.isArray(track.points) || !track.points.length) return;
                var values = track.points.map(function(point) { return Number(point.value); }).filter(function(value) { return isFinite(value); });
                if (!values.length) return;
                statusMap[track.statusKey] = statusMap[track.statusKey] || {
                    statusKey: track.statusKey,
                    label: track.statusLabel || '',
                    values: []
                };
                statusMap[track.statusKey].values = statusMap[track.statusKey].values.concat(values);
            });
        });
        return statusDefs.filter(function(def) {
            return !!statusMap[def.key];
        }).map(function(def) {
            var values = statusMap[def.key].values;
            var avgValue = values.length ? Math.round(values.reduce(function(sum, value) { return sum + value; }, 0) / values.length) : 0;
            return {
                statusKey: def.key,
                label: def.compactLabel,
                value: avgValue,
                valueLabel: formatValueLabel(avgValue),
                widthPct: 0
            };
        });
    }
    if (Array.isArray(data.currencies) && !Array.isArray(data.experiences)) {
        var legacyCurrency = (data.currencies || []).find(function(item) {
            return normalizeCurrency(item && item.currency) === selectedCurrency;
        }) || (data.currencies || [])[0] || { currency: selectedCurrency, experiences: [] };
        var legacyStatuses = aggregateLegacyStatuses(legacyCurrency);
        var legacyMax = legacyStatuses.reduce(function(maxValue, row) {
            return Math.max(maxValue, Number(row.value) || 0);
        }, 0);
        legacyStatuses.forEach(function(row) {
            row.widthPct = legacyMax ? Math.max(12, Math.round((row.value / legacyMax) * 100)) : 0;
        });
        return {
            currency: normalizeCurrency(legacyCurrency.currency || selectedCurrency),
            statuses: legacyStatuses
        };
    }

    var experiences = Array.isArray(data.experiences) ? data.experiences.filter(function(item) {
        return item && !(typeof isSalarySummaryExperience === 'function' && isSalarySummaryExperience(item.experience));
    }) : [];
    if (!selectedExperienceLabel) {
        var legend = experiences.slice().sort(function(a, b) {
            return experienceSortIndex(String(a.experience || '').trim()) - experienceSortIndex(String(b.experience || '').trim());
        }).map(function(item, index) {
            return {
                label: String(item.experience || '').trim(),
                color: pointColors[index % pointColors.length]
            };
        });
        var currencySet = [];
        experiences.forEach(function(experienceRow) {
            (experienceRow.entries || []).forEach(function(entry) {
                if (!hasSalaryData(entry)) return;
                var currency = normalizeCurrency(entry && entry.currency);
                currency = normalizeCurrency(currency);
                if (currency && currencySet.indexOf(currency) === -1) currencySet.push(currency);
            });
        });
        currencySet.sort(function(a, b) {
            var preferred = ['RUR', 'USD', 'EUR'];
            var left = preferred.indexOf(a);
            var right = preferred.indexOf(b);
            if (left === -1 && right === -1) return String(a).localeCompare(String(b), 'ru');
            if (left === -1) return 1;
            if (right === -1) return -1;
            return left - right;
        });
        return {
            title: 'Зарплаты',
            legendMode: 'experience',
            metricLabel: totalsMetricLabel(selectedMetric),
            legend: legend,
            currencies: currencySet.map(function(currency) {
                return {
                    currency: currency,
                    statuses: statusDefs.map(function(statusDef) {
                        var points = mergePointItems(experiences.map(function(experienceRow, index) {
                            var matchedEntry = (experienceRow.entries || []).find(function(entry) {
                                var statusMeta = normalizeStatusMeta(entry && entry.status);
                                return normalizeCurrency(entry && entry.currency) === currency && statusMeta.key === statusDef.key;
                            });
                            var value = matchedEntry ? Number(matchedEntry.avg_salary) : null;
                            return {
                                label: legend[index] ? legend[index].label : String(experienceRow.experience || '').trim(),
                                value: isFinite(value) ? value : null,
                                color: legend[index] ? legend[index].color : pointColors[index % pointColors.length]
                            };
                        }));
                        return {
                            statusKey: statusDef.key,
                            label: statusDef.compactLabel,
                            points: points
                        };
                    })
                };
            })
        };
    }

    var selectedRow = experiences.find(function(item) {
        return String(item.experience || '').trim() === selectedExperienceLabel;
    }) || { experience: selectedExperienceLabel, entries: [] };
    var metricLegend = [
        { label: 'Мин', color: pointColors[0], key: 'min_salary' },
        { label: 'Мода', color: pointColors[1], key: 'mode_salary' },
        { label: 'Медиана', color: pointColors[2], key: 'median_salary' },
        { label: 'Среднее', color: pointColors[3], key: 'avg_salary' },
        { label: 'Макс', color: pointColors[4], key: 'max_salary' }
    ];
    return {
        title: 'Зарплаты',
        legendMode: 'metric',
        metricLabel: totalsMetricLabel(selectedMetric),
        legend: metricLegend.map(function(item) {
            return { label: item.label, color: item.color };
        }),
        currencies: ['RUR', 'USD', 'EUR'].map(function(currency) {
            var matchingEntries = (selectedRow.entries || []).filter(function(entry) {
                return normalizeCurrency(entry && entry.currency) === currency;
            });
            var trackKeys = ['open', 'archived'];
            matchingEntries.forEach(function(entry) {
                var meta = normalizeStatusMeta(entry && entry.status);
                if (trackKeys.indexOf(meta.key) === -1) trackKeys.push(meta.key);
            });
            return {
                currency: currency,
                statuses: trackKeys.map(function(trackKey) {
                    var statusDef = statusDefs.find(function(def) { return def.key === trackKey; }) || normalizeStatusMeta(trackKey);
                    var matchedEntry = matchingEntries.find(function(entry) {
                        return normalizeStatusMeta(entry && entry.status).key === trackKey;
                    });
                    var points = mergePointItems(metricLegend.map(function(metricItem) {
                        var value = matchedEntry ? Number(matchedEntry[metricItem.key]) : null;
                        return {
                            label: metricItem.label,
                            value: isFinite(value) ? value : null,
                            color: metricItem.color
                        };
                    }));
                    return {
                        statusKey: trackKey,
                        label: statusDef.compactLabel || statusDef.singularLabel || statusDef.label || trackKey,
                        points: points
                    };
                })
            };
        })
    };
}
function buildTotalsSalarySummaryChartHtml(summary) {
    var data = summary || {};
    if (Array.isArray(data.currencies)) {
        function pointRowsHtml(rows) {
            return rows.map(function(row) {
                var points = Array.isArray(row && row.points) ? row.points : [];
                return '<div class="salary-summary-chart-row">' +
                    '<div class="salary-summary-chart-label">' + escapeHtml(row && row.label || '—') + '</div>' +
                    '<div class="salary-summary-chart-line">' +
                        '<div class="salary-summary-chart-line-track"></div>' +
                        points.map(function(point) {
                            var color = String(point && point.color || '#94a3b8');
                            var pointLabel = String(point && point.label || '').trim();
                            var leftPct = Number(point && point.leftPct);
                            var pointRow = Number(point && point.pointRow);
                            return '<div class="salary-summary-chart-point" style="left:' + leftPct + '%;--salary-point-row:' + pointRow + ';">' +
                                '<span class="salary-summary-chart-point-dot" style="background:' + escapeHtml(color) + ';"></span>' +
                                '<span class="salary-summary-chart-point-text" style="color:' + escapeHtml(color) + ';">' + escapeHtml(pointLabel || '—') + '</span>' +
                                '<span class="salary-summary-chart-point-value">' + escapeHtml(point && point.valueLabel || '—') + '</span>' +
                            '</div>';
                        }).join('') +
                    '</div>' +
                '</div>';
            }).join('');
        }
        var legend = Array.isArray(data.legend) ? data.legend : [];
        return '<div class="salary-summary-chart salary-summary-chart-compact salary-summary-chart-points">' +
            '<div class="salary-summary-chart-head">' +
                '<div class="salary-summary-chart-title">' + escapeHtml(String(data.title || ((data.metricLabel ? String(data.metricLabel) + ' зарплаты' : 'Средняя зарплата')))) + '</div>' +
                '<div class="salary-summary-chart-subtitle">' + escapeHtml(data.legendMode === 'metric' ? 'По зарплатным метрикам' : 'По группам опыта') + '</div>' +
            '</div>' +
            (legend.length ? '<div class="salary-summary-chart-legend salary-summary-chart-legend-text">' + legend.map(function(item) {
                var color = String(item && item.color || '#94a3b8');
                return '<div class="salary-summary-chart-legend-item">' +
                    '<span class="salary-summary-chart-legend-label" style="color:' + escapeHtml(color) + ';">' + escapeHtml(item && item.label || '—') + '</span>' +
                '</div>';
            }).join('') + '</div>' : '') +
            '<div class="salary-summary-chart-body salary-summary-chart-body-points">' +
                (data.currencies || []).map(function(currencyModel) {
                    var rows = Array.isArray(currencyModel && currencyModel.statuses) ? currencyModel.statuses : [];
                    return '<section class="salary-summary-chart-currency-section">' +
                        '<div class="salary-summary-chart-currency-head">' +
                            '<div class="salary-summary-chart-currency-title">' + escapeHtml(currencyModel && currencyModel.currency || '—') + '</div>' +
                        '</div>' +
                        pointRowsHtml(rows) +
                    '</section>';
                }).join('') +
            '</div>' +
        '</div>';
    }
    var statuses = Array.isArray(data.statuses) ? data.statuses : [];
    return '<div class="salary-summary-chart">' +
        '<div class="salary-summary-chart-head">' +
            '<div class="salary-summary-chart-title">' + escapeHtml((data.currency || 'RUR') + ' · средняя зарплата') + '</div>' +
        '</div>' +
        '<div class="salary-summary-chart-body">' +
            statuses.map(function(row) {
                return '<div class="salary-summary-chart-row salary-summary-chart-row-bars">' +
                    '<div class="salary-summary-chart-label">' + escapeHtml(row.label || '—') + '</div>' +
                    '<div class="salary-summary-chart-bar-wrap">' +
                        '<div class="salary-summary-chart-bar" style="width:' + escapeHtml(String(row.widthPct || 0)) + '%;"></div>' +
                        '<div class="salary-summary-chart-bar-value">' + escapeHtml(row.valueLabel || '—') + '</div>' +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>' +
    '</div>';
}
function buildSalaryProgressPanelsHtml(model, contextLabel) {
    var data = model || {};
    var currencies = Array.isArray(data.currencies) ? data.currencies : [];
    function normalizeStatusLabel(label) {
        var current = String(label || '').trim();
        if (current === 'Открытые') return 'Открытая';
        if (current === 'Архивные') return 'Архивная';
        return current;
    }
    function buildMetricChipsHtml(points) {
        var list = Array.isArray(points) ? points : [];
        if (!list.length) return '<span class="salary-progress-status-empty">нет данных</span>';
        return '<div class="salary-progress-status-metrics">' + list.map(function(point) {
            return '<span class="salary-progress-metric-chip">' +
                '<span class="salary-progress-metric-chip-label">' + escapeHtml(point.labels || '—') + '</span>' +
                '<span class="salary-progress-metric-chip-value">' + escapeHtml(formatCompactThousandsValue(point.value)) + '</span>' +
            '</span>';
        }).join('') + '</div>';
    }
    return '<div class="salary-progress-panels">' +
        currencies.map(function(currencyRow) {
            var experienceRows = Array.isArray(currencyRow && currencyRow.experiences) ? currencyRow.experiences : [];
            return '<section class="salary-progress-currency-section">' +
                '<div class="salary-progress-currency-head">' +
                    '<div class="salary-progress-currency-title">' + escapeHtml(currencyRow && currencyRow.currency || '—') + '</div>' +
                    (contextLabel ? '<div class="salary-progress-currency-context">' + escapeHtml(contextLabel) + '</div>' : '') +
                '</div>' +
                experienceRows.map(function(experienceRow) {
                    var tracks = Array.isArray(experienceRow && experienceRow.tracks) ? experienceRow.tracks : [];
                    var referenceTrack = tracks.find(function(track) { return track && Array.isArray(track.points) && track.points.length; }) || { points: [] };
                    return '<div class="salary-progress-experience-divider">' +
                        '<div class="salary-progress-experience-title">' + escapeHtml(experienceRow && experienceRow.experience || '—') + '</div>' +
                        '<div class="salary-progress-track">' +
                            '<div class="salary-progress-track-line"></div>' +
                            (referenceTrack.points || []).map(function(point) {
                                return '<div class="salary-progress-track-point" style="left:' + escapeHtml(String(point.positionPct)) + '%;">' +
                                    '<span class="salary-progress-track-point-dot"></span>' +
                                    '<span class="salary-progress-track-point-label">' + escapeHtml(point.labels || '—') + '</span>' +
                                    '<span class="salary-progress-track-point-value">' + escapeHtml(formatCompactThousandsValue(point.value)) + '</span>' +
                                '</div>';
                            }).join('') +
                        '</div>' +
                        '<div class="salary-progress-status-list">' +
                            tracks.map(function(track) {
                                return '<div class="salary-progress-status-item">' +
                                    '<span class="salary-progress-status-name">' + escapeHtml(normalizeStatusLabel(track.statusLabel || '—')) + '</span>' +
                                    '<div class="salary-progress-status-values">' + buildMetricChipsHtml(track.empty ? [] : (track.points || [])) + '</div>' +
                                '</div>';
                            }).join('') +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</section>';
        }).join('') +
    '</div>';
}
function buildTotalsSalaryProgressSource(model) {
    var data = model || {};
    var currencies = Array.isArray(data.currencies) ? data.currencies : [];
    return currencies.map(function(currencyRow) {
        var statuses = Array.isArray(currencyRow && currencyRow.statuses) ? currencyRow.statuses : [];
        return {
            currency: currencyRow && currencyRow.currency || '',
            statuses: statuses.map(function(statusRow) {
                var label = String(statusRow && statusRow.statusLabel || '').trim().toLowerCase();
                if (label === 'новые') label = 'новые';
                if (label === 'опубл. и архив.') label = 'опубл. и архивир.';
                return {
                    statusKey: statusRow && statusRow.statusKey || '',
                    shortLabel: label === 'новые' ? 'Новые' : (label === 'опубл. и архивир.' ? 'Опубл. и архивир.' : String(statusRow && statusRow.statusLabel || '').trim()),
                    points: Array.isArray(statusRow && statusRow.points) ? statusRow.points : []
                };
            })
        };
    });
}
function buildTotalsSalaryOverviewSectionHtml(summaryChart, progressPanels) {
    return '<div class="salary-overview-stack">' +
        buildSalaryOverviewChartHtml(summaryChart || {}) +
    '</div>';
}
function buildSalaryOverviewChartHtml(model) {
    var data = model || {};
    var currencies = Array.isArray(data.currencies) ? data.currencies : [];
    function colorToTint(color, alpha) {
        var current = String(color || '').trim();
        var match = current.match(/^#([0-9a-f]{6})$/i);
        if (!match) return 'rgba(148, 163, 184, ' + String(alpha || 0.18) + ')';
        var hex = match[1];
        var red = parseInt(hex.slice(0, 2), 16);
        var green = parseInt(hex.slice(2, 4), 16);
        var blue = parseInt(hex.slice(4, 6), 16);
        return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + String(alpha || 0.18) + ')';
    }
    function buildLegendHtml() {
        var legend = Array.isArray(data.legend) ? data.legend : [];
        if (!legend.length) return '';
        return '<div class="salary-overview-legend">' + legend.map(function(item) {
            var color = String(item && item.color || '#94a3b8');
            var gradient = String(item && item.gradient || '').trim();
            var chipStyle = gradient
                ? 'background-image:' + escapeHtml(gradient) + ';background-color:rgba(255,255,255,0.18);background-blend-mode:screen;border-color:transparent;color:#0f172a;'
                : 'color:' + escapeHtml(color) + ';background:' + escapeHtml(colorToTint(color, 0.14)) + ';border-color:' + escapeHtml(colorToTint(color, 0.28)) + ';';
            return '<span class="salary-overview-legend-label' + (gradient ? ' is-gradient' : '') + '" style="' + chipStyle + '">' + escapeHtml(item && item.label || '—') + '</span>';
        }).join('') + '</div>';
    }
    function buildCurrencySectionHtml(currencyRow) {
        var currency = String(currencyRow && currencyRow.currency || '—');
        var statuses = Array.isArray(currencyRow && currencyRow.statuses) ? currencyRow.statuses : [];
        var expanded = !!(currencyRow && currencyRow.expanded);
        return '<section class="salary-overview-currency-section' + (expanded ? ' is-expanded' : '') + '" data-currency="' + escapeHtml(currency) + '">' +
            '<button type="button" class="salary-overview-currency-button" data-currency="' + escapeHtml(currency) + '" aria-expanded="' + (expanded ? 'true' : 'false') + '">' +
                '<span class="salary-overview-currency-title">' + escapeHtml(currency) + '</span>' +
            '</button>' +
            '<div class="salary-overview-currency-panel"' + (expanded ? '' : ' hidden') + '>' +
                statuses.map(function(statusRow) {
                    var points = Array.isArray(statusRow && statusRow.points) ? statusRow.points : [];
                    return '<div class="salary-overview-status-row">' +
                        '<div class="salary-overview-status-label">' + escapeHtml(statusRow && statusRow.statusLabel || '—') + '</div>' +
                        '<div class="salary-overview-track">' +
                            '<div class="salary-overview-track-line"></div>' +
                            points.map(function(point) {
                                var color = String(point && point.color || '#94a3b8');
                                var gradient = String(point && point.gradient || '').trim();
                                var textColor = String(point && point.textColor || color || '#94a3b8');
                                var dotStyle = gradient
                                    ? 'background-image:' + escapeHtml(gradient) + ';background-color:' + escapeHtml(color) + ';'
                                    : 'background:' + escapeHtml(color) + ';';
                                var valueStyle = gradient
                                    ? 'color:#0f172a;'
                                    : 'color:' + escapeHtml(color) + ';';
                                return '<div class="salary-overview-track-point" style="left:' + escapeHtml(String(point && point.leftPct || 0)) + '%;--salary-point-row:' + escapeHtml(String(point && point.pointRow || 0)) + ';">' +
                                    '<span class="salary-overview-track-point-dot' + (gradient ? ' is-gradient' : '') + '" style="' + dotStyle + '"></span>' +
                                    '<span class="salary-overview-track-point-value' + (gradient ? ' is-gradient' : '') + '" style="' + valueStyle + '">' + escapeHtml(point && point.valueLabel || '—') + '</span>' +
                                '</div>';
                            }).join('') +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
        '</section>';
    }
    if (!currencies.length) {
        return '<div class="salary-overview-chart">' +
            '<div class="salary-overview-empty">Нет данных по зарплате для выбранных фильтров</div>' +
        '</div>';
    }
    return '<div class="salary-overview-chart">' +
        buildLegendHtml() +
        '<div class="salary-overview-currencies">' +
            currencies.map(buildCurrencySectionHtml).join('') +
        '</div>' +
    '</div>';
}
function normalizeTotalsTopLimit(value) {
    var num = Number(value);
    if (!isFinite(num)) num = 15;
    num = Math.round(num);
    if (num < 15) num = 15;
    if (num > 200) num = 200;
    return num;
}
function normalizeTotalsTopOrder(value, allowed, fallback) {
    var current = String(value || '').trim().toLowerCase();
    return (allowed || []).indexOf(current) >= 0 ? current : fallback;
}
function normalizeTotalsClosingWindow(value) {
    return normalizeTotalsTopOrder(value, ['lte_7', 'lte_14', 'lte_30', 'gt_30', 'gt_60'], 'lte_7');
}
function totalsClosingWindowLabel(value) {
    var current = normalizeTotalsClosingWindow(value);
    if (current === 'lte_14') return 'До 14 дней';
    if (current === 'lte_30') return 'До 30 дней';
    if (current === 'gt_30') return 'Более 30 дней';
    if (current === 'gt_60') return 'Более 60 дней';
    return 'До 7 дней';
}
function totalsSortSkillsRows(rows, sortOrder) {
    var order = normalizeTotalsTopOrder(sortOrder, ['most', 'least'], 'most');
    return (rows || []).slice().sort(function(a, b) {
        if (order === 'least') {
            return (a.mentions - b.mentions)
                || String(a.skill).localeCompare(String(b.skill), 'ru');
        }
        return (b.mentions - a.mentions)
            || String(a.skill).localeCompare(String(b.skill), 'ru');
    });
}
// ===== Глобальный обработчик кликов по воронке =====
function handleFunnelClick(filterKey, filterValue, roleSuffix) {
    if (filterKey && filterValue) {
        updateGlobalFilterSelection(filterKey, filterValue, 'include', true);
    }
    var targetRole = document.getElementById('role-' + roleSuffix);
    if (!targetRole || targetRole.id === 'role-all') {
        targetRole = document.querySelector('.role-content:not(#role-all):not(#role-combined)');
    }
    if (!targetRole) return;
    ensureMyResponsesTab(targetRole);
    var myResponsesBtn = targetRole.querySelector('.analysis-button[data-analysis-id^="my-responses-"]');
    if (myResponsesBtn) myResponsesBtn.click();
}

function totalsComputeSalaryByCurrency(vacancies) {
    var buckets = {
        RUR: { currency: 'RUR', total: 0, withSalary: 0, values: [] },
        USD: { currency: 'USD', total: 0, withSalary: 0, values: [] },
        EUR: { currency: 'EUR', total: 0, withSalary: 0, values: [] }
    };
    (vacancies || []).forEach(function(v) {
        var curr = normalizeTotalsCurrency(v && v.currency);
        if (!buckets[curr]) return;
        buckets[curr].total += 1;
        var salaryValue = computeSalaryValue(v || {}, curr);
        if (salaryValue !== null && salaryValue !== undefined && isFinite(salaryValue)) {
            buckets[curr].withSalary += 1;
            buckets[curr].values.push(Number(salaryValue));
        }
    });
    return ['RUR', 'USD', 'EUR'].map(function(curr) {
        var b = buckets[curr];
        var vals = b.values.slice();
        var avg = vals.length ? (vals.reduce(function(s, x) { return s + x; }, 0) / vals.length) : null;
        var median = vals.length ? computeMedian(vals) : null;
        var mode = vals.length ? computeMode(vals) : null;
        var min = vals.length ? Math.min.apply(Math, vals) : null;
        var max = vals.length ? Math.max.apply(Math, vals) : null;
        return {
            currency: curr,
            total: b.total,
            withSalary: b.withSalary,
            coverage: b.total ? (b.withSalary * 100 / b.total) : 0,
            avg: avg,
            median: median,
            mode: mode,
            min: min,
            max: max
        };
    });
}
function totalsComputeSalaryCoverage(vacancies) {
    var list = Array.isArray(vacancies) ? vacancies : [];
    var stats = {
        total: list.length,
        withSalary: 0,
        withoutSalary: 0,
        withSalaryShare: 0,
        withoutSalaryShare: 0,
        currencies: {
            RUR: { count: 0, share: 0 },
            USD: { count: 0, share: 0 },
            EUR: { count: 0, share: 0 },
            other: { count: 0, share: 0 }
        }
    };
    list.forEach(function(v) {
        var curr = normalizeTotalsCurrency(v && v.currency);
        var salaryValue = computeSalaryValue(v || {}, curr);
        if (salaryValue !== null && salaryValue !== undefined && isFinite(salaryValue)) {
            stats.withSalary += 1;
            if (curr === 'RUR' || curr === 'USD' || curr === 'EUR') stats.currencies[curr].count += 1;
            else stats.currencies.other.count += 1;
        } else {
            stats.withoutSalary += 1;
        }
    });
    stats.withSalaryShare = stats.total ? Math.round((stats.withSalary * 10000) / stats.total) / 100 : 0;
    stats.withoutSalaryShare = stats.total ? Math.round((stats.withoutSalary * 10000) / stats.total) / 100 : 0;
    Object.keys(stats.currencies).forEach(function(key) {
        stats.currencies[key].share = stats.withSalary
            ? Math.round((stats.currencies[key].count * 10000) / stats.withSalary) / 100
            : 0;
    });
    return stats;
}
function normalizeEmployerOverviewCurrency(value) {
    var current = String(value || '').trim().toUpperCase();
    if (current === 'RUB') return 'RUR';
    if (current === 'EURO') return 'EUR';
    if (current === 'ДРУГАЯ' || current === 'OTHER') return 'OTHER';
    return ['RUR', 'USD', 'EUR'].indexOf(current) >= 0 ? current : 'RUR';
}
function normalizeEmployerOverviewMetric(value) {
    var current = String(value || '').trim().toLowerCase();
    return ['min', 'avg', 'median', 'mode', 'max'].indexOf(current) >= 0 ? current : 'avg';
}
function resolveEmployerOverviewFilters(selectedCurrencyValues, metricValue) {
    var normalizedCurrencies = Array.isArray(selectedCurrencyValues)
        ? selectedCurrencyValues.map(function(value) {
            return normalizeEmployerOverviewCurrency(value);
        }).filter(Boolean)
        : [];
    var currency = normalizedCurrencies.length ? normalizedCurrencies[0] : 'RUR';
    return {
        currency: currency,
        metric: normalizeEmployerOverviewMetric(metricValue)
    };
}
function buildEmployerOverviewChartModel(vacancies, currency, metric) {
    var selectedCurrency = normalizeEmployerOverviewCurrency(currency);
    var selectedMetric = normalizeEmployerOverviewMetric(metric);
    var list = dedupeVacanciesById(Array.isArray(vacancies) ? vacancies.slice() : []);
    var categories = [
        { key: 'accr_false', label: 'ИТ-аккредитация: Нет' },
        { key: 'accr_true', label: 'ИТ-аккредитация: Да' },
        { key: 'test_false', label: 'Тестовое задание: Нет' },
        { key: 'test_true', label: 'Тестовое задание: Да' },
        { key: 'cover_false', label: 'Сопроводительное письмо: Нет' },
        { key: 'cover_true', label: 'Сопроводительное письмо: Да' },
        { key: 'rating_unknown', label: 'Рейтинг: нет рейтинга' },
        { key: 'rating_lt_35', label: 'Рейтинг: <3.5' },
        { key: 'rating_35_399', label: 'Рейтинг: 3.5-3.99' },
        { key: 'rating_40_449', label: 'Рейтинг: 4.0-4.49' },
        { key: 'rating_ge_45', label: 'Рейтинг: >=4.5' }
    ];
    var buckets = {};
    categories.forEach(function(category) {
        buckets[category.key] = [];
    });

    function normalizeCurrencyKey(value) {
        var current = String(value || '').trim().toUpperCase();
        if (!current) return '';
        if (current === 'RUB') return 'RUR';
        if (current === 'EURO') return 'EUR';
        return ['RUR', 'USD', 'EUR'].indexOf(current) >= 0 ? current : 'OTHER';
    }
    function resolveBucketKey(factorKey, valueKey) {
        if (factorKey === 'accreditation') return valueKey === 'true' ? 'accr_true' : 'accr_false';
        if (factorKey === 'has_test') return valueKey === 'true' ? 'test_true' : 'test_false';
        if (factorKey === 'cover_letter_required') return valueKey === 'true' ? 'cover_true' : 'cover_false';
        if (factorKey === 'rating_bucket') {
            if (valueKey === 'unknown') return 'rating_unknown';
            if (valueKey === '<3.5') return 'rating_lt_35';
            if (valueKey === '3.5-3.99') return 'rating_35_399';
            if (valueKey === '4.0-4.49') return 'rating_40_449';
            if (valueKey === '>=4.5') return 'rating_ge_45';
        }
        return '';
    }
    function computeMetricValue(values) {
        var list = Array.isArray(values) ? values.filter(function(item) {
            return item !== null && item !== undefined && isFinite(item);
        }) : [];
        if (!list.length) return null;
        if (selectedMetric === 'min') return Math.min.apply(Math, list);
        if (selectedMetric === 'max') return Math.max.apply(Math, list);
        if (selectedMetric === 'median') {
            var sortedMedian = list.slice().sort(function(a, b) { return a - b; });
            var middle = Math.floor(sortedMedian.length / 2);
            return sortedMedian.length % 2
                ? sortedMedian[middle]
                : (sortedMedian[middle - 1] + sortedMedian[middle]) / 2;
        }
        if (selectedMetric === 'mode') {
            var counts = new Map();
            list.forEach(function(item) {
                counts.set(item, (counts.get(item) || 0) + 1);
            });
            var bestValue = list[0];
            var bestCount = counts.get(bestValue) || 0;
            counts.forEach(function(count, value) {
                if (count > bestCount || (count === bestCount && Number(value) < Number(bestValue))) {
                    bestValue = Number(value);
                    bestCount = count;
                }
            });
            return Number(bestValue);
        }
        return list.reduce(function(sum, item) { return sum + Number(item); }, 0) / list.length;
    }

    list.forEach(function(vacancy) {
        var currencyKey = normalizeCurrencyKey(vacancy && (vacancy.salary_currency || vacancy.currency));
        if (!currencyKey || currencyKey !== selectedCurrency) return;
        var salary = computeSalaryValue(vacancy || {}, selectedCurrency === 'OTHER' ? 'Другая' : selectedCurrency);
        if (salary === null || salary === undefined || !isFinite(salary)) return;
        [
            ['accreditation', getSkillsSearchVacancyBooleanValue(vacancy, 'accreditation') ? 'true' : 'false'],
            ['has_test', getSkillsSearchVacancyBooleanValue(vacancy, 'has_test') ? 'true' : 'false'],
            ['cover_letter_required', getSkillsSearchVacancyBooleanValue(vacancy, 'cover_letter_required') ? 'true' : 'false'],
            ['rating_bucket', getEmployerRatingBucketFromVacancy(vacancy)]
        ].forEach(function(item) {
            var bucketKey = resolveBucketKey(item[0], item[1]);
            if (!bucketKey || !buckets[bucketKey]) return;
            buckets[bucketKey].push(Number(salary));
        });
    });

    return {
        currency: selectedCurrency,
        metric: selectedMetric,
        labels: categories.map(function(category) { return category.label; }),
        values: categories.map(function(category) {
            return computeMetricValue(buckets[category.key]);
        })
    };
}

function normalizeEmployerAnalysisVacancyCurrency(value) {
    var current = String(value || '').trim().toUpperCase();
    if (!current) return '';
    if (current === 'RUB') return 'RUR';
    if (current === 'EURO') return 'EUR';
    return ['RUR', 'USD', 'EUR'].indexOf(current) >= 0 ? current : 'OTHER';
}

function computeEmployerAnalysisMetricValue(values, metric) {
    var selectedMetric = normalizeEmployerOverviewMetric(metric || 'avg');
    var list = Array.isArray(values) ? values.filter(function(item) {
        return item !== null && item !== undefined && isFinite(item);
    }).map(function(item) {
        return Number(item);
    }) : [];
    if (!list.length) return null;
    if (selectedMetric === 'min') return Math.min.apply(Math, list);
    if (selectedMetric === 'max') return Math.max.apply(Math, list);
    if (selectedMetric === 'median') return computeMedian(list);
    if (selectedMetric === 'mode') return computeMode(list);
    return list.reduce(function(sum, item) { return sum + item; }, 0) / list.length;
}

function getEmployerAnalysisFilters(parentRole) {
    var selectedCurrencyValues = hasExplicitGlobalFilterSelection('currency')
        ? getResolvedGlobalFilterValues('currency', getGlobalFilterOptions(parentRole, 'currency', 'employer-analysis'))
        : [];
    var currency = selectedCurrencyValues.length
        ? normalizeEmployerOverviewCurrency(selectedCurrencyValues[0])
        : normalizeEmployerOverviewCurrency(uiState.totals_employer_currency || 'RUR');
    var metric = normalizeEmployerOverviewMetric(
        uiState.totals_employer_salary_metric || uiState.market_trends_salary_metric || 'avg'
    );
    uiState.totals_employer_currency = currency;
    uiState.totals_employer_salary_metric = metric;
    return {
        currency: currency,
        currencyLabel: currency === 'OTHER' ? 'Другая валюта' : currency,
        metric: metric,
        metricLabel: totalsMetricLabel(metric)
    };
}

function getEmployerChartValueLabel(valueKey) {
    if (valueKey === 'true') return 'Да';
    if (valueKey === 'false') return 'Нет';
    if (valueKey === 'unknown') return 'нет рейтинга';
    return String(valueKey || '');
}
function totalsComputeSkillsCost(vacancies, currency) {
    var curr = normalizeTotalsCurrency(currency || 'RUR');
    var map = new Map();
    (vacancies || []).forEach(function(v) {
        if (normalizeTotalsCurrency(v && v.currency) !== curr) return;
        if (!v || !v.skills) return;
        var salaryValue = computeSalaryValue(v, curr);
        String(v.skills).split(',').map(function(s) { return String(s || '').trim(); }).filter(Boolean).forEach(function(skill) {
            var key = normalizeSkillName(skill);
            if (!key) return;
            var row = map.get(key) || { skill: skill, mentions: 0, values: [] };
            row.mentions += 1;
            if (salaryValue !== null && salaryValue !== undefined && isFinite(salaryValue)) row.values.push(Number(salaryValue));
            if (String(row.skill || '').length > String(skill || '').length) row.skill = skill;
            map.set(key, row);
        });
    });
    return Array.from(map.values()).map(function(row) {
        var vals = row.values.slice();
        return {
            skill: row.skill,
            mentions: row.mentions,
            avg: vals.length ? vals.reduce(function(s, x) { return s + x; }, 0) / vals.length : null,
            median: vals.length ? computeMedian(vals) : null,
            mode: vals.length ? computeMode(vals) : null,
            min: vals.length ? Math.min.apply(Math, vals) : null,
            max: vals.length ? Math.max.apply(Math, vals) : null
        };
    }).sort(function(a, b) {
        return (b.mentions - a.mentions) || String(a.skill).localeCompare(String(b.skill), 'ru');
    });
}
function totalsComputeCompanyStats(vacancies, currency) {
    var curr = normalizeTotalsCurrency(currency || 'RUR');
    var map = new Map();
    (vacancies || []).forEach(function(v) {
        if (!v || !v.employer) return;
        if (normalizeTotalsCurrency(v.currency) !== curr) return;
        var employer = String(v.employer || '').trim();
        if (!employer) return;
        var row = map.get(employer) || {
            employer: employer,
            total: 0,
            values: [],
            accredited: '',
            rating: '',
            trusted: '',
            url: ''
        };
        row.total += 1;
        if (!row.accredited && v.employer_accredited !== undefined && v.employer_accredited !== null) row.accredited = String(v.employer_accredited);
        if (!row.rating && v.employer_rating !== undefined && v.employer_rating !== null) row.rating = String(v.employer_rating);
        if (!row.trusted && v.employer_trusted !== undefined && v.employer_trusted !== null) row.trusted = String(v.employer_trusted);
        if (!row.url && v.employer_url) row.url = String(v.employer_url);
        var salaryValue = computeSalaryValue(v, curr);
        if (salaryValue !== null && salaryValue !== undefined && isFinite(salaryValue)) row.values.push(Number(salaryValue));
        map.set(employer, row);
    });
    return Array.from(map.values()).map(function(row) {
        var vals = row.values.slice();
        return {
            employer: row.employer,
            total: row.total,
            accredited: row.accredited,
            rating: row.rating,
            trusted: row.trusted,
            url: row.url,
            avg: vals.length ? vals.reduce(function(s, x) { return s + x; }, 0) / vals.length : null,
            median: vals.length ? computeMedian(vals) : null,
            mode: vals.length ? computeMode(vals) : null,
            min: vals.length ? Math.min.apply(Math, vals) : null,
            max: vals.length ? Math.max.apply(Math, vals) : null
        };
    }).sort(function(a, b) {
        return (b.total - a.total) || String(a.employer).localeCompare(String(b.employer), 'ru');
    });
}
function totalsComputeCompanySalaryLeaders(vacancies, currency, direction) {
    var order = normalizeTotalsTopOrder(direction, ['high', 'low'], 'high');
    return totalsComputeCompanyStats(vacancies, currency).filter(function(row) {
        return row.avg !== null && row.avg !== undefined && isFinite(row.avg);
    }).sort(function(a, b) {
        if (order === 'low') {
            return (Number(a.avg || 0) - Number(b.avg || 0))
                || (Number(a.median || 0) - Number(b.median || 0))
                || (b.total - a.total)
                || String(a.employer).localeCompare(String(b.employer), 'ru');
        }
        return (Number(b.avg || 0) - Number(a.avg || 0))
            || (Number(b.median || 0) - Number(a.median || 0))
            || (b.total - a.total)
            || String(a.employer).localeCompare(String(b.employer), 'ru');
    });
}
function setEmployerAnalysisTableOnlyMode(block) {
    if (!block) return 'table';
    block.dataset.employerViewMode = 'table';
    var viewToggle = block.querySelector('.employer-view-toggle');
    if (viewToggle) {
        viewToggle.style.display = 'none';
        viewToggle.setAttribute('hidden', 'hidden');
    }
    var graph = block.querySelector('.employer-analysis-graph');
    if (graph) {
        if (typeof Plotly !== 'undefined' && typeof Plotly.purge === 'function') {
            try {
                Plotly.purge(graph);
            } catch (_e) {
                // ignore purge errors for detached nodes
            }
        }
        graph.innerHTML = '';
        graph.style.display = 'none';
        graph.setAttribute('hidden', 'hidden');
    }
    var table = block.querySelector('.employer-analysis-table-container') || block.querySelector('.table-container');
    if (table) {
        table.style.display = 'block';
        table.style.width = '100%';
        table.style.maxWidth = 'none';
        table.style.flex = '1 1 auto';
    }
    var layoutRoot = block.querySelector('.employer-analysis-main') || block.querySelector('.employer-analysis-view');
    if (layoutRoot) {
        layoutRoot.style.display = 'block';
        layoutRoot.style.width = '100%';
        layoutRoot.style.maxWidth = 'none';
    }
    return 'table';
}
function totalsComputeTopVacanciesBySalary(vacancies, currency, direction) {
    var curr = normalizeTotalsCurrency(currency || 'RUR');
    var order = normalizeTotalsTopOrder(direction, ['high', 'low'], 'high');
    return (vacancies || []).map(function(v) {
        if (!v) return null;
        var isArchived = !!(v.archived === true || v.archived === 1 || v.archived === '1' || String(v.archived || '').toLowerCase() === 'true' || v.archived_at);
        if (isArchived) return null;
        if (normalizeTotalsCurrency(v.currency) !== curr) return null;
        var salaryValue = computeSalaryValue(v, curr);
        if (salaryValue === null || salaryValue === undefined || !isFinite(salaryValue)) return null;
        return {
            id: v.id || '',
            name: String(v.name || '').trim(),
            employer: String(v.employer || '').trim(),
            employerAccredited: String(v.employer_accredited || '').trim(),
            employerRating: String(v.employer_rating || '').trim(),
            employerTrusted: String(v.employer_trusted || '').trim(),
            employerUrl: String(v.employer_url || '').trim(),
            salary: Number(salaryValue),
            currency: curr,
            responded: isRespondedVacancy(v)
        };
    }).filter(Boolean).sort(function(a, b) {
        if (order === 'low') {
            return (a.salary - b.salary)
                || Number(String(b.id || '').replace(/[^\d]/g, '') || 0) - Number(String(a.id || '').replace(/[^\d]/g, '') || 0);
        }
        return (b.salary - a.salary)
            || Number(String(b.id || '').replace(/[^\d]/g, '') || 0) - Number(String(a.id || '').replace(/[^\d]/g, '') || 0);
    });
}
function totalsMatchClosingWindow(ageDays, windowKey) {
    if (ageDays === null || ageDays === undefined || !isFinite(ageDays)) return false;
    var key = normalizeTotalsClosingWindow(windowKey);
    if (key === 'lte_14') return ageDays <= 14;
    if (key === 'lte_30') return ageDays <= 30;
    if (key === 'gt_30') return ageDays > 30;
    if (key === 'gt_60') return ageDays > 60;
    return ageDays <= 7;
}
function totalsComputeEmployerClosingSpeed(vacancies, windowKey) {
    var key = normalizeTotalsClosingWindow(windowKey);
    var map = new Map();
    (vacancies || []).forEach(function(v) {
        if (!v || !v.employer) return;
        var ageDays = computeVacancyAgeDays(v);
        if (!totalsMatchClosingWindow(ageDays, key)) return;
        var employer = String(v.employer || '').trim();
        if (!employer) return;
        var row = map.get(employer) || {
            employer: employer,
            total: 0,
            values: [],
            accredited: '',
            rating: '',
            trusted: '',
            url: ''
        };
        row.total += 1;
        row.values.push(Number(ageDays));
        if (!row.accredited && v.employer_accredited !== undefined && v.employer_accredited !== null) row.accredited = String(v.employer_accredited);
        if (!row.rating && v.employer_rating !== undefined && v.employer_rating !== null) row.rating = String(v.employer_rating);
        if (!row.trusted && v.employer_trusted !== undefined && v.employer_trusted !== null) row.trusted = String(v.employer_trusted);
        if (!row.url && v.employer_url) row.url = String(v.employer_url);
        map.set(employer, row);
    });
    return Array.from(map.values()).map(function(row) {
        var vals = row.values.slice();
        return {
            employer: row.employer,
            total: row.total,
            accredited: row.accredited,
            rating: row.rating,
            trusted: row.trusted,
            url: row.url,
            avg: vals.length ? vals.reduce(function(sum, val) { return sum + val; }, 0) / vals.length : null,
            median: vals.length ? computeMedian(vals) : null,
            mode: vals.length ? computeMode(vals) : null,
            min: vals.length ? Math.min.apply(Math, vals) : null,
            max: vals.length ? Math.max.apply(Math, vals) : null
        };
    }).sort(function(a, b) {
        return (b.total - a.total)
            || (Number(a.avg || 0) - Number(b.avg || 0))
            || String(a.employer).localeCompare(String(b.employer), 'ru');
    });
}
function computeVacancyAgeDays(vacancy) {
    if (!vacancy) return null;
    var published = parsePublishedAtDate(vacancy.published_at);
    if (!published) return null;
    var archived = parsePublishedAtDate(vacancy.archived_at);
    if (!archived) {
        var archivedRaw = String(vacancy.archived || '').toLowerCase();
        if (vacancy.archived === true || vacancy.archived === 1 || archivedRaw === '1' || archivedRaw === 'true') {
            archived = new Date();
        } else {
            return null;
        }
    }
    var diffMs = archived.getTime() - published.getTime();
    if (!isFinite(diffMs) || diffMs < 0) return null;
    return diffMs / (1000 * 60 * 60 * 24);
}
function totalsBucketStartUtc(dateObj, windowDays) {
    if (!(dateObj instanceof Date) || !isFinite(dateObj.getTime())) return NaN;
    var dayMs = 24 * 60 * 60 * 1000;
    var utcDay = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
    var size = Math.max(1, Number(windowDays) || 14) * dayMs;
    return Math.floor(utcDay / size) * size;
}
function totalsFormatBucketLabel(startMs, windowDays) {
    if (!isFinite(startMs)) return '';
    var start = new Date(startMs);
    var end = new Date(startMs + (Math.max(1, Number(windowDays) || 14) - 1) * 24 * 60 * 60 * 1000);
    function pad(n) { return String(n).padStart(2, '0'); }
    var s = pad(start.getUTCDate()) + '.' + pad(start.getUTCMonth() + 1);
    var e = pad(end.getUTCDate()) + '.' + pad(end.getUTCMonth() + 1);
    return s + ' - ' + e;
}
function totalsBuild14dTrend(vacancies, windowDays) {
    var size = Math.max(1, Number(windowDays) || 14);
    var rows = Array.isArray(vacancies) ? vacancies.slice() : [];
    var buckets = new Map();
    function ensureBucket(ts) {
        var key = String(ts);
        if (!buckets.has(key)) {
            buckets.set(key, {
                start: ts,
                label: totalsFormatBucketLabel(ts, size),
                total: 0,
                active: 0,
                archived: 0,
                withSalary: 0,
                ageSum: 0,
                ageCount: 0,
                salaryByCurrency: {
                    RUR: { values: [] },
                    USD: { values: [] },
                    EUR: { values: [] }
                },
                responses: 0,
                interviews: 0,
                offers: 0
            });
        }
        return buckets.get(key);
    }
    rows.forEach(function(v) {
        if (!v) return;
        var published = parsePublishedAtDate(v.published_at);
        var start = totalsBucketStartUtc(published, size);
        if (!isFinite(start)) return;
        var b = ensureBucket(start);
        b.total += 1;
        var isArchived = !!(v.archived === true || v.archived === 1 || v.archived === '1' || v.archived === 'true' || v.archived_at);
        if (isArchived) b.archived += 1;
        else b.active += 1;
        var curr = normalizeTotalsCurrency(v.currency);
        var salaryValue = computeSalaryValue(v, curr);
        if (salaryValue !== null && salaryValue !== undefined && isFinite(salaryValue)) {
            b.withSalary += 1;
            if (b.salaryByCurrency[curr]) b.salaryByCurrency[curr].values.push(Number(salaryValue));
        }
        var age = computeVacancyAgeDays(v);
        if (age !== null && age !== undefined && isFinite(age)) {
            b.ageSum += Number(age);
            b.ageCount += 1;
        }
        var responded = isRespondedVacancy(v);
        if (responded) {
            b.responses += 1;
            var hasInterview = hasScheduledInterview(v);
            if (hasInterview) b.interviews += 1;
            if (hasOfferContent(v)) b.offers += 1;
        }
    });

    var ordered = Array.from(buckets.values()).sort(function(a, b) { return a.start - b.start; });
    return {
        labels: ordered.map(function(b) { return b.label; }),
        total: ordered.map(function(b) { return b.total; }),
        active: ordered.map(function(b) { return b.active; }),
        archived: ordered.map(function(b) { return b.archived; }),
        salaryCoverage: ordered.map(function(b) { return b.total ? (b.withSalary * 100 / b.total) : 0; }),
        avgAge: ordered.map(function(b) { return b.ageCount ? (b.ageSum / b.ageCount) : null; }),
        responseToInterview: ordered.map(function(b) { return b.responses ? (b.interviews * 100 / b.responses) : 0; }),
        interviewToOffer: ordered.map(function(b) { return b.interviews ? (b.offers * 100 / b.interviews) : 0; }),
        responseToOffer: ordered.map(function(b) { return b.responses ? (b.offers * 100 / b.responses) : 0; }),
        salaryByCurrency: {
            RUR: ordered.map(function(b) { return b.salaryByCurrency.RUR.values || []; }),
            USD: ordered.map(function(b) { return b.salaryByCurrency.USD.values || []; }),
            EUR: ordered.map(function(b) { return b.salaryByCurrency.EUR.values || []; })
        }
    };
}
function buildTotalsTrendLineChart(graphId, labels, traces, titleText, contextText, yTitle, isPercent) {
    var el = document.getElementById(graphId);
    if (!el) return;
    if (typeof Plotly === 'undefined' || !Plotly || typeof Plotly.newPlot !== 'function') {
        el.innerHTML = '<div class="skills-search-hint">График временно недоступен</div>';
        return;
    }
    if (!(labels || []).length) {
        el.innerHTML = '<div class="skills-search-hint">Нет данных для графика</div>';
        return;
    }
    Plotly.newPlot(el, traces, {
        margin: { t: 22, r: 22, b: 84, l: 60 },
        xaxis: { title: '', automargin: true },
        yaxis: {
            title: yTitle || '',
            automargin: true,
            ticksuffix: isPercent ? '%' : ''
        },
        legend: { orientation: 'h', y: -0.25 },
        showlegend: true,
        height: 360
    }, { responsive: true, displayModeBar: false });
    if (titleText || contextText) {
        applyChartTitleContext(graphId, titleText || '', contextText || '');
    } else if (typeof setUnifiedChartHeader === 'function') {
        setUnifiedChartHeader(graphId, '', '');
    }
}
function buildTotalsSimpleBarChart(graphId, labels, values, titleText, contextText) {
    var el = document.getElementById(graphId);
    if (!el) return;
    var curr = arguments.length > 5 ? arguments[5] : '';
    var pointLabels = Array.isArray(labels) ? labels.slice() : [];
    var pointValues = Array.isArray(values) ? values.slice() : [];
    var items = pointLabels.map(function(label, index) {
        var raw = pointValues[index];
        if (raw === null || raw === undefined || raw === '' || !isFinite(raw)) return null;
        var spec = totalsGetOverviewMetricSpec(label, index);
        return {
            key: spec.key,
            label: spec.label,
            value: Number(raw),
            color: spec.color,
            order: index
        };
    }).filter(Boolean);
    if (!items.length) {
        el.innerHTML = '';
        return;
    }

    items.sort(function(a, b) {
        return a.value - b.value || a.order - b.order;
    });
    var minValue = items[0].value;
    var maxValue = items[items.length - 1].value;
    var range = maxValue - minValue;
    var groups = [];
    items.forEach(function(item) {
        var last = groups.length ? groups[groups.length - 1] : null;
        if (last && Math.abs(last.value - item.value) < 1e-9) {
            last.metrics.push(item);
            return;
        }
        groups.push({
            value: item.value,
            metrics: [item]
        });
    });
    groups.forEach(function(group) {
        group.metrics.sort(function(a, b) {
            return a.order - b.order;
        });
    });
    var positions = totalsBuildOverviewPointPositions(groups, minValue, maxValue);
    el.innerHTML =
        '<div class="totals-salary-range">' +
            '<div class="totals-salary-range-track-wrap">' +
                '<div class="totals-salary-range-track"></div>' +
                groups.map(function(group, index) {
                    var position = Math.max(0, Math.min(1, positions[index] || 0));
                    var pointLeft = 'calc(var(--totals-salary-range-side-padding) + (100% - (var(--totals-salary-range-side-padding) * 2)) * ' + position + ')';
                    var isMaxPoint = Math.abs(group.value - maxValue) < 1e-9;
                    var pointClass = isMaxPoint ? 'bottom' : (index % 2 === 0 ? 'top' : 'bottom');
                    var currencyClass = isMaxPoint ? 'top' : (index % 2 === 0 ? 'bottom' : 'top');
                    var labels = group.metrics.map(function(metric) { return metric.label; });
                    var leadMetric = group.metrics[0] || null;
                    if (group.metrics.length > 1) pointClass += ' is-grouped';
                    if (position <= 0.08) pointClass += ' edge-left';
                    else if (position >= 0.92) pointClass += ' edge-right';
                    var labelWidthCh = Math.max(14, Math.min(32, labels.join(', ').length + 4));
                    var labelStyle = ' style="width:' + labelWidthCh + 'ch;"';
                    var currencyHtml = isMaxPoint && curr
                        ? '<div class="totals-salary-range-currency-note ' + currencyClass + '"' + labelStyle + '>' + escapeHtml(curr) + '</div>'
                        : '';
                    var labelHtml = group.metrics.map(function(metric, metricIndex) {
                        return '<span class="totals-salary-range-label-token" style="color:' + escapeHtml(metric.color) + ';">' + escapeHtml(metric.label) + '</span>';
                    }).join('<span class="totals-salary-range-label-separator">, </span>');
                    var valueColor = leadMetric && leadMetric.color ? leadMetric.color : '#334155';
                    var metricColor = String(valueColor || '#64748b');
                    var shadowColor = metricColor.indexOf('hsl(') === 0
                        ? metricColor.replace('hsl(', 'hsla(').replace(')', ', 0.28)')
                        : 'rgba(100, 116, 139, 0.28)';
                    return '<div class="totals-salary-range-point ' + pointClass + '" style="left:' + pointLeft + ';">' +
                        '<div class="totals-salary-range-markers">' +
                            '<span class="totals-salary-range-dot" style="background:' + escapeHtml(metricColor) + '; box-shadow: 0 0.25rem 0.875rem ' + escapeHtml(shadowColor) + ';"></span>' +
                        '</div>' +
                        '<div class="totals-salary-range-label" ' + labelStyle + '>' +
                            '<div class="totals-salary-range-label-segment" style="color:' + escapeHtml(valueColor) + ';">' +
                                '<div class="totals-salary-range-label-name">' + labelHtml + '</div>' +
                                '<div class="totals-salary-range-label-value">' + escapeHtml(totalsFormatSalaryPointValue(group.value, curr)) + '</div>' +
                            '</div>' +
                        '</div>' +
                        currencyHtml +
                    '</div>';
                }).join('') +
            '</div>' +
        '</div>';
}
function isMobileFilterViewport() {
    return !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 960px)').matches);
}
function buildTotalsWeekdayChart(graphId, weekdays, contextText) {
    var el = document.getElementById(graphId);
    if (!el) return;
    if (typeof Plotly === 'undefined' || !Plotly || typeof Plotly.newPlot !== 'function') {
        el.innerHTML = '<div class="skills-search-hint">График временно недоступен</div>';
        return;
    }
    var list = Array.isArray(weekdays) ? weekdays.slice() : [];
    if (!list.length) {
        el.innerHTML = '<div class="skills-search-hint">Нет данных для графика</div>';
        return;
    }
    var labels = list.map(function(item) { return item.weekday || ''; });
    var pubs = list.map(function(item) { return Number(item.publications || 0); });
    var arch = list.map(function(item) { return Number(item.archives || 0); });
    Plotly.newPlot(el, [
        { x: labels, y: pubs, type: 'bar', name: 'Публикации', marker: { color: CHART_COLORS.light } },
        { x: labels, y: arch, type: 'bar', name: 'Архивы', marker: { color: CHART_COLORS.negative } }
    ], {
        barmode: 'group',
        margin: { t: 22, r: 22, b: 84, l: 60 },
        xaxis: { title: '', automargin: true },
        yaxis: { title: '', automargin: true },
        showlegend: false,
        height: 360
    }, { responsive: true, displayModeBar: false });
    applyChartTitleContext(graphId, 'Публикации и архивы по дням недели', contextText || '');
}
function marketTrendsFmtPct(value) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    return totalsFormatNumber(value) + '%';
}
function marketTrendsFmtNum(value) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    return totalsFormatNumber(value);
}
function marketTrendsFmtMoney(value, currency) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    var curr = normalizeTotalsCurrency(currency || 'RUR');
    var amount = Number(value) || 0;
    if (curr === 'RUR') {
        var sign = amount < 0 ? '-' : '';
        var roundedThousands = Math.round(Math.abs(amount) / 1000);
        return sign + totalsFormatNumber(roundedThousands) + 'К ' + curr;
    }
    return marketTrendsFmtNum(amount) + ' ' + curr;
}
function marketTrendsComputeSalaryStats(list, currency) {
    var curr = normalizeTotalsCurrency(currency || 'RUR');
    var vals = (list || []).map(function(v) {
        var rowCurr = normalizeTotalsCurrency(v && (v.currency || v.salary_currency));
        if (rowCurr !== curr) return null;
        return computeSalaryValue(v || {}, curr);
    }).filter(function(v) { return v !== null && v !== undefined && isFinite(v); }).map(Number);
    if (!vals.length) {
        return { min: null, max: null, avg: null, median: null, mode: null };
    }
    return {
        min: Math.min.apply(null, vals),
        max: Math.max.apply(null, vals),
        avg: vals.reduce(function(s, x) { return s + x; }, 0) / vals.length,
        median: computeMedian(vals),
        mode: computeMode(vals)
    };
}
function marketTrendsBuildRoleMetrics(roleContent, vacancies, currency, anchorTs, recentDays, baselineDays) {
    var dayMs = 24 * 60 * 60 * 1000;
    var recentSize = Math.max(1, Number(recentDays) || 7);
    var baseSize = Math.max(1, Number(baselineDays) || 7);
    var recentStart = anchorTs - ((recentSize - 1) * dayMs);
    var prevEnd = recentStart - dayMs;
    var prevStart = prevEnd - ((baseSize - 1) * dayMs);
    var recent = [];
    var prev = [];
    (vacancies || []).forEach(function(v) {
        var d = parsePublishedAtDate(v && v.published_at);
        if (!d) return;
        var ts = d.getTime();
        if (ts >= recentStart && ts <= anchorTs) recent.push(v);
        else if (ts >= prevStart && ts <= prevEnd) prev.push(v);
    });
    var recentSalary = marketTrendsComputeSalaryStats(recent, currency);
    var prevSalary = marketTrendsComputeSalaryStats(prev, currency);
    var demandDelta = recent.length - prev.length;
    var demandPct = prev.length ? (demandDelta * 100 / prev.length) : (recent.length > 0 ? 100 : 0);
    return {
        id: roleContent && roleContent.dataset ? (roleContent.dataset.roleId || '') : '',
        name: roleContent && roleContent.dataset ? (roleContent.dataset.roleName || '') : '',
        recentCount: recent.length,
        prevCount: prev.length,
        demandDelta: demandDelta,
        demandPct: demandPct,
        recentSalary: recentSalary,
        prevSalary: prevSalary
    };
}
function marketTrendsBuildRoleMetricsWindowed(roleContent, vacancies, currency, recentStartTs, recentEndTs, prevStartTs, prevEndTs) {
    var recent = [];
    var prev = [];
    (vacancies || []).forEach(function(v) {
        var d = parsePublishedAtDate(v && v.published_at);
        if (!d) return;
        var ts = d.getTime();
        if (ts >= recentStartTs && ts <= recentEndTs) recent.push(v);
        else if (ts >= prevStartTs && ts <= prevEndTs) prev.push(v);
    });
    var recentSalary = marketTrendsComputeSalaryStats(recent, currency);
    var prevSalary = marketTrendsComputeSalaryStats(prev, currency);
    var demandDelta = recent.length - prev.length;
    var demandPct = prev.length ? (demandDelta * 100 / prev.length) : (recent.length > 0 ? 100 : 0);
    return {
        id: roleContent && roleContent.dataset ? (roleContent.dataset.roleId || '') : '',
        name: roleContent && roleContent.dataset ? (roleContent.dataset.roleName || '') : '',
        recentCount: recent.length,
        prevCount: prev.length,
        demandDelta: demandDelta,
        demandPct: demandPct,
        recentSalary: recentSalary,
        prevSalary: prevSalary
    };
}
function hasExplicitMarketTrendsExperienceFilter(expOptions) {
    var bucket = uiState && uiState.global_filters && uiState.global_filters.experiences
        ? uiState.global_filters.experiences
        : { include: [], exclude: [] };
    var allowedNorm = (expOptions || []).map(function(item) {
        return normalizeExperience(item && item.value);
    }).filter(Boolean);
    var includeNorm = (bucket.include || []).map(normalizeExperience).filter(function(value) {
        return allowedNorm.indexOf(value) >= 0;
    });
    var excludeNorm = (bucket.exclude || []).map(normalizeExperience).filter(function(value) {
        return allowedNorm.indexOf(value) >= 0;
    });
    return !!(includeNorm.length || excludeNorm.length);
}
function formatMarketTrendsRoleLabel(row) {
    var roleName = String(row && (row.name || row.id || 'Роль') || '').trim() || 'Роль';
    var experience = String(row && row.experience || '').trim();
    return experience ? (roleName + ' · ' + experience) : roleName;
}
function getMarketTrendsRoleDisplay(row, showExperience) {
    var roleName = String(row && (row.name || row.id || 'Роль') || '').trim() || 'Роль';
    var experience = showExperience ? String(row && row.experience || '').trim() : '';
    return { role: roleName, experience: experience };
}
function getMarketTrendsExperienceGradientColor(row, fallbackColor) {
    var experience = normalizeExperience(row && row.experience || '');
    if (!experience) return fallbackColor;
    var palette = ['#d7e1e8', '#bccad3', '#9aaeb9', '#748d9a'];
    var order = typeof getExperienceOrder === 'function'
        ? getExperienceOrder()
        : {
            'Нет опыта': 0,
            'От 1 года до 3 лет': 1,
            'От 3 до 6 лет': 2,
            'Более 6 лет': 3
        };
    var idx = Object.prototype.hasOwnProperty.call(order, experience) ? Number(order[experience]) : -1;
    if (!isFinite(idx) || idx < 0) return fallbackColor;
    return palette[Math.min(idx, palette.length - 1)] || fallbackColor;
}
function formatRussianCount(value, forms) {
    var n = Math.abs(Number(value) || 0);
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return String(n) + ' ' + forms[0];
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return String(n) + ' ' + forms[1];
    return String(n) + ' ' + forms[2];
}
function formatVacancyCount(value) {
    return formatRussianCount(value, ['вакансия', 'вакансии', 'вакансий']);
}
function resolveMarketTrendsBaseline(selectedPeriods) {
    var list = Array.isArray(selectedPeriods) ? selectedPeriods.slice() : [];
    var normalized = list.map(function(item) { return normalizeGlobalPeriodValue(item); }).filter(Boolean);
    var monthLabels = normalized.filter(function(item) { return /^\d{4}-\d{2}$/.test(item); });
    var quick = normalized.map(function(item) {
        var m = String(item || '').match(/^last_(\d+)$/i);
        return m ? Number(m[1]) : null;
    }).filter(function(v) { return isFinite(v) && v > 0; });
    if (quick.length) {
        var quickDays = Math.max.apply(Math, quick);
        if (quickDays < 7) quickDays = 7;
        return { days: quickDays, label: quickDays + ' дн' };
    }
    if (monthLabels.length) {
        function daysInMonth(yyyyMm) {
            var parts = String(yyyyMm || '').split('-');
            if (parts.length !== 2) return 0;
            var y = Number(parts[0]);
            var m = Number(parts[1]);
            if (!isFinite(y) || !isFinite(m) || m < 1 || m > 12) return 0;
            return new Date(y, m, 0).getDate();
        }
        var totalDays = monthLabels.reduce(function(sum, mm) { return sum + daysInMonth(mm); }, 0);
        var baselineDays = Math.max(1, totalDays);
        return { days: baselineDays, label: baselineDays + ' дн' };
    }
    return { days: 7, label: '7 дн' };
}
function computeVacanciesSpanDays(vacancies) {
    var list = Array.isArray(vacancies) ? vacancies : [];
    var minTs = null;
    var maxTs = null;
    list.forEach(function(v) {
        var d = parsePublishedAtDate(v && v.published_at);
        if (!d) return;
        var ts = d.getTime();
        if (!isFinite(ts)) return;
        if (minTs === null || ts < minTs) minTs = ts;
        if (maxTs === null || ts > maxTs) maxTs = ts;
    });
    if (minTs === null || maxTs === null) return 0;
    return Math.max(1, Math.floor((maxTs - minTs) / (24 * 60 * 60 * 1000)) + 1);
}
function resolveMarketTrendsWindow(selectedPeriods, vacancies) {
    var list = Array.isArray(selectedPeriods) ? selectedPeriods.slice() : [];
    var normalized = list.map(function(item) { return normalizeGlobalPeriodValue(item); }).filter(Boolean);
    var hasSummary = normalized.indexOf('summary') >= 0;
    if (hasSummary) {
        var spanDays = computeVacanciesSpanDays(vacancies);
        if (spanDays > 0) return { days: spanDays, label: spanDays + ' дн' };
    }
    return resolveMarketTrendsBaseline(list);
}
function renderMarketTrends(parentRole, mountNode) {
    if (!parentRole) return;
    var block = mountNode || parentRole.querySelector('.market-trends-content');
    if (!block) return;
    var roleSuffix = String(parentRole.id || '').replace(/^role-/, '');
    if (!roleSuffix) return;

    if (typeof ensureDefaultPeriodFilterSelection === 'function') {
        ensureDefaultPeriodFilterSelection(parentRole, 'totals');
    }
    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'totals');
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'totals');
    var statusOptions = getGlobalFilterOptions(parentRole, 'status', 'totals');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var selectedPeriodsForTrends = selectedPeriods.slice();
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var selectedStatuses = getResolvedGlobalFilterValues('status', statusOptions);
    var periodLabel = resolveChartPeriodLabel(selectedPeriodsForTrends);
    var hasExplicitExperienceFilter = hasExplicitMarketTrendsExperienceFilter(expOptions);
    var showRoleExperience = !hasExplicitExperienceFilter;
    var splitMetricsByExperience = !hasExplicitExperienceFilter && Array.isArray(expOptions) && expOptions.length > 0;
    var expLabel = hasExplicitExperienceFilter
        ? resolveChartExperienceLabel(selectedExps, expOptions)
        : (splitMetricsByExperience ? 'Все категории отдельно' : resolveChartExperienceLabel(selectedExps, expOptions));
    var contextText = buildChartContextLabel(periodLabel, expLabel);

    var currency = normalizeTotalsCurrency(uiState.market_trends_currency || 'RUR');
    if (['RUR', 'USD', 'EUR'].indexOf(currency) < 0) currency = 'RUR';
    uiState.market_trends_currency = currency;
    var salaryMetric = String(uiState.market_trends_salary_metric || 'avg').toLowerCase();
    if (['min', 'max', 'avg', 'median', 'mode'].indexOf(salaryMetric) < 0) salaryMetric = 'avg';
    uiState.market_trends_salary_metric = salaryMetric;
    var salaryMetricLabelMap = {
        min: 'Мин',
        max: 'Макс',
        avg: 'Средняя',
        median: 'Медиана',
        mode: 'Мода'
    };
    var salaryMetricLabel = salaryMetricLabelMap[salaryMetric] || 'Медиана';
    var baseRoleContents = [];
    if (parentRole && parentRole.id === 'role-all' && Array.isArray(parentRole.__selectedRoleContents) && parentRole.__selectedRoleContents.length) {
        baseRoleContents = parentRole.__selectedRoleContents.slice();
    } else if (typeof getAllRoleContents === 'function') {
        baseRoleContents = getAllRoleContents();
    }
    var roleMetaByIndex = (typeof getRoleMetaList === 'function' ? getRoleMetaList() : []).reduce(function(map, item) {
        map[String(item && item.index || '')] = item || null;
        return map;
    }, {});
    var focusRoleContent = null;
    if (parentRole && parentRole.id !== 'role-all') {
        focusRoleContent = parentRole;
    } else if (baseRoleContents.length === 1) {
        focusRoleContent = baseRoleContents[0];
    } else {
        var includedRoleIds = uiState && uiState.global_filters && uiState.global_filters.roles && Array.isArray(uiState.global_filters.roles.include)
            ? uiState.global_filters.roles.include.map(function(value) { return String(value || '').trim(); }).filter(Boolean)
            : [];
        if (includedRoleIds.length === 1) {
            var focusRoleMeta = roleMetaByIndex[includedRoleIds[0]] || null;
            var focusRoleId = focusRoleMeta ? String(focusRoleMeta.id || '').trim() : includedRoleIds[0];
            focusRoleContent = baseRoleContents.find(function(rc) {
                return rc && rc.dataset && String(rc.dataset.roleId || '').trim() === focusRoleId;
            }) || null;
        }
    }
    var roleContents = baseRoleContents.slice();
    var excludedTrendRoleIds = Array.isArray(uiState.market_trends_excluded_roles)
        ? uiState.market_trends_excluded_roles.map(function(value) {
            var key = String(value || '').trim();
            var meta = roleMetaByIndex[key] || null;
            return meta ? String(meta.id || '').trim() : key;
        }).filter(Boolean)
        : [];
    if (excludedTrendRoleIds.length) {
        roleContents = roleContents.filter(function(rc) {
            var roleId = rc && rc.dataset ? String(rc.dataset.roleId || '').trim() : '';
            return excludedTrendRoleIds.indexOf(roleId) < 0;
        });
    }
    var allVacancies = [];
    roleContents.forEach(function(rc) {
        allVacancies = allVacancies.concat(getFilteredVacanciesForAnalysis(rc, 'totals', {
            skipPeriods: true
        }));
    });
    allVacancies = dedupeVacanciesById(allVacancies || []);
    var periodFilteredVacancies = hasExplicitGlobalFilterSelection('periods')
        ? filterVacanciesBySelectedPeriods(allVacancies, selectedPeriodsForTrends)
        : allVacancies.slice();
    if (!periodFilteredVacancies.length) {
        block.innerHTML = '<div class="skills-search-hint">Нет данных за выбранный период</div>';
        return;
    }
    var windowCfg = resolveMarketTrendsWindow(selectedPeriodsForTrends, allVacancies);
    var recentDays = Math.max(1, Number(windowCfg.days) || 7);
    var baselineDays = recentDays;
    var anchor = getLatestPublishedAtDate(periodFilteredVacancies);
    if (!anchor) {
        block.innerHTML = '<div class="skills-search-hint">Нет данных за выбранный период</div>';
        return;
    }
    var anchorTs = anchor.getTime();
    var dayMs = 24 * 60 * 60 * 1000;
    var recentStartTs = anchorTs - ((recentDays - 1) * dayMs);
    var prevEndTs = recentStartTs - dayMs;
    var prevStartTs = prevEndTs - ((baselineDays - 1) * dayMs);
    var useSalaryFallback = false;
    var salaryFallbackNote = '';
    function fmtDate(ts) {
        var d = new Date(ts);
        var dd = String(d.getDate()).padStart(2, '0');
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var yyyy = d.getFullYear();
        return dd + '.' + mm + '.' + yyyy;
    }

    function collectMetricsByWindows(recentStart, recentEnd, prevStart, prevEnd) {
        var rows = [];
        roleContents.forEach(function(rc) {
            var list = dedupeVacanciesById(getRoleVacancies(rc) || []);
            if (hasExplicitExperienceFilter || !splitMetricsByExperience) {
                var filteredList = getFilteredVacanciesForAnalysis(rc, 'totals', {
                    sourceVacancies: list,
                    skipPeriods: true
                });
                var filteredRow = marketTrendsBuildRoleMetricsWindowed(rc, filteredList, currency, recentStart, recentEnd, prevStart, prevEnd);
                filteredRow.experience = selectedExps.length === 1 ? String(selectedExps[0] || '').trim() : '';
                filteredRow.roleAxisId = String(filteredRow.id || '').trim();
                rows.push(filteredRow);
                return;
            }
            (expOptions || []).forEach(function(option) {
                var expValue = String(option && option.value || '').trim();
                if (!expValue) return;
                var expRow = marketTrendsBuildRoleMetricsWindowed(
                    rc,
                    getFilteredVacanciesForAnalysis(rc, 'totals', {
                        sourceVacancies: list,
                        skipPeriods: true,
                        forcedExperiences: [expValue]
                    }),
                    currency,
                    recentStart,
                    recentEnd,
                    prevStart,
                    prevEnd
                );
                expRow.roleAxisId = String(expRow.id || '').trim();
                expRow.id = String(expRow.id || '') + '::' + normalizeExperience(expValue);
                expRow.experience = expValue;
                rows.push(expRow);
            });
        });
        return rows.filter(function(row) {
            var hasSalary = row && row.recentSalary && row.prevSalary
                && ([row.recentSalary.min, row.recentSalary.max, row.recentSalary.avg, row.recentSalary.median, row.recentSalary.mode,
                    row.prevSalary.min, row.prevSalary.max, row.prevSalary.avg, row.prevSalary.median, row.prevSalary.mode]
                    .some(function(v) { return v !== null && v !== undefined && isFinite(v); }));
            return (row.recentCount > 0 || row.prevCount > 0 || hasSalary);
        });
    }

    var metrics = collectMetricsByWindows(recentStartTs, anchorTs, prevStartTs, prevEndTs);

    function getRecentSalaryMetric(row) {
        return row && row.recentSalary ? row.recentSalary[salaryMetric] : null;
    }
    function getPrevSalaryMetric(row) {
        return row && row.prevSalary ? row.prevSalary[salaryMetric] : null;
    }
    function getSalaryDelta(row) {
        var recentVal = getRecentSalaryMetric(row);
        var prevVal = getPrevSalaryMetric(row);
        return (recentVal !== null && prevVal !== null) ? (recentVal - prevVal) : null;
    }
    function getSalaryDeltaPct(row) {
        var delta = getSalaryDelta(row);
        var prevVal = getPrevSalaryMetric(row);
        return (delta !== null && prevVal) ? (delta * 100 / prevVal) : null;
    }

    function topN(list, n) { return list.slice(0, n); }
    function buildSegments(metricsSource) {
        return {
            onHorse: topN(metricsSource.slice().sort(function(a, b) { return (b.recentCount - a.recentCount) || (b.demandDelta - a.demandDelta); }), limit),
            notDemanded: topN(metricsSource.slice().sort(function(a, b) { return (a.recentCount - b.recentCount) || (a.demandDelta - b.demandDelta); }), limit),
            suddenDemand: topN(metricsSource.slice().filter(function(r) { return r.demandDelta > 0; }).sort(function(a, b) { return (b.demandPct - a.demandPct) || (b.demandDelta - a.demandDelta); }), limit),
            paysMore: topN(metricsSource.slice().filter(function(r) { return getRecentSalaryMetric(r) !== null; }).sort(function(a, b) { return getRecentSalaryMetric(b) - getRecentSalaryMetric(a); }), limit),
            paysLess: topN(metricsSource.slice().filter(function(r) { return getRecentSalaryMetric(r) !== null; }).sort(function(a, b) { return getRecentSalaryMetric(a) - getRecentSalaryMetric(b); }), limit),
            salaryUp: topN(metricsSource.slice().filter(function(r) { var d = getSalaryDelta(r); return d !== null && d > 0; }).sort(function(a, b) { return getSalaryDelta(b) - getSalaryDelta(a); }), limit),
            salaryDown: topN(metricsSource.slice().filter(function(r) { var d = getSalaryDelta(r); return d !== null && d < 0; }).sort(function(a, b) { return getSalaryDelta(a) - getSalaryDelta(b); }), limit),
            hasSalaryForCurrency: metricsSource.some(function(r) {
                var recentVal = getRecentSalaryMetric(r);
                var prevVal = getPrevSalaryMetric(r);
                return (recentVal !== null && recentVal !== undefined && isFinite(recentVal))
                    || (prevVal !== null && prevVal !== undefined && isFinite(prevVal));
            })
        };
    }
    var limit = 10;
    var chartLimit = 10;
    var segments = buildSegments(metrics);

    if (!segments.salaryUp.length && !segments.salaryDown.length) {
        var fallbackSource = periodFilteredVacancies.length ? periodFilteredVacancies : allVacancies;
        var minTs = null;
        var maxTs = null;
        fallbackSource.forEach(function(v) {
            var d = parsePublishedAtDate(v && v.published_at);
            if (!d) return;
            var ts = d.getTime();
            if (!isFinite(ts)) return;
            if (minTs === null || ts < minTs) minTs = ts;
            if (maxTs === null || ts > maxTs) maxTs = ts;
        });
        if (minTs !== null && maxTs !== null) {
            var minDayTs = Date.UTC(new Date(minTs).getUTCFullYear(), new Date(minTs).getUTCMonth(), new Date(minTs).getUTCDate());
            var maxDayTs = Date.UTC(new Date(maxTs).getUTCFullYear(), new Date(maxTs).getUTCMonth(), new Date(maxTs).getUTCDate());
            var totalDays = Math.max(1, Math.floor((maxDayTs - minDayTs) / dayMs) + 1);
            if (totalDays >= 2) {
                var prevDaysFallback = Math.floor(totalDays / 2);
                var recentDaysFallback = totalDays - prevDaysFallback;
                var fbPrevStartTs = minDayTs;
                var fbPrevEndTs = fbPrevStartTs + (prevDaysFallback - 1) * dayMs;
                var fbRecentStartTs = fbPrevEndTs + dayMs;
                var fbRecentEndTs = maxDayTs;
                var fallbackMetrics = collectMetricsByWindows(fbRecentStartTs, fbRecentEndTs, fbPrevStartTs, fbPrevEndTs);
                var fallbackSegments = buildSegments(fallbackMetrics);
                if (fallbackSegments.salaryUp.length || fallbackSegments.salaryDown.length) {
                    useSalaryFallback = true;
                    salaryFallbackNote = 'Сравнение зарплаты: ' + recentDaysFallback + ' дн (' + fmtDate(fbRecentStartTs) + ' - ' + fmtDate(fbRecentEndTs) + ') против ' + prevDaysFallback + ' дн (' + fmtDate(fbPrevStartTs) + ' - ' + fmtDate(fbPrevEndTs) + ')';
                    metrics = fallbackMetrics;
                    recentStartTs = fbRecentStartTs;
                    prevStartTs = fbPrevStartTs;
                    prevEndTs = fbPrevEndTs;
                    recentDays = recentDaysFallback;
                    baselineDays = prevDaysFallback;
                    segments = fallbackSegments;
                }
            }
        }
    }
    var onHorse = segments.onHorse;
    var notDemanded = segments.notDemanded;
    var suddenDemand = segments.suddenDemand;
    var paysMore = segments.paysMore;
    var paysLess = segments.paysLess;
    var salaryUp = segments.salaryUp;
    var salaryDown = segments.salaryDown;
    var hasSalaryForCurrency = segments.hasSalaryForCurrency;
    var focusMetrics = null;
    if (focusRoleContent) {
        var focusRoleId = focusRoleContent && focusRoleContent.dataset ? String(focusRoleContent.dataset.roleId || '').trim() : '';
        if (focusRoleId && excludedTrendRoleIds.indexOf(focusRoleId) >= 0) {
            focusRoleContent = null;
        }
    }
    if (focusRoleContent) {
        var focusVacancies = getFilteredVacanciesForAnalysis(focusRoleContent, 'totals', {
            skipPeriods: true
        });
        focusMetrics = marketTrendsBuildRoleMetricsWindowed(focusRoleContent, focusVacancies, currency, recentStartTs, anchorTs, prevStartTs, prevEndTs);
    }

    function buildTrendLeadCard(eyebrow, title, row, valueText, toneClass) {
        var label = row ? getMarketTrendsRoleDisplay(row, showRoleExperience) : { role: 'Нет данных', experience: '' };
        var value = String(valueText || '—').trim() || '—';
        return '<section class="totals-card market-trends-hero-card' + (toneClass ? ' ' + toneClass : '') + '">' +
            '<div class="market-trends-card-eyebrow">' + escapeHtml(eyebrow || '') + '</div>' +
            '<h3>' + escapeHtml(title || '') + '</h3>' +
            '<div class="market-trends-hero-value">' + escapeHtml(value) + '</div>' +
            '<div class="market-trends-hero-label"><span class="market-trends-role-primary">' + escapeHtml(label.role) + '</span>' +
            (label.experience ? '<span class="market-trends-role-secondary">' + escapeHtml(label.experience) + '</span>' : '') +
            '</div>' +
        '</section>';
    }
    function buildFocusTrendLeadCard(roleName, metricLabel, valueText, toneClass) {
        return '<section class="totals-card market-trends-hero-card' + (toneClass ? ' ' + toneClass : '') + '">' +
            '<div class="market-trends-card-eyebrow">Для роли ' + escapeHtml(roleName || 'Роль') + '</div>' +
            '<div class="market-trends-hero-value"> ' + escapeHtml(metricLabel || '') + ' ' + escapeHtml(valueText || '—') + '</div>' +
        '</section>';
    }
    function buildFocusMetricCard(title, valueText, toneClass) {
        return '<section class="totals-card market-trends-hero-card market-trends-focus-card' + (toneClass ? ' ' + toneClass : '') + '">' +
            '<div class="market-trends-focus-metric">' +
                '<div class="market-trends-card-eyebrow">' + escapeHtml(title || '') + '</div>' +
                '<div class="market-trends-hero-value">' + escapeHtml(valueText || '—') + '</div>' +
            '</div>' +
        '</section>';
    }
    function buildRoleList(items, formatter, toneClass) {
        if (!items.length) return '<li class="market-trends-empty">Нет данных</li>';
        return items.map(function(r) {
            var label = getMarketTrendsRoleDisplay(r, showRoleExperience);
            return '<li class="' + escapeHtml(toneClass || '') + '">' +
                '<span class="market-trends-rank">' + escapeHtml(String(items.indexOf(r) + 1)) + '</span>' +
                '<span class="market-trends-item-label"><span class="market-trends-role-primary">' + escapeHtml(label.role) + '</span>' +
                (label.experience ? '<span class="market-trends-role-secondary">' + escapeHtml(label.experience) + '</span>' : '') +
                '</span>' +
                '<strong>' + formatter(r) + '</strong>' +
            '</li>';
        }).join('');
    }
    function buildInsightCard(title, subtitle, items, formatter, toneClass) {
        return '<section class="totals-card market-trends-insight-card">' +
            '<div class="market-trends-card-head">' +
                '<div class="market-trends-card-eyebrow">' + escapeHtml(subtitle || '') + '</div>' +
                '<h3>' + escapeHtml(title || '') + '</h3>' +
            '</div>' +
            '<ul class="market-trends-list">' + buildRoleList(items, formatter, toneClass) + '</ul>' +
        '</section>';
    }
    function buildSwitchRow(stateKey, values, currentValue, extraClass) {
        var switchClass = 'tabs month-tabs totals-switch' + (extraClass ? ' ' + extraClass : '');
        return '<div class="' + switchClass + '">' +
            values.map(function(v) {
                var activeClass = (v.value === currentValue) ? ' active' : '';
                return '<button type="button" class="tab-button month-button totals-switch-btn' + activeClass + '" data-switch="' + escapeHtml(stateKey) + '" data-value="' + escapeHtml(v.value) + '">' + escapeHtml(v.label) + '</button>';
            }).join('') +
        '</div>';
    }
    var demandGraphId = 'market-trends-demand-graph-' + roleSuffix;
    var salaryGraphId = 'market-trends-salary-graph-' + roleSuffix;
    var demandLeader = onHorse[0] || suddenDemand[0] || null;
    var growthLeader = suddenDemand[0] || onHorse[0] || null;
    var salaryLeader = paysMore[0] || null;
    var salaryDeltaLeader = salaryUp[0] || salaryDown[0] || null;
    var focusDemandTone = focusMetrics && focusMetrics.demandDelta > 0 ? 'is-positive' : (focusMetrics && focusMetrics.demandDelta < 0 ? 'is-negative' : 'is-neutral');
    var focusSalaryTone = focusMetrics && getSalaryDelta(focusMetrics) > 0 ? 'is-positive' : (focusMetrics && getSalaryDelta(focusMetrics) < 0 ? 'is-negative' : 'is-neutral');
    var focusRoleName = focusMetrics ? (focusMetrics.name || focusMetrics.id || 'Роль') : '';
    block.innerHTML =
        '<div class="market-trends-layout">' +
            '<div class="market-trends-head">' +
                '<div class="market-trends-context">' +
                    '<span class="market-trends-context-text">Сравнение: ' + recentDays + ' дн (' + fmtDate(recentStartTs) + ' - ' + fmtDate(anchorTs) + ') против ' + baselineDays + ' дн (' + fmtDate(prevStartTs) + ' - ' + fmtDate(prevEndTs) + ')</span>' +
                    (!hasSalaryForCurrency ? '<span class="totals-warning market-trends-inline-warning">По валюте ' + escapeHtml(currency) + ' нет данных по зарплате в выбранном периоде/опыте.</span>' : '') +
                '</div>' +
            '</div>' +
            (focusMetrics
                ? '<section class="totals-card market-trends-focus-panel">' +
                    '<div class="market-trends-section-head">' +
                        '<div class="market-trends-focus-role-chip">Для роли</div>' +
                        '<h3>' + escapeHtml(focusRoleName) + '</h3>' +
                        '<div class="market-trends-section-meta">Ключевые показатели за выбранный период</div>' +
                    '</div>' +
                    '<div class="market-trends-summary-grid market-trends-summary-grid-focus">' +
                        buildFocusMetricCard('Спрос', formatVacancyCount(focusMetrics.recentCount), 'is-neutral') +
                        buildFocusMetricCard('Рост', marketTrendsFmtPct(focusMetrics.demandPct), focusDemandTone) +
                        buildFocusMetricCard('Зарплата', getRecentSalaryMetric(focusMetrics) !== null ? marketTrendsFmtMoney(getRecentSalaryMetric(focusMetrics), currency) : '—', 'is-neutral') +
                        buildFocusMetricCard('Изменение', getSalaryDelta(focusMetrics) !== null ? (((getSalaryDelta(focusMetrics) || 0) > 0 ? '+' : ((getSalaryDelta(focusMetrics) || 0) < 0 ? '-' : '')) + marketTrendsFmtMoney(Math.abs(getSalaryDelta(focusMetrics)), currency)) : '—', focusSalaryTone) +
                    '</div>' +
                '</section>'
                : '<div class="market-trends-summary-grid">' +
                (focusMetrics
                    ? buildFocusTrendLeadCard(focusMetrics.name || focusMetrics.id || 'Роль', 'Спрос', formatVacancyCount(focusMetrics.recentCount), 'is-neutral')
                    : buildTrendLeadCard('Спрос', 'Лидер периода', demandLeader, demandLeader ? (demandLeader.recentCount + ' вакансий') : '—', 'is-positive')) +
                (focusMetrics
                    ? buildFocusTrendLeadCard(focusMetrics.name || focusMetrics.id || 'Роль', 'Рост', marketTrendsFmtPct(focusMetrics.demandPct), focusDemandTone)
                    : buildTrendLeadCard('Рост', 'Быстрый рост', growthLeader, growthLeader ? marketTrendsFmtPct(growthLeader.demandPct) : '—', 'is-positive')) +
                (focusMetrics
                    ? buildFocusTrendLeadCard(focusMetrics.name || focusMetrics.id || 'Роль', 'Зарплата', getRecentSalaryMetric(focusMetrics) !== null ? marketTrendsFmtMoney(getRecentSalaryMetric(focusMetrics), currency) : '—', 'is-neutral')
                    : buildTrendLeadCard('Зарплата', 'Высокая ' + salaryMetricLabel.toLowerCase(), salaryLeader, salaryLeader ? marketTrendsFmtMoney(getRecentSalaryMetric(salaryLeader), currency) : '—', 'is-neutral')) +
                (focusMetrics
                    ? buildFocusTrendLeadCard(focusMetrics.name || focusMetrics.id || 'Роль', 'Изменение', getSalaryDelta(focusMetrics) !== null ? (((getSalaryDelta(focusMetrics) || 0) > 0 ? '+' : ((getSalaryDelta(focusMetrics) || 0) < 0 ? '-' : '')) + marketTrendsFmtMoney(Math.abs(getSalaryDelta(focusMetrics)), currency)) : '—', focusSalaryTone)
                    : buildTrendLeadCard('Изменение', 'Рост зарплаты', salaryDeltaLeader, salaryDeltaLeader ? (((getSalaryDelta(salaryDeltaLeader) || 0) > 0 ? '+' : ((getSalaryDelta(salaryDeltaLeader) || 0) < 0 ? '-' : '')) + marketTrendsFmtMoney(Math.abs(getSalaryDelta(salaryDeltaLeader)), currency)) : '—', (salaryDeltaLeader && (getSalaryDelta(salaryDeltaLeader) || 0) > 0) ? 'is-positive' : 'is-negative')) +
            '</div>') +
            '<section class="market-trends-section">' +
                '<div class="market-trends-section-head">' +
                    '<div class="market-trends-focus-role-chip">Рынок</div>' +
                    '<h3>Спрос</h3>' +
                    '<div class="market-trends-section-meta">Кто растёт, кто снижается и кто лидирует по числу вакансий</div>' +
                '</div>' +
                '<div class="market-trends-grid">' +
                    buildInsightCard('Лидеры спроса', 'по числу вакансий', onHorse, function(r) { return r.recentCount + ' вакансий'; }, 'is-positive') +
                    buildInsightCard('Снижение спроса', 'по числу вакансий', notDemanded, function(r) { return r.recentCount + ' вакансий'; }, 'is-negative') +
                    buildInsightCard('Быстрый рост', 'к предыдущему периоду', suddenDemand, function(r) { return marketTrendsFmtPct(r.demandPct); }, 'is-positive') +
                '</div>' +
            '</section>' +
            '<section class="market-trends-section">' +
                '<div class="market-trends-section-head">' +
                    '<div class="market-trends-focus-role-chip">Рынок</div>' +
                    '<h3>Зарплата</h3>' +
                    '<div class="market-trends-section-meta">Роли с высокой, низкой и меняющейся зарплатой</div>' +
                '</div>' +
                '<div class="market-trends-grid">' +
                    buildInsightCard('Высокая зарплата', salaryMetricLabel.toLowerCase() + ' по ролям', paysMore, function(r) { return marketTrendsFmtMoney(getRecentSalaryMetric(r), currency); }, 'is-neutral') +
                    buildInsightCard('Низкая зарплата', salaryMetricLabel.toLowerCase() + ' по ролям', paysLess, function(r) { return marketTrendsFmtMoney(getRecentSalaryMetric(r), currency); }, 'is-neutral') +
                    buildInsightCard('Рост зарплаты', 'изменение к прошлому периоду', salaryUp, function(r) { return '+' + marketTrendsFmtMoney(Math.abs(getSalaryDelta(r)), currency); }, 'is-positive') +
                    buildInsightCard('Снижение зарплаты', 'изменение к прошлому периоду', salaryDown, function(r) { return '-' + marketTrendsFmtMoney(Math.abs(getSalaryDelta(r)), currency); }, 'is-negative') +
                '</div>' +
            '</section>' +
            '<div class="market-trends-grid market-trends-graphs">' +
                '<section class="totals-card market-trends-chart-card"><div class="market-trends-card-head"><div class="market-trends-card-eyebrow">вакансии</div><h3>Изменение спроса по ролям</h3></div><div class="plotly-graph" id="' + demandGraphId + '"></div></section>' +
                '<section class="totals-card market-trends-chart-card"><div class="market-trends-card-head"><div class="market-trends-card-eyebrow">' + escapeHtml(currency) + ' · ' + escapeHtml(salaryMetricLabel.toLowerCase()) + '</div><h3>Изменение зарплаты по ролям</h3></div><div class="plotly-graph" id="' + salaryGraphId + '"></div></section>' +
            '</div>' +
        '</div>';

    block.querySelectorAll('.totals-switch-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var key = String(btn.dataset.switch || '').trim();
            var value = String(btn.dataset.value || '').trim();
            if (!key || !value) return;
            if (key === 'market_trends_window') uiState[key] = Number(value) || 14;
            else uiState[key] = value;
            renderMarketTrends(parentRole);
        });
    });

    var demandTop = metrics.slice().sort(function(a, b) {
        return (Math.abs(b.demandDelta) - Math.abs(a.demandDelta))
            || (b.demandDelta - a.demandDelta);
    }).slice(0, chartLimit);
    if (typeof Plotly === 'undefined' || !Plotly || typeof Plotly.newPlot !== 'function') {
        var demandEl = document.getElementById(demandGraphId);
        var salaryEl = document.getElementById(salaryGraphId);
        if (demandEl) demandEl.innerHTML = '<div class="skills-search-hint">График временно недоступен</div>';
        if (salaryEl) salaryEl.innerHTML = '<div class="skills-search-hint">График временно недоступен</div>';
    } else {
        Plotly.newPlot(demandGraphId, [{
            x: demandTop.map(function(r) { return buildRoleAxisTick(r.roleAxisId || r.id); }),
            y: demandTop.map(function(r) { return r.demandDelta; }),
            customdata: demandTop.map(function(r) { return formatMarketTrendsRoleLabel(r); }),
            type: 'bar',
            marker: {
                color: demandTop.map(function(r) {
                    var fallback = r.demandDelta >= 0 ? CHART_COLORS.light : CHART_COLORS.negative;
                    return hasExplicitExperienceFilter ? fallback : getMarketTrendsExperienceGradientColor(r, fallback);
                })
            },
            hovertemplate: '%{customdata}<br>Δ спрос: %{y}<extra></extra>'
        }], { margin: { t: 24, r: 20, b: 110, l: 60 }, height: 360 }, { responsive: true, displayModeBar: false });
        var salaryTop = metrics.slice().filter(function(r) { return getSalaryDelta(r) !== null; }).sort(function(a, b) {
            return (Math.abs(getSalaryDelta(b)) - Math.abs(getSalaryDelta(a)))
                || (getSalaryDelta(b) - getSalaryDelta(a));
        }).slice(0, chartLimit);
        Plotly.newPlot(salaryGraphId, [{
            x: salaryTop.map(function(r) { return buildRoleAxisTick(r.roleAxisId || r.id); }),
            y: salaryTop.map(function(r) { return getSalaryDelta(r); }),
            customdata: salaryTop.map(function(r) { return formatMarketTrendsRoleLabel(r); }),
            type: 'bar',
            marker: {
                color: salaryTop.map(function(r) {
                    var fallback = getSalaryDelta(r) >= 0 ? CHART_COLORS.light : CHART_COLORS.negative;
                    return hasExplicitExperienceFilter ? fallback : getMarketTrendsExperienceGradientColor(r, fallback);
                })
            },
            hovertemplate: '%{customdata}<br>Δ з/п: %{y}<extra></extra>'
        }], { margin: { t: 24, r: 20, b: 110, l: 60 }, height: 360 }, { responsive: true, displayModeBar: false });
    }
}
function renderGlobalTotalsFiltered(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.totals-content');
    if (!block) return;
    var roleSuffix = String(parentRole.id || '').replace(/^role-/, '');
    if (!roleSuffix) return;

    if (typeof ensureDefaultPeriodFilterSelection === 'function') {
        ensureDefaultPeriodFilterSelection(parentRole, 'totals');
    }
    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'totals');
    var expOptions = getGlobalFilterOptions(parentRole, 'experiences', 'totals');
    var statusOptions = getGlobalFilterOptions(parentRole, 'status', 'totals');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
    var selectedStatuses = getResolvedGlobalFilterValues('status', statusOptions);
    var periodLabel = resolveChartPeriodLabel(selectedPeriods);
    var expLabel = resolveChartExperienceLabel(selectedExps, expOptions);
    var contextText = buildChartContextLabel(periodLabel, expLabel);

    var vacancies = getFilteredVacanciesForAnalysis(parentRole, 'totals');
    var vacancyKpiVacancies = getFilteredVacanciesForAnalysis(parentRole, 'totals', {
        skipPeriods: true
    });
    vacancyKpiVacancies = dedupeVacanciesById(vacancyKpiVacancies || []);
    vacancies = dedupeVacanciesById(vacancies || []);

    var salaryRows = totalsComputeSalaryByCurrency(vacancies);
    var salaryMonthData = buildSalaryMonthFromVacancies(vacancies, periodLabel || 'За период');
    var salarySelectedExperience = Array.isArray(selectedExps) && selectedExps.length === 1 ? String(selectedExps[0] || '').trim() : '';
    var salaryOverviewModel = buildSalaryOverviewChartModel({
        month: contextText,
        selectedExperience: salarySelectedExperience,
        selectedCurrency: uiState.totals_salary_currency || '',
        experiences: salaryMonthData && Array.isArray(salaryMonthData.experiences) ? salaryMonthData.experiences : []
    });
    var currencies = salaryRows.filter(function(row) { return row.withSalary > 0; }).map(function(row) { return row.currency; });
    if (!currencies.length) {
        currencies = salaryRows.filter(function(row) { return row.total > 0; }).map(function(row) { return row.currency; });
    }
    (salaryOverviewModel && Array.isArray(salaryOverviewModel.currencies) ? salaryOverviewModel.currencies : []).forEach(function(row) {
        var currency = String(row && row.currency || '').trim();
        if (currency && currencies.indexOf(currency) === -1) currencies.push(currency);
    });
    if (!currencies.length) currencies = ['RUR', 'USD', 'EUR'];
    var dashboardMode = String(uiState.totals_dashboard_mode || 'overview').trim();
    if (dashboardMode !== 'overview' && dashboardMode !== 'top' && dashboardMode !== 'market-trends') dashboardMode = 'overview';
    uiState.totals_dashboard_mode = dashboardMode;
    var salaryCurrency = normalizeTotalsCurrency(uiState.totals_salary_currency || currencies[0]);
    if (currencies.indexOf(salaryCurrency) < 0) salaryCurrency = currencies[0];
    uiState.totals_salary_currency = salaryCurrency;
    var topCurrency = normalizeTotalsCurrency(uiState.totals_top_currency || salaryCurrency);
    if (currencies.indexOf(topCurrency) < 0) topCurrency = currencies[0];
    uiState.totals_top_currency = topCurrency;
    var topLimit = normalizeTotalsTopLimit(uiState.totals_top_limit || 15);
    uiState.totals_top_limit = topLimit;
    var vacancyOrder = normalizeTotalsTopOrder(uiState.totals_vacancy_order, ['high', 'low'], 'high');
    uiState.totals_vacancy_order = vacancyOrder;
    var skillsOrder = normalizeTotalsTopOrder(uiState.totals_skills_order, ['most', 'least'], 'most');
    uiState.totals_skills_order = skillsOrder;
    var companyOrder = normalizeTotalsTopOrder(uiState.totals_company_order, ['high', 'low'], 'high');
    uiState.totals_company_order = companyOrder;
    var closingWindow = normalizeTotalsClosingWindow(uiState.totals_closing_window);
    uiState.totals_closing_window = closingWindow;

    var periodWindows = normalizeTotalsPeriodWindows(selectedPeriods, vacancyKpiVacancies || []);
    var summaryWindow = periodWindows.length === 1
        ? periodWindows[0]
        : {
            label: periodLabel || 'За период',
            start: periodWindows.reduce(function(minValue, item) {
                return !minValue || item.start < minValue ? item.start : minValue;
            }, null),
            end: periodWindows.reduce(function(maxValue, item) {
                return !maxValue || item.end > maxValue ? item.end : maxValue;
            }, null)
        };
    var periodStats = totalsComputePeriodVacancyStats(vacancyKpiVacancies || [], summaryWindow);
    var burnupUseFullPeriod = (selectedPeriods || []).some(function(label) {
        return isSummaryMonth(String(label || '').trim());
    });
    var burnupPeriodWindows = burnupUseFullPeriod
        ? buildTotalsBurnupPeriodWindows(vacancyKpiVacancies || [])
        : periodWindows;
    var burnupPeriodLabel = burnupUseFullPeriod
        ? buildTotalsBurnupPeriodLabel(burnupPeriodWindows)
        : (periodLabel || 'За период');
    var burnupSeries = totalsBuildBurnupSeries(vacancyKpiVacancies || [], burnupPeriodWindows);
    var totalCount = periodStats.total || 0;
    var archivedCount = periodStats.archived || 0;
    var activeCount = periodStats.active || 0;
    var avgAge = periodStats.avgLifetimeDays;
    var donutInteractive = true;
    var donutExperienceBreakdown = buildTotalsExperienceBreakdown(periodStats.breakdown || {});

    var skillsRows = totalsSortSkillsRows(totalsComputeSkillsCost(vacancies || [], topCurrency), skillsOrder);
    var companyRows = totalsComputeCompanySalaryLeaders(vacancies || [], topCurrency, companyOrder);
    var closingRows = totalsComputeEmployerClosingSpeed(vacancies || [], closingWindow);
    var topVacancies = totalsComputeTopVacanciesBySalary(vacancies || [], topCurrency, vacancyOrder).slice(0, topLimit);
    var topSkills = skillsRows.slice(0, topLimit);
    var topCompanies = companyRows.slice(0, topLimit);
    var topClosingCompanies = closingRows.slice(0, topLimit);
    var allRoleVacancies = [];
    if (typeof getAllRoleContents === 'function') {
        getAllRoleContents().forEach(function(roleContent) {
            allRoleVacancies = allRoleVacancies.concat(getRoleVacancies(roleContent) || []);
        });
    } else {
        allRoleVacancies = vacancies.slice();
    }
    allRoleVacancies = dedupeVacanciesById(allRoleVacancies || []);
    var responseRows = applyMyResponsesGlobalFilters(parentRole, getMergedMyResponseFilterSource(parentRole));
    var responseInterview = responseRows.filter(function(v) {
        return hasScheduledInterview(v);
    }).length;
    var responseResult = responseRows.filter(function(v) { return hasResultContent(v); }).length;
    var responseOffer = responseRows.filter(function(v) {
        return hasOfferContent(v);
    }).length;

    function buildSwitchRow(stateKey, values, currentValue, extraClass) {
        var switchClass = 'tabs month-tabs totals-switch' + (extraClass ? ' ' + extraClass : '');
        return '<div class="' + switchClass + '">' +
            values.map(function(v) {
                var activeClass = (v.value === currentValue) ? ' active' : '';
                return '<button type="button" class="tab-button month-button totals-switch-btn' + activeClass + '" data-switch="' + escapeHtml(stateKey) + '" data-value="' + escapeHtml(v.value) + '">' + escapeHtml(v.label) + '</button>';
            }).join('') +
        '</div>';
    }
    function buildDashboardModeSwitchRow(currentValue) {
        return '<div class="tabs month-tabs totals-switch totals-dashboard-switch">' +
            [
                { value: 'overview', label: 'Общее' },
                { value: 'top', label: 'Топ' },
                { value: 'market-trends', label: 'Тренды рынка' }
            ].map(function(v) {
                var activeClass = (v.value === currentValue) ? ' active' : '';
                return '<button type="button" class="tab-button month-button totals-switch-btn' + activeClass + '" data-switch="totals_dashboard_mode" data-value="' + escapeHtml(v.value) + '">' + escapeHtml(v.label) + '</button>';
            }).join('') +
        '</div>';
    }
    function topVacancyRowHtml(row) {
        var vacancyLink = row.id
            ? '<a href="https://surgut.hh.ru/vacancy/' + encodeURIComponent(row.id) + '" target="_blank" rel="noopener">' + escapeHtml(row.name || String(row.id)) + '</a>'
            : escapeHtml(row.name || '—');
        var employerCell = row.employer
            ? '<button class="employer-link" type="button" ' +
                'data-employer="' + escapeHtml(row.employer) + '" ' +
                'data-accredited="' + escapeHtml(row.employerAccredited) + '" ' +
                'data-rating="' + escapeHtml(row.employerRating) + '" ' +
                'data-trusted="' + escapeHtml(row.employerTrusted) + '" ' +
                'data-url="' + escapeHtml(row.employerUrl) + '">' +
                escapeHtml(row.employer) +
              '</button>'
            : '—';
        var status = '<label class="totals-ios-checkbox-wrap" title="' + (row.responded ? 'Был отклик' : 'Нет отклика') + '">' +
            '<input type="checkbox" class="totals-ios-checkbox" ' + (row.responded ? 'checked ' : '') + 'disabled>' +
            '<span class="totals-ios-checkbox-ui"></span>' +
        '</label>';
        return '<tr>' +
            '<td>' + vacancyLink + '</td>' +
            '<td>' + employerCell + '</td>' +
            '<td>' + totalsFormatNumber(row.salary) + '</td>' +
            '<td class="totals-status-cell">' + status + '</td>' +
        '</tr>';
    }
    function topSkillRowHtml(row) {
        return '<tr>' +
            '<td>' + escapeHtml(row.skill || '—') + '</td>' +
            '<td>' + (row.mentions || 0) + '</td>' +
            '<td>' + totalsFormatNumber(row.min) + '</td>' +
            '<td>' + totalsFormatNumber(row.avg) + '</td>' +
            '<td>' + totalsFormatNumber(row.mode) + '</td>' +
            '<td>' + totalsFormatNumber(row.median) + '</td>' +
            '<td>' + totalsFormatNumber(row.max) + '</td>' +
        '</tr>';
    }
    function topCompanyRowHtml(row) {
        var employerCell = row.employer
            ? '<button class="employer-link" type="button" ' +
                'data-employer="' + escapeHtml(row.employer) + '" ' +
                'data-accredited="' + escapeHtml(row.accredited || '') + '" ' +
                'data-rating="' + escapeHtml(row.rating || '') + '" ' +
                'data-trusted="' + escapeHtml(row.trusted || '') + '" ' +
                'data-url="' + escapeHtml(row.url || '') + '">' +
                escapeHtml(row.employer) +
              '</button>'
            : '—';
        return '<tr>' +
            '<td>' + employerCell + '</td>' +
            '<td>' + (row.total || 0) + '</td>' +
            '<td>' + totalsFormatNumber(row.min) + '</td>' +
            '<td>' + totalsFormatNumber(row.avg) + '</td>' +
            '<td>' + totalsFormatNumber(row.mode) + '</td>' +
            '<td>' + totalsFormatNumber(row.median) + '</td>' +
            '<td>' + totalsFormatNumber(row.max) + '</td>' +
        '</tr>';
    }
    function topClosingCompanyRowHtml(row) {
        var employerCell = row.employer
            ? '<button class="employer-link" type="button" ' +
                'data-employer="' + escapeHtml(row.employer) + '" ' +
                'data-accredited="' + escapeHtml(row.accredited || '') + '" ' +
                'data-rating="' + escapeHtml(row.rating || '') + '" ' +
                'data-trusted="' + escapeHtml(row.trusted || '') + '" ' +
                'data-url="' + escapeHtml(row.url || '') + '">' +
                escapeHtml(row.employer) +
              '</button>'
            : '—';
        return '<tr>' +
            '<td>' + employerCell + '</td>' +
            '<td>' + (row.total || 0) + '</td>' +
            '<td>' + totalsFormatNumber(row.min) + '</td>' +
            '<td>' + totalsFormatNumber(row.avg) + '</td>' +
            '<td>' + totalsFormatNumber(row.mode) + '</td>' +
            '<td>' + totalsFormatNumber(row.median) + '</td>' +
            '<td>' + totalsFormatNumber(row.max) + '</td>' +
        '</tr>';
    }

    function buildTotalsExperienceBreakdown(periodBreakdown) {
        var order = typeof getExperienceOrder === 'function'
            ? getExperienceOrder()
            : {
                'Нет опыта': 0,
                'От 1 года до 3 лет': 1,
                'От 3 до 6 лет': 2,
                'Более 6 лет': 3
            };
        var labels = {
            active: 'Открытые',
            archived: 'Архивные'
        };
        var buckets = periodBreakdown || {};

        function sortExperiences(left, right) {
            var leftOrder = Object.prototype.hasOwnProperty.call(order, left) ? Number(order[left]) : 999;
            var rightOrder = Object.prototype.hasOwnProperty.call(order, right) ? Number(order[right]) : 999;
            if (leftOrder !== rightOrder) return leftOrder - rightOrder;
            if (left === 'Не указан' && right !== 'Не указан') return 1;
            if (right === 'Не указан' && left !== 'Не указан') return -1;
            return String(left).localeCompare(String(right));
        }
        function buildItems(itemsMap, total) {
            return Object.keys(itemsMap || {}).map(function(experience) {
                var count = itemsMap[experience] || 0;
                return {
                    experience: experience,
                    count: count,
                    share: total ? ((count * 100) / total) : 0
                };
            }).sort(function(a, b) {
                return sortExperiences(a.experience, b.experience);
            });
        }

        var result = {};
        ['active', 'archived'].forEach(function(status) {
            var statusBucket = buckets[status] || { total: 0, items: {}, periodMetrics: {}, subsets: {} };
            var total = statusBucket.total || 0;
            var subsets = {};
            Object.keys(statusBucket.subsets || {}).forEach(function(subsetKey) {
                var subsetBucket = statusBucket.subsets[subsetKey] || { total: 0, items: {} };
                subsets[subsetKey] = {
                    total: subsetBucket.total || 0,
                    items: buildItems(subsetBucket.items || {}, subsetBucket.total || 0)
                };
            });
            result[status] = {
                status: status,
                label: labels[status] || status,
                total: total,
                items: buildItems(statusBucket.items || {}, total),
                periodMetrics: Object.assign({}, statusBucket.periodMetrics || {}),
                subsets: subsets
            };
        });
        return result;
    }

    function buildTotalsExperienceDrilldownHtml(statusData) {
        var data = statusData || { label: '', total: 0, items: [], periodMetrics: {}, subsets: {} };
        var statusLabel = String(data.label || '').trim() || 'Вакансии';
        var rows = Array.isArray(data.items) ? data.items : [];
        var metrics = data.periodMetrics || {};
        var subsets = data.subsets || {};
        function metricRow(label, value, extra) {
            return '<div class="donut-period-metric">' +
                '<span class="donut-period-metric-label">' + escapeHtml(label) + '</span>' +
                '<strong class="donut-period-metric-value">' + escapeHtml(String(value)) + '</strong>' +
                (extra ? '<span class="donut-period-metric-extra">' + escapeHtml(extra) + '</span>' : '') +
            '</div>';
        }
        function renderDistributionSection(title, total, items) {
            var list = Array.isArray(items) ? items : [];
            if (!total || !list.length) {
                return '<section class="donut-drilldown-section">' +
                    '<div class="donut-drilldown-empty">Нет вакансий для выбранного среза</div>' +
                '</section>';
            }
            return '<section class="donut-drilldown-section">' +
                '<div class="donut-drilldown-list">' +
                    list.map(function(item) {
                        var width = Math.max(4, Math.min(100, item.share || 0));
                        return '<div class="donut-drilldown-row">' +
                            '<div class="donut-drilldown-row-head">' +
                                '<span class="donut-drilldown-exp">' + escapeHtml(item.experience) + '</span>' +
                                '<span class="donut-drilldown-meta">' + (item.count || 0) + ' · ' + totalsFormatNumber(item.share || 0) + '%</span>' +
                            '</div>' +
                            '<div class="donut-drilldown-track">' +
                                '<div class="donut-drilldown-fill" style="width:' + width + '%;"></div>' +
                            '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' +
            '</section>';
        }
        var metricsHtml = '';
        var secondarySectionHtml = '';
        if (data.status === 'active') {
            metricsHtml = '<div class="donut-period-metrics">' +
                metricRow('Активные на конец периода', data.total || 0) +
                metricRow('Новые за период', metrics.newPublished || 0, totalsFormatNumber(metrics.shareNewPublished || 0) + '% от активных') +
            '</div>';
            secondarySectionHtml = renderDistributionSection('Новые за период', (subsets.newPublished && subsets.newPublished.total) || 0, (subsets.newPublished && subsets.newPublished.items) || []);
        } else if (data.status === 'archived') {
            metricsHtml = '<div class="donut-period-metrics">' +
                metricRow('Архивные за период', data.total || 0) +
                metricRow('Опубл. и архив. за период', metrics.publishedAndArchived || 0, totalsFormatNumber(metrics.sharePublishedAndArchived || 0) + '% от архивных') +
            '</div>';
            secondarySectionHtml = renderDistributionSection('Опубл. и архив. за период', (subsets.publishedAndArchived && subsets.publishedAndArchived.total) || 0, (subsets.publishedAndArchived && subsets.publishedAndArchived.items) || []);
        }
        if (!rows.length || !data.total) {
            return '<div class="donut-drilldown-header">' +
                    '<div class="donut-drilldown-title">Детализация · ' + escapeHtml(statusLabel) + '</div>' +
                '</div>' +
                metricsHtml +
                '<div class="donut-drilldown-empty">Нет вакансий для выбранного статуса</div>';
        }
        return '<div class="donut-drilldown-header">' +
                '<div class="donut-drilldown-title">Детализация · ' + escapeHtml(statusLabel) + '</div>' +
                '<div class="donut-drilldown-subtitle">' + escapeHtml(formatVacancyCount(data.total)) + '</div>' +
            '</div>' +
            metricsHtml +
            '<div class="donut-drilldown-grid">' +
                renderDistributionSection('Распределение по опыту', data.total || 0, rows) +
                secondarySectionHtml +
            '</div>';
    }

    // ===== Круговая диаграмма (donut) для вакансий =====
    function buildDonutChartHtml(total, active, archived, avgAgeValue, breakdownData, interactiveEnabled) {
        var circumference = 2 * Math.PI * 80; // r=80
        var innerCircumference = 2 * Math.PI * 56; // r=56
        var activePct = total > 0 ? active / total : 0;
        var archivedPct = total > 0 ? archived / total : 0;
        var activeMetrics = (breakdownData && breakdownData.active && breakdownData.active.periodMetrics) || {};
        var archivedMetrics = (breakdownData && breakdownData.archived && breakdownData.archived.periodMetrics) || {};
        var newPublished = activeMetrics && activeMetrics.newPublished ? activeMetrics.newPublished : 0;
        var publishedAndArchived = archivedMetrics && archivedMetrics.publishedAndArchived ? archivedMetrics.publishedAndArchived : 0;
        var newPublishedPct = total > 0 ? newPublished / total : 0;
        var publishedAndArchivedPct = total > 0 ? publishedAndArchived / total : 0;
        var activeLen = activePct * circumference;
        var archivedLen = archivedPct * circumference;
        var innerActiveLen = newPublishedPct * innerCircumference;
        var innerArchivedLen = publishedAndArchivedPct * innerCircumference;
        var offset1 = 0;
        var offset2 = activeLen;
        var innerOffset1 = 0;
        var innerOffset2 = innerActiveLen;
        var donutKey = String(roleSuffix || 'default');
        var activeGradientId = 'donut-active-gradient-' + donutKey;
        var archivedGradientId = 'donut-archived-gradient-' + donutKey;
        var activeInnerGradientId = 'donut-active-inner-gradient-' + donutKey;
        var archivedInnerGradientId = 'donut-archived-inner-gradient-' + donutKey;
        var breakdownEncoded = encodeURIComponent(JSON.stringify(breakdownData || {}));
        var interactiveAttr = interactiveEnabled ? ' data-interactive="1"' : ' data-interactive="0"';
        var activeSegmentClass = 'donut-segment donut-chart-segment donut-chart-segment-outer donut-chart-segment-active' + (interactiveEnabled ? ' is-clickable' : '');
        var archivedSegmentClass = 'donut-segment donut-chart-segment donut-chart-segment-outer donut-chart-segment-archived' + (interactiveEnabled ? ' is-clickable' : '');
        var activeInnerSegmentClass = 'donut-segment donut-chart-segment donut-chart-segment-inner donut-chart-segment-new' + (interactiveEnabled ? ' is-clickable' : '');
        var archivedInnerSegmentClass = 'donut-segment donut-chart-segment donut-chart-segment-inner donut-chart-segment-published-archived' + (interactiveEnabled ? ' is-clickable' : '');
        var activeLegendTag = interactiveEnabled ? 'button' : 'div';
        var archivedLegendTag = interactiveEnabled ? 'button' : 'div';
        var activeLegendAttrs = interactiveEnabled
            ? ' type="button" class="donut-legend-item donut-legend-action donut-legend-action-active" data-status="active" aria-pressed="false"'
            : ' class="donut-legend-item"';
        var archivedLegendAttrs = interactiveEnabled
            ? ' type="button" class="donut-legend-item donut-legend-action donut-legend-action-archived" data-status="archived" aria-pressed="false"'
            : ' class="donut-legend-item"';

        return '<div class="donut-chart-container"' + interactiveAttr + ' data-breakdown="' + breakdownEncoded + '">' +
            '<div class="donut-chart">' +
                '<svg viewBox="0 0 200 200">' +
                    '<defs>' +
                        '<linearGradient id="' + activeGradientId + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
                            '<stop offset="0%" stop-color="' + CHART_COLORS.selectedStart + '"></stop>' +
                            '<stop offset="55%" stop-color="' + CHART_COLORS.selectedMid + '"></stop>' +
                            '<stop offset="100%" stop-color="' + CHART_COLORS.selectedEnd + '"></stop>' +
                        '</linearGradient>' +
                        '<linearGradient id="' + archivedGradientId + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
                            '<stop offset="0%" stop-color="' + DONUT_ARCHIVED_GRADIENT_START + '"></stop>' +
                            '<stop offset="100%" stop-color="' + DONUT_ARCHIVED_GRADIENT_END + '"></stop>' +
                        '</linearGradient>' +
                        '<linearGradient id="' + activeInnerGradientId + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
                            '<stop offset="0%" stop-color="#8fe9f7"></stop>' +
                            '<stop offset="55%" stop-color="#49c8f2"></stop>' +
                            '<stop offset="100%" stop-color="#5f95ff"></stop>' +
                        '</linearGradient>' +
                        '<linearGradient id="' + archivedInnerGradientId + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
                            '<stop offset="0%" stop-color="#efc3ff"></stop>' +
                            '<stop offset="55%" stop-color="#d79cfb"></stop>' +
                            '<stop offset="100%" stop-color="#b58cff"></stop>' +
                        '</linearGradient>' +
                    '</defs>' +
                    '<circle class="donut-chart-track donut-chart-track-outer" stroke="rgba(148, 163, 184, 0.18)" stroke-dasharray="' + circumference + ' 0" stroke-dashoffset="0"></circle>' +
                    '<circle class="' + activeSegmentClass + '" data-status="active" stroke="url(#' + activeGradientId + ')" stroke-dasharray="' + activeLen + ' ' + (circumference - activeLen) + '" stroke-dashoffset="' + (-offset1) + '" role="' + (interactiveEnabled ? 'button' : 'presentation') + '" tabindex="' + (interactiveEnabled ? '0' : '-1') + '" aria-label="Открыть распределение по опыту для открытых вакансий"></circle>' +
                    '<circle class="' + archivedSegmentClass + '" data-status="archived" stroke="url(#' + archivedGradientId + ')" stroke-dasharray="' + archivedLen + ' ' + (circumference - archivedLen) + '" stroke-dashoffset="' + (-offset2) + '" role="' + (interactiveEnabled ? 'button' : 'presentation') + '" tabindex="' + (interactiveEnabled ? '0' : '-1') + '" aria-label="Открыть распределение по опыту для архивных вакансий"></circle>' +
                    '<circle class="donut-chart-track donut-chart-track-inner" stroke="rgba(148, 163, 184, 0.12)" stroke-dasharray="' + innerCircumference + ' 0" stroke-dashoffset="0"></circle>' +
                    '<circle class="' + activeInnerSegmentClass + '" data-status="active" stroke="url(#' + activeInnerGradientId + ')" stroke-dasharray="' + innerActiveLen + ' ' + (innerCircumference - innerActiveLen) + '" stroke-dashoffset="' + (-innerOffset1) + '" role="' + (interactiveEnabled ? 'button' : 'presentation') + '" tabindex="' + (interactiveEnabled ? '0' : '-1') + '" aria-label="Открыть детализацию новых вакансий за период"></circle>' +
                    '<circle class="' + archivedInnerSegmentClass + '" data-status="archived" stroke="url(#' + archivedInnerGradientId + ')" stroke-dasharray="' + innerArchivedLen + ' ' + (innerCircumference - innerArchivedLen) + '" stroke-dashoffset="' + (-innerOffset2) + '" role="' + (interactiveEnabled ? 'button' : 'presentation') + '" tabindex="' + (interactiveEnabled ? '0' : '-1') + '" aria-label="Открыть детализацию вакансий, опубликованных и архивированных за период"></circle>' +
                '</svg>' +
                '<div class="donut-center-label">' +
                    '<div class="donut-center-value">' + total + '</div>' +
                    '<div class="donut-center-text">всего</div>' +
                '</div>' +
            '</div>' +
            '<div class="donut-legend">' +
                '<' + activeLegendTag + activeLegendAttrs + '>' +
                    '<span class="donut-legend-color donut-legend-color-active"></span>' +
                    '<span class="donut-legend-label">Активные</span>' +
                    '<span class="donut-legend-value">' + active + '</span>' +
                '</' + activeLegendTag + '>' +
                '<button type="button" class="donut-legend-item donut-legend-action donut-legend-action-active" data-status="active" aria-pressed="false">' +
                    '<span class="donut-legend-color donut-legend-color-new"></span>' +
                    '<span class="donut-legend-label">Новые за период</span>' +
                    '<span class="donut-legend-value">' + newPublished + '</span>' +
                '</button>' +
                '<' + archivedLegendTag + archivedLegendAttrs + '>' +
                    '<span class="donut-legend-color donut-legend-color-archived"></span>' +
                    '<span class="donut-legend-label">Архивные</span>' +
                    '<span class="donut-legend-value">' + archived + '</span>' +
                '</' + archivedLegendTag + '>' +
                '<button type="button" class="donut-legend-item donut-legend-action donut-legend-action-archived" data-status="archived" aria-pressed="false">' +
                    '<span class="donut-legend-color donut-legend-color-published-archived"></span>' +
                    '<span class="donut-legend-label">Опубл. и архив. за период</span>' +
                    '<span class="donut-legend-value">' + publishedAndArchived + '</span>' +
                '</button>' +
                '<div class="donut-legend-item donut-legend-kpi">' +
                    '<span class="donut-legend-color donut-legend-color-kpi"></span>' +
                    '<span class="donut-legend-label">Ср. время жизни</span>' +
                    '<span class="donut-legend-value">' + (total > 0 ? totalsFormatNumber(avgAgeValue) + ' дн.' : '—') + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="donut-drilldown" hidden></div>' +
        '</div>';
    }

    // ===== Воронка для откликов =====
    function buildFunnelChartHtml(responseCount, interviewCount, resultCount, offerCount) {
        var stages = [
            { label: 'Отклики', value: responseCount, filterKey: null, filterValue: null },
            { label: 'Собес назначен', value: interviewCount, filterKey: 'interview', filterValue: 'yes' },
            { label: 'Результат указан', value: resultCount, filterKey: 'result', filterValue: 'yes' },
            { label: 'Оффер', value: offerCount, filterKey: 'offer', filterValue: 'yes' }
        ];

        var maxValue = responseCount || 1;
        var funnelHtml = stages.map(function(stage, index) {
            var widthPct = Math.max(40, (stage.value / maxValue) * 100);
            var percentText = responseCount > 0 ? Math.round(stage.value * 100 / responseCount) : 0;
            var clickHandler = (stage.filterKey && stage.filterValue)
                ? ' onclick="handleFunnelClick(\'' + escapeHtml(stage.filterKey) + '\', \'' + escapeHtml(stage.filterValue) + '\', ' + roleSuffix + ')"'
                : '';
            return '<div class="funnel-stage funnel-stage-' + index + '" style="width:' + widthPct + '%;margin:0 auto;"' + clickHandler + '>' +
                '<span class="funnel-stage-label">' + escapeHtml(stage.label) + '</span>' +
                '<span class="funnel-stage-value">' + stage.value + '</span>' +
                '<span class="funnel-stage-percent">' + percentText + '%</span>' +
            '</div>';
        }).join('');

        return '<div class="funnel-chart">' + funnelHtml + '</div>';
    }

    function buildBurnupChartHtml(graphId) {
        return '<div class="totals-burnup-card">' +
            '<div class="plotly-graph totals-burnup-graph" id="' + escapeHtml(graphId) + '"></div>' +
        '</div>';
    }

    // ===== Диаграмма зарплат (прогресс-бар с точками) =====
    var SALARY_GRADIENT_COLORS = ['#00C3D3', '#00AADF', '#007AD8', '#7B61E8', '#D149EF'];
    var SALARY_METRIC_LABELS = {
        'min': 'Мин',
        'avg': 'Среднее',
        'median': 'Медиана',
        'mode': 'Мода',
        'max': 'Макс'
    };
    var SALARY_LEGEND_ORDER = ['min', 'mode', 'median', 'avg', 'max'];
    var DONUT_ARCHIVED_GRADIENT_START = '#f38bff';
    var DONUT_ARCHIVED_GRADIENT_END = '#8b5cf6';
    function buildSalaryMetricNamesHtml(items) {
        return items.map(function(item) {
            return SALARY_METRIC_LABELS[item.key];
        }).join(', ');
    }
    function buildSalaryLegendEntryHtml(items, color) {
        var text = buildSalaryMetricNamesHtml(items);
        return '<span class="salary-chart-legend-text" style="color:' + color + ';">' + text + '</span>';
    }
    function buildSalaryDisplayPositions(groups, min, max, isSingle) {
        if (!groups.length) return [];
        if (groups.length === 1 || isSingle) return [50];
        if (groups.length === 2) return [0, 100];
        var minGap = groups.length >= 5 ? 16 : (groups.length === 4 ? 18 : 22);
        var actual = groups.map(function(g) {
            if (g.value <= min) return 0;
            if (g.value >= max) return 100;
            return ((g.value - min) / Math.max(1, max - min)) * 100;
        });
        var slots = groups.map(function(_, idx) {
            return (idx / (groups.length - 1)) * 100;
        });
        var result = [0];
        for (var i = 1; i < groups.length - 1; i++) {
            var desired = (actual[i] * 0.35) + (slots[i] * 0.65);
            var minAllowed = result[i - 1] + minGap;
            var maxAllowed = 100 - (minGap * (groups.length - 1 - i));
            result[i] = Math.max(minAllowed, Math.min(maxAllowed, desired));
        }
        result.push(100);
        return result;
    }
    function buildSalaryChartHtml(salaryRows) {
        var currencies = ['RUR', 'USD', 'EUR'];
        var rows = currencies.map(function(curr) {
            return salaryRows.find(function(item) { return item.currency === curr; }) || null;
        });

        var html = '';
        rows.forEach(function(row, idx) {
            var curr = currencies[idx];
            if (!row || row.min === null || row.max === null) {
                html += '<div class="salary-chart-row"><div class="salary-chart-label">' +
                    '<span class="salary-chart-currency-badge">' + curr + '</span>' +
                    '<span style="color:var(--text-secondary);font-size:0.82rem;">Нет данных</span>' +
                    '</div></div>';
                return;
            }

            var min = Number(row.min) || 0;
            var avg = Number(row.avg) || 0;
            var median = Number(row.median) || 0;
            var mode = Number(row.mode) || 0;
            var max = Number(row.max) || 0;
            var range = max - min;
            var isSingle = (range === 0);
            if (isSingle) range = 1;

            var points = [
                { key: 'min', value: min },
                { key: 'mode', value: mode },
                { key: 'median', value: median },
                { key: 'avg', value: avg },
                { key: 'max', value: max }
            ];
            points.sort(function(a, b) { return a.value - b.value; });

            var groups = [];
            points.forEach(function(p) {
                var last = groups.length ? groups[groups.length - 1] : null;
                if (last && last.value === p.value) {
                    last.items.push(p);
                } else {
                    groups.push({ value: p.value, items: [p] });
                }
            });
            groups.forEach(function(group, groupIdx) {
                var colorIdx = groups.length === 1 ? 2 : Math.round((groupIdx / Math.max(groups.length - 1, 1)) * (SALARY_GRADIENT_COLORS.length - 1));
                group.color = SALARY_GRADIENT_COLORS[colorIdx];
            });

            var legendHtml = '<div class="salary-chart-legend">';
            groups.forEach(function(g) {
                legendHtml += '<div class="salary-chart-legend-item">' + buildSalaryLegendEntryHtml(g.items, g.color) + '</div>';
            });
            legendHtml += '</div>';

            var displayPositions = buildSalaryDisplayPositions(groups, min, max, isSingle);
            var pointsHtml = '';
            groups.forEach(function(g, groupIdx) {
                var pct = displayPositions[groupIdx];
                var pointClass = 'salary-chart-point-group';
                if (g.items.length > 1) pointClass += ' is-clustered';
                if (pct <= 8) pointClass += ' edge-left';
                else if (pct >= 92) pointClass += ' edge-right';
                var pointFill = g.color;
                pointsHtml += '<div class="' + pointClass + '" style="left:' + pct + '%;">' +
                    '<div class="salary-chart-point-markers"><span class="salary-chart-point" style="background:' + pointFill + ';"></span></div>' +
                    '<div class="salary-chart-point-value" style="color:' + pointFill + ';">' + formatSalaryValue(g.value, curr) + '</div>' +
                '</div>';
            });

            var fillStyle = 'background:' + CHART_COLORS.selectedGradient + ';';

            html += '<div class="salary-chart-row">' +
                '<div class="salary-chart-header">' +
                    legendHtml +
                    '<span class="salary-chart-currency-badge">' + curr + '</span>' +
                '</div>' +
                '<div class="salary-chart-range">' +
                    '<div class="salary-chart-track"></div>' +
                    '<div class="salary-chart-fill" style="' + fillStyle + '"></div>' +
                    pointsHtml +
                '</div>' +
            '</div>';
        });

        return '<div class="salary-chart-container">' + html + '</div>';
    }
    function buildSalaryCoverageChartHtml(coverageStats) {
        var stats = coverageStats || totalsComputeSalaryCoverage([]);
        function coverageItem(label, count, share, cls) {
            return '<div class="salary-coverage-item ' + cls + '">' +
                '<div class="salary-coverage-item-label">' + escapeHtml(label) + '</div>' +
                '<div class="salary-coverage-item-value">' + (count || 0) + '</div>' +
                '<div class="salary-coverage-item-share">' + totalsFormatNumber(share || 0) + '%</div>' +
            '</div>';
        }
        return '<div class="salary-coverage-card">' +
            '<div class="salary-coverage-main">' +
                coverageItem('С з/п', stats.withSalary || 0, stats.withSalaryShare || 0, 'is-with-salary') +
                coverageItem('Без з/п', stats.withoutSalary || 0, stats.withoutSalaryShare || 0, 'is-without-salary') +
            '</div>' +
            '<div class="salary-coverage-subtitle">Из вакансий с зарплатой</div>' +
            '<div class="salary-coverage-currencies">' +
                coverageItem('RUR', stats.currencies.RUR.count || 0, stats.currencies.RUR.share || 0, 'is-rur') +
                coverageItem('USD', stats.currencies.USD.count || 0, stats.currencies.USD.share || 0, 'is-usd') +
                coverageItem('EUR', stats.currencies.EUR.count || 0, stats.currencies.EUR.share || 0, 'is-eur') +
                coverageItem('Другая', stats.currencies.other.count || 0, stats.currencies.other.share || 0, 'is-other') +
            '</div>' +
        '</div>';
    }

    function formatSalaryValue(val, currency) {
        if (val === null || val === undefined || !isFinite(val)) return '—';
        var num = Math.round(val);
        if (currency === 'RUR') {
            if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + ' млн';
            if (num >= 1000) return Math.round(num / 1000) + 'к';
            return String(num);
        }
        return String(num);
    }
    function buildEmployerOverviewCardHtml(graphId) {
        return '<div class="dashboard-card totals-employer-overview-card">' +
            '<h3 class="dashboard-card-title">Анализ работодателей</h3>' +
            '<div class="plotly-graph totals-employer-overview-graph" id="' + graphId + '"></div>' +
        '</div>';
    }
    function renderEmployerOverviewCard(graphId) {
        var graphEl = document.getElementById(graphId);
        if (!graphEl || typeof Plotly === 'undefined') return;
        var selectedCurrencyValues = hasExplicitGlobalFilterSelection('currency')
            ? getResolvedGlobalFilterValues('currency', getGlobalFilterOptions(parentRole, 'currency', 'totals'))
            : [];
        var resolvedEmployerFilters = resolveEmployerOverviewFilters(
            selectedCurrencyValues,
            uiState.market_trends_salary_metric || 'avg'
        );
        var currentCurrency = resolvedEmployerFilters.currency;
        var currentMetric = resolvedEmployerFilters.metric;
        var model = buildEmployerOverviewChartModel(vacancies || [], currentCurrency, currentMetric);
        var currentContext = '';
        var points = model.labels.map(function(label, index) {
            return { label: label, value: model.values[index] };
        }).filter(function(item) {
            return item.value !== null && item.value !== undefined && isFinite(item.value);
        });
        if (!points.length) {
            graphEl.dataset.plotSignature = currentCurrency + '|' + currentMetric + '|empty';
            graphEl.dataset.plotReady = '';
            graphEl.innerHTML = '<div style="padding:12px;color:var(--text-secondary);text-align:center;">Нет данных по зарплате для выбранной валюты</div>';
            return;
        }
        var axisCurrencyLabel = currentCurrency === 'OTHER' ? 'Другая валюта' : currentCurrency;
        var metricLabel = totalsMetricLabel(currentMetric);
        var labels = points.map(function(item) { return item.label; });
        var values = points.map(function(item) { return item.value; });
        var signature = currentCurrency + '|' + currentMetric + '|' + values.join('|') + '|' + labels.join('|') + '|' + currentContext;
        var colors = labels.map(function(label) {
            if (label.indexOf(': Да') >= 0) return CHART_COLORS.light;
            if (label.indexOf(': Нет') >= 0) return CHART_COLORS.dark;
            return CHART_COLORS.medium;
        });
        plotIfChangedById(graphId, signature, [{
            type: 'bar',
            orientation: 'h',
            x: values,
            y: labels,
            marker: { color: colors, line: { width: 0 } },
            text: values.map(function(value) {
                return totalsFormatSalaryPointValue(value, currentCurrency === 'OTHER' ? '' : currentCurrency);
            }),
            textposition: 'auto',
            hovertemplate: '%{y}<br>' + escapeHtml(metricLabel) + ': %{x}<extra></extra>'
        }], {
            title: { text: '', x: 0.5, xanchor: 'center' },
            xaxis: { title: 'Зарплата, ' + axisCurrencyLabel, automargin: true },
            yaxis: { title: '', automargin: true, autorange: 'reversed' },
            margin: { t: 56, r: 16, b: 40, l: 220 },
            height: 420,
            showlegend: false
        });
        var headingEl = graphEl.querySelector('.unified-chart-heading');
        if (headingEl) {
            headingEl.style.display = 'none';
            var titleEl = headingEl.querySelector('.unified-chart-title');
            var subtitleEl = headingEl.querySelector('.unified-chart-subtitle');
            if (titleEl) titleEl.textContent = '';
            if (subtitleEl) {
                subtitleEl.textContent = '';
                subtitleEl.style.display = 'none';
            }
        }
        resizePlotlyScope(graphEl);
    }

    var overviewHtml =
        '<div class="dashboard-overview">' +
            '<div class="dashboard-card">' +
                '<h3 class="dashboard-card-title">Вакансии</h3>' +
                buildDonutChartHtml(totalCount, activeCount, archivedCount, avgAge, donutExperienceBreakdown, donutInteractive) +
            '</div>' +
            '<div class="dashboard-card">' +
                '<h3 class="dashboard-card-title">Сгорание вакансий</h3>' +
                buildBurnupChartHtml('totals-burnup-graph-' + roleSuffix) +
            '</div>' +
            '<div class="dashboard-card">' +
                '<h3 class="dashboard-card-title">Воронка откликов</h3>' +
                buildFunnelChartHtml(responseRows.length, responseInterview, responseResult, responseOffer) +
            '</div>' +
            '<div class="dashboard-card">' +
                '<h3 class="dashboard-card-title">Покрытие зарплат</h3>' +
                buildSalaryCoverageChartHtml(totalsComputeSalaryCoverage(vacancies)) +
            '</div>' +
            '<div class="dashboard-card">' +
                '<h3 class="dashboard-card-title">Зарплаты</h3>' +
                buildTotalsSalaryOverviewSectionHtml(salaryOverviewModel) +
            '</div>' +
            buildEmployerOverviewCardHtml('totals-employer-overview-graph-' + roleSuffix) +
        '</div>';
    var topTitlePrefix = 'Топ-' + topLimit;
    var topHtml =
        '<div class="totals-layout totals-top-layout">' +
            '<div class="totals-top-columns">' +
                '<div class="totals-top-column">' +
                    '<section class="totals-card">' +
                        '<div class="totals-card-head">' +
                            '<h3>' + topTitlePrefix + ' вакансий по зарплате</h3>' +
                        '</div>' +
                        buildSwitchRow('totals_vacancy_order', [
                            { value: 'high', label: 'Выше' },
                            { value: 'low', label: 'Ниже' }
                        ], vacancyOrder) +
                        '<div class="vacancy-table-wrap"><table class="vacancy-table"><thead><tr><th>Вакансия</th><th>Работодатель</th><th>Зарплата</th><th>Отклик</th></tr></thead><tbody>' +
                            (topVacancies.length ? topVacancies.map(topVacancyRowHtml).join('') : '<tr><td colspan="4">Нет данных</td></tr>') +
                        '</tbody></table></div>' +
                    '</section>' +
                    '<section class="totals-card">' +
                        '<div class="totals-card-head">' +
                            '<h3>' + topTitlePrefix + ' работодателей по зарплате</h3>' +
                        '</div>' +
                        buildSwitchRow('totals_company_order', [
                            { value: 'high', label: 'Выше' },
                            { value: 'low', label: 'Ниже' }
                        ], companyOrder) +
                        '<div class="vacancy-table-wrap"><table class="vacancy-table totals-table-compact"><thead><tr><th>Работодатель</th><th>Вакансий</th><th>Мин</th><th>Средняя</th><th>Мода</th><th>Медиана</th><th>Макс</th></tr></thead><tbody>' +
                            (topCompanies.length ? topCompanies.map(topCompanyRowHtml).join('') : '<tr><td colspan="7">Нет данных</td></tr>') +
                        '</tbody></table></div>' +
                    '</section>' +
                '</div>' +
                '<div class="totals-top-column">' +
                    '<section class="totals-card">' +
                        '<div class="totals-card-head">' +
                            '<h3>' + topTitlePrefix + ' навыков</h3>' +
                        '</div>' +
                        buildSwitchRow('totals_skills_order', [
                            { value: 'most', label: 'Чаще' },
                            { value: 'least', label: 'Реже' }
                        ], skillsOrder) +
                        '<div class="vacancy-table-wrap"><table class="vacancy-table totals-table-compact"><thead><tr><th>Навык</th><th>Упоминаний</th><th>Мин</th><th>Средняя</th><th>Мода</th><th>Медиана</th><th>Макс</th></tr></thead><tbody>' +
                            (topSkills.length ? topSkills.map(topSkillRowHtml).join('') : '<tr><td colspan="7">Нет данных</td></tr>') +
                        '</tbody></table></div>' +
                    '</section>' +
                    '<section class="totals-card">' +
                        '<div class="totals-card-head">' +
                            '<h3>' + topTitlePrefix + ' работодателей по скорости закрытия вакансий</h3>' +
                        '</div>' +
                        buildSwitchRow('totals_closing_window', [
                            { value: 'lte_7', label: '7д' },
                            { value: 'lte_14', label: '14д' },
                            { value: 'lte_30', label: '30д' },
                            { value: 'gt_30', label: '30+' },
                            { value: 'gt_60', label: '60+' }
                        ], closingWindow) +
                        '<div class="vacancy-table-wrap"><table class="vacancy-table totals-table-compact"><thead><tr><th>Работодатель</th><th>Закрыто</th><th>Мин дней</th><th>Средняя</th><th>Мода</th><th>Медиана</th><th>Макс дней</th></tr></thead><tbody>' +
                            (topClosingCompanies.length ? topClosingCompanies.map(topClosingCompanyRowHtml).join('') : '<tr><td colspan="7">Нет данных</td></tr>') +
                        '</tbody></table></div>' +
                    '</section>' +
                '</div>' +
            '</div>' +
        '</div>';
    block.innerHTML = buildDashboardModeSwitchRow(dashboardMode) + (
        dashboardMode === 'market-trends'
            ? '<div class="market-trends-content market-trends-embedded"></div>'
            : (dashboardMode === 'top' ? topHtml : overviewHtml)
    );

    block.querySelectorAll('.totals-switch-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var key = String(btn.dataset.switch || '').trim();
            var value = String(btn.dataset.value || '').trim();
            if (!key || !value) return;
            uiState[key] = value;
            renderGlobalTotalsFiltered(parentRole);
            if (key === 'totals_dashboard_mode') syncSharedFilterPanel(parentRole, 'totals', true);
        });
    });
    block.querySelectorAll('.salary-overview-currency-button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var currency = String(btn.dataset.currency || '').trim();
            if (!currency) return;
            uiState.totals_salary_currency = currency;
            renderGlobalTotalsFiltered(parentRole);
        });
    });
    if (!uiState.my_responses_cache_loaded && !uiState.my_responses_cache_loading) {
        uiState.my_responses_cache_loading = true;
        fetchMyResponsesVacancies().then(function() {
            if (parentRole && parentRole.isConnected) renderGlobalTotalsFiltered(parentRole);
        }).catch(function() {
        }).finally(function() {
            uiState.my_responses_cache_loading = false;
        });
    }
    if (typeof syncDashboardTopbarMeta === 'function') {
        syncDashboardTopbarMeta(parentRole, 'totals');
    }
    if (dashboardMode === 'market-trends') {
        var embeddedTrends = block.querySelector('.market-trends-content.market-trends-embedded');
        if (embeddedTrends) renderMarketTrends(parentRole, embeddedTrends);
        return;
    }

    if (dashboardMode !== 'overview') return;

    var burnupGraphId = 'totals-burnup-graph-' + roleSuffix;
    var burnupGraphEl = document.getElementById(burnupGraphId);
    if (burnupGraphEl && burnupGraphEl.dataset) {
        burnupGraphEl.dataset.chartContext = buildChartContextLabel(burnupPeriodLabel, null);
    }
    buildTotalsTrendLineChart(burnupGraphId, burnupSeries.labels || [], [
        {
            x: burnupSeries.labels || [],
            y: burnupSeries.newPublished || [],
            name: 'Новые',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: CHART_COLORS.selectedStart, width: 3 }
        },
        {
            x: burnupSeries.labels || [],
            y: burnupSeries.archived || [],
            name: 'Архивные',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: CHART_COLORS.negative, width: 3 }
        },
        {
            x: burnupSeries.labels || [],
            y: burnupSeries.publishedAndArchived || [],
            name: 'Опубл. и архив.',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#7B61E8', width: 2, dash: 'dot' }
        },
        {
            x: burnupSeries.labels || [],
            y: burnupSeries.active || [],
            name: 'Активные',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: CHART_COLORS.selectedMid, width: 3 }
        }
    ], 'Сгорание вакансий', buildChartContextLabel(burnupPeriodLabel, null), 'Количество', false);
    renderEmployerOverviewCard('totals-employer-overview-graph-' + roleSuffix);

    var donutContainer = block.querySelector('.donut-chart-container[data-interactive="1"]');
    if (!donutContainer) return;
    var donutBreakdown = parseJsonDataset(donutContainer, 'breakdown', {});
    var drilldownHost = donutContainer.querySelector('.donut-drilldown');
    var actions = Array.from(donutContainer.querySelectorAll('[data-status]'));

    function syncDonutSelection(status) {
        actions.forEach(function(node) {
            var isSelected = !!status && String(node.dataset.status || '') === status;
            node.classList.toggle('is-selected', isSelected);
            if (node.classList.contains('donut-legend-action')) {
                node.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            }
        });
    }

    function toggleDonutDrilldown(status) {
        var normalizedStatus = String(status || '').trim();
        if (!normalizedStatus || !drilldownHost) return;
        var nextStatus = donutContainer.dataset.activeStatus === normalizedStatus ? '' : normalizedStatus;
        donutContainer.dataset.activeStatus = nextStatus;
        syncDonutSelection(nextStatus);
        if (!nextStatus) {
            drilldownHost.hidden = true;
            drilldownHost.innerHTML = '';
            return;
        }
        drilldownHost.hidden = false;
        drilldownHost.innerHTML = buildTotalsExperienceDrilldownHtml(donutBreakdown[nextStatus]);
    }

    actions.forEach(function(node) {
        node.addEventListener('click', function() {
            toggleDonutDrilldown(String(node.dataset.status || '').trim());
        });
        if (node.classList.contains('donut-chart-segment')) {
            node.addEventListener('keydown', function(event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                toggleDonutDrilldown(String(node.dataset.status || '').trim());
            });
        }
    });
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
    else if (current === 'my-responses') renderMyResponsesContent(parentRole);
    else if (current === 'responses-calendar') renderMyResponsesCalendarContent(parentRole);
    else if (current === 'employer-analysis') renderGlobalEmployerFiltered(parentRole);
    else if (current === 'totals') renderGlobalTotalsFiltered(parentRole);
}

function createSharedFilterGroup(title, nodes) {
    var options = arguments.length > 2 ? arguments[2] : {};
    var items = (nodes || []).filter(function(node) { return !!node; });
    if (!items.length) return null;
    var state = typeof ensureSharedFilterPanelState === 'function'
        ? ensureSharedFilterPanelState()
        : { open: true, sections: {} };
    var sectionKey = String(options && options.sectionKey || '').trim();
    var isCollapsible = !!sectionKey;
    var isOpen = isCollapsible ? (state.sections && state.sections[sectionKey] !== false) : true;
    var sectionIcon = getSharedFilterGroupIcon(sectionKey);
    var activeRole = getActiveRoleContent();
    var activeAnalysis = (options && options.analysisType) || (activeRole && activeRole.dataset ? activeRole.dataset.activeAnalysis || '' : '');
    var isFilled = sectionKey && typeof isSharedFilterSectionFilled === 'function'
        ? isSharedFilterSectionFilled(sectionKey, activeRole, activeAnalysis)
        : false;

    var wrap = document.createElement('section');
    wrap.className = 'shared-filter-group';
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '6px';
    wrap.style.flex = '1 1 100%';
    wrap.style.width = '100%';
    wrap.style.maxWidth = '100%';
    wrap.style.marginTop = '0';
    wrap.style.background = 'transparent';
    wrap.style.overflow = 'visible';
    wrap.style.boxSizing = 'border-box';
    if (sectionKey) wrap.dataset.sectionKey = sectionKey;
    if (isCollapsible) wrap.dataset.collapsible = '1';
    if (sectionKey) wrap.dataset.sectionFilled = isFilled ? '1' : '0';

    var titleText = String(title || '').trim();
    if (titleText) {
        var heading = document.createElement(isCollapsible ? 'button' : 'div');
        heading.className = 'shared-filter-group-title';
        heading.style.width = '100%';
        heading.style.boxSizing = 'border-box';
        heading.style.textAlign = 'left';
        heading.style.border = '0';
        heading.style.borderRadius = '0';
        heading.style.background = 'transparent';
        heading.style.padding = '0';
        heading.style.display = 'flex';
        heading.style.alignItems = 'center';
        heading.style.minHeight = '0';
        heading.style.padding = '4px 10px 3px';
        heading.style.justifyContent = 'flex-start';
        heading.style.gap = '8px';
        heading.style.cursor = isCollapsible ? 'pointer' : 'default';
        if (sectionKey) heading.dataset.sectionFilled = isFilled ? '1' : '0';
        if (sectionIcon) {
            heading.appendChild(createSharedFilterMaterialIcon(sectionIcon, 'shared-filter-group-title-icon'));
        }
        var label = document.createElement('span');
        label.className = 'shared-filter-group-title-label';
        label.textContent = titleText;
        label.style.flex = '1 1 auto';
        label.style.minWidth = '0';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        label.style.whiteSpace = 'nowrap';
        label.style.lineHeight = '1.2';
        heading.appendChild(label);
        if (isCollapsible) {
            heading.type = 'button';
            heading.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            heading.addEventListener('click', function() {
                if (wrap.dataset.sectionOpen === '1') return;
                if (typeof setSharedFilterPanelSectionOpen === 'function') {
                    setSharedFilterPanelSectionOpen(sectionKey, true);
                }
            });
        }
        wrap.appendChild(heading);
    }

    var body = document.createElement('div');
    body.className = 'shared-filter-group-body';
    body.style.flexWrap = 'wrap';
    body.style.alignItems = 'stretch';
    body.style.gap = '6px';
    body.style.width = '100%';
    body.style.maxWidth = '100%';
    body.style.boxSizing = 'border-box';
    body.style.overflow = 'visible';
    wrap.dataset.sectionOpen = isOpen ? '1' : '0';

    items.forEach(function(node) {
        body.appendChild(node);
    });

    wrap.appendChild(body);
    return wrap;
}

function setSharedFilterPanelOpen(open) {
    if (typeof ensureSharedFilterPanelState === 'function') ensureSharedFilterPanelState();
    if (!uiState.shared_filter_panel_state) uiState.shared_filter_panel_state = { open: true, sections: {} };
    uiState.shared_filter_panel_state.open = !!open;
    uiState.shared_filter_panel_state.collapsed = !uiState.shared_filter_panel_state.open;
    if (typeof persistSharedFilterPanelState === 'function') persistSharedFilterPanelState();
    var panel = document.getElementById('global-shared-filter-panel');
    if (!panel) return;
    panel.dataset.panelOpen = uiState.shared_filter_panel_state.open ? '1' : '0';
    if (typeof syncSharedFilterPanelCollapsedUi === 'function') {
        syncSharedFilterPanelCollapsedUi(panel);
    }
}

function setSharedFilterPanelSectionOpen(sectionKey, open) {
    var key = String(sectionKey || '').trim();
    if (!key) return;
    if (typeof ensureSharedFilterPanelState === 'function') ensureSharedFilterPanelState();
    if (!uiState.shared_filter_panel_state) uiState.shared_filter_panel_state = { open: true, sections: {} };
    if (!uiState.shared_filter_panel_state.sections) uiState.shared_filter_panel_state.sections = {};
    var nextOpen = !!open;
    var panel = document.getElementById('global-shared-filter-panel');
    if (nextOpen && panel) {
        panel.querySelectorAll('.shared-filter-group[data-section-key]').forEach(function(group) {
            var groupKey = String(group.dataset.sectionKey || '').trim();
            if (!groupKey) return;
            uiState.shared_filter_panel_state.sections[groupKey] = groupKey === key;
        });
        uiState.shared_filter_panel_state.activeSection = key;
    } else if (!nextOpen && uiState.shared_filter_panel_state.activeSection !== key) {
        uiState.shared_filter_panel_state.sections[key] = false;
    } else {
        nextOpen = true;
        uiState.shared_filter_panel_state.sections[key] = true;
        uiState.shared_filter_panel_state.activeSection = key;
    }
    if (typeof persistSharedFilterPanelState === 'function') persistSharedFilterPanelState();
    if (!panel) return;
    panel.dataset.activeSection = uiState.shared_filter_panel_state.activeSection || key;
    panel.querySelectorAll('.shared-filter-group[data-section-key]').forEach(function(group) {
        var groupKey = String(group.dataset.sectionKey || '').trim();
        if (!groupKey) return;
        var isOpen = uiState.shared_filter_panel_state.sections[groupKey] === true;
        group.dataset.sectionOpen = isOpen ? '1' : '0';
        var heading = group.querySelector('.shared-filter-group-title');
        if (heading) heading.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    if (uiState.shared_filter_panel_state.activeSection) {
        ensureSharedFilterSectionVisibility(panel, uiState.shared_filter_panel_state.activeSection);
    }
    if (typeof syncSharedFilterPanelCollapsedUi === 'function') {
        syncSharedFilterPanelCollapsedUi(panel);
    }
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
    var panelState = typeof ensureSharedFilterPanelState === 'function'
        ? ensureSharedFilterPanelState()
        : { open: true, sections: {} };
    var current = analysisType || (activeRole ? (activeRole.dataset.activeAnalysis || '') : '');
    var currentForFilters = current;
    if (typeof syncDashboardTopbarMeta === 'function') {
        syncDashboardTopbarMeta(activeRole, current);
    }
    panel.dataset.panelOpen = panelState.open === false ? '0' : '1';
    panel.dataset.activeAnalysis = current;
    panel.dataset.activeSection = panelState.activeSection || getSharedFilterPanelSectionKeyForAnalysis(current);
    body.style.display = panelState.open === false ? 'none' : 'flex';
    if (activeRole && activeRole.id === 'role-all') syncAllRolesSharedFilterButtons(activeRole, currentForFilters);
    if (activeRole && activeRole.id === 'role-all') syncAllRolesPeriodStateFromGlobalFilter(activeRole, currentForFilters);
    ensureDefaultPeriodFilterSelection(activeRole, currentForFilters);
    syncActiveSharedFilterPresetSelection(activeRole, currentForFilters);
    var rolesControl = createUnifiedRolesControl(activeRole, currentForFilters);
    var trendsExcludedRolesControl = (typeof createMarketTrendsExcludedRolesControl === 'function')
        ? createMarketTrendsExcludedRolesControl(activeRole, currentForFilters, true)
        : null;
    var periodsControl = createGlobalFilterDropdown('periods', 'Период', getGlobalFilterOptions(activeRole, 'periods', currentForFilters), false);
    var experiencesControl = createGlobalFilterDropdown('experiences', 'Опыт', getGlobalFilterOptions(activeRole, 'experiences', currentForFilters), false);
    var statusOptions = getGlobalFilterOptions(activeRole, 'status', currentForFilters);
    var statusControl = statusOptions.length
        ? createGlobalFilterDropdown('status', 'Статус', statusOptions, false)
        : null;
    var currencyControl = createGlobalFilterDropdown('currency', 'Валюта', getGlobalFilterOptions(activeRole, 'currency', currentForFilters), false);
    var countryControl = createGlobalFilterDropdown('country', 'Страна', getGlobalFilterOptions(activeRole, 'country', currentForFilters), false);
    var interviewControl = createGlobalFilterDropdown('interview', 'Собес назначен', getGlobalFilterOptions(activeRole, 'interview', currentForFilters), false);
    var resultControl = createGlobalFilterDropdown('result', 'Результат указан', getGlobalFilterOptions(activeRole, 'result', currentForFilters), false);
    var offerControl = createGlobalFilterDropdown('offer', 'Оффер', getGlobalFilterOptions(activeRole, 'offer', currentForFilters), false);
    var topControl = (typeof createTotalsTopFilterControl === 'function')
        ? createTotalsTopFilterControl(activeRole, currentForFilters, 'top', { hideCaption: true, hideCurrency: true })
        : null;
    var salaryMetricControl = (typeof createSalaryMetricFilterControl === 'function')
        ? createSalaryMetricFilterControl(activeRole, currentForFilters)
        : null;
    var employerControl = createGlobalFilterDropdown('employer', 'Работодатель', getGlobalFilterOptions(activeRole, 'employer', currentForFilters), false);
    var accreditationControl = createGlobalFilterDropdown('accreditation', 'ИТ-аккредитация', getGlobalFilterOptions(activeRole, 'accreditation', currentForFilters), false);
    var coverLetterControl = createGlobalFilterDropdown('cover_letter_required', 'Сопроводительное письмо', getGlobalFilterOptions(activeRole, 'cover_letter_required', currentForFilters), false);
    var hasTestControl = createGlobalFilterDropdown('has_test', 'Тестовое задание', getGlobalFilterOptions(activeRole, 'has_test', currentForFilters), false);
    var favoritesControl = (typeof createMyFiltersControl === 'function')
        ? createMyFiltersControl(activeRole, currentForFilters)
        : null;
    var skillsFilterControl = (typeof createSkillsSearchFilterControl === 'function')
        ? createSkillsSearchFilterControl(activeRole, currentForFilters)
        : null;
    var skillsLogicControl = (typeof createSkillsSearchLogicControl === 'function')
        ? createSkillsSearchLogicControl(activeRole, currentForFilters)
        : null;

    var favoritesGroup = createSharedFilterGroup('Избранное', [
        favoritesControl
    ], { sectionKey: 'my-filters', analysisType: currentForFilters });
    if (favoritesGroup) body.appendChild(favoritesGroup);

    var roleGroup = createSharedFilterGroup('Роль', [
        rolesControl,
        trendsExcludedRolesControl,
        periodsControl,
        experiencesControl,
        statusControl
    ], { sectionKey: 'roles', analysisType: currentForFilters });
    if (roleGroup) body.appendChild(roleGroup);

    var salaryGroup = createSharedFilterGroup('Зарплата', [
        currencyControl,
        countryControl,
        salaryMetricControl
    ], { sectionKey: 'salary', analysisType: currentForFilters });
    if (salaryGroup) body.appendChild(salaryGroup);

    var responsesGroup = createSharedFilterGroup('Отклики', [
        interviewControl,
        resultControl,
        offerControl
    ], { sectionKey: 'responses', analysisType: currentForFilters });
    if (responsesGroup) body.appendChild(responsesGroup);

    var topGroup = createSharedFilterGroup('Топ', [topControl], { sectionKey: 'top', analysisType: currentForFilters });
    if (topGroup) body.appendChild(topGroup);

    var vacancyGroup = createSharedFilterGroup('Вакансия', [
        employerControl,
        accreditationControl,
        coverLetterControl,
        hasTestControl
    ], { sectionKey: 'vacancy', analysisType: currentForFilters });
    if (vacancyGroup) body.appendChild(vacancyGroup);

    var skillsGroup = createSharedFilterGroup('Навыки', [
        skillsLogicControl,
        skillsFilterControl
    ], { sectionKey: 'skills', analysisType: currentForFilters });
    if (skillsGroup) body.appendChild(skillsGroup);
    panel.style.display = body.children.length ? 'flex' : 'none';
    if (typeof syncSharedFilterPanelCollapsedUi === 'function') {
        syncSharedFilterPanelCollapsedUi(panel);
    }
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
        var periodAllLabel = totalMonths ? formatMonthTitle(totalMonths) : 'Весь период';
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
        prevMonths.forEach(function(m, i) {
            periodItems.push({ key: 'm_prev_' + (i + 1), label: m, month: m });
        });
        periodItems.push({ key: 'all', label: periodAllLabel, month: null });
        block._data = {
            vacancies: vacanciesSource,
            skills: skills,
            salaryMonths: salaryMonths,
            periodItems: periodItems,
            fullVacancies: (fullVacancies && fullVacancies.length) ? true : false
        };
    }

    updateSkillsSearchData(block);
}
function setSkillsSearchFavoriteTrigger(dropdown, favoriteName, favoriteId) {
    if (!dropdown) return;
    var btn = dropdown.querySelector('.skills-search-dropdown-btn');
    if (!btn) return;
    var hasActive = !!favoriteName && favoriteId && favoriteId !== 'all';
    var triggerText = hasActive ? favoriteName : 'Не выбрано';
    btn.classList.remove('skills-search-icon-btn');
    btn.classList.add('skills-search-favorite-trigger');
    btn.dataset.value = favoriteId || 'all';
    btn.dataset.hasSelection = hasActive ? '1' : '0';
    btn.innerHTML =
        '<span class="skills-search-favorite-trigger-body">' +
            escapeHtml(triggerText) +
        '</span>';
    var title = hasActive ? ('Набор: ' + favoriteName) : 'Не выбрано';
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
function confirmSkillsSearchFavoriteDelete(favoriteName) {
    return new Promise(function(resolve) {
        var existing = document.querySelector('.skills-favorite-modal-backdrop');
        if (existing && existing.parentElement) existing.parentElement.removeChild(existing);
        var label = String(favoriteName || '').trim();
        var titleText = label ? ('Удалить "' + label + '"?') : 'Удалить набор фильтров?';

        var backdrop = document.createElement('div');
        backdrop.className = 'skills-favorite-modal-backdrop';
        backdrop.innerHTML =
            '<div class="skills-favorite-modal" role="dialog" aria-modal="true" aria-label="Удаление набора">' +
                '<div class="skills-favorite-modal-title">' + escapeHtml(titleText) + '</div>' +
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
    getSkillsSearchBooleanFilterDefs().forEach(function(item) {
        var dropdown = block.querySelector('.skills-search-dropdown[data-filter="' + item.key + '"]');
        if (!dropdown || dropdown.dataset.ready) return;
        renderSkillsSearchDropdown(dropdown, [
            { value: 'true', label: 'Да' },
            { value: 'false', label: 'Нет' }
        ], item.label, 'Все', false, true);
        dropdown.dataset.ready = '1';
        setSkillsSearchDropdownValue(dropdown, 'all');
    });
}

function getSkillsSearchBooleanFilterValues(block) {
    if (!block) return {};
    return getSkillsSearchBooleanFilterDefs().reduce(function(result, item) {
        var value = getSkillsSearchFilterValue(block, item.key) || 'all';
        result[item.key] = (value === 'true' || value === 'false') ? value : 'all';
        return result;
    }, {});
}

function setSkillsSearchBooleanFilterValues(block, values) {
    if (!block) return;
    var nextValues = {};
    getSkillsSearchBooleanFilterDefs().forEach(function(item) {
        nextValues[item.key] = 'all';
    });
    if (Array.isArray(values)) {
        values.forEach(function(value) {
            var key = String(value || '').trim();
            if (Object.prototype.hasOwnProperty.call(nextValues, key)) nextValues[key] = 'true';
        });
    } else if (values && typeof values === 'object') {
        Object.keys(nextValues).forEach(function(key) {
            var rawValue = String(values[key] || 'all').trim().toLowerCase();
            nextValues[key] = (rawValue === 'true' || rawValue === 'false') ? rawValue : 'all';
        });
    }
    getSkillsSearchBooleanFilterDefs().forEach(function(item) {
        var dropdown = block.querySelector('.skills-search-dropdown[data-filter="' + item.key + '"]');
        if (dropdown) setSkillsSearchDropdownValue(dropdown, nextValues[item.key]);
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

function normalizeSkillsSearchSkillList(list) {
    var seen = new Set();
    return (list || []).map(function(item) {
        return registerSkillDisplayName(item);
    }).map(function(item) {
        return String(item || '').trim();
    }).filter(Boolean).filter(function(item) {
        var key = normalizeSkillName(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function ensureSkillsSearchGlobalState(block) {
    var current = (uiState.skills_search_global && typeof uiState.skills_search_global === 'object') ? uiState.skills_search_global : {};
    current.includeSkills = normalizeSkillsSearchSkillList(current.includeSkills || []);
    current.excludeSkills = normalizeSkillsSearchSkillList(current.excludeSkills || []);
    current.logic = (current.logic === 'and') ? 'and' : 'or';
    current.sort = 'count';
    if (current.status === undefined) current.status = block ? (getSkillsSearchFilterValue(block, 'status') || 'all') : 'all';
    if (current.country === undefined) current.country = block ? (getSkillsSearchFilterValue(block, 'country') || 'all') : 'all';
    if (current.currency === undefined) current.currency = 'all';
    if (!current.employerFlags || typeof current.employerFlags !== 'object') current.employerFlags = {};
    uiState.skills_search_global = current;
    return uiState.skills_search_global;
}

function getSkillsSearchSelections(block) {
    var state = ensureSkillsSearchGlobalState(block);
    return {
        includeSkills: normalizeSkillsSearchSkillList(state.includeSkills || []),
        excludeSkills: normalizeSkillsSearchSkillList(state.excludeSkills || []),
        logic: state.logic === 'and' ? 'and' : 'or'
    };
}

function refreshSkillsSearchPanel(parentRole) {
    if (!parentRole) return;
    var activeAnalysis = String(parentRole.dataset.activeAnalysis || 'skills-search').trim() || 'skills-search';
    if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(parentRole, activeAnalysis, true);
}

function scrollSharedFilterPanelToEnd() {
    var host = document.getElementById('role-selector');
    if (!host) return;
    requestAnimationFrame(function() {
        var targetTop = Math.max(0, host.scrollHeight - host.clientHeight);
        if (typeof host.scrollTo === 'function') {
            host.scrollTo({ top: targetTop, behavior: 'smooth' });
        } else {
            host.scrollTop = targetTop;
        }
    });
}

function applySkillsSearchSkillState(block, includeSkills, excludeSkills, logicValue) {
    var state = ensureSkillsSearchGlobalState(block);
    state.includeSkills = normalizeSkillsSearchSkillList(includeSkills);
    state.excludeSkills = normalizeSkillsSearchSkillList(excludeSkills);
    if (logicValue) state.logic = (logicValue === 'and') ? 'and' : 'or';
}

function toggleSkillsSearchSkillState(block, rawSkill, mode) {
    if (!block) return;
    var selections = getSkillsSearchSelections(block);
    var skill = registerSkillDisplayName(rawSkill);
    var skillKey = normalizeSkillName(skill);
    var isIncluded = selections.includeSkills.some(function(item) {
        return normalizeSkillName(item) === skillKey;
    });
    var isExcluded = selections.excludeSkills.some(function(item) {
        return normalizeSkillName(item) === skillKey;
    });
    var include = selections.includeSkills.filter(function(item) {
        return normalizeSkillName(item) !== skillKey;
    });
    var exclude = selections.excludeSkills.filter(function(item) {
        return normalizeSkillName(item) !== skillKey;
    });
    if (mode === 'cycle') {
        if (isIncluded) exclude.push(skill);
        else if (isExcluded) {
            // Third click clears the skill from both include/exclude lists.
        } else {
            include.push(skill);
        }
    } else if (mode === 'exclude') {
        if (!isExcluded) exclude.push(skill);
    } else if (mode === 'include') {
        if (!isIncluded) include.push(skill);
    }
    applySkillsSearchSkillState(block, include, exclude, selections.logic);
}

function clearSkillsSearchSkillState(block, rawSkill, mode) {
    if (!block) return;
    var selections = getSkillsSearchSelections(block);
    var skillKey = normalizeSkillName(rawSkill);
    var include = selections.includeSkills;
    var exclude = selections.excludeSkills;
    if (mode === 'exclude') {
        exclude = exclude.filter(function(item) { return normalizeSkillName(item) !== skillKey; });
    } else if (mode === 'include') {
        include = include.filter(function(item) { return normalizeSkillName(item) !== skillKey; });
    } else {
        include = include.filter(function(item) { return normalizeSkillName(item) !== skillKey; });
        exclude = exclude.filter(function(item) { return normalizeSkillName(item) !== skillKey; });
    }
    applySkillsSearchSkillState(block, include, exclude, selections.logic);
}

function updateSkillsSearchData(block) {
    if (!block || !block._data) return;
    var parentRole = block.closest('.role-content');
    var baseVacancies = getFilteredVacanciesForAnalysis(parentRole, 'skills-search', {
        sourceVacancies: (block._data.vacancies || []).slice(),
        skipSkills: true
    });
    baseVacancies = dedupeVacanciesById(baseVacancies);

    block._data.currentVacancies = baseVacancies;
    var skills = computeSalarySkillsFromVacancies(baseVacancies, 50);
    block._data.skills = skills;
    updateSkillsSearchResults(block);
}

function updateSkillsSearchResults(block) {
    if (!block) return;
    var results = block.querySelector('.skills-search-results');
    if (!results) return;

    var allVacancies = (block._data && block._data.vacancies) ? block._data.vacancies : [];
    var selections = getSkillsSearchSelections(block);
    var selected = selections.includeSkills.map(normalizeSkillName);
    var excluded = selections.excludeSkills.map(normalizeSkillName);

    if (!selected.length && !excluded.length) {
        var baseList = (block._data && block._data.currentVacancies) ? block._data.currentVacancies : allVacancies;
        var summary = '<div class="skills-search-summary">Найдено вакансий: ' + baseList.length + '</div>';
        results.innerHTML = summary + buildVacancyTableHtml(baseList);
        updateSkillsSearchSummaryLine(block);
        saveSkillsSearchState(block);
        return;
    }

    var vacancies = (block._data && block._data.currentVacancies) ? block._data.currentVacancies : allVacancies;
    var logicVal = selections.logic;
    var filtered = filterVacanciesBySkills(vacancies, selected, excluded, logicVal);
    var summary = '<div class="skills-search-summary">Найдено вакансий: ' + filtered.length + '</div>';
    results.innerHTML = summary + buildVacancyTableHtml(filtered);
    updateSkillsSearchSummaryLine(block);
    saveSkillsSearchState(block);
}

function updateSkillsSearchSummaryLine(block) {
    var summary = block.querySelector('.skills-search-summary-line');
    if (!summary) return;
    var selections = getSkillsSearchSelections(block);
    var selected = selections.includeSkills.slice();
    var excluded = selections.excludeSkills.slice();
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
var SHARED_FILTER_PRESETS_STORAGE_KEY = 'research_vacancies_filter_presets_v1';
var SHARED_FILTER_PRESET_ANALYSES = ['totals', 'activity', 'weekday', 'skills-monthly', 'salary', 'employer-analysis', 'skills-search'];
var SHARED_FILTER_STATE_KEYS = ['roles', 'periods', 'experiences', 'status', 'currency', 'country', 'employer', 'interview', 'result', 'offer', 'accreditation', 'cover_letter_required', 'has_test'];

function getSharedFilterPresetAnalysisKey(analysisType) {
    var current = String(analysisType || '').trim();
    if (SHARED_FILTER_PRESET_ANALYSES.indexOf(current) >= 0) return current;
    if (current.indexOf('skills-search') === 0) return 'skills-search';
    return 'totals';
}

function ensureSharedFilterPresetsState() {
    if (uiState.shared_filter_presets && typeof uiState.shared_filter_presets === 'object') return uiState.shared_filter_presets;
    var fallback = {};
    SHARED_FILTER_PRESET_ANALYSES.forEach(function(key) {
        fallback[key] = { activeId: '', items: [] };
    });
    if (typeof window === 'undefined' || !window.localStorage) {
        uiState.shared_filter_presets = fallback;
        return uiState.shared_filter_presets;
    }
    try {
        var raw = window.localStorage.getItem(SHARED_FILTER_PRESETS_STORAGE_KEY);
        if (!raw) {
            uiState.shared_filter_presets = fallback;
            return uiState.shared_filter_presets;
        }
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            uiState.shared_filter_presets = fallback;
            return uiState.shared_filter_presets;
        }
        var next = {};
        SHARED_FILTER_PRESET_ANALYSES.forEach(function(key) {
            var bucket = parsed[key] || {};
            var items = Array.isArray(bucket.items) ? bucket.items.filter(function(item) {
                return item && item.id && item.name && item.state && typeof item.state === 'object';
            }).map(function(item) {
                return { id: String(item.id), name: String(item.name), state: item.state };
            }) : [];
            var activeId = String(bucket.activeId || '');
            if (items.length && !items.some(function(item) { return item.id === activeId; })) {
                activeId = items[0].id;
            }
            next[key] = { activeId: activeId, items: items };
        });
        var legacySkillsFavorites = typeof ensureSkillsSearchFavoritesState === 'function'
            ? ensureSkillsSearchFavoritesState()
            : (uiState.skills_search_favorites || null);
        if ((!next['skills-search'] || !next['skills-search'].items.length) && legacySkillsFavorites && Array.isArray(legacySkillsFavorites.items) && legacySkillsFavorites.items.length) {
            next['skills-search'] = {
                activeId: String(legacySkillsFavorites.activeId || (legacySkillsFavorites.items[0] && legacySkillsFavorites.items[0].id) || ''),
                items: legacySkillsFavorites.items.map(function(item) {
                    return { id: String(item.id), name: String(item.name), state: item.state || {} };
                })
            };
        }
        uiState.shared_filter_presets = next;
    } catch (_e) {
        uiState.shared_filter_presets = fallback;
    }
    return uiState.shared_filter_presets;
}

function persistSharedFilterPresetsState() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    var state = ensureSharedFilterPresetsState();
    try {
        window.localStorage.setItem(SHARED_FILTER_PRESETS_STORAGE_KEY, JSON.stringify(state));
    } catch (_e) {
        // ignore storage failures
    }
}

function cloneSharedFilterSnapshot(snapshot) {
    try {
        return JSON.parse(JSON.stringify(snapshot || {}));
    } catch (_e) {
        return snapshot || {};
    }
}

function getSharedFilterSnapshot(activeRole, analysisType) {
    var snapshot = {
        globalFilters: {},
        totals_dashboard_mode: uiState.totals_dashboard_mode || 'overview',
        totals_top_limit: normalizeTotalsTopLimit(uiState.totals_top_limit || 15),
        totals_employer_currency: normalizeEmployerOverviewCurrency(uiState.totals_employer_currency || 'RUR'),
        totals_employer_salary_metric: normalizeEmployerOverviewMetric(uiState.totals_employer_salary_metric || 'avg'),
        market_trends_currency: normalizeTotalsCurrency(uiState.market_trends_currency || 'RUR'),
        market_trends_salary_metric: String(uiState.market_trends_salary_metric || 'avg').toLowerCase(),
        market_trends_excluded_roles: Array.isArray(uiState.market_trends_excluded_roles) ? uiState.market_trends_excluded_roles.slice() : [],
        my_responses_currency: String(uiState.my_responses_currency || 'all'),
        my_responses_offer_filter: String(uiState.my_responses_offer_filter || 'all'),
        skills_search_global: cloneSharedFilterSnapshot(uiState.skills_search_global || null),
        skills_search_filter_query: String(uiState.skills_search_filter_query || ''),
        skills_search_skill_pick_mode: String(uiState.skills_search_skill_pick_mode || 'include')
    };
    SHARED_FILTER_STATE_KEYS.forEach(function(filterKey) {
        var bucket = ensureGlobalFilterBucket(filterKey);
        snapshot.globalFilters[filterKey] = {
            include: (bucket.include || []).slice(),
            exclude: (bucket.exclude || []).slice()
        };
    });
    if (activeRole && String(analysisType || '') === 'skills-search') {
        snapshot.skills_search_global = getSkillsSearchStateSnapshot(activeRole.querySelector('.skills-search-content'));
    }
    return snapshot;
}

function syncActiveSharedFilterPresetSelection(activeRole, analysisType) {
    var key = getSharedFilterPresetAnalysisKey(analysisType);
    var state = ensureSharedFilterPresetsState();
    var bucket = state[key] || { activeId: '', items: [] };
    var activeId = String(bucket.activeId || '');
    if (!activeId) return false;
    var activeItem = (bucket.items || []).find(function(item) {
        return item && item.id === activeId;
    }) || null;
    if (!activeItem) {
        bucket.activeId = '';
        state[key] = bucket;
        persistSharedFilterPresetsState();
        return true;
    }
    var currentRaw = '';
    var presetRaw = '';
    try {
        currentRaw = JSON.stringify(getSharedFilterSnapshot(activeRole, analysisType) || {});
        presetRaw = JSON.stringify(activeItem.state || {});
    } catch (_e) {
        currentRaw = '';
        presetRaw = '';
    }
    if (currentRaw === presetRaw) return false;
    bucket.activeId = '';
    state[key] = bucket;
    persistSharedFilterPresetsState();
    return true;
}

function applySharedFilterSnapshot(snapshot, activeRole, analysisType) {
    if (!snapshot || typeof snapshot !== 'object') return false;
    if (snapshot.globalFilters && typeof snapshot.globalFilters === 'object') {
        Object.keys(snapshot.globalFilters).forEach(function(filterKey) {
            var bucket = ensureGlobalFilterBucket(filterKey);
            var item = snapshot.globalFilters[filterKey] || {};
            bucket.include = Array.isArray(item.include) ? item.include.slice() : [];
            bucket.exclude = Array.isArray(item.exclude) ? item.exclude.slice() : [];
        });
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'totals_dashboard_mode')) {
        uiState.totals_dashboard_mode = String(snapshot.totals_dashboard_mode || 'overview').trim() || 'overview';
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'totals_top_limit')) {
        uiState.totals_top_limit = normalizeTotalsTopLimit(snapshot.totals_top_limit || 15);
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'totals_employer_currency')) {
        uiState.totals_employer_currency = normalizeEmployerOverviewCurrency(snapshot.totals_employer_currency || 'RUR');
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'totals_employer_salary_metric')) {
        uiState.totals_employer_salary_metric = normalizeEmployerOverviewMetric(snapshot.totals_employer_salary_metric || 'avg');
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'market_trends_currency')) {
        uiState.market_trends_currency = normalizeTotalsCurrency(snapshot.market_trends_currency || 'RUR');
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'market_trends_salary_metric')) {
        var metric = String(snapshot.market_trends_salary_metric || 'avg').toLowerCase();
        uiState.market_trends_salary_metric = ['min', 'max', 'avg', 'median', 'mode'].indexOf(metric) >= 0 ? metric : 'avg';
    }
    if (Array.isArray(snapshot.market_trends_excluded_roles)) {
        uiState.market_trends_excluded_roles = snapshot.market_trends_excluded_roles.slice();
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'my_responses_currency')) {
        uiState.my_responses_currency = String(snapshot.my_responses_currency || 'all');
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'my_responses_offer_filter')) {
        uiState.my_responses_offer_filter = String(snapshot.my_responses_offer_filter || 'all');
    }
    if (snapshot.skills_search_global && typeof snapshot.skills_search_global === 'object') {
        uiState.skills_search_global = cloneSharedFilterSnapshot(snapshot.skills_search_global);
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'skills_search_filter_query')) {
        uiState.skills_search_filter_query = String(snapshot.skills_search_filter_query || '');
    }
    if (Object.prototype.hasOwnProperty.call(snapshot, 'skills_search_skill_pick_mode')) {
        uiState.skills_search_skill_pick_mode = String(snapshot.skills_search_skill_pick_mode || 'include') === 'exclude' ? 'exclude' : 'include';
    }
    if (activeRole && String(analysisType || activeRole.dataset.activeAnalysis || '') === 'skills-search') {
        var block = activeRole.querySelector('.skills-search-content');
        if (block && uiState.skills_search_global) {
            applySkillsSearchState(block, uiState.skills_search_global);
        }
    }
    return true;
}

function saveSharedFilterPreset(activeRole, analysisType, name) {
    var trimmed = String(name || '').trim();
    if (!trimmed) return false;
    var key = getSharedFilterPresetAnalysisKey(analysisType);
    var state = ensureSharedFilterPresetsState();
    var bucket = state[key] || { activeId: '', items: [] };
    var snapshot = getSharedFilterSnapshot(activeRole, analysisType);
    var existing = (bucket.items || []).find(function(item) {
        return String(item.name || '').toLowerCase() === trimmed.toLowerCase();
    });
    if (existing) {
        existing.state = snapshot;
    } else {
        var nextId = 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        bucket.items = bucket.items || [];
        bucket.items.push({ id: nextId, name: trimmed, state: snapshot });
    }
    state[key] = bucket;
    persistSharedFilterPresetsState();
    return true;
}

function removeSharedFilterPreset(analysisType, presetId) {
    var key = getSharedFilterPresetAnalysisKey(analysisType);
    var state = ensureSharedFilterPresetsState();
    var bucket = state[key] || { activeId: '', items: [] };
    var selectedId = String(presetId || '').trim();
    if (!selectedId) return false;
    var before = (bucket.items || []).length;
    bucket.items = (bucket.items || []).filter(function(item) { return item.id !== selectedId; });
    if (bucket.activeId === selectedId) bucket.activeId = bucket.items.length ? bucket.items[0].id : '';
    state[key] = bucket;
    if (bucket.items.length === before) return false;
    persistSharedFilterPresetsState();
    return true;
}

function applySharedFilterPreset(activeRole, analysisType, presetId) {
    var key = getSharedFilterPresetAnalysisKey(analysisType);
    var state = ensureSharedFilterPresetsState();
    var bucket = state[key] || { activeId: '', items: [] };
    var item = (bucket.items || []).find(function(entry) { return entry.id === presetId; });
    if (!item) return false;
    applySharedFilterSnapshot(item.state || {}, activeRole, analysisType);
    bucket.activeId = item.id;
    state[key] = bucket;
    persistSharedFilterPresetsState();
    return true;
}

function getSharedFilterPresetState(analysisType) {
    var key = getSharedFilterPresetAnalysisKey(analysisType);
    var state = ensureSharedFilterPresetsState();
    if (!state[key]) state[key] = { activeId: '', items: [] };
    return state[key];
}

function ensureDefaultPeriodFilterSelection(activeRole, analysisType) {
    if (hasExplicitGlobalFilterSelection('periods')) return false;
    var options = getGlobalFilterOptions(activeRole, 'periods', analysisType);
    if (!Array.isArray(options) || !options.length) return false;
    var defaultOption = options.find(function(option) {
        return normalizeGlobalPeriodValue(option && option.value) === 'last_14';
    });
    if (!defaultOption) {
        defaultOption = options.find(function(option) {
            return normalizeGlobalPeriodValue(option && option.value) === 'summary';
        });
    }
    if (!defaultOption) {
        defaultOption = options.find(function(option) {
            return /^\d{4}-\d{2}$/.test(String(option && option.value || '').trim());
        });
    }
    if (!defaultOption) return false;
    var bucket = ensureGlobalFilterBucket('periods');
    bucket.include = [defaultOption.value];
    bucket.exclude = [];
    return true;
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
        var activeId = String(parsed.activeId || '');
        if (items.length && !items.some(function(item) { return item.id === activeId; })) {
            activeId = items[0].id;
        }
        uiState.skills_search_favorites = {
            activeId: activeId,
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
    var filterKeys = ['periods', 'experiences', 'status', 'currency', 'country', 'employer', 'interview', 'result', 'offer', 'accreditation', 'cover_letter_required', 'has_test'];
    var globalFilters = {};
    filterKeys.forEach(function(filterKey) {
        var bucket = ensureGlobalFilterBucket(filterKey);
        globalFilters[filterKey] = {
            include: (bucket.include || []).slice(),
            exclude: (bucket.exclude || []).slice()
        };
    });
    return {
        globalFilters: globalFilters,
        sort: 'count',
        logic: getSkillsSearchSelections(block).logic,
        includeSkills: getSkillsSearchSelections(block).includeSkills.slice(),
        excludeSkills: getSkillsSearchSelections(block).excludeSkills.slice(),
        status: 'all',
        country: 'all',
        currency: 'all',
        employerFlags: {}
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
    if (state.activeId === selectedId) state.activeId = state.items.length ? state.items[0].id : '';
    if (state.items.length === before) return false;
    persistSkillsSearchFavoritesState();
    renderSkillsSearchFavoritesDropdown(block);
    return true;
}
function syncSkillsSearchFavoriteSelection(block, snapshot) {
    var state = ensureSkillsSearchFavoritesState();
    var activeId = String(state.activeId || '');
    if (!activeId) return false;
    var activeFavorite = (state.items || []).find(function(item) { return item.id === activeId; });
    if (!activeFavorite) {
        state.activeId = '';
        persistSkillsSearchFavoritesState();
        if (block) renderSkillsSearchFavoritesDropdown(block);
        return true;
    }
    var currentRaw = '';
    var favoriteRaw = '';
    try {
        currentRaw = JSON.stringify(snapshot || {});
        favoriteRaw = JSON.stringify(activeFavorite.state || {});
    } catch (_e) {
        currentRaw = '';
        favoriteRaw = '';
    }
    if (currentRaw === favoriteRaw) return false;
    state.activeId = '';
    persistSkillsSearchFavoritesState();
    if (block) renderSkillsSearchFavoritesDropdown(block);
    return true;
}
function saveSkillsSearchState(block) {
    var snapshot = getSkillsSearchStateSnapshot(block);
    uiState.skills_search_global = snapshot;
    syncSkillsSearchFavoriteSelection(block, snapshot);
}
function applySkillsSearchState(block, state) {
    if (!state) return;
    var nextState = state && typeof state === 'object' ? state : {};
    var current = ensureSkillsSearchGlobalState(block);
    current.sort = 'count';
    current.logic = nextState.logic === 'and' ? 'and' : 'or';
    current.includeSkills = normalizeSkillsSearchSkillList(nextState.includeSkills || []);
    current.excludeSkills = normalizeSkillsSearchSkillList(nextState.excludeSkills || []);
    if (nextState.globalFilters && typeof nextState.globalFilters === 'object') {
        Object.keys(nextState.globalFilters).forEach(function(filterKey) {
            var snapshot = nextState.globalFilters[filterKey] || {};
            var bucket = ensureGlobalFilterBucket(filterKey);
            bucket.include = Array.isArray(snapshot.include) ? snapshot.include.slice() : [];
            bucket.exclude = Array.isArray(snapshot.exclude) ? snapshot.exclude.slice() : [];
        });
    } else {
        ['periods', 'experiences', 'status', 'currency', 'country', 'employer', 'interview', 'result', 'offer', 'accreditation', 'cover_letter_required', 'has_test'].forEach(function(filterKey) {
            var snapshot = (nextState && Object.prototype.hasOwnProperty.call(nextState, filterKey)) ? nextState[filterKey] : null;
            if (!snapshot) return;
            var bucket = ensureGlobalFilterBucket(filterKey);
            bucket.include = Array.isArray(snapshot.include) ? snapshot.include.slice() : [];
            bucket.exclude = Array.isArray(snapshot.exclude) ? snapshot.exclude.slice() : [];
        });
    }
    applySkillsSearchSkillState(block, current.includeSkills || [], current.excludeSkills || [], current.logic || 'or');
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

function ensureActivityMonthTabs(parentRole) {
    if (!parentRole || parentRole.id === 'role-all') return null;
    var monthBlocks = Array.from(parentRole.querySelectorAll('.month-content.activity-only'));
    if (!monthBlocks.length) return null;

    var monthTabs = parentRole.querySelector('.tabs.month-tabs.activity-only');
    if (!monthTabs) {
        monthTabs = document.createElement('div');
        monthTabs.className = 'tabs month-tabs activity-only';
        var insertBeforeNode = monthBlocks[0];
        if (insertBeforeNode && insertBeforeNode.parentElement === parentRole) {
            parentRole.insertBefore(monthTabs, insertBeforeNode);
        } else {
            parentRole.appendChild(monthTabs);
        }
    }

    var existingButtons = Array.from(monthTabs.querySelectorAll('.month-button'));
    var knownTargets = {};
    existingButtons.forEach(function(btn) {
        var targetId = String(btn && btn.dataset ? btn.dataset.targetId : '').trim();
        if (targetId) knownTargets[targetId] = true;
    });

    monthBlocks.forEach(function(block) {
        if (!block || !block.id || knownTargets[block.id]) return;
        var label = String(block.dataset.month || '').trim();
        if (!label) label = 'Период';
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'tab-button month-button';
        button.dataset.targetId = block.id;
        button.textContent = label;
        button.addEventListener('click', function(e) {
            openMonthTab(e, block.id);
        });
        monthTabs.appendChild(button);
        knownTargets[block.id] = true;
    });

    return monthTabs;
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
    var monthTabs = ensureActivityMonthTabs(parentRole) || parentRole.querySelector('.tabs.month-tabs.activity-only');
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

    var vacancies = getSkillsSourceVacancies(parentRole);
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
    var employerFilters = getEmployerAnalysisFilters(parentRole);
    var baseVacancies = getFilteredVacanciesForAnalysis(parentRole, 'employer-analysis', {
        skipPeriods: true
    });
    var periodLabel = block.dataset.employerAllLabel || '';
    var rows = [];
    var explicitLabel = '';
    if (month === 'all') {
        rows = buildEmployerAnalysisRowsFromVacancies(baseVacancies, 'all', employerFilters);
        explicitLabel = periodLabel;
    } else if (block.__employerRowsByPeriod && block.__employerRowsByPeriod[month]) {
        var periodKey = String(month || '').trim();
        var daysMatch = periodKey.match(/^last_(\d+)$/);
        if (periodKey === 'today') rows = buildEmployerAnalysisRowsFromVacancies(filterVacanciesByLatestDay(baseVacancies), month, employerFilters);
        else rows = buildEmployerAnalysisRowsFromVacancies(filterVacanciesByRecentDays(baseVacancies, daysMatch ? Number(daysMatch[1]) : 0), month, employerFilters);
        explicitLabel = (block.__employerLabelsByPeriod && block.__employerLabelsByPeriod[month]) || '';
    } else {
        rows = buildEmployerAnalysisRowsFromVacancies(filterVacanciesBySelectedPeriods(baseVacancies, [month]), month, employerFilters);
        explicitLabel = month;
    }
    block.dataset.chartContext = buildChartContextLabel(
        normalizeUnifiedPeriodLabel(explicitLabel || month),
        null
    );
    renderEmployerAnalysisTable(block, rows, explicitLabel || null);
    var chips = block.querySelectorAll('.employer-period-chip');
    chips.forEach(function(chip) {
        var isActive = (chip.dataset.month || '') === month;
        chip.classList.toggle('active', isActive);
    });
    block.dataset.employerActiveMonth = month;
    applyEmployerAnalysisViewMode(block, block.dataset.employerViewMode || uiState.employer_analysis_view_mode || 'together');
    syncSharedFilterPanel(block.closest('.role-content'), 'employer-analysis');
}

function applyEmployerAnalysisViewMode(block, mode) {
    if (!block) return 'together';
    mode = normalizeResponsiveViewMode(mode || uiState.employer_analysis_view_mode || 'together');
    uiState.employer_analysis_view_mode = mode;
    if (typeof persistViewModes === 'function') persistViewModes();
    block.dataset.employerViewMode = mode;
    var table = block.querySelector('.employer-analysis-table-container') || block.querySelector('.table-container');
    var graph = block.querySelector('.employer-analysis-graph');
    var layoutRoot = block.querySelector('.employer-analysis-main') || block.querySelector('.employer-analysis-view');
    var btns = block.querySelectorAll('.employer-view-btn');
    btns.forEach(function(btn) {
        btn.classList.toggle('active', (btn.dataset.view || '') === mode);
    });
    if (!table || !graph || !layoutRoot) return mode;
    applyCompositeViewMode(layoutRoot, table, graph, mode, {
        layoutWidth: UNIFIED_ANALYSIS_LAYOUT_WIDTH,
        tableOnlyWidth: UNIFIED_ANALYSIS_SINGLE_WIDTH,
        splitTableWidth: UNIFIED_ANALYSIS_TABLE_WIDTH,
        splitGraphWidth: UNIFIED_ANALYSIS_GRAPH_WIDTH,
        splitMinWidth: UNIFIED_ANALYSIS_SPLIT_MIN_WIDTH
    });
    if (mode !== 'table') renderEmployerAnalysisChart(block);
    return mode;
}

function renderEmployerAnalysisChart(block) {
    if (!block) return;
    var graph = block.querySelector('.employer-analysis-graph');
    if (!graph) return;
    var chartContext = block.dataset.chartContext || '';
    var mode = block.dataset.employerViewMode || uiState.employer_analysis_view_mode || 'together';
    if (mode === 'table') return;

    var rows = Array.from(block.querySelectorAll('.table-container tbody tr')).filter(function(row) {
        return row.style.display !== 'none';
    });
    if (!rows.length) {
        graph.__chartHostEl = null;
        graph.dataset.plotSignature = '';
        graph.dataset.plotReady = '';
        graph.innerHTML = '<div style="padding:12px;color:var(--text-secondary);text-align:center;">Нет данных для выбранного периода</div>';
        return;
    }
    var labels = [];
    var values = [];
    var colors = [];
    var factorKeys = [];
    var salaryMetric = '';
    var salaryCurrency = '';
    rows.forEach(function(row) {
        var value = Number(row.dataset.salaryValue);
        if (!isFinite(value)) return;
        var factorKey = normalizeEmployerFactor(String(row.dataset.factor || row.dataset.factorLabel || '').trim());
        var factorLabel = String(row.dataset.factorLabel || '').trim();
        var valueLabel = getEmployerChartValueLabel(String(row.dataset.valueKey || '').trim());
        labels.push(factorLabel + ': ' + valueLabel);
        values.push(value);
        factorKeys.push(factorKey);
        salaryMetric = salaryMetric || String(row.dataset.salaryMetric || '').trim();
        salaryCurrency = salaryCurrency || String(row.dataset.salaryCurrency || '').trim();
        colors.push(getEmployerAnalysisGradientFallbackColor(factorKey));
    });
    if (!values.length) {
        graph.__chartHostEl = null;
        graph.dataset.plotSignature = '';
        graph.dataset.plotReady = '';
        graph.innerHTML = '<div style="padding:12px;color:var(--text-secondary);text-align:center;">Нет данных по зарплате для выбранной валюты</div>';
        return;
    }
    var metricLabel = totalsMetricLabel(salaryMetric || 'avg');
    var currencyLabel = (salaryCurrency || 'RUR') === 'OTHER' ? 'Другая валюта' : (salaryCurrency || 'RUR');
    var signature = [chartContext, salaryMetric, salaryCurrency, labels.join('|'), values.join('|')].join('|');
    if (!graph.__chartHostEl) {
        graph.innerHTML = '<div class="employer-analysis-chart-host"></div>';
        graph.__chartHostEl = graph.querySelector('.employer-analysis-chart-host');
    }
    if (graph.dataset.plotSignature === signature && graph.dataset.plotReady === '1') return;
    graph.style.width = '100%';
    graph.style.maxWidth = '100%';
    graph.style.minWidth = '0';
    graph.style.margin = '0 auto';
    graph.style.height = 'auto';
    graph.style.display = 'block';
    graph.style.overflow = 'visible';
    graph.__chartHostEl.innerHTML = buildEmployerAnalysisDonutChartHtml(labels, values, factorKeys, metricLabel, currencyLabel, chartContext, signature);
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

function getEmployerAnalysisGradientStops(factorKey) {
    if (factorKey === 'accreditation') return getDonutGradientStopsByKey('active');
    if (factorKey === 'cover_letter_required') return getDonutGradientStopsByKey('new');
    if (factorKey === 'has_test') return getDonutGradientStopsByKey('archived');
    if (factorKey === 'rating_bucket') return getDonutGradientStopsByKey('published-archived');
    return getDonutGradientStopsByKey('active');
}

function getEmployerAnalysisGradientFallbackColor(factorKey) {
    return getEmployerAnalysisGradientStops(factorKey)[1];
}

function getEmployerAnalysisDonutGradientMeta(factorKey) {
    if (factorKey === 'accreditation') {
        return { key: 'active', segmentClass: 'donut-segment donut-chart-segment donut-chart-segment-outer donut-chart-segment-active', trackClass: 'donut-chart-track donut-chart-track-outer' };
    }
    if (factorKey === 'cover_letter_required') {
        return { key: 'new', segmentClass: 'donut-segment donut-chart-segment donut-chart-segment-inner donut-chart-segment-new', trackClass: 'donut-chart-track donut-chart-track-inner' };
    }
    if (factorKey === 'has_test') {
        return { key: 'archived', segmentClass: 'donut-segment donut-chart-segment donut-chart-segment-outer donut-chart-segment-archived', trackClass: 'donut-chart-track donut-chart-track-outer' };
    }
    if (factorKey === 'rating_bucket') {
        return { key: 'published-archived', segmentClass: 'donut-segment donut-chart-segment donut-chart-segment-inner donut-chart-segment-published-archived', trackClass: 'donut-chart-track donut-chart-track-inner' };
    }
    return { key: 'active', segmentClass: 'donut-segment donut-chart-segment donut-chart-segment-outer donut-chart-segment-active', trackClass: 'donut-chart-track donut-chart-track-outer' };
}

function buildEmployerAnalysisDonutChartHtml(labels, values, factorKeys, metricLabel, currencyLabel, chartContext, signature) {
    var chartTitle = composeChartTitle('Анализ работодателей · ' + metricLabel + ' зарплата (' + currencyLabel + ')', chartContext);
    var maxValue = values.reduce(function(max, value) {
        return value > max ? value : max;
    }, 0) || 1;
    var chartWidth = 960;
    var leftPad = 290;
    var rightPad = 84;
    var topPad = 18;
    var rowGap = 52;
    var bottomPad = 48;
    var trackStart = leftPad;
    var trackEnd = chartWidth - rightPad;
    var trackWidth = trackEnd - trackStart;
    var chartHeight = topPad + labels.length * rowGap + bottomPad;
    var baseId = String(signature || 'employer-analysis')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(-48) || 'employer-analysis';
    var defsHtml = factorKeys.map(function(factorKey, index) {
        var meta = getEmployerAnalysisDonutGradientMeta(factorKey);
        var stops = getDonutGradientStopsByKey(meta.key);
        var gradientId = 'employer-analysis-gradient-' + baseId + '-' + factorKey + '-' + index;
        var stopsHtml = stops.map(function(color, stopIndex) {
            var offset = stopIndex === 0 ? '0%' : stopIndex === stops.length - 1 ? '100%' : '55%';
            return '<stop offset="' + offset + '" stop-color="' + color + '"></stop>';
        }).join('');
        return '<linearGradient id="' + gradientId + '" x1="0%" y1="0%" x2="100%" y2="100%">' + stopsHtml + '</linearGradient>';
    }).join('');
    var ticks = [0, 0.25, 0.5, 0.75, 1].map(function(part, index) {
        var x = trackStart + trackWidth * part;
        var value = maxValue * part;
        return '<g class="employer-analysis-donut-axis-tick">' +
            '<line x1="' + x + '" y1="' + (chartHeight - bottomPad + 4) + '" x2="' + x + '" y2="' + (chartHeight - bottomPad + 10) + '"></line>' +
            '<text x="' + x + '" y="' + (chartHeight - bottomPad + 28) + '" text-anchor="' + (index === 0 ? 'start' : index === 4 ? 'end' : 'middle') + '">' + escapeHtml(totalsFormatSalaryPointValue(value, currencyLabel === 'Другая валюта' ? '' : currencyLabel)) + '</text>' +
        '</g>';
    }).join('');
    var rowsHtml = labels.map(function(label, index) {
        var factorKey = factorKeys[index] || 'accreditation';
        var meta = getEmployerAnalysisDonutGradientMeta(factorKey);
        var gradientId = 'employer-analysis-gradient-' + baseId + '-' + factorKey + '-' + index;
        var y = topPad + index * rowGap + 22;
        var value = values[index] || 0;
        var ratio = maxValue > 0 ? value / maxValue : 0;
        var x2 = trackStart + trackWidth * ratio;
        var valueLabel = totalsFormatSalaryPointValue(value, currencyLabel === 'Другая валюта' ? '' : currencyLabel);
        return '<g class="employer-analysis-donut-row">' +
            '<text class="employer-analysis-donut-label" x="' + (leftPad - 18) + '" y="' + (y + 5) + '" text-anchor="end">' + escapeHtml(label) + '</text>' +
            '<line class="' + meta.trackClass + '" x1="' + trackStart + '" y1="' + y + '" x2="' + trackEnd + '" y2="' + y + '" stroke-linecap="round"></line>' +
            '<line class="' + meta.segmentClass + '" x1="' + trackStart + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="url(#' + gradientId + ')" stroke-linecap="round"></line>' +
            '<text class="employer-analysis-donut-value" x="' + (trackEnd + 14) + '" y="' + (y + 5) + '" text-anchor="start">' + escapeHtml(valueLabel) + '</text>' +
        '</g>';
    }).join('');
    return '<div class="employer-analysis-donut-chart">' +
        '<div class="employer-analysis-donut-chart-title">' + escapeHtml(chartTitle) + '</div>' +
        '<svg viewBox="0 0 ' + chartWidth + ' ' + chartHeight + '" preserveAspectRatio="xMidYMin meet">' +
            '<defs>' + defsHtml + '</defs>' +
            rowsHtml +
            '<line class="employer-analysis-donut-axis-line" x1="' + trackStart + '" y1="' + (chartHeight - bottomPad) + '" x2="' + trackEnd + '" y2="' + (chartHeight - bottomPad) + '"></line>' +
            ticks +
        '</svg>' +
    '</div>';
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

function buildEmployerAnalysisRowsFromVacancies(vacancies, periodKey, options) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var settings = options || {};
    var selectedCurrency = normalizeEmployerOverviewCurrency(settings.currency || 'RUR');
    var selectedMetric = normalizeEmployerOverviewMetric(settings.metric || 'avg');
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
                salaries: {
                    RUR: [],
                    USD: [],
                    EUR: [],
                    OTHER: []
                }
            };
        }
        return buckets[key];
    }

    function appendSalary(bucket, vacancy) {
        var currency = normalizeEmployerAnalysisVacancyCurrency(vacancy && (vacancy.salary_currency || vacancy.currency));
        if (!currency) return;
        var salary = computeSalaryValue(vacancy, currency === 'OTHER' ? 'Другая' : currency);
        if (salary !== null && isFinite(salary)) bucket.salaries[currency].push(Number(salary));
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
        var selectedValues = bucket.salaries[selectedCurrency] || [];
        return {
            month: bucket.month,
            factorKey: bucket.factorKey,
            factorLabel: bucket.factorLabel,
            valueKey: bucket.valueKey,
            valueLabel: bucket.valueLabel,
            groupN: bucket.groupN,
            salaryCurrency: selectedCurrency,
            salaryMetric: selectedMetric,
            salaryMetricLabel: totalsMetricLabel(selectedMetric),
            salaryValue: computeEmployerAnalysisMetricValue(selectedValues, selectedMetric),
            salaryCount: selectedValues.length
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
    var sortedRows = sortEmployerAnalysisData(rows.slice());
    var table = block.querySelector('.table-container table');
    var tbody = table ? table.querySelector('tbody') : null;
    var theadRow = table ? table.querySelector('thead tr') : null;
    if (!tbody || !theadRow) return;
    block.classList.toggle('employer-aggregated-mode', !!allPeriodLabel);
    var headerRow = sortedRows[0] || null;
    var metricLabel = headerRow ? String(headerRow.salaryMetricLabel || totalsMetricLabel(headerRow.salaryMetric || 'avg')) : 'Средняя';
    var currencyLabel = headerRow ? ((headerRow.salaryCurrency || 'RUR') === 'OTHER' ? 'Другая валюта' : (headerRow.salaryCurrency || 'RUR')) : 'RUR';
    theadRow.innerHTML =
        '<th>Месяц</th>' +
        '<th>Фактор</th>' +
        '<th>Значение фактора</th>' +
        '<th>Количество</th>' +
        '<th>Зарплата, ' + currencyLabel + ' · ' + metricLabel + '</th>';
    tbody.innerHTML = sortedRows.map(function(row) {
        var monthLabel = allPeriodLabel ? '' : row.month;
        var salaryValueAttr = (row.salaryValue !== null && row.salaryValue !== undefined && isFinite(row.salaryValue)) ? String(row.salaryValue) : '';
        return '<tr class="employer-analysis-row" ' +
            'data-month="' + row.month + '" ' +
            'data-factor="' + row.factorKey + '" ' +
            'data-factor-label="' + row.factorLabel + '" ' +
            'data-value-key="' + row.valueKey + '" ' +
            'data-value-label="' + row.valueLabel + '" ' +
            'data-group-n="' + row.groupN + '" ' +
            'data-salary-currency="' + row.salaryCurrency + '" ' +
            'data-salary-metric="' + row.salaryMetric + '" ' +
            'data-salary-value="' + salaryValueAttr + '" ' +
            'data-salary-count="' + (row.salaryCount || 0) + '">' +
            '<td>' + monthLabel + '</td>' +
            '<td>' + row.factorLabel + '</td>' +
            '<td class="employer-factor-value-cell">' + getEmployerValueHtml(row.valueKey) + '</td>' +
            '<td>' + row.groupN + '</td>' +
            '<td' + (salaryValueAttr ? ' data-sort-num="' + salaryValueAttr + '"' : '') + '>' + formatEmployerNumber(row.salaryValue) + '</td>' +
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
    viewToggle.style.display = '';
    viewToggle.removeAttribute('hidden');
    if (viewToggle.querySelectorAll('.employer-view-btn').length !== 3) {
        viewToggle.innerHTML = buildViewModeButtonsHtml(['together', 'table', 'graph'], 'employer-view-btn', uiState.employer_analysis_view_mode || 'together');
    }

    var graph = block.querySelector('.employer-analysis-graph');
    if (!graph) {
        graph = document.createElement('div');
        graph.className = 'plotly-graph employer-analysis-graph';
        graph.style.display = 'none';
    }
    if (graph && graph.parentElement !== mainWrap) {
        mainWrap.appendChild(graph);
    }
    if (graph) graph.removeAttribute('hidden');

    if (viewToggle && !viewToggle.dataset.bound) viewToggle.dataset.bound = '1';

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
    if (viewToggle && viewToggle.parentElement !== topBar) topBar.appendChild(viewToggle);

    var months = Array.from(new Set(parsedRows.map(function(row) { return row.month; }).filter(Boolean))).sort();
    months.reverse();
    var allLabel = months.length && typeof formatMonthTitle === 'function'
        ? formatMonthTitle(months.length)
        : 'Весь период';
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
        block.__employerRowsByPeriod[item.key] = buildEmployerAnalysisRowsFromVacancies(quickVacancies, item.key, getEmployerAnalysisFilters(block.closest('.role-content')));
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

function getAllRolesSalaryRowsByCurrency(target) {
    if (!target) return {};
    if (target._data && target._data.currencyEntries) return target._data.currencyEntries;
    var parsed = parseJsonDataset(target, 'currencyEntries', {});
    target._data = target._data || {};
    target._data.currencyEntries = parsed || {};
    return target._data.currencyEntries;
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
    var subtitleText = '';
    var activeRole = target.closest('.role-content');
    if (activeRole) {
        var periodOptions = getGlobalFilterOptions(activeRole, 'periods', 'skills-monthly');
        var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
        var expOptions = getGlobalFilterOptions(activeRole, 'experiences', 'skills-monthly');
        var selectedExps = getResolvedGlobalFilterValues('experiences', expOptions);
        var periodLabel = resolveChartPeriodLabel(selectedPeriods);
        var normalizedPeriodLabel = String(periodLabel || '').trim();
        if (normalizedPeriodLabel === 'Все' || normalizedPeriodLabel === 'По выбранному периоду' || normalizedPeriodLabel === 'За все время' || normalizedPeriodLabel === 'Весь период') {
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
        subtitleText = String(formatPeriodSelectionValue(periodSource) || periodSource || 'За весь период').trim();
    } else if (subtitleText.indexOf('Период:') === 0) {
        subtitleText = subtitleText.replace(/^Период:\s*/i, '');
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
                '<div class="skills-all-chart-section">' +
                    '<div class="skills-all-html-title">Топ-100 навыков по упоминаниям</div>' +
                    '<div class="skills-all-html-subtitle">' + escapeHtml(subtitleText) + '</div>' +
                    top.map(function(item) {
                        var width = Math.max(4, Math.round(((item.mention_count || 0) / maxCount) * 100));
                        return '' +
                            '<div class="skills-all-html-row">' +
                                '<div class="skills-all-html-label">' + escapeHtml(item.skill || '—') + '</div>' +
                                '<div class="skills-all-html-track">' +
                                    '<div class="skills-all-html-fill" style="width:' + width + '%;background:' + escapeHtml(typeof CHART_COLORS !== 'undefined' ? CHART_COLORS.medium : '#007AD8') + ';"></div>' +
                                '</div>' +
                                '<div class="skills-all-html-value">' + (item.mention_count || 0) + '</div>' +
                            '</div>';
                    }).join('') +
                '</div>' +
                '<div class="skills-all-chart-section">' +
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
            '<div class="skills-all-chart-section">' +
                '<div class="skills-all-html-title">Топ-100 навыков по упоминаниям</div>' +
                '<div class="skills-all-html-subtitle">' + escapeHtml(subtitleText) + '</div>' +
                '<div class="skills-all-plotly-host" id="' + graphId + '-plotly-host"></div>' +
            '</div>' +
            '<div class="skills-all-chart-section">' +
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
            color: (typeof CHART_COLORS !== 'undefined' ? CHART_COLORS.medium : '#007AD8'),
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
    var secondaryTextColor = getDashboardChartSecondaryTextColor();
    var secondaryTextSize = getDashboardChartSecondaryTextSize();
    layout.yaxis = {
        automargin: true,
        autorange: 'reversed',
        tickfont: { size: secondaryTextSize, color: secondaryTextColor },
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
        tickfont: { size: secondaryTextSize, color: secondaryTextColor },
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
        if (plotHost.offsetParent !== null) resizePlotlyScope(plotHost);
        if (hasAvgSalaryChart && avgPlotHost.offsetParent !== null) resizePlotlyScope(avgPlotHost);
    }

function ensureStackedChartLayout(container, items) {
    if (!container) return;
    var visibleItems = (Array.isArray(items) ? items : []).filter(function(item) {
        return item && item.el;
    });
    visibleItems.forEach(function(item) {
        if (!item.el) return;
        item.el.style.display = '';
        if (item.el.classList) {
            item.el.classList.remove('active');
        }
        var resizeTargets = item.el.querySelectorAll('.plotly-graph, .employer-analysis-subgraph-host, .unified-chart-host, .js-plotly-plot');
        if (!resizeTargets.length) {
            resizePlotlyScope(item.el);
            return;
        }
        resizeTargets.forEach(function(node) {
            resizePlotlyScope(node);
        });
    });
}

function openAllRolesPeriodTab(evt, contentId, analysisType) {
    var wrapper = evt.currentTarget.closest('.all-roles-period-wrapper');
    if (!wrapper) return;
    var parentRole = wrapper.closest('.role-content');
    var contents = wrapper.querySelectorAll('.all-roles-period-content');
    contents.forEach(c => c.style.display = 'none');
    var buttons = wrapper.querySelectorAll('.month-button');
    buttons.forEach(b => b.classList.remove('active'));
    var target = document.getElementById(contentId);
    if (target) target.style.display = 'block';
    evt.currentTarget.classList.add('active');
    if (uiState.all_roles_periods) {
        uiState.all_roles_periods[analysisType] = evt.currentTarget.dataset.period || null;
    }

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
        applyAllRolesViewMode(target, analysisType);
    } else if (analysisType === 'salary' && target) {
        applyAllRolesViewMode(target, analysisType);
    }
}

function findSummaryPeriodButton(buttons) {
    return Array.from(buttons || []).find(function(btn) {
        return /^За\s+\d+\s+месяц/.test(String(btn && btn.textContent || '').trim());
    }) || null;
}

function findAllPeriodButton(buttons) {
    return Array.from(buttons || []).find(function(btn) {
        return String(btn && btn.dataset ? btn.dataset.period : '').trim() === 'all';
    }) || null;
}

function restoreAllRolesPeriodState(parentRole, analysisType) {
    var analysisId = analysisType === 'skills' ? 'skills-monthly-all' : (analysisType + '-all');
    var wrapper = parentRole.querySelector('.all-roles-period-wrapper[data-analysis="' + analysisId + '"]');
    if (!wrapper) return;
    var buttons = wrapper.querySelectorAll('.month-button');
    if (!buttons.length) {
        var period = uiState.all_roles_periods ? uiState.all_roles_periods[analysisType] : null;
        var contentNodes = wrapper.querySelectorAll('.all-roles-period-content');
        if (!contentNodes.length) return;
        var targetNode = Array.from(contentNodes).find(function(node) {
            return String(node.dataset.period || '').trim() === String(period || 'all').trim();
        }) || Array.from(contentNodes).find(function(node) {
            return String(node.dataset.period || '').trim() === 'all';
        }) || contentNodes[0];
        if (!targetNode) return;
        Array.from(contentNodes).forEach(function(node) {
            node.style.display = 'none';
        });
        targetNode.style.display = 'block';
        if (analysisType === 'salary' && typeof renderAllRolesSalaryPeriodContent === 'function') {
            renderAllRolesSalaryPeriodContent(targetNode, String(targetNode.dataset.period || period || 'all').trim() || 'all');
        }
        return;
    }
    var saved = uiState.all_roles_periods ? uiState.all_roles_periods[analysisType] : null;
    if (saved) {
        for (var btn of buttons) {
            if (btn.dataset.period === saved) {
                btn.click();
                return;
            }
        }
    }
    var allBtn = findAllPeriodButton(buttons);
    if (allBtn) {
        allBtn.click();
        return;
    }
    var monthBtn = Array.from(buttons).find(function(btn) {
        return /^\d{4}-\d{2}$/.test(String(btn.dataset.period || '').trim());
    });
    if (monthBtn) {
        monthBtn.click();
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
    var summaryBtn = findSummaryPeriodButton(monthButtons);
    (summaryBtn || monthButtons[0]).click();
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
    var summaryBtn = findSummaryPeriodButton(monthButtons);
    (summaryBtn || monthButtons[0]).click();
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
    var summaryBtn = findSummaryPeriodButton(monthButtons);
    (summaryBtn || monthButtons[0]).click();
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
    var isDisplayedPlot = function(node) {
        if (!node || !node.isConnected) return false;
        var cur = node;
        while (cur && cur.nodeType === 1) {
            if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
                var style = window.getComputedStyle(cur);
                if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
            }
            cur = cur.parentElement;
        }
        var rect = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
        if ((node.clientWidth || 0) <= 0 || (node.clientHeight || 0) <= 0) return false;
        if (!rect || rect.width <= 0 || rect.height <= 0) return false;
        return true;
    };
    var targets = [];
    if (root.classList && root.classList.contains('js-plotly-plot') && isDisplayedPlot(root)) targets.push(root);
    root.querySelectorAll('.js-plotly-plot').forEach(function(node) {
        if (targets.indexOf(node) === -1 && isDisplayedPlot(node)) targets.push(node);
    });
    if (!targets.length) return;
    var run = function() {
        targets.forEach(function(node) {
            if (!isDisplayedPlot(node)) return;
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
        layoutRoot.style.overflowX = 'hidden';
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

        var statusColors = [CHART_COLORS.selectedStart, CHART_COLORS.excludedEnd];
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
                marker: { color: statusColors[statusIdx] || statusColors[0] }
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
        ensureStackedChartLayout(salaryStack, currencies.map(function(currency) {
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




