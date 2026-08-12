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

export function internalWorkerToken(scope) {
  return sign(`internal-worker:${scope}`);
}

export function hasInternalWorkerAccess(request, scope) {
  const received = request.headers.get("x-oss-internal-token") || "";
  return secretsMatch(received, internalWorkerToken(scope));
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

export function stateStore() {
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

export async function replaceState(nextState) {
  if (!nextState || typeof nextState !== "object") {
    throw new Error("Estado invalido.");
  }
  await stateStore().setJSON(STATE_KEY, nextState);
  return nextState;
}

export async function replaceStateFromJsonText(stateJson) {
  const nextState = JSON.parse(stateJson);
  if (!nextState || typeof nextState !== "object") {
    throw new Error("Estado invalido.");
  }
  await stateStore().set(STATE_KEY, stateJson);
  return nextState;
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
  const today = new Date().toISOString().slice(0, 10);
  return employees.some((employee) => {
    if (employee.id !== employeeId || employee.canLogin === false) return false;
    if (employee.activeFrom && employee.activeFrom > today) return false;
    if (employee.active === false && (!employee.inactiveFrom || employee.inactiveFrom <= today)) return false;
    return true;
  });
}

export function employeeState(fullState, employeeId) {
  if (!fullState) return null;
  const profile = fullState.profiles?.[employeeId] || null;
  const {
    adminNotes: _adminNotes,
    payrollRegistered: _payrollRegistered,
    ...employeeProfile
  } = profile || {};
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

export async function loginBistrosoft(locationId = DEFAULT_LOCATION_ID) {
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

function extractBistroSaleItems(sale = {}) {
  const candidates = [
    sale.items,
    sale.saleItems,
    sale.products,
    sale.productItems,
    sale.details,
    sale.detail,
    sale.lines,
    sale.ticketItems,
    sale.articles,
  ].filter(Array.isArray);
  const lines = candidates.flat();
  return lines
    .map((item) => {
      const name = String(
        item.name
        || item.productName
        || item.articleName
        || item.saleProductName
        || item.productDescription
        || item.description
        || item.itemName
        || item.product
        || item.article
        || item.title
        || "",
      ).trim();
      const qty = Number(item.qty ?? item.quantity ?? item.quantitySold ?? item.units ?? item.count ?? item.cant ?? 1);
      const price = Number(item.price ?? item.unitPrice ?? item.pvp ?? item.amount ?? 0);
      const total = Number(item.total ?? item.lineTotal ?? item.totalAmount ?? item.subtotal ?? 0);
      if (!name) return null;
      return {
        name,
        qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
        price: Number.isFinite(price) && price > 0 ? price : 0,
        total: Number.isFinite(total) && total > 0 ? total : 0,
      };
    })
    .filter(Boolean);
}

function collectBistroItemLines(value, output = [], seen = new Set(), depth = 0) {
  if (!value || typeof value !== "object" || depth > 8 || seen.has(value)) return output;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry) => collectBistroItemLines(entry, output, seen, depth + 1));
    return output;
  }
  const hasItemName = [
    "name", "productName", "articleName", "saleProductName", "productDescription",
    "description", "itemName", "product", "article", "title",
  ].some((key) => typeof value[key] === "string" && value[key].trim());
  const hasItemMeasure = [
    "qty", "quantity", "quantitySold", "units", "count", "cant", "price",
    "unitPrice", "pvp", "lineTotal", "totalAmount", "subtotal",
  ].some((key) => value[key] !== undefined && value[key] !== null);
  if (hasItemName && hasItemMeasure) output.push(value);
  Object.values(value).forEach((entry) => {
    if (entry && typeof entry === "object") collectBistroItemLines(entry, output, seen, depth + 1);
  });
  return output;
}

function extractBistroDetailItems(payload = {}) {
  const roots = [
    payload,
    payload.data,
    payload.result,
    payload.sale,
    payload.modalInfo,
  ].filter((value) => value && typeof value === "object");
  const detailLines = [];
  const seen = new Set();
  roots.forEach((root) => collectBistroItemLines(root, detailLines, seen));
  return extractBistroSaleItems({ details: detailLines });
}

async function restoreBistroSaleItems(sales, locationId) {
  if (!sales.length) return sales;
  const { state } = await readStateEntry();
  const existingDetails = new Map(
    (state?.sales || [])
      .filter((sale) => normalizeLocationId(sale.locationId) === locationId)
      .map((sale) => [String(sale.bistroId || sale.id), {
        items: Array.isArray(sale.items) ? sale.items : [],
        detailStatus: sale.detailStatus || null,
        detailAttempts: Number(sale.detailAttempts || 0),
        detailCheckedAt: sale.detailCheckedAt || null,
      }]),
  );
  sales.forEach((sale) => {
    const saved = existingDetails.get(String(sale.bistroId || sale.id));
    if (!saved) return;
    if (saved.items.length) sale.items = saved.items;
    sale.detailStatus = saved.detailStatus;
    sale.detailAttempts = saved.detailAttempts;
    sale.detailCheckedAt = saved.detailCheckedAt;
  });
  return sales;
}

async function enrichBistroSaleItems(sales, cookies, locationId, options = {}) {
  await restoreBistroSaleItems(sales, locationId);
  const maxDetailAttempts = Math.max(1, Number(options.maxDetailAttempts || 3));
  const forceItemRetry = options.forceItemRetry === true;
  const pending = sales.filter((sale) =>
    (!Array.isArray(sale.items) || sale.items.length === 0)
    && (forceItemRetry || Number(sale.detailAttempts || 0) < maxDetailAttempts)
  );
  const workerCount = Math.min(10, pending.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (cursor < pending.length) {
      const sale = pending[cursor++];
      sale.detailAttempts = Number(sale.detailAttempts || 0) + 1;
      sale.detailCheckedAt = new Date().toISOString();
      const query = new URLSearchParams({
        SaleId: sale.rawSaleId,
        ShopCode: sale.shopCode,
        Timestamp: `${sale.rawDate} ${sale.time}`,
        RelatedDeviceId: sale.relatedDeviceId,
        UUID: sale.uuid,
      });
      try {
        const detail = await bistroRequest(`/api/consolidatedV2/saleDetails/?${query}`, {}, cookies);
        const detailItems = extractBistroDetailItems(detail.data);
        if (detailItems.length) {
          sale.items = detailItems;
          sale.detailStatus = "complete";
        } else {
          sale.items = sale.items || [];
          sale.detailStatus = "empty";
        }
      } catch (_) {
        sale.items = sale.items || [];
        sale.detailStatus = "error";
      }
    }
  }));
  return sales;
}

export async function getBistroSales(
  from,
  until,
  authenticatedCookies = "",
  locationId = DEFAULT_LOCATION_ID,
  options = {},
) {
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
        items: extractBistroSaleItems(sale),
        paymentMethod: paymentMethod(sale),
        barista: String(sale.waiterName || sale.employeeName || sale.userName || sale.sellerName || sale.cashierName || "").trim(),
        movementType: sale.movementType,
        status: sale.status,
        shopCode: String(sale.shopCode || ""),
        rawSaleId: String(sale.id || ""),
        rawDate: String(sale.date || ""),
        relatedDeviceId: String(sale.relatedDeviceId || ""),
        uuid: String(sale.uuid || ""),
        _source: "bistrosoft",
        _isBistrosoft: true,
      });
    }
    page += 1;
  } while (sales.length < totalCount);

  const rangeDays = Math.ceil((new Date(`${until}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000);
  if (rangeDays <= 1 || options.includeAllItems) await enrichBistroSaleItems(sales, cookies, id, options);
  else await restoreBistroSaleItems(sales, id);

  sales.forEach((sale) => {
    delete sale.rawSaleId;
    delete sale.rawDate;
    delete sale.relatedDeviceId;
    delete sale.uuid;
  });

  const fetchedAt = new Date().toISOString();
  await stateStore().setJSON(bistroStatusKey(id), {
    connected: true,
    lastSyncAt: fetchedAt,
    lastError: null,
    locationId: id,
  });
  return {
    ok: true,
    source: "bistrosoft",
    from,
    until,
    fetchedAt,
    totalCount: sales.length,
    itemDetailCount: sales.filter((sale) => Array.isArray(sale.items) && sale.items.length).length,
    locationId: id,
    sales,
  };
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
  return {
    ok: true,
    locationId: id,
    months,
    salesMonths,
    expenseMonths: [...new Set(expenseHistory.expenses.map((item) => item.date.slice(0, 7)))].sort(),
  };
}

export async function getBistroSalesMonths(locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  const cookies = await loginBistrosoft(id);
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + 1);
  const query = new URLSearchParams({
    Period: "ConfigurablePeriod",
    From: "2010-01-01",
    Until: isoDate(until),
  });
  const result = await bistroRequest(`/api/report/salesDataPerMonthV2?${query}`, {}, cookies);
  if (result.data.responseCode !== 0) {
    throw new Error("Bistrosoft no pudo informar los meses de ventas disponibles.");
  }
  return [...new Set(
    (result.data.items || [])
      .map((item) => String(item.date || ""))
      .filter((value) => /^\d{4}-\d{2}$/.test(value)),
  )].sort();
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

function expenseOverrideKeys(expense, locationId = DEFAULT_LOCATION_ID) {
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

function getExpenseCategoryOverride(expense, overrides = {}, locationId = DEFAULT_LOCATION_ID) {
  for (const key of expenseOverrideKeys(expense, locationId)) {
    if (overrides[key]) return overrides[key];
  }
  return null;
}

export function bistroSaleItemDetailScore(sale) {
  const items = Array.isArray(sale?.items) ? sale.items : [];
  if (!items.length) return 0;
  const quantity = items.reduce((sum, item) => {
    const value = Number(item?.qty ?? item?.quantity ?? item?.count ?? 1);
    return sum + (Number.isFinite(value) && value > 0 ? value : 1);
  }, 0);
  const completeBonus = sale?.detailStatus === "complete" ? 100000000 : 0;
  return completeBonus + items.length * 100000 + quantity;
}

export function mergeBistroSaleDetail(sale, previous, locationId = DEFAULT_LOCATION_ID) {
  const incomingItems = Array.isArray(sale?.items) ? sale.items : [];
  const previousItems = Array.isArray(previous?.items) ? previous.items : [];
  const usePrevious = previousItems.length > 0
    && bistroSaleItemDetailScore(previous) > bistroSaleItemDetailScore(sale);
  const items = usePrevious ? previousItems : incomingItems;
  return {
    ...sale,
    locationId: normalizeLocationId(locationId),
    items,
    detailStatus: items.length
      ? "complete"
      : (sale?.detailStatus || previous?.detailStatus || null),
    detailAttempts: Math.max(Number(sale?.detailAttempts || 0), Number(previous?.detailAttempts || 0)),
    detailCheckedAt: sale?.detailCheckedAt || previous?.detailCheckedAt || null,
  };
}

function collectExpenseCategoryOverrides(expenses = [], overrides = {}, locationId = DEFAULT_LOCATION_ID) {
  const next = { ...(overrides || {}) };
  expenses.forEach((expense) => {
    if (expense?._source !== "bistrosoft") return;
    const category = getExpenseCategoryOverride(expense, next, locationId) || expense.category;
    if (!category || category === "otros") return;
    expenseOverrideKeys(expense, locationId).forEach((key) => {
      next[key] = category;
    });
  });
  return next;
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
    const previousDetails = new Map(
      (current?.sales || [])
        .filter((sale) => normalizeLocationId(sale.locationId) === id)
        .map((sale) => [String(sale.bistroId || sale.id), sale]),
    );
    const mergedSales = sales.map((sale) =>
      mergeBistroSaleDetail(sale, previousDetails.get(String(sale.bistroId || sale.id)), id)
    );
    return {
      ...(current || {}),
      sales: [
        ...(current?.sales || []).filter((sale) =>
          !(normalizeLocationId(sale.locationId) === id
            && sale._source === "bistrosoft"
            && sale.date >= from
            && sale.date < until)
        ),
        ...mergedSales,
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

function recordIdentity(record) {
  return String(record?.bistroId || record?.id || "");
}

function mergePersistedBistroSales(currentSales = [], submittedSales = []) {
  const submittedManual = submittedSales.filter((sale) => sale?._source !== "bistrosoft");
  const currentBistro = currentSales.filter((sale) => sale?._source === "bistrosoft");
  const submittedBistro = submittedSales.filter((sale) => sale?._source === "bistrosoft");
  const byId = new Map(currentBistro.map((sale) => [recordIdentity(sale), sale]));
  submittedBistro.forEach((sale) => {
    const key = recordIdentity(sale);
    const persisted = byId.get(key);
    if (!persisted) {
      byId.set(key, sale);
      return;
    }
    const persistedItems = Array.isArray(persisted.items) ? persisted.items : [];
    const submittedItems = Array.isArray(sale.items) ? sale.items : [];
    byId.set(key, {
      ...sale,
      ...persisted,
      items: persistedItems.length >= submittedItems.length ? persistedItems : submittedItems,
      detailAttempts: Math.max(Number(persisted.detailAttempts || 0), Number(sale.detailAttempts || 0)),
      detailCheckedAt: persisted.detailCheckedAt || sale.detailCheckedAt || null,
      detailStatus: persistedItems.length
        ? "complete"
        : (persisted.detailStatus || sale.detailStatus || null),
    });
  });
  return [...submittedManual, ...byId.values()];
}

function mergePersistedBistroExpenses(currentExpenses = [], submittedExpenses = []) {
  const submittedManual = submittedExpenses.filter((expense) => expense?._source !== "bistrosoft");
  const currentBistro = currentExpenses.filter((expense) => expense?._source === "bistrosoft");
  const submittedBistro = submittedExpenses.filter((expense) => expense?._source === "bistrosoft");
  const submittedById = new Map(submittedBistro.map((expense) => [recordIdentity(expense), expense]));
  const byId = new Map(currentBistro.map((expense) => {
    const submitted = submittedById.get(recordIdentity(expense));
    return [recordIdentity(expense), {
      ...(submitted || {}),
      ...expense,
      category: submitted?.category || expense.category,
    }];
  }));
  submittedBistro.forEach((expense) => {
    const key = recordIdentity(expense);
    if (!byId.has(key)) byId.set(key, expense);
  });
  return [...submittedManual, ...byId.values()];
}

export function mergeAdminState(current, submitted) {
  if (!current || typeof current !== "object") return submitted;
  return {
    ...submitted,
    employees: Array.isArray(current.employees) && current.employees.length
      ? current.employees
      : submitted.employees,
    sales: mergePersistedBistroSales(current.sales || [], submitted.sales || []),
    expenses: mergePersistedBistroExpenses(current.expenses || [], submitted.expenses || []),
    bistroSyncedMonthsByLocation: current.bistroSyncedMonthsByLocation || submitted.bistroSyncedMonthsByLocation,
    bistroSalesSyncedMonths: current.bistroSalesSyncedMonths || submitted.bistroSalesSyncedMonths,
    bistroExpenseSyncedMonths: current.bistroExpenseSyncedMonths || submitted.bistroExpenseSyncedMonths,
    bistroDetailJobs: current.bistroDetailJobs || submitted.bistroDetailJobs,
  };
}

export async function mergeBistroExpenses(expenses, from, until, locationId = DEFAULT_LOCATION_ID) {
  const id = normalizeLocationId(locationId);
  const months = monthsInRange(from, until);
  return updateState((current) => {
    const categoryOverrides = collectExpenseCategoryOverrides(
      current?.expenses || [],
      current?.expenseCategoryOverrides || {},
      id,
    );
    const categorizedExpenses = expenses.map((expense) => ({
      ...expense,
      locationId: id,
      category: getExpenseCategoryOverride(expense, categoryOverrides, id) || expense.category,
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
