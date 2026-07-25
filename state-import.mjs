import {
  getBistroMonths,
  normalizeLocationId,
  requireSession,
  response,
  writeBistroError,
} from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  const locationId = normalizeLocationId(new URL(request.url).searchParams.get("location"));
  try {
    return response(await getBistroMonths(locationId));
  } catch (error) {
    await writeBistroError(error, locationId);
    return response({ ok: false, error: "No se pudo consultar el historial de Bistrosoft." }, 502);
  }
};
