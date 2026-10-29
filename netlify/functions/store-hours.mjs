import {
  normalizeLocationId,
  LOCATION_IDS,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const GENERAL_PERIODS = ["weekdays", "saturday", "sunday"];

function validDate(value) {
  return DATE_PATTERN.test(String(value || ""))
    && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

function invalid(message) {
  return response({ ok: false, error: message }, 400);
}

export function applyStoreHoursUpdate(current, body) {
  const state = current && typeof current === "object" ? current : {};
  const locationId = normalizeLocationId(body.locationId);
  const date = body.date;
  const action = body.action === "reset" || body.action === "save-rule"
    ? body.action
    : "save";
  const locationSettings = state.locationSettings || {};
  const currentSettings = locationSettings[locationId] || {};
  const monthlyOpeningHours = { ...(currentSettings.monthlyOpeningHours || {}) };
  const regularOpeningSchedules = { ...(currentSettings.regularOpeningSchedules || {}) };

  if (action === "save-rule") {
    regularOpeningSchedules[body.effectiveFrom] = { ...Object.fromEntries(
      GENERAL_PERIODS.map((period) => [period, {
        open: body.periods[period].open,
        close: body.periods[period].close,
      }]),
    ), _userConfigured: true };
  } else if (action === "reset") delete monthlyOpeningHours[date];
  else {
    monthlyOpeningHours[date] = {
      open: body.open,
      close: body.close,
      closed: body.closed === true,
    };
  }

  const nextSettings = { ...currentSettings, monthlyOpeningHours, regularOpeningSchedules };
  return {
    ...state,
    locationSettings: {
      ...locationSettings,
      [locationId]: nextSettings,
    },
    ...(locationId === "barcelona" ? {
      settings: { ...(state.settings || {}), monthlyOpeningHours, regularOpeningSchedules },
    } : {}),
  };
}

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  if (request.method !== "PUT") return response({ ok: false, error: "Metodo no permitido." }, 405);

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return invalid("Solicitud invalida.");
  }

  const action = body?.action === "reset" || body?.action === "save-rule" ? body.action : "save";
  if (!LOCATION_IDS.includes(body?.locationId)) return invalid("Tienda invalida.");
  if (action === "save-rule") {
    if (!validDate(body?.effectiveFrom)) return invalid("Fecha de inicio invalida.");
    for (const period of GENERAL_PERIODS) {
      const hours = body?.periods?.[period];
      if (!TIME_PATTERN.test(String(hours?.open || "")) || !TIME_PATTERN.test(String(hours?.close || ""))) {
        return invalid("Completa todos los horarios generales.");
      }
      if (hours.open >= hours.close) return invalid("El cierre debe ser posterior a la apertura.");
    }
  } else if (!validDate(body?.date)) return invalid("Fecha invalida.");
  if (action === "save" && body?.closed !== true) {
    if (!TIME_PATTERN.test(String(body?.open || "")) || !TIME_PATTERN.test(String(body?.close || ""))) {
      return invalid("Completa apertura y cierre.");
    }
    if (body.open >= body.close) return invalid("El cierre debe ser posterior a la apertura.");
  }

  try {
    const next = await updateState((current) => applyStoreHoursUpdate(current, {
      ...body,
      action,
      locationId: normalizeLocationId(body.locationId),
    }));
    const locationId = normalizeLocationId(body.locationId);
    return response({
      ok: true,
      locationId,
      date: action === "save-rule" ? body.effectiveFrom : body.date,
      value: action === "save-rule"
        ? next.locationSettings?.[locationId]?.regularOpeningSchedules?.[body.effectiveFrom] || null
        : next.locationSettings?.[locationId]?.monthlyOpeningHours?.[body.date] || null,
      revision: Number(next?._meta?.revision || 0),
      persistedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response({ ok: false, error: error.message || "No se pudo guardar el horario." }, 500);
  }
};
