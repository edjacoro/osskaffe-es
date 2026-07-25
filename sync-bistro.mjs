import {
  hasBistroCredentials,
  normalizeLocationId,
  readBistroStatus,
  requireSession,
  response,
} from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  const locationId = normalizeLocationId(new URL(request.url).searchParams.get("location"));
  const status = await readBistroStatus(locationId);
  return response({
    configured: hasBistroCredentials(locationId),
    locationId,
    connected: !!status.connected,
    lastSyncAt: status.lastSyncAt || null,
    lastError: status.lastError || null,
    syncIntervalSeconds: 30,
  });
};
