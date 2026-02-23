document.addEventListener('click', function(e) {
    var row = e.target.closest('.salary-row');
    if (!row) return;

    e.preventDefault();
    var contextHtml = buildRowContext(row);
    var withList = [];
    var withoutList = [];
    if (row._data && row._data.withList) {
        withList = row._data.withList;
    } else {
        try {
            withList = JSON.parse(row.dataset.vacanciesWith || '[]');
        } catch (_e) {
            withList = [];
        }
    }
    if (row._data && row._data.withoutList) {
        withoutList = row._data.withoutList;
    } else {
        try {
            withoutList = JSON.parse(row.dataset.vacanciesWithout || '[]');
        } catch (_e) {
            withoutList = [];
        }
    }

    openVacancyModal(withList, withoutList, contextHtml);
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
    var withList = [];
    var withoutList = [];
    try {
        withList = JSON.parse(container.dataset.with || '[]');
    } catch (_e) {
        withList = [];
    }
    try {
        withoutList = JSON.parse(container.dataset.without || '[]');
    } catch (_e) {
        withoutList = [];
    }

    var allBtns = container.querySelectorAll('.vacancy-filter-btn');
    allBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    var list = filter === 'with' ? withList : withoutList;
    var replaceTarget = container.querySelector('.vacancy-table-wrap, .vacancy-empty');
    if (replaceTarget) {
        replaceTarget.outerHTML = buildVacancyTableHtml(list);
    } else {
        container.innerHTML = container.innerHTML + buildVacancyTableHtml(list);
    }
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
        if ((container.dataset.analysis || '').indexOf('activity') === 0) analysisType = 'activity';
    }

    if (!analysisType) return;

    var mode = btn.dataset.view;
    // Сохраняем режим в uiState
    if (analysisType === 'activity') uiState.activity_view_mode = mode;
    else if (analysisType === 'weekday') uiState.weekday_view_mode = mode;
    else if (analysisType === 'skills-monthly') uiState.skills_monthly_view_mode = mode;
    else if (analysisType === 'salary') uiState.salary_view_mode = mode;

    // Обновляем активный класс у всех кнопок в этом контейнере
    var allBtns = container.querySelectorAll('.view-mode-btn, .view-mode-button');
    setActiveViewButton(allBtns, mode);

    // Применяем режим
    if (analysisType === 'salary') {
        // Для зарплат данные берутся из dataset.exp
        var expData = (container._data && container._data.exp) ? container._data.exp : parseJsonDataset(container, 'exp', {});
        applySalaryViewMode(container, expData.entries);
    } else if (container.dataset.analysis === 'activity-all') {
        var mode = btn.dataset.view;
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        if (mode === 'graph') {
            var rows = parseJsonDataset(container, 'entries', []);
            var mainId = container.dataset.graphMain;
            var ageId = container.dataset.graphAge;
            if (mainId && ageId) buildAllRolesActivityChart(rows, mainId, ageId);
        }
    } else {
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
    }
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
        collapseRoleSelector();
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
