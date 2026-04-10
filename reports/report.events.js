document.addEventListener('click', function(e) {
    var sortableHeader = e.target.closest('th');
    if (sortableHeader) {
        var table = sortableHeader.closest('table');
        var tbody = table && table.tBodies && table.tBodies[0] ? table.tBodies[0] : null;
        if (!table || !tbody) return;
        if (!sortableHeader.closest('thead')) return;
        if (sortableHeader.classList.contains('no-sort')) return;
        var colIdx = sortableHeader.cellIndex;
        if (colIdx < 0) return;
        var currentDir = sortableHeader.dataset.sortDir === 'asc' ? 'asc' : (sortableHeader.dataset.sortDir === 'desc' ? 'desc' : '');
        var nextDir = currentDir === 'asc' ? 'desc' : 'asc';

        Array.from(table.querySelectorAll('th')).forEach(function(th) {
            th.dataset.sortDir = '';
            th.classList.remove('sort-asc', 'sort-desc');
        });
        sortableHeader.dataset.sortDir = nextDir;
        sortableHeader.classList.add(nextDir === 'asc' ? 'sort-asc' : 'sort-desc');

        function getSortValue(row) {
            if (!row) return { type: 'missing', value: null };
            var cell = row.cells && row.cells[colIdx] ? row.cells[colIdx] : null;
            if (!cell) return { type: 'missing', value: null };

            var ds = Number(cell.dataset.sortNum);
            if (isFinite(ds)) return { type: 'number', value: ds };

            var dsText = String(cell.dataset.sortText || '').trim();
            if (dsText) return { type: 'text', value: dsText.toLowerCase() };

            var text = String(cell.textContent || '')
                .replace(/\u00a0/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (!text || text === '—' || text === '-') return { type: 'missing', value: null };

            var dateMatch = text.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
            if (dateMatch) {
                var ts = Date.UTC(
                    Number(dateMatch[3]),
                    Number(dateMatch[2]) - 1,
                    Number(dateMatch[1]),
                    Number(dateMatch[4] || '0'),
                    Number(dateMatch[5] || '0')
                );
                if (isFinite(ts)) return { type: 'number', value: ts };
            }

            var numericText = text
                .replace(/\s+/g, '')
                .replace(',', '.')
                .replace(/[^\d.-]/g, '');
            var maybeNum = Number(numericText);
            if (numericText && /[\d]/.test(numericText) && isFinite(maybeNum)) {
                return { type: 'number', value: maybeNum };
            }
            return { type: 'text', value: text.toLowerCase() };
        }

        function isTotalRow(row) {
            if (!row || !row.cells || !row.cells.length) return false;
            var first = String(row.cells[0].textContent || '').trim().toLowerCase();
            return first === 'всего';
        }

        var groups = [];
        var allRows = Array.from(tbody.querySelectorAll('tr'));
        for (var i = 0; i < allRows.length; i++) {
            var main = allRows[i];
            groups.push({
                main: main,
                total: isTotalRow(main),
                sort: getSortValue(main)
            });
        }

        groups.sort(function(a, b) {
            if (a.total && b.total) return 0;
            if (a.total) return 1;
            if (b.total) return -1;

            var aMissing = a.sort.type === 'missing';
            var bMissing = b.sort.type === 'missing';
            if (aMissing && bMissing) return 0;
            if (aMissing) return 1;
            if (bMissing) return -1;

            if (a.sort.type === 'number' && b.sort.type === 'number') {
                return nextDir === 'asc' ? (a.sort.value - b.sort.value) : (b.sort.value - a.sort.value);
            }
            var aText = String(a.sort.value || '');
            var bText = String(b.sort.value || '');
            return nextDir === 'asc'
                ? aText.localeCompare(bText, 'ru')
                : bText.localeCompare(aText, 'ru');
        });

        groups.forEach(function(group) {
            tbody.appendChild(group.main);
        });
        return;
    }

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
    var vacancyCopyBtn = e.target.closest('.vacancy-copy-id');
    if (vacancyCopyBtn) {
        e.preventDefault();
        e.stopPropagation();
        var vacancyId = String(vacancyCopyBtn.dataset.vacancyId || '').trim();
        if (!vacancyId) return;
        selectVacancyIdText(vacancyCopyBtn);
        copyVacancyIdText(vacancyId);
        return;
    }

    var detailsBtn = e.target.closest('.my-responses-details-link');
    if (detailsBtn) {
        e.preventDefault();
        if (typeof openMyResponseDetailsModal === 'function') {
            openMyResponseDetailsModal(detailsBtn.dataset.vacancyId || '');
        }
        return;
    }

    if (e.target.id === 'my-response-details-modal-backdrop') {
        if (typeof closeMyResponseDetailsModal === 'function') closeMyResponseDetailsModal();
        return;
    }
    if (e.target.closest('.my-response-details-close')) {
        if (typeof closeMyResponseDetailsModal === 'function') closeMyResponseDetailsModal();
        return;
    }
    if (e.target.closest('.my-response-details-save')) {
        if (typeof submitMyResponseDetailsModal === 'function') submitMyResponseDetailsModal();
        return;
    }
});

document.addEventListener('click', function(e) {
    if (e.target.id === 'resume-action-modal-backdrop') {
        closeResumeActionModal(null);
        return;
    }
    if (e.target.closest('.resume-action-modal-btn.submit')) {
        var backdropResume = document.getElementById('resume-action-modal-backdrop');
        if (!backdropResume) return;
        var selected = backdropResume.querySelector('input[name="resume-action-choice"]:checked');
        var choice = selected ? String(selected.value || '') : '';
        var payload = (resumeActionModalState && resumeActionModalState.payload) || {};
        closeResumeActionModal({
            vacancyId: payload.vacancyId || '',
            applyUrl: payload.applyUrl || '',
            sendResume: choice === 'send',
            rethink: choice === 'rethink'
        });
        return;
    }

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
    clearSkillsSearchSkillState(block, skill, mode);
    updateSkillsSearchResults(block);
});

document.addEventListener('click', function(e) {
    var skillBtn = e.target.closest('.skills-search-skill');
    if (!skillBtn) return;
    var block = skillBtn.closest('.skills-search-content');
    if (!block) return;
    toggleSkillsSearchSkillState(block, skillBtn.dataset.skill || skillBtn.textContent, skillBtn.dataset.mode || 'include');
    updateSkillsSearchResults(block);
});

var resumeActionModalState = null;

function selectVacancyIdText(node) {
    if (!node || !window.getSelection || !document.createRange) return;
    var selection = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
}

function copyVacancyIdText(value) {
    var text = String(value || '').trim();
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function() {});
        return;
    }
    try {
        document.execCommand('copy');
    } catch (_e) {}
}

function ensureResumeActionModal() {
    var backdrop = document.getElementById('resume-action-modal-backdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = 'resume-action-modal-backdrop';
    backdrop.className = 'resume-action-modal-backdrop';
    backdrop.style.display = 'none';
    backdrop.innerHTML =
        '<div class="resume-action-modal" role="dialog" aria-modal="true" aria-label="Действие по отклику">' +
            '<div class="resume-action-modal-title">Действие по отклику</div>' +
            '<label class="resume-action-modal-check">' +
                '<input type="radio" name="resume-action-choice" value="send" class="resume-action-choice"> Отправил резюме' +
            '</label>' +
            '<label class="resume-action-modal-check">' +
                '<input type="radio" name="resume-action-choice" value="rethink" class="resume-action-choice"> Передумал' +
            '</label>' +
            '<div class="resume-action-modal-actions">' +
                '<button type="button" class="resume-action-modal-btn submit">OK</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(backdrop);
    return backdrop;
}

function closeResumeActionModal(result) {
    var backdrop = document.getElementById('resume-action-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
    if (resumeActionModalState && typeof resumeActionModalState.resolve === 'function') {
        resumeActionModalState.resolve(result || null);
    }
    resumeActionModalState = null;
}

function openResumeActionModal(payload) {
    return new Promise(function(resolve) {
        var backdrop = ensureResumeActionModal();
        var choices = backdrop.querySelectorAll('.resume-action-choice');
        choices.forEach(function(input) { input.checked = false; });
        resumeActionModalState = {
            payload: payload || {},
            resolve: resolve
        };
        backdrop.style.display = 'flex';
    });
}

function postSendResume(vacancyId) {
    if (!vacancyId) return Promise.resolve({ ok: false, updated: false });
    var apiBaseUrl = typeof getReportApiBaseUrl === 'function' ? getReportApiBaseUrl() : '';
    var endpoint = apiBaseUrl + '/api/vacancies/send-resume';
    var fallbackEndpoint = 'http://localhost:9000/api/vacancies/send-resume';
    var payload = JSON.stringify({ vacancy_id: String(vacancyId).trim() });
    function doPost(url) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        }).then(function(resp) {
            return resp.json().catch(function() {
                return {};
            }).then(function(data) {
                if (!resp.ok) {
                    var message = data && data.error ? String(data.error) : ('HTTP ' + resp.status);
                    throw new Error(message);
                }
                return data;
            });
        });
    }
    if (window.location && window.location.protocol === 'file:') {
        return doPost(fallbackEndpoint);
    }
    return doPost(endpoint).catch(function(err) {
        if (String(window.location && window.location.origin || '').indexOf('localhost:9000') >= 0) throw err;
        return doPost(fallbackEndpoint);
    });
}

document.addEventListener('click', function(e) {
    var applyLink = e.target.closest('.vacancy-apply-link');
    if (!applyLink) return;
    e.preventDefault();
    handleVacancyApplyAction({
        vacancyId: applyLink.dataset.vacancyId || '',
        applyUrl: applyLink.dataset.applyUrl || applyLink.getAttribute('href') || ''
    });
});

function handleVacancyApplyAction(actionPayload, applyControl) {
    if (!actionPayload) return Promise.resolve();
    if (applyControl) applyControl.disabled = true;
    var finalChecked = false;
    var finalDisabled = false;
    var payload = {
        vacancyId: actionPayload.vacancyId || '',
        applyUrl: actionPayload.applyUrl || ''
    };
    if (payload.applyUrl) {
        window.open(payload.applyUrl, '_blank', 'noopener');
    }
    return openResumeActionModal(payload).then(function(result) {
        if (!result) return;
        if (result.sendResume) {
            return postSendResume(result.vacancyId).then(function(apiResult) {
                if (!apiResult || !apiResult.updated) {
                    alert('Не удалось сохранить отклик в БД: вакансия не найдена.');
                    console.warn('send_resume not updated, vacancy id not found:', result.vacancyId);
                    return;
                }
                var nowValue = (apiResult && apiResult.resume_at) ? apiResult.resume_at : new Date().toISOString();
                var updatedAtValue = (apiResult && apiResult.updated_at) ? apiResult.updated_at : nowValue;
                document.querySelectorAll('.role-content').forEach(function(roleContent) {
                    var vacancies = (typeof getRoleVacancies === 'function') ? getRoleVacancies(roleContent) : [];
                    (vacancies || []).forEach(function(vacancy) {
                        if (!vacancy) return;
                        if (String(vacancy.id || '') !== String(result.vacancyId || '')) return;
                        vacancy.send_resume = true;
                        vacancy.resume_at = nowValue;
                        vacancy.updated_at = updatedAtValue;
                    });
                    var responsesBlock = roleContent.querySelector('.my-responses-content');
                    if (responsesBlock && responsesBlock.style.display === 'block' && typeof renderMyResponsesContent === 'function') {
                        renderMyResponsesContent(roleContent);
                    }
                });
                finalChecked = true;
                finalDisabled = true;
                document.querySelectorAll('.vacancy-apply-switch-input[data-vacancy-id="' + String(result.vacancyId || '').replace(/"/g, '\\"') + '"]').forEach(function(node) {
                    node.checked = true;
                    node.disabled = true;
                });
            }).catch(function(err) {
                alert('Не удалось сохранить отклик в БД. Проверьте, что сервер отчёта и база данных доступны.');
                console.error('send_resume update failed:', err);
            });
        }
        if (result.rethink) {
            finalChecked = false;
            finalDisabled = false;
        }
    }).finally(function() {
        if (applyControl) {
            applyControl.checked = finalChecked;
            applyControl.disabled = finalDisabled;
        }
    });
}

document.addEventListener('change', function(e) {
    var applySwitch = e.target.closest('.vacancy-apply-switch-input');
    if (!applySwitch || !applySwitch.checked) return;
    handleVacancyApplyAction({
        vacancyId: applySwitch.dataset.vacancyId || '',
        applyUrl: applySwitch.dataset.applyUrl || ''
    }, applySwitch);
});

document.addEventListener('click', function(e) {
    var removeFavoriteMark = e.target.closest('.skills-search-favorite-remove');
    if (removeFavoriteMark) {
        e.preventDefault();
        e.stopPropagation();
        var ddWrap = removeFavoriteMark.closest('.skills-search-dropdown[data-filter="favorite"]');
        var blockForRemove = removeFavoriteMark.closest('.skills-search-content');
        if (!ddWrap || !blockForRemove) return;
        var favoriteId = removeFavoriteMark.dataset.removeFavorite || '';
        var favoriteNameNode = removeFavoriteMark.parentElement ? removeFavoriteMark.parentElement.querySelector('.skills-search-favorite-name') : null;
        var favoriteName = favoriteNameNode ? String(favoriteNameNode.textContent || '').trim() : '';
        if (!favoriteId) return;
        confirmSkillsSearchFavoriteDelete(favoriteName).then(function(shouldDelete) {
            if (!shouldDelete) return;
            removeCurrentSkillsSearchFavorite(blockForRemove, favoriteId);
            ddWrap.classList.add('open');
        });
        return;
    }

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
    if (dd.dataset.filter === 'favorite') {
        if (value === 'all') {
            setSkillsSearchFavoriteTrigger(dd, '', 'all');
            var favState = ensureSkillsSearchFavoritesState();
            favState.activeId = '';
            persistSkillsSearchFavoritesState();
            dd.classList.remove('open');
            return;
        }
        applySkillsSearchFavorite(block, value);
        dd.classList.remove('open');
        return;
    }

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
    var saveFavBtn = e.target.closest('.skills-search-save-favorite');
    if (!saveFavBtn) return;
    var block = saveFavBtn.closest('.skills-search-content');
    if (!block) return;
    var defaultName = '';
    var favoritesDd = block.querySelector('.skills-search-dropdown[data-filter="favorite"]');
    if (favoritesDd) {
        var current = getSkillsSearchFilterValue(block, 'favorite');
        if (current && current !== 'all') {
            var currentItem = favoritesDd.querySelector('.skills-search-dropdown-item[data-value="' + current + '"]');
            if (currentItem) {
                var nameEl = currentItem.querySelector('.skills-search-favorite-name');
                defaultName = String((nameEl ? nameEl.textContent : currentItem.textContent) || '').trim();
            }
        }
    }
    promptSkillsSearchFavoriteName(defaultName || '').then(function(nextName) {
        if (nextName === null) return;
        if (!String(nextName || '').trim()) return;
        saveCurrentSkillsSearchFavorite(block, nextName);
    });
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
    var logicDd = block.querySelector('.skills-search-dropdown[data-filter="logic"]');
    if (logicDd) setSkillsSearchDropdownValue(logicDd, 'or');
    setSkillsSearchBooleanFilterValues(block, []);
    uiState.skills_search_filter_query = '';
    applySkillsSearchSkillState(block, [], [], 'or');
    updateSkillsSearchData(block);
});

document.addEventListener('click', function(e) {
    var selectAllBtn = e.target.closest('.skills-search-select-all');
    if (!selectAllBtn) return;
    var block = selectAllBtn.closest('.skills-search-content');
    if (!block) return;
    applySkillsSearchSkillState(block, ((block._data && block._data.skills) || []).map(function(item) { return item.skill; }), [], getSkillsSearchSelections(block).logic);
    updateSkillsSearchResults(block);
});

document.addEventListener('click', function(e) {
    var resetSkillsBtn = e.target.closest('.skills-search-reset-skills');
    if (!resetSkillsBtn) return;
    var block = resetSkillsBtn.closest('.skills-search-content');
    if (!block) return;
    applySkillsSearchSkillState(block, [], [], getSkillsSearchSelections(block).logic);
    updateSkillsSearchResults(block);
});

document.addEventListener('click', function(e) {
    var toggleBtn = e.target.closest('.skills-search-toggle');
    if (!toggleBtn) return;
    var block = toggleBtn.closest('.skills-search-content');
    if (!block) return;
    var panel = block.querySelector('.skills-search-panel');
    if (!panel) panel = block;
    var collapsed = panel.classList.toggle('collapsed');
    var expanded = !collapsed;
    toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggleBtn.textContent = expanded ? '\u25B2' : '\u25BC';
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

// ---------- Обработчик кликов по иконкам режимов ----------
document.addEventListener('click', function(e) {
    var btn = e.target.closest('.view-mode-btn, .view-mode-button');
    if (!btn) return;
    if (btn.disabled) return;

    var container = btn.closest('.month-content, .weekday-content, .monthly-skills-exp-content, .salary-exp-content, .all-roles-period-content, .employer-analysis-content');
    if (!container) return;

    var analysisType = null;
    if (container.classList.contains('month-content')) analysisType = 'activity';
    else if (container.classList.contains('weekday-content')) analysisType = 'weekday';
    else if (container.classList.contains('monthly-skills-exp-content')) analysisType = 'skills-monthly';
    else if (container.classList.contains('salary-exp-content')) analysisType = 'salary';
    else if (container.classList.contains('employer-analysis-content')) analysisType = 'employer-analysis';
    else if (container.classList.contains('all-roles-period-content')) {
        var a = container.dataset.analysis || '';
        if (a.indexOf('activity') === 0) analysisType = 'activity';
        else if (a.indexOf('weekday') === 0) analysisType = 'weekday';
        else if (a.indexOf('skills') === 0) analysisType = 'skills-monthly';
        else if (a.indexOf('salary') === 0) analysisType = 'salary';
    }

    if (!analysisType) return;

    var mode = normalizeResponsiveViewMode(btn.dataset.view);
    if (typeof syncAllViewModes === 'function') syncAllViewModes(mode);
    else {
        uiState.activity_view_mode = mode;
        uiState.weekday_view_mode = mode;
        uiState.skills_monthly_view_mode = mode;
        uiState.salary_view_mode = mode;
        uiState.employer_analysis_view_mode = mode;
    }
    if (typeof persistViewModes === 'function') persistViewModes();

    var allBtns = container.querySelectorAll('.view-mode-btn, .view-mode-button');
    setActiveViewButton(allBtns, mode);

    if (analysisType === 'salary') {
        var expData = (container._data && container._data.exp) ? container._data.exp : parseJsonDataset(container, 'exp', {});
        applySalaryViewMode(container, expData.entries);
        return;
    }

    if (analysisType === 'employer-analysis') {
        applyEmployerAnalysisViewMode(container, mode);
        return;
    }

    if (analysisType === 'skills-monthly' && container.classList.contains('monthly-skills-exp-content')) {
        var skillsExpData = (container._data && container._data.exp) ? container._data.exp : parseJsonDataset(container, 'exp', {});
        var skillsViewContainer = container.querySelector('.view-mode-container');
        applyViewMode(skillsViewContainer, mode);
        if (mode !== 'table') {
            var skillsGraph = container.querySelector('.plotly-graph');
            if (skillsGraph) {
                buildHorizontalBarChart(skillsGraph.id, skillsExpData.skills || [], skillsExpData.experience || '');
                resizePlotlyScope(skillsGraph);
            }
        }
        return;
    }

    if (container.dataset.analysis === 'activity-all') {
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        if (mode !== 'table') {
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
        if (mode !== 'table') {
            var rows = parseJsonDataset(container, 'entries', []);
            var graphId = container.dataset.graphId;
            if (graphId) buildAllRolesWeekdayChart(rows, graphId);
        }
        return;
    }

    if (container.dataset.analysis === 'skills-monthly-all') {
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        if (mode !== 'table') {
            var graphId = container.dataset.graphId;
            if (graphId) {
                var activePeriodBtn = container.closest('.all-roles-period-wrapper')
                    ? container.closest('.all-roles-period-wrapper').querySelector('.month-button.active')
                    : null;
                var contextText = buildChartContextLabel(((activePeriodBtn || {}).textContent || '').trim(), null);
                renderAllRolesSkillsChartFromTable(container, graphId, contextText);
            }
        }
        return;
    }

    if (container.dataset.analysis === 'salary-all') {
        var viewContainer = container.querySelector('.view-mode-container');
        applyViewMode(viewContainer, mode);
        return;
    }

    var viewContainer = container.querySelector('.view-mode-container');
    applyViewMode(viewContainer, mode);
});

// ---------- Инициализация ----------
document.addEventListener("DOMContentLoaded", function() {
    if (typeof applyAnalysisTabNaming === 'function') applyAnalysisTabNaming(document);
    if (typeof updateViewToggleIcons === 'function') updateViewToggleIcons(document);
    if (typeof updateReportLayoutScrollZones === 'function') {
        updateReportLayoutScrollZones();
        window.addEventListener('resize', updateReportLayoutScrollZones);
    }
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
        if (!uiState.global_filters.roles) uiState.global_filters.roles = { include: [], exclude: [] };
        var selectedList = Array.from(selected);
        uiState.global_filters.roles.include = selectedList;
        uiState.global_filters.roles.exclude = [];
    }
    function commitSelection(nextSelected, nextOrder) {
        selected = new Set(nextSelected);
        selectionOrder = (nextOrder || Array.from(selected)).slice();
        syncRoleFilterState();
        updateRoleSelectionUI(selected);
        updateRoleView(selected);
        ensureSummaryAnalysisTabs();
        if (uiState.keep_roles_filter_open && typeof refreshExistingGlobalFilterUi === 'function') {
            refreshExistingGlobalFilterUi(null, null);
        } else if (typeof syncSharedFilterPanel === 'function') {
            syncSharedFilterPanel(null, null, true);
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
    if (typeof syncDashboardTopbarMeta === 'function') {
        syncDashboardTopbarMeta(getActiveRoleContent(), uiState.global_analysis_type || '');
    }
    if (!uiState.my_responses_cache_loaded && !uiState.my_responses_cache_loading && typeof fetchMyResponsesVacancies === 'function') {
        uiState.my_responses_cache_loading = true;
        fetchMyResponsesVacancies().then(function() {
            var activeRole = (typeof getActiveRoleContent === 'function') ? getActiveRoleContent() : null;
            var activeAnalysis = String(activeRole && activeRole.dataset ? activeRole.dataset.activeAnalysis || '' : '').trim();
            if (activeRole && /^(skills-search|totals|my-responses|responses-calendar)$/.test(activeAnalysis) && typeof applyGlobalFiltersToActiveAnalysis === 'function') {
                applyGlobalFiltersToActiveAnalysis(activeRole, activeAnalysis);
            }
        }).catch(function() {
        }).finally(function() {
            uiState.my_responses_cache_loading = false;
        });
    }
    if (typeof applySalaryStatusIcons === 'function') applySalaryStatusIcons(document);
    if (typeof refreshResponsiveViewModes === 'function') refreshResponsiveViewModes(document);

    function enforceSingle(idx) {
        commitSelection(new Set([idx]), [idx]);
    }

    function resolveAnalysisTypeFromId(analysisId) {
        var id = String(analysisId || '');
        if (id.indexOf('detail-') === 0) return 'detail';
        if (id.indexOf('activity') >= 0) return 'activity';
        if (id.indexOf('weekday') >= 0) return 'weekday';
        if (id.indexOf('skills-monthly') >= 0) return 'skills-monthly';
        if (id.indexOf('skills-search') >= 0) return 'skills-search';
        if (id.indexOf('my-responses') >= 0) return 'my-responses';
        if (id.indexOf('responses-calendar') >= 0) return 'responses-calendar';
        if (id.indexOf('totals') >= 0) return 'totals';
        if (id.indexOf('salary') >= 0) return 'salary';
        if (id.indexOf('employer-analysis') >= 0) return 'employer-analysis';
        return '';
    }

    function captureSummaryReturnTabs() {
        var activeRole = (typeof getActiveRoleContent === 'function') ? getActiveRoleContent() : null;
        if (!activeRole || activeRole.id === 'role-all') return;
        var host = activeRole.querySelector('.tabs.analysis-tabs');
        if (!host) return;
        var seen = new Set();
        var items = [];
        Array.from(host.children).forEach(function(btn) {
            if (!btn.classList || !btn.classList.contains('analysis-button')) return;
            var isSummaryBtn = btn.classList.contains('summary-report-btn');
            var type = isSummaryBtn ? 'summary' : resolveAnalysisTypeFromId((btn.dataset && btn.dataset.analysisId) || '');
            if (!type || seen.has(type)) return;
            seen.add(type);
            items.push({
                type: type,
                label: String(btn.textContent || '').trim()
            });
        });
        if (items.length) uiState.summary_return_tabs = items;
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
                btn.textContent = 'Сравнительный анализ';
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
        if (typeof markAnalysisTabNamingDirty === 'function') markAnalysisTabNamingDirty(document);
        if (typeof applyAnalysisTabNaming === 'function') applyAnalysisTabNaming(document);
    }

    function setAllRolesMode(isActive) {
        if (isActive) {
            captureSummaryReturnTabs();
            if (!selected.size) {
                var allIndices = buttons.map(function(btn) { return btn.dataset.roleIndex; }).filter(Boolean);
                if (allIndices.length) {
                    selected = new Set(allIndices);
                    selectionOrder = allIndices.slice();
                }
            }
            if (selected.size) {
                syncRoleFilterState();
            }
        }
        uiState.all_roles_active = !!isActive;
        updateRoleSelectionUI(selected);
        updateRoleView(selected);
        ensureSummaryAnalysisTabs();
        if (typeof syncDashboardTopbarMeta === 'function') {
            syncDashboardTopbarMeta(getActiveRoleContent(), uiState.global_analysis_type || '');
        }
        if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(null, null, true);
    }

    function exitAllRolesMode(nextSelected, nextOrder) {
        if (nextSelected) {
            selected = new Set(nextSelected);
            selectionOrder = (nextOrder || Array.from(selected)).slice();
            syncRoleFilterState();
        }
        uiState.all_roles_active = false;
        updateRoleSelectionUI(selected);
        updateRoleView(selected);
        ensureSummaryAnalysisTabs();
        if (typeof syncDashboardTopbarMeta === 'function') {
            syncDashboardTopbarMeta(getActiveRoleContent(), uiState.global_analysis_type || '');
        }
        if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel(null, null, true);
    }

    uiState.roleSelectionContext.exitAllRolesMode = function(nextSelected, nextOrder) {
        exitAllRolesMode(nextSelected, nextOrder);
    };

    addSummaryTabs(document);
    ensureSummaryAnalysisTabs();
    if (typeof syncSharedFilterPanel === 'function') syncSharedFilterPanel();
});

