import {
  employeeState,
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
    const body = await request.json();
    if (!body.state || typeof body.state !== "object") {
      return response({ ok: false, error: "Estado invalido." }, 400);
    }
    await updateState((current) =>
      session.role === "admin"
        ? body.state
        : mergeEmployeeState(current, body.state, session.employeeId)
    );
    return response({ ok: true });
  }

  return response({ ok: false }, 405);
};
