import {
  normalizeLocationId,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";

const MIGRATION_VERSION = 1;
const PLAN_ID = "madrid-2026-10-12-4-semanas";
const IGNACIO_ALIAS = "ignacio";
const START_DATE = "2026-11-01";
const END_DATE = "2026-12-31";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ID_PATTERN = /^[a-z0-9_-]{1,80}$/i;

function normalizedName(value) {
  return String(value || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function findIgnacioId(current) {
  const matches = (current.employees || []).filter((employee) => {
    if (normalizeLocationId(employee.locationId) !== "madrid") return false;
    const profile = current.profiles?.[employee.id] || {};
    return [employee.id, employee.label, employee.preferredName, profile.fullName, profile.preferredName]
      .some((value) => ["ignacio", "pato"].includes(normalizedName(value)));
  });
  if (matches.length !== 1) throw new Error("No se pudo identificar una única ficha de Ignacio/Pato en Madrid; no se modificó ningún dato.");
  return matches[0].id;
}

function cleanPlan(input, current) {
  if (!input || input.id !== PLAN_ID || normalizeLocationId(input.locationId) !== "madrid") {
    throw new Error("La programación de Madrid no es válida.");
  }
  if (input.effectiveFrom !== "2026-10-12" || !DATE_PATTERN.test(input.effectiveFrom)) {
    throw new Error("La fecha inicial de la programación no es válida.");
  }
  const cycleLength = Math.floor(Number(input.cycleLength));
  const weekOffset = Math.floor(Number(input.weekOffset || 0));
  if (cycleLength !== 4 || weekOffset < 0 || weekOffset >= cycleLength || !Array.isArray(input.weeks) || input.weeks.length !== cycleLength) {
    throw new Error("El ciclo de cuatro semanas no es válido.");
  }
  const ignacioId = findIgnacioId(current);
  const madridEmployees = new Set((current.employees || [])
    .filter((employee) => normalizeLocationId(employee.locationId) === "madrid")
    .map((employee) => employee.id));
  const managedEmployeeIds = (Array.isArray(input.managedEmployeeIds) ? input.managedEmployeeIds : [])
    .map((employeeId) => employeeId === IGNACIO_ALIAS ? ignacioId : String(employeeId || "").trim());
  if (managedEmployeeIds.length !== 6 || new Set(managedEmployeeIds).size !== managedEmployeeIds.length
      || managedEmployeeIds.some((employeeId) => !ID_PATTERN.test(employeeId) || !madridEmployees.has(employeeId))) {
    throw new Error("No se pudieron vincular todas las fichas de la nueva programación; no se modificó ningún dato.");
  }
  const weeks = input.weeks.map((week) => ({
    shifts: (Array.isArray(week?.shifts) ? week.shifts : []).map((shift) => {
      const employeeId = shift.employeeId === IGNACIO_ALIAS ? ignacioId : String(shift.employeeId || "").trim();
      const day = Number(shift.day);
      const start = String(shift.start || "");
      const end = String(shift.end || "");
      if (!ID_PATTERN.test(employeeId) || !madridEmployees.has(employeeId) || !Number.isInteger(day) || day < 0 || day > 6) {
        throw new Error("La programación contiene un empleado o día que no pertenece a Madrid.");
      }
      if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end) || start >= end) {
        throw new Error("La programación contiene un horario no válido.");
      }
      return { employeeId, day, start, end };
    }),
  }));
  return {
    id: PLAN_ID,
    locationId: "madrid",
    effectiveFrom: "2026-10-12",
    cycleLength,
    weekOffset,
    managedEmployeeIds,
    sourceLabel: "Ciclo 4 semanas",
    weeks,
  };
}

export function applyMadridOctoberScheduleMigration(current = {}, body = {}) {
  const state = current && typeof current === "object" ? current : {};
  const plan = cleanPlan(body.plan, state);
  const schedulePlans = { ...(state.schedulePlans || {}) };
  const madridPlans = Array.isArray(schedulePlans.madrid) ? [...schedulePlans.madrid] : [];
  const existingPlanIndex = madridPlans.findIndex((candidate) => candidate?.id === PLAN_ID);
  if (existingPlanIndex >= 0) madridPlans[existingPlanIndex] = plan;
  else madridPlans.push(plan);
  madridPlans.sort((a, b) => String(a.effectiveFrom).localeCompare(String(b.effectiveFrom)));

  const alreadyApplied = Number(state.madridOctoberScheduleMigrationVersion || 0) >= MIGRATION_VERSION;
  const employeesById = new Map((state.employees || []).map((employee) => [employee.id, employee]));
  const removedChangeIds = [];
  const changes = (state.changes || []).filter((change) => {
    const employee = employeesById.get(change.employeeId);
    const locationId = normalizeLocationId(change.locationId || employee?.locationId || "");
    const date = String(change.date || "");
    const inRequestedMonths = date >= START_DATE && date <= END_DATE;
    const shouldRemove = !alreadyApplied && locationId === "madrid" && inRequestedMonths;
    if (shouldRemove && change.id) removedChangeIds.push(change.id);
    return !shouldRemove;
  });

  return {
    ...state,
    schedulePlans: { ...schedulePlans, madrid: madridPlans },
    changes,
    madridOctoberScheduleMigrationVersion: Math.max(
      Number(state.madridOctoberScheduleMigrationVersion || 0), MIGRATION_VERSION,
    ),
    _madridOctoberScheduleMigrationRemovedChangeIds: alreadyApplied ? [] : removedChangeIds,
  };
}

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  if (request.method !== "PUT") return response({ ok: false, error: "Método no permitido." }, 405);

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return response({ ok: false, error: "Solicitud inválida." }, 400);
  }

  try {
    if (Number(body.migrationVersion) !== MIGRATION_VERSION) {
      throw new Error("La versión de migración no coincide.");
    }
    let removedChangeIds = [];
    const next = await updateState((current) => {
      const migrated = applyMadridOctoberScheduleMigration(current, body);
      removedChangeIds = migrated._madridOctoberScheduleMigrationRemovedChangeIds || [];
      delete migrated._madridOctoberScheduleMigrationRemovedChangeIds;
      return migrated;
    });
    const plan = next.schedulePlans.madrid.find((candidate) => candidate.id === PLAN_ID);
    return response({
      ok: true,
      plan,
      changesRemoved: removedChangeIds.length,
      migrationVersion: next.madridOctoberScheduleMigrationVersion,
      revision: Number(next._meta?.revision || 0),
      persistedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response({ ok: false, error: error.message || "No se pudo actualizar la grilla de Madrid." }, 400);
  }
};
