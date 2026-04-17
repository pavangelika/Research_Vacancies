// ---------- Shared Filters Module ----------
var SHARED_FILTER_PANEL_STATE_STORAGE_KEY = 'research_vacancies.shared_filter_panel_state';
var SHARED_FILTER_PANEL_SECTION_META = [
    { key: 'my-filters', label: 'Избранное', icon: 'favorite' },
    { key: 'roles', label: 'Роль', icon: 'person' },
    { key: 'salary', label: 'Зарплата', icon: 'payments' },
    { key: 'responses', label: 'Отклики', icon: 'mail' },
    { key: 'top', label: 'Топ', icon: 'format_size' },
    { key: 'vacancy', label: 'Вакансия', icon: 'work' },
    { key: 'skills', label: 'Навыки', icon: 'local_fire_department' }
];
var FILTER_SELECTED_GRADIENT = 'linear-gradient(135deg, #00C3D3 0%, #007AD8 55%, #D149EF 100%)';
var FILTER_SELECTED_BORDER = '1px solid transparent';
var FILTER_SELECTED_TEXT = '#ffffff';
var FILTER_SELECTED_SHADOW = '0 10px 24px rgba(0, 122, 216, 0.20)';
var SHARED_FILTER_COMPACT_WIDTH = typeof SHARED_FILTER_FIELD_WIDTH === 'string' ? SHARED_FILTER_FIELD_WIDTH : 'calc(220px * 0.98)';
var SHARED_FILTER_COMPACT_MENU_WIDTH = typeof SHARED_FILTER_FIELD_MENU_WIDTH === 'string' ? SHARED_FILTER_FIELD_MENU_WIDTH : 'calc(220px * 0.98)';
var SHARED_FILTER_EXPANDED_WIDTH = typeof SHARED_FILTER_WIDE_FIELD_WIDTH === 'string' ? SHARED_FILTER_WIDE_FIELD_WIDTH : 'calc(280px * 0.98)';
var SHARED_FILTER_EXPANDED_MENU_WIDTH = typeof SHARED_FILTER_WIDE_MENU_WIDTH === 'string' ? SHARED_FILTER_WIDE_MENU_WIDTH : 'calc(240px * 0.98)';
var SHARED_FILTER_SKILLS_MENU_WIDTH = 'calc(280px * 0.98)';

function getSharedFilterPanelSectionKeyForAnalysis(analysisType) {
    var current = String(analysisType || '').trim().replace(/-all$/, '');
    if (current === 'skills-search') return 'skills';
    if (current === 'my-responses' || current === 'responses-calendar') return 'responses';
    if (current === 'salary') return 'salary';
    if (current === 'employer-analysis') return 'vacancy';
    if (current === 'totals' || current === 'market-trends') return 'top';
    if (current === 'activity' || current === 'weekday' || current === 'skills-monthly') return 'roles';
    if (current === 'all' || current === 'combined') return 'roles';
    return 'roles';
}

function ensureSharedFilterPanelState() {
    if (!uiState.shared_filter_panel_state || typeof uiState.shared_filter_panel_state !== 'object') {
        uiState.shared_filter_panel_state = { collapsed: false, open: true, sections: {}, activeSection: 'roles', lastAnalysis: '' };
    }
    if (typeof uiState.shared_filter_panel_state.collapsed !== 'boolean') {
        uiState.shared_filter_panel_state.collapsed = false;
    }
    if (typeof uiState.shared_filter_panel_state.open !== 'boolean') {
        uiState.shared_filter_panel_state.open = true;
    }
    if (!uiState.shared_filter_panel_state.sections || typeof uiState.shared_filter_panel_state.sections !== 'object') {
        uiState.shared_filter_panel_state.sections = {};
    }
    if (!Object.prototype.hasOwnProperty.call(uiState.shared_filter_panel_state.sections, 'roles')) {
        uiState.shared_filter_panel_state.sections.roles = true;
    }
    if (typeof uiState.shared_filter_panel_state.activeSection !== 'string') {
        uiState.shared_filter_panel_state.activeSection = 'roles';
    }
    if (typeof uiState.shared_filter_panel_state.lastAnalysis !== 'string') {
        uiState.shared_filter_panel_state.lastAnalysis = '';
    }
    return uiState.shared_filter_panel_state;
}

function persistSharedFilterPanelState() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(SHARED_FILTER_PANEL_STATE_STORAGE_KEY, JSON.stringify(ensureSharedFilterPanelState()));
    } catch (_e) {
        // ignore storage failures
    }
}

function isSharedFilterPanelCollapsed() {
    return !!ensureSharedFilterPanelState().collapsed;
}

function setSharedFilterPanelCollapsed(collapsed) {
    var state = ensureSharedFilterPanelState();
    state.collapsed = !!collapsed;
    state.open = !state.collapsed;
    persistSharedFilterPanelState();
}

function getSharedFilterPanelToggleLabel(collapsed) {
    return collapsed ? 'Развернуть панель фильтров' : 'Свернуть панель фильтров';
}

function syncSharedFilterPanelCollapsedUi(panel) {
    if (!panel) return;
    var collapsed = isSharedFilterPanelCollapsed();
    panel.classList.toggle('is-collapsed', collapsed);
    panel.dataset.collapsed = collapsed ? '1' : '0';
    panel.dataset.panelOpen = collapsed ? '0' : '1';

    if (document && document.body) {
        document.body.classList.toggle('shared-filters-collapsed', collapsed);
        document.body.classList.toggle('shared-filters-expanded', !collapsed);
    }

    var body = panel.querySelector('.shared-filter-panel-body');
    var head = panel.querySelector('.shared-filter-panel-head');
    var rail = panel.querySelector('.shared-filter-panel-rail');
    var footer = panel.querySelector('.shared-filter-panel-footer');
    if (body) body.style.display = collapsed ? 'none' : 'flex';
    if (head) head.classList.toggle('is-collapsed', collapsed);
    if (rail) rail.style.display = collapsed ? 'flex' : 'none';
    if (footer) footer.style.display = collapsed ? 'none' : 'block';

    var toggle = panel.querySelector('.shared-filter-panel-toggle');
    if (toggle) {
        toggle.textContent = collapsed ? '\u25B6' : '\u25C0';
        toggle.title = getSharedFilterPanelToggleLabel(collapsed);
        toggle.setAttribute('aria-label', getSharedFilterPanelToggleLabel(collapsed));
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }

    if (typeof updateReportLayoutScrollZones === 'function') {
        updateReportLayoutScrollZones();
    }
    if (typeof resizePlotlyScope === 'function') {
        resizePlotlyScope(document);
    }

    var activeKey = String(panel.dataset.activeSection || getSharedFilterPanelSectionKeyForAnalysis(panel.dataset.activeAnalysis || '') || '').trim() || 'roles';
    if (typeof syncSharedFilterPanelFilledUi === 'function') syncSharedFilterPanelFilledUi(panel);
    if (rail) {
        rail.querySelectorAll('.shared-filter-panel-rail-button[data-section-key]').forEach(function(btn) {
            var btnKey = String(btn.dataset.sectionKey || '').trim();
            var isActive = btnKey === activeKey;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }
    panel.querySelectorAll('.shared-filter-group[data-section-key]').forEach(function(group) {
        var groupKey = String(group.dataset.sectionKey || '').trim();
        var isActive = groupKey === activeKey;
        group.dataset.sectionActive = isActive ? '1' : '0';
        group.classList.toggle('active', isActive);
        var heading = group.querySelector('.shared-filter-group-title');
        if (heading) {
            heading.dataset.sectionActive = isActive ? '1' : '0';
            heading.classList.toggle('active', isActive);
        }
    });

    var railToggle = panel.querySelector('.shared-filter-panel-rail-toggle');
    if (railToggle) {
        railToggle.textContent = collapsed ? '\u25B6' : '\u25C0';
        railToggle.title = getSharedFilterPanelToggleLabel(collapsed);
        railToggle.setAttribute('aria-label', getSharedFilterPanelToggleLabel(collapsed));
    }
}

function syncSharedFilterPanelFilledUi(panel) {
    if (!panel || typeof isSharedFilterSectionFilled !== 'function') return;
    var activeRole = typeof getActiveRoleContent === 'function' ? getActiveRoleContent() : null;
    var analysisType = String(panel.dataset.activeAnalysis || (activeRole && activeRole.dataset ? activeRole.dataset.activeAnalysis || '' : '') || '').trim();
    panel.querySelectorAll('.shared-filter-group[data-section-key]').forEach(function(group) {
        var sectionKey = String(group.dataset.sectionKey || '').trim();
        var isFilled = !!(sectionKey && isSharedFilterSectionFilled(sectionKey, activeRole, analysisType));
        group.dataset.sectionFilled = isFilled ? '1' : '0';
        var heading = group.querySelector('.shared-filter-group-title');
        if (heading) {
            heading.dataset.sectionFilled = isFilled ? '1' : '0';
            heading.classList.toggle('filled', isFilled);
        }
    });
    panel.querySelectorAll('.shared-filter-panel-rail-button[data-section-key]').forEach(function(btn) {
        var sectionKey = String(btn.dataset.sectionKey || '').trim();
        var isFilled = !!(sectionKey && isSharedFilterSectionFilled(sectionKey, activeRole, analysisType));
        btn.dataset.sectionFilled = isFilled ? '1' : '0';
        btn.classList.toggle('filled', isFilled);
    });
}
function ensureSharedFilterPanel() {
    var host = document.getElementById('role-selector');
    if (!host) return null;
    var panel = document.getElementById('global-shared-filter-panel');
    if (!panel) {
        var panelState = typeof ensureSharedFilterPanelState === 'function'
            ? ensureSharedFilterPanelState()
            : { open: true };
        panel = document.createElement('div');
        panel.id = 'global-shared-filter-panel';
        panel.className = 'shared-filter-panel';
        panel.style.display = 'none';
        panel.style.margin = '0';
        panel.style.padding = '0';
        panel.style.border = '0';
        panel.style.borderRadius = '0';
        panel.style.background = 'transparent';
        panel.style.boxShadow = 'none';
        panel.style.backdropFilter = 'none';
        panel.style.position = 'relative';
        panel.style.zIndex = '50';
        panel.style.overflow = 'hidden';
        panel.style.height = '100%';
        panel.style.minHeight = '0';
        panel.style.boxSizing = 'border-box';
        panel.dataset.panelOpen = panelState.open === false ? '0' : '1';

        var head = document.createElement('div');
        head.className = 'shared-filter-panel-head';
        head.style.display = 'flex';
        head.style.alignItems = 'center';
        head.style.justifyContent = 'space-between';
        head.style.gap = '10px';
        head.style.width = '100%';
        head.style.boxSizing = 'border-box';
        head.style.padding = '12px 14px';
        head.style.background = '#262626';
        head.style.color = '#f8fafc';

        var title = document.createElement('div');
        title.className = 'shared-filter-panel-title';
        title.textContent = 'Фильтры';
        title.style.fontWeight = '700';
        title.style.marginBottom = '0';
        title.style.fontSize = '0.95rem';
        title.style.lineHeight = '1.25';
        title.style.color = '#f8fafc';

        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'shared-filter-panel-toggle';
        toggle.textContent = panelState.open === false ? '\u2630' : '\u25C0';
        toggle.setAttribute('aria-expanded', panelState.open === false ? 'false' : 'true');
        toggle.setAttribute('aria-label', panelState.open === false ? 'Развернуть панель фильтров' : 'Свернуть панель фильтров');
        toggle.title = panelState.open === false ? 'Развернуть панель фильтров' : 'Свернуть панель фильтров';
        toggle.addEventListener('click', function() {
            if (typeof setSharedFilterPanelOpen === 'function') {
                var nextOpen = !(panel.dataset.panelOpen === '1');
                setSharedFilterPanelOpen(nextOpen);
            }
        });

        head.appendChild(title);
        head.appendChild(toggle);

        var rail = document.createElement('div');
        rail.className = 'shared-filter-panel-rail';
        rail.style.display = 'none';
        rail.style.flexDirection = 'column';
        rail.style.alignItems = 'stretch';
        rail.style.gap = '8px';
        rail.style.padding = '10px 10px 12px';
        rail.style.boxSizing = 'border-box';
        rail.style.marginTop = '2px';

        var railToggle = document.createElement('button');
        railToggle.type = 'button';
        railToggle.className = 'shared-filter-panel-rail-toggle';
        railToggle.textContent = '\u25C0';
        railToggle.setAttribute('aria-label', getSharedFilterPanelToggleLabel(false));
        railToggle.title = getSharedFilterPanelToggleLabel(false);
        railToggle.addEventListener('click', function() {
            setSharedFilterPanelCollapsed(false);
            syncSharedFilterPanelCollapsedUi(panel);
        });
        rail.appendChild(railToggle);

        SHARED_FILTER_PANEL_SECTION_META.forEach(function(section) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'shared-filter-panel-rail-button';
            btn.dataset.sectionKey = section.key;
            btn.setAttribute('aria-pressed', 'false');
            btn.setAttribute('aria-label', section.label);
            btn.title = section.label;
            if (typeof createSharedFilterMaterialIcon === 'function') {
                btn.appendChild(createSharedFilterMaterialIcon(section.icon, 'shared-filter-panel-rail-icon'));
            } else {
                var icon = document.createElement('span');
                icon.className = 'shared-filter-panel-rail-icon material-symbols-outlined';
                icon.setAttribute('aria-hidden', 'true');
                icon.textContent = section.icon;
                btn.appendChild(icon);
            }
            var text = document.createElement('span');
            text.className = 'shared-filter-panel-rail-text';
            text.textContent = section.label;
            btn.appendChild(text);
            btn.addEventListener('click', function() {
                if (typeof ensureSharedFilterPanelState === 'function') ensureSharedFilterPanelState();
                if (uiState.shared_filter_panel_state) {
                    uiState.shared_filter_panel_state.activeSection = section.key;
                    if (typeof persistSharedFilterPanelState === 'function') persistSharedFilterPanelState();
                }
                panel.dataset.activeSection = section.key;
                setSharedFilterPanelCollapsed(false);
                if (typeof setSharedFilterPanelSectionOpen === 'function') {
                    setSharedFilterPanelSectionOpen(section.key, true);
                }
                syncSharedFilterPanelCollapsedUi(panel);
            });
            rail.appendChild(btn);
        });

        var hint = document.createElement('div');
        hint.className = 'shared-filter-panel-hint';
        hint.textContent = '';
        hint.style.fontSize = '10px';
        hint.style.marginBottom = '0';
        hint.style.display = 'none';

        var body = document.createElement('div');
        body.className = 'shared-filter-panel-body';
        body.style.display = panelState.open === false ? 'none' : 'flex';
        body.style.flexDirection = 'column';
        body.style.flexWrap = 'nowrap';
        body.style.alignItems = 'stretch';
        body.style.gap = '8px';
        body.style.width = '100%';
        body.style.maxWidth = '100%';
        body.style.flex = '1 1 auto';
        body.style.minHeight = '0';
        body.style.overflowX = 'hidden';
        body.style.overflowY = 'auto';

        var footer = document.createElement('div');
        footer.className = 'shared-filter-panel-footer';
        footer.style.marginTop = '12px';
        footer.style.paddingTop = '10px';
        footer.style.textAlign = 'center';
        footer.style.fontSize = '0.84rem';

        panel.appendChild(head);
        panel.appendChild(hint);
        panel.appendChild(rail);
        panel.appendChild(body);
        panel.appendChild(footer);
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
    var currentPanelState = typeof ensureSharedFilterPanelState === 'function'
        ? ensureSharedFilterPanelState()
        : { open: true };
    panel.dataset.panelOpen = currentPanelState.open === false ? '0' : '1';
    var headNode = panel.querySelector('.shared-filter-panel-head');
    var bodyNode = panel.querySelector('.shared-filter-panel-body');
    var toggleNode = panel.querySelector('.shared-filter-panel-toggle');
    if (headNode) headNode.style.paddingBottom = currentPanelState.open === false ? '0' : '8px';
    if (bodyNode) bodyNode.style.display = currentPanelState.open === false ? 'none' : 'flex';
    if (toggleNode) {
        toggleNode.textContent = currentPanelState.open === false ? '\u2630' : '\u25C0';
        toggleNode.setAttribute('aria-expanded', currentPanelState.open === false ? 'false' : 'true');
        toggleNode.setAttribute('aria-label', currentPanelState.open === false ? 'Развернуть панель фильтров' : 'Свернуть панель фильтров');
        toggleNode.title = currentPanelState.open === false ? 'Развернуть панель фильтров' : 'Свернуть панель фильтров';
    }
    var footerNode = panel.querySelector('.shared-filter-panel-footer');
    if (footerNode) {
        var currentDate = document.body && document.body.dataset ? String(document.body.dataset.currentDate || '').trim() : '';
        var currentTime = document.body && document.body.dataset ? String(document.body.dataset.currentTime || '').trim() : '';
        footerNode.textContent = (currentDate && currentTime) ? ('Обновлено: ' + currentDate + ' ' + currentTime) : 'Обновлено';
    }
    panel.dataset.activeSection = getSharedFilterPanelSectionKeyForAnalysis(panel.dataset.activeAnalysis || '');
    syncSharedFilterPanelCollapsedUi(panel);
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
        '.summary-analysis-menu-legacy'
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

function syncAllRolesSharedFilterButtons(activeRole, analysisType) {
    if (!activeRole || activeRole.id !== 'role-all') return;
    var host = activeRole.querySelector('.all-roles-shared-filter-buttons');
    if (!host) return;

    var current = String(analysisType || activeRole.dataset.activeAnalysis || 'activity').replace(/-all$/, '');
    host.innerHTML = '';
    host.appendChild(createGlobalFilterDropdown('periods', 'Период', getGlobalFilterOptions(activeRole, 'periods', current), false));
    host.appendChild(createGlobalFilterDropdown('experiences', 'Опыт', getGlobalFilterOptions(activeRole, 'experiences', current), false));
    var statusOptions = getGlobalFilterOptions(activeRole, 'status', current);
    if (statusOptions.length) {
        host.appendChild(createGlobalFilterDropdown('status', 'Статус', statusOptions, false));
    }
    if (current === 'skills-search') {
        host.appendChild(createGlobalFilterDropdown('currency', 'Валюта', getGlobalFilterOptions(activeRole, 'currency', current), false));
        host.appendChild(createGlobalFilterDropdown('country', 'Страна', getGlobalFilterOptions(activeRole, 'country', current), false));
        host.appendChild(createGlobalFilterDropdown('accreditation', 'ИТ-аккредитация', getGlobalFilterOptions(activeRole, 'accreditation', current), false));
        host.appendChild(createGlobalFilterDropdown('cover_letter_required', 'Сопроводительное письмо', getGlobalFilterOptions(activeRole, 'cover_letter_required', current), false));
        host.appendChild(createGlobalFilterDropdown('has_test', 'Тестовое задание', getGlobalFilterOptions(activeRole, 'has_test', current), false));
    }
}

function createSummaryAnalysisControl(activeRole) {
    var buttons = getSummaryAnalysisButtons(activeRole);
    if (!buttons.length) return null;

    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown summary-filter-dropdown';
    wrap.style.marginTop = '4px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = SHARED_FILTER_COMPACT_WIDTH;
    wrap.style.width = SHARED_FILTER_COMPACT_WIDTH;

    var caption = document.createElement('div');
    caption.className = 'shared-filter-field-label';
    caption.textContent = 'Раздел';
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
    menu.style.width = SHARED_FILTER_COMPACT_MENU_WIDTH;
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

function createMyResponsesFilterControl(activeRole, analysisType) {
    if (!activeRole || String(analysisType || '') !== 'my-responses') return null;

    var wrap = document.createElement('div');
    wrap.className = 'totals-top-filter-control my-responses-filter-control';

    var currencyWrap = document.createElement('div');
    currencyWrap.className = 'totals-top-filter-currency';

    var currencyLabel = document.createElement('div');
    currencyLabel.className = 'totals-top-filter-subtitle';
    currencyLabel.textContent = 'Валюта';
    currencyWrap.appendChild(currencyLabel);

    var currencyTabs = document.createElement('div');
    currencyTabs.className = 'totals-top-filter-chip-row';
    currencyWrap.appendChild(currencyTabs);

    var currentCurrency = typeof normalizeMyResponsesCurrencyFilter === 'function'
        ? normalizeMyResponsesCurrencyFilter(uiState.my_responses_currency || 'all')
        : (String(uiState.my_responses_currency || 'all').trim().toUpperCase() || 'all');
    uiState.my_responses_currency = currentCurrency;

    var currencyButtons = [];
    [
        { value: 'all', label: 'Все' },
        { value: 'RUR', label: 'RUR' },
        { value: 'USD', label: 'USD' },
        { value: 'EUR', label: 'EUR' }
    ].forEach(function(item) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'totals-top-filter-chip';
        button.textContent = item.label;
        button.setAttribute('aria-pressed', item.value === currentCurrency ? 'true' : 'false');
        if (item.value === currentCurrency) button.classList.add('active');
        button.addEventListener('click', function() {
            if (uiState.my_responses_currency === item.value) return;
            uiState.my_responses_currency = item.value;
            currencyButtons.forEach(function(other) {
                var active = other === button;
                other.classList.toggle('active', active);
                other.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            if (typeof renderMyResponsesContent === 'function') renderMyResponsesContent(activeRole);
        });
        currencyButtons.push(button);
        currencyTabs.appendChild(button);
    });
    wrap.appendChild(currencyWrap);

    var statusWrap = document.createElement('div');
    statusWrap.className = 'totals-top-filter-currency my-responses-status-filter';

    var statusLabel = document.createElement('div');
    statusLabel.className = 'totals-top-filter-subtitle';
    statusLabel.textContent = 'Статус';
    statusWrap.appendChild(statusLabel);

    var statusTabs = document.createElement('div');
    statusTabs.className = 'totals-top-filter-chip-row';
    statusWrap.appendChild(statusTabs);

    var statusBucket = typeof ensureGlobalFilterBucket === 'function'
        ? ensureGlobalFilterBucket('status')
        : { include: [], exclude: [] };
    statusBucket.exclude = [];
    var currentStatus = statusBucket.include.length ? String(statusBucket.include[0] || '').trim() : 'all';
    if (currentStatus !== 'open' && currentStatus !== 'archived') currentStatus = 'all';
    var statusButtons = [];
    [
        { value: 'all', label: 'Все' },
        { value: 'open', label: 'Открытая' },
        { value: 'archived', label: 'Архивная' }
    ].forEach(function(item) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'totals-top-filter-chip';
        button.textContent = item.label;
        button.setAttribute('aria-pressed', item.value === currentStatus ? 'true' : 'false');
        if (item.value === currentStatus) button.classList.add('active');
        button.addEventListener('click', function() {
            if (typeof ensureGlobalFilterBucket === 'function') {
                var bucket = ensureGlobalFilterBucket('status');
                bucket.exclude = [];
                bucket.include = item.value === 'all' ? [] : [item.value];
            }
            statusButtons.forEach(function(other) {
                var active = other === button;
                other.classList.toggle('active', active);
                other.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            rerenderMyResponses();
        });
        statusButtons.push(button);
        statusTabs.appendChild(button);
    });
    wrap.appendChild(statusWrap);

    var offerWrap = document.createElement('div');
    offerWrap.className = 'totals-top-filter-currency my-responses-offer-filter';

    var offerLabel = document.createElement('div');
    offerLabel.className = 'totals-top-filter-subtitle';
    offerLabel.textContent = 'Оффер';
    offerWrap.appendChild(offerLabel);

    var offerRow = document.createElement('div');
    offerRow.className = 'my-responses-offer-switch-row';
    offerWrap.appendChild(offerRow);

    var currentOffer = typeof normalizeMyResponsesOfferFilter === 'function'
        ? normalizeMyResponsesOfferFilter(uiState.my_responses_offer_filter || 'all')
        : String(uiState.my_responses_offer_filter || 'all').trim().toLowerCase();
    uiState.my_responses_offer_filter = currentOffer;

    var offerAllButton = document.createElement('button');
    offerAllButton.type = 'button';
    offerAllButton.className = 'totals-top-filter-chip my-responses-offer-all';
    offerAllButton.textContent = 'Все';
    offerRow.appendChild(offerAllButton);

    var switchLabelNo = document.createElement('span');
    switchLabelNo.className = 'my-responses-offer-switch-label';
    switchLabelNo.textContent = 'Не указан';
    offerRow.appendChild(switchLabelNo);

    var switchWrap = document.createElement('label');
    switchWrap.className = 'totals-ios-checkbox-wrap my-responses-offer-switch-wrap';
    var switchInput = document.createElement('input');
    switchInput.type = 'checkbox';
    switchInput.className = 'totals-ios-checkbox my-responses-offer-switch';
    var switchUi = document.createElement('span');
    switchUi.className = 'totals-ios-checkbox-ui';
    switchWrap.appendChild(switchInput);
    switchWrap.appendChild(switchUi);
    offerRow.appendChild(switchWrap);

    var switchLabelYes = document.createElement('span');
    switchLabelYes.className = 'my-responses-offer-switch-label';
    switchLabelYes.textContent = 'Есть';
    offerRow.appendChild(switchLabelYes);

    function rerenderMyResponses() {
        if (typeof renderMyResponsesContent === 'function') renderMyResponsesContent(activeRole);
    }

    function updateOfferUi() {
        var state = typeof normalizeMyResponsesOfferFilter === 'function'
            ? normalizeMyResponsesOfferFilter(uiState.my_responses_offer_filter || 'all')
            : String(uiState.my_responses_offer_filter || 'all').trim().toLowerCase();
        var isAll = state === 'all';
        offerAllButton.classList.toggle('active', isAll);
        offerAllButton.setAttribute('aria-pressed', isAll ? 'true' : 'false');
        switchInput.checked = state === 'yes';
        switchLabelNo.classList.toggle('active', state === 'no');
        switchLabelYes.classList.toggle('active', state === 'yes');
        switchWrap.classList.toggle('is-neutral', isAll);
    }

    offerAllButton.addEventListener('click', function() {
        uiState.my_responses_offer_filter = 'all';
        updateOfferUi();
        rerenderMyResponses();
    });
    switchInput.addEventListener('change', function() {
        uiState.my_responses_offer_filter = switchInput.checked ? 'yes' : 'no';
        updateOfferUi();
        rerenderMyResponses();
    });
    updateOfferUi();

    wrap.appendChild(offerWrap);
    return wrap;
}

function createSkillsSearchFilterControl(activeRole, analysisType) {
    if (!activeRole) return null;
    if (typeof initSkillsSearch === 'function') initSkillsSearch(activeRole);
    var block = activeRole.querySelector('.skills-search-content');
    if (!block) return null;

    var state = (typeof getSkillsSearchSelections === 'function') ? getSkillsSearchSelections(block) : { includeSkills: [], excludeSkills: [], logic: 'or' };
    var searchQuery = String(uiState.skills_search_filter_query || '').trim().toLowerCase();
    var skills = (block._data && Array.isArray(block._data.skills)) ? block._data.skills.slice() : [];
    skills.sort(function(a, b) {
        return (Number(b && b.count) || 0) - (Number(a && a.count) || 0)
            || String((a && a.skill) || '').localeCompare(String((b && b.skill) || ''), 'ru');
    });
    var includeKeys = new Set((state.includeSkills || []).map(function(item) { return normalizeSkillName(item); }));
    var excludeKeys = new Set((state.excludeSkills || []).map(function(item) { return normalizeSkillName(item); }));
    var visibleSkills = skills.filter(function(item) {
        var display = registerSkillDisplayName(item && item.skill ? item.skill : '');
        if (!searchQuery) return true;
        return display.toLowerCase().indexOf(searchQuery) >= 0;
    });
    visibleSkills = (function(items) {
        var groups = new Map();
        items.forEach(function(item) {
            var countKey = String(Number(item && item.count) || 0);
            if (!groups.has(countKey)) groups.set(countKey, []);
            groups.get(countKey).push(item);
        });
        var orderedCountKeys = Array.from(groups.keys()).sort(function(a, b) {
            return Number(b) - Number(a);
        });
        var arranged = [];
        var lastLabelLength = 0;
        orderedCountKeys.forEach(function(countKey) {
            var group = (groups.get(countKey) || []).slice().sort(function(a, b) {
                var aLabel = registerSkillDisplayName(a && a.skill ? a.skill : '');
                var bLabel = registerSkillDisplayName(b && b.skill ? b.skill : '');
                return aLabel.length - bLabel.length || aLabel.localeCompare(bLabel, 'ru');
            });
            while (group.length) {
                var nextItem = lastLabelLength >= 16 ? group.shift() : group.pop();
                arranged.push(nextItem);
                lastLabelLength = registerSkillDisplayName(nextItem && nextItem.skill ? nextItem.skill : '').length;
            }
        });
        return arranged;
    })(visibleSkills);

    var wrap = document.createElement('div');
    wrap.className = 'totals-top-filter-control skills-search-top-filter-control';

    var searchWrap = document.createElement('div');
    searchWrap.className = 'skills-search-top-search-wrap';
    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'global-filter-search skills-search-top-search';
    searchInput.placeholder = 'Поиск навыка';
    searchInput.value = String(uiState.skills_search_filter_query || '');
    searchInput.addEventListener('input', function() {
        var nextQuery = String(searchInput.value || '');
        uiState.skills_search_filter_query = nextQuery;
        if (typeof refreshSkillsSearchPanel === 'function') refreshSkillsSearchPanel(activeRole);
        setTimeout(function() {
            var nextInput = document.querySelector('#global-shared-filter-panel .skills-search-top-filter-control .global-filter-search');
            if (!nextInput) return;
            nextInput.focus();
            if (typeof nextInput.setSelectionRange === 'function') {
                nextInput.setSelectionRange(nextQuery.length, nextQuery.length);
            }
        }, 0);
    });
    searchWrap.appendChild(searchInput);
    wrap.appendChild(searchWrap);

    var summary = document.createElement('div');
    summary.className = 'skills-search-top-meta';
    summary.textContent = 'Навыков: ' + visibleSkills.length + ' из ' + skills.length + ' · клик: включить → исключить → снять';
    wrap.appendChild(summary);

    var list = document.createElement('div');
    list.className = 'skills-search-top-list totals-top-filter-chip-row skills-search-top-chipset-row';
    if (!visibleSkills.length) {
        var empty = document.createElement('div');
        empty.className = 'skills-search-top-empty';
        empty.textContent = skills.length ? 'Нет навыков по текущему поиску' : 'Нет навыков для текущей выборки';
        list.appendChild(empty);
    } else {
        visibleSkills.forEach(function(item) {
            var displaySkill = registerSkillDisplayName(item.skill);
            var key = normalizeSkillName(displaySkill);
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'totals-top-filter-chip skills-search-top-skill-chip';
            if (includeKeys.has(key)) button.classList.add('active');
            if (excludeKeys.has(key)) button.classList.add('excluded');
            button.innerHTML =
                '<span class="skills-search-top-skill-label">' + escapeHtml(displaySkill) + '</span>' +
                '<span class="skills-search-top-skill-count">' + escapeHtml(item.count) + '</span>';
            button.addEventListener('click', function() {
                if (typeof toggleSkillsSearchSkillState === 'function') {
                    toggleSkillsSearchSkillState(block, displaySkill, 'cycle');
                }
                if (typeof updateSkillsSearchResults === 'function') updateSkillsSearchResults(block);
                if (typeof refreshSkillsSearchPanel === 'function') refreshSkillsSearchPanel(activeRole);
            });
            list.appendChild(button);
        });
    }
    wrap.appendChild(list);

    return wrap;
}

function getSkillsSearchPanelContext(activeRole, analysisType) {
    if (!activeRole) return null;
    if (typeof initSkillsSearch === 'function') initSkillsSearch(activeRole);
    var block = activeRole.querySelector('.skills-search-content');
    if (!block) return null;
    var skills = (block._data && Array.isArray(block._data.skills)) ? block._data.skills.slice() : [];
    skills.sort(function(a, b) {
        return (Number(b && b.count) || 0) - (Number(a && a.count) || 0)
            || String((a && a.skill) || '').localeCompare(String((b && b.skill) || ''), 'ru');
    });
    var selections = (typeof getSkillsSearchSelections === 'function')
        ? getSkillsSearchSelections(block)
        : { includeSkills: [], excludeSkills: [], logic: 'or' };
    return {
        block: block,
        skills: skills,
        selections: selections
    };
}

function syncSkillsSearchFilterEffects(activeRole) {
    if (!activeRole) return;
    if (typeof refreshSkillsSearchPanel === 'function') refreshSkillsSearchPanel(activeRole);
    if (typeof applyGlobalFiltersToActiveAnalysis === 'function') {
        applyGlobalFiltersToActiveAnalysis(activeRole, activeRole.dataset.activeAnalysis || '');
    }
}

function createSkillsSearchFavoritesControl(activeRole, analysisType) {
    var ctx = getSkillsSearchPanelContext(activeRole, analysisType);
    if (!ctx) return null;

    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown skills-search-dropdown skills-search-favorites-panel';
    wrap.dataset.filterKey = 'skills-search-favorites';
    wrap.style.marginTop = '4px';
    wrap.style.flex = '1 1 320px';
    wrap.style.minWidth = '0';
    wrap.style.width = '100%';
    wrap.style.maxWidth = '100%';

    var row = document.createElement('div');
    row.className = 'skills-search-favorites-panel-row';

    var dropdownWrap = document.createElement('div');
    dropdownWrap.className = 'global-filter-dropdown skills-search-dropdown skills-search-favorites-panel-picker-wrap';
    dropdownWrap.style.flex = '0 0 auto';
    dropdownWrap.style.minWidth = 'auto';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tab-button global-filter-trigger skills-search-dropdown-btn skills-search-icon-btn skills-search-favorites-panel-action skills-search-favorites-panel-picker';
    trigger.textContent = '\u2661';
    trigger.title = 'Сохраненные наборы';
    trigger.setAttribute('aria-label', 'Сохраненные наборы');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    applyGlobalFilterIconButtonStyle(trigger, false);
    dropdownWrap.appendChild(trigger);
    row.appendChild(dropdownWrap);

    var inputWrap = document.createElement('div');
    inputWrap.className = 'skills-search-favorites-panel-field';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'skills-search-favorites-panel-input';
    input.placeholder = 'Сохранить фильтр';
    input.autocomplete = 'off';
    input.spellcheck = false;
    inputWrap.appendChild(input);

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'skills-search-favorites-panel-save';
    saveBtn.innerHTML = '<span aria-hidden="true">\u2713</span>';
    saveBtn.title = 'Сохранить набор';
    saveBtn.setAttribute('aria-label', 'Сохранить набор');
    saveBtn.setAttribute('tabindex', '-1');
    inputWrap.appendChild(saveBtn);
    row.appendChild(inputWrap);

    var menu = document.createElement('div');
    menu.className = 'global-filter-menu skills-search-dropdown-menu';
    menu.style.display = 'none';
    menu.style.marginTop = '0';
    menu.style.padding = '6px';
    menu.style.border = '1px solid var(--border-color, #d9e2ec)';
    menu.style.borderRadius = '12px';
    menu.style.background = 'var(--card-background, #fff)';
    menu.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.08)';
    menu.style.width = SHARED_FILTER_SKILLS_MENU_WIDTH;
    menu.style.maxWidth = 'calc(100vw - 48px)';
    menu.style.maxHeight = '280px';
    menu.style.overflowY = 'auto';
    bindGlobalFilterMenuScrollLock(menu);

    function setMenuOpen(isOpen) {
        menu.style.display = isOpen ? 'block' : 'none';
        dropdownWrap.classList.toggle('open', !!isOpen);
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function syncSaveButtonState() {
        var hasValue = !!String(input.value || '').trim();
        saveBtn.classList.toggle('is-ready', hasValue);
        saveBtn.setAttribute('aria-disabled', hasValue ? 'false' : 'true');
    }

    function commitFavoriteSave() {
        var nextName = String(input.value || '').trim();
        if (!nextName) {
            syncSaveButtonState();
            return false;
        }
        if (!saveCurrentSkillsSearchFavorite(ctx.block, nextName)) {
            syncSaveButtonState();
            return false;
        }
        input.value = '';
        syncSaveButtonState();
        syncSkillsSearchFilterEffects(activeRole);
        return true;
    }

    function refreshFavoritesMenu() {
        var favoritesState = ensureSkillsSearchFavoritesState();
        var items = Array.isArray(favoritesState.items) ? favoritesState.items.slice() : [];
        var activeId = String(favoritesState.activeId || '');
        var activeItem = activeId
            ? (items.find(function(item) { return item.id === activeId; }) || null)
            : null;
        trigger.classList.toggle('is-active', !!activeItem);
        trigger.innerHTML =
            '<span class="skills-search-favorite-trigger-body">' +
                escapeHtml(activeItem ? activeItem.name : 'Не выбрано') +
            '</span>';
        input.placeholder = activeItem ? activeItem.name : 'Сохранить фильтр';
        trigger.title = activeItem ? ('Набор: ' + activeItem.name) : 'Не выбрано';
        trigger.setAttribute('aria-label', trigger.title);
        saveBtn.title = activeItem ? ('Сохранить текущий фильтр: ' + activeItem.name) : 'Сохранить фильтр';
        saveBtn.setAttribute('aria-label', saveBtn.title);
        syncSaveButtonState();

        menu.innerHTML = '';

        var clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'skills-search-dropdown-item global-filter-option-row';
        clearBtn.textContent = 'Не выбрано';
        clearBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            favoritesState.activeId = '';
            persistSkillsSearchFavoritesState();
            setMenuOpen(false);
            refreshFavoritesMenu();
            syncSkillsSearchFilterEffects(activeRole);
        });
        menu.appendChild(clearBtn);

        items.forEach(function(item) {
            var rowBtn = document.createElement('button');
            rowBtn.type = 'button';
            rowBtn.className = 'skills-search-dropdown-item global-filter-option-row skills-search-favorite-panel-item';
            rowBtn.dataset.favoriteId = item.id;

            var nameSpan = document.createElement('span');
            nameSpan.className = 'skills-search-favorite-panel-name';
            nameSpan.textContent = item.name;
            rowBtn.appendChild(nameSpan);

            var removeSpan = document.createElement('span');
            removeSpan.className = 'skills-search-favorite-panel-remove';
            removeSpan.textContent = '\u00D7';
            removeSpan.title = 'Удалить набор';
            removeSpan.setAttribute('aria-label', 'Удалить набор');
            removeSpan.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                confirmSkillsSearchFavoriteDelete(item.name).then(function(shouldDelete) {
                    if (!shouldDelete) return;
                    removeCurrentSkillsSearchFavorite(ctx.block, item.id);
                    refreshFavoritesMenu();
                    syncSkillsSearchFilterEffects(activeRole);
                });
            });
            rowBtn.appendChild(removeSpan);

            if (item.id === activeId) rowBtn.classList.add('active');
            rowBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                applySkillsSearchFavorite(ctx.block, item.id);
                setMenuOpen(false);
                refreshFavoritesMenu();
                syncSkillsSearchFilterEffects(activeRole);
            });
            menu.appendChild(rowBtn);
        });
    }

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var nextState = menu.style.display === 'none';
        closeGlobalFilterMenus(menu, null);
        setMenuOpen(nextState);
        if (nextState) positionGlobalFilterMenu(row, menu);
    });

    input.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        commitFavoriteSave();
    });
    input.addEventListener('input', syncSaveButtonState);
    input.addEventListener('blur', function() {
        commitFavoriteSave();
    });
    saveBtn.addEventListener('mousedown', function(e) {
        e.preventDefault();
    });
    saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        commitFavoriteSave();
    });

    refreshFavoritesMenu();
    dropdownWrap.appendChild(menu);
    wrap.appendChild(row);
    return wrap;
}

function createMyFiltersControl(activeRole, analysisType) {
    if (!activeRole) return null;
    var presetState = typeof getSharedFilterPresetState === 'function'
        ? getSharedFilterPresetState(analysisType)
        : { activeId: '', items: [] };
    var items = Array.isArray(presetState.items) ? presetState.items.slice() : [];
    var activeItem = presetState.activeId
        ? (items.find(function(item) { return item.id === presetState.activeId; }) || null)
        : null;

    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown skills-search-dropdown skills-search-favorites-panel';
    wrap.dataset.filterKey = 'shared-filter-presets';
    wrap.style.marginTop = '0';
    wrap.style.flex = '1 1 auto';
    wrap.style.minWidth = '0';
    wrap.style.width = '100%';
    wrap.style.maxWidth = '100%';

    var row = document.createElement('div');
    row.className = 'skills-search-favorites-panel-row';
    row.style.display = 'flex';
    row.style.flexDirection = 'column';
    row.style.alignItems = 'stretch';
    row.style.gap = '4px';

    var dropdownLabel = document.createElement('div');
    dropdownLabel.className = 'shared-filter-field-label';
    dropdownLabel.textContent = 'Избранное';
    row.appendChild(dropdownLabel);

    var dropdownWrap = document.createElement('div');
    dropdownWrap.className = 'global-filter-dropdown skills-search-dropdown skills-search-favorites-panel-picker-wrap';
    dropdownWrap.style.flex = '0 0 auto';
    dropdownWrap.style.minWidth = '0';
    dropdownWrap.style.width = '100%';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tab-button global-filter-trigger skills-search-dropdown-btn skills-search-favorite-trigger shared-filter-preset-trigger';
    trigger.title = 'Избранные фильтры';
    trigger.setAttribute('aria-label', 'Избранные фильтры');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    dropdownWrap.appendChild(trigger);
    row.appendChild(dropdownWrap);

    var inputLabel = document.createElement('div');
    inputLabel.className = 'shared-filter-field-label';
    inputLabel.textContent = 'Сохранить набор';
    row.appendChild(inputLabel);

    var inputWrap = document.createElement('div');
    inputWrap.className = 'skills-search-favorites-panel-field';
    inputWrap.style.width = '100%';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'skills-search-favorites-panel-input';
    input.placeholder = 'Введите название';
    input.autocomplete = 'off';
    input.spellcheck = false;
    inputWrap.appendChild(input);

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'skills-search-favorites-panel-save';
    saveBtn.innerHTML = '<span aria-hidden="true">\u2713</span>';
    saveBtn.title = 'Сохранить набор';
    saveBtn.setAttribute('aria-label', 'Сохранить набор');
    saveBtn.setAttribute('tabindex', '-1');
    inputWrap.appendChild(saveBtn);
    row.appendChild(inputWrap);

    var menu = document.createElement('div');
    menu.className = 'global-filter-menu skills-search-dropdown-menu';
    menu.style.display = 'none';
    menu.style.marginTop = '0';
    menu.style.padding = '6px';
    menu.style.border = '1px solid var(--border-color, #d9e2ec)';
    menu.style.borderRadius = '0';
    menu.style.background = 'var(--card-background, #fff)';
    menu.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.08)';
    menu.style.width = '100%';
    menu.style.maxWidth = '100%';
    menu.style.maxHeight = '280px';
    menu.style.overflowY = 'auto';
    bindGlobalFilterMenuScrollLock(menu);

    function setMenuOpen(isOpen) {
        menu.style.display = isOpen ? 'block' : 'none';
        dropdownWrap.classList.toggle('open', !!isOpen);
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function syncSaveButtonState() {
        var hasValue = !!String(input.value || '').trim();
        saveBtn.classList.toggle('is-ready', hasValue);
        saveBtn.setAttribute('aria-disabled', hasValue ? 'false' : 'true');
    }

    function refreshMenu() {
        var currentState = typeof getSharedFilterPresetState === 'function'
            ? getSharedFilterPresetState(analysisType)
            : presetState;
        var currentItems = Array.isArray(currentState.items) ? currentState.items.slice() : [];
        var currentActive = currentState.activeId
            ? (currentItems.find(function(item) { return item.id === currentState.activeId; }) || null)
            : null;
        var activeName = currentActive ? currentActive.name : 'Не выбрано';
        trigger.classList.toggle('is-active', !!currentActive);
        trigger.title = currentActive ? ('Набор: ' + currentActive.name) : 'Не выбрано';
        trigger.setAttribute('aria-label', trigger.title);
        saveBtn.title = currentActive ? ('Сохранить текущий фильтр: ' + currentActive.name) : 'Сохранить фильтр';
        saveBtn.setAttribute('aria-label', saveBtn.title);
        syncSaveButtonState();
        trigger.innerHTML =
            '<span class="skills-search-favorite-trigger-body">' +
                escapeHtml(activeName) +
            '</span>';

        menu.innerHTML = '';
        var clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'skills-search-dropdown-item global-filter-option-row';
        clearBtn.textContent = 'Не выбрано';
        clearBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof getSharedFilterPresetState === 'function') {
                var state = getSharedFilterPresetState(analysisType);
                state.activeId = '';
                if (typeof persistSharedFilterPresetsState === 'function') persistSharedFilterPresetsState();
            }
            setMenuOpen(false);
            refreshMenu();
            if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(activeRole, analysisType, true);
        });
        menu.appendChild(clearBtn);

        currentItems.forEach(function(item) {
            var rowBtn = document.createElement('button');
            rowBtn.type = 'button';
            rowBtn.className = 'skills-search-dropdown-item global-filter-option-row skills-search-favorite-panel-item';
            rowBtn.dataset.favoriteId = item.id;

            var nameSpan = document.createElement('span');
            nameSpan.className = 'skills-search-favorite-panel-name';
            nameSpan.textContent = item.name;
            rowBtn.appendChild(nameSpan);

            var removeSpan = document.createElement('span');
            removeSpan.className = 'skills-search-favorite-panel-remove';
            removeSpan.textContent = '\u00D7';
            removeSpan.title = 'Удалить набор';
            removeSpan.setAttribute('aria-label', 'Удалить набор');
            removeSpan.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof removeSharedFilterPreset === 'function') {
                    removeSharedFilterPreset(analysisType, item.id);
                }
                refreshMenu();
                if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(activeRole, analysisType, true);
            });
            rowBtn.appendChild(removeSpan);

            if (item.id === currentState.activeId) rowBtn.classList.add('active');
            rowBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof applySharedFilterPreset === 'function') {
                    applySharedFilterPreset(activeRole, analysisType, item.id);
                }
                setMenuOpen(false);
                refreshMenu();
                if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(activeRole, analysisType, true);
            });
            menu.appendChild(rowBtn);
        });
    }

    function commitSave() {
        var nextName = String(input.value || '').trim();
        if (!nextName) {
            syncSaveButtonState();
            return false;
        }
        if (typeof saveSharedFilterPreset === 'function') {
            saveSharedFilterPreset(activeRole, analysisType, nextName);
        }
        input.value = '';
        syncSaveButtonState();
        refreshMenu();
        if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(activeRole, analysisType, true);
        return true;
    }

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var nextState = menu.style.display === 'none';
        closeGlobalFilterMenus(menu, null);
        setMenuOpen(nextState);
        if (nextState) positionGlobalFilterMenu(row, menu);
    });

    input.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        commitSave();
    });
    input.addEventListener('input', syncSaveButtonState);
    input.addEventListener('blur', function() {
        commitSave();
    });
    saveBtn.addEventListener('mousedown', function(e) {
        e.preventDefault();
    });
    saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        commitSave();
    });

    refreshMenu();
    dropdownWrap.appendChild(menu);
    wrap.appendChild(row);
    return wrap;
}

function createSkillsSearchLogicControl(activeRole, analysisType) {
    var ctx = getSkillsSearchPanelContext(activeRole, analysisType);
    if (!ctx) return null;

    var wrap = document.createElement('div');
    wrap.className = 'totals-top-filter-control skills-search-top-logic-control';

    var row = document.createElement('div');
    row.className = 'skills-search-logic-switch-row';

    var orLabel = document.createElement('span');
    orLabel.className = 'skills-search-logic-switch-label';
    orLabel.textContent = 'OR';
    row.appendChild(orLabel);

    var switchWrap = document.createElement('label');
    switchWrap.className = 'totals-ios-checkbox-wrap skills-search-logic-switch';
    switchWrap.setAttribute('aria-label', 'Переключить логику навыков OR/AND');

    var switchInput = document.createElement('input');
    switchInput.type = 'checkbox';
    switchInput.className = 'totals-ios-checkbox';

    var switchUi = document.createElement('span');
    switchUi.className = 'totals-ios-checkbox-ui';

    switchWrap.appendChild(switchInput);
    switchWrap.appendChild(switchUi);
    row.appendChild(switchWrap);

    var andLabel = document.createElement('span');
    andLabel.className = 'skills-search-logic-switch-label';
    andLabel.textContent = 'AND';
    row.appendChild(andLabel);

    function syncLogicUi(value) {
        var isAnd = value === 'and';
        switchInput.checked = isAnd;
        orLabel.classList.toggle('active', !isAnd);
        andLabel.classList.toggle('active', isAnd);
    }

    switchInput.addEventListener('change', function() {
        var selections = getSkillsSearchSelections(ctx.block);
        applySkillsSearchSkillState(
            ctx.block,
            selections.includeSkills || [],
            selections.excludeSkills || [],
            switchInput.checked ? 'and' : 'or'
        );
        syncLogicUi(switchInput.checked ? 'and' : 'or');
        updateSkillsSearchResults(ctx.block);
        syncSkillsSearchFilterEffects(activeRole);
    });

    syncLogicUi(ctx.selections.logic || 'or');
    wrap.appendChild(row);
    return wrap;
}

function createSkillsSearchSelectionControl(activeRole, analysisType, mode) {
    var ctx = getSkillsSearchPanelContext(activeRole, analysisType);
    if (!ctx) return null;
    var isExcludeMode = mode === 'exclude';
    var selectedItems = isExcludeMode ? (ctx.selections.excludeSkills || []) : (ctx.selections.includeSkills || []);
    var selectedKeys = new Set(selectedItems.map(function(item) { return normalizeSkillName(item); }));
    var selectedRank = {};
    selectedItems.forEach(function(item, idx) {
        selectedRank[normalizeSkillName(item)] = idx;
    });

    function syncSelectionSnapshot() {
        var selections = getSkillsSearchSelections(ctx.block);
        selectedItems = isExcludeMode ? (selections.excludeSkills || []).slice() : (selections.includeSkills || []).slice();
        selectedKeys = new Set(selectedItems.map(function(item) { return normalizeSkillName(item); }));
        selectedRank = {};
        selectedItems.forEach(function(item, idx) {
            selectedRank[normalizeSkillName(item)] = idx;
        });
    }

    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown skills-search-dropdown';
    wrap.dataset.filterKey = isExcludeMode ? 'skills-search-exclude' : 'skills-search-include';
    wrap.style.marginTop = '4px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = SHARED_FILTER_EXPANDED_WIDTH;
    wrap.style.width = SHARED_FILTER_EXPANDED_WIDTH;

    var caption = document.createElement('div');
    caption.className = 'shared-filter-field-label';
    caption.textContent = isExcludeMode ? 'Исключить навыки' : 'Навыки';
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
    menu.style.width = SHARED_FILTER_SKILLS_MENU_WIDTH;
    menu.style.maxWidth = 'calc(100vw - 48px)';

    var controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.flexWrap = 'wrap';
    controls.style.marginBottom = '2px';
    controls.style.padding = '4px 2px';

    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'tab-button skills-search-dropdown-item';
    allBtn.textContent = isExcludeMode ? '\u2212' : '\u2713';
    bindGlobalFilterTooltip(allBtn, isExcludeMode ? 'Исключить все навыки' : 'Выбрать все навыки');
    applyGlobalFilterIconButtonStyle(allBtn, false);
    allBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        syncSelectionSnapshot();
        var nextSkills = ctx.skills.map(function(item) { return item.skill; });
        applySkillsSearchSkillState(
            ctx.block,
            isExcludeMode ? [] : nextSkills,
            isExcludeMode ? nextSkills : [],
            getSkillsSearchSelections(ctx.block).logic || 'or'
        );
        updateSkillsSearchResults(ctx.block);
        syncSkillsSearchFilterEffects(activeRole);
        if (typeof scrollSharedFilterPanelToEnd === 'function') scrollSharedFilterPanelToEnd();
    });
    controls.appendChild(allBtn);

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'tab-button skills-search-dropdown-item';
    clearBtn.textContent = '\u21BA';
    bindGlobalFilterTooltip(clearBtn, isExcludeMode ? 'Сбросить исключения навыков' : 'Сбросить выбранные навыки');
    applyGlobalFilterIconButtonStyle(clearBtn, false);
    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        syncSelectionSnapshot();
        applySkillsSearchSkillState(
            ctx.block,
            isExcludeMode ? (getSkillsSearchSelections(ctx.block).includeSkills || []) : [],
            isExcludeMode ? [] : (getSkillsSearchSelections(ctx.block).excludeSkills || []),
            getSkillsSearchSelections(ctx.block).logic || 'or'
        );
        updateSkillsSearchResults(ctx.block);
        syncSkillsSearchFilterEffects(activeRole);
        if (typeof scrollSharedFilterPanelToEnd === 'function') scrollSharedFilterPanelToEnd();
    });
    controls.appendChild(clearBtn);
    menu.appendChild(controls);

    var search = document.createElement('input');
    search.type = 'text';
    search.className = 'global-filter-search';
    search.placeholder = 'Поиск навыка';
    search.style.width = '100%';
    search.style.boxSizing = 'border-box';
    search.style.marginBottom = '2px';
    search.style.marginLeft = '2px';
    search.style.marginRight = '2px';
    search.style.padding = '7px 10px';
    search.style.fontSize = '12px';
    menu.appendChild(search);

    function summarizeSelectedSkills() {
        if (!selectedItems.length) return isExcludeMode ? 'нет' : 'Выбрать навыки';
        if (selectedItems.length === 1) return selectedItems[0];
        return (isExcludeMode ? 'Исключено: ' : 'Выбрано: ') + selectedItems.length;
    }

    function reorderRows() {
        var rows = Array.from(menu.querySelectorAll('.global-filter-option-row'));
        rows.sort(function(a, b) {
            var aKey = normalizeSkillName(a.dataset.skillValue || '');
            var bKey = normalizeSkillName(b.dataset.skillValue || '');
            var aSelected = selectedKeys.has(aKey);
            var bSelected = selectedKeys.has(bKey);
            if (aSelected && bSelected) return (selectedRank[aKey] || 0) - (selectedRank[bKey] || 0);
            if (aSelected !== bSelected) return aSelected ? -1 : 1;
            var aCount = Number(a.dataset.skillCount || 0);
            var bCount = Number(b.dataset.skillCount || 0);
            return (bCount - aCount) || String(a.dataset.skillValue || '').localeCompare(String(b.dataset.skillValue || ''), 'ru');
        });
        rows.forEach(function(row) {
            menu.appendChild(row);
        });
    }

    function syncSelectedSkillsVisualState() {
        triggerLabel.textContent = summarizeSelectedSkills();
        Array.from(menu.querySelectorAll('.global-filter-option-row')).forEach(function(node) {
            var skillValue = String((node.dataset && node.dataset.skillValue) || '');
            var key = normalizeSkillName(skillValue);
            var labelNode = node.querySelector('.skills-search-filter-option-label');
            var countNode = node.querySelector('.skills-search-filter-option-count');
            var isSelected = selectedKeys.has(key);
            node.style.background = isSelected
                ? (isExcludeMode ? 'linear-gradient(135deg, #FF8A8A 0%, #FF6262 100%)' : 'transparent')
                : 'transparent';
            node.style.color = isSelected
                ? '#ffffff'
                : (document.body && document.body.classList.contains('report-dashboard') ? '#bcc5c9' : '#0f172a');
            node.style.border = '1px solid transparent';
            node.style.boxShadow = isSelected && isExcludeMode ? '0 10px 24px rgba(255, 98, 98, 0.18)' : 'none';
            if (labelNode) {
                labelNode.style.fontWeight = isSelected ? '600' : '400';
                labelNode.style.color = isSelected
                    ? '#ffffff'
                    : (document.body && document.body.classList.contains('report-dashboard') ? '#bcc5c9' : '#0f172a');
            }
            if (countNode) countNode.style.opacity = isSelected ? '1' : '0.72';
        });
        reorderRows();
    }

    ctx.skills.forEach(function(skillItem) {
        var displaySkill = registerSkillDisplayName(skillItem.skill);
        var row = document.createElement('div');
        row.className = 'skills-search-dropdown-item global-filter-option-row skills-search-filter-option';
        row.dataset.skillValue = displaySkill;
        row.dataset.skillCount = String(Number(skillItem.count) || 0);
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '1fr auto';
        row.style.gap = '8px';
        row.style.width = '100%';
        row.style.boxSizing = 'border-box';
        row.style.alignItems = 'center';
        row.style.marginBottom = '2px';
        row.style.padding = '7px 10px';
        row.style.borderRadius = '12px';
        row.style.cursor = 'pointer';
        row.title = '';
        row.addEventListener('click', function(e) {
            e.stopPropagation();
            syncSelectionSnapshot();
            toggleSkillsSearchSkillState(ctx.block, displaySkill, isExcludeMode ? 'exclude' : 'include');
            updateSkillsSearchResults(ctx.block);
            syncSkillsSearchFilterEffects(activeRole);
            if (typeof scrollSharedFilterPanelToEnd === 'function') scrollSharedFilterPanelToEnd();
        });

        var label = document.createElement('div');
        label.className = 'skills-search-filter-option-label';
        label.textContent = displaySkill;
        label.style.fontSize = '12px';
        label.style.whiteSpace = 'nowrap';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        row.appendChild(label);

        var count = document.createElement('div');
        count.className = 'skills-search-filter-option-count';
        count.textContent = '"' + (Number(skillItem.count) || 0) + '"';
        count.style.fontSize = '11px';
        count.style.whiteSpace = 'nowrap';
        row.appendChild(count);

        menu.appendChild(row);
    });

    search.addEventListener('input', function() {
        var q = String(search.value || '').trim().toLowerCase();
        Array.from(menu.querySelectorAll('.global-filter-option-row')).forEach(function(node) {
            var text = String(node.dataset.skillValue || '').trim().toLowerCase();
            node.style.display = !q || text.indexOf(q) >= 0 ? '' : 'none';
        });
    });

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var nextState = menu.style.display === 'none' ? 'block' : 'none';
        closeGlobalFilterMenus(menu, nextState === 'block' ? triggerArrow : null);
        menu.style.display = nextState;
        if (nextState === 'block') {
            syncSelectionSnapshot();
            syncSelectedSkillsVisualState();
            reorderRows();
            positionGlobalFilterMenu(trigger, menu);
        }
        triggerArrow.textContent = nextState === 'block' ? '\u25B4' : '\u25BE';
    });

    syncSelectionSnapshot();
    syncSelectedSkillsVisualState();
    wrap.appendChild(menu);
    return wrap;
}

function createTotalsTopFilterControl(activeRole, analysisType, forcedMode, controlOptions) {
    var currentAnalysis = String(analysisType || '').trim();
    if (!activeRole) return null;
    var opts = controlOptions || {};
    var dashboardMode = String(forcedMode || uiState.totals_dashboard_mode || 'overview').trim();
    var isTopMode = dashboardMode === 'top';
    var isMarketTrendsMode = dashboardMode === 'market-trends';
    if (!isTopMode && !isMarketTrendsMode) return null;

    var wrap = document.createElement('div');
    wrap.className = 'totals-top-filter-control';
    if (currentAnalysis === 'skills-search') wrap.classList.add('skills-search-top-limit-control');

    if (isTopMode) {
        var limitValue = normalizeTotalsTopLimit(uiState.totals_top_limit || 15);
        uiState.totals_top_limit = limitValue;

        var limitWrap = document.createElement('div');
        limitWrap.className = 'totals-top-filter-limit';

        var limitHead = document.createElement('div');
        limitHead.className = 'totals-top-filter-limit-head';

        var limitLabel = document.createElement('span');
        limitLabel.textContent = 'Топ';
        limitHead.appendChild(limitLabel);

        var limitBadge = document.createElement('strong');
        limitBadge.className = 'totals-top-filter-badge';
        limitBadge.textContent = 'Топ-' + limitValue;
        limitHead.appendChild(limitBadge);
        limitWrap.appendChild(limitHead);

        var limitControls = document.createElement('div');
        limitControls.className = 'totals-top-filter-limit-controls';

        var range = document.createElement('input');
        range.type = 'range';
        range.min = '15';
        range.max = '200';
        range.step = '1';
        range.value = String(limitValue);
        range.className = 'totals-top-filter-range';
        limitControls.appendChild(range);

        var numberInput = document.createElement('input');
        numberInput.type = 'number';
        numberInput.min = '15';
        numberInput.max = '200';
        numberInput.step = '1';
        numberInput.value = String(limitValue);
        numberInput.className = 'totals-top-filter-number';
        limitControls.appendChild(numberInput);
        limitWrap.appendChild(limitControls);
        wrap.appendChild(limitWrap);

        function updateRangeProgress(rawValue) {
            var min = Number(range.min) || 15;
            var max = Number(range.max) || 200;
            var current = normalizeTotalsTopLimit(rawValue);
            var percent = max > min ? ((current - min) * 100 / (max - min)) : 0;
            range.style.setProperty('--range-progress', percent + '%');
            return current;
        }

        function syncLimitPreview(rawValue) {
            var next = normalizeTotalsTopLimit(rawValue);
            range.value = String(next);
            numberInput.value = String(next);
            limitBadge.textContent = 'Топ-' + next;
            updateRangeProgress(next);
            return next;
        }

        function applyTopLimit(rawValue) {
            var next = syncLimitPreview(rawValue);
            if (uiState.totals_top_limit === next) return;
            uiState.totals_top_limit = next;
            if (typeof renderGlobalTotalsFiltered === 'function') renderGlobalTotalsFiltered(activeRole);
            if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(activeRole, activeRole && activeRole.dataset ? activeRole.dataset.activeAnalysis || '' : '');
        }

        range.addEventListener('input', function() {
            syncLimitPreview(range.value);
        });
        range.addEventListener('change', function() {
            applyTopLimit(range.value);
        });
        numberInput.addEventListener('input', function() {
            var rawValue = String(numberInput.value || '').trim();
            if (!rawValue) {
                limitBadge.textContent = 'Топ-' + uiState.totals_top_limit;
                range.value = String(uiState.totals_top_limit);
                updateRangeProgress(uiState.totals_top_limit);
                return;
            }
            var preview = normalizeTotalsTopLimit(rawValue);
            range.value = String(preview);
            limitBadge.textContent = 'Топ-' + preview;
            updateRangeProgress(preview);
        });
        numberInput.addEventListener('change', function() {
            applyTopLimit(numberInput.value);
        });
        numberInput.addEventListener('keydown', function(evt) {
            if (evt.key === 'Enter') {
                evt.preventDefault();
                applyTopLimit(numberInput.value);
            }
        });
        updateRangeProgress(limitValue);
    }

    if (!opts.hideCurrency) {
        var currencyWrap = document.createElement('div');
        currencyWrap.className = 'totals-top-filter-currency';

        var currencyLabel = document.createElement('div');
        currencyLabel.className = 'totals-top-filter-subtitle';
        currencyLabel.textContent = 'Валюта';
        currencyWrap.appendChild(currencyLabel);

        var currencyTabs = document.createElement('div');
        currencyTabs.className = 'totals-top-filter-chip-row';
        currencyWrap.appendChild(currencyTabs);

        var currencyStateKey = isMarketTrendsMode ? 'market_trends_currency' : 'totals_top_currency';
        var currentCurrency = normalizeTotalsCurrency(uiState[currencyStateKey] || 'RUR');
        uiState[currencyStateKey] = currentCurrency;
        var currencyButtons = [];
        ['RUR', 'USD', 'EUR'].forEach(function(currency) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'totals-top-filter-chip';
            button.textContent = currency;
            button.setAttribute('aria-pressed', currency === currentCurrency ? 'true' : 'false');
            if (currency === currentCurrency) button.classList.add('active');
            button.addEventListener('click', function() {
                if (uiState[currencyStateKey] === currency) return;
                uiState[currencyStateKey] = currency;
                currencyButtons.forEach(function(other) {
                    other.classList.toggle('active', other === button);
                    other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
                });
                if (typeof renderGlobalTotalsFiltered === 'function') renderGlobalTotalsFiltered(activeRole);
            });
            currencyButtons.push(button);
            currencyTabs.appendChild(button);
        });
        wrap.appendChild(currencyWrap);
    }

    if (isMarketTrendsMode) {
        var metricWrap = document.createElement('div');
        metricWrap.className = 'totals-top-filter-currency';

        var metricLabel = document.createElement('div');
        metricLabel.className = 'totals-top-filter-subtitle';
        metricLabel.textContent = 'Зарплата';
        metricWrap.appendChild(metricLabel);

        var metricTabs = document.createElement('div');
        metricTabs.className = 'totals-top-filter-chip-row';
        metricWrap.appendChild(metricTabs);

        var currentMetric = String(uiState.market_trends_salary_metric || 'avg').toLowerCase();
        if (['min', 'max', 'avg', 'median', 'mode'].indexOf(currentMetric) < 0) currentMetric = 'avg';
        uiState.market_trends_salary_metric = currentMetric;
        var metricButtons = [];
        [
            { value: 'min', label: 'Мин' },
            { value: 'avg', label: 'Средн' },
            { value: 'median', label: 'Медиана' },
            { value: 'mode', label: 'Мода' },
            { value: 'max', label: 'Макс' }
        ].forEach(function(metric) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'totals-top-filter-chip';
            button.textContent = metric.label;
            button.setAttribute('aria-pressed', metric.value === currentMetric ? 'true' : 'false');
            if (metric.value === currentMetric) button.classList.add('active');
            button.addEventListener('click', function() {
                if (uiState.market_trends_salary_metric === metric.value) return;
                uiState.market_trends_salary_metric = metric.value;
                metricButtons.forEach(function(other) {
                    other.classList.toggle('active', other === button);
                    other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
                });
                if (typeof renderGlobalTotalsFiltered === 'function') renderGlobalTotalsFiltered(activeRole);
            });
            metricButtons.push(button);
            metricTabs.appendChild(button);
        });
        wrap.appendChild(metricWrap);

    }

    return wrap;
}

function createSalaryMetricFilterControl(activeRole, analysisType) {
    if (!activeRole) return null;
    var currentAnalysis = String(analysisType || activeRole.dataset.activeAnalysis || '').replace(/-all$/, '');
    var stateKey = currentAnalysis === 'employer-analysis'
        ? 'totals_employer_salary_metric'
        : 'market_trends_salary_metric';
    var rerender = function() {
        if (currentAnalysis === 'employer-analysis') {
            if (typeof renderGlobalEmployerFiltered === 'function') renderGlobalEmployerFiltered(activeRole);
            return;
        }
        if (typeof renderGlobalTotalsFiltered === 'function') renderGlobalTotalsFiltered(activeRole);
    };

    var wrap = document.createElement('div');
    wrap.className = 'totals-top-filter-control';

    var metricWrap = document.createElement('div');
    metricWrap.className = 'totals-top-filter-currency';

    var metricLabel = document.createElement('div');
    metricLabel.className = 'totals-top-filter-subtitle';
    metricLabel.textContent = 'Зарплата';
    metricWrap.appendChild(metricLabel);

    var metricTabs = document.createElement('div');
    metricTabs.className = 'totals-top-filter-chip-row';
    metricWrap.appendChild(metricTabs);

    var currentMetric = String(uiState[stateKey] || 'avg').toLowerCase();
    if (['min', 'max', 'avg', 'median', 'mode'].indexOf(currentMetric) < 0) currentMetric = 'avg';
    uiState[stateKey] = currentMetric;
    var metricButtons = [];
    [
        { value: 'min', label: 'Мин' },
        { value: 'avg', label: 'Средн' },
        { value: 'median', label: 'Медиана' },
        { value: 'mode', label: 'Мода' },
        { value: 'max', label: 'Макс' }
    ].forEach(function(metric) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'totals-top-filter-chip';
        button.textContent = metric.label;
        button.setAttribute('aria-pressed', metric.value === currentMetric ? 'true' : 'false');
        if (metric.value === currentMetric) button.classList.add('active');
        button.addEventListener('click', function() {
            if (uiState[stateKey] === metric.value) return;
            uiState[stateKey] = metric.value;
            metricButtons.forEach(function(other) {
                other.classList.toggle('active', other === button);
                other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
            });
            rerender();
            if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(activeRole, analysisType, true);
        });
        metricButtons.push(button);
        metricTabs.appendChild(button);
    });
    wrap.appendChild(metricWrap);

    return wrap;
}

function createMarketTrendsExcludedRolesControl(activeRole, analysisType, forceVisible) {
    if (!activeRole) return null;
    if (!forceVisible && String(uiState.totals_dashboard_mode || 'overview').trim() !== 'market-trends') return null;

    var roleOptions = (typeof getRoleMetaList === 'function')
        ? getRoleMetaList().map(function(item) {
            return {
                value: String(item.index || ''),
                label: String(item.name || item.id || item.index || ''),
                roleId: String(item.id || '')
            };
        }).filter(function(item) { return !!item.value; })
        : ((typeof getGlobalFilterOptions === 'function')
            ? getGlobalFilterOptions(null, 'roles', null)
            : []);
    if (!Array.isArray(uiState.market_trends_excluded_roles)) uiState.market_trends_excluded_roles = [];

    var wrap = document.createElement('div');
    wrap.className = 'global-filter-dropdown skills-search-dropdown';
    wrap.dataset.filterKey = 'market-trends-excluded-roles';
    wrap.style.marginTop = '4px';
    wrap.style.flex = '0 0 auto';
    wrap.style.minWidth = SHARED_FILTER_EXPANDED_WIDTH;
    wrap.style.width = SHARED_FILTER_EXPANDED_WIDTH;

    var caption = document.createElement('div');
    caption.className = 'shared-filter-field-label';
    caption.textContent = 'Исключить роли';
    wrap.appendChild(caption);

    var getExcludedRoles = function() {
        var allowed = roleOptions.map(function(item) { return String(item.value || ''); });
        return uiState.market_trends_excluded_roles.filter(function(value) {
            return allowed.indexOf(String(value || '')) >= 0;
        });
    };
    var setExcludedRoles = function(nextValues) {
        uiState.market_trends_excluded_roles = Array.from(new Set((nextValues || []).map(function(value) {
            return String(value || '').trim();
        }).filter(Boolean)));
    };
    var getSearchQuery = function() {
        return String(uiState.market_trends_excluded_roles_query || '');
    };
    var setSearchQuery = function(nextValue) {
        uiState.market_trends_excluded_roles_query = String(nextValue || '');
        if (typeof setGlobalFilterSearchValue === 'function') {
            setGlobalFilterSearchValue('market-trends-excluded-roles', uiState.market_trends_excluded_roles_query, 'market_trends_excluded_roles_query');
        }
    };
    var summarizeExcludedRoles = function() {
        var selected = getExcludedRoles();
        if (!selected.length) return 'Не исключать';
        return 'Исключено: ' + selected.length;
    };

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
    triggerLabel.textContent = summarizeExcludedRoles();
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
    menu.style.width = SHARED_FILTER_SKILLS_MENU_WIDTH;
    menu.style.maxWidth = 'calc(100vw - 48px)';
    menu.style.maxHeight = '280px';
    menu.style.overflowY = 'auto';
    bindGlobalFilterMenuScrollLock(menu);
    menu.__host = wrap;

    var controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.flexWrap = 'wrap';
    controls.style.marginBottom = '2px';
    controls.style.padding = '4px 2px';

    var excludeAllBtn = document.createElement('button');
    excludeAllBtn.type = 'button';
    excludeAllBtn.className = 'tab-button skills-search-dropdown-item';
    excludeAllBtn.textContent = '\u2212';
    bindGlobalFilterTooltip(excludeAllBtn, 'Исключить все роли');
    applyGlobalFilterIconButtonStyle(excludeAllBtn, false);
    excludeAllBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        setExcludedRoles(roleOptions.map(function(item) { return item.value; }));
        uiState.market_trends_excluded_roles_pending_apply = true;
        syncExcludedRolesVisualState();
    });
    controls.appendChild(excludeAllBtn);

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'tab-button skills-search-dropdown-item';
    clearBtn.textContent = '\u21BA';
    bindGlobalFilterTooltip(clearBtn, 'Сбросить исключения');
    applyGlobalFilterIconButtonStyle(clearBtn, false);
    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        setExcludedRoles([]);
        uiState.market_trends_excluded_roles_pending_apply = true;
        syncExcludedRolesVisualState();
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
    search.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    search.addEventListener('keydown', function(e) {
        e.stopPropagation();
    });
    search.value = typeof getGlobalFilterSearchValue === 'function'
        ? getGlobalFilterSearchValue('market-trends-excluded-roles', 'market_trends_excluded_roles_query')
        : String(uiState.market_trends_excluded_roles_query || '');
    menu.appendChild(search);

    function getSelectedRanks(selected) {
        var ranks = {};
        (selected || []).forEach(function(value, idx) {
            ranks[String(value)] = idx;
        });
        return ranks;
    }

    function applySearchFilter() {
        if (typeof applyGlobalFilterSearch === 'function') {
            applyGlobalFilterSearch(menu, getSearchQuery(), '.global-filter-option-row[data-option-value]');
            return;
        }
        var q = String(getSearchQuery() || '').trim().toLowerCase();
        Array.from(menu.querySelectorAll('.global-filter-option-row[data-option-value]')).forEach(function(node) {
            var text = String(node.textContent || '').trim().toLowerCase();
            if (!q || text.indexOf(q) >= 0) {
                node.style.removeProperty('display');
            } else {
                node.style.setProperty('display', 'none', 'important');
            }
        });
    }

    function reorderRoleRows() {
        var selectedRoles = getExcludedRoles();
        var selectedRank = getSelectedRanks(selectedRoles);
        var rows = Array.from(menu.querySelectorAll('.global-filter-option-row[data-option-value]'));
        rows.sort(function(a, b) {
            var aValue = String(a.dataset.optionValue || '');
            var bValue = String(b.dataset.optionValue || '');
            var aSelected = Object.prototype.hasOwnProperty.call(selectedRank, aValue);
            var bSelected = Object.prototype.hasOwnProperty.call(selectedRank, bValue);
            if (aSelected && bSelected) return selectedRank[aValue] - selectedRank[bValue];
            if (aSelected !== bSelected) return aSelected ? -1 : 1;
            var aLabel = String(a.textContent || '').trim();
            var bLabel = String(b.textContent || '').trim();
            return aLabel.localeCompare(bLabel, 'ru');
        });
        rows.forEach(function(row) {
            menu.appendChild(row);
        });
    }

    function syncExcludedRolesVisualState() {
        var selected = getExcludedRoles();
        triggerLabel.textContent = summarizeExcludedRoles();
        Array.from(menu.querySelectorAll('.global-filter-option-row[data-option-value]')).forEach(function(node) {
            var value = String((node.dataset && node.dataset.optionValue) || '');
            var labelNode = node.querySelector('div');
            var isExcluded = selected.indexOf(value) >= 0;
            node.style.background = isExcluded ? 'linear-gradient(135deg, #FF8A8A 0%, #FF6262 100%)' : 'transparent';
            node.style.color = isExcluded ? '#ffffff' : (document.body && document.body.classList.contains('report-dashboard') ? '#bcc5c9' : '#0f172a');
            node.style.border = '1px solid transparent';
            node.style.boxShadow = isExcluded ? '0 10px 24px rgba(255, 98, 98, 0.18)' : 'none';
            if (labelNode) {
                labelNode.style.fontWeight = isExcluded ? '600' : '400';
                labelNode.style.color = isExcluded ? '#ffffff' : (document.body && document.body.classList.contains('report-dashboard') ? '#bcc5c9' : '#0f172a');
            }
        });
        reorderRoleRows();
        applySearchFilter();
    }

    roleOptions.forEach(function(option) {
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
        row.addEventListener('click', function(e) {
            e.stopPropagation();
            var selected = getExcludedRoles();
            var value = String(option.value || '');
            if (selected.indexOf(value) >= 0) {
                setExcludedRoles(selected.filter(function(item) { return item !== value; }));
            } else {
                selected.push(value);
                setExcludedRoles(selected);
            }
            uiState.market_trends_excluded_roles_pending_apply = true;
            syncExcludedRolesVisualState();
        });
        var label = document.createElement('div');
        label.textContent = option.label;
        label.style.fontSize = '12px';
        row.appendChild(label);
        menu.appendChild(row);
    });
    syncExcludedRolesVisualState();

    search.addEventListener('input', function() {
        setSearchQuery(search.value || '');
        applySearchFilter();
    });

    function openMenu() {
        uiState.market_trends_excluded_roles_keep_open = true;
        closeGlobalFilterMenus(menu, triggerArrow);
        menu.style.display = 'block';
        search.value = getSearchQuery();
        syncExcludedRolesVisualState();
        positionGlobalFilterMenu(trigger, menu);
        triggerArrow.textContent = '\u25B4';
        if (typeof search.focus === 'function') search.focus();
    }

    function bindOutsideClose() {
        if (wrap.__outsideCloseHandler) return;
        wrap.__outsideCloseHandler = function(evt) {
            if (!uiState.market_trends_excluded_roles_keep_open) return;
            if (wrap.contains(evt.target)) return;
            closeMenu();
        };
        document.addEventListener('click', wrap.__outsideCloseHandler, true);
    }

    function unbindOutsideClose() {
        if (!wrap.__outsideCloseHandler) return;
        document.removeEventListener('click', wrap.__outsideCloseHandler, true);
        wrap.__outsideCloseHandler = null;
    }

    function closeMenu() {
        uiState.market_trends_excluded_roles_keep_open = false;
        menu.style.display = 'none';
        if (typeof restoreGlobalFilterMenuHost === 'function') restoreGlobalFilterMenuHost(menu);
        triggerArrow.textContent = '\u25BE';
        unbindOutsideClose();
        if (uiState.market_trends_excluded_roles_pending_apply) {
            uiState.market_trends_excluded_roles_pending_apply = false;
            if (typeof renderGlobalTotalsFiltered === 'function') renderGlobalTotalsFiltered(activeRole);
        }
    }

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var nextState = menu.style.display === 'none' ? 'block' : 'none';
        if (nextState === 'block') {
            bindOutsideClose();
            openMenu();
        } else {
            closeMenu();
        }
    });

    wrap.appendChild(menu);
    menu.addEventListener('mouseleave', function() {
        if (!uiState.market_trends_excluded_roles_keep_open) return;
        closeMenu();
    });
    if (uiState.market_trends_excluded_roles_keep_open) {
        menu.style.display = 'block';
        search.value = getSearchQuery();
        syncExcludedRolesVisualState();
        positionGlobalFilterMenu(trigger, menu);
        triggerArrow.textContent = '\u25B4';
    }
    return wrap;
}

function buildSharedFilterGroup(parentRole, analysisType, label, buttons, extraBuilder) {
    var group = document.createElement('div');
    group.className = 'shared-filter-group';
    group.style.marginTop = '0';
    group.style.overflow = 'visible';

    var caption = document.createElement('div');
    caption.className = 'shared-filter-group-caption';
    caption.textContent = label;
    caption.style.fontSize = '11px';
    caption.style.fontWeight = '500';
    caption.style.marginBottom = '4px';
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
    if (quick) {
        var days = Number(quick[1]) || 0;
        var mod10 = days % 10;
        var mod100 = days % 100;
        var dayWord = (mod10 === 1 && mod100 !== 11) ? 'день' : (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14) ? 'дня' : 'дней');
        return 'За ' + String(days) + ' ' + dayWord;
    }
    return text;
}

function summarizeSelectedPeriodsLabel(selectedPeriods) {
    var labels = Array.isArray(selectedPeriods) ? selectedPeriods.filter(Boolean).map(function(v) { return formatPeriodSelectionValue(v); }).filter(Boolean) : [];
    if (!labels.length) return 'Весь период';
    var specificLabels = labels.filter(function(label) {
        return !(label === 'За период' || label === 'Весь период' || label === 'За все время');
    });
    if (!specificLabels.length) return 'Весь период';
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
    if (filterKey === 'roles') {
        var includeSeen = new Set();
        uiState.global_filters[filterKey].include = uiState.global_filters[filterKey].include.filter(function(value) {
            var normalized = String(value || '').trim();
            if (!normalized || includeSeen.has(normalized)) return false;
            includeSeen.add(normalized);
            return true;
        });
        var excludeSeen = new Set(uiState.global_filters[filterKey].include.map(function(value) {
            return String(value || '').trim();
        }));
        uiState.global_filters[filterKey].exclude = uiState.global_filters[filterKey].exclude.filter(function(value) {
            var normalized = String(value || '').trim();
            if (!normalized || excludeSeen.has(normalized)) return false;
            excludeSeen.add(normalized);
            return true;
        });
    }
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
    button.style.width = '34px';
    button.style.minWidth = '34px';
    button.style.height = '34px';
    button.style.minHeight = '34px';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.gap = '0';
    button.style.margin = '0';
    button.style.fontSize = '16px';
    button.style.lineHeight = '1';
    button.style.fontWeight = isActive ? '700' : '500';
    button.style.border = '0';
    button.style.background = isActive ? FILTER_SELECTED_GRADIENT : 'rgba(248, 250, 252, 0.92)';
    button.style.color = isActive ? '#ffffff' : '#475569';
    button.style.boxShadow = isActive ? '0 8px 18px rgba(0, 122, 216, 0.20)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.8)';
}
