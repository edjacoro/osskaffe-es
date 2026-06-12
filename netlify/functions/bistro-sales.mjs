import {
  getBistroSales,
  mergeBistroSales,
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    return response({ ok: false, error: "Rango invalido." }, 400);
  }
  try {
    const result = await getBistroSales(from, until);
    await mergeBistroSales(result.sales, from, until);
    return response({ ...result, persisted: true });
  } catch (error) {
    await writeBistroError(error);
    return response({ ok: false, error: "No se pudo sincronizar Bistrosoft." }, 502);
  }
};
