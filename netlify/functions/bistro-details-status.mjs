import {
  LOCATION_IDS,
  normalizeLocationId,
  requireSession,
  response,
} from "./_shared.mjs";
import { readDetailJob, summarizeDetailJob } from "./_bistro-detail-queue.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const requestedLocation = url.searchParams.get("location");
  const locations = requestedLocation ? [normalizeLocationId(requestedLocation)] : LOCATION_IDS;
  const jobs = {};
  await Promise.all(locations.map(async (locationId) => {
    jobs[locationId] = summarizeDetailJob(await readDetailJob(locationId));
  }));
  return response({ ok: true, jobs });
};
