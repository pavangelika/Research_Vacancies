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
    var empBtn = e.target.closest('.employer-link');
    if (empBtn) {
        e.preventDefault();
        openEmployerModal({
            name: empBtn.dataset.employer || '',
            accredited: empBtn.dataset.accredited || '',
            rating: empBtn.dataset.rating || '',
            trusted: empBtn.dataset.trusted || '',
            url: empBtn.dataset.url || ''
        });
        return;
    }

    if (e.target.closest('.vacancy-modal-close')) {
        closeVacancyModal();
        return;
    }
    if (e.target.closest('.employer-modal-close')) {
        closeEmployerModal();
        return;
    }

    var backdrop = e.target.classList.contains('vacancy-modal-backdrop');
    if (backdrop) {
        closeVacancyModal();
        return;
    }
    var empBackdrop = e.target.classList.contains('employer-modal-backdrop');
    if (empBackdrop) {
        closeEmployerModal();
        return;
    }

});

document.addEventListener('click', function(e) {
    var summaryBtn = e.target.closest('.skills-search-summary-skill');
    if (!summaryBtn) return;
    e.preventDefault();
    var block = summaryBtn.closest('.skills-search-content');
    if (!block) return;
    var mode = summaryBtn.dataset.mode || 'include';
    var skill = summaryBtn.dataset.skill || '';
    var skillNorm = normalizeSkillName(skill);
    var btns = block.querySelectorAll('.skills-search-skill');
    btns.forEach(function(btn) {
        var key = normalizeSkillName(btn.dataset.skill || btn.textContent);
        if (key !== skillNorm) return;
        if (mode === 'exclude') btn.classList.remove('excluded');
        else btn.classList.remove('active');
    });
    updateSkillsSearchResults(block);
});

document.addEventListener('click', function(e) {
    var skillBtn = e.target.closest('.skills-search-skill');
    if (!skillBtn) return;
    skillBtn.classList.toggle('active');
    skillBtn.classList.remove('excluded');
    var block = skillBtn.closest('.skills-search-content');
    if (block) updateSkillsSearchResults(block);
});

document.addEventListener('contextmenu', function(e) {
    var skillBtn = e.target.closest('.skills-search-skill');
    if (!skillBtn) return;
    e.preventDefault();
    skillBtn.classList.toggle('excluded');
    skillBtn.classList.remove('active');
    var block = skillBtn.closest('.skills-search-content');
    if (block) updateSkillsSearchResults(block);
});

document.addEventListener('click', function(e) {
    var dropdownBtn = e.target.closest('.skills-search-dropdown-btn');
    if (dropdownBtn) {
        var skillsBlock = dropdownBtn.closest('.skills-search-content');
        if (!skillsBlock) return;
        var dropdown = dropdownBtn.closest('.skills-search-dropdown');
        if (!dropdown) return;
        var isOpen = dropdown.classList.contains('open');
        document.querySelectorAll('.skills-search-dropdown.open').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open', !isOpen);
        return;
    }

    var item = e.target.closest('.skills-search-dropdown-item');
    if (!item) return;
    var dd = item.closest('.skills-search-dropdown');
    var block = item.closest('.skills-search-content');
    if (!dd || !block) return;
    var value = item.dataset.value || 'all';
    var textLabel = item.textContent || '';
    var label = dd.dataset.label || '';
    var btn = dd.querySelector('.skills-search-dropdown-btn');

    if (dd.dataset.multi === '1') {
        var values = [];
        try {
            values = JSON.parse(dd.dataset.values || '[]');
        } catch (_e) {
            values = [];
        }
        if (value === 'all') {
            values = [];
        } else {
            var idx = values.indexOf(value);
            if (idx >= 0) values.splice(idx, 1);
            else values.push(value);
        }
        dd.dataset.values = JSON.stringify(values);
        var items = dd.querySelectorAll('.skills-search-dropdown-item');
        items.forEach(it => {
            var v = it.dataset.value || 'all';
            if (v === 'all') it.classList.toggle('active', values.length === 0);
            else it.classList.toggle('active', values.indexOf(v) >= 0);
        });
        if (btn) {
            if (!values.length) {
                btn.dataset.value = 'all';
                btn.textContent = label ? (label + ': Все') : 'Все';
            } else if (values.length <= 2) {
                btn.dataset.value = values.join(',');
                btn.textContent = label ? (label + ': ' + values.join(', ')) : values.join(', ');
            } else {
                btn.dataset.value = values.join(',');
                btn.textContent = label ? (label + ': ' + values.length) : String(values.length);
            }
        }
        updateSkillsSearchData(block);
        return;
    }

    if (btn) {
        btn.dataset.value = value;
        btn.textContent = label ? (label + ': ' + textLabel) : textLabel;
    }
    if (dd.dataset.filter === 'period') {
        block.dataset.period = value;
    }
    dd.classList.remove('open');
    updateSkillsSearchData(block);
});

document.addEventListener('click', function(e) {
    var clearBtn = e.target.closest('.skills-search-clear');
    if (!clearBtn) return;
    var block = clearBtn.closest('.skills-search-content');
    if (!block) return;
    var periodDd = block.querySelector('.skills-search-dropdown[data-filter="period"]');
    if (periodDd) {
        setSkillsSearchDropdownValue(periodDd, 'all');
        block.dataset.period = 'all';
    }
    var expDd = block.querySelector('.skills-search-dropdown[data-filter="exp"]');
    if (expDd && expDd.dataset.multi === '1') setSkillsSearchDropdownMulti(expDd, []);
    var statusDd = block.querySelector('.skills-search-dropdown[data-filter="status"]');
    if (statusDd) setSkillsSearchDropdownValue(statusDd, '\u041e\u0442\u043a\u0440\u044b\u0442\u0430\u044f');
    var countryDd = block.querySelector('.skills-search-dropdown[data-filter="country"]');
    if (countryDd) setSkillsSearchDropdownValue(countryDd, 'all');
    var currencyDd = block.querySelector('.skills-search-dropdown[data-filter="currency"]');
    if (currencyDd && currencyDd.dataset.multi === '1') setSkillsSearchDropdownMulti(currencyDd, []);
    else if (currencyDd) setSkillsSearchDropdownValue(currencyDd, 'all');
    var sortDd = block.querySelector('.skills-search-dropdown[data-filter="sort"]');
    if (sortDd) setSkillsSearchDropdownValue(sortDd, 'count');
    var logicDd = block.querySelector('.skills-search-dropdown[data-filter="logic"]');
    if (logicDd) setSkillsSearchDropdownValue(logicDd, 'or');
    setSkillsSearchBooleanFilterValues(block, []);
    updateSkillsSearchData(block);
});

document.addEventListener('click', function(e) {
    var selectAllBtn = e.target.closest('.skills-search-select-all');
    if (!selectAllBtn) return;
    var block = selectAllBtn.closest('.skills-search-content');
    if (!block) return;
    var buttons = block.querySelectorAll('.skills-search-skill');
    buttons.forEach(btn => {
        btn.classList.add('active');
        btn.classList.remove('excluded');
    });
    updateSkillsSearchResults(block);
});

document.addEventListener('click', function(e) {
    var resetSkillsBtn = e.target.closest('.skills-search-reset-skills');
    if (!resetSkillsBtn) return;
    var block = resetSkillsBtn.closest('.skills-search-content');
    if (!block) return;
    var buttons = block.querySelectorAll('.skills-search-skill.active, .skills-search-skill.excluded');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('excluded');
    });
    updateSkillsSearchResults(block);
});

document.addEventListener('contextmenu', function(e) {
    var summaryBtn = e.target.closest('.skills-search-summary-skill');
    if (!summaryBtn) return;
    e.preventDefault();
    var block = summaryBtn.closest('.skills-search-content');
    if (!block) return;
    var mode = summaryBtn.dataset.mode || 'include';
    var skill = summaryBtn.dataset.skill || '';
    var skillNorm = normalizeSkillName(skill);
    var btns = block.querySelectorAll('.skills-search-skill');
    btns.forEach(function(btn) {
        var key = normalizeSkillName(btn.dataset.skill || btn.textContent);
        if (key !== skillNorm) return;
        if (mode === 'exclude') {
            btn.classList.add('active');
            btn.classList.remove('excluded');
        } else {
            btn.classList.add('excluded');
            btn.classList.remove('active');
        }
    });
    updateSkillsSearchResults(block);
});

document.addEventListener('click', function(e) {
    var toggleBtn = e.target.closest('.skills-search-toggle');
    if (!toggleBtn) return;
    var block = toggleBtn.closest('.skills-search-content');
    if (!block) return;
    var panel = block.querySelector('.skills-search-panel');
    if (!panel) return;
    panel.classList.toggle('collapsed');
    var expanded = !panel.classList.contains('collapsed');
    toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggleBtn.innerHTML = expanded ? '&#9650;' : '&#9660;';
    updateSkillsSearchSummaryLine(block);
});

document.addEventListener('click', function(e) {
    if (e.target.closest('.skills-search-content .skills-search-dropdown')) return;
    document.querySelectorAll('.skills-search-dropdown.open').forEach(d => d.classList.remove('open'));
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeVacancyModal();
        closeEmployerModal();
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
    document.querySelectorAll('#role-summary-tab').forEach(function(btn) {
        if (btn && btn.parentElement) btn.parentElement.removeChild(btn);
    });
    var buttons = getRoleMetaList().map(function(item) {
        return {
            dataset: {
                roleIndex: item.index,
                roleId: item.id,
                roleName: item.name
            }
        };
    });
    if (buttons.length === 0) return;

    var selected = new Set([buttons[0].dataset.roleIndex]);
    var selectionOrder = [buttons[0].dataset.roleIndex];
    function syncRoleFilterState() {
        if (!uiState.global_filters) return;
        uiState.global_filters.roles.include = Array.from(selected);
    }
    function commitSelection(nextSelected, nextOrder) {
        selected = new Set(nextSelected);
        selectionOrder = (nextOrder || Array.from(selected)).slice();
        syncRoleFilterState();
        updateRoleSelectionUI(selected);
        updateRoleView(selected);
        ensureSummaryAnalysisTabs();
        if (typeof syncSharedFilterPanel === 'function') {
            syncSharedFilterPanel();
        }
    }
    uiState.roleSelectionContext = {
        getSelected: function() { return new Set(selected); },
        getOrder: function() { return selectionOrder.slice(); },
        applySelection: function(nextSelected, nextOrder) {
            commitSelection(new Set(nextSelected), nextOrder || Array.from(nextSelected));
        },
        isSummaryActive: function() {
            return !!uiState.all_roles_active;
        },
        setSummaryActive: function(isActive) {
            setAllRolesMode(isActive);
        }
    };
    syncRoleFilterState();
    updateRoleSelectionUI(selected);
    updateRoleView(selected);
    if (typeof applySalaryStatusIcons === 'function') applySalaryStatusIcons(document);

    function enforceSingle(idx) {
        commitSelection(new Set([idx]), [idx]);
    }

    function ensureSummaryAnalysisTabs() {
        document.querySelectorAll('.analysis-tabs').forEach(function(tabs) {
            var parentRole = tabs.closest('.role-content');
            if (parentRole && parentRole.id === 'role-all') {
                var innerBtn = tabs.querySelector('.summary-report-btn');
                if (innerBtn && innerBtn.parentElement) innerBtn.parentElement.removeChild(innerBtn);
                return;
            }
            var btn = tabs.querySelector('.summary-report-btn');
            if (!btn) {
                btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'tab-button analysis-button summary-report-btn';
                btn.textContent = 'Сводный отчет';
                tabs.appendChild(btn);
            }
            btn.classList.add('analysis-button');
            btn.classList.toggle('active', !!uiState.all_roles_active);
            if (!btn.dataset.bound) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    setAllRolesMode(true);
                });
                btn.dataset.bound = '1';
            }
        });
    }

    function setAllRolesMode(isActive) {
        if (isActive) {
            var allIndices = buttons.map(function(btn) { return btn.dataset.roleIndex; }).filter(Boolean);
            if (allIndices.length) {
                selected = new Set(allIndices);
                selectionOrder = allIndices.slice();
                syncRoleFilterState();
            }
        }
        uiState.all_roles_active = !!isActive;
        updateRoleSelectionUI(selected);
        updateRoleView(selected);
        ensureSummaryAnalysisTabs();
        if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel();
    }

    addSummaryTabs(document);
    ensureSummaryAnalysisTabs();
    if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel();
});

