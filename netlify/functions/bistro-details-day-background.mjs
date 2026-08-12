import {
  getBistroSales,
  hasInternalWorkerAccess,
  loginBistrosoft,
  mergeBistroSales,
  normalizeLocationId,
} from "./_shared.mjs";
import {
  DAY_DETAIL_WORKER_SCOPE,
  isValidBistroDay,
  nextBistroDay,
  readDayDetailJob,
  writeDayDetailJob,
} from "./_bistro-detail-day.mjs";

export default async (request) => {
  if (!hasInternalWorkerAccess(request, DAY_DETAIL_WORKER_SCOPE)) return;
  let body = {};
  try {
    body = await request.json();
  } catch (_) {}
  const locationId = normalizeLocationId(body.locationId);
  const date = String(body.date || "");
  const jobId = String(body.jobId || "");
  if (!jobId || !isValidBistroDay(date)) return;

  let job = await readDayDetailJob(locationId, date);
  if (!job || job.jobId !== jobId || !["queued", "running"].includes(job.status)) return;
  job = await writeDayDetailJob(locationId, date, { ...job, status: "running", lastError: null });

  try {
    const cookies = await loginBistrosoft(locationId);
    const until = nextBistroDay(date);
    let result = null;
    for (let attempt = 1; attempt <= Number(job.maxAttempts || 3); attempt += 1) {
      job = await writeDayDetailJob(locationId, date, { ...job, status: "running", attempt });
      result = await getBistroSales(date, until, cookies, locationId, {
        includeAllItems: true,
        forceItemRetry: true,
        maxDetailAttempts: 8,
      });
      await mergeBistroSales(result.sales, date, until, locationId);
      const totalTickets = Number(result.totalCount || 0);
      const detailTickets = Number(result.itemDetailCount || 0);
      const unresolvedTickets = Math.max(0, totalTickets - detailTickets);
      job = await writeDayDetailJob(locationId, date, {
        ...job,
        totalTickets,
        detailTickets,
        unresolvedTickets,
      });
      if (!unresolvedTickets) break;
    }

    const completedAt = new Date().toISOString();
    await writeDayDetailJob(locationId, date, {
      ...job,
      status: job.unresolvedTickets > 0 ? "partial" : "complete",
      completedAt,
      lastError: null,
    });
  } catch (error) {
    await writeDayDetailJob(locationId, date, {
      ...job,
      status: "error",
      completedAt: new Date().toISOString(),
      lastError: error.message || "No se pudieron recuperar los productos del dia.",
    });
  }
};

export const config = {
  background: true,
};
