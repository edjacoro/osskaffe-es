import {
  readStateEntry,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";
import { deleteRetiredBarcelonaEncargadoState, deleteTestTeamMemberState, publicTeamEmployees, upsertTeamMemberState } from "./_team.mjs";

export default async (request) => {
  if (request.method === "DELETE") {
    const session = requireSession(request, "admin");
    if (session instanceof Response) return session;
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return response({ ok: false, error: "Solicitud invalida." }, 400);
    }
    try {
      if (body.action === "remove-retired-barcelona-encargado") {
        let deletedEmployeeId = null;
        const state = await updateState((current) => {
          const next = deleteRetiredBarcelonaEncargadoState(current);
          deletedEmployeeId = (current?.employees || []).find((employee) =>
            !(next?.employees || []).some((item) => item.id === employee.id)
          )?.id || null;
          return next;
        });
        const { state: confirmed } = await readStateEntry();
        if (deletedEmployeeId && (
          (confirmed?.employees || []).some((employee) => employee.id === deletedEmployeeId)
          || !(confirmed?.deletedTeamIds || []).includes(deletedEmployeeId)
        )) throw new Error("Netlify no confirmó la eliminación de la ficha.");
        return response({ ok: true, deletedEmployeeId, revision: Number(confirmed?._meta?.revision || state?._meta?.revision || 0) });
      }
      const employeeId = String(body.employeeId || "");
      await updateState((current) => deleteTestTeamMemberState(current, employeeId));
      return response({ ok: true, deletedEmployeeId: employeeId, persistedAt: new Date().toISOString() });
    } catch (error) {
      const status = /invalido|no existe|Solo se pueden/.test(String(error.message || "")) ? 400 : 500;
      return response({ ok: false, error: error.message || "No se pudo borrar el empleado de prueba." }, status);
    }
  }

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
      const status = /eliminado definitivamente/.test(String(error.message || ""))
        ? 409
        : /obligatorio|invalido|anterior/.test(String(error.message || "")) ? 400 : 500;
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
