import {
  hasBistroCredentials,
  normalizeLocationId,
  requireSession,
  response,
} from "./_shared.mjs";
import {
  createDayDetailJob,
  isValidBistroDay,
  summarizeDayDetailJob,
  triggerDayDetailWorker,
} from "./_bistro-detail-day.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  if (request.method !== "POST") return response({ ok: false, error: "Metodo no permitido." }, 405);

  let body = {};
  try {
    body = await request.json();
  } catch (_) {}
  const locationId = normalizeLocationId(body.location);
  const date = String(body.date || "");
  if (!isValidBistroDay(date)) return response({ ok: false, error: "Fecha invalida." }, 400);
  if (!hasBistroCredentials(locationId)) {
    return response({ ok: false, error: "Bistrosoft no esta configurado para esta tienda." }, 400);
  }

  try {
    const { job, reused } = await createDayDetailJob(locationId, date);
    await triggerDayDetailWorker(new URL(request.url).origin, locationId, date, job.jobId);
    return response({ ok: true, job: { ...summarizeDayDetailJob(job), reused } });
  } catch (error) {
    return response({ ok: false, error: error.message || "No se pudo iniciar la carga del dia." }, 502);
  }
};
