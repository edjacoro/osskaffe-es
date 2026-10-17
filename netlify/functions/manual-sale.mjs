import {
  normalizeLocationId,
  requireSession,
  response,
  readStateEntry,
  updateState,
} from "./_shared.mjs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ID_PATTERN = /^[a-z0-9_-]{1,120}$/i;

function invalid(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function isEditableSale(sale) {
  return sale?._source === "manual" || sale?._source === "course";
}

function sameSale(saved, input) {
  return !!saved && saved.date === input.date
    && saved._source === input._source
    && Number(saved.total) === Number(input.total)
    && Number(saved.count) === Number(input.count)
    && normalizeLocationId(saved.locationId) === normalizeLocationId(input.locationId);
}

function cleanSale(input, existing = {}) {
  const id = String(input?.id || existing.id || "").trim();
  const date = String(input?.date || "").trim();
  const locationId = normalizeLocationId(input?.locationId || existing.locationId);
  const total = Number(input?.total);
  const source = input?._source;
  const count = source === "course" ? 0 : Number(input?.count);
  if (!ID_PATTERN.test(id)) invalid("Identificador de venta inválido.");
  if (!DATE_PATTERN.test(date)) invalid("Fecha de venta inválida.");
  if (source !== "manual" && source !== "course") invalid("Tipo de venta inválido.");
  if (!Number.isFinite(total) || total <= 0) invalid("El importe debe ser mayor que cero.");
  if (source === "manual" && (!Number.isInteger(count) || count < 1)) {
    invalid("La venta manual necesita al menos un ticket.");
  }
  if (existing?.id && !isEditableSale(existing)) invalid("No se puede modificar una venta de Bistrosoft.", 403);
  if (existing?.id && normalizeLocationId(existing.locationId) !== locationId) {
    invalid("No se puede mover una venta a otra tienda.");
  }
  return {
    ...existing,
    id,
    date,
    locationId,
    time: "",
    ticketNumber: source === "course" ? `course-${date}` : `manual-${date}`,
    total,
    count,
    items: [],
    paymentMethod: source === "course" ? "Curso" : "Manual",
    _source: source,
    _isSummary: true,
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function applyManualSaleMutation(current, body = {}) {
  const state = current && typeof current === "object" ? current : {};
  const sales = Array.isArray(state.sales) ? [...state.sales] : [];
  const tombstones = { ...(state.salesDeletionTombstones || {}) };
  const action = String(body.action || "upsert");
  if (action === "upsert") {
    const incoming = body.sale || {};
    const id = String(incoming.id || "").trim();
    const index = sales.findIndex((sale) => String(sale?.id || "") === id);
    const existing = index >= 0 ? sales[index] : {};
    if (tombstones[id]) invalid("Esta venta fue borrada. Recargá la pantalla antes de crear otra.", 409);
    const sale = cleanSale(incoming, existing);
    if (index >= 0 && Object.hasOwn(body, "expectedUpdatedAt")
      && String(existing.updatedAt || "") !== String(body.expectedUpdatedAt || "")) {
      if (sameSale(existing, sale)) return state;
      invalid("Esta venta cambió en otra sesión. Actualizá la página antes de editarla.", 409);
    }
    if (index >= 0) sales[index] = sale;
    else sales.push(sale);
    return { ...state, sales };
  }
  if (action === "delete") {
    const id = String(body.saleId || "").trim();
    if (!ID_PATTERN.test(id)) invalid("Venta inválida.");
    const sale = sales.find((item) => item?.id === id);
    if (!sale && tombstones[id]) return state;
    if (!sale) invalid("La venta ya no existe.", 409);
    if (!isEditableSale(sale)) invalid("Bistrosoft no se puede borrar desde esta acción.", 403);
    if (normalizeLocationId(sale.locationId) !== normalizeLocationId(body.locationId)) {
      invalid("La venta pertenece a otra tienda.", 403);
    }
    if (Object.hasOwn(body, "expectedUpdatedAt")
      && String(sale.updatedAt || "") !== String(body.expectedUpdatedAt || "")) {
      invalid("Esta venta cambió en otra sesión. Actualizá la página antes de borrarla.", 409);
    }
    tombstones[id] = new Date().toISOString();
    return {
      ...state,
      sales: sales.filter((item) => item?.id !== id),
      salesDeletionTombstones: Object.fromEntries(
        Object.entries(tombstones).sort((a, b) => String(b[1]).localeCompare(String(a[1]))).slice(0, 500),
      ),
    };
  }
  invalid("Acción de venta inválida.");
}

export function manualSaleMutationIsPersisted(state, body = {}) {
  const sales = Array.isArray(state?.sales) ? state.sales : [];
  if (String(body.action || "upsert") === "delete") {
    return !!state?.salesDeletionTombstones?.[body.saleId]
      && !sales.some((sale) => sale?.id === body.saleId);
  }
  const saved = sales.find((sale) => sale?.id === body.sale?.id);
  return sameSale(saved, body.sale || {});
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
    const next = await updateState((current) => applyManualSaleMutation(current, body));
    const { state: confirmed } = await readStateEntry();
    if (!manualSaleMutationIsPersisted(confirmed, body)) {
      invalid("Netlify no confirmó la venta. Volvé a intentar; no se duplicará.", 503);
    }
    return response({
      ok: true,
      sale: (confirmed.sales || []).find((sale) => sale.id === (body.sale?.id || body.saleId)) || null,
      revision: Number(confirmed?._meta?.revision || next?._meta?.revision || 0),
      persistedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response({ ok: false, error: error.message || "No se pudo guardar la venta." }, Number(error.status || 500));
  }
};
