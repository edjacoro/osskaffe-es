import {
  readStateEntry,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";
import { publicTeamEmployees, upsertTeamMemberState } from "./_team.mjs";

export default async (request) => {
  if (request.method === "PUT") {
    const session = requireSession(request, "admin");
    if (session instanceof Response) return session;
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return response({ ok: false, error: "Solicitud invalida." }, 400);
    }
    try {
      const state = await updateState((current) => upsertTeamMemberState(current, body));
      const employeeId = String(body.employee?.id || "");
      return response({
        ok: true,
        employee: (state.employees || []).find((employee) => employee.id === employeeId) || null,
        persistedAt: new Date().toISOString(),
      });
    } catch (error) {
      const status = /obligatorio|invalido|anterior/.test(String(error.message || "")) ? 400 : 500;
      return response({ ok: false, error: error.message || "No se pudo guardar el empleado." }, status);
    }
  }

  if (request.method !== "GET") return response({ ok: false }, 405);
  const { state } = await readStateEntry();
  return response({
    ok: true,
    employees: publicTeamEmployees(state),
  });
};
