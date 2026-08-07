import crypto from "node:crypto";
import {
  getBistroSales,
  getBistroSalesMonths,
  hasInternalWorkerAccess,
  loginBistrosoft,
  mergeBistroSales,
  normalizeLocationId,
  requireSession,
} from "./_shared.mjs";
import {
  claimDetailJob,
  datesForMonths,
  DETAIL_WORKER_SCOPE,
  nextDateKey,
  releaseDetailJob,
  saveClaimedDetailJob,
  triggerDetailWorker,
} from "./_bistro-detail-queue.mjs";

const MAX_DAYS_PER_RUN = 5;
const MAX_RUN_MS = 8 * 60 * 1000;
const MAX_DATE_ATTEMPTS = 3;

async function requestPayload(request) {
  try {
    return await request.json();
  } catch (_) {
    const url = new URL(request.url);
    return {
      locationId: url.searchParams.get("location"),
      jobId: url.searchParams.get("jobId"),
    };
  }
}

export default async (request) => {
  if (!hasInternalWorkerAccess(request, DETAIL_WORKER_SCOPE)) {
    const session = requireSession(request, "admin");
    if (session instanceof Response) return session;
  }

  const payload = await requestPayload(request);
  const locationId = normalizeLocationId(payload.locationId);
  const jobId = String(payload.jobId || "");
  if (!jobId) return;

  const workerId = crypto.randomUUID();
  let job = await claimDetailJob(locationId, jobId, workerId);
  if (!job) return;
  const startedAt = Date.now();

  try {
    if (job.phase === "discovering") {
      const months = await getBistroSalesMonths(locationId);
      const discoveredDates = datesForMonths(months);
      job = await saveClaimedDetailJob(locationId, jobId, workerId, (current) => {
        const results = { ...(current.results || {}) };
        const finishedDates = new Set(
          Object.entries(results)
            .filter(([, result]) => result.status === "complete")
            .map(([date]) => date),
        );
        const pendingDates = [...new Set([
          ...(current.pendingDates || []),
          ...discoveredDates.filter((date) => !finishedDates.has(date)),
        ])].sort();
        pendingDates.forEach((date) => {
          if (results[date]?.status === "partial") {
            results[date] = { ...results[date], status: "retrying" };
          }
        });
        return {
          ...current,
          phase: "details",
          months,
          pendingDates,
          results,
          totalDays: new Set([...Object.keys(results), ...pendingDates]).size,
          lastError: null,
        };
      });
    }

    const cookies = await loginBistrosoft(locationId);
    let processedThisRun = 0;
    while ((job.pendingDates || []).length
      && processedThisRun < MAX_DAYS_PER_RUN
      && Date.now() - startedAt < MAX_RUN_MS) {
      const date = job.pendingDates[0];
      job = await saveClaimedDetailJob(locationId, jobId, workerId, (current) => ({
        ...current,
        status: "running",
        currentDate: date,
        lastError: null,
      }));

      const until = nextDateKey(date);
      const result = await getBistroSales(date, until, cookies, locationId, {
        includeAllItems: true,
        forceItemRetry: job.forceRetry === true,
        maxDetailAttempts: job.forceRetry === true ? 6 : 3,
      });
      await mergeBistroSales(result.sales, date, until, locationId);

      job = await saveClaimedDetailJob(locationId, jobId, workerId, (current) => {
        const dateAttempt = Number(current.dateAttempts?.[date] || 0) + 1;
        const totalTickets = Number(result.totalCount || 0);
        const detailTickets = Number(result.itemDetailCount || 0);
        const attemptedTickets = result.sales.filter((sale) =>
          sale.items?.length || Number(sale.detailAttempts || 0) > 0
        ).length;
        const errorTickets = result.sales.filter((sale) => sale.detailStatus === "error").length;
        const unresolvedTickets = Math.max(0, totalTickets - detailTickets);
        const shouldRetry = unresolvedTickets > 0 && dateAttempt < MAX_DATE_ATTEMPTS;
        const pendingDates = (current.pendingDates || []).filter((pendingDate, index) =>
          index !== 0 || pendingDate !== date
        );
        if (shouldRetry) pendingDates.push(date);
        return {
          ...current,
          pendingDates,
          dateAttempts: { ...(current.dateAttempts || {}), [date]: dateAttempt },
          results: {
            ...(current.results || {}),
            [date]: {
              status: shouldRetry ? "retrying" : (unresolvedTickets ? "partial" : "complete"),
              totalTickets,
              detailTickets,
              attemptedTickets,
              errorTickets,
              unresolvedTickets,
              attempts: dateAttempt,
              checkedAt: new Date().toISOString(),
            },
          },
          currentDate: null,
        };
      });
      processedThisRun += 1;
    }

    const pending = (job.pendingDates || []).length > 0;
    const hasPartial = Object.values(job.results || {}).some((result) => result.status === "partial");
    job = await releaseDetailJob(locationId, jobId, workerId, {
      status: pending ? "queued" : (hasPartial ? "complete_partial" : "complete"),
      completedAt: pending ? null : new Date().toISOString(),
      lastError: null,
    });

    if (pending) {
      await triggerDetailWorker(new URL(request.url).origin, locationId, jobId);
    }
  } catch (error) {
    await releaseDetailJob(locationId, jobId, workerId, {
      status: "queued",
      lastError: error.message || "No se pudo completar el detalle historico.",
      errorCount: Number(job.errorCount || 0) + 1,
    });
    throw error;
  }
};

export const config = {
  background: true,
};
