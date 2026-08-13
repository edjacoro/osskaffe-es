import {
  normalizeLocationId,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function invalid(message) {
  return response({ ok: false, error: message }, 400);
}

export function applyStoreHoursUpdate(current, body) {
  const state = current && typeof current === "object" ? current : {};
  const locationId = normalizeLocationId(body.locationId);
  const date = body.date;
  const action = body.action === "reset" ? "reset" : "save";
  const locationSettings = state.locationSettings || {};
  const currentSettings = locationSettings[locationId] || {};
  const monthlyOpeningHours = { ...(currentSettings.monthlyOpeningHours || {}) };

  if (action === "reset") delete monthlyOpeningHours[date];
  else {
    monthlyOpeningHours[date] = {
      open: body.open,
      close: body.close,
      closed: body.closed === true,
    };
  }

  const nextSettings = { ...currentSettings, monthlyOpeningHours };
  return {
    ...state,
    locationSettings: {
      ...locationSettings,
      [locationId]: nextSettings,
    },
    ...(locationId === "barcelona" ? {
      settings: { ...(state.settings || {}), monthlyOpeningHours },
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

  const action = body?.action === "reset" ? "reset" : "save";
  if (!DATE_PATTERN.test(String(body?.date || ""))) return invalid("Fecha invalida.");
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
      date: body.date,
      value: next.locationSettings?.[locationId]?.monthlyOpeningHours?.[body.date] || null,
      persistedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response({ ok: false, error: error.message || "No se pudo guardar el horario." }, 500);
  }
};
