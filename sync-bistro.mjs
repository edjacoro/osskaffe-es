import { readBistroStatus, requireSession, response } from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;
  const status = await readBistroStatus();
  return response({
    configured: !!process.env.BISTROSOFT_USERNAME && !!process.env.BISTROSOFT_PASSWORD,
    connected: !!status.connected,
    lastSyncAt: status.lastSyncAt || null,
    lastError: status.lastError || null,
    syncIntervalSeconds: 30,
  });
};
