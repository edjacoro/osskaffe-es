const STORAGE_KEY = "oss-barcelona-grid-v1";
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DEFAULT_LOCATION_ID = "barcelona";
const LOCATIONS = {
  barcelona: {
    id: "barcelona",
    label: "Barcelona",
    shortLabel: "BCN",
    address: "",
  },
  madrid: {
    id: "madrid",
    label: "Madrid",
    shortLabel: "MAD",
    address: "Calle de Manuel Cortina, 1, Chamberí, 28010 Madrid, España",
  },
};
const LOCATION_IDS = Object.keys(LOCATIONS);

const DEFAULT_EMPLOYEES = [
  {
    id: "chelo",
    label: "Chelo",
    role: "Encargado",
    color: "#416877",
    active: true,
    canLogin: true,
    locationId: "barcelona",
  },
  {
    id: "sebastian",
    label: "Sebastian",
    role: "Barista",
    color: "#2d4f5c",
    active: true,
    canLogin: true,
    locationId: "barcelona",
  },
  {
    id: "third",
    label: "Paloma",
    role: "Barista",
    color: "#c46d47",
    active: true,
    canLogin: true,
    locationId: "barcelona",
  },
  {
    id: "bonnie",
    label: "Bonnie",
    role: "Barista",
    color: "#6f7f46",
    active: true,
    canLogin: true,
    locationId: "madrid",
  },
  {
    id: "micaela",
    label: "Micaela",
    role: "Encargada",
    color: "#8d5a73",
    active: true,
    canLogin: true,
    locationId: "madrid",
  },
  {
    id: "perla",
    label: "Perla",
    role: "Barista",
    color: "#547f87",
    active: true,
    canLogin: true,
    locationId: "madrid",
  },
  {
    id: "guillermo",
    label: "Guillermo",
    role: "Barista",
    color: "#9a7041",
    active: true,
    canLogin: true,
    locationId: "madrid",
  },
];

const SCHEDULE_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DEFAULT_SCHEDULE_ANCHOR = "2026-01-05";

function scheduleWeek(entries = {}) {
  return SCHEDULE_DAY_ORDER.reduce((week, day) => {
    const value = entries[day];
    week[day] = value ? [{ start: value[0], end: value[1] }] : [];
    return week;
  }, {});
}

function baseSchedule(weekA = {}, options = {}) {
  return {
    mode: options.mode || "weekly",
    anchorDate: options.anchorDate || DEFAULT_SCHEDULE_ANCHOR,
    weeks: {
      a: scheduleWeek(weekA),
      b: scheduleWeek(options.weekB || weekA),
    },
  };
}

const DEFAULT_BASE_SCHEDULES = {
  chelo: baseSchedule({
    1: ["14:00", "20:00"],
    2: ["14:00", "20:00"],
    3: ["14:00", "20:00"],
    4: ["14:00", "20:00"],
    5: ["14:00", "20:00"],
  }),
  sebastian: baseSchedule({
    3: ["08:00", "14:00"],
    4: ["08:00", "14:00"],
    5: ["08:00", "14:00"],
    6: ["08:30", "14:30"],
    0: ["09:30", "14:30"],
  }),
  third: baseSchedule({
    1: ["08:00", "14:00"],
    2: ["08:00", "14:00"],
    6: ["12:00", "20:00"],
    0: ["12:00", "20:00"],
  }),
  micaela: baseSchedule({
    1: ["08:30", "14:00"],
    2: ["08:30", "14:00"],
    3: ["08:30", "14:00"],
    4: ["08:30", "14:00"],
    5: ["08:30", "14:00"],
  }),
  bonnie: baseSchedule({
    1: ["16:00", "19:00"],
    0: ["15:00", "20:00"],
  }),
  perla: baseSchedule({
    2: ["16:00", "20:00"],
    4: ["16:00", "20:00"],
    6: ["09:00", "14:00"],
  }),
  guillermo: baseSchedule({
    3: ["16:00", "20:00"],
    5: ["16:00", "20:00"],
    6: ["16:00", "20:00"],
    0: ["10:00", "15:00"],
  }),
};

const HOLIDAY_SEED_VERSION = 1;
const DEFAULT_HOLIDAYS_2026 = [
  { date: "2026-01-01", name: "Año Nuevo", open: "10:00", close: "19:00" },
  { date: "2026-01-06", name: "Reyes", open: "10:00", close: "19:00" },
  { date: "2026-04-03", name: "Viernes Santo", open: "10:00", close: "19:00" },
  { date: "2026-04-06", name: "Lunes de Pascua", open: "10:00", close: "19:00" },
  { date: "2026-05-01", name: "Fiesta del Trabajo", open: "10:00", close: "19:00" },
  { date: "2026-05-25", name: "Segunda Pascua", open: "10:00", close: "19:00" },
  { date: "2026-06-24", name: "Sant Joan", open: "10:00", close: "19:00" },
  { date: "2026-08-15", name: "Asunción de la Virgen", open: "10:00", close: "19:00" },
  { date: "2026-09-11", name: "Diada de Cataluña", open: "10:00", close: "19:00" },
  { date: "2026-09-24", name: "La Mercè", open: "10:00", close: "19:00" },
  { date: "2026-10-12", name: "Día de la Hispanidad", open: "10:00", close: "19:00" },
  { date: "2026-12-08", name: "Inmaculada", open: "10:00", close: "19:00" },
  { date: "2026-12-25", name: "Navidad", open: "10:00", close: "19:00" },
  { date: "2026-12-26", name: "Sant Esteve", open: "10:00", close: "19:00" },
];

const MADRID_HOLIDAYS_2026 = [
  { date: "2026-01-01", name: "Año Nuevo", open: "10:00", close: "19:00" },
  { date: "2026-01-06", name: "Epifanía del Señor", open: "10:00", close: "19:00" },
  { date: "2026-04-02", name: "Jueves Santo", open: "10:00", close: "19:00" },
  { date: "2026-04-03", name: "Viernes Santo", open: "10:00", close: "19:00" },
  { date: "2026-05-01", name: "Fiesta del Trabajo", open: "10:00", close: "19:00" },
  { date: "2026-05-02", name: "Fiesta de la Comunidad de Madrid", open: "10:00", close: "19:00" },
  { date: "2026-05-15", name: "San Isidro Labrador", open: "10:00", close: "19:00" },
  { date: "2026-08-15", name: "Asunción de la Virgen", open: "10:00", close: "19:00" },
  { date: "2026-10-12", name: "Fiesta Nacional de España", open: "10:00", close: "19:00" },
  { date: "2026-11-02", name: "Traslado de Todos los Santos", open: "10:00", close: "19:00" },
  { date: "2026-11-09", name: "Nuestra Señora de La Almudena", open: "10:00", close: "19:00" },
  { date: "2026-12-07", name: "Traslado del Día de la Constitución", open: "10:00", close: "19:00" },
  { date: "2026-12-08", name: "Inmaculada Concepción", open: "10:00", close: "19:00" },
  { date: "2026-12-25", name: "Navidad", open: "10:00", close: "19:00" },
];

const DEFAULT_SETTINGS = {
  adminEmail: "",
  storeAddress: "",
  storeLat: "",
  storeLng: "",
  geoRadius: 120,
  lateTolerance: 5,
  adminPin: "0000",
  palomaLeaveDate: "2026-07-01",
  holidaySeedVersion: HOLIDAY_SEED_VERSION,
  holidays: DEFAULT_HOLIDAYS_2026,
  monthlyOpeningHours: {},
};

const DEFAULT_LOCATION_SETTINGS = {
  barcelona: { ...DEFAULT_SETTINGS, holidays: DEFAULT_HOLIDAYS_2026 },
  madrid: {
    ...DEFAULT_SETTINGS,
    storeAddress: LOCATIONS.madrid.address,
    storeLat: "40.43073",
    storeLng: "-3.69918",
    holidays: MADRID_HOLIDAYS_2026,
  },
};

const DEFAULT_STATE = {
  punches: [],
  changes: [],
  trafficData: [],
  employees: DEFAULT_EMPLOYEES,
  profiles: {},
  sales: [],
  expenses: [],
  expenseCategoryOverrides: {},
  wasteRecords: [],
  contracts: {},
  baseSchedules: DEFAULT_BASE_SCHEDULES,
  budgets: {},
  payrollSettlements: {},
  locations: LOCATIONS,
  locationSettings: DEFAULT_LOCATION_SETTINGS,
  settings: DEFAULT_SETTINGS,
};

let state = loadState();
let activeMonth = firstDayOfMonth(new Date());
let storeHoursActiveMonth = firstDayOfMonth(new Date());
const hiddenGridEmployees = new Map();
let trafficActiveMonth = firstDayOfMonth(new Date());
let appRole = null;
let activeEmployeeId = null;
let activeLocationId = DEFAULT_LOCATION_ID;
let pendingLocationRole = null;
let adminInited = false;
let empEventsInited = false;
let activeFichasTab = 'fichas';
let activeAdminFichaEditId = null;
let adminFichaEditDraft = null;
let adminBaseScheduleEditDraft = null;
let sharedStateEnabled = false;
let sharedStateSaveTimer = null;
let sharedStatePollTimer = null;
let sharedStateSaving = false;
let sharedStatePending = false;
let suppressSharedStateSave = false;
let pendingEmployeeId = null;
let empHoursMonth = firstDayOfMonth(new Date());
let shiftNotificationTimer = null;
const notifiedShiftKeys = new Set();

const els = {
  monthTitle: document.querySelector("#monthTitle"),
  monthPicker: document.querySelector("#monthPicker"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  exportCsv: document.querySelector("#exportCsv"),
  printPdf: document.querySelector("#printPdf"),
  employeeLegend: document.querySelector("#employeeLegend"),
  storeHoursEditor: document.querySelector("#storeHoursEditor"),
  storeHoursMonth: document.querySelector("#storeHoursMonth"),
  storeHoursPrevMonth: document.querySelector("#storeHoursPrevMonth"),
  storeHoursNextMonth: document.querySelector("#storeHoursNextMonth"),
  storeHoursDays: document.querySelector("#storeHoursDays"),
  scheduleTable: document.querySelector("#scheduleTable"),
  plannedHours: document.querySelector("#plannedHours"),
  pendingCount: document.querySelector("#pendingCount"),
  suggestionCount: document.querySelector("#suggestionCount"),
  punchForm: document.querySelector("#punchForm"),
  punchEmployee: document.querySelector("#punchEmployee"),
  punchType: document.querySelector("#punchType"),
  punchList: document.querySelector("#punchList"),
  geoStatus: document.querySelector("#geoStatus"),
  mockOnTime: document.querySelector("#mockOnTime"),
  emailLateReport: document.querySelector("#emailLateReport"),
  changeForm: document.querySelector("#changeForm"),
  changeDate: document.querySelector("#changeDate"),
  changeEmployee: document.querySelector("#changeEmployee"),
  changeReason: document.querySelector("#changeReason"),
  changeAction: document.querySelector("#changeAction"),
  changeStart: document.querySelector("#changeStart"),
  changeEnd: document.querySelector("#changeEnd"),
  replacementEmployee: document.querySelector("#replacementEmployee"),
  changeNote: document.querySelector("#changeNote"),
  changeList: document.querySelector("#changeList"),
  approvalSummary: document.querySelector("#approvalSummary"),
  trafficForm: document.querySelector("#trafficForm"),
  trafficCsv: document.querySelector("#trafficCsv"),
  visitorThreshold: document.querySelector("#visitorThreshold"),
  minimumVisitors: document.querySelector("#minimumVisitors"),
  loadTrafficSample: document.querySelector("#loadTrafficSample"),
  trafficSummary: document.querySelector("#trafficSummary"),
  suggestionList: document.querySelector("#suggestionList"),
  trafficPrevMonth: document.querySelector("#trafficPrevMonth"),
  trafficNextMonth: document.querySelector("#trafficNextMonth"),
  trafficMonthDisplay: document.querySelector("#trafficMonthDisplay"),
  saveSettings: document.querySelector("#saveSettings"),
  adminEmail: document.querySelector("#adminEmail"),
  storeLat: document.querySelector("#storeLat"),
  storeLng: document.querySelector("#storeLng"),
  geoRadius: document.querySelector("#geoRadius"),
  lateTolerance: document.querySelector("#lateTolerance"),
  holidayName: document.querySelector("#holidayName"),
  holidayDate: document.querySelector("#holidayDate"),
  holidayOpen: document.querySelector("#holidayOpen"),
  holidayClose: document.querySelector("#holidayClose"),
  addHoliday: document.querySelector("#addHoliday"),
  holidayList: document.querySelector("#holidayList"),
  backupExport: document.querySelector("#backupExport"),
  backupImportButton: document.querySelector("#backupImportButton"),
  backupImportFile: document.querySelector("#backupImportFile"),
  backupStatus: document.querySelector("#backupStatus"),
};

startApp();

function startApp() {
  initRoleScreen();
  refreshTeamDirectory();
}

async function refreshTeamDirectory() {
  try {
    const response = await fetch('/api/team', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    if (!payload.ok || !Array.isArray(payload.employees)) return;
    const serverIds = new Set(payload.employees.map((employee) => employee.id));
    const localCustomEmployees = (state.employees || []).filter((employee) =>
      employee.id !== "pablo"
      && !serverIds.has(employee.id)
      && !DEFAULT_EMPLOYEES.some((defaultEmployee) => defaultEmployee.id === employee.id)
    );
    state.employees = [...payload.employees, ...localCustomEmployees];
    state.baseSchedules = mergeBaseSchedules(DEFAULT_BASE_SCHEDULES, state.baseSchedules, state.employees);
    addDefaultProfilesForNewEmployees(state);
    renderEmployeeChoiceButtons();
  } catch (_) {
    // En uso local sin backend se conserva el Team guardado en el navegador.
  }
}

function init() {
  // Migrate state: ensure new keys exist for older stored data
  if (!state.contracts) state.contracts = {};
  if (!state.budgets) state.budgets = {};
  if (!state.payrollSettlements) state.payrollSettlements = {};
  if (!state.locationBudgets) state.locationBudgets = { [DEFAULT_LOCATION_ID]: state.budgets };
  if (!state.locationSettings) state.locationSettings = structuredClone(DEFAULT_LOCATION_SETTINGS);
  if (!Array.isArray(state.employees)) state.employees = structuredClone(DEFAULT_EMPLOYEES);
  if (!Array.isArray(state.wasteRecords)) state.wasteRecords = [];
  state.employees = mergeDefaultEmployees(state.employees);
  removePabloFromState(state);
  state.baseSchedules = mergeBaseSchedules(DEFAULT_BASE_SCHEDULES, state.baseSchedules, state.employees);
  addDefaultProfilesForNewEmployees(state);
  tagLegacyRecordsWithLocation(state);
  populateSelectors();
  bindEvents();
  initFichasContratos();
  hydrateSettingsForm();
  setTodayDefaults();
  initFinanzas();
  render();
  // Carga automática de datos históricos (o re-carga si la versión cambió)
  const HIST_VERSION = '2';
  if (state.historicalLoaded !== HIST_VERSION) {
    loadHistoricalData(HIST_VERSION);
  }
}

async function loadHistoricalData(version) {
  try {
    const resp = await fetch('/historical_data.json');
    if (!resp.ok) return;
    const hist = await resp.json();
    // Reemplazar todos los registros históricos con los del JSON actualizado
    state.sales    = [
      ...state.sales.filter(s => !s.id?.startsWith('hist-')),
      ...hist.sales.map((sale) => ({ ...sale, locationId: DEFAULT_LOCATION_ID })),
    ];
    state.expenses = [
      ...state.expenses.filter(e => !e.id?.startsWith('hist-')),
      ...hist.expenses.map((expense) => ({ ...expense, locationId: DEFAULT_LOCATION_ID })),
    ];
    state.historicalLoaded = version;
    saveState();
    render();
  } catch (e) {
    // silencioso — si no hay archivo simplemente no carga
  }
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  els.prevMonth.addEventListener("click", () => {
    activeMonth = addMonths(activeMonth, -1);
    storeHoursActiveMonth = firstDayOfMonth(activeMonth);
    render();
  });

  els.nextMonth.addEventListener("click", () => {
    activeMonth = addMonths(activeMonth, 1);
    storeHoursActiveMonth = firstDayOfMonth(activeMonth);
    render();
  });

  els.monthPicker.addEventListener("change", (event) => {
    if (!event.target.value) return;
    const [year, month] = event.target.value.split("-").map(Number);
    activeMonth = new Date(year, month - 1, 1);
    storeHoursActiveMonth = firstDayOfMonth(activeMonth);
    render();
  });

  els.employeeLegend.addEventListener("click", (event) => {
    const button = event.target.closest("[data-grid-employee]");
    if (!button) return;
    const hidden = getHiddenGridEmployees();
    const employeeId = button.dataset.gridEmployee;
    if (hidden.has(employeeId)) hidden.delete(employeeId);
    else hidden.add(employeeId);
    renderLegend();
    renderSchedule();
    renderMetrics();
  });

  els.storeHoursPrevMonth.addEventListener("click", () => {
    storeHoursActiveMonth = addMonths(storeHoursActiveMonth, -1);
    renderStoreHoursEditor();
  });
  els.storeHoursNextMonth.addEventListener("click", () => {
    storeHoursActiveMonth = addMonths(storeHoursActiveMonth, 1);
    renderStoreHoursEditor();
  });
  els.storeHoursMonth.addEventListener("change", (event) => {
    if (!event.target.value) return;
    const [year, month] = event.target.value.split("-").map(Number);
    storeHoursActiveMonth = new Date(year, month - 1, 1);
    renderStoreHoursEditor();
  });

  els.exportCsv.addEventListener("click", exportCsv);
  els.printPdf.addEventListener("click", () => window.print());
  els.punchForm.addEventListener("submit", handlePunch);
  els.mockOnTime.addEventListener("click", createMockPunches);
  els.emailLateReport.addEventListener("click", sendLateReport);
  els.changeForm.addEventListener("submit", handleChangeRequest);
  els.trafficForm.addEventListener("submit", handleTrafficImport);
  els.loadTrafficSample.addEventListener("click", loadTrafficSample);
  els.trafficPrevMonth?.addEventListener("click", () => {
    trafficActiveMonth = addMonths(trafficActiveMonth, -1);
    renderTraffic();
    if (appRole === 'admin') syncBistrosoftTrafficMonth(true);
  });
  els.trafficNextMonth?.addEventListener("click", () => {
    trafficActiveMonth = addMonths(trafficActiveMonth, 1);
    renderTraffic();
    if (appRole === 'admin') syncBistrosoftTrafficMonth(true);
  });
  els.saveSettings.addEventListener("click", saveSettings);
  els.addHoliday.addEventListener("click", addHoliday);
  els.backupExport.addEventListener("click", exportStateBackup);
  els.backupImportButton.addEventListener("click", chooseStateBackupFile);
  els.backupImportFile.addEventListener("change", importStateBackupFile);
}

function populateSelectors() {
  const employees = getEmployees();
  const employeeOptions = employees.map((employee) => {
    return `<option value="${employee.id}">${employee.label} - ${employee.role}</option>`;
  }).join("");

  els.punchEmployee.innerHTML = employeeOptions;
  els.changeEmployee.innerHTML = employeeOptions;
  els.replacementEmployee.innerHTML = [
    `<option value="">Sin reemplazo</option>`,
    ...employees.map((employee) => `<option value="${employee.id}">${employee.label}</option>`),
  ].join("");
}

function setTodayDefaults() {
  const today = toDateInput(new Date());
  els.changeDate.value = today;
  els.holidayDate.value = today;
  document.querySelector('#finExpDate').value = today;
  const manualSaleDate = document.querySelector('#finManualSaleDate');
  if (manualSaleDate) manualSaleDate.value = today;
  const teamActiveFrom = document.querySelector('#teamMemberActiveFrom');
  if (teamActiveFrom) teamActiveFrom.value = today;
}

function setActiveTab(tab) {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-visible", panel.dataset.panel === tab);
  });

  // Topbar y KPIs solo visibles en Grilla
  const isSchedule = tab === "schedule";
  const metricsGrid = document.querySelector(".metrics-grid");
  if (metricsGrid) metricsGrid.style.display = isSchedule ? "" : "none";
  const topbar = document.querySelector(".topbar");
  if (topbar) topbar.style.display = isSchedule ? "" : "none";
}

function render() {
  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();
  els.monthTitle.textContent = `Grilla ${getLocation().label} · ${MONTH_NAMES[month]} ${year}`;
  els.monthPicker.value = `${year}-${String(month + 1).padStart(2, "0")}`;

  renderLegend();
  renderSchedule();
  renderStoreHoursEditor();
  renderMetrics();
  renderPunches();
  renderChanges();
  renderTraffic();
  renderHolidays();
  renderAdminFichas();
  renderContratosPanel();
  renderPersonnelPanel();
  renderFinanzas();
  saveState();
}

function renderLegend() {
  const hidden = getHiddenGridEmployees();
  const monthDays = getMonthDays(activeMonth).map(toDateInput);
  els.employeeLegend.innerHTML = getEmployees().map((employee) => {
    const monthlyHours = monthDays.reduce((total, dateKey) =>
      total + getShiftsForDate(dateKey)
        .filter((shift) => shift.employeeId === employee.id)
        .reduce((dayTotal, shift) => dayTotal + shift.end - shift.start, 0), 0);
    const isHidden = hidden.has(employee.id);
    return `
      <button class="legend-item legend-toggle${isHidden ? " is-off" : ""}" type="button"
        data-grid-employee="${employee.id}" aria-pressed="${isHidden ? "false" : "true"}"
        title="${isHidden ? "Mostrar" : "Ocultar"} a ${escapeHtml(employee.label)} en esta grilla">
        <span class="legend-swatch" style="background:${employee.color}"></span>
        <span class="legend-copy">
          <strong>${escapeHtml(employee.label)}</strong>
          <small>${formatHours(monthlyHours)} este mes</small>
        </span>
      </button>
    `;
  }).join("");
}

function getHiddenGridEmployees() {
  const key = `${activeLocationId}:${monthInputValue(activeMonth)}`;
  if (!hiddenGridEmployees.has(key)) hiddenGridEmployees.set(key, new Set());
  return hiddenGridEmployees.get(key);
}

function getVisibleShiftsForDate(dateKey) {
  const hidden = getHiddenGridEmployees();
  return getShiftsForDate(dateKey).filter((shift) => !hidden.has(shift.employeeId));
}

function renderSchedule() {
  const days = getMonthDays(activeMonth);
  const rows = days.map((date) => renderDayRow(date)).join("");

  els.scheduleTable.innerHTML = `
    <div class="schedule-ruler">
      <div class="ruler-spacer">Dia</div>
      <div class="hour-grid">
        ${range(7, 19).map((hour) => `<div class="hour-cell">${hour}:00</div>`).join("")}
      </div>
      <div class="hours-total">Horas</div>
    </div>
    ${rows}
  `; 
}

function renderDayRow(date) {
  const dateKey = toDateInput(date);
  const day = date.getDay();
  const shifts = getVisibleShiftsForDate(dateKey);
  const dayHours = shifts.reduce((sum, shift) => sum + shift.end - shift.start, 0);
  const lanes = layoutShifts(shifts);
  const height = Math.max(94, 18 + lanes.length * 33);
  const holiday = getHoliday(dateKey);
  const rowClasses = [
    "day-row",
    day === 0 || day === 6 ? "is-weekend" : "",
    holiday ? "is-holiday" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="${rowClasses}" data-schedule-date="${dateKey}" style="min-height:${height}px">
      <div class="day-info">
        <span class="day-name">${DAY_NAMES[day]} ${date.getDate()}</span>
        <span class="day-meta">${escapeHtml(getOpenLabelForDate(dateKey))}</span>
      </div>
      <div class="timeline" style="min-height:${height}px">
        ${lanes
          .map((shift, index) => {
            const employee = getEmployee(shift.employeeId, dateKey);
            const startPercent = ((shift.start - 7) / 13) * 100;
            const widthPercent = ((shift.end - shift.start) / 13) * 100;
            const top = 13 + index * 33;
            const sourceLabel = shift.source === "base" ? "" : shift.source;
            return `
              <div class="shift-bar" title="${employee.label} ${formatHour(shift.start)}-${formatHour(shift.end)}" style="left:${startPercent}%; width:${widthPercent}%; top:${top}px; background:${employee.color}">
                <span>${employee.label}</span>
                <small>${formatHour(shift.start)}-${formatHour(shift.end)} ${sourceLabel}</small>
              </div>
            `;
          })
          .join("")}
      </div>
      <div class="day-hours">${formatHours(dayHours)}</div>
    </div>
  `;
}

function renderMetrics() {
  const days = getMonthDays(activeMonth).map(toDateInput);
  const planned = days.reduce((sum, dateKey) => {
    return sum + getVisibleShiftsForDate(dateKey).reduce((daySum, shift) => daySum + shift.end - shift.start, 0);
  }, 0);
  const pending = getLocationChanges().filter((change) => change.status === "pending").length;
  const suggestions = getSuggestions();

  els.plannedHours.textContent = formatHours(planned);
  els.pendingCount.textContent = String(pending);
  els.suggestionCount.textContent = String(suggestions.length);
}

function renderPunches() {
  const punches = getLocationPunches()
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 12);

  if (!punches.length) {
    renderEmpty(els.punchList);
    return;
  }

  els.punchList.innerHTML = punches
    .map((punch) => {
      const employee = getEmployee(punch.employeeId, punch.date);
      const statusClass = punch.status === "late" ? "status-late" : punch.status === "outside" ? "status-outside" : "status-approved";
      const statusText = punch.status === "late" ? "Tarde" : punch.status === "outside" ? "Fuera de radio" : "OK";
      return `
        <article class="event-item${punch.autoClosed ? ' auto-closed-punch' : ''}">
          <div class="event-topline">
            <span>${employee.label} - ${punch.type === "in" ? "Entrada" : "Salida"}</span>
            <span class="status-pill ${statusClass}">${statusText}</span>
          </div>
          <div class="event-meta">${formatDateTime(punch.timestamp)} · ${punch.geoLabel || "Sin ubicacion"}</div>
        </article>
      `;
    })
    .join("");
}

function renderChanges() {
  const pending = getLocationChanges().filter((change) => change.status === "pending").length;
  els.approvalSummary.textContent = `${pending} pendientes`;

  const changes = getLocationChanges();
  if (!changes.length) {
    renderEmpty(els.changeList);
    return;
  }

  els.changeList.innerHTML = changes
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((change) => {
      const employee = getEmployee(change.employeeId, change.date);
      const replacement = change.replacementEmployeeId ? getEmployee(change.replacementEmployeeId, change.date).label : "";
      const statusClass = change.status === "approved" ? "status-approved" : change.status === "rejected" ? "status-rejected" : "status-pending";
      const label = actionLabel(change.action);
      return `
        <article class="event-item">
          <div class="event-topline">
            <span>${label} · ${employee.label}</span>
            <span class="status-pill ${statusClass}">${statusLabel(change.status)}</span>
          </div>
          <div class="event-meta">
            ${formatHumanDate(change.date)} · ${change.start}-${change.end} · ${change.reason}
            ${replacement ? ` · Reemplaza ${replacement}` : ""}
            ${change.note ? ` · ${escapeHtml(change.note)}` : ""}
          </div>
          ${
            change.status === "pending"
              ? `
                <div class="event-actions">
                  <button class="mini-button" type="button" data-approve="${change.id}">Aprobar</button>
                  <button class="mini-button danger" type="button" data-reject="${change.id}">Rechazar</button>
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");

  els.changeList.querySelectorAll("[data-approve]").forEach((button) => {
    button.addEventListener("click", () => updateChangeStatus(button.dataset.approve, "approved"));
  });

  els.changeList.querySelectorAll("[data-reject]").forEach((button) => {
    button.addEventListener("click", () => updateChangeStatus(button.dataset.reject, "rejected"));
  });
}

function renderTraffic() {
  const analysis = getHourlySalesAnalysis();
  const suggestions = analysis.criticalRows;
  if (els.trafficMonthDisplay) {
    els.trafficMonthDisplay.textContent = `${MONTH_NAMES[trafficActiveMonth.getMonth()]} ${trafficActiveMonth.getFullYear()}`;
  }
  els.trafficSummary.textContent = analysis.hourlyRows.length
    ? `${analysis.hourlyRows.length} franjas con ventas · ${suggestions.length} criticas`
    : "Sin ventas horarias";

  if (!analysis.hourlyRows.length) {
    els.suggestionList.innerHTML = `
      <div class="empty-state">
        Sin ventas con hora para ${MONTH_NAMES[trafficActiveMonth.getMonth()]} ${trafficActiveMonth.getFullYear()}.
        Sincroniza Bistrosoft para esta sucursal o revisa que las ventas importadas incluyan hora.
      </div>`;
    return;
  }

  const topRows = suggestions.slice(0, 10);
  const peak = analysis.hourlyRows[0];
  const busiestDay = analysis.busiestDay;
  const bestHour = analysis.bestHour;
  const unassignedNote = analysis.unassignedTickets
    ? `<p class="form-note" style="margin:10px 0 0">${analysis.unassignedTickets} tickets (${formatEur(analysis.unassignedSales)}) no tienen hora y no entran en la carga horaria.</p>`
    : '';

  const cards = `
    <div class="fin-kpi-grid fin-resumen-kpi-grid" style="margin-bottom:16px">
      <div class="fin-kpi-card"><span>Venta promedio / hora activa</span><strong>${formatEur(analysis.avgSalesPerActiveHour)}</strong><small>${formatEur(analysis.totalSales)} total con hora</small></div>
      <div class="fin-kpi-card"><span>Tickets promedio / hora activa</span><strong>${analysis.avgTicketsPerActiveHour.toFixed(1)}</strong><small>${analysis.totalTickets} tickets con hora</small></div>
      <div class="fin-kpi-card"><span>Hora pico</span><strong>${formatHumanDate(peak.date)} · ${formatHour(peak.hour)}</strong><small>${peak.tickets} tickets · ${formatEur(peak.sales)}</small></div>
      <div class="fin-kpi-card"><span>Horas criticas</span><strong>${suggestions.length}</strong></div>
      <div class="fin-kpi-card"><span>Tickets por persona</span><strong>${analysis.avgTicketsPerStaffHour.toFixed(1)}</strong><small>promedio por hora cubierta</small></div>
      <div class="fin-kpi-card"><span>Venta por persona</span><strong>${formatEur(analysis.avgSalesPerStaffHour)}</strong><small>promedio por hora cubierta</small></div>
      <div class="fin-kpi-card"><span>Día más cargado</span><strong>${busiestDay ? formatHumanDate(busiestDay.date) : '—'}</strong><small>${busiestDay ? `${busiestDay.tickets} tickets · ${formatEur(busiestDay.sales)}` : ''}</small></div>
      <div class="fin-kpi-card"><span>Mejor franja promedio</span><strong>${bestHour ? `${formatHour(bestHour.hour)}-${formatHour(bestHour.hour + 1)}` : '—'}</strong><small>${bestHour ? `${bestHour.tickets} tickets · ${formatEur(bestHour.sales)}` : ''}</small></div>
    </div>`;

  const suggestionHtml = topRows.length ? topRows.map((item) => `
    <article class="event-item">
      <div class="event-topline">
        <span>${formatHumanDate(item.date)} · ${formatHour(item.hour)}-${formatHour(item.hour + 1)}</span>
        <span class="status-pill status-pending">+${item.missing}</span>
      </div>
      <div class="event-meta">
        ${item.tickets} tickets · ${formatEur(item.sales)} · ${item.staffCount} persona${item.staffCount !== 1 ? 's' : ''} en grilla · carga ${item.loadPct.toFixed(0)}%
      </div>
    </article>`).join('')
    : '<div class="empty-state">No hay horas que superen los parametros actuales.</div>';

  const tableRows = analysis.hourlyRows.slice(0, 80).map((item) => {
    const loadClass = item.loadPct >= 120 ? 'fin-cell-negative' : item.loadPct >= 90 ? 'fin-cell-warning' : 'fin-cell-positive';
    return `<tr>
      <td>${formatHumanDate(item.date)}</td>
      <td>${formatHour(item.hour)}-${formatHour(item.hour + 1)}</td>
      <td class="fin-cell-num">${item.tickets}</td>
      <td class="fin-cell-num">${formatEur(item.sales)}</td>
      <td class="fin-cell-num">${formatEur(item.avgTicket)}</td>
      <td class="fin-cell-num">${item.staffCount || '—'}</td>
      <td class="fin-cell-num ${loadClass}">${item.loadPct > 0 ? item.loadPct.toFixed(0) + '%' : '—'}</td>
      <td class="fin-cell-num">${item.missing > 0 ? '+' + item.missing : '—'}</td>
    </tr>`;
  }).join('');

  els.suggestionList.innerHTML = `
    ${cards}
    ${unassignedNote}
    <div class="traffic-visual-grid">
      <section class="traffic-critical-panel">
        <h3>Refuerzos sugeridos</h3>
        ${suggestionHtml}
      </section>
      ${renderHourlyHeatmap(analysis)}
    </div>
    ${renderPeakProductInsights(analysis)}
    ${renderArticleSalesInsights()}
    <h3 style="margin:18px 0 10px">Detalle por hora</h3>
    <div style="overflow-x:auto">
      <table class="fin-table">
        <thead><tr>
          <th>Fecha</th>
          <th>Hora</th>
          <th class="fin-cell-num">Tickets</th>
          <th class="fin-cell-num">Ventas</th>
          <th class="fin-cell-num">Ticket prom.</th>
          <th class="fin-cell-num">Personas</th>
          <th class="fin-cell-num">Carga</th>
          <th class="fin-cell-num">Refuerzo</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
  return;

  els.suggestionList.innerHTML = suggestions
    .map((item) => {
      return `
        <article class="event-item">
          <div class="event-topline">
            <span>${formatHumanDate(item.date)} · ${item.hour}:00</span>
            <span class="status-pill status-pending">+${item.missing}</span>
          </div>
          <div class="event-meta">
            ${item.visitors} visitantes · ${item.staffCount} personas planificadas · sugerido ${item.recommendedStaff}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderHolidays() {
  const holidays = getLocationSettings().holidays || [];
  if (!holidays.length) {
    renderEmpty(els.holidayList);
    return;
  }

  els.holidayList.innerHTML = holidays
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((holiday) => {
      return `
        <article class="event-item">
          <div class="event-topline">
            <span>${formatHumanDate(holiday.date)}</span>
            <button class="mini-button danger" type="button" data-remove-holiday="${holiday.date}">Quitar</button>
          </div>
          <div class="event-meta">${escapeHtml(holiday.name || "Feriado")} · ${holiday.open}-${holiday.close}</div>
        </article>
      `;
    })
    .join("");

  els.holidayList.querySelectorAll("[data-remove-holiday]").forEach((button) => {
    button.addEventListener("click", () => {
      updateLocationSettings({
        holidays: (getLocationSettings().holidays || []).filter((holiday) => holiday.date !== button.dataset.removeHoliday),
      });
      render();
    });
  });
}

async function handlePunch(event) {
  event.preventDefault();
  const employeeId = els.punchEmployee.value;
  const type = els.punchType.value;
  const now = new Date();
  const dateKey = toDateInput(now);
  els.geoStatus.textContent = "Validando ubicacion...";

  const geo = await getCurrentLocation();
  const geoResult = evaluateGeo(geo);
  const status = type === "in" ? getPunchStatus(employeeId, dateKey, now, geoResult) : geoResult.status;

  state.punches.push({
    id: createId(),
    employeeId,
    locationId: activeLocationId,
    type,
    timestamp: now.toISOString(),
    date: dateKey,
    status,
    geo,
    geoLabel: geoResult.label,
  });

  els.geoStatus.textContent = geoResult.message;
  render();
}

function createMockPunches() {
  const employeeId = els.punchEmployee.value;
  const today = toDateInput(new Date());
  const shifts = getShiftsForDate(today).filter((shift) => shift.employeeId === employeeId);
  if (!shifts.length) {
    els.geoStatus.textContent = "No hay turno planificado para hoy.";
    return;
  }

  const shift = shifts[0];
  const start = dateWithTime(today, shift.start);
  const end = dateWithTime(today, shift.end);
  state.punches.push({
    id: createId(),
    employeeId,
    locationId: activeLocationId,
    type: "in",
    timestamp: start.toISOString(),
    date: today,
    status: "ok",
    geo: null,
    geoLabel: "Simulado",
  });
  state.punches.push({
    id: createId(),
    employeeId,
    locationId: activeLocationId,
    type: "out",
    timestamp: end.toISOString(),
    date: today,
    status: "ok",
    geo: null,
    geoLabel: "Simulado",
  });
  els.geoStatus.textContent = "Fichaje simulado creado.";
  render();
}

function handleChangeRequest(event) {
  event.preventDefault();
  state.changes.push({
    id: createId(),
    locationId: activeLocationId,
    date: els.changeDate.value,
    employeeId: els.changeEmployee.value,
    replacementEmployeeId: els.replacementEmployee.value,
    reason: els.changeReason.value,
    action: els.changeAction.value,
    start: els.changeStart.value,
    end: els.changeEnd.value,
    note: els.changeNote.value.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  els.changeNote.value = "";
  render();
}

function updateChangeStatus(id, status) {
  state.changes = state.changes.map((change) => {
    return change.id === id ? { ...change, status, reviewedAt: new Date().toISOString(), reviewedBy: "Administrador" } : change;
  });
  render();
}

function handleTrafficImport(event) {
  event.preventDefault();
  render();
}

async function loadTrafficSample() {
  if (appRole === 'admin') {
    if (finBistroSync.available !== true) await initBistrosoftSync();
    await syncBistrosoftTrafficMonth(false);
  }
  render();
}

function saveSettings() {
  updateLocationSettings({
    adminEmail: els.adminEmail.value.trim(),
    storeLat: els.storeLat.value.trim(),
    storeLng: els.storeLng.value.trim(),
    geoRadius: Number(els.geoRadius.value || 120),
    lateTolerance: Number(els.lateTolerance.value || 5),
  });
  render();
}

function hydrateSettingsForm() {
  const settings = getLocationSettings();
  els.adminEmail.value = settings.adminEmail || "";
  els.storeLat.value = settings.storeLat || "";
  els.storeLng.value = settings.storeLng || "";
  els.geoRadius.value = settings.geoRadius || 120;
  els.lateTolerance.value = settings.lateTolerance || 5;
}

async function exportStateBackup() {
  try {
    if (sharedStatePending && !sharedStateSaving) {
      await flushSharedState();
    }
    const payload = {
      type: "oss-kaffe-state-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      source: window.location.origin,
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `oss-kaffe-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupStatus("Respaldo exportado. Importalo solamente en el Netlify que queres actualizar.");
  } catch (error) {
    setBackupStatus(error.message || "No se pudo exportar el respaldo.", true);
  }
}

function chooseStateBackupFile() {
  els.backupImportFile.value = "";
  els.backupImportFile.click();
}

async function importStateBackupFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text());
    const importedState = payload?.type === "oss-kaffe-state-backup"
      ? payload.state
      : payload?.state || payload;

    if (!looksLikeStateBackup(importedState)) {
      throw new Error("El archivo no parece ser un respaldo valido de OSS Kaffe.");
    }

    const source = payload?.source ? `\nOrigen: ${payload.source}` : "";
    const exportedAt = payload?.exportedAt ? `\nExportado: ${formatDateTime(new Date(payload.exportedAt))}` : "";
    const ok = confirm(
      `Esto reemplazara los datos de este sitio Netlify por el respaldo seleccionado.${source}${exportedAt}\n\nAntes de seguir, exporta un respaldo de este sitio si queres conservarlo.`
    );
    if (!ok) {
      setBackupStatus("Importacion cancelada.");
      return;
    }

    const nextState = seedDefaultHolidays(mergeState(DEFAULT_STATE, importedState));

    if (sharedStateEnabled && appRole === "admin") {
      await saveImportedStateToServer(nextState);
    }

    state = nextState;
    saveState({ shared: false });
    populateSelectors();
    hydrateSettingsForm();
    renderEmployeeChoiceButtons();
    render();
    setBackupStatus("Respaldo importado y guardado. Este sitio ya tiene la misma base de datos del archivo.");
  } catch (error) {
    setBackupStatus(error.message || "No se pudo importar el respaldo.", true);
  } finally {
    event.target.value = "";
  }
}

async function parseApiError(response, fallback) {
  try {
    const payload = await response.json();
    return payload?.error || fallback;
  } catch (_) {
    return fallback;
  }
}

async function sendStateImportRequest(payload) {
  const response = await fetch("/api/state/import", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 404) {
    return { unsupported: true };
  }

  if (!response.ok) {
    const detail = await parseApiError(response, "No se pudo guardar el respaldo en Netlify.");
    throw new Error(`${detail} (HTTP ${response.status})`);
  }

  return { unsupported: false };
}

async function saveImportedStateToLegacyEndpoint(nextState) {
  const response = await fetch("/api/state", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: nextState }),
  });

  if (!response.ok) {
    const detail = await parseApiError(response, "No se pudo guardar el respaldo en Netlify.");
    throw new Error(`${detail} (HTTP ${response.status})`);
  }
}

async function saveImportedStateToServer(nextState) {
  const stateJson = JSON.stringify(nextState);
  const importId = createId();
  const chunkSize = 500_000;
  const totalChunks = Math.max(1, Math.ceil(stateJson.length / chunkSize));

  setBackupStatus("Preparando respaldo para guardar en Netlify...");

  const start = await sendStateImportRequest({
    action: "start",
    importId,
    totalChunks,
    byteLength: stateJson.length,
  });

  if (start.unsupported) {
    setBackupStatus("Guardando respaldo en Netlify...");
    await saveImportedStateToLegacyEndpoint(nextState);
    return;
  }

  for (let index = 0; index < totalChunks; index += 1) {
    const chunk = stateJson.slice(index * chunkSize, (index + 1) * chunkSize);
    setBackupStatus(`Subiendo respaldo ${index + 1}/${totalChunks}...`);
    await sendStateImportRequest({
      action: "chunk",
      importId,
      totalChunks,
      index,
      chunk,
    });
  }

  setBackupStatus("Reconstruyendo respaldo y guardando en Netlify...");
  await sendStateImportRequest({ action: "finish", importId, totalChunks });
}

function looksLikeStateBackup(candidate) {
  return !!candidate
    && typeof candidate === "object"
    && Array.isArray(candidate.punches)
    && Array.isArray(candidate.changes)
    && Array.isArray(candidate.sales)
    && Array.isArray(candidate.expenses)
    && candidate.settings
    && typeof candidate.settings === "object";
}

function setBackupStatus(message, isError = false) {
  if (!els.backupStatus) return;
  els.backupStatus.textContent = message;
  els.backupStatus.classList.toggle("is-error", isError);
}

function addHoliday() {
  if (!els.holidayDate.value) return;
  const nextHoliday = {
    date: els.holidayDate.value,
    name: els.holidayName.value.trim() || "Feriado",
    open: els.holidayOpen.value || "10:00",
    close: els.holidayClose.value || "19:00",
  };

  updateLocationSettings({
    holidays: [
      ...(getLocationSettings().holidays || []).filter((holiday) => holiday.date !== nextHoliday.date),
      nextHoliday,
    ],
  });
  els.holidayName.value = "";
  render();
}

function sendLateReport() {
  const email = getLocationSettings().adminEmail || els.adminEmail.value.trim();
  if (!email) {
    setActiveTab("settings");
    els.adminEmail.focus();
    return;
  }

  const monthKey = monthInputValue(activeMonth);
  const flagged = getLocationPunches().filter((punch) => {
    return punch.date.startsWith(monthKey) && (punch.status === "late" || punch.status === "outside");
  });

  const body = flagged.length
    ? flagged
        .map((punch) => {
          const employee = getEmployee(punch.employeeId, punch.date);
          return `${formatDateTime(punch.timestamp)} - ${employee.label} - ${punch.status} - ${punch.geoLabel || ""}`;
        })
        .join("\n")
    : "No hay llegadas tarde ni fichajes fuera de radio en el mes seleccionado.";

  const subject = `Reporte de fichajes Oss ${getLocation().label} ${monthKey}`;
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function exportCsv() {
  const rows = [["date", "weekday", "employee", "start", "end", "hours", "source"]];
  getMonthDays(activeMonth).forEach((date) => {
    const dateKey = toDateInput(date);
    getShiftsForDate(dateKey).forEach((shift) => {
      const employee = getEmployee(shift.employeeId, dateKey);
      rows.push([
        dateKey,
        DAY_NAMES[date.getDay()],
        employee.label,
        formatHour(shift.start),
        formatHour(shift.end),
        (shift.end - shift.start).toFixed(2),
        shift.source,
      ]);
    });
  });

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `oss-grilla-${monthInputValue(activeMonth)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getBaseShifts(dateKey) {
  const date = parseDateKey(dateKey);
  const day = date.getDay();
  const shifts = [];

  getAllEmployees(true)
    .filter((employee) => normalizeLocationId(employee.locationId) === activeLocationId)
    .forEach((employee) => {
      const schedule = getEmployeeBaseSchedule(employee.id);
      const weekKey = getScheduleWeekKey(schedule, dateKey);
      const dayShifts = schedule.weeks?.[weekKey]?.[day] || [];
      dayShifts.forEach((shift) => {
        shifts.push(makeShift(
          employee.id,
          timeToDecimal(shift.start),
          timeToDecimal(shift.end),
          schedule.mode === "biweekly" ? `Semana ${weekKey.toUpperCase()}` : "base",
        ));
      });
    });

  return shifts;
}

function getShiftsForDate(dateKey) {
  let shifts = getBaseShifts(dateKey);
  const approved = getLocationChanges().filter((change) => change.date === dateKey && change.status === "approved");

  approved.forEach((change) => {
    const start = timeToDecimal(change.start);
    const end = timeToDecimal(change.end);
    if (change.action === "absence") {
      shifts = shifts.filter((shift) => {
        const sameEmployee = shift.employeeId === change.employeeId;
        const overlaps = shift.start < end && shift.end > start;
        return !(sameEmployee && overlaps);
      });
    }

    if (change.action === "replace") {
      shifts = shifts.filter((shift) => {
        const sameEmployee = shift.employeeId === change.employeeId;
        const overlaps = shift.start < end && shift.end > start;
        return !(sameEmployee && overlaps);
      });
      if (change.replacementEmployeeId) {
        shifts.push(makeShift(change.replacementEmployeeId, start, end, "reemplazo"));
      }
    }

    if (change.action === "extra") {
      shifts.push(makeShift(change.employeeId, start, end, "extra"));
    }

  });

  return shifts
    .filter((shift) => getEmployeeLocationId(shift.employeeId) === activeLocationId)
    .filter((shift) => isEmployeeActiveOnDate(getEmployee(shift.employeeId, dateKey), dateKey))
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

function getOpenLabel(day) {
  return getRegularOpeningPeriods(day)
    .map((hours) => `${formatHour(hours.open)}-${formatHour(hours.close)}`)
    .join(" / ") + " local";
}

function getOpeningOverride(dateKey, locationId = activeLocationId) {
  return getLocationSettings(locationId).monthlyOpeningHours?.[dateKey] || null;
}

function getDefaultOpeningForDate(dateKey) {
  const holiday = getHoliday(dateKey);
  if (holiday) return { open: holiday.open || "10:00", close: holiday.close || "19:00" };
  const day = new Date(`${dateKey}T12:00:00`).getDay();
  const periods = getRegularOpeningPeriods(day);
  return {
    open: formatHour(periods[0].open),
    close: formatHour(periods[periods.length - 1].close),
  };
}

function getOpenLabelForDate(dateKey) {
  const override = getOpeningOverride(dateKey);
  const holiday = getHoliday(dateKey);
  if (override?.closed) return holiday ? `${holiday.name || "Feriado"} · cerrado` : "Cerrado";
  if (override?.open && override?.close) {
    return `${holiday ? `${holiday.name || "Feriado"} · ` : ""}${override.open}-${override.close} local`;
  }
  if (holiday) return `${holiday.name || "Feriado"} ${holiday.open}-${holiday.close}`;
  return getOpenLabel(new Date(`${dateKey}T12:00:00`).getDay());
}

function saveOpeningOverride(dateKey, values) {
  const settings = getLocationSettings();
  updateLocationSettings({
    monthlyOpeningHours: {
      ...(settings.monthlyOpeningHours || {}),
      [dateKey]: values,
    },
  });
  saveState();
  if (dateKey.startsWith(monthInputValue(activeMonth))) renderSchedule();
}

function resetOpeningOverride(dateKey) {
  const monthlyOpeningHours = { ...(getLocationSettings().monthlyOpeningHours || {}) };
  delete monthlyOpeningHours[dateKey];
  updateLocationSettings({ monthlyOpeningHours });
  saveState();
  if (dateKey.startsWith(monthInputValue(activeMonth))) renderSchedule();
}

function renderStoreHoursEditor() {
  if (!els.storeHoursEditor || !els.storeHoursDays) return;
  const canEdit = appRole === "admin";
  els.storeHoursEditor.hidden = !canEdit;
  if (!canEdit) return;
  const monthKey = monthInputValue(storeHoursActiveMonth);
  els.storeHoursMonth.value = monthKey;
  const rows = getMonthDays(storeHoursActiveMonth).map((date) => {
    const dateKey = toDateInput(date);
    const override = getOpeningOverride(dateKey);
    const defaults = getDefaultOpeningForDate(dateKey);
    const holiday = getHoliday(dateKey);
    const closed = override?.closed === true;
    return `
      <div class="store-hours-row${override ? " is-custom" : ""}${closed ? " is-closed" : ""}" data-store-date="${dateKey}">
        <div class="store-hours-date">
          <strong>${DAY_NAMES[date.getDay()]} ${date.getDate()}</strong>
          <small>${holiday ? escapeHtml(holiday.name || "Feriado") : override ? "Horario personalizado" : "Horario predeterminado"}</small>
        </div>
        <label>Apertura
          <input type="time" data-store-open value="${escapeHtml(override?.open || defaults.open)}"${closed ? " disabled" : ""} />
        </label>
        <label>Cierre
          <input type="time" data-store-close value="${escapeHtml(override?.close || defaults.close)}"${closed ? " disabled" : ""} />
        </label>
        <label class="store-closed-toggle">
          <input type="checkbox" data-store-closed${closed ? " checked" : ""} />
          <span>Cerrado</span>
        </label>
        <button class="mini-button" type="button" data-store-reset${override ? "" : " disabled"}>Usar predeterminado</button>
      </div>`;
  }).join("");
  els.storeHoursDays.innerHTML = `<div class="store-hours-list">${rows}</div>`;

  els.storeHoursDays.querySelectorAll("[data-store-date]").forEach((row) => {
    const dateKey = row.dataset.storeDate;
    const openInput = row.querySelector("[data-store-open]");
    const closeInput = row.querySelector("[data-store-close]");
    const closedInput = row.querySelector("[data-store-closed]");
    const persist = () => {
      const closed = closedInput.checked;
      if (!closed && (!openInput.value || !closeInput.value || openInput.value >= closeInput.value)) {
        alert("La hora de cierre debe ser posterior a la apertura.");
        renderStoreHoursEditor();
        return;
      }
      saveOpeningOverride(dateKey, {
        open: openInput.value || getDefaultOpeningForDate(dateKey).open,
        close: closeInput.value || getDefaultOpeningForDate(dateKey).close,
        closed,
      });
      renderStoreHoursEditor();
    };
    openInput.addEventListener("change", persist);
    closeInput.addEventListener("change", persist);
    closedInput.addEventListener("change", persist);
    row.querySelector("[data-store-reset]").addEventListener("click", () => {
      resetOpeningOverride(dateKey);
      renderStoreHoursEditor();
    });
  });
}

function getRegularOpeningPeriods(day) {
  if (activeLocationId === "madrid") {
    if (day === 1) return [{ open: 8.5, close: 14 }, { open: 16, close: 19 }];
    if (day >= 2 && day <= 5) return [{ open: 8.5, close: 14 }, { open: 16, close: 20 }];
    if (day === 6) return [{ open: 9, close: 14 }, { open: 16, close: 20 }];
    return [{ open: 10, close: 20 }];
  }
  if (day === 6) return [{ open: 9, close: 19 }];
  if (day === 0) return [{ open: 10, close: 19 }];
  return [{ open: 8.5, close: 19 }];
}

function getRegularOpeningHours(day) {
  const periods = getRegularOpeningPeriods(day);
  if (Array.isArray(periods)) {
    return { open: periods[0].open, close: periods[periods.length - 1].close };
  }
  return periods;
}

function getHoliday(dateKey) {
  return (getLocationSettings().holidays || []).find((holiday) => holiday.date === dateKey);
}

function makeShift(employeeId, start, end, source) {
  return { id: createId(), employeeId, start, end, source };
}

function getEmployeeBaseSchedule(employeeId) {
  if (!state.baseSchedules) {
    state.baseSchedules = mergeBaseSchedules(DEFAULT_BASE_SCHEDULES, {}, state.employees || DEFAULT_EMPLOYEES);
  }
  if (!state.baseSchedules[employeeId]) {
    state.baseSchedules[employeeId] = createBlankBaseSchedule();
  }
  state.baseSchedules[employeeId] = normalizeBaseSchedule(state.baseSchedules[employeeId]);
  return state.baseSchedules[employeeId];
}

function saveEmployeeBaseSchedule(employeeId, schedule) {
  if (!state.baseSchedules) state.baseSchedules = {};
  state.baseSchedules[employeeId] = normalizeBaseSchedule(schedule);
}

function getScheduleWeekKey(schedule, dateKey) {
  if (schedule.mode !== "biweekly") return "a";
  const anchor = parseDateKey(schedule.anchorDate || DEFAULT_SCHEDULE_ANCHOR);
  const date = parseDateKey(dateKey);
  anchor.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const weekDiff = Math.floor((date - anchor) / (7 * 24 * 60 * 60 * 1000));
  return ((weekDiff % 2) + 2) % 2 === 0 ? "a" : "b";
}

function getScheduleWeekHours(week = {}) {
  return SCHEDULE_DAY_ORDER.reduce((sum, day) => {
    return sum + (week[day] || []).reduce((daySum, shift) => {
      return daySum + Math.max(0, timeToDecimal(shift.end) - timeToDecimal(shift.start));
    }, 0);
  }, 0);
}

function getBaseScheduleSummary(employeeId) {
  const schedule = getEmployeeBaseSchedule(employeeId);
  const weekAHours = getScheduleWeekHours(schedule.weeks.a);
  const weekBHours = getScheduleWeekHours(schedule.weeks.b);
  const weekADays = SCHEDULE_DAY_ORDER.filter((day) => (schedule.weeks.a[day] || []).length).length;
  const weekBDays = SCHEDULE_DAY_ORDER.filter((day) => (schedule.weeks.b[day] || []).length).length;

  if (schedule.mode === "biweekly") {
    return `Alternada A/B · A: ${weekADays} dias / ${formatHours(weekAHours)} · B: ${weekBDays} dias / ${formatHours(weekBHours)}`;
  }

  if (!weekADays) return "Sin grilla base fija";
  return `Semanal fija · ${weekADays} dias / ${formatHours(weekAHours)}`;
}

function layoutShifts(shifts) {
  const lanes = [];
  shifts.forEach((shift) => {
    const copy = { ...shift };
    let placed = false;
    for (let laneIndex = 0; laneIndex < lanes.length; laneIndex += 1) {
      const lane = lanes[laneIndex];
      const overlaps = lane.some((item) => item.start < copy.end && item.end > copy.start);
      if (!overlaps) {
        lane.push(copy);
        copy.lane = laneIndex;
        placed = true;
        break;
      }
    }
    if (!placed) {
      copy.lane = lanes.length;
      lanes.push([copy]);
    }
  });

  return lanes.flatMap((lane) => lane);
}

function getEmployees(includeInactive = false) {
  const employees = Array.isArray(state?.employees) && state.employees.length
    ? state.employees
    : DEFAULT_EMPLOYEES;
  const filtered = employees.filter((employee) => normalizeLocationId(employee.locationId) === activeLocationId);
  return includeInactive ? filtered : filtered.filter((employee) => isEmployeeActiveOnDate(employee));
}

function getAllEmployees(includeInactive = false) {
  const employees = Array.isArray(state?.employees) && state.employees.length
    ? state.employees
    : DEFAULT_EMPLOYEES;
  return includeInactive ? employees : employees.filter((employee) => isEmployeeActiveOnDate(employee));
}

function isEmployeeActiveOnDate(employee, dateKey = toDateInput(new Date())) {
  if (!employee) return false;
  if (employee.activeFrom && dateKey < employee.activeFrom) return false;
  if (employee.active === false && employee.inactiveFrom) return dateKey < employee.inactiveFrom;
  return employee.active !== false;
}

function getEmployee(id, dateKey = toDateInput(new Date())) {
  const employee = (state?.employees || DEFAULT_EMPLOYEES).find((item) => item.id === id) || {
    id,
    label: "Empleado",
    role: "Team",
    color: "#667481",
    active: false,
  };
  if (employee.id !== "third") return employee;
  const label = dateKey >= getLocationSettings(employee.locationId).palomaLeaveDate ? "Reemplazo Paloma" : "Paloma";
  return { ...employee, label };
}

function getPunchStatus(employeeId, dateKey, timestamp, geoResult) {
  if (geoResult.status === "outside") return "outside";
  const shift = getShiftsForDate(dateKey)
    .filter((item) => item.employeeId === employeeId)
    .sort((a, b) => a.start - b.start)[0];

  if (!shift) return geoResult.status;
  const scheduledStart = dateWithTime(dateKey, shift.start);
  const tolerance = Number(getLocationSettings().lateTolerance || 5) * 60 * 1000;
  return timestamp.getTime() > scheduledStart.getTime() + tolerance ? "late" : geoResult.status;
}

function getRealHoursForMonth(monthDate) {
  const monthKey = monthInputValue(monthDate);
  const punches = getLocationPunches()
    .filter((punch) => punch.date.startsWith(monthKey))
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  let total = 0;
  const openPunches = new Map();

  punches.forEach((punch) => {
    const key = `${punch.employeeId}-${punch.date}`;
    if (punch.type === "in") {
      openPunches.set(key, punch);
    }
    if (punch.type === "out" && openPunches.has(key)) {
      const start = new Date(openPunches.get(key).timestamp);
      const end = new Date(punch.timestamp);
      if (end > start) {
        total += (end - start) / 36e5;
      }
      openPunches.delete(key);
    }
  });

  return total;
}

function parseSaleHour(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const match = raw.match(/(\d{1,2})(?::|\.|h)?(\d{2})?/i);
  if (!match) return null;
  const hour = Number(match[1]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  return hour;
}

function getHourlySalesAnalysis(monthDate = trafficActiveMonth) {
  const threshold = Math.max(1, Number(els.visitorThreshold?.value || 18));
  const minimumTickets = Math.max(1, Number(els.minimumVisitors?.value || 10));
  const monthKey = monthInputValue(monthDate);
  const groups = new Map();
  let unassignedTickets = 0;
  let unassignedSales = 0;

  getLocationSales()
    .filter((sale) => sale.date.startsWith(monthKey))
    .forEach((sale) => {
      const tickets = Number(sale.count || 1);
      const total = Number(sale.total || 0);
      const hour = parseSaleHour(sale.time);
      if (hour === null) {
        unassignedTickets += tickets;
        unassignedSales += total;
        return;
      }
      const key = `${sale.date}-${String(hour).padStart(2, '0')}`;
      const current = groups.get(key) || { date: sale.date, hour, tickets: 0, sales: 0 };
      current.tickets += tickets;
      current.sales += total;
      groups.set(key, current);
    });

  const hourlyRows = [...groups.values()].map((item) => {
    const staffCount = getShiftsForDate(item.date)
      .filter((shift) => shift.start < item.hour + 1 && shift.end > item.hour)
      .length;
    const effectiveStaff = Math.max(1, staffCount);
    const recommendedStaff = Math.max(1, Math.ceil(item.tickets / threshold));
    const loadPct = staffCount > 0 ? (item.tickets / (staffCount * threshold)) * 100 : 150;
    return {
      ...item,
      avgTicket: item.tickets > 0 ? item.sales / item.tickets : 0,
      staffCount,
      recommendedStaff,
      missing: Math.max(0, recommendedStaff - staffCount),
      ticketsPerStaff: item.tickets / effectiveStaff,
      salesPerStaff: item.sales / effectiveStaff,
      loadPct,
    };
  }).sort((a, b) => b.tickets - a.tickets || b.sales - a.sales || a.date.localeCompare(b.date) || a.hour - b.hour);

  const criticalRows = hourlyRows
    .filter((item) => item.tickets >= minimumTickets && item.missing > 0)
    .sort((a, b) => b.missing - a.missing || b.loadPct - a.loadPct || b.tickets - a.tickets);

  const activeHours = hourlyRows.length;
  const totalTickets = hourlyRows.reduce((sum, item) => sum + item.tickets, 0);
  const totalSales = hourlyRows.reduce((sum, item) => sum + item.sales, 0);
  const coveredStaffHours = hourlyRows.reduce((sum, item) => sum + Math.max(0, item.staffCount), 0);
  const dayMap = new Map();
  const hourMap = new Map();
  hourlyRows.forEach((item) => {
    const day = dayMap.get(item.date) || { date: item.date, tickets: 0, sales: 0 };
    day.tickets += item.tickets;
    day.sales += item.sales;
    dayMap.set(item.date, day);

    const hour = hourMap.get(item.hour) || { hour: item.hour, tickets: 0, sales: 0, count: 0 };
    hour.tickets += item.tickets;
    hour.sales += item.sales;
    hour.count += 1;
    hourMap.set(item.hour, hour);
  });
  const busiestDay = [...dayMap.values()].sort((a, b) => b.tickets - a.tickets || b.sales - a.sales)[0] || null;
  const bestHour = [...hourMap.values()]
    .map((item) => ({
      ...item,
      avgTickets: item.count ? item.tickets / item.count : 0,
      avgSales: item.count ? item.sales / item.count : 0,
    }))
    .sort((a, b) => b.avgTickets - a.avgTickets || b.avgSales - a.avgSales)[0] || null;

  return {
    hourlyRows,
    criticalRows,
    totalTickets,
    totalSales,
    avgTicketsPerActiveHour: activeHours ? totalTickets / activeHours : 0,
    avgSalesPerActiveHour: activeHours ? totalSales / activeHours : 0,
    avgTicketsPerStaffHour: coveredStaffHours ? totalTickets / coveredStaffHours : 0,
    avgSalesPerStaffHour: coveredStaffHours ? totalSales / coveredStaffHours : 0,
    busiestDay,
    bestHour,
    unassignedTickets,
    unassignedSales,
  };
}

function getSuggestions() {
  return getHourlySalesAnalysis(activeMonth).criticalRows.slice(0, 20);
}

function renderHourlyHeatmap(analysis) {
  if (!analysis.hourlyRows.length) return '';
  const hours = [...new Set(analysis.hourlyRows.map((item) => item.hour))]
    .sort((a, b) => a - b);
  const byDayHour = new Map();
  analysis.hourlyRows.forEach((item) => {
    const day = new Date(`${item.date}T00:00:00`).getDay();
    const key = `${day}-${item.hour}`;
    const current = byDayHour.get(key) || { tickets: 0, sales: 0 };
    current.tickets += item.tickets;
    current.sales += item.sales;
    byDayHour.set(key, current);
  });
  const maxTickets = Math.max(1, ...[...byDayHour.values()].map((item) => item.tickets));
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const rows = dayOrder.map((day) => {
    const cells = hours.map((hour) => {
      const item = byDayHour.get(`${day}-${hour}`);
      const pct = item ? item.tickets / maxTickets : 0;
      const alpha = item ? Math.max(0.12, pct).toFixed(2) : 0;
      const title = item ? `${item.tickets} tickets · ${formatEur(item.sales)}` : 'Sin ventas';
      return `<td class="heatmap-cell" title="${escapeHtml(title)}" style="background:rgba(196,109,71,${alpha})">
        ${item ? `<strong>${item.tickets}</strong>` : ''}
      </td>`;
    }).join('');
    return `<tr><th>${DAY_NAMES[day]}</th>${cells}</tr>`;
  }).join('');
  return `
    <section class="traffic-heatmap-panel">
      <h3>Mapa de calor <small>tickets por día y hora</small></h3>
      <div class="traffic-heatmap-scroll">
      <table class="fin-table heatmap-table">
        <thead><tr><th>Día</th>${hours.map((hour) => `<th>${String(hour).padStart(2, '0')}h</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </div>
    </section>`;
}

function itemName(item) {
  return String(item?.name || item?.product || item?.description || item?.label || '').trim();
}

function itemQuantity(item) {
  const qty = Number(item?.qty ?? item?.quantity ?? item?.units ?? item?.count ?? 1);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function itemAmount(item) {
  const total = Number(item?.total ?? item?.amount ?? item?.lineTotal ?? 0);
  if (Number.isFinite(total) && total > 0) return total;
  const price = Number(item?.price ?? item?.unitPrice ?? item?.pvp ?? 0);
  return Number.isFinite(price) && price > 0 ? price * itemQuantity(item) : 0;
}

function aggregateArticleSales(sales) {
  const map = new Map();
  sales.forEach((sale) => {
    (sale.items || []).forEach((item) => {
      const name = itemName(item);
      if (!name) return;
      const current = map.get(name) || { name, qty: 0, amount: 0 };
      current.qty += itemQuantity(item);
      current.amount += itemAmount(item);
      map.set(name, current);
    });
  });
  return [...map.values()].sort((a, b) => b.qty - a.qty || b.amount - a.amount);
}

function renderArticleRows(rows, limit = 10) {
  if (!rows.length) {
    return '<div class="empty-state">Sin detalle de artículos. Si Bistrosoft no entrega artículos en la sincronización directa, importá el reporte de Artículos para completar este análisis.</div>';
  }
  const maxQty = Math.max(1, rows[0].qty);
  return rows.slice(0, limit).map((item, index) => `
    <div class="fin-bar-item">
      <div class="fin-bar-label">${index + 1}. ${escapeHtml(item.name)}</div>
      <div class="fin-bar-track"><div class="fin-bar-fill" style="width:${Math.max(4, Math.round(item.qty / maxQty * 100))}%"></div></div>
      <div class="fin-bar-value">${item.qty.toLocaleString('es-ES')} · ${item.amount > 0 ? formatEur(item.amount) : 's/importe'}</div>
    </div>`).join('');
}

function renderPeakProductInsights(analysis) {
  const peakSource = analysis.criticalRows.length ? analysis.criticalRows : analysis.hourlyRows.slice(0, 10);
  const peakKeys = new Set(peakSource.slice(0, 10).map((item) => `${item.date}-${item.hour}`));
  const peakSales = getLocationSales().filter((sale) => {
    const hour = parseSaleHour(sale.time);
    return hour !== null
      && sale.date.startsWith(monthInputValue(trafficActiveMonth))
      && peakKeys.has(`${sale.date}-${hour}`);
  });
  const rows = aggregateArticleSales(peakSales);
  return `
    <h3 style="margin:18px 0 10px">Productos más vendidos en horas pico</h3>
    <div class="list-surface" style="margin-bottom:14px">
      ${renderArticleRows(rows, 8)}
    </div>`;
}

function renderArticleSalesInsights() {
  const monthKey = monthInputValue(trafficActiveMonth);
  const yearKey = String(trafficActiveMonth.getFullYear());
  const monthRows = aggregateArticleSales(getLocationSales().filter((sale) => sale.date.startsWith(monthKey)));
  const annualRows = aggregateArticleSales(getLocationSales().filter((sale) => sale.date.startsWith(yearKey)));
  return `
    <h3 style="margin:18px 0 10px">Venta por artículos</h3>
    <div class="two-column" style="gap:14px">
      <div class="list-surface">
        <div class="list-heading"><h3>Mensual por cantidad</h3><span>${MONTH_NAMES[trafficActiveMonth.getMonth()]} ${trafficActiveMonth.getFullYear()}</span></div>
        ${renderArticleRows(monthRows, 15)}
      </div>
      <div class="list-surface">
        <div class="list-heading"><h3>Top 5 anualizado</h3><span>${trafficActiveMonth.getFullYear()}</span></div>
        ${renderArticleRows(annualRows, 5)}
      </div>
    </div>`;
}

function parseTrafficCsv(csv) {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith("date,"))
    .map((line) => {
      const [date, hour, visitors] = line.split(",").map((value) => value.trim());
      return { date, hour: Number(hour), visitors: Number(visitors) };
    })
    .filter((row) => row.date && Number.isFinite(row.hour) && Number.isFinite(row.visitors));
}

function stringifyTraffic(rows) {
  return ["date,hour,visitors", ...rows.map((row) => `${row.date},${row.hour},${row.visitors}`)].join("\n");
}

function evaluateGeo(geo) {
  if (!geo) {
    return {
      status: "ok",
      label: "Ubicacion no disponible",
      message: "No se pudo validar ubicacion en este dispositivo.",
    };
  }

  const settings = getLocationSettings();
  const lat = Number(settings.storeLat);
  const lng = Number(settings.storeLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      status: "ok",
      label: `${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)}`,
      message: "Ubicacion tomada. Configura coordenadas del local para validar radio.",
    };
  }

  const distance = distanceInMeters(lat, lng, geo.latitude, geo.longitude);
  const radius = Number(settings.geoRadius || 120);
  return {
    status: distance <= radius ? "ok" : "outside",
    label: `${Math.round(distance)} m del local`,
    message: distance <= radius ? `Dentro del radio (${Math.round(distance)} m).` : `Fuera del radio (${Math.round(distance)} m).`,
  };
}

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 30000 },
    );
  });
}

function distanceInMeters(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return seedDefaultHolidays(mergeState(DEFAULT_STATE, saved || {}));
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveLocalStateSnapshot() {
  if (appRole === 'visitor') return;
  const localState = sharedStateEnabled
    ? {
        ...state,
        sales: state.sales.filter((sale) => sale._source !== 'bistrosoft'),
        expenses: state.expenses.filter((expense) => expense._source !== 'bistrosoft'),
      }
    : state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localState));
  } catch (error) {
    console.warn('No se pudo guardar la copia local:', error.message);
  }
}

function saveState(options = {}) {
  saveLocalStateSnapshot();
  if (options.shared !== false) scheduleSharedStateSave();
}

function scheduleSharedStateSave() {
  if (!sharedStateEnabled || suppressSharedStateSave || appRole === 'visitor') return;
  sharedStatePending = true;
  clearTimeout(sharedStateSaveTimer);
  sharedStateSaveTimer = setTimeout(flushSharedState, 250);
}

async function flushSharedState() {
  if (!sharedStateEnabled || sharedStateSaving || !sharedStatePending) return;
  sharedStatePending = false;
  sharedStateSaving = true;
  try {
    const response = await fetch('/api/state', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
    if (response.status === 403 && appRole === 'employee') {
      sharedStatePending = false;
      alert('Tu acceso fue dado de baja por el administrador.');
      exitToRoleScreen();
      return;
    }
    if (!response.ok) {
      const detail = await parseApiError(response, 'No se pudo guardar el estado compartido.');
      throw new Error(`${detail} (HTTP ${response.status})`);
    }
  } catch (error) {
    console.warn(error.message);
    sharedStatePending = true;
  } finally {
    sharedStateSaving = false;
    if (sharedStatePending) scheduleSharedStateSave();
  }
}

function waitForStateSave(delay = 120) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function persistSharedStateNow() {
  if (!sharedStateEnabled) return true;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    while (sharedStateSaving) await waitForStateSave();
    if (!sharedStatePending) return true;
    await flushSharedState();
    if (!sharedStatePending && !sharedStateSaving) return true;
    await waitForStateSave(250);
  }
  return false;
}

async function connectSharedState(role, employeeId = null, authData = {}) {
  try {
    const loginResponse = await fetch(`/api/auth/${role}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(role === 'admin'
        ? { pin: document.querySelector('#adminPinInput').value }
        : role === 'employee'
          ? { employeeId, ...authData }
          : authData),
    });

    if (loginResponse.status === 404) {
      return { available: false, authenticated: role === 'admin', error: role === 'admin' ? null : 'El servidor de acceso no esta disponible.' };
    }
    if (!loginResponse.ok) {
      let error = 'No se pudo iniciar sesion.';
      try {
        const payload = await loginResponse.json();
        error = payload.error || error;
      } catch (_) {}
      return { available: true, authenticated: false, error, status: loginResponse.status };
    }

    sharedStateEnabled = true;
    const stateResponse = await fetch('/api/state', { credentials: 'same-origin', cache: 'no-store' });
    if (!stateResponse.ok) throw new Error('No se pudo cargar el estado compartido.');
    const payload = await stateResponse.json();

    if (payload.state) {
      const localSnapshot = state;
      const serverState = seedDefaultHolidays(mergeState(DEFAULT_STATE, payload.state));
      const serverIds = new Set((serverState.employees || []).map((employee) => employee.id));
      const recoverableEmployees = role === "admin"
        ? (localSnapshot.employees || []).filter((employee) =>
            employee.id !== "pablo"
            && !serverIds.has(employee.id)
            && !DEFAULT_EMPLOYEES.some((defaultEmployee) => defaultEmployee.id === employee.id)
          )
        : [];
      recoverableEmployees.forEach((employee) => {
        serverState.employees.push(employee);
        if (localSnapshot.profiles?.[employee.id]) serverState.profiles[employee.id] = localSnapshot.profiles[employee.id];
        if (localSnapshot.baseSchedules?.[employee.id]) serverState.baseSchedules[employee.id] = localSnapshot.baseSchedules[employee.id];
        if (localSnapshot.contracts?.[employee.id]) serverState.contracts[employee.id] = localSnapshot.contracts[employee.id];
      });
      state = serverState;
      if (role !== 'visitor') saveLocalStateSnapshot();
      if (recoverableEmployees.length) saveState();
    } else {
      scheduleSharedStateSave();
    }

    clearInterval(sharedStatePollTimer);
    sharedStatePollTimer = setInterval(refreshSharedState, 15000);
    return { available: true, authenticated: true, error: null };
  } catch (error) {
    sharedStateEnabled = false;
    return {
      available: false,
      authenticated: role === 'admin',
      error: error.message || 'No se pudo conectar con el servidor.',
    };
  }
}

async function refreshSharedState() {
  if (!sharedStateEnabled || sharedStateSaving || sharedStatePending) return;
  try {
    const response = await fetch('/api/state', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 403 && appRole === 'employee') {
      alert('Tu acceso fue dado de baja por el administrador.');
      exitToRoleScreen();
      return;
    }
    if (!response.ok) return;
    const payload = await response.json();
    if (!payload.state) return;

    suppressSharedStateSave = true;
    state = seedDefaultHolidays(mergeState(DEFAULT_STATE, payload.state));
    saveLocalStateSnapshot();
    if ((appRole === 'admin' || appRole === 'visitor') && adminInited) render();
    else if (appRole === 'employee') renderEmployeeView();
  } catch (_) {
    // Mantener la copia local y reintentar en el proximo intervalo.
  } finally {
    suppressSharedStateSave = false;
  }
}

function disconnectSharedState() {
  clearInterval(sharedStatePollTimer);
  sharedStatePollTimer = null;
  if (sharedStateEnabled) {
    flushSharedState();
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  }
  sharedStateEnabled = false;
}

function mergeState(base, saved) {
  let expenseCategoryOverrides = {
    ...(base.expenseCategoryOverrides || {}),
    ...(saved.expenseCategoryOverrides || {}),
  };
  const migratedEmployees = Array.isArray(saved.employees) && saved.employees.length
    ? mergeDefaultEmployees(saved.employees)
    : structuredClone(base.employees);
  const legacySettings = {
    ...base.settings,
    ...(saved.settings || {}),
    holidays: saved.settings?.holidays || base.settings.holidays,
  };
  const locationSettings = {
    ...structuredClone(base.locationSettings || {}),
    ...(saved.locationSettings || {}),
    barcelona: {
      ...(base.locationSettings?.barcelona || {}),
      ...legacySettings,
      ...(saved.locationSettings?.barcelona || {}),
      holidays: saved.locationSettings?.barcelona?.holidays || legacySettings.holidays,
    },
    madrid: {
      ...(base.locationSettings?.madrid || {}),
      ...(saved.locationSettings?.madrid || {}),
      holidays: saved.locationSettings?.madrid?.holidays || base.locationSettings?.madrid?.holidays || MADRID_HOLIDAYS_2026,
    },
  };
  const merged = {
    ...structuredClone(base),
    ...saved,
    locations: { ...LOCATIONS, ...(saved.locations || {}) },
    employees: migratedEmployees,
    expenseCategoryOverrides,
    wasteRecords: saved.wasteRecords || base.wasteRecords,
    baseSchedules: mergeBaseSchedules(base.baseSchedules || DEFAULT_BASE_SCHEDULES, saved.baseSchedules, migratedEmployees),
    profiles: { ...base.profiles, ...(saved.profiles || {}) },
    locationSettings,
    settings: legacySettings,
  };
  addDefaultProfilesForNewEmployees(merged);
  tagLegacyRecordsWithLocation(merged);
  expenseCategoryOverrides = collectExpenseCategoryOverrides(merged.expenses, expenseCategoryOverrides);
  merged.expenseCategoryOverrides = expenseCategoryOverrides;
  merged.expenses = (merged.expenses || []).map((expense) =>
    applyExpenseCategoryOverride(expense, expenseCategoryOverrides)
  );
  removePabloFromState(merged);
  return merged;
}

function mergeDefaultEmployees(savedEmployees) {
  const byId = new Map(savedEmployees.map((employee) => [employee.id, employee]));
  DEFAULT_EMPLOYEES.forEach((employee) => {
    if (!byId.has(employee.id)) byId.set(employee.id, structuredClone(employee));
  });
  return [...byId.values()].map((employee) => ({
    ...employee,
    locationId: normalizeLocationId(employee.locationId || employee.branch || employee.store || DEFAULT_LOCATION_ID),
  }));
}

function removePabloFromState(nextState) {
  if (!nextState) return nextState;
  nextState.employees = (nextState.employees || []).filter((employee) => employee.id !== "pablo");
  ["punches", "wasteRecords"].forEach((key) => {
    nextState[key] = (nextState[key] || []).filter((item) => item.employeeId !== "pablo");
  });
  nextState.changes = (nextState.changes || []).filter((item) =>
    item.employeeId !== "pablo" && item.replacementEmployeeId !== "pablo" && item.action !== "owner"
  );
  ["profiles", "contracts", "baseSchedules"].forEach((key) => {
    if (nextState[key]) delete nextState[key].pablo;
  });
  Object.values(nextState.payrollSettlements || {}).forEach((locationMonths) => {
    Object.values(locationMonths || {}).forEach((month) => {
      if (month) delete month.pablo;
    });
  });
  nextState.pabloRemovalVersion = 1;
  return nextState;
}

function createBlankBaseSchedule() {
  return baseSchedule({});
}

function mergeBaseSchedules(defaultSchedules = {}, savedSchedules = {}, employees = []) {
  const schedules = {
    ...structuredClone(defaultSchedules || {}),
    ...structuredClone(savedSchedules || {}),
  };

  employees.forEach((employee) => {
    schedules[employee.id] = normalizeBaseSchedule(schedules[employee.id] || createBlankBaseSchedule());
  });

  Object.keys(schedules).forEach((employeeId) => {
    schedules[employeeId] = normalizeBaseSchedule(schedules[employeeId]);
  });

  return schedules;
}

function normalizeBaseSchedule(schedule = {}) {
  return {
    mode: schedule.mode === "biweekly" ? "biweekly" : "weekly",
    anchorDate: isDateKey(schedule.anchorDate) ? schedule.anchorDate : DEFAULT_SCHEDULE_ANCHOR,
    weeks: {
      a: normalizeScheduleWeek(schedule.weeks?.a),
      b: normalizeScheduleWeek(schedule.weeks?.b),
    },
  };
}

function normalizeScheduleWeek(week = {}) {
  return SCHEDULE_DAY_ORDER.reduce((normalized, day) => {
    normalized[day] = (Array.isArray(week?.[day]) ? week[day] : [])
      .map((shift) => ({
        start: normalizeTimeValue(shift?.start),
        end: normalizeTimeValue(shift?.end),
      }))
      .filter((shift) => shift.start && shift.end && timeToDecimal(shift.end) > timeToDecimal(shift.start));
    return normalized;
  }, {});
}

function normalizeTimeValue(value) {
  const text = String(value || "").trim();
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [hours, minutes] = text.split(":").map(Number);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }
  return "";
}

function isDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDefaultProfilesForNewEmployees(nextState) {
  if (!nextState.profiles) nextState.profiles = {};
  (nextState.employees || []).forEach((employee) => {
    nextState.profiles[employee.id] = {
      ...(nextState.profiles[employee.id] || {}),
      locationId: normalizeLocationId(nextState.profiles[employee.id]?.locationId || employee.locationId),
    };
  });
}

function tagLegacyRecordsWithLocation(nextState) {
  const employeeLocations = new Map(
    (nextState.employees || []).map((employee) => [employee.id, normalizeLocationId(employee.locationId)])
  );
  ["punches", "changes", "trafficData", "sales", "expenses", "wasteRecords"].forEach((key) => {
    nextState[key] = (nextState[key] || []).map((item) => ({
      ...item,
      locationId: normalizeLocationId(item.locationId || inferRecordLocationId(item, employeeLocations)),
    }));
  });
}

function inferRecordLocationId(item, employeeLocations = new Map()) {
  if (item?.employeeId) return employeeLocations.get(item.employeeId) || DEFAULT_LOCATION_ID;
  return DEFAULT_LOCATION_ID;
}

function seedDefaultHolidays(nextState) {
  Object.keys(DEFAULT_LOCATION_SETTINGS).forEach((locationId) => {
    const current = nextState.locationSettings?.[locationId] || {};
    const defaults = DEFAULT_LOCATION_SETTINGS[locationId];
    if (!nextState.locationSettings) nextState.locationSettings = {};
    if ((current.holidaySeedVersion || 0) < HOLIDAY_SEED_VERSION) {
      const existingByDate = new Map((current.holidays || []).map((holiday) => [holiday.date, holiday]));
      nextState.locationSettings[locationId] = {
        ...defaults,
        ...current,
        holidays: defaults.holidays.map((holiday) => existingByDate.get(holiday.date) || holiday).concat(
          (current.holidays || []).filter((holiday) =>
            !defaults.holidays.some((defaultHoliday) => defaultHoliday.date === holiday.date)
          ),
        ),
        holidaySeedVersion: HOLIDAY_SEED_VERSION,
      };
    }
  });

  if ((nextState.settings.holidaySeedVersion || 0) >= HOLIDAY_SEED_VERSION) {
    return nextState;
  }

  const existingByDate = new Map((nextState.settings.holidays || []).map((holiday) => [holiday.date, holiday]));
  nextState.settings.holidays = DEFAULT_HOLIDAYS_2026.map((holiday) => {
    return existingByDate.get(holiday.date) || holiday;
  }).concat(
    (nextState.settings.holidays || []).filter((holiday) => {
      return !DEFAULT_HOLIDAYS_2026.some((defaultHoliday) => defaultHoliday.date === holiday.date);
    }),
  );
  nextState.settings.holidaySeedVersion = HOLIDAY_SEED_VERSION;
  return nextState;
}

function normalizeLocationId(value) {
  return LOCATION_IDS.includes(value) ? value : DEFAULT_LOCATION_ID;
}

function getLocation(locationId = activeLocationId) {
  return LOCATIONS[normalizeLocationId(locationId)] || LOCATIONS[DEFAULT_LOCATION_ID];
}

function getEmployeeLocationId(employeeId) {
  const employee = (state?.employees || DEFAULT_EMPLOYEES).find((item) => item.id === employeeId);
  return normalizeLocationId(employee?.locationId || state?.profiles?.[employeeId]?.locationId || DEFAULT_LOCATION_ID);
}

function belongsToActiveLocation(item) {
  return normalizeLocationId(item?.locationId || inferRecordLocationId(item)) === activeLocationId;
}

function getLocationSettings(locationId = activeLocationId) {
  const id = normalizeLocationId(locationId);
  if (!state.locationSettings) state.locationSettings = structuredClone(DEFAULT_LOCATION_SETTINGS);
  if (!state.locationSettings[id]) state.locationSettings[id] = structuredClone(DEFAULT_LOCATION_SETTINGS[id]);
  return state.locationSettings[id];
}

function updateLocationSettings(values, locationId = activeLocationId) {
  const id = normalizeLocationId(locationId);
  state.locationSettings = {
    ...(state.locationSettings || {}),
    [id]: {
      ...getLocationSettings(id),
      ...values,
    },
  };
  if (id === DEFAULT_LOCATION_ID) {
    state.settings = { ...state.settings, ...state.locationSettings[id] };
  }
}

function getLocationSales(locationId = activeLocationId) {
  const id = normalizeLocationId(locationId);
  return (state.sales || []).filter((sale) => normalizeLocationId(sale.locationId) === id);
}

function getLocationExpenses(locationId = activeLocationId) {
  const id = normalizeLocationId(locationId);
  return (state.expenses || []).filter((expense) => normalizeLocationId(expense.locationId) === id);
}

function getLocationWasteRecords(locationId = activeLocationId) {
  const id = normalizeLocationId(locationId);
  return (state.wasteRecords || []).filter((record) => normalizeLocationId(record.locationId) === id);
}

function getLocationPunches(locationId = activeLocationId) {
  const id = normalizeLocationId(locationId);
  return (state.punches || []).filter((punch) => normalizeLocationId(punch.locationId || getEmployeeLocationId(punch.employeeId)) === id);
}

function getLocationChanges(locationId = activeLocationId) {
  const id = normalizeLocationId(locationId);
  return (state.changes || []).filter((change) => normalizeLocationId(change.locationId || getEmployeeLocationId(change.employeeId)) === id);
}

function getLocationTrafficData(locationId = activeLocationId) {
  const id = normalizeLocationId(locationId);
  return (state.trafficData || []).filter((item) => normalizeLocationId(item.locationId) === id);
}

function getLocationBudgets(locationId = activeLocationId) {
  const id = normalizeLocationId(locationId);
  if (!state.locationBudgets) {
    state.locationBudgets = {
      [DEFAULT_LOCATION_ID]: state.budgets || {},
    };
  }
  if (!state.locationBudgets[id]) state.locationBudgets[id] = {};
  if (id === DEFAULT_LOCATION_ID) state.budgets = state.locationBudgets[id];
  return state.locationBudgets[id];
}

function tagWithActiveLocation(item) {
  return { ...item, locationId: activeLocationId };
}

function renderEmpty(container) {
  container.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
}

function actionLabel(action) {
  const labels = {
    absence: "Quitar turno",
    replace: "Reemplazo",
    extra: "Extra",
  };
  return labels[action] || action;
}

function statusLabel(status) {
  const labels = {
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
  };
  return labels[status] || status;
}

function range(start, end) {
  const values = [];
  for (let value = start; value <= end; value += 1) values.push(value);
  return values;
}

function getMonthDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) => new Date(year, month, index + 1));
}

function firstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function monthInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateWithTime(dateKey, decimalHour) {
  const date = parseDateKey(dateKey);
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function timeToDecimal(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours + minutes / 60;
}

function formatHour(decimalHour) {
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatHours(value) {
  return `${Number(value).toLocaleString("es-ES", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 ? 1 : 0,
  })} h`;
}

function formatHumanDate(dateKey) {
  const date = parseDateKey(dateKey);
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  return `${toDateInput(date)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===========================
// ROLE MANAGEMENT
// ===========================

function initRoleScreen() {
  const empButtons = document.querySelector("#empChoiceButtons");
  renderEmployeeChoiceButtons();

  empButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-emp-id]");
    if (button) beginEmployeeAccess(button.dataset.empId);
  });

  document.querySelector("#chooseEmployee").addEventListener("click", async () => {
    await refreshTeamDirectory();
    renderEmployeeChoiceButtons();
    showRoleStep("roleStepEmployee");
  });

  document.querySelector("#chooseAdmin").addEventListener("click", () => {
    showRoleStep("roleStepAdmin");
    document.querySelector("#adminPinInput").focus();
  });

  document.querySelector("#chooseVisit").addEventListener("click", () => {
    showRoleStep("roleStepVisit");
    document.querySelector("#visitPasswordInput").focus();
  });

  document.querySelector("#submitPin").addEventListener("click", tryAdminPin);
  document.querySelector("#adminPinInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryAdminPin();
  });

  document.querySelector("#backToStep1a").addEventListener("click", () => showRoleStep("roleStep1"));
  document.querySelector("#backToStep1b").addEventListener("click", () => {
    showRoleStep("roleStep1");
    document.querySelector("#adminPinInput").value = "";
    document.querySelector("#pinError").hidden = true;
  });
  document.querySelector("#backFromEmployeeLogin").addEventListener("click", () => showRoleStep("roleStepEmployee"));
  document.querySelector("#backFromEmployeeSetup").addEventListener("click", () => showRoleStep("roleStepEmployee"));
  document.querySelector("#backFromVisit").addEventListener("click", () => showRoleStep("roleStep1"));
  document.querySelector("#backFromLocation").addEventListener("click", () => {
    showRoleStep(pendingLocationRole === "visitor" ? "roleStepVisit" : "roleStepAdmin");
  });
  document.querySelectorAll("[data-location-choice]").forEach((button) => {
    button.addEventListener("click", () => chooseLocation(button.dataset.locationChoice));
  });
  document.querySelector("#submitEmployeeLogin").addEventListener("click", submitEmployeeLogin);
  document.querySelector("#submitEmployeeSetup").addEventListener("click", submitEmployeeSetup);
  document.querySelector("#submitVisitLogin").addEventListener("click", submitVisitLogin);
  document.querySelector("#employeePasswordInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitEmployeeLogin();
  });
  document.querySelector("#visitPasswordInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitVisitLogin();
  });

  document.querySelector("#adminExit").addEventListener("click", exitToRoleScreen);
}

function renderEmployeeChoiceButtons() {
  const empButtons = document.querySelector("#empChoiceButtons");
  if (!empButtons) return;
  empButtons.innerHTML = getAllEmployees()
    .filter((employee) => employee.canLogin !== false)
    .map(
      (employee) =>
        `<button class="role-btn" data-emp-id="${employee.id}" style="background:${employee.color}" type="button">${escapeHtml(employee.label)}<small>${getLocation(employee.locationId).label}</small></button>`,
    )
    .join("");
}

function showRoleStep(id) {
  ["roleStep1", "roleStepEmployee", "roleStepAdmin", "roleStepEmployeeLogin", "roleStepEmployeeSetup", "roleStepVisit", "roleStepLocation"]
    .forEach((stepId) => {
      const element = document.querySelector(`#${stepId}`);
      if (element) element.hidden = stepId !== id;
    });
}

function showLocationStep(role) {
  pendingLocationRole = role;
  showRoleStep("roleStepLocation");
}

function chooseLocation(locationId) {
  activeLocationId = normalizeLocationId(locationId);
  if (pendingLocationRole === "visitor") setVisitMode(activeLocationId);
  else setAdminMode(activeLocationId);
  pendingLocationRole = null;
}

async function beginEmployeeAccess(employeeId) {
  pendingEmployeeId = employeeId;
  const employee = getEmployee(employeeId);
  try {
    const response = await fetch('/api/auth/employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', employeeId }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'No se pudo consultar el acceso.');
    if (payload.needsSetup) {
      document.querySelector("#employeeSetupTitle").textContent = `Primer acceso de ${employee.label}`;
      showRoleStep("roleStepEmployeeSetup");
      document.querySelector("#setupFullName").focus();
    } else {
      document.querySelector("#employeeLoginTitle").textContent = `Contraseña de ${employee.label}`;
      document.querySelector("#employeePasswordInput").value = "";
      document.querySelector("#employeeLoginError").hidden = true;
      showRoleStep("roleStepEmployeeLogin");
      document.querySelector("#employeePasswordInput").focus();
    }
  } catch (error) {
    alert(error.message || 'No se pudo iniciar el acceso del empleado.');
  }
}

async function submitEmployeeLogin() {
  const errorElement = document.querySelector("#employeeLoginError");
  const result = await connectSharedState('employee', pendingEmployeeId, {
    action: 'login',
    password: document.querySelector("#employeePasswordInput").value,
  });
  if (!result.authenticated) {
    errorElement.textContent = result.error || 'Contraseña incorrecta.';
    errorElement.hidden = false;
    return;
  }
  await enterEmployeeMode(pendingEmployeeId);
}

async function submitEmployeeSetup() {
  const errorElement = document.querySelector("#employeeSetupError");
  const password = document.querySelector("#setupPassword").value;
  const confirmation = document.querySelector("#setupPasswordConfirm").value;
  const profile = {
    fullName: document.querySelector("#setupFullName").value.trim(),
    phone: document.querySelector("#setupPhone").value.trim(),
    email: document.querySelector("#setupEmail").value.trim(),
    dni: document.querySelector("#setupDni").value.trim(),
    area: document.querySelector("#setupArea").value,
  };
  if (password !== confirmation) {
    errorElement.textContent = 'Las contraseñas no coinciden.';
    errorElement.hidden = false;
    return;
  }
  const result = await connectSharedState('employee', pendingEmployeeId, { action: 'setup', password, profile });
  if (!result.authenticated) {
    errorElement.textContent = result.error || 'No se pudo configurar el acceso.';
    errorElement.hidden = false;
    return;
  }
  await enterEmployeeMode(pendingEmployeeId);
}

async function submitVisitLogin() {
  const errorElement = document.querySelector("#visitLoginError");
  const result = await connectSharedState('visit', null, {
    password: document.querySelector("#visitPasswordInput").value,
  });
  if (!result.authenticated) {
    errorElement.textContent = result.error || 'Contraseña incorrecta.';
    errorElement.hidden = false;
    return;
  }
  showLocationStep("visitor");
}

async function tryAdminPin() {
  const pinInput = document.querySelector("#adminPinInput");
  const pinError = document.querySelector("#pinError");
  const pin = pinInput.value.trim();
  const correct = state.settings.adminPin || "0000";
  const sharedLogin = await connectSharedState('admin');
  if (sharedLogin.authenticated && (sharedLogin.available || pin === correct)) {
    pinError.hidden = true;
    showLocationStep("admin");
  } else {
    pinError.textContent = sharedLogin.error || "PIN incorrecto. Intentá de nuevo.";
    pinError.hidden = false;
    pinInput.value = "";
    pinInput.focus();
  }
}

function setAdminMode(locationId = DEFAULT_LOCATION_ID) {
  activeLocationId = normalizeLocationId(locationId);
  appRole = "admin";
  document.body.classList.remove("visit-mode");
  document.querySelector("#role-screen").hidden = true;
  document.querySelector("#employee-app").hidden = true;
  document.querySelector(".app-shell").hidden = false;
  if (!adminInited) {
    adminInited = true;
    init();
  } else {
    populateSelectors();
    hydrateSettingsForm();
    render();
    initBistrosoftSync();
  }
}

async function enterEmployeeMode(employeeId) {
  appRole = "employee";
  document.body.classList.remove("visit-mode");
  activeEmployeeId = employeeId;
  activeLocationId = getEmployeeLocationId(employeeId);
  document.querySelector("#role-screen").hidden = true;
  document.querySelector(".app-shell").hidden = true;
  document.querySelector("#employee-app").hidden = false;

  const employee = getEmployee(employeeId);
  document.querySelector("#empGreeting").textContent = `Hola, ${employee.label}`;
  document.querySelector("#empPunchWho").textContent = `Fichando como ${employee.label}`;

  if (!empEventsInited) {
    empEventsInited = true;
    bindEmployeeEvents();
  }

  const closedDates = autoCloseForgottenPunches(employeeId);
  startShiftNotifications();
  renderEmployeeView();
  if (closedDates.length) {
    alert(`Se cerraron automáticamente fichajes olvidados de: ${closedDates.map(formatHumanDate).join(', ')}.`);
  }
}

function setVisitMode(locationId = DEFAULT_LOCATION_ID) {
  activeLocationId = normalizeLocationId(locationId);
  appRole = "visitor";
  activeEmployeeId = null;
  document.body.classList.add("visit-mode");
  document.querySelector("#role-screen").hidden = true;
  document.querySelector("#employee-app").hidden = true;
  document.querySelector(".app-shell").hidden = false;
  document.querySelector("#adminExit").textContent = "Salir";
  if (!adminInited) {
    adminInited = true;
    init();
  } else {
    populateSelectors();
    hydrateSettingsForm();
    render();
  }
  activeFinTab = 'monthly';
  setActiveFinTab('monthly');
  setActiveTab("schedule");
}

function exitToRoleScreen() {
  stopShiftNotifications();
  disconnectSharedState();
  appRole = null;
  activeEmployeeId = null;
  activeLocationId = DEFAULT_LOCATION_ID;
  pendingEmployeeId = null;
  pendingLocationRole = null;
  document.body.classList.remove("visit-mode");
  document.querySelector(".app-shell").hidden = true;
  document.querySelector("#employee-app").hidden = true;
  showRoleStep("roleStep1");
  document.querySelector("#adminPinInput").value = "";
  document.querySelector("#pinError").hidden = true;
  document.querySelector("#visitPasswordInput").value = "";
  document.querySelector("#employeePasswordInput").value = "";
  document.querySelector("#role-screen").hidden = false;
}

// ===========================
// EMPLOYEE VIEW
// ===========================

function bindEmployeeEvents() {
  document.querySelectorAll(".emp-tab").forEach((btn) => {
    btn.addEventListener("click", () => setActiveEmpTab(btn.dataset.empTab));
  });

  document.querySelector("#empExit").addEventListener("click", exitToRoleScreen);
  document.querySelector("#empPunchIn").addEventListener("click", () => handleEmpPunch("in"));
  document.querySelector("#empPunchOut").addEventListener("click", () => handleEmpPunch("out"));
  document.querySelector("#cancelWaste").addEventListener("click", closeWasteModal);
  document.querySelector("#confirmWaste").addEventListener("click", confirmWasteAndPunch);
  document.querySelector("#empChangeForm").addEventListener("submit", handleEmpChangeForm);

  document.querySelector("#empPrevMonth").addEventListener("click", () => {
    activeMonth = addMonths(activeMonth, -1);
    renderEmpSchedule();
  });
  document.querySelector("#empNextMonth").addEventListener("click", () => {
    activeMonth = addMonths(activeMonth, 1);
    renderEmpSchedule();
  });
  document.querySelector("#empHoursPrevMonth").addEventListener("click", () => {
    empHoursMonth = addMonths(empHoursMonth, -1);
    renderEmpHours();
  });
  document.querySelector("#empHoursNextMonth").addEventListener("click", () => {
    empHoursMonth = addMonths(empHoursMonth, 1);
    renderEmpHours();
  });

  document.querySelector("#empChangeDate").value = toDateInput(new Date());
  document.querySelector("#empProfileForm").addEventListener("submit", handleEmpProfileForm);
}

function setActiveEmpTab(tab) {
  document.querySelectorAll(".emp-tab").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.empTab === tab);
  });
  document.querySelectorAll(".emp-panel").forEach((panel) => {
    panel.classList.toggle("is-visible", panel.dataset.empPanel === tab);
  });
}

function renderEmployeeView() {
  renderEmpToday();
  renderEmpPunches();
  renderEmpSchedule();
  renderEmpHours();
  renderEmpChanges();
  renderEmpProfile();
}

function renderEmpToday() {
  const today = toDateInput(new Date());
  const day = new Date().getDay();
  const shifts = getShiftsForDate(today).filter((s) => s.employeeId === activeEmployeeId);
  const holiday = getHoliday(today);
  const container = document.querySelector("#empTodayCard");

  if (!shifts.length) {
    container.innerHTML = `
      <div class="emp-today-card is-off">
        <span class="emp-today-date">${DAY_NAMES[day]} ${new Date().getDate()}</span>
        <div class="emp-today-time">Franco</div>
        <div class="emp-today-duration">Sin turno hoy</div>
        <div class="emp-today-info">${holiday ? escapeHtml(holiday.name) : getOpenLabel(day)}</div>
      </div>`;
  } else {
    const shift = shifts[0];
    container.innerHTML = `
      <div class="emp-today-card">
        <span class="emp-today-date">${DAY_NAMES[day]} ${new Date().getDate()}</span>
        <div class="emp-today-time">${formatHour(shift.start)} – ${formatHour(shift.end)}</div>
        <div class="emp-today-duration">${formatHours(shift.end - shift.start)}</div>
        <div class="emp-today-info">${holiday ? escapeHtml(holiday.name) + " · " + holiday.open + "-" + holiday.close : getOpenLabel(day)}</div>
      </div>`;
  }

  const teamShifts = getShiftsForDate(today).filter((s) => s.employeeId !== activeEmployeeId);
  const teamContainer = document.querySelector("#empTeamCard");

  if (!teamShifts.length) {
    teamContainer.innerHTML = "";
    return;
  }

  teamContainer.innerHTML = `
    <div class="list-surface">
      <div class="list-heading"><h3>Compañeros hoy</h3></div>
      <div class="event-list">
        ${teamShifts
          .map((s) => {
            const emp = getEmployee(s.employeeId, today);
            return `<article class="event-item" style="border-left:3px solid ${emp.color};padding-left:11px">
              <div class="event-topline"><span>${emp.label}</span><span>${formatHour(s.start)}–${formatHour(s.end)}</span></div>
              <div class="event-meta">${emp.role}</div>
            </article>`;
          })
          .join("")}
      </div>
    </div>`;
}

function renderEmpPunches() {
  const container = document.querySelector("#empPunchList");
  const punches = state.punches
    .filter((p) => p.employeeId === activeEmployeeId)
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8);

  if (!punches.length) {
    renderEmpty(container);
    return;
  }

  container.innerHTML = punches
    .map((p) => {
      const statusClass =
        p.status === "late" ? "status-late" : p.status === "outside" ? "status-outside" : "status-approved";
      const statusText = p.status === "late" ? "Tarde" : p.status === "outside" ? "Fuera de radio" : "OK";
      return `
        <article class="event-item${p.autoClosed ? ' auto-closed-punch' : ''}">
          <div class="event-topline">
            <span>${p.type === "in" ? "Entrada" : "Salida"}</span>
            <span class="status-pill ${statusClass}">${statusText}</span>
          </div>
          <div class="event-meta">${formatDateTime(p.timestamp)} · ${p.geoLabel || "Sin ubicación"}</div>
        </article>`;
    })
    .join("");
}

function renderEmpSchedule() {
  const month = activeMonth.getMonth();
  const year = activeMonth.getFullYear();
  const today = toDateInput(new Date());

  document.querySelector("#empMonthLabel").textContent = `${MONTH_NAMES[month]} ${year}`;

  const days = getMonthDays(activeMonth);
  const container = document.querySelector("#empScheduleList");

  container.innerHTML = days
    .map((date) => {
      const dateKey = toDateInput(date);
      const day = date.getDay();
      const shifts = getShiftsForDate(dateKey).filter((s) => s.employeeId === activeEmployeeId);
      const holiday = getHoliday(dateKey);
      const isToday = dateKey === today;

      let classes = "emp-day-row";
      if (isToday) classes += " is-today";
      if (!shifts.length) classes += " is-off";

      return `
        <div class="${classes}">
          <div>
            <div class="emp-day-name">${DAY_NAMES[day]} ${date.getDate()}${holiday ? " ·" : ""}</div>
            ${holiday ? `<div class="emp-day-meta">${escapeHtml(holiday.name)}</div>` : ""}
          </div>
          ${
            shifts.length
              ? `<span class="emp-day-shift">${shifts.map((s) => `${formatHour(s.start)}–${formatHour(s.end)}`).join(", ")}</span>`
              : `<span class="emp-day-off-label">Franco</span>`
          }
        </div>`;
    })
    .join("");
}

function workedHoursByDate(employeeId, monthDate) {
  const monthKey = monthInputValue(monthDate);
  const result = new Map();
  const open = new Map();
  state.punches
    .filter((punch) => punch.employeeId === employeeId && punch.date.startsWith(monthKey))
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .forEach((punch) => {
      if (punch.type === 'in') open.set(punch.date, punch);
      else if (punch.type === 'out' && open.has(punch.date)) {
        const hours = (new Date(punch.timestamp) - new Date(open.get(punch.date).timestamp)) / 36e5;
        if (hours > 0) result.set(punch.date, (result.get(punch.date) || 0) + hours);
        open.delete(punch.date);
      }
    });
  return result;
}

function renderEmpHours() {
  const container = document.querySelector("#empHoursContent");
  if (!container || !activeEmployeeId) return;
  const year = empHoursMonth.getFullYear();
  const month = empHoursMonth.getMonth();
  const contract = state.contracts?.[activeEmployeeId] || {};
  const hoursPerWeek = Number(contract.hoursPerWeek || 0);
  const contracted = hoursPerWeek > 0 ? hoursPerWeek * (new Date(year, month + 1, 0).getDate() / 7) : 0;
  const byDate = workedHoursByDate(activeEmployeeId, empHoursMonth);
  const worked = [...byDate.values()].reduce((sum, value) => sum + value, 0);
  const holidays = (getLocationSettings().holidays || []).filter((holiday) => holiday.date.startsWith(monthInputValue(empHoursMonth)));
  const holidayHours = holidays.reduce((sum, holiday) => sum + (byDate.get(holiday.date) || 0), 0);
  const difference = worked - contracted;
  const differenceClass = difference >= 0 ? 'hours-positive' : 'hours-negative';
  document.querySelector("#empHoursMonthLabel").textContent = `${MONTH_NAMES[month]} ${year}`;

  const holidayRows = holidays
    .filter((holiday) => (byDate.get(holiday.date) || 0) > 0)
    .map((holiday) => `<article class="event-item">
      <div class="event-topline"><span>${formatHumanDate(holiday.date)}</span><strong>${(byDate.get(holiday.date) || 0).toFixed(1)} h</strong></div>
      <div class="event-meta">${escapeHtml(holiday.name || 'Feriado')}</div>
    </article>`)
    .join('');

  container.innerHTML = `
    ${hoursPerWeek <= 0 ? '<div class="hours-notice">El administrador todavía no cargó tu contrato. Las horas trabajadas y feriados se muestran igualmente.</div>' : ''}
    <div class="emp-hours-grid">
      <div class="emp-hours-card"><span>Horas de contrato</span><strong>${contracted > 0 ? contracted.toFixed(1) + ' h' : '—'}</strong></div>
      <div class="emp-hours-card"><span>Horas trabajadas</span><strong>${worked.toFixed(1)} h</strong></div>
      <div class="emp-hours-card ${differenceClass}"><span>Diferencia</span><strong>${contracted > 0 ? `${difference >= 0 ? '+' : ''}${difference.toFixed(1)} h` : '—'}</strong></div>
      <div class="emp-hours-card"><span>Horas en feriados</span><strong>${holidayHours.toFixed(1)} h</strong></div>
    </div>
    <div class="list-surface">
      <div class="list-heading"><h3>Feriados trabajados</h3></div>
      <div class="event-list">${holidayRows || '<div class="empty-state">Sin feriados trabajados este mes.</div>'}</div>
    </div>`;
}

function renderEmpChanges() {
  const container = document.querySelector("#empChangeList");
  const myChanges = state.changes
    .filter((c) => c.employeeId === activeEmployeeId)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!myChanges.length) {
    renderEmpty(container);
    return;
  }

  container.innerHTML = myChanges
    .map((c) => {
      const statusClass =
        c.status === "approved" ? "status-approved" : c.status === "rejected" ? "status-rejected" : "status-pending";
      return `
        <article class="event-item">
          <div class="event-topline">
            <span>${actionLabel(c.action)} · ${formatHumanDate(c.date)}</span>
            <span class="status-pill ${statusClass}">${statusLabel(c.status)}</span>
          </div>
          <div class="event-meta">${c.start}–${c.end} · ${c.reason}${c.note ? " · " + escapeHtml(c.note) : ""}</div>
        </article>`;
    })
    .join("");
}

async function handleEmpPunch(type) {
  if (type === "out") {
    openWasteModal();
    return;
  }
  await performEmpPunch(type);
}

function openWasteModal() {
  document.querySelectorAll(".waste-quantity").forEach((input) => { input.value = "0"; });
  document.querySelector("#wasteCustomProduct").value = "";
  document.querySelector("#wasteCustomQuantity").value = "0";
  document.querySelector("#wasteModal").hidden = false;
}

function closeWasteModal() {
  document.querySelector("#wasteModal").hidden = true;
}

async function confirmWasteAndPunch() {
  const button = document.querySelector("#confirmWaste");
  button.disabled = true;
  const items = [...document.querySelectorAll(".waste-quantity")]
    .map((input) => ({
      product: input.dataset.wasteProduct,
      quantity: Math.max(0, Number(input.value || 0)),
    }))
    .filter((item) => item.quantity > 0);
  const customProduct = document.querySelector("#wasteCustomProduct").value.trim();
  const customQuantity = Math.max(0, Number(document.querySelector("#wasteCustomQuantity").value || 0));
  if (customProduct && customQuantity > 0) {
    items.push({ product: customProduct, quantity: customQuantity, custom: true });
  }

  state.wasteRecords.push({
    id: createId(),
    locationId: activeLocationId,
    date: toDateInput(new Date()),
    employeeId: activeEmployeeId,
    items,
    submittedAt: new Date().toISOString(),
  });
  closeWasteModal();
  try {
    await performEmpPunch("out");
  } finally {
    button.disabled = false;
  }
}

async function performEmpPunch(type) {
  const employeeId = activeEmployeeId;
  const now = new Date();
  const dateKey = toDateInput(now);
  const geoNote = document.querySelector("#empGeoNote");
  geoNote.textContent = "Validando ubicación...";

  const geo = await getCurrentLocation();
  const geoResult = evaluateGeo(geo);
  const status = type === "in" ? getPunchStatus(employeeId, dateKey, now, geoResult) : geoResult.status;

  state.punches.push({
    id: createId(),
    employeeId,
    locationId: activeLocationId,
    type,
    timestamp: now.toISOString(),
    date: dateKey,
    status,
    geo,
    geoLabel: geoResult.label,
  });

  geoNote.textContent = geoResult.message;
  saveState();
  renderEmpToday();
  renderEmpPunches();
}

function autoCloseForgottenPunches(employeeId) {
  const today = toDateInput(new Date());
  const byDate = new Map();
  state.punches
    .filter((punch) => punch.employeeId === employeeId && punch.date < today)
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .forEach((punch) => {
      if (!byDate.has(punch.date)) byDate.set(punch.date, []);
      byDate.get(punch.date).push(punch);
    });

  const closedDates = [];
  byDate.forEach((punches, dateKey) => {
    let openPunch = null;
    punches.forEach((punch) => {
      if (punch.type === 'in') openPunch = punch;
      else if (punch.type === 'out') openPunch = null;
    });
    if (!openPunch) return;

    const shifts = getShiftsForDate(dateKey)
      .filter((shift) => shift.employeeId === employeeId)
      .sort((a, b) => b.end - a.end);
    let end = shifts.length ? dateWithTime(dateKey, shifts[0].end) : dateWithTime(dateKey, 23 + 59 / 60);
    if (end <= new Date(openPunch.timestamp)) end = dateWithTime(dateKey, 23 + 59 / 60);
    state.punches.push({
      id: createId(),
      employeeId,
      locationId: getEmployeeLocationId(employeeId),
      type: 'out',
      timestamp: end.toISOString(),
      date: dateKey,
      status: 'approved',
      geo: null,
      geoLabel: '(cierre automático)',
      autoClosed: true,
    });
    closedDates.push(dateKey);
  });

  if (closedDates.length) saveState();
  return closedDates.sort();
}

async function startShiftNotifications() {
  stopShiftNotifications();
  if (!('Notification' in window)) return;
  try {
    if (Notification.permission === 'default') await Notification.requestPermission();
  } catch (_) {
    return;
  }
  if (Notification.permission !== 'granted') return;
  checkShiftNotifications();
  shiftNotificationTimer = setInterval(checkShiftNotifications, 60000);
}

function checkShiftNotifications() {
  if (appRole !== 'employee' || !activeEmployeeId || Notification.permission !== 'granted') return;
  const now = new Date();
  const dateKey = toDateInput(now);
  getShiftsForDate(dateKey)
    .filter((shift) => shift.employeeId === activeEmployeeId)
    .forEach((shift) => {
      const start = dateWithTime(dateKey, shift.start);
      const minutes = Math.ceil((start - now) / 60000);
      const key = `${activeEmployeeId}-${dateKey}-${shift.start}`;
      if (minutes >= 0 && minutes <= 5 && !notifiedShiftKeys.has(key)) {
        notifiedShiftKeys.add(key);
        try {
          new Notification('ÖSS Kaffe', {
            body: `Tu turno empieza a las ${formatHour(shift.start)} (en ${minutes} min). ¡Preparate!`,
          });
        } catch (_) {
          // Algunos navegadores móviles requieren notificaciones mediante service worker.
        }
      }
    });
}

function stopShiftNotifications() {
  clearInterval(shiftNotificationTimer);
  shiftNotificationTimer = null;
  notifiedShiftKeys.clear();
}

// ===========================
// EMPLOYEE PROFILE
// ===========================

function getProfile(employeeId) {
  return state.profiles[employeeId] || {};
}

function saveProfileData(employeeId, data) {
  const normalizedLocation = data.locationId ? normalizeLocationId(data.locationId) : getEmployeeLocationId(employeeId);
  const employee = (state.employees || []).find((item) => item.id === employeeId);
  if (employee) employee.locationId = normalizedLocation;
  state.profiles[employeeId] = { ...getProfile(employeeId), ...data, locationId: normalizedLocation };
  if (!state.baseSchedules?.[employeeId]) saveEmployeeBaseSchedule(employeeId, createBlankBaseSchedule());
  saveState();
}

function renderEmpProfile() {
  const p = getProfile(activeEmployeeId);
  const fields = [
    ["profFullName", p.fullName],
    ["profPhone", p.phone],
    ["profEmail", p.email],
    ["profDni", p.dni],
    ["profSsNumber", p.ssNumber],
    ["profIban", p.iban],
    ["profStartDate", p.startDate],
    ["profAddress", p.address],
    ["profEmergencyName", p.emergencyName],
    ["profEmergencyPhone", p.emergencyPhone],
  ];
  fields.forEach(([id, val]) => {
    const el = document.querySelector(`#${id}`);
    if (el) el.value = val || "";
  });
  const contractEl = document.querySelector("#profContractType");
  if (contractEl && p.contractType) contractEl.value = p.contractType;
  const areaEl = document.querySelector("#profArea");
  if (areaEl) areaEl.value = p.area || "Barista";
  const note = document.querySelector("#profSaveNote");
  if (note) note.textContent = "";
}

function handleEmpProfileForm(event) {
  event.preventDefault();
  const data = {
    fullName: document.querySelector("#profFullName").value.trim(),
    phone: document.querySelector("#profPhone").value.trim(),
    email: document.querySelector("#profEmail").value.trim(),
    dni: document.querySelector("#profDni").value.trim(),
    area: document.querySelector("#profArea").value,
    ssNumber: document.querySelector("#profSsNumber").value.trim(),
    iban: document.querySelector("#profIban").value.trim(),
    contractType: document.querySelector("#profContractType").value,
    startDate: document.querySelector("#profStartDate").value,
    address: document.querySelector("#profAddress").value.trim(),
    emergencyName: document.querySelector("#profEmergencyName").value.trim(),
    emergencyPhone: document.querySelector("#profEmergencyPhone").value.trim(),
  };
  saveProfileData(activeEmployeeId, data);
  document.querySelector("#profSaveNote").textContent = "Ficha guardada correctamente.";
}

// ===========================
// ADMIN FICHAS
// ===========================

function initFichasContratos() {
  document.querySelectorAll('.fichas-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFichasTab = btn.dataset.fichasTab;
      document.querySelectorAll('.fichas-tab').forEach((b) =>
        b.classList.toggle('is-active', b.dataset.fichasTab === activeFichasTab)
      );
      document.querySelectorAll('.fichas-sub-panel').forEach((p) =>
        p.classList.toggle('is-visible', p.dataset.fichasPanel === activeFichasTab)
      );
      if (activeFichasTab === 'contratos') renderContratosPanel();
      if (activeFichasTab === 'personal') renderPersonnelPanel();
    });
  });
  document.querySelector('#teamMemberForm').addEventListener('submit', handleTeamMemberForm);
}

function teamMemberId(name) {
  const base = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "empleado";
  let id = base;
  let suffix = 2;
  const existing = new Set(getEmployees(true).map((employee) => employee.id));
  while (existing.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

async function handleTeamMemberForm(event) {
  event.preventDefault();
  const label = document.querySelector('#teamMemberName').value.trim();
  const role = document.querySelector('#teamMemberRole').value.trim();
  const area = document.querySelector('#teamMemberArea').value;
  const locationId = normalizeLocationId(document.querySelector('#teamMemberLocation')?.value || activeLocationId);
  const activeFrom = document.querySelector('#teamMemberActiveFrom')?.value || toDateInput(new Date());
  const color = document.querySelector('#teamMemberColor').value || '#416877';
  if (!label || !role) return;

  const id = teamMemberId(label);
  state.employees.push({
    id,
    label,
    role,
    color,
    locationId,
    active: true,
    canLogin: true,
    activeFrom,
  });
  state.profiles[id] = { ...(state.profiles[id] || {}), area, locationId };
  if (!state.baseSchedules) state.baseSchedules = {};
  state.baseSchedules[id] = createBlankBaseSchedule();
  document.querySelector('#teamMemberForm').reset();
  document.querySelector('#teamMemberLocation').value = activeLocationId;
  document.querySelector('#teamMemberActiveFrom').value = toDateInput(new Date());
  document.querySelector('#teamMemberColor').value = '#416877';
  saveState();
  const persisted = await persistSharedStateNow();
  populateSelectors();
  renderEmployeeChoiceButtons();
  render();
  if (!persisted) {
    alert("El empleado quedó guardado en este dispositivo, pero no se pudo confirmar el guardado en Netlify. Revisá la conexión antes de salir.");
  }
}

function renderPersonnelPanel() {
  const container = document.querySelector('#teamMemberList');
  if (!container) return;
  const today = toDateInput(new Date());
  const employees = getAllEmployees(true).filter((employee) => !employee.system);
  const currentEmployees = employees.filter((employee) => isEmployeeActiveOnDate(employee, today));
  const upcomingEmployees = employees.filter((employee) => employee.active !== false && employee.activeFrom && employee.activeFrom > today);
  const formerEmployees = employees.filter((employee) =>
    employee.active === false && (!employee.inactiveFrom || employee.inactiveFrom <= today)
  );

  const renderEmployeeCard = (employee, group) => {
    const upcoming = group === 'upcoming';
    const former = group === 'former';
    const scheduledEnd = !former && employee.active === false && employee.inactiveFrom > today;
    const profile = getProfile(employee.id);
    const color = /^#[0-9a-f]{6}$/i.test(employee.color || '') ? employee.color : '#416877';
    return `
      <article class="event-item team-member-item${former ? ' is-inactive' : ''}">
        <div class="event-topline">
          <span><span class="legend-swatch" style="background:${color}"></span>${escapeHtml(employee.label)}</span>
          <span class="status-pill ${former ? 'status-rejected' : upcoming ? 'status-pending' : 'status-approved'}">
            ${former ? 'Baja' : upcoming ? 'Alta futura' : scheduledEnd ? 'Baja programada' : 'Activo'}
          </span>
        </div>
        <div class="event-meta">
          ${escapeHtml(employee.role)} · ${escapeHtml(profile.area || 'Sin área')}
          ${employee.activeFrom ? ` · alta ${formatHumanDate(employee.activeFrom)}` : ''}
          ${employee.inactiveFrom ? ` · baja ${formatHumanDate(employee.inactiveFrom)}` : ''}
        </div>
        <div class="team-member-edit-grid">
          <label>
            Rol
            <input type="text" value="${escapeHtml(employee.role)}" data-team-role="${employee.id}" maxlength="60" />
          </label>
          <label>
            Sucursal
            <select data-team-location="${employee.id}">
              <option value="barcelona"${normalizeLocationId(employee.locationId) === 'barcelona' ? ' selected' : ''}>Barcelona</option>
              <option value="madrid"${normalizeLocationId(employee.locationId) === 'madrid' ? ' selected' : ''}>Madrid</option>
            </select>
          </label>
          <label>
            Color en grilla
            <span class="team-color-control">
              <input type="color" value="${color}" data-team-color="${employee.id}" aria-label="Color de ${escapeHtml(employee.label)}" />
              <span>${color.toUpperCase()}</span>
            </span>
          </label>
        </div>
        <div class="event-actions">
          <button class="mini-button" type="button" data-save-team="${employee.id}">Guardar rol y color</button>
          ${former ? `
            <button class="mini-button" type="button" data-reactivate-team="${employee.id}">Reactivar desde hoy</button>
          ` : `
            <label class="team-end-date">Baja desde
              <input type="date" data-team-end-date="${employee.id}" value="${escapeHtml(employee.inactiveFrom || today)}" min="${escapeHtml(employee.activeFrom || '')}" />
            </label>
            <button class="mini-button danger" type="button" data-terminate-team="${employee.id}">
              ${scheduledEnd ? 'Actualizar baja' : 'Programar baja'}
            </button>
          `}
        </div>
      </article>`;
  };

  container.innerHTML = `
    <section class="personnel-group">
      <h4>Personal activo</h4>
      ${currentEmployees.length ? currentEmployees.map((employee) => renderEmployeeCard(employee, 'current')).join('') : '<div class="empty-state">Sin empleados activos.</div>'}
    </section>
    ${upcomingEmployees.length ? `
      <section class="personnel-group">
        <h4>Próximas altas</h4>
        ${upcomingEmployees.map((employee) => renderEmployeeCard(employee, 'upcoming')).join('')}
      </section>` : ''}
    <section class="personnel-group personnel-former">
      <h4>Empleados dados de baja</h4>
      ${formerEmployees.length ? formerEmployees.map((employee) => renderEmployeeCard(employee, 'former')).join('') : '<div class="empty-state">Todavía no hay empleados dados de baja.</div>'}
    </section>`;

  container.querySelectorAll('[data-team-color]').forEach((input) => {
    input.addEventListener('input', () => {
      const value = input.closest('.team-color-control')?.querySelector('span');
      if (value) value.textContent = input.value.toUpperCase();
    });
  });

  container.querySelectorAll('[data-save-team]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.saveTeam;
      const employee = state.employees.find((item) => item.id === id);
      const roleInput = container.querySelector(`[data-team-role="${id}"]`);
      const locationInput = container.querySelector(`[data-team-location="${id}"]`);
      const colorInput = container.querySelector(`[data-team-color="${id}"]`);
      if (!employee || !roleInput || !colorInput || !locationInput) return;

      const role = roleInput.value.trim();
      if (!role) {
        alert('El rol no puede quedar vacío.');
        roleInput.focus();
        return;
      }

      employee.role = role;
      employee.color = colorInput.value;
      employee.locationId = normalizeLocationId(locationInput.value);
      state.profiles[id] = { ...(state.profiles[id] || {}), locationId: employee.locationId };
      saveState();
      populateSelectors();
      renderEmployeeChoiceButtons();
      render();
    });
  });

  container.querySelectorAll('[data-terminate-team]').forEach((button) => {
    button.addEventListener('click', () => {
      const employee = state.employees.find((item) => item.id === button.dataset.terminateTeam);
      if (!employee) return;
      const inactiveFrom = container.querySelector(`[data-team-end-date="${employee.id}"]`)?.value;
      if (!inactiveFrom) return alert('Elegí la fecha desde la cual se dará de baja.');
      if (employee.activeFrom && inactiveFrom < employee.activeFrom) {
        return alert('La baja no puede ser anterior a la fecha de alta.');
      }
      if (!confirm(`¿Programar la baja de ${employee.label} desde ${formatHumanDate(inactiveFrom)}? Su historial se conservará.`)) return;
      employee.active = false;
      employee.inactiveFrom = inactiveFrom;
      saveState();
      populateSelectors();
      renderEmployeeChoiceButtons();
      render();
    });
  });

  container.querySelectorAll('[data-reactivate-team]').forEach((button) => {
    button.addEventListener('click', () => {
      const employee = state.employees.find((item) => item.id === button.dataset.reactivateTeam);
      if (!employee) return;
      if (confirm(`¿Reactivar a ${employee.label} desde hoy?`)) {
        employee.active = true;
        employee.activeFrom = toDateInput(new Date());
        employee.inactiveFrom = null;
        saveState();
        populateSelectors();
        renderEmployeeChoiceButtons();
        render();
      }
    });
  });
}

function getEmployeeHoursForMonth(employeeId, monthDate) {
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
  const punches = getLocationPunches()
    .filter((p) => p.employeeId === employeeId && p.date.startsWith(monthKey))
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let total = 0;
  const open = new Map();
  punches.forEach((p) => {
    if (p.type === 'in') { open.set(p.date, p); }
    else if (p.type === 'out' && open.has(p.date)) {
      const ms = new Date(p.timestamp) - new Date(open.get(p.date).timestamp);
      if (ms > 0) total += ms / 36e5;
      open.delete(p.date);
    }
  });
  return total;
}

function getEmployeeScheduledHoursForMonth(employeeId, monthDate, allowedDates = null) {
  return getMonthDays(monthDate).reduce((total, date) => {
    const dateKey = toDateInput(date);
    if (allowedDates && !allowedDates.has(dateKey)) return total;
    return total + getShiftsForDate(dateKey)
      .filter((shift) => shift.employeeId === employeeId)
      .reduce((dayTotal, shift) => dayTotal + Math.max(0, shift.end - shift.start), 0);
  }, 0);
}

function getEmployeeHolidayHoursForMonth(employeeId, monthDate, holidayDates) {
  // holidayDates: Set of 'YYYY-MM-DD' strings
  if (!holidayDates || !holidayDates.size) return 0;
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
  const punches = getLocationPunches()
    .filter((p) => p.employeeId === employeeId && p.date.startsWith(monthKey) && holidayDates.has(p.date))
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let total = 0;
  const open = new Map();
  punches.forEach((p) => {
    if (p.type === 'in') { open.set(p.date, p); }
    else if (p.type === 'out' && open.has(p.date)) {
      const ms = new Date(p.timestamp) - new Date(open.get(p.date).timestamp);
      if (ms > 0) total += ms / 36e5;
      open.delete(p.date);
    }
  });
  return total;
}

function renderContratosPanelLegacy() {
  const container = document.getElementById('contratosPanel');
  if (!container) return;

  const year  = finActiveMonth.getFullYear();
  const month = finActiveMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthFactor = daysInMonth / 7; // Hs contratadas/mes = Hs/sem ÷ 7 × días del mes
  const monthKey    = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Feriados del mes (para calcular Hs/feriados)
  const holidayDates = new Set(
    (state.settings.holidays || [])
      .filter((h) => h.date.startsWith(monthKey))
      .map((h) => h.date)
  );

  const rows = getEmployees().map((emp) => {
    const c = state.contracts[emp.id] || {};
    const hpw  = c.hoursPerWeek       ?? 40;
    const rate = c.hourlyRate         ?? 0;
    const overtimeRate = c.overtimeRate ?? (rate * (c.overtimeMultiplier ?? 1.25));
    const holidayRate = c.holidayRate ?? 0;

    const contracted   = hpw * monthFactor;
    const real         = getEmployeeHoursForMonth(emp.id, finActiveMonth);
    const importeReal  = real * rate; // € totales por las horas trabajadas
    const diff         = real - contracted;
    const otHours      = Math.max(0, diff);
    const holHours     = getEmployeeHolidayHoursForMonth(emp.id, finActiveMonth, holidayDates);
    const regularCost  = Math.min(real, contracted) * rate;
    const otCost       = otHours * overtimeRate;
    const holCost      = holHours * holidayRate;
    const estimatedTotal = regularCost + otCost + holCost;

    const diffClass = diff > 0.05 ? 'horas-over' : diff < -0.05 ? 'horas-under' : '';
    const diffStr   = diff > 0.05 ? `+${diff.toFixed(1)} h` : diff < -0.05 ? `${diff.toFixed(1)} h` : '=';

    return `<tr>
      <td class="contratos-name">
        <span class="contratos-dot" style="background:${emp.color}"></span>${emp.label}
      </td>
      <td><input class="contratos-input" type="number" min="0" max="60" step="0.5"
        value="${hpw}" data-contract="${emp.id}" data-field="hoursPerWeek" /></td>
      <td><input class="contratos-input" type="number" min="0" step="0.01"
        value="${rate}" data-contract="${emp.id}" data-field="hourlyRate" /></td>
      <td><input class="contratos-input" type="number" min="0" step="0.01"
        value="${overtimeRate}" data-contract="${emp.id}" data-field="overtimeRate" /></td>
      <td><input class="contratos-input" type="number" min="0" step="0.01"
        value="${holidayRate}" data-contract="${emp.id}" data-field="holidayRate" /></td>
      <td class="fin-cell-num">${contracted.toFixed(1)} h</td>
      <td class="fin-cell-num">${real > 0 ? real.toFixed(1) + ' h' : '—'}</td>
      <td class="fin-cell-num">${real > 0 && rate > 0 ? formatEur(importeReal) : '—'}</td>
      <td class="fin-cell-num ${diffClass}">${real > 0 ? diffStr : '—'}</td>
      <td class="fin-cell-num">${otHours > 0.05 ? otHours.toFixed(1) + ' h' : '—'}</td>
      <td class="fin-cell-num">${otHours > 0.05 && rate > 0 ? formatEur(otCost) : otHours > 0.05 ? '<span class="form-note">sin tarifa</span>' : '—'}</td>
      <td class="fin-cell-num">${holHours > 0.05 ? holHours.toFixed(1) + ' h' : '—'}</td>
    </tr>`;
  }).join('');

  const liquidationRows = liquidationData.map(({ employee, total }) => {
    const settlement = monthSettlements[employee.id] || {};
    const payroll = Number(settlement.payroll || 0);
    const advance = Number(settlement.advance || 0);
    const payable = total - payroll - advance;
    return `<tr>
      <td class="contratos-name"><span class="contratos-dot" style="background:${employee.color}"></span>${escapeHtml(employee.label)}</td>
      <td class="fin-cell-num"><strong>${formatEur(total)}</strong></td>
      <td class="fin-cell-num"><input class="settlement-input" type="number" min="0" step="0.01" value="${payroll || ''}" placeholder="0,00" data-settlement="${employee.id}" data-settlement-field="payroll" /></td>
      <td class="fin-cell-num"><input class="settlement-input" type="number" min="0" step="0.01" value="${advance || ''}" placeholder="0,00" data-settlement="${employee.id}" data-settlement-field="advance" /></td>
      <td class="fin-cell-num ${payable < 0 ? 'fin-cell-negative' : 'fin-cell-positive'}"><strong>${formatEur(payable)}</strong></td>
    </tr>`;
  }).join('');
  const liquidationTotals = liquidationData.reduce((totals, { employee, total }) => {
    const settlement = monthSettlements[employee.id] || {};
    totals.estimated += total;
    totals.payroll += Number(settlement.payroll || 0);
    totals.advance += Number(settlement.advance || 0);
    return totals;
  }, { estimated: 0, payroll: 0, advance: 0 });
  const totalPayable = liquidationTotals.estimated - liquidationTotals.payroll - liquidationTotals.advance;

  container.innerHTML = `
    <div class="contratos-header">
      <h3>Horas &amp; Contratos · ${MONTH_NAMES[month]} ${year}</h3>
      <p class="form-note">Editá las columnas verdes directamente. Las horas reales y feriados vienen del módulo de fichaje.</p>
    </div>
    <div class="fin-table-wrap" style="overflow-x:auto">
      <table class="fin-table contratos-table">
        <thead>
          <tr>
            <th>Empleado</th>
            <th class="contratos-editable">Hs / semana</th>
            <th class="contratos-editable">€ / hora</th>
            <th class="contratos-editable">Mult. extras</th>
            <th class="fin-cell-num">Contratadas</th>
            <th class="fin-cell-num">Hs reales</th>
            <th class="fin-cell-num">Hs / €</th>
            <th class="fin-cell-num">Diferencia</th>
            <th class="fin-cell-num">Hs extras</th>
            <th class="fin-cell-num">Costo extras</th>
            <th class="fin-cell-num">Hs feriados</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="form-note" style="margin-top:12px">
      Contratadas = (Hs/sem ÷ 7) × días del mes.
      <strong>Hs/€</strong> = horas reales × €/hora.
      <strong>Extras</strong> = max(0, reales − contratadas). Costo extras = Hs extras × €/h × multiplicador.
      <strong>Feriados</strong> = horas trabajadas en días festivos del mes (${holidayDates.size} este mes).
    </p>`;

  // Save contract settings on change (after user leaves the field)
  container.querySelectorAll('.contratos-input').forEach((input) => {
    input.addEventListener('change', () => {
      const id    = input.dataset.contract;
      const field = input.dataset.field;
      if (!state.contracts[id]) state.contracts[id] = {};
      state.contracts[id][field] = parseFloat(input.value) || 0;
      saveState();
      renderContratosPanel();
    });
  });
}

function renderContratosPanel() {
  const container = document.getElementById('contratosPanel');
  if (!container || appRole === 'visitor') return;
  const year = finActiveMonth.getFullYear();
  const month = finActiveMonth.getMonth();
  const monthFactor = new Date(year, month + 1, 0).getDate() / 7;
  const monthKey = monthInputValue(finActiveMonth);
  const holidayDates = new Set(
    (state.settings.holidays || []).filter((holiday) => holiday.date.startsWith(monthKey)).map((holiday) => holiday.date)
  );
  const monthStart = `${monthKey}-01`;
  const monthEnd = toDateInput(new Date(year, month + 1, 0));
  const contractEmployees = getAllEmployees(true).filter((employee) =>
    !employee.system
    && normalizeLocationId(employee.locationId) === activeLocationId
    && (!employee.activeFrom || employee.activeFrom <= monthEnd)
    && (!employee.inactiveFrom || employee.inactiveFrom > monthStart)
  );
  if (!state.payrollSettlements[activeLocationId]) state.payrollSettlements[activeLocationId] = {};
  if (!state.payrollSettlements[activeLocationId][monthKey]) state.payrollSettlements[activeLocationId][monthKey] = {};
  const monthSettlements = state.payrollSettlements[activeLocationId][monthKey];
  const liquidationData = [];

  const rows = contractEmployees.map((employee) => {
    const contract = state.contracts[employee.id] || {};
    const hoursPerWeek = contract.hoursPerWeek ?? 40;
    const regularRate = contract.hourlyRate ?? 0;
    const overtimeRate = contract.overtimeRate ?? (regularRate * (contract.overtimeMultiplier ?? 1.25));
    const holidayRate = contract.holidayRate ?? 0;
    const contracted = hoursPerWeek * monthFactor;
    const worked = getEmployeeScheduledHoursForMonth(employee.id, finActiveMonth);
    const punched = getEmployeeHoursForMonth(employee.id, finActiveMonth);
    const difference = worked - contracted;
    const overtimeHours = Math.max(0, difference);
    const holidayHours = getEmployeeScheduledHoursForMonth(employee.id, finActiveMonth, holidayDates);
    const overtimeCost = overtimeHours * overtimeRate;
    const holidayCost = holidayHours * holidayRate;
    const regularCost = Math.min(worked, contracted) * regularRate;
    const total = regularCost + overtimeCost + holidayCost;
    liquidationData.push({ employee, total });
    const differenceClass = difference > 0.05 ? 'horas-over' : difference < -0.05 ? 'horas-under' : '';

    return `<tr>
      <td class="contratos-name"><span class="contratos-dot" style="background:${employee.color}"></span>${employee.label}</td>
      <td><input class="contratos-input" type="number" min="0" max="60" step="0.5" value="${hoursPerWeek}" data-contract="${employee.id}" data-field="hoursPerWeek" /></td>
      <td><input class="contratos-input" type="number" min="0" step="0.01" value="${regularRate}" data-contract="${employee.id}" data-field="hourlyRate" /></td>
      <td><input class="contratos-input" type="number" min="0" step="0.01" value="${overtimeRate}" data-contract="${employee.id}" data-field="overtimeRate" /></td>
      <td><input class="contratos-input" type="number" min="0" step="0.01" value="${holidayRate}" data-contract="${employee.id}" data-field="holidayRate" /></td>
      <td class="fin-cell-num">${contracted.toFixed(1)} h</td>
      <td class="fin-cell-num">${worked > 0 ? worked.toFixed(1) + ' h' : '—'}</td>
      <td class="fin-cell-num horas-fichadas">${punched > 0 ? punched.toFixed(1) + ' h' : '—'}</td>
      <td class="fin-cell-num">${worked > 0 && regularRate > 0 ? formatEur(regularCost) : '—'}</td>
      <td class="fin-cell-num ${differenceClass}">${worked > 0 ? `${difference >= 0 ? '+' : ''}${difference.toFixed(1)} h` : '—'}</td>
      <td class="fin-cell-num">${overtimeHours > 0.05 ? overtimeHours.toFixed(1) + ' h' : '—'}</td>
      <td class="fin-cell-num">${overtimeHours > 0.05 && overtimeRate > 0 ? formatEur(overtimeCost) : '—'}</td>
      <td class="fin-cell-num">${holidayHours > 0.05 ? holidayHours.toFixed(1) + ' h' : '—'}</td>
      <td class="fin-cell-num">${holidayHours > 0.05 && holidayRate > 0 ? formatEur(holidayCost) : '—'}</td>
      <td class="fin-cell-num"><strong>${worked > 0 ? formatEur(total) : '—'}</strong></td>
    </tr>`;
  }).join('');

  const liquidationTotals = { estimated: 0, payroll: 0, advance: 0 };
  const liquidationRows = liquidationData.map(({ employee, total }) => {
    const settlement = monthSettlements[employee.id] || {};
    const payroll = Math.max(0, Number(settlement.payroll || 0));
    const advance = Math.max(0, Number(settlement.advance || 0));
    const payable = total - payroll - advance;
    liquidationTotals.estimated += total;
    liquidationTotals.payroll += payroll;
    liquidationTotals.advance += advance;
    return `<tr>
      <td class="contratos-name"><span class="contratos-dot" style="background:${employee.color}"></span>${escapeHtml(employee.label)}</td>
      <td class="fin-cell-num"><strong>${formatEur(total)}</strong></td>
      <td class="fin-cell-num"><input class="settlement-input" type="number" min="0" step="0.01" value="${payroll}" data-settlement="${employee.id}" data-settlement-field="payroll" aria-label="Nómina de ${escapeHtml(employee.label)}" /></td>
      <td class="fin-cell-num"><input class="settlement-input" type="number" min="0" step="0.01" value="${advance}" data-settlement="${employee.id}" data-settlement-field="advance" aria-label="Adelanto de ${escapeHtml(employee.label)}" /></td>
      <td class="fin-cell-num ${payable < 0 ? 'fin-cell-negative' : 'fin-cell-positive'}"><strong>${formatEur(payable)}</strong></td>
    </tr>`;
  }).join('');
  const totalPayable = liquidationTotals.estimated - liquidationTotals.payroll - liquidationTotals.advance;

  container.innerHTML = `
    <div class="contratos-header">
      <h3>Horas &amp; Contratos · ${MONTH_NAMES[month]} ${year}</h3>
      <p class="form-note">Editá las columnas verdes directamente. La liquidación usa las horas cargadas en la grilla; las horas fichadas son solo informativas.</p>
    </div>
    <div class="fin-table-wrap" style="overflow-x:auto">
      <table class="fin-table contratos-table">
        <thead><tr>
          <th>Empleado</th><th class="contratos-editable">Hs / semana</th>
          <th class="contratos-editable">€/h regular</th><th class="contratos-editable">€/h extra</th>
          <th class="contratos-editable">€/h feriado</th><th class="fin-cell-num">Contratadas</th>
          <th class="fin-cell-num">Hs grilla</th><th class="fin-cell-num">Hs fichadas</th><th class="fin-cell-num">Costo regular</th><th class="fin-cell-num">Diferencia</th>
          <th class="fin-cell-num">Hs extras</th><th class="fin-cell-num">Costo extras</th>
          <th class="fin-cell-num">Hs feriados</th><th class="fin-cell-num">Costo feriados</th>
          <th class="fin-cell-num">Liquidación est.</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="form-note" style="margin-top:12px">La liquidación estimada suma las horas planificadas en la grilla, sus extras y los feriados. Las horas fichadas no modifican ningún importe.</p>
    <section class="settlement-panel">
      <div class="contratos-header">
        <h3>Pagos a realizar · ${MONTH_NAMES[month]} ${year}</h3>
        <p class="form-note">ABONAR = LIQUIDACIÓN ESTIMADA − NÓMINA − ADELANTO.</p>
      </div>
      <div style="overflow-x:auto">
        <table class="fin-table settlement-table">
          <thead><tr>
            <th>Empleado</th>
            <th class="fin-cell-num">Liquidación estimada</th>
            <th class="fin-cell-num contratos-editable">Nómina</th>
            <th class="fin-cell-num contratos-editable">Adelanto</th>
            <th class="fin-cell-num">Abonar</th>
          </tr></thead>
          <tbody>${liquidationRows}</tbody>
          <tfoot><tr class="fin-total-row">
            <td>Total</td>
            <td class="fin-cell-num">${formatEur(liquidationTotals.estimated)}</td>
            <td class="fin-cell-num">${formatEur(liquidationTotals.payroll)}</td>
            <td class="fin-cell-num">${formatEur(liquidationTotals.advance)}</td>
            <td class="fin-cell-num ${totalPayable < 0 ? 'fin-cell-negative' : 'fin-cell-positive'}">${formatEur(totalPayable)}</td>
          </tr></tfoot>
        </table>
      </div>
    </section>`;

  container.querySelectorAll('.contratos-input').forEach((input) => {
    input.addEventListener('change', () => {
      const id = input.dataset.contract;
      if (!state.contracts[id]) state.contracts[id] = {};
      state.contracts[id][input.dataset.field] = parseFloat(input.value) || 0;
      saveState();
      renderContratosPanel();
    });
  });
  container.querySelectorAll('.settlement-input').forEach((input) => {
    input.addEventListener('change', () => {
      const employeeId = input.dataset.settlement;
      const field = input.dataset.settlementField;
      if (!monthSettlements[employeeId]) monthSettlements[employeeId] = {};
      monthSettlements[employeeId][field] = Math.max(0, parseFloat(input.value) || 0);
      saveState();
      renderContratosPanel();
    });
  });
}

function renderAdminFichas() {
  const container = document.querySelector("#fichasGrid");
  if (!container) return;

  if (activeAdminFichaEditId) {
    const activeForm = container.querySelector(`[data-ficha-form="${activeAdminFichaEditId}"]`);
    if (activeForm && !activeForm.hidden) {
      adminFichaEditDraft = readFichaForm(activeForm);
      adminBaseScheduleEditDraft = readBaseScheduleForm(activeForm);
    }
  }

  const fields = [
    { key: "fullName", label: "Nombre completo" },
    { key: "phone", label: "Teléfono" },
    { key: "email", label: "Email" },
    { key: "address", label: "Dirección" },
    { key: "dni", label: "DNI / NIE" },
    { key: "ssNumber", label: "N° Seg. Social" },
    { key: "iban", label: "IBAN" },
    { key: "area", label: "Área" },
    { key: "locationId", label: "Sucursal" },
    { key: "contractType", label: "Contrato" },
    { key: "startDate", label: "Fecha inicio" },
    { key: "emergencyName", label: "Urgencia nombre" },
    { key: "emergencyPhone", label: "Urgencia tel" },
  ];

  container.innerHTML = getEmployees(true).map((emp) => {
    const profile = getProfile(emp.id);
    const isEditing = activeAdminFichaEditId === emp.id;
    const formProfile = isEditing && adminFichaEditDraft
      ? { locationId: emp.locationId, ...profile, ...adminFichaEditDraft }
      : { locationId: emp.locationId, ...profile };
    const formSchedule = isEditing && adminBaseScheduleEditDraft
      ? normalizeBaseSchedule(adminBaseScheduleEditDraft)
      : getEmployeeBaseSchedule(emp.id);
    const rows = fields
      .map((f) => {
        const val = profile[f.key];
        return `<div class="ficha-row">
          <span class="ficha-label">${f.label}</span>
          <span class="ficha-value${!val ? " ficha-empty" : ""}">${val ? escapeHtml(val) : "—"}</span>
        </div>`;
      })
      .join("");

    return `
      <div class="ficha-card${emp.active === false ? ' is-inactive' : ''}${isEditing ? ' is-editing' : ''}" data-ficha-card="${emp.id}">
        <div class="ficha-header" style="background:${emp.color}">
          <div class="ficha-name">${escapeHtml(emp.label)}</div>
          <div class="ficha-role">${escapeHtml(emp.role)}${emp.active === false ? ' · Baja' : ''}</div>
        </div>
        <div class="ficha-card-actions">
          <button class="mini-button" type="button" data-edit-ficha="${emp.id}"${isEditing ? ' hidden' : ''}>Editar ficha</button>
        </div>
        <div class="ficha-body" data-ficha-view="${emp.id}"${isEditing ? ' hidden' : ''}>
          ${rows}
          <div class="ficha-schedule-summary">
            <span class="ficha-label">Grilla base</span>
            <strong>${escapeHtml(getBaseScheduleSummary(emp.id))}</strong>
          </div>
        </div>
        <form class="ficha-edit-form" data-ficha-form="${emp.id}"${isEditing ? '' : ' hidden'}>
          <label class="payroll-toggle">
            <span>
              <strong>Nómina</strong>
              <small>Dato interno: alta en Hacienda</small>
            </span>
            <input name="payrollRegistered" type="checkbox"${formProfile.payrollRegistered === true || formProfile.payrollRegistered === 'true' ? ' checked' : ''} />
            <span class="payroll-toggle-ui" data-on="Sí" data-off="No"></span>
          </label>
          <div class="ficha-edit-grid">
            <label>Nombre completo
              <input name="fullName" type="text" value="${escapeHtml(formProfile.fullName || '')}" />
            </label>
            <label>Teléfono
              <input name="phone" type="tel" value="${escapeHtml(formProfile.phone || '')}" />
            </label>
            <label>Email
              <input name="email" type="email" value="${escapeHtml(formProfile.email || '')}" />
            </label>
            <label>Dirección
              <input name="address" type="text" value="${escapeHtml(formProfile.address || '')}" />
            </label>
            <label>DNI / NIE
              <input name="dni" type="text" value="${escapeHtml(formProfile.dni || '')}" />
            </label>
            <label>N° Seg. Social
              <input name="ssNumber" type="text" value="${escapeHtml(formProfile.ssNumber || '')}" />
            </label>
            <label>IBAN
              <input name="iban" type="text" value="${escapeHtml(formProfile.iban || '')}" />
            </label>
            <label>Área
              <select name="area">
                <option value="">Sin definir</option>
                <option value="Barista"${formProfile.area === 'Barista' ? ' selected' : ''}>Barista</option>
                <option value="Pastelería"${formProfile.area === 'Pastelería' ? ' selected' : ''}>Pastelería</option>
              </select>
            </label>
            <label>Sucursal
              <select name="locationId">
                <option value="barcelona"${normalizeLocationId(formProfile.locationId) === 'barcelona' ? ' selected' : ''}>Barcelona</option>
                <option value="madrid"${normalizeLocationId(formProfile.locationId) === 'madrid' ? ' selected' : ''}>Madrid</option>
              </select>
            </label>
            <label>Contrato
              <select name="contractType">
                <option value="">Sin definir</option>
                <option value="Indefinido"${formProfile.contractType === 'Indefinido' ? ' selected' : ''}>Indefinido</option>
                <option value="Temporal"${formProfile.contractType === 'Temporal' ? ' selected' : ''}>Temporal</option>
                <option value="Prácticas"${formProfile.contractType === 'Prácticas' ? ' selected' : ''}>Prácticas</option>
                <option value="Autónomo"${formProfile.contractType === 'Autónomo' ? ' selected' : ''}>Autónomo</option>
              </select>
            </label>
            <label>Fecha inicio
              <input name="startDate" type="date" value="${escapeHtml(formProfile.startDate || '')}" />
            </label>
            <label>Urgencia nombre
              <input name="emergencyName" type="text" value="${escapeHtml(formProfile.emergencyName || '')}" />
            </label>
            <label>Urgencia teléfono
              <input name="emergencyPhone" type="tel" value="${escapeHtml(formProfile.emergencyPhone || '')}" />
            </label>
          </div>
          <label>Nota interna (solo admin)
            <textarea name="adminNotes" rows="3" placeholder="Observaciones, documentación pendiente...">${escapeHtml(formProfile.adminNotes || '')}</textarea>
          </label>
          ${renderBaseScheduleEditor(emp, formSchedule)}
          <div class="ficha-edit-actions">
            <button class="primary-button" type="submit">Guardar cambios</button>
            <button class="ghost-button" type="button" data-cancel-ficha="${emp.id}">Cancelar</button>
          </div>
        </form>
        <div class="ficha-admin-notes" data-ficha-notes="${emp.id}"${isEditing ? ' hidden' : ''}>
          <div class="payroll-status ${profile.payrollRegistered ? 'is-yes' : 'is-no'}">Nómina: ${profile.payrollRegistered ? 'Sí' : 'No'}</div>
          <label style="display:block;font-size:0.8rem;font-weight:800;color:var(--muted)">Nota interna (solo admin)</label>
          <p>${profile.adminNotes ? escapeHtml(profile.adminNotes) : 'Sin observaciones.'}</p>
        </div>
      </div>`;
  }).join("");

  container.querySelectorAll("[data-edit-ficha]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.editFicha;
      activeAdminFichaEditId = id;
      adminFichaEditDraft = { ...getProfile(id) };
      adminBaseScheduleEditDraft = structuredClone(getEmployeeBaseSchedule(id));
      renderAdminFichas();
    });
  });

  container.querySelectorAll("[data-cancel-ficha]").forEach((button) => {
    button.addEventListener("click", () => {
      activeAdminFichaEditId = null;
      adminFichaEditDraft = null;
      adminBaseScheduleEditDraft = null;
      renderAdminFichas();
    });
  });

  container.querySelectorAll("[data-ficha-form]").forEach((form) => {
    const updateDraft = () => {
      if (form.dataset.fichaForm === activeAdminFichaEditId) {
        adminFichaEditDraft = readFichaForm(form);
        adminBaseScheduleEditDraft = readBaseScheduleForm(form);
      }
    };
    bindBaseScheduleEditor(form);
    form.addEventListener("input", updateDraft);
    form.addEventListener("change", updateDraft);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = readFichaForm(form);
      const employeeId = form.dataset.fichaForm;
      saveEmployeeBaseSchedule(employeeId, readBaseScheduleForm(form));
      saveProfileData(employeeId, data);
      activeAdminFichaEditId = null;
      adminFichaEditDraft = null;
      adminBaseScheduleEditDraft = null;
      renderAdminFichas();
    });
  });
}

function renderBaseScheduleEditor(employee, schedule) {
  const normalized = normalizeBaseSchedule(schedule);
  return `
    <section class="base-schedule-editor" data-base-schedule-editor>
      <div class="base-schedule-head">
        <div>
          <h4>Grilla base</h4>
          <p class="form-note">Define los turnos recurrentes. Para excepciones puntuales segui usando Cambios.</p>
        </div>
        <label>
          Tipo de grilla
          <select data-schedule-mode aria-label="Tipo de grilla de ${escapeHtml(employee.label)}">
            <option value="weekly"${normalized.mode === "weekly" ? " selected" : ""}>Semanal fija</option>
            <option value="biweekly"${normalized.mode === "biweekly" ? " selected" : ""}>Alternada A/B</option>
          </select>
        </label>
      </div>
      <div class="base-schedule-anchor" data-schedule-anchor-wrap${normalized.mode === "biweekly" ? "" : " hidden"}>
        <label>
          Semana A empieza el
          <input type="date" value="${escapeHtml(normalized.anchorDate)}" data-schedule-anchor />
        </label>
        <p class="form-note">Elegí un lunes de Semana A. La app alterna automaticamente A, B, A, B desde esa fecha.</p>
      </div>
      <div class="base-schedule-actions">
        <button class="mini-button" type="button" data-copy-week-a>Copiar Semana A a B</button>
      </div>
      ${renderScheduleWeekEditor(normalized, "a", normalized.mode === "biweekly" ? "Semana A" : "Semana fija")}
      ${renderScheduleWeekEditor(normalized, "b", "Semana B", normalized.mode !== "biweekly")}
    </section>`;
}

function renderScheduleWeekEditor(schedule, weekKey, title, hidden = false) {
  const week = schedule.weeks?.[weekKey] || {};
  const rows = SCHEDULE_DAY_ORDER.map((day) => {
    const shift = (week[day] || [])[0] || {};
    const enabled = !!shift.start && !!shift.end;
    const start = shift.start || "08:00";
    const end = shift.end || "14:00";
    return `
      <div class="base-schedule-row${enabled ? "" : " is-disabled"}" data-schedule-row>
        <label class="base-schedule-day">
          <input type="checkbox" data-schedule-enabled data-week="${weekKey}" data-day="${day}"${enabled ? " checked" : ""} />
          <span>${DAY_NAMES[day]}</span>
        </label>
        <label>Entrada
          <input type="time" value="${escapeHtml(start)}" data-schedule-start data-week="${weekKey}" data-day="${day}"${enabled ? "" : " disabled"} />
        </label>
        <label>Salida
          <input type="time" value="${escapeHtml(end)}" data-schedule-end data-week="${weekKey}" data-day="${day}"${enabled ? "" : " disabled"} />
        </label>
      </div>`;
  }).join("");

  return `
    <div class="base-schedule-week" data-schedule-week="${weekKey}"${hidden ? " hidden" : ""}>
      <div class="base-schedule-week-title">${title}</div>
      <div class="base-schedule-grid">${rows}</div>
    </div>`;
}

function readBaseScheduleForm(form) {
  const mode = form.querySelector("[data-schedule-mode]")?.value === "biweekly" ? "biweekly" : "weekly";
  const anchorDate = form.querySelector("[data-schedule-anchor]")?.value || DEFAULT_SCHEDULE_ANCHOR;
  const weeks = { a: {}, b: {} };

  ["a", "b"].forEach((weekKey) => {
    SCHEDULE_DAY_ORDER.forEach((day) => {
      const enabled = form.querySelector(`[data-schedule-enabled][data-week="${weekKey}"][data-day="${day}"]`)?.checked;
      const start = normalizeTimeValue(form.querySelector(`[data-schedule-start][data-week="${weekKey}"][data-day="${day}"]`)?.value);
      const end = normalizeTimeValue(form.querySelector(`[data-schedule-end][data-week="${weekKey}"][data-day="${day}"]`)?.value);
      weeks[weekKey][day] = enabled && start && end && timeToDecimal(end) > timeToDecimal(start)
        ? [{ start, end }]
        : [];
    });
  });

  return normalizeBaseSchedule({ mode, anchorDate, weeks });
}

function bindBaseScheduleEditor(form) {
  if (!form.querySelector("[data-base-schedule-editor]")) return;
  syncBaseScheduleMode(form);
  syncBaseScheduleRows(form);

  form.querySelector("[data-schedule-mode]")?.addEventListener("change", () => {
    syncBaseScheduleMode(form);
  });

  form.querySelectorAll("[data-schedule-enabled]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => syncBaseScheduleRow(checkbox.closest("[data-schedule-row]")));
  });

  form.querySelector("[data-copy-week-a]")?.addEventListener("click", () => {
    const mode = form.querySelector("[data-schedule-mode]");
    if (mode) mode.value = "biweekly";
    SCHEDULE_DAY_ORDER.forEach((day) => {
      const enabledA = form.querySelector(`[data-schedule-enabled][data-week="a"][data-day="${day}"]`);
      const enabledB = form.querySelector(`[data-schedule-enabled][data-week="b"][data-day="${day}"]`);
      const startA = form.querySelector(`[data-schedule-start][data-week="a"][data-day="${day}"]`);
      const startB = form.querySelector(`[data-schedule-start][data-week="b"][data-day="${day}"]`);
      const endA = form.querySelector(`[data-schedule-end][data-week="a"][data-day="${day}"]`);
      const endB = form.querySelector(`[data-schedule-end][data-week="b"][data-day="${day}"]`);
      if (enabledA && enabledB) enabledB.checked = enabledA.checked;
      if (startA && startB) startB.value = startA.value;
      if (endA && endB) endB.value = endA.value;
    });
    syncBaseScheduleMode(form);
    syncBaseScheduleRows(form);
    adminBaseScheduleEditDraft = readBaseScheduleForm(form);
  });
}

function syncBaseScheduleMode(form) {
  const isBiweekly = form.querySelector("[data-schedule-mode]")?.value === "biweekly";
  const weekB = form.querySelector('[data-schedule-week="b"]');
  const anchor = form.querySelector("[data-schedule-anchor-wrap]");
  if (weekB) weekB.hidden = !isBiweekly;
  if (anchor) anchor.hidden = !isBiweekly;
}

function syncBaseScheduleRows(form) {
  form.querySelectorAll("[data-schedule-row]").forEach(syncBaseScheduleRow);
}

function syncBaseScheduleRow(row) {
  if (!row) return;
  const enabled = row.querySelector("[data-schedule-enabled]")?.checked;
  row.classList.toggle("is-disabled", !enabled);
  row.querySelectorAll('input[type="time"]').forEach((input) => {
    input.disabled = !enabled;
  });
}

function readFichaForm(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = String(value).trim();
  });
  data.payrollRegistered = !!form.querySelector('[name="payrollRegistered"]')?.checked;
  return data;
}

function handleEmpChangeForm(event) {
  event.preventDefault();
  state.changes.push({
    id: createId(),
    locationId: activeLocationId,
    date: document.querySelector("#empChangeDate").value,
    employeeId: activeEmployeeId,
    replacementEmployeeId: "",
    reason: document.querySelector("#empChangeReason").value,
    action: "absence",
    start: document.querySelector("#empChangeStart").value,
    end: document.querySelector("#empChangeEnd").value,
    note: document.querySelector("#empChangeNote").value.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  document.querySelector("#empChangeNote").value = "";
  saveState();
  renderEmpChanges();
}

// ===========================
// FINANZAS MODULE
// ===========================

const EXPENSE_CATEGORIES = [
  { id: 'materia_prima',    label: 'Materia prima' },
  { id: 'nominas',          label: 'Nóminas' },
  { id: 'seguridad_social', label: 'Seg. Social / TGSS' },
  { id: 'alquiler',         label: 'Alquiler' },
  { id: 'suministros',      label: 'Suministros' },
  { id: 'mantenimiento',    label: 'Mantenimiento' },
  { id: 'comisiones_tpv',   label: 'Comisiones TPV' },
  { id: 'impuestos',        label: 'Impuestos' },
  { id: 'gestoria',         label: 'Gestoría / Admin' },
  { id: 'inversiones',      label: 'Inversiones' },
  { id: 'marketing',        label: 'Marketing' },
  { id: 'otros',            label: 'Otros' },
];

function expenseOverrideKeys(expense) {
  const keys = new Set();
  if (expense?.id) keys.add(String(expense.id));
  if (expense?.bistroId) keys.add(String(expense.bistroId));

  const locationId = normalizeLocationId(expense?.locationId || activeLocationId);
  const legacyId = String(expense?.bistroId || expense?.id || "");
  const legacyWithoutLocation = legacyId.replace(/^bistro-expense-(barcelona|madrid)-/, "bistro-expense-");
  if (legacyWithoutLocation) keys.add(legacyWithoutLocation);
  if (legacyWithoutLocation.startsWith("bistro-expense-")) {
    keys.add(`bistro-expense-${locationId}-${legacyWithoutLocation.slice("bistro-expense-".length)}`);
  }

  return [...keys].filter(Boolean);
}

function getExpenseCategoryOverride(expense, overrides = state?.expenseCategoryOverrides || {}) {
  if (!overrides) return null;
  for (const key of expenseOverrideKeys(expense)) {
    if (overrides[key]) return overrides[key];
  }
  return null;
}

function collectExpenseCategoryOverrides(expenses = [], overrides = {}) {
  const next = { ...(overrides || {}) };
  expenses.forEach((expense) => {
    if (expense?._source !== 'bistrosoft') return;
    const category = getExpenseCategoryOverride(expense, next) || expense.category;
    if (!category || category === 'otros') return;
    expenseOverrideKeys(expense).forEach((key) => {
      next[key] = category;
    });
  });
  return next;
}

function setExpenseCategoryOverride(expense, category) {
  state.expenseCategoryOverrides = {
    ...(state.expenseCategoryOverrides || {}),
  };
  expenseOverrideKeys(expense).forEach((key) => {
    state.expenseCategoryOverrides[key] = category;
  });
}

function applyExpenseCategoryOverride(expense, overrides = state?.expenseCategoryOverrides || {}) {
  if (expense?._source !== 'bistrosoft') return expense;
  const category = getExpenseCategoryOverride(expense, overrides);
  return category ? { ...expense, category } : expense;
}

let activeFinTab = 'hoy';
let finActiveMonth = firstDayOfMonth(new Date()); // mes propio de Finanzas (independiente de la grilla)
let finPnlYear = new Date().getFullYear();
let finPendingFile = null;   // archivo xlsx/csv seleccionado pendiente de importar
let finEditingExpenseId = null; // id del gasto en edición (null = modo creación)
let finAnalysisFilters = null;
const BISTROSOFT_SYNC_INTERVAL_MS = 30000;
const BISTROSOFT_RECENT_DAYS = 0;
let finBistroSync = {
  available: null,
  backendAvailable: null,
  connected: false,
  syncing: false,
  lastSyncAt: null,
  lastRange: null,
  lastCount: 0,
  error: null,
  historyProgress: null,
  timer: null,
};

function initFinanzas() {
  document.querySelectorAll('.fin-tab').forEach((btn) => {
    btn.addEventListener('click', () => setActiveFinTab(btn.dataset.finTab));
  });

  document.querySelector('#finPrevMonth').addEventListener('click', () => {
    finActiveMonth = new Date(finActiveMonth.getFullYear(), finActiveMonth.getMonth() - 1, 1);
    renderFinMonthNav();
    renderFinanzas();
    syncBistrosoftMonth(true);
  });
  document.querySelector('#finNextMonth').addEventListener('click', () => {
    finActiveMonth = new Date(finActiveMonth.getFullYear(), finActiveMonth.getMonth() + 1, 1);
    renderFinMonthNav();
    renderFinanzas();
    syncBistrosoftMonth(true);
  });

  document.querySelector('#finImportForm').addEventListener('submit', handleSalesCsvImport);
  document.querySelector('#finManualSaleForm').addEventListener('submit', handleManualSaleForm);
  document.querySelector('#finSyncNow').addEventListener('click', handleBistrosoftSyncClick);
  document.querySelector('#finSyncHistory').addEventListener('click', () => syncBistrosoftHistory(false));

  // File picker
  document.querySelector('#finFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    finPendingFile = file;
    document.querySelector('#finFileName').textContent = file.name;
    document.querySelector('#finFileInfo').style.display = 'flex';
  });
  document.querySelector('#finFileClear').addEventListener('click', () => {
    finPendingFile = null;
    document.querySelector('#finFileInput').value = '';
    document.querySelector('#finFileInfo').style.display = 'none';
  });

  document.querySelector('#finClearSales').addEventListener('click', () => {
    if (confirm('¿Borrar todas las ventas importadas?')) {
      state.sales = (state.sales || []).filter((sale) => !belongsToActiveLocation(sale));
      render();
    }
  });

  document.querySelector('#finExpenseForm').addEventListener('submit', handleExpenseForm);

  // Toggle fecha vencimiento cuando se marca "diferido"
  document.querySelector('#finExpDiferido').addEventListener('change', (e) => {
    document.querySelector('#finExpDueDateRow').style.display = e.target.checked ? 'block' : 'none';
    if (e.target.checked && !document.querySelector('#finExpDueDate').value) {
      // Default: 1ro del próximo mes
      const next = new Date(); next.setDate(1); next.setMonth(next.getMonth() + 1);
      document.querySelector('#finExpDueDate').value = next.toISOString().slice(0, 10);
    }
  });

  // Cancelar edición
  document.querySelector('#finExpCancelEdit').addEventListener('click', resetExpenseForm);
  document.querySelector('#finExportMonthly').addEventListener('click', exportMonthlyCsv);
  document.querySelector('#finExportPnl').addEventListener('click', exportPnlCsv);

  document.querySelector('#finPnlPrev').addEventListener('click', () => {
    finPnlYear--;
    renderFinPnl();
  });
  document.querySelector('#finPnlNext').addEventListener('click', () => {
    finPnlYear++;
    renderFinPnl();
  });

  if (appRole === 'admin') initBistrosoftSync();
}

async function handleBistrosoftSyncClick() {
  if (finBistroSync.available === false) {
    await initBistrosoftSync();
    if (finBistroSync.available === false) {
      alert(
        finBistroSync.backendAvailable
          ? 'El servidor web esta disponible, pero faltan las credenciales de Bistrosoft en la configuracion del hosting.'
          : 'Esta pestaña fue abierta sin el servidor de sincronizacion.\n\n' +
            'Para uso local, cerrala y ejecuta "ABRIR APLICACION.cmd". Para uso web, publica el backend Node incluido.'
      );
    }
    return;
  }

  await syncBistrosoftMonth(false);
}

async function initBistrosoftSync() {
  clearInterval(finBistroSync.timer);
  finBistroSync.timer = null;
  finBistroSync.available = null;
  finBistroSync.backendAvailable = null;
  finBistroSync.connected = false;
  finBistroSync.lastSyncAt = null;
  finBistroSync.lastRange = null;
  finBistroSync.lastCount = 0;
  finBistroSync.error = null;
  finBistroSync.historyProgress = null;
  renderFinSyncStatus();

  try {
    const response = await fetch(`/api/bistrosoft/status?location=${encodeURIComponent(activeLocationId)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Servidor local no disponible');

    const status = await response.json();
    finBistroSync.backendAvailable = true;
    finBistroSync.available = !!status.configured;
    finBistroSync.connected = !!status.connected;
    finBistroSync.lastSyncAt = status.lastSyncAt || null;
    finBistroSync.error = status.lastError || null;
    renderFinSyncStatus();

    if (!finBistroSync.available) return;
    await syncBistrosoftMonth(true);
    await syncBistrosoftHistory(true, true);
    await syncBistrosoftRecent();

    if (!finBistroSync.timer) {
      finBistroSync.timer = setInterval(() => syncBistrosoftRecent(), BISTROSOFT_SYNC_INTERVAL_MS);
    }
  } catch (_) {
    finBistroSync.backendAvailable = false;
    finBistroSync.available = false;
    finBistroSync.connected = false;
    finBistroSync.error = 'Cerra esta pestaña y ejecuta ABRIR APLICACION.cmd desde la carpeta de la aplicacion.';
    renderFinSyncStatus();
  }
}

function syncBistrosoftMonth(silent = true) {
  if (!finBistroSync.available) return Promise.resolve();
  const from = toDateInput(new Date(finActiveMonth.getFullYear(), finActiveMonth.getMonth(), 1));
  const until = toDateInput(new Date(finActiveMonth.getFullYear(), finActiveMonth.getMonth() + 1, 1));
  return syncBistrosoftRange(from, until, silent);
}

function syncBistrosoftTrafficMonth(silent = true) {
  if (!finBistroSync.available) return Promise.resolve();
  const from = toDateInput(new Date(trafficActiveMonth.getFullYear(), trafficActiveMonth.getMonth(), 1));
  const until = toDateInput(new Date(trafficActiveMonth.getFullYear(), trafficActiveMonth.getMonth() + 1, 1));
  return syncBistrosoftRange(from, until, silent);
}

function syncBistrosoftRecent() {
  if (!finBistroSync.available) return Promise.resolve();
  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - BISTROSOFT_RECENT_DAYS);
  const untilDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return syncBistrosoftRange(toDateInput(fromDate), toDateInput(untilDate), true);
}

async function syncBistrosoftRange(from, until, silent = true) {
  if (finBistroSync.syncing) return;

  finBistroSync.syncing = true;
  finBistroSync.error = null;
  finBistroSync.historyProgress = null;
  renderFinSyncStatus();

  try {
    const result = await fetchBistrosoftRange(from, until);
    saveState({ shared: !result.persisted });
    renderFinanzas();
  } catch (error) {
    finBistroSync.connected = false;
    finBistroSync.error = error.message || 'No se pudo sincronizar Bistrosoft.';
    if (!silent) alert(finBistroSync.error);
  } finally {
    finBistroSync.syncing = false;
    renderFinSyncStatus();
  }
}

async function fetchBistrosoftRange(from, until) {
  const query = new URLSearchParams({ from, until, location: activeLocationId });
  const response = await fetch(`/api/bistrosoft/sales?${query}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload.ok || !Array.isArray(payload.sales)) {
    throw new Error(payload.error || 'Bistrosoft no respondio correctamente');
  }

  const imported = payload.sales.filter((sale) =>
    sale && typeof sale.date === 'string' && Number.isFinite(Number(sale.total))
  ).map((sale) => ({ ...sale, locationId: activeLocationId }));
  const importedExpenses = (payload.expenses || [])
    .filter((expense) =>
      expense && typeof expense.date === 'string' && Number.isFinite(Number(expense.amount))
    )
    .map((expense) => applyExpenseCategoryOverride({ ...expense, locationId: activeLocationId }));
  state.sales = [
    ...state.sales.filter((sale) =>
      !(belongsToActiveLocation(sale) && sale._source === 'bistrosoft' && sale.date >= from && sale.date < until)
    ),
    ...imported,
  ];
  state.expenses = [
    ...state.expenses.filter((expense) =>
      !(belongsToActiveLocation(expense) && expense._source === 'bistrosoft' && expense.date >= from && expense.date < until)
    ),
    ...importedExpenses,
  ];
  finBistroSync.available = true;
  finBistroSync.connected = true;
  finBistroSync.lastSyncAt = payload.fetchedAt || new Date().toISOString();
  finBistroSync.lastRange = { from, until };
  finBistroSync.lastCount = imported.length;
  finBistroSync.error = null;
  return {
    count: imported.length,
    expenseCount: importedExpenses.length,
    persisted: !!payload.persisted,
  };
}

async function syncBistrosoftHistory(silent = false, onlyMissing = false) {
  if (finBistroSync.syncing || !finBistroSync.available) return;
  finBistroSync.syncing = true;
  finBistroSync.error = null;
  finBistroSync.historyProgress = 'Consultando meses disponibles...';
  renderFinSyncStatus();

  try {
    const response = await fetch(`/api/bistrosoft/months?location=${encodeURIComponent(activeLocationId)}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.ok || !Array.isArray(payload.months)) {
      throw new Error(payload.error || 'No se pudo consultar el historial de Bistrosoft.');
    }

    const locationSync = state.bistroSyncedMonthsByLocation?.[activeLocationId] || {};
    const legacySalesMonths = activeLocationId === DEFAULT_LOCATION_ID ? state.bistroSalesSyncedMonths || [] : [];
    const legacyExpenseMonths = activeLocationId === DEFAULT_LOCATION_ID ? state.bistroExpenseSyncedMonths || [] : [];
    const syncedSalesMonths = new Set(locationSync.sales || legacySalesMonths);
    const syncedExpenseMonths = new Set(locationSync.expenses || legacyExpenseMonths);
    const allMonths = payload.months.slice().sort();
    const months = onlyMissing
      ? allMonths.filter((month) =>
          !syncedSalesMonths.has(month) || !syncedExpenseMonths.has(month)
        )
      : allMonths;
    if (!months.length) {
      finBistroSync.historyProgress = null;
      return;
    }

    let totalImported = 0;
    let totalExpensesImported = 0;
    let allPersisted = true;
    for (let index = 0; index < months.length; index++) {
      const [year, month] = months[index].split('-').map(Number);
      const from = `${year}-${String(month).padStart(2, '0')}-01`;
      const until = toDateInput(new Date(year, month, 1));
      finBistroSync.historyProgress = `Importando ${MONTH_NAMES[month - 1]} ${year} (${index + 1}/${months.length})...`;
      renderFinSyncStatus();
      const result = await fetchBistrosoftRange(from, until);
      totalImported += result.count;
      totalExpensesImported += result.expenseCount || 0;
      allPersisted = allPersisted && result.persisted;
    }

    finBistroSync.historyProgress = null;
    saveState({ shared: !allPersisted });
    renderFinanzas();
    if (!silent) {
      const first = allMonths[0] || '';
      const last = allMonths[allMonths.length - 1] || '';
      alert(`Historial sincronizado: ${totalImported} ventas y ${totalExpensesImported} gastos · ${first} a ${last}.`);
    }
  } catch (error) {
    finBistroSync.connected = false;
    finBistroSync.error = error.message || 'No se pudo sincronizar el historial.';
    if (!silent) alert(finBistroSync.error);
  } finally {
    finBistroSync.syncing = false;
    finBistroSync.historyProgress = null;
    renderFinSyncStatus();
  }
}

function renderFinSyncStatus() {
  const bar = document.querySelector('#finBistroSync');
  const title = document.querySelector('#finSyncTitle');
  const detail = document.querySelector('#finSyncDetail');
  const button = document.querySelector('#finSyncNow');
  const historyButton = document.querySelector('#finSyncHistory');
  if (!bar || !title || !detail || !button || !historyButton) return;

  bar.classList.toggle('is-connected', finBistroSync.connected && !finBistroSync.syncing);
  bar.classList.toggle('is-syncing', finBistroSync.syncing);
  bar.classList.toggle('is-error', !!finBistroSync.error && !finBistroSync.syncing);
  button.disabled = finBistroSync.syncing;
  historyButton.disabled = finBistroSync.syncing || finBistroSync.available === false;
  button.textContent = finBistroSync.available === false ? 'Reintentar conexion' : 'Sincronizar ahora';

  if (finBistroSync.syncing) {
    title.textContent = `Sincronizando Bistrosoft ${getLocation().label}...`;
    detail.textContent = finBistroSync.historyProgress || 'Leyendo las ventas del periodo seleccionado.';
    return;
  }

  if (finBistroSync.available === false) {
    title.textContent = finBistroSync.backendAvailable
      ? 'Bistrosoft no esta configurado en el hosting'
      : 'La web se abrio sin el servidor de Bistrosoft';
    detail.textContent = finBistroSync.backendAvailable
      ? `Configura las variables Bistrosoft de ${getLocation().label} en Netlify.`
      : finBistroSync.error || 'Ejecuta ABRIR APLICACION.cmd.';
    return;
  }

  if (finBistroSync.error) {
    title.textContent = 'Bistrosoft requiere atencion';
    detail.textContent = finBistroSync.error;
    return;
  }

  if (finBistroSync.connected) {
    const syncDate = finBistroSync.lastSyncAt
      ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(finBistroSync.lastSyncAt))
      : 'pendiente';
    title.textContent = `Bistrosoft ${getLocation().label} conectado`;
    detail.textContent = `Ultima lectura: ${syncDate}${finBistroSync.lastCount ? ` · ${finBistroSync.lastCount} ventas` : ''}`;
    return;
  }

  title.textContent = 'Comprobando Bistrosoft...';
  detail.textContent = 'Preparando la sincronizacion automatica.';
}

function setActiveFinTab(tab) {
  activeFinTab = tab;
  document.querySelectorAll('.fin-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.finTab === tab);
  });
  document.querySelectorAll('.fin-panel').forEach((panel) => {
    panel.classList.toggle('is-visible', panel.dataset.finPanel === tab);
  });
  renderFinanzas();
  if (tab === 'audit') syncBistrosoftAuditToday();
}

async function syncBistrosoftAuditToday() {
  if (!finBistroSync.available) return;
  const today = toDateInput(new Date());
  const until = toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1));
  try {
    const payloads = await Promise.all(['barcelona', 'madrid'].map(async (locationId) => {
      const query = new URLSearchParams({ from: today, until, location: locationId });
      const response = await fetch(`/api/bistrosoft/sales?${query}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !Array.isArray(payload.sales)) throw new Error(payload.error || 'Bistrosoft no respondio correctamente');
      return { locationId, payload };
    }));

    payloads.forEach(({ locationId, payload }) => {
      const imported = payload.sales.map((sale) => ({ ...sale, locationId }));
      state.sales = [
        ...state.sales.filter((sale) => !(normalizeLocationId(sale.locationId) === locationId && sale._source === 'bistrosoft' && sale.date === today)),
        ...imported,
      ];
      const importedExpenses = (payload.expenses || []).map((expense) => applyExpenseCategoryOverride({ ...expense, locationId }));
      state.expenses = [
        ...state.expenses.filter((expense) => !(normalizeLocationId(expense.locationId) === locationId && expense._source === 'bistrosoft' && expense.date === today)),
        ...importedExpenses,
      ];
    });
    if (activeFinTab === 'audit') renderFinAudit();
  } catch (_) {
    // La auditoria conserva los ultimos datos disponibles si una sucursal no responde.
  }
}

function renderFinMonthNav() {
  const nav = document.querySelector('#finMonthNav');
  const projection = document.querySelector('#finTodayProjection');
  const isTodayTab = activeFinTab === 'hoy';
  if (nav) nav.hidden = isTodayTab;
  if (projection) {
    projection.hidden = !isTodayTab;
    if (isTodayTab) renderFinTodayProjection();
  }
  const el = document.querySelector('#finMonthDisplay');
  if (el) el.textContent = `${MONTH_NAMES[finActiveMonth.getMonth()]} ${finActiveMonth.getFullYear()}`;
}

function renderFinanzas() {
  if (!document.querySelector('#finKpiGrid')) return;
  renderFinSyncStatus();
  renderFinMonthNav();
  if (activeFinTab === 'hoy') renderFinHoy();
  else if (activeFinTab === 'resumen') renderFinResumen();
  else if (activeFinTab === 'import') renderFinImport();
  else if (activeFinTab === 'expenses') renderFinExpenses();
  else if (activeFinTab === 'waste') renderFinWaste();
  else if (activeFinTab === 'diferidos') renderFinDiferidos();
  else if (activeFinTab === 'monthly') renderFinMonthly();
  else if (activeFinTab === 'pnl') renderFinPnl();
  else if (activeFinTab === 'presupuesto') renderFinPresupuesto();
  else if (activeFinTab === 'audit') renderFinAudit();
  else if (activeFinTab === 'analysis') renderFinAnalysis();
}

// -------- HOY --------

function getMonthSalesProjection(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const from = toDateInput(new Date(year, month, 1));
  const until = toDateInput(referenceDate);
  const elapsedDays = referenceDate.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const soldToDate = getLocationSales()
    .filter((sale) => sale.date >= from && sale.date <= until)
    .reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const dailyAverage = elapsedDays > 0 ? soldToDate / elapsedDays : 0;
  return {
    soldToDate,
    dailyAverage,
    daysInMonth,
    projected: dailyAverage * daysInMonth,
  };
}

function renderFinTodayProjection() {
  const container = document.querySelector('#finTodayProjection');
  if (!container) return;
  const projection = getMonthSalesProjection(new Date());
  container.innerHTML = `
    <span>Proyección venta mes</span>
    <strong>${projection.projected > 0 ? formatEur(projection.projected) : '—'}</strong>
    <small>${formatEur(projection.soldToDate)} acumulado · prom. diario ${formatEur(projection.dailyAverage)} × ${projection.daysInMonth} días</small>
  `;
}

function renderFinHoy() {
  const today = toDateInput(new Date());
  const m = calcDayMetrics(today);
  const hasData = m.totalSales > 0 || m.totalExpenses > 0;
  const resultClass = m.result >= 0 ? 'fin-kpi-positive' : 'fin-kpi-negative';
  const resultStr = hasData ? (m.result >= 0 ? '+' : '') + formatEur(m.result) : '—';

  document.querySelector('#finKpiGrid').innerHTML = `
    <div class="fin-kpi-card">
      <span>Ventas hoy</span>
      <strong>${m.totalSales > 0 ? formatEur(m.totalSales) : '—'}</strong>
    </div>
    <div class="fin-kpi-card">
      <span>N° tickets</span>
      <strong>${m.ticketCount || '—'}</strong>
    </div>
    <div class="fin-kpi-card">
      <span>Ticket promedio</span>
      <strong>${m.ticketCount ? formatEur(m.avgTicket) : '—'}</strong>
    </div>
    <div class="fin-kpi-card">
      <span>Gastos hoy</span>
      <strong class="fin-kpi-negative">${m.totalExpenses > 0 ? formatEur(m.totalExpenses) : '—'}</strong>
    </div>
    <div class="fin-kpi-card">
      <span>Resultado hoy</span>
      <strong class="${resultClass}">${resultStr}</strong>
    </div>
  `;

  const topProductsEl = document.querySelector('#finTopProducts');
  if (!m.topItems.length) {
    topProductsEl.innerHTML = '<div class="empty-state">Sin datos de artículos hoy. Importar CSV con detalle de productos.</div>';
  } else {
    const max = m.topItems[0][1];
    topProductsEl.innerHTML = m.topItems.map(([name, qty]) => `
      <div class="fin-bar-item">
        <div class="fin-bar-label">${escapeHtml(name)}</div>
        <div class="fin-bar-track"><div class="fin-bar-fill" style="width:${Math.round((qty / max) * 100)}%"></div></div>
        <div class="fin-bar-value">${qty}</div>
      </div>
    `).join('');
  }

  const crossEl = document.querySelector('#finCrossSelling');
  if (!m.topPairs.length) {
    crossEl.innerHTML = '<div class="empty-state">Sin pares detectados. Se necesita CSV con artículos por ticket.</div>';
  } else {
    const maxPair = m.topPairs[0][1];
    crossEl.innerHTML = m.topPairs.map(([pair, count]) => `
      <div class="fin-bar-item">
        <div class="fin-bar-label" style="font-size:0.8rem">${escapeHtml(pair)}</div>
        <div class="fin-bar-track"><div class="fin-bar-fill" style="width:${Math.round((count / maxPair) * 100)}%;background:var(--coffee)"></div></div>
        <div class="fin-bar-value">${count}x</div>
      </div>
    `).join('');
  }
}

// -------- IMPORT --------

function renderFinImport() {
  const byDate = groupSalesByDate();
  const dates = Object.keys(byDate).sort().reverse();
  const totalTicketCount = getLocationSales().reduce((s, t) => s + (t.count || 1), 0);
  document.querySelector('#finSalesSummary').textContent = `${totalTicketCount} tickets`;

  const list = document.querySelector('#finSalesList');
  if (!dates.length) {
    renderEmpty(list);
    return;
  }

  list.innerHTML = dates.map((date) => {
    const daySales = byDate[date];
    const dayTotal  = daySales.reduce((s, t) => s + t.total, 0);
    const dayCount  = daySales.reduce((s, t) => s + (t.count || 1), 0);
    const isSummary = daySales.some((t) => t._isSummary);
    const isBistrosoft = daySales.some((t) => t._source === 'bistrosoft');
    const hasManual = daySales.some((t) => t._source === 'manual');
    const sourceLabel = [
      isBistrosoft ? 'Bistrosoft' : '',
      hasManual ? 'manual' : '',
      !isBistrosoft && !hasManual && isSummary ? 'resumen diario' : '',
    ].filter(Boolean).join(' + ');
    return `
      <article class="event-item">
        <div class="event-topline">
          <span>${formatHumanDate(date)}${sourceLabel ? ` <span style="font-size:0.72rem;color:var(--muted)">(${sourceLabel})</span>` : ''}</span>
          <span class="status-pill status-approved">${formatEur(dayTotal)}</span>
        </div>
        <div class="event-meta">${dayCount} tickets · ticket prom. ${formatEur(dayTotal / dayCount)}</div>
        <div class="event-actions">
          <button class="mini-button danger" type="button" data-delete-day="${date}">Borrar día</button>
        </div>
      </article>
    `;
  }).join('');

  list.querySelectorAll('[data-delete-day]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sales = state.sales.filter((s) => !(belongsToActiveLocation(s) && s.date === btn.dataset.deleteDay));
      render();
    });
  });
}

// -------- EXPENSES --------

function renderFinExpenses() {
  const monthKey = monthInputValue(finActiveMonth);
  const expenses = getLocationExpenses()
    .filter((expense) => expense.date.startsWith(monthKey))
    .slice()
    .sort((a, b) =>
      b.date.localeCompare(a.date)
      || String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );
  const monthTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  document.querySelector('#finExpListTitle').textContent =
    `Gastos de ${MONTH_NAMES[finActiveMonth.getMonth()]} ${finActiveMonth.getFullYear()}`;
  document.querySelector('#finExpSummary').textContent =
    `${expenses.length} movimientos · ${formatEur(monthTotal)}`;

  const list = document.querySelector('#finExpenseList');
  if (!expenses.length) {
    list.innerHTML = '<div class="empty-state">No hay gastos registrados en este mes.</div>';
    return;
  }

  const isAdmin = typeof appRole !== 'undefined' && appRole === 'admin';

  list.innerHTML = expenses.map((exp) => {
    const catLabel = EXPENSE_CATEGORIES.find((c) => c.id === exp.category)?.label || exp.category;
    const hasCategoryOverride = exp._source === 'bistrosoft'
      && !!getExpenseCategoryOverride(exp);
    const bistroBadge = exp._source === 'bistrosoft'
      ? `<span class="fin-tc-badge">Bistrosoft${exp.enteredBy ? ` · ${escapeHtml(exp.enteredBy)}` : ''}</span>
         ${hasCategoryOverride ? '<span class="fin-local-category-badge">Categoría personalizada</span>' : ''}`
      : '';
    const tcBadge = exp.isDiferido ? `<span class="fin-tc-badge">TC · vence ${formatHumanDate(exp.dueDate)}</span>` : '';
    return `
      <article class="event-item${exp.isDiferido ? ' fin-item-tc' : ''}">
        <div class="event-topline">
          <span>${catLabel}${exp.supplier ? ' · ' + escapeHtml(exp.supplier) : ''}${tcBadge}${bistroBadge}</span>
          <span class="status-pill status-rejected">${formatEur(exp.amount)}</span>
        </div>
        <div class="event-meta">${formatHumanDate(exp.date)}${exp.description ? ' · ' + escapeHtml(exp.description) : ''}</div>
        <div class="event-actions">
          ${isAdmin ? exp._source === 'bistrosoft'
            ? `<button class="mini-button" type="button" data-edit-expense="${exp.id}">Editar categoría</button>`
            : `<button class="mini-button" type="button" data-edit-expense="${exp.id}">Editar</button>
               <button class="mini-button danger" type="button" data-delete-expense="${exp.id}">Borrar</button>`
          : ''}
        </div>
      </article>
    `;
  }).join('');

  list.querySelectorAll('[data-delete-expense]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('¿Borrar este gasto?')) return;
      state.expenses = state.expenses.filter((e) => e.id !== btn.dataset.deleteExpense);
      render();
    });
  });

  list.querySelectorAll('[data-edit-expense]').forEach((btn) => {
    btn.addEventListener('click', () => startEditExpense(btn.dataset.editExpense));
  });
}

function renderFinWaste() {
  const container = document.querySelector('#finWasteTable');
  if (!container) return;
  const monthKey = monthInputValue(finActiveMonth);
  const records = getLocationWasteRecords()
    .filter((record) => record.date.startsWith(monthKey))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.submittedAt.localeCompare(b.submittedAt));
  const fixedProducts = [
    "Medialunas",
    "Pan de Queso",
    "Budín Limón",
    "Budín Banana",
    "Budín Carrot",
    "Cookies",
  ];
  document.querySelector('#finWasteMonthLabel').textContent =
    `Mermas · ${MONTH_NAMES[finActiveMonth.getMonth()]} ${finActiveMonth.getFullYear()}`;

  if (!records.length) {
    container.innerHTML = '<div class="empty-state">Sin mermas registradas en este mes.</div>';
    return;
  }

  const totals = Object.fromEntries(fixedProducts.map((product) => [product, 0]));
  let customTotal = 0;
  const rows = records.map((record) => {
    const quantities = Object.fromEntries(fixedProducts.map((product) => [product, 0]));
    const customItems = [];
    (record.items || []).forEach((item) => {
      if (fixedProducts.includes(item.product)) quantities[item.product] += Number(item.quantity || 0);
      else if (Number(item.quantity || 0) > 0) customItems.push(`${escapeHtml(item.product)}: ${Number(item.quantity)}`);
    });
    fixedProducts.forEach((product) => { totals[product] += quantities[product]; });
    customTotal += (record.items || [])
      .filter((item) => !fixedProducts.includes(item.product))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const rowTotal = (record.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    return `<tr>
      <td>${formatHumanDate(record.date)}</td>
      <td>${escapeHtml(getEmployee(record.employeeId, record.date).label)}</td>
      ${fixedProducts.map((product) => `<td class="fin-cell-num">${quantities[product] || '—'}</td>`).join('')}
      <td>${customItems.join('<br>') || '—'}</td>
      <td class="fin-cell-num"><strong>${rowTotal}</strong></td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="fin-table waste-report-table">
      <thead><tr>
        <th>Fecha</th><th>Empleado</th>
        ${fixedProducts.map((product) => `<th class="fin-cell-num">${product}</th>`).join('')}
        <th>Otro</th><th class="fin-cell-num">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="fin-total-row">
        <td colspan="2">Total mes</td>
        ${fixedProducts.map((product) => `<td class="fin-cell-num">${totals[product] || '—'}</td>`).join('')}
        <td class="fin-cell-num">${customTotal || '—'}</td>
        <td class="fin-cell-num">${Object.values(totals).reduce((sum, value) => sum + value, 0) + customTotal}</td>
      </tr></tfoot>
    </table>`;
}

function startEditExpense(id) {
  const exp = state.expenses.find((e) => e.id === id);
  if (!exp) return;
  finEditingExpenseId = id;
  const isBistrosoft = exp._source === 'bistrosoft';

  document.querySelector('#finExpEditId').value = id;
  document.querySelector('#finExpDate').value = exp.date;
  document.querySelector('#finExpAmount').value = exp.amount;
  document.querySelector('#finExpCategory').value = exp.category || 'otros';
  document.querySelector('#finExpSupplier').value = exp.supplier || '';
  document.querySelector('#finExpDesc').value = exp.description || '';

  const isDif = !!exp.isDiferido;
  document.querySelector('#finExpDiferido').checked = isDif;
  document.querySelector('#finExpDueDateRow').style.display = isDif ? 'block' : 'none';
  document.querySelector('#finExpDueDate').value = exp.dueDate || '';

  ['finExpDate', 'finExpAmount', 'finExpSupplier', 'finExpDesc', 'finExpDiferido', 'finExpDueDate']
    .forEach((fieldId) => {
      document.querySelector(`#${fieldId}`).disabled = isBistrosoft;
    });
  document.querySelector('#finExpenseForm').classList.toggle('is-bistro-category-edit', isBistrosoft);
  document.querySelector('#finExpEditNote').hidden = !isBistrosoft;
  document.querySelector('#finExpFormTitle').textContent =
    isBistrosoft ? 'Clasificar gasto Bistrosoft' : 'Editar gasto';
  document.querySelector('#finExpSubmitBtn').textContent =
    isBistrosoft ? 'Guardar categoría' : 'Guardar cambios';
  document.querySelector('#finExpCancelEdit').style.display = '';

  // Scroll al formulario
  document.querySelector('#finExpenseForm').scrollIntoView({ behavior: 'smooth' });
}

function resetExpenseForm() {
  finEditingExpenseId = null;
  ['finExpDate', 'finExpAmount', 'finExpSupplier', 'finExpDesc', 'finExpDiferido', 'finExpDueDate']
    .forEach((fieldId) => {
      document.querySelector(`#${fieldId}`).disabled = false;
    });
  document.querySelector('#finExpenseForm').classList.remove('is-bistro-category-edit');
  document.querySelector('#finExpEditNote').hidden = true;
  document.querySelector('#finExpEditId').value = '';
  document.querySelector('#finExpenseForm').reset();
  document.querySelector('#finExpDueDateRow').style.display = 'none';
  document.querySelector('#finExpFormTitle').textContent = 'Registrar gasto';
  document.querySelector('#finExpSubmitBtn').textContent = 'Guardar gasto';
  document.querySelector('#finExpCancelEdit').style.display = 'none';
  // Restaurar fecha de hoy
  document.querySelector('#finExpDate').value = document.querySelector('#finExpDate').dataset.today || new Date().toISOString().slice(0,10);
}

// -------- DIFERIDOS TC --------

function renderFinDiferidos() {
  const container = document.querySelector('#finDiferidosList');
  const summaryEl = document.querySelector('#finDiferidosSummary');
  const diferidos = getLocationExpenses()
    .filter((e) => e.isDiferido)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  if (!diferidos.length) {
    container.innerHTML = '<p class="fin-row-empty" style="padding:40px 0;text-align:center">No hay gastos diferidos registrados.<br>Marcá "Pago diferido (TC)" al cargar un gasto desde la pestaña Gastos.</p>';
    summaryEl.textContent = '';
    return;
  }

  // Agrupar por dueDate
  const groups = {};
  diferidos.forEach((e) => {
    const key = e.dueDate || 'sin-fecha';
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const pending = Object.entries(groups).filter(([k]) => {
    if (k === 'sin-fecha') return true;
    return k >= new Date().toISOString().slice(0, 10);
  });
  const paid = Object.entries(groups).filter(([k]) => k !== 'sin-fecha' && k < new Date().toISOString().slice(0, 10));

  const totalPending = pending.flatMap(([,v]) => v).reduce((s, e) => s + e.amount, 0);
  summaryEl.textContent = `${pending.length} vencimiento${pending.length !== 1 ? 's' : ''} pendiente${pending.length !== 1 ? 's' : ''} · ${formatEur(totalPending)} por pagar`;

  const renderGroup = ([dueKey, items], isPast) => {
    const total = items.reduce((s, e) => s + e.amount, 0);
    const label = dueKey === 'sin-fecha' ? 'Sin fecha de vencimiento'
      : `Vence ${formatHumanDate(dueKey)}`;
    const isAdmin = typeof appRole !== 'undefined' && appRole === 'admin';

    const rows = items.map((exp) => {
      const catLabel = EXPENSE_CATEGORIES.find((c) => c.id === exp.category)?.label || exp.category;
      return `
        <div class="fin-defer-row">
          <span class="fin-defer-cat">${catLabel}</span>
          <span class="fin-defer-desc">${escapeHtml(exp.supplier || '')}${exp.description ? ' — ' + escapeHtml(exp.description) : ''}</span>
          <span class="fin-defer-date">${formatHumanDate(exp.date)}</span>
          <span class="fin-defer-amount">${formatEur(exp.amount)}</span>
          <span class="fin-defer-actions">
            ${isAdmin ? `<button class="mini-button" data-edit-expense="${exp.id}">Editar</button>` : ''}
            <button class="mini-button danger" data-delete-expense="${exp.id}">Borrar</button>
          </span>
        </div>`;
    }).join('');

    return `
      <div class="fin-defer-group${isPast ? ' fin-defer-past' : ''}">
        <div class="fin-defer-header">
          <span class="fin-defer-label">${isPast ? '✓ ' : '📋 '}${label}</span>
          <span class="fin-defer-total">${formatEur(total)}</span>
          ${!isPast && isAdmin ? `<button class="ghost-button fin-defer-pay-btn" data-paygroup="${dueKey}">Marcar como pagado</button>` : ''}
        </div>
        ${rows}
      </div>`;
  };

  let html = '';
  if (pending.length) html += pending.map((g) => renderGroup(g, false)).join('');
  if (paid.length) {
    html += `<details class="fin-defer-past-section"><summary>Vencidos / pagados (${paid.length})</summary>${paid.map((g) => renderGroup(g, true)).join('')}</details>`;
  }

  container.innerHTML = html;

  // Listeners
  container.querySelectorAll('[data-delete-expense]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('¿Borrar este gasto diferido?')) return;
      state.expenses = state.expenses.filter((e) => e.id !== btn.dataset.deleteExpense);
      render();
    });
  });
  container.querySelectorAll('[data-edit-expense]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveFinTab('expenses');
      startEditExpense(btn.dataset.editExpense);
    });
  });
  container.querySelectorAll('[data-paygroup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.paygroup;
      if (!confirm(`¿Marcar todos los gastos de "${key}" como pagados (mover a vencidos)?`)) return;
      // Cambiar la dueDate a ayer para que quede en "pagados"
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      state.expenses = state.expenses.map((e) =>
        belongsToActiveLocation(e) && e.isDiferido && e.dueDate === key ? { ...e, dueDate: yStr } : e
      );
      render();
    });
  });
}

// -------- MENSUAL --------

function renderFinMonthly() {
  const year = finActiveMonth.getFullYear();
  const month = finActiveMonth.getMonth();
  document.querySelector('#finMonthLabel').textContent = `${MONTH_NAMES[month]} ${year}`;

  const days = getMonthDays(finActiveMonth);
  let totSales = 0, totTickets = 0, totExp = 0;

  const rows = days.map((date) => {
    const dateKey = toDateInput(date);
    const m = calcDayMetrics(dateKey);
    totSales += m.totalSales;
    totTickets += m.ticketCount;
    totExp += m.totalExpenses;
    const result = m.totalSales - m.totalExpenses;
    const hasData = m.totalSales > 0 || m.totalExpenses > 0;
    const rClass = result > 0 ? 'fin-cell-positive' : result < 0 ? 'fin-cell-negative' : '';
    return `<tr${!hasData ? ' class="fin-row-empty"' : ''}>
      <td>${formatHumanDate(dateKey)}</td>
      <td class="fin-cell-num">${m.totalSales > 0 ? formatEur(m.totalSales) : '—'}</td>
      <td class="fin-cell-num">${m.ticketCount || '—'}</td>
      <td class="fin-cell-num">${m.ticketCount ? formatEur(m.avgTicket) : '—'}</td>
      <td class="fin-cell-num">${m.totalExpenses > 0 ? formatEur(m.totalExpenses) : '—'}</td>
      <td class="fin-cell-num ${rClass}">${hasData ? (result >= 0 ? '+' : '') + formatEur(result) : '—'}</td>
    </tr>`;
  }).join('');

  const totResult = totSales - totExp;
  const totRClass = totResult >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';

  document.querySelector('#finMonthlyTable').innerHTML = `
    <table class="fin-table">
      <thead><tr>
        <th>Fecha</th>
        <th class="fin-cell-num">Ventas</th>
        <th class="fin-cell-num">Tickets</th>
        <th class="fin-cell-num">Ticket prom.</th>
        <th class="fin-cell-num">Gastos</th>
        <th class="fin-cell-num">Resultado</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="fin-total-row">
        <td>Total ${MONTH_NAMES[month]}</td>
        <td class="fin-cell-num">${formatEur(totSales)}</td>
        <td class="fin-cell-num">${totTickets}</td>
        <td class="fin-cell-num">${totTickets ? formatEur(totSales / totTickets) : '—'}</td>
        <td class="fin-cell-num">${formatEur(totExp)}</td>
        <td class="fin-cell-num ${totRClass}">${(totResult >= 0 ? '+' : '') + formatEur(totResult)}</td>
      </tr></tfoot>
    </table>
  `;

  // ── Resumen por concepto ──
  const monthKey = monthInputValue(finActiveMonth);
  const budget   = getLocationBudgets()[monthKey] || {};
  const monthExp = getLocationExpenses().filter((e) => e.date.startsWith(monthKey));

  // totales reales por categoría
  const catTotals = {};
  EXPENSE_CATEGORIES.forEach((c) => { catTotals[c.id] = 0; });
  monthExp.forEach((e) => { if (catTotals[e.category] !== undefined) catTotals[e.category] += e.amount; });

  // nº de movimientos por categoría
  const catCounts = {};
  EXPENSE_CATEGORIES.forEach((c) => { catCounts[c.id] = 0; });
  monthExp.forEach((e) => { if (catCounts[e.category] !== undefined) catCounts[e.category]++; });

  const totalExpCat = Object.values(catTotals).reduce((s, v) => s + v, 0);
  const hasBudget   = EXPENSE_CATEGORIES.some((c) => budget[c.id] > 0);
  const resultado   = totSales - totalExpCat;
  const resClass    = resultado >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';

  const catRows = EXPENSE_CATEGORIES.map((cat) => {
    const real     = catTotals[cat.id] || 0;
    const bgt      = budget[cat.id]    || 0;
    const pct      = totalExpCat > 0 ? (real / totalExpCat) * 100 : 0;
    const execPct  = bgt > 0 ? Math.min((real / bgt) * 100, 120) : 0;
    const over     = bgt > 0 && real > bgt;
    const diff     = bgt > 0 ? real - bgt : null;

    return `
      <tr>
        <td class="cat-break-name">${cat.label}</td>
        <td class="fin-cell-num cat-break-amount">${real > 0 ? formatEur(real) : '—'}</td>
        <td class="cat-break-count">${catCounts[cat.id] > 0 ? catCounts[cat.id] + ' mov.' : '—'}</td>
        <td class="cat-break-bar-cell">
          <div class="cat-break-bar-wrap">
            <div class="cat-break-bar" style="width:${pct.toFixed(1)}%"></div>
          </div>
          <span class="cat-break-pct">${pct > 0 ? pct.toFixed(0) + '%' : ''}</span>
        </td>
        ${hasBudget ? `
        <td class="fin-cell-num cat-break-budget">${bgt > 0 ? formatEur(bgt) : '—'}</td>
        <td class="fin-cell-num ${over ? 'fin-cell-negative' : (diff !== null && diff < 0 ? 'fin-cell-positive' : '')}">${diff !== null ? (diff >= 0 ? '+' : '') + formatEur(diff) : '—'}</td>
        <td class="cat-break-exec-cell">
          ${bgt > 0 ? `
            <div class="budget-exec-bar-wrap">
              <div class="budget-exec-bar${over ? ' over' : ''}" style="width:${execPct.toFixed(0)}%"></div>
            </div>
            <span class="cat-break-pct">${(real / bgt * 100).toFixed(0)}%</span>
          ` : '—'}
        </td>` : ''}
      </tr>
    `;
  }).join('');

  const budgetHdrs = hasBudget
    ? `<th class="fin-cell-num" style="color:var(--muted)">Presupuesto</th>
       <th class="fin-cell-num" style="color:var(--muted)">Diferencia</th>
       <th style="color:var(--muted)">Ejecución</th>`
    : '';

  const budgetSalesRow = hasBudget && budget.ventas > 0 ? `
    <tr class="budget-sales-row">
      <td colspan="4">🎯 Meta de ventas</td>
      <td class="fin-cell-num">${formatEur(budget.ventas)}</td>
      <td class="fin-cell-num ${totSales >= budget.ventas ? 'fin-cell-positive' : 'fin-cell-negative'}">
        ${totSales > 0 ? (totSales >= budget.ventas ? '+' : '') + formatEur(totSales - budget.ventas) : '—'}
      </td>
      <td class="cat-break-exec-cell">
        ${totSales > 0 ? `
          <div class="budget-exec-bar-wrap">
            <div class="budget-exec-bar" style="width:${Math.min(totSales/budget.ventas*100,120).toFixed(0)}%;background:var(--blue)"></div>
          </div>
          <span class="cat-break-pct">${(totSales/budget.ventas*100).toFixed(0)}%</span>
        ` : '—'}
      </td>
    </tr>` : '';

  document.querySelector('#finMonthlyCatBreakdown').innerHTML = `
    <div class="cat-break-header">
      <span class="cat-break-title">Gastos por concepto · ${MONTH_NAMES[month]} ${year}</span>
      <span class="cat-break-total-label">Total gastos: <strong>${formatEur(totalExpCat)}</strong>
        &nbsp;·&nbsp; Ventas: <strong>${formatEur(totSales)}</strong>
        &nbsp;·&nbsp; Resultado: <strong class="${resClass}">${(resultado >= 0 ? '+' : '') + formatEur(resultado)}</strong>
      </span>
    </div>
    <div style="overflow-x:auto">
      <table class="fin-table cat-break-table">
        <thead><tr>
          <th>Concepto</th>
          <th class="fin-cell-num">Real</th>
          <th>Mov.</th>
          <th>% del total</th>
          ${budgetHdrs}
        </tr></thead>
        <tbody>${catRows}</tbody>
        <tfoot>
          ${budgetSalesRow}
          <tr class="fin-total-row">
            <td>Total gastos</td>
            <td class="fin-cell-num">${formatEur(totalExpCat)}</td>
            <td class="cat-break-count">${monthExp.length} mov.</td>
            <td></td>
            ${hasBudget ? `
              <td class="fin-cell-num">${Object.values(budget).filter((v,i) => EXPENSE_CATEGORIES[i]).reduce((s,v)=>s+(v||0),0) > 0
                ? formatEur(EXPENSE_CATEGORIES.reduce((s,c) => s + (budget[c.id]||0), 0)) : '—'}</td>
              <td></td><td></td>` : ''}
          </tr>
        </tfoot>
      </table>
    </div>
  `;
  appendMonthlyResultSummary(totSales, totalExpCat, resultado, resClass);
}

// El resumen final se agrega al pie del desglose mensual.
function appendMonthlyResultSummary(totSales, totalExpenses, result, resultClass) {
  const container = document.querySelector('#finMonthlyCatBreakdown');
  if (!container) return;
  container.insertAdjacentHTML('beforeend', `
    <div class="monthly-result-summary">
      <div><span>Ventas</span><strong>${formatEur(totSales)}</strong></div>
      <div><span>Total gastos</span><strong>${formatEur(totalExpenses)}</strong></div>
      <div><span>Resultado del mes</span><strong class="${resultClass}">${result >= 0 ? '+' : ''}${formatEur(result)}</strong></div>
    </div>`);
}

// -------- P&L --------

function renderFinPnl() {
  document.querySelector('#finPnlYear').textContent = finPnlYear;
  const catIds = EXPENSE_CATEGORIES.map((c) => c.id);
  const locationSales = getLocationSales();
  const locationExpenses = getLocationExpenses();
  const yearTotByCat = {};
  catIds.forEach((id) => { yearTotByCat[id] = 0; });
  let yearTotSales = 0, yearTotExp = 0;

  const rows = MONTH_NAMES.map((monthName, mi) => {
    const monthKey = `${finPnlYear}-${String(mi + 1).padStart(2, '0')}`;
    const mSales = locationSales.filter((s) => s.date.startsWith(monthKey)).reduce((s, t) => s + t.total, 0);
    const byCat = {};
    catIds.forEach((id) => { byCat[id] = 0; });
    // Para gastos diferidos TC usar dueDate; para el resto usar date
    locationExpenses.filter((e) => {
      const effectiveDate = (e.isDiferido && e.dueDate) ? e.dueDate : e.date;
      return effectiveDate.startsWith(monthKey);
    }).forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });
    const mExp = catIds.reduce((s, id) => s + byCat[id], 0);
    const mResult = mSales - mExp;
    yearTotSales += mSales;
    yearTotExp += mExp;
    catIds.forEach((id) => { yearTotByCat[id] += byCat[id]; });
    const hasData = mSales > 0 || mExp > 0;
    const rClass = mResult > 0 ? 'fin-cell-positive' : mResult < 0 ? 'fin-cell-negative' : '';
    return `<tr${!hasData ? ' class="fin-row-empty"' : ''}>
      <td>${monthName}</td>
      <td class="fin-cell-num">${mSales > 0 ? formatEur(mSales) : '—'}</td>
      ${catIds.map((id) => `<td class="fin-cell-num">${byCat[id] > 0 ? formatEur(byCat[id]) : '—'}</td>`).join('')}
      <td class="fin-cell-num">${mExp > 0 ? formatEur(mExp) : '—'}</td>
      <td class="fin-cell-num ${rClass}">${hasData ? (mResult >= 0 ? '+' : '') + formatEur(mResult) : '—'}</td>
    </tr>`;
  }).join('');

  const yearResult = yearTotSales - yearTotExp;
  const yearRClass = yearResult >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';

  document.querySelector('#finPnlTable').innerHTML = `
    <table class="fin-table">
      <thead><tr>
        <th>Mes</th>
        <th class="fin-cell-num">Ventas</th>
        ${EXPENSE_CATEGORIES.map((c) => `<th class="fin-cell-num" style="font-size:0.76rem">${c.label}</th>`).join('')}
        <th class="fin-cell-num">Total gastos</th>
        <th class="fin-cell-num">Resultado</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="fin-total-row">
        <td>Total ${finPnlYear}</td>
        <td class="fin-cell-num">${formatEur(yearTotSales)}</td>
        ${catIds.map((id) => `<td class="fin-cell-num">${yearTotByCat[id] > 0 ? formatEur(yearTotByCat[id]) : '—'}</td>`).join('')}
        <td class="fin-cell-num">${formatEur(yearTotExp)}</td>
        <td class="fin-cell-num ${yearRClass}">${(yearResult >= 0 ? '+' : '') + formatEur(yearResult)}</td>
      </tr></tfoot>
    </table>
  `;
}

// -------- HANDLERS --------

function handleManualSaleForm(event) {
  event.preventDefault();
  const date = document.querySelector('#finManualSaleDate').value;
  const count = Math.max(1, Math.round(Number(document.querySelector('#finManualSaleCount').value || 0)));
  const total = Number(document.querySelector('#finManualSaleTotal').value || 0);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    alert('Elegí una fecha válida.');
    return;
  }
  if (!Number.isFinite(count) || count < 1) {
    alert('La cantidad de tickets debe ser al menos 1.');
    return;
  }
  if (!Number.isFinite(total) || total <= 0) {
    alert('El total vendido debe ser mayor a 0.');
    return;
  }

  state.sales.push({
    id: `manual-sale-${activeLocationId}-${date}-${Date.now()}`,
    locationId: activeLocationId,
    date,
    time: '',
    ticketNumber: `manual-${date}`,
    total,
    count,
    items: [],
    paymentMethod: 'Manual',
    _source: 'manual',
    _isSummary: true,
    createdAt: new Date().toISOString(),
  });

  document.querySelector('#finManualSaleCount').value = '';
  document.querySelector('#finManualSaleTotal').value = '';
  render();
  alert(`Venta manual agregada: ${count} ticket${count !== 1 ? 's' : ''} · ${formatEur(total)}.`);
}

async function handleSalesCsvImport(event) {
  event.preventDefault();
  if (!finPendingFile) {
    alert('Primero seleccioná un archivo Excel (.xlsx) o CSV desde el botón "Seleccionar archivo".');
    return;
  }

  let parseResult;
  try {
    parseResult = await parseSalesFile(finPendingFile);
  } catch (err) {
    alert('No se pudo leer el archivo: ' + err.message);
    return;
  }

  const { tickets: imported, debugInfo } = parseResult;
  if (!imported.length) {
    alert(
      'No se pudo interpretar el archivo.\n\n' +
      '🔍 Diagnóstico:\n' + JSON.stringify(debugInfo, null, 2) + '\n\n' +
      'Mandá este mensaje para ajustar el parser.'
    );
    return;
  }

  const dates = [...new Set(imported.map((t) => t.date))].sort();
  const taggedImported = imported.map((ticket) => ({ ...ticket, locationId: activeLocationId }));
  state.sales = [
    ...state.sales.filter((s) => !(belongsToActiveLocation(s) && dates.includes(s.date))),
    ...taggedImported,
  ];

  finPendingFile = null;
  document.querySelector('#finFileInput').value = '';
  document.querySelector('#finFileInfo').style.display = 'none';

  render();
  const importedTickets = imported.reduce((s, t) => s + (t.count || 1), 0);
  alert(`✓ ${importedTickets} tickets importados (${dates.length} día${dates.length > 1 ? 's' : ''}: ${dates[0]}${dates.length > 1 ? ' → ' + dates[dates.length - 1] : ''})`);
}

/** Enrutador: elige parser según extensión del archivo */
async function parseSalesFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXlsxSalesFile(file);
  }
  const text = await file.text();
  return parseBistrosoftCsv(text);
}

/** Parser XLSX: lee filas nativas con SheetJS (cellDates:true → Date objects reales).
 *  Evita toda conversión a CSV y sus problemas de formato de fecha. */
async function parseXlsxSalesFile(file) {
  if (!window.XLSX) throw new Error('Librería Excel (SheetJS) no cargada. Verificar conexión a internet.');
  const buffer = await file.arrayBuffer();
  const wb = window.XLSX.read(buffer, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  // Obtener filas como arrays de valores nativos (Date para fechas, number para números)
  const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  return parseBistrosoftRowsXlsx(rows);
}

/** Convierte un valor de celda de Excel a string YYYY-MM-DD */
function xlsxDateToIso(val) {
  if (!val) return null;
  // JS Date object (cellDates:true)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // Número serial de Excel (fallback sin cellDates)
  if (typeof val === 'number' && val > 40000) {
    try {
      const info = window.XLSX.SSF.parse_date_code(val);
      if (info && info.y) return `${info.y}-${String(info.m).padStart(2,'0')}-${String(info.d).padStart(2,'0')}`;
    } catch (_) {}
  }
  // String: intentar parsear con parseBsDate
  return parseBsDate(String(val));
}

/** Parser de rows nativas de SheetJS para exports de Bistrosoft */
function parseBistrosoftRowsXlsx(rows) {
  const normalizeH = (v) => String(v || '').trim().toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íì]/g,'i')
    .replace(/[óò]/g,'o').replace(/[úù]/g,'u').replace(/[^a-z0-9]/g,'_');

  // Buscar fila de headers: la que tenga una celda exactamente igual a 'fecha'
  let headerRowIdx = -1;
  let headerRow = null;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i] || [];
    if (row.some((c) => normalizeH(c) === 'fecha' || normalizeH(c) === 'date')) {
      headerRowIdx = i;
      headerRow = row;
      break;
    }
  }

  const debugInfo = { headerRowIdx, rawHeader: headerRow };
  if (headerRowIdx < 0) return { tickets: [], debugInfo };

  const headers = headerRow.map(normalizeH);
  debugInfo.headers = headers;

  const findIdx = (candidates) => {
    for (const c of candidates) {
      const i = headers.indexOf(c);
      if (i >= 0) return i;
    }
    for (const c of candidates) {
      const i = headers.findIndex((h) => h.includes(c));
      if (i >= 0) return i;
    }
    return -1;
  };

  const isVentasDiario = headers.some((h) => h.includes('cantidad_ventas') || h.includes('total_de_ventas'));
  debugInfo.formato = isVentasDiario ? 'ventas_diario' : 'tickets';

  const dataRows = rows.slice(headerRowIdx + 1);

  if (isVentasDiario) {
    const idx = {
      fecha:    findIdx(['fecha','date']),
      total:    findIdx(['total_de_ventas','total']),
      cantidad: findIdx(['cantidad_ventas','cantidad']),
      efectivo: findIdx(['efectivo']),
      tarjetas: findIdx(['tarjetas']),
    };
    debugInfo.idx = idx;

    const tickets = [];
    for (const row of dataRows) {
      if (!row || row.every((c) => c === null || c === '')) continue;
      // Saltar fila de totales
      if (normalizeH(row[0]) === 'totales' || normalizeH(row[0]) === 'total') continue;

      const date = xlsxDateToIso(idx.fecha >= 0 ? row[idx.fecha] : null);
      if (!date) continue;

      const rawTotal = idx.total >= 0 ? row[idx.total] : null;
      const total = typeof rawTotal === 'number' ? rawTotal : parseEuroNum(String(rawTotal || '0'));
      if (total <= 0) continue;

      const rawCant = idx.cantidad >= 0 ? row[idx.cantidad] : null;
      const count = Math.max(1, Math.round(typeof rawCant === 'number' ? rawCant : parseEuroNum(String(rawCant || '1'))));

      const efectivo = typeof row[idx.efectivo] === 'number' ? row[idx.efectivo] : parseEuroNum(String(row[idx.efectivo] || '0'));
      const tarjetas = typeof row[idx.tarjetas] === 'number' ? row[idx.tarjetas] : parseEuroNum(String(row[idx.tarjetas] || '0'));
      let paymentMethod = efectivo > 0 && tarjetas === 0 ? 'Efectivo'
        : tarjetas > 0 && efectivo === 0 ? 'Tarjeta'
        : efectivo > 0 || tarjetas > 0 ? 'Mixto' : '';

      tickets.push({ id: createId(), date, time: '', ticketNumber: `day-${date}`, total, count, items: [], paymentMethod, _isSummary: true });
    }
    return { tickets, debugInfo };
  }

  // Formato por ticket / artículo: convertir a CSV y usar parser existente
  const csvLines = rows.map((row) =>
    (row || []).map((c) => {
      if (c instanceof Date) return xlsxDateToIso(c) || '';
      return String(c ?? '');
    }).join(';')
  );
  return parseBistrosoftCsv(csvLines.join('\n'));
}

function handleExpenseForm(event) {
  event.preventDefault();
  const existingExpense = finEditingExpenseId
    ? state.expenses.find((expense) => expense.id === finEditingExpenseId)
    : null;
  if (existingExpense?._source === 'bistrosoft') {
    const category = document.querySelector('#finExpCategory').value;
    setExpenseCategoryOverride(existingExpense, category);
    state.expenses = state.expenses.map((expense) =>
      expenseOverrideKeys(existingExpense).includes(expense.id) || expense.id === existingExpense.id
        ? { ...expense, category }
        : expense
    );
    resetExpenseForm();
    saveState();
    render();
    return;
  }

  const isDif = document.querySelector('#finExpDiferido').checked;
  const expData = {
    date:        document.querySelector('#finExpDate').value,
    amount:      parseFloat(document.querySelector('#finExpAmount').value),
    category:    document.querySelector('#finExpCategory').value,
    supplier:    document.querySelector('#finExpSupplier').value.trim(),
    description: document.querySelector('#finExpDesc').value.trim(),
    isDiferido:  isDif,
    dueDate:     isDif ? document.querySelector('#finExpDueDate').value : null,
    paymentMethod: isDif ? 'tc' : 'efectivo',
    locationId:   normalizeLocationId(existingExpense?.locationId || activeLocationId),
  };

  if (finEditingExpenseId) {
    // Modo edición: reemplazar el registro existente
    state.expenses = state.expenses.map((e) =>
      e.id === finEditingExpenseId ? { ...e, ...expData } : e
    );
  } else {
    // Modo creación: agregar nuevo
    state.expenses.push({ id: createId(), ...expData, createdAt: new Date().toISOString() });
  }

  resetExpenseForm();
  render();
}

// -------- CSV PARSER --------

function parseBistrosoftCsv(csv) {
  const allLines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (allLines.length < 2) return { tickets: [], debugInfo: { sep: '?', headerRow: -1, rawHeaders: '', headers: [] } };

  // Detectar separador mirando las primeras líneas con más columnas
  const sep = allLines.slice(0, 5).some((l) => l.split(';').length > l.split(',').length) ? ';' : ',';

  // Buscar la fila de headers en las primeras 10 líneas
  // (Bistrosoft suele tener 1-3 filas de título/metadata antes de las columnas)
  const KNOWN_HEADER_WORDS = ['fecha', 'date', 'ticket', 'total', 'importe', 'articulo', 'artículo',
    'hora', 'producto', 'cantidad', 'unidades', 'precio', 'cobro', 'pago', 'numero', 'número',
    'venta', 'concepto', 'descripcion', 'descripción', 'mesa', 'mozo', 'empleado'];

  let headerRowIdx = -1;
  let headers = [];
  const scanLimit = Math.min(15, allLines.length);

  const normalizeHeader = (h) =>
    h.trim().toLowerCase().replace(/['"]/g, '')
     .replace(/[áàâä]/g,'a').replace(/[éèêë]/g,'e')
     .replace(/[íìîï]/g,'i').replace(/[óòôö]/g,'o').replace(/[úùûü]/g,'u')
     .replace(/[^a-z0-9]/g,'_');

  // Primera pasada: fila que tenga "fecha" o "date" como columna exacta (más fiable)
  for (let i = 0; i < scanLimit; i++) {
    const cols = allLines[i].split(sep).map(normalizeHeader);
    if (cols.some((c) => c === 'fecha' || c === 'date' || c === 'f_')) {
      headerRowIdx = i;
      headers = cols;
      break;
    }
  }

  // Segunda pasada (fallback): ≥3 columnas que coincidan con palabras clave
  if (headerRowIdx < 0) {
    for (let i = 0; i < scanLimit; i++) {
      const cols = allLines[i].split(sep).map(normalizeHeader);
      const matches = cols.filter((c) => KNOWN_HEADER_WORDS.some((w) => c === w || c.startsWith(w + '_')));
      if (matches.length >= 3) {
        headerRowIdx = i;
        headers = cols;
        break;
      }
    }
  }

  const debugInfo = {
    sep,
    headerRow: headerRowIdx,
    rawHeaders: headerRowIdx >= 0 ? allLines[headerRowIdx] : '(no se encontró fila de encabezados)',
    headers,
  };

  if (headerRowIdx < 0) return { tickets: [], debugInfo };

  // Líneas de datos: todo lo que viene después de la fila de headers
  const dataLines = allLines.slice(headerRowIdx + 1);

  // Detectar subtipo: resumen diario (1 fila/día) vs artículos (1 fila/ítem) vs tickets (1 fila/ticket)
  const isVentasDiario = headers.some((h) => h.includes('cantidad_ventas') || h.includes('total_de_ventas'));
  const isArticulos = !isVentasDiario && headers.some((h) =>
    h.includes('art') || h.includes('unidad') || (h.includes('cant') && !h.includes('cantidad_ventas'))
    || h.includes('producto') || h.includes('precio')
  );

  const tickets = isVentasDiario
    ? parseBistrosoftVentasDiario(dataLines, headers, sep)
    : isArticulos
      ? parseBistrosoftArticulos(dataLines, headers, sep)
      : parseBistrosoftSummary(dataLines, headers, sep);

  return { tickets, debugInfo };
}

function parseBistrosoftSummary(lines, headers, sep) {
  const idx = {
    ticket: findColIdx(headers, ['n__ticket','n_ticket','ticket','numero','n_','nro','n_comprobante','comprobante']),
    fecha:  findColIdx(headers, ['fecha','date','dia','f_']),
    hora:   findColIdx(headers, ['hora','time','hour']),
    total:  findColIdx(headers, ['total','importe','amount','venta','monto','precio_total']),
    pago:   findColIdx(headers, ['forma_de_pago','metodo_de_pago','pago','cobro','payment','medio_de_pago','fp']),
    items:  findColIdx(headers, ['art_culos','articulos','productos','lineas','items','detalle']),
    mesa:   findColIdx(headers, ['mesa','table']),
  };
  const tickets = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    if (cols.length < 2) continue;
    const date = parseBsDate(cols[idx.fecha] || '');
    if (!date) continue;
    const total = parseEuroNum(cols[idx.total] || '0');
    if (total <= 0) continue;
    const items = parseInlineItems(idx.items >= 0 ? (cols[idx.items] || '') : '');
    tickets.push({
      id: createId(),
      date,
      time: idx.hora >= 0 ? (cols[idx.hora] || '') : '',
      ticketNumber: idx.ticket >= 0 ? (cols[idx.ticket] || String(i)) : String(i),
      total,
      items,
      paymentMethod: idx.pago >= 0 ? (cols[idx.pago] || '') : '',
    });
  }
  return tickets;
}

/** Parser para "Reporte de Ventas por Día" de Bistrosoft:
 *  1 fila por día → se crea 1 registro con campo `count` = Cantidad Ventas.
 *  calcDayMetrics ya usa t.count || 1 para el conteo de tickets. */
function parseBistrosoftVentasDiario(lines, headers, sep) {
  const idx = {
    fecha:    findColIdx(headers, ['fecha','date']),
    total:    findColIdx(headers, ['total_de_ventas','total','importe','venta']),
    cantidad: findColIdx(headers, ['cantidad_ventas','cantidad','cant_ventas','cant']),
    efectivo: findColIdx(headers, ['efectivo']),
    tarjetas: findColIdx(headers, ['tarjetas']),
    online:   findColIdx(headers, ['online']),
  };
  const tickets = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    if (cols.length < 2) continue;
    // Saltar fila de totales
    const firstVal = (cols[0] || '').trim().toLowerCase().replace(/['"]/g,'');
    if (firstVal === 'totales' || firstVal === 'total') continue;

    const date = parseBsDate(cols[idx.fecha] || '');
    if (!date) continue;
    const total = parseEuroNum(cols[idx.total] || '0');
    if (total <= 0) continue;
    const count = Math.max(1, Math.round(parseEuroNum(cols[idx.cantidad] || '1')));

    // Medio de pago predominante
    const efectivo = idx.efectivo >= 0 ? parseEuroNum(cols[idx.efectivo] || '0') : 0;
    const tarjetas = idx.tarjetas >= 0 ? parseEuroNum(cols[idx.tarjetas] || '0') : 0;
    const online   = idx.online   >= 0 ? parseEuroNum(cols[idx.online]   || '0') : 0;
    let paymentMethod = '';
    if (efectivo > 0 && tarjetas === 0 && online === 0) paymentMethod = 'Efectivo';
    else if (tarjetas > 0 && efectivo === 0) paymentMethod = 'Tarjeta';
    else if (efectivo > 0 || tarjetas > 0) paymentMethod = 'Mixto';

    tickets.push({
      id: createId(),
      date,
      time: '',
      ticketNumber: `day-${date}`,
      total,
      count,          // ← nº real de tickets del día
      items: [],
      paymentMethod,
      _isSummary: true,
    });
  }
  return tickets;
}

function parseBistrosoftArticulos(lines, headers, sep) {
  const idx = {
    ticket:   findColIdx(headers, ['n__ticket','n_ticket','ticket','numero','nro','n_comprobante','comprobante']),
    fecha:    findColIdx(headers, ['fecha','date','dia']),
    hora:     findColIdx(headers, ['hora','time']),
    articulo: findColIdx(headers, ['art_culo','articulo','producto','descripcion','descripcion','item','concepto','nombre']),
    unidades: findColIdx(headers, ['unidades','cantidad','cant','qty','units']),
    precio:   findColIdx(headers, ['precio','pvp','price','p_vp','precio_unitario','pu']),
    total:    findColIdx(headers, ['total','importe','subtotal','monto']),
    pago:     findColIdx(headers, ['forma_de_pago','metodo_de_pago','pago','cobro','payment','medio_de_pago','fp']),
  };
  const ticketMap = new Map();
  for (let i = 0; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    if (cols.length < 2) continue;
    const date = parseBsDate(cols[idx.fecha] || '');
    if (!date) continue;
    const ticketNum = idx.ticket >= 0 ? (cols[idx.ticket] || String(i)) : String(i);
    const key = `${date}-${ticketNum}`;
    if (!ticketMap.has(key)) {
      ticketMap.set(key, {
        id: createId(), date,
        time: idx.hora >= 0 ? (cols[idx.hora] || '') : '',
        ticketNumber: ticketNum, total: 0, items: [],
        paymentMethod: idx.pago >= 0 ? (cols[idx.pago] || '') : '',
      });
    }
    const t = ticketMap.get(key);
    const name = idx.articulo >= 0 ? (cols[idx.articulo] || '').trim() : '';
    const qty = Math.round(parseEuroNum(cols[idx.unidades] || '1') || 1);
    const price = parseEuroNum(idx.precio >= 0 ? (cols[idx.precio] || '0') : '0');
    const lineTotal = parseEuroNum(idx.total >= 0 ? (cols[idx.total] || '0') : '0');
    if (name) {
      const itemTotal = lineTotal || price * qty;
      t.items.push({ name, qty, price, total: itemTotal });
      t.total += itemTotal;
    }
  }
  return Array.from(ticketMap.values()).filter((t) => t.total > 0);
}

function findColIdx(headers, candidates) {
  for (const c of candidates) {
    const i = headers.indexOf(c);
    if (i >= 0) return i;
  }
  for (const c of candidates) {
    const i = headers.findIndex((h) => h.includes(c));
    if (i >= 0) return i;
  }
  return -1;
}

function parseBsDate(str) {
  str = str.trim().replace(/['"]/g, '');
  let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return str;
  m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) return `20${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

function parseEuroNum(str) {
  str = String(str).trim().replace(/['"€$\s]/g, '');
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(str)) str = str.replace(/\./g, '').replace(',', '.');
  else str = str.replace(',', '.');
  return parseFloat(str) || 0;
}

function parseInlineItems(str) {
  if (!str) return [];
  return str.split(/[,;]/).flatMap((part) => {
    part = part.trim();
    const m = part.match(/^(.+?)\s*[xX×]\s*(\d+)$/);
    if (m) return [{ name: m[1].trim(), qty: parseInt(m[2]), price: 0 }];
    return part ? [{ name: part, qty: 1, price: 0 }] : [];
  });
}

function splitCsvLine(line, sep) {
  const result = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === sep && !inQ) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

// -------- PRESUPUESTO --------

function renderFinPresupuesto() {
  const el = document.querySelector('#finPresupuestoContent');
  if (!el) return;

  const monthKey   = monthInputValue(finActiveMonth);
  const monthLabel = `${MONTH_NAMES[finActiveMonth.getMonth()]} ${finActiveMonth.getFullYear()}`;

  const locationBudgets = getLocationBudgets();
  if (!Object.prototype.hasOwnProperty.call(locationBudgets, monthKey)) {
    const previousMonth = new Date(finActiveMonth.getFullYear(), finActiveMonth.getMonth() - 1, 1);
    const previousKey = monthInputValue(previousMonth);
    locationBudgets[monthKey] = locationBudgets[previousKey]
      ? structuredClone(locationBudgets[previousKey])
      : {};
    if (activeLocationId === DEFAULT_LOCATION_ID) state.budgets = locationBudgets;
    saveState();
  }
  const budget = locationBudgets[monthKey] || {};

  // Gastos reales del mes por categoría
  const realExp = {};
  getLocationExpenses()
    .filter((e) => e.date.startsWith(monthKey))
    .forEach((e) => { realExp[e.category] = (realExp[e.category] || 0) + e.amount; });

  // Ventas reales
  const realSales    = getLocationSales().filter((s) => s.date.startsWith(monthKey)).reduce((s, t) => s + t.total, 0);
  const budgetSales  = parseFloat(budget['ventas']) || 0;
  const salesDiff    = realSales - budgetSales;
  const salesDiffCls = salesDiff >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';
  const salesExec    = budgetSales > 0 ? (realSales / budgetSales * 100).toFixed(0) + '%' : '—';

  // Función auxiliar para barra de ejecución
  const execBar = (real, budg) => {
    if (!budg) return '';
    const pct = Math.min(Math.round(real / budg * 100), 150);
    const color = real <= budg ? 'var(--blue)' : 'var(--danger)';
    return `<div class="fin-mini-bar-wrap" style="margin-top:4px"><div class="fin-mini-bar" style="width:${Math.min(pct,100)}%;background:${color}"></div></div>`;
  };

  // Fila ventas
  const salesRow = `
    <tr class="budget-sales-row">
      <td><strong>🎯 Objetivo ventas</strong></td>
      <td class="fin-cell-num">
        <div class="budget-input-wrap">
          <span class="budget-eur">€</span>
          <input class="budget-input" type="number" min="0" step="100"
            data-bkey="ventas" data-bmonth="${monthKey}"
            value="${budgetSales > 0 ? budgetSales.toFixed(0) : ''}" placeholder="0">
        </div>
      </td>
      <td class="fin-cell-num">${realSales > 0 ? formatEur(realSales) : '—'}</td>
      <td class="fin-cell-num ${budgetSales||realSales ? salesDiffCls : ''}">
        ${budgetSales||realSales ? (salesDiff>=0?'+':'') + formatEur(salesDiff) : '—'}
      </td>
      <td class="fin-cell-num">
        ${salesExec}
        ${budgetSales ? execBar(realSales, budgetSales) : ''}
      </td>
    </tr>
    <tr><td colspan="5" style="padding:0;background:var(--line);height:1px"></td></tr>`;

  // Filas de gastos por categoría
  let budgetTotalExp = 0, realTotalExp = 0;
  const expRows = EXPENSE_CATEGORIES.map((cat) => {
    const b = parseFloat(budget[cat.id]) || 0;
    const r = realExp[cat.id] || 0;
    budgetTotalExp += b;
    realTotalExp   += r;
    const diff    = b - r; // positivo = por debajo del presupuesto (bien)
    const diffCls = b||r ? (diff >= 0 ? 'fin-cell-positive' : 'fin-cell-negative') : '';
    const exec    = b > 0 ? (r / b * 100).toFixed(0) + '%' : (r > 0 ? '<span style="color:var(--danger)">sin presup.</span>' : '—');
    return `<tr>
      <td>${cat.label}</td>
      <td class="fin-cell-num">
        <div class="budget-input-wrap">
          <span class="budget-eur">€</span>
          <input class="budget-input" type="number" min="0" step="10"
            data-bkey="${cat.id}" data-bmonth="${monthKey}"
            value="${b > 0 ? b.toFixed(0) : ''}" placeholder="0">
        </div>
      </td>
      <td class="fin-cell-num">${r > 0 ? formatEur(r) : '—'}</td>
      <td class="fin-cell-num ${diffCls}">${b||r ? ((diff>=0?'+':'') + formatEur(diff)) : '—'}</td>
      <td class="fin-cell-num">${exec}${b ? execBar(r, b) : ''}</td>
    </tr>`;
  }).join('');

  // Totales y resultado
  const budgetResult = budgetSales - budgetTotalExp;
  const realResult   = realSales   - realTotalExp;
  const resDiff      = realResult  - budgetResult;
  const totExpDiff   = budgetTotalExp - realTotalExp;
  const totExpCls    = totExpDiff >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';
  const resCls       = realResult >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';
  const budResCls    = budgetResult >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';
  const resDiffCls   = resDiff >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <h3 style="margin:0;color:var(--ink)">Presupuesto vs Real</h3>
      <div class="fin-month-nav" style="margin:0">
        <button id="budPrevMonth" class="icon-button" type="button">&#8249;</button>
        <strong style="min-width:130px;text-align:center">${monthLabel}</strong>
        <button id="budNextMonth" class="icon-button" type="button">&#8250;</button>
      </div>
      <span style="color:var(--muted);font-size:0.83rem">Los importes se guardan automáticamente</span>
    </div>
    <div style="overflow-x:auto">
      <table class="fin-table budget-table">
        <thead><tr>
          <th style="min-width:170px">Concepto</th>
          <th class="fin-cell-num" style="min-width:150px">Presupuesto</th>
          <th class="fin-cell-num">Real</th>
          <th class="fin-cell-num">Diferencia</th>
          <th class="fin-cell-num" style="min-width:100px">Ejecución</th>
        </tr></thead>
        <tbody>
          ${salesRow}
          ${expRows}
        </tbody>
        <tfoot>
          <tr class="fin-total-row">
            <td>Total gastos</td>
            <td class="fin-cell-num">${budgetTotalExp > 0 ? formatEur(budgetTotalExp) : '—'}</td>
            <td class="fin-cell-num">${realTotalExp > 0 ? formatEur(realTotalExp) : '—'}</td>
            <td class="fin-cell-num ${budgetTotalExp||realTotalExp ? totExpCls : ''}">
              ${budgetTotalExp||realTotalExp ? ((totExpDiff>=0?'+':'') + formatEur(totExpDiff)) : '—'}
            </td>
            <td class="fin-cell-num">
              ${budgetTotalExp > 0 ? (realTotalExp/budgetTotalExp*100).toFixed(0)+'%' : '—'}
              ${budgetTotalExp ? execBar(realTotalExp, budgetTotalExp) : ''}
            </td>
          </tr>
          <tr class="fin-total-row budget-result-row">
            <td><strong>Resultado</strong></td>
            <td class="fin-cell-num ${budResCls}">${budgetSales ? ((budgetResult>=0?'+':'') + formatEur(budgetResult)) : '—'}</td>
            <td class="fin-cell-num ${resCls}">${realSales||realTotalExp ? ((realResult>=0?'+':'') + formatEur(realResult)) : '—'}</td>
            <td class="fin-cell-num ${resDiffCls}">${budgetSales&&(realSales||realTotalExp) ? ((resDiff>=0?'+':'') + formatEur(resDiff)) : '—'}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>`;

  // Navegación de mes dentro del presupuesto
  el.querySelector('#budPrevMonth').addEventListener('click', () => {
    finActiveMonth = new Date(finActiveMonth.getFullYear(), finActiveMonth.getMonth() - 1, 1);
    renderFinMonthNav();
    renderFinPresupuesto();
  });
  el.querySelector('#budNextMonth').addEventListener('click', () => {
    finActiveMonth = new Date(finActiveMonth.getFullYear(), finActiveMonth.getMonth() + 1, 1);
    renderFinMonthNav();
    renderFinPresupuesto();
  });

  // Guardar presupuesto al cambiar un input
  el.querySelectorAll('.budget-input').forEach((input) => {
    input.addEventListener('change', (ev) => {
      const key   = ev.target.dataset.bkey;
      const month = ev.target.dataset.bmonth;
      const val   = parseFloat(ev.target.value) || 0;
      const budgets = getLocationBudgets();
      if (!budgets[month]) budgets[month] = {};
      if (val > 0) budgets[month][key] = val;
      else         delete budgets[month][key];
      if (activeLocationId === DEFAULT_LOCATION_ID) state.budgets = budgets;
      saveState();
      renderFinPresupuesto();
    });
  });
}

// -------- RESUMEN KPIs --------

function renderFinResumen() {
  const el = document.querySelector('#finResumenContent');
  if (!el) return;

  // Recoger todos los meses con datos
  const monthSet = new Set();
  const locationSales = getLocationSales();
  const locationExpenses = getLocationExpenses();
  locationSales.forEach((s) => monthSet.add(s.date.slice(0, 7)));
  locationExpenses.forEach((e) => monthSet.add(e.date.slice(0, 7)));
  const months = [...monthSet].sort();

  if (months.length === 0) {
    el.innerHTML = '<p style="color:var(--muted);padding:20px">Sin datos cargados todavía.</p>';
    return;
  }

  // Calcular métricas por mes
  const data = months.map((ym) => {
    const [y, m] = ym.split('-').map(Number);
    const sales    = locationSales.filter((s) => s.date.startsWith(ym));
    const expenses = locationExpenses.filter((e) => e.date.startsWith(ym));
    const totalSales    = sales.reduce((s, t) => s + t.total, 0);
    const totalTickets  = sales.reduce((s, t) => s + (t.count || 1), 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const resultado     = totalSales - totalExpenses;
    const margen        = totalSales > 0 ? (resultado / totalSales) * 100 : 0;
    const avgTicket     = totalTickets > 0 ? totalSales / totalTickets : 0;
    const daysWithSales = new Set(sales.map((s) => s.date)).size;
    const ticketsPerDay = daysWithSales > 0 ? totalTickets / daysWithSales : 0;
    const salesPerDay   = daysWithSales > 0 ? totalSales   / daysWithSales : 0;
    const crossSelling  = calculateCrossSelling(sales);
    return { ym, year: y, month: m - 1, totalSales, totalTickets, totalExpenses, resultado, margen, avgTicket, daysWithSales, ticketsPerDay, salesPerDay, crossSelling };
  });

  const currentYM  = monthInputValue(finActiveMonth);

  // Totales acumulados HASTA el mes seleccionado (inclusive)
  const dataAcum   = data.filter((d) => d.ym <= currentYM);
  const totSales   = dataAcum.reduce((s, d) => s + d.totalSales, 0);
  const totExp     = dataAcum.reduce((s, d) => s + d.totalExpenses, 0);
  const totRes     = totSales - totExp;
  const totTickets = dataAcum.reduce((s, d) => s + d.totalTickets, 0);
  const totMargen  = totSales > 0 ? (totRes / totSales) * 100 : 0;

  // Mejor mes sobre todos los datos (sin filtro de fecha)
  const bestMonth  = data.reduce((a, b) => b.totalSales > a.totalSales ? b : a, data[0]);
  const maxSales   = bestMonth.totalSales;

  const totResClass = totRes >= 0 ? 'fin-kpi-positive' : 'fin-kpi-negative';
  const acumLabel   = `hasta ${MONTH_NAMES[finActiveMonth.getMonth()]} ${finActiveMonth.getFullYear()}`;

  // Cards de resumen acumulado hasta el mes seleccionado
  const summaryCards = `
    <div class="fin-kpi-grid fin-resumen-kpi-grid" style="border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:24px">
      <div class="fin-kpi-card">
        <span>Ventas acumuladas <small style="color:var(--muted);font-weight:400">${acumLabel}</small></span>
        <strong>${formatEur(totSales)}</strong>
      </div>
      <div class="fin-kpi-card">
        <span>Gastos acumulados <small style="color:var(--muted);font-weight:400">${acumLabel}</small></span>
        <strong>${formatEur(totExp)}</strong>
      </div>
      <div class="fin-kpi-card">
        <span>Resultado acumulado</span>
        <strong class="${totResClass}">${(totRes >= 0 ? '+' : '') + formatEur(totRes)}</strong>
      </div>
      <div class="fin-kpi-card">
        <span>Margen global</span>
        <strong class="${totResClass}">${totMargen.toFixed(1)}%</strong>
      </div>
      <div class="fin-kpi-card">
        <span>Tickets acumulados</span>
        <strong>${totTickets.toLocaleString('es-ES')}</strong>
      </div>
      <div class="fin-kpi-card">
        <span>Ticket prom. global</span>
        <strong>${totTickets > 0 ? formatEur(totSales / totTickets) : '—'}</strong>
      </div>
      <div class="fin-kpi-card">
        <span>Mejor mes (ventas)</span>
        <strong>${MONTH_NAMES[bestMonth.month]} ${bestMonth.year}</strong>
      </div>
      <div class="fin-kpi-card">
        <span>Ventas mejor mes</span>
        <strong>${formatEur(maxSales)}</strong>
      </div>
    </div>`;

  // Filas por mes
  const rows = data.map((d) => {
    const isCurrent = d.ym === currentYM;
    const resClass  = d.resultado >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';
    const barPct    = maxSales > 0 ? Math.round((d.totalSales / maxSales) * 100) : 0;
    const expPct    = d.totalSales > 0 ? Math.round((d.totalExpenses / d.totalSales) * 100) : 0;
    return `
      <tr${isCurrent ? ' class="fin-resumen-current"' : ''}>
        <td><strong>${MONTH_NAMES[d.month]}</strong> <span style="color:var(--muted);font-size:0.8rem">${d.year}</span>${isCurrent ? ' <span class="fin-badge-current">actual</span>' : ''}</td>
        <td class="fin-cell-num">
          ${formatEur(d.totalSales)}
          <div class="fin-mini-bar-wrap"><div class="fin-mini-bar fin-mini-bar-sales" style="width:${barPct}%"></div></div>
        </td>
        <td class="fin-cell-num">${d.totalTickets > 0 ? d.totalTickets.toLocaleString('es-ES') : '—'}</td>
        <td class="fin-cell-num">${d.avgTicket > 0 ? formatEur(d.avgTicket) : '—'}</td>
        <td class="fin-cell-num">${d.salesPerDay > 0 ? formatEur(d.salesPerDay) : '—'}</td>
        <td class="fin-cell-num">${d.ticketsPerDay > 0 ? Math.round(d.ticketsPerDay) : '—'}</td>
        <td class="fin-cell-num">${formatCrossSelling(d.crossSelling)}</td>
        <td class="fin-cell-num">
          ${d.totalExpenses > 0 ? formatEur(d.totalExpenses) : '—'}
          ${d.totalExpenses > 0 ? `<div class="fin-mini-bar-wrap"><div class="fin-mini-bar fin-mini-bar-exp" style="width:${expPct}%"></div></div>` : ''}
        </td>
        <td class="fin-cell-num ${resClass}">${(d.resultado >= 0 ? '+' : '') + formatEur(d.resultado)}</td>
        <td class="fin-cell-num ${resClass}">${d.margen.toFixed(1)}%</td>
      </tr>`;
  }).join('');

  // Totales de TODOS los meses (para el pie de la tabla)
  const allSales   = data.reduce((s, d) => s + d.totalSales, 0);
  const allExp     = data.reduce((s, d) => s + d.totalExpenses, 0);
  const allRes     = allSales - allExp;
  const allTickets = data.reduce((s, d) => s + d.totalTickets, 0);
  const allDays    = data.reduce((s, d) => s + d.daysWithSales, 0);
  const allMargen  = allSales > 0 ? (allRes / allSales) * 100 : 0;
  const allCrossSelling = calculateCrossSelling(locationSales);
  const allResClass = allRes >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';

  el.innerHTML = `
    ${summaryCards}
    <div style="overflow-x:auto">
      <table class="fin-table">
        <thead><tr>
          <th style="min-width:140px">Mes</th>
          <th class="fin-cell-num">Ventas</th>
          <th class="fin-cell-num">Tickets</th>
          <th class="fin-cell-num">Ticket prom.</th>
          <th class="fin-cell-num">Venta/día (€)</th>
          <th class="fin-cell-num">Tickets/día</th>
          <th class="fin-cell-num">Cross-selling</th>
          <th class="fin-cell-num">Gastos</th>
          <th class="fin-cell-num">Resultado</th>
          <th class="fin-cell-num">Margen %</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="fin-total-row">
          <td>TOTAL ${data.length} meses</td>
          <td class="fin-cell-num">${formatEur(allSales)}</td>
          <td class="fin-cell-num">${allTickets.toLocaleString('es-ES')}</td>
          <td class="fin-cell-num">${allTickets > 0 ? formatEur(allSales / allTickets) : '—'}</td>
          <td class="fin-cell-num">${allDays > 0 ? formatEur(allSales / allDays) : '—'}</td>
          <td class="fin-cell-num">${allDays > 0 ? Math.round(allTickets / allDays) : '—'}</td>
          <td class="fin-cell-num">${formatCrossSelling(allCrossSelling)}</td>
          <td class="fin-cell-num">${formatEur(allExp)}</td>
          <td class="fin-cell-num ${allResClass}">${(allRes >= 0 ? '+' : '') + formatEur(allRes)}</td>
          <td class="fin-cell-num ${allResClass}">${allMargen.toFixed(1)}%</td>
        </tr></tfoot>
      </table>
    </div>`;
}

// -------- AUDITORIA SUCURSALES --------

function summarizeSalesForLocation(locationId, monthKey) {
  const map = new Map();
  getLocationSales(locationId)
    .filter((sale) => sale.date.startsWith(monthKey))
    .forEach((sale) => {
      const current = map.get(sale.date) || { sales: 0, tickets: 0, saleRows: [] };
      current.sales += Number(sale.total || 0);
      current.tickets += Number(sale.count || 1);
      current.saleRows.push(sale);
      map.set(sale.date, current);
    });
  return map;
}

function renderFinAudit() {
  const el = document.querySelector('#finAuditContent');
  if (!el) return;

  const monthKey = monthInputValue(finActiveMonth);
  const monthLabel = `${MONTH_NAMES[finActiveMonth.getMonth()]} ${finActiveMonth.getFullYear()}`;
  const days = getMonthDays(finActiveMonth);
  const branchMaps = {
    barcelona: summarizeSalesForLocation('barcelona', monthKey),
    madrid: summarizeSalesForLocation('madrid', monthKey),
  };

  const rowsData = days.map((date) => {
    const dateKey = toDateInput(date);
    const barcelona = branchMaps.barcelona.get(dateKey) || { sales: 0, tickets: 0, saleRows: [] };
    const madrid = branchMaps.madrid.get(dateKey) || { sales: 0, tickets: 0, saleRows: [] };
    barcelona.crossSelling = calculateCrossSelling(barcelona.saleRows);
    madrid.crossSelling = calculateCrossSelling(madrid.saleRows);
    return {
      dateKey,
      barcelona,
      madrid,
      total: barcelona.sales + madrid.sales,
      diff: barcelona.sales - madrid.sales,
    };
  });

  const totals = rowsData.reduce((acc, row) => {
    acc.barcelonaSales += row.barcelona.sales;
    acc.barcelonaTickets += row.barcelona.tickets;
    acc.madridSales += row.madrid.sales;
    acc.madridTickets += row.madrid.tickets;
    acc.totalSales += row.total;
    return acc;
  }, {
    barcelonaSales: 0,
    barcelonaTickets: 0,
    madridSales: 0,
    madridTickets: 0,
    totalSales: 0,
  });
  const maxDaily = Math.max(
    1,
    ...rowsData.map((row) => Math.max(row.barcelona.sales, row.madrid.sales, row.total)),
  );

  const rows = rowsData.map((row) => {
    const hasData = row.total > 0;
    const diffClass = row.diff > 0 ? 'fin-cell-positive' : row.diff < 0 ? 'fin-cell-negative' : '';
    const bPct = Math.round(row.barcelona.sales / maxDaily * 100);
    const mPct = Math.round(row.madrid.sales / maxDaily * 100);
    return `
      <tr${hasData ? '' : ' class="fin-row-empty"'}>
        <td>${formatHumanDate(row.dateKey)}</td>
        <td class="fin-cell-num">
          ${row.barcelona.sales > 0 ? formatEur(row.barcelona.sales) : '&mdash;'}
          ${row.barcelona.sales > 0 ? `<div class="fin-mini-bar-wrap"><div class="fin-mini-bar fin-mini-bar-sales" style="width:${bPct}%"></div></div>` : ''}
        </td>
        <td class="fin-cell-num">${row.barcelona.tickets || '&mdash;'}</td>
        <td class="fin-cell-num">
          ${row.madrid.sales > 0 ? formatEur(row.madrid.sales) : '&mdash;'}
          ${row.madrid.sales > 0 ? `<div class="fin-mini-bar-wrap"><div class="fin-mini-bar" style="width:${mPct}%;background:var(--coffee)"></div></div>` : ''}
        </td>
        <td class="fin-cell-num">${row.madrid.tickets || '&mdash;'}</td>
        <td class="fin-cell-num">${row.total > 0 ? formatEur(row.total) : '&mdash;'}</td>
        <td class="fin-cell-num ${diffClass}">${hasData ? (row.diff >= 0 ? '+' : '') + formatEur(row.diff) : '&mdash;'}</td>
      </tr>`;
  }).join('');

  const totalDiff = totals.barcelonaSales - totals.madridSales;
  const totalDiffClass = totalDiff >= 0 ? 'fin-cell-positive' : 'fin-cell-negative';
  const todayKey = toDateInput(new Date());
  const auditCrossDate = todayKey.startsWith(monthKey) ? todayKey : '';
  const barcelonaCross = calculateCrossSelling(getLocationSales('barcelona').filter((sale) => sale.date === auditCrossDate));
  const madridCross = calculateCrossSelling(getLocationSales('madrid').filter((sale) => sale.date === auditCrossDate));
  el.innerHTML = `
    <div class="fin-table-header" style="margin-bottom:16px">
      <div>
        <h3>Auditoria diaria Barcelona / Madrid</h3>
        <p class="form-note">Comparativo mensual por dia para detectar rapido diferencias, faltantes o picos de venta.</p>
      </div>
      <strong>${monthLabel}</strong>
    </div>
    <div class="fin-kpi-grid fin-resumen-kpi-grid" style="margin-bottom:18px">
      <div class="fin-kpi-card"><span>Barcelona</span><strong>${formatEur(totals.barcelonaSales)}</strong><small>${totals.barcelonaTickets} tickets</small></div>
      <div class="fin-kpi-card"><span>Madrid</span><strong>${formatEur(totals.madridSales)}</strong><small>${totals.madridTickets} tickets</small></div>
      <div class="fin-kpi-card"><span>Cross-selling hoy Barcelona</span><strong>${formatCrossSelling(barcelonaCross)}</strong><small>Café + alimento</small></div>
      <div class="fin-kpi-card"><span>Cross-selling hoy Madrid</span><strong>${formatCrossSelling(madridCross)}</strong><small>Café + alimento</small></div>
      <div class="fin-kpi-card"><span>Total dos locales</span><strong>${formatEur(totals.totalSales)}</strong></div>
      <div class="fin-kpi-card"><span>Diferencia BCN - MAD</span><strong class="${totalDiffClass}">${(totalDiff >= 0 ? '+' : '') + formatEur(totalDiff)}</strong></div>
    </div>
    <div style="overflow-x:auto">
      <table class="fin-table">
        <thead><tr>
          <th>Fecha</th>
          <th class="fin-cell-num">Barcelona</th>
          <th class="fin-cell-num">Tickets BCN</th>
          <th class="fin-cell-num">Madrid</th>
          <th class="fin-cell-num">Tickets MAD</th>
          <th class="fin-cell-num">Total</th>
          <th class="fin-cell-num">Dif. BCN-MAD</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="fin-total-row">
          <td>Total ${monthLabel}</td>
          <td class="fin-cell-num">${formatEur(totals.barcelonaSales)}</td>
          <td class="fin-cell-num">${totals.barcelonaTickets}</td>
          <td class="fin-cell-num">${formatEur(totals.madridSales)}</td>
          <td class="fin-cell-num">${totals.madridTickets}</td>
          <td class="fin-cell-num">${formatEur(totals.totalSales)}</td>
          <td class="fin-cell-num ${totalDiffClass}">${(totalDiff >= 0 ? '+' : '') + formatEur(totalDiff)}</td>
        </tr></tfoot>
      </table>
    </div>`;
}

// -------- ANALISIS --------

function analysisDate(value) {
  return new Date(`${value}T12:00:00`);
}

function scheduledBaristasForSale(sale) {
  const hour = parseSaleHour(sale.time);
  if (hour === null || !sale.date) return [];
  return getShiftsForDate(sale.date)
    .filter((shift) => shift.start <= hour && shift.end > hour)
    .map((shift) => getAllEmployees(true).find((employee) => employee.id === shift.employeeId)?.label)
    .filter(Boolean);
}

function saleBaristaLabels(sale) {
  const direct = String(sale.barista || '').trim();
  return direct ? [direct] : scheduledBaristasForSale(sale);
}

function buildAnalysisGroups(sales, type) {
  const groups = new Map();
  const add = (key, label, sale, quantity = 0, amount = Number(sale.total || 0)) => {
    const current = groups.get(key) || { key, label, sales: 0, tickets: new Set(), quantity: 0 };
    current.sales += amount;
    current.quantity += quantity;
    current.tickets.add(sale.id || sale.ticketNumber || `${sale.date}-${sale.time}-${groups.size}`);
    groups.set(key, current);
  };

  sales.forEach((sale) => {
    const date = analysisDate(sale.date);
    const hour = parseSaleHour(sale.time);
    if (type === 'hour') {
      const key = hour === null ? 'sin-hora' : String(hour).padStart(2, '0');
      add(key, hour === null ? 'Sin hora' : `${key}:00–${key}:59`, sale);
    } else if (type === 'day') {
      add(sale.date, formatHumanDate(sale.date), sale);
    } else if (type === 'weekday') {
      const day = date.getDay();
      add(String(day), DAY_NAMES[day], sale);
    } else if (type === 'barista') {
      const names = saleBaristaLabels(sale);
      (names.length ? names : ['Sin asignar']).forEach((name) => add(name, name, sale));
    } else if (type === 'product') {
      const items = Array.isArray(sale.items) ? sale.items : [];
      if (!items.length) add('sin-detalle', 'Sin detalle de producto', sale);
      items.forEach((item) => {
        const name = itemName(item) || 'Producto sin nombre';
        add(name.toLocaleLowerCase(), name, sale, itemQuantity(item), itemAmount(item));
      });
    }
  });

  return [...groups.values()].map((group) => ({
    ...group,
    tickets: group.tickets.size,
  }));
}

function printFinAnalysis() {
  document.body.classList.add('print-analysis');
  window.addEventListener('afterprint', () => document.body.classList.remove('print-analysis'), { once: true });
  window.print();
}

function renderFinAnalysis() {
  const el = document.querySelector('#finAnalysisContent');
  if (!el) return;
  const now = new Date();
  const monthStart = toDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = toDateInput(now);
  finAnalysisFilters ||= {
    type: 'hour',
    dateFrom: monthStart,
    dateTo: today,
    weekday: 'all',
    hourFrom: '0',
    hourTo: '23',
    barista: 'all',
    metric: 'sales',
  };
  const filters = finAnalysisFilters;
  const allLocationSales = getLocationSales();
  const baristas = [...new Set(allLocationSales.flatMap(saleBaristaLabels))].sort((a, b) => a.localeCompare(b));
  const selectedSales = allLocationSales.filter((sale) => {
    if (!sale.date || sale.date < filters.dateFrom || sale.date > filters.dateTo) return false;
    const day = analysisDate(sale.date).getDay();
    if (filters.weekday !== 'all' && day !== Number(filters.weekday)) return false;
    const hour = parseSaleHour(sale.time);
    if (hour !== null && (hour < Number(filters.hourFrom) || hour > Number(filters.hourTo))) return false;
    if (filters.barista !== 'all' && !saleBaristaLabels(sale).includes(filters.barista)) return false;
    return true;
  });
  const totalSales = selectedSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const totalTickets = selectedSales.reduce((sum, sale) => sum + Number(sale.count || 1), 0);
  const totalProducts = selectedSales.reduce((sum, sale) => sum + (sale.items || []).reduce((itemSum, item) => itemSum + itemQuantity(item), 0), 0);
  const metricKey = filters.metric;
  const metricValue = (row) => metricKey === 'tickets' ? row.tickets : metricKey === 'quantity' ? row.quantity : row.sales;
  const metricLabel = metricKey === 'tickets' ? 'Pedidos' : metricKey === 'quantity' ? 'Unidades' : 'Venta';
  const groups = buildAnalysisGroups(selectedSales, filters.type)
    .sort((a, b) => metricValue(b) - metricValue(a));
  const maxValue = Math.max(1, ...groups.map(metricValue));
  const rows = groups.map((row) => `
    <tr>
      <td>${escapeHtml(row.label)}</td>
      <td class="fin-cell-num">${formatEur(row.sales)}</td>
      <td class="fin-cell-num">${row.tickets}</td>
      <td class="fin-cell-num">${row.quantity || '—'}</td>
      <td class="fin-cell-num">${row.tickets ? formatEur(row.sales / row.tickets) : '—'}</td>
    </tr>`).join('');
  const chart = groups.slice(0, 20).map((row) => {
    const value = metricValue(row);
    const shown = metricKey === 'sales' ? formatEur(value) : String(value);
    return `<div class="analysis-bar-row">
      <span>${escapeHtml(row.label)}</span>
      <div class="analysis-bar-track"><i style="width:${Math.max(2, value / maxValue * 100)}%"></i></div>
      <strong>${shown}</strong>
    </div>`;
  }).join('');

  el.innerHTML = `
    <section class="analysis-report" id="analysisPrintable">
      <div class="fin-table-header analysis-heading">
        <div><h3>Análisis de ventas · ${getLocation().label}</h3><p class="form-note">Filtrá la información de Bistrosoft y la grilla para auditar ventas, pedidos, productos y cobertura.</p></div>
        <button type="button" class="ghost-button" id="analysisPrint">Exportar PDF</button>
      </div>
      <form class="analysis-filters" id="analysisFilters">
        <label>Informe<select name="type">
          <option value="hour"${filters.type === 'hour' ? ' selected' : ''}>Por horario</option>
          <option value="day"${filters.type === 'day' ? ' selected' : ''}>Por día</option>
          <option value="weekday"${filters.type === 'weekday' ? ' selected' : ''}>Por día de la semana</option>
          <option value="product"${filters.type === 'product' ? ' selected' : ''}>Por producto</option>
          <option value="barista"${filters.type === 'barista' ? ' selected' : ''}>Por barista</option>
        </select></label>
        <label>Desde<input name="dateFrom" type="date" value="${filters.dateFrom}"></label>
        <label>Hasta<input name="dateTo" type="date" value="${filters.dateTo}"></label>
        <label>Día<select name="weekday"><option value="all">Todos</option>${DAY_NAMES.map((day, index) => `<option value="${index}"${filters.weekday === String(index) ? ' selected' : ''}>${day}</option>`).join('')}</select></label>
        <label>Hora desde<input name="hourFrom" type="number" min="0" max="23" value="${filters.hourFrom}"></label>
        <label>Hora hasta<input name="hourTo" type="number" min="0" max="23" value="${filters.hourTo}"></label>
        <label>Barista<select name="barista"><option value="all">Todos</option>${baristas.map((name) => `<option value="${escapeHtml(name)}"${filters.barista === name ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('')}</select></label>
        <label>Medida del gráfico<select name="metric">
          <option value="sales"${filters.metric === 'sales' ? ' selected' : ''}>Dinero</option>
          <option value="tickets"${filters.metric === 'tickets' ? ' selected' : ''}>Pedidos</option>
          <option value="quantity"${filters.metric === 'quantity' ? ' selected' : ''}>Unidades</option>
        </select></label>
      </form>
      <div class="fin-kpi-grid analysis-kpis">
        <div class="fin-kpi-card"><span>Venta filtrada</span><strong>${formatEur(totalSales)}</strong></div>
        <div class="fin-kpi-card"><span>Pedidos</span><strong>${totalTickets}</strong></div>
        <div class="fin-kpi-card"><span>Ticket promedio</span><strong>${totalTickets ? formatEur(totalSales / totalTickets) : '—'}</strong></div>
        <div class="fin-kpi-card"><span>Unidades registradas</span><strong>${totalProducts}</strong></div>
      </div>
      <section class="analysis-chart"><h4>${metricLabel} por segmento</h4>${chart || '<p class="empty-state">No hay datos para los filtros elegidos.</p>'}</section>
      <div class="analysis-table-wrap"><table class="fin-table">
        <thead><tr><th>Segmento</th><th class="fin-cell-num">Venta</th><th class="fin-cell-num">Pedidos</th><th class="fin-cell-num">Unidades</th><th class="fin-cell-num">Ticket prom.</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="empty-state">Sin resultados.</td></tr>'}</tbody>
      </table></div>
      <p class="analysis-source-note">Barista: se usa el dato de Bistrosoft cuando está disponible; si falta, se atribuye según quién figuraba trabajando en la grilla durante esa hora.</p>
    </section>`;

  document.querySelector('#analysisFilters')?.addEventListener('change', (event) => {
    const form = new FormData(event.currentTarget);
    finAnalysisFilters = Object.fromEntries(form.entries());
    renderFinAnalysis();
  });
  document.querySelector('#analysisPrint')?.addEventListener('click', printFinAnalysis);
}

// -------- METRICS --------

const COFFEE_ITEM_PATTERN = /\b(cafe|coffee|espresso|ristretto|americano|cortado|macchiato|capuccino|cappuccino|latte|flat\s*white|mocca|mocha|cold\s*brew|nitro|frappe|frappuccino|affogato|v60|chemex|aeropress|batch\s*brew|filter\s*coffee|cafe\s*filtrado)\b/i;
const NON_FOOD_ITEM_PATTERN = /\b(agua|water|refresco|soda|cola|fanta|sprite|zumo|jugo|juice|cerveza|beer|vino|wine|te|matcha|chai|leche|milk|bebida|drink|kombucha|limonada)\b/i;
const FOOD_ITEM_PATTERN = /\b(croissant|cruasan|medialuna|tostad[ao]|toast|sandwich|bocadillo|bagel|cookie|galleta|brownie|muffin|cake|tarta|pastel|bizcocho|boll|roll|rollo|pan|bread|empanada|quiche|ensalada|salad|yogur|yogurt|granola|avocado|aguacate|jamon|queso|cheese|comida|food|brunch|desayuno|breakfast|pasteleria|bakery|dulce|salado|focaccia|pizza|tortilla|huevo|egg|waffle|gofre|pancake|crepe|donut|dona|alfajor|barrita|snack|fruta|fruit|banana|platano)\b/i;

function normalizeItemText(item) {
  return itemName(item).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function isCoffeeItem(item) {
  return COFFEE_ITEM_PATTERN.test(normalizeItemText(item));
}

function isFoodItem(item) {
  const name = normalizeItemText(item);
  if (!name || COFFEE_ITEM_PATTERN.test(name) || NON_FOOD_ITEM_PATTERN.test(name)) return false;
  return FOOD_ITEM_PATTERN.test(name);
}

function calculateCrossSelling(sales) {
  let coffeeQty = 0;
  let pairedFoodQty = 0;
  let ticketsWithDetail = 0;

  sales.forEach((sale) => {
    const items = Array.isArray(sale.items) ? sale.items : [];
    if (!items.length) return;
    ticketsWithDetail += 1;
    const ticketCoffeeQty = items.filter(isCoffeeItem).reduce((sum, item) => sum + itemQuantity(item), 0);
    if (ticketCoffeeQty <= 0) return;
    coffeeQty += ticketCoffeeQty;
    pairedFoodQty += items.filter(isFoodItem).reduce((sum, item) => sum + itemQuantity(item), 0);
  });

  return {
    coffeeQty,
    pairedFoodQty,
    ticketsWithDetail,
    coffeesPerFood: pairedFoodQty > 0 ? coffeeQty / pairedFoodQty : 0,
  };
}

function formatCrossSelling(metric) {
  if (!metric?.ticketsWithDetail) return '—';
  if (!metric.coffeeQty) return '0 cafés';
  if (!metric.pairedFoodQty) return '0 alimentos';
  const ratio = metric.coffeesPerFood;
  const value = ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1).replace('.', ',');
  return `1 cada ${value} cafés`;
}

function calcDayMetrics(date) {
  const sales = getLocationSales().filter((s) => s.date === date);
  const expenses = getLocationExpenses().filter((e) => e.date === date);
  const totalSales = sales.reduce((s, t) => s + t.total, 0);
  const ticketCount = sales.reduce((s, t) => s + (t.count || 1), 0);
  const avgTicket = ticketCount > 0 ? totalSales / ticketCount : 0;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const itemCounts = {};
  sales.forEach((sale) => {
    (sale.items || []).forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
    });
  });
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const pairCounts = {};
  sales.forEach((sale) => {
    const names = [...new Set((sale.items || []).map((i) => i.name))];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const pair = [names[i], names[j]].sort().join(' + ');
        pairCounts[pair] = (pairCounts[pair] || 0) + 1;
      }
    }
  });
  const topPairs = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const crossSelling = calculateCrossSelling(sales);
  return { totalSales, ticketCount, avgTicket, totalExpenses, result: totalSales - totalExpenses, topItems, topPairs, crossSelling };
}

function groupSalesByDate() {
  const map = {};
  getLocationSales().forEach((s) => {
    if (!map[s.date]) map[s.date] = [];
    map[s.date].push(s);
  });
  return map;
}

// -------- EXPORTS --------

function exportMonthlyCsv() {
  const rows = [['Fecha', 'Ventas', 'Tickets', 'Ticket promedio', 'Gastos', 'Resultado']];
  let totS = 0, totT = 0, totE = 0;
  getMonthDays(finActiveMonth).forEach((date) => {
    const dk = toDateInput(date);
    const m = calcDayMetrics(dk);
    totS += m.totalSales; totT += m.ticketCount; totE += m.totalExpenses;
    rows.push([dk, m.totalSales.toFixed(2), m.ticketCount, m.ticketCount ? m.avgTicket.toFixed(2) : '', m.totalExpenses.toFixed(2), (m.totalSales - m.totalExpenses).toFixed(2)]);
  });
  rows.push(['TOTAL', totS.toFixed(2), totT, totT ? (totS / totT).toFixed(2) : '', totE.toFixed(2), (totS - totE).toFixed(2)]);
  downloadCsv(rows, `oss-finanzas-${activeLocationId}-${monthInputValue(finActiveMonth)}.csv`);
}

function exportPnlCsv() {
  const catIds = EXPENSE_CATEGORIES.map((c) => c.id);
  const catLabels = EXPENSE_CATEGORIES.map((c) => c.label);
  const rows = [['Mes', 'Ventas', ...catLabels, 'Total gastos', 'Resultado']];
  const locationSales = getLocationSales();
  const locationExpenses = getLocationExpenses();
  MONTH_NAMES.forEach((name, mi) => {
    const mk = `${finPnlYear}-${String(mi + 1).padStart(2, '0')}`;
    const mSales = locationSales.filter((s) => s.date.startsWith(mk)).reduce((s, t) => s + t.total, 0);
    const byCat = {};
    catIds.forEach((id) => { byCat[id] = 0; });
    locationExpenses.filter((e) => e.date.startsWith(mk)).forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    const mExp = catIds.reduce((s, id) => s + byCat[id], 0);
    rows.push([name, mSales.toFixed(2), ...catIds.map((id) => byCat[id].toFixed(2)), mExp.toFixed(2), (mSales - mExp).toFixed(2)]);
  });
  downloadCsv(rows, `oss-pnl-${activeLocationId}-${finPnlYear}.csv`);
}

function downloadCsv(rows, filename) {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// -------- HELPERS --------

function formatEur(value) {
  return Number(value).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
