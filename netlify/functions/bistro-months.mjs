import {
  getBistroMonths,
  requireSession,
  response,
  writeBistroError,
} from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  try {
    return response(await getBistroMonths());
  } catch (error) {
    await writeBistroError(error);
    return response({ ok: false, error: "No se pudo consultar el historial de Bistrosoft." }, 502);
  }
};
