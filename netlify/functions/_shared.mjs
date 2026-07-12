import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "oss-kaffe";
const STATE_KEY = "state";
const STATUS_KEY = "bistro-status";
const AUTH_PREFIX = "auth";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const BISTRO_BASE_URL = "https://es.bistrosoft.com";
export const DEFAULT_LOCATION_ID = "barcelona";
export const LOCATION_IDS = ["barcelona", "madrid"];

export function normalizeLocationId(value) {
  return LOCATION_IDS.includes(value) ? value : DEFAULT_LOCATION_ID;
}

function locationEnvSuffix(locationId) {
  return normalizeLocationId(locationId).toUpperCase();
}

function bistroCredentials(locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  const suffix = locationEnvSuffix(id);
  return {
    username: process.env[`BISTROSOFT_USERNAME_${suffix}`]
      || (id === DEFAULT_LOCATION_ID ? process.env.BISTROSOFT_USERNAME : "")
      || "",
    password: process.env[`BISTROSOFT_PASSWORD_${suffix}`]
      || (id === DEFAULT_LOCATION_ID ? process.env.BISTROSOFT_PASSWORD : "")
      || "",
  };
}

export function hasBistroCredentials(locationId = DEFAULT_LOCATION_ID) {
  const { username, password } = bistroCredentials(locationId);
  return !!username && !!password;
}

function bistroStatusKey(locationId = DEFAULT_LOCATION_ID) {
  return `${STATUS_KEY}-${normalizeLocationId(locationId)}`;
}

export function response(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function secretsMatch(received, expected) {
  const receivedBuffer = Buffer.from(String(received || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  return receivedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function sessionSecret() {
  const configured = process.env.SESSION_SECRET || "";
  if (configured.length >= 32) return configured;

  const fallback = [
    process.env.BISTROSOFT_PASSWORD || "",
    process.env.BISTROSOFT_USERNAME || "",
    process.env.BISTROSOFT_PASSWORD_BARCELONA || "",
    process.env.BISTROSOFT_USERNAME_BARCELONA || "",
    process.env.BISTROSOFT_PASSWORD_MADRID || "",
    process.env.BISTROSOFT_USERNAME_MADRID || "",
    process.env.ADMIN_PIN || "",
    "oss-kaffe-netlify-session",
  ].join(":");
  return crypto.createHash("sha256").update(fallback).digest("hex");
}

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createSessionCookie(role, employeeId = null) {
  const payload = Buffer.from(JSON.stringify({
    role,
    employeeId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  return `oss_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`;
}

export function clearSessionCookie() {
  return "oss_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

function parseCookies(request) {
  return Object.fromEntries(
    String(request.headers.get("cookie") || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, ...value]) => [key, decodeURIComponent(value.join("="))]),
  );
}

export function getSession(request, requiredRole = null) {
  try {
    const token = parseCookies(request).oss_session || "";
    const [payload, signature] = token.split(".");
    if (!payload || !signature || !secretsMatch(signature, sign(payload))) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (session.expiresAt < Date.now()) return null;
    if (requiredRole && session.role !== requiredRole) return null;
    return session;
  } catch (_) {
    return null;
  }
}

export function requireSession(request, requiredRole = null) {
  const session = getSession(request, requiredRole);
  return session || response({ ok: false, error: "Sesion no autorizada." }, 401);
}

function stateStore() {
  return getStore(STORE_NAME);
}

function credentialKey(kind, id = "") {
  return `${AUTH_PREFIX}-${kind}${id ? `-${id}` : ""}`;
}

export async function readCredential(kind, id = "") {
  return await stateStore().get(credentialKey(kind, id), { type: "json", consistency: "strong" }) || null;
}

export async function writeCredential(kind, id, password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  await stateStore().setJSON(credentialKey(kind, id), { salt, hash });
}

export async function clearCredential(kind, id = "") {
  await stateStore().delete(credentialKey(kind, id));
}

export function verifyCredential(password, credential) {
  if (!credential?.salt || !credential?.hash) return false;
  const received = crypto.scryptSync(String(password || ""), credential.salt, 64);
  const expected = Buffer.from(credential.hash, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export async function readStateEntry() {
  const entry = await stateStore().getWithMetadata(STATE_KEY, { type: "json", consistency: "strong" });
  return entry ? { state: entry.data, etag: entry.etag } : { state: null, etag: null };
}

export async function updateState(mutator) {
  const store = stateStore();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const entry = await store.getWithMetadata(STATE_KEY, { type: "json", consistency: "strong" });
    const current = entry?.data || null;
    const next = await mutator(current);
    const options = entry?.etag ? { onlyIfMatch: entry.etag } : { onlyIfNew: true };
    const result = await store.setJSON(STATE_KEY, next, options);
    if (result.modified) return next;
  }
  throw new Error("No se pudo guardar el estado por escrituras simultaneas.");
}

export function isActiveEmployee(fullState, employeeId) {
  const employees = Array.isArray(fullState?.employees) ? fullState.employees : [
    { id: "chelo", active: true, canLogin: true, locationId: "barcelona" },
    { id: "sebastian", active: true, canLogin: true, locationId: "barcelona" },
    { id: "third", active: true, canLogin: true, locationId: "barcelona" },
    { id: "bonnie", active: true, canLogin: true, locationId: "madrid" },
    { id: "micaela", active: true, canLogin: true, locationId: "madrid" },
    { id: "perla", active: true, canLogin: true, locationId: "madrid" },
    { id: "guillermo", active: true, canLogin: true, locationId: "madrid" },
  ];
  return employees.some((employee) =>
    employee.id === employeeId && employee.active !== false && employee.canLogin !== false
  );
}

export function employeeState(fullState, employeeId) {
  if (!fullState) return null;
  const profile = fullState.profiles?.[employeeId] || null;
  const { adminNotes: _adminNotes, ...employeeProfile } = profile || {};
  const contract = fullState.contracts?.[employeeId] || null;
  const { adminPin: _adminPin, adminEmail: _adminEmail, ...employeeSettings } = fullState.settings || {};
  return {
    ...fullState,
    punches: (fullState.punches || []).filter((item) => item.employeeId === employeeId),
    changes: (fullState.changes || []).filter((item) => item.employeeId === employeeId),
    wasteRecords: (fullState.wasteRecords || []).filter((item) => item.employeeId === employeeId),
    sales: [],
    expenses: [],
    contracts: contract ? { [employeeId]: { hoursPerWeek: contract.hoursPerWeek } } : {},
    budgets: {},
    profiles: profile ? { [employeeId]: employeeProfile } : {},
    settings: employeeSettings,
  };
}

export function visitorState(fullState) {
  if (!fullState) return null;
  const {
    adminPin: _adminPin,
    adminEmail: _adminEmail,
    storeLat: _storeLat,
    storeLng: _storeLng,
    geoRadius: _geoRadius,
    lateTolerance: _lateTolerance,
    ...visitorSettings
  } = fullState.settings || {};
  return {
    ...fullState,
    punches: [],
    changes: fullState.changes || [],
    trafficData: [],
    profiles: {},
    contracts: {},
    settings: visitorSettings,
  };
}

export function mergeEmployeeState(current, submitted, employeeId) {
  const currentProfiles = current?.profiles || {};
  const ownProfile = submitted?.profiles?.[employeeId];
  const currentPunches = current?.punches || [];
  const currentChanges = current?.changes || [];
  const currentWasteRecords = current?.wasteRecords || [];
  const ownPunches = (submitted?.punches || []).filter((item) => item.employeeId === employeeId);
  const ownChanges = (submitted?.changes || []).filter((item) => item.employeeId === employeeId);
  const ownWasteRecords = (submitted?.wasteRecords || []).filter((item) => item.employeeId === employeeId);
  return {
    ...(current || {}),
    punches: [...currentPunches.filter((item) => item.employeeId !== employeeId), ...ownPunches],
    changes: [...currentChanges.filter((item) => item.employeeId !== employeeId), ...ownChanges],
    wasteRecords: [
      ...currentWasteRecords.filter((item) => item.employeeId !== employeeId),
      ...ownWasteRecords,
    ],
    profiles: ownProfile ? {
      ...currentProfiles,
      [employeeId]: {
        ...ownProfile,
        adminNotes: currentProfiles[employeeId]?.adminNotes || "",
      },
    } : currentProfiles,
  };
}

function extractCookies(headers) {
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : [headers.get("set-cookie")].filter(Boolean);
  return values.map((value) => value.split(";")[0]).join("; ");
}

async function bistroRequest(relativeUrl, options = {}, cookies = "") {
  const result = await fetch(`${BISTRO_BASE_URL}${relativeUrl}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(cookies ? { Cookie: cookies } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await result.json();
  if (!result.ok) throw new Error(`Bistrosoft respondio ${result.status}.`);
  return { data, cookies: extractCookies(result.headers) || cookies };
}

async function loginBistrosoft(locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  const { username, password } = bistroCredentials(id);
  if (!username || !password) throw new Error("Faltan las credenciales de Bistrosoft en Netlify.");
  const body = JSON.stringify({ username, password });
  const login = await bistroRequest("/api/auth", { method: "POST", body });
  if (login.data.responseCode !== 0) throw new Error("Bistrosoft rechazo el inicio de sesion.");
  const tags = await bistroRequest("/api/auth/getMerchantTags", { method: "POST", body }, login.cookies);
  if (tags.data.responseCode !== 0) throw new Error("Bistrosoft no pudo cargar los comercios.");
  return tags.cookies;
}

function bistroDateToIso(value) {
  const [day, month, year] = String(value).split("-");
  return `${year}-${month}-${day}`;
}

function paymentMethod(sale) {
  const value = String(sale.paymentInfo || "").toUpperCase();
  if (value.includes("TARJETA")) return "Tarjeta";
  if (value.includes("EFECTIVO")) return "Efectivo";
  if (value.includes("ONLINE")) return "Online";
  if (value.includes("QR")) return "QR";
  if (value.includes("INVIT")) return "Invitacion";
  if (value.includes("CUENTA")) return "Cuenta";
  return "";
}

export async function getBistroSales(from, until, authenticatedCookies = "", locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  let cookies = authenticatedCookies || await loginBistrosoft(id);
  const sales = [];
  const countPerPage = 5000;
  let page = 1;
  let totalCount = 0;

  do {
    const query = new URLSearchParams({
      Period: "ConfigurablePeriod",
      From: from,
      Until: until,
      CurrentPage: String(page),
      CountPerPage: String(countPerPage),
    });
    const result = await bistroRequest(`/api/consolidatedV2/?${query}`, {}, cookies);
    cookies = result.cookies;
    if (result.data.responseCode !== 0) throw new Error("Bistrosoft no pudo entregar las ventas.");
    totalCount = Number(result.data.totalCount || 0);
    for (const sale of result.data.sales || []) {
      const stableId = sale.uuid || `${sale.shopCode}-${sale.id}`;
      sales.push({
        id: `bistro-${id}-${stableId}`,
        bistroId: `bistro-${stableId}`,
        locationId: id,
        date: bistroDateToIso(sale.date),
        time: String(sale.hour || ""),
        ticketNumber: String(sale.id || ""),
        total: Number(sale.amount || 0),
        count: 1,
        items: [],
        paymentMethod: paymentMethod(sale),
        movementType: sale.movementType,
        status: sale.status,
        shopCode: String(sale.shopCode || ""),
        _source: "bistrosoft",
        _isBistrosoft: true,
      });
    }
    page += 1;
  } while (sales.length < totalCount);

  const fetchedAt = new Date().toISOString();
  await stateStore().setJSON(bistroStatusKey(id), {
    connected: true,
    lastSyncAt: fetchedAt,
    lastError: null,
    locationId: id,
  });
  return { ok: true, source: "bistrosoft", from, until, fetchedAt, totalCount: sales.length, locationId: id, sales };
}

export async function getBistroExpenses(from, until, authenticatedCookies = "", locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  let cookies = authenticatedCookies || await loginBistrosoft(id);
  const expenses = [];
  const countPerPage = 5000;
  let page = 1;
  let totalCount = 0;
  let fetchedCount = 0;

  do {
    const query = new URLSearchParams({
      Period: "ConfigurablePeriod",
      From: from,
      Until: until,
      CurrentPage: String(page),
      CountPerPage: String(countPerPage),
      HasToFilterByDeposits: "NO",
      HasToFilterByCollects: "NO",
      HasToFilterByAudits: "NO",
      HasToFilterByWithdrawals: "SI",
      HasToFilterByOrders: "NO",
      HasToFilterBySales: "NO",
      HasToFilterByOpenCashbox: "NO",
      HasToFilterByCloseCashbox: "NO",
      HasToFilterByOpenTurn: "NO",
      HasToFilterByCloseTurn: "NO",
      HasToFilterByVoidMovement: "NO",
      HasToFilterByBilled: "NO",
      HasToFilterByCreditNote: "NO",
      HasToFilterByTip: "NO",
    });
    const result = await bistroRequest(`/api/boxV2/?${query}`, {}, cookies);
    cookies = result.cookies;
    if (result.data.responseCode !== 0) {
      throw new Error("Bistrosoft no pudo entregar los gastos.");
    }
    totalCount = Number(result.data.totalCount || 0);
    const items = result.data.cashBoxItems || [];
    fetchedCount += items.length;
    for (const item of items) {
      if (String(item.mt || "").toUpperCase() !== "RETIRO" && Number(item.cashBoxItemType) !== 1) continue;
      const stableValue = [
        item.timestamp,
        item.amount,
        item.comments,
        item.userName,
      ].join("|");
      const stableId = crypto.createHash("sha256").update(stableValue).digest("hex").slice(0, 24);
      expenses.push({
        id: `bistro-expense-${id}-${stableId}`,
        bistroId: `bistro-expense-${stableId}`,
        locationId: id,
        date: bistroDateToIso(item.date),
        amount: Math.abs(Number(item.amount || 0)),
        category: "otros",
        supplier: "",
        description: String(item.comments || item.paymentInfo || "Gasto Bistrosoft").trim(),
        isDiferido: false,
        dueDate: null,
        paymentMethod: "efectivo",
        createdAt: item.timestamp || new Date().toISOString(),
        enteredBy: String(item.userName || ""),
        _source: "bistrosoft",
        _isBistrosoftExpense: true,
      });
    }
    page += 1;
  } while (fetchedCount < totalCount);

  return { ok: true, from, until, totalCount: expenses.length, locationId: id, expenses };
}

export async function getBistroData(from, until, locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  const cookies = await loginBistrosoft(id);
  const [sales, expenses] = await Promise.all([
    getBistroSales(from, until, cookies, id),
    getBistroExpenses(from, until, cookies, id),
  ]);
  return { sales, expenses };
}

export async function getBistroMonths(locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  const cookies = await loginBistrosoft(id);
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + 1);
  const query = new URLSearchParams({
    Period: "ConfigurablePeriod",
    From: "2010-01-01",
    Until: isoDate(until),
  });
  const [result, expenseHistory] = await Promise.all([
    bistroRequest(`/api/report/salesDataPerMonthV2?${query}`, {}, cookies),
    getBistroExpenses("2010-01-01", isoDate(until), cookies, id),
  ]);
  if (result.data.responseCode !== 0) {
    throw new Error("Bistrosoft no pudo informar los meses disponibles.");
  }
  const salesMonths = [...new Set(
    (result.data.items || [])
      .map((item) => String(item.date || ""))
      .filter((value) => /^\d{4}-\d{2}$/.test(value)),
  )];
  const months = [...new Set([
    ...salesMonths,
    ...expenseHistory.expenses.map((item) => item.date.slice(0, 7)),
  ])].sort();
  return { ok: true, locationId: id, months };
}

export async function readBistroStatus(locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  const status = await stateStore().get(bistroStatusKey(id), { type: "json", consistency: "strong" });
  if (status) return status;
  if (id === DEFAULT_LOCATION_ID) {
    return await stateStore().get(STATUS_KEY, { type: "json", consistency: "strong" }) || {};
  }
  return {};
}

export async function writeBistroError(error, locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  await stateStore().setJSON(bistroStatusKey(id), {
    connected: false,
    lastSyncAt: null,
    lastError: error.message,
    locationId: id,
  });
}

export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function recentRange(days = 14) {
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + 1);
  const from = new Date(until);
  from.setUTCDate(from.getUTCDate() - days);
  return { from: isoDate(from), until: isoDate(until) };
}

function monthsInRange(from, until) {
  const months = [];
  const cursor = new Date(`${from.slice(0, 7)}-01T00:00:00Z`);
  const end = new Date(`${until}T00:00:00Z`);
  while (cursor < end) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export async function mergeBistroSales(sales, from, until, locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  const months = monthsInRange(from, until);
  return updateState((current) => {
    const allLocationSync = current?.bistroSyncedMonthsByLocation || {};
    const currentLocationSync = allLocationSync[id] || {};
    const nextSalesMonths = [...new Set([
      ...(currentLocationSync.sales || []),
      ...(id === DEFAULT_LOCATION_ID ? current?.bistroSalesSyncedMonths || [] : []),
      ...months,
    ])].sort();
    return {
      ...(current || {}),
      sales: [
        ...(current?.sales || []).filter((sale) =>
          !(normalizeLocationId(sale.locationId) === id && sale.date >= from && sale.date < until)
        ),
        ...sales.map((sale) => ({ ...sale, locationId: id })),
      ],
      bistroSyncedMonthsByLocation: {
        ...allLocationSync,
        [id]: {
          ...currentLocationSync,
          sales: nextSalesMonths,
        },
      },
      ...(id === DEFAULT_LOCATION_ID ? { bistroSalesSyncedMonths: nextSalesMonths } : {}),
    };
  });
}

export async function mergeBistroExpenses(expenses, from, until, locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  const months = monthsInRange(from, until);
  return updateState((current) => {
    const categoryOverrides = current?.expenseCategoryOverrides || {};
    const categorizedExpenses = expenses.map((expense) => ({
      ...expense,
      locationId: id,
      category: categoryOverrides[expense.id] || categoryOverrides[expense.bistroId] || expense.category,
    }));
    const allLocationSync = current?.bistroSyncedMonthsByLocation || {};
    const currentLocationSync = allLocationSync[id] || {};
    const nextExpenseMonths = [...new Set([
      ...(currentLocationSync.expenses || []),
      ...(id === DEFAULT_LOCATION_ID ? current?.bistroExpenseSyncedMonths || [] : []),
      ...months,
    ])].sort();
    return {
      ...(current || {}),
      expenses: [
        ...(current?.expenses || []).filter((expense) =>
          !(expense._source === "bistrosoft"
            && normalizeLocationId(expense.locationId) === id
            && expense.date >= from
            && expense.date < until)
        ),
        ...categorizedExpenses,
      ],
      expenseCategoryOverrides: categoryOverrides,
      bistroSyncedMonthsByLocation: {
        ...allLocationSync,
        [id]: {
          ...currentLocationSync,
          expenses: nextExpenseMonths,
        },
      },
      ...(id === DEFAULT_LOCATION_ID ? { bistroExpenseSyncedMonths: nextExpenseMonths } : {}),
    };
  });
}
