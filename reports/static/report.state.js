const CHART_COLORS = {
    light: '#38bdf8',
    medium: '#8b5cf6',
    dark: '#f43f5e'
};

let uiState = {
    global_analysis_type: 'totals',
    global_filters: {
        roles: { include: [], exclude: [] },
        periods: { include: [], exclude: [] },
        experiences: { include: [], exclude: [] }
    },
    global_activity_month: null,
    global_skills_month: null,
    global_skills_experience: null,
    global_skills_multi_enabled: false,
    global_skills_exp_list: [],
    global_salary_month: null,
    global_salary_experience: null,
    totals_dashboard_mode: 'overview',
    totals_top_limit: 15,
    totals_top_currency: 'RUR',
    totals_vacancy_order: 'high',
    totals_skills_order: 'most',
    totals_company_order: 'high',
    totals_closing_window: 'lte_7',
    market_trends_excluded_roles: [],
    all_roles_active: false,
    all_roles_periods: { activity: null, weekday: null, skills: null, salary: null },
    all_roles_excluded: [],
    unified_view_mode: 'together',
    activity_view_mode: 'together',
    weekday_view_mode: 'together',
    skills_monthly_view_mode: 'together',
    salary_view_mode: 'together',
    employer_analysis_view_mode: 'together',
    shared_filter_panel_state: {
        open: true,
        collapsed: false,
        sections: {
            roles: true,
            salary: true,
            responses: true,
            top: true,
            vacancy: true,
            skills: true
        }
    }
};

var VIEW_MODE_STORAGE_KEY = 'research_vacancies_view_modes';
var SHARED_FILTER_PANEL_STORAGE_KEY = 'research_vacancies_shared_filter_panel_state';
var VIEW_MODE_STATE_KEYS = [
    'unified_view_mode',
    'activity_view_mode',
    'weekday_view_mode',
    'skills_monthly_view_mode',
    'salary_view_mode',
    'employer_analysis_view_mode'
];

var SHARED_FILTER_PANEL_SECTION_KEYS = ['roles', 'salary', 'responses', 'top', 'vacancy', 'skills'];

function ensureSharedFilterPanelState() {
    if (!uiState.shared_filter_panel_state || typeof uiState.shared_filter_panel_state !== 'object') {
        uiState.shared_filter_panel_state = {};
    }
    if (typeof uiState.shared_filter_panel_state.open !== 'boolean') {
        uiState.shared_filter_panel_state.open = true;
    }
    if (typeof uiState.shared_filter_panel_state.collapsed !== 'boolean') {
        uiState.shared_filter_panel_state.collapsed = !uiState.shared_filter_panel_state.open;
    }
    if (!uiState.shared_filter_panel_state.sections || typeof uiState.shared_filter_panel_state.sections !== 'object') {
        uiState.shared_filter_panel_state.sections = {};
    }
    SHARED_FILTER_PANEL_SECTION_KEYS.forEach(function(key) {
        if (typeof uiState.shared_filter_panel_state.sections[key] !== 'boolean') {
            uiState.shared_filter_panel_state.sections[key] = true;
        }
    });
    return uiState.shared_filter_panel_state;
}

function syncAllViewModes(mode) {
    var normalized = (mode === 'table' || mode === 'graph') ? mode : 'together';
    uiState.unified_view_mode = normalized;
    uiState.activity_view_mode = normalized;
    uiState.weekday_view_mode = normalized;
    uiState.skills_monthly_view_mode = normalized;
    uiState.salary_view_mode = normalized;
    uiState.employer_analysis_view_mode = normalized;
    return normalized;
}

function loadPersistedViewModes() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        var raw = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        if (!raw) return;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;
        var shared = parsed.unified_view_mode;
        if (shared !== 'together' && shared !== 'table' && shared !== 'graph') {
            shared = parsed.activity_view_mode || parsed.weekday_view_mode || parsed.skills_monthly_view_mode || parsed.salary_view_mode || parsed.employer_analysis_view_mode;
        }
        if (shared === 'together' || shared === 'table' || shared === 'graph') {
            syncAllViewModes(shared);
            return;
        }
    } catch (err) {
        // Ignore malformed or unavailable localStorage state.
    }
}

function persistViewModes() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        var payload = {};
        VIEW_MODE_STATE_KEYS.forEach(function(key) {
            payload[key] = uiState[key];
        });
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
        // Ignore storage write failures.
    }
}

function loadPersistedSharedFilterPanelState() {
    ensureSharedFilterPanelState();
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        var raw = window.localStorage.getItem(SHARED_FILTER_PANEL_STORAGE_KEY);
        if (!raw) return;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;
        if (typeof parsed.open === 'boolean') {
            uiState.shared_filter_panel_state.open = parsed.open;
        }
        if (typeof parsed.collapsed === 'boolean') {
            uiState.shared_filter_panel_state.collapsed = parsed.collapsed;
        } else {
            uiState.shared_filter_panel_state.collapsed = !uiState.shared_filter_panel_state.open;
        }
        if (parsed.sections && typeof parsed.sections === 'object') {
            SHARED_FILTER_PANEL_SECTION_KEYS.forEach(function(key) {
                if (typeof parsed.sections[key] === 'boolean') {
                    uiState.shared_filter_panel_state.sections[key] = parsed.sections[key];
                }
            });
        }
    } catch (err) {
        // Ignore malformed or unavailable localStorage state.
    }
}

function persistSharedFilterPanelState() {
    ensureSharedFilterPanelState();
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(SHARED_FILTER_PANEL_STORAGE_KEY, JSON.stringify(uiState.shared_filter_panel_state));
    } catch (err) {
        // Ignore storage write failures.
    }
}

loadPersistedViewModes();
loadPersistedSharedFilterPanelState();

function getAnalysisStateKey(roleId) {
    return roleId + '_analysis';
}

function getStateKey(roleId, analysisType) {
    return roleId + '_' + analysisType;
}
