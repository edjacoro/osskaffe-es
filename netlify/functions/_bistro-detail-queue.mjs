import crypto from "node:crypto";
import {
  internalWorkerToken,
  normalizeLocationId,
  stateStore,
} from "./_shared.mjs";

const JOB_PREFIX = "bistro-detail-backfill";
const WORKER_SCOPE = "bistro-details";
const LOCK_MS = 11 * 60 * 1000;

function jobKey(locationId) {
  return `${JOB_PREFIX}-${normalizeLocationId(locationId)}`;
}

function isoNow() {
  return new Date().toISOString();
}

export function nextDateKey(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function datesForMonths(months = [], today = new Date().toISOString().slice(0, 10)) {
  const dates = new Set();
  months.filter((month) => /^\d{4}-\d{2}$/.test(month)).forEach((month) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    for (let day = 1; day <= lastDay; day += 1) {
      const dateKey = `${month}-${String(day).padStart(2, "0")}`;
      if (dateKey <= today) dates.add(dateKey);
    }
  });
  return [...dates].sort();
}

export async function readDetailJob(locationId) {
  return await stateStore().get(jobKey(locationId), { type: "json", consistency: "strong" }) || null;
}

export async function updateDetailJob(locationId, mutator) {
  const store = stateStore();
  const key = jobKey(locationId);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const entry = await store.getWithMetadata(key, { type: "json", consistency: "strong" });
    const current = entry?.data || null;
    const next = await mutator(current);
    if (!next) return current;
    const options = entry?.etag ? { onlyIfMatch: entry.etag } : { onlyIfNew: true };
    const result = await store.setJSON(key, next, options);
    if (result.modified) return next;
  }
  throw new Error("No se pudo actualizar la cola de detalle por escrituras simultaneas.");
}

function baseJob(locationId, { mode = "historical", forceRetry = false } = {}) {
  const now = isoNow();
  return {
    schemaVersion: 2,
    jobId: crypto.randomUUID(),
    locationId: normalizeLocationId(locationId),
    mode,
    forceRetry,
    status: "queued",
    phase: mode === "historical" ? "discovering" : "details",
    pendingDates: [],
    totalDays: 0,
    results: {},
    dateAttempts: {},
    currentDate: null,
    lock: null,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
    lastError: null,
    errorCount: 0,
  };
}

export async function createHistoricalDetailJob(locationId, { forceRetry = false } = {}) {
  let reused = false;
  const job = await updateDetailJob(locationId, (current) => {
    if (current?.mode === "historical" && ["queued", "running"].includes(current.status)) {
      reused = true;
      return current;
    }
    const next = baseJob(locationId, { mode: "historical", forceRetry });
    if (!current) return next;
    return {
      ...next,
      results: { ...(current.results || {}) },
      dateAttempts: forceRetry
        ? Object.fromEntries(Object.entries(current.dateAttempts || {}).filter(([date]) => current.results?.[date]?.status === "complete"))
        : { ...(current.dateAttempts || {}) },
      totalDays: Object.keys(current.results || {}).length,
    };
  });
  return { job, reused };
}

export async function enqueueRecentDetailJob(locationId, days = 3) {
  const today = new Date();
  const dates = [];
  for (let offset = Math.max(0, days - 1); offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }
  return await updateDetailJob(locationId, (current) => {
    const job = current || baseJob(locationId, { mode: "rolling" });
    const priorityDates = [...new Set(dates)];
    const prioritySet = new Set(priorityDates);
    const remainingDates = (job.pendingDates || []).filter((date) => !prioritySet.has(date));
    const pendingDates = [...priorityDates, ...remainingDates];
    return {
      ...job,
      status: "queued",
      phase: job.phase === "discovering" ? "discovering" : "details",
      pendingDates,
      totalDays: Math.max(
        Number(job.totalDays || 0),
        new Set([...Object.keys(job.results || {}), ...pendingDates]).size,
      ),
      recentQueuedAt: isoNow(),
      completedAt: null,
      updatedAt: isoNow(),
    };
  });
}

export async function claimDetailJob(locationId, jobId, workerId) {
  let claimed = false;
  const nowMs = Date.now();
  const job = await updateDetailJob(locationId, (current) => {
    claimed = false;
    if (!current || current.jobId !== jobId) return current;
    if (!["queued", "running"].includes(current.status)) return current;
    const lockExpiresAt = Date.parse(current.lock?.expiresAt || "");
    if (current.lock?.workerId && current.lock.workerId !== workerId && lockExpiresAt > nowMs) return current;
    claimed = true;
    return {
      ...current,
      status: "running",
      lock: {
        workerId,
        expiresAt: new Date(nowMs + LOCK_MS).toISOString(),
      },
      updatedAt: isoNow(),
    };
  });
  return claimed ? job : null;
}

export async function saveClaimedDetailJob(locationId, jobId, workerId, mutator) {
  let saved = false;
  const job = await updateDetailJob(locationId, (current) => {
    saved = false;
    if (!current || current.jobId !== jobId || current.lock?.workerId !== workerId) return current;
    saved = true;
    return {
      ...mutator(current),
      lock: {
        workerId,
        expiresAt: new Date(Date.now() + LOCK_MS).toISOString(),
      },
      updatedAt: isoNow(),
    };
  });
  if (!saved) throw new Error("El proceso de detalle perdio su bloqueo de trabajo.");
  return job;
}

export async function releaseDetailJob(locationId, jobId, workerId, values = {}) {
  return await updateDetailJob(locationId, (current) => {
    if (!current || current.jobId !== jobId || current.lock?.workerId !== workerId) return current;
    return {
      ...current,
      ...values,
      lock: null,
      currentDate: null,
      updatedAt: isoNow(),
    };
  });
}

export function summarizeDetailJob(job) {
  if (!job) return null;
  const results = Object.entries(job.results || {});
  const finalResults = results.filter(([, result]) => ["complete", "partial"].includes(result.status));
  const totals = finalResults.reduce((sum, [, result]) => {
    sum.tickets += Number(result.totalTickets || 0);
    sum.detailTickets += Number(result.detailTickets || 0);
    sum.attemptedTickets += Number(result.attemptedTickets || 0);
    if (result.status === "partial") sum.partialDays += 1;
    return sum;
  }, { tickets: 0, detailTickets: 0, attemptedTickets: 0, partialDays: 0 });
  const monthsByKey = new Map();
  finalResults.forEach(([date, result]) => {
    const month = date.slice(0, 7);
    const current = monthsByKey.get(month) || { month, tickets: 0, detailTickets: 0, partialDays: 0, days: 0 };
    current.tickets += Number(result.totalTickets || 0);
    current.detailTickets += Number(result.detailTickets || 0);
    current.partialDays += result.status === "partial" ? 1 : 0;
    current.days += 1;
    monthsByKey.set(month, current);
  });
  const totalDays = Math.max(Number(job.totalDays || 0), finalResults.length + (job.pendingDates || []).length);
  return {
    jobId: job.jobId,
    locationId: job.locationId,
    mode: job.mode,
    status: job.status,
    phase: job.phase,
    currentDate: job.currentDate,
    totalDays,
    finishedDays: finalResults.length,
    pendingDays: (job.pendingDates || []).length,
    progressPercent: totalDays ? finalResults.length / totalDays * 100 : (job.status.startsWith("complete") ? 100 : 0),
    totalTickets: totals.tickets,
    detailTickets: totals.detailTickets,
    attemptedTickets: totals.attemptedTickets,
    coveragePercent: totals.tickets ? totals.detailTickets / totals.tickets * 100 : 100,
    partialDays: totals.partialDays,
    partialMonths: [...monthsByKey.values()].filter((month) => month.detailTickets < month.tickets),
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
    lastError: job.lastError,
  };
}

export async function triggerDetailWorker(origin, locationId, jobId) {
  const url = new URL("/.netlify/functions/bistro-details-background", origin);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-oss-internal-token": internalWorkerToken(WORKER_SCOPE),
    },
    body: JSON.stringify({ locationId: normalizeLocationId(locationId), jobId }),
  });
  if (!response.ok && response.status !== 202) {
    throw new Error(`No se pudo iniciar el proceso de detalle (HTTP ${response.status}).`);
  }
  return true;
}

export const DETAIL_WORKER_SCOPE = WORKER_SCOPE;
