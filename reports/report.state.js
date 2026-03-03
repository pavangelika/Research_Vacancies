const CHART_COLORS = {
    light: '#B0BEC5',
    medium: '#90A4AE',
    dark: '#607D8B'
};

let uiState = {
    global_analysis_type: null,
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
    all_roles_active: false,
    all_roles_periods: { activity: null, weekday: null, skills: null, salary: null },
    all_roles_excluded: [],
    activity_view_mode: 'together',
    weekday_view_mode: 'together',
    skills_monthly_view_mode: 'together',
    salary_view_mode: 'together',
    employer_analysis_view_mode: 'together'
};

function getAnalysisStateKey(roleId) {
    return roleId + '_analysis';
}

function getStateKey(roleId, analysisType) {
    return roleId + '_' + analysisType;
}
