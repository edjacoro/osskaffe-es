import {
  normalizeLocationId,
  readStateEntry,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const RATE_FIELDS = ["hoursPerWeek", "hourlyRate", "overtimeRate", "holidayRate", "extraHourlyRate"];

function invalid(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function cleanMonth(value) {
  const month = String(value || "");
  if (!MONTH_PATTERN.test(month)) invalid("Mes inválido.");
  return month;
}

function cleanContract(input = {}) {
  const hourlyRate = Number(input.hourlyRate ?? 0);
  const overtimeMultiplier = Number(input.overtimeMultiplier ?? 1.25);
  const result = {
    hoursPerWeek: Number(input.hoursPerWeek ?? 40),
    hourlyRate,
    overtimeRate: Number(input.overtimeRate ?? hourlyRate * overtimeMultiplier),
    holidayRate: Number(input.holidayRate ?? 0),
    overtimeMultiplier,
    extraHours: Number(input.extraHours ?? 0),
    extraHourlyRate: Number(input.extraHourlyRate ?? 0),
  };
  if (Object.values(result).some((value) => !Number.isFinite(value) || value < 0)) {
    invalid("Las horas y tarifas deben ser números no negativos.");
  }
  if (result.hoursPerWeek > 168 || result.extraHours > 744 || Object.values(result).some((value) => value > 100000)) {
    invalid("Las horas o tarifas superan un límite válido.");
  }
  return result;
}

function initialHistory(state, month) {
  const existing = state?.contractHistory;
  if (existing?.baselineMonth && existing?.baseline) return existing;
  return {
    baselineMonth: month,
    baseline: Object.fromEntries(
      Object.entries(state?.contracts || {}).map(([id, contract]) => [id, cleanContract(contract)])
    ),
    months: existing?.months || {},
  };
}

function monthlyContract(history, employeeId, month) {
  if (history.months?.[month]?.[employeeId]) return history.months[month][employeeId];
  if (month < history.baselineMonth) return history.baseline?.[employeeId] || {};
  const latestMonth = Object.keys(history.months || {})
    .filter((key) => key >= history.baselineMonth && key <= month && history.months[key]?.[employeeId])
    .sort()
    .at(-1);
  return latestMonth ? history.months[latestMonth][employeeId] : history.baseline?.[employeeId] || {};
}

export function applyContractHistoryMutation(current, body = {}) {
  const state = current && typeof current === "object" ? current : {};
  const month = cleanMonth(body.month);
  const currentMonth = cleanMonth(body.currentMonth || new Date().toISOString().slice(0, 7));
  // La referencia se fija al mes real de la primera escritura, incluso si
  // falló la inicialización y la primera edición fue de un mes anterior.
  const history = initialHistory(state, currentMonth);
  if (body.action === "initialize") {
    return history === state.contractHistory ? state : { ...state, contractHistory: history };
  }

  const employeeId = String(body.employeeId || "").trim();
  const employee = (state.employees || []).find((item) => item.id === employeeId);
  if (!employee || normalizeLocationId(employee.locationId) !== normalizeLocationId(body.locationId)) {
    invalid("Empleado no encontrado en esta tienda.", 404);
  }
  if (employee.activeFrom && employee.activeFrom > `${month}-31`) invalid("El empleado aún no estaba dado de alta en ese mes.");
  if (employee.inactiveFrom && employee.inactiveFrom <= `${month}-01`) invalid("El empleado ya estaba dado de baja en ese mes.");

  const existing = history.months?.[month]?.[employeeId] || {};
  let contract;
  if (body.action === "upsert") {
    const cleaned = cleanContract(body.contract);
    const previous = cleanContract(monthlyContract(history, employeeId, month));
    const ratesChanged = RATE_FIELDS.some((field) => cleaned[field] !== previous[field]);
    contract = {
      ...cleaned,
      verified: month >= history.baselineMonth ? true : existing.verified === true && !ratesChanged,
      updatedAt: new Date().toISOString(),
    };
  } else if (body.action === "verify") {
    contract = {
      ...cleanContract(monthlyContract(history, employeeId, month)),
      verified: true,
      updatedAt: new Date().toISOString(),
    };
  } else {
    invalid("Acción de contrato inválida.");
  }

  const nextHistory = {
    ...history,
    months: {
      ...(history.months || {}),
      [month]: {
        ...(history.months?.[month] || {}),
        [employeeId]: contract,
      },
    },
  };
  return {
    ...state,
    contractHistory: nextHistory,
    ...(month === currentMonth ? {
      contracts: {
        ...(state.contracts || {}),
        [employeeId]: {
          ...(state.contracts?.[employeeId] || {}),
          ...cleanContract(contract),
        },
      },
    } : {}),
  };
}

export function contractHistoryMutationIsPersisted(state, body = {}) {
  const history = state?.contractHistory;
  if (!history?.baselineMonth || !history?.baseline) return false;
  if (body.action === "initialize") return true;
  const record = history.months?.[body.month]?.[body.employeeId];
  if (!record) return false;
  if (body.action === "verify") return record.verified === true;
  if (body.action !== "upsert") return false;
  const expected = cleanContract(body.contract);
  return Object.entries(expected).every(([field, value]) => Number(record[field]) === value);
}

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  if (request.method !== "PUT") return response({ ok: false, error: "Método no permitido." }, 405);
  let body;
  try {
    body = await request.json();
    const next = await updateState((current) => applyContractHistoryMutation(current, body));
    const { state: confirmed } = await readStateEntry();
    const history = confirmed?.contractHistory;
    const record = history?.months?.[body.month]?.[body.employeeId];
    if (!contractHistoryMutationIsPersisted(confirmed, body)) {
      invalid("Netlify no confirmó los valores del contrato.", 503);
    }
    return response({
      ok: true,
      history,
      contract: record || null,
      revision: Number(confirmed?._meta?.revision || next?._meta?.revision || 0),
      persistedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response({ ok: false, error: error.message || "No se pudo guardar el contrato." }, Number(error.status || 500));
  }
};
