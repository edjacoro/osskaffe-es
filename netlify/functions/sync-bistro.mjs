import {
  getBistroData,
  hasBistroCredentials,
  LOCATION_IDS,
  mergeBistroExpenses,
  mergeBistroSales,
  recentRange,
  writeBistroError,
} from "./_shared.mjs";
import { enqueueRecentDetailJob, triggerDetailWorker } from "./_bistro-detail-queue.mjs";

export default async (request) => {
  const { from, until } = recentRange(14);
  const errors = [];
  const origin = request?.url ? new URL(request.url).origin : process.env.URL;
  for (const locationId of LOCATION_IDS) {
    if (!hasBistroCredentials(locationId)) continue;
    try {
      const { sales: result, expenses: expenseResult } = await getBistroData(from, until, locationId);
      await mergeBistroSales(result.sales, from, until, locationId);
      await mergeBistroExpenses(expenseResult.expenses, from, until, locationId);
      if (origin) {
        try {
          const detailJob = await enqueueRecentDetailJob(locationId, 3);
          await triggerDetailWorker(origin, locationId, detailJob.jobId);
        } catch (_) {
          // La lectura rapida queda guardada aunque el detalle se reanude mas tarde.
        }
      }
    } catch (error) {
      await writeBistroError(error, locationId);
      errors.push(error);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
};

export const config = {
  schedule: "*/30 * * * *",
};
