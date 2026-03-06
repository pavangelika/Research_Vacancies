// ---------- Shared Filters Module ----------
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




