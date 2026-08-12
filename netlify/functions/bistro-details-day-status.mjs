import {
  normalizeLocationId,
  requireSession,
  response,
} from "./_shared.mjs";
import {
  isValidBistroDay,
  readDayDetailJob,
  summarizeDayDetailJob,
} from "./_bistro-detail-day.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const locationId = normalizeLocationId(url.searchParams.get("location"));
  const date = String(url.searchParams.get("date") || "");
  if (!isValidBistroDay(date)) return response({ ok: false, error: "Fecha invalida." }, 400);
  const job = await readDayDetailJob(locationId, date);
  return response({ ok: true, job: summarizeDayDetailJob(job) });
};
