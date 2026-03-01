function openRoleTab(evt, roleId) {
    var i, roleContent;
    roleContent = document.getElementsByClassName("role-content");
    for (i = 0; i < roleContent.length; i++) {
        roleContent[i].style.display = "none";
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
    parentRole.dataset.activeAnalysis = analysisType || '';
    syncSharedFilterPanel(parentRole, analysisType);
    updateViewToggleIcons(parentRole);
}

function switchFromSummaryToAnalysis(analysisType) {
    setSummaryModeActive(false);

    function findTargetButton(roleContent) {
        if (!roleContent) return null;
        return Array.from(roleContent.querySelectorAll('.analysis-button')).find(function(btn) {
            var id = btn.dataset.analysisId || '';
            return id.indexOf(analysisType + '-') === 0;
        }) || null;
    }

    var targetRole = getActiveRoleContent();
    var targetButton = findTargetButton(targetRole);
    if (!targetButton) {
        var ctx = uiState.roleSelectionContext;
        if (ctx && typeof ctx.getOrder === 'function' && typeof ctx.applySelection === 'function') {
            var order = ctx.getOrder();
            var selected = typeof ctx.getSelected === 'function' ? Array.from(ctx.getSelected()) : [];
            var first = order[0] || selected[0];
            if (first !== undefined && first !== null) {
                ctx.applySelection(new Set([first]), [first]);
                targetRole = getActiveRoleContent();
                targetButton = findTargetButton(targetRole);
            }
        }
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
        hint.textContent = 'ЛКМ — включить, ПКМ — исключить';
        hint.style.fontSize = '10px';
        hint.style.color = '#94a3b8';
        hint.style.marginBottom = '6px';

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
                if (target && target.closest && target.closest('#global-shared-filter-panel')) return;
                document.querySelectorAll('#global-shared-filter-panel .global-filter-menu').forEach(function(menu) {
                    menu.style.display = 'none';
                });
                document.querySelectorAll('#global-shared-filter-panel .summary-filter-trigger-arrow').forEach(function(arrow) {
                    arrow.textContent = '▾';
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

function createAllRolesPeriodControl(activeRole) {
    var buttons = getAllRolesPeriodButtons(activeRole);
    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown all-roles-period-dropdown';
    wrap.dataset.filterKey = 'periods';
    wrap.style.marginTop = '8px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = '240px';
    wrap.style.width = '240px';

    var caption = document.createElement('div');
    caption.textContent = 'Период';
    caption.style.fontSize = '12px';
    caption.style.fontWeight = '600';
    caption.style.marginBottom = '6px';
    caption.style.color = 'var(--text-secondary, #52606d)';
    wrap.appendChild(caption);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tab-button global-filter-trigger';
    trigger.style.width = '100%';
    trigger.style.textAlign = 'left';
    trigger.style.borderRadius = '999px';
    trigger.style.padding = '5px 10px';
    trigger.style.minHeight = '34px';
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
    arrow.textContent = '▾';
    arrow.style.fontSize = '12px';
    arrow.style.opacity = '0.8';
    trigger.appendChild(arrow);
    wrap.appendChild(trigger);

    var menu = document.createElement('div');
    menu.className = 'global-filter-menu all-roles-period-menu';
    menu.style.display = 'none';
    menu.style.marginTop = '8px';
    menu.style.padding = '0';
    menu.style.border = '1px solid var(--border-color, #d9e2ec)';
    menu.style.borderRadius = '10px';
    menu.style.background = 'var(--card-background, #fff)';
    menu.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.08)';
    menu.style.width = '240px';
    menu.style.maxWidth = 'calc(100vw - 48px)';

    buttons.forEach(function(sourceBtn, idx) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'tab-button summary-filter-item';
        item.textContent = (sourceBtn.textContent || '').trim();
        item.style.display = 'block';
        item.style.width = '100%';
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
            arrow.textContent = '▾';
            syncSharedFilterPanel(getActiveRoleContent(activeRole), activeRole.dataset.activeAnalysis || '');
        });
        menu.appendChild(item);
    });

    trigger.addEventListener('click', function() {
        document.querySelectorAll('#global-shared-filter-panel .global-filter-menu').forEach(function(other) {
            if (other !== menu) other.style.display = 'none';
        });
        document.querySelectorAll('#global-shared-filter-panel .summary-filter-trigger-arrow').forEach(function(otherArrow) {
            if (otherArrow !== arrow) otherArrow.textContent = '▾';
        });
        var nextState = menu.style.display === 'none' ? 'block' : 'none';
        menu.style.display = nextState;
        if (nextState === 'block') positionGlobalFilterMenu(trigger, menu);
        arrow.textContent = nextState === 'block' ? '▴' : '▾';
    });

    wrap.appendChild(menu);
    return wrap;
}

function createSummaryAnalysisControl(activeRole) {
    var buttons = getSummaryAnalysisButtons(activeRole);
    if (!buttons.length) return null;

    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown summary-filter-dropdown';
    wrap.style.marginTop = '8px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = '240px';
    wrap.style.width = '240px';

    var caption = document.createElement('div');
    caption.textContent = 'Раздел';
    caption.style.fontSize = '12px';
    caption.style.fontWeight = '600';
    caption.style.marginBottom = '6px';
    caption.style.color = 'var(--text-secondary, #52606d)';
    wrap.appendChild(caption);

    var activeBtn = buttons.find(function(btn) { return btn.classList.contains('active'); }) || buttons[0];

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tab-button global-filter-trigger summary-filter-trigger';
    trigger.style.width = '100%';
    trigger.style.textAlign = 'left';
    trigger.style.borderRadius = '999px';
    trigger.style.padding = '5px 10px';
    trigger.style.minHeight = '34px';
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
    triggerArrow.textContent = '▾';
    triggerArrow.style.fontSize = '12px';
    triggerArrow.style.opacity = '0.8';
    trigger.appendChild(triggerArrow);

    wrap.appendChild(trigger);

    var menu = document.createElement('div');
    menu.className = 'global-filter-menu summary-filter-menu';
    menu.style.display = 'none';
    menu.style.marginTop = '8px';
    menu.style.padding = '0';
    menu.style.border = '1px solid var(--border-color, #d9e2ec)';
    menu.style.borderRadius = '10px';
    menu.style.background = 'var(--card-background, #fff)';
    menu.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.08)';
    menu.style.width = '240px';
    menu.style.maxWidth = 'calc(100vw - 48px)';

    buttons.forEach(function(sourceBtn, idx) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'tab-button summary-filter-item';
        item.textContent = (sourceBtn.textContent || '').trim();
        item.style.display = 'block';
        item.style.width = '100%';
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
            triggerArrow.textContent = '▾';
            syncSharedFilterPanel(getActiveRoleContent(activeRole), activeRole.dataset.activeAnalysis || '');
        });
        menu.appendChild(item);
    });

    trigger.addEventListener('click', function() {
        document.querySelectorAll('#global-shared-filter-panel .global-filter-menu').forEach(function(other) {
            if (other !== menu) other.style.display = 'none';
        });
        document.querySelectorAll('#global-shared-filter-panel .summary-filter-trigger-arrow').forEach(function(arrow) {
            if (arrow !== triggerArrow) arrow.textContent = '▾';
        });
        var nextState = menu.style.display === 'none' ? 'block' : 'none';
        menu.style.display = nextState;
        if (nextState === 'block') positionGlobalFilterMenu(trigger, menu);
        triggerArrow.textContent = nextState === 'block' ? '▴' : '▾';
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
    var quick = text.match(/^За\s+(\d+)\s+д/i) || text.match(/^last_(\d+)$/i) || text.match(/^(\d+)d$/i);
    if (quick) return 'last_' + String(Number(quick[1]) || 0);
    return text;
}

function formatPeriodSelectionValue(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    var quick = text.match(/^last_(\d+)$/i) || text.match(/^(\d+)d$/i);
    if (quick) return 'За ' + String(Number(quick[1]) || 0) + ' дня';
    return text;
}

function summarizeSelectedPeriodsLabel(selectedPeriods) {
    var labels = Array.isArray(selectedPeriods) ? selectedPeriods.filter(Boolean).map(function(v) { return formatPeriodSelectionValue(v); }).filter(Boolean) : [];
    if (!labels.length) return 'За все время';
    var specificLabels = labels.filter(function(label) {
        return !(isSummaryMonth(label) || label === 'За период');
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
        if (!excludeCount) return includeCount + ' выбрано';
        return includeCount + ' выбрано / ' + excludeCount + ' исключено';
    }
    var optionMap = {};
    (options || []).forEach(function(item) { optionMap[item.value] = item.label; });
    if (filterKey !== 'roles') {
        var includeLabels = bucket.include.map(function(value) { return optionMap[value] || value; }).filter(Boolean);
        var excludeLabels = bucket.exclude.map(function(value) { return optionMap[value] || value; }).filter(Boolean);
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
    document.querySelectorAll('#global-shared-filter-panel .global-filter-menu').forEach(function(other) {
        if (other !== exceptMenu) other.style.display = 'none';
    });
    document.querySelectorAll('#global-shared-filter-panel .global-filter-trigger-arrow').forEach(function(arrow) {
        if (arrow !== exceptArrow) arrow.textContent = '▾';
    });
}

function positionGlobalFilterMenu(trigger, menu) {
    if (!trigger || !menu) return;
    var rect = trigger.getBoundingClientRect();
    var width = Math.max(220, Math.round(rect.width));
    var maxHeight = Math.max(240, Math.min(window.innerHeight - Math.round(rect.bottom) - 12, Math.round(window.innerHeight * 0.72)));
    var left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
    menu.style.setProperty('position', 'fixed', 'important');
    menu.style.setProperty('top', Math.round(rect.bottom + 6) + 'px', 'important');
    menu.style.setProperty('left', Math.round(left) + 'px', 'important');
    menu.style.setProperty('right', 'auto', 'important');
    menu.style.setProperty('bottom', 'auto', 'important');
    menu.style.setProperty('box-sizing', 'border-box', 'important');
    menu.style.setProperty('width', Math.round(width) + 'px', 'important');
    menu.style.setProperty('max-height', maxHeight + 'px', 'important');
    menu.style.setProperty('overflow-y', 'auto', 'important');
    menu.style.setProperty('margin', '0', 'important');
    menu.style.setProperty('transform', 'none', 'important');
    menu.style.setProperty('inset', 'auto auto auto auto', 'important');
    menu.style.setProperty('z-index', '5000', 'important');
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
    var el = document.getElementById(graphId);
    if (!el) return;
    var titleText = composeChartTitle(baseTitle, contextText);
    var layoutUpdate = {
        'title.text': titleText,
        'title.x': 0.5,
        'title.xanchor': 'center'
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
    if (!panel || !activeRole) return;

    var current = analysisType || activeRole.dataset.activeAnalysis || '';
    var isAllRolesView = activeRole.id === 'role-all';

    panel.querySelectorAll('.global-filter-dropdown[data-filter-key]').forEach(function(wrap) {
        var key = wrap.dataset.filterKey || '';
        var labelNode = wrap.querySelector('.global-filter-trigger-label');
        if (!labelNode) return;

        if (key === 'periods' && isAllRolesView) {
            var periodButtons = getAllRolesPeriodButtons(activeRole);
            var activeBtn = periodButtons.find(function(btn) { return btn.classList.contains('active'); }) || periodButtons[0];
            labelNode.textContent = ((activeBtn && activeBtn.textContent) || '').trim() || 'Недоступно';
            return;
        }

        var disabled = false;
        var options = getGlobalFilterOptions(activeRole, key, current);
        labelNode.textContent = summarizeGlobalFilterSelection(key, options, disabled);
    });

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

function applyGlobalRoleFilter() {
    var ctx = uiState.roleSelectionContext;
    if (!ctx) return;
    if (isSummaryModeActive()) setSummaryModeActive(false);
    var allOptions = getGlobalFilterOptions(null, 'roles', null);
    var allIds = allOptions.map(function(item) { return item.value; });
    var bucket = ensureGlobalFilterBucket('roles');
    var include = bucket.include.filter(function(v) { return allIds.indexOf(v) >= 0; });
    var exclude = bucket.exclude.filter(function(v) { return allIds.indexOf(v) >= 0; });
    var next;
    if (include.length) next = include.filter(function(v) { return exclude.indexOf(v) < 0; });
    else if (exclude.length) next = allIds.filter(function(v) { return exclude.indexOf(v) < 0; });
    else next = [];
    ctx.applySelection(new Set(next), next);
}

function updateGlobalFilterSelection(filterKey, value, action) {
    var bucket = ensureGlobalFilterBucket(filterKey);
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
        bucket.include = [];
        bucket.exclude = [];
    } else if (action === 'clear_excluded') {
        bucket.exclude = [];
    }
    if (filterKey === 'roles') {
        if (action === 'clear') {
            var ctx = uiState.roleSelectionContext;
            if (ctx && typeof ctx.applySelection === 'function') {
                if (isSummaryModeActive()) setSummaryModeActive(false);
                ctx.applySelection(new Set(), []);
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
        (bucket.exclude || []).forEach(function(value) {
            if (!labels[value]) return;
            host.appendChild(createActiveRoleFilterChip(def.key, value, labels[value], 'exclude'));
        });
    });
}

function createActiveRoleFilterChip(filterKey, value, labelText, state) {
    var chip = document.createElement('div');
    var isExcluded = state === 'exclude';
    chip.className = 'active-role-filter-chip';
    chip.title = 'ЛКМ: включить, ПКМ: исключить, ×: удалить';
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

    var label = document.createElement('span');
    label.textContent = labelText;
    label.style.fontSize = '12px';
    chip.appendChild(label);

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
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
    chip.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (e.target === removeBtn) return;
        updateGlobalFilterSelection(filterKey, value, 'exclude');
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
    triggerArrow.textContent = '▾';
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
    allBtn.textContent = '✓';
    bindGlobalFilterTooltip(allBtn, 'Выбрать все');
    applyGlobalFilterIconButtonStyle(allBtn, false);
    allBtn.addEventListener('click', function() {
        if (isSummaryModeActive()) setSummaryModeActive(false);
        updateGlobalFilterSelection('roles', '', 'all');
    });
    controls.appendChild(allBtn);

    var multiBtn = document.createElement('button');
    multiBtn.type = 'button';
    multiBtn.className = 'tab-button skills-search-dropdown-item';
    multiBtn.textContent = '⧉';
    bindGlobalFilterTooltip(multiBtn, 'Мультивыбор');
    applyGlobalFilterIconButtonStyle(multiBtn, isGlobalFilterMultiEnabled('roles'));
    multiBtn.addEventListener('click', function() {
        if (isSummaryModeActive()) setSummaryModeActive(false);
        var next = !isGlobalFilterMultiEnabled('roles');
        setGlobalFilterMultiEnabled('roles', next);
        applyGlobalFilterIconButtonStyle(multiBtn, next);
        applyGlobalRoleFilter();
    });
    controls.appendChild(multiBtn);

    var clearExcludedBtn = document.createElement('button');
    clearExcludedBtn.type = 'button';
    clearExcludedBtn.className = 'tab-button skills-search-dropdown-item';
    clearExcludedBtn.textContent = '⊘';
    bindGlobalFilterTooltip(clearExcludedBtn, 'Очистить исключения');
    applyGlobalFilterIconButtonStyle(clearExcludedBtn, false);
    clearExcludedBtn.addEventListener('click', function() {
        if (isSummaryModeActive()) setSummaryModeActive(false);
        updateGlobalFilterSelection('roles', '', 'clear_excluded');
    });
    controls.appendChild(clearExcludedBtn);

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'tab-button skills-search-dropdown-item';
    clearBtn.textContent = '✕';
    bindGlobalFilterTooltip(clearBtn, 'Сбросить все');
    applyGlobalFilterIconButtonStyle(clearBtn, false);
    clearBtn.addEventListener('click', function() {
        if (isSummaryModeActive()) setSummaryModeActive(false);
        updateGlobalFilterSelection('roles', '', 'clear');
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

    options.forEach(function(option) {
        var row = document.createElement('div');
        row.className = 'skills-search-dropdown-item';
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '1fr';
        row.style.gap = '4px';
        row.style.alignItems = 'center';
        row.style.marginBottom = '2px';
        row.style.padding = '5px 8px';
        row.style.borderRadius = '8px';
        row.style.cursor = 'pointer';
        row.title = 'ЛКМ: включить/снять, ПКМ: исключить/снять';
        row.addEventListener('click', function() {
            if (isSummaryModeActive()) setSummaryModeActive(false);
            var isIncluded = bucket.include.indexOf(option.value) >= 0;
            updateGlobalFilterSelection('roles', option.value, isIncluded ? 'reset' : 'include');
        });
        row.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (isSummaryModeActive()) setSummaryModeActive(false);
            var isExcluded = bucket.exclude.indexOf(option.value) >= 0;
            updateGlobalFilterSelection('roles', option.value, isExcluded ? 'reset' : 'exclude');
        });
        var label = document.createElement('div');
        var isIncludedNow = bucket.include.indexOf(option.value) >= 0;
        var isExcludedNow = bucket.exclude.indexOf(option.value) >= 0;
        label.textContent = option.label;
        label.style.fontWeight = isIncludedNow || isExcludedNow ? '600' : '400';
        label.style.fontSize = '12px';
        row.style.background = isIncludedNow || isExcludedNow ? '#eef2f6' : 'transparent';
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

    trigger.addEventListener('click', function() {
        var nextState = menu.style.display === 'none' ? 'block' : 'none';
        closeGlobalFilterMenus(menu, nextState === 'block' ? triggerArrow : null);
        menu.style.display = nextState;
        if (nextState === 'block') positionGlobalFilterMenu(trigger, menu);
        triggerArrow.textContent = nextState === 'block' ? '▴' : '▾';
    });

    wrap.appendChild(menu);
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
    triggerArrow.textContent = '▾';
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

    var controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '4px';
    controls.style.flexWrap = 'wrap';
    controls.style.marginBottom = '0';
    controls.style.padding = '2px';
    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'tab-button skills-search-dropdown-item';
    allBtn.textContent = '✓';
    bindGlobalFilterTooltip(allBtn, 'Выбрать все');
    applyGlobalFilterIconButtonStyle(allBtn, false);
    allBtn.addEventListener('click', function() { updateGlobalFilterSelection(filterKey, '', 'all'); });
    controls.appendChild(allBtn);

    var multiBtn = document.createElement('button');
    multiBtn.type = 'button';
    multiBtn.className = 'tab-button skills-search-dropdown-item';
    multiBtn.textContent = '⧉';
    bindGlobalFilterTooltip(multiBtn, 'Мультивыбор');
    applyGlobalFilterIconButtonStyle(multiBtn, isGlobalFilterMultiEnabled(filterKey));
    multiBtn.addEventListener('click', function() {
        var next = !isGlobalFilterMultiEnabled(filterKey);
        setGlobalFilterMultiEnabled(filterKey, next);
        applyGlobalFilterIconButtonStyle(multiBtn, next);
        refreshExistingGlobalFilterUi();
    });
    controls.appendChild(multiBtn);

    if (filterKey === 'roles') {
        var clearExcludedBtn = document.createElement('button');
        clearExcludedBtn.type = 'button';
        clearExcludedBtn.className = 'tab-button skills-search-dropdown-item';
        clearExcludedBtn.textContent = '⊘';
        bindGlobalFilterTooltip(clearExcludedBtn, 'Очистить исключения');
        applyGlobalFilterIconButtonStyle(clearExcludedBtn, false);
        clearExcludedBtn.addEventListener('click', function() { updateGlobalFilterSelection(filterKey, '', 'clear_excluded'); });
        controls.appendChild(clearExcludedBtn);
    }

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'tab-button skills-search-dropdown-item';
    clearBtn.textContent = '✕';
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
            row.title = 'ЛКМ: включить/снять, ПКМ: исключить/снять';
            row.addEventListener('click', function() {
                var isIncluded = bucket.include.indexOf(option.value) >= 0;
                updateGlobalFilterSelection(filterKey, option.value, isIncluded ? 'reset' : 'include');
            });
            row.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                var isExcluded = bucket.exclude.indexOf(option.value) >= 0;
                updateGlobalFilterSelection(filterKey, option.value, isExcluded ? 'reset' : 'exclude');
            });
            var label = document.createElement('div');
            var isIncludedNow = bucket.include.indexOf(option.value) >= 0;
            var isExcludedNow = bucket.exclude.indexOf(option.value) >= 0;
            label.textContent = option.label;
            label.style.fontWeight = isIncludedNow || isExcludedNow ? '600' : '400';
            label.style.fontSize = '12px';
            row.style.background = isIncludedNow || isExcludedNow ? '#eef2f6' : 'transparent';
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
        trigger.addEventListener('click', function() {
            var nextState = menu.style.display === 'none' ? 'block' : 'none';
            closeGlobalFilterMenus(menu, nextState === 'block' ? triggerArrow : null);
            menu.style.display = nextState;
            if (nextState === 'block') positionGlobalFilterMenu(trigger, menu);
            triggerArrow.textContent = nextState === 'block' ? '▴' : '▾';
        });
    }
    wrap.appendChild(menu);
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
    var quick = text.match(/^За\s+(\d+)\s+д/i) || text.match(/^last_(\d+)$/i) || text.match(/^(\d+)d$/i);
    if (quick) return 'last_' + String(Number(quick[1]) || 0);
    if (/^\d{4}-\d{2}$/.test(text)) return text;
    if (text === 'За период' || isSummaryMonth(text)) return 'summary';
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

function filterVacanciesBySelectedPeriods(vacancies, selectedPeriods) {
    var list = dedupeVacanciesById((vacancies || []).slice());
    var labels = Array.isArray(selectedPeriods) ? selectedPeriods.filter(Boolean) : [];
    if (!labels.length) return list;
    var effectiveLabels = labels.filter(function(label) {
        var text = String(label || '').trim();
        return !isSummaryMonth(text) && text !== 'За период';
    });
    if (!effectiveLabels.length) return list;

    var monthSet = new Set();
    var maxQuickDays = 0;
    effectiveLabels.forEach(function(label) {
        var text = String(label || '').trim();
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
    if (maxQuickDays > 0) {
        var maxDate = null;
        list.forEach(function(v) {
            if (!v || !v.published_at) return;
            var d = parsePublishedAtDate(v.published_at);
            if (!d) return;
            if (!maxDate || d > maxDate) maxDate = d;
        });
        if (maxDate) quickCutoff = new Date(maxDate.getTime() - maxQuickDays * 24 * 60 * 60 * 1000);
    }

    if (!monthSet.size && !quickCutoff) return list;

    return list.filter(function(v) {
        if (!v || !v.published_at) return false;
        var d = parsePublishedAtDate(v.published_at);
        if (!d) return false;
        var month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        if (monthSet.has(month)) return true;
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
    var skills = computeSalarySkillsFromVacancies(filtered, 15).map(function(item, idx) {
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
                '<button class="view-mode-btn together-btn active" data-view="together" title="Вместе">⊞</button>' +
                '<button class="view-mode-btn table-btn" data-view="table" title="Таблица">▦</button>' +
                '<button class="view-mode-btn graph-btn" data-view="graph" title="График">📊</button>' +
            '</div>' +
            '<div class="analysis-flex view-mode-container" data-analysis="skills-monthly">' +
                '<div class="table-container"></div>' +
                '<div class="plotly-graph" id="skills-monthly-graph-global-' + parentRole.id + '"></div>' +
            '</div>';
        host.appendChild(expDiv);
        block.appendChild(host);
    }

    var hostExp = host.querySelector('.monthly-skills-exp-content');
    var agg = buildSkillsExpDataFromVacancies(vacancies, periodLabel);
    renderSkillsExpContent(hostExp, agg);
    host.style.display = 'block';
    setActiveViewButton(hostExp.querySelectorAll('.view-mode-btn'), uiState.skills_monthly_view_mode);
    var container = hostExp.querySelector('.view-mode-container');
    applyViewMode(container, uiState.skills_monthly_view_mode);
    var globalSkillsGraphId = 'skills-monthly-graph-global-' + parentRole.id;
    buildHorizontalBarChart(globalSkillsGraphId, agg.skills || [], agg.experience || periodLabel);
    applyChartTitleContext(globalSkillsGraphId, 'Топ-15 навыков', buildChartContextLabel(chartPeriodLabel, chartExperienceLabel));
    applySkillsModeSizing(container, uiState.skills_monthly_view_mode);
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
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    var vacancies = filterVacanciesBySelectedPeriods(getRoleVacancies(parentRole), selectedPeriods);
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
    applyChartTitleContext(globalActivityGraphId, 'Количество вакансий по опыту', buildChartContextLabel(chartPeriodLabel, null));
    applyActivityModeSizing(container, mode);
}

function renderGlobalWeekdayFiltered(parentRole) {
    if (!parentRole) return;
    var block = parentRole.querySelector('.weekday-content');
    if (!block) return;

    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'weekday');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var vacancies = filterVacanciesBySelectedPeriods(getRoleVacancies(parentRole), selectedPeriods);
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
            applyChartTitleContext(weekdayGraphId, 'Распределение по дням недели', buildChartContextLabel(resolveChartPeriodLabel(selectedPeriods), null));
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
    initEmployerAnalysisFilter(block);
    if (!block.__employerData || !block.__employerData.length) return;

    var periodOptions = getGlobalFilterOptions(parentRole, 'periods', 'employer-analysis');
    var selectedPeriods = getResolvedGlobalFilterValues('periods', periodOptions);
    var periodLabel = summarizeSelectedPeriodsLabel(selectedPeriods);
    var chartPeriodLabel = resolveChartPeriodLabel(selectedPeriods);
    block.dataset.chartContext = buildChartContextLabel(chartPeriodLabel, null);
    var rows;
    var effectivePeriods = selectedPeriods.filter(function(label) {
        var text = String(label || '').trim();
        return !isSummaryMonth(text) && text !== 'За период';
    });
    var allPeriod = !selectedPeriods.length || !effectivePeriods.length;
    if (allPeriod) {
        rows = block.__employerAllRows || aggregateEmployerAnalysisRows(block.__employerData);
    } else {
        var allowed = new Set(effectivePeriods);
        rows = aggregateEmployerAnalysisRows(block.__employerData.filter(function(row) {
            return row && allowed.has(row.month);
        }));
    }

    renderEmployerAnalysisTable(block, rows, periodLabel);
    block.dataset.employerActiveMonth = 'global';
    renderEmployerAnalysisChart(block);
}

function applyGlobalFiltersToActiveAnalysis(parentRole, analysisType) {
    if (!parentRole) return;
    if (parentRole.id === 'role-all') return;
    var current = analysisType || parentRole.dataset.activeAnalysis || '';
    if (current === 'skills-monthly') renderGlobalSkillsFiltered(parentRole);
    else if (current === 'salary') renderGlobalSalaryFiltered(parentRole);
    else if (current === 'activity') renderGlobalActivityFiltered(parentRole);
    else if (current === 'weekday') renderGlobalWeekdayFiltered(parentRole);
    else if (current === 'skills-search') applyGlobalFiltersToSkillsSearch(parentRole);
    else if (current === 'employer-analysis') renderGlobalEmployerFiltered(parentRole);
}

function syncSharedFilterPanel(parentRole, analysisType) {
    var activeRole = getActiveRoleContent(parentRole);
    hideSharedFilterSources(activeRole);
    var panel = ensureSharedFilterPanel();
    if (!panel) return;
    var body = panel.querySelector('.shared-filter-panel-body');
    if (!body) return;
    body.innerHTML = '';

    var current = analysisType || (activeRole ? (activeRole.dataset.activeAnalysis || '') : '');
    var isAllRolesView = !!(activeRole && activeRole.id === 'role-all');
    body.appendChild(createUnifiedRolesControl(activeRole, current));
    if (isAllRolesView) {
        var allRolesPeriodControl = createAllRolesPeriodControl(activeRole);
        if (allRolesPeriodControl) body.appendChild(allRolesPeriodControl);
    } else {
        body.appendChild(createGlobalFilterDropdown('periods', 'Период', getGlobalFilterOptions(activeRole, 'periods', current), false));
    }
    body.appendChild(createGlobalFilterDropdown('experiences', 'Опыт', getGlobalFilterOptions(activeRole, 'experiences', current), false));
    panel.style.display = body.children.length ? 'block' : 'none';
    renderActiveGlobalFilterChips(panel, activeRole, current);
    applyGlobalFiltersToActiveAnalysis(activeRole, current);
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

    block.querySelectorAll('.skills-search-dropdown[data-filter="period"], .skills-search-dropdown[data-filter="exp"]').forEach(function(node) {
        if (node && node.parentElement) node.parentElement.removeChild(node);
    });

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
        if (statusDropdown) {
            setSkillsSearchDropdownValue(statusDropdown, 'Открытая');
            block.dataset.status = 'Открытая';
        }
    }
    updateSkillsSearchData(block);
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

    var filteredBase = baseVacancies.filter(v => {
        if (!v) return false;
        var vExpGlobal = normalizeExperience(v._experience || v.experience || '');
        var allowedGlobal = selectedExps.map(function(x) { return normalizeExperience(x); }).filter(Boolean);
        if (allowedGlobal.length && allowedGlobal.indexOf(vExpGlobal) < 0) return false;
        if (globalExpOptions.length && selectedExps.length && allowedGlobal.length === 0) {
            return false;
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
                var visibleMonthData = (visibleMonth._data && visibleMonth._data.month) ? visibleMonth._data.month : parseJsonDataset(visibleMonth, 'month', {});
                var visibleMonthLabel = visibleMonthData && visibleMonthData.month ? visibleMonthData.month : '';
                buildHorizontalBarChart(graphId, expData.skills, expData.experience);
                applyChartTitleContext(graphId, 'Топ-15 навыков', buildChartContextLabel(visibleMonthLabel, expData.experience));
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
    syncSharedFilterPanel(block.closest('.role-content'), 'employer-analysis');
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
    var chartContext = block.dataset.chartContext || '';

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
        title: { text: composeChartTitle('Средняя зарплата по параметрам (RUR)', chartContext), x: 0.5, xanchor: 'center' },
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
        title: { text: composeChartTitle('Средняя зарплата по параметрам (USD)', chartContext), x: 0.5, xanchor: 'center' },
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
        title: { text: composeChartTitle('Средняя зарплата по параметрам (EUR)', chartContext), x: 0.5, xanchor: 'center' },
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
        title: { text: composeChartTitle('Средняя зарплата по параметрам (Другая валюта)', chartContext), x: 0.5, xanchor: 'center' },
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
        var allRolesContext = buildChartContextLabel((evt.currentTarget.textContent || '').trim(), null);
        if (mainId && ageId) {
            buildAllRolesActivityChart(rows, mainId, ageId);
            applyChartTitleContext(mainId, 'Открытые и архивные вакансии по ролям', allRolesContext);
            applyChartTitleContext(ageId, 'Ср. возраст (дни) по ролям', allRolesContext);
        }
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
        var allRolesWeekdayContext = buildChartContextLabel((evt.currentTarget.textContent || '').trim(), null);
        if (mode !== 'table' && graphId) {
            buildAllRolesWeekdayChart(rows, graphId);
            applyChartTitleContext(graphId, 'Публикации и архивы по ролям', allRolesWeekdayContext);
        }
        applyWeekdayModeSizing(viewContainer, mode);
    } else if (analysisType === 'skills' && target) {
        var mode = uiState.skills_monthly_view_mode === 'together' ? 'table' : uiState.skills_monthly_view_mode;
        var viewBtns = target.querySelectorAll('.view-mode-btn');
        setActiveViewButton(viewBtns, mode);
        var viewContainer = target.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        var rows = parseJsonDataset(target, 'entries', []);
        var graphId = target.dataset.graphId;
        var allRolesSkillsContext = buildChartContextLabel((evt.currentTarget.textContent || '').trim(), null);
        if (mode === 'graph' && graphId) {
            buildAllRolesSkillsChart(rows, graphId);
            applyChartTitleContext(graphId, 'Топ навыков по упоминаниям', allRolesSkillsContext);
        }
    } else if (analysisType === 'salary' && target) {
        var mode = uiState.salary_view_mode === 'together' ? 'table' : uiState.salary_view_mode;
        var viewBtns = target.querySelectorAll('.view-mode-btn');
        setActiveViewButton(viewBtns, mode);
        var viewContainer = target.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        var rows = parseJsonDataset(target, 'entries', []);
        var graphId = target.dataset.graphId;
        var allRolesSalaryContext = buildChartContextLabel((evt.currentTarget.textContent || '').trim(), null);
        if (mode === 'graph' && graphId) {
            buildAllRolesSalaryChart(rows, graphId);
            applyChartTitleContext(graphId, 'Суммарная частота навыков по ролям', allRolesSalaryContext);
        }
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
    applyChartTitleContext(finalGraphId, 'Топ-15 навыков', buildChartContextLabel(monthStr, liveExp.experience || experience));
    applySkillsModeSizing(container, uiState.skills_monthly_view_mode);
    normalizeSkillsMonthlyControls(parentRole);
    syncSharedFilterPanel(parentRole, 'skills-monthly');
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
        applyChartTitleContext(graphId + '-RUR', 'Средняя зарплата · RUR', expDiv.dataset.chartContext || '');
        applyChartTitleContext(graphId + '-USD', 'Средняя зарплата · USD', expDiv.dataset.chartContext || '');
        applyChartTitleContext(graphId + '-pUSD', 'Средняя зарплата · %USD', expDiv.dataset.chartContext || '');
    } else {
        graphContainer.style.display = 'none';
        tableContainer.style.width = '100%';
    }
}
