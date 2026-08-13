import {
  isActiveEmployee,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";
import { applyChangeMutation } from "./_changes.mjs";

export default async (request) => {
  if (request.method !== "PUT") return response({ ok: false }, 405);
  const session = requireSession(request);
  if (session instanceof Response) return session;
  if (!['admin', 'employee'].includes(session.role)) {
    return response({ ok: false, error: "Sesion no autorizada." }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return response({ ok: false, error: "Solicitud invalida." }, 400);
  }

  try {
    const state = await updateState((current) => {
      if (session.role === "employee" && !isActiveEmployee(current, session.employeeId)) {
        throw new Error("Este empleado no tiene acceso activo.");
      }
      return applyChangeMutation(current, body, session);
    });
    const id = body.action === "create" ? body.change?.id : body.id;
    return response({
      ok: true,
      change: (state.changes || []).find((change) => change.id === id) || null,
      persistedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error.message || "No se pudo guardar la solicitud.";
    const status = /invalida|no existe|no tiene acceso|Solo un administrador|empleado no existe/i.test(message) ? 400 : 500;
    return response({ ok: false, error: message }, status);
  }
};
