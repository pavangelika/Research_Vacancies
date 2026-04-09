// ---------- Переключение типов анализа ----------
function resolveAnalysisType(analysisId) {
    if (analysisId.indexOf('detail-') === 0) return 'detail-analysis';
    if (analysisId.includes('activity')) return 'activity';
    if (analysisId.includes('weekday')) return 'weekday';
    if (analysisId.includes('skills-monthly')) return 'skills-monthly';
    if (analysisId.includes('skills-search')) return 'skills-search';
    if (analysisId.includes('responses-calendar')) return 'responses-calendar';
    if (analysisId.includes('my-responses')) return 'my-responses';
    if (analysisId.includes('totals')) return 'totals';
    if (analysisId.includes('salary')) return 'salary';
    if (analysisId.includes('employer-analysis')) return 'employer-analysis';
    return '';
}
function isDetailAnalysisType(analysisType) {
    return analysisType === 'activity'
        || analysisType === 'weekday'
        || analysisType === 'skills-monthly'
        || analysisType === 'salary'
        || analysisType === 'employer-analysis';
}
function syncDetailAnalysisUi(parentRole, analysisType) {
    if (!parentRole) return;
    if (typeof ensureDetailAnalysisGroup === 'function') ensureDetailAnalysisGroup(parentRole);
    var detailTabs = parentRole.querySelector('.tabs.detail-analysis-tabs');
    if (detailTabs) {
        detailTabs.style.display = isDetailAnalysisType(analysisType) ? 'flex' : 'none';
    }
    var detailMainBtn = parentRole.querySelector('.tabs.analysis-tabs .analysis-button[data-analysis-id^="detail-"]');
    if (detailMainBtn) {
        detailMainBtn.classList.toggle('active', isDetailAnalysisType(analysisType));
    }
    if (isDetailAnalysisType(analysisType)) {
        parentRole.dataset.lastDetailAnalysisType = analysisType;
    }
}
function getAnalysisSwitchBlocks(parentRole) {
    return {
        activityBlocks: parentRole.querySelectorAll('.activity-only'),
        weekdayBlock: parentRole.querySelector('.weekday-content'),
        skillsMonthlyBlock: parentRole.querySelector('.skills-monthly-content'),
        skillsSearchBlock: parentRole.querySelector('.skills-search-content'),
        myResponsesBlock: parentRole.querySelector('.my-responses-content'),
        responsesCalendarBlock: parentRole.querySelector('.response-calendar-content'),
        totalsBlock: parentRole.querySelector('.totals-content'),
        salaryBlock: parentRole.querySelector('.salary-content'),
        employerAnalysisBlock: parentRole.querySelector('.employer-analysis-content')
    };
}
function hideAllAnalysisBlocks(blocks) {
    blocks.activityBlocks.forEach(function(block) { block.style.display = 'none'; });
    if (blocks.weekdayBlock) blocks.weekdayBlock.style.display = 'none';
    if (blocks.skillsMonthlyBlock) blocks.skillsMonthlyBlock.style.display = 'none';
    if (blocks.skillsSearchBlock) blocks.skillsSearchBlock.style.display = 'none';
    if (blocks.myResponsesBlock) blocks.myResponsesBlock.style.display = 'none';
    if (blocks.responsesCalendarBlock) blocks.responsesCalendarBlock.style.display = 'none';
    if (blocks.totalsBlock) blocks.totalsBlock.style.display = 'none';
    if (blocks.salaryBlock) blocks.salaryBlock.style.display = 'none';
    if (blocks.employerAnalysisBlock) blocks.employerAnalysisBlock.style.display = 'none';
}
function isAllRolesContainerId(roleId) {
    return roleId === 'role-all';
}
function isCombinedContainerWithoutActivityTabs(parentRole, roleId) {
    if (roleId !== 'role-combined') return false;
    return !parentRole.querySelector('.activity-month-tabs .month-button, .tabs.month-tabs.activity-only .month-button');
}
function handleActivityAnalysisSwitch(ctx) {
    var parentRole = ctx.parentRole;
    var roleId = ctx.roleId;
    var activityBlocks = ctx.blocks.activityBlocks;
    activityBlocks.forEach(function(block) { block.style.display = 'block'; });
    normalizeActivityControls(parentRole);
    if (isAllRolesContainerId(roleId)) {
        restoreAllRolesPeriodState(parentRole, 'activity');
        return;
    }
    if (isCombinedContainerWithoutActivityTabs(parentRole, roleId)) {
        var combinedBlock = activityBlocks[0];
        if (!combinedBlock) return;
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
        return;
    }
    restoreActivityState(parentRole, roleId);
}
function handleWeekdayAnalysisSwitch(ctx) {
    var parentRole = ctx.parentRole;
    var roleId = ctx.roleId;
    var weekdayBlock = ctx.blocks.weekdayBlock;
    if (!weekdayBlock) return;
    weekdayBlock.style.display = 'block';
    normalizeWeekdayControls(parentRole);
    if (isAllRolesContainerId(roleId)) {
        restoreAllRolesPeriodState(parentRole, 'weekday');
        return;
    }
    var weekdays = parseJsonDataset(weekdayBlock, 'weekdays', []);
    var tableWrap = weekdayBlock.querySelector('.table-container');
    if (tableWrap) tableWrap.innerHTML = buildWeekdayTableHtml(weekdays || []);
    var viewBtns = weekdayBlock.querySelectorAll('.view-mode-btn');
    setActiveViewButton(viewBtns, uiState.weekday_view_mode);
    applyViewMode(weekdayBlock.querySelector('.view-mode-container'), uiState.weekday_view_mode);
    var weekdayPeriods = getResolvedGlobalFilterValues('periods', getGlobalFilterOptions(parentRole, 'periods', 'weekday'));
    var roleSuffix = (ctx.analysisId.split('-')[1] || '');
    var weekdayGraphId = 'weekday-graph-' + roleSuffix;
    buildWeekdayBarChart(roleSuffix, weekdayBlock);
    applyChartTitleContext(weekdayGraphId, 'Распределение по дням недели', buildChartContextLabel(resolveChartPeriodLabel(weekdayPeriods), null));
    applyWeekdayModeSizing(weekdayBlock.querySelector('.view-mode-container'), uiState.weekday_view_mode);
}
function handleSkillsMonthlyAnalysisSwitch(ctx) {
    var parentRole = ctx.parentRole;
    var roleId = ctx.roleId;
    var skillsMonthlyBlock = ctx.blocks.skillsMonthlyBlock;
    if (!skillsMonthlyBlock) return;
    skillsMonthlyBlock.style.display = 'block';
    normalizeSkillsMonthlyControls(parentRole);
    if (!isAllRolesContainerId(roleId)) {
        restoreSkillsMonthlyState(parentRole, roleId);
        return;
    }
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
            (visibleSkillsPeriod.dataset && visibleSkillsPeriod.dataset.period) || '',
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
}
function handleSkillsSearchAnalysisSwitch(ctx) {
    var skillsSearchBlock = ctx.blocks.skillsSearchBlock;
    if (!skillsSearchBlock) return;
    skillsSearchBlock.style.display = 'block';
    initSkillsSearch(ctx.parentRole);
}
function handleMyResponsesAnalysisSwitch(ctx) {
    var myResponsesBlock = ctx.blocks.myResponsesBlock;
    if (!myResponsesBlock) return;
    myResponsesBlock.style.display = 'block';
    renderMyResponsesContent(ctx.parentRole);
}
function handleResponsesCalendarAnalysisSwitch(ctx) {
    var calendarBlock = ctx.blocks.responsesCalendarBlock;
    if (!calendarBlock) return;
    calendarBlock.style.display = 'block';
    renderMyResponsesCalendarContent(ctx.parentRole);
}
function handleTotalsAnalysisSwitch(ctx) {
    var totalsBlock = ctx.blocks.totalsBlock;
    if (!totalsBlock) return;
    totalsBlock.style.display = 'block';
    totalsBlock.innerHTML = '<div class="skills-search-hint">Загрузка итогов...</div>';
    requestAnimationFrame(function() {
        try {
            renderGlobalTotalsFiltered(ctx.parentRole);
        } catch (err) {
            console.error('renderGlobalTotalsFiltered failed', err);
            var msg = (err && err.message) ? String(err.message) : 'unknown_error';
            totalsBlock.innerHTML = '<div class="skills-search-hint">Не удалось загрузить дашборд: ' + escapeHtml(msg) + '</div>';
        }
    });
}
function handleSalaryAnalysisSwitch(ctx) {
    var parentRole = ctx.parentRole;
    var roleId = ctx.roleId;
    var salaryBlock = ctx.blocks.salaryBlock;
    if (!salaryBlock) return;
    salaryBlock.style.display = 'block';
    normalizeSalaryControls(parentRole);
    if (isAllRolesContainerId(roleId)) restoreAllRolesPeriodState(parentRole, 'salary');
    else restoreSalaryState(parentRole, roleId);
    applySalaryStatusIcons(parentRole);
}
function handleEmployerAnalysisSwitch(ctx) {
    var employerAnalysisBlock = ctx.blocks.employerAnalysisBlock;
    if (!employerAnalysisBlock) return;
    employerAnalysisBlock.style.display = 'block';
    initEmployerAnalysisFilter(employerAnalysisBlock);
}
function scheduleAnalysisUiRefresh(parentRole, analysisType) {
    if (!parentRole) return;
    var cancel = (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function')
        ? window.cancelAnimationFrame.bind(window)
        : function(handle) { clearTimeout(handle); };
    var request = (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function')
        ? window.requestAnimationFrame.bind(window)
        : function(callback) { return setTimeout(callback, 0); };
    if (parentRole.__analysisUiRefreshHandle) {
        cancel(parentRole.__analysisUiRefreshHandle);
    }
    parentRole.__analysisUiRefreshHandle = request(function() {
        parentRole.__analysisUiRefreshHandle = 0;
        if (!parentRole || !parentRole.isConnected) return;
        if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(parentRole, analysisType, true);
        if (typeof updateViewToggleIcons === 'function') updateViewToggleIcons(parentRole);
    });
}
var ANALYSIS_SWITCH_HANDLERS = {
    'activity': handleActivityAnalysisSwitch,
    'weekday': handleWeekdayAnalysisSwitch,
    'skills-monthly': handleSkillsMonthlyAnalysisSwitch,
    'skills-search': handleSkillsSearchAnalysisSwitch,
    'my-responses': handleMyResponsesAnalysisSwitch,
    'responses-calendar': handleResponsesCalendarAnalysisSwitch,
    'totals': handleTotalsAnalysisSwitch,
    'salary': handleSalaryAnalysisSwitch,
    'employer-analysis': handleEmployerAnalysisSwitch
};
function switchAnalysis(evt, analysisId) {
    var parentRole = evt.currentTarget.closest('.role-content');
    var analysisType = resolveAnalysisType(analysisId);
    if (parentRole && parentRole.dataset.activeAnalysis === analysisType && evt.currentTarget.classList.contains('active')) {
        return;
    }
    ensureMyResponsesTab(parentRole);
    if (typeof ensureResponseCalendarTab === 'function') ensureResponseCalendarTab(parentRole);
    ensureTotalsTab(parentRole);
    var roleId = parentRole.id;
    var analysisButtons = parentRole.getElementsByClassName("analysis-button");
    for (var i = 0; i < analysisButtons.length; i++) {
        analysisButtons[i].className = analysisButtons[i].className.replace(" active", "");
    }
    evt.currentTarget.className += " active";

    var blocks = getAnalysisSwitchBlocks(parentRole);
    uiState.global_analysis_type = analysisType;
    uiState[getAnalysisStateKey(roleId)] = analysisType;
    hideAllAnalysisBlocks(blocks);

    var handler = ANALYSIS_SWITCH_HANDLERS[analysisType];
    if (handler) {
        handler({
            parentRole: parentRole,
            roleId: roleId,
            analysisId: analysisId,
            analysisType: analysisType,
            blocks: blocks
        });
    }

    parentRole.dataset.activeAnalysis = analysisType || '';
    syncDetailAnalysisUi(parentRole, analysisType);
    scheduleAnalysisUiRefresh(parentRole, analysisType);
}

function switchFromSummaryToAnalysis(analysisType) {
    function findTargetButton(roleContent) {
        if (!roleContent) return null;
        return Array.from(roleContent.querySelectorAll('.analysis-button')).find(function(btn) {
            var id = btn.dataset.analysisId || '';
            return id.indexOf(analysisType + '-') === 0;
        }) || null;
    }
    function exitSummaryMode(ctx, selected, preferredOrder) {
        if (!ctx) {
            setSummaryModeActive(false);
            return;
        }
        if (typeof ctx.exitAllRolesMode === 'function') {
            ctx.exitAllRolesMode(new Set(selected), preferredOrder);
            return;
        }
        if (typeof ctx.applySelection === 'function') {
            ctx.applySelection(new Set(selected), preferredOrder);
        }
        setSummaryModeActive(false);
    }

    var ctx = uiState.roleSelectionContext;
    var targetRole = null;
    var targetButton = null;
    if (ctx && typeof ctx.getOrder === 'function') {
        var order = ctx.getOrder();
        var selected = typeof ctx.getSelected === 'function' ? Array.from(ctx.getSelected()) : [];
        var preferredOrder = order.length ? order.slice() : selected.slice();
        var first = preferredOrder[0];
        if (first !== undefined && first !== null) {
            exitSummaryMode(ctx, selected, preferredOrder);
            targetRole = getActiveRoleContent();
            targetButton = findTargetButton(targetRole);
        }
    }

    if (!targetButton) {
        setSummaryModeActive(false);
        targetRole = getActiveRoleContent();
        targetButton = findTargetButton(targetRole);
    }

    if (targetButton) {
        targetButton.click();
        if (typeof applyGlobalFiltersToActiveAnalysis === 'function') {
            var activeRole = getActiveRoleContent();
            if (activeRole) applyGlobalFiltersToActiveAnalysis(activeRole, analysisType);
        }
    }
}


