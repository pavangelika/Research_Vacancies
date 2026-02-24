// Цветовая палитра графиков (исходная)
const CHART_COLORS = {
    light: '#B0BEC5',   // светло-серый для активных, публикаций, открытых
    medium: '#90A4AE',  // средне-серый для навыков
    dark: '#607D8B'     // тёмно-серый для архивных, архиваций
};

// Состояние интерфейса
let uiState = {
    global_analysis_type: null,
    global_activity_month: null,
    global_skills_month: null,
    global_skills_experience: null,
    global_salary_month: null,
    global_salary_experience: null,
    all_roles_active: false,
    all_roles_periods: { activity: null, weekday: null, skills: null, salary: null },
    // Режимы отображения для разных типов анализа
    activity_view_mode: 'together',    // по умолчанию вместе
    weekday_view_mode: 'together',
    skills_monthly_view_mode: 'together',
    salary_view_mode: 'table'           // по умолчанию таблица
};
function getAnalysisStateKey(roleId) {
    return roleId + '_analysis';
}
function getStateKey(roleId, analysisType) {
    return roleId + '_' + analysisType;
}

// ---------- Переключение ролей ----------
