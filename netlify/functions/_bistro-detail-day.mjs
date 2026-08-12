import {
  internalWorkerToken,
  normalizeLocationId,
  stateStore,
} from "./_shared.mjs";

const DAY_JOB_PREFIX = "bistro-detail-day";
export const DAY_DETAIL_WORKER_SCOPE = "bistro-details-day";

export function isValidBistroDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime())
    && date.toISOString().slice(0, 10) === value
    && value <= new Date().toISOString().slice(0, 10);
}

export function nextBistroDay(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function dayJobKey(locationId, date) {
  return `${DAY_JOB_PREFIX}-${normalizeLocationId(locationId)}-${date}`;
}

export async function readDayDetailJob(locationId, date) {
  return await stateStore().get(dayJobKey(locationId, date), {
    type: "json",
    consistency: "strong",
  }) || null;
}

export async function writeDayDetailJob(locationId, date, job) {
  const next = {
    ...job,
    locationId: normalizeLocationId(locationId),
    date,
    updatedAt: new Date().toISOString(),
  };
  await stateStore().setJSON(dayJobKey(locationId, date), next);
  return next;
}

export async function createDayDetailJob(locationId, date) {
  const current = await readDayDetailJob(locationId, date);
  if (current && ["queued", "running"].includes(current.status)) {
    return { job: current, reused: true };
  }
  const now = new Date().toISOString();
  const job = await writeDayDetailJob(locationId, date, {
    jobId: crypto.randomUUID(),
    status: "queued",
    attempt: 0,
    maxAttempts: 3,
    totalTickets: 0,
    detailTickets: 0,
    unresolvedTickets: 0,
    startedAt: now,
    completedAt: null,
    lastError: null,
  });
  return { job, reused: false };
}

export function summarizeDayDetailJob(job) {
  if (!job) return null;
  return {
    jobId: job.jobId,
    locationId: job.locationId,
    date: job.date,
    status: job.status,
    attempt: Number(job.attempt || 0),
    maxAttempts: Number(job.maxAttempts || 3),
    totalTickets: Number(job.totalTickets || 0),
    detailTickets: Number(job.detailTickets || 0),
    unresolvedTickets: Number(job.unresolvedTickets || 0),
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
    lastError: job.lastError || null,
  };
}

export async function triggerDayDetailWorker(origin, locationId, date, jobId) {
  const url = new URL("/.netlify/functions/bistro-details-day-background", origin);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-oss-internal-token": internalWorkerToken(DAY_DETAIL_WORKER_SCOPE),
    },
    body: JSON.stringify({ locationId: normalizeLocationId(locationId), date, jobId }),
  });
  if (!response.ok && response.status !== 202) {
    throw new Error(`No se pudo iniciar la carga del dia (HTTP ${response.status}).`);
  }
}
