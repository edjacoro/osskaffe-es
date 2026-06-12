import {
  clearCredential,
  readCredential,
  requireSession,
  response,
  writeCredential,
} from "./_shared.mjs";

export default async (request) => {
  const session = requireSession(request, "admin");
  if (session instanceof Response) return session;

  if (request.method === "GET") {
    return response({ ok: true, configured: !!(await readCredential("visit")) });
  }
  if (request.method === "PUT") {
    const body = await request.json();
    const password = String(body.password || "");
    if (!password) await clearCredential("visit");
    else {
      if (password.length < 4) {
        return response({ ok: false, error: "La contrasena debe tener al menos 4 caracteres." }, 400);
      }
      await writeCredential("visit", "", password);
    }
    return response({ ok: true, configured: !!password });
  }
  return response({ ok: false }, 405);
};
