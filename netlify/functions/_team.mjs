const LOCATION_IDS = ["barcelona", "madrid"];

export const DEFAULT_TEAM = [
  { id: "chelo", label: "Chelo", role: "Encargado", color: "#416877", active: true, canLogin: true, locationId: "barcelona" },
  { id: "sebastian", label: "Sebastian", role: "Barista", color: "#2d4f5c", active: true, canLogin: true, locationId: "barcelona" },
  { id: "third", label: "Paloma", role: "Barista", color: "#c46d47", active: true, canLogin: true, locationId: "barcelona" },
  { id: "bonnie", label: "Bonnie", role: "Barista", color: "#6f7f46", active: true, canLogin: true, locationId: "madrid" },
  { id: "micaela", label: "Micaela", role: "Encargada", color: "#8d5a73", active: true, canLogin: true, locationId: "madrid" },
  { id: "perla", label: "Perla", role: "Barista", color: "#547f87", active: true, canLogin: true, locationId: "madrid" },
  { id: "guillermo", label: "Guillermo", role: "Barista", color: "#9a7041", active: true, canLogin: true, locationId: "madrid" },
];

function normalizeLocationId(value) {
  return LOCATION_IDS.includes(value) ? value : "barcelona";
}

function validEmployeeId(value) {
  return /^[a-z0-9_-]{1,40}$/i.test(String(value || ""));
}

function validDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function cleanEmployee(input = {}, existing = {}) {
  const id = String(input.id || existing.id || "").trim();
  const label = String(input.label || existing.label || "").trim().slice(0, 80);
  const role = String(input.role || existing.role || "Barista").trim().slice(0, 80);
  const color = /^#[0-9a-f]{6}$/i.test(String(input.color || ""))
    ? String(input.color).toLowerCase()
    : existing.color || "#416877";
  const activeFrom = Object.hasOwn(input, "activeFrom")
    ? (validDateKey(input.activeFrom) ? input.activeFrom : null)
    : (validDateKey(existing.activeFrom) ? existing.activeFrom : null);
  const inactiveFrom = Object.hasOwn(input, "inactiveFrom")
    ? (validDateKey(input.inactiveFrom) ? input.inactiveFrom : null)
    : (validDateKey(existing.inactiveFrom) ? existing.inactiveFrom : null);

  return {
    ...existing,
    id,
    label,
    role,
    color,
    locationId: normalizeLocationId(input.locationId || existing.locationId),
    active: typeof input.active === "boolean" ? input.active : existing.active !== false,
    canLogin: typeof input.canLogin === "boolean" ? input.canLogin : existing.canLogin !== false,
    system: input.system === true || existing.system === true,
    activeFrom,
    inactiveFrom,
  };
}

function cleanNestedRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const clean = JSON.parse(JSON.stringify(value));
  delete clean.password;
  delete clean.passwordHash;
  return clean;
}

export function upsertTeamMemberState(current, body = {}) {
  const incoming = body.employee || {};
  const id = String(incoming.id || "").trim();
  if (!validEmployeeId(id) || id === "pablo") throw new Error("Empleado invalido.");

  const employees = Array.isArray(current?.employees) ? [...current.employees] : [];
  const index = employees.findIndex((employee) => employee.id === id);
  const existing = index >= 0 ? employees[index] : {};
  const employee = cleanEmployee(incoming, existing);
  if (!employee.label) throw new Error("El nombre del empleado es obligatorio.");
  if (employee.inactiveFrom && employee.activeFrom && employee.inactiveFrom < employee.activeFrom) {
    throw new Error("La baja no puede ser anterior a la fecha de alta.");
  }
  if (index >= 0) employees[index] = employee;
  else employees.push(employee);

  const next = { ...(current || {}), employees };
  const profile = cleanNestedRecord(body.profile);
  const baseSchedule = cleanNestedRecord(body.baseSchedule);
  const contract = cleanNestedRecord(body.contract);
  if (profile) {
    next.profiles = {
      ...(current?.profiles || {}),
      [id]: { ...(current?.profiles?.[id] || {}), ...profile, locationId: employee.locationId },
    };
  }
  if (baseSchedule) {
    next.baseSchedules = { ...(current?.baseSchedules || {}), [id]: baseSchedule };
  }
  if (contract) {
    next.contracts = { ...(current?.contracts || {}), [id]: contract };
  }
  return next;
}

export function publicTeamEmployees(state, today = new Date().toISOString().slice(0, 10)) {
  const storedEmployees = Array.isArray(state?.employees) && state.employees.length
    ? state.employees
    : [];
  const byId = new Map(DEFAULT_TEAM.map((employee) => [employee.id, employee]));
  storedEmployees.forEach((employee) => {
    if (!employee?.id || employee.id === "pablo") return;
    byId.set(employee.id, {
      ...(byId.get(employee.id) || {}),
      ...employee,
    });
  });

  return [...byId.values()]
    .filter((employee) => {
      if (employee.canLogin === false) return false;
      if (employee.activeFrom && employee.activeFrom > today) return false;
      return employee.active !== false || (employee.inactiveFrom && employee.inactiveFrom > today);
    })
    .map((employee) => ({
      id: employee.id,
      label: employee.label,
      role: employee.role,
      color: employee.color,
      locationId: normalizeLocationId(employee.locationId),
      active: true,
      canLogin: employee.canLogin !== false,
      system: !!employee.system,
      activeFrom: employee.activeFrom || null,
    }));
}

export function mergeFullStatePreservingTeam(current, submitted) {
  if (!submitted || typeof submitted !== "object") return submitted;
  if (!Array.isArray(current?.employees) || !current.employees.length) return submitted;
  return {
    ...submitted,
    // Altas, nombres y bajas se escriben antes mediante /api/team. Una copia
    // completa y antigua de otro navegador nunca debe borrar ese directorio.
    employees: current.employees,
  };
}
