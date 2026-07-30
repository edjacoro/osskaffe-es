import {
  getBistroSales,
  mergeBistroSales,
  normalizeLocationId,
  requireSession,
  updateState,
} from "./_shared.mjs";

function monthRange(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return {
    from: `${monthKey}-01`,
    until: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
  };
}

async function writeJob(locationId, month, job) {
  await updateState((current) => ({
    ...(current || {}),
    bistroDetailJobs: {
      ...(current?.bistroDetailJobs || {}),
      [locationId]: {
        ...(current?.bistroDetailJobs?.[locationId] || {}),
        [month]: {
          ...(current?.bistroDetailJobs?.[locationId]?.[month] || {}),
          ...job,
          updatedAt: new Date().toISOString(),
        },
      },
    },
  }));
}

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const month = url.searchParams.get("month") || "";
  const jobId = url.searchParams.get("jobId") || "";
  const locationId = normalizeLocationId(url.searchParams.get("location"));
  if (!/^\d{4}-\d{2}$/.test(month) || !jobId) return;

  await writeJob(locationId, month, { jobId, status: "running", error: null });
  try {
    const { from, until } = monthRange(month);
    const result = await getBistroSales(from, until, "", locationId, { includeAllItems: true });
    await mergeBistroSales(result.sales, from, until, locationId);
    await writeJob(locationId, month, {
      jobId,
      status: "complete",
      totalCount: result.totalCount,
      itemDetailCount: result.itemDetailCount,
      error: null,
    });
  } catch (error) {
    await writeJob(locationId, month, {
      jobId,
      status: "error",
      error: error.message || "No se pudo completar el detalle histórico.",
    });
    throw error;
  }
};

export const config = {
  background: true,
};
