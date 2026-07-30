import {
  normalizeLocationId,
  readStateEntry,
  requireSession,
  response,
} from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const month = url.searchParams.get("month") || "";
  const locationId = normalizeLocationId(url.searchParams.get("location"));
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return response({ ok: false, error: "Mes invalido." }, 400);
  }
  const { state } = await readStateEntry();
  return response({
    ok: true,
    job: state?.bistroDetailJobs?.[locationId]?.[month] || null,
  });
};
