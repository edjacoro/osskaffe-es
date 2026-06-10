import {
  employeeState,
  mergeEmployeeState,
  readStateEntry,
  requireSession,
  response,
  updateState,
} from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request);
  if (session instanceof Response) return session;

  if (request.method === "GET") {
    const { state } = await readStateEntry();
    return response({
      ok: true,
      state: session.role === "admin" ? state : employeeState(state, session.employeeId),
    });
  }

  if (request.method === "PUT") {
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
