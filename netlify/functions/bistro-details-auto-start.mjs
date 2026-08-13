import {
  hasBistroCredentials,
  LOCATION_IDS,
  readStateEntry,
  requireSession,
  response,
} from "./_shared.mjs";
import {
  createMissingDetailJob,
  markAutoMissingVersion,
  missingBistroDetailDates,
  readAutoMissingVersion,
  readDetailJob,
  summarizeDetailJob,
  triggerDetailWorker,
} from "./_bistro-detail-queue.mjs";

// Nueva pasada unica: completa cualquier dia historico que todavia no tenga
// articulos antes de recalcular la relacion cafe / pasteleria.
const AUTO_MISSING_VERSION = "2026-08-13-v2-cross-selling";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  if (request.method !== "POST") return response({ ok: false, error: "Metodo no permitido." }, 405);

  const { state } = await readStateEntry();
  const sales = Array.isArray(state?.sales) ? state.sales : [];
  const today = new Date().toISOString().slice(0, 10);
  const jobs = {};
  const alreadyRun = {};
  const errors = [];

  for (const locationId of LOCATION_IDS.filter(hasBistroCredentials)) {
    try {
      const marker = await readAutoMissingVersion(locationId);
      if (marker?.version === AUTO_MISSING_VERSION) {
        const current = await readDetailJob(locationId);
        if (current && ["queued", "running"].includes(current.status)) {
          await triggerDetailWorker(new URL(request.url).origin, locationId, current.jobId);
          jobs[locationId] = { ...summarizeDetailJob(current), reused: true };
        }
        alreadyRun[locationId] = marker;
        continue;
      }

      const dates = missingBistroDetailDates(sales, locationId, today);
      if (!dates.length) {
        alreadyRun[locationId] = await markAutoMissingVersion(locationId, AUTO_MISSING_VERSION, {
          missingDays: 0,
          status: "nothing_missing",
        });
        continue;
      }

      const { job, reused } = await createMissingDetailJob(locationId, dates);
      await triggerDetailWorker(new URL(request.url).origin, locationId, job.jobId);
      await markAutoMissingVersion(locationId, AUTO_MISSING_VERSION, {
        missingDays: dates.length,
        jobId: job.jobId,
        status: "started",
      });
      jobs[locationId] = { ...summarizeDetailJob(job), reused, missingDays: dates.length };
    } catch (error) {
      errors.push(`${locationId}: ${error.message || "No se pudo iniciar la carga automatica."}`);
    }
  }

  if (!Object.keys(jobs).length && !Object.keys(alreadyRun).length && errors.length) {
    return response({ ok: false, error: errors.join(" | ") }, 502);
  }
  return response({
    ok: true,
    version: AUTO_MISSING_VERSION,
    jobs,
    alreadyRun,
    errors,
  });
};
