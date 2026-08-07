import {
  hasBistroCredentials,
  LOCATION_IDS,
  normalizeLocationId,
  requireSession,
  response,
} from "./_shared.mjs";
import {
  createHistoricalDetailJob,
  summarizeDetailJob,
  triggerDetailWorker,
} from "./_bistro-detail-queue.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  if (request.method !== "POST") return response({ ok: false, error: "Metodo no permitido." }, 405);

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}
  const requestedLocations = Array.isArray(body.locations) && body.locations.length
    ? [...new Set(body.locations.map(normalizeLocationId))]
    : LOCATION_IDS;
  const locations = requestedLocations.filter((locationId) => hasBistroCredentials(locationId));
  if (!locations.length) {
    return response({ ok: false, error: "No hay tiendas con Bistrosoft configurado." }, 400);
  }

  const jobs = {};
  const errors = [];
  for (const locationId of locations) {
    try {
      const { job, reused } = await createHistoricalDetailJob(locationId, {
        forceRetry: body.force === true,
      });
      await triggerDetailWorker(new URL(request.url).origin, locationId, job.jobId);
      jobs[locationId] = { ...summarizeDetailJob(job), reused };
    } catch (error) {
      errors.push(`${locationId}: ${error.message}`);
    }
  }

  if (!Object.keys(jobs).length) {
    return response({ ok: false, error: errors.join(" | ") || "No se pudo iniciar la carga historica." }, 502);
  }
  return response({ ok: true, jobs, errors });
};
