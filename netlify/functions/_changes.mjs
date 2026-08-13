import { normalizeLocationId } from "./_shared.mjs";

function validId(value) {
  return /^[a-z0-9_-]{1,80}$/i.test(String(value || ""));
}

function validDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validTime(value) {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function employeeLocation(current, employeeId, fallback = "barcelona") {
  const employee = (current?.employees || []).find((item) => item.id === employeeId);
  return normalizeLocationId(employee?.locationId || fallback);
}

function cleanChange(current, input = {}, session = {}) {
  const employeeId = session.role === "employee"
    ? String(session.employeeId || "")
    : String(input.employeeId || "");
  if (!validId(input.id) || !validId(employeeId)) throw new Error("Solicitud invalida.");
  if (!(current?.employees || []).some((employee) => employee.id === employeeId)) {
    throw new Error("El empleado no existe.");
  }

  const date = String(input.date || "");
  const endDate = String(input.endDate || date);
  if (!validDateKey(date) || !validDateKey(endDate) || endDate < date) {
    throw new Error("El intervalo de fechas es invalido.");
  }

  const reason = String(input.reason || "Otro").trim().slice(0, 80);
  const fullDay = input.fullDay === true || ["vacaciones", "licencia"].includes(reason.toLowerCase());
  const action = fullDay ? "absence" : ["absence", "replace", "extra"].includes(input.action)
    ? input.action
    : "absence";
  const start = fullDay ? "00:00" : String(input.start || "");
  const end = fullDay ? "23:59" : String(input.end || "");
  if (!validTime(start) || !validTime(end) || (!fullDay && start >= end)) {
    throw new Error("El horario de la solicitud es invalido.");
  }

  let replacementEmployeeId = action === "replace" ? String(input.replacementEmployeeId || "") : "";
  if (replacementEmployeeId && !(current?.employees || []).some((employee) => employee.id === replacementEmployeeId)) {
    replacementEmployeeId = "";
  }

  return {
    id: String(input.id),
    locationId: employeeLocation(current, employeeId, input.locationId),
    date,
    endDate,
    employeeId,
    replacementEmployeeId,
    reason,
    action,
    start,
    end,
    fullDay,
    note: String(input.note || "").trim().slice(0, 500),
    status: "pending",
    createdAt: String(input.createdAt || new Date().toISOString()),
  };
}

export function applyChangeMutation(current, body = {}, session = {}) {
  const next = { ...(current || {}) };
  const changes = Array.isArray(current?.changes) ? [...current.changes] : [];
  if (body.action === "create") {
    const change = cleanChange(current, body.change, session);
    if (!changes.some((item) => item.id === change.id)) changes.push(change);
    next.changes = changes;
    return next;
  }

  if (body.action === "review") {
    if (session.role !== "admin") throw new Error("Solo un administrador puede aprobar cambios.");
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!validId(id) || !["approved", "rejected"].includes(status)) throw new Error("Revision invalida.");
    const index = changes.findIndex((change) => change.id === id);
    if (index < 0) throw new Error("La solicitud ya no existe.");
    changes[index] = {
      ...changes[index],
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: "Administrador",
    };
    next.changes = changes;
    return next;
  }

  throw new Error("Accion invalida.");
}
