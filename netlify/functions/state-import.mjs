import {
  replaceState,
  requireSession,
  response,
} from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;

  if (request.method !== "PUT" && request.method !== "POST") {
    return response({ ok: false, error: "Metodo no permitido." }, 405);
  }

  try {
    const body = await request.json();
    const nextState = body?.state;
    if (!nextState || typeof nextState !== "object") {
      return response({ ok: false, error: "Estado invalido." }, 400);
    }
    await replaceState(nextState);
    return response({ ok: true });
  } catch (error) {
    return response({
      ok: false,
      error: error.message || "No se pudo guardar el respaldo en Netlify.",
    }, 500);
  }
};
