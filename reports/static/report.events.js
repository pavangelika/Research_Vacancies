document.addEventListener('click', function(e) {
    var row = e.target.closest('.salary-row');
    if (!row) return;

    e.preventDefault();
    var contextHtml = buildRowContext(row);
    var withIds = [];
    var withoutIds = [];
    if (row._data && row._data.withIds) {
        withIds = row._data.withIds;
    } else {
        try {
            withIds = JSON.parse(row.dataset.vacanciesWithIds || '[]');
        } catch (_e) {
            withIds = [];
        }
    }
    if (row._data && row._data.withoutIds) {
        withoutIds = row._data.withoutIds;
    } else {
        try {
            withoutIds = JSON.parse(row.dataset.vacanciesWithoutIds || '[]');
        } catch (_e) {
            withoutIds = [];
        }
    }

    openVacancyModal(withIds, withoutIds, contextHtml);
});

document.addEventListener('click', function(e) {
    if (e.target.closest('.vacancy-modal-close')) {
        closeVacancyModal();
        return;
    }

    var backdrop = e.target.classList.contains('vacancy-modal-backdrop');
    if (backdrop) {
        closeVacancyModal();
        return;
    }

    var btn = e.target.closest('.vacancy-filter-btn');
    if (!btn) return;

    var container = btn.closest('.vacancy-details-container');
    if (!container) return;

    var filter = btn.dataset.filter;
    var withIds = [];
    var withoutIds = [];
    try {
        withIds = JSON.parse(container.dataset.withIds || '[]');
    } catch (_e) {
        withIds = [];
    }
    try {
        withoutIds = JSON.parse(container.dataset.withoutIds || '[]');
    } catch (_e) {
        withoutIds = [];
    }

    var allBtns = container.querySelectorAll('.vacancy-filter-btn');
    allBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    var ids = filter === 'with' ? withIds : withoutIds;
    var replaceTarget = container.querySelector('.vacancy-table-wrap, .vacancy-empty');
    if (replaceTarget) {
        replaceTarget.outerHTML = '<div class="vacancy-empty">Загрузка...</div>';
    }
    resolveVacancyListAsync(ids).then(list => {
        var target = container.querySelector('.vacancy-table-wrap, .vacancy-empty');
        if (target) {
            target.outerHTML = buildVacancyTableHtml(list);
        } else {
            container.innerHTML = container.innerHTML + buildVacancyTableHtml(list);
        }
    });
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeVacancyModal();
    }
});

document.addEventListener('click', function(e) {
    var row = e.target.closest('.activity-all-row');
    if (!row) return;
    var details = row.nextElementSibling;
    if (!details || !details.classList.contains('activity-all-details')) return;
    details.style.display = (details.style.display === 'none' || details.style.display === '') ? 'table-row' : 'none';
});

document.addEventListener('click', function(e) {
    var chip = e.target.closest('.role-filter-chip');
    if (!chip) return;

    var allRoles = document.getElementById('role-all');
    if (!allRoles) return;

    chip.classList.toggle('active');
    var chips = Array.from(allRoles.querySelectorAll('.role-filter-chip'));
    var excluded = chips.filter(c => !c.classList.contains('active')).map(c => c.dataset.role);
    uiState.all_roles_excluded = excluded;

    renderAllRolesContainer(allRoles, getAllRoleContents());
});

document.addEventListener('click', function(e) {
    var toggle = e.target.closest('.all-roles-role-filter-toggle');
    if (!toggle) return;
    var container = toggle.closest('.all-roles-role-filter');
    if (!container) return;
    container.classList.toggle('collapsed');
    var expanded = !container.classList.contains('collapsed');
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggle.textContent = expanded ? '▴' : '▾';
});

// ---------- Обработчик кликов по иконкам режимов ----------
document.addEventListener('click', function(e) {
    var btn = e.target.closest('.view-mode-btn, .view-mode-button');
    if (!btn) return;

    var container = btn.closest('.month-content, .weekday-content, .monthly-skills-exp-content, .salary-exp-content, .all-roles-period-content');
    if (!container) return;

    var analysisType = null;
    if (container.classList.contains('month-content')) analysisType = 'activity';
    else if (container.classList.contains('weekday-content')) analysisType = 'weekday';
    else if (container.classList.contains('monthly-skills-exp-content')) analysisType = 'skills-monthly';
    else if (container.classList.contains('salary-exp-content')) analysisType = 'salary';
    else if (container.classList.contains('all-roles-period-content')) {
        var a = container.dataset.analysis || '';
        if (a.indexOf('activity') === 0) analysisType = 'activity';
        else if (a.indexOf('weekday') === 0) analysisType = 'weekday';
        else if (a.indexOf('skills') === 0) analysisType = 'skills-monthly';
        else if (a.indexOf('salary') === 0) analysisType = 'salary';
    }

    if (!analysisType) return;

    var mode = btn.dataset.view;
    if (analysisType === 'activity') uiState.activity_view_mode = mode;
    else if (analysisType === 'weekday') uiState.weekday_view_mode = mode;
    else if (analysisType === 'skills-monthly') uiState.skills_monthly_view_mode = mode;
    else if (analysisType === 'salary') uiState.salary_view_mode = mode;

    var allBtns = container.querySelectorAll('.view-mode-btn, .view-mode-button');
    setActiveViewButton(allBtns, mode);

    if (analysisType === 'salary') {
        var expData = (container._data && container._data.exp) ? container._data.exp : parseJsonDataset(container, 'exp', {});
        applySalaryViewMode(container, expData.entries);
        return;
    }

    if (container.dataset.analysis === 'activity-all') {
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        if (mode === 'graph') {
            var rows = parseJsonDataset(container, 'entries', []);
            var mainId = container.dataset.graphMain;
            var ageId = container.dataset.graphAge;
            if (mainId && ageId) buildAllRolesActivityChart(rows, mainId, ageId);
        }
        return;
    }

    if (container.dataset.analysis === 'weekday-all') {
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        if (mode === 'graph') {
            var rows = parseJsonDataset(container, 'entries', []);
            var graphId = container.dataset.graphId;
            if (graphId) buildAllRolesWeekdayChart(rows, graphId);
        }
        return;
    }

    if (container.dataset.analysis === 'skills-monthly-all') {
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        if (mode === 'graph') {
            var rows = parseJsonDataset(container, 'entries', []);
            var graphId = container.dataset.graphId;
            if (graphId) buildAllRolesSkillsChart(rows, graphId);
        }
        return;
    }

    if (container.dataset.analysis === 'salary-all') {
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        if (mode === 'graph') {
            var rows = parseJsonDataset(container, 'entries', []);
            var graphId = container.dataset.graphId;
            if (graphId) buildAllRolesSalaryChart(rows, graphId);
        }
        return;
    }

    var viewContainer = container.querySelector('.view-mode-container');
    applyViewMode(viewContainer, mode);
});

// ---------- Инициализация ----------
document.addEventListener("DOMContentLoaded", function() {
    var buttons = Array.from(document.getElementsByClassName("role-button"));
    var multiToggle = document.getElementById('multi-role-toggle');
    var selector = document.getElementById('role-selector');
    var selectorToggle = document.getElementById('role-selector-toggle');
    var clearBtn = document.getElementById('role-selection-clear');
    var allRolesToggle = document.getElementById('all-roles-toggle');
    if (buttons.length === 0) return;

    var selected = new Set([buttons[0].dataset.roleIndex]);
    var selectionOrder = [buttons[0].dataset.roleIndex];
    updateRoleSelectionUI(selected);
    updateRoleView(selected);

    function collapseRoleSelector() {
        if (!selector) return;
        selector.classList.add('collapsed');
        if (selectorToggle) selectorToggle.setAttribute('aria-expanded', 'false');
    }

    function enforceSingle(idx) {
        selected = new Set([idx]);
        selectionOrder = [idx];
        updateRoleSelectionUI(selected);
        updateRoleView(selected);
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var idx = btn.dataset.roleIndex;
            if (multiToggle && multiToggle.checked) {
                var next = new Set(selected);
                if (next.has(idx)) next.delete(idx);
                else next.add(idx);
                if (next.size === 0) next.add(idx);
                selected = next;
                if (next.has(idx) && !selectionOrder.includes(idx)) {
                    selectionOrder.push(idx);
                } else if (!next.has(idx)) {
                    selectionOrder = selectionOrder.filter(x => x !== idx);
                }
                updateRoleSelectionUI(selected);
                updateRoleView(selected);
            } else {
                enforceSingle(idx);
            }
        });
    });

    if (multiToggle) {
        multiToggle.addEventListener('change', function() {
            if (!multiToggle.checked) {
                enforceSingle(Array.from(selected)[0] || buttons[0].dataset.roleIndex);
            } else {
                updateRoleSelectionUI(selected);
                updateRoleView(selected);
                if (selector) {
                    selector.classList.remove('collapsed');
                    if (selectorToggle) selectorToggle.setAttribute('aria-expanded', 'true');
                }
            }
        });
    }

    if (selectorToggle && selector) {
        selectorToggle.addEventListener('click', function() {
            selector.classList.toggle('collapsed');
            var expanded = !selector.classList.contains('collapsed');
            selectorToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });
    }

    if (allRolesToggle) {
        allRolesToggle.addEventListener('click', function() {
            uiState.all_roles_active = !uiState.all_roles_active;
            allRolesToggle.setAttribute('aria-pressed', uiState.all_roles_active ? 'true' : 'false');
            if (selector) {
                if (uiState.all_roles_active) {
                    selector.classList.add('collapsed');
                    if (selectorToggle) selectorToggle.setAttribute('aria-expanded', 'false');
                } else {
                    selector.classList.remove('collapsed');
                    if (selectorToggle) selectorToggle.setAttribute('aria-expanded', 'true');
                }
            }
            updateRoleView(selected);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            var firstSelected = selectionOrder[0] || buttons[0].dataset.roleIndex;
            selected = new Set([firstSelected]);
            selectionOrder = [firstSelected];
            updateRoleSelectionUI(selected);
            updateRoleView(selected);
        });
    }

    addSummaryTabs(document);
});

