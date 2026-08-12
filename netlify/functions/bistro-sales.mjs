import {
  bistroDetailFetchOptions,
  getBistroData,
  mergeBistroExpenses,
  mergeBistroSales,
  normalizeLocationId,
  requireSession,
  response,
  writeBistroError,
} from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || "";
  const until = url.searchParams.get("until") || "";
  const locationId = normalizeLocationId(url.searchParams.get("location"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    return response({ ok: false, error: "Rango invalido." }, 400);
  }
  try {
    const detailOptions = url.searchParams.get("skipItems") === "1"
      ? { skipItemEnrichment: true }
      : bistroDetailFetchOptions(
        from,
        until,
        url.searchParams.get("forceItems") === "1",
      );
    const { sales: result, expenses: expenseResult } = await getBistroData(
      from,
      until,
      locationId,
      detailOptions,
    );
    const mergedState = await mergeBistroSales(result.sales, from, until, locationId);
    await mergeBistroExpenses(expenseResult.expenses, from, until, locationId);
    const persistedSales = (mergedState?.sales || []).filter((sale) =>
      normalizeLocationId(sale.locationId) === locationId
      && sale._source === "bistrosoft"
      && sale.date >= from
      && sale.date < until
    );
    return response({
      ...result,
      sales: persistedSales,
      totalCount: persistedSales.length,
      itemDetailCount: persistedSales.filter((sale) => Array.isArray(sale.items) && sale.items.length).length,
      expenses: expenseResult.expenses,
      expenseCount: expenseResult.totalCount,
      persisted: true,
    });
  } catch (error) {
    await writeBistroError(error, locationId);
    return response({ ok: false, error: "No se pudo sincronizar Bistrosoft." }, 502);
  }
};
