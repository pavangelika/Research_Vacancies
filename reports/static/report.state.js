const CHART_COLORS = {
    light: '#B0BEC5',
    medium: '#90A4AE',
    dark: '#607D8B'
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
    all_roles_active: false,
    all_roles_periods: { activity: null, weekday: null, skills: null, salary: null },
    all_roles_excluded: [],
    unified_view_mode: 'together',
    activity_view_mode: 'together',
    weekday_view_mode: 'together',
    skills_monthly_view_mode: 'together',
    salary_view_mode: 'together',
    employer_analysis_view_mode: 'together'
};

var VIEW_MODE_STORAGE_KEY = 'research_vacancies_view_modes';
var VIEW_MODE_STATE_KEYS = [
    'unified_view_mode',
    'activity_view_mode',
    'weekday_view_mode',
    'skills_monthly_view_mode',
    'salary_view_mode',
    'employer_analysis_view_mode'
];

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

loadPersistedViewModes();

function getAnalysisStateKey(roleId) {
    return roleId + '_analysis';
}

function getStateKey(roleId, analysisType) {
    return roleId + '_' + analysisType;
}
