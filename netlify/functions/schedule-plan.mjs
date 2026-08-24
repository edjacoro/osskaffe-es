import {
  normalizeLocationId,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ID_PATTERN = /^[a-z0-9_-]{1,80}$/i;

function cleanSchedulePlan(input = {}) {
  const id = String(input.id || "").trim();
  const locationId = normalizeLocationId(input.locationId);
  const effectiveFrom = String(input.effectiveFrom || "");
  const cycleLength = Math.floor(Number(input.cycleLength || input.weeks?.length || 0));
  if (!ID_PATTERN.test(id)) throw new Error("Programación inválida.");
  if (!DATE_PATTERN.test(effectiveFrom)) throw new Error("Fecha de vigencia inválida.");
  if (cycleLength < 1 || cycleLength > 12 || !Array.isArray(input.weeks) || input.weeks.length !== cycleLength) {
    throw new Error("El ciclo de semanas es inválido.");
  }

  const weeks = input.weeks.map((week) => ({
    shifts: (Array.isArray(week?.shifts) ? week.shifts : []).map((shift) => {
      const employeeId = String(shift?.employeeId || "").trim();
      const day = Number(shift?.day);
      const start = String(shift?.start || "");
      const end = String(shift?.end || "");
      if (!ID_PATTERN.test(employeeId) || !Number.isInteger(day) || day < 0 || day > 6) {
        throw new Error("Turno inválido.");
      }
      if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end) || start >= end) {
        throw new Error("Horario de turno inválido.");
      }
      return { employeeId, day, start, end };
    }),
  }));

  return {
    id,
    locationId,
    effectiveFrom,
    cycleLength,
    sourceLabel: String(input.sourceLabel || "Grilla programada").trim().slice(0, 100),
    weeks,
  };
}

export function applySchedulePlanUpdate(current, body = {}) {
  const state = current && typeof current === "object" ? current : {};
  const plan = cleanSchedulePlan(body.plan);
  const schedulePlans = { ...(state.schedulePlans || {}) };
  const plans = Array.isArray(schedulePlans[plan.locationId]) ? [...schedulePlans[plan.locationId]] : [];
  const index = plans.findIndex((candidate) => candidate?.id === plan.id);
  if (index >= 0) plans[index] = plan;
  else plans.push(plan);
  plans.sort((a, b) => String(a.effectiveFrom).localeCompare(String(b.effectiveFrom)));
  schedulePlans[plan.locationId] = plans;

  return {
    ...state,
    schedulePlans,
    ...(plan.locationId === "madrid" ? {
      madridScheduleSeedVersion: Math.max(
        Number(state.madridScheduleSeedVersion || 0),
        Math.max(0, Math.floor(Number(body.seedVersion || 0))),
      ),
    } : {}),
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
    const next = await updateState((current) => applySchedulePlanUpdate(current, body));
    const plan = cleanSchedulePlan(body.plan);
    return response({
      ok: true,
      planId: plan.id,
      locationId: plan.locationId,
      seedVersion: next.madridScheduleSeedVersion || 0,
      persistedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response({ ok: false, error: error.message || "No se pudo guardar la programación." }, 400);
  }
};
