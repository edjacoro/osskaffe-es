import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "oss-kaffe";
const STATE_KEY = "state";
const STATUS_KEY = "bistro-status";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const BISTRO_BASE_URL = "https://es.bistrosoft.com";

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
  const value = process.env.SESSION_SECRET || "";
  if (value.length < 32) throw new Error("SESSION_SECRET debe tener al menos 32 caracteres.");
  return value;
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

export function employeeState(fullState, employeeId) {
  if (!fullState) return null;
  return {
    ...fullState,
    punches: (fullState.punches || []).filter((item) => item.employeeId === employeeId),
    changes: (fullState.changes || []).filter((item) => item.employeeId === employeeId),
    sales: [],
    expenses: [],
    contracts: {},
    budgets: {},
    profiles: fullState.profiles?.[employeeId]
      ? { [employeeId]: fullState.profiles[employeeId] }
      : {},
  };
}

export function mergeEmployeeState(current, submitted, employeeId) {
  const currentProfiles = current?.profiles || {};
  const ownProfile = submitted?.profiles?.[employeeId];
  const currentPunches = current?.punches || [];
  const currentChanges = current?.changes || [];
  const ownPunches = (submitted?.punches || []).filter((item) => item.employeeId === employeeId);
  const ownChanges = (submitted?.changes || []).filter((item) => item.employeeId === employeeId);
  return {
    ...(current || {}),
    punches: [...currentPunches.filter((item) => item.employeeId !== employeeId), ...ownPunches],
    changes: [...currentChanges.filter((item) => item.employeeId !== employeeId), ...ownChanges],
    profiles: ownProfile ? { ...currentProfiles, [employeeId]: ownProfile } : currentProfiles,
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

async function loginBistrosoft() {
  const username = process.env.BISTROSOFT_USERNAME || "";
  const password = process.env.BISTROSOFT_PASSWORD || "";
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

export async function getBistroSales(from, until) {
  let cookies = await loginBistrosoft();
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
        id: `bistro-${stableId}`,
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
  await stateStore().setJSON(STATUS_KEY, {
    connected: true,
    lastSyncAt: fetchedAt,
    lastError: null,
  });
  return { ok: true, source: "bistrosoft", from, until, fetchedAt, totalCount: sales.length, sales };
}

export async function readBistroStatus() {
  return await stateStore().get(STATUS_KEY, { type: "json", consistency: "strong" }) || {};
}

export async function writeBistroError(error) {
  await stateStore().setJSON(STATUS_KEY, {
    connected: false,
    lastSyncAt: null,
    lastError: error.message,
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

export async function mergeBistroSales(sales, from, until) {
  return updateState((current) => ({
    ...(current || {}),
    sales: [
      ...(current?.sales || []).filter((sale) => !(sale.date >= from && sale.date < until)),
      ...sales,
    ],
  }));
}
