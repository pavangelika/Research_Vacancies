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
        body.style.flexWrap = 'wrap';
        body.style.alignItems = 'flex-start';
        body.style.gap = '6px';
        body.style.width = '100%';
        body.style.maxWidth = '100%';
        body.style.overflowX = 'visible';
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

function createMyResponsesFilterControl(activeRole, analysisType) {
    if (!activeRole || String(analysisType || '') !== 'my-responses') return null;

    var wrap = document.createElement('div');
    wrap.className = 'totals-top-filter-control my-responses-filter-control';

    var caption = document.createElement('div');
    caption.className = 'totals-top-filter-title';
    caption.textContent = 'Фильтры откликов';
    wrap.appendChild(caption);

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

function createTotalsTopFilterControl(activeRole, analysisType) {
    if (!activeRole || String(analysisType || '') !== 'totals') return null;
    var dashboardMode = String(uiState.totals_dashboard_mode || 'overview').trim();
    var isTopMode = dashboardMode === 'top';
    var isMarketTrendsMode = dashboardMode === 'market-trends';
    if (!isTopMode && !isMarketTrendsMode) return null;

    var wrap = document.createElement('div');
    wrap.className = 'totals-top-filter-control';

    var caption = document.createElement('div');
    caption.className = 'totals-top-filter-title';
    caption.textContent = isMarketTrendsMode ? 'Фильтры трендов' : 'Фильтры топа';
    wrap.appendChild(caption);

    if (isTopMode) {
        var limitValue = normalizeTotalsTopLimit(uiState.totals_top_limit || 15);
        uiState.totals_top_limit = limitValue;

        var limitWrap = document.createElement('div');
        limitWrap.className = 'totals-top-filter-limit';

        var limitHead = document.createElement('div');
        limitHead.className = 'totals-top-filter-limit-head';

        var limitLabel = document.createElement('span');
        limitLabel.textContent = 'Размер топа';
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

        var currentMetric = String(uiState.market_trends_salary_metric || 'median').toLowerCase();
        if (['min', 'max', 'avg', 'median', 'mode'].indexOf(currentMetric) < 0) currentMetric = 'median';
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

function createMarketTrendsExcludedRolesControl(activeRole, analysisType) {
    if (!activeRole || String(analysisType || '') !== 'totals') return null;
    if (String(uiState.totals_dashboard_mode || 'overview').trim() !== 'market-trends') return null;

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
    wrap.style.minWidth = '280px';
    wrap.style.width = '280px';

    var caption = document.createElement('div');
    caption.textContent = 'Исключить роли';
    caption.style.fontSize = '10px';
    caption.style.fontWeight = '600';
    caption.style.marginBottom = '4px';
    caption.style.color = '#94a3b8';
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
    var summarizeExcludedRoles = function() {
        var selected = getExcludedRoles();
        if (!selected.length) return 'Не исключать';
        if (selected.length === 1) {
            var item = roleOptions.find(function(option) { return String(option.value || '') === selected[0]; });
            return item ? item.label : '1 роль';
        }
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
    menu.style.width = '280px';
    menu.style.maxWidth = 'calc(100vw - 48px)';
    menu.style.maxHeight = '280px';
    menu.style.overflowY = 'auto';
    bindGlobalFilterMenuScrollLock(menu);

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
        syncExcludedRolesVisualState();
        if (typeof renderGlobalTotalsFiltered === 'function') renderGlobalTotalsFiltered(activeRole);
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
        syncExcludedRolesVisualState();
        if (typeof renderGlobalTotalsFiltered === 'function') renderGlobalTotalsFiltered(activeRole);
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

    function syncExcludedRolesVisualState() {
        var selected = getExcludedRoles();
        triggerLabel.textContent = summarizeExcludedRoles();
        Array.from(menu.querySelectorAll('.global-filter-option-row')).forEach(function(node) {
            var value = String((node.dataset && node.dataset.optionValue) || '');
            var labelNode = node.querySelector('div');
            var isExcluded = selected.indexOf(value) >= 0;
            node.style.background = isExcluded ? '#fee2e2' : 'transparent';
            node.style.color = isExcluded ? '#991b1b' : '#0f172a';
            node.style.border = isExcluded ? '1px solid rgba(239, 68, 68, 0.18)' : '1px solid transparent';
            if (labelNode) {
                labelNode.style.fontWeight = isExcluded ? '600' : '400';
                labelNode.style.color = isExcluded ? '#991b1b' : '#0f172a';
            }
        });
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
            syncExcludedRolesVisualState();
            if (typeof renderGlobalTotalsFiltered === 'function') renderGlobalTotalsFiltered(activeRole);
        });
        var label = document.createElement('div');
        label.textContent = option.label;
        label.style.fontSize = '12px';
        row.appendChild(label);
        menu.appendChild(row);
    });
    syncExcludedRolesVisualState();

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
        if (nextState === 'block') {
            positionGlobalFilterMenu(trigger, menu);
            triggerArrow.textContent = '\u25B4';
        } else {
            restoreGlobalFilterMenuHost(menu);
            triggerArrow.textContent = '\u25BE';
        }
    });

    wrap.appendChild(menu);
    menu.__host = wrap;
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
    button.style.width = '34px';
    button.style.minWidth = '34px';
    button.style.height = '34px';
    button.style.minHeight = '34px';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.gap = '0';
    button.style.margin = '0';
    button.style.border = '1px solid ' + (isActive ? 'rgba(59, 130, 246, 0.26)' : 'rgba(148, 163, 184, 0.22)');
    button.style.background = isActive ? 'rgba(239, 246, 255, 0.92)' : 'rgba(248, 250, 252, 0.92)';
    button.style.color = isActive ? '#2563eb' : '#475569';
    button.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.8)';
}




