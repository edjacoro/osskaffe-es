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

const EMPLOYEES = [
  {
    id: "chelo",
    label: "Chelo",
    role: "Encargado",
    color: "#416877",
  },
  {
    id: "sebastian",
    label: "Sebastian",
    role: "Barista",
    color: "#2d4f5c",
  },
  {
    id: "third",
    label: "Paloma",
    role: "Barista",
    color: "#c46d47",
  },
  {
    id: "pablo",
    label: "Pablo",
    role: "Cobertura dueno",
    color: "#8a4a2f",
  },
];

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

const DEFAULT_STATE = {
  punches: [],
  changes: [],
  trafficData: [],
  profiles: {},
  sales: [],
  expenses: [],
  contracts: {},
  budgets: {},
  settings: {
    adminEmail: "",
    storeLat: "",
    storeLng: "",
    geoRadius: 120,
    lateTolerance: 5,
    adminPin: "0000",
    palomaLeaveDate: "2026-07-01",
    holidaySeedVersion: HOLIDAY_SEED_VERSION,
    holidays: DEFAULT_HOLIDAYS_2026,
  },
};

let state = loadState();
let activeMonth = firstDayOfMonth(new Date());
let appRole = null;
let activeEmployeeId = null;
let adminInited = false;
let empEventsInited = false;
let activeFichasTab = 'fichas';

const els = {
  monthTitle: document.querySelector("#monthTitle"),
  monthPicker: document.querySelector("#monthPicker"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  exportCsv: document.querySelector("#exportCsv"),
  printPdf: document.querySelector("#printPdf"),
  employeeLegend: document.querySelector("#employeeLegend"),
  scheduleTable: document.querySelector("#scheduleTable"),
  plannedHours: document.querySelector("#plannedHours"),
  realHours: document.querySelector("#realHours"),
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
};

startApp();

function startApp() {
  initRoleScreen();
}

function init() {
  // Migrate state: ensure new keys exist for older stored data
  if (!state.contracts) state.contracts = {};
  if (!state.budgets)   state.budgets   = {};
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
    state.sales    = [...state.sales.filter(s    => !s.id?.startsWith('hist-')), ...hist.sales];
    state.expenses = [...state.expenses.filter(e => !e.id?.startsWith('hist-')), ...hist.expenses];
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
    render();
  });

  els.nextMonth.addEventListener("click", () => {
    activeMonth = addMonths(activeMonth, 1);
    render();
  });

  els.monthPicker.addEventListener("change", (event) => {
    if (!event.target.value) return;
    const [year, month] = event.target.value.split("-").map(Number);
    activeMonth = new Date(year, month - 1, 1);
    render();
  });

  els.exportCsv.addEventListener("click", exportCsv);
  els.printPdf.addEventListener("click", () => window.print());
  els.punchForm.addEventListener("submit", handlePunch);
  els.mockOnTime.addEventListener("click", createMockPunches);
  els.emailLateReport.addEventListener("click", sendLateReport);
  els.changeForm.addEventListener("submit", handleChangeRequest);
  els.trafficForm.addEventListener("submit", handleTrafficImport);
  els.loadTrafficSample.addEventListener("click", loadTrafficSample);
  els.saveSettings.addEventListener("click", saveSettings);
  els.addHoliday.addEventListener("click", addHoliday);
}

function populateSelectors() {
  const employeeOptions = EMPLOYEES.map((employee) => {
    return `<option value="${employee.id}">${employee.label} - ${employee.role}</option>`;
  }).join("");

  els.punchEmployee.innerHTML = employeeOptions;
  els.changeEmployee.innerHTML = employeeOptions;
  els.replacementEmployee.innerHTML = [
    `<option value="">Sin reemplazo</option>`,
    ...EMPLOYEES.map((employee) => `<option value="${employee.id}">${employee.label}</option>`),
  ].join("");
}

function setTodayDefaults() {
  const today = toDateInput(new Date());
  els.changeDate.value = today;
  els.holidayDate.value = today;
  document.querySelector('#finExpDate').value = today;
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
  els.monthTitle.textContent = `Grilla de ${MONTH_NAMES[month]} ${year}`;
  els.monthPicker.value = `${year}-${String(month + 1).padStart(2, "0")}`;

  renderLegend();
  renderSchedule();
  renderMetrics();
  renderPunches();
  renderChanges();
  renderTraffic();
  renderHolidays();
  renderAdminFichas();
  renderContratosPanel();
  renderFinanzas();
  saveState();
}

function renderLegend() {
  els.employeeLegend.innerHTML = EMPLOYEES.map((employee) => {
    return `
      <span class="legend-item">
        <span class="legend-swatch" style="background:${employee.color}"></span>
        ${employee.label}
      </span>
    `;
  }).join("");
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
  const shifts = getShiftsForDate(dateKey);
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
    <div class="${rowClasses}" style="min-height:${height}px">
      <div class="day-info">
        <span class="day-name">${DAY_NAMES[day]} ${date.getDate()}</span>
        <span class="day-meta">${holiday ? `${holiday.name || "Feriado"} ${holiday.open}-${holiday.close}` : getOpenLabel(day)}</span>
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
    return sum + getShiftsForDate(dateKey).reduce((daySum, shift) => daySum + shift.end - shift.start, 0);
  }, 0);
  const real = getRealHoursForMonth(activeMonth);
  const pending = state.changes.filter((change) => change.status === "pending").length;
  const suggestions = getSuggestions();

  els.plannedHours.textContent = formatHours(planned);
  els.realHours.textContent = formatHours(real);
  els.pendingCount.textContent = String(pending);
  els.suggestionCount.textContent = String(suggestions.length);
}

function renderPunches() {
  const punches = state.punches
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
        <article class="event-item">
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
  const pending = state.changes.filter((change) => change.status === "pending").length;
  els.approvalSummary.textContent = `${pending} pendientes`;

  if (!state.changes.length) {
    renderEmpty(els.changeList);
    return;
  }

  els.changeList.innerHTML = state.changes
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
  const suggestions = getSuggestions();
  els.trafficSummary.textContent = state.trafficData.length ? `${state.trafficData.length} franjas cargadas` : "Sin datos";

  if (!suggestions.length) {
    renderEmpty(els.suggestionList);
    return;
  }

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
  const holidays = state.settings.holidays || [];
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
      state.settings.holidays = state.settings.holidays.filter((holiday) => holiday.date !== button.dataset.removeHoliday);
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
    date: els.changeDate.value,
    employeeId: els.changeAction.value === "owner" ? "pablo" : els.changeEmployee.value,
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
    return change.id === id ? { ...change, status, reviewedAt: new Date().toISOString(), reviewedBy: "Pablo" } : change;
  });
  render();
}

function handleTrafficImport(event) {
  event.preventDefault();
  const rows = parseTrafficCsv(els.trafficCsv.value);
  state.trafficData = rows;
  render();
}

function loadTrafficSample() {
  const days = getMonthDays(activeMonth);
  const rows = [];
  days.forEach((date) => {
    const day = date.getDay();
    const dateKey = toDateInput(date);
    if (day === 6 || day === 0) {
      rows.push({ date: dateKey, hour: 12, visitors: 44 });
      rows.push({ date: dateKey, hour: 13, visitors: 58 });
      rows.push({ date: dateKey, hour: 16, visitors: 38 });
    }
    if (day === 5) {
      rows.push({ date: dateKey, hour: 13, visitors: 42 });
      rows.push({ date: dateKey, hour: 18, visitors: 36 });
    }
  });
  state.trafficData = rows;
  els.trafficCsv.value = stringifyTraffic(rows);
  render();
}

function saveSettings() {
  state.settings.adminEmail = els.adminEmail.value.trim();
  state.settings.storeLat = els.storeLat.value.trim();
  state.settings.storeLng = els.storeLng.value.trim();
  state.settings.geoRadius = Number(els.geoRadius.value || 120);
  state.settings.lateTolerance = Number(els.lateTolerance.value || 5);
  render();
}

function hydrateSettingsForm() {
  els.adminEmail.value = state.settings.adminEmail || "";
  els.storeLat.value = state.settings.storeLat || "";
  els.storeLng.value = state.settings.storeLng || "";
  els.geoRadius.value = state.settings.geoRadius || 120;
  els.lateTolerance.value = state.settings.lateTolerance || 5;
}

function addHoliday() {
  if (!els.holidayDate.value) return;
  const nextHoliday = {
    date: els.holidayDate.value,
    name: els.holidayName.value.trim() || "Feriado",
    open: els.holidayOpen.value || "10:00",
    close: els.holidayClose.value || "19:00",
  };

  state.settings.holidays = [
    ...state.settings.holidays.filter((holiday) => holiday.date !== nextHoliday.date),
    nextHoliday,
  ];
  els.holidayName.value = "";
  render();
}

function sendLateReport() {
  const email = state.settings.adminEmail || els.adminEmail.value.trim();
  if (!email) {
    setActiveTab("settings");
    els.adminEmail.focus();
    return;
  }

  const monthKey = monthInputValue(activeMonth);
  const flagged = state.punches.filter((punch) => {
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

  const subject = `Reporte de fichajes Oss Barcelona ${monthKey}`;
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

  if (day >= 1 && day <= 5) {
    shifts.push(makeShift("chelo", 14, 20, "base"));
  }

  if (day >= 3 && day <= 5) {
    shifts.push(makeShift("sebastian", 8, 14, "base"));
  }
  if (day === 6) {
    shifts.push(makeShift("sebastian", 8.5, 14.5, "base"));
  }
  if (day === 0) {
    shifts.push(makeShift("sebastian", 9.5, 14.5, "base"));
  }

  if (day === 1 || day === 2) {
    shifts.push(makeShift("third", 8, 14, "base"));
  }
  if (day === 6 || day === 0) {
    shifts.push(makeShift("third", 12, 20, "base"));
  }

  return shifts;
}

function getShiftsForDate(dateKey) {
  let shifts = getBaseShifts(dateKey);
  const approved = state.changes.filter((change) => change.date === dateKey && change.status === "approved");

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

    if (change.action === "owner") {
      shifts.push(makeShift("pablo", start, end, "cobertura"));
    }
  });

  return shifts.sort((a, b) => a.start - b.start || a.end - b.end);
}

function getOpenLabel(day) {
  const hours = getRegularOpeningHours(day);
  return `${formatHour(hours.open)}-${formatHour(hours.close)} local`;
}

function getRegularOpeningHours(day) {
  if (day === 6) return { open: 9, close: 19 };
  if (day === 0) return { open: 10, close: 19 };
  return { open: 8.5, close: 19 };
}

function getHoliday(dateKey) {
  return state.settings.holidays.find((holiday) => holiday.date === dateKey);
}

function makeShift(employeeId, start, end, source) {
  return { id: createId(), employeeId, start, end, source };
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

function getEmployee(id, dateKey) {
  const employee = EMPLOYEES.find((item) => item.id === id) || EMPLOYEES[0];
  if (employee.id !== "third") return employee;
  const label = dateKey >= state.settings.palomaLeaveDate ? "Reemplazo Paloma" : "Paloma";
  return { ...employee, label };
}

function getPunchStatus(employeeId, dateKey, timestamp, geoResult) {
  if (geoResult.status === "outside") return "outside";
  const shift = getShiftsForDate(dateKey)
    .filter((item) => item.employeeId === employeeId)
    .sort((a, b) => a.start - b.start)[0];

  if (!shift) return geoResult.status;
  const scheduledStart = dateWithTime(dateKey, shift.start);
  const tolerance = Number(state.settings.lateTolerance || 5) * 60 * 1000;
  return timestamp.getTime() > scheduledStart.getTime() + tolerance ? "late" : geoResult.status;
}

function getRealHoursForMonth(monthDate) {
  const monthKey = monthInputValue(monthDate);
  const punches = state.punches
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

function getSuggestions() {
  const threshold = Number(els.visitorThreshold?.value || 24);
  const minimumVisitors = Number(els.minimumVisitors?.value || 32);
  const monthKey = monthInputValue(activeMonth);

  return state.trafficData
    .filter((item) => item.date.startsWith(monthKey))
    .map((item) => {
      const hour = Number(item.hour);
      const staffCount = getShiftsForDate(item.date).filter((shift) => shift.start <= hour && shift.end > hour).length;
      const recommendedStaff = Math.max(1, Math.ceil(Number(item.visitors) / threshold));
      return {
        ...item,
        staffCount,
        recommendedStaff,
        missing: Math.max(0, recommendedStaff - staffCount),
      };
    })
    .filter((item) => Number(item.visitors) >= minimumVisitors && item.missing > 0)
    .sort((a, b) => b.missing - a.missing || b.visitors - a.visitors)
    .slice(0, 20);
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

  const lat = Number(state.settings.storeLat);
  const lng = Number(state.settings.storeLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      status: "ok",
      label: `${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)}`,
      message: "Ubicacion tomada. Configura coordenadas del local para validar radio.",
    };
  }

  const distance = distanceInMeters(lat, lng, geo.latitude, geo.longitude);
  const radius = Number(state.settings.geoRadius || 120);
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

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mergeState(base, saved) {
  return {
    ...structuredClone(base),
    ...saved,
    profiles: { ...base.profiles, ...(saved.profiles || {}) },
    settings: {
      ...base.settings,
      ...(saved.settings || {}),
      holidays: saved.settings?.holidays || base.settings.holidays,
    },
  };
}

function seedDefaultHolidays(nextState) {
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

function renderEmpty(container) {
  container.innerHTML = document.querySelector("#emptyTemplate").innerHTML;
}

function actionLabel(action) {
  const labels = {
    absence: "Quitar turno",
    replace: "Reemplazo",
    extra: "Extra",
    owner: "Cobertura Pablo",
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
  empButtons.innerHTML = EMPLOYEES.filter((e) => e.id !== "pablo")
    .map(
      (e) =>
        `<button class="role-btn" data-emp-id="${e.id}" style="background:${e.color}" type="button">${e.label}</button>`,
    )
    .join("");

  document.querySelector("#chooseEmployee").addEventListener("click", () => {
    document.querySelector("#roleStep1").hidden = true;
    document.querySelector("#roleStepEmployee").hidden = false;
  });

  document.querySelector("#chooseAdmin").addEventListener("click", () => {
    document.querySelector("#roleStep1").hidden = true;
    document.querySelector("#roleStepAdmin").hidden = false;
    document.querySelector("#adminPinInput").focus();
  });

  empButtons.querySelectorAll("[data-emp-id]").forEach((btn) => {
    btn.addEventListener("click", () => setEmployeeMode(btn.dataset.empId));
  });

  document.querySelector("#submitPin").addEventListener("click", tryAdminPin);
  document.querySelector("#adminPinInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryAdminPin();
  });

  document.querySelector("#backToStep1a").addEventListener("click", () => {
    document.querySelector("#roleStepEmployee").hidden = true;
    document.querySelector("#roleStep1").hidden = false;
  });

  document.querySelector("#backToStep1b").addEventListener("click", () => {
    document.querySelector("#roleStepAdmin").hidden = true;
    document.querySelector("#roleStep1").hidden = false;
    document.querySelector("#adminPinInput").value = "";
    document.querySelector("#pinError").hidden = true;
  });

  document.querySelector("#adminExit").addEventListener("click", exitToRoleScreen);
}

function tryAdminPin() {
  const pin = document.querySelector("#adminPinInput").value;
  const correct = state.settings.adminPin || "0000";
  if (pin === correct) {
    setAdminMode();
  } else {
    document.querySelector("#pinError").hidden = false;
    document.querySelector("#adminPinInput").value = "";
    document.querySelector("#adminPinInput").focus();
  }
}

function setAdminMode() {
  appRole = "admin";
  document.querySelector("#role-screen").hidden = true;
  document.querySelector("#employee-app").hidden = true;
  document.querySelector(".app-shell").hidden = false;
  if (!adminInited) {
    adminInited = true;
    init();
  } else {
    render();
  }
}

function setEmployeeMode(employeeId) {
  appRole = "employee";
  activeEmployeeId = employeeId;
  document.querySelector("#role-screen").hidden = true;
  document.querySelector(".app-shell").hidden = true;
  document.querySelector("#employee-app").hidden = false;

  const employee = EMPLOYEES.find((e) => e.id === employeeId);
  document.querySelector("#empGreeting").textContent = `Hola, ${employee.label}`;
  document.querySelector("#empPunchWho").textContent = `Fichando como ${employee.label}`;

  if (!empEventsInited) {
    empEventsInited = true;
    bindEmployeeEvents();
  }

  renderEmployeeView();
}

function exitToRoleScreen() {
  appRole = null;
  activeEmployeeId = null;
  document.querySelector(".app-shell").hidden = true;
  document.querySelector("#employee-app").hidden = true;
  document.querySelector("#roleStep1").hidden = false;
  document.querySelector("#roleStepEmployee").hidden = true;
  document.querySelector("#roleStepAdmin").hidden = true;
  document.querySelector("#adminPinInput").value = "";
  document.querySelector("#pinError").hidden = true;
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
  document.querySelector("#empChangeForm").addEventListener("submit", handleEmpChangeForm);

  document.querySelector("#empPrevMonth").addEventListener("click", () => {
    activeMonth = addMonths(activeMonth, -1);
    renderEmpSchedule();
  });
  document.querySelector("#empNextMonth").addEventListener("click", () => {
    activeMonth = addMonths(activeMonth, 1);
    renderEmpSchedule();
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
        <article class="event-item">
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

// ===========================
// EMPLOYEE PROFILE
// ===========================

function getProfile(employeeId) {
  return state.profiles[employeeId] || {};
}

function saveProfileData(employeeId, data) {
  state.profiles[employeeId] = { ...getProfile(employeeId), ...data };
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
      renderContratosPanel();
    });
  });
}

function getEmployeeHoursForMonth(employeeId, monthDate) {
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
  const punches = state.punches
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

function getEmployeeHolidayHoursForMonth(employeeId, monthDate, holidayDates) {
  // holidayDates: Set of 'YYYY-MM-DD' strings
  if (!holidayDates || !holidayDates.size) return 0;
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
  const punches = state.punches
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

function renderContratosPanel() {
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

  const rows = EMPLOYEES.map((emp) => {
    const c = state.contracts[emp.id] || {};
    const hpw  = c.hoursPerWeek       ?? 40;
    const rate = c.hourlyRate         ?? 0;
    const mult = c.overtimeMultiplier ?? 1.25;

    const contracted   = hpw * monthFactor;
    const real         = getEmployeeHoursForMonth(emp.id, finActiveMonth);
    const importeReal  = real * rate; // € totales por las horas trabajadas
    const diff         = real - contracted;
    const otHours      = Math.max(0, diff);
    const otCost       = otHours * rate * mult;
    const holHours     = getEmployeeHolidayHoursForMonth(emp.id, finActiveMonth, holidayDates);

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
      <td><input class="contratos-input" type="number" min="1" max="3" step="0.05"
        value="${mult}" data-contract="${emp.id}" data-field="overtimeMultiplier" /></td>
      <td class="fin-cell-num">${contracted.toFixed(1)} h</td>
      <td class="fin-cell-num">${real > 0 ? real.toFixed(1) + ' h' : '—'}</td>
      <td class="fin-cell-num">${real > 0 && rate > 0 ? formatEur(importeReal) : '—'}</td>
      <td class="fin-cell-num ${diffClass}">${real > 0 ? diffStr : '—'}</td>
      <td class="fin-cell-num">${otHours > 0.05 ? otHours.toFixed(1) + ' h' : '—'}</td>
      <td class="fin-cell-num">${otHours > 0.05 && rate > 0 ? formatEur(otCost) : otHours > 0.05 ? '<span class="form-note">sin tarifa</span>' : '—'}</td>
      <td class="fin-cell-num">${holHours > 0.05 ? holHours.toFixed(1) + ' h' : '—'}</td>
    </tr>`;
  }).join('');

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

function renderAdminFichas() {
  const container = document.querySelector("#fichasGrid");
  if (!container) return;

  const fields = [
    { key: "fullName", label: "Nombre completo" },
    { key: "phone", label: "Teléfono" },
    { key: "email", label: "Email" },
    { key: "address", label: "Dirección" },
    { key: "dni", label: "DNI / NIE" },
    { key: "ssNumber", label: "N° Seg. Social" },
    { key: "iban", label: "IBAN" },
    { key: "contractType", label: "Contrato" },
    { key: "startDate", label: "Fecha inicio" },
    { key: "emergencyName", label: "Urgencia nombre" },
    { key: "emergencyPhone", label: "Urgencia tel" },
  ];

  container.innerHTML = EMPLOYEES.map((emp) => {
    const profile = getProfile(emp.id);
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
      <div class="ficha-card">
        <div class="ficha-header" style="background:${emp.color}">
          <div class="ficha-name">${emp.label}</div>
          <div class="ficha-role">${emp.role}</div>
        </div>
        <div class="ficha-body">${rows}</div>
        <div class="ficha-admin-notes">
          <label style="display:block;font-size:0.8rem;font-weight:800;color:var(--muted)">Nota interna (solo admin)</label>
          <textarea class="ficha-notes-input" data-emp="${emp.id}" rows="2" placeholder="Observaciones, documentación pendiente...">${escapeHtml(profile.adminNotes || "")}</textarea>
          <button class="mini-button" style="margin-top:6px" type="button" data-save-notes="${emp.id}">Guardar nota</button>
        </div>
      </div>`;
  }).join("");

  container.querySelectorAll("[data-save-notes]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.saveNotes;
      const notes = container.querySelector(`.ficha-notes-input[data-emp="${id}"]`).value;
      saveProfileData(id, { adminNotes: notes });
      btn.textContent = "Guardado";
      setTimeout(() => { btn.textContent = "Guardar nota"; }, 1500);
    });
  });
}

function handleEmpChangeForm(event) {
  event.preventDefault();
  state.changes.push({
    id: createId(),
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

let activeFinTab = 'hoy';
let finActiveMonth = firstDayOfMonth(new Date()); // mes propio de Finanzas (independiente de la grilla)
let finPnlYear = new Date().getFullYear();
let finPendingFile = null;   // archivo xlsx/csv seleccionado pendiente de importar
let finEditingExpenseId = null; // id del gasto en edición (null = modo creación)
const BISTROSOFT_SYNC_INTERVAL_MS = 30000;
const BISTROSOFT_RECENT_DAYS = 7;
let finBistroSync = {
  available: null,
  connected: false,
  syncing: false,
  lastSyncAt: null,
  lastRange: null,
  lastCount: 0,
  error: null,
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
  document.querySelector('#finSyncNow').addEventListener('click', () => syncBistrosoftMonth(false));

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
      state.sales = [];
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

  initBistrosoftSync();
}

async function initBistrosoftSync() {
  renderFinSyncStatus();

  try {
    const response = await fetch('/api/bistrosoft/status', { cache: 'no-store' });
    if (!response.ok) throw new Error('Servidor local no disponible');

    const status = await response.json();
    finBistroSync.available = !!status.configured;
    finBistroSync.connected = !!status.connected;
    finBistroSync.lastSyncAt = status.lastSyncAt || null;
    finBistroSync.error = status.lastError || null;
    renderFinSyncStatus();

    if (!finBistroSync.available) return;
    await syncBistrosoftMonth(true);

    if (!finBistroSync.timer) {
      finBistroSync.timer = setInterval(() => syncBistrosoftRecent(), BISTROSOFT_SYNC_INTERVAL_MS);
    }
  } catch (_) {
    finBistroSync.available = false;
    finBistroSync.connected = false;
    finBistroSync.error = 'Abrir la aplicacion con iniciar-app.cmd para activar la sincronizacion.';
    renderFinSyncStatus();
  }
}

function syncBistrosoftMonth(silent = true) {
  if (!finBistroSync.available) return Promise.resolve();
  const from = toDateInput(new Date(finActiveMonth.getFullYear(), finActiveMonth.getMonth(), 1));
  const until = toDateInput(new Date(finActiveMonth.getFullYear(), finActiveMonth.getMonth() + 1, 1));
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
  renderFinSyncStatus();

  try {
    const query = new URLSearchParams({ from, until });
    const response = await fetch(`/api/bistrosoft/sales?${query}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.ok || !Array.isArray(payload.sales)) {
      throw new Error(payload.error || 'Bistrosoft no respondio correctamente');
    }

    const imported = payload.sales.filter((sale) =>
      sale && typeof sale.date === 'string' && Number.isFinite(Number(sale.total))
    );

    state.sales = [
      ...state.sales.filter((sale) => !(sale.date >= from && sale.date < until)),
      ...imported,
    ];

    finBistroSync.available = true;
    finBistroSync.connected = true;
    finBistroSync.lastSyncAt = payload.fetchedAt || new Date().toISOString();
    finBistroSync.lastRange = { from, until };
    finBistroSync.lastCount = imported.length;
    finBistroSync.error = null;
    saveState();
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

function renderFinSyncStatus() {
  const bar = document.querySelector('#finBistroSync');
  const title = document.querySelector('#finSyncTitle');
  const detail = document.querySelector('#finSyncDetail');
  const button = document.querySelector('#finSyncNow');
  if (!bar || !title || !detail || !button) return;

  bar.classList.toggle('is-connected', finBistroSync.connected && !finBistroSync.syncing);
  bar.classList.toggle('is-syncing', finBistroSync.syncing);
  bar.classList.toggle('is-error', !!finBistroSync.error && !finBistroSync.syncing);
  button.disabled = finBistroSync.syncing || finBistroSync.available === false;

  if (finBistroSync.syncing) {
    title.textContent = 'Sincronizando Bistrosoft...';
    detail.textContent = 'Leyendo las ventas del periodo seleccionado.';
    return;
  }

  if (finBistroSync.available === false) {
    title.textContent = 'Bistrosoft sin conexion automatica';
    detail.textContent = finBistroSync.error || 'Abrir la aplicacion con iniciar-app.cmd.';
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
    title.textContent = 'Bistrosoft conectado';
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
}

function renderFinMonthNav() {
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
  else if (activeFinTab === 'diferidos') renderFinDiferidos();
  else if (activeFinTab === 'monthly') renderFinMonthly();
  else if (activeFinTab === 'pnl') renderFinPnl();
  else if (activeFinTab === 'presupuesto') renderFinPresupuesto();
}

// -------- HOY --------

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
  const totalTicketCount = state.sales.reduce((s, t) => s + (t.count || 1), 0);
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
    const sourceLabel = isBistrosoft ? 'Bistrosoft' : isSummary ? 'resumen diario' : '';
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
      state.sales = state.sales.filter((s) => s.date !== btn.dataset.deleteDay);
      render();
    });
  });
}

// -------- EXPENSES --------

function renderFinExpenses() {
  const expenses = state.expenses.slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const monthTotal = state.expenses
    .filter((e) => e.date.startsWith(monthInputValue(finActiveMonth)))
    .reduce((s, e) => s + e.amount, 0);

  document.querySelector('#finExpSummary').textContent = `${MONTH_NAMES[finActiveMonth.getMonth()]}: ${formatEur(monthTotal)}`;

  const list = document.querySelector('#finExpenseList');
  if (!expenses.length) { renderEmpty(list); return; }

  const isAdmin = typeof appRole !== 'undefined' && appRole === 'admin';

  list.innerHTML = expenses.slice(0, 60).map((exp) => {
    const catLabel = EXPENSE_CATEGORIES.find((c) => c.id === exp.category)?.label || exp.category;
    const tcBadge = exp.isDiferido ? `<span class="fin-tc-badge">TC · vence ${formatHumanDate(exp.dueDate)}</span>` : '';
    return `
      <article class="event-item${exp.isDiferido ? ' fin-item-tc' : ''}">
        <div class="event-topline">
          <span>${catLabel}${exp.supplier ? ' · ' + escapeHtml(exp.supplier) : ''}${tcBadge}</span>
          <span class="status-pill status-rejected">${formatEur(exp.amount)}</span>
        </div>
        <div class="event-meta">${formatHumanDate(exp.date)}${exp.description ? ' · ' + escapeHtml(exp.description) : ''}</div>
        <div class="event-actions">
          ${isAdmin ? `<button class="mini-button" type="button" data-edit-expense="${exp.id}">Editar</button>` : ''}
          <button class="mini-button danger" type="button" data-delete-expense="${exp.id}">Borrar</button>
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

function startEditExpense(id) {
  const exp = state.expenses.find((e) => e.id === id);
  if (!exp) return;
  finEditingExpenseId = id;

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

  document.querySelector('#finExpFormTitle').textContent = 'Editar gasto';
  document.querySelector('#finExpSubmitBtn').textContent = 'Guardar cambios';
  document.querySelector('#finExpCancelEdit').style.display = '';

  // Scroll al formulario
  document.querySelector('#finExpenseForm').scrollIntoView({ behavior: 'smooth' });
}

function resetExpenseForm() {
  finEditingExpenseId = null;
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
  const diferidos = state.expenses
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
        e.isDiferido && e.dueDate === key ? { ...e, dueDate: yStr } : e
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
  const budget   = (state.budgets || {})[monthKey] || {};
  const monthExp = state.expenses.filter((e) => e.date.startsWith(monthKey));

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

    if (real === 0 && bgt === 0) return ''; // ocultar filas vacías sin datos ni presupuesto

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
}

// -------- P&L --------

function renderFinPnl() {
  document.querySelector('#finPnlYear').textContent = finPnlYear;
  const catIds = EXPENSE_CATEGORIES.map((c) => c.id);
  const yearTotByCat = {};
  catIds.forEach((id) => { yearTotByCat[id] = 0; });
  let yearTotSales = 0, yearTotExp = 0;

  const rows = MONTH_NAMES.map((monthName, mi) => {
    const monthKey = `${finPnlYear}-${String(mi + 1).padStart(2, '0')}`;
    const mSales = state.sales.filter((s) => s.date.startsWith(monthKey)).reduce((s, t) => s + t.total, 0);
    const byCat = {};
    catIds.forEach((id) => { byCat[id] = 0; });
    // Para gastos diferidos TC usar dueDate; para el resto usar date
    state.expenses.filter((e) => {
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
  state.sales = [...state.sales.filter((s) => !dates.includes(s.date)), ...imported];

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
      t.items.push({ name, qty, price });
      t.total += lineTotal || price * qty;
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

  if (!state.budgets) state.budgets = {};
  const budget = state.budgets[monthKey] || {};

  // Gastos reales del mes por categoría
  const realExp = {};
  state.expenses
    .filter((e) => e.date.startsWith(monthKey))
    .forEach((e) => { realExp[e.category] = (realExp[e.category] || 0) + e.amount; });

  // Ventas reales
  const realSales    = state.sales.filter((s) => s.date.startsWith(monthKey)).reduce((s, t) => s + t.total, 0);
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
      if (!state.budgets[month]) state.budgets[month] = {};
      if (val > 0) state.budgets[month][key] = val;
      else         delete state.budgets[month][key];
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
  state.sales.forEach((s) => monthSet.add(s.date.slice(0, 7)));
  state.expenses.forEach((e) => monthSet.add(e.date.slice(0, 7)));
  const months = [...monthSet].sort();

  if (months.length === 0) {
    el.innerHTML = '<p style="color:var(--muted);padding:20px">Sin datos cargados todavía.</p>';
    return;
  }

  // Calcular métricas por mes
  const data = months.map((ym) => {
    const [y, m] = ym.split('-').map(Number);
    const sales    = state.sales.filter((s) => s.date.startsWith(ym));
    const expenses = state.expenses.filter((e) => e.date.startsWith(ym));
    const totalSales    = sales.reduce((s, t) => s + t.total, 0);
    const totalTickets  = sales.reduce((s, t) => s + (t.count || 1), 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const resultado     = totalSales - totalExpenses;
    const margen        = totalSales > 0 ? (resultado / totalSales) * 100 : 0;
    const avgTicket     = totalTickets > 0 ? totalSales / totalTickets : 0;
    const daysWithSales = new Set(sales.map((s) => s.date)).size;
    const ticketsPerDay = daysWithSales > 0 ? totalTickets / daysWithSales : 0;
    const salesPerDay   = daysWithSales > 0 ? totalSales   / daysWithSales : 0;
    return { ym, year: y, month: m - 1, totalSales, totalTickets, totalExpenses, resultado, margen, avgTicket, daysWithSales, ticketsPerDay, salesPerDay };
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
          <td class="fin-cell-num">${formatEur(allExp)}</td>
          <td class="fin-cell-num ${allResClass}">${(allRes >= 0 ? '+' : '') + formatEur(allRes)}</td>
          <td class="fin-cell-num ${allResClass}">${allMargen.toFixed(1)}%</td>
        </tr></tfoot>
      </table>
    </div>`;
}

// -------- METRICS --------

function calcDayMetrics(date) {
  const sales = state.sales.filter((s) => s.date === date);
  const expenses = state.expenses.filter((e) => e.date === date);
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

  return { totalSales, ticketCount, avgTicket, totalExpenses, result: totalSales - totalExpenses, topItems, topPairs };
}

function groupSalesByDate() {
  const map = {};
  state.sales.forEach((s) => {
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
  downloadCsv(rows, `oss-finanzas-${monthInputValue(finActiveMonth)}.csv`);
}

function exportPnlCsv() {
  const catIds = EXPENSE_CATEGORIES.map((c) => c.id);
  const catLabels = EXPENSE_CATEGORIES.map((c) => c.label);
  const rows = [['Mes', 'Ventas', ...catLabels, 'Total gastos', 'Resultado']];
  MONTH_NAMES.forEach((name, mi) => {
    const mk = `${finPnlYear}-${String(mi + 1).padStart(2, '0')}`;
    const mSales = state.sales.filter((s) => s.date.startsWith(mk)).reduce((s, t) => s + t.total, 0);
    const byCat = {};
    catIds.forEach((id) => { byCat[id] = 0; });
    state.expenses.filter((e) => e.date.startsWith(mk)).forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    const mExp = catIds.reduce((s, id) => s + byCat[id], 0);
    rows.push([name, mSales.toFixed(2), ...catIds.map((id) => byCat[id].toFixed(2)), mExp.toFixed(2), (mSales - mExp).toFixed(2)]);
  });
  downloadCsv(rows, `oss-pnl-${finPnlYear}.csv`);
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
