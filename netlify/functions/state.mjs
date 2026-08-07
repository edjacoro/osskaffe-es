import {
  employeeState,
  isActiveEmployee,
  mergeAdminState,
  mergeEmployeeState,
  readStateEntry,
  requireSession,
  response,
  updateState,
  visitorState,
} from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request);
  if (session instanceof Response) return session;

  if (request.method === "GET") {
    const { state } = await readStateEntry();
    if (session.role === "employee" && !isActiveEmployee(state, session.employeeId)) {
      return response({ ok: false, error: "Este empleado fue dado de baja." }, 403);
    }
    return response({
      ok: true,
      state: session.role === "admin"
        ? state
        : session.role === "visitor"
          ? visitorState(state)
          : employeeState(state, session.employeeId),
    });
  }

  if (request.method === "PUT") {
    if (session.role === "visitor") {
      return response({ ok: false, error: "Acceso de solo lectura." }, 403);
    }
    if (session.role === "employee") {
      const { state } = await readStateEntry();
      if (!isActiveEmployee(state, session.employeeId)) {
        return response({ ok: false, error: "Este empleado fue dado de baja." }, 403);
      }
    }
    const body = await request.json();
    if (!body.state || typeof body.state !== "object") {
      return response({ ok: false, error: "Estado invalido." }, 400);
    }
    await updateState((current) =>
      session.role === "admin"
        ? mergeAdminState(current, body.state)
        : mergeEmployeeState(current, body.state, session.employeeId)
    );
    return response({ ok: true });
  }

  return response({ ok: false }, 405);
};
