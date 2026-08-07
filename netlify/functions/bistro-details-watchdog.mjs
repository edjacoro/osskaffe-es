import { LOCATION_IDS } from "./_shared.mjs";
import { readDetailJob, triggerDetailWorker } from "./_bistro-detail-queue.mjs";

export default async (request) => {
  const origin = request?.url ? new URL(request.url).origin : process.env.URL;
  if (!origin) return;
  for (const locationId of LOCATION_IDS) {
    const job = await readDetailJob(locationId);
    if (!job || !["queued", "running"].includes(job.status)) continue;
    const lockExpiresAt = Date.parse(job.lock?.expiresAt || "");
    if (job.status === "running" && lockExpiresAt > Date.now()) continue;
    try {
      await triggerDetailWorker(origin, locationId, job.jobId);
    } catch (_) {
      // El siguiente control programado vuelve a intentar una cola detenida.
    }
  }
};

export const config = {
  schedule: "*/10 * * * *",
};
