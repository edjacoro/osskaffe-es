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

export function revisionOf(state) {
  return Math.max(0, Number(state?._meta?.revision || 0));
}

export function revisionEtag(revision) {
  return `W/"oss-state-${revision}"`;
}

export function cleanMutationId(value) {
  const id = String(value || "").trim();
  return /^[a-z0-9_-]{8,120}$/i.test(id) ? id : "";
}

export default async (request) => {
  const session = requireSession(request);
  if (session instanceof Response) return session;

  if (request.method === "GET") {
    const { state } = await readStateEntry();
    if (session.role === "employee" && !isActiveEmployee(state, session.employeeId)) {
      return response({ ok: false, error: "Este empleado fue dado de baja." }, 403);
    }
    const revision = revisionOf(state);
    const etag = revisionEtag(revision);
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, {
        status: 304,
        headers: { "Cache-Control": "no-store", ETag: etag, "X-State-Revision": String(revision) },
      });
    }
    return response({
      ok: true,
      revision,
      state: session.role === "admin"
        ? state
        : session.role === "visitor"
          ? visitorState(state)
          : employeeState(state, session.employeeId),
    }, 200, { ETag: etag, "X-State-Revision": String(revision) });
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
    const mutationId = cleanMutationId(body.mutationId);
    const baseRevision = Math.max(0, Number(body.baseRevision || 0));
    let rebased = false;
    const next = await updateState((current) => {
      const currentRevision = revisionOf(current);
      rebased = baseRevision > 0 && baseRevision < currentRevision;
      const recentMutationIds = Array.isArray(current?._meta?.recentMutationIds)
        ? current._meta.recentMutationIds
        : [];
      if (mutationId && recentMutationIds.includes(mutationId)) return current;
      const merged = session.role === "admin"
        ? mergeAdminState(current, body.state)
        : mergeEmployeeState(current, body.state, session.employeeId);
      return {
        ...merged,
        _meta: {
          ...(current?._meta || {}),
          ...(merged?._meta || {}),
          recentMutationIds: mutationId
            ? [...recentMutationIds.filter((id) => id !== mutationId), mutationId].slice(-40)
            : recentMutationIds.slice(-40),
        },
      };
    });
    const revision = revisionOf(next);
    return response({ ok: true, revision, rebased }, 200, {
      ETag: revisionEtag(revision),
      "X-State-Revision": String(revision),
    });
  }

  return response({ ok: false }, 405);
};
