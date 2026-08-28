import {
  normalizeLocationId,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ID_PATTERN = /^[a-z0-9_-]{1,100}$/i;
const EXPENSE_CATEGORIES = new Set([
  "materia_prima", "nominas", "seguridad_social", "alquiler", "suministros",
  "mantenimiento", "comisiones_tpv", "impuestos", "gestoria", "inversiones",
  "marketing", "otros",
]);

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function cleanText(value, maxLength = 180) {
  return String(value || "").trim().slice(0, maxLength);
}

function expenseOverrideKeys(expense, locationId = "barcelona") {
  const keys = new Set();
  if (expense?.id) keys.add(String(expense.id));
  if (expense?.bistroId) keys.add(String(expense.bistroId));
  const id = normalizeLocationId(expense?.locationId || locationId);
  const legacyId = String(expense?.bistroId || expense?.id || "");
  const legacyWithoutLocation = legacyId.replace(/^bistro-expense-(barcelona|madrid)-/, "bistro-expense-");
  if (legacyWithoutLocation) keys.add(legacyWithoutLocation);
  if (legacyWithoutLocation.startsWith("bistro-expense-")) {
    keys.add(`bistro-expense-${id}-${legacyWithoutLocation.slice("bistro-expense-".length)}`);
  }
  return [...keys].filter(Boolean);
}

function cleanManualExpense(input = {}, existing = {}) {
  const id = cleanText(input.id || existing.id, 100);
  const date = cleanText(input.date || existing.date, 10);
  const amount = Number(input.amount);
  const category = cleanText(input.category || existing.category || "otros", 40);
  if (!ID_PATTERN.test(id)) invalid("Identificador de gasto inválido.");
  if (!DATE_PATTERN.test(date)) invalid("Fecha de gasto inválida.");
  if (!Number.isFinite(amount) || amount <= 0) invalid("El importe debe ser mayor que cero.");
  if (!EXPENSE_CATEGORIES.has(category)) invalid("Categoría de gasto inválida.");
  if (existing?._source === "bistrosoft" || input?._source === "bistrosoft") {
    invalid("Los movimientos de Bistrosoft solo permiten cambiar la categoría.");
  }
  const isDiferido = input.isDiferido === true;
  const dueDate = isDiferido ? cleanText(input.dueDate, 10) : null;
  if (isDiferido && dueDate && !DATE_PATTERN.test(dueDate)) invalid("Vencimiento inválido.");
  return {
    ...existing,
    id,
    date,
    amount,
    category,
    supplier: cleanText(input.supplier, 120),
    description: cleanText(input.description, 240),
    isDiferido,
    dueDate,
    paymentMethod: isDiferido ? "tc" : cleanText(input.paymentMethod || "efectivo", 30),
    locationId: normalizeLocationId(input.locationId || existing.locationId),
    createdAt: existing.createdAt || cleanText(input.createdAt, 40) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function compactTombstones(tombstones = {}) {
  return Object.fromEntries(
    Object.entries(tombstones)
      .sort((a, b) => String(b[1]).localeCompare(String(a[1])))
      .slice(0, 500),
  );
}

export function applyExpenseRecordMutation(current, body = {}) {
  const state = current && typeof current === "object" ? current : {};
  const action = String(body.action || "upsert");
  const expenses = Array.isArray(state.expenses) ? [...state.expenses] : [];
  const tombstones = { ...(state.expenseDeletionTombstones || {}) };

  if (action === "upsert") {
    const incoming = body.expense || {};
    const id = cleanText(incoming.id, 100);
    const index = expenses.findIndex((expense) => String(expense?.id || "") === id);
    const existing = index >= 0 ? expenses[index] : {};
    const expense = cleanManualExpense(incoming, existing);
    if (index >= 0) expenses[index] = expense;
    else expenses.push(expense);
    delete tombstones[expense.id];
    return {
      ...state,
      expenses,
      expenseDeletionTombstones: compactTombstones(tombstones),
    };
  }

  if (action === "delete") {
    const expenseId = cleanText(body.expenseId, 100);
    if (!ID_PATTERN.test(expenseId)) invalid("Gasto inválido.");
    const expense = expenses.find((item) => item?.id === expenseId);
    if (!expense) invalid("El gasto ya no existe.");
    if (expense._source === "bistrosoft") invalid("Los movimientos de Bistrosoft no se pueden borrar desde la app.");
    tombstones[expenseId] = new Date().toISOString();
    return {
      ...state,
      expenses: expenses.filter((item) => item?.id !== expenseId),
      expenseDeletionTombstones: compactTombstones(tombstones),
    };
  }

  if (action === "categorize") {
    const category = cleanText(body.category, 40);
    if (!EXPENSE_CATEGORIES.has(category)) invalid("Categoría de gasto inválida.");
    const reference = body.expense || {};
    const locationId = normalizeLocationId(reference.locationId || body.locationId);
    const referenceKeys = new Set(expenseOverrideKeys(reference, locationId));
    if (!referenceKeys.size) invalid("Movimiento de Bistrosoft inválido.");
    const overrides = { ...(state.expenseCategoryOverrides || {}) };
    referenceKeys.forEach((key) => { overrides[key] = category; });
    return {
      ...state,
      expenseCategoryOverrides: overrides,
      expenses: expenses.map((expense) => {
        if (expense?._source !== "bistrosoft" || normalizeLocationId(expense.locationId) !== locationId) return expense;
        const matches = expenseOverrideKeys(expense, locationId).some((key) => referenceKeys.has(key));
        return matches ? { ...expense, category } : expense;
      }),
    };
  }

  if (action === "mark-paid") {
    const expenseIds = new Set(
      (Array.isArray(body.expenseIds) ? body.expenseIds : [])
        .map((value) => cleanText(value, 100))
        .filter((value) => ID_PATTERN.test(value)),
    );
    const dueDate = cleanText(body.dueDate, 10);
    const locationId = normalizeLocationId(body.locationId);
    if (!expenseIds.size || !DATE_PATTERN.test(dueDate)) invalid("No se pudieron identificar los gastos a marcar.");
    return {
      ...state,
      expenses: expenses.map((expense) =>
        expenseIds.has(expense?.id)
        && expense?._source !== "bistrosoft"
        && normalizeLocationId(expense.locationId) === locationId
          ? { ...expense, dueDate, updatedAt: new Date().toISOString() }
          : expense
      ),
    };
  }

  invalid("Acción de gasto inválida.");
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
    const next = await updateState((current) => applyExpenseRecordMutation(current, body));
    const expenseId = String(body.expense?.id || body.expenseId || "");
    return response({
      ok: true,
      action: body.action || "upsert",
      expense: (next.expenses || []).find((expense) => expense.id === expenseId) || null,
      persistedAt: new Date().toISOString(),
    });
  } catch (error) {
    return response(
      { ok: false, error: error.message || "No se pudo guardar el gasto." },
      Number(error.status || 500),
    );
  }
};
